/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: public-facing summary of BHG's impact, next to community need.
    Everything is computed here on the server; the browser only receives
    percentages, finished chart models and map paths.
    Public filters live in the URL (?town=&timeframe=&layer=).
*/

import { ChartRenderer } from "@/components/charts";
import ImpactMap, {
    formatPct,
    MapLegend,
    type MapArea,
    type MapLayers,
    type MapView,
} from "@/components/ImpactMap";
import {
    buildChartModel,
    filterCommonRecords,
    MIN_GROUP_SIZE,
    type ChartFilters,
    type GeneratedChartModel,
    type HousingChartRecord,
} from "@/lib/chart-definitions";
import type { Timeframe } from "@/lib/filterStore";
import { getAllData } from "@/lib/getAllData";
import { getEducationData } from "@/lib/getEducationData";
import { averageNeed, SAMPLE_NEED } from "@/lib/impact/need";
import {
    BOSTON,
    BOSTON_NEIGHBORHOODS,
    isNeighborhood,
    MA_TOWNS,
    placeOf,
    type Place,
} from "@/lib/impact/places";

import FilterSelect, { type SelectItem } from "./FilterSelect";

// Filters read searchParams so the route is dynamic; caching lives in the loaders.

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: "allTime", label: "All time" },
    { value: "pastTwoYears", label: "Past 2 years" },
    { value: "thisFY", label: "This fiscal year" },
];
const LAYERS = [
    { value: "both", label: "Both" },
    { value: "impact", label: "Our impact" },
    { value: "need", label: "Community need" },
] as const;
type Layer = (typeof LAYERS)[number]["value"];

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
const asPct = (v: number | null) => (v === null ? null : `${v}%`);

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

// Bars as share of `total` instead of raw counts. Pass the real total, not the
// sum of visible bars, so suppressed buckets don't inflate the shown ones.
function toShares(
    model: GeneratedChartModel,
    xLabel: string,
    total: number
): GeneratedChartModel {
    if (model.type !== "horizontal-bar" || total <= 0) return model;
    return {
        ...model,
        xLabel,
        data: model.data.map((d) => ({
            ...d,
            series: d.series.map((s) => ({
                ...s,
                value: Math.round((s.value / total) * 100),
            })),
        })),
    };
}

function Stat({
    value,
    label,
    detail,
    className,
}: {
    value: string | null;
    label: string;
    detail?: React.ReactNode;
    className: string;
}) {
    return (
        <div className={`rounded-lg p-5 ${className}`}>
            <p className="text-4xl font-bold text-bhg-gray-300">
                {value ?? "—"}
            </p>
            <p className="mt-1 text-sm text-bhg-gray-300">
                {value === null
                    ? "Not enough data in this selection to share a figure without identifying families."
                    : label}
            </p>
            {detail && (
                <p className="mt-2 text-xs text-bhg-gray-300">{detail}</p>
            )}
        </div>
    );
}

function SampleTag() {
    return (
        <span className="rounded bg-bhg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-bhg-gray-300">
            Sample data
        </span>
    );
}

function Card({
    title,
    caption,
    action,
    children,
}: {
    title: string;
    caption?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <figure className="min-w-0 rounded-lg bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-bhg-gray-300">
                        {title}
                    </h3>
                    {caption && (
                        <figcaption className="text-sm text-gray-600">
                            {caption}
                        </figcaption>
                    )}
                </div>
                {action}
            </div>
            {children}
        </figure>
    );
}

