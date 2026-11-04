import test from "node:test";
import assert from "node:assert/strict";
import {
    buildChartModel,
    MIN_GROUP_SIZE,
    type ChartKey,
} from "../src/lib/chart-definitions";
import { getMockImpactData } from "../src/lib/mock-impact-data";

const source = getMockImpactData();

test("count charts hide buckets under MIN_GROUP_SIZE", () => {
    const keys: ChartKey[] = [
        "students-per-school-bar",
        "education-students-by-city-bar",
        "students-by-zip-bar",
        "grade-level-distribution-bar",
        "attendance-breakdown-donut",
    ];
    for (const key of keys) {
        const model = buildChartModel(key, source);
        const values =
            model.type === "horizontal-bar"
                ? model.data.flatMap((d) => d.series.map((s) => s.value))
                : model.data.map((d) => d.value);
        assert.ok(values.length > 0, `${key} empty`);
        assert.ok(values.every((v) => v >= MIN_GROUP_SIZE), `${key} leaks small bucket`);
    }
});

test("tiny school is suppressed from count and average charts", () => {
    for (const key of ["students-per-school-bar", "attendance-by-school-bar"] as ChartKey[]) {
        const model = buildChartModel(key, source);
        assert.equal(model.type, "horizontal-bar");
        if (model.type !== "horizontal-bar") return;
        const schools = model.data.map((d) => d.category);
        assert.ok(schools.includes("Mather Elementary"));
        assert.ok(!schools.includes("Tiny Pilot School"), key);
    }
});

test("filtering down to a tiny group empties the chart", () => {
    const model = buildChartModel("grade-distribution-bar", source, {
        selectedSchools: ["Tiny Pilot School"],
    });
    assert.equal(model.data.length, 0);
});
