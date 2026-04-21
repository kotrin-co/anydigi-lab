import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, inArray, asc } from "drizzle-orm";
import { stocks, stockFinancials } from "@anydigi-lab/database/schema/trade";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BATCH_ID = 5;

async function main() {
  // Tier S銘柄を取得
  const tierS = await db.select().from(stocks)
    .where(and(eq(stocks.batchId, BATCH_ID), eq(stocks.tier, "S")));

  const codes = tierS.map(s => s.code);

  // 財務データ取得
  const financials = await db.select().from(stockFinancials)
    .where(inArray(stockFinancials.code, codes))
    .orderBy(asc(stockFinancials.code), asc(stockFinancials.fiscalYear));

  const finMap = new Map<string, number[]>();
  for (const row of financials) {
    const list = finMap.get(row.code) ?? [];
    if (row.revenue != null) list.push(row.revenue);
    finMap.set(row.code, list);
  }

  for (const stock of tierS) {
    const revs = (finMap.get(stock.code) ?? []).slice(-6); // 直近6年分
    const hasDecline = revs.length >= 2 && revs.slice(1).some((r, i) => r < revs[i]);
    const stableDividend = (stock.scoreDividendTrend ?? 0) >= 10;
    const position = !hasDecline && stableDividend ? "core" : "satellite";

    await db.update(stocks).set({ recommendedPosition: position })
      .where(and(eq(stocks.batchId, BATCH_ID), eq(stocks.code, stock.code)));

    console.log(`${stock.code} ${stock.name}: ${position} (減収=${hasDecline}, 配当トレンド=${stock.scoreDividendTrend})`);
  }

  console.log("\nDone!");
  process.exit(0);
}

main();
