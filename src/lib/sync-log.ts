import { getTableColumns, inArray } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { syncLog } from "@/lib/schema";

/** sync_log as it exists before migration 0006, for INSERTs only: Drizzle lists
 * every declared column in an INSERT (using `default` for unset ones), so
 * inserting through `syncLog` fails until `skipped_record_ids` exists.
 * drizzle-kit reads only schema.ts, so this does not affect migrations. Keep the
 * columns in step with `syncLog`; remove this once 0006 is applied everywhere. */
export const syncLogPre0006 = pgTable("sync_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull().default("salesforce"),
    status: text("status").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    rowsSynced: integer("rows_synced"),
    rowsSkipped: integer("rows_skipped"),
    missingFields: jsonb("missing_fields").$type<string[]>(),
    errorMessage: text("error_message"),
    triggeredBy: text("triggered_by"),
});

/** sync_log columns that exist before migration 0006. Queries select these
 * explicitly so the admin sync keeps working if the code deploys before the
 * migration that adds `skipped_record_ids`. */
const { skippedRecordIds, ...columns } = getTableColumns(syncLog);
void skippedRecordIds; // Deliberately excluded; read via readSkippedRecordIds.
export const syncLogBaseColumns = columns;

/** Postgres "undefined_column": migration 0006 has not been applied yet. */
export function isMissingColumnError(error: unknown): boolean {
    for (let e: unknown = error; e; e = (e as { cause?: unknown }).cause)
        if ((e as { code?: unknown }).code === "42703") return true;
    return false;
}

/** Skipped Salesforce IDs for the given log rows. Returns an empty map when the
 * column does not exist yet, so the banner simply omits the list. */
export async function readSkippedRecordIds(ids: string[]) {
    const found = new Map<string, string[] | null>();
    if (!ids.length) return found;
    try {
        const rows = await db
            .select({ id: syncLog.id, skippedRecordIds: syncLog.skippedRecordIds })
            .from(syncLog)
            .where(inArray(syncLog.id, ids));
        for (const row of rows) found.set(row.id, row.skippedRecordIds);
    } catch (error) {
        if (!isMissingColumnError(error)) throw error;
    }
    return found;
}
