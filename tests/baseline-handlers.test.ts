import test from "node:test";
import assert from "node:assert/strict";
import { createBaselineHandlers } from "../src/lib/baseline-handlers";
import type { HousedBaselineSummary } from "../src/lib/baselines";
const empty: HousedBaselineSummary = {
    baseline: null,
    additions: null,
    total: null,
    migrationRequired: false,
    provisional: false,
};
function request(body: unknown, origin = "http://localhost:3000") {
    return new Request("http://localhost:3000/api/admin/baselines", {
        method: "PUT",
        headers: { origin, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}
for (const status of [401, 403])
    test(`rejects ${status} without reading or saving data`, async () => {
        const handlers = createBaselineHandlers({
            authorize: async () => new Response(null, { status }),
            read: async () => {
                throw Error("must not read");
            },
            save: async () => {
                throw Error("must not save");
            },
        });
        assert.equal(
            (
                await handlers.GET(
                    new Request("http://localhost:3000/api/admin/baselines")
                )
            ).status,
            status
        );
        assert.equal(
            (
                await handlers.PUT(
                    request({ startingValue: 100, asOfDate: "2025-06-30" })
                )
            ).status,
            status
        );
    });
test("validates input, rejects cross-origin writes, and handles pending migration without saving", async () => {
    const handlers = createBaselineHandlers({
        authorize: async () => "admin",
        read: async () => ({ ...empty, migrationRequired: true }),
        save: async () => {
            throw Error("must not save");
        },
    });
    assert.equal(
        (
            await handlers.PUT(
                request({ startingValue: -1, asOfDate: "2025-06-30" })
            )
        ).status,
        400
    );
    assert.equal(
        (
            await handlers.PUT(
                request(
                    { startingValue: 100, asOfDate: "2025-06-30" },
                    "https://other.example"
                )
            )
        ).status,
        403
    );
    assert.equal(
        (
            await handlers.PUT(
                request({ startingValue: 100, asOfDate: "2025-06-30" })
            )
        ).status,
        503
    );
});
test("saves validated values with editor and returns the refreshed total", async () => {
    let summary: HousedBaselineSummary = empty;
    const handlers = createBaselineHandlers({
        authorize: async () => "admin",
        read: async () => summary,
        save: async (baseline, editor) => {
            assert.equal(editor, "admin");
            summary = {
                baseline,
                additions: 2,
                total: baseline.startingValue + 2,
                migrationRequired: false,
                provisional: false,
            };
        },
    });
    const response = await handlers.PUT(
        request({ startingValue: 100, asOfDate: "2025-06-30" })
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).total, 102);
    assert.equal(
        (await handlers.GET(new Request("http://localhost:3000"))).headers.get(
            "Cache-Control"
        ),
        "no-store"
    );
});
