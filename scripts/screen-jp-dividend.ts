/**
 * 日本株高配当スクリーニング（都度実行）
 *
 * Yahoo配当利回りランキング + R2 蓄積済み財務データ → スコアリング → Neon stocks 格納
 * 財務データはcrawl-irbank.tsで R2 に蓄積されている前提。
 *
 * Usage:
 *   npx tsx scripts/screen-jp-dividend.ts [--dry-run] [--limit N] [--min-yield N]
 */

import "./_load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  screeningBatches,
  stocks,
} from "@anydigi-lab/database/schema/trade";
import { r2, SCHEMAS } from "@anydigi-lab/database/r2";
import { fetchAllDividendRanking } from "../apps/web/src/lib/trade/scraper";
import { calcFinancialScores } from "../apps/web/src/lib/trade/financial-scoring";
import type { YearlyData } from "../apps/web/src/lib/trade/financial-scoring";
import {
  calcValuationScore,
  calcIndustryScore,
  calcCompositeScore,
} from "../apps/web/src/lib/trade/scoring";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ── CLI引数 ──
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;
const yieldIdx = args.indexOf("--min-yield");
const minYield = yieldIdx >= 0 ? parseFloat(args[yieldIdx + 1]) : 3.0;

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

function escForSql(value: string): string {
  return value.replace(/'/g, "''");
}

async function loadProfiles(codes: string[]): Promise<Map<string, ProfileRow>> {
  if (codes.length === 0) return new Map();
  const glob = r2.pathGlob(SCHEMAS.STOCK_PROFILES.prefix);
  const codeList = codes.map((c) => `'${escForSql(c)}'`).join(",");
  try {
    const rows = await r2.query<ProfileRow>(`
      SELECT code, name, industry, last_crawled_at, created_at
      FROM (
        SELECT
          code, name, industry, last_crawled_at, created_at,
          ROW_NUMBER() OVER (PARTITION BY code ORDER BY dt DESC, last_crawled_at DESC) AS rn
        FROM read_parquet('${glob}', hive_partitioning=true)
        WHERE code IN (${codeList})
      )
      WHERE rn = 1
    `);
    return new Map(rows.map((r) => [r.code, r]));
  } catch (e: any) {
    if (typeof e?.message === "string" && /No files found|IO Error/i.test(e.message)) {
      return new Map();
    }
    throw e;
  }
}

async function loadFinancials(codes: string[]): Promise<Map<string, YearlyData[]>> {
  if (codes.length === 0) return new Map();
  const glob = r2.pathGlob(SCHEMAS.STOCK_FINANCIALS.prefix);
  const codeList = codes.map((c) => `'${escForSql(c)}'`).join(",");
  try {
    const rows = await r2.query<FinancialRow>(`
      SELECT
        code, fiscal_year, revenue, operating_profit, eps,
        operating_margin, equity_ratio, operating_cf,
        cash_equivalents, dividend_per_share, payout_ratio, updated_at
      FROM (
        SELECT
          code, fiscal_year, revenue, operating_profit, eps,
          operating_margin, equity_ratio, operating_cf,
          cash_equivalents, dividend_per_share, payout_ratio, updated_at,
          ROW_NUMBER() OVER (PARTITION BY code, fiscal_year ORDER BY dt DESC, updated_at DESC) AS rn
        FROM read_parquet('${glob}', hive_partitioning=true)
        WHERE code IN (${codeList})
      )
      WHERE rn = 1
      ORDER BY code, fiscal_year
    `);

    const map = new Map<string, YearlyData[]>();
    for (const row of rows) {
      const list = map.get(row.code) ?? [];
      list.push({
        fiscalYear: row.fiscal_year,
        revenue: row.revenue,
        eps: row.eps,
        operatingMargin: row.operating_margin,
        equityRatio: row.equity_ratio,
        operatingCf: row.operating_cf,
        cashEquivalents: row.cash_equivalents,
        dividendPerShare: row.dividend_per_share,
        payoutRatio: row.payout_ratio,
      });
      map.set(row.code, list);
    }
    return map;
  } catch (e: any) {
    if (typeof e?.message === "string" && /No files found|IO Error/i.test(e.message)) {
      return new Map();
    }
    throw e;
  }
}

async function main() {
  console.log("=== JP高配当株スクリーニング (R2) ===");
  if (dryRun) console.log("[DRY RUN] DB書き込みなし");
  if (limit) console.log(`[LIMIT] 先頭${limit}銘柄のみ`);
  console.log(`最低利回り: ${minYield}%`);
  console.log();

  // ── Phase 1: Yahoo配当利回りランキング取得 ──
  console.log("Phase 1: Yahoo配当利回りランキング取得...");
  const yahooStocks = await fetchAllDividendRanking(minYield);
  console.log(`  取得: ${yahooStocks.length}銘柄（REIT除外、${minYield}%以上）`);

  const targetStocks = limit ? yahooStocks.slice(0, limit) : yahooStocks;
  const codes = targetStocks.map((s) => s.code);
  console.log(`  対象: ${targetStocks.length}銘柄`);
  console.log();

  // ── Phase 2: R2 から財務データ取得（ROW_NUMBER で最新だけ採用）──
  console.log("Phase 2: R2 から財務データ取得 (DuckDB)...");
  const [profileMap, financialMap] = await Promise.all([
    loadProfiles(codes),
    loadFinancials(codes),
  ]);

  const withData = targetStocks.filter((s) => financialMap.has(s.code)).length;
  const withoutData = targetStocks.length - withData;
  console.log(
    `  プロファイル: ${profileMap.size}銘柄, 財務データあり: ${withData}銘柄, なし: ${withoutData}銘柄`,
  );
  console.log();

  // ── Phase 3: スコアリング ──
  console.log("Phase 3: スコアリング...");
  const today = new Date().toISOString().slice(0, 10);

  type StockRow = typeof stocks.$inferInsert;
  const stockRows: StockRow[] = [];

  let qualified = 0;
  let disqualifiedCount = 0;

  for (let i = 0; i < targetStocks.length; i++) {
    const yahoo = targetStocks[i];
    const profile = profileMap.get(yahoo.code);
    const yearlyData = financialMap.get(yahoo.code);
    const industry = profile?.industry ?? null;

    if (!yearlyData || yearlyData.length === 0) {
      stockRows.push({
        batchId: 0,
        code: yahoo.code,
        name: yahoo.name,
        industry,
        segment: "corporate",
        rank: i + 1,
        price: yahoo.price,
        yieldPct: yahoo.yieldPct,
      });
      continue;
    }

    const fin = calcFinancialScores(yearlyData, industry);
    const valuation = calcValuationScore(null, null);
    const industryResult = calcIndustryScore(industry);
    const composite = calcCompositeScore({
      financial: fin.total,
      valuation: valuation?.score ?? null,
      industry: industryResult.score,
    });

    if (fin.disqualified) disqualifiedCount++;
    else qualified++;

    stockRows.push({
      batchId: 0,
      code: yahoo.code,
      name: yahoo.name,
      industry,
      price: yahoo.price,
      yieldPct: yahoo.yieldPct,
      segment: "corporate",
      rank: i + 1,
      scoreRevenueTrend: fin.revenueTrend.score,
      scoreEpsTrend: fin.epsTrend.score,
      scoreOperatingMargin: fin.operatingMargin.score,
      scoreEquityRatio: fin.equityRatio.score,
      scoreOperatingCf: fin.operatingCf.score,
      scoreCashTrend: fin.cashTrend.score,
      scoreDividendTrend: fin.dividendTrend.score,
      scorePayoutRatio: fin.payoutRatio.score,
      financialScoreRaw: fin.total,
      financialScore: fin.total,
      valuationScore: valuation?.score ?? null,
      industryScore100: industryResult.score,
      compositeScore: composite,
      tier: fin.disqualified
        ? null
        : fin.total >= 90
          ? "S"
          : fin.total >= 80
            ? "A"
            : fin.total >= 50
              ? "B"
              : "C",
      recommendedPosition: (() => {
        if (fin.disqualified || fin.total < 90) return null;
        const revs = yearlyData
          .slice(-6)
          .map((d) => d.revenue)
          .filter((r): r is number => r != null);
        const hasRevenueDecline =
          revs.length >= 2 && revs.slice(1).some((r, i) => r < revs[i]);
        const stableDividend = fin.dividendTrend.score >= 10;
        return !hasRevenueDecline && stableDividend ? "core" : "satellite";
      })(),
      disqualified: fin.disqualified,
      disqualifiedReason: fin.disqualifiedReason,
      lossYears: fin.lossYears,
      dividendHistoryYears: fin.dividendHistoryYears,
      specialDividendSuspected: fin.specialDividendSuspected,
      industryCategory: industryResult.category,
    });
  }

  console.log(`  適格: ${qualified}銘柄, 失格: ${disqualifiedCount}銘柄`);
  console.log();

  const scored = stockRows.filter((s) => s.financialScoreRaw != null);
  scored.sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0));
  console.log("Top 15 by composite score:");
  console.table(
    scored.slice(0, 15).map((s) => ({
      code: s.code,
      name: s.name?.slice(0, 14),
      yield: s.yieldPct,
      fin: s.financialScoreRaw,
      val: s.valuationScore ?? "—",
      ind: s.industryScore100,
      comp: s.compositeScore,
      tier: s.tier ?? "—",
      dq: s.disqualified ? "×" : "",
    })),
  );

  if (dryRun) {
    console.log(`\n[DRY RUN] 完了。DB書き込みはスキップ。`);
    return;
  }

  // ── Phase 4: Neon (stocks) 格納 ──
  console.log("Phase 4: Neonに格納...");

  const [batch] = await db
    .insert(screeningBatches)
    .values({
      genre: "jp-high-dividend",
      generatedAt: today,
      source: "yahoo-finance-jp+r2-master",
      note: `Yahoo配当利回り${minYield}%以上 ${targetStocks.length}銘柄`,
      totalCount: targetStocks.length,
      maxScore: 100,
    })
    .returning({ id: screeningBatches.id });

  console.log(`  バッチ #${batch.id} 作成`);

  for (const row of stockRows) row.batchId = batch.id;

  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < stockRows.length; i += CHUNK) {
    const chunk = stockRows.slice(i, i + CHUNK);
    await db.insert(stocks).values(chunk);
    inserted += chunk.length;
    console.log(`  stocks: ${inserted}/${stockRows.length}`);
  }

  console.log(`\n完了! バッチ #${batch.id}, ${stockRows.length}銘柄`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
