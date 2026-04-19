/**
 * trade.stocks の3軸スコアを再計算してDBを更新する
 *
 * Usage:
 *   npx tsx scripts/recalc-trade-scores.ts [batch_id]
 *
 * batch_id を省略すると最新バッチを対象にする
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { stocks, screeningBatches } from "../src/lib/schema/trade";
import { calcAllScores } from "../src/lib/trade/scoring";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const batchIdArg = process.argv[2] ? parseInt(process.argv[2]) : null;

  // バッチ特定
  let batchId: number;
  if (batchIdArg) {
    batchId = batchIdArg;
  } else {
    const [latest] = await db
      .select({ id: screeningBatches.id })
      .from(screeningBatches)
      .orderBy(screeningBatches.id)
      .limit(1);
    if (!latest) {
      console.error("No batches found");
      process.exit(1);
    }
    batchId = latest.id;
  }

  console.log(`Recalculating scores for batch #${batchId}...`);

  const allStocks = await db
    .select()
    .from(stocks)
    .where(eq(stocks.batchId, batchId));

  console.log(`Found ${allStocks.length} stocks`);

  let updated = 0;
  for (const stock of allStocks) {
    // totalScore は旧85点満点ベースのスコア（industryScore 15点を引く）
    const financialBase =
      stock.totalScore !== null && stock.industryScore !== null
        ? stock.totalScore - stock.industryScore
        : stock.totalScore;

    const scores = calcAllScores({
      totalScore: financialBase,
      roe: stock.roe,
      pbr: stock.pbr,
      industry: stock.industry,
      themeAdjustment: stock.themeAdjustment ?? undefined,
    });

    await db
      .update(stocks)
      .set({
        financialScore: scores.financial,
        valuationScore: scores.valuation,
        industryScore100: scores.industry,
        compositeScore: scores.composite,
      })
      .where(eq(stocks.id, stock.id));

    updated++;
    if (updated % 100 === 0) {
      console.log(`  Updated ${updated}/${allStocks.length}`);
    }
  }

  console.log(`  Updated ${updated}/${allStocks.length}`);
  console.log("Done!");

  // サンプル出力
  const samples = await db
    .select({
      code: stocks.code,
      name: stocks.name,
      financial: stocks.financialScore,
      valuation: stocks.valuationScore,
      industry: stocks.industryScore100,
      composite: stocks.compositeScore,
    })
    .from(stocks)
    .where(eq(stocks.batchId, batchId))
    .orderBy(stocks.compositeScore)
    .limit(10);

  console.log("\nTop 10 by composite score:");
  console.table(samples.reverse());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
