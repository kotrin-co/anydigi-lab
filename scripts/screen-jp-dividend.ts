/**
 * 日本株高配当スクリーニング（都度実行）
 *
 * Yahoo配当利回りランキング + Neon蓄積済み財務データ → スコアリング → 結果格納
 * 財務データはcrawl-irbank.tsで事前に蓄積されている前提。
 *
 * Usage:
 *   npx tsx scripts/screen-jp-dividend.ts [--dry-run] [--limit N] [--min-yield N]
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, inArray, asc } from "drizzle-orm";
import {
  screeningBatches,
  stocks,
  stockProfiles,
  stockFinancials,
} from "@anydigi-lab/database/schema/trade";
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

async function main() {
  console.log("=== JP高配当株スクリーニング ===");
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

  // ── Phase 2: Neonから財務データ一括取得 ──
  console.log("Phase 2: Neonから財務データ取得...");

  // プロファイル取得
  const profiles = codes.length > 0
    ? await db
        .select()
        .from(stockProfiles)
        .where(inArray(stockProfiles.code, codes))
    : [];
  const profileMap = new Map(profiles.map((p) => [p.code, p]));

  // 年次財務データ取得
  const financials = codes.length > 0
    ? await db
        .select()
        .from(stockFinancials)
        .where(inArray(stockFinancials.code, codes))
        .orderBy(asc(stockFinancials.code), asc(stockFinancials.fiscalYear))
    : [];

  // code → YearlyData[] にグルーピング
  const financialMap = new Map<string, YearlyData[]>();
  for (const row of financials) {
    const list = financialMap.get(row.code) ?? [];
    list.push({
      fiscalYear: row.fiscalYear,
      revenue: row.revenue,
      eps: row.eps,
      operatingMargin: row.operatingMargin,
      equityRatio: row.equityRatio,
      operatingCf: row.operatingCf,
      cashEquivalents: row.cashEquivalents,
      dividendPerShare: row.dividendPerShare,
      payoutRatio: row.payoutRatio,
    });
    financialMap.set(row.code, list);
  }

  const withData = targetStocks.filter((s) => financialMap.has(s.code)).length;
  const withoutData = targetStocks.length - withData;
  console.log(
    `  財務データあり: ${withData}銘柄, なし: ${withoutData}銘柄`
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

    // 財務データなし → スコアなしで登録
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

    // 8項目財務スコア
    const fin = calcFinancialScores(yearlyData, industry);

    // 割安スコア（ROE + PBR）
    // 現状PBRはIRバンクから直接取れないのでnull
    const valuation = calcValuationScore(null, null);

    // 業種スコア
    const industryResult = calcIndustryScore(industry);

    // 総合スコア
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
      // 8項目スコア内訳
      scoreRevenueTrend: fin.revenueTrend.score,
      scoreEpsTrend: fin.epsTrend.score,
      scoreOperatingMargin: fin.operatingMargin.score,
      scoreEquityRatio: fin.equityRatio.score,
      scoreOperatingCf: fin.operatingCf.score,
      scoreCashTrend: fin.cashTrend.score,
      scoreDividendTrend: fin.dividendTrend.score,
      scorePayoutRatio: fin.payoutRatio.score,
      financialScoreRaw: fin.total,
      // 3軸スコア
      financialScore: fin.total,
      valuationScore: valuation?.score ?? null,
      industryScore100: industryResult.score,
      compositeScore: composite,
      // Tier自動分類（財務スコアのみで判定、失格はnull）
      tier: fin.disqualified
        ? null
        : fin.total >= 90
          ? "S"
          : fin.total >= 80
            ? "A"
            : fin.total >= 50
              ? "B"
              : "C",
      // Core/Satellite自動分類（Tier S のみ）
      // Core: 直近5期で減収なし + 配当トレンドスコア10以上
      // Satellite: Tier S だが上記を満たさない
      recommendedPosition: (() => {
        if (fin.disqualified || fin.total < 90) return null;
        const revs = yearlyData
          .slice(-6) // 直近6年分（5期分の前年比較に必要）
          .map((d) => d.revenue)
          .filter((r): r is number => r != null);
        const hasRevenueDecline =
          revs.length >= 2 &&
          revs.slice(1).some((r, i) => r < revs[i]);
        const stableDividend = fin.dividendTrend.score >= 10;
        return !hasRevenueDecline && stableDividend ? "core" : "satellite";
      })(),
      // 失格情報
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

  // サマリー出力
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
    }))
  );

  if (dryRun) {
    console.log(`\n[DRY RUN] 完了。DB書き込みはスキップ。`);
    return;
  }

  // ── Phase 4: Neon格納 ──
  console.log("Phase 4: Neonに格納...");

  const [batch] = await db
    .insert(screeningBatches)
    .values({
      genre: "jp-high-dividend",
      generatedAt: today,
      source: "yahoo-finance-jp+irbank-master",
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

  console.log(
    `\n完了! バッチ #${batch.id}, ${stockRows.length}銘柄`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
