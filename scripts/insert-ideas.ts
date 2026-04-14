import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ideas, ideaEvidence, ideaScores } from "../src/lib/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("Inserting ideas from 2026-04-13 article analysis...\n");

  // === AnyDigi アイデア ===

  // アイデア1: AIエージェント耐障害性テスト
  const [idea1] = await db
    .insert(ideas)
    .values({
      title: "AIエージェント耐障害性テストサービス",
      summary:
        "企業が導入するAIエージェントの脆弱性・異常系（ハルシネーション、無限ループ、権限逸脱等）を体系的にテストし、本番投入前の品質保証を提供するサービス。データ×AI基盤エンジニアリングの知見が直接活きる。",
      category: "anydigi",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 1 [anydigi]: ${idea1.title} (id: ${idea1.id})`);

  // アイデア2: 中小企業向けAI導入・内製化支援
  const [idea2] = await db
    .insert(ideas)
    .values({
      title: "中小企業向けAI導入・内製化支援（ノーコーダー育成）",
      summary:
        "グッドパッチの事例（コーディング経験ゼロの86%がデプロイ達成）を参考に、中小企業の非エンジニア社員がClaude Code等のAIツールで業務アプリを自作できるよう支援するサービス。元電力会社・中小企業理解のバックグラウンドが活きる。",
      category: "anydigi",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 2 [anydigi]: ${idea2.title} (id: ${idea2.id})`);

  // アイデア3: AI審査モデル構築支援
  const [idea3] = await db
    .insert(ideas)
    .values({
      title: "AI審査モデル構築支援（金融・与信領域）",
      summary:
        "PKSHAとクレディセゾンの「最短30秒ローン審査」のように、データ×AI基盤を活用した審査モデルの構築・運用支援。中小の金融機関や与信判断が必要な事業者向けに、AI参謀としてモデル設計からデータパイプラインまでを提供。",
      category: "anydigi",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 3 [anydigi]: ${idea3.title} (id: ${idea3.id})`);

  // === General アイデア ===

  // アイデア4: 自治体向け生成AIコンテンツ制作支援
  const [idea4] = await db
    .insert(ideas)
    .values({
      title: "自治体向け生成AIコンテンツ制作支援",
      summary:
        "奈良県のAIアニメ事例のように、自治体が生成AIで観光PR・広報コンテンツを制作する際の企画〜公開までのワンストップ支援サービス。自治体のAI人材不足と予算制約の隙間を狙う。",
      category: "general",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 4 [general]: ${idea4.title} (id: ${idea4.id})`);

  // アイデア5: 宇宙エッジコンピューティング活用サービス
  const [idea5] = await db
    .insert(ideas)
    .values({
      title: "宇宙エッジコンピューティング活用サービス",
      summary:
        "軌道上コンピュートクラスターの商用化により、低遅延が不要だがデータ主権や分散処理が重要なワークロード（バッチAI推論、衛星データ分析等）を宇宙で実行するサービスが成立しうる。",
      category: "general",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 5 [general]: ${idea5.title} (id: ${idea5.id})`);

  // アイデア6: AIアニメ・コンテンツ制作プラットフォーム
  const [idea6] = await db
    .insert(ideas)
    .values({
      title: "AIアニメ・コンテンツ制作プラットフォーム",
      summary:
        "日本コロムビアGのAIアニメコンテスト（賞金1000万円）のように、生成AIによるアニメ制作が商業レベルに達しつつある。クリエイターと企業をマッチングするプラットフォームや制作ツール。",
      category: "general",
      status: "active",
    })
    .returning();
  console.log(`✓ Idea 6 [general]: ${idea6.title} (id: ${idea6.id})`);

  // === エビデンス紐付け ===
  console.log("\nLinking evidence...");

  await db.insert(ideaEvidence).values([
    {
      ideaId: idea1.id,
      articleId: "ebe82643ac57755cc061ef6868c263a769aeae1806db2b892634f90fac997676",
      relevanceNote:
        "Import AI 453でAIエージェントのbreaking（破壊テスト）が特集されており、エージェントの信頼性・安全性テストの需要が顕在化している",
    },
    {
      ideaId: idea2.id,
      articleId: "c29a624b48d12003dcf424456ea717fec1db41e157aeb95ef818969dd4f0065a",
      relevanceNote:
        "グッドパッチがClaude Codeを全社員に義務づけ、コーディング経験ゼロの86%がデプロイ達成。非エンジニアのAI活用が実証された強力な事例",
    },
    {
      ideaId: idea3.id,
      articleId: "18ad2c423036fb12601486849e3b8c0db201c7782d42b6b0a1f7251a42a74cc4",
      relevanceNote:
        "PKSHAとクレディセゾンが最短30秒のAI審査モデルを開発。金融×AIの具体的な事業化事例",
    },
    {
      ideaId: idea4.id,
      articleId: "4c653e124ea1acd88b6958313a731ca2a3e2d7e23c1b2dca39f1f37dc8bf019e",
      relevanceNote:
        "奈良県が生成AIアニメで観光PRを実施。約1カ月で完成という速度感は、技術支援があれば他の自治体でも再現可能であることを示唆",
    },
    {
      ideaId: idea5.id,
      articleId: "6642241cbe18bf93b6ebfd2202ac221a2516362429971a62ed8982c42dd2e3c7",
      relevanceNote:
        "最大規模の軌道上コンピュートクラスターが商用開始。宇宙コンピューティングの実用化フェーズに入った",
    },
    {
      ideaId: idea6.id,
      articleId: "b1064688f5fe3d7982cfa37f30c4ce71c4f9f520c716765e74f1c301b9e738cb",
      relevanceNote:
        "日本コロムビアGがAIアニメコンテストを賞金1000万円で開催。エンタメ業界がAIアニメを商業コンテンツとして認め始めている",
    },
  ]);
  console.log("✓ Evidence linked");

  // === スコア付与 ===
  console.log("Scoring ideas...");

  await db.insert(ideaScores).values([
    {
      ideaId: idea1.id,
      market: 7,
      fit: 8,
      timing: 9,
      evidence: 5,
    },
    {
      ideaId: idea2.id,
      market: 8,
      fit: 7,
      timing: 9,
      evidence: 7,
    },
    {
      ideaId: idea3.id,
      market: 7,
      fit: 7,
      timing: 7,
      evidence: 5,
    },
    {
      ideaId: idea4.id,
      market: 6,
      fit: 5,
      timing: 7,
      evidence: 7,
    },
    {
      ideaId: idea5.id,
      market: 5,
      fit: 3,
      timing: 6,
      evidence: 4,
    },
    {
      ideaId: idea6.id,
      market: 7,
      fit: 3,
      timing: 8,
      evidence: 6,
    },
  ]);
  console.log("✓ Scores added");

  console.log("\nDone! Ideas pipeline complete.");
}

main().catch(console.error);
