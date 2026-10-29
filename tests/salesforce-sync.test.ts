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
const db = {
    update: () => ({
        set: (value: Record<string, unknown>) => ({
            where: async () => {
                updated.push(value);
            },
        }),
    }),
    delete: () => ({ operation: "delete" }),
    insert: () => ({
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
    select: () => ({
        from: () => ({
            where: () => ({
                orderBy: () => ({
                    limit: async () => selections.shift() ?? [],
                }),
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
    if (id === "./client")
        return {
            getSalesforceConnection: async () => ({
                sobject: () => ({
                    describe: async () => ({
                        fields: [{ name: "Family_Id__c" }],
                    }),
                }),
                query: async () => ({
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
const { POST } = load(
    "../src/app/api/admin/sync/route"
) as typeof import("../src/app/api/admin/sync/route");
loader._load = originalLoad;

function reset() {
    updated = [];
    inserted = [];
    callbacks = [];
    selections = [];
    conflict = false;
    failBatch = false;
    records = [
        { Family_Id__c: " A " },
        { Family_Id__c: null },
        {},
        { Family_Id__c: "  " },
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
    assert.ok(outcome.missingFields.includes("City__c"));
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
