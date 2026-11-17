import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { reconstructLocalDatabase } from "../scripts/reconstruct-local-database.mjs";
const modulePath = process.env.PGLITE_MODULE;
test("local reconstruction creates twelve tables and refuses overwriting them", { skip: !modulePath }, async () => {
    const parent = await mkdtemp(path.join(tmpdir(), "bhg-rebuild-"));
    try {
        const directory = path.join(parent, "database");
        const result = await reconstructLocalDatabase(directory, modulePath);
        assert.equal(result.tables.length, 12);
        for (const table of ["housing_records", "students", "grades", "attendance", "metric_baselines", "sync_log"]) assert.ok(result.tables.includes(table));
        assert.equal(result.productionDataRecovered, false);
        await assert.rejects(reconstructLocalDatabase(directory, modulePath), /EEXIST/);
        await assert.rejects(reconstructLocalDatabase("postgresql://remote/database", modulePath), /local database directory/);
    } finally { await rm(parent, { recursive: true, force: true }); }
});
