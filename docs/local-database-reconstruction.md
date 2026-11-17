# Local database reconstruction

When Neon management access is unavailable, `scripts/lib/reconstructed-schema.sql` recreates the current 12-table application schema in an empty database. It supplements historical migrations, which omit housing_records and the three education tables. It includes 0006's sync diagnostics. It is not a production repair or a data backup.

Install `@electric-sql/pglite` separately in a temporary folder, then point `PGLITE_MODULE` at its `dist/index.js` and run:

```sh
node scripts/reconstruct-local-database.mjs /absolute/path/to/new-database-directory
```

The directory's parent must exist. Existing directories and connection URLs are refused. The script never loads environment files or connects to Neon. Application dependencies and DATABASE_URL are unchanged. The app still uses the Neon HTTP driver; connecting it to a local database requires separate adapter configuration.

All application tables start empty. Family/student records, passwords, reports, and historical sync results cannot be recovered from schema/query definitions. No migration ledger is fabricated. Refresh the standalone SQL from schema.ts when schema changes; do not run it on an existing database.

Validated locally: historical schema comparison, all 12 tables, family-count SQL, baseline updates, education queries, and sync uniqueness. This does not replace #114's stretch requirement to test reconciliation on a disposable child of the actual Neon database.
