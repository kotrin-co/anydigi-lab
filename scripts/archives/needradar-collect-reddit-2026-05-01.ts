import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: Reddit posts snapshot_date=2026-04-30
// 未分析だったsubredditを中心に追加抽出（Restauranteur/FoodBusiness/MachineLearning/japan）
// + 既存ニーズ id 12/19/21/22 への証拠追加

const newNeeds = [
  {
    title: "小規模食品事業者の栄養表示ラベル作成コスト負担",
    summary: "米国の小規模食品メーカー（家族経営の調味料・ドライミックス製造等）にとって、製品ごとのFDA準拠栄養表示ラベル作成が大きなコスト負担。第三者ラボ分析・適切な印刷会社選定で困っており、立ち上げ時の隠れた障壁になっている。r/FoodBusinessで10pt/13コメント、新規参入者からの典型的相談。",
    vertical: "food",
    sources: ["reddit/FoodBusiness"],
    regions: ["US"],
  },
  {
    title: "不登校児童の父親向け自助支援が不足",
    summary: "日本で不登校児童が増加する中、父親同士が居酒屋に集まって愚痴と情報交換する「自助グループ」が広がっている。母親向けの支援は比較的整備されているが、父親が孤立しており公的・専門的サポートが薄い。r/japanで296pt/33コメント、朝日新聞記事の共有で高関心。",
    vertical: "general",
    sources: ["reddit/japan"],
    regions: ["JP"],
  },
  {
    title: "独立ML研究者の研究センス・問題設定スキル形成困難",
    summary: "共同研究者を持たない独立ML研究者が、毎日100〜200本投稿される論文の取捨選択や良い問題設定の判断（research taste）を孤独に磨くのに苦労している。ELegantパイプラインを作ったが10行プロンプトで足りた、という典型例の蓄積。メンタリング・peer reviewの代替への需要。r/MachineLearning 90pt/26コメント。",
    vertical: "general",
    sources: ["reddit/MachineLearning"],
    regions: ["US"],
  },
];

// 既存ニーズへの証拠追加（id 直接指定）
const evidenceAdditions: {
  id: number;
  addSources: string[];
  addRegions: string[];
  note: string;
}[] = [
  {
    id: 12,
    addSources: ["reddit/sales"],
    addRegions: ["US"],
    note: 'r/sales 325pt/353c "Outreach is dead"（メール・LinkedIn・コール全滅）',
  },
  {
    id: 19,
    addSources: ["reddit/LocalLLaMA"],
    addRegions: ["US"],
    note: 'r/LocalLLaMA 927pt/755c "I\'m done with using local LLMs for coding"',
  },
  {
    id: 21,
    addSources: ["reddit/japanlife"],
    addRegions: ["JP"],
    note: 'r/japanlife 291pt/310c "How are you guys affording trips back home lately?"',
  },
  {
    id: 22,
    addSources: ["reddit/japanlife"],
    addRegions: ["JP"],
    note: 'r/japanlife 291pt/195c "People are going to get caught off guard by these language requirements"',
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  // 1) 新規候補: similarity 0.80 で既存と照合
  for (const need of newNeeds) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.8);

    if (similar.length > 0) {
      const existing = similar[0];
      const existingSources: string[] = existing.sources ?? [];
      const existingRegions: string[] = (existing as any).regions ?? [];
      const mergedSources = Array.from(new Set([...existingSources, ...need.sources]));
      const mergedRegions = Array.from(new Set([...existingRegions, ...(need.regions ?? [])]));
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

  // 2) 証拠追加（id 直接）
  for (const add of evidenceAdditions) {
    const rows = await db.execute<{
      id: number;
      title: string;
      sources: string[];
      regions: string[];
    }>(sql`SELECT id, title, sources, regions FROM needradar.needs WHERE id = ${add.id}`);
    const cur = rows.rows[0];
    if (!cur) {
      console.warn(`! id=${add.id} not found, skip`);
      continue;
    }
    const mergedSources = Array.from(new Set([...(cur.sources ?? []), ...add.addSources]));
    const mergedRegions = Array.from(new Set([...(cur.regions ?? []), ...add.addRegions]));
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
