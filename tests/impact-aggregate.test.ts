import test from "node:test";
import assert from "node:assert/strict";
import type {
    HousingChartRecord,
    StudentRecord,
} from "../src/lib/chart-definitions";
import { buildImpactView, publishablePct } from "../src/lib/impact/aggregate";
import { SAMPLE_NEED } from "../src/lib/impact/need";

let nextId = 1;
type Family = Partial<HousingChartRecord> & { rows?: number };

/** `count` families in `city`; each family has `rows` Salesforce records. */
function families(count: number, city: string, opts: Family = {}) {
    const { rows = 1, ...fields } = opts;
    const prefix = `${city}-${nextId++}`;
    return Array.from({ length: count }, (_, i) =>
        Array.from(
            { length: rows },
            (): HousingChartRecord => ({
                id: nextId++,
                familyId: `${prefix}-${i}`,
                intakeDate: "2024-01-01",
                dateHoused: null,
                currentStatus: "active",
                sourceOfHousing: null,
                city,
                zipCode: null,
                school: null,
                schoolId: null,
                studentCount: null,
                ...fields,
            })
        )
    ).flat();
}

function students(count: number, city: string, schoolName: string) {
    return Array.from(
        { length: count },
        (): StudentRecord => ({
            studentId: nextId++,
            schoolName,
            gradeLevel: "3",
            city,
            zip: 0,
        })
    );
}

const noEducation = { students: [], attendance: [] };

test("publishablePct needs both sides over the threshold and rounds", () => {
    assert.equal(publishablePct(9, 100), null);
    assert.equal(publishablePct(95, 100), null); // only 5 left over
    assert.equal(publishablePct(10, 20), 50);
    assert.equal(publishablePct(12, 143), 8);
});

test("map shares are whole numbers, so exact counts can't be recovered", () => {
    const housing = [
        ...families(12, "Worcester"),
        ...families(17, "Lowell"),
        ...families(31, "Springfield"),
        ...families(83, "Cambridge"),
    ];
    const { areas } = buildImpactView(housing, noEducation, {}, SAMPLE_NEED);
    const shown = areas.filter((a) => a.impactPct !== null);
    assert.equal(shown.length, 4);
    assert.ok(shown.every((a) => Number.isInteger(a.impactPct)));
    assert.doesNotMatch(JSON.stringify(areas), /\d\.\d/);
});

test("families are counted once however many records they have", () => {
    const housing = [
        // 4 families x 3 records = 12 rows, but only 4 families.
        ...families(4, "Worcester", { rows: 3 }),
        ...families(40, "Cambridge"),
    ];
    const { areas, stats } = buildImpactView(
        housing,
        noEducation,
        {},
        SAMPLE_NEED
    );
    const worcester = areas.find((a) => a.place === "Worcester")!;
    assert.equal(worcester.impactPct, null);
    assert.equal(worcester.impactSmall, true);
    // 44 families, none housed: both sides of "housed" can't clear 10.
    assert.equal(stats.housed, null);
});

test("housed and housed-within-6-months use distinct families", () => {
    const housing = [
        // Housed in 60 days; duplicated rows must not double-count.
        ...families(10, "Cambridge", {
            rows: 2,
            currentStatus: "housed",
            dateHoused: "2024-03-01",
        }),
        // Housed after a year.
        ...families(10, "Cambridge", {
            currentStatus: "housed",
            dateHoused: "2025-01-15",
        }),
        ...families(20, "Cambridge"),
    ];
    const { stats } = buildImpactView(housing, noEducation, {}, SAMPLE_NEED);
    assert.equal(stats.housed, 50);
    assert.equal(stats.housedFast, 50);
});

test("a big group with too few others gets no share and no hatch", () => {
    const housing = [...families(15, "Worcester"), ...families(5, "Lowell")];
    const { areas } = buildImpactView(housing, noEducation, {}, SAMPLE_NEED);
    const worcester = areas.find((a) => a.place === "Worcester")!;
    assert.equal(worcester.impactPct, null);
    assert.equal(worcester.impactHidden, true);
    assert.equal(worcester.impactSmall, false);
    assert.equal(areas.find((a) => a.place === "Lowell")!.impactSmall, true);
});

test("a school is hidden when too few students are at other schools", () => {
    const education = {
        students: [
            ...students(10, "Worcester", "School A"),
            ...students(2, "Worcester", "School B"),
            ...students(10, "Lowell", "School C"),
            ...students(10, "Lowell", "School D"),
        ],
        attendance: [],
    };
    const worcester = buildImpactView(
        [],
        education,
        { town: "Worcester" },
        SAMPLE_NEED
    );
    assert.deepEqual(worcester.stats.schools, []);
    const lowell = buildImpactView([], education, { town: "Lowell" }, null);
    assert.deepEqual(
        lowell.stats.schools.map((s) => s.pct),
        [50, 50]
    );
});

test("unknown URL input falls back; a neighborhood opens the Boston view", () => {
    const bad = buildImpactView(
        [],
        noEducation,
        {
            town: "<script>",
            timeframe: "forever",
        },
        SAMPLE_NEED
    );
    assert.equal(bad.place, "all");
    assert.equal(bad.timeframe, "allTime");
    assert.equal(bad.view, "state");

    const hood = buildImpactView([], noEducation, { town: "Roxbury" }, null);
    assert.equal(hood.view, "boston");
    assert.equal(hood.areas.length, 23);
});

test("with the need layer off, no need values are published", () => {
    const { areas, stats } = buildImpactView(
        [...families(20, "Worcester"), ...families(20, "Cambridge")],
        noEducation,
        { town: "Worcester" },
        null
    );
    assert.equal(stats.need, null);
    assert.ok(areas.every((a) => a.need === null));
    // Only places with a published share stay clickable (plus Boston).
    assert.deepEqual(
        areas.filter((a) => a.href).map((a) => a.place),
        ["Boston", "Cambridge", "Worcester"]
    );
});
