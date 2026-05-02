/**
 * 最新バッチの Tier S/A 銘柄に対して、Yahoo Finance から PER/PBR/ROE を取得し
 * stocks に補完する。あわせて valuation/composite スコアを再計算して更新する。
 *
 * Usage:
 *   npx tsx scripts/enrich-tier-sa-valuation.ts [--batch-id N] [--tiers S,A]
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, desc, inArray } from "drizzle-orm";
import { screeningBatches, stocks } from "@anydigi-lab/database/schema/trade";
import { fetchYahooStockDetail } from "../apps/web/src/lib/trade/scraper";
import { calcAllScores } from "../apps/web/src/lib/trade/scoring";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const args = process.argv.slice(2);
const batchIdIdx = args.indexOf("--batch-id");
const batchIdArg =
  batchIdIdx >= 0 ? parseInt(args[batchIdIdx + 1]) : null;
const tiersIdx = args.indexOf("--tiers");
const tiers = (
  tiersIdx >= 0 ? args[tiersIdx + 1] : "S,A"
).split(",") as string[];

const SLEEP_MS = 1500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // バッチ特定
  let batchId: number;
  if (batchIdArg) {
    batchId = batchIdArg;
  } else {
    const [batch] = await db
      .select({ id: screeningBatches.id })
      .from(screeningBatches)
      .where(eq(screeningBatches.genre, "jp-high-dividend"))
      .orderBy(desc(screeningBatches.createdAt))
      .limit(1);
    if (!batch) {
      console.error("No batches found");
      process.exit(1);
    }
    batchId = batch.id;
  }
  console.log(`=== Enrich PER/PBR/ROE for batch #${batchId} (tiers: ${tiers.join(",")}) ===`);

  // 対象銘柄を取得
  const targets = await db
    .select()
    .from(stocks)
    .where(and(eq(stocks.batchId, batchId), inArray(stocks.tier, tiers)))
    .orderBy(desc(stocks.financialScoreRaw));

  console.log(`対象: ${targets.length}銘柄`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const stock = targets[i];
    process.stdout.write(`  [${i + 1}/${targets.length}] ${stock.code} ${stock.name}... `);

    const detail = await fetchYahooStockDetail(stock.code);
    if (!detail || (detail.per === null && detail.pbr === null && detail.roe === null)) {
      console.log("FAIL");
      failed++;
      if (i < targets.length - 1) await sleep(SLEEP_MS);
      continue;
    }

    // valuation/composite スコア再計算
    const scores = calcAllScores({
      financialScoreRaw: stock.financialScoreRaw,
      totalScore: stock.totalScore,
      roe: detail.roe,
      pbr: detail.pbr,
      industry: stock.industry,
      themeAdjustment: stock.themeAdjustment ?? undefined,
    });

    await db
      .update(stocks)
      .set({
        per: detail.per,
        pbr: detail.pbr,
        roe: detail.roe,
        financialScore: scores.financial,
        valuationScore: scores.valuation,
        industryScore100: scores.industry,
        compositeScore: scores.composite,
      })
      .where(eq(stocks.id, stock.id));

    console.log(
      `PER=${detail.per ?? "—"} PBR=${detail.pbr ?? "—"} ROE=${detail.roe ?? "—"} → val=${scores.valuation ?? "—"} comp=${scores.composite}`
    );
    success++;

    if (i < targets.length - 1) await sleep(SLEEP_MS);
  }

  console.log(`\n完了! 成功: ${success}, 失敗: ${failed}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
