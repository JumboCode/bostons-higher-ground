/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: public-facing summary of BHG's impact. Everything is computed here on
    the server; the browser only receives percentages, finished chart models and
    map paths. Public filters live in the URL (?town=&timeframe=).
*/

import { ChartRenderer } from "@/components/charts";
import ImpactMap, { type PlaceShare } from "@/components/ImpactMap";
import {
    buildChartModel,
    filterCommonRecords,
    MIN_GROUP_SIZE,
    type ChartDataSource,
    type ChartFilters,
    type HousingChartRecord,
    type GeneratedChartModel,
} from "@/lib/chart-definitions";
import type { Timeframe } from "@/lib/filterStore";
import { getAllData } from "@/lib/getAllData";
import { getEducationData } from "@/lib/getEducationData";

import FilterSelect from "./FilterSelect";

// Filters read searchParams so the route is dynamic; caching lives in the loaders.

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: "allTime", label: "All time" },
    { value: "pastTwoYears", label: "Past 2 years" },
    { value: "thisFY", label: "This fiscal year" },
];
const ALL = "all";
const DAY = 86_400_000;

// Salesforce city is free text: fix case/typos, drop non-places.
const CITY_FIXES: Record<string, string | null> = {
    dorcheseter: "Dorchester",
    rosindale: "Roslindale",
    "confidential address": null,
    "west broadway": null,
};
function cleanCity(city: string | null) {
    const k = city?.trim().toLowerCase();
    if (!k) return null;
    if (k in CITY_FIXES) return CITY_FIXES[k];
    return k.replace(/\b\w/g, (c) => c.toUpperCase());
}

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
    className,
}: {
    value: number | null;
    label: string;
    className: string;
}) {
    return (
        <div className={`rounded-lg p-5 ${className}`}>
            <p className="text-4xl font-bold text-bhg-gray-300">
                {value === null ? "—" : `${value}%`}
            </p>
            <p className="mt-1 text-sm text-bhg-gray-300">
                {value === null
                    ? "Not enough data in this selection to share a figure without identifying families."
                    : label}
            </p>
        </div>
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

export default async function Impact({
    searchParams,
}: {
    searchParams: Promise<{ town?: string; timeframe?: string }>;
}) {
    const params = await searchParams;
    // Both loaders are unstable_cache'd (5 min). Raw rows stay on the server.
    const [rawHousing, education] = await Promise.all([
        getAllData() as Promise<HousingChartRecord[]>,
        getEducationData(),
    ]);
    const housing = rawHousing.map((h) => ({ ...h, city: cleanCity(h.city) }));
    const students = education.students.map((s) => ({
        ...s,
        city: cleanCity(s.city) ?? "",
    }));
    const source: ChartDataSource = { ...education, housing, students };

    // Only towns big enough to publish are selectable, so a filter can't single out a few families.
    const towns = [...countBy(housing, (h) => h.city)]
        .filter(([, n]) => n >= MIN_GROUP_SIZE)
        .map(([t]) => t)
        .sort();
    // Untrusted URL input: anything unknown falls back to the default.
    const town = towns.includes(params.town ?? "") ? params.town! : ALL;
    const timeframe =
        TIMEFRAMES.find((t) => t.value === params.timeframe)?.value ??
        "allTime";

    const filters: ChartFilters = {
        selectedLocations: town === ALL ? [] : [town],
        selectedSchools: [],
        timeframe,
    };

    // Housing. Town filtered here, not via filters: the shared location filter
    // lets records with no city through, and most real records have none.
    const inTimeframe = filterCommonRecords(housing, {
        ...filters,
        selectedLocations: [],
    });
    const families =
        town === ALL ? inTimeframe : inTimeframe.filter((h) => h.city === town);
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

    // Map: share of families with a known town, in the selected timeframe.
    const byTown = countBy(inTimeframe, (h) => h.city);
    const known = [...byTown.values()].reduce((a, n) => a + n, 0);
    const shares: PlaceShare[] = [...byTown]
        .filter(([, n]) => n >= MIN_GROUP_SIZE)
        .map(([place, n]) => ({ place, pct: Math.round((n / known) * 100) }))
        .sort((a, b) => b.pct - a.pct);
    const hrefFor = (place: string) =>
        `/impact?${new URLSearchParams({ town: place, timeframe })}`;

    // Education (no dates on student rows, so timeframe doesn't apply)
    const townStudents = students.filter(
        (s) => town === ALL || s.city === town
    );
    const studentIds = new Set(townStudents.map((s) => s.studentId));
    // One figure per student: average ADA across their attendance rows.
    const adaByStudent = new Map<number, number[]>();
    for (const a of source.attendance ?? []) {
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
        buildChartModel("students-per-school-bar", source, filters),
        "% of students",
        townStudents.length
    );

    const where = town === ALL ? "" : ` in ${town}`;

    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <h1 className="mb-10 text-center text-4xl font-bold text-bhg-gray-300 md:text-5xl">
                Our Impact
            </h1>

            <div className="space-y-10">
                <Row
                    heading="Housing"
                    stats={
                        <>
                            <Stat
                                value={pct(housed.length, recorded.length)}
                                label={`of families we've worked with${where} have moved into stable housing.`}
                                className="bg-bhg-pink-100"
                            />
                            <Stat
                                value={pct(
                                    housedFast.length,
                                    housingDays.length
                                )}
                                label="of housed families found a home within 6 months."
                                className="bg-bhg-mint-100"
                            />
                        </>
                    }
                >
                    <Card
                        title="Where we've helped families"
                        caption="Share of families with a known town. Click a town to filter."
                        action={
                            <form
                                method="get"
                                className="flex flex-wrap items-end gap-3"
                            >
                                <FilterSelect
                                    name="town"
                                    label="Town"
                                    value={town}
                                    options={[
                                        { value: ALL, label: "All towns" },
                                        ...towns.map((t) => ({
                                            value: t,
                                            label: t,
                                        })),
                                    ]}
                                />
                                <FilterSelect
                                    name="timeframe"
                                    label="Time period"
                                    value={timeframe}
                                    options={TIMEFRAMES}
                                />
                                <noscript>
                                    <button className="rounded-md bg-bhg-gray-300 px-3 py-2 text-sm text-white">
                                        Apply
                                    </button>
                                </noscript>
                            </form>
                        }
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <ImpactMap
                                shares={shares}
                                selected={town}
                                hrefFor={hrefFor}
                            />
                            <ol className="space-y-2 text-sm">
                                {shares.map((s) => (
                                    <li key={s.place}>
                                        <a
                                            href={hrefFor(s.place)}
                                            className="block"
                                        >
                                            <div className="flex justify-between">
                                                <span
                                                    className={
                                                        s.place === town
                                                            ? "font-bold"
                                                            : ""
                                                    }
                                                >
                                                    {s.place}
                                                </span>
                                                <span>{s.pct}%</span>
                                            </div>
                                            <div className="h-1.5 rounded bg-bhg-gray-100">
                                                <div
                                                    className="h-1.5 rounded bg-bhg-pink"
                                                    style={{
                                                        width: `${s.pct}%`,
                                                    }}
                                                />
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </Card>
                </Row>

                <Row
                    heading="Education"
                    note="Current school-year data. The time period filter applies to housing only."
                    stats={
                        <Stat
                            value={pct(regular.length, studentAda.length)}
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
            </p>
        </main>
    );
}
