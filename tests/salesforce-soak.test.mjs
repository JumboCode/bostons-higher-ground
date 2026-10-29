import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Opt-in integration soak. No application credentials are read. External
// authentication and Salesforce are controlled; SQL and Next after() are real.
test(
    "extended Salesforce lifecycle, contention, rollback and freshness smoke test",
    {
        skip:
            !process.env.SYNC_SOAK_MS ||
            !process.env.SYNC_MIGRATION_PGLITE_MODULE,
        timeout: Number(process.env.SYNC_SOAK_MS || 120000) + 90000,
    },
    async () => {
        Object.assign(globalThis, { AsyncLocalStorage, React });
        const load = createRequire(import.meta.url);
        const { PGlite } = await import(
            process.env.SYNC_MIGRATION_PGLITE_MODULE
        );
        const { drizzle } = load("drizzle-orm/pglite");
        const schema = load("../src/lib/schema.ts");
        const pg = new PGlite();
        const sqlDb = drizzle(pg, { schema });
        let failBatch = false;
        const batchSizes = [];
        // Neon batch's atomic transaction contract, executed with real PostgreSQL.
        sqlDb.batch = async (statements) =>
            pg.transaction(async (tx) => {
                batchSizes.push(statements.length);
                for (let i = 0; i < statements.length; i++) {
                    const statement = statements[i].toSQL();
                    if (failBatch && i === 1)
                        throw Error("injected insert failure after DELETE");
                    await tx.query(statement.sql, statement.params);
                }
            });
        let mode = "normal";
        let version = 0;
        let sourceCalls = 0;
        let pageDelay = 5;
        const rowsFor = () =>
            Array.from({ length: 1207 }, (_, i) => ({
                Family_Id__c:
                    i < 4
                        ? [null, undefined, "", "  "][i]
                        : `run-${version}-family-${i}`,
                City__c: `city-${version}`,
                Intake_Date__c: "2026-01-01",
                Date_Housed__c: "2026-02-01",
            }));
        let session = true;
        let permission = "admin";
        const originalLoad = Module._load;
        const leaf = () => null;
        Module._load = function (id, ...args) {
            if (
                id === "@/lib/db" ||
                (id === "./db" && args[0]?.filename?.includes("/src/lib/"))
            )
                return { db: sqlDb };
            if (id === "@/lib/auth")
                return {
                    auth: {
                        api: {
                            getSession: async () =>
                                session
                                    ? { user: { id: "smoke-admin" } }
                                    : null,
                        },
                    },
                };
            if (id === "@/lib/usersFunction")
                return { getUserPermission: async () => permission };
            if (
                id === "./client" &&
                args[0]?.filename?.endsWith("/salesforce/sync.ts")
            )
                return {
                    getSalesforceConnection: async () => {
                        sourceCalls++;
                        if (mode === "auth-failure")
                            throw Error("injected Salesforce auth failure");
                        const records = rowsFor();
                        return {
                            sobject: () => ({
                                describe: async () => ({
                                    fields: (mode === "missing-required"
                                        ? []
                                        : [
                                              "Family_Id__c",
                                              "Intake_Date__c",
                                              "Date_Housed__c",
                                              ...(mode === "missing-city"
                                                  ? []
                                                  : ["City__c"]),
                                          ]
                                    ).map((name) => ({ name })),
                                }),
                            }),
                            query: async () => {
                                await delay(pageDelay);
                                return {
                                    records: records.slice(0, 600),
                                    done: false,
                                    nextRecordsUrl: "page2",
                                };
                            },
                            queryMore: async () => {
                                await delay(pageDelay);
                                if (mode === "page-failure")
                                    throw Error(
                                        "injected Salesforce page failure"
                                    );
                                return {
                                    records: records.slice(600),
                                    done: true,
                                };
                            },
                        };
                    },
                };
            if (
                id === "@/components/FilterBar" ||
                /\.\/(housing|overview|education|schools)-client$/.test(id)
            )
                return { __esModule: true, default: leaf };
            return originalLoad.call(this, id, ...args);
        };
        let route, pages, Banner;
        try {
            route = load("../src/app/api/admin/sync/route.ts");
            pages = ["overview", "housing", "education", "schools"].map(
                (page) => load(`../src/app/reports/${page}/page.tsx`).default
            );
            Banner = load("../src/components/SyncStatusBanner.tsx").default;
        } finally {
            Module._load = originalLoad;
        }
        const { AfterContext } = load("next/dist/server/after/after-context");
        const { workAsyncStorage } = load(
            "next/dist/server/app-render/work-async-storage.external"
        );
        let expectedFailures = 0;
        const originalError = console.error;
        console.error = (...args) => {
            if (
                String(args[0]) === "[salesforce sync] fatal:" &&
                /injected|Required Salesforce/.test(String(args[1]))
            )
                expectedFailures++;
            else originalError(...args);
        };
        const request = () =>
            new Request("http://smoke.local/api/admin/sync", {
                method: "POST",
            });
        async function post() {
            const pending = [];
            const errors = [];
            let close;
            const afterContext = new AfterContext({
                waitUntil: (promise) => pending.push(promise),
                onClose: (callback) => {
                    close = callback;
                },
                onTaskError: (error) => errors.push(error),
            });
            const response = await workAsyncStorage.run({ afterContext }, () =>
                route.POST(request())
            );
            return {
                response,
                finish: async () => {
                    close?.();
                    await Promise.all(pending);
                    assert.deepEqual(errors, []);
                },
            };
        }
        const status = async () => {
            const response = await route.GET(
                new Request("http://smoke.local/api/admin/sync")
            );
            assert.equal(response.status, 200);
            return response.json();
        };
        const count = async () =>
            Number(
                (await pg.query("SELECT count(*) AS n FROM housing_records"))
                    .rows[0].n
            );
        const clientProps = (tree) =>
            tree.props.children[1].props.children.props;
        try {
            await pg.exec(`CREATE TABLE housing_records (
            id serial PRIMARY KEY, family_id text NOT NULL, intake_date date, date_housed date,
            current_status text, source_of_housing text, city text, zip_code text,
            school text, school_id text, student_count integer
        );
        CREATE TABLE metric_baselines (metric text PRIMARY KEY, starting_value integer NOT NULL,
            as_of_date date NOT NULL, updated_by text, updated_at timestamp DEFAULT now());
        CREATE TABLE students (id serial PRIMARY KEY, school_code integer, school_name varchar(50),
            student_id integer, grade_level varchar(5), first_name varchar(50), middle_name varchar(50),
            last_name varchar(50), address varchar(100), city varchar(50), zip integer);
        CREATE TABLE grades (id serial PRIMARY KEY, school_code integer, school_name varchar(50),
            student_id integer, rubric_code varchar(10), rubric_name varchar(255), f_mark numeric(3,1),
            w_mark numeric(3,1), final_mark numeric(3,1));
        CREATE TABLE attendance (id serial PRIMARY KEY, school_code integer, school_name varchar(50),
            student_id integer, days_present integer, days_absent integer, days_unexcused_absent integer,
            days_membership integer, ada numeric(4,2));`);
            for (const file of [
                "0003_eager_dazzler.sql",
                "0005_salesforce_sync_reliability.sql",
            ])
                await pg.exec(
                    await readFile(
                        new URL(`../drizzle/${file}`, import.meta.url),
                        "utf8"
                    )
                );

            session = false;
            assert.equal((await post()).response.status, 401);
            assert.equal((await route.GET(request())).status, 401);
            session = true;
            permission = "viewer";
            assert.equal((await post()).response.status, 403);
            assert.equal((await route.GET(request())).status, 403);
            permission = "admin";
            assert.equal(sourceCalls, 0);

            // Actual Next after(): work must remain paused until response-close.
            mode = "missing-city";
            let started = await post();
            assert.equal(started.response.status, 200);
            assert.equal(sourceCalls, 0);
            assert.equal((await status()).latest.status, "running");
            await started.finish();
            let state = await status();
            assert.equal(state.latest.status, "success");
            assert.equal(state.latest.rowsSynced, 1203);
            assert.equal(state.latest.rowsSkipped, 4);
            assert.ok(state.latestSuccess.missingFields.includes("City__c"));
            assert.equal(await count(), 1203);
            assert.equal(batchSizes.at(-1), 4); // DELETE + three insert chunks.
            const successfulId = state.latestSuccess.id;
            for (const failure of [
                "auth-failure",
                "missing-required",
                "page-failure",
                "batch-failure",
            ]) {
                mode = failure;
                failBatch = failure === "batch-failure";
                started = await post();
                assert.equal(started.response.status, 200);
                await started.finish();
                state = await status();
                assert.equal(state.latest.status, "error");
                assert.equal(state.latestSuccess.id, successfulId);
                assert.equal(await count(), 1203);
                assert.equal(
                    (
                        await pg.query(
                            "SELECT min(family_id) AS family FROM housing_records"
                        )
                    ).rows[0].family.startsWith("run-0-"),
                    true
                );
                const html = renderToStaticMarkup(
                    React.createElement(Banner, {
                        ...state,
                        triggerError: null,
                    })
                );
                assert.match(html, /City__c/);
                assert.match(html, /4 skipped/);
            }
            assert.equal(expectedFailures, 4);
            failBatch = false;
            mode = "normal";
            // Two stale observers must still create only one new worker.
            await pg.exec(
                "INSERT INTO sync_log (source, status, started_at) VALUES ('salesforce', 'running', now() - interval '11 minutes')"
            );
            const recovery = await Promise.all([post(), post()]);
            assert.deepEqual(
                recovery.map((item) => item.response.status).sort(),
                [200, 409]
            );
            await Promise.all(recovery.map((item) => item.finish()));
            assert.equal((await status()).latest.status, "success");
            console.log(
                "Smoke: auth guards, real after lifecycle, pagination/chunking, four failure modes, rollback and stale recovery passed."
            );

            const start = Date.now();
            let rounds = 0;
            let rejected = 0;
            while (Date.now() - start < Number(process.env.SYNC_SOAK_MS)) {
                version++;
                pageDelay = rounds === 0 ? 16000 : 15; // One deliberately slow 32-second sync.
                const beforeCalls = sourceCalls;
                const burst = await Promise.all(
                    Array.from({ length: 20 }, () => post())
                );
                assert.equal(
                    burst.filter((item) => item.response.status === 200).length,
                    1
                );
                assert.equal(
                    burst.filter((item) => item.response.status === 409).length,
                    19
                );
                rejected += 19;
                assert.equal(sourceCalls, beforeCalls);
                const completion = Promise.all(
                    burst.map((item) => item.finish())
                );
                // Poll while work is genuinely pending and ensure no second worker.
                const during = await status();
                assert.equal(during.latest.status, "running");
                const extra = await post();
                assert.equal(extra.response.status, 409);
                rejected++;
                await extra.finish();
                await completion;
                state = await status();
                assert.equal(state.latest.status, "success");
                assert.equal(sourceCalls, beforeCalls + 1);
                assert.equal(state.latest.rowsSynced, 1203);
                assert.equal(state.latest.rowsSkipped, 4);
                assert.equal(await count(), 1203);
                // Reuse the same imported page modules throughout; freshness must
                // come from per-render reads, without module reload/cold starts.
                for (const page of pages.slice(0, 2)) {
                    const props = clientProps(await page());
                    assert.equal(props.data.length, 1203);
                    assert.equal(
                        props.data[0].familyId,
                        `run-${version}-family-4`
                    );
                    assert.equal(props.data[0].city, `city-${version}`);
                }
                await pg.query(
                    "INSERT INTO students (student_id, first_name) VALUES ($1, $2)",
                    [version, `student-${version}`]
                );
                for (const page of pages.slice(2)) {
                    const props = clientProps(await page());
                    assert.equal(props.students.length, version);
                    assert.equal(
                        props.students.at(-1).firstName,
                        `student-${version}`
                    );
                }
                assert.equal(
                    Number(
                        (
                            await pg.query(
                                "SELECT count(*) AS n FROM sync_log WHERE status = 'running'"
                            )
                        ).rows[0].n
                    ),
                    0
                );
                rounds++;
                if (rounds === 1 || rounds % 10 === 0)
                    console.log(
                        `Smoke: ${rounds} rounds, ${rejected} overlapping requests rejected, ${Math.round((Date.now() - start) / 1000)}s elapsed.`
                    );
                await delay(500);
            }
            console.log(
                `Smoke PASS: ${rounds} successful soak syncs; ${rejected} concurrent starts rejected; ${version * 4} fresh report renders; ${Date.now() - start}ms soak duration.`
            );
        } finally {
            console.error = originalError;
            await pg.close();
        }
    }
);
