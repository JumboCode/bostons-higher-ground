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
test("days to house uses intake and housing from the same record, never across episodes", () => {
    const records = [
        // Housed in 2019 with no intake recorded, then a new 2023 intake: mixing
        // earliest intake (2023) with earliest housing (2019) would be negative.
        { ...row("A", "", "2019-05-01"), intakeDate: null },
        row("A", "2023-01-01", null),
        // Two episodes: first wait 31 days, later wait 10 days. Use the first housing.
        row("B", "2020-01-01", "2020-02-01"),
        row("B", "2024-01-01", "2024-01-11"),
        // An earlier intake with no housing must not stretch the wait.
        row("C", "2018-01-01", null),
        row("C", "2021-03-01", "2021-03-11"),
    ];
    const byId = Object.fromEntries(canonicalFamilies(records).map((f) => [f.familyId, f]));
    assert.equal(byId.A.daysToHouse, null);
    assert.equal(byId.B.daysToHouse, 31);
    assert.equal(byId.C.daysToHouse, 10);
    const model = buildChartModel("days-to-house-bar", records, { timeframe: "allTime" });
    assert.ok(model.type === "vertical-bar" && model.data.every((d) => d.value >= 0));
});
test("housing sources keep a family housed earlier that has since returned as active", () => {
    const records = [
        { ...row("A", "2020-01-01", "2020-03-01"), sourceOfHousing: "Rapid rehousing" },
        row("A", "2024-01-01", null), // Latest record: active again.
        { ...row("B", "2021-01-01", "2021-02-01"), sourceOfHousing: "Voucher" },
    ];
    const byId = Object.fromEntries(canonicalFamilies(records).map((f) => [f.familyId, f]));
    assert.equal(byId.A.currentStatus, "active"); // Current status is still the latest.
    assert.equal(byId.A.housedSource, "Rapid rehousing");
    const model = buildChartModel("housing-sources-donut", records, { timeframe: "allTime" });
    assert.deepEqual(
        model.type === "donut" && model.data.map((d) => [d.label, d.value]).sort(),
        [["Rapid rehousing", 1], ["Voucher", 1]]
    );
});
test("school and city student counts count each family once", () => {
    const withStudents = (familyId: string, intakeDate: string) => ({
        ...row(familyId, intakeDate, null),
        school: "Hale",
        studentCount: 2,
    });
    const records = [withStudents("A", "2020-01-01"), withStudents("A", "2024-01-01"), withStudents("B", "2024-01-01")];
    const total = (key: "partner-schools-bar" | "students-by-city-bar") => {
        const model = buildChartModel(key, records, { timeframe: "allTime" });
        return model.type === "horizontal-bar"
            ? model.data.flatMap((d) => d.series).reduce((n, s) => n + s.value, 0)
            : NaN;
    };
    assert.equal(total("partner-schools-bar"), 4); // 2 families x 2 students, not 6.
    assert.equal(total("students-by-city-bar"), 4);
});
