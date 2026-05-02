import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  articles,
  ideas,
  ideaEvidence,
  ideaScores,
} from "@anydigi-lab/database/schema/insights";
import { generateEmbedding, findSimilarIdeas } from "@anydigi-lab/database/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const bqArticles = [
  { id: "d6d65d3eb24b6d0595bba116fcfb9f6663f072ff4a920ed2b1ccb0c94864a89f", url: "https://www.itmedia.co.jp/aiplus/articles/2604/29/news027.html", title: "ClaudeでBlenderやPhotoshopを直接制御　Anthropicがクリエイティブ向け新コネクタ8件公開", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-29T00:01:00Z") },
  { id: "1c7525877f0f624d5aadee53e9db55decfc839c31f2832ec3327e56cd59e78fc", url: "https://www.theverge.com/ai-artificial-intelligence/920191/elon-musk-sam-altman-trial-day-one", title: "Elon Musk appeared more petty than prepared", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T23:17:12Z") },
  { id: "f4baf91d534eed7a623bf360b78ab5c718d32de3ce8e66aaf26c29a41f86013f", url: "https://www.itmedia.co.jp/business/articles/2604/29/news026.html", title: "「OpenAIの独占権」手放したMicrosoft、AI競争に勝てるか？　巨額投資マネーの行方は", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T23:00:00Z") },
  { id: "092d0aedd8c336af84423820554063f308ebc3a97cb5d3555fcfc1d865c1ce5d", url: "https://www.itmedia.co.jp/enterprise/articles/2604/29/news017.html", title: "AIエージェントを活用する中堅・中小は何を使っている？　先進企業が「手放さないツール」【調査】", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T23:00:00Z") },
  { id: "10f61e8c12e0f792159728e48ba9743640921d8990da76263cec7bac51593185", url: "https://www.itmedia.co.jp/news/articles/2604/10/news006.html", title: "AIに丸投げ……で失敗　漫画「1週間後に生成AIで恥をかく新入社員」【残り1日】", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T22:00:00Z") },
  { id: "4fc108fd7676424ee5b6329c83af4d99eb76e8e5695eae4688f37bdd7f59ff40", url: "https://www.theverge.com/ai-artificial-intelligence/920048/elon-musk-testimony-save-humanity", title: "Elon Musk tells the jury that all he wants to do is save humanity", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T20:46:54Z") },
  { id: "c47b5752361f5d14b7b56621d18b9c53112edf38690709f1b53fc14d8575eba0", url: "https://www.theverge.com/ai-artificial-intelligence/919827/taylor-swift-trademarks-ai-copycats", title: "Taylor Swift is stepping up the legal war on AI copycats", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T20:30:00Z") },
  { id: "3df5560a2ece33b3c803d2e9d4e377d14b4a8adc8a3e537c521cc441bbec83d3", url: "https://techcrunch.com/2026/04/28/amazon-is-already-offering-new-openai-products-on-aws/", title: "Amazon is already offering new OpenAI products on AWS", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T19:48:02Z") },
  { id: "41c83ec293ad6f7a470fc935e892d1abcd8b80795f921d4b01feafd646a9bbdc", url: "https://www.theverge.com/tech/917225/sam-altman-elon-musk-openai-lawsuit", title: "Live updates from Elon Musk and Sam Altman's court battle over the future of OpenAI", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T19:27:50Z") },
  { id: "aaca0dc9b0cd5b089751b3e55bac4f2a7cf1962c6b82719cd4baf7710f7d70a5", url: "https://www.theverge.com/ai-artificial-intelligence/917052/elon-musk-takes-stand-trial-openai-sam-altman", title: "Elon Musk takes the stand in high-profile trial against OpenAI", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T19:00:13Z") },
  { id: "e42dbda149368adc73255b07d14cda38baca2915940c7cab64ce3b572a695e2d", url: "https://techcrunch.com/2026/04/28/amazon-launches-an-ai-powered-audio-qa-experience-on-product-pages/", title: "Amazon launches an AI-powered audio Q&A experience on product pages", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T18:49:54Z") },
  { id: "16fd727113f5884c86a7459f41f55fa236935db6f08b0be1c8b6827abcb89f69", url: "https://techcrunch.com/2026/04/28/google-expands-pentagons-access-to-its-ai-after-anthropics-refusal/", title: "Google expands Pentagon's access to its AI after Anthropic's refusal", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T18:15:00Z") },
  { id: "b42e8c02637b5d822b40f0931971a0f4a9cb5d8a08331610dcfe2f1a8324e79f", url: "https://www.theverge.com/ai-artificial-intelligence/919648/anthropic-claude-creative-connectors-adobe-blender", title: "Claude can now plug directly into Photoshop, Blender, and Ableton", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T16:49:08Z") },
  { id: "9230e6bdbbd834192da02ac9b911b75ca0c4e550e452764cf23663b9097b1390", url: "https://techcrunch.com/2026/04/28/lovable-launches-its-vibe-coding-app-on-ios-and-android/", title: "Lovable launches its vibe-coding app on iOS and Android", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-28T16:09:30Z") },
];

async function main() {
  // === Step 2: 記事同期 ===
  console.log("Step 2: Inserting articles...");
  for (const a of bqArticles) {
    await db.insert(articles).values(a).onConflictDoNothing();
  }
  console.log(`✓ ${bqArticles.length} articles synced`);

  // === Step 3: アイデア抽出 ===
  console.log("\nStep 3: Extracting ideas...");

  // --- 新規アイデア1: クリエイティブ業務向けAIコネクタ統合・自動化サービス (anydigi) ---
  const newIdea1Title = "クリエイティブ業務向けAIコネクタ統合・自動化サービス";
  const newIdea1Summary = "AnthropicがClaude向けにPhotoshop/Blender/Adobe Creative Cloud/Affinity/Autodesk/Ableton等のクリエイティブツールコネクタ8種を公開。デザイン事務所・映像制作・楽曲制作スタジオの業務フローにAIエージェント連携を組み込み、自動化スクリプト・コネクタ運用・データ連携を支援するサービス。MCPコネクタが企業RDB向けなのに対し、本サービスはクリエイティブSaaS/ローカルアプリ統合領域。";

  console.log(`\nChecking similarity for: ${newIdea1Title}`);
  const emb1 = await generateEmbedding(`${newIdea1Title}\n${newIdea1Summary}`);
  const similar1 = await findSimilarIdeas(db, emb1, 0.80);

  let newIdea1Id: number | null = null;
  if (similar1.length > 0) {
    console.log(`  → Similar to existing: ${similar1[0].title} (similarity: ${similar1[0].similarity.toFixed(3)})`);
    console.log(`  → Adding as evidence to idea ${similar1[0].id}`);
  } else {
    console.log("  → No similar ideas found, inserting as new");
    const [inserted] = await db.insert(ideas).values({
      title: newIdea1Title,
      summary: newIdea1Summary,
      category: "anydigi",
      embedding: emb1,
      status: "active",
    }).returning();
    newIdea1Id = inserted.id;
    console.log(`  ✓ New idea id: ${newIdea1Id}`);
  }

  // --- 新規アイデア2: クリエイター・著名人向けAI模倣対策パッケージ (general) ---
  const newIdea2Title = "クリエイター・著名人向けAI模倣対策・本人性保護パッケージ";
  const newIdea2Summary = "Taylor Swiftが声フレーズ「Hey, it's Taylor」の商標出願に踏み切るなど、AIコピーキャット時代の本人性保護需要が拡大。商標出願支援・AI生成コンテンツの常時監視・差止対応・声紋/像保護を一括提供するクリエイター・経営者・タレント向けパッケージサービス。";

  console.log(`\nChecking similarity for: ${newIdea2Title}`);
  const emb2 = await generateEmbedding(`${newIdea2Title}\n${newIdea2Summary}`);
  const similar2 = await findSimilarIdeas(db, emb2, 0.80);

  let newIdea2Id: number | null = null;
  if (similar2.length > 0) {
    console.log(`  → Similar to existing: ${similar2[0].title} (similarity: ${similar2[0].similarity.toFixed(3)})`);
    console.log(`  → Adding as evidence to idea ${similar2[0].id}`);
  } else {
    console.log("  → No similar ideas found, inserting as new");
    const [inserted] = await db.insert(ideas).values({
      title: newIdea2Title,
      summary: newIdea2Summary,
      category: "general",
      embedding: emb2,
      status: "active",
    }).returning();
    newIdea2Id = inserted.id;
    console.log(`  ✓ New idea id: ${newIdea2Id}`);
  }

  // === Step 4: Evidence & Scores ===
  console.log("\nStep 4: Linking evidence...");

  const evidenceRecords: { ideaId: number; articleId: string; relevanceNote: string }[] = [];

  // 新規アイデア1のevidence
  const idea1Target = newIdea1Id ?? similar1[0]?.id;
  if (idea1Target) {
    evidenceRecords.push(
      { ideaId: idea1Target, articleId: "b42e8c02637b5d822b40f0931971a0f4a9cb5d8a08331610dcfe2f1a8324e79f", relevanceNote: "AnthropicがClaude向けにAdobe/Affinity/Blender/Ableton/Autodesk等のコネクタを公開。クリエイティブ業務へのAIエージェント直接統合が実用段階に到達" },
      { ideaId: idea1Target, articleId: "d6d65d3eb24b6d0595bba116fcfb9f6663f072ff4a920ed2b1ccb0c94864a89f", relevanceNote: "クリエイターが手動工程を省きアイデア創出に集中できる8種コネクタの和文解説。中小制作会社・個人事務所への導入支援需要が見込まれる" },
    );
  }

  // 新規アイデア2のevidence
  const idea2Target = newIdea2Id ?? similar2[0]?.id;
  if (idea2Target) {
    evidenceRecords.push(
      { ideaId: idea2Target, articleId: "c47b5752361f5d14b7b56621d18b9c53112edf38690709f1b53fc14d8575eba0", relevanceNote: "Taylor Swiftが「Hey, it's Taylor」の音声商標出願に踏み切る。著名人がAIコピーキャットへの法的防衛を本格化させた象徴的事例" },
    );
  }

  // 既存アイデアへのevidence
  // id:2 中小企業向けAI導入支援
  evidenceRecords.push(
    { ideaId: 2, articleId: "092d0aedd8c336af84423820554063f308ebc3a97cb5d3555fcfc1d865c1ce5d", relevanceNote: "ノークリサーチ調査で中堅・中小企業のAIエージェント先行導入企業が「手放さない併用ツール」を特定。実運用フェーズに入った中小のAI活用パターンが可視化" },
    { ideaId: 2, articleId: "10f61e8c12e0f792159728e48ba9743640921d8990da76263cec7bac51593185", relevanceNote: "AI地雷を踏む新入社員シリーズ最終回。連載完結まで読者が追う人気コンテンツとなり、企業AIリテラシー教育需要を継続的に裏付け" },
  );

  // id:6 AIアニメ・コンテンツ制作PF
  evidenceRecords.push(
    { ideaId: 6, articleId: "b42e8c02637b5d822b40f0931971a0f4a9cb5d8a08331610dcfe2f1a8324e79f", relevanceNote: "ClaudeがPhotoshop/Blender/Ableton等に直結。コンテンツ制作の主要ツールがAIエージェント駆動になり、制作PFの基盤技術が整いつつある" },
  );

  // id:9 MCPコネクタ構築
  evidenceRecords.push(
    { ideaId: 9, articleId: "3df5560a2ece33b3c803d2e9d4e377d14b4a8adc8a3e537c521cc441bbec83d3", relevanceNote: "AWSがOpenAIモデル提供開始（独自エージェントサービス含む）。マルチクラウド・マルチベンダーのAIエージェント接続層需要がさらに確定的" },
  );

  // id:10 AIコーディング品質保証
  evidenceRecords.push(
    { ideaId: 10, articleId: "9230e6bdbbd834192da02ac9b911b75ca0c4e550e452764cf23663b9097b1390", relevanceNote: "LovableがiOS/Androidでvibe codingアプリを公開。モバイルからもAIコーディングが可能になり、出力品質のばらつき検証・ベンチマーク需要が一段拡大" },
  );

  // id:13 AI駆動パーソナライズドコマース
  evidenceRecords.push(
    { ideaId: 13, articleId: "e42dbda149368adc73255b07d14cda38baca2915940c7cab64ce3b572a695e2d", relevanceNote: "Amazonが商品ページに音声Q&AのAI体験「Join the chat」を導入。EC体験のAI化が音声インターフェース領域まで拡大、AI-SEO対応の必要性が一層高まる" },
  );

  // id:17 エンタープライズAIエージェント統合・ガバナンス
  evidenceRecords.push(
    { ideaId: 17, articleId: "3df5560a2ece33b3c803d2e9d4e377d14b4a8adc8a3e537c521cc441bbec83d3", relevanceNote: "OpenAI解放翌日にAWSがOpenAIエージェント提供開始。Azure/AWS/独自基盤を横断するエージェント運用ガバナンスが急務に" },
    { ideaId: 17, articleId: "f4baf91d534eed7a623bf360b78ab5c718d32de3ce8e66aaf26c29a41f86013f", relevanceNote: "Microsoftの独占権手放しでAI投資ROIに厳しい目。エンタープライズはマルチベンダーのAI投資効率・ガバナンス体制構築を迫られる" },
  );

  if (evidenceRecords.length > 0) {
    await db.insert(ideaEvidence).values(evidenceRecords);
    console.log(`✓ ${evidenceRecords.length} evidence records inserted`);
  }

  // 新規アイデアの初期スコア
  const newScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [];
  if (newIdea1Id) {
    newScores.push({ ideaId: newIdea1Id, market: 7, fit: 7, timing: 8, evidence: 4 });
  }
  if (newIdea2Id) {
    newScores.push({ ideaId: newIdea2Id, market: 7, fit: 4, timing: 8, evidence: 3 });
  }
  if (newScores.length > 0) {
    await db.insert(ideaScores).values(newScores);
    console.log(`✓ ${newScores.length} new idea scores inserted`);
  }

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — 追加なし。最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence+2。中堅・中小実運用調査+漫画連載完結で需要継続
    { ideaId: 2, market: 7, fit: 8, timing: 8, evidence: 8 },
    // id:3 AI審査モデル構築 — 追加なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — 追加なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — 追加なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence+1。Claudeコネクタで制作ツール基盤強化
    { ideaId: 6, market: 7, fit: 3, timing: 9, evidence: 7 },
    // id:7 LLM Wiki型ナレッジ基盤 — 追加なし
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — 追加なし
    { ideaId: 8, market: 6, fit: 4, timing: 7, evidence: 6 },
    // id:9 MCPコネクタ構築 — evidence+1。AWS OpenAI解放でクラウド横断接続層需要が決定的
    { ideaId: 9, market: 8, fit: 9, timing: 10, evidence: 9 },
    // id:10 AIコーディング品質保証 — evidence+1。Lovableモバイル展開でvibe codingが大衆化、品質保証の対象拡大
    { ideaId: 10, market: 9, fit: 8, timing: 10, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — 追加なし
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 7 },
    // id:12 AIエージェント可観測性PF — 追加なし
    { ideaId: 12, market: 7, fit: 5, timing: 8, evidence: 5 },
    // id:13 AI駆動パーソナライズドコマース — evidence+1。Amazon音声Q&AでEC体験のAI音声化が始動
    { ideaId: 13, market: 8, fit: 4, timing: 8, evidence: 4 },
    // id:14 人間認証インフラ — 追加なし
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
    // id:15 機密データ向けローカルLLM — 追加なし
    { ideaId: 15, market: 7, fit: 8, timing: 9, evidence: 7 },
    // id:16 物理世界AI訓練データ — 追加なし
    { ideaId: 16, market: 8, fit: 3, timing: 7, evidence: 6 },
    // id:17 エンタープライズAIエージェント統合・ガバナンス — evidence+2。AWS解放+Microsoft投資ROI懸念でマルチベンダー統治需要が決定的
    { ideaId: 17, market: 9, fit: 9, timing: 10, evidence: 10 },
  ];

  // 新規アイデアも rerank に含める
  if (newIdea1Id) {
    rerankScores.push({ ideaId: newIdea1Id, market: 7, fit: 7, timing: 8, evidence: 4 });
  }
  if (newIdea2Id) {
    rerankScores.push({ ideaId: newIdea2Id, market: 7, fit: 4, timing: 8, evidence: 3 });
  }

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
