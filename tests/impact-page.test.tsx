import test from "node:test";
import assert from "node:assert/strict";
import Module, { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PublicImpactData } from "../src/lib/public-impact-calculation";

Object.assign(globalThis, { React });
const load = createRequire(import.meta.url);
const loader = Module as unknown as {
    _load: (id: string, ...args: unknown[]) => unknown;
};
const original = loader._load;
let fail = false;
let total: number | null = 123;
const publicData = (): PublicImpactData => ({
    familiesHousedToDate: total,
    housingGranularity: "quarter",
    housingOverTime: [
        {
            periodStart: "2025-01-01",
            periodEnd: "2025-03-31",
            label: "Q1 2025",
            familiesHoused: 23,
        },
    ],
    asOfDate: "2025-03-31",
    provisional: false,
    minimumGroupSize: 10,
});
loader._load = function (id, ...args) {
    if (id === "@/lib/getPublicImpactData")
        return {
            getPublicImpactData: async () => {
                if (fail) throw new Error("private database error");
                return {
                    ...publicData(),
                    familyId: "private-family",
                    skippedRecordIds: ["private-account"],
                };
            },
        };
    if (id === "@/components/charts")
        return {
            ChartRenderer: ({
                model,
            }: {
                model: { title: string; data: unknown[] };
            }) => (
                <div>
                    {model.title} {JSON.stringify(model.data)}
                </div>
            ),
        };
    return original.call(this, id, ...args);
};
const Impact = load("../src/app/impact/page").default as (props: {
    searchParams: Promise<{ design?: string }>;
}) => Promise<React.ReactElement>;
loader._load = original;

for (const design of ["a", "b", "c", "constructor"]) {
    test(`impact design ${design} uses real housing totals and labels education as sample`, async () => {
        fail = false;
        total = 123;
        const html = renderToStaticMarkup(
            await Impact({ searchParams: Promise.resolve({ design }) })
        );
        assert.match(html, /123/);
        assert.match(html, /Q1 2025/);
        assert.match(html, /Education preview/);
        assert.match(html, /sample data/i);
        assert.doesNotMatch(
            html,
            /private-family|private-account|familyId|skippedRecordIds|>97<|out of 97|>81</
        );
    });
}
test("suppressed housing total displays unavailable, never zero or a housing mock", async () => {
    total = null;
    fail = false;
    const html = renderToStaticMarkup(
        await Impact({ searchParams: Promise.resolve({}) })
    );
    assert.match(html, /Not available/);
    assert.doesNotMatch(html, />81<|>97</);
});
test("database failure renders a public unavailable state without exposing the error or housing mocks", async () => {
    fail = true;
    const html = renderToStaticMarkup(
        await Impact({ searchParams: Promise.resolve({}) })
    );
    assert.match(html, /Housing data is temporarily unavailable/);
    assert.doesNotMatch(html, /private database error|Q1 2025|>81<|>97</);
    fail = false;
});
