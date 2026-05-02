import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { needs } from "@anydigi-lab/database/schema/needradar";
import { generateEmbedding, findSimilarNeeds } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

// /needs 2回目（夕方）実行分。snapshot_date=2026-05-02。
// 前回（朝）でカバーしきれなかった新規・新証拠のみを追加する。

const newNeeds = [
  {
    title: "日本企業のサービス残業・労働文化が外国人若手の定着を阻害",
    summary:
      "日本国籍だが米国育ちで20歳に帰国した若手社員が、9-6想定の外資系オフィスでも不払い残業・タイムカード操作・アプリ未説明での1万円ペナルティ等を経験。海外オプションが「日本に住みたい層」を取りこぼしている。海外大学卒×日本就職向けの労働環境マッチング・問題会社レビューサービスに需要。",
    vertical: "general",
    sources: [
      "https://reddit.com/r/japanlife/comments/1swz06u/are_we_all_just_expected_to_accept_being_treated/",
    ],
    regions: ["JP"],
  },
  {
    title: "「ホワイトハラスメント」忌避で日本企業の管理職が部下教育を放棄",
    summary:
      "「厳しい指導もハラスメント」風潮で管理職が指示・批判・チャレンジ的アサインを回避、部下の成長機会が奪われる新概念「ホワイトハラスメント」がX等で議論。1on1記録AI＋上司向けフィードバック作法トレーニング、または若手側からの「教えてもらえないハラスメント」可視化サービスに余地。",
    vertical: "general",
    sources: [
      "https://reddit.com/r/japan/comments/1sqgj4m/white_harassment_in_japan_is_being_a_nice_boss/",
    ],
    regions: ["JP"],
  },
  {
    title: "業界特化AIワークフロー受託＋月額保守の小規模ビジネスモデルが成立",
    summary:
      "オランダの個人開発者が法律事務所向けに€2,700でAIシステム構築 + €1,300/月の保守契約を獲得、複数の同種事務所に横展開。ソロビルダーが「業界 × AI受託 × 月額保守」で個人事業を立ち上げる成功パターン。中川の「1人＋AI、稟議ゼロ」設計と相性が良い参考事例。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/Entrepreneur/comments/1syubll/i_made_2700_building_an_ai_system_for_a_law_firm/",
    ],
    regions: ["EU"],
  },
  {
    title: "AI進化スピードが速すぎて創業者が「何を作るべきか」決められない麻痺状態",
    summary:
      "毎週新モデル・新機能が出る環境で、開発に着手しても完成時には陳腐化しているのではという恐怖でプロジェクトが進まない創業者の声。「速く小さく出す」を強制する Build-in-Public 系コミュニティや、機能を抽象化してモデル切替に強い設計を教えるコンサル枠に需要。",
    vertical: "startup",
    sources: [
      "https://reddit.com/r/startups/comments/1szm92p/anyone_else_feel_paralyzed_by_ai_moving_so_fast/",
    ],
    regions: ["US"],
  },
  {
    title: "地方個人店の地元認知不足とローカル流入施策の欠如",
    summary:
      "オーナーが「同じ町の人ですら自分の店を知らない」と訴えるパターンが小規模リアル店舗の慢性課題。Google Map整備、ローカルSEO、Yelp/Reddit/コミュニティイベント連携のオペレーションが回っていない。中小店舗向けに月額固定でローカルプレゼンス管理を代行するパッケージに需要。",
    vertical: "business",
    sources: [
      "https://reddit.com/r/smallbusiness/comments/1szw9q1/i_run_a_comic_shop_in_a_town_that_has_no_idea_i/",
    ],
    regions: ["US"],
  },
];

const evidenceAdditions: {
  id: number;
  addSources: string[];
  addRegions: string[];
  note: string;
}[] = [
  {
    id: 22,
    addSources: [
      "https://reddit.com/r/japanlife/comments/1swv6v3/might_have_to_leave/",
    ],
    addRegions: ["JP"],
    note: 'r/japanlife 288pt "Might have to leave" — 19歳学生が母のビザ更新厳格化で帰国不可避に',
  },
  {
    id: 20,
    addSources: [
      "https://reddit.com/r/artificial/comments/1t0qlvx/anthropic_just_analyzed_1_million_claude/",
    ],
    addRegions: ["US"],
    note: 'r/artificial 194pt "Anthropic analyzed 1M conversations: 6% asking life advice (quit jobs, who to date, move countries)"',
  },
  {
    id: 63,
    addSources: [
      "https://reddit.com/r/artificial/comments/1t0cy0n/mark_zuckerberg_says_ai_costs_contributed_to/",
      "https://reddit.com/r/LocalLLaMA/comments/1t0mki5/what_in_tarnation_is_going_on_with_the_cost_of/",
    ],
    addRegions: ["US"],
    note: 'r/artificial 182pt "Zuckerberg AI cost layoffs 8000" + r/LocalLLaMA 163pt "What in tarnation cost of compute"',
  },
  {
    id: 61,
    addSources: [
      "https://reddit.com/r/Restauranteur/comments/cr0f4u/how_does_an_at_the_table_ordering_appsystem_help/",
      "https://reddit.com/r/Restauranteur/comments/fe9gog/why_large_casual_dining_restaurants_are_ditching/",
    ],
    addRegions: ["US"],
    note: 'r/Restauranteur "table ordering app help" + "Why dining brands ditching kiosk for mobile table ordering"',
  },
  {
    id: 55,
    addSources: [
      "https://reddit.com/r/FoodBusiness/comments/ixbqef/selling_food_online/",
    ],
    addRegions: ["US"],
    note: 'r/FoodBusiness 10pt "Selling Food Online" — dry-mixで全国販売時のFDA nutrition label costが論点',
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
