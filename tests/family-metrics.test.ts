import test from "node:test";
import assert from "node:assert/strict";
import { canonicalFamilies } from "../src/lib/family-metrics";
import {
    buildChartModel,
    type HousingChartRecord,
} from "../src/lib/chart-definitions";

const row = (
    familyId: string,
    intakeDate: string,
    dateHoused: string | null,
    city = "Boston"
): HousingChartRecord => ({
    id: 1,
    familyId,
    intakeDate,
    dateHoused,
    city,
    currentStatus: dateHoused ? "housed" : "active",
    sourceOfHousing: "Voucher",
    zipCode: null,
    school: null,
    schoolId: null,
    studentCount: null,
});
test("canonical families trim IDs, ignore blank IDs, keep earliest dates and latest intake categories", () => {
    const records = [
        row(" A ", "2020-01-01", "2020-02-01"),
        row("A", "2024-01-01", "2024-02-01", "Cambridge"),
        row(" ", "2024-01-01", null),
    ];
    const families = canonicalFamilies(records);
    assert.equal(families.length, 1);
    assert.equal(families[0].familyId, "A");
    assert.equal(families[0].intakeDate, "2020-01-01");
    assert.equal(families[0].dateHoused, "2020-02-01");
    assert.equal(families[0].city, "Cambridge");
    assert.deepEqual(canonicalFamilies([...records].reverse()), families);
    assert.equal(records[0].familyId, " A ");
});
test("family charts count each family once and canonicalize before date filtering", () => {
    const records = [
        row("A", "2020-01-01", "2020-02-01"),
        row("A", "2024-01-01", "2024-02-01"),
        row("B", "2024-01-01", "2024-02-01"),
    ];
    for (const key of [
        "family-intake-bar",
        "families-housed-line",
        "housing-sources-donut",
    ] as const) {
        const model = buildChartModel(key, records, { timeframe: "allTime" });
        assert.equal(
            model.type === "horizontal-bar"
                ? 0
                : model.data.reduce((n, p) => n + p.value, 0),
            2,
            key
        );
    }
    const model = buildChartModel("families-housed-line", records, {
        timeframe: "custom",
        customRange: { from: new Date(2024, 0, 1), to: new Date(2024, 11, 31) },
    });
    assert.equal(
        model.type === "line" && model.data.reduce((n, p) => n + p.value, 0),
        1
    );
    const location = buildChartModel("location-bar", records, {
        timeframe: "allTime",
    });
    assert.equal(
        location.type === "horizontal-bar" &&
            location.data
                .flatMap((p) => p.series)
                .reduce((n, p) => n + p.value, 0),
        2
    );
});
