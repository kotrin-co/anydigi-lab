import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hpDailySummary, hpPages, hpTraffic, hpDevices, hpRegions } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const DATE = "2026-04-26";
const SOURCE = "events_intraday_20260426";

async function main() {
  await db.insert(hpDailySummary).values({
    date: DATE,
    uniqueUsers: 2,
    pageviews: 2,
    dataSource: SOURCE,
  }).onConflictDoNothing();

  await db.delete(hpPages).where(eq(hpPages.date, DATE));
  await db.insert(hpPages).values([
    { date: DATE, pageTitle: "AIに「私の資産を見せて」と言うだけでポートフォリオ分析ができる仕組みを作った | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260419_article-mcp-portfolio", pageviews: 1 },
    { date: DATE, pageTitle: "【2026年版】ものづくり補助金とは？補助額・申請要件・活用方法を中小企業向けに解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_manufacturing-subsidy-2026-guide", pageviews: 1 },
  ]);

  await db.delete(hpTraffic).where(eq(hpTraffic.date, DATE));
  await db.insert(hpTraffic).values([
    { date: DATE, source: null, medium: null, uniqueUsers: 2, pageviews: 2 },
  ]);

  await db.delete(hpDevices).where(eq(hpDevices.date, DATE));
  await db.insert(hpDevices).values([
    { date: DATE, deviceType: "mobile", uniqueUsers: 1, pageviews: 1 },
    { date: DATE, deviceType: "desktop", uniqueUsers: 1, pageviews: 1 },
  ]);

  await db.delete(hpRegions).where(eq(hpRegions.date, DATE));
  await db.insert(hpRegions).values([
    { date: DATE, region: "Kanagawa", uniqueUsers: 1, pageviews: 1 },
    { date: DATE, region: "Tokyo", uniqueUsers: 1, pageviews: 1 },
  ]);

  console.log("Done");
}
main().catch((e) => { console.error(e); process.exit(1); });
