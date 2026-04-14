import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hpRegions } from "../src/lib/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const rows = [
  { date: "2026-04-08", region: "Osaka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Tokyo", pageviews: 10, uniqueUsers: 8 },
  { date: "2026-04-09", region: "Aomori", pageviews: 3, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Saitama", pageviews: 2, uniqueUsers: 2 },
  { date: "2026-04-09", region: "Toyama", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Fukuoka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Nagano", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Osaka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Aichi", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-09", region: "Okinawa", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Tokyo", pageviews: 20, uniqueUsers: 4 },
  { date: "2026-04-10", region: "Kyoto", pageviews: 3, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Fukuoka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Aichi", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Shizuoka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Mie", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Fukushima", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Gunma", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Kanagawa", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Nagano", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-10", region: "Osaka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Aichi", pageviews: 8, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Shizuoka", pageviews: 2, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Osaka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Nara", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Fukushima", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Chiba", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Nagano", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-11", region: "Kyoto", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-12", region: "District of Columbia", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-13", region: "Aichi", pageviews: 13, uniqueUsers: 2 },
  { date: "2026-04-13", region: "Hokkaido", pageviews: 6, uniqueUsers: 2 },
  { date: "2026-04-13", region: "Tokyo", pageviews: 4, uniqueUsers: 2 },
  { date: "2026-04-13", region: "Miyazaki", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-13", region: "Fukuoka", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-13", region: "Tottori", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-13", region: "Ehime", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-13", region: "Chiba", pageviews: 1, uniqueUsers: 1 },
  { date: "2026-04-14", region: "Tokyo", pageviews: 1, uniqueUsers: 1 },
];

async function main() {
  console.log("Inserting hp_regions data...");
  const result = await db.insert(hpRegions).values(rows).returning();
  console.log(`✓ ${result.length} rows inserted`);
}

main().catch(console.error);
