import {
  pgSchema,
  text,
  serial,
  integer,
  timestamp,
  vector,
  index,
} from "drizzle-orm/pg-core";

export const needradarSchema = pgSchema("needradar");

export const needs = needradarSchema.table(
  "needs",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    vertical: text("vertical").notNull().default("general"),
    evidenceCount: integer("evidence_count").notNull().default(1),
    sources: text("sources").array().notNull().default([]),
    regions: text("regions").array().notNull().default([]),
    embedding: vector("embedding", { dimensions: 1536 }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("needs_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);
