/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: public-facing summary of BHG's impact, next to community need.
    Everything is computed here on the server; the browser only receives
    percentages and map paths. ImpactExplorer (client) handles layers, hover
    and selection. Public filters live in the URL (?town=&timeframe=&layer=).
*/

import ImpactMap, {
    BOSTON_ORIGIN,
    mapAspect,
    type MapArea,
    type MapView,
} from "@/components/ImpactMap";
import {
    buildChartModel,
    filterCommonRecords,
    MIN_GROUP_SIZE,
    type ChartFilters,
    type HousingChartRecord,
} from "@/lib/chart-definitions";
import type { Timeframe } from "@/lib/filterStore";
import { getAllData } from "@/lib/getAllData";
import { getEducationData } from "@/lib/getEducationData";
import { LAYERS, type Layer } from "@/lib/impact/mapShared";
import { averageNeed, SAMPLE_NEED } from "@/lib/impact/need";
import {
    BOSTON,
    BOSTON_NEIGHBORHOODS,
    isNeighborhood,
    MA_TOWNS,
    placeOf,
    type Place,
} from "@/lib/impact/places";

import type { SelectItem } from "./FilterSelect";
import ImpactExplorer, { type Bar } from "./ImpactExplorer";

// Filters read searchParams so the route is dynamic; caching lives in the loaders.

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: "allTime", label: "All time" },
    { value: "pastTwoYears", label: "Past 2 years" },
    { value: "thisFY", label: "This fiscal year" },
];
const ALL = "all";
const DAY = 86_400_000;
const NEED = SAMPLE_NEED;
const NEED_LABEL = `${NEED.shortLabel}${NEED.isSample ? " (sample)" : ""}`;

// null = too small to publish. Both sides must clear the threshold: "1 of 11"
// shows as 9% and would reveal a single family. This also hides 0% and 100%.
const pct = (part: number, whole: number) =>
    [whole, part, whole - part].some((n) => n < MIN_GROUP_SIZE)
        ? null
        : Math.round((part / whole) * 100);

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

