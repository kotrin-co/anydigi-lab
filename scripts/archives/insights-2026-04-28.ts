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
  { id: "4de44381a23003f19b68f10cf15575db20949e77682efa4d3ff2da68b68b26c7", url: "https://www.itmedia.co.jp/business/articles/2604/28/news019.html", title: "タクシーアプリ「S.RIDE」がインバウンド獲得で選んだ\"驚きの一手\"", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T22:00:00Z") },
  { id: "982a37556b48441d94c0012337b72911db25eb22a46eee106d3c56c4771ba333", url: "https://www.itmedia.co.jp/news/articles/2604/09/news010.html", title: "漫画「1週間後に生成AIで恥をかく新入社員」【残り2日】", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T22:00:00Z") },
  { id: "884e81bff9bf42eff19f0da93eecae336c399775373521fa38f3ca61cae4d4d5", url: "https://www.itmedia.co.jp/news/articles/2604/28/news050.html", title: "OpenAIとMicrosoft、提携契約を再改定　OpenAIはAWSなど任意のクラウドで製品提供可能に", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T22:00:00Z") },
  { id: "0ece49f80123080ffd594739cbf533fc73ccadc9db4b38715434829a2a539fd0", url: "https://www.itmedia.co.jp/aiplus/articles/2604/28/news051.html", title: "「GitHub Copilot」従量課金に　トークン消費量ベースで請求へ", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T21:56:00Z") },
  { id: "25740529633a9cdcd2c639ba346e9e7b218feed57ddce991920ebc2461ab681d", url: "https://www.theverge.com/tech/919411/canonical-ubuntu-linux-ai-features", title: "Canonical lays out a plan for AI in Ubuntu Linux", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T20:47:45Z") },
  { id: "3d9c665e5edd96fbd15088e54467079bb4d48ad6b296161ff8ae833b9c300341", url: "https://xtech.nikkei.com/atcl/nxt/column/18/01187/00082/", title: "DRBFMで高まる生成AI活用の声、設計者が果たすべき役割とは", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "f28de7402f47d734eb401a6bceae524c53ed48dab7d64d0b3af5824cdd1e6f86", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03565/042700015/", title: "BYDが最安EVにLiDAR、ファーウェイがレベル3攻勢　北京ショー7選", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "9a06cbb095ca97fc837549d49dc267d70baf91fa7ddd8d6fa567cc84f60ac6fd", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00001/11688/", title: "バイオ研究をフィジカルAIで自動化、東京科学大に新拠点　実験者は双腕ロボ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "1e95bfc3a4c705f9bfc4a62a4946610105afb2af9f48e95a7ac9cd50f85d1007", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00578/00113/", title: "工場長が仕事を丸投げして現場の離反を招いた工場", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "f500fc81daf03ec72a0b2046776f3f8631a4b4d18161388436c4d20954b30327", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03594/042200002/", title: "人口減少下で価値を残して勝ち残る、「カチノコリ」の9ステップ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "f3d524d968aabe7b2ecde5d847b9ee45aa3e602ce9a8947bb5cdc318f239b30c", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03241/040300007/", title: "「二足歩行より手の機能に期待」人型ロボット1551人アンケート", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "b480cc696b277cfc2440533bfe42bd92b98f205df586af31314ce6b749f4c0a0", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03569/042400006/", title: "トヨタ、TNGAに続くエリア35　「いいクルマ」造れるかが成否を分ける", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "356403a753ef95b037effd5ac48db626e524c129662fce9c6a95a117bf1e96bb", url: "https://atmarkit.itmedia.co.jp/ait/articles/2604/28/news008.html", title: "毎朝の情報収集を\"更新できるダッシュボード\"にまとめよう　Claude CoworkのLive Artifactで作ってみた", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "856e3a2e7cf8981693095fdc86d22a7d0161ea229813d243e74a4820a116bb83", url: "https://xtech.nikkei.com/atcl/nxt/column/18/02127/00203/", title: "ジヤトコCTO「HEVが大部分を占める」　変速機から電動アクスルへ転換", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-27T20:00:00Z") },
  { id: "b18a6b9a51205b72667bfdcc36faf1bff3e5715045a25b30cb175baee2a23ea0", url: "https://www.theverge.com/ai-artificial-intelligence/919326/google-ai-pentagon-classified-letter", title: "Google employees ask Sundar Pichai to say no to classified military AI use", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T18:17:12Z") },
  { id: "8203898ada26475c10d0c03c31fa2d0e694bc32e63b67c3c171274ddbc3bdf00", url: "https://techcrunch.com/2026/04/27/openai-ends-microsoft-legal-peril-over-its-50b-amazon-deal/", title: "OpenAI ends Microsoft legal peril over its $50B Amazon deal", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T17:40:38Z") },
  { id: "330777892e36ae3161f125e5e369718dc15f028c7bc77f3328b6e789adc8a058", url: "https://techcrunch.com/2026/04/27/deepminds-david-silver-just-raised-1-1b-to-build-an-ai-that-learns-without-human-data/", title: "DeepMind's David Silver just raised $1.1B to build an AI that learns without human data", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T17:24:21Z") },
  { id: "bcad43e13b4b845479daad8170862705eb3c76e9bc68fddb865a9ea4aab1cd46", url: "https://www.theverge.com/ai-artificial-intelligence/918981/openai-microsoft-renegotiate-contract", title: "Microsoft and OpenAI's famed AGI agreement is dead", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T16:15:47Z") },
  { id: "a98a18e31e8ce664788196ecbb6d74b3f0b47b031cf998ef39ab72934d5006bb", url: "https://www.technologyreview.com/2026/04/27/1136456/the-missing-step-between-hype-and-profit/", title: "The missing step between hype and profit", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-27T16:13:41Z") },
  { id: "b3247491edfd5bb2a201f1104f441df6efb7e58b67f06053bd08424be9444664", url: "https://techcrunch.com/2026/04/27/investors-back-skye-signull-labs-ai-home-screen-app-for-iphone-ahead-of-launch/", title: "Investors back Skye's AI home screen app for iPhone ahead of launch", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T16:13:02Z") },
  { id: "41c83ec293ad6f7a470fc935e892d1abcd8b80795f921d4b01feafd646a9bbdc", url: "https://www.theverge.com/tech/917225/sam-altman-elon-musk-openai-lawsuit", title: "Elon Musk and Sam Altman's court battle over the future of OpenAI", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-27T15:50:29Z") },
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
    {
      ideaId: 2,
      articleId: "982a37556b48441d94c0012337b72911db25eb22a46eee106d3c56c4771ba333",
      relevanceNote: "AI活用の地雷を踏む新入社員を題材にした漫画連載が連日トップ記事化。中小企業の新人・既存社員AIリテラシー教育の需要顕在化",
    },
    {
      ideaId: 8,
      articleId: "3d9c665e5edd96fbd15088e54467079bb4d48ad6b296161ff8ae833b9c300341",
      relevanceNote: "DRBFM（故障モード設計審査）に生成AIを使いたい声が製造業で拡大。図面解析と地続きで設計工程全体のAI化が現実味",
    },
    {
      ideaId: 9,
      articleId: "884e81bff9bf42eff19f0da93eecae336c399775373521fa38f3ca61cae4d4d5",
      relevanceNote: "OpenAIがAzure独占解除でAWS等任意クラウドで製品提供可能に。マルチクラウド前提のエージェント接続層MCPの重要性が確定",
    },
    {
      ideaId: 10,
      articleId: "0ece49f80123080ffd594739cbf533fc73ccadc9db4b38715434829a2a539fd0",
      relevanceNote: "GitHub Copilotがトークン従量課金へ移行、定額使い放題時代終了。AIコーディングのコスト効率・ROIベンチマークが経営課題化",
    },
    {
      ideaId: 16,
      articleId: "f3d524d968aabe7b2ecde5d847b9ee45aa3e602ce9a8947bb5cdc318f239b30c",
      relevanceNote: "1551人アンケートで人型ロボの実用期待が「二足歩行より手の機能」に集中。マニピュレーション系訓練データ需要を裏付け",
    },
    {
      ideaId: 17,
      articleId: "884e81bff9bf42eff19f0da93eecae336c399775373521fa38f3ca61cae4d4d5",
      relevanceNote: "OpenAI×Azure独占解除でエンタープライズはマルチクラウド・マルチベンダーのエージェント運用が前提に。ガバナンス層の必須化",
    },
    {
      ideaId: 17,
      articleId: "0ece49f80123080ffd594739cbf533fc73ccadc9db4b38715434829a2a539fd0",
      relevanceNote: "Copilot従量課金化でAIエージェント運用コスト管理が新しいガバナンス論点に。利用統制・ROI監査の需要が顕在化",
    },
  ];

  await db.insert(ideaEvidence).values(evidenceRecords);
  console.log(`✓ ${evidenceRecords.length} evidence records inserted`);

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — 追加なし。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence+1。漫画AI新人で教育需要が継続的に裏付け
    { ideaId: 2, market: 7, fit: 8, timing: 8, evidence: 8 },
    // id:3 AI審査モデル構築 — 追加なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — 追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — 追加なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — 追加なし
    { ideaId: 6, market: 7, fit: 3, timing: 8, evidence: 6 },
    // id:7 LLM Wiki型ナレッジ基盤 — 追加なし
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence+1。DRBFM活用拡大で設計工程全体のAI化機運
    { ideaId: 8, market: 6, fit: 4, timing: 7, evidence: 6 },
    // id:9 MCPコネクタ構築 — evidence+1。Azure独占解除でマルチクラウド接続層需要が確定的、timingさらに上昇
    { ideaId: 9, market: 8, fit: 9, timing: 10, evidence: 8 },
    // id:10 AIコーディング品質保証 — evidence+1。Copilot従量課金で経営課題化が決定的、timingを上げる
    { ideaId: 10, market: 9, fit: 8, timing: 10, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — 追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — 追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — 追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — 追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — 追加なし
    { ideaId: 15, market: 7, fit: 8, timing: 9, evidence: 7 },
    // id:16 物理世界AI訓練データ — evidence+1。1551人アンケで「手」期待が裏付け、マニピュレーション特化のデータ需要
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 6 },
    // id:17 エンタープライズAIエージェント統合 — evidence+2。OpenAI×Azure解除＋Copilot従量課金で「マルチクラウド×コスト統制」のガバナンス需要が決定的
    { ideaId: 17, market: 9, fit: 9, timing: 10, evidence: 9 },
  ];

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
