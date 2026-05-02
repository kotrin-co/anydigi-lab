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
  { id: "66a7d0a5ee405bb7c22b34cec7620abe8b90ddaee1b02a7ef46b86fa86e828e9", url: "https://techcrunch.com/2026/04/23/bret-taylors-sierra-buys-yc-backed-ai-startup-fragment/", title: "Bret Taylor's Sierra buys YC-backed AI startup Fragment", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T21:00:00Z") },
  { id: "209acb8c691090a5332933280538de5d7a4f628933a12f339459ad2ee0822d62", url: "https://www.itmedia.co.jp/aiplus/articles/2604/24/news067.html", title: "「GPT-5.5」発表　Claude Mythos Previewとの差は", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T20:19:00Z") },
  { id: "a2c551d7ff6885c273144985443d94cf429a563d9712e41f8381f99c150e32ad", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03569/042100004/", title: "トヨタ、ソフトの種類を減らして商品力アップ　新時代の開発へと改革", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "91227e91efabc5d37b36232cadab8cc653f93ff69fdb01544b8174f68ddce772", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00577/042100098/", title: "異業界からのメガバンク転職、企画職のニーズ後押しで採用拡大", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "3b7a21812337784ba0190c98206cfc08c069bfa3dc7c27fda4151abc598a1bde", url: "https://atmarkit.itmedia.co.jp/ait/articles/2604/24/news017.html", title: "Python 3.15ではより正確な型チェックが可能に（なる予定）　PEP 800で導入される非交和基底とは？", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "955b270830f636eea8d023b179c707416e64c9432232d6759566916d72043dbf", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00703/00151/", title: "部下が成長に関心を示さないという悩み", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "4dc9ec9f5821d03b267ebccd8202a59fe74e6bf9f13fe269a357eb34ab2ce0e9", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00257/00077/", title: "中小企業こそアピールを、「町工場の娘」ダイヤ精機・諏訪社長の信念", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "12603abe002f22184acd9526f0159d00f3fab71d2d8d0c9da16702e07061e469", url: "https://xtech.nikkei.com/atcl/nxt/column/18/01268/00153/", title: "供給網の深い階層、イラン攻撃で把握不足が露呈　妨げとなった完璧主義", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "54cd99b2fb86851cd91416d96c4ee9d14017ff4f409b85dc52f1118c26561af3", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00134/040600463/", title: "ノーベル賞・北川氏「酷評でもデータ信じた」　MOF開発30年、転機と出会い", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "046b4f5d8d2aeadbdeb0cdbed52376eff43a0f4b2daab6b80f70a5bb611dc7f9", url: "https://xtech.nikkei.com/atcl/nxt/news/24/03187/", title: "「三重の打撃」ホルムズ海峡封鎖の供給網への影響、Specteeが分析結果公開", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-23T20:00:00Z") },
  { id: "053879854ac8dcdbe4e69e41a379ce96c7b42f451b0bd9bf07552ce31227c57c", url: "https://www.theverge.com/tech/917690/meta-is-laying-off-10-percent-of-its-staff", title: "Meta is laying off 10 percent of its staff", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T19:41:07Z") },
  { id: "966748ae703ff12a728ba16b3530235bdb0dce22ea96995ebd85d577190c8fab", url: "https://techcrunch.com/2026/04/23/meet-noscroll-an-ai-bot-that-does-your-doomscrolling-for-you/", title: "Meet Noscroll, an AI bot that does your doomscrolling for you", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T19:38:25Z") },
  { id: "6ce98c6b2e29209e22e7a2db1b4eb3ebe644ace0ccaedbb6df3f9995337dd08b", url: "https://techcrunch.com/2026/04/23/openai-chatgpt-gpt-5-5-ai-model-superapp/", title: "OpenAI releases GPT-5.5, bringing company one step closer to an AI 'superapp'", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T18:29:29Z") },
  { id: "315f8ca408e7a64c1ac4ede4ca9ef1d2fe03f936ef7dc9464bf56dd6b3f537de", url: "https://www.theverge.com/ai-artificial-intelligence/917644/anthropic-claude-mythos-breach-humiliation", title: "Anthropic's Mythos breach was humiliating", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T18:24:56Z") },
  { id: "d2293623d8d094f63dc70ec430f68629b412c5597a4be534057c3cb2971e3828", url: "https://www.theverge.com/ai-artificial-intelligence/917612/openai-gpt-5-5-chatgpt", title: "OpenAI says its new GPT-5.5 model is more efficient and better at coding", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T18:00:00Z") },
  { id: "dee4f1aa9af6f5893593d1abeaee3443cc3c6f19e32eb3ce97ce2da9694c9eb4", url: "https://techcrunch.com/2026/04/23/era-computer-raises-11m-to-build-a-software-platform-for-ai-gadgets/", title: "Era raises $11M to build a software platform for AI gadgets", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-23T16:00:00Z") },
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
    // id:1 AIエージェント耐障害性テスト ← Mythos breach
    {
      ideaId: 1,
      articleId: "315f8ca408e7a64c1ac4ede4ca9ef1d2fe03f936ef7dc9464bf56dd6b3f537de",
      relevanceNote: "Anthropic最重要モデルMythosがリリース当日に不正アクセス。最もセーフティ重視の企業でもモデルセキュリティに穴があり、AIシステム包括テストの緊急性を裏付け",
    },
    // id:10 AIコーディング品質保証 ← GPT-5.5 (TC)
    {
      ideaId: 10,
      articleId: "6ce98c6b2e29209e22e7a2db1b4eb3ebe644ace0ccaedbb6df3f9995337dd08b",
      relevanceNote: "OpenAI GPT-5.5リリース。コーディング・リサーチ能力強化で「スーパーアプリ」化推進。競合モデル乱立でベンチマーク需要拡大",
    },
    // id:10 ← GPT-5.5 (Verge)
    {
      ideaId: 10,
      articleId: "d2293623d8d094f63dc70ec430f68629b412c5597a4be534057c3cb2971e3828",
      relevanceNote: "GPT-5.5は5.4の1ヶ月後にリリース。モデル更新ペースの加速で継続的品質比較・評価の重要性が増大",
    },
    // id:10 ← GPT-5.5 vs Mythos (ITmedia)
    {
      ideaId: 10,
      articleId: "209acb8c691090a5332933280538de5d7a4f628933a12f339459ad2ee0822d62",
      relevanceNote: "ITmediaがGPT-5.5とClaude Mythos Previewを直接比較。メディアのモデル比較記事増加がベンチマーク市場の存在を裏付け",
    },
    // id:15 機密データ向けローカルLLM ← Mythos breach
    {
      ideaId: 15,
      articleId: "315f8ca408e7a64c1ac4ede4ca9ef1d2fe03f936ef7dc9464bf56dd6b3f537de",
      relevanceNote: "クラウドAIプロバイダーのモデルセキュリティ懸念が顕在化。機密データを扱う企業がローカルLLM志向を強める根拠",
    },
    // id:17 エンタープライズAIエージェント統合 ← Sierra/Fragment
    {
      ideaId: 17,
      articleId: "66a7d0a5ee405bb7c22b34cec7620abe8b90ddaee1b02a7ef46b86fa86e828e9",
      relevanceNote: "Bret TaylorのSierraがYC卒Fragment買収。AIエージェント企業のM&A活発化でエンタープライズエージェント環境の複雑化が加速",
    },
    // id:17 ← Meta layoffs
    {
      ideaId: 17,
      articleId: "053879854ac8dcdbe4e69e41a379ce96c7b42f451b0bd9bf07552ce31227c57c",
      relevanceNote: "MetaがAIに$135B投資しつつ従業員10%削減。大手テックのAI集中戦略がエンタープライズAI環境の急変を加速しガバナンス需要を裏付け",
    },
  ];

  await db.insert(ideaEvidence).values(evidenceRecords);
  console.log(`✓ ${evidenceRecords.length} evidence records inserted`);

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence21件(+1)。Mythos breachでAIモデルセキュリティの脆弱性が露呈。スコアは既に最大値
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence9件。今日の追加なし。安定
    { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
    // id:3 AI審査モデル構築 — evidence1件。追加なし。シグナル不足
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — evidence1件。追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — evidence1件。追加なし。投機的
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence4件。追加なし
    { ideaId: 6, market: 7, fit: 3, timing: 8, evidence: 5 },
    // id:7 LLM Wiki型ナレッジ基盤 — evidence2件。追加なし
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence4件。追加なし
    { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 5 },
    // id:9 MCPコネクタ構築 — evidence5件。追加なし。MCP標準化の波は継続
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 7 },
    // id:10 AIコーディング品質保証 — evidence10件(+3)。GPT-5.5リリース×2記事+モデル比較記事。1ヶ月での更新ペース、メディア比較記事増加でベンチマーク需要の証拠が大幅強化
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 9 },
    // id:11 サプライチェーンセキュリティ — evidence5件。今日はソフトウェアSCへの直接的evidence無し
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — evidence4件。追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件。追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — evidence5件。追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — evidence3件(+1)。Mythos breachでクラウドAIセキュリティ懸念顕在化→ローカルLLM志向が強まるタイミング
    { ideaId: 15, market: 7, fit: 8, timing: 8, evidence: 4 },
    // id:16 物理世界AI訓練データ — evidence3件。追加なし
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 5 },
    // id:17 エンタープライズAIエージェント統合 — evidence6件(+2)。Sierra M&A+Meta $135B AI投資。エージェント環境の複雑化と大手テックの急進でガバナンス需要の裏付けが大幅強化
    { ideaId: 17, market: 9, fit: 9, timing: 9, evidence: 5 },
  ];

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