export default async function Impact({
    searchParams,
}: {
    searchParams: Promise<{
        town?: string;
        timeframe?: string;
        layer?: string;
    }>;
}) {
    const params = await searchParams;
    // Both loaders are unstable_cache'd (5 min). Raw rows stay on the server.
    const [rawHousing, education] = await Promise.all([
        getAllData() as Promise<HousingChartRecord[]>,
        getEducationData(),
    ]);
    const housing = rawHousing.map((h) => ({
        ...h,
        ...placeOf(h.city, h.zipCode),
    }));
    const students = education.students.map((s) => ({
        ...s,
        ...placeOf(s.city, s.zip),
    }));

    // Places outside the map (e.g. other states) are still selectable once big enough.
    const mapped = new Set([...MA_TOWNS, ...BOSTON_NEIGHBORHOODS]);
    const otherPlaces = [...countBy(housing, (h) => h.town)]
        .filter(([t, n]) => !mapped.has(t) && n >= MIN_GROUP_SIZE)
        .map(([t]) => t)
        .sort();

    // Untrusted URL input: anything unknown falls back to the default.
    const selectable = new Set([...mapped, ...otherPlaces]);
    const place = selectable.has(params.town ?? "") ? params.town! : ALL;
    const timeframe =
        TIMEFRAMES.find((t) => t.value === params.timeframe)?.value ??
        "allTime";
    const layer: Layer = LAYERS.find((l) => l === params.layer) ?? "both";

    const selectedHood = place !== ALL && isNeighborhood(place);
    const view: MapView = place === BOSTON || selectedHood ? "boston" : "state";
    const inArea = (p: Place) =>
        place === ALL ||
        (selectedHood ? p.neighborhood === place : p.town === place);

    // Plain links for each map area (no-JS / open in new tab); the client
    // intercepts normal clicks.
    const href = (town: string) => {
        const q = new URLSearchParams({ town });
        if (timeframe !== "allTime") q.set("timeframe", timeframe);
        if (layer !== "both") q.set("layer", layer);
        return `/impact?${q}`;
    };

    // ---- Housing ----------------------------------------------------------
    const filters: ChartFilters = {
        selectedLocations: [],
        selectedSchools: [],
        timeframe,
    };
    // filterCommonRecords returns the same objects, so a Set keeps our place fields.
    const keep = new Set(filterCommonRecords(housing, filters));
    const inTimeframe = housing.filter((h) => keep.has(h));
    const families = inTimeframe.filter(inArea);
    const recorded = families.filter(hasOutcome);
    const housed = recorded.filter(isHoused);
    // Time to housing needs both dates; missing or reversed dates are left out
    // of numerator and denominator rather than counted as instant.
    const housingDays = housed.flatMap((f) => {
        const ms =
            Date.parse(f.dateHoused ?? "") - Date.parse(f.intakeDate ?? "");
        return Number.isFinite(ms) && ms >= 0 ? [ms / DAY] : [];
    });
    const housedFast = housingDays.filter((d) => d <= 183);

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
        const big = n >= MIN_GROUP_SIZE;
        const need = NEED.valueFor(name);
        const clickable =
            big || need !== null || (view === "state" && name === BOSTON);
        return {
            place: name,
            impactPct: big ? (n / known) * 100 : null,
            impactSmall: n > 0 && !big,
            need,
            href: clickable ? href(name) : null,
        };
    });
    const shareOf =
        view === "state"
            ? "families with a known town"
            : "Boston families with a known neighborhood";
    const topPlaces: Bar[] = areas
        .filter((a) => a.impactPct !== null)
        .sort((a, b) => b.impactPct! - a.impactPct!)
        .slice(0, 5)
        .map((a) => ({ name: a.place, pct: a.impactPct! }));

    // ---- Community need ---------------------------------------------------
    // Compare a neighborhood with Boston, anything else with the state.
    const needAvg = selectedHood
        ? `Boston avg ${averageNeed(NEED, BOSTON_NEIGHBORHOODS) ?? "—"}`
        : `MA avg ${averageNeed(NEED, MA_TOWNS) ?? "—"}`;

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
    // The chart model already drops schools under MIN_GROUP_SIZE. Shares use the
    // real student total so suppressed schools don't inflate the shown ones.
    const schoolModel = buildChartModel(
        "students-per-school-bar",
        { ...education, housing: [], students: areaStudents },
        filters
    );
    const schools: Bar[] =
        schoolModel.type === "horizontal-bar" && areaStudents.length
            ? schoolModel.data
                  .map((d) => ({
                      name: d.category,
                      pct: Math.round(
                          (d.series[0].value / areaStudents.length) * 100
                      ),
                  }))
                  .sort((a, b) => b.pct - a.pct)
                  .slice(0, 5)
            : [];

    const placeOptions: SelectItem[] = [
        { value: ALL, label: "All of Massachusetts" },
        {
            group: "Boston neighborhoods",
            options: BOSTON_NEIGHBORHOODS.map((n) => ({ value: n, label: n })),
        },
        {
            group: "Massachusetts towns",
            options: MA_TOWNS.map((t) => ({ value: t, label: t })),
        },
        ...(otherPlaces.length
            ? [
                  {
                      group: "Other places",
                      options: otherPlaces.map((t) => ({ value: t, label: t })),
                  },
              ]
            : []),
    ];

    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <h1 className="mb-6 text-center text-4xl font-bold text-bhg-gray-300 md:mb-8 md:text-5xl">
                Our Impact
            </h1>

            <ImpactExplorer
                view={view}
                aspect={mapAspect(view)}
                bostonOrigin={BOSTON_ORIGIN}
                neighborhoods={BOSTON_NEIGHBORHOODS}
                place={place}
                timeframe={timeframe}
                initialLayer={layer}
                areas={areas}
                placeOptions={placeOptions}
                timeframes={TIMEFRAMES}
                needIsSample={NEED.isSample}
                stats={{
                    housed: pct(housed.length, recorded.length),
                    housedFast: pct(housedFast.length, housingDays.length),
                    need:
                        place === ALL
                            ? averageNeed(NEED, MA_TOWNS)
                            : NEED.valueFor(place),
                    needLabel:
                        place === ALL
                            ? "Need index (MA avg)"
                            : `Need index (${needAvg})`,
                    attendance: pct(regular.length, studentAda.length),
                    topPlaces,
                    schools,
                }}
            >
                <ImpactMap
                    view={view}
                    areas={areas}
                    selected={place}
                    needLabel={NEED_LABEL}
                    shareOf={shareOf}
                />
            </ImpactExplorer>

            <p className="mt-6 text-xs text-gray-500">
                Groups under {MIN_GROUP_SIZE} are hidden for privacy.
            </p>
        </main>
    );
}
