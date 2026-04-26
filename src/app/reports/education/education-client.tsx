"use client";

import { useMemo } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import { VerticalBarChart } from "@/components/charts/vertical-bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import type { EducationRecord } from "@/lib/getEducationData";

type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

function formatFilters(filters: FilterSummary) {
    const parts: string[] = [];
    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        parts.push(
            `${filters.customRange.from.toLocaleDateString()} - ${filters.customRange.to.toLocaleDateString()}`
        );
    } else {
        parts.push(filters.timeframe);
    }
    if (filters.selectedSchools.length) {
        parts.push(`${filters.selectedSchools.length} schools`);
    }
    if (filters.selectedLocations.length) {
        parts.push(`${filters.selectedLocations.length} locations`);
    }
    return parts.join(" • ");
}

function buildGradeDistribution(data: EducationRecord[]) {
    const bins = Array.from({ length: 5 }, (_, index) => ({
        label: `${index}`,
        value: 0,
    }));

    data.forEach((record) => {
        if (typeof record.grade !== "number" || Number.isNaN(record.grade)) {
            return;
        }

        let bucket = Math.floor(record.grade);
        if (bucket < 0) bucket = 0;
        if (bucket > 4) bucket = 4;

        bins[bucket].value += 1;
    });

    return bins;
}

function buildSubjectDistribution(data: EducationRecord[]) {
    const subjectMap = new Map<string, number>();

    data.forEach((record) => {
        const subject = record.courseSubject?.trim() || "Unknown";
        subjectMap.set(subject, (subjectMap.get(subject) ?? 0) + 1);
    });

    return Array.from(subjectMap, ([label, value]) => ({ label, value })).sort(
        (a, b) => b.value - a.value
    );
}

function buildAverageGradeBySchool(data: EducationRecord[]) {
    const schoolMap = new Map<string, { total: number; count: number }>();

    data.forEach((record) => {
        if (typeof record.grade !== "number" || Number.isNaN(record.grade)) {
            return;
        }
        const school = record.school?.trim() || "Unknown";
        const entry = schoolMap.get(school) ?? { total: 0, count: 0 };
        entry.total += record.grade;
        entry.count += 1;
        schoolMap.set(school, entry);
    });

    return Array.from(schoolMap, ([label, summary]) => ({
        label,
        value: summary.count > 0 ? summary.total / summary.count : 0,
    }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12);
}

export default function EducationClient({ data }: { data: EducationRecord[] }) {
    const selectedLocations = useFilters((s) => s.selectedLocations);
    const selectedSchools = useFilters((s) => s.selectedSchools);
    const timeframe = useFilters((s) => s.timeframe);
    const fiscalYear = useFilters((s) => s.fiscalYear);
    const customRange = useFilters((s) => s.customRange);

    const filteredData = useMemo(
        () =>
            filterRecords(data, {
                selectedLocations,
                selectedSchools,
                timeframe,
                fiscalYear,
                customRange,
            }),
        [
            data,
            selectedLocations,
            selectedSchools,
            timeframe,
            fiscalYear,
            customRange,
        ]
    );

    const gradeDistribution = useMemo(
        () => buildGradeDistribution(filteredData),
        [filteredData]
    );

    const subjectDistribution = useMemo(
        () => buildSubjectDistribution(filteredData),
        [filteredData]
    );

    const averageBySchool = useMemo(
        () => buildAverageGradeBySchool(filteredData),
        [filteredData]
    );

    const averageGrade = useMemo(() => {
        const grades = filteredData
            .map((record) => record.grade)
            .filter(
                (grade): grade is number =>
                    typeof grade === "number" && !Number.isNaN(grade)
            );
        if (!grades.length) return null;
        return grades.reduce((sum, value) => sum + value, 0) / grades.length;
    }, [filteredData]);

    const filterState: FilterSummary = {
        selectedLocations,
        selectedSchools,
        timeframe,
        fiscalYear,
        customRange,
    };

    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Education Dashboard"
                title="Average Grade"
                body={averageGrade !== null ? averageGrade.toFixed(1) : "—"}
                subtext="Across filtered assessments"
                bgColor="bg-[#E0F7F4]"
                title1="Students Assessed"
                title2="Subject Areas"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1={`${filteredData.length}`}
                body2={`${subjectDistribution.length}`}
                subtext1="Evaluated records"
                subtext2="Unique subjects"
                mt="-mt-[10px]"
            />

            <div className="grid grid-cols-1 items-start gap-8 p-10 lg:grid-cols-2">
                <Chart
                    title="Grade Distribution"
                    appliedFilters={formatFilters(filterState)}
                    filterState={filterState}
                >
                    <VerticalBarChart
                        data={gradeDistribution}
                        xLabel="Grade Range"
                        yLabel="Students"
                    />
                </Chart>

                <Chart
                    title="Students by Subject"
                    appliedFilters={formatFilters(filterState)}
                    filterState={filterState}
                >
                    <DonutChart data={subjectDistribution} />
                </Chart>

                <Chart
                    title="Average Grade by School"
                    appliedFilters={formatFilters(filterState)}
                    filterState={filterState}
                >
                    <VerticalBarChart
                        data={averageBySchool}
                        xLabel="School"
                        yLabel="Average Grade"
                    />
                </Chart>
            </div>
        </div>
    );
}
