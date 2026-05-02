import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS needradar`;

  await sql`
    CREATE TABLE IF NOT EXISTS needradar.needs (
      id             SERIAL PRIMARY KEY,
      title          TEXT NOT NULL,
      summary        TEXT NOT NULL,
      vertical       TEXT NOT NULL DEFAULT 'general',
      evidence_count INTEGER NOT NULL DEFAULT 1,
      sources        TEXT[] NOT NULL DEFAULT '{}',
      embedding      vector(1536),
      status         TEXT NOT NULL DEFAULT 'active',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS needs_embedding_idx
    ON needradar.needs
    USING hnsw (embedding vector_cosine_ops)
  `;

  console.log("Done");
}

main().catch((e) => { console.error(e); process.exit(1); });
