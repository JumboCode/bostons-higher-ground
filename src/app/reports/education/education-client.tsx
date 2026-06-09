"use client";

import { useEffect, useMemo, useState } from "react";

import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
import DashboardTop from "@/components/DashboardTop";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import useFilters, { type FilterState } from "@/lib/filterStore";
import type { StoredChart } from "@/lib/generateChart";
import type {
    AttendanceRecord,
    ChartDataSource,
    GradeRecord,
    StudentRecord,
} from "@/lib/chart-definitions";

type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

function filterStudents(
    records: StudentRecord[],
    schools: string[],
    cities: string[]
) {
    return records.filter((record) => {
        if (schools.length && !schools.includes(record.schoolName)) return false;
        if (cities.length && !cities.includes(record.city)) return false;
        return true;
    });
}

function filterGrades(records: GradeRecord[], schools: string[]) {
    if (!schools.length) return records;
    return records.filter((record) => schools.includes(record.schoolName));
}

function filterAttendance(
    records: AttendanceRecord[],
    schools: string[],
    studentIds?: Set<number>
) {
    return records.filter((record) => {
        if (schools.length && !schools.includes(record.schoolName)) return false;
        if (studentIds && !studentIds.has(record.studentId)) return false;
        return true;
    });
}

export default function EducationClient({
    grades,
    students,
    attendance,
}: {
    grades: GradeRecord[];
    students: StudentRecord[];
    attendance: AttendanceRecord[];
}) {
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const selectedLocations = useFilters((s) => s.selectedLocations);
    const selectedSchools = useFilters((s) => s.selectedSchools);
    const timeframe = useFilters((s) => s.timeframe);
    const fiscalYear = useFilters((s) => s.fiscalYear);
    const customRange = useFilters((s) => s.customRange);

    const filterState: FilterSummary = {
        selectedLocations,
        selectedSchools,
        timeframe,
        fiscalYear,
        customRange,
    };
    const source = useMemo<ChartDataSource>(
        () => ({ housing: [], grades, students, attendance }),
        [attendance, grades, students]
    );

    const filteredStudents = useMemo(
        () => filterStudents(students, selectedSchools, selectedLocations),
        [selectedLocations, selectedSchools, students]
    );
    const filteredStudentIds = useMemo(
        () =>
            selectedLocations.length
                ? new Set(filteredStudents.map((student) => student.studentId))
                : undefined,
        [filteredStudents, selectedLocations.length]
    );
    const filteredGrades = useMemo(
        () => filterGrades(grades, selectedSchools),
        [grades, selectedSchools]
    );
    const filteredAttendance = useMemo(
        () => filterAttendance(attendance, selectedSchools, filteredStudentIds),
        [attendance, filteredStudentIds, selectedSchools]
    );

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const res = await fetch("/api/reports/in-progress");
                if (!res.ok) return;
                const data = await res.json();
                setCharts(data.charts || []);
            } catch (err) {
                console.error("Failed to fetch in-progress charts", err);
            }
        };

        fetchCharts();
        window.addEventListener("report-updated", fetchCharts);
        return () => window.removeEventListener("report-updated", fetchCharts);
    }, []);

    const totalStudents = filteredStudents.length;
    const avgAda = filteredAttendance.length
        ? `${(
              (filteredAttendance.reduce(
                  (sum, record) => sum + Number.parseFloat(record.ada),
                  0
              ) /
                  filteredAttendance.length) *
              100
          ).toFixed(1)}%`
        : "-";
    const avgFinal = filteredGrades.length
        ? (
              filteredGrades.reduce(
                  (sum, record) => sum + Number.parseFloat(record.finalMark),
                  0
              ) / filteredGrades.length
          ).toFixed(2)
        : "-";

    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Education Dashboard"
                title="Total Students"
                body={String(totalStudents)}
                subtext="Enrolled"
                bgColor="bg-[#E0F7F4]"
                title1="Avg Daily Attendance"
                title2="Avg Final Grade"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1={avgAda}
                body2={avgFinal}
                subtext1="Across selected schools"
                subtext2="0-4 scale"
                mt="-mt-[10px]"
            />
            <div className="grid grid-cols-1 items-start gap-8 p-10 py-5 lg:grid-cols-2">
                <Chart
                    title={formatTitle(filterState, "Fall vs. Winter Grade Improvement by Subject")}
                    chartType="grade-improvement-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="grade-improvement-bar" source={source} filters={filterState} />
                    </div>
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Average Final Grade by Subject")}
                    chartType="grade-distribution-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="grade-distribution-bar" source={source} filters={filterState} />
                    </div>
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Attendance Rate Breakdown")}
                    chartType="attendance-breakdown-donut"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="attendance-breakdown-donut" source={source} filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Average Daily Attendance by Grade Level")}
                    chartType="attendance-by-grade-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="attendance-by-grade-bar" source={source} filters={filterState} />
                </Chart>
            </div>
        </div>
    );
}
