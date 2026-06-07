import type { FilterableRecord } from "@/lib/applyFilters";
import type {
    DonutDatum,
    HorizontalBarDatum,
    LineDatum,
    VerticalBarDatum,
} from "@/lib/chart-types";

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

export type ChartKey = (typeof chartRegistry)[keyof typeof chartRegistry];

export type HousingChartRecord = FilterableRecord & {
    id: number;
    familyId?: string;
    currentStatus: string | null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth?: number | null;
    housedMonth?: number | null;
};

type BaseChartDefinition = {
    title: string;
    emptyMessage: string;
};

type VerticalBarChartDefinition = BaseChartDefinition & {
    type: "vertical-bar";
    xLabel: string;
    yLabel: string;
    buildData: (records: HousingChartRecord[]) => VerticalBarDatum[];
};

type LineChartDefinition = BaseChartDefinition & {
    type: "line";
    xLabel: string;
    yLabel: string;
    buildData: (records: HousingChartRecord[]) => LineDatum[];
};

type HorizontalBarChartDefinition = BaseChartDefinition & {
    type: "horizontal-bar";
    xLabel: string;
    yLabel: string;
    buildData: (records: HousingChartRecord[]) => HorizontalBarDatum[];
};

type DonutChartDefinition = BaseChartDefinition & {
    type: "donut";
    centerLabel: string;
    buildData: (records: HousingChartRecord[]) => DonutDatum[];
};

export type ChartDefinition =
    | VerticalBarChartDefinition
    | LineChartDefinition
    | HorizontalBarChartDefinition
    | DonutChartDefinition;

type BaseGeneratedChartModel = {
    chartKey: ChartKey;
    title: string;
    emptyMessage: string;
};

export type GeneratedChartModel = BaseGeneratedChartModel &
    (
        | {
              type: "vertical-bar";
              data: VerticalBarDatum[];
              xLabel: string;
              yLabel: string;
          }
        | {
              type: "line";
              data: LineDatum[];
              xLabel: string;
              yLabel: string;
          }
        | {
              type: "horizontal-bar";
              data: HorizontalBarDatum[];
              xLabel: string;
              yLabel: string;
          }
        | {
              type: "donut";
              data: DonutDatum[];
              centerLabel: string;
          }
    );

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

function getMonthIndex(date: string | null, fallback?: number | null) {
    if (date) {
        const month = Number.parseInt(date.split("-")[1], 10);
        if (month >= 1 && month <= 12) return month - 1;
    }

    if (fallback !== null && fallback !== undefined && fallback >= 0 && fallback <= 11) {
        return fallback;
    }

    return null;
}

function familyIntakeSeries(records: HousingChartRecord[]): VerticalBarDatum[] {
    const counts = new Array<number>(12).fill(0);

    records.forEach((record) => {
        const monthIndex = getMonthIndex(record.intakeDate, record.intakeMonth);
        if (monthIndex === null) return;
        counts[monthIndex] += 1;
    });

    return MONTH_NAMES.map((label, index) => ({
        label,
        value: counts[index] || 0,
    }));
}

function familiesHousedSeries(records: HousingChartRecord[]): LineDatum[] {
    const counts = new Array<number>(12).fill(0);

    records.forEach((record) => {
        const monthIndex = getMonthIndex(record.dateHoused, record.housedMonth);
        if (monthIndex === null) return;
        counts[monthIndex] += 1;
    });

    return MONTH_NAMES.map((label, index) => ({
        label,
        value: counts[index] || 0,
    }));
}

