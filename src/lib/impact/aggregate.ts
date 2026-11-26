// Turns raw housing + education rows into the numbers the public /impact page
// may publish. Pure (no database, no Next), so the privacy rules are unit-tested
// in tests/impact-aggregate.test.ts. page.tsx loads the rows and renders.
//
// Privacy rules (MIN_GROUP_SIZE):
//   - Housing counts are distinct families (canonicalFamilies), never Salesforce
//     rows: one family with three intake records is one family.
//   - Education counts are distinct students (currentStudents), never student
//     rows: a student listed at two schools counts once, at their current one.
//   - A share is published only if the group AND everyone else clear the
//     threshold, so "12 of 14" can't reveal the other 2. This also hides 0%/100%.
//   - Every percentage is a whole number. Unrounded shares would let anyone
//     recover the exact total and every count from the ratios between them.
// Server-only (places/need import the map shapes).

import {
    filterCommonRecords,
    MIN_GROUP_SIZE,
    type AttendanceRecord,
    type ChartFilters,
    type HousingChartRecord,
    type StudentRecord,
} from "@/lib/chart-definitions";
import { canonicalFamilies } from "@/lib/family-metrics";
import type { Timeframe } from "@/lib/filterStore";

import { ALL, BOSTON, type MapArea, type MapView } from "./mapShared";
import { averageNeed, type NeedMetric } from "./need";
import {
    BOSTON_NEIGHBORHOODS,
    isNeighborhood,
    MA_TOWNS,
    placeOf,
    type Place,
} from "./places";
import type { StatRow, StatSection } from "./stats";

export const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: "allTime", label: "All time" },
    { value: "pastTwoYears", label: "Past 2 years" },
    { value: "thisFY", label: "This fiscal year" },
];
/** "Housed within 6 months". */
const FAST_DAYS = 183;
/** Under a suppressed BHG figure. */
const TOO_FEW = "Too few to show";

/**
 * Whole-number share of `whole`, or null when it is too small to publish.
 * Both sides must clear the threshold: "1 of 11" shows as 9% and would reveal
 * a single family.
 */
export function publishablePct(part: number, whole: number) {
    return [whole, part, whole - part].some((n) => n < MIN_GROUP_SIZE)
        ? null
        : Math.round((part / whole) * 100);
}

// Many families are housed without a dateHoused in Salesforce, so the status counts too.
const isHoused = (h: HousingChartRecord) =>
    Boolean(h.dateHoused) || h.currentStatus?.toLowerCase() === "housed";
// Families whose outcome is recorded (any status or a housed date).
const hasOutcome = (h: HousingChartRecord) =>
    Boolean(h.dateHoused || h.currentStatus?.trim());

