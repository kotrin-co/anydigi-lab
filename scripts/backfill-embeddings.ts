import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { ideas } from "../src/lib/schema/insights";
import { generateEmbedding } from "../src/lib/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  const allIdeas = await db
    .select({ id: ideas.id, title: ideas.title, summary: ideas.summary })
    .from(ideas)
    .where(eq(ideas.status, "active"));

  console.log(`Found ${allIdeas.length} ideas to backfill\n`);

  for (const idea of allIdeas) {
    const text = `${idea.title}\n${idea.summary}`;
    const embedding = await generateEmbedding(text);
    await db
      .update(ideas)
      .set({ embedding })
      .where(eq(ideas.id, idea.id));
    console.log(`✓ [${idea.id}] ${idea.title}`);
  }

  console.log("\nDone! All embeddings backfilled.");
}

main().catch(console.error);
