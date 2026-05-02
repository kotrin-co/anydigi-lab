/**
 * IRバンク財務データ クローラー（四半期実行）
 *
 * Yahoo配当利回りランキング（3%以上）の全銘柄について
 * IRバンクから10年分の財務データを取得し、R2 parquet として蓄積する。
 *
 * 書き込み先:
 *   - R2 trade/stock_profiles/dt=YYYY-MM-DD/part-{ts}.parquet
 *   - R2 trade/stock_financials/dt=YYYY-MM-DD/part-{ts}.parquet
 *
 * append-only。読み取り時に ROW_NUMBER() OVER (PARTITION BY ... ORDER BY dt DESC)
 * で最新だけを採用する。
 *
 * Usage:
 *   npx tsx scripts/crawl-irbank.ts [--limit N] [--force] [--min-yield N]
 *
 * Options:
 *   --limit N       先頭N銘柄のみ処理（テスト用）
 *   --force         last_crawled_at に関係なく全銘柄を再取得
 *   --min-yield N   最低利回り（デフォルト: 3.0）
 */

import "./_load-env";
import { r2, SCHEMAS } from "@anydigi-lab/database/r2";
import {
  fetchAllDividendRanking,
  fetchIRBankData,
} from "../apps/web/src/lib/trade/scraper";

// ── CLI引数 ──
const args = process.argv.slice(2);
const force = args.includes("--force");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;
const yieldIdx = args.indexOf("--min-yield");
const minYield = yieldIdx >= 0 ? parseFloat(args[yieldIdx + 1]) : 3.0;

const CRAWL_INTERVAL_DAYS = 90;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ProfileRow = {
  code: string;
  name: string;
  industry: string | null;
  last_crawled_at: string;
  created_at: string;
};

type FinancialRow = {
  code: string;
  fiscal_year: string;
  revenue: number | null;
  operating_profit: number | null;
  eps: number | null;
  operating_margin: number | null;
  equity_ratio: number | null;
  operating_cf: number | null;
  cash_equivalents: number | null;
  dividend_per_share: number | null;
  payout_ratio: number | null;
  updated_at: string;
};

async function loadLatestProfiles(): Promise<Map<string, { lastCrawledAt: string; createdAt: string }>> {
  const glob = r2.pathGlob(SCHEMAS.STOCK_PROFILES.prefix);
  try {
    const rows = await r2.query<{
      code: string;
      last_crawled_at: string;
      created_at: string;
    }>(`
      SELECT code, last_crawled_at, created_at
      FROM (
        SELECT
          code,
          last_crawled_at,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY code ORDER BY dt DESC, last_crawled_at DESC) AS rn
        FROM read_parquet('${glob}', hive_partitioning=true)
      )
      WHERE rn = 1
    `);
    return new Map(
      rows.map((r) => [r.code, { lastCrawledAt: r.last_crawled_at, createdAt: r.created_at }]),
    );
  } catch (e: any) {
    if (typeof e?.message === "string" && /No files found|IO Error/i.test(e.message)) {
      return new Map();
    }
    throw e;
  }
}

async function main() {
  console.log("=== IRバンク クローラー (R2) ===");
  if (force) console.log("[FORCE] 全銘柄を再取得");
  if (limit) console.log(`[LIMIT] 先頭${limit}銘柄のみ`);
  console.log(`最低利回り: ${minYield}%`);
  console.log();

  // ── Phase 1: 対象銘柄コード取得 ──
  console.log("Phase 1: Yahoo配当利回りランキング取得...");
  const yahooStocks = await fetchAllDividendRanking(minYield);
  console.log(`  取得: ${yahooStocks.length}銘柄（REIT除外、${minYield}%以上）`);

  const targetCodes = limit
    ? yahooStocks.map((s) => s.code).slice(0, limit)
    : yahooStocks.map((s) => s.code);
  const yahooMap = new Map(yahooStocks.map((s) => [s.code, s]));

  // ── Phase 2: R2 から既存プロファイルを取得 ──
  console.log("Phase 2: R2 から既存プロファイル確認...");
  const profileMap = await loadLatestProfiles();
  console.log(`  既存: ${profileMap.size}銘柄`);

  // スキップ判定
  const now = new Date();
  const codesToCrawl: string[] = [];
  let skipped = 0;

  for (const code of targetCodes) {
    const existing = profileMap.get(code);
    if (
      !force &&
      existing &&
      now.getTime() - new Date(existing.lastCrawledAt).getTime() <
        CRAWL_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ) {
      skipped++;
      continue;
    }
    codesToCrawl.push(code);
  }

  console.log(
    `  対象: ${codesToCrawl.length}銘柄（スキップ: ${skipped}銘柄）`,
  );
  console.log();

  if (codesToCrawl.length === 0) {
    console.log("クロール対象なし。完了。");
    return;
  }

  // ── Phase 3: IRバンクから取得 + バッファ蓄積 ──
  console.log("Phase 3: IRバンクからデータ取得...");
  const profileRows: ProfileRow[] = [];
  const financialRows: FinancialRow[] = [];
  let newCount = 0;
  let updateCount = 0;
  let failCount = 0;

  for (let i = 0; i < codesToCrawl.length; i++) {
    const code = codesToCrawl[i];
    console.log(`  [${i + 1}/${codesToCrawl.length}] ${code}...`);

    const irData = await fetchIRBankData(code);
    if (!irData || irData.years.length === 0) {
      console.warn(`    → データ取得失敗`);
      failCount++;
      if (i < codesToCrawl.length - 1) await sleep(2000);
      continue;
    }

    const yahoo = yahooMap.get(code);
    const name = yahoo?.name || code;
    const existing = profileMap.get(code);
    const isNew = !existing;

    profileRows.push({
      code,
      name,
      industry: irData.industry,
      last_crawled_at: now.toISOString(),
      created_at: existing?.createdAt ?? now.toISOString(),
    });

    for (const year of irData.years) {
      financialRows.push({
        code,
        fiscal_year: year.fiscalYear,
        revenue: year.revenue,
        operating_profit: null,
        eps: year.eps,
        operating_margin: year.operatingMargin,
        equity_ratio: year.equityRatio,
        operating_cf: year.operatingCf,
        cash_equivalents: year.cashEquivalents,
        dividend_per_share: year.dividendPerShare,
        payout_ratio: year.payoutRatio,
        updated_at: now.toISOString(),
      });
    }

    if (isNew) newCount++;
    else updateCount++;

    console.log(
      `    → ${irData.industry ?? "?"} / ${irData.years.length}年分`,
    );

    if (i < codesToCrawl.length - 1) await sleep(2000);
  }

  // ── Phase 4: R2 に書き込み ──
  console.log();
  console.log("Phase 4: R2 へ書き込み...");
  if (profileRows.length > 0) {
    const r = await r2.appendParquet(SCHEMAS.STOCK_PROFILES.prefix, profileRows);
    console.log(`  profiles: ${r?.rowCount} 行 → ${r?.objectKey}`);
  }
  if (financialRows.length > 0) {
    const r = await r2.appendParquet(SCHEMAS.STOCK_FINANCIALS.prefix, financialRows);
    console.log(`  financials: ${r?.rowCount} 行 → ${r?.objectKey}`);
  }

  console.log();
  console.log(
    `完了! 新規: ${newCount}, 更新: ${updateCount}, 失敗: ${failCount}, スキップ: ${skipped}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
