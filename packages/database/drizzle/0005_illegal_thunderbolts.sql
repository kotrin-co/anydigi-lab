CREATE TABLE "insights"."hp_regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"region" text NOT NULL,
	"unique_users" integer NOT NULL,
	"pageviews" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hp_regions_date_idx" ON "insights"."hp_regions" USING btree ("date");