import {
  pgSchema,
  text,
  serial,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const tradeSchema = pgSchema("trade");

// ── スクリーニング実行バッチ ──

export const screeningBatches = tradeSchema.table("screening_batches", {
  id: serial("id").primaryKey(),
  genre: text("genre").notNull(), // "jp-high-dividend"
  generatedAt: date("generated_at").notNull(),
  source: text("source").notNull(),
  note: text("note"),
  totalCount: integer("total_count").notNull(),
  maxScore: integer("max_score").notNull(), // 100
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── 銘柄マスタ（スクリーニング結果） ──

export const stocks = tradeSchema.table(
  "stocks",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => screeningBatches.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    market: text("market"),
    industry: text("industry"),
    price: real("price"),
    yieldPct: real("yield_pct"),
    per: real("per"),
    pbr: real("pbr"),
    roe: real("roe"),
    marketCapMillion: real("market_cap_million"),
    segment: text("segment").notNull(), // "corporate" | "finance"
    rank: integer("rank"),

    // スコアリング結果
    totalScore: integer("total_score"),
    maxScore: integer("max_score"),
    industryScore: integer("industry_score"),
    industryCategory: text("industry_category"),
    disqualified: boolean("disqualified"),
    disqualifiedReason: text("disqualified_reason"),
    specialDividendSuspected: boolean("special_dividend_suspected"),
    normalYieldPct: real("normal_yield_pct"),
    lossYears: integer("loss_years"),
    dividendHistoryYears: integer("dividend_history_years"),

    // 3軸スコア（100点満点）
    financialScore: integer("financial_score"), // 財務スコア（旧85点→100点正規化）
    valuationScore: integer("valuation_score"), // 割安スコア（RIM比率→100点）
    industryScore100: integer("industry_score_100"), // 業種スコア（基礎+テーマ補正→100点）
    compositeScore: integer("composite_score"), // 総合スコア（重み付き100点）
    themeAdjustment: integer("theme_adjustment"), // テーマ補正合計値（AI付与）

    // Tier分析（AI生成）
    tier: text("tier"), // "S" | "A" | "B" | "C"
    business: text("business"),
    tailwinds: jsonb("tailwinds").$type<string[]>().default([]),
    headwinds: jsonb("headwinds").$type<string[]>().default([]),
    growthComment: text("growth_comment"),
    dividendSustainability: text("dividend_sustainability"), // "very_high" | "high" | "mid_high" | "mid" | "low"
    recommendedPosition: text("recommended_position"), // "core" | "satellite" | "watchlist"
    watchPoints: jsonb("watch_points").$type<string[]>().default([]),

    // 8項目財務スコア内訳
    scoreRevenueTrend: integer("score_revenue_trend"),
    scoreEpsTrend: integer("score_eps_trend"),
    scoreOperatingMargin: integer("score_operating_margin"),
    scoreEquityRatio: integer("score_equity_ratio"),
    scoreOperatingCf: integer("score_operating_cf"),
    scoreCashTrend: integer("score_cash_trend"),
    scoreDividendTrend: integer("score_dividend_trend"),
    scorePayoutRatio: integer("score_payout_ratio"),
    financialScoreRaw: integer("financial_score_raw"), // 8項目合計 (0-100)
  },
  (table) => [
    index("stocks_batch_idx").on(table.batchId),
    index("stocks_code_idx").on(table.code),
    index("stocks_total_score_idx").on(table.totalScore),
    unique("stocks_batch_code_uniq").on(table.batchId, table.code),
  ]
);

// ── ポートフォリオサマリー（Tier S バッチ単位） ──

export const portfolioSummaries = tradeSchema.table("portfolio_summaries", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id")
    .notNull()
    .references(() => screeningBatches.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(), // "S"
  sectorBias: text("sector_bias"),
  recommendation: text("recommendation"),
  coreCandidates: jsonb("core_candidates").$type<string[]>().default([]),
  satelliteCandidates: jsonb("satellite_candidates").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
