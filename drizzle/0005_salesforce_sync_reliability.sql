ALTER TABLE "sync_log" ADD COLUMN "rows_skipped" integer;
--> statement-breakpoint
-- Historical double-clicks may have left multiple running attempts. Preserve
-- the newest per source; deployment must quiesce old sync workers first.
WITH ranked AS (
    SELECT "id", row_number() OVER (
        PARTITION BY "source" ORDER BY "started_at" DESC, "id" DESC
    ) AS position
    FROM "sync_log"
    WHERE "status" = 'running'
)
UPDATE "sync_log"
SET "status" = 'error',
    "finished_at" = now(),
    "error_message" = 'Duplicate running attempt closed by sync reliability migration'
FROM ranked
WHERE "sync_log"."id" = ranked."id" AND ranked.position > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX "sync_log_source_running_unique" ON "sync_log" USING btree ("source") WHERE "sync_log"."status" = 'running';
