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
  { id: "594b011ec69275733bde40d1f08d86b9460a6a6cd6f7956347026b01bfbb62d6", url: "https://www.itmedia.co.jp/news/articles/2604/25/news024.html", title: "MetaとAWSが提携　エージェント型AI強化に最新のArmベースチップ「Graviton5」を大量採用", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T21:41:00Z") },
  { id: "b1403d8ebcb49e7add238987bc88397bf735e10e5f2c6a8368cb0b3d83e98253", url: "https://www.technologyreview.com/2026/04/24/1136422/why-deepseeks-v4-matters/", title: "Three reasons why DeepSeek's new model V4 matters", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-24T21:40:58Z") },
  { id: "6ea69d2a677c71af3caed5af6ae03bf24b6f4e761fb07545b5e63ed35f6a7bec", url: "https://techcrunch.com/2026/04/24/metas-loss-is-thinking-machines-gain/", title: "Meta's loss is Thinking Machines' gain", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T20:52:07Z") },
  { id: "ff2b940026da73c6d23b3f3bb1283c7457b8d62f178c231aebf92a7a7c3f0eb8", url: "https://techcrunch.com/2026/04/24/comfyui-hits-500m-valuation-as-creators-seek-more-control-over-ai-generated-media/", title: "ComfyUI hits $500M valuation as creators seek more control over AI-generated media", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T19:49:35Z") },
  { id: "11dc9254567e300b821ad2cd33c4de9eb3212057f8e01e26164d0bbfd6920056", url: "https://techcrunch.com/2026/04/24/google-to-invest-up-to-40b-in-anthropic-in-cash-and-compute/", title: "Google to invest up to $40B in Anthropic in cash and compute", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T18:00:03Z") },
  { id: "e23abc1e52f5b43266af9111bf58992fb67edee892a2919e2e60f23d7c671006", url: "https://techcrunch.com/podcast/apples-new-ceo-and-why-elon-musk-wants-to-buy-cursor-for-60b/", title: "Apple's new CEO, and why Elon Musk wants to buy Cursor for $60B", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T17:45:57Z") },
  { id: "a8da07300fd886db9c68354a1c56dc04a2a9749eefdb411dcf8d813ed688a4f5", url: "https://www.theverge.com/ai-artificial-intelligence/917996/project-maven-military-ai-katrina-manson", title: "How Project Maven taught the military to love AI", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T17:00:00Z") },
  { id: "817bbdde2cf352acab66ad27ca60fe70ce0d1b6ea24621130d157687e36d36fc", url: "https://techcrunch.com/2026/04/24/mac-mini-price-expensive-ebay-shortage-ai-memory/", title: "Marked-up Mac minis flood eBay amid shortages driven by AI", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-24T16:42:19Z") },
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
    // id:17 エンタープライズAIエージェント統合 ← Meta+AWS Graviton5
    {
      ideaId: 17,
      articleId: "594b011ec69275733bde40d1f08d86b9460a6a6cd6f7956347026b01bfbb62d6",
      relevanceNote: "MetaがエージェントAI基盤に数千万Gravitonコアを投入。エージェント処理の大規模インフラ投資で企業環境の複雑化が加速しガバナンス需要を裏付け",
    },
    // id:17 ← Google Anthropic $40B
    {
      ideaId: 17,
      articleId: "11dc9254567e300b821ad2cd33c4de9eb3212057f8e01e26164d0bbfd6920056",
      relevanceNote: "GoogleがAnthropicに最大$40B投資。AIエージェント企業への史上最大級の資金流入でエンタープライズAI環境の急変がさらに加速",
    },
    // id:10 AIコーディング品質保証 ← DeepSeek V4
    {
      ideaId: 10,
      articleId: "b1403d8ebcb49e7add238987bc88397bf735e10e5f2c6a8368cb0b3d83e98253",
      relevanceNote: "DeepSeek V4がOSSでリリース。長コンテキスト対応の新アーキテクチャで商用モデルとの比較需要が拡大し、ベンチマーク市場の裾野が広がる",
    },
    // id:10 ← Cursor $60B
    {
      ideaId: 10,
      articleId: "e23abc1e52f5b43266af9111bf58992fb67edee892a2919e2e60f23d7c671006",
      relevanceNote: "MuskがCursorを$60Bで買収提案。AIコーディングツール市場が巨大であることの決定的証拠。ツール選定・品質比較需要の根拠",
    },
    // id:15 機密データ向けローカルLLM ← DeepSeek V4
    {
      ideaId: 15,
      articleId: "b1403d8ebcb49e7add238987bc88397bf735e10e5f2c6a8368cb0b3d83e98253",
      relevanceNote: "DeepSeek V4はOSSかつ長コンテキスト対応。ローカル導入可能な高性能モデルの選択肢が拡大し、導入支援市場の実用性が向上",
    },
    // id:15 ← Mac mini品薄
    {
      ideaId: 15,
      articleId: "817bbdde2cf352acab66ad27ca60fe70ce0d1b6ea24621130d157687e36d36fc",
      relevanceNote: "ローカルAI実行需要でMac miniが品薄・転売価格高騰。ローカルAI推論の需要急増をハードウェア市場が物理的に証明",
    },
    // id:6 AIアニメ・コンテンツ制作PF ← ComfyUI $500M
    {
      ideaId: 6,
      articleId: "ff2b940026da73c6d23b3f3bb1283c7457b8d62f178c231aebf92a7a7c3f0eb8",
      relevanceNote: "AIメディア生成ツールComfyUIが$30M調達で$500M評価。クリエイターがAI生成のコントロールを求める市場の実在を裏付け",
    },
  ];

  await db.insert(ideaEvidence).values(evidenceRecords);
  console.log(`✓ ${evidenceRecords.length} evidence records inserted`);

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence21件。今日の追加なし。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence9件。追加なし。安定
    { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
    // id:3 AI審査モデル構築 — evidence1件。追加なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — evidence1件。追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — evidence1件。追加なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence4→5件(+1)。ComfyUI $500Mでクリエイティブツール市場の実在が裏付け
    { ideaId: 6, market: 7, fit: 3, timing: 8, evidence: 6 },
    // id:7 LLM Wiki型ナレッジ基盤 — evidence2件。追加なし
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence4件。追加なし
    { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 5 },
    // id:9 MCPコネクタ構築 — evidence5件。追加なし。MCP標準化継続
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 7 },
    // id:10 AIコーディング品質保証 — evidence10→12件(+2)。Cursor $60B買収提案は市場巨大さの決定的証拠。DeepSeek V4 OSSで比較対象モデル増加。evidence最高値に
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — evidence5件。追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — evidence4件。追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件。追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — evidence5件。追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — evidence3→5件(+2)。DeepSeek V4 OSSで高性能ローカルモデル選択肢拡大+Mac mini品薄でハードウェア需要が物理的に証明。timing↑
    { ideaId: 15, market: 7, fit: 8, timing: 9, evidence: 6 },
    // id:16 物理世界AI訓練データ — evidence3件。追加なし
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 5 },
    // id:17 エンタープライズAIエージェント統合 — evidence6→8件(+2)。Meta Graviton数千万コア+Google Anthropic $40B。エージェントインフラの大規模投資で環境複雑化が加速。evidence↑
    { ideaId: 17, market: 9, fit: 9, timing: 9, evidence: 7 },
  ];

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
