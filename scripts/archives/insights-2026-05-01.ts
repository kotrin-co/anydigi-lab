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
  { id: "18bf6de80d5a428a8e47c0cb2fbda4f489977c909bc4dd0f0c34efd592bfa468", url: "https://techcrunch.com/2026/04/30/apple-was-surprised-by-ai-driven-demand-for-macs/", title: "Apple was surprised by AI-driven demand for Macs", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T22:12:52Z") },
  { id: "b1fe674ea4063b267bf2087694a3ab81575942b99d6f20d9c572be5cc23147a6", url: "https://monoist.itmedia.co.jp/mn/articles/2605/01/news024.html", title: "AI×シミュレーションでタイヤ開発を加速　横浜ゴムの金型設計支援システム", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T21:15:00Z") },
  { id: "89b86c5d3ed1f9a866b27736237300400420d9cbfe84f214b5250d78dff50a7f", url: "https://techcrunch.com/2026/04/30/legal-ai-startup-legora-hits-5-6-valuation-and-its-battle-with-harvey-just-got-hotter/", title: "Legal AI startup Legora hits $5.6B valuation and its battle with Harvey just got hotter", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T20:14:47Z") },
  { id: "9ab8ad132c31ba050d7ba2057c90372695932bc2d71cc932830e5ff3c6feccb8", url: "https://techcrunch.com/2026/04/30/after-dissing-anthropic-for-limiting-mythos-openai-restricts-access-to-cyber-too/", title: "After dissing Anthropic for limiting Mythos, OpenAI restricts access to Cyber, too", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T19:27:41Z") },
  { id: "e286f95b6bb55089541aad267a6f01f29cd87a6cd354d158e473cfa401d598a9", url: "https://www.theverge.com/ai-artificial-intelligence/920775/evidence-exhibits-elon-musk-sam-altman-openai-trial", title: "All the evidence unveiled so far in Musk v. Altman", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T19:00:00Z") },
  { id: "940b2036b7b7776e8ec6ac0ecb1c0b4e4e6ac6b9950e4da322d97149960a6544", url: "https://www.technologyreview.com/2026/04/30/1136684/exclusive-ebook-inside-the-stealthy-startup-that-pitched-brainless-human-clones/", title: "Exclusive eBook: Inside the stealthy startup that pitched brainless human clones", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-30T18:42:50Z") },
  { id: "4c70c291f6947db19130f0b2ecfaaefe7ebc6328d99638d8373f4cbc6f790d28", url: "https://techcrunch.com/2026/04/30/openai-announces-new-advanced-security-for-chatgpt-accounts-including-a-partnership-with-yubico/", title: "OpenAI announces new advanced security for ChatGPT accounts, including a partnership with Yubico", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T18:20:03Z") },
  { id: "85fd16c38c194904be9e56fa0db8f848863faa5a5205d158e0153c1862d034b6", url: "https://www.theverge.com/ai-artificial-intelligence/921546/elon-musk-xai-openai-trial-model-distillation", title: "Elon Musk confirms xAI used OpenAI’s models to train Grok", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T18:16:57Z") },
  { id: "ae3efb6bed1e81cd53fe37f39a2598326572870d341fffbe6942ce4f5227ad86", url: "https://techcrunch.com/2026/04/30/elon-musk-testifies-that-xai-trained-grok-on-openai-models/", title: "Elon Musk testifies that xAI trained Grok on OpenAI models", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T18:03:57Z") },
  { id: "5c150a63d9d8f8fbbc40c8e1123c4fea183f66777c5ae9aed8058d6fc8a01305", url: "https://techcrunch.com/2026/04/30/fda-approval-fundraising-and-the-reality-of-building-in-healthcare-according-to-bioticsai-founder/", title: "FDA approval, fundraising, and the reality of building in healthcare according to BioticsAI founder", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T17:53:53Z") },
  { id: "5f2384ff754e9c6b5b747b31b746920d611fbf8b4a5cf2e68e69dc2f2a565035", url: "https://techcrunch.com/2026/04/30/googles-gemini-ai-assistant-is-hitting-the-road-in-millions-of-vehicles/", title: "Google’s Gemini AI assistant is hitting the road in millions of vehicles", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T17:46:54Z") },
  { id: "06089a85f376fceb4ed56fd53de1e47b1b8327c52931b6e106b98785d8383280", url: "https://techcrunch.com/2026/04/30/stripe-link-digital-wallet-ai-agents-shopping/", title: "Stripe introduces Link, a digital wallet that autonomous AI agents can use, too", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T17:15:19Z") },
  { id: "481f5de6f926fcb77040eaeaa9d02ef6e5ddc76f2d45420764632b0d3aa554d2", url: "https://www.itmedia.co.jp/aiplus/articles/2605/01/news051.html", title: "Anthropic、セキュリティ特化ツール「Claude Security」　AIがコードをスキャン→脆弱性を修正", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T17:00:00Z") },
  { id: "41c83ec293ad6f7a470fc935e892d1abcd8b80795f921d4b01feafd646a9bbdc", url: "https://www.theverge.com/tech/917225/sam-altman-elon-musk-openai-lawsuit", title: "Live updates from Elon Musk and Sam Altman’s court battle over the future of OpenAI", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T16:57:14Z") },
  { id: "95bad5d30a962f7d0242ee8d8610f060b6112bb7940dc0a754136ea12d87d1fa", url: "https://www.theverge.com/ai-artificial-intelligence/915970/meta-manus-ai-ads-website-slop", title: "Meta is running get-rich-quick ads for its AI tools", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T16:48:13Z") },
  { id: "c687fe116e9d377ddb2fc7be051350607a2e0b8064f55ea84ab399826c2c01b4", url: "https://techcrunch.com/2026/04/30/salesforce-is-crowdsourcing-its-ai-roadmap-with-customers/", title: "Salesforce is crowdsourcing its AI roadmap — with customers ", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T16:06:49Z") },
  { id: "9c09df3fa9f0bf6becb92d6e5898948e4c22a86390a36840395bb7035f12de13", url: "https://www.theverge.com/tech/921210/microsoft-openai-partnership-divorce-notepad", title: "Here&#8217;s how the new Microsoft and OpenAI deal breaks down", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T16:00:00Z") },
  { id: "886c82cf7bd0233ef5c18988f0105559d1f287bd5be1865178f32b9824561ea3", url: "https://www.theverge.com/tech/921117/google-gemini-ai-assistant-cars-upgrade", title: "Gemini is rolling out to cars with Google built-in", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T16:00:00Z") },
  { id: "faccc026c672900c1771fec0691db2787207c26159f4df8982bb386761c0aa22", url: "https://www.technologyreview.com/2026/04/30/1136721/this-startups-new-mechanistic-interpretability-tool-lets-you-debug-llms/", title: "This startup’s new mechanistic interpretability tool lets you debug LLMs", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-30T15:59:41Z") },
  { id: "49501e0b0f8f93c9384d9943aac6ef4b6227207cedb8a8b39461b8739ed90b80", url: "https://techcrunch.com/2026/04/30/x-announces-a-rebuilt-ad-platform-powered-by-ai/", title: "X announces a rebuilt ad platform powered by AI", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T15:14:55Z") },
  { id: "a0c277c880f6c959ac89016ea9f714ac08d4725073afc64880b170c0145bfa20", url: "https://www.theverge.com/tech/921159/smart-glasses-review-wearable-even-realities-g2-meta-ray-ban-rokid-lucyd-oakley-meta-vanguard", title: "All these smart glasses and nothing to do", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-30T15:00:00Z") },
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

  // --- 新規アイデア1: AIエージェント決済・支出ガバナンス支援 (anydigi) ---
  const newIdea1Title = "AIエージェント決済・支出ガバナンス支援サービス";
  const newIdea1Summary = "Stripe Linkに代表される「AIエージェントが企業の決済・サブスク・広告予算を自律実行できるウォレット」が登場。中小企業にとって「AIに金を扱わせる」のは未踏領域で、承認ルール設計・予算上限制御・支出ログ監査・エージェント別信用枠管理が新たな課題に。MCPコネクタが社内RDB接続層、id:17が広域ガバナンスなのに対し、本サービスは決済・財務ガードレール特化層。";

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

  // === Step 4: Evidence & Scores ===
  console.log("\nStep 4: Linking evidence...");

  const evidenceRecords: { ideaId: number; articleId: string; relevanceNote: string }[] = [];

  // 新規アイデア1（AIエージェント決済ガバナンス）のevidence
  const idea1Target = newIdea1Id ?? similar1[0]?.id;
  if (idea1Target) {
    evidenceRecords.push(
      { ideaId: idea1Target, articleId: "06089a85f376fceb4ed56fd53de1e47b1b8327c52931b6e106b98785d8383280", relevanceNote: "Stripe LinkがAIエージェント向け決済ウォレットを公開。承認フロー経由でAIが安全に支出可能に。AIエージェント決済時代のガバナンス層需要が顕在化" },
    );
  }

  // id:1 AIエージェント耐障害性テスト — Goodfire Silico、Anthropic Claude Security
  evidenceRecords.push(
    { ideaId: 1, articleId: "faccc026c672900c1771fec0691db2787207c26159f4df8982bb386761c0aa22", relevanceNote: "Goodfireがメカニスティック解釈ツールSilicoを公開。LLMのパラメータを訓練中に微調整・デバッグ可能に。AIエージェント本番投入前の品質保証手段が拡充" },
    { ideaId: 1, articleId: "481f5de6f926fcb77040eaeaa9d02ef6e5ddc76f2d45420764632b0d3aa554d2", relevanceNote: "Anthropic Claude SecurityがAIによる脆弱性スキャン・修正を統合提供。AIエージェント自身が品質保証を行う時代の到来を示す" },
  );

  // id:2 中小企業向けAI導入・内製化支援 — Manus、横浜ゴム
  evidenceRecords.push(
    { ideaId: 2, articleId: "95bad5d30a962f7d0242ee8d8610f060b6112bb7940dc0a754136ea12d87d1fa", relevanceNote: "Meta傘下Manusが「ローカル中小企業向けにAIで即席Webサイト構築→販売」のマネタイズ手法をクリエイター動員で広告。SMB向けAIサービスの大衆化と質の二極化を象徴" },
    { ideaId: 2, articleId: "b1fe674ea4063b267bf2087694a3ab81575942b99d6f20d9c572be5cc23147a6", relevanceNote: "横浜ゴムがAI×シミュレーションで「経験の浅い技術者でも金型設計可能」な支援システムを開発。非専門家がAIで業務遂行する内製化の典型例" },
  );

  // id:7 LLM Wikiナレッジ基盤 — 横浜ゴム
  evidenceRecords.push(
    { ideaId: 7, articleId: "b1fe674ea4063b267bf2087694a3ab81575942b99d6f20d9c572be5cc23147a6", relevanceNote: "横浜ゴムが社内シミュレーション知見をAIに組み込み金型設計支援システム化。製造業の暗黙知をLLMベースの設計支援基盤に変換する事例" },
  );

  // id:8 製造業向けマルチモーダルAI図面解析 — 横浜ゴム
  evidenceRecords.push(
    { ideaId: 8, articleId: "b1fe674ea4063b267bf2087694a3ab81575942b99d6f20d9c572be5cc23147a6", relevanceNote: "横浜ゴムの金型設計支援AIは図面・シミュレーションデータをマルチモーダルに扱う実装事例。製造業AI設計支援の市場成熟を裏付け" },
  );

  // id:11 ソフトウェアサプライチェーンセキュリティ監査 — Claude Security、OpenAI Cyber、OpenAI Yubico
  evidenceRecords.push(
    { ideaId: 11, articleId: "481f5de6f926fcb77040eaeaa9d02ef6e5ddc76f2d45420764632b0d3aa554d2", relevanceNote: "Anthropic Claude Securityがコードスキャン→脆弱性修正をワンストップ提供。AIによる依存関係・脆弱性自動監査が現実化" },
    { ideaId: 11, articleId: "9ab8ad132c31ba050d7ba2057c90372695932bc2d71cc932830e5ff3c6feccb8", relevanceNote: "OpenAIがGPT-5.5 Cyberを「critical cyber defenders」限定で展開。AIサイバーセキュリティ製品が攻撃面拡大に対応する重要インフラに" },
    { ideaId: 11, articleId: "4c70c291f6947db19130f0b2ecfaaefe7ebc6328d99638d8373f4cbc6f790d28", relevanceNote: "OpenAIがChatGPTアカウントにYubico物理鍵による高度認証を追加。AIアカウント・APIキーがサプライチェーン攻撃の主要対象になっていることを示す" },
  );

  // id:12 AIエージェント可観測性 — Goodfire Silico
  evidenceRecords.push(
    { ideaId: 12, articleId: "faccc026c672900c1771fec0691db2787207c26159f4df8982bb386761c0aa22", relevanceNote: "Goodfire Silicoがメカニスティック解釈でモデル内部を可視化。AIエージェント可観測性の「中身を覗く」レイヤーが立ち上がりつつある" },
  );

  // id:13 AI駆動パーソナライズドコマース — Stripe Link、X AI ads
  evidenceRecords.push(
    { ideaId: 13, articleId: "06089a85f376fceb4ed56fd53de1e47b1b8327c52931b6e106b98785d8383280", relevanceNote: "Stripe LinkがAIエージェントによる自律購買フローを正式提供。エージェントコマース時代の決済インフラが整備され、AIショッピング流入の収益化基盤が固まる" },
    { ideaId: 13, articleId: "49501e0b0f8f93c9384d9943aac6ef4b6227207cedb8a8b39461b8739ed90b80", relevanceNote: "XがAI駆動の広告プラットフォームを再構築。広告売上拡大に向けAI主導のターゲティング・クリエイティブ最適化が業界標準化" },
  );

  // id:14 人間認証インフラ — OpenAI Yubico
  evidenceRecords.push(
    { ideaId: 14, articleId: "4c70c291f6947db19130f0b2ecfaaefe7ebc6328d99638d8373f4cbc6f790d28", relevanceNote: "OpenAIがYubicoと提携しChatGPTアカウントに物理セキュリティキー対応を追加。AIプラットフォームが「本物の人間が使っている」ことの強い検証を必要とし始めた象徴" },
  );

  // id:17 エンタープライズAIエージェント統合・ガバナンス — Salesforce、MS/OpenAI、Legora
  evidenceRecords.push(
    { ideaId: 17, articleId: "c687fe116e9d377ddb2fc7be051350607a2e0b8064f55ea84ab399826c2c01b4", relevanceNote: "SalesforceがAIロードマップを顧客主導でクラウドソーシング。エンタープライズAIエージェントの設計が顧客課題ドリブンに変容しガバナンス・運用設計の重要性が高まる" },
    { ideaId: 17, articleId: "9c09df3fa9f0bf6becb92d6e5898948e4c22a86390a36840395bb7035f12de13", relevanceNote: "MS×OpenAIの新契約でOpenAIが全クラウドでサービス提供可能に。エンタープライズはマルチクラウドAIエージェント前提の統合・ガバナンス設計が必須になる" },
    { ideaId: 17, articleId: "89b86c5d3ed1f9a866b27736237300400420d9cbfe84f214b5250d78dff50a7f", relevanceNote: "リーガルAI Legoraが$5.6B評価でHarveyと激突。垂直エンタープライズAIエージェントが巨大資本市場に成長し、企業側でも複数AIの統合・選定設計が経営課題化" },
  );

  // id:19 クリエイター・著名人向けAI模倣対策 — Musk distillation
  evidenceRecords.push(
    { ideaId: 19, articleId: "ae3efb6bed1e81cd53fe37f39a2598326572870d341fffbe6942ce4f5227ad86", relevanceNote: "Elon MuskがxAIによるOpenAIモデル蒸留（distillation）を法廷で認める。AIモデルの「模倣」が訴訟級の知財論点となり、本人性・オリジナル性保護需要が拡大" },
    { ideaId: 19, articleId: "85fd16c38c194904be9e56fa0db8f848863faa5a5205d158e0153c1862d034b6", relevanceNote: "Musk証言を機にmodel distillationが業界IP問題として注目。クリエイター・経営者の声・像を模倣するAIへの法的防御パッケージ需要を後押し" },
  );

  if (evidenceRecords.length > 0) {
    await db.insert(ideaEvidence).values(evidenceRecords);
    console.log(`✓ ${evidenceRecords.length} evidence records inserted`);
  }

  // 新規アイデアの初期スコア
  const newScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [];
  if (newIdea1Id) {
    newScores.push({ ideaId: newIdea1Id, market: 8, fit: 8, timing: 9, evidence: 3 });
  }
  if (newScores.length > 0) {
    await db.insert(ideaScores).values(newScores);
    console.log(`✓ ${newScores.length} new idea scores inserted`);
  }

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [
    // id:1 AIエージェント耐障害性テスト — Silico/Claude Securityでevidence強化、最高水準維持
    { ideaId: 1, market: 9, fit: 9, timing: 10, evidence: 10 },
    // id:2 中小企業AI導入支援 — Manus事例で大衆化加速、横浜ゴムで非専門家AI設計の実証。timing+1
    { ideaId: 2, market: 7, fit: 8, timing: 9, evidence: 9 },
    // id:3 AI審査モデル構築 — 変化なし
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — 変化なし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — 変化なし
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — 変化なし
    { ideaId: 6, market: 7, fit: 3, timing: 9, evidence: 7 },
    // id:7 LLM Wikiナレッジ基盤 — 横浜ゴム事例でevidence+1
    { ideaId: 7, market: 7, fit: 8, timing: 7, evidence: 6 },
    // id:8 製造業向けAI図面解析 — 横浜ゴム金型設計でevidence+1
    { ideaId: 8, market: 6, fit: 4, timing: 8, evidence: 8 },
    // id:9 MCPコネクタ構築 — 変化なし
    { ideaId: 9, market: 8, fit: 9, timing: 10, evidence: 9 },
    // id:10 AIコーディング品質保証 — 変化なし
    { ideaId: 10, market: 9, fit: 8, timing: 10, evidence: 10 },
    // id:11 サプライチェーンセキュリティ — Claude Security/OpenAI Cyber/Yubicoでevidence+2、timing+1
    { ideaId: 11, market: 8, fit: 7, timing: 9, evidence: 9 },
    // id:12 AIエージェント可観測性 — Silicoで内部可視化レイヤー登場でtiming+1
    { ideaId: 12, market: 7, fit: 5, timing: 9, evidence: 6 },
    // id:13 AI駆動コマース — Stripe Link/X AI adsで決済・広告両面が整備、timing+1、evidence+1
    { ideaId: 13, market: 8, fit: 4, timing: 9, evidence: 6 },
    // id:14 人間認証インフラ — OpenAI Yubicoでevidence+1
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 7 },
    // id:15 機密データ向けローカルLLM — 変化なし
    { ideaId: 15, market: 7, fit: 8, timing: 10, evidence: 8 },
    // id:16 物理世界AI訓練データ収集 — 変化なし
    { ideaId: 16, market: 9, fit: 3, timing: 9, evidence: 8 },
    // id:17 エンタープライズAIエージェント統合 — Salesforce/MS-OpenAI/Legoraでevidence+3
    { ideaId: 17, market: 9, fit: 9, timing: 10, evidence: 10 },
    // id:18 クリエイティブAIコネクタ — 変化なし
    { ideaId: 18, market: 7, fit: 7, timing: 8, evidence: 5 },
    // id:19 クリエイター模倣対策 — Musk distillation証言でtiming+1、evidence+2
    { ideaId: 19, market: 7, fit: 4, timing: 9, evidence: 5 },
    // id:20 製造業向け技能継承AI — 変化なし
    { ideaId: 20, market: 8, fit: 5, timing: 9, evidence: 3 },
    // id:21 製造業向け地政学リスク早期警戒 — 変化なし
    { ideaId: 21, market: 7, fit: 5, timing: 9, evidence: 3 },
  ];

  if (newIdea1Id) {
    rerankScores.push({ ideaId: newIdea1Id, market: 8, fit: 8, timing: 9, evidence: 3 });
  }

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
