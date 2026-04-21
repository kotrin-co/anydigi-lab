CREATE TABLE "insights"."hp_daily_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"unique_users" integer NOT NULL,
	"pageviews" integer NOT NULL,
	"data_source" text NOT NULL,
	CONSTRAINT "hp_daily_summary_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "insights"."hp_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"device_type" text NOT NULL,
	"unique_users" integer NOT NULL,
	"pageviews" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights"."hp_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"page_title" text,
	"page_url" text,
	"pageviews" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights"."hp_traffic" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"source" text,
	"medium" text,
	"unique_users" integer NOT NULL,
	"pageviews" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hp_daily_summary_date_idx" ON "insights"."hp_daily_summary" USING btree ("date");--> statement-breakpoint
CREATE INDEX "hp_devices_date_idx" ON "insights"."hp_devices" USING btree ("date");--> statement-breakpoint
CREATE INDEX "hp_pages_date_idx" ON "insights"."hp_pages" USING btree ("date");--> statement-breakpoint
CREATE INDEX "hp_traffic_date_idx" ON "insights"."hp_traffic" USING btree ("date");