function daysToHouseSeries(records: HousingChartRecord[]): VerticalBarDatum[] {
    const totals = new Map<string, { totalDays: number; count: number }>();

    records.forEach((record) => {
        if (!record.intakeDate || !record.dateHoused) return;

        const start = new Date(record.intakeDate);
        const end = new Date(record.dateHoused);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (!Number.isFinite(days)) return;

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

function locationSeries(records: HousingChartRecord[]): HorizontalBarDatum[] {
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
                b.series.reduce((sum, series) => sum + series.value, 0) -
                a.series.reduce((sum, series) => sum + series.value, 0)
        );
}

function partnerSchoolsSeries(records: HousingChartRecord[]): HorizontalBarDatum[] {
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
                b.series.reduce((sum, series) => sum + series.value, 0) -
                a.series.reduce((sum, series) => sum + series.value, 0)
        );
}

function schoolsByCitySeries(records: HousingChartRecord[]): HorizontalBarDatum[] {
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

function studentsByCitySeries(records: HousingChartRecord[]): HorizontalBarDatum[] {
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

function housingSourcesSeries(records: HousingChartRecord[]): DonutDatum[] {
    const counts = new Map<string, number>();

    records.forEach((record) => {
        if (record.currentStatus !== "housed" || !record.sourceOfHousing) return;
        const current = counts.get(record.sourceOfHousing) ?? 0;
        counts.set(record.sourceOfHousing, current + 1);
    });

    return Array.from(counts.entries())
        .map(([source, count]) => ({ label: source, value: count }))
        .sort((a, b) => b.value - a.value);
}

export const chartDefinitions = {
    "family-intake-bar": {
        title: "Family Intake",
        type: "vertical-bar",
        xLabel: "Month",
        yLabel: "Families",
        emptyMessage: "No family data to display",
        buildData: familyIntakeSeries,
    },
    "families-housed-line": {
        title: "Families Housed",
        type: "line",
        xLabel: "Month",
        yLabel: "Families housed",
        emptyMessage: "No housing data to display",
        buildData: familiesHousedSeries,
    },
    "days-to-house-bar": {
        title: "Days to House Distribution",
        type: "vertical-bar",
        xLabel: "School",
        yLabel: "Avg. days to house",
        emptyMessage: "No days to house data to display",
        buildData: daysToHouseSeries,
    },
    "location-bar": {
        title: "Active vs Housed Families by Location",
        type: "horizontal-bar",
        xLabel: "# of Families",
        yLabel: "Location",
        emptyMessage: "No location data to display",
        buildData: locationSeries,
    },
    "partner-schools-bar": {
        title: "Partner Schools & Homeless Student Counts",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "School",
        emptyMessage: "No counts data to display",
        buildData: partnerSchoolsSeries,
    },
    "schools-by-city-bar": {
        title: "Schools by City",
        type: "horizontal-bar",
        xLabel: "# of Schools",
        yLabel: "City",
        emptyMessage: "No school data to display",
        buildData: schoolsByCitySeries,
    },
    "students-by-city-bar": {
        title: "Students by City",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "City",
        emptyMessage: "No student data to display",
        buildData: studentsByCitySeries,
    },
    "housing-sources-donut": {
        title: "Housing Sources",
        type: "donut",
        centerLabel: "Total Housed",
        emptyMessage: "No source data to display",
        buildData: housingSourcesSeries,
    },
} satisfies Record<ChartKey, ChartDefinition>;

export function isChartKey(chartKey: string): chartKey is ChartKey {
    return chartKey in chartDefinitions;
}

export function getChartDefinition(chartKey: ChartKey): ChartDefinition {
    return chartDefinitions[chartKey];
}

export function buildChartModel(
    chartKey: ChartKey,
    records: HousingChartRecord[]
): GeneratedChartModel {
    const definition = getChartDefinition(chartKey);
    const base = {
        chartKey,
        title: definition.title,
        emptyMessage: definition.emptyMessage,
    };

    switch (definition.type) {
        case "vertical-bar":
            return {
                ...base,
                type: "vertical-bar",
                data: definition.buildData(records),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "line":
            return {
                ...base,
                type: "line",
                data: definition.buildData(records),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "horizontal-bar":
            return {
                ...base,
                type: "horizontal-bar",
                data: definition.buildData(records),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "donut":
            return {
                ...base,
                type: "donut",
                data: definition.buildData(records),
                centerLabel: definition.centerLabel,
            };
    }
}
