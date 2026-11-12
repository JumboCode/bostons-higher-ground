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
    type ChartFilters,
    type GeneratedChartModel,
} from "@/lib/chart-definitions";
import type { Timeframe } from "@/lib/filterStore";
import { getMockImpactData } from "@/lib/mock-impact-data";

import FilterSelect from "./FilterSelect";

// ponytail: filters read searchParams so the route is dynamic (no ISR). Fine at mock-data
// scale; wrap the real loaders in unstable_cache once they replace getMockImpactData.

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
    { value: "allTime", label: "All time" },
    { value: "pastTwoYears", label: "Past 2 years" },
    { value: "thisFY", label: "This fiscal year" },
];
const ALL = "all";
const DAY = 86_400_000;

// null = group too small to publish (same rule as chart buckets).
const pct = (part: number, whole: number) =>
    whole < MIN_GROUP_SIZE ? null : Math.round((part / whole) * 100);

function countBy<T>(items: T[], key: (t: T) => string | null) {
    const m = new Map<string, number>();
    for (const t of items) {
        const k = key(t);
        if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
}

// Bars as share of total instead of raw counts.
function toShares(
    model: GeneratedChartModel,
    xLabel: string
): GeneratedChartModel {
    if (model.type !== "horizontal-bar") return model;
    const total = model.data.reduce((s, d) => s + d.series[0].value, 0) || 1;
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
                    ? "Too few people in this selection to share a figure."
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
    stats,
    children,
}: {
    heading: string;
    stats: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="mb-3 text-xl font-semibold text-bhg-gray-300">
                {heading}
            </h2>
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
    // ponytail: mock data; swap for getAllData()/getEducationData() once BHG sends final stats.
    const source = getMockImpactData();

    // Only towns big enough to publish are selectable, so a filter can't single out a few families.
    const towns = [...countBy(source.housing, (h) => h.city)]
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

    // Housing
    const families = filterCommonRecords(source.housing, filters);
    const housed = families.filter((f) => f.dateHoused);
    const housedFast = housed.filter(
        (f) =>
            Date.parse(f.dateHoused!) -
                Date.parse(f.intakeDate ?? f.dateHoused!) <=
            183 * DAY
    );

    // Map ignores the town filter (it *is* the town picker) but respects timeframe.
    const inTimeframe = filterCommonRecords(source.housing, {
        ...filters,
        selectedLocations: [],
    });
    const shares: PlaceShare[] = [...countBy(inTimeframe, (h) => h.city)]
        .filter(([, n]) => n >= MIN_GROUP_SIZE)
        .map(([place, n]) => ({
            place,
            pct: Math.round((n / inTimeframe.length) * 100),
        }))
        .sort((a, b) => b.pct - a.pct);
    const hrefFor = (place: string) =>
        `/impact?${new URLSearchParams({ town: place, timeframe })}`;

    // Education (no dates on student rows, so timeframe doesn't apply)
    const studentIds = new Set(
        (source.students ?? [])
            .filter((s) => town === ALL || s.city === town)
            .map((s) => s.studentId)
    );
    const attendance = (source.attendance ?? []).filter((a) =>
        studentIds.has(a.studentId)
    );
    const regular = attendance.filter((a) => Number(a.ada) >= 0.9);
    const schoolShares = toShares(
        buildChartModel("students-per-school-bar", source, filters),
        "% of students"
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
                                value={pct(housed.length, families.length)}
                                label={`of families who came to us${where} are now in stable housing.`}
                                className="bg-bhg-pink-100"
                            />
                            <Stat
                                value={pct(housedFast.length, housed.length)}
                                label="of housed families found a home within 6 months."
                                className="bg-bhg-mint-100"
                            />
                        </>
                    }
                >
                    <Card
                        title="Where we've helped families"
                        caption="Brighter = more families. Click a town to filter."
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
                                                        width: `${(s.pct / (shares[0]?.pct || 1)) * 100}%`,
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
                    stats={
                        <Stat
                            value={pct(regular.length, attendance.length)}
                            label={`of students we support${where} attend school at least 90% of days.`}
                            className="bg-bhg-yellow-100"
                        />
                    }
                >
                    <Card
                        title="Students by partner school"
                        caption="Share of the students we support at each school."
                    >
                        <ChartRenderer model={schoolShares} />
                    </Card>
                </Row>
            </div>

            <p className="mt-8 text-xs text-gray-500">
                Sample data. Groups under {MIN_GROUP_SIZE} are hidden to protect
                privacy.
            </p>
        </main>
    );
}
