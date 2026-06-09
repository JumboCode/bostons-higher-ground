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
    "Education Students by City": "education-students-by-city-bar",
    "Fall vs. Winter Grade Improvement by Subject": "grade-improvement-bar",
    "Average Final Grade by Subject": "grade-distribution-bar",
    "Attendance Rate Breakdown": "attendance-breakdown-donut",
    "Average Daily Attendance by Grade Level": "attendance-by-grade-bar",
    "Students per Partner School": "students-per-school-bar",
    "Students by ZIP Code": "students-by-zip-bar",
    "Grade Level Distribution": "grade-level-distribution-bar",
    "Average Attendance Rate by School": "attendance-by-school-bar",
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

export type GradeRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    rubricCode: string;
    rubricName: string;
    fMark: string | null;
    wMark: string | null;
    finalMark: string;
};

export type StudentRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    gradeLevel: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    address: string;
    city: string;
    zip: number;
};

export type AttendanceRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    daysPresent: number;
    daysAbsent: number;
    daysUnexcusedAbsent: number;
    daysMembership: number;
    ada: string;
};

export type ChartDataSource = {
    housing: HousingChartRecord[];
    grades?: GradeRecord[];
    students?: StudentRecord[];
    attendance?: AttendanceRecord[];
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
        source: ChartDataSource,
        filters: ChartFilters
    ) => VerticalBarDatum[];
};

type LineChartDefinition = BaseChartDefinition & {
    type: "line";
    xLabel: string;
    yLabel: string;
    buildData: (source: ChartDataSource, filters: ChartFilters) => LineDatum[];
};

type HorizontalBarChartDefinition = BaseChartDefinition & {
    type: "horizontal-bar";
    xLabel: string;
    yLabel: string;
    buildData: (
        source: ChartDataSource,
        filters: ChartFilters
    ) => HorizontalBarDatum[];
};

type DonutChartDefinition = BaseChartDefinition & {
    type: "donut";
    centerLabel: string;
    buildData: (source: ChartDataSource, filters: ChartFilters) => DonutDatum[];
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

const GRADE_ORDER = ["K0", "K1", "K2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function parseNumber(value: string | number | null | undefined) {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function filterStudents(records: StudentRecord[], filters: ChartFilters) {
    return records.filter((record) => {
        if (
            filters.selectedSchools.length > 0 &&
            !filters.selectedSchools.includes(record.schoolName)
        ) {
            return false;
        }

        if (
            filters.selectedLocations.length > 0 &&
            !filters.selectedLocations.includes(record.city)
        ) {
            return false;
        }

        return true;
    });
}

function filterGrades(records: GradeRecord[], filters: ChartFilters) {
    if (!filters.selectedSchools.length) return records;
    return records.filter((record) =>
        filters.selectedSchools.includes(record.schoolName)
    );
}

function filterAttendance(
    records: AttendanceRecord[],
    filters: ChartFilters,
    students: StudentRecord[] = []
) {
    const filteredStudentIds = filters.selectedLocations.length
        ? new Set(filterStudents(students, filters).map((student) => student.studentId))
        : null;

    return records.filter((record) => {
        if (
            filters.selectedSchools.length > 0 &&
            !filters.selectedSchools.includes(record.schoolName)
        ) {
            return false;
        }

        if (filteredStudentIds && !filteredStudentIds.has(record.studentId)) {
            return false;
        }

        return true;
    });
}

function gradeImprovementSeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const bySubject = new Map<string, { fall: number[]; winter: number[] }>();

    filterGrades(source.grades ?? [], filters).forEach((record) => {
        if (!record.rubricName) return;
        const entry = bySubject.get(record.rubricName) ?? { fall: [], winter: [] };
        const fall = parseNumber(record.fMark);
        const winter = parseNumber(record.wMark);

        if (fall !== null) entry.fall.push(fall);
        if (winter !== null) entry.winter.push(winter);
        bySubject.set(record.rubricName, entry);
    });

    return Array.from(bySubject.entries())
        .filter(([, values]) => values.fall.length > 0 || values.winter.length > 0)
        .map(([subject, values]) => {
            const avgFall = values.fall.length
                ? values.fall.reduce((sum, value) => sum + value, 0) / values.fall.length
                : 0;
            const avgWinter = values.winter.length
                ? values.winter.reduce((sum, value) => sum + value, 0) / values.winter.length
                : 0;

            return {
                category: subject,
                series: [
                    { label: "Fall", value: Number(avgFall.toFixed(2)) },
                    { label: "Winter", value: Number(avgWinter.toFixed(2)) },
                ],
            };
        })
        .sort(
            (a, b) =>
                b.series.reduce((sum, series) => sum + series.value, 0) -
                a.series.reduce((sum, series) => sum + series.value, 0)
        );
}

function gradeDistributionSeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const bySubject = new Map<string, number[]>();

    filterGrades(source.grades ?? [], filters).forEach((record) => {
        if (!record.rubricName) return;
        const mark = parseNumber(record.finalMark);
        if (mark === null) return;
        const current = bySubject.get(record.rubricName) ?? [];
        current.push(mark);
        bySubject.set(record.rubricName, current);
    });

    return Array.from(bySubject.entries())
        .map(([subject, marks]) => ({
            category: subject,
            series: [
                {
                    label: "Avg Final Mark",
                    value: Number(
                        (marks.reduce((sum, mark) => sum + mark, 0) / marks.length).toFixed(2)
                    ),
                },
            ],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

function attendanceBreakdownSeries(
    source: ChartDataSource,
    filters: ChartFilters
): DonutDatum[] {
    let regular = 0;
    let atRisk = 0;
    let chronic = 0;

    filterAttendance(source.attendance ?? [], filters, source.students).forEach((record) => {
        const ada = parseNumber(record.ada);
        if (ada === null) return;
        if (ada >= 0.9) regular += 1;
        else if (ada >= 0.8) atRisk += 1;
        else chronic += 1;
    });

    return [
        { label: "Regular (>=90%)", value: regular, color: "#7DA3A1" },
        { label: "At Risk (80-90%)", value: atRisk, color: "#E0A458" },
        { label: "Chronic (<80%)", value: chronic, color: "#D28A93" },
    ].filter((datum) => datum.value > 0);
}

function attendanceByGradeSeries(
    source: ChartDataSource,
    filters: ChartFilters
): VerticalBarDatum[] {
    const students = filterStudents(source.students ?? [], filters);
    const gradeByStudent = new Map(students.map((student) => [student.studentId, student.gradeLevel]));
    const adaByGrade = new Map<string, number[]>();

    filterAttendance(source.attendance ?? [], filters, students).forEach((record) => {
        const grade = gradeByStudent.get(record.studentId);
        const ada = parseNumber(record.ada);
        if (!grade || ada === null) return;
        const values = adaByGrade.get(grade) ?? [];
        values.push(ada * 100);
        adaByGrade.set(grade, values);
    });

    return GRADE_ORDER.filter((grade) => adaByGrade.has(grade)).map((grade) => {
        const values = adaByGrade.get(grade) ?? [];
        return {
            label: grade,
            value: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)),
        };
    });
}

function studentsPerSchoolSeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const counts = new Map<string, number>();

    filterStudents(source.students ?? [], filters).forEach((record) => {
        counts.set(record.schoolName, (counts.get(record.schoolName) ?? 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([school, count]) => ({
            category: school,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

function educationStudentsByCitySeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const counts = new Map<string, number>();

    filterStudents(source.students ?? [], filters).forEach((record) => {
        if (!record.city) return;
        counts.set(record.city, (counts.get(record.city) ?? 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([city, count]) => ({
            category: city,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

function studentsByZipSeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const counts = new Map<string, number>();

    filterStudents(source.students ?? [], filters).forEach((record) => {
        if (!record.zip) return;
        const zip = String(record.zip);
        counts.set(zip, (counts.get(zip) ?? 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([zip, count]) => ({
            category: zip,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value)
        .slice(0, 15);
}

function gradeLevelDistributionSeries(
    source: ChartDataSource,
    filters: ChartFilters
): VerticalBarDatum[] {
    const counts = new Map<string, number>();

    filterStudents(source.students ?? [], filters).forEach((record) => {
        if (!record.gradeLevel) return;
        counts.set(record.gradeLevel, (counts.get(record.gradeLevel) ?? 0) + 1);
    });

    return GRADE_ORDER.filter((grade) => counts.has(grade)).map((grade) => ({
        label: grade,
        value: counts.get(grade) ?? 0,
    }));
}

function attendanceBySchoolSeries(
    source: ChartDataSource,
    filters: ChartFilters
): HorizontalBarDatum[] {
    const bySchool = new Map<string, number[]>();

    filterAttendance(source.attendance ?? [], filters, source.students).forEach((record) => {
        const ada = parseNumber(record.ada);
        if (!record.schoolName || ada === null) return;
        const values = bySchool.get(record.schoolName) ?? [];
        values.push(ada * 100);
        bySchool.set(record.schoolName, values);
    });

    return Array.from(bySchool.entries())
        .map(([school, values]) => ({
            category: school,
            series: [
                {
                    label: "Avg Attendance %",
                    value: Number(
                        (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
                    ),
                },
            ],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export const chartDefinitions = {
    "family-intake-bar": {
        title: "Family Intake",
        type: "vertical-bar",
        xLabel: "Time",
        yLabel: "Families",
        emptyMessage: "No family data to display",
        buildData: (source, filters) => familyIntakeSeries(source.housing, filters),
    },
    "families-housed-line": {
        title: "Families Housed",
        type: "line",
        xLabel: "Time",
        yLabel: "Families housed",
        emptyMessage: "No housing data to display",
        buildData: (source, filters) => familiesHousedSeries(source.housing, filters),
    },
    "days-to-house-bar": {
        title: "Days to House Distribution",
        type: "vertical-bar",
        xLabel: "School",
        yLabel: "Avg. days to house",
        emptyMessage: "No days to house data to display",
        buildData: (source, filters) => daysToHouseSeries(source.housing, filters),
    },
    "location-bar": {
        title: "Active vs Housed Families by Location",
        type: "horizontal-bar",
        xLabel: "# of Families",
        yLabel: "Location",
        emptyMessage: "No location data to display",
        buildData: (source, filters) => locationSeries(source.housing, filters),
    },
    "partner-schools-bar": {
        title: "Partner Schools & Homeless Student Counts",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "School",
        emptyMessage: "No counts data to display",
        buildData: (source, filters) => partnerSchoolsSeries(source.housing, filters),
    },
    "schools-by-city-bar": {
        title: "Schools by City",
        type: "horizontal-bar",
        xLabel: "# of Schools",
        yLabel: "City",
        emptyMessage: "No school data to display",
        buildData: (source, filters) => schoolsByCitySeries(source.housing, filters),
    },
    "students-by-city-bar": {
        title: "Students by City",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "City",
        emptyMessage: "No student data to display",
        buildData: (source, filters) => studentsByCitySeries(source.housing, filters),
    },
    "housing-sources-donut": {
        title: "Housing Sources",
        type: "donut",
        centerLabel: "Total Housed",
        emptyMessage: "No source data to display",
        buildData: (source, filters) => housingSourcesSeries(source.housing, filters),
    },
    "grade-improvement-bar": {
        title: "Fall vs. Winter Grade Improvement by Subject",
        type: "horizontal-bar",
        xLabel: "Average Mark (0-4)",
        yLabel: "Subject",
        emptyMessage: "No grade data available.",
        buildData: gradeImprovementSeries,
    },
    "grade-distribution-bar": {
        title: "Average Final Grade by Subject",
        type: "horizontal-bar",
        xLabel: "Average Final Mark (0-4)",
        yLabel: "Subject",
        emptyMessage: "No grade data available.",
        buildData: gradeDistributionSeries,
    },
    "attendance-breakdown-donut": {
        title: "Attendance Rate Breakdown",
        type: "donut",
        centerLabel: "Students",
        emptyMessage: "No attendance data available.",
        buildData: attendanceBreakdownSeries,
    },
    "attendance-by-grade-bar": {
        title: "Average Daily Attendance by Grade Level",
        type: "vertical-bar",
        xLabel: "Grade Level",
        yLabel: "Avg Daily Attendance (%)",
        emptyMessage: "No attendance data available.",
        buildData: attendanceByGradeSeries,
    },
    "students-per-school-bar": {
        title: "Students per Partner School",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "School",
        emptyMessage: "No student data available.",
        buildData: studentsPerSchoolSeries,
    },
    "students-by-zip-bar": {
        title: "Students by ZIP Code",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "ZIP Code",
        emptyMessage: "No student data available.",
        buildData: studentsByZipSeries,
    },
    "education-students-by-city-bar": {
        title: "Students by City",
        type: "horizontal-bar",
        xLabel: "# of Students",
        yLabel: "City",
        emptyMessage: "No student data available.",
        buildData: educationStudentsByCitySeries,
    },
    "grade-level-distribution-bar": {
        title: "Grade Level Distribution",
        type: "vertical-bar",
        xLabel: "Grade Level",
        yLabel: "# of Students",
        emptyMessage: "No student data available.",
        buildData: gradeLevelDistributionSeries,
    },
    "attendance-by-school-bar": {
        title: "Average Attendance Rate by School",
        type: "horizontal-bar",
        xLabel: "Avg Daily Attendance (%)",
        yLabel: "School",
        emptyMessage: "No attendance data available.",
        buildData: attendanceBySchoolSeries,
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
    dataSource: HousingChartRecord[] | ChartDataSource,
    filters?: Partial<ChartFilters>
): GeneratedChartModel {
    const definition = getChartDefinition(chartKey);
    const resolvedFilters = normalizeFilters(filters);
    const source = Array.isArray(dataSource)
        ? { housing: dataSource }
        : dataSource;
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
                data: definition.buildData(source, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "line":
            return {
                ...base,
                type: "line",
                data: definition.buildData(source, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "horizontal-bar":
            return {
                ...base,
                type: "horizontal-bar",
                data: definition.buildData(source, resolvedFilters),
                xLabel: definition.xLabel,
                yLabel: definition.yLabel,
            };
        case "donut":
            return {
                ...base,
                type: "donut",
                data: definition.buildData(source, resolvedFilters),
                centerLabel: definition.centerLabel,
            };
    }
}
