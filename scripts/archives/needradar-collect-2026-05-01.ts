import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql, eq } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

type NewNeed = {
  title: string;
  summary: string;
  vertical: string;
  source: string;
  region: string;
};

type EvidenceAdd = {
  id: number;
  source: string;
  region: string;
};

const NEW_NEEDS: NewNeed[] = [
  // id=54 は前回run時に登録済み（自転車のルール改正・違反取り締まりへの不満）
];

const EVIDENCE_ADDS: EvidenceAdd[] = [
  { id: 5, source: "youtube_comment", region: "JP" },
  { id: 2, source: "youtube_comment", region: "JP" },
];

function mergeUnique(arr: string[] | null | undefined, value: string): string[] {
  const set = new Set(arr ?? []);
  set.add(value);
  return Array.from(set);
}

async function main() {
  let newCount = 0;
  let mergedToExisting = 0;
  let evidenceAdded = 0;

  for (const need of NEW_NEEDS) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.8);

    if (similar.length > 0) {
      const top = similar[0];
      const current = await db
        .select({ sources: needs.sources, regions: needs.regions })
        .from(needs)
        .where(eq(needs.id, top.id));
      const row = current[0];
      const newSources = mergeUnique(row.sources, need.source);
      const newRegions = mergeUnique(row.regions, need.region);
      await db
        .update(needs)
        .set({
          evidenceCount: sql`${needs.evidenceCount} + 1`,
          sources: newSources,
          regions: newRegions,
          updatedAt: new Date(),
        })
        .where(eq(needs.id, top.id));
      console.log(`[merge] -> existing id=${top.id} sim=${top.similarity.toFixed(3)} title="${top.title}"`);
      mergedToExisting += 1;
    } else {
      const inserted = await db
        .insert(needs)
        .values({
          title: need.title,
          summary: need.summary,
          vertical: need.vertical,
          embedding,
          sources: [need.source],
          regions: [need.region],
          evidenceCount: 1,
          status: "active",
        })
        .returning({ id: needs.id });
      console.log(`[new] id=${inserted[0].id} title="${need.title}"`);
      newCount += 1;
    }
  }

  for (const add of EVIDENCE_ADDS) {
    const current = await db
      .select({ sources: needs.sources, regions: needs.regions })
      .from(needs)
      .where(eq(needs.id, add.id));
    if (current.length === 0) {
      console.warn(`[skip] id=${add.id} not found`);
      continue;
    }
    const row = current[0];
    const newSources = mergeUnique(row.sources, add.source);
    const newRegions = mergeUnique(row.regions, add.region);
    await db
      .update(needs)
      .set({
        evidenceCount: sql`${needs.evidenceCount} + 1`,
        sources: newSources,
        regions: newRegions,
        updatedAt: new Date(),
      })
      .where(eq(needs.id, add.id));
    console.log(`[evidence] id=${add.id}`);
    evidenceAdded += 1;
  }

  console.log(`\nDone. new=${newCount}, mergedToExisting=${mergedToExisting}, evidenceAdded=${evidenceAdded}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
