import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Optional isolated PostgreSQL runtime; install outside the repository and set
// this path to exercise the migration without credentials or a live database.
test("migration resolves historical duplicates and atomically excludes concurrent runs", {
    skip: !process.env.SYNC_MIGRATION_PGLITE_MODULE,
}, async () => {
    const { PGlite } = await import(process.env.SYNC_MIGRATION_PGLITE_MODULE);
    const db = new PGlite();
    try {
        await db.exec(await readFile(new URL("../drizzle/0003_eager_dazzler.sql", import.meta.url), "utf8"));
        await db.exec(`INSERT INTO sync_log (id, source, status, started_at) VALUES
            ('00000000-0000-0000-0000-000000000001', 'salesforce', 'running', '2026-10-27'),
            ('00000000-0000-0000-0000-000000000002', 'salesforce', 'running', '2026-10-28'),
            ('00000000-0000-0000-0000-000000000003', 'salesforce', 'success', '2026-10-26'),
            ('00000000-0000-0000-0000-000000000004', 'other', 'running', '2026-10-28');`);
        await db.exec("BEGIN");
        await db.exec(await readFile(new URL("../drizzle/0005_salesforce_sync_reliability.sql", import.meta.url), "utf8"));
        await db.exec("COMMIT");
        const { rows } = await db.query("SELECT id, status, rows_skipped FROM sync_log ORDER BY id");
        assert.deepEqual(rows.map(row => row.status), ["error", "running", "success", "running"]);
        assert.ok(rows.every(row => row.rows_skipped === null));
        await db.exec(await readFile(new URL("../drizzle/0006_skipped_salesforce_record_ids.sql", import.meta.url), "utf8"));
        assert.ok((await db.query("SELECT skipped_record_ids FROM sync_log")).rows.every(row => row.skipped_record_ids === null));
        await db.query("UPDATE sync_log SET skipped_record_ids = $1::jsonb WHERE status = 'success'", [JSON.stringify(["001000000000001AAA"])]);
        assert.deepEqual((await db.query("SELECT skipped_record_ids FROM sync_log WHERE status = 'success'")).rows[0].skipped_record_ids, ["001000000000001AAA"]);
        const claim = () => db.query("INSERT INTO sync_log (source, status) VALUES ('salesforce', 'running') ON CONFLICT DO NOTHING RETURNING id");
        assert.equal((await claim()).rows.length, 0);
        await db.exec("UPDATE sync_log SET status = 'success' WHERE source = 'salesforce' AND status = 'running'");
        const claims = await Promise.all([claim(), claim()]);
        assert.deepEqual(claims.map(result => result.rows.length).sort(), [0, 1]);
        await db.exec("INSERT INTO sync_log (source, status, rows_skipped) VALUES ('salesforce', 'success', 0), ('salesforce', 'error', NULL)");
        await assert.rejects(db.exec("INSERT INTO sync_log (source, status) VALUES ('salesforce', 'running')"), { code: "23505" });
    } finally {
        await db.close();
    }
});
