import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { articles } from "../src/lib/schema/insights";
import { sql } from "drizzle-orm";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// BQから取得した記事データ
const bqArticles = [
  {
    id: "ebe82643ac57755cc061ef6868c263a769aeae1806db2b892634f90fac997676",
    url: "https://importai.substack.com/p/import-ai-453-breaking-ai-agents",
    title: "Import AI 453: Breaking AI agents; MirrorCode; and ten views on gradual disempowerment",
    sourceName: "import_ai",
    sourceCategory: "ai",
    publishedAt: new Date("2026-04-13T10:02:22.000Z"),
  },
  {
    id: "51d9905e81572b37e6ce55ee75266486b61f784981ae77235fb771dd6654bdf6",
    url: "https://www.technologyreview.com/2026/04/13/1135156/job-titles-wildlife-first-responder-wesley-sarmento/",
    title: "Job titles of the future: Wildlife first responder",
    sourceName: "mit_tech_review",
    sourceCategory: "ai",
    publishedAt: new Date("2026-04-13T10:00:00.000Z"),
  },
  {
    id: "c74d910e4d876736972a402846217a52e0ac24fee6ff256ae78088ffe4d13bd5",
    url: "https://www.technologyreview.com/2026/04/13/1135162/uri-maoz-does-free-will-exist/",
    title: "You have no choice in reading this article—maybe",
    sourceName: "mit_tech_review",
    sourceCategory: "ai",
    publishedAt: new Date("2026-04-13T10:00:00.000Z"),
  },
  {
    id: "4c653e124ea1acd88b6958313a731ca2a3e2d7e23c1b2dca39f1f37dc8bf019e",
    url: "https://www.itmedia.co.jp/aiplus/articles/2604/13/news122.html",
    title: "奈良県、\"AIアニメ\"で観光PR　約1カ月で完成、気を付けたポイントは",
    sourceName: "itmedia_ai",
    sourceCategory: "ai",
    publishedAt: new Date("2026-04-13T09:52:00.000Z"),
  },
  {
    id: "3bd16c88106605c5476bbeeeba1010571678d4da221c0dc42d8863788c429035",
    url: "https://www.theverge.com/ai-artificial-intelligence/910890/openai-sam-altman-second-home-attack-shooting",
    title: "Sam Altman reportedly targeted in second attack",
    sourceName: "the_verge_ai",
    sourceCategory: "ai",
    publishedAt: new Date("2026-04-13T09:25:57.000Z"),
  },
];

async function main() {
  console.log("Inserting BQ articles into Neon...");

  const result = await db
    .insert(articles)
    .values(bqArticles)
    .onConflictDoNothing()
    .returning();

  console.log(`✓ ${result.length} articles inserted`);

  // 確認
  const rows = await db.execute(sql`SELECT id, title FROM insights.articles ORDER BY published_at DESC`);
  console.log("\nAll articles in Neon:");
  for (const row of rows.rows) {
    console.log(`  - ${row.title}`);
  }
}

main().catch(console.error);
