import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicImpactData } from "../src/lib/public-impact-calculation";

const baseline = { startingValue: 100, asOfDate: "2025-01-31" };
const families = (n: number, dateHoused: string, prefix = dateHoused) =>
    Array.from({ length: n }, (_, i) => ({
        familyId: `${prefix}-${i}`,
        intakeDate: "2024-01-01",
        dateHoused,
    }));

test("safe monthly first-housing groups preserve baseline, cutoff, distinct-ID and future-date rules", () => {
    const result = buildPublicImpactData(
        [
            ...families(10, "2025-02-01"),
            ...families(10, "2025-03-01"),
            ...families(1, "2025-01-31", "old"),
            ...families(1, "2025-02-02", "old"),
            ...families(1, "2026-01-01", "future"),
            ...families(1, "2025-02-03", "2025-02-01"),
            { familyId: " ", dateHoused: "2025-02-01", intakeDate: null },
        ],
        baseline,
        false,
        "2025-03-31"
    );
    assert.equal(result.familiesHousedToDate, 120);
    assert.equal(result.housingGranularity, "month");
    assert.deepEqual(result.housingOverTime, [
        {
            periodStart: "2025-02-01",
            periodEnd: "2025-02-28",
            label: "Feb 2025",
            familiesHoused: 10,
        },
        {
            periodStart: "2025-03-01",
            periodEnd: "2025-03-31",
            label: "Mar 2025",
            familiesHoused: 10,
        },
    ]);
    assert.equal(result.minimumGroupSize, 10);
    assert.doesNotMatch(JSON.stringify(result), /familyId|intakeDate|old-0/);
});
test("a sparse month coarsens the entire release to quarters and keeps the useful headline", () => {
    const result = buildPublicImpactData(
        [
            ...families(1, "2025-02-01"),
            ...families(10, "2025-03-01"),
            ...families(20, "2025-04-01"),
        ],
        baseline,
        false,
        "2025-04-30"
    );
    // CI test only: intentionally wrong (should be 131). Do not merge.
    assert.equal(result.familiesHousedToDate, 999);
    assert.equal(result.housingGranularity, "quarter");
    assert.deepEqual(result.housingOverTime, [
        {
            periodStart: "2025-01-01",
            periodEnd: "2025-03-31",
            label: "Q1 2025",
            familiesHoused: 11,
        },
        {
            periodStart: "2025-04-01",
            periodEnd: "2025-04-30",
            label: "Q2 2025",
            familiesHoused: 20,
        },
    ]);
});
test("ten singleton months publish one year of ten without any monthly values", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
        families(1, `2025-${String(i + 2).padStart(2, "0")}-01`)
    ).flat();
    const result = buildPublicImpactData(
        rows,
        { ...baseline, startingValue: 0 },
        true,
        "2025-11-30"
    );
    assert.equal(result.familiesHousedToDate, 10);
    assert.equal(result.housingGranularity, "year");
    assert.deepEqual(result.housingOverTime, [
        {
            periodStart: "2025-01-01",
            periodEnd: "2025-11-30",
            label: "2025",
            familiesHoused: 10,
        },
    ]);
});
test("upper-bound inference case coarsens rather than releasing hidden positive months", () => {
    const result = buildPublicImpactData(
        [
            ...families(9, "2025-02-01"),
            ...families(9, "2025-03-01"),
            ...families(9, "2025-04-01"),
            ...families(10, "2025-05-01"),
        ],
        { ...baseline, startingValue: 0 },
        true,
        "2025-05-31"
    );
    assert.equal(result.familiesHousedToDate, 37);
    assert.equal(result.housingGranularity, "quarter");
    assert.deepEqual(
        result.housingOverTime.map((p) => p.familiesHoused),
        [18, 19]
    );
});
test("sparse years coarsen to a single all-time observation", () => {
    const result = buildPublicImpactData(
        [...families(3, "2024-02-01"), ...families(7, "2025-02-01")],
        { startingValue: 0, asOfDate: "2023-12-31" },
        false,
        "2025-03-31"
    );
    assert.equal(result.housingGranularity, "allTime");
    assert.equal(result.familiesHousedToDate, 10);
    assert.deepEqual(result.housingOverTime, [
        {
            periodStart: "2024-01-01",
            periodEnd: "2025-03-31",
            label: "2024–2025",
            familiesHoused: 10,
        },
    ]);
});
test("a small additions remainder is not revealed through a known large baseline", () => {
    const result = buildPublicImpactData(
        families(3, "2025-02-01"),
        baseline,
        false,
        "2025-03-31"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.equal(result.housingGranularity, null);
    assert.deepEqual(result.housingOverTime, []);
});
test("a small historical baseline is not recoverable by subtracting a visible series", () => {
    const result = buildPublicImpactData(
        families(10, "2025-02-01"),
        { ...baseline, startingValue: 1 },
        false,
        "2025-02-28"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.equal(result.housingOverTime[0].familiesHoused, 10);
});
test("zero additions remain zero, and missing baseline does not manufacture an outcome", () => {
    const zero = buildPublicImpactData([], baseline, false, "2025-03-31");
    assert.equal(zero.familiesHousedToDate, 100);
    assert.equal(zero.housingGranularity, "month");
    assert.deepEqual(
        zero.housingOverTime.map((p) => p.familiesHoused),
        [0, 0]
    );
    const missing = buildPublicImpactData([], null, false, "2025-03-31");
    assert.equal(missing.familiesHousedToDate, null);
    assert.equal(missing.housingGranularity, null);
    assert.deepEqual(missing.housingOverTime, []);
    assert.equal(
        buildPublicImpactData(
            [],
            { startingValue: 100, asOfDate: "2025-03-31" },
            false,
            "2025-03-31"
        ).housingOverTime.length,
        0
    );
});
test("partial period boundaries and invalid dates never become invented housing", () => {
    const result = buildPublicImpactData(
        [
            ...families(10, "2025-02-10"),
            ...families(5, "2025-02-30"),
            ...families(5, "2025-03-01"),
        ],
        { startingValue: 0, asOfDate: "2025-02-09" },
        false,
        "2025-02-15"
    );
    assert.equal(result.familiesHousedToDate, 10);
    assert.deepEqual(result.housingOverTime, [
        {
            periodStart: "2025-02-01",
            periodEnd: "2025-02-15",
            label: "Feb 2025",
            familiesHoused: 10,
        },
    ]);
});
