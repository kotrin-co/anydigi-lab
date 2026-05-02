import {
  pgSchema,
  text,
  serial,
  integer,
  timestamp,
  date,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const demoSchema = pgSchema("demo");

export type DemoTopic = {
  label: string;
  description?: string;
  articleIds?: string[];
};

export type DemoRole = "executive" | "manager" | "planner" | "solo";
export type DemoDepth = "digest" | "detailed";

// 日替わり質問セット（Q1のトピックを保持）
export const demoQuestionSets = demoSchema.table("question_sets", {
  id: serial("id").primaryKey(),
  generatedForDate: date("generated_for_date").notNull().unique(),
  topics: jsonb("topics").$type<DemoTopic[]>().notNull(),
  intro: text("intro"),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: text("status").notNull().default("active"),
});

// パターン別レポート（topic × role × depth = 4×4×2 = 32 / 日）
export const demoReports = demoSchema.table(
  "reports",
  {
    id: serial("id").primaryKey(),
    questionSetId: integer("question_set_id")
      .notNull()
      .references(() => demoQuestionSets.id, { onDelete: "cascade" }),
    topicIndex: integer("topic_index").notNull(),
    role: text("role").$type<DemoRole>().notNull(),
    depth: text("depth").$type<DemoDepth>().notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceArticleIds: text("source_article_ids").array(),
    viewCount: integer("view_count").notNull().default(0),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("reports_pattern_unique").on(
      t.questionSetId,
      t.topicIndex,
      t.role,
      t.depth
    ),
    index("reports_lookup_idx").on(
      t.questionSetId,
      t.topicIndex,
      t.role,
      t.depth
    ),
  ]
);
