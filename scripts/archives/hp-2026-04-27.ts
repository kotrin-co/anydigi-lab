import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { hpDailySummary, hpPages, hpTraffic, hpDevices, hpRegions } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const DATE = "2026-04-27";
const SOURCE = "events_intraday_20260427";

async function main() {
  await db.insert(hpDailySummary).values({
    date: DATE,
    uniqueUsers: 9,
    pageviews: 13,
    dataSource: SOURCE,
  }).onConflictDoNothing();

  await db.delete(hpPages).where(eq(hpPages.date, DATE));
  await db.insert(hpPages).values([
    { date: DATE, pageTitle: "【2026年版】ものづくり補助金とは？補助額・申請要件・活用方法を中小企業向けに解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_manufacturing-subsidy-2026-guide", pageviews: 8 },
    { date: DATE, pageTitle: "【2026年版】デジタル化・AI導入補助金（旧IT導入補助金）とは？中小企業が使える制度をわかりやすく解説 | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260402_it-subsidy-2026-guide", pageviews: 2 },
    { date: DATE, pageTitle: "中小企業のDXは何から始めるべきか？「ツール導入」の前にやるべきたった1つのこと | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/blog/20260407_sme-dx-where-to-start", pageviews: 1 },
    { date: DATE, pageTitle: "AnyDigi LLC | Any Challenge, Digital Solution.", pageUrl: "https://anydigi.co.jp/", pageviews: 1 },
    { date: DATE, pageTitle: "お問い合わせ | エニデジ合同会社", pageUrl: "https://anydigi.co.jp/contact", pageviews: 1 },
  ]);

  await db.delete(hpTraffic).where(eq(hpTraffic.date, DATE));
  await db.insert(hpTraffic).values([
    { date: DATE, source: null, medium: null, uniqueUsers: 9, pageviews: 13 },
  ]);

  await db.delete(hpDevices).where(eq(hpDevices.date, DATE));
  await db.insert(hpDevices).values([
    { date: DATE, deviceType: "desktop", uniqueUsers: 9, pageviews: 13 },
  ]);

  await db.delete(hpRegions).where(eq(hpRegions.date, DATE));
  await db.insert(hpRegions).values([
    { date: DATE, region: "Tokyo", uniqueUsers: 3, pageviews: 3 },
    { date: DATE, region: "Nagasaki", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, region: "Fukushima", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, region: "Osaka", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, region: "Hokkaido", uniqueUsers: 1, pageviews: 2 },
    { date: DATE, region: "Ibaraki", uniqueUsers: 1, pageviews: 1 },
    { date: DATE, region: "Okayama", uniqueUsers: 1, pageviews: 1 },
  ]);

  console.log("Done");
}
main().catch((e) => { console.error(e); process.exit(1); });
