CREATE TABLE "education_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"school" text,
	"school_code" text,
	"course_subject" text,
	"grade" double precision,
	"student_count" integer,
	"assessment_date" date,
	"city" text
);
