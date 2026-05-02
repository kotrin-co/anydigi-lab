import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  articles,
  ideaEvidence,
  ideaScores,
} from "@anydigi-lab/database/schema/insights";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "84f61519c9c1bb06d461c0b0027641abbe4f8af87f74b4923a48143ab0d9ed17", url: "https://www.itmedia.co.jp/aiplus/articles/2604/26/news023.html", title: "Anthropicのエージェント市場実験「Project Deal」で浮き彫りになる無自覚な経済格差", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T22:04:00Z") },
  { id: "d7e79a9a094acbc9a80e98bd56d6fb891b7dec608513e69949788a01f6386aef", url: "https://techcrunch.com/2026/04/25/anthropic-created-a-test-marketplace-for-agent-on-agent-commerce/", title: "Anthropic created a test marketplace for agent-on-agent commerce", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T21:43:37Z") },
  { id: "00c19d68629729ef7b2af61971db692cba2f8ebcdec68802ecc176e144157154", url: "https://techcrunch.com/2026/04/25/maines-governor-vetoes-data-center-moratorium/", title: "Maine's governor vetoes data center moratorium", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T20:57:08Z") },
  { id: "286cc351d903979bb252ce38f04f7111da377afd6563052ff59265bb35bd51a1", url: "https://techcrunch.com/2026/04/25/openai-ceo-apologizes-to-tumbler-ridge-community/", title: "OpenAI CEO apologizes to Tumbler Ridge community", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T17:17:56Z") },
  { id: "4964b1f63e40db1263b2aeab2eaf4180ae6fd64aa842a5805c188debbab57919", url: "https://techcrunch.com/2026/04/25/why-cohere-is-merging-with-aleph-alpha/", title: "Why Cohere is merging with Aleph Alpha", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T16:00:00Z") },
  { id: "fb55e18b935bbeefb0133600b0434bbfd2ff074d95f9714d821401348d1b0f07", url: "https://techcrunch.com/2026/04/25/why-tokyo-is-the-most-important-tech-destination-of-2026/", title: "Why Tokyo is the most important tech destination of 2026", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T15:03:00Z") },
  { id: "64189ffe31004a5479400622d6d34deed89ed264d785b97196cfc7b031f2fbcd", url: "https://techcrunch.com/2026/04/25/apple-under-ternus-what-comes-next-for-the-tech-giants-hardware-strategy/", title: "Apple under Ternus: what comes next for the tech giant's hardware strategy", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-25T15:00:00Z") },
];

async function main() {
  // === Step 2: 記事同期 ===
  console.log("Step 2: Inserting articles...");
  for (const a of bqArticles) {
    await db.insert(articles).values(a).onConflictDoNothing();
  }
  console.log(`✓ ${bqArticles.length} articles synced`);

  // === Step 4: Evidence ===
  console.log("\nStep 4: Linking evidence...");

  const evidenceRecords = [
    // id:17 エンタープライズAIエージェント統合 ← Project Deal (itmedia)
    {
      ideaId: 17,
      articleId: "84f61519c9c1bb06d461c0b0027641abbe4f8af87f74b4923a48143ab0d9ed17",
      relevanceNote: "Anthropic Project Deal実験でAIエージェント同士の自律取引が「無自覚な経済格差」を生むと判明。権限分離・取引監査・公平性検証のガバナンス層が必須化",
    },
    // id:17 ← Project Deal (techcrunch)
    {
      ideaId: 17,
      articleId: "d7e79a9a094acbc9a80e98bd56d6fb891b7dec608513e69949788a01f6386aef",
      relevanceNote: "Anthropicが実商取引マーケットでAIエージェント同士に売買させる実験を公開。エージェント間商取引のガバナンス設計需要が顕在化",
    },
    // id:1 AIエージェント耐障害性テスト ← Project Deal (itmedia)
    {
      ideaId: 1,
      articleId: "84f61519c9c1bb06d461c0b0027641abbe4f8af87f74b4923a48143ab0d9ed17",
      relevanceNote: "高性能モデルが弱モデルから不当に有利な取引を成立させる異常系を発見。エージェント挙動の偏り・公平性検証はテスト範囲拡大の根拠",
    },
    // id:15 機密データ向けローカルLLM ← Cohere × Aleph Alpha
    {
      ideaId: 15,
      articleId: "4964b1f63e40db1263b2aeab2eaf4180ae6fd64aa842a5805c188debbab57919",
      relevanceNote: "CohereとAleph Alphaが米国対抗のソブリンAI連合として合併、Schwarz Group支援。欧州企業・政府の独自LLM需要が制度的に裏付けられた",
    },
  ];

  await db.insert(ideaEvidence).values(evidenceRecords);
  console.log(`✓ ${evidenceRecords.length} evidence records inserted`);

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence21→22件(+1)。Project Dealでエージェント挙動偏り検証の必要性が再確認。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence9件。追加なし
    { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
    // id:3 AI審査モデル構築 — evidence1件。追加なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — evidence1件。追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — evidence1件。追加なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence5件。追加なし
    { ideaId: 6, market: 7, fit: 3, timing: 8, evidence: 6 },
    // id:7 LLM Wiki型ナレッジ基盤 — evidence2件。追加なし
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence4件。追加なし
    { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 5 },
    // id:9 MCPコネクタ構築 — evidence5件。追加なし
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 7 },
    // id:10 AIコーディング品質保証 — evidence12件。追加なし。最高水準維持
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — evidence5件。追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — evidence4件。追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件。追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — evidence5件。追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — evidence5→6件(+1)。Cohere×Aleph Alphaのソブリンアライアンスでローカル/独自LLM需要の制度的根拠が積み増し
    { ideaId: 15, market: 7, fit: 8, timing: 9, evidence: 7 },
    // id:16 物理世界AI訓練データ — evidence3件。追加なし
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 5 },
    // id:17 エンタープライズAIエージェント統合 — evidence8→10件(+2)。Project Dealでエージェント間取引のガバナンス需要が決定的に顕在化。evidence↑、最高水準
    { ideaId: 17, market: 9, fit: 9, timing: 9, evidence: 8 },
  ];

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
