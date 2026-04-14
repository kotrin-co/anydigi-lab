import {
  pgSchema,
  text,
  serial,
  integer,
  timestamp,
  vector,
  index,
  date,
} from "drizzle-orm/pg-core";

export const insightsSchema = pgSchema("insights");

// RSS記事の参照情報（本文はBQに残す）
export const articles = insightsSchema.table("articles", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  sourceName: text("source_name").notNull(),
  sourceCategory: text("source_category"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// AIが抽出したビジネスアイデア
export const ideas = insightsSchema.table(
  "ideas",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category").notNull().default("general"),
    embedding: vector("embedding", { dimensions: 1536 }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ideas_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

// アイデアと記事の紐付け
export const ideaEvidence = insightsSchema.table(
  "idea_evidence",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    relevanceNote: text("relevance_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idea_evidence_idea_idx").on(table.ideaId),
    index("idea_evidence_article_idx").on(table.articleId),
  ]
);

// 4軸スコアの時系列
export const ideaScores = insightsSchema.table(
  "idea_scores",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    market: integer("market").notNull(),
    fit: integer("fit").notNull(),
    timing: integer("timing").notNull(),
    evidence: integer("evidence").notNull(),
    scoredAt: timestamp("scored_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idea_scores_idea_idx").on(table.ideaId),
    index("idea_scores_scored_at_idx").on(table.scoredAt),
  ]
);

// ── HP Analytics ──

// 日次サマリー
export const hpDailySummary = insightsSchema.table(
  "hp_daily_summary",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull().unique(),
    uniqueUsers: integer("unique_users").notNull(),
    pageviews: integer("pageviews").notNull(),
    dataSource: text("data_source").notNull(),
  },
  (table) => [index("hp_daily_summary_date_idx").on(table.date)]
);

// ページ別PV
export const hpPages = insightsSchema.table(
  "hp_pages",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    pageTitle: text("page_title"),
    pageUrl: text("page_url"),
    pageviews: integer("pageviews").notNull(),
  },
  (table) => [index("hp_pages_date_idx").on(table.date)]
);

// 流入元
export const hpTraffic = insightsSchema.table(
  "hp_traffic",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    source: text("source"),
    medium: text("medium"),
    uniqueUsers: integer("unique_users").notNull(),
    pageviews: integer("pageviews").notNull(),
  },
  (table) => [index("hp_traffic_date_idx").on(table.date)]
);

// デバイス種別
export const hpDevices = insightsSchema.table(
  "hp_devices",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    deviceType: text("device_type").notNull(),
    uniqueUsers: integer("unique_users").notNull(),
    pageviews: integer("pageviews").notNull(),
  },
  (table) => [index("hp_devices_date_idx").on(table.date)]
);

// 地域別
export const hpRegions = insightsSchema.table(
  "hp_regions",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    region: text("region").notNull(),
    uniqueUsers: integer("unique_users").notNull(),
    pageviews: integer("pageviews").notNull(),
  },
  (table) => [index("hp_regions_date_idx").on(table.date)]
);
