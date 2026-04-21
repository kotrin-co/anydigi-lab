CREATE SCHEMA "insights";
--> statement-breakpoint
CREATE TABLE "insights"."articles" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"source_name" text NOT NULL,
	"source_category" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights"."idea_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"article_id" text NOT NULL,
	"relevance_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights"."idea_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"market" integer NOT NULL,
	"fit" integer NOT NULL,
	"timing" integer NOT NULL,
	"evidence" integer NOT NULL,
	"scored_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights"."ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"embedding" vector(1536),
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insights"."idea_evidence" ADD CONSTRAINT "idea_evidence_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "insights"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights"."idea_evidence" ADD CONSTRAINT "idea_evidence_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "insights"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights"."idea_scores" ADD CONSTRAINT "idea_scores_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "insights"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idea_evidence_idea_idx" ON "insights"."idea_evidence" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_evidence_article_idx" ON "insights"."idea_evidence" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idea_scores_idea_idx" ON "insights"."idea_scores" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_scores_scored_at_idx" ON "insights"."idea_scores" USING btree ("scored_at");--> statement-breakpoint
CREATE INDEX "ideas_embedding_idx" ON "insights"."ideas" USING hnsw ("embedding" vector_cosine_ops);