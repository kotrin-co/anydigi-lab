import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// Source: YouTube comments snapshot_date=2026-05-01
// 5カテゴリ × 3地域 (JP/US/KR) × 上位1000件 = 13,635件取得・分析

const newNeeds = [
  {
    title: "パウダー化粧品が皮脂・油分で硬化して使えなくなる",
    summary:
      "チーク・パウダーファンデが皮脂・スキンケア・メイク製品の油分でカチコチに硬化し、指で擦っても色が出なくなる。元美容部員によるセロハンテープでの剥離解決法に4,158いいね。隠れた化粧品廃棄／使い切り問題で、一般女性が経験する見えないペインポイント。",
    vertical: "general",
    sources: ["youtube_comment"],
    regions: ["JP"],
  },
  {
    title: "物理会員カードのスマホ／ウェアラブル統合需要",
    summary:
      "Costco等の物理メンバーシップカードを Apple Watch でスキャン入店したい、という複数会員カード統合への要望が散見される。ロイヤルティカード・診察券等が日本でも財布肥大化の典型的ペイン。Wallet 各社未対応事業者への対応支援余地。",
    vertical: "business",
    sources: ["youtube_comment"],
    regions: ["US"],
  },
  {
    title: "髪のボリューム不足／薄毛が編み込みアレンジを成立させない",
    summary:
      "ヘアアレンジ動画で『編み方より毛量を増やす方法を教えてほしい』という反応に1,058いいね。技法ではなく毛量・ボリューム獲得そのものへの広いニーズが、男女問わず存在する典型例。",
    vertical: "general",
    sources: ["youtube_comment"],
    regions: ["JP"],
  },
  {
    title: "フードデリバリー手数料が商品代を大幅に超え消費者の利用控えが進む",
    summary:
      "米国で『$15 Snacks, $80 Delivery』に7,779いいね。手数料・チップ・サービス料の積み上がりが商品本体を大幅に超え、消費者側の利用控えと不満が顕在化。既存id:62（小規模飲食店側の収益圧迫）と表裏一体の消費者視点証拠。",
    vertical: "food",
    sources: ["youtube_comment"],
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
    id: 5,
    addSources: ["youtube_comment"],
    addRegions: ["JP"],
    note: 'YouTube JP|ハウツー 26,045pt "優しいクラクションみたいなの欲しいよね" + 2,162pt "超短いクラクションで教えてくれる人優しいしありがたい"',
  },
  {
    id: 6,
    addSources: ["youtube_comment"],
    addRegions: ["US"],
    note: 'YouTube US|ハウツー 24,853pt "Fast fashion is literally made for small chests..." + 6,526pt "As someone with large chest it\'s really hard to find fashion..."',
  },
  {
    id: 8,
    addSources: ["youtube_comment"],
    addRegions: ["US"],
    note: 'YouTube US|科学と技術 598pt "I wanted to open it to fix it, but I can\'t find the right tool... been looking for that darn tool for over 4 years"',
  },
  {
    id: 3,
    addSources: ["youtube_comment"],
    addRegions: ["US"],
    note: 'YouTube US|ハウツー 4,144pt "I\'m a line cook I wish I had sheet cake. I\'m lucky if I get a handfull 3 hour old French fries"',
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
      const existingRows = await db.execute<{
        id: number;
        sources: string[];
        regions: string[];
      }>(sql`SELECT id, sources, regions FROM needradar.needs WHERE id = ${existing.id}`);
      const cur = existingRows.rows[0];
      const mergedSources = Array.from(
        new Set([...(cur?.sources ?? []), ...need.sources])
      );
      const mergedRegions = Array.from(
        new Set([...(cur?.regions ?? []), ...(need.regions ?? [])])
      );
      const srcArr = sql`ARRAY[${sql.join(
        mergedSources.map((v) => sql`${v}`),
        sql`,`
      )}]::text[]`;
      const regArr = sql`ARRAY[${sql.join(
        mergedRegions.map((v) => sql`${v}`),
        sql`,`
      )}]::text[]`;
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
    const mergedSources = Array.from(
      new Set([...(cur.sources ?? []), ...add.addSources])
    );
    const mergedRegions = Array.from(
      new Set([...(cur.regions ?? []), ...add.addRegions])
    );
    const srcArr = sql`ARRAY[${sql.join(
      mergedSources.map((v) => sql`${v}`),
      sql`,`
    )}]::text[]`;
    const regArr = sql`ARRAY[${sql.join(
      mergedRegions.map((v) => sql`${v}`),
      sql`,`
    )}]::text[]`;
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
