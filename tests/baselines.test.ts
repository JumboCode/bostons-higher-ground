import test from "node:test";
import assert from "node:assert/strict";
import {
    calculateHousedTotal,
    provisionalBaseline,
    validateBaseline,
} from "../src/lib/baseline-calculation";
const today = "2026-10-22";
const baseline = { startingValue: 100, asOfDate: "2025-06-30" };
test("counts only distinct families first housed after the inclusive cutoff", () => {
    const records = [
        { familyId: "before", dateHoused: "2025-06-29" },
        { familyId: "on", dateHoused: "2025-06-30" },
        { familyId: "new", dateHoused: "2025-07-01" },
        { familyId: "new", dateHoused: "2025-07-01" },
        { familyId: "before", dateHoused: "2025-08-01" },
        { familyId: "today", dateHoused: today },
        { familyId: "future", dateHoused: "2026-10-23" },
        { familyId: "missing", dateHoused: null },
        { familyId: "", dateHoused: "2025-08-01" },
        { familyId: "invalid", dateHoused: "2025-02-30" },
    ];
    assert.deepEqual(calculateHousedTotal(records, baseline, today), {
        additions: 2,
        total: 102,
    });
    assert.equal(
        calculateHousedTotal(
            records,
            { ...baseline, startingValue: 200 },
            today
        ).total,
        202
    );
    assert.equal(
        calculateHousedTotal(
            records,
            { startingValue: 100, asOfDate: today },
            today
        ).total,
        100
    );
});
test("accepts zero but rejects negative, fractional, unsafe, missing, invalid and future input", () => {
    assert.deepEqual(
        validateBaseline({ startingValue: 0, asOfDate: today }, today),
        { startingValue: 0, asOfDate: today }
    );
    for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER, "100", null]) {
        assert.throws(() =>
            validateBaseline({ startingValue: value, asOfDate: today }, today)
        );
    }
    for (const date of ["", "2025-02-30", "2026-10-23", "06/30/2025"]) {
        assert.throws(() =>
            validateBaseline({ startingValue: 100, asOfDate: date }, today)
        );
    }
    assert.throws(() => validateBaseline(null, today));
});

test("provisional zero baseline includes the first intake day's housing outcomes", () => {
    const records = [
        { familyId: "one", intakeDate: "2025-01-01", dateHoused: "2025-01-01" },
        { familyId: "two", intakeDate: "2025-02-01", dateHoused: "2025-03-01" },
        { familyId: "old", intakeDate: null, dateHoused: "2024-12-31" },
        { familyId: "bad", intakeDate: "2024-02-30", dateHoused: null },
        { familyId: "future", intakeDate: "2027-01-01", dateHoused: null },
    ];
    const initial = provisionalBaseline(records, today);
    assert.deepEqual(initial, { startingValue: 0, asOfDate: "2024-12-31" });
    assert.equal(calculateHousedTotal(records, initial!, today).total, 2);
    assert.equal(provisionalBaseline([], today), null);
    assert.equal(
        provisionalBaseline(
            [{ intakeDate: null }, { intakeDate: "invalid" }],
            today
        ),
        null
    );
});
