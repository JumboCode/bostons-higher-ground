import { filterRecords, type FilterableRecord } from "@/lib/applyFilters";
import { getAllData } from "@/lib/getAllData";
import {
    LineChart,
    VerticalBarChart,
    HorizontalBarChart,
    type LineDatum,
    type VerticalBarDatum,
    type HorizontalBarDatum,
} from "@/components/charts";
import type { FilterState } from "@/lib/filterStore";

// Represents the shape stored in in_progress_reports.charts
export type StoredChart = {
    title: string;
    filters: string | null;
};

const chartRegistry = {
    "Family Intake Over Time": "family-intake-bar",
    "Families Housed Over Time": "families-housed-line",
    "Days to House Distribution": "days-to-house-bar",
    "Active vs Housed Families by Location": "location-bar",
} as const;

type ChartKey = (typeof chartRegistry)[keyof typeof chartRegistry];

// Minimal shape expected by chart builders
export type HousingRecord = FilterableRecord & {
    id: number;
    familyId: string;
    currentStatus: string | null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth: number | null;
    housedMonth: number | null;
};

type ChartBuilder = (records: HousingRecord[]) => React.ReactElement | null;

// Parse a filters string back into a filter state subset
function parseFilters(filters: string | null): Partial<FilterState> {
    if (!filters) return {};
    try {
        const parsed = JSON.parse(filters) as Record<string, unknown>;
        const selectedLocations = Array.isArray(parsed.selectedLocations)
            ? (parsed.selectedLocations as string[])
            : [];
        const selectedSchools = Array.isArray(parsed.selectedSchools)
            ? (parsed.selectedSchools as string[])
            : [];
        const timeframe =
            typeof parsed.timeframe === "string" ? parsed.timeframe : "allTime";
        const fiscalYear =
            typeof parsed.fiscalYear === "number"
                ? parsed.fiscalYear
                : undefined;
        const customRange = parsed.customRange as
            | { from?: string; to?: string }
            | undefined;

        return {
            selectedLocations,
            selectedSchools,
            timeframe,
            fiscalYear,
            customRange:
                customRange?.from && customRange?.to
                    ? {
                          from: new Date(customRange.from),
                          to: new Date(customRange.to),
                      }
                    : undefined,
        } as Partial<FilterState>;
    } catch {
        return {};
    }
}

const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function familyIntakeSeries(records: HousingRecord[]): VerticalBarDatum[] {
    const counts = new Array(12).fill(0);
    records.forEach((record) => {
        if (record.intakeMonth === null || record.intakeMonth === undefined)
            return;
        if (record.intakeMonth >= 0 && record.intakeMonth < 12) {
            counts[record.intakeMonth] += 1;
        }
    });
    return MONTH_NAMES.map((label, index) => ({
        label,
        value: counts[index] || 0,
    }));
}

function familiesHousedSeries(records: HousingRecord[]): LineDatum[] {
    const counts = new Array(12).fill(0);
    records.forEach((record) => {
        if (record.housedMonth === null || record.housedMonth === undefined)
            return;
        if (record.housedMonth >= 0 && record.housedMonth < 12) {
            counts[record.housedMonth] += 1;
        }
    });
    return MONTH_NAMES.map((label, i) => ({ label, value: counts[i] || 0 }));
}

function daysToHouseSeries(records: HousingRecord[]): VerticalBarDatum[] {
    const totals = new Map<string, { totalDays: number; count: number }>();

    records.forEach((record) => {
        if (!record.intakeDate || !record.dateHoused) return;
        const start = new Date(record.intakeDate);
        const end = new Date(record.dateHoused);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const school = record.school ?? "Unknown";
        const current = totals.get(school) ?? { totalDays: 0, count: 0 };
        totals.set(school, {
            totalDays: current.totalDays + days,
            count: current.count + 1,
        });
    });

    return Array.from(totals.entries())
        .map(([school, { totalDays, count }]) => ({
            label: school,
            value: Math.round(totalDays / count),
        }))
        .sort((a, b) => b.value - a.value);
}

function locationSeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const cityCounts = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.city) return;

        const existing = cityCounts.get(record.city) ?? {
            active: 0,
            housed: 0,
        };
        if (record.currentStatus === "active") {
            existing.active += 1;
        } else if (record.currentStatus === "housed") {
            existing.housed += 1;
        }
        cityCounts.set(record.city, existing);
    });

    return Array.from(cityCounts.entries())
        .map(([city, counts]) => ({
            category: city,
            series: [
                { label: "Active Families", value: counts.active },
                { label: "Housed Families", value: counts.housed },
            ],
        }))
        .sort(
            (a, b) =>
                b.series.reduce((sum, s) => sum + s.value, 0) -
                a.series.reduce((sum, s) => sum + s.value, 0)
        );
}

const chartBuilders: Record<ChartKey, ChartBuilder> = {
    "family-intake-bar": (records) => {
        const data = familyIntakeSeries(records);
        return React.createElement(VerticalBarChart, {
            data,
            xLabel: "Month",
            yLabel: "Families",
        });
    },
    "families-housed-line": (records) => {
        const data = familiesHousedSeries(records);
        return React.createElement(LineChart, {
            data,
            width: 800,
            height: 400,
            xLabel: "Month",
            yLabel: "Families Housed",
        });
    },
    "days-to-house-bar": (records) => {
        const data = daysToHouseSeries(records);
        return React.createElement(VerticalBarChart, {
            data,
            xLabel: "School",
            yLabel: "Avg. days to house",
        });
    },
    "location-bar": (records) => {
        const data = locationSeries(records);
        return React.createElement(HorizontalBarChart, {
            data,
            xLabel: "# of Families",
            yLabel: "Location",
        });
    },
};

function resolveChartKey(title: string): ChartKey | null {
    const mapped = (chartRegistry as Record<string, ChartKey | undefined>)[
        title
    ];
    return mapped ?? null;
}

import React from "react";

export async function generateChart(stored: StoredChart) {
    const data = (await getAllData()) as HousingRecord[];

    const filters = parseFilters(stored.filters);
    const filtered = filterRecords(data, {
        selectedLocations: filters.selectedLocations ?? [],
        selectedSchools: filters.selectedSchools ?? [],
        timeframe: (filters.timeframe as FilterState["timeframe"]) ?? "allTime",
        fiscalYear: filters.fiscalYear,
        customRange: filters.customRange,
    });

    const chartKey = resolveChartKey(stored.title);
    if (!chartKey) return null;

    const build = chartBuilders[chartKey];
    return build(filtered as HousingRecord[]);
}
