import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import { bostonToday } from "../src/lib/baseline-calculation";

const load = createRequire(import.meta.url);
const loader = Module as unknown as {
    _load: (id: string, ...args: unknown[]) => unknown;
};
const original = loader._load;
let serverOnly = false;
let cacheOptions: unknown;
let cacheArgs: unknown[] = [];
let session = true;
let admin = true;
let writes = 0;
let migrationRequired = false;
let tags: string[] = [];
const records = [
    { familyId: "A", intakeDate: "2020-01-01", dateHoused: "2020-02-01" },
    { familyId: " A ", intakeDate: "2024-01-01", dateHoused: "2024-02-01" },
    { familyId: "B", intakeDate: "2024-01-01", dateHoused: null },
];
loader._load = function (id, ...args) {
    if (id === "server-only") {
        serverOnly = true;
        return {};
    }
    if (id === "next/cache")
        return {
            unstable_cache: (
                fn: (...args: unknown[]) => unknown,
                _key: unknown,
                options: unknown
            ) => {
                cacheOptions = options;
                return (...args: unknown[]) => {
                    cacheArgs = args;
                    return fn(...args);
                };
            },
            revalidateTag: (tag: string) => tags.push(tag),
        };
    if (id === "./getAllData" || id === "@/lib/getAllData")
        return { getAllData: async () => records };
    if (id === "./baselines" || id === "@/lib/baselines")
        return {
            getHousedBaselineSummary: async () => ({
                baseline: { startingValue: 100, asOfDate: "2025-01-01" },
                migrationRequired,
                provisional: false,
            }),
        };
    if (id === "@/lib/auth")
        return {
            auth: {
                api: {
                    getSession: async () =>
                        session ? { user: { id: "admin" } } : null,
                },
            },
        };
    if (id === "@/lib/checkPermissions") return { isAdmin: async () => admin };
    if (id === "@/lib/db")
        return {
            db: {
                insert: () => ({
                    values: () => ({
                        onConflictDoUpdate: async () => {
                            writes++;
                        },
                    }),
                }),
            },
        };
    return original.call(this, id, ...args);
};
const { getPublicImpactData } = load(
    "../src/lib/getPublicImpactData"
) as typeof import("../src/lib/getPublicImpactData");
const baselineRoute = load(
    "../src/app/api/admin/baselines/route"
) as typeof import("../src/app/api/admin/baselines/route");
const counterRoute = load(
    "../src/app/api/reports/family-count-wait-time/route"
) as typeof import("../src/app/api/reports/family-count-wait-time/route");
loader._load = original;

test("public loader is server-only, tagged, day-keyed and returns aggregates without requiring a session", async () => {
    session = false;
    assert.equal(serverOnly, true);
    assert.deepEqual(cacheOptions, { tags: ["report-data"], revalidate: 300 });
    const result = await getPublicImpactData();
    assert.deepEqual(cacheArgs, [bostonToday()]);
    assert.equal(result.familiesHousedToDate, 100);
    assert.deepEqual(
        Object.keys(result).sort(),
        [
            "familiesHousedToDate",
            "housingOverTime",
            "housingGranularity",
            "asOfDate",
            "minimumGroupSize",
            "provisional",
        ].sort()
    );
    assert.doesNotMatch(JSON.stringify(result), /familyId|intakeDate/);
    migrationRequired = true;
    assert.equal((await getPublicImpactData()).familiesHousedToDate, null);
    migrationRequired = false;
    session = true;
});
test("baseline writes invalidate public/report data only after authorized success", async () => {
    const request = () =>
        new Request("http://localhost/api/admin/baselines", {
            method: "PUT",
            body: JSON.stringify({
                startingValue: 100,
                asOfDate: "2025-01-01",
            }),
        });
    session = false;
    assert.equal((await baselineRoute.PUT(request())).status, 401);
    session = true;
    admin = false;
    assert.equal((await baselineRoute.PUT(request())).status, 403);
    assert.equal(writes, 0);
    assert.deepEqual(tags, []);
    admin = true;
    assert.equal((await baselineRoute.PUT(request())).status, 200);
    assert.equal(writes, 1);
    assert.deepEqual(tags, ["report-data"]);
    tags = [];
});
test("family counter canonicalizes before filtering and does not read data without auth", async () => {
    const request = (filters: object) =>
        new Request("http://localhost/api/reports/family-count-wait-time", {
            method: "POST",
            body: JSON.stringify({ filters: JSON.stringify(filters) }),
        });
    session = false;
    assert.equal(
        (await counterRoute.POST(request({ timeframe: "allTime" }))).status,
        401
    );
    session = true;
    const response = await counterRoute.POST(request({ timeframe: "allTime" }));
    assert.deepEqual(await response.json(), {
        totalFamilies: 2,
        averageWaitDays: 31,
    });
    const filtered = await counterRoute.POST(
        request({
            timeframe: "custom",
            customRange: {
                from: new Date(2024, 0, 1),
                to: new Date(2024, 11, 31),
            },
        })
    );
    assert.deepEqual(await filtered.json(), {
        totalFamilies: 1,
        averageWaitDays: null,
    });
});
