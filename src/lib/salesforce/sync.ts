/**
 * Salesforce → housing_records sync.
 *
 * Strategy: truncate-and-reload.
 *   1. Authenticate with Salesforce (Client Credentials).
 *   2. Describe the target SObject and verify each configured field exists.
 *      Required fields missing → abort with an error.
 *      Optional fields missing → drop from the SOQL projection, leave the
 *        DB column NULL, and record the field name on the sync_log row.
 *   3. SOQL-query all records (paged via queryMore).
 *   4. Inside one transaction: DELETE all from housing_records, then bulk
 *      insert the new rows.
 *   5. Update the sync_log row with success/failure + row count + warnings.
 *
 * The function takes a pre-created sync_log id so the caller can return that
 * id immediately and let the sync run in the background.
 */

import { db } from "@/lib/db";
import { housingRecords, syncLog } from "@/lib/schema";
import type { BatchItem } from "drizzle-orm/batch";
import { eq } from "drizzle-orm";
import { getSalesforceConnection } from "./client";
import {
    FIELD_MAPPINGS,
    SF_QUERY_FILTER,
    SF_SOBJECT,
    type FieldMapping,
} from "./config";

const INSERT_CHUNK_SIZE = 500;

type ResolvedMapping = FieldMapping & { sfField: string };

export type SyncOutcome = {
    rowsSynced: number;
    missingFields: string[];
};

/**
 * Run the sync end-to-end. Updates `syncLog[logId]` on completion.
 * Re-throws on fatal errors (after the log row has been marked errored)
 * so the caller can log/alert.
 */
export async function runSalesforceSync(logId: string): Promise<SyncOutcome> {
    try {
        const outcome = await doSync();
        await db
            .update(syncLog)
            .set({
                status: "success",
                finishedAt: new Date(),
                rowsSynced: outcome.rowsSynced,
                missingFields: outcome.missingFields,
            })
            .where(eq(syncLog.id, logId));
        return outcome;
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Unknown sync error";
        await db
            .update(syncLog)
            .set({
                status: "error",
                finishedAt: new Date(),
                errorMessage: message,
            })
            .where(eq(syncLog.id, logId));
        throw err;
    }
}

async function doSync(): Promise<SyncOutcome> {
    const conn = await getSalesforceConnection();

    // 1. Describe the SObject and figure out which configured fields exist.
    const describe = await conn.sobject(SF_SOBJECT).describe();
    const availableFields = new Set(describe.fields.map((f) => f.name));

    const resolvedMappings: ResolvedMapping[] = [];
    const missingFields: string[] = [];
    const requiredMissing: string[] = [];

    for (const mapping of FIELD_MAPPINGS) {
        if (mapping.sfField === null) {
            // Not configured. Optional fields stay NULL; required would have
            // been caught at config load — but double-check defensively.
            if (mapping.required) {
                requiredMissing.push(`${mapping.column} (no SF field configured)`);
            }
            continue;
        }
        if (!availableFields.has(mapping.sfField)) {
            if (mapping.required) {
                requiredMissing.push(
                    `${mapping.column} → ${mapping.sfField}`
                );
            } else {
                // Skip silently — column will be null, chart will be empty.
                missingFields.push(mapping.sfField);
            }
            continue;
        }
        resolvedMappings.push(mapping as ResolvedMapping);
    }

    if (requiredMissing.length > 0) {
        throw new Error(
            `Required Salesforce field(s) missing on ${SF_SOBJECT}: ${requiredMissing.join(", ")}`
        );
    }

    // 2. Build & run the SOQL query (paged).
    const projection = resolvedMappings.map((m) => m.sfField).join(", ");
    const where = SF_QUERY_FILTER ? ` WHERE ${SF_QUERY_FILTER}` : "";
    const soql = `SELECT ${projection} FROM ${SF_SOBJECT}${where}`;

    type SfRecord = Record<string, unknown>;
    const records: SfRecord[] = [];

    let result = await conn.query<SfRecord>(soql);
    records.push(...result.records);
    while (!result.done && result.nextRecordsUrl) {
        result = await conn.queryMore<SfRecord>(result.nextRecordsUrl);
        records.push(...result.records);
    }

    // 3. Coerce SF records → housing_records rows. Skip records missing the
    //    required familyId (otherwise the NOT NULL insert will fail and tank
    //    the whole sync).
    const rows = records
        .map((r) => mapSfRecord(r, resolvedMappings))
        .filter((row): row is HousingRow => row !== null);

    // 4. Truncate + bulk insert atomically.
    //    neon-http does not support interactive transactions (db.transaction);
    //    it does support db.batch(), which runs multiple statements in a
    //    single HTTP request as one Postgres transaction. If anything fails,
    //    the whole batch rolls back so housing_records can never end up empty.
    const statements: BatchItem<"pg">[] = [db.delete(housingRecords)];
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE);
        if (chunk.length > 0) {
            statements.push(db.insert(housingRecords).values(chunk));
        }
    }
    // Tuple-narrowing for db.batch's `[U, ...U[]]` type: we always have at
    // least the delete statement.
    await db.batch(statements as [BatchItem<"pg">, ...BatchItem<"pg">[]]);

    return { rowsSynced: rows.length, missingFields };
}

type HousingRow = {
    familyId: string;
    intakeDate?: string | null;
    dateHoused?: string | null;
    currentStatus?: string | null;
    sourceOfHousing?: string | null;
    city?: string | null;
    zipCode?: string | null;
    school?: string | null;
    schoolId?: string | null;
    studentCount?: number | null;
};

function mapSfRecord(
    record: Record<string, unknown>,
    mappings: ResolvedMapping[]
): HousingRow | null {
    // Initialize with all columns nulled so missing-field columns stay NULL.
    const row: Record<string, unknown> = {
        familyId: null,
        intakeDate: null,
        dateHoused: null,
        currentStatus: null,
        sourceOfHousing: null,
        city: null,
        zipCode: null,
        school: null,
        schoolId: null,
        studentCount: null,
    };

    for (const m of mappings) {
        const raw = record[m.sfField];
        row[m.column] = coerce(raw, m.type);
    }

    if (typeof row.familyId !== "string" || row.familyId.trim() === "") {
        // Required by NOT NULL constraint — drop this record rather than
        // crashing the whole sync.
        return null;
    }

    return row as HousingRow;
}

function coerce(
    raw: unknown,
    type: FieldMapping["type"]
): string | number | null {
    if (raw === null || raw === undefined) return null;

    switch (type) {
        case "string": {
            const s = String(raw).trim();
            return s === "" ? null : s;
        }
        case "date": {
            // Salesforce dates are already ISO 8601 ("YYYY-MM-DD" for Date,
            // full ISO for DateTime). Pass straight through; Drizzle's `date`
            // column accepts strings.
            const s = String(raw).trim();
            if (s === "") return null;
            // Strip time portion if SF returned a DateTime where we expect Date.
            const datePart = s.split("T")[0];
            return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
        }
        case "integer": {
            const n =
                typeof raw === "number" ? raw : Number(String(raw).trim());
            return Number.isFinite(n) ? Math.trunc(n) : null;
        }
    }
}
