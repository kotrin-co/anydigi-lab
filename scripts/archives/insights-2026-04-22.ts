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
  { id: "eb991c0524c4907ad774aead5bd5a395fd8add2d1e94f598476bf8880bdb7374", url: "https://www.itmedia.co.jp/aiplus/articles/2604/22/news057.html", title: "OpenAI、\"視覚的思考パートナー\"「ChatGPT Images 2.0」発表　Web検索結果を反映する画像生成も可能に", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T22:19:00Z") },
  { id: "ad10eeb28cb497b0158c744854d335ecd471d60666889295bd510e1433cb987c", url: "https://www.itmedia.co.jp/news/articles/2604/05/news003.html", title: "会社で使っていいAI、ダメなAI　漫画「1週間後に生成AIで恥をかく新入社員」【残り6日】", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T22:00:00Z") },
  { id: "f75c491039f19d8f2f6ee58e742004963c14f9aa6283cd317e2f16bfb37fde4a", url: "https://www.itmedia.co.jp/business/articles/2604/22/news023.html", title: "歯磨き市場で10年連続1位　シュミテクトが貫く「市場創造」の作法", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T22:00:00Z") },
  { id: "33b0f1b5a3a398e451b252a19ffcaba106214feaaf67c401bda039016b430cda", url: "https://monoist.itmedia.co.jp/mn/articles/2604/22/news030.html", title: "自動車業界向けローカル生成AIシステム、機密性の高い設計ナレッジを安全に利活用", sourceName: "itmedia_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:15:00Z") },
  { id: "5f10604a6a271fa34da0e56f0b0162814e0126a8b5d6d93453ace9daa4c9337b", url: "https://www.technologyreview.com/2026/04/21/1134948/caring-for-service-dogs/", title: "Caring for service dogs", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "f9e20e287a35efdd713f7b5686770df6b5542dc1cd09eb1f70bace8d07046e58", url: "https://www.technologyreview.com/2026/04/21/1134862/this-tool-could-show-how-consciousness-works/", title: "This tool could show how consciousness works", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "85939d4725090acf663b66c611d8fc83028bbc31ba4e9f2bd01d8072e9ef296c", url: "https://www.technologyreview.com/2026/04/21/1134867/early-life-may-have-breathed-oxygen-earlier-than-believed/", title: "Early life may have breathed oxygen earlier than believed", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "8c0c064e7f138e8f8d03012632ea8effa016eaf995636f43373ffbcddc0a0c2b", url: "https://www.technologyreview.com/2026/04/21/1134870/analog-computing-from-waste-heat/", title: "Analog computing from waste heat", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "4b6390cb78b05d0c3fef0545772a890ea9c54358b4e75533569f55536a6e83d9", url: "https://www.technologyreview.com/2026/04/21/1134879/recent-books-from-the-mit-community-28/", title: "Recent books from the MIT community", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "3aab3e18c737a97f9c3170f1b2c4543a75912699db51947c460d921fcd035350", url: "https://www.technologyreview.com/2026/04/21/1134858/a-natural-protein-may-protect-the-gi-tract-from-infection/", title: "A natural protein may protect the GI tract from infection", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "be1335f7259e2f57d2190a8ecf3cd06aa02690e3cdc881ddfce442873b485cb9", url: "https://www.technologyreview.com/2026/04/21/1134945/inventor-recalls-eye-imaging-breakthrough/", title: "Inventor recalls eye imaging breakthrough", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "5d2f85efc54dd5fccb9f7da2037c30a4d66ade95748c95b04061e64573fcb13f", url: "https://www.technologyreview.com/2026/04/21/1134938/ai-at-mit/", title: "AI at MIT", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "fbd5e27b9dc181f8bb388d4d1a3f8933cd3101c0e5aca299150c31518e6ae7c2", url: "https://www.technologyreview.com/2026/04/21/1134856/the-new-word-in-home-construction-could-be-plastics/", title: "The new word in home construction could be \"plastics\"", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "7cb310d8912dc4b354f504a79ad8812fd7f07e52b5a09b2fe7d52bfaeff46630", url: "https://www.technologyreview.com/2026/04/21/1134873/get-ready-for-hotter-muggier-stormier-summers/", title: "Get ready for hotter, muggier, stormier summers", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T21:00:00Z") },
  { id: "2e24f09dcdab6a3339591c651a1194bc8dd7685cebf6bd1c4a2f32e76fd5e1a7", url: "https://www.technologyreview.com/2026/04/21/1135654/agent-orchestration-ai-artificial-intelligence/", title: "Agent orchestration", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "6e9bb7345f08b83b67fed1f446b55ed07fe09cb349c966a0186ecab59a6fc9e8", url: "https://www.technologyreview.com/2026/04/21/1135656/humanoid-data-robot-training-ai-artificial-intelligence/", title: "Humanoid data", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "4d215b6682e7d214962175448baac6161ebb50b0511e1e8e40fad6ed95246593", url: "https://www.technologyreview.com/2026/04/21/1135652/weaponized-deepfakes-ai-artificial-intelligence/", title: "Weaponized deepfakes", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "7593c9aceccaa8ab2a43b0771d502baeb5ba7ea0accfcf2d7f0e1fd96f99f9b7", url: "https://www.technologyreview.com/2026/04/21/1135665/resistance-ai-artificial-intelligence-backlash-protests/", title: "Resistance", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "e3b77e03194fe51158268d85e6001c69eeee8f7b56809520b1add35c916efb33", url: "https://www.technologyreview.com/2026/04/21/1135643/10-ai-artificial-intelligence-trends-technologies-research-2026/", title: "10 Things That Matter in AI Right Now", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "922b359495311f6f05b7a8e6e86b3fc54bde8fd7dfd186403f5f14c1dd4f53f0", url: "https://www.technologyreview.com/2026/04/21/1135663/artificial-scientists-ai-artificial-intelligence/", title: "Artificial scientists", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "f0575eb2e2fe51cf6176458908aae00d150298626355232349ac6b386f8b5f4e", url: "https://www.technologyreview.com/2026/04/21/1135645/llm-large-language-models-ai/", title: "LLMs+", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "b3f7942b9061b9dbe69b6bb0ff16734408d98336ef236f4bcd016a0a3d62a90a", url: "https://www.technologyreview.com/2026/04/21/1135650/world-models-ai-artificial-intelligence/", title: "World models", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "dd7c4f9f2f77c8bd1812d9192fa2b51e342be15a3dc9d9ccb7b44431137ba769", url: "https://www.technologyreview.com/2026/04/21/1135658/china-open-source-models-ai-artificial-intelligence/", title: "China's open-source bet", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "659648c23d924d2b14deb4e88412dc85cc765d9cb24afbff22f1287ea331bdd7", url: "https://www.technologyreview.com/2026/04/21/1135647/supercharged-scams-ai-artificial-intelligence/", title: "Supercharged scams", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:45:00Z") },
  { id: "35f9b7ed7246a50a3c07e93344975f5012d30ac1666619a7a48686944fd48806", url: "https://techcrunch.com/2026/04/21/apples-john-ternus-will-run-one-of-the-worlds-most-powerful-companies-the-job-is-a-minefield/", title: "Apple's John Ternus will run one of the world's most powerful companies; the job is a minefield", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T20:23:24Z") },
  { id: "768308266225e4dab157ea1ac5ee84d27c7d147c656b81fe41a12e321e4742dd", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00001/11676/", title: "村田製作所、超低電流の磁気センサー　カプセル内視鏡など医療機器向け", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-21T20:00:00Z") },
  { id: "219beae403895c8d57e5225abdb6c6ef54424f262553c3d7f5794b0900054f83", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03259/040100014/", title: "BYD対抗、戦略の裏側　「EVに絞る」か「HEVを生かす」か", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-21T20:00:00Z") },
  { id: "33916600a90624fd09d816f756924c6d81acea57e8a10102cbabd213c6e55db8", url: "https://xtech.nikkei.com/atcl/nxt/column/18/03214/041600104/", title: "ルノー新型EVの環境性能を高評価、欧州消費者団体", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-21T20:00:00Z") },
  { id: "4d5d19c0f3b345bdef4fcfa8e901460ceb4eab4f647bd13de8ee67a79a6abeb2", url: "https://xtech.nikkei.com/atcl/nxt/column/18/00138/042002005/", title: "荷主も物流に責任、製造業が取り組むべき「2026年問題」", sourceName: "nikkei_xtech_mono", sourceCategory: "dx", publishedAt: new Date("2026-04-21T20:00:00Z") },
  { id: "949d161f526bd711ee1d6ff006d3059a1e935079963452812d1ff9175d2cdc1f", url: "https://techcrunch.com/2026/04/21/ai-research-lab-neocognition-lands-40m-seed-to-build-agents-that-learn-like-humans/", title: "AI research lab NeoCognition lands $40M seed to build agents that learn like humans", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-04-21T19:11:29Z") },
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

  // --- 新規アイデア候補1: 機密データ向けローカルLLM導入支援 (anydigi) ---
  const newIdea1Title = "機密データ向けローカルLLM導入支援サービス";
  const newIdea1Summary = "自動車・製造業・防衛など機密性の高い業界向けに、外部ネットワーク非接続のローカル生成AIシステムの選定・チューニング・RAG構築を一貫支援するサービス。クラウドLLMが使えない顧客セグメントにデータ×AI基盤の知見を提供。";

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

  // --- 新規アイデア候補2: 物理世界AI訓練データ収集プラットフォーム (general) ---
  const newIdea2Title = "物理世界AI訓練データ収集プラットフォーム";
  const newIdea2Summary = "ヒューマノイドロボットや自動運転の訓練に必要な物理タスクデータを、一般ユーザーがスマホ撮影やリモートロボット操作で収集するクラウドソーシングプラットフォーム。World Modelsの実用化に向けたデータ供給インフラ。";

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

  // 新規アイデアのevidence
  if (newIdea1Id) {
    evidenceRecords.push({
      ideaId: newIdea1Id,
      articleId: "33b0f1b5a3a398e451b252a19ffcaba106214feaaf67c401bda039016b430cda",
      relevanceNote: "トリプルアイズとBEXが自動車設計業務向けローカル生成AIを開発。外部非接続で機密ナレッジを安全に活用する実装が商用化段階に到達",
    });
  } else if (similar1.length > 0) {
    evidenceRecords.push({
      ideaId: similar1[0].id,
      articleId: "33b0f1b5a3a398e451b252a19ffcaba106214feaaf67c401bda039016b430cda",
      relevanceNote: "トリプルアイズとBEXが自動車設計業務向けローカル生成AIを開発。外部非接続で機密ナレッジを安全に活用する実装が商用化段階に到達",
    });
  }

  if (newIdea2Id) {
    evidenceRecords.push({
      ideaId: newIdea2Id,
      articleId: "6e9bb7345f08b83b67fed1f446b55ed07fe09cb349c966a0186ecab59a6fc9e8",
      relevanceNote: "一般ユーザーが暗号通貨報酬で家事タスクを撮影、リモートでロボットアームを操作するなど物理世界データ収集が既に始まっている",
    });
    evidenceRecords.push({
      ideaId: newIdea2Id,
      articleId: "b3f7942b9061b9dbe69b6bb0ff16734408d98336ef236f4bcd016a0a3d62a90a",
      relevanceNote: "World Modelsが物理世界AI実現の鍵として注目。訓練データの質と量がボトルネックであることを示す",
    });
  } else if (similar2.length > 0) {
    evidenceRecords.push({
      ideaId: similar2[0].id,
      articleId: "6e9bb7345f08b83b67fed1f446b55ed07fe09cb349c966a0186ecab59a6fc9e8",
      relevanceNote: "一般ユーザーが暗号通貨報酬で家事タスクを撮影、リモートでロボットアームを操作するなど物理世界データ収集が既に始まっている",
    });
    evidenceRecords.push({
      ideaId: similar2[0].id,
      articleId: "b3f7942b9061b9dbe69b6bb0ff16734408d98336ef236f4bcd016a0a3d62a90a",
      relevanceNote: "World Modelsが物理世界AI実現の鍵として注目。訓練データの質と量がボトルネックであることを示す",
    });
  }

  // 既存アイデアへのevidence
  // id:1 AIエージェント耐障害性テスト
  evidenceRecords.push(
    { ideaId: 1, articleId: "2e24f09dcdab6a3339591c651a1194bc8dd7685cebf6bd1c4a2f32e76fd5e1a7", relevanceNote: "MIT Tech ReviewがAgent Orchestrationを2026年AI重要トレンドに選出。複数エージェント連携が本格化し、耐障害性テストの需要が拡大" },
    { ideaId: 1, articleId: "949d161f526bd711ee1d6ff006d3059a1e935079963452812d1ff9175d2cdc1f", relevanceNote: "NeoCognitionが人間のように学習するAIエージェント開発に$40Mシード調達。次世代エージェントの品質保証・テスト需要の裏付け" },
  );

  // id:2 中小企業向けAI導入支援
  evidenceRecords.push(
    { ideaId: 2, articleId: "ad10eeb28cb497b0158c744854d335ecd471d60666889295bd510e1433cb987c", relevanceNote: "企業でのAI利用ルールを漫画で解説する連載が人気。新入社員が『AIの地雷』を踏む描写が企業のAIリテラシー不足を象徴" },
  );

  // id:6 AIアニメ・コンテンツ制作PF
  evidenceRecords.push(
    { ideaId: 6, articleId: "eb991c0524c4907ad774aead5bd5a395fd8add2d1e94f598476bf8880bdb7374", relevanceNote: "ChatGPT Images 2.0が思考モード搭載で図解・多言語テキスト描画の品質が飛躍。1指示で最大10枚生成可能になりAIコンテンツ制作ツールが急進化" },
  );

  // id:8 製造業向けマルチモーダルAI図面解析
  evidenceRecords.push(
    { ideaId: 8, articleId: "33b0f1b5a3a398e451b252a19ffcaba106214feaaf67c401bda039016b430cda", relevanceNote: "自動車業界向けローカル生成AIが商用化。機密設計データをAIで活用する需要が実証され、製造業AI導入の裏付けが強化" },
  );

  // id:10 AIコーディング品質保証
  evidenceRecords.push(
    { ideaId: 10, articleId: "dd7c4f9f2f77c8bd1812d9192fa2b51e342be15a3dc9d9ccb7b44431137ba769", relevanceNote: "中国がオープンウェイトモデルを大量供給する戦略を展開。モデル選択肢の爆発的増加でコーディングAIのベンチマーク・品質比較需要が拡大" },
  );

  // id:11 サプライチェーンセキュリティ
  evidenceRecords.push(
    { ideaId: 11, articleId: "659648c23d924d2b14deb4e88412dc85cc765d9cb24afbff22f1287ea331bdd7", relevanceNote: "LLMを利用したフィッシング・スキャムが高度化しており、AI活用の攻撃面拡大がサプライチェーンセキュリティの重要性を裏付け" },
  );

  // id:12 AIエージェント可観測性PF
  evidenceRecords.push(
    { ideaId: 12, articleId: "2e24f09dcdab6a3339591c651a1194bc8dd7685cebf6bd1c4a2f32e76fd5e1a7", relevanceNote: "Agent Orchestrationが2026年AIトップトレンドに。複数エージェント連携の本格化で、エージェント間の振る舞いを可視化する可観測性の需要が増大" },
  );

  // id:14 人間認証インフラ
  evidenceRecords.push(
    { ideaId: 14, articleId: "4d215b6682e7d214962175448baac6161ebb50b0511e1e8e40fad6ed95246593", relevanceNote: "ディープフェイク技術の悪用が現実の脅威に。安価な生成モデルの普及でフェイク動画・音声が量産され、人間認証の緊急性が高まる" },
    { ideaId: 14, articleId: "659648c23d924d2b14deb4e88412dc85cc765d9cb24afbff22f1287ea331bdd7", relevanceNote: "AIスキャムの高度化（ターゲット型フィッシング）が拡大。本人確認・ボット検知インフラの需要増を裏付ける" },
  );

  if (evidenceRecords.length > 0) {
    await db.insert(ideaEvidence).values(evidenceRecords);
    console.log(`✓ ${evidenceRecords.length} evidence records inserted`);
  }

  // 新規アイデアの初期スコア
  const newScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [];
  if (newIdea1Id) {
    newScores.push({ ideaId: newIdea1Id, market: 7, fit: 8, timing: 7, evidence: 3 });
  }
  if (newIdea2Id) {
    newScores.push({ ideaId: newIdea2Id, market: 8, fit: 3, timing: 7, evidence: 4 });
  }
  if (newScores.length > 0) {
    await db.insert(ideaScores).values(newScores);
    console.log(`✓ ${newScores.length} new idea scores inserted`);
  }

  // === Step 5: Rerank ===
  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores = [
    // id:1 AIエージェント耐障害性テスト — evidence18件(+2)。Agent Orchestrationがトップトレンド入り、NeoCognition $40M。エージェント安全性市場の成長確実
    { ideaId: 1, market: 9, fit: 9, timing: 9, evidence: 9 },
    // id:2 中小企業AI導入支援 — evidence9件(+1)。企業AI教育漫画が示すリテラシーギャップ。安定成長
    { ideaId: 2, market: 7, fit: 8, timing: 7, evidence: 7 },
    // id:3 AI審査モデル構築 — evidence1件。4/13以降追加なし。シグナル不足
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    // id:4 自治体向け生成AIコンテンツ — evidence1件。追加シグナルなし
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    // id:5 宇宙エッジコンピューティング — evidence1件。投機的
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    // id:6 AIアニメ・コンテンツ制作PF — evidence4件(+1)。ChatGPT Images 2.0でツール飛躍。ただしAnyDigi fitは低い
    { ideaId: 6, market: 7, fit: 3, timing: 8, evidence: 5 },
    // id:7 LLM Wiki型ナレッジ基盤 — evidence2件。追加なし。概念有望だがシグナル停滞
    { ideaId: 7, market: 7, fit: 8, timing: 6, evidence: 4 },
    // id:8 製造業向けAI図面解析 — evidence4件(+1)。ローカルAI商用化で製造業AI適用の裏付け強化
    { ideaId: 8, market: 6, fit: 4, timing: 6, evidence: 5 },
    // id:9 MCPコネクタ構築・運用 — evidence3件。追加なし。MCP標準化の波は継続
    { ideaId: 9, market: 8, fit: 9, timing: 9, evidence: 6 },
    // id:10 AIコーディング品質保証 — evidence6件(+1)。中国オープンモデル戦略でモデル選択肢爆発、ベンチマーク需要拡大
    { ideaId: 10, market: 9, fit: 8, timing: 9, evidence: 7 },
    // id:11 サプライチェーンセキュリティ — evidence4件(+1)。AIスキャム高度化がセキュリティ需要を裏付け
    { ideaId: 11, market: 8, fit: 7, timing: 8, evidence: 6 },
    // id:12 AIエージェント可観測性PF — evidence2件(+1)。Agent Orchestration記事で間接的に需要増
    { ideaId: 12, market: 7, fit: 5, timing: 7, evidence: 4 },
    // id:13 AI駆動パーソナライズドコマース — evidence1件。追加なし
    { ideaId: 13, market: 8, fit: 4, timing: 7, evidence: 3 },
    // id:14 人間認証インフラ — evidence5件(+2)。Deepfake武器化+AIスキャム高度化で緊急性増
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 6 },
  ];

  // 新規アイデアも rerank に含める
  if (newIdea1Id) {
    rerankScores.push(
      // 機密データ向けローカルLLM — evidence1件。新規だが自動車業界実装事例あり。AnyDigiのインフラ知見が活きる領域
      { ideaId: newIdea1Id, market: 7, fit: 8, timing: 7, evidence: 3 }
    );
  }
  if (newIdea2Id) {
    rerankScores.push(
      // 物理世界AI訓練データ — evidence2件。World Models+Humanoidデータ収集の両面から裏付け。ただしAnyDigi fitは低い
      { ideaId: newIdea2Id, market: 8, fit: 3, timing: 7, evidence: 4 }
    );
  }

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