// Stats on the left, matching visual on the right (stacks on narrow screens).
function Row({
    heading,
    note,
    stats,
    children,
}: {
    heading: string;
    note?: string;
    stats: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-3">
                <h2 className="text-xl font-semibold text-bhg-gray-300">
                    {heading}
                </h2>
                {note && <p className="text-sm text-gray-600">{note}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="flex flex-col gap-4">{stats}</div>
                {children}
            </div>
        </section>
    );
}

// Map layer switch. Links, not buttons, so it works without JS and in the iframe.
function LayerToggle({
    layer,
    hrefFor,
}: {
    layer: Layer;
    hrefFor: (layer: Layer) => string;
}) {
    return (
        <nav
            aria-label="Map layers"
            className="mb-3 inline-flex rounded-md border border-bhg-gray-200 bg-white p-0.5 text-sm"
        >
            {LAYERS.map((l) => (
                <a
                    key={l.value}
                    href={hrefFor(l.value)}
                    aria-current={l.value === layer ? "true" : undefined}
                    className={`rounded px-3 py-1.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300 ${
                        l.value === layer
                            ? "bg-bhg-gray-300 text-white"
                            : "text-bhg-gray-300 hover:bg-bhg-gray-100"
                    }`}
                >
                    {l.label}
                </a>
            ))}
        </nav>
    );
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
    const layer: Layer =
        LAYERS.find((l) => l.value === params.layer)?.value ?? "both";
    const layers: MapLayers = {
        impact: layer !== "need",
        need: layer !== "impact",
    };

    const selectedHood = place !== ALL && isNeighborhood(place);
    const view: MapView = place === BOSTON || selectedHood ? "boston" : "state";
    const inArea = (p: Place) =>
        place === ALL ||
        (selectedHood ? p.neighborhood === place : p.town === place);

    const href = (next: { town?: string; layer?: Layer }) => {
        const q = new URLSearchParams();
        const t = next.town ?? place;
        const l = next.layer ?? layer;
        if (t !== ALL) q.set("town", t);
        if (timeframe !== "allTime") q.set("timeframe", timeframe);
        if (l !== "both") q.set("layer", l);
        const s = q.toString();
        return s ? `/impact?${s}` : "/impact";
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
            (layers.impact && big) ||
            (layers.need && need !== null) ||
            (view === "state" && name === BOSTON);
        return {
            place: name,
            impactPct: big ? (n / known) * 100 : null,
            impactSmall: n > 0 && !big,
            need,
            href: clickable ? href({ town: name }) : null,
        };
    });
    const shareOf =
        view === "state"
            ? "families with a known town"
            : "Boston families with a known neighborhood";

    // Ranked list under the map: top areas on the main visible layer.
    const ranked = [...areas]
        .filter((a) => (layers.impact ? a.impactPct !== null : a.need !== null))
        .sort((a, b) =>
            layers.impact
                ? b.impactPct! - a.impactPct!
                : (b.need ?? 0) - (a.need ?? 0)
        )
        .slice(0, 10);

    // ---- Community need ---------------------------------------------------
    // Compare a neighborhood with Boston, anything else with the state.
    const needHere = place === ALL ? null : NEED.valueFor(place);
    const needBaseline = selectedHood
        ? {
              label: "Boston average",
              value: averageNeed(NEED, BOSTON_NEIGHBORHOODS),
          }
        : {
              label: "Massachusetts average",
              value: averageNeed(NEED, MA_TOWNS),
          };

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
    // Chart counts student rows per school, so the total is the same row count.
    const schoolShares = toShares(
        buildChartModel(
            "students-per-school-bar",
            { ...education, housing: [], students: areaStudents },
            filters
        ),
        "% of students",
        areaStudents.length
    );

    const where = place === ALL ? "" : ` in ${place}`;
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

    const needStat = (
        <Stat
            value={
                place === ALL
                    ? String(needBaseline.value ?? "—")
                    : needHere === null
                      ? null
                      : String(needHere)
            }
            label={
                place === ALL
                    ? `average ${NEED.label.toLowerCase()} across Massachusetts towns.`
                    : `${NEED.label.toLowerCase()} in ${place} (0–100, higher = more need).`
            }
            detail={
                <>
                    {place !== ALL &&
                        `${needBaseline.label}: ${needBaseline.value ?? "—"}. `}
                    {NEED.isSample && <SampleTag />}
                </>
            }
            className="bg-[#E3EAF4]"
        />
    );
    const impactStats = (
        <>
            <Stat
                value={asPct(pct(housed.length, recorded.length))}
                label={`of families we've worked with${where} have moved into stable housing.`}
                className="bg-bhg-pink-100"
            />
            <Stat
                value={asPct(pct(housedFast.length, housingDays.length))}
                label="of housed families found a home within 6 months."
                className="bg-bhg-mint-100"
            />
        </>
    );

    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <h1 className="mb-10 text-center text-4xl font-bold text-bhg-gray-300 md:text-5xl">
                Our Impact
            </h1>

            <div className="space-y-10">
                <Row
                    heading="Housing"
                    note={
                        layers.need && layers.impact
                            ? "The need in each community, and how we've responded."
                            : undefined
                    }
                    stats={
                        // Need first, then our response.
                        <>
                            {layers.need && needStat}
                            {layers.impact && impactStats}
                        </>
                    }
                >
                    <Card
                        title={
                            view === "state"
                                ? "Where we work across Massachusetts"
                                : "Where we work in Boston"
                        }
                        caption={
                            view === "state"
                                ? "Click a town to see its figures. Click Boston to see its neighborhoods."
                                : "Click a neighborhood to see its figures."
                        }
                        action={
                            <form
                                method="get"
                                className="flex flex-wrap items-end gap-3"
                            >
                                <FilterSelect
                                    name="town"
                                    label="Place"
                                    value={place}
                                    options={placeOptions}
                                />
                                <FilterSelect
                                    name="timeframe"
                                    label="Time period"
                                    value={timeframe}
                                    options={TIMEFRAMES}
                                />
                                {layer !== "both" && (
                                    <input
                                        type="hidden"
                                        name="layer"
                                        value={layer}
                                    />
                                )}
                                <noscript>
                                    <button className="rounded-md bg-bhg-gray-300 px-3 py-2 text-sm text-white">
                                        Apply
                                    </button>
                                </noscript>
                            </form>
                        }
                    >
                        <LayerToggle
                            layer={layer}
                            hrefFor={(l) => href({ layer: l })}
                        />
                        <ImpactMap
                            view={view}
                            layers={layers}
                            areas={areas}
                            selected={place}
                            needLabel={NEED_LABEL}
                            shareOf={shareOf}
                            backHref={href({ town: ALL })}
                        />
                        <MapLegend
                            layers={layers}
                            needTitle={`Community need: ${NEED.label.toLowerCase()}`}
                            needIsSample={NEED.isSample}
                        />
                        {layers.impact && (
                            <p className="mt-2 text-xs text-gray-600">
                                Our impact shows each{" "}
                                {view === "state" ? "town" : "neighborhood"}
                                &apos;s share of {shareOf}.
                            </p>
                        )}

                        {ranked.length > 0 && (
                            <div className="mt-4">
                                <h4 className="mb-2 text-sm font-semibold text-bhg-gray-300">
                                    {view === "state"
                                        ? "Top towns"
                                        : "Top neighborhoods"}
                                    {layers.impact
                                        ? " by share of families"
                                        : ` by ${NEED_LABEL}`}
                                </h4>
                                <ol className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                                    {ranked.map((a) => (
                                        <li key={a.place}>
                                            <a
                                                href={href({ town: a.place })}
                                                className="block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300"
                                            >
                                                <div className="flex justify-between gap-2">
                                                    <span
                                                        className={
                                                            a.place === place
                                                                ? "font-bold"
                                                                : ""
                                                        }
                                                    >
                                                        {a.place}
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {layers.impact &&
                                                            formatPct(
                                                                a.impactPct!
                                                            )}
                                                        {layers.impact &&
                                                            layers.need &&
                                                            " · "}
                                                        {layers.need &&
                                                            a.need !== null &&
                                                            `need ${a.need}`}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 rounded bg-bhg-gray-100">
                                                    <div
                                                        className={`h-1.5 rounded ${layers.impact ? "bg-bhg-pink" : "bg-[#56779F]"}`}
                                                        style={{
                                                            width: `${Math.max(
                                                                2,
                                                                layers.impact
                                                                    ? a.impactPct!
                                                                    : (a.need ??
                                                                          0)
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </Card>
                </Row>

                <Row
                    heading="Education"
                    note="Current school-year data. The time period filter applies to housing only."
                    stats={
                        <Stat
                            value={asPct(
                                pct(regular.length, studentAda.length)
                            )}
                            label={`of students we support${where} attend school at least 90% of days.`}
                            className="bg-bhg-yellow-100"
                        />
                    }
                >
                    <Card
                        title="Students by partner school"
                        caption={`Share of the students we support${where} at each school. Schools with fewer than ${MIN_GROUP_SIZE} students aren't shown.`}
                    >
                        <ChartRenderer model={schoolShares} />
                    </Card>
                </Row>
            </div>

            <p className="mt-8 text-xs text-gray-500">
                Groups under {MIN_GROUP_SIZE} are hidden to protect privacy.
                {NEED.isSample &&
                    ` Community need figures are sample data for layout only. ${NEED.source}`}
            </p>
        </main>
    );
}
