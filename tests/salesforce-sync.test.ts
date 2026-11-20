import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
const load = createRequire(import.meta.url);

// External boundaries only: exercise the real sync and route against controlled
// Salesforce pages and database responses, without touching a live org/database.
const loader = Module as unknown as {
    _load: (id: string, ...args: unknown[]) => unknown;
};
const originalLoad = loader._load;
let updated: Record<string, unknown>[] = [];
let inserted: Record<string, unknown>[] = [];
let callbacks: (() => Promise<void>)[] = [];
let selections: unknown[][] = [];
let conflict = false;
let failBatch = false;
let records: Record<string, unknown>[] = [];
let queries: string[] = [];
// Error thrown by the separate skipped-ID write (e.g. column missing before 0006).
let skippedWriteError: unknown = null;
// Which table each INSERT used and which columns each SELECT asked for, so tests
// can check that no query touches the 0006 column through the route.
let insertTables: unknown[] = [];
let selectColumns: (Record<string, unknown> | undefined)[] = [];
// Result of the separate skipped-ID read (GET), or an error to throw from it.
let skippedRead: () => Promise<unknown[]> = async () => [];
const db = {
    update: () => ({
        set: (value: Record<string, unknown>) => ({
            where: async () => {
                if (skippedWriteError && "skippedRecordIds" in value) throw skippedWriteError;
                updated.push(value);
            },
        }),
    }),
    delete: () => ({ operation: "delete" }),
    insert: (table: unknown) => (insertTables.push(table), {
        values: (
            value: Record<string, unknown> | Record<string, unknown>[]
        ) => {
            if (Array.isArray(value)) {
                inserted.push(...value);
                return { operation: "insert" };
            }
            const returning = async () =>
                conflict ? [] : [{ id: "run-1", ...value }];
            return { returning, onConflictDoNothing: () => ({ returning }) };
        },
    }),
    batch: async () => {
        if (failBatch) throw Error("batch failed");
    },
    select: (columns?: Record<string, unknown>) => (selectColumns.push(columns), {
        from: () => ({
            where: () => ({
                orderBy: () => ({
                    limit: async () => selections.shift() ?? [],
                }),
                // Awaited directly by the skipped-ID read (no orderBy/limit).
                then: (ok: (v: unknown) => unknown, fail: (e: unknown) => unknown) =>
                    skippedRead().then(ok, fail),
            }),
        }),
    }),
};
loader._load = function (id, ...args) {
    if (id === "@/lib/db") return { db };
    if (id === "@/lib/auth")
        return {
            auth: {
                api: { getSession: async () => ({ user: { id: "admin" } }) },
            },
        };
    if (id === "@/lib/usersFunction")
        return { getUserPermission: async () => "admin" };
    if (id === "next/server")
        return {
            after: (callback: () => Promise<void>) => callbacks.push(callback),
        };
    if (id === "next/cache") return { revalidateTag: () => {} };
    if (id === "./client")
        return {
            getSalesforceConnection: async () => ({
                sobject: () => ({
                    describe: async () => ({
                        fields: [{ name: "Family_Id__c" }],
                    }),
                }),
                query: async (soql: string) => (queries.push(soql), {
                    records: records.slice(0, 2),
                    done: false,
                    nextRecordsUrl: "page2",
                }),
                queryMore: async () => ({
                    records: records.slice(2),
                    done: true,
                }),
            }),
        };
    return originalLoad.call(this, id, ...args);
};
const { runSalesforceSync } = load(
    "../src/lib/salesforce/sync"
) as typeof import("../src/lib/salesforce/sync");
const { GET, POST } = load(
    "../src/app/api/admin/sync/route"
) as typeof import("../src/app/api/admin/sync/route");
// Same cached module instances the route uses (loaded above with the mocked db).
const { syncLogPre0006, syncLogBaseColumns } = load(
    "../src/lib/sync-log"
) as typeof import("../src/lib/sync-log");
const { syncLog } = load("../src/lib/schema") as typeof import("../src/lib/schema");
loader._load = originalLoad;

