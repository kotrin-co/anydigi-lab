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
  { id: "d98497cbad723a1a2f0482dacaa91a30269c7108eda64531229d7daf3e895df0", url: "https://www.itmedia.co.jp/news/articles/2604/08/news014.html", title: "”映え”より気にすべきもの　漫画「1週間後に生成AIで恥をかく新入社員」【残り3日】", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T22:00:00Z") },
  { id: "6c8360fd6fb696023b0cb891ecc3fa073424fb8536e289cdb82668edbe144a02", url: "https://www.itmedia.co.jp/business/articles/2604/27/news048.html", title: "NEC、ブルーステラ事業売り上げを「1兆→1兆3000億円」へ上方修正　改革の全貌は？", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T22:00:00Z") },
  { id: "4a6dd3617faf575b1bd9e1218fdcd0d68bbafc5617389c4f8299f42dd7ee92fc", url: "https://kn.itmedia.co.jp/kn/articles/2604/27/news043.html", title: "「デジタル化・AI導入補助金2026」攻略法　突破率9割のプロが教える落選の防ぎ方", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T22:00:00Z") },
  { id: "fbe7499e28579023d3eabfcaf20de1ad7b50be7b925f5d428f712617ab91865a", url: "https://kn.itmedia.co.jp/kn/articles/2604/27/news052.html", title: "「ググる」より早い？　中小企業の「労務の悩み」をAIで解消する、弥生の新サービス", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T22:00:00Z") },
  { id: "afe0c6875d693f36a96b2a1b794f4bc1ec2a90e820c4aa4f5b6fee29fd351fcb", url: "https://kn.itmedia.co.jp/kn/articles/2604/27/news040.html", title: "編集者がベンダーに直撃　Notion、マネフォ、Backlogの最新アプデをレポ", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T22:00:00Z") },
  { id: "94a3d7eca42e746d0c9e68d9cc21c8d2f50795152ad7b4a88101aaeac86e1b26", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03259/042000018/", title: "日産、全固体電池にドライ電極　28年度量産は「数百台以下」から", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:01:00Z") },
  { id: "b816661f062d1cad40af78a4095ba708797d8e8e3751f314d087b6a4a8b37e58", url: "https://atmarkit.itmedia.co.jp/ait/articles/2604/27/news012.html", title: "AIを使わないエンジニアは「仕事をしていない」？　シリコンバレーから広がる「Tokenmaxxing」という新常識", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "22e3d9d3dbc6679658fa4192a3fc817a19363aeedf635cc80d238c050247579f", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03594/042200001/", title: "なぜ「改善活動」は進まないのか、2つのロスの連鎖と3つの問題点", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "7f1a33fb182b112d46b8154dad16f05a82e744009a3f2ae7ac2f580d5e4d581e", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00001/11680/", title: "京セラが760MHz帯ITS「再始動」、自転車に搭載できる小型SoCを量産へ", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "b1b69fe2218cb76f6c021786c1dd111f921431301a68b93a7e49c2cd83000993", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03565/042200010/", title: "スズキのアフリカ戦略、30年度シェア10％　中国勢台頭「簡単ではない」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "eba009cf3f87a2f747aa56923531839f1ec4a49c29bed69ee848fee948be5d56", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03569/042300005/", title: "21世紀版トヨタの部品共通化活動、エリア35は「攻め」ではなく「防衛」か", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "8749904e444fb4aedf22c4c3389d6e864bd9f027c9ce9c2aa2a94ea687e1b7d6", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03562/041000005/", title: "ネオジム磁石市場拡大、日本企業に好機　プレーヤー一丸で事業基盤構築を", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-26T20:00:00Z") },
  { id: "303c6b7bb6aba92f9612f0f8950d38fc2b797967e4bfaeaf6b4a172c86587a5c", url: "https://techcrunch.com/2026/04/26/to-buy-this-bay-area-home-youll-need-anthropic-equity/", title: "To buy this Bay Area home, you’ll need Anthropic equity", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-26T15:30:00Z") },
  { id: "546e0cfbdf19ca075313dd01264f7fc8f06ac233d72a17734ef3e4b38e6de7e8", url: "https://www.publickey1.jp/blog/26/typescript_70typescriptgo10.html", title: "「TypeScript 7.0」ベータ版が公開。TypeScriptコンパイラなどをGo言語に移植、コンパイルを10倍速に", sourceName: "publickey", sourceCategory: "dx", publishedAt: new Date("2026-04-26T15:08:13Z") },
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
    // id:17 エンタープライズAIエージェント統合 ← NEC BluStellar 1.3兆円
    {
      ideaId: 17,
      articleId: "6c8360fd6fb696023b0cb891ecc3fa073424fb8536e289cdb82668edbe144a02",
      relevanceNote: "NECがDX支援BluStellarを1兆→1.3兆円へ上方修正。エンタープライズAIエージェント市場の急拡大とガバナンス層の必要性を裏付け",
    },
    // id:2 中小企業向けAI導入・内製化支援 ← AI導入補助金2026
    {
      ideaId: 2,
      articleId: "4a6dd3617faf575b1bd9e1218fdcd0d68bbafc5617389c4f8299f42dd7ee92fc",
      relevanceNote: "デジタル化・AI導入補助金2026が刷新、突破率9割のプロが希少。中小企業AI導入の資金調達経路として支援サービスのフックになる",
    },
    // id:2 ← 弥生 労務AI（中小企業）
    {
      ideaId: 2,
      articleId: "fbe7499e28579023d3eabfcaf20de1ad7b50be7b925f5d428f712617ab91865a",
      relevanceNote: "中小企業6割が労務専任不在、弥生がAIで24時間サポート開始。中小企業の専門スタッフ不足をAIで埋める需要が顕在化",
    },
    // id:2 ← Tokenmaxxing（AI活用度評価）
    {
      ideaId: 2,
      articleId: "b816661f062d1cad40af78a4095ba708797d8e8e3751f314d087b6a4a8b37e58",
      relevanceNote: "シリコンバレーでトークンマクシング（AI活用量で評価）が常識化。中小企業も社員のAIリテラシー底上げ・内製化が経営課題に",
    },
    // id:9 MCPコネクタ ← 業務ツールAI機能（Notion/マネフォ/Backlog）
    {
      ideaId: 9,
      articleId: "afe0c6875d693f36a96b2a1b794f4bc1ec2a90e820c4aa4f5b6fee29fd351fcb",
      relevanceNote: "Notion/マネーフォワード/Backlog等の業務SaaSがAI機能を相次ぎ実装。社内データとAIエージェントの安全な接続需要が拡大",
    },
    // id:10 AIコーディング品質保証 ← TypeScript 7.0 (Go移植10倍速)
    {
      ideaId: 10,
      articleId: "546e0cfbdf19ca075313dd01264f7fc8f06ac233d72a17734ef3e4b38e6de7e8",
      relevanceNote: "TypeScriptコンパイラがGo移植で10倍高速化。AIコーディングのフィードバック短縮で生産性ベンチマークの再評価が必要",
    },
    // id:10 ← Tokenmaxxing
    {
      ideaId: 10,
      articleId: "b816661f062d1cad40af78a4095ba708797d8e8e3751f314d087b6a4a8b37e58",
      relevanceNote: "AI使用量で評価する文化が広がり、AIコーディングツール選定が経営課題化。エンタープライズ向け品質保証・ベンチマークの需要増",
    },
  ];

  await db.insert(ideaEvidence).values(evidenceRecords);
  console.log(`✓ ${evidenceRecords.length} evidence records inserted`);

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence22件。追加なし。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence9→12件(+3)。補助金/弥生/Tokenmaxxing で中小企業AI導入機運が裏付け強化
    { ideaId: 2, market: 7, fit: 8, timing: 8, evidence: 8 },
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
    // id:9 MCPコネクタ構築 — evidence5→6件(+1)。業務SaaSのAI機能拡大で接続需要が顕在化
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 7 },
    // id:10 AIコーディング品質保証 — evidence12→14件(+2)。Tokenmaxxing/TS7.0でツール選定の経営課題化が裏付け
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — evidence5件。追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — evidence4件。追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件。追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — evidence5件。追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — evidence6件。追加なし
    { ideaId: 15, market: 7, fit: 8, timing: 9, evidence: 7 },
    // id:16 物理世界AI訓練データ — evidence3件。追加なし
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 5 },
    // id:17 エンタープライズAIエージェント統合 — evidence10→11件(+1)。NEC BluStellar 1.3兆円でエンタープライズDX市場の規模拡大が決定的
    { ideaId: 17, market: 9, fit: 9, timing: 9, evidence: 8 },
  ];

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
