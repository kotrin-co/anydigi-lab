import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { articles, ideas, ideaEvidence, ideaScores } from "@anydigi-lab/database/schema/insights";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding test data...");

  // 1. テスト記事を挿入
  const [article1] = await db
    .insert(articles)
    .values({
      id: "test-article-001",
      url: "https://example.com/ai-agent-trend",
      title: "AIエージェントが企業の業務プロセスを変革する",
      sourceName: "TechCrunch Japan",
      sourceCategory: "technology",
      publishedAt: new Date("2026-04-12T09:00:00Z"),
    })
    .returning();

  const [article2] = await db
    .insert(articles)
    .values({
      id: "test-article-002",
      url: "https://example.com/semantic-layer-growth",
      title: "セマンティックレイヤー市場が急成長、2027年までに10億ドル規模へ",
      sourceName: "日経クロステック",
      sourceCategory: "business",
      publishedAt: new Date("2026-04-13T06:00:00Z"),
    })
    .returning();

  console.log("✓ Articles inserted:", article1.id, article2.id);

  // 2. テストアイデアを挿入
  const [idea1] = await db
    .insert(ideas)
    .values({
      title: "中小企業向けAIエージェント導入支援サービス",
      summary:
        "AIエージェントの導入障壁が高い中小企業に対し、業務プロセス分析からエージェント構築・運用までをワンストップで提供するコンサルサービス。",
      status: "active",
    })
    .returning();

  const [idea2] = await db
    .insert(ideas)
    .values({
      title: "セマンティックレイヤーのマネージドサービス",
      summary:
        "Cube Coreベースのセマンティックレイヤーをマネージドサービスとして提供。データチームがビジネス指標定義を一元管理し、AIやBIツールから統一的にクエリできる基盤。",
      status: "active",
    })
    .returning();

  console.log("✓ Ideas inserted:", idea1.id, idea2.id);

  // 3. エビデンス紐付け
  await db.insert(ideaEvidence).values([
    {
      ideaId: idea1.id,
      articleId: article1.id,
      relevanceNote: "AIエージェントの企業導入トレンドが加速しており、支援需要の裏付けとなる",
    },
    {
      ideaId: idea2.id,
      articleId: article2.id,
      relevanceNote: "セマンティックレイヤー市場の成長予測が、マネージドサービス需要を示唆",
    },
  ]);

  console.log("✓ Evidence linked");

  // 4. スコア付与
  await db.insert(ideaScores).values([
    {
      ideaId: idea1.id,
      market: 8,
      fit: 7,
      timing: 9,
      evidence: 6,
    },
    {
      ideaId: idea2.id,
      market: 7,
      fit: 9,
      timing: 8,
      evidence: 7,
    },
  ]);

  console.log("✓ Scores added");
  console.log("\nDone! Test data seeded successfully.");
}

seed().catch(console.error);
