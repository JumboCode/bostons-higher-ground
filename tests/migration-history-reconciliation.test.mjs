import test from "node:test";
import assert from "node:assert/strict";
import {
    reconcile,
    baselineMigrations,
    validateTarget,
} from "../scripts/lib/migration-history-reconciliation.mjs";
// Optional isolated PostgreSQL runtime; keep fresh checkouts independent of
// machine-local dependencies while still running target protection checks.
const pgliteModule =
    process.env.PGLITE_MODULE || process.env.SYNC_MIGRATION_PGLITE_MODULE;
const integration = (name, fn) => test(name, { skip: !pgliteModule }, fn);
async function fixture() {
    const { PGlite } = await import(pgliteModule);
    const db = new PGlite();
    for (const migration of baselineMigrations())
        for (const sql of migration.sql) await db.exec(sql);
    return db;
}
integration(
    "dry run leaves ledger absent and preserves application rows; apply records exact hashes and is idempotent",
    async () => {
        const db = await fixture();
        try {
            await db.query(
                `INSERT INTO sync_log(status, rows_synced) VALUES ('success', 17)`
            );
            assert.equal((await reconcile(db)).action, "would-record");
            assert.equal(
                (
                    await db.query(
                        `SELECT to_regclass('drizzle.__drizzle_migrations') AS name`
                    )
                ).rows[0].name,
                null
            );
            assert.equal(
                (await reconcile(db, { apply: true })).action,
                "recorded"
            );
            const rows = (
                await db.query(
                    "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at"
                )
            ).rows;
            assert.deepEqual(
                rows.map((r) => [r.hash, Number(r.created_at)]),
                baselineMigrations().map((m) => [m.hash, m.folderMillis])
            );
            assert.equal(
                (await reconcile(db, { apply: true })).action,
                "already-recorded"
            );
            assert.equal(
                (await db.query("SELECT rows_synced FROM sync_log")).rows[0]
                    .rows_synced,
                17
            );
        } finally {
            await db.close();
        }
    }
);
for (const [label, sql] of [
    ["missing column", "ALTER TABLE sync_log DROP COLUMN rows_skipped"],
    [
        "wrong default",
        "ALTER TABLE sync_log ALTER COLUMN source SET DEFAULT 'other'",
    ],
    [
        "wrong nullability",
        "ALTER TABLE sync_log ALTER COLUMN status DROP NOT NULL",
    ],
    ["missing unique index", "DROP INDEX sync_log_source_running_unique"],
    [
        "missing foreign key",
        "ALTER TABLE account DROP CONSTRAINT account_user_id_user_id_fk",
    ],
    [
        "extra column including already-applied 0006",
        "ALTER TABLE sync_log ADD COLUMN skipped_record_ids jsonb",
    ],
    [
        "wrong type",
        "ALTER TABLE sync_log ALTER COLUMN rows_skipped TYPE bigint",
    ],
])
    integration(`refuses ${label} and rolls back ledger creation`, async () => {
        const db = await fixture();
        try {
            await db.exec(sql);
            await assert.rejects(
                reconcile(db, { apply: true }),
                /Schema mismatch/
            );
            assert.equal(
                (
                    await db.query(
                        `SELECT to_regclass('drizzle.__drizzle_migrations') AS name`
                    )
                ).rows[0].name,
                null
            );
        } finally {
            await db.close();
        }
    });