function countBy<T>(items: T[], key: (t: T) => string | null) {
    const m = new Map<string, number>();
    for (const t of items) {
        const k = key(t);
        if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
}

/**
 * One row per student: the student table has no unique student ID, so a
 * student can appear more than once (re-imports, a school transfer). Keeps
 * the current row, i.e. the most recently inserted (highest serial `id`);
 * rows without an id fall back to the later one in the list.
 */
export function currentStudents<T extends StudentRecord>(rows: T[]) {
    const byStudent = new Map<number, T>();
    for (const s of rows) {
        const prev = byStudent.get(s.studentId);
        if (!prev || (s.id ?? Infinity) >= (prev.id ?? -Infinity))
            byStudent.set(s.studentId, s);
    }
    return [...byStudent.values()];
}

/** Filter link for a map area or bar. Layer is client-only, so it's left out. */
export function impactHref(place: string, timeframe: Timeframe) {
    const q = new URLSearchParams({ town: place });
    if (timeframe !== "allTime") q.set("timeframe", timeframe);
    return `/impact?${q}`;
}

export type ImpactQuery = { town?: string; timeframe?: string };
export type EducationRows = {
    students: StudentRecord[];
    attendance: AttendanceRecord[];
};

export function buildImpactView(
    rawHousing: HousingChartRecord[],
    education: EducationRows,
    query: ImpactQuery,
    /** The map's need layer; null when it is turned off (e.g. sample data in production). */
    need: NeedMetric | null
) {
    const housing = rawHousing.map((h) => ({
        ...h,
        ...placeOf(h.city, h.zipCode),
    }));
    const students = currentStudents(education.students).map((s) => ({
        ...s,
        ...placeOf(s.city, s.zip),
    }));

    // Places outside the map (e.g. other states) are still selectable once
    // enough distinct families live there.
    const mapped = new Set([...MA_TOWNS, ...BOSTON_NEIGHBORHOODS]);
    const otherPlaces = [...countBy(canonicalFamilies(housing), (h) => h.town)]
        .filter(([t, n]) => !mapped.has(t) && n >= MIN_GROUP_SIZE)
        .map(([t]) => t)
        .sort();

    // Untrusted URL input: anything unknown falls back to the default.
    const selectable = new Set([...mapped, ...otherPlaces]);
    const place = selectable.has(query.town ?? "") ? query.town! : ALL;
    const timeframe =
        TIMEFRAMES.find((t) => t.value === query.timeframe)?.value ?? "allTime";

    const selectedHood = place !== ALL && isNeighborhood(place);
    const view: MapView = place === BOSTON || selectedHood ? "boston" : "state";
    const inArea = (p: Place) =>
        place === ALL ||
        (selectedHood ? p.neighborhood === place : p.town === place);

    // ---- Housing ----------------------------------------------------------
    const filters: ChartFilters = {
        selectedLocations: [],
        selectedSchools: [],
        timeframe,
    };
    // filterCommonRecords returns the same objects, so a Set keeps our place
    // fields. Families are then merged from their in-window records only (as
    // chart-definitions does), so a returning family counts in recent windows.
    const keep = new Set(filterCommonRecords(housing, filters));
    const inTimeframe = canonicalFamilies(housing.filter((h) => keep.has(h)));
    const families = inTimeframe.filter(inArea);
    const recorded = families.filter(hasOutcome);
    const housed = recorded.filter(isHoused);
    // daysToHouse takes intake and housing from the same record and is null
    // when no record has both, so those families are left out of both sides.
    const housingDays = housed.flatMap((f) =>
        f.daysToHouse === null ? [] : [f.daysToHouse]
    );
    const housedFast = housingDays.filter((d) => d <= FAST_DAYS);

    // ---- Map areas --------------------------------------------------------
    // State view: share of families with a known town.
    // Boston view: share of Boston families with a known neighborhood.
    const counts =
        view === "state"
            ? countBy(inTimeframe, (h) => h.town)
            : countBy(
                  inTimeframe.filter((h) => h.town === BOSTON),
                  (h) => h.neighborhood
              );
    const known = [...counts.values()].reduce((a, n) => a + n, 0);
    const shapes = view === "state" ? MA_TOWNS : BOSTON_NEIGHBORHOODS;
    const areas: MapArea[] = shapes.map((name) => {
        const n = counts.get(name) ?? 0;
        const impactPct = publishablePct(n, known);
        const small = n > 0 && n < MIN_GROUP_SIZE;
        const needValue = need?.valueFor(name) ?? null;
        const clickable =
            impactPct !== null ||
            needValue !== null ||
            (view === "state" && name === BOSTON);
        return {
            place: name,
            impactPct,
            impactSmall: small,
            // Big enough, but everyone else isn't: no number, no circle.
            impactHidden: impactPct === null && n >= MIN_GROUP_SIZE,
            need: needValue,
            href: clickable ? impactHref(name, timeframe) : null,
        };
    });
    const shareOf =
        view === "state"
            ? "families with a known town"
            : "Boston families with a known neighborhood";
    // The list ranks every area on the map, not just the selected one, so say
    // so whenever a single place is selected.
    const listScope =
        place === ALL || place === BOSTON
            ? ""
            : view === "state"
              ? ", across Massachusetts"
              : ", across Boston";
    const topPlaces = areas
        .filter((a) => a.impactPct !== null)
        .sort((a, b) => b.impactPct! - a.impactPct!)
        .slice(0, 5)
        .map((a) => ({ name: a.place, pct: a.impactPct!, need: a.need }));

    // ---- Education (no dates on student rows, so timeframe doesn't apply) --
    const areaStudents = students.filter(inArea);
    const studentIds = new Set(areaStudents.map((s) => s.studentId));
    // One figure per student: average ADA across their attendance rows.
    const adaByStudent = new Map<number, number[]>();
    for (const a of education.attendance) {
        const ada = Number(a.ada);
        if (!studentIds.has(a.studentId) || !Number.isFinite(ada)) continue;
        adaByStudent.set(a.studentId, [
            ...(adaByStudent.get(a.studentId) ?? []),
            ada,
        ]);
    }
    const studentAda = [...adaByStudent.values()].map(
        (v) => v.reduce((s, n) => s + n, 0) / v.length
    );
    const regular = studentAda.filter((ada) => ada >= 0.9);
    // Same both-sides rule as the headline stats: a school is listed only if
    // it and the students at other schools each clear the threshold.
    const schools = [...countBy(areaStudents, (s) => s.schoolName).entries()]
        .flatMap(([name, n]) => {
            const p = publishablePct(n, areaStudents.length);
            return p === null ? [] : [{ name, pct: p, need: null }];
        })
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);

    // ---- Stats column -----------------------------------------------------
    const needOf = (m: NeedMetric) =>
        place === ALL ? averageNeed(m, MA_TOWNS) : m.valueFor(place);
    const impactMeter = (
        id: string,
        label: string,
        value: number | null
    ): StatRow => ({
        kind: "meter",
        id,
        label,
        side: "impact",
        value,
        unit: "%",
        emptyText: TOO_FEW,
    });

    const housingRows: StatRow[] = [];
    if (need) {
        // A neighborhood compares with Boston, anything else with the state.
        // With all of MA selected the bar already is the average: no tick.
        // Averages are per area (every town counts once), not per resident,
        // and the labels say so.
        const avg = selectedHood
            ? {
                  label: "Avg Boston neighborhood",
                  value: averageNeed(need, BOSTON_NEIGHBORHOODS),
              }
            : { label: "Avg MA town", value: averageNeed(need, MA_TOWNS) };
        housingRows.push({
            kind: "meter",
            id: "need",
            label:
                place === ALL
                    ? `${need.label}, average across MA towns`
                    : need.label,
            side: "need",
            value: needOf(need),
            unit: need.unit,
            ref:
                place !== ALL && avg.value !== null
                    ? { label: avg.label, value: avg.value }
                    : undefined,
            emptyText: "No data",
            sample: need.isSample,
        });
    }
    housingRows.push(
        impactMeter(
            "housed",
            "Families housed",
            publishablePct(housed.length, recorded.length)
        ),
        {
            kind: "meter",
            id: "housedFast",
            label: "Housed within 6 months",
            note: "of housed",
            side: "impact",
            value: publishablePct(housedFast.length, housingDays.length),
            unit: "%",
            nested: true,
            emptyText: TOO_FEW,
        },
        {
            kind: "list",
            id: "topPlaces",
            title: "Where BHG families live",
            note: `Share of ${shareOf}${listScope}`,
            items: topPlaces,
            selectable: true,
            showNeed: need !== null,
        }
    );

    const sections: StatSection[] = [
        { title: "Housing", rows: housingRows },
        {
            title: "Education",
            // Student rows carry no dates, so the time period can't apply.
            note: "All years · not filtered by time period",
            rows: [
                impactMeter(
                    "attendance",
                    "Students at 90%+ attendance",
                    publishablePct(regular.length, studentAda.length)
                ),
                {
                    kind: "list",
                    id: "schools",
                    title: "Students by school",
                    items: schools,
                    selectable: false,
                    showNeed: false,
                },
            ],
        },
    ];

    return {
        place,
        timeframe,
        view,
        areas,
        shareOf,
        otherPlaces,
        sections,
    };
}
