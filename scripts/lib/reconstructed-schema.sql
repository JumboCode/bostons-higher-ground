-- BHG schema reconstruction from src/lib/schema.ts, commit 2753bb9.
-- Fresh EMPTY PostgreSQL database only; not an existing-Neon repair.
-- No production rows, credentials, or migration-ledger claims included.

CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" integer NOT NULL,
	"school_name" varchar(50) NOT NULL,
	"student_id" integer NOT NULL,
	"days_present" integer NOT NULL,
	"days_absent" integer NOT NULL,
	"days_unexcused_absent" integer NOT NULL,
	"days_membership" integer NOT NULL,
	"ada" numeric(4, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" integer NOT NULL,
	"school_name" varchar(50) NOT NULL,
	"student_id" integer NOT NULL,
	"rubric_code" varchar(10) NOT NULL,
	"rubric_name" varchar(255) NOT NULL,
	"f_mark" numeric(3, 1),
	"w_mark" numeric(3, 1),
	"final_mark" numeric(3, 1) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housing_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"family_id" text NOT NULL,
	"intake_date" date,
	"date_housed" date,
	"current_status" text,
	"source_of_housing" text,
	"city" text,
	"zip_code" text,
	"school" text,
	"school_id" text,
	"student_count" integer
);
--> statement-breakpoint
CREATE TABLE "in_progress_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"chart_type_id" text,
	"charts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_baselines" (
	"metric" text PRIMARY KEY NOT NULL,
	"starting_value" integer NOT NULL,
	"as_of_date" date NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" integer NOT NULL,
	"school_name" varchar(50) NOT NULL,
	"student_id" integer NOT NULL,
	"grade_level" varchar(5) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"middle_name" varchar(50),
	"last_name" varchar(50) NOT NULL,
	"address" varchar(100) NOT NULL,
	"city" varchar(50) NOT NULL,
	"zip" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'salesforce' NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"rows_synced" integer,
	"rows_skipped" integer,
	"skipped_record_ids" jsonb,
	"missing_fields" jsonb,
	"error_message" text,
	"triggered_by" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_info" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"authorized" boolean NOT NULL,
	"permissions" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_progress_reports" ADD CONSTRAINT "in_progress_reports_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_baselines" ADD CONSTRAINT "metric_baselines_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_info" ADD CONSTRAINT "user_info_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "in_progress_reports_user_id_unique" ON "in_progress_reports" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_log_source_running_unique" ON "sync_log" USING btree ("source") WHERE "sync_log"."status" = 'running';