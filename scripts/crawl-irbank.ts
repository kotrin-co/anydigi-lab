/**
 * IRバンク財務データ クローラー（四半期実行）
 *
 * Yahoo配当利回りランキング（3%以上）の全銘柄について
 * IRバンクから10年分の財務データを取得し、マスターテーブルに蓄積する。
 *
 * Usage:
 *   npx tsx scripts/crawl-irbank.ts [--limit N] [--force] [--min-yield N]
 *
 * Options:
 *   --limit N       先頭N銘柄のみ処理（テスト用）
 *   --force         last_crawled_at に関係なく全銘柄を再取得
 *   --min-yield N   最低利回り（デフォルト: 3.0）
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray } from "drizzle-orm";
import { stockProfiles, stockFinancials } from "../src/lib/schema/trade";
import {
  fetchAllDividendRanking,
  fetchIRBankData,
} from "../src/lib/trade/scraper";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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

async function main() {
  console.log("=== IRバンク クローラー ===");
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

  // ── Phase 2: 既存プロファイルを確認 ──
  console.log("Phase 2: 既存データ確認...");
  const existingProfiles = targetCodes.length > 0
    ? await db
        .select({ code: stockProfiles.code, lastCrawledAt: stockProfiles.lastCrawledAt })
        .from(stockProfiles)
        .where(inArray(stockProfiles.code, targetCodes))
    : [];

  const profileMap = new Map(
    existingProfiles.map((p) => [p.code, p.lastCrawledAt])
  );

  // スキップ判定
  const now = new Date();
  const codesToCrawl: string[] = [];
  let skipped = 0;

  for (const code of targetCodes) {
    const lastCrawled = profileMap.get(code);
    if (
      !force &&
      lastCrawled &&
      now.getTime() - new Date(lastCrawled).getTime() <
        CRAWL_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ) {
      skipped++;
      continue;
    }
    codesToCrawl.push(code);
  }

  console.log(
    `  対象: ${codesToCrawl.length}銘柄（スキップ: ${skipped}銘柄）`
  );
  console.log();

  if (codesToCrawl.length === 0) {
    console.log("クロール対象なし。完了。");
    return;
  }

  // ── Phase 3: IRバンクから取得 + 蓄積 ──
  console.log("Phase 3: IRバンクからデータ取得 + Neon蓄積...");
  let newCount = 0;
  let updateCount = 0;
  let failCount = 0;

  for (let i = 0; i < codesToCrawl.length; i++) {
    const code = codesToCrawl[i];
    console.log(
      `  [${i + 1}/${codesToCrawl.length}] ${code}...`
    );

    const irData = await fetchIRBankData(code);
    if (!irData || irData.years.length === 0) {
      console.warn(`    → データ取得失敗`);
      failCount++;
      if (i < codesToCrawl.length - 1) await sleep(2000);
      continue;
    }

    // Yahoo名 or IRバンク名
    const yahoo = yahooMap.get(code);
    const name = yahoo?.name || code;

    // UPSERT stock_profiles
    const isNew = !profileMap.has(code);
    await db
      .insert(stockProfiles)
      .values({
        code,
        name,
        industry: irData.industry,
        lastCrawledAt: now,
      })
      .onConflictDoUpdate({
        target: stockProfiles.code,
        set: {
          name,
          industry: irData.industry,
          lastCrawledAt: now,
        },
      });

    // UPSERT stock_financials（年度ごと）
    for (const year of irData.years) {
      await db
        .insert(stockFinancials)
        .values({
          code,
          fiscalYear: year.fiscalYear,
          revenue: year.revenue,
          operatingProfit: null,
          eps: year.eps,
          operatingMargin: year.operatingMargin,
          equityRatio: year.equityRatio,
          operatingCf: year.operatingCf,
          cashEquivalents: year.cashEquivalents,
          dividendPerShare: year.dividendPerShare,
          payoutRatio: year.payoutRatio,
        })
        .onConflictDoUpdate({
          target: [stockFinancials.code, stockFinancials.fiscalYear],
          set: {
            revenue: year.revenue,
            eps: year.eps,
            operatingMargin: year.operatingMargin,
            equityRatio: year.equityRatio,
            operatingCf: year.operatingCf,
            cashEquivalents: year.cashEquivalents,
            dividendPerShare: year.dividendPerShare,
            payoutRatio: year.payoutRatio,
            updatedAt: now,
          },
        });
    }

    if (isNew) newCount++;
    else updateCount++;

    console.log(
      `    → ${irData.industry ?? "?"} / ${irData.years.length}年分`
    );

    if (i < codesToCrawl.length - 1) await sleep(2000);
  }

  console.log();
  console.log(
    `完了! 新規: ${newCount}, 更新: ${updateCount}, 失敗: ${failCount}, スキップ: ${skipped}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
