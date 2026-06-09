CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'salesforce' NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"rows_synced" integer,
	"missing_fields" jsonb,
	"error_message" text,
	"triggered_by" text
);