function reset() {
    updated = [];
    inserted = [];
    callbacks = [];
    selections = [];
    conflict = false;
    failBatch = false;
    queries = [];
    skippedWriteError = null;
    insertTables = [];
    selectColumns = [];
    skippedRead = async () => [];
    records = [
        { Family_Id__c: " A " },
        { Id: "001000000000001AAA", Family_Id__c: null, Name: "Do not persist" },
        { Id: "001000000000002AAA" },
        { Id: "001000000000003AAA", Family_Id__c: "  " },
        { Family_Id__c: "B" },
    ];
}
test("counts missing and blank family IDs across pages and persists the count", async () => {
    reset();
    const outcome = await runSalesforceSync("run-1");
    assert.equal(outcome.rowsSynced, 2);
    assert.equal(outcome.rowsSkipped, 3);
    assert.deepEqual(
        inserted.map((row) => row.familyId),
        ["A", "B"]
    );
    assert.equal(updated[0].status, "success");
    assert.equal(updated[0].rowsSkipped, 3);
    // The status update never references the 0006 column; IDs are written separately.
    assert.equal("skippedRecordIds" in updated[0], false);
    assert.deepEqual(updated[1].skippedRecordIds, ["001000000000001AAA", "001000000000002AAA", "001000000000003AAA"]);
    assert.match(queries[0], /SELECT Id,/);
    assert.match(queries[0], /WHERE RecordType.DeveloperName = 'FLSI_Household'/);
    assert.doesNotMatch(JSON.stringify(updated), /Do not persist/);
    assert.ok(outcome.missingFields.includes("City__c"));
});
test("a missing 0006 column, or any skipped-ID write failure, keeps the sync successful", async () => {
    const missingColumn = Object.assign(new Error("query failed"), {
        cause: Object.assign(new Error('column "skipped_record_ids" does not exist'), { code: "42703" }),
    });
    for (const error of [missingColumn, new Error("network blip")]) {
        reset();
        skippedWriteError = error;
        const outcome = await runSalesforceSync("run-1");
        assert.equal(outcome.rowsSkipped, 3);
        assert.deepEqual(updated.map((u) => u.status), ["success"]);
    }
});
test("zero rejected records is recorded as zero", async () => {
    reset();
    records = [{ Family_Id__c: "A" }];
    assert.equal((await runSalesforceSync("run-1")).rowsSkipped, 0);
});
test("batch failure marks the attempt errored without claiming successful counts", async () => {
    reset();
    failBatch = true;
    await assert.rejects(runSalesforceSync("run-1"), /batch failed/);
    assert.equal(updated[0].status, "error");
    assert.equal(updated[0].rowsSynced, undefined);
});
test("POST returns before Salesforce work and registers awaited post-response work", async () => {
    reset();
    const response = await POST(
        new Request("http://localhost/api/admin/sync", { method: "POST" })
    );
    assert.equal(response.status, 200);
    assert.equal(updated.length, 0);
    assert.equal(callbacks.length, 1);
    await callbacks[0]();
    assert.equal(updated[0].status, "success");
});
test("an insert conflict from a concurrent click returns 409 without scheduling work", async () => {
    reset();
    conflict = true;
    selections = [
        [],
        [{ id: "other-run", status: "running", startedAt: new Date() }],
    ];
    const response = await POST(
        new Request("http://localhost/api/admin/sync", { method: "POST" })
    );
    assert.equal(response.status, 409);
    assert.equal((await response.json()).log.id, "other-run");
    assert.equal(callbacks.length, 0);
});

// --- Deploy-before-migration-0006: no sync_log query may reference the new column. ---
const MISSING_COLUMN = Object.assign(new Error("query failed"), {
    cause: Object.assign(new Error('column "skipped_record_ids" does not exist'), { code: "42703" }),
});
test("route sync_log queries never select or insert the 0006 column", async () => {
    reset();
    conflict = true; // Exercises the running-check read, the insert and the conflict read.
    selections = [[], [{ id: "other-run", status: "running", startedAt: new Date() }]];
    await POST(new Request("http://localhost/api/admin/sync", { method: "POST" }));
    assert.deepEqual(insertTables, [syncLogPre0006]);
    assert.equal(selectColumns.length, 2);
    for (const columns of selectColumns) {
        assert.ok(columns, "select() without explicit columns selects every column");
        assert.equal("skippedRecordIds" in columns, false);
    }
});
test("GET shows sync status with or without the 0006 column", async () => {
    const latest = { id: "run-2", status: "success", startedAt: new Date() };
    reset();
    selections = [[latest], [latest]];
    skippedRead = async () => [{ id: "run-2", skippedRecordIds: ["001000000000001AAA"] }];
    let body = await (await GET(new Request("http://localhost/api/admin/sync"))).json();
    assert.deepEqual(body.latestSuccess.skippedRecordIds, ["001000000000001AAA"]);
    // The two status reads use explicit columns without the 0006 column; only the
    // separate, error-tolerant skipped-ID read (last) may name it.
    assert.equal(selectColumns.length, 3);
    for (const columns of selectColumns.slice(0, 2)) {
        assert.ok(columns, "select() without explicit columns selects every column");
        assert.equal("skippedRecordIds" in columns, false);
    }
    assert.deepEqual(Object.keys(selectColumns[2] ?? {}), ["id", "skippedRecordIds"]);
    reset();
    selections = [[latest], [latest]];
    skippedRead = async () => { throw MISSING_COLUMN; };
    const response = await GET(new Request("http://localhost/api/admin/sync"));
    assert.equal(response.status, 200);
    body = await response.json();
    assert.equal(body.latestSuccess.status, "success");
    assert.equal(body.latestSuccess.skippedRecordIds, null);
});
test("generated SQL for the base select and the pre-0006 insert omits skipped_record_ids", () => {
    const { drizzle } = load("drizzle-orm/neon-http") as typeof import("drizzle-orm/neon-http");
    const sqlDb = drizzle.mock();
    const insertSql = (table: typeof syncLog | typeof syncLogPre0006) =>
        sqlDb.insert(table).values({ source: "salesforce", status: "running" }).onConflictDoNothing().returning().toSQL().sql;
    const selectSql = sqlDb.select(syncLogBaseColumns).from(syncLog).toSQL().sql;
    assert.doesNotMatch(insertSql(syncLogPre0006), /skipped_record_ids/);
    assert.doesNotMatch(selectSql, /skipped_record_ids/);
    // Guard that this test can fail: Drizzle lists every declared column in an INSERT.
    assert.match(insertSql(syncLog), /skipped_record_ids/);
});
