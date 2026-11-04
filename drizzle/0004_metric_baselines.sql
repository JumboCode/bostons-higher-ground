CREATE TABLE "metric_baselines" (
	"metric" text PRIMARY KEY NOT NULL,
	"starting_value" integer NOT NULL,
	"as_of_date" date NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metric_baselines" ADD CONSTRAINT "metric_baselines_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;