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
test("public impact counts first housing after cutoff once and excludes future/blank IDs", () => {
    const rows = [
        ...families(10, "2025-02-01"),
        ...families(10, "2025-03-01"),
        ...families(1, "2025-01-31", "old"),
        ...families(1, "2025-02-02", "old"),
        ...families(1, "2026-01-01", "future"),
        ...families(1, "2025-02-03", "2025-02-01"),
        { familyId: "  ", dateHoused: "2025-02-01", intakeDate: null },
    ];
    const result = buildPublicImpactData(rows, baseline, false, "2025-03-31");
    assert.equal(result.familiesHousedToDate, 120);
    assert.deepEqual(result.housingOverTime, [
        { month: "2025-01", familiesHoused: 0 },
        { month: "2025-02", familiesHoused: 10 },
        { month: "2025-03", familiesHoused: 10 },
    ]);
    assert.equal(result.minimumGroupSize, 10);
    assert.equal(result.asOfDate, "2025-03-31");
    assert.doesNotMatch(JSON.stringify(result), /familyId|intakeDate|old-0/);
});
test("small buckets and headline are withheld so subtraction cannot recover them", () => {
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
    assert.equal(result.familiesHousedToDate, null);
    assert.deepEqual(
        result.housingOverTime.map((p) => p.familiesHoused),
        [0, null, 10, 20]
    );
});
test("when hidden remainder is itself small, suppress total even with a large historical baseline", () => {
    const result = buildPublicImpactData(
        [...families(1, "2025-02-01"), ...families(2, "2025-03-01")],
        baseline,
        false,
        "2025-03-31"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.deepEqual(
        result.housingOverTime.map((p) => p.familiesHoused),
        [0, null, null]
    );
});
test("small totals and absent baselines do not publish misleading exact values", () => {
    assert.equal(
        buildPublicImpactData(
            families(3, "2025-02-01"),
            { ...baseline, startingValue: 0 },
            true,
            "2025-03-31"
        ).familiesHousedToDate,
        null
    );
    assert.equal(
        buildPublicImpactData([], baseline, false, "2025-03-31")
            .familiesHousedToDate,
        100
    );
    const missing = buildPublicImpactData([], null, false, "2025-03-31");
    assert.equal(missing.familiesHousedToDate, null);
    assert.deepEqual(missing.housingOverTime, []);
});
test("ten singleton months cannot be recovered from the headline", () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
        families(1, `2025-${String(i + 2).padStart(2, "0")}-01`)
    ).flat();
    const result = buildPublicImpactData(
        rows,
        { ...baseline, startingValue: 0 },
        true,
        "2025-11-30"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.equal(
        result.housingOverTime.filter((p) => p.familiesHoused === null).length,
        10
    );
});
test("upper-bound inference cannot recover three nine-family months", () => {
    const rows = [
        ...families(9, "2025-02-01"),
        ...families(9, "2025-03-01"),
        ...families(9, "2025-04-01"),
        ...families(10, "2025-05-01"),
    ];
    const result = buildPublicImpactData(
        rows,
        { ...baseline, startingValue: 0 },
        true,
        "2025-05-31"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.deepEqual(
        result.housingOverTime.map((p) => p.familiesHoused),
        [0, null, null, null, 10]
    );
});
test("headline does not reveal a small historical baseline by subtracting visible months", () => {
    const result = buildPublicImpactData(
        families(10, "2025-02-01"),
        { ...baseline, startingValue: 1 },
        false,
        "2025-02-28"
    );
    assert.equal(result.familiesHousedToDate, null);
    assert.equal(result.housingOverTime[1].familiesHoused, 10);
});
