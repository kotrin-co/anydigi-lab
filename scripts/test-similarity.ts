import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { generateEmbedding, findSimilarIdeas } from "../src/lib/embedding";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  // テスト1: 既存アイデアとほぼ同じ内容 → 高い類似度が出るはず
  console.log("=== Test 1: 類似アイデア ===");
  const similar = await generateEmbedding(
    "企業のAIエージェントの品質テスト・脆弱性診断サービス"
  );
  const results1 = await findSimilarIdeas(db, similar, 0.7);
  for (const r of results1) {
    console.log(`  [${r.id}] ${r.title} — similarity: ${(r.similarity * 100).toFixed(1)}%`);
  }

  // テスト2: 全く別の内容 → 低い類似度が出るはず
  console.log("\n=== Test 2: 無関係なアイデア ===");
  const unrelated = await generateEmbedding(
    "ペット向けサブスクリプション型おやつ配送サービス"
  );
  const results2 = await findSimilarIdeas(db, unrelated, 0.7);
  console.log(`  マッチ数: ${results2.length}件`);
  for (const r of results2) {
    console.log(`  [${r.id}] ${r.title} — similarity: ${(r.similarity * 100).toFixed(1)}%`);
  }

  // テスト3: 閾値を下げて全件の類似度を見る
  console.log("\n=== Test 3: 全アイデアとの類似度（閾値0） ===");
  const results3 = await findSimilarIdeas(db, similar, 0);
  for (const r of results3) {
    console.log(`  [${r.id}] ${r.title} — ${(r.similarity * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);
