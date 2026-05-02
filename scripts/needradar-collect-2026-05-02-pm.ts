import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// /needs 2回目（夕方）— YouTube コメントからの抽出分。
// snapshot_date=2026-05-02 / region: JP, US, KR / categories: ハウツーとスタイル, 科学と技術, 自動車と乗り物, ペットと動物, ブログ

const newNeeds = [
  {
    title: "マクドナルド等のキャラクターコラボ限定商品の転売対策不足",
    summary:
      "ハッピーセット等のコラボ限定アイテムが転売目的の買い占めで即売り切れ、本来の対象（ファミリー・子供）が買えないという不満。国内チェーン側の販売制限・本人確認導入の遅れ。フリマアプリ側のコラボ品横断モニタリングや、店頭の購入数制限自動チェックSaaSに需要。",
    vertical: "general",
    sources: ["youtube_comment"],
    regions: ["JP"],
  },
  {
    title: "商業立退き要求に対する個人住民の交渉力不足と嫌がらせ対抗手段の不在",
    summary:
      "立ち退き義務がないにもかかわらず、拒否すると生活妨害（騒音・建設工事・交渉打ち切り等）を受ける構造への怒り。地上げ・再開発に対する個人住民向けの法務支援、嫌がらせ証跡記録アプリ、地域コミュニティで連帯するマッチングに余地。",
    vertical: "general",
    sources: ["youtube_comment"],
    regions: ["JP"],
  },
];

const evidenceAdditions: {
  id: number;
  addSources: string[];
  addRegions: string[];
  note: string;
}[] = [
  {
    id: 5,
    addSources: ["youtube_comment"],
    addRegions: ["JP"],
    note: "ekjf01T5c0c 26153 likes 「優しいクラクションみたいなの欲しいよね。」",
  },
  {
    id: 2,
    addSources: ["youtube_comment"],
    addRegions: ["JP"],
    note: "r2kgba1gtsY 13789 likes 新入社員にやさしく注意したらトイレに5時間こもった事例",
  },
  {
    id: 77,
    addSources: ["youtube_comment"],
    addRegions: ["JP"],
    note: "MY8lXccxZ8o 38647+19803 likes M・A・C 等パウダー化粧品の底面硬化・ブラシ未洗浄問題",
  },
  {
    id: 11,
    addSources: ["youtube_comment"],
    addRegions: ["JP"],
    note: "t7LfWym9v0w 10191 likes 「ペットを飼うなら種の生態をしっかり勉強することも責任」",
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  for (const need of newNeeds) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.8);

    if (similar.length > 0) {
      const existing = similar[0];
      const existingSources: string[] = existing.sources ?? [];
      const existingRegions: string[] = (existing as any).regions ?? [];
      const mergedSources = Array.from(new Set([...existingSources, ...need.sources]));
      const mergedRegions = Array.from(
        new Set([...existingRegions, ...(need.regions ?? [])])
      );
      const srcArr = sql`ARRAY[${sql.join(mergedSources.map((v) => sql`${v}`), sql`,`)}]::text[]`;
      const regArr = sql`ARRAY[${sql.join(mergedRegions.map((v) => sql`${v}`), sql`,`)}]::text[]`;
      await db.execute(
        sql`UPDATE needradar.needs SET
          evidence_count = evidence_count + 1,
          sources = ${srcArr},
          regions = ${regArr},
          updated_at = NOW()
        WHERE id = ${existing.id}`
      );
      console.log(
        `↑ Updated (similar): "${existing.title}" (id:${existing.id}, similarity:${existing.similarity.toFixed(3)})`
      );
      updated++;
    } else {
      const [row] = await db
        .insert(needs)
        .values({
          title: need.title,
          summary: need.summary,
          vertical: need.vertical,
          sources: need.sources,
          regions: need.regions ?? [],
          embedding,
        })
        .returning({ id: needs.id });
      console.log(`+ Inserted: "${need.title}" (id:${row.id})`);
      inserted++;
    }
  }

  for (const add of evidenceAdditions) {
    const rows = await db.execute<{
      id: number;
      title: string;
      sources: string[];
      regions: string[];
    }>(
      sql`SELECT id, title, sources, regions FROM needradar.needs WHERE id = ${add.id}`
    );
    const cur = rows.rows[0];
    if (!cur) {
      console.warn(`! id=${add.id} not found, skip`);
      continue;
    }
    const mergedSources = Array.from(
      new Set([...(cur.sources ?? []), ...add.addSources])
    );
    const mergedRegions = Array.from(
      new Set([...(cur.regions ?? []), ...add.addRegions])
    );
    const srcArr = sql`ARRAY[${sql.join(mergedSources.map((v) => sql`${v}`), sql`,`)}]::text[]`;
    const regArr = sql`ARRAY[${sql.join(mergedRegions.map((v) => sql`${v}`), sql`,`)}]::text[]`;
    await db.execute(
      sql`UPDATE needradar.needs SET
        evidence_count = evidence_count + 1,
        sources = ${srcArr},
        regions = ${regArr},
        updated_at = NOW()
      WHERE id = ${add.id}`
    );
    console.log(`↑ Evidence+: "${cur.title}" (id:${add.id}) — ${add.note}`);
    updated++;
  }

  console.log(`\nDone. inserted=${inserted}, updated=${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
