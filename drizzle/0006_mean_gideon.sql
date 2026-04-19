CREATE SCHEMA "trade";
--> statement-breakpoint
CREATE TABLE "trade"."portfolio_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"tier" text NOT NULL,
	"sector_bias" text,
	"recommendation" text,
	"core_candidates" jsonb DEFAULT '[]'::jsonb,
	"satellite_candidates" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade"."screening_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"genre" text NOT NULL,
	"generated_at" date NOT NULL,
	"source" text NOT NULL,
	"note" text,
	"total_count" integer NOT NULL,
	"max_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade"."stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"market" text,
	"industry" text,
	"price" real,
	"yield_pct" real,
	"per" real,
	"pbr" real,
	"roe" real,
	"market_cap_million" real,
	"segment" text NOT NULL,
	"rank" integer,
	"total_score" integer,
	"max_score" integer,
	"industry_score" integer,
	"industry_category" text,
	"disqualified" boolean,
	"disqualified_reason" text,
	"special_dividend_suspected" boolean,
	"normal_yield_pct" real,
	"loss_years" integer,
	"dividend_history_years" integer,
	"tier" text,
	"business" text,
	"tailwinds" jsonb DEFAULT '[]'::jsonb,
	"headwinds" jsonb DEFAULT '[]'::jsonb,
	"growth_comment" text,
	"dividend_sustainability" text,
	"recommended_position" text,
	"watch_points" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "stocks_batch_code_uniq" UNIQUE("batch_id","code")
);
--> statement-breakpoint
ALTER TABLE "trade"."portfolio_summaries" ADD CONSTRAINT "portfolio_summaries_batch_id_screening_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "trade"."screening_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD CONSTRAINT "stocks_batch_id_screening_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "trade"."screening_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stocks_batch_idx" ON "trade"."stocks" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "stocks_code_idx" ON "trade"."stocks" USING btree ("code");--> statement-breakpoint
CREATE INDEX "stocks_total_score_idx" ON "trade"."stocks" USING btree ("total_score");