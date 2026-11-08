#!/usr/bin/env node
import { createRequire } from "node:module";
import {
    reconcile,
    validateTarget,
} from "./lib/migration-history-reconciliation.mjs";
const args = process.argv.slice(2);
if (args.includes("--help")) {
    console.log(
        "Usage: node scripts/reconcile-migration-history.mjs [--apply]\nDefault: transactional dry run. Requires BRANCH_DATABASE_URL, RECONCILE_ALLOWED_HOST and RECONCILE_PRODUCTION_HOST. Stop application/migration writers before execution."
    );
} else {
    let client;
    try {
        if (args.some((arg) => arg !== "--apply") || args.length > 1)
            throw new Error("Only --apply or --help is supported");
        const target = validateTarget(process.env);
        const { Client } = createRequire(import.meta.url)("pg");
        client = new Client({
            connectionString: target.toString(),
            connectionTimeoutMillis: 10000,
            options: "-c search_path=pg_catalog,public",
        });
        await client.connect();
        console.log(
            JSON.stringify(
                await reconcile(client, { apply: args.includes("--apply") })
            )
        );
    } catch (error) {
        // Database errors can contain SQL, connection credentials or application data.
        // Expose only our reviewed validation messages or a PostgreSQL error code.
        const safe =
            /^(BRANCH_DATABASE_URL|PGOPTIONS|TLS |Target must|RECONCILE_PRODUCTION_HOST|Refusing production|Only |Unexpected connection|Unexpected migration|Local migrations|Schema mismatch|Nonempty migration ledger|Migration ledger verification)/;
        console.error(
            safe.test(error.message)
                ? error.message
                : `Reconciliation failed${error.code ? ` (${error.code})` : ""}; no successful reconciliation was reported.`
        );
        process.exitCode = 1;
    } finally {
        if (client) await client.end();
    }
}
