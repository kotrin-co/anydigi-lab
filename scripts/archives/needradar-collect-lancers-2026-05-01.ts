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
  sources: string[];
};

type EvidenceAdd = {
  id: number;
  sources: string[];
};

const REGION = "JP";

const NEW_NEEDS: NewNeed[] = [
  {
    title: "中小食品メーカー・地方産品ECの構築・運用代行需要が業界全体で厚みを形成",
    summary:
      "Shopify構築、商品画像・コラム・LP制作、リスティング/SNS広告運用、配送・決済機能追加など、食品ECの構築〜運用までを一気通貫で外注する案件が「食品EC」キーワード上位を埋めている。中小食品メーカー側にEC専任人員がいないことが背景。",
    vertical: "food",
    sources: ["lancers/食品EC", "lancers/食品"],
  },
  {
    title: "補助金申請・活用の営業／啓蒙ツール作成の慢性需要",
    summary:
      "デジタル・AI導入補助金、省エネ補助金、2025年新補助金などを中小企業に売り込むためのチラシ・営業用パワポ・講座資料の発注が常時発生。中小企業側に補助金内容を理解させる説明コストが高い。",
    vertical: "business",
    sources: ["lancers/補助金"],
  },
];

const EVIDENCE_ADDS: EvidenceAdd[] = [
  { id: 23, sources: ["lancers/HACCP", "lancers/食品工場"] },
  { id: 24, sources: ["lancers/HACCP"] },
  { id: 25, sources: ["lancers/トレーサビリティ"] },
  { id: 26, sources: ["lancers/トレーサビリティ"] },
  { id: 27, sources: ["lancers/HACCP", "lancers/食品工場"] },
  { id: 28, sources: ["lancers/HACCP"] },
  { id: 29, sources: ["lancers/食品", "lancers/HACCP"] },
  { id: 30, sources: ["lancers/飲食店"] },
  { id: 31, sources: ["lancers/生産管理"] },
  { id: 32, sources: ["lancers/生産管理"] },
  { id: 33, sources: ["lancers/生産管理"] },
  { id: 34, sources: ["lancers/生産管理"] },
  { id: 35, sources: ["lancers/生産管理"] },
  { id: 36, sources: ["lancers/生産管理", "lancers/受発注"] },
  { id: 38, sources: ["lancers/補助金", "lancers/食品EC"] },
  { id: 39, sources: ["lancers/製造業", "lancers/補助金"] },
  { id: 40, sources: ["lancers/補助金"] },
  { id: 41, sources: ["lancers/補助金"] },
  { id: 45, sources: ["lancers/生産管理"] },
  { id: 50, sources: ["lancers/食品EC"] },
  { id: 51, sources: ["lancers/食品EC"] },
];

function mergeUnique(arr: string[] | null | undefined, values: string[]): string[] {
  const set = new Set(arr ?? []);
  for (const v of values) set.add(v);
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
      const newSources = mergeUnique(row.sources, need.sources);
      const newRegions = mergeUnique(row.regions, [REGION]);
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
          sources: need.sources,
          regions: [REGION],
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
    const newSources = mergeUnique(row.sources, add.sources);
    const newRegions = mergeUnique(row.regions, [REGION]);
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
