-- IDs only; nullable so historical runs do not claim to have captured IDs.
ALTER TABLE "sync_log" ADD COLUMN "skipped_record_ids" jsonb;
