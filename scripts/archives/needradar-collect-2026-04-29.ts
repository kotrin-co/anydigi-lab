import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const newNeeds = [
  {
    title: "複数条件でのホテル検索が非効率",
    summary: "「駅近・予算・駐車場無料・景色いい」など条件を重ねると検索に数時間かかる。AIが条件をくみ取って候補3件に絞るだけで十分、ただし予約の自動化は不要というニーズ。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "新入社員・若手の指導困難",
    summary: "指摘すると全否定されたと不機嫌になり2〜3日休む、改善策を伝えると拗ねて辞めると言い出す。素直な新入社員が希少化しており指導側が疲弊している。複数コメントで繰り返し出現。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "飲食店スタッフの慢性的な人員不足と疲弊",
    summary: "人気飲食店では万年人員不足で休日でもスタッフが呼び出される。「混んでるからスタッフ増やしてほしい」という声が複数出現。食品・飲食業界と直結。",
    vertical: "food",
    sources: ["youtube_comment"],
  },
  {
    title: "アートギャラリーが手数料50%を取り作家が搾取されている",
    summary: "作品が売れてもギャラリーが半分持っていくため、アーティストの手元にほとんど残らない。業界関係者からも「everyday how artists struggle」という証言が複数。代替となる公正な販売チャネルのニーズ。",
    vertical: "creative",
    sources: ["youtube_comment"],
  },
  {
    title: "車のホーンに「ありがとう」「気をつけて」用の優しい音が欲しい",
    summary: "クラクションは危険警告の1種類しかなく感謝や軽い注意を伝える手段がない。22674いいねの日本語コメントと198いいねの車載拡声器コメントで同テーマが出現。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "バストが大きい女性向けファッションが少なすぎる",
    summary: "ファストファッションは小胸向けに設計されており、バストが大きい女性がフィットする服を見つけることが非常に難しい。大学教員でさえ着られるものがないと嘆く声も。高いいいね数コメントが複数出現。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "現代の車がDIY整備できなくなった",
    summary: "電子化によりオイルゲージが廃止され、機械系の故障も自分で手を出せなくなった。「旧型車は修理できたが現代車は買い替えを強制される」という不満が多数。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "スマホが修理困難な設計になっている（Right to Repair）",
    summary: "近年のスマホは意図的に修理できない設計にされており壊れたら買い替えを強制される。昔は自分で修理できたという声が多数。製品の修理可能性への需要。",
    vertical: "general",
    sources: ["youtube_comment"],
  },
  {
    title: "鍋フタが水・細菌を溜め込む危険な設計になっている",
    summary: "調理器具のフタに水が溜まり細菌繁殖・やけどのリスクがある。88035いいねの高共感コメントで「cookware companies WANT you to poison yourself」と皮肉られている。",
    vertical: "food",
    sources: ["youtube_comment"],
  },
  {
    title: "人気飲食チェーンの品切れが多すぎて来店しても無駄足になる",
    summary: "食べたいメニューを候補に入れて来店しても全品切れという事態が頻発。「品切れあって当然みたいなのやめてほしい」という声。食品業界と直結。",
    vertical: "food",
    sources: ["youtube_comment"],
  },
];

async function main() {
  let inserted = 0;
  let updated = 0;

  for (const need of newNeeds) {
    const embedding = await generateEmbedding(`${need.title}\n${need.summary}`);
    const similar = await findSimilarNeeds(db, embedding, 0.80);

    if (similar.length > 0) {
      const existing = similar[0];
      const existingSources: string[] = existing.sources ?? [];
      const mergedSources = Array.from(new Set([...existingSources, ...need.sources]));
      await db.execute(
        sql`UPDATE needradar.needs SET
          evidence_count = evidence_count + 1,
          sources = ${mergedSources},
          updated_at = NOW()
        WHERE id = ${existing.id}`
      );
      console.log(`↑ Updated: "${existing.title}" (id:${existing.id}, similarity:${existing.similarity.toFixed(3)})`);
      updated++;
    } else {
      const [row] = await db.insert(needs).values({
        title: need.title,
        summary: need.summary,
        vertical: need.vertical,
        sources: need.sources,
        embedding,
      }).returning({ id: needs.id });
      console.log(`+ Inserted: "${need.title}" (id:${row.id})`);
      inserted++;
    }
  }

  console.log(`\nDone. inserted=${inserted}, updated=${updated}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
