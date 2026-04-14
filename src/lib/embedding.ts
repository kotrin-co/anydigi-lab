import OpenAI from "openai";
import { sql } from "drizzle-orm";
import type { db as dbType } from "./db";

const openai = new OpenAI();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function findSimilarIdeas(
  db: typeof dbType,
  embedding: number[],
  threshold = 0.80
): Promise<{ id: number; title: string; similarity: number }[]> {
  const vectorStr = `[${embedding.join(",")}]`;
  const result = await db.execute<{
    id: number;
    title: string;
    similarity: number;
  }>(
    sql`SELECT id, title, 1 - (embedding <=> ${vectorStr}::vector) as similarity
        FROM insights.ideas
        WHERE status = 'active'
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> ${vectorStr}::vector) > ${threshold}
        ORDER BY similarity DESC`
  );
  return result.rows;
}
