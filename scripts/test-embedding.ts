import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
  console.log("Testing OpenAI embedding...");

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "AIエージェント耐障害性テストサービス",
  });

  const embedding = response.data[0].embedding;
  console.log(`✓ Embedding generated: ${embedding.length} dimensions`);
  console.log(`  First 5 values: [${embedding.slice(0, 5).join(", ")}]`);
  console.log(`  Usage: ${response.usage.total_tokens} tokens`);
}

main().catch(console.error);
