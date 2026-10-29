# Salesforce sync reliability (#108)

## Request and data lifecycle

`POST /api/admin/sync` still requires an authenticated admin. It creates a
`running` log row and returns its ID immediately. The job is now registered with
`after()` from `next/server`, and its callback awaits `runSalesforceSync()`.
Next/Vercel can therefore keep the invocation alive after sending the response.
The route exports `runtime = "nodejs"` and `maxDuration = 300` seconds. See
[Next's after documentation](https://nextjs.org/docs/app/api-reference/functions/after).
Confirm that the deployment's function limits support that duration.

This is bounded background work, not a durable queue: a platform timeout or
process crash can still interrupt it. Existing recovery marks a running attempt
older than ten minutes as errored when the next POST arrives. The stale-row
update now also checks `status = 'running'`, so it cannot overwrite a success
that finished between the read and update. Increase the stale threshold if the
execution budget is ever raised beyond it. Automatic retries are not added.

The initial running-row read gives a fast 409. The new partial unique index,
`sync_log_source_running_unique`, enforces one running row **per source** even
when two requests both read no active job. The insert uses `ON CONFLICT DO
NOTHING`; the losing request returns 409 and the active row when still present,
without scheduling work. Completed and failed attempts remain unrestricted.

Salesforce paging, field validation, and the atomic Neon batch replacement of
`housing_records` are retained. Missing required *field definitions* abort the
job. Records whose mapped `familyId` is missing, null, empty, or whitespace are
omitted. `rowsSkipped` counts these omissions across all pages;
`rowsSynced + rowsSkipped` equals the number of fetched records on success.
Counts and optional missing-field warnings are stored after a successful data
replacement. Failed attempts do not claim successful counts. Historical rows
have `rowsSkipped = null` (unknown), while a new run with no omissions records 0.

The admin banner now uses `latestSuccess` for missing-field warnings and skipped
counts. Those warnings remain visible during a later running/failed attempt or
start error because they describe the dataset still in the dashboards. The
banner was extracted to `src/components/SyncStatusBanner.tsx` for rendering tests.

Overview already fetched inside its async component with `force-dynamic`, so it
needed no change. Housing, education, and schools now do the same: database reads
occur per server request rather than at module initialization, and dynamic
rendering prevents a static build artifact from freezing them. The existing
admin polling still refreshes server components on success. Salesforce currently
loads housing records only; education/schools continue to read their own tables.

## Migration 0005: preparation and rollout

**Prepared locally; not applied to any application database during this change.**

1. Generated the migration with `node node_modules/drizzle-kit/bin.cjs generate
   --name salesforce_sync_reliability`, updating the Drizzle journal and adding
   snapshot 0005.
2. Reviewed the generated SQL. Older snapshots omit the existing `attendance`,
   `grades`, and `students` tables (also documented in `admin-baselines.md`).
   Removed those unrelated CREATE TABLE statements and kept the same gap in
   snapshot 0005. This issue does not repair that historical migration drift;
   future generators may propose those tables again.
3. Added duplicate cleanup before the index. For each source, the newest running
   attempt is retained (`started_at DESC`, then UUID DESC for ties); older
   running attempts are marked error with a migration-specific message and
   finish time. Success/error history and housing data are untouched.
4. Added nullable integer `rows_skipped`, with no fabricated historical backfill,
   and the unique index on `(source) WHERE status = 'running'`.

Roll out the database change **before** deploying code that reads the new column.
Use a maintenance window: prevent new sync starts and wait for old workers to
finish or exceed the ten-minute stale window. Changing log status does not stop
an already running worker, so do not run duplicate cleanup alongside active old
workers. Back up the database and inspect running attempts first:

```sql
SELECT id, source, status, started_at FROM sync_log
WHERE status = 'running' ORDER BY source, started_at DESC;
```

For an environment with a complete, accurately tracked migration history, run
`pnpm exec drizzle-kit migrate` with its `DATABASE_URL` set. The config imports
`.env`, not `.env.local`; export the intended URL explicitly without printing it.

The existing baseline documentation says migration 0004 was applied directly,
without replaying the chain. **Do not blindly replay the full chain against that
database.** Check its migration ledger first. If continuing that established
manual approach, apply only 0005 once, transactionally, using a PostgreSQL client:

```sh
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 --single-transaction \
  -f drizzle/0005_salesforce_sync_reliability.sql
```

Record that manual application in the environment's deployment log and reconcile
the Drizzle ledger before later using the automatic migrator. The SQL is
intentionally not idempotent; do not run it again after success. Transactional
application ensures duplicate cleanup and index creation succeed together.
Verify before deploying the app:

```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sync_log'
  AND column_name = 'rows_skipped';
SELECT indexdef FROM pg_indexes
WHERE schemaname = 'public' AND indexname = 'sync_log_source_running_unique';
SELECT source, count(*) FROM sync_log WHERE status = 'running'
GROUP BY source HAVING count(*) > 1; -- expect no rows
```

Then deploy, trigger Update Data, confirm immediate response and eventual success,
check synced/skipped counts, and navigate to all four reports to verify fresh
data. Two overlapping POSTs should yield one job and a 409. Test a failed attempt
after a successful run and confirm the older dataset's warnings remain visible.

Rollback: roll back application code first. The extra nullable column and index
can remain; removing them requires `DROP INDEX sync_log_source_running_unique`
and `ALTER TABLE sync_log DROP COLUMN rows_skipped` in a maintenance window.
Removing the index restores the race. Duplicate cleanup changes are historical
log corrections and are not automatically reversed.

## Validation

Run the complete local suite and static checks:

```sh
node --import tsx --test tests/*.test.ts tests/*.test.tsx tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build
```

The existing baseline aggregate integration test skips without `DATABASE_URL`.
The sync tests replace external database/Salesforce boundaries and exercise the
real sync and POST handler. Banner tests render HTML for success, running,
failed, and never-synced states. A separate PostgreSQL migration test exercises
the SQL, historical duplicate cleanup, nullable history, and competing claims
without connecting to an application database. To run it with an isolated
PGlite installation (no project dependency changes):

```sh
npm install --prefix /private/tmp/bhg-sync-migration-check --no-save \
  --package-lock=false @electric-sql/pglite
SYNC_MIGRATION_PGLITE_MODULE=/private/tmp/bhg-sync-migration-check/node_modules/@electric-sql/pglite/dist/index.js \
  node --test tests/sync-migration.test.mjs
```

Vercel lifecycle behavior and Salesforce credentials still require the deployment
smoke test above; local doubles do not validate the hosting platform or live org.

### Results from this implementation

- Full suite with the isolated migration runtime: **18 passed, 1 skipped**.
  The skipped test is `database aggregate preserves cutoff, duplicate,
  whitespace and future-date rules`, which requires `DATABASE_URL`.
- TypeScript check and production Turbopack build passed. Build output confirms
  overview, housing, education, and schools are dynamic routes.
- ESLint passed with 24 pre-existing warnings and no errors.
- The initial sandboxed build failed because Turbopack could not bind a worker
  port; rerunning with approved access passed. The temporary PGlite download
  likewise required approved network access. No project dependencies changed.
- Final independent code review found no actionable issues.
- No live Salesforce sync, application database migration, deployment, or push
  was performed. Migration 0005 still needs the rollout steps above.

## Extended local smoke test

`tests/salesforce-soak.test.mjs` is an opt-in integration soak, separate from the
fast default suite. It uses isolated PostgreSQL with the real Drizzle queries,
POST/GET handlers, sync implementation, server page components, banner renderer,
and the installed Next.js `after()` / `AfterContext` lifecycle. Authentication
and Salesforce responses are controlled. Leaf chart components are replaced to
inspect the actual data passed by each server page; this is not a browser test.
The Neon HTTP batch boundary is backed by an isolated PostgreSQL transaction,
so rollback is exercised using real SQL without contacting Neon.

Run after installing the temporary PGlite runtime described above:

```sh
NODE_PATH=/private/tmp/bhg-sync-migration-check/node_modules \
SYNC_MIGRATION_PGLITE_MODULE=/private/tmp/bhg-sync-migration-check/node_modules/@electric-sql/pglite/dist/index.js \
SYNC_SOAK_MS=120000 \
  node --import tsx --test tests/salesforce-soak.test.mjs
```

The run checks:

- Anonymous and non-admin requests return 401/403 without starting work.
- Next's actual `after()` callback stays paused until the simulated response
  closes, then its `waitUntil` promise covers the awaited sync.
- A 1,207-record paginated source produces 1,203 inserts in three chunks and
  four skipped records; the counts agree with the resulting table.
- Authentication failure, missing required field definitions, pagination failure,
  and an insert failure after DELETE all end in error while retaining the prior
  successful data and banner warnings. The insert failure rolls back the DELETE.
- Two stale-run recovery requests produce one new worker.
- Sustained bursts of 20 simultaneous starts, plus another start during each
  active sync, produce one successful job and 20 rejected starts per round.
- One sync intentionally takes at least 32 seconds. Later rounds repeatedly
  replace data; each round renders all four report server components from the
  same imported modules and confirms they receive the new database contents.
- Completed rounds leave no running log rows.

This test never reads `.env.local` or applies migrations to an application
database. Vercel lifecycle enforcement, real Salesforce authentication, and
browser polling/navigation remain deployment smoke checks.

Recorded extended-run result: **PASS**, 120,691 ms of sustained soak (about
123 seconds total including setup/failure checks), **131 successful soak syncs**,
**2,620 overlapping starts rejected**, and **524 fresh server-page renders**.
No stuck running rows or data-loss failures were observed. The fast full suite
also passed: 18 tests passed; the live baseline aggregate test and the opt-in
soak test were skipped in that separate fast invocation. The soak itself ran
explicitly and passed as reported above. TypeScript and `npm run lint` passed
again, with the same 24 existing lint warnings. No production code changes were
needed as a result of the extended test.
