import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
const migrationsFolder = fileURLToPath(
    new URL("../../drizzle", import.meta.url)
);
const manifestPath = new URL("./migration-baseline-0005.json", import.meta.url);
const snapshot = JSON.parse(
    fs.readFileSync(`${migrationsFolder}/meta/0005_snapshot.json`, "utf8")
);
// Snapshot 0005 also contains housing_records, which has no CREATE TABLE in
// migration history. Reconciliation covers only objects actually established by SQL.
const createdTables = new Set(
    baselineMigrations().flatMap((m) =>
        m.sql.flatMap((sql) =>
            [...sql.matchAll(/CREATE TABLE \"([^\"]+)\"/g)].map(
                (match) => match[1]
            )
        )
    )
);
export const tables = Object.keys(snapshot.tables)
    .map((name) => name.split(".")[1])
    .filter((name) => createdTables.has(name))
    .sort();
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
export function baselineMigrations() {
    const journal = JSON.parse(
        fs.readFileSync(`${migrationsFolder}/meta/_journal.json`, "utf8")
    );
    if (
        journal.entries
            .slice(0, 6)
            .some((e, i) => e.idx !== i || !e.tag.startsWith(`000${i}_`))
    )
        throw new Error("Unexpected migration journal baseline");
    return readMigrationFiles({ migrationsFolder }).slice(0, 6);
}
// Compare catalog-rendered definitions, including defaults, predicates, FK actions,
// validation, index validity, generated/identity columns and RLS. Unrelated tables
// are outside the baseline and deliberately ignored.
export async function inspectSchema(
    db,
    { schemaName = "public", tableNames = tables } = {}
) {
    const rows = (
        await db.query(
            `
    SELECT c.relname AS table_name, c.relkind, c.relrowsecurity, c.relforcerowsecurity,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', a.attname, 'type', format_type(a.atttypid,a.atttypmod),
        'not_null', a.attnotnull, 'default', pg_get_expr(d.adbin,d.adrelid),
        'identity', a.attidentity, 'generated', a.attgenerated,
        'collation', CASE WHEN a.attcollation = 0 THEN NULL ELSE co.collname END
      ) ORDER BY a.attname),'[]'::jsonb)
       FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
       LEFT JOIN pg_collation co ON co.oid=a.attcollation
       WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',con.conname,'definition',pg_get_constraintdef(con.oid),
         'validated',con.convalidated,'deferrable',con.condeferrable,'deferred',con.condeferred) ORDER BY con.conname),'[]'::jsonb)
       FROM pg_constraint con WHERE con.conrelid=c.oid) AS constraints,
      (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',ic.relname,'definition',pg_get_indexdef(i.indexrelid),
         'valid',i.indisvalid,'ready',i.indisready) ORDER BY ic.relname),'[]'::jsonb)
       FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid WHERE i.indrelid=c.oid) AS indexes,
      (SELECT count(*)::int FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal) AS user_triggers,
      (SELECT count(*)::int FROM pg_policy p WHERE p.polrelid=c.oid) AS policies,
      (SELECT count(*)::int FROM pg_rewrite r WHERE r.ev_class=c.oid) AS user_rules
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=$1 AND c.relname=ANY($2::text[]) ORDER BY c.relname
  `,
            [schemaName, tableNames]
        )
    ).rows;
    return rows;
}
function canonical(value) {
    if (Array.isArray(value))
        return JSON.stringify(value.map((v) => JSON.parse(canonical(v))));
    if (value && typeof value === "object")
        return JSON.stringify(
            Object.fromEntries(
                Object.keys(value)
                    .sort()
                    .map((k) => [k, JSON.parse(canonical(value[k]))])
            )
        );
    return JSON.stringify(value);
}
export function validateTarget(env) {
    if (env.PGOPTIONS?.trim())
        throw new Error(
            "PGOPTIONS must be unset; ambient startup options can redirect the Neon endpoint"
        );
    if (!env.BRANCH_DATABASE_URL)
        throw new Error(
            "BRANCH_DATABASE_URL is required; DATABASE_URL is never used"
        );
    const url = new URL(env.BRANCH_DATABASE_URL);
    const allowed = env.RECONCILE_ALLOWED_HOST;
    const production = env.RECONCILE_PRODUCTION_HOST;
    if (!allowed || url.hostname !== allowed)
        throw new Error(
            "Target must exactly match RECONCILE_ALLOWED_HOST allowlist"
        );
    if (!production)
        throw new Error(
            "RECONCILE_PRODUCTION_HOST must identify the protected production endpoint"
        );
    const neonHost = /^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/;
    if (!neonHost.test(production))
        throw new Error(
            "RECONCILE_PRODUCTION_HOST must be a Neon production endpoint hostname, not a URL"
        );
    const endpoint = (host) => host.replace("-pooler.", ".");
    if (endpoint(url.hostname) === endpoint(production))
        throw new Error("Refusing production endpoint");
    if (
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        !neonHost.test(url.hostname)
    )
        throw new Error(
            "Only an explicit Neon child branch endpoint is supported"
        );
    if (url.port && url.port !== "5432")
        throw new Error(
            "Only the standard PostgreSQL connection port is supported"
        );
    // pg-connection-string query parameters override the URL hostname. Neon
    // options can also override endpoint routing; reject all except known TLS keys.
    const seen = new Set();
    for (const [key, value] of url.searchParams) {
        if (seen.has(key) || !["sslmode", "channel_binding"].includes(key))
            throw new Error(
                "Unexpected connection parameter; only sslmode and channel_binding are accepted"
            );
        seen.add(key);
        if (key === "sslmode" && !["require", "verify-full"].includes(value))
            throw new Error("TLS certificate verification is required");
        if (key === "channel_binding" && value !== "require")
            throw new Error(
                "TLS channel binding must be require when specified"
            );
    }
    url.searchParams.set("sslmode", "verify-full");
    return url;
}
export async function reconcile(db, { apply = false } = {}) {
    const expected = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const migrations = baselineMigrations();
    if (
        canonical(expected.migrations) !==
        canonical(
            migrations.map((m) => ({
                hash: m.hash,
                created_at: m.folderMillis,
            }))
        )
    )
        throw new Error(
            "Local migrations differ from reviewed baseline manifest"
        );
    await db.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    try {
        await db.query(`SET LOCAL lock_timeout = '5s'`);
        await db.query(`SET LOCAL statement_timeout = '30s'`);
        await db.query("SET LOCAL search_path = pg_catalog, public");
        // Fixed application-specific key, shared by every invocation of this tool.
        await db.query("SELECT pg_advisory_xact_lock(1140005)");
        await db.query("CREATE SCHEMA IF NOT EXISTS drizzle");
        await db.query(
            "CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)"
        );
        await db.query(
            "LOCK TABLE drizzle.__drizzle_migrations IN ACCESS EXCLUSIVE MODE"
        );
        const ledgerSchema = await inspectSchema(db, {
            schemaName: "drizzle",
            tableNames: ["__drizzle_migrations"],
        });
        if (canonical(ledgerSchema) !== canonical(expected.ledgerSchema))
            throw new Error(
                "Schema mismatch in migration ledger; refusing unexpected columns, constraints, triggers, rules or row security"
            );
        await db.query(
            `LOCK TABLE ${tables.map((t) => `public.${quote(t)}`).join(", ")} IN ACCESS EXCLUSIVE MODE`
        );
        const actual = await inspectSchema(db);
        if (canonical(actual) !== canonical(expected.schema)) {
            const changed = tables.filter(
                (name) =>
                    canonical(
                        actual.find((r) => r.table_name === name) ?? null
                    ) !==
                    canonical(
                        expected.schema.find((r) => r.table_name === name) ??
                            null
                    )
            );
            throw new Error(
                `Schema mismatch in: ${changed.join(", ")}. Requires exact cumulative 0000–0005 schema; 0006/extras require separate review.`
            );
        }
        const readLedger = async () =>
            (
                await db.query(
                    "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at, id"
                )
            ).rows.map((r) => ({
                hash: r.hash,
                created_at: Number(r.created_at),
            }));
        const ledger = await readLedger();
        if (
            ledger.length &&
            canonical(ledger) !== canonical(expected.migrations)
        )
            throw new Error(
                "Nonempty migration ledger is partial or mismatched; refusing to repair it"
            );
        let action = "already-recorded";
        if (!ledger.length) {
            action = apply ? "recorded" : "would-record";
            for (const m of expected.migrations)
                await db.query(
                    "INSERT INTO drizzle.__drizzle_migrations(hash, created_at) VALUES ($1, $2)",
                    [m.hash, m.created_at]
                );
        }
        if (canonical(await readLedger()) !== canonical(expected.migrations))
            throw new Error(
                "Migration ledger verification failed after insertion; rolling back"
            );
        await db.query(apply ? "COMMIT" : "ROLLBACK");
        return {
            action,
            migrations: expected.migrations.length,
            nextMigration: "0006_skipped_salesforce_record_ids",
        };
    } catch (error) {
        await db.query("ROLLBACK");
        throw error;
    }
}
