import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hpDailySummary, hpPages, hpTraffic, hpDevices, hpRegions } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const DATE = "2026-04-19";

async function main() {
  // 1. サマリー
  await db.insert(hpDailySummary).values({
    date: DATE,
    uniqueUsers: 2,
    pageviews: 14,
    dataSource: "events_intraday_20260419",
  }).onConflictDoNothing();
  console.log("✓ hp_daily_summary");

  // 2. ページ別PV
  await db.delete(hpPages).where(eq(hpPages.date, DATE));
  await db.insert(hpPages).values([
    { date: DATE, pageTitle: "AnyDigi LLC | Any Challenge, Digital Solution.", pageUrl: "https://anydigi.co.jp/", pageviews: 4 },
    { date: DATE, pageTitle: "Any Notes | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog", pageviews: 4 },
    { date: DATE, pageTitle: "AIに「私の資産を見せて」と言うだけでポートフォリオ分析ができる仕組みを作った | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260419_article-mcp-portfolio", pageviews: 2 },
    { date: DATE, pageTitle: "毎朝Slackを開くと、AIが3本のレポートを届けている | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260409_ai-morning-reports", pageviews: 2 },
    { date: DATE, pageTitle: "【2026年版】ものづくり補助金とは？補助額・申請要件・活用方法を中小企業向けに解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_manufacturing-subsidy-2026-guide", pageviews: 1 },
    { date: DATE, pageTitle: "会社概要 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/about", pageviews: 1 },
  ]);
  console.log("✓ hp_pages");

  // 3. 流入元
  await db.delete(hpTraffic).where(eq(hpTraffic.date, DATE));
  await db.insert(hpTraffic).values([
    { date: DATE, source: "(direct)", medium: "(none)", uniqueUsers: 1, pageviews: 13 },
    { date: DATE, source: null, medium: null, uniqueUsers: 1, pageviews: 1 },
  ]);
  console.log("✓ hp_traffic");

  // 4. デバイス
  await db.delete(hpDevices).where(eq(hpDevices.date, DATE));
  await db.insert(hpDevices).values([
    { date: DATE, deviceType: "desktop", uniqueUsers: 2, pageviews: 14 },
  ]);
  console.log("✓ hp_devices");

  // 5. 地域別
  await db.delete(hpRegions).where(eq(hpRegions.date, DATE));
  await db.insert(hpRegions).values([
    { date: DATE, region: "Aichi", uniqueUsers: 1, pageviews: 13 },
    { date: DATE, region: "Shiga", uniqueUsers: 1, pageviews: 1 },
  ]);
  console.log("✓ hp_regions");

  console.log("\nDone!");
}

main().catch(console.error);
