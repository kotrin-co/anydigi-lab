import {
  pgSchema,
  text,
  serial,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersSchema = pgSchema("users");

// ── ユーザープロファイル（ホワイトリスト兼用） ──

export const profiles = usersSchema.table("profiles", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  role: text("role").notNull().default("member"), // "admin" | "member"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── ポートフォリオ ──

export const portfolios = usersSchema.table("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "メインポートフォリオ"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── 保有資産 ──

export const holdings = usersSchema.table("holdings", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id")
    .notNull()
    .references(() => portfolios.id, { onDelete: "cascade" }),
  assetType: text("asset_type").notNull(), // "index_fund" | "jp_stock" | "j_reit"
  account: text("account"), // "tokutei" | "nisa_tsumitate" | "nisa_growth" | "ideco" | "general"
  code: text("code"), // 銘柄コード（個別株の場合）
  name: text("name").notNull(), // "オルカン", "竹内製作所"
  costBasis: real("cost_basis"), // 投資額（円）
  marketValue: real("market_value"), // 評価額（円）
  memo: text("memo"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
