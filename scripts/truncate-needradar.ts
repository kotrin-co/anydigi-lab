import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`TRUNCATE TABLE needradar.needs RESTART IDENTITY`;
  console.log("Truncated needradar.needs");
}
main().catch((e) => { console.error(e); process.exit(1); });
