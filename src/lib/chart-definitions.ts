import type { FilterableRecord } from "@/lib/applyFilters";
import type { Timeframe } from "@/lib/filterStore";
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

export type ChartFilters = {
    selectedLocations: string[];
    selectedSchools: string[];
    timeframe: Timeframe;
    fiscalYear?: number;
    customRange?: { from?: Date; to?: Date };
};

type BaseChartDefinition = {
    title: string;
    emptyMessage: string;
};

type VerticalBarChartDefinition = BaseChartDefinition & {
    type: "vertical-bar";
    xLabel: string;
    yLabel: string;
    buildData: (
        records: HousingChartRecord[],
        filters: ChartFilters
    ) => VerticalBarDatum[];
};

type LineChartDefinition = BaseChartDefinition & {
    type: "line";
    xLabel: string;
    yLabel: string;
    buildData: (records: HousingChartRecord[], filters: ChartFilters) => LineDatum[];
};

type HorizontalBarChartDefinition = BaseChartDefinition & {
    type: "horizontal-bar";
    xLabel: string;
    yLabel: string;
    buildData: (
        records: HousingChartRecord[],
        filters: ChartFilters
    ) => HorizontalBarDatum[];
};

type DonutChartDefinition = BaseChartDefinition & {
    type: "donut";
    centerLabel: string;
    buildData: (records: HousingChartRecord[], filters: ChartFilters) => DonutDatum[];
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

type ChartDateField = "intakeDate" | "dateHoused";

type DateRange = {
    start: Date;
    end: Date;
};

type TimeBucket = {
    key: string;
    label: string;
    granularity: "month" | "year";
};

function normalizeFilters(filters?: Partial<ChartFilters>): ChartFilters {
    return {
        selectedLocations: filters?.selectedLocations ?? [],
        selectedSchools: filters?.selectedSchools ?? [],
        timeframe: filters?.timeframe ?? "allTime",
        fiscalYear: filters?.fiscalYear,
        customRange: filters?.customRange,
    };
}

function parseDate(value: string | null | undefined) {
    if (!value) return null;

    const [year, month, day] = value.split("-").map(Number);
    if (year && month && day) {
        const date = new Date(year, month - 1, day);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999
    );
}

function resolveDateRange(filters: ChartFilters): DateRange | null {
    const today = new Date();

    switch (filters.timeframe) {
        case "thisMonth":
            return {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: endOfDay(today),
            };
        case "lastMonth":
            return {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: endOfDay(new Date(today.getFullYear(), today.getMonth(), 0)),
            };
        case "thisFY": {
            const fy = filters.fiscalYear ?? today.getFullYear();
            return {
                start: new Date(fy - 1, 6, 1),
                end: new Date(fy, 5, 30, 23, 59, 59, 999),
            };
        }
        case "custom":
            if (filters.customRange?.from && filters.customRange?.to) {
                return {
                    start: startOfDay(filters.customRange.from),
                    end: endOfDay(filters.customRange.to),
                };
            }
            return null;
        case "allTime":
        default:
            return null;
    }
}

function recordMatchesCategories(
    record: HousingChartRecord,
    filters: ChartFilters
) {
    if (
        filters.selectedLocations.length > 0 &&
        record.city &&
        !filters.selectedLocations.includes(record.city)
    ) {
        return false;
    }

    if (
        filters.selectedSchools.length > 0 &&
        record.school &&
        !filters.selectedSchools.includes(record.school)
    ) {
        return false;
    }

    return true;
}

function dateInRange(date: Date, range: DateRange) {
    return date >= range.start && date <= range.end;
}

function getRecordDate(record: HousingChartRecord, field: ChartDateField) {
    return parseDate(record[field]);
}

function getPreferredRecordDate(record: HousingChartRecord) {
    return parseDate(record.intakeDate) ?? parseDate(record.dateHoused);
}

function filterCommonRecords(
    records: HousingChartRecord[],
    filters: ChartFilters
) {
    const range = resolveDateRange(filters);

    return records.filter((record) => {
        if (!recordMatchesCategories(record, filters)) return false;
        if (!range) return true;

        const date = getPreferredRecordDate(record);
        return date ? dateInRange(date, range) : false;
    });
}

function inferDateRange(
    records: HousingChartRecord[],
    field: ChartDateField
): DateRange | null {
    const dates = records
        .map((record) => getRecordDate(record, field))
        .filter((date): date is Date => date !== null)
        .sort((a, b) => a.getTime() - b.getTime());

    if (!dates.length) return null;

    return {
        start: startOfDay(dates[0]),
        end: endOfDay(dates[dates.length - 1]),
    };
}

function monthSpan(range: DateRange) {
    return (
        (range.end.getFullYear() - range.start.getFullYear()) * 12 +
        range.end.getMonth() -
        range.start.getMonth() +
        1
    );
}

function bucketKey(date: Date, granularity: TimeBucket["granularity"]) {
    if (granularity === "year") return `${date.getFullYear()}`;
    return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildTimeBuckets(range: DateRange): TimeBucket[] {
    const bucketByMonth = monthSpan(range) <= 24;
    const buckets: TimeBucket[] = [];

    if (!bucketByMonth) {
        for (let year = range.start.getFullYear(); year <= range.end.getFullYear(); year += 1) {
            buckets.push({ key: `${year}`, label: `${year}`, granularity: "year" });
        }
        return buckets;
    }

    const includeYear = range.start.getFullYear() !== range.end.getFullYear();
    const current = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    const final = new Date(range.end.getFullYear(), range.end.getMonth(), 1);

    while (current <= final) {
        buckets.push({
            key: bucketKey(current, "month"),
            label: includeYear
                ? `${MONTH_NAMES[current.getMonth()]} ${current.getFullYear()}`
                : MONTH_NAMES[current.getMonth()],
            granularity: "month",
        });
        current.setMonth(current.getMonth() + 1);
    }

    return buckets;
}

function buildTimeSeries(
    records: HousingChartRecord[],
    filters: ChartFilters,
    field: ChartDateField
): LineDatum[] {
    const categoryFilteredRecords = records.filter((record) =>
        recordMatchesCategories(record, filters)
    );
    const range = resolveDateRange(filters) ?? inferDateRange(categoryFilteredRecords, field);
    if (!range) return [];

    const buckets = buildTimeBuckets(range);
    const counts = new Map(buckets.map((bucket) => [bucket.key, 0]));
    const granularity = buckets[0]?.granularity ?? "month";

    categoryFilteredRecords.forEach((record) => {
        const date = getRecordDate(record, field);
        if (!date || !dateInRange(date, range)) return;

        const key = bucketKey(date, granularity);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return buckets.map((bucket) => ({
        label: bucket.label,
        value: counts.get(bucket.key) ?? 0,
    }));
}

function familyIntakeSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): VerticalBarDatum[] {
    return buildTimeSeries(records, filters, "intakeDate");
}

function familiesHousedSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): LineDatum[] {
    return buildTimeSeries(records, filters, "dateHoused");
}

function daysToHouseSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): VerticalBarDatum[] {
    const totals = new Map<string, { totalDays: number; count: number }>();

    filterCommonRecords(records, filters).forEach((record) => {
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

function locationSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): HorizontalBarDatum[] {
    const cityCounts = new Map<string, { active: number; housed: number }>();

    filterCommonRecords(records, filters).forEach((record) => {
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

function partnerSchoolsSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): HorizontalBarDatum[] {
    const schoolCounts = new Map<string, { active: number; housed: number }>();

    filterCommonRecords(records, filters).forEach((record) => {
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

function schoolsByCitySeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): HorizontalBarDatum[] {
    const citySchools = new Map<string, Set<string>>();

    filterCommonRecords(records, filters).forEach((record) => {
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

function studentsByCitySeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): HorizontalBarDatum[] {
    const cityTotals = new Map<string, number>();

    filterCommonRecords(records, filters).forEach((record) => {
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

function housingSourcesSeries(
    records: HousingChartRecord[],
    filters: ChartFilters
): DonutDatum[] {
    const counts = new Map<string, number>();

    filterCommonRecords(records, filters).forEach((record) => {
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
        xLabel: "Time",
        yLabel: "Families",
        emptyMessage: "No family data to display",
        buildData: familyIntakeSeries,
    },
    "families-housed-line": {
        title: "Families Housed",
        type: "line",
        xLabel: "Time",
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
    records: HousingChartRecord[],
    filters?: Partial<ChartFilters>
): GeneratedChartModel {
    const definition = getChartDefinition(chartKey);
    const resolvedFilters = normalizeFilters(filters);
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
                data: definition.buildData(records, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "line":
            return {
                ...base,
                type: "line",
                data: definition.buildData(records, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "horizontal-bar":
            return {
                ...base,
                type: "horizontal-bar",
                data: definition.buildData(records, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "donut":
            return {
                ...base,
                type: "donut",
                data: definition.buildData(records, resolvedFilters),
                centerLabel: definition.centerLabel,
            };
    }
}
