import "./_load-env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import { stocks } from "@anydigi-lab/database/schema/trade";
import { r2, SCHEMAS } from "@anydigi-lab/database/r2";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const BATCH_ID = 5;

function escForSql(value: string): string {
  return value.replace(/'/g, "''");
}

async function loadRevenuesByCode(codes: string[]): Promise<Map<string, number[]>> {
  if (codes.length === 0) return new Map();
  const glob = r2.pathGlob(SCHEMAS.STOCK_FINANCIALS.prefix);
  const codeList = codes.map((c) => `'${escForSql(c)}'`).join(",");
  const rows = await r2.query<{ code: string; fiscal_year: string; revenue: number | null }>(`
    SELECT code, fiscal_year, revenue
    FROM (
      SELECT
        code, fiscal_year, revenue,
        ROW_NUMBER() OVER (PARTITION BY code, fiscal_year ORDER BY dt DESC, updated_at DESC) AS rn
      FROM read_parquet('${glob}', hive_partitioning=true)
      WHERE code IN (${codeList})
    )
    WHERE rn = 1
    ORDER BY code, fiscal_year
  `);

  const map = new Map<string, number[]>();
  for (const row of rows) {
    const list = map.get(row.code) ?? [];
    if (row.revenue != null) list.push(row.revenue);
    map.set(row.code, list);
  }
  return map;
}

async function main() {
  // Tier S銘柄を取得
  const tierS = await db.select().from(stocks)
    .where(and(eq(stocks.batchId, BATCH_ID), eq(stocks.tier, "S")));

  const codes = tierS.map((s) => s.code);

  // R2 から財務データ取得（最新の dt × updated_at を採用）
  const finMap = await loadRevenuesByCode(codes);

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
