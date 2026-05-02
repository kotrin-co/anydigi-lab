import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const statements = [
  `CREATE SCHEMA IF NOT EXISTS "demo"`,
  `CREATE TABLE IF NOT EXISTS "demo"."question_sets" (
    "id" serial PRIMARY KEY NOT NULL,
    "generated_for_date" date NOT NULL,
    "topics" jsonb NOT NULL,
    "intro" text,
    "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "status" text DEFAULT 'active' NOT NULL,
    CONSTRAINT "question_sets_generated_for_date_unique" UNIQUE("generated_for_date")
  )`,
  `CREATE TABLE IF NOT EXISTS "demo"."reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "question_set_id" integer NOT NULL,
    "topic_index" integer NOT NULL,
    "role" text NOT NULL,
    "depth" text NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "source_article_ids" text[],
    "view_count" integer DEFAULT 0 NOT NULL,
    "generated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "reports_pattern_unique" UNIQUE("question_set_id","topic_index","role","depth"),
    CONSTRAINT "reports_question_set_id_question_sets_id_fk"
      FOREIGN KEY ("question_set_id")
      REFERENCES "demo"."question_sets"("id")
      ON DELETE cascade ON UPDATE no action
  )`,
  `CREATE INDEX IF NOT EXISTS "reports_lookup_idx"
    ON "demo"."reports" USING btree ("question_set_id","topic_index","role","depth")`,
];

async function main() {
  for (const stmt of statements) {
    console.log("→", stmt.split("\n")[0].slice(0, 80));
    await sql.query(stmt);
  }

  const tables = await sql.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'demo' ORDER BY table_name`
  );
  console.log("\n✓ demo schema tables:", tables);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
