import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hpDailySummary, hpPages, hpTraffic, hpDevices, hpRegions } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const DATE = "2026-04-30";
const SOURCE = "events_intraday_20260430";

async function main() {
  await db.insert(hpDailySummary).values({
    date: DATE,
    uniqueUsers: 6,
    pageviews: 7,
    dataSource: SOURCE,
  }).onConflictDoNothing();

  await db.delete(hpPages).where(eq(hpPages.date, DATE));
  await db.insert(hpPages).values([
    { date: DATE, pageTitle: "【2026年版】ものづくり補助金とは？補助額・申請要件・活用方法を中小企業向けに解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_manufacturing-subsidy-2026-guide", pageviews: 4 },
    { date: DATE, pageTitle: "【2026年版】ものづくり補助金とは？補助額・申請要件・活用方法を中小企業向けに解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_manufacturing-subsidy-2026-guide?utm_source=copilot.com", pageviews: 1 },
    { date: DATE, pageTitle: "【2026年版】小規模事業者持続化補助金とは？対象者・補助額・申請手順をわかりやすく解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_small-business-subsidy-2026-guide", pageviews: 1 },
    { date: DATE, pageTitle: "404: This page could not be found.", pageUrl: "https://anydigi.co.jp/blog/MjAyNjA0MD", pageviews: 1 },
  ]);

  await db.delete(hpTraffic).where(eq(hpTraffic.date, DATE));
  await db.insert(hpTraffic).values([
    { date: DATE, source: null, medium: null, uniqueUsers: 4, pageviews: 4 },
    { date: DATE, source: "(direct)", medium: "(none)", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, source: "bing", medium: "organic", uniqueUsers: 1, pageviews: 1 },
  ]);

  await db.delete(hpDevices).where(eq(hpDevices.date, DATE));
  await db.insert(hpDevices).values([
    { date: DATE, deviceType: "desktop", uniqueUsers: 6, pageviews: 7 },
  ]);

  await db.delete(hpRegions).where(eq(hpRegions.date, DATE));
  await db.insert(hpRegions).values([
    { date: DATE, region: "Tokyo", uniqueUsers: 2, pageviews: 2 },
    { date: DATE, region: "Jakarta", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, region: "Osaka", uniqueUsers: 1, pageviews: 1 },
    { date: DATE, region: "Kagoshima", uniqueUsers: 1, pageviews: 1 },
    { date: DATE, region: "Kanagawa", uniqueUsers: 1, pageviews: 1 },
  ]);

  console.log("Done");
}
main().catch((e) => { console.error(e); process.exit(1); });
