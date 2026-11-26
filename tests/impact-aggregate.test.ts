import test from "node:test";
import assert from "node:assert/strict";
import type {
    HousingChartRecord,
    StudentRecord,
} from "../src/lib/chart-definitions";
import { buildImpactView, publishablePct } from "../src/lib/impact/aggregate";
import { SAMPLE_NEED, type NeedMetric } from "../src/lib/impact/need";
import type { StatRow } from "../src/lib/impact/stats";

type View = ReturnType<typeof buildImpactView>;
const rows = (v: View) => v.sections.flatMap((s) => s.rows);
const row = (v: View, id: string) => rows(v).find((r) => r.id === id);
/** A meter's value; fails the test if the row isn't a meter. */
function meter(v: View, id: string) {
    const r = row(v, id);
    assert.equal(r?.kind, "meter", `${id} should be a meter`);
    return r?.kind === "meter" ? r.value : undefined;
}
function list(v: View, id: string) {
    const r = row(v, id);
    assert.equal(r?.kind, "list", `${id} should be a list`);
    return r?.kind === "list" ? r.items : [];
}

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
    const view = buildImpactView(housing, noEducation, {}, SAMPLE_NEED);
    const worcester = view.areas.find((a) => a.place === "Worcester")!;
    assert.equal(worcester.impactPct, null);
    assert.equal(worcester.impactSmall, true);
    // 44 families, none housed: both sides of "housed" can't clear 10.
    assert.equal(meter(view, "housed"), null);
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
    const view = buildImpactView(housing, noEducation, {}, SAMPLE_NEED);
    assert.equal(meter(view, "housed"), 50);
    assert.equal(meter(view, "housedFast"), 50);
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
    assert.deepEqual(list(worcester, "schools"), []);
    const lowell = buildImpactView([], education, { town: "Lowell" }, null);
    assert.deepEqual(
        list(lowell, "schools").map((s) => s.pct),
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
    const view = buildImpactView(
        [...families(20, "Worcester"), ...families(20, "Cambridge")],
        noEducation,
        { town: "Worcester" },
        null
    );
    const { areas } = view;
    // No blue anywhere: no need meter, no need column, no need values.
    assert.equal(row(view, "need"), undefined);
    assert.ok(
        rows(view).every((r) => r.kind !== "meter" || r.side === "impact")
    );
    assert.ok(rows(view).every((r) => r.kind !== "list" || !r.showNeed));
    assert.ok(areas.every((a) => a.need === null));
    // Only places with a published share stay clickable (plus Boston).
    assert.deepEqual(
        areas.filter((a) => a.href).map((a) => a.place),
        ["Boston", "Cambridge", "Worcester"]
    );
});

test("the column has housing then education, need first", () => {
    const view = buildImpactView([], noEducation, {}, SAMPLE_NEED);
    assert.deepEqual(
        view.sections.map((s) => [s.title, s.rows.map((r) => r.id)]),
        [
            ["Housing", ["need", "housed", "housedFast", "topPlaces"]],
            ["Education", ["attendance", "schools"]],
        ]
    );
    const fast = row(view, "housedFast");
    assert.ok(
        fast?.kind === "meter" && fast.nested && fast.note === "of housed"
    );
});

test("need compares a neighborhood with Boston and a town with MA", () => {
    const hood = row(
        buildImpactView([], noEducation, { town: "Roxbury" }, SAMPLE_NEED),
        "need"
    );
    assert.ok(hood?.kind === "meter");
    assert.equal(hood.side, "need");
    assert.equal(hood.value, SAMPLE_NEED.valueFor("Roxbury"));
    assert.equal(hood.ref?.label, "Boston avg");

    const town = row(
        buildImpactView([], noEducation, { town: "Worcester" }, SAMPLE_NEED),
        "need"
    );
    assert.ok(town?.kind === "meter");
    assert.equal(town.ref?.label, "MA avg");

    // All of MA: the bar already is the average, so no tick.
    const all = row(buildImpactView([], noEducation, {}, SAMPLE_NEED), "need");
    assert.ok(all?.kind === "meter");
    assert.equal(all.ref, undefined);
    assert.match(all.label, /MA average/);
});

test("the places list carries each place's need value", () => {
    const view = buildImpactView(
        [...families(20, "Worcester"), ...families(20, "Cambridge")],
        noEducation,
        {},
        SAMPLE_NEED
    );
    const items = list(view, "topPlaces");
    assert.deepEqual(
        items.map((i) => [i.name, i.pct, i.need]),
        [
            ["Cambridge", 50, SAMPLE_NEED.valueFor("Cambridge")],
            ["Worcester", 50, SAMPLE_NEED.valueFor("Worcester")],
        ]
    );
});

test("a metric that pairs with a BHG figure turns its row into a pair", () => {
    const attendance: NeedMetric = {
        ...SAMPLE_NEED,
        key: "area-attendance",
        label: "Area students at 90%+ attendance",
        unit: "%",
        pairsWith: "attendance",
        valueFor: () => 61,
    };
    const view = buildImpactView(
        [],
        noEducation,
        { town: "Worcester" },
        SAMPLE_NEED,
        [attendance]
    );
    const pair = row(view, "attendance") as StatRow;
    assert.equal(pair.kind, "pair");
    if (pair.kind !== "pair") return;
    assert.equal(pair.need, 61);
    assert.equal(pair.impact, null); // no students: suppressed
    assert.deepEqual([pair.needLabel, pair.impactLabel], ["Area", "BHG"]);
    // Housing has no paired metric, so it stays a plain meter.
    assert.equal(row(view, "housed")?.kind, "meter");
});

test("every published BHG value is a whole number or null", () => {
    const view = buildImpactView(
        [
            ...families(13, "Worcester", {
                currentStatus: "housed",
                dateHoused: "2024-02-01",
            }),
            ...families(17, "Lowell"),
        ],
        {
            students: [
                ...students(11, "Worcester", "School A"),
                ...students(13, "Lowell", "School B"),
            ],
            attendance: [],
        },
        {},
        SAMPLE_NEED
    );
    const values = rows(view).flatMap((r) =>
        r.kind === "meter"
            ? [r.value]
            : r.kind === "pair"
              ? [r.need, r.impact]
              : r.items.map((i) => i.pct)
    );
    assert.ok(values.length > 0);
    assert.ok(values.every((v) => v === null || Number.isInteger(v)));
});
