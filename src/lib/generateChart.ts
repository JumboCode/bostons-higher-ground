import { filterRecords, type FilterableRecord } from "@/lib/applyFilters";
import { getAllData } from "@/lib/getAllData";
import {
    LineChart,
    LineChartPdf,
    VerticalBarChart,
    VerticalBarChartPdf,
    HorizontalBarChart,
    HorizontalBarChartPdf,
    DonutChart,
    DonutChartPdf,
    type LineDatum,
    type VerticalBarDatum,
    type HorizontalBarDatum,
    type DonutDatum,
} from "@/components/charts";
import type { FilterState } from "@/lib/filterStore";

// Represents the shape stored in in_progress_reports.charts
export type StoredChart = {
    title: string;
    chartType: string;
    filters: string | null;
};

export const chartRegistry = {
    "Family Intake Over Time": "family-intake-bar",
    "Families Housed Over Time": "families-housed-line",
    "Days to House Distribution": "days-to-house-bar",
    "Active vs Housed Families by Location": "location-bar",
    "Partner Schools & Homeless Student Counts": "partner-schools-bar",
    "Schools by City": "schools-by-city-bar",
    "Housing Sources": "housing-sources-donut",
    "Students by City": "students-by-city-bar",
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
};

export type GeneratedChartModel =
    | {
          chartKey: "family-intake-bar";
          data: VerticalBarDatum[];
          xLabel: "Month";
          yLabel: "Families";
      }
    | {
          chartKey: "families-housed-line";
          data: LineDatum[];
          xLabel: "Month";
          yLabel: "Families Housed";
      }
    | {
          chartKey: "days-to-house-bar";
          data: VerticalBarDatum[];
          xLabel: "School";
          yLabel: "Avg. days to house";
      }
    | {
          chartKey: "location-bar";
          data: HorizontalBarDatum[];
          xLabel: "# of Families";
          yLabel: "Location";
      }
    | {
          chartKey: "partner-schools-bar";
          data: HorizontalBarDatum[];
          xLabel: "# of Students";
          yLabel: "School";
      }
    | {
          chartKey: "schools-by-city-bar";
          data: HorizontalBarDatum[];
          xLabel: "# of Schools";
          yLabel: "City";
      }
    | {
          chartKey: "students-by-city-bar";
          data: HorizontalBarDatum[];
          xLabel: "# of Students";
          yLabel: "City";
      }
    | {
          chartKey: "housing-sources-donut";
          data: DonutDatum[];
          centerLabel: "Total Housed";
      };

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
        if (record.intakeDate === null || record.intakeDate === undefined)
            return;
        const intakeMonth = parseInt(record.intakeDate.split("-")[1]);
        if (intakeMonth >= 1 && intakeMonth <= 12) {
            counts[intakeMonth - 1] += 1;
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
        if (record.dateHoused === null || record.dateHoused === undefined)
            return;
        const housedMonth = parseInt(record.dateHoused.split("-")[1]);
        if (housedMonth >= 1 && housedMonth <= 12) {
            counts[housedMonth - 1] += 1;
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

function partnerSchoolsSeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const schoolCounts = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.school || !record.studentCount) return;

        const existing = schoolCounts.get(record.school) ?? {
            active: 0,
            housed: 0,
        };

        if (record.currentStatus === "active") {
            existing.active += record.studentCount;
        } else if (record.currentStatus === "housed") {
            existing.housed += record.studentCount;
        }

        schoolCounts.set(record.school, existing);
    });

    return Array.from(schoolCounts.entries())
        .map(([school, counts]) => ({
            category: school,
            series: [
                { label: "Active", value: counts.active },
                { label: "Housed", value: counts.housed },
            ],
        }))
        .sort(
            (a, b) =>
                b.series.reduce((sum, s) => sum + s.value, 0) -
                a.series.reduce((sum, s) => sum + s.value, 0)
        );
}

function schoolsByCitySeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const citySchools = new Map<string, Set<string>>();

    records.forEach((record) => {
        if (!record.city || !record.school) return;
        const current = citySchools.get(record.city) ?? new Set<string>();
        current.add(record.school);
        citySchools.set(record.city, current);
    });

    return Array.from(citySchools.entries())
        .map(([city, schools]) => ({
            category: city,
            series: [{ label: "Schools", value: schools.size }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

function studentsByCitySeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const cityTotals = new Map<string, number>();

    records.forEach((record) => {
        if (!record.city || !record.studentCount) return;
        const current = cityTotals.get(record.city) ?? 0;
        cityTotals.set(record.city, current + record.studentCount);
    });

    return Array.from(cityTotals.entries())
        .map(([city, totalStudents]) => ({
            category: city,
            series: [{ label: "Students", value: totalStudents }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

function housingSourcesSeries(records: HousingRecord[]): DonutDatum[] {
    const counts = new Map<string, number>();

    records.forEach((record) => {
        if (record.currentStatus !== "housed" || !record.sourceOfHousing) {
            return;
        }
        const current = counts.get(record.sourceOfHousing) ?? 0;
        counts.set(record.sourceOfHousing, current + 1);
    });

    return Array.from(counts.entries())
        .map(([source, count]) => ({ label: source, value: count }))
        .sort((a, b) => b.value - a.value);
}

function getFilteredRecords(
    data: HousingRecord[],
    stored: StoredChart
): HousingRecord[] {
    const filters = parseFilters(stored.filters);
    return filterRecords(data, {
        selectedLocations: filters.selectedLocations ?? [],
        selectedSchools: filters.selectedSchools ?? [],
        timeframe: (filters.timeframe as FilterState["timeframe"]) ?? "allTime",
        fiscalYear: filters.fiscalYear,
        customRange: filters.customRange,
    }) as HousingRecord[];
}

function buildChartModel(
    chartKey: ChartKey,
    records: HousingRecord[]
): GeneratedChartModel {
    switch (chartKey) {
        case "family-intake-bar":
            return {
                chartKey,
                data: familyIntakeSeries(records),
                xLabel: "Month",
                yLabel: "Families",
            };
        case "families-housed-line":
            return {
                chartKey,
                data: familiesHousedSeries(records),
                xLabel: "Month",
                yLabel: "Families Housed",
            };
        case "days-to-house-bar":
            return {
                chartKey,
                data: daysToHouseSeries(records),
                xLabel: "School",
                yLabel: "Avg. days to house",
            };
        case "location-bar":
            return {
                chartKey,
                data: locationSeries(records),
                xLabel: "# of Families",
                yLabel: "Location",
            };
        case "partner-schools-bar":
            return {
                chartKey,
                data: partnerSchoolsSeries(records),
                xLabel: "# of Students",
                yLabel: "School",
            };
        case "schools-by-city-bar":
            return {
                chartKey,
                data: schoolsByCitySeries(records),
                xLabel: "# of Schools",
                yLabel: "City",
            };
        case "students-by-city-bar":
            return {
                chartKey,
                data: studentsByCitySeries(records),
                xLabel: "# of Students",
                yLabel: "City",
            };
        case "housing-sources-donut":
            return {
                chartKey,
                data: housingSourcesSeries(records),
                centerLabel: "Total Housed",
            };
    }
}

import React from "react";

export async function generateChartModel(
    stored: StoredChart
): Promise<GeneratedChartModel | null> {
    const chartKey = stored.chartType as ChartKey;
    console.log("chartKey:", chartKey);
    if (!chartKey) return null;

    const data = (await getAllData()) as HousingRecord[];
    const filteredRecords = getFilteredRecords(data, stored);
    return buildChartModel(chartKey, filteredRecords);
}

export async function generateChart(stored: StoredChart, isForPdf = false) {
    const model = await generateChartModel(stored);
    if (!model) return null;

    if (isForPdf) {
        if (model.chartKey === "family-intake-bar") {
            return React.createElement(VerticalBarChartPdf, {
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        }
        if (model.chartKey === "families-housed-line") {
            return React.createElement(LineChartPdf, {
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        }
        if (model.chartKey === "days-to-house-bar") {
            return React.createElement(VerticalBarChartPdf, {
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        }
        if (
            model.chartKey === "partner-schools-bar" ||
            model.chartKey === "schools-by-city-bar" ||
            model.chartKey === "students-by-city-bar"
        ) {
            return React.createElement(HorizontalBarChartPdf, {
                data: model.data,
                xLabel: model.xLabel,
                yLabel: model.yLabel,
            });
        }
        if (model.chartKey === "housing-sources-donut") {
            return React.createElement(DonutChartPdf, {
                data: model.data,
                centerLabel: model.centerLabel,
            });
        }
        return React.createElement(HorizontalBarChartPdf, {
            data: model.data,
            xLabel: model.xLabel,
            yLabel: model.yLabel,
        });
    }

    if (model.chartKey === "family-intake-bar") {
        return React.createElement(VerticalBarChart, {
            data: model.data,
            xLabel: model.xLabel,
            yLabel: model.yLabel,
        });
    }
    if (model.chartKey === "families-housed-line") {
        return React.createElement(LineChart, {
            data: model.data,
            xLabel: model.xLabel,
            yLabel: model.yLabel,
        });
    }
    if (model.chartKey === "days-to-house-bar") {
        return React.createElement(VerticalBarChart, {
            data: model.data,
            xLabel: model.xLabel,
            yLabel: model.yLabel,
        });
    }
    if (
        model.chartKey === "partner-schools-bar" ||
        model.chartKey === "schools-by-city-bar" ||
        model.chartKey === "students-by-city-bar"
    ) {
        return React.createElement(HorizontalBarChart, {
            data: model.data,
            xLabel: model.xLabel,
            yLabel: model.yLabel,
        });
    }
    if (model.chartKey === "housing-sources-donut") {
        return React.createElement(DonutChart, {
            data: model.data,
            centerLabel: model.centerLabel,
        });
    }
    return React.createElement(HorizontalBarChart, {
        data: model.data,
        xLabel: model.xLabel,
        yLabel: model.yLabel,
    });
}
