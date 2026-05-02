import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hpDailySummary } from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  await db.insert(hpDailySummary).values({
    date: "2026-05-01",
    uniqueUsers: 1,
    pageviews: 0,
    dataSource: "events_intraday_20260501",
  }).onConflictDoNothing();
  console.log("✓ hp_daily_summary saved");
}

main().catch(console.error);