integration(
    "refuses partial and mismatched nonempty ledgers without changing them",
    async () => {
        const db = await fixture();
        try {
            await db.exec(
                "CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)"
            );
            const first = baselineMigrations()[0];
            await db.query(
                "INSERT INTO drizzle.__drizzle_migrations(hash,created_at) VALUES ($1,$2)",
                [first.hash, first.folderMillis]
            );
            await assert.rejects(
                reconcile(db, { apply: true }),
                /Nonempty migration ledger/
            );
            assert.equal(
                (
                    await db.query(
                        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
                    )
                ).rows[0].n,
                1
            );
        } finally {
            await db.close();
        }
    }
);
test("target requires explicitly allowed Neon branch host and refuses production host", () => {
    assert.throws(() => validateTarget({}), /BRANCH_DATABASE_URL/);
    assert.throws(
        () =>
            validateTarget({
                BRANCH_DATABASE_URL:
                    "postgres://u:p@ep-child.us-east-2.aws.neon.tech/db",
            }),
        /allowlist/
    );
    assert.throws(
        () =>
            validateTarget({
                BRANCH_DATABASE_URL:
                    "postgres://u:p@ep-prod.us-east-2.aws.neon.tech/db",
                RECONCILE_ALLOWED_HOST: "ep-prod.us-east-2.aws.neon.tech",
                RECONCILE_PRODUCTION_HOST: "ep-prod.us-east-2.aws.neon.tech",
            }),
        /production/
    );
    assert.equal(
        validateTarget({
            BRANCH_DATABASE_URL:
                "postgres://u:p@ep-child.us-east-2.aws.neon.tech/db",
            RECONCILE_ALLOWED_HOST: "ep-child.us-east-2.aws.neon.tech",
            RECONCILE_PRODUCTION_HOST: "ep-prod.us-east-2.aws.neon.tech",
        }).hostname,
        "ep-child.us-east-2.aws.neon.tech"
    );
});
integration(
    "accepts an empty existing ledger and refuses a complete but corrupted ledger",
    async () => {
        const db = await fixture();
        try {
            await db.exec(
                "CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)"
            );
            assert.equal(
                (await reconcile(db, { apply: true })).action,
                "recorded"
            );
            await db.exec(
                "UPDATE drizzle.__drizzle_migrations SET hash='corrupt' WHERE id=1"
            );
            await assert.rejects(
                reconcile(db, { apply: true }),
                /Nonempty migration ledger/
            );
            assert.equal(
                (
                    await db.query(
                        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
                    )
                ).rows[0].n,
                6
            );
        } finally {
            await db.close();
        }
    }
);
integration(
    "failure during ledger insertion rolls back all inserted migration rows",
    async () => {
        const db = await fixture();
        try {
            await db.exec(
                `CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)`
            );
            let inserts = 0;
            const transport = {
                query(sql, args) {
                    if (
                        sql.startsWith(
                            "INSERT INTO drizzle.__drizzle_migrations"
                        ) &&
                        ++inserts === 3
                    )
                        throw new Error("injected third insert failure");
                    return db.query(sql, args);
                },
            };
            await assert.rejects(
                reconcile(transport, { apply: true }),
                /injected third insert failure/
            );
            assert.equal(inserts, 3);
            assert.equal(
                (
                    await db.query(
                        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
                    )
                ).rows[0].n,
                0
            );
        } finally {
            await db.close();
        }
    }
);
integration(
    "installed normal node-postgres Drizzle migrator applies only 0006 after reconciliation",
    async () => {
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { migrate } = await import("drizzle-orm/node-postgres/migrator");
        const db = await fixture();
        try {
            await db.query(
                "INSERT INTO sync_log(status, rows_synced) VALUES ('success', 23)"
            );
            await reconcile(db, { apply: true });
            // Run the real installed migrator/dialect/session; only its transport is
            // adapted to isolated PostgreSQL WASM rather than a network pg connection.
            const transport = {
                query: (config, values) =>
                    typeof config === "string"
                        ? db.query(config, values)
                        : db.query(config.text, values, {
                              rowMode:
                                  config.rowMode === "array"
                                      ? "array"
                                      : "object",
                          }),
            };
            const orm = drizzle(transport);
            await migrate(orm, {
                migrationsFolder: new URL("../drizzle", import.meta.url)
                    .pathname,
            });
            const ledger = (
                await db.query(
                    "SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at"
                )
            ).rows;
            assert.equal(ledger.length, 7);
            assert.equal(Number(ledger.at(-1).created_at), 1794096000000);
            assert.equal(
                (
                    await db.query(
                        "SELECT skipped_record_ids, rows_synced FROM sync_log"
                    )
                ).rows[0].rows_synced,
                23
            );
            await migrate(orm, {
                migrationsFolder: new URL("../drizzle", import.meta.url)
                    .pathname,
            });
            assert.equal(
                (
                    await db.query(
                        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
                    )
                ).rows[0].n,
                7
            );
        } finally {
            await db.close();
        }
    }
);
integration(
    "refuses ledger triggers that would silently discard migration rows",
    async () => {
        const db = await fixture();
        try {
            await db.exec(`CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations(id serial PRIMARY KEY, hash text NOT NULL, created_at bigint);
      CREATE FUNCTION public.discard_ledger_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NULL; END $$;
      CREATE TRIGGER discard_ledger BEFORE INSERT ON drizzle.__drizzle_migrations FOR EACH ROW EXECUTE FUNCTION public.discard_ledger_insert()`);
            await assert.rejects(
                reconcile(db, { apply: true }),
                /Schema mismatch.*ledger/i
            );
            assert.equal(
                (
                    await db.query(
                        "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations"
                    )
                ).rows[0].n,
                0
            );
        } finally {
            await db.close();
        }
    }
);
integration(
    "refuses rewrite rules changing baseline application writes",
    async () => {
        const db = await fixture();
        try {
            await db.exec(
                "CREATE RULE skip_sync_insert AS ON INSERT TO public.sync_log DO INSTEAD NOTHING"
            );
            await assert.rejects(
                reconcile(db, { apply: true }),
                /Schema mismatch/
            );
        } finally {
            await db.close();
        }
    }
);
integration(
    "rereads inserted ledger rows before claiming successful reconciliation",
    async () => {
        const db = await fixture();
        try {
            const transport = {
                query: (sql, args) =>
                    sql.startsWith("INSERT INTO drizzle.__drizzle_migrations")
                        ? Promise.resolve({ rows: [] })
                        : db.query(sql, args),
            };
            await assert.rejects(
                reconcile(transport, { apply: true }),
                /ledger verification/i
            );
            assert.equal(
                (
                    await db.query(
                        "SELECT to_regclass('drizzle.__drizzle_migrations') AS name"
                    )
                ).rows[0].name,
                null
            );
        } finally {
            await db.close();
        }
    }
);
