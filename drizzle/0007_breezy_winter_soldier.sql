CREATE TABLE "trade"."financial_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"code" text NOT NULL,
	"fiscal_year" text NOT NULL,
	"revenue" real,
	"operating_profit" real,
	"eps" real,
	"operating_margin" real,
	"equity_ratio" real,
	"operating_cf" real,
	"cash_equivalents" real,
	"dividend_per_share" real,
	"payout_ratio" real,
	CONSTRAINT "financial_data_batch_code_year_uniq" UNIQUE("batch_id","code","fiscal_year")
);
--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_revenue_trend" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_eps_trend" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_operating_margin" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_equity_ratio" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_operating_cf" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_cash_trend" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_dividend_trend" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "score_payout_ratio" integer;--> statement-breakpoint
ALTER TABLE "trade"."stocks" ADD COLUMN "financial_score_raw" integer;--> statement-breakpoint
ALTER TABLE "trade"."financial_data" ADD CONSTRAINT "financial_data_batch_id_screening_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "trade"."screening_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_data_batch_code_idx" ON "trade"."financial_data" USING btree ("batch_id","code");