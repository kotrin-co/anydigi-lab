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
  { id: "e286f95b6bb55089541aad267a6f01f29cd87a6cd354d158e473cfa401d598a9", url: "https://www.theverge.com/ai-artificial-intelligence/920775/evidence-exhibits-elon-musk-sam-altman-openai-trial", title: "All the evidence revealed so far in Musk v. Altman", sourceName: "the_verge_ai", sourceCategory: "ai", publishedAt: new Date("2026-05-01T19:14:51Z") },
  { id: "4ffec26807af2d800e3099c4ed9c0c44fcafe03cb54a3eac5fed1ef736ebd8ba", url: "https://techcrunch.com/podcast/did-you-know-you-cant-steal-a-charity-dont-worry-elon-musk-will-remind-you/", title: "Did you know you can't steal a charity? Don't worry. Elon Musk will remind you.", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-05-01T17:44:29Z") },
  { id: "93a09c15b91ac3ce2d4110dc81dc676261ac2899f0335c01e2c8285b338fb394", url: "https://techcrunch.com/2026/05/01/pentagon-inks-deals-with-nvidia-microsoft-and-aws-to-deploy-ai-on-classified-networks/", title: "Pentagon inks deals with Nvidia, Microsoft, and AWS to deploy AI on classified networks", sourceName: "techcrunch_ai", sourceCategory: "ai", publishedAt: new Date("2026-05-01T16:02:36Z") },
  { id: "fe0ffe6ad11fc585c906cbc9ce829b78f15fa401756915729f694f24538e7a18", url: "https://www.technologyreview.com/2026/05/01/1136779/cyber-insecurity-in-the-ai-era/", title: "Cyber-Insecurity in the AI Era", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-05-01T15:54:01Z") },
  { id: "b3d2ed33366fa9f2d1b498e0a4532b3c27c1be3dade3e13b594dda7a3ea59a0b", url: "https://www.technologyreview.com/2026/05/01/1136772/operationalizing-ai-for-scale-and-sovereignty/", title: "Operationalizing AI for Scale and Sovereignty", sourceName: "mit_tech_review", sourceCategory: "ai", publishedAt: new Date("2026-05-01T15:31:09Z") },
];

async function main() {
  console.log("Step 2: Inserting articles...");
  for (const a of bqArticles) {
    await db.insert(articles).values(a).onConflictDoNothing();
  }
  console.log(`✓ ${bqArticles.length} articles synced`);

  console.log("\nStep 3: Extracting ideas...");

  const newIdea1Title = "政府・社会インフラ向けAIベンダー多角化・調達ガバナンス支援サービス";
  const newIdea1Summary = "米国防総省（DOD）がAnthropicとの利用条項を巡る紛争を機に、Nvidia/Microsoft/AWSと並行してAI契約を締結。単一ベンダー依存リスクが政府レベルで顕在化した。日本の中央省庁・防衛・電力・通信・自治体も同じ構造課題に直面する。AI契約のリスク条項設計・複数ベンダー間の役割分担・運用切替性確保・コンプライアンス維持を一括支援するサービス。id:17が民間エンタープライズ向けガバナンスであるのに対し、本サービスは公共・社会インフラ・調達プロセス特化層。";

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

  console.log("\nStep 4: Linking evidence...");

  const evidenceRecords: { ideaId: number; articleId: string; relevanceNote: string }[] = [];

  const idea1Target = newIdea1Id ?? similar1[0]?.id;
  if (idea1Target) {
    evidenceRecords.push(
      { ideaId: idea1Target, articleId: "93a09c15b91ac3ce2d4110dc81dc676261ac2899f0335c01e2c8285b338fb394", relevanceNote: "DODがAnthropicとの利用条項紛争を機にNvidia/MS/AWSと並行契約。政府レベルでAIベンダー多角化が「単発の戦略」から「標準調達パターン」へ移行した象徴的事例" },
    );
  }

  // id:1 AIエージェント耐障害性テスト ← MIT Cyber-Insecurity
  evidenceRecords.push(
    { ideaId: 1, articleId: "fe0ffe6ad11fc585c906cbc9ce829b78f15fa401756915729f694f24538e7a18", relevanceNote: "MIT Tech Review EmTech：AIがattack surfaceを拡大しレガシーセキュリティでは不十分との警鐘。AIエージェント本番投入前の異常系テスト需要を補強" },
  );

  // id:11 ソフトウェアサプライチェーンセキュリティ ← MIT Cyber-Insecurity
  evidenceRecords.push(
    { ideaId: 11, articleId: "fe0ffe6ad11fc585c906cbc9ce829b78f15fa401756915729f694f24538e7a18", relevanceNote: "AI時代はセキュリティを「後乗せ」できないとの業界コンセンサスが形成。AIエージェントが依存パッケージを自動分析する監査需要が拡大" },
  );

  // id:15 機密データ向けローカルLLM ← Pentagon classified network、MIT sovereignty
  evidenceRecords.push(
    { ideaId: 15, articleId: "93a09c15b91ac3ce2d4110dc81dc676261ac2899f0335c01e2c8285b338fb394", relevanceNote: "DODがclassified networkにAIを展開。機密ネットワーク内でのLLM稼働は「分離環境＋ベンダー分散」が前提となり、ローカル/エンクレーブLLM導入需要が国家規模で立ち上がる" },
    { ideaId: 15, articleId: "b3d2ed33366fa9f2d1b498e0a4532b3c27c1be3dade3e13b594dda7a3ea59a0b", relevanceNote: "MIT Tech Review：企業がAIに必要なデータ主権を確保するため自社AI factory化を進める潮流。クラウドLLM不可の顧客セグメントの存在感が高まる" },
  );

  // id:17 エンタープライズAIエージェント統合・ガバナンス ← MIT sovereignty、Pentagon multi-vendor
  evidenceRecords.push(
    { ideaId: 17, articleId: "b3d2ed33366fa9f2d1b498e0a4532b3c27c1be3dade3e13b594dda7a3ea59a0b", relevanceNote: "MIT EmTech：AI factory構築でデータ所有権とAI推論を両立する設計が業界課題に。エージェント・データ・モデルの統合ガバナンス層の重要性が再確認" },
    { ideaId: 17, articleId: "93a09c15b91ac3ce2d4110dc81dc676261ac2899f0335c01e2c8285b338fb394", relevanceNote: "DODのマルチベンダー契約は「複数AI並走前提のガバナンス設計」が必須となる典型事例。エンタープライズも同様のマルチエージェント統合課題に直面" },
  );

  // id:19 クリエイター・著名人向けAI模倣対策 ← Musk v. Altman evidence/podcast
  evidenceRecords.push(
    { ideaId: 19, articleId: "e286f95b6bb55089541aad267a6f01f29cd87a6cd354d158e473cfa401d598a9", relevanceNote: "Musk v. Altman裁判で初期メール・写真・社内文書が次々開示。著名経営者の私的コミュニケーションがAI関連訴訟で公開される時代の象徴。本人性・プライバシー保護需要を補強" },
  );

  if (evidenceRecords.length > 0) {
    await db.insert(ideaEvidence).values(evidenceRecords);
    console.log(`✓ ${evidenceRecords.length} evidence records inserted`);
  }

  // 新規アイデアの初期スコア
  const newScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [];
  if (newIdea1Id) {
    newScores.push({ ideaId: newIdea1Id, market: 7, fit: 8, timing: 9, evidence: 3 });
  }
  if (newScores.length > 0) {
    await db.insert(ideaScores).values(newScores);
    console.log(`✓ ${newScores.length} new idea scores inserted`);
  }

  console.log("\nStep 5: Reranking all active ideas...");

  const rerankScores: { ideaId: number; market: number; fit: number; timing: number; evidence: number }[] = [
    { ideaId: 1, market: 9, fit: 9, timing: 10, evidence: 10 },
    { ideaId: 2, market: 7, fit: 8, timing: 9, evidence: 9 },
    { ideaId: 3, market: 6, fit: 7, timing: 5, evidence: 2 },
    { ideaId: 4, market: 5, fit: 4, timing: 5, evidence: 2 },
    { ideaId: 5, market: 5, fit: 3, timing: 3, evidence: 2 },
    { ideaId: 6, market: 7, fit: 3, timing: 9, evidence: 7 },
    { ideaId: 7, market: 7, fit: 8, timing: 7, evidence: 6 },
    { ideaId: 8, market: 6, fit: 4, timing: 8, evidence: 8 },
    { ideaId: 9, market: 8, fit: 9, timing: 10, evidence: 9 },
    { ideaId: 10, market: 9, fit: 8, timing: 10, evidence: 10 },
    // id:11 サプライチェーン ← MITで業界コンセンサス強化
    { ideaId: 11, market: 8, fit: 7, timing: 9, evidence: 9 },
    { ideaId: 12, market: 7, fit: 5, timing: 9, evidence: 6 },
    { ideaId: 13, market: 8, fit: 4, timing: 9, evidence: 6 },
    { ideaId: 14, market: 8, fit: 3, timing: 8, evidence: 7 },
    // id:15 機密データ向けローカルLLM ← Pentagon classified+MIT sovereigntyでevidence+1, market+1
    { ideaId: 15, market: 8, fit: 8, timing: 10, evidence: 9 },
    { ideaId: 16, market: 9, fit: 3, timing: 9, evidence: 8 },
    // id:17 エンタープライズAIガバナンス ← MIT/Pentagon multi-vendorでevidence強化（既に最高水準）
    { ideaId: 17, market: 9, fit: 9, timing: 10, evidence: 10 },
    { ideaId: 18, market: 7, fit: 7, timing: 8, evidence: 5 },
    { ideaId: 19, market: 7, fit: 4, timing: 9, evidence: 5 },
    { ideaId: 20, market: 8, fit: 5, timing: 9, evidence: 3 },
    { ideaId: 21, market: 7, fit: 5, timing: 9, evidence: 3 },
    // id:22 AIエージェント決済ガバナンス ← 変化なし
    { ideaId: 22, market: 8, fit: 8, timing: 9, evidence: 3 },
  ];

  if (newIdea1Id) {
    rerankScores.push({ ideaId: newIdea1Id, market: 7, fit: 8, timing: 9, evidence: 3 });
  }

  await db.insert(ideaScores).values(rerankScores);
  console.log(`✓ ${rerankScores.length} ideas re-scored`);

  console.log("\nDone!");
}

main().catch(console.error);
