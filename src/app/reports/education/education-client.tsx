"use client";

import { useMemo } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { buildChartTitle } from "@/lib/chartTitle";

import GradeImprovementChart, { type GradeRecord } from "./grade-improvement";
import GradeDistributionChart from "./grade-distribution";
import AttendanceBreakdownChart, { type AttendanceRecord } from "./attendance-breakdown";
import AttendanceByGradeChart, { type StudentRecord } from "./attendance-by-grade";

type FilterSummary = Pick<
    FilterState,
    "selectedLocations" | "selectedSchools" | "timeframe" | "fiscalYear" | "customRange"
>;

function filterGrades(records: GradeRecord[], schools: string[]): GradeRecord[] {
    if (!schools.length) return records;
    return records.filter((r) => schools.includes(r.schoolName));
}

function filterAttendance(records: AttendanceRecord[], schools: string[]): AttendanceRecord[] {
    if (!schools.length) return records;
    return records.filter((r) => schools.includes(r.schoolName));
}

function filterStudents(
    records: StudentRecord[],
    schools: string[],
    cities: string[]
): StudentRecord[] {
    return records.filter((r) => {
        if (schools.length && !schools.includes(r.schoolName)) return false;
        if (cities.length && !cities.includes(r.city)) return false;
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
    const selectedLocations = useFilters((s) => s.selectedLocations);
    const selectedSchools = useFilters((s) => s.selectedSchools);
    const timeframe = useFilters((s) => s.timeframe);
    const fiscalYear = useFilters((s) => s.fiscalYear);
    const customRange = useFilters((s) => s.customRange);

    const filteredGrades = useMemo(
        () => filterGrades(grades, selectedSchools),
        [grades, selectedSchools]
    );
    const filteredAttendance = useMemo(
        () => filterAttendance(attendance, selectedSchools),
        [attendance, selectedSchools]
    );
    const filteredStudents = useMemo(
        () => filterStudents(students, selectedSchools, selectedLocations),
        [students, selectedSchools, selectedLocations]
    );

    const filterState: FilterSummary = {
        selectedLocations,
        selectedSchools,
        timeframe,
        fiscalYear,
        customRange,
    };

    // Only show filter labels when a partial (not all, not none) selection is active
    const appliedCities = selectedLocations.length > 0 ? selectedLocations.join(", ") : undefined;
    const appliedSchools = selectedSchools.length > 0 ? selectedSchools.join(", ") : undefined;

    const t = (base: string) => buildChartTitle(base, timeframe, fiscalYear, customRange);

    // Summary stats
    const totalStudents = filteredStudents.length;
    const avgAda = filteredAttendance.length
        ? (
              (filteredAttendance.reduce((sum, r) => sum + parseFloat(r.ada), 0) /
                  filteredAttendance.length) *
              100
          ).toFixed(1) + "%"
        : "—";
    const avgFinal = filteredGrades.length
        ? (
              filteredGrades.reduce((sum, r) => sum + parseFloat(r.finalMark), 0) /
              filteredGrades.length
          ).toFixed(2)
        : "—";

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
                subtext1="Across all schools"
                subtext2="0–4 scale"
                mt="-mt-[10px]"
            />
            <div className="p-20">
                <Chart
                    title={t("Fall vs. Winter Grade Improvement by Subject")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <GradeImprovementChart data={filteredGrades} />
                </Chart>

                <Chart
                    title={t("Average Final Grade by Subject")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <GradeDistributionChart data={filteredGrades} />
                </Chart>

                <Chart
                    title={t("Attendance Rate Breakdown")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <AttendanceBreakdownChart data={filteredAttendance} />
                </Chart>

                <Chart
                    title={t("Average Daily Attendance by Grade Level")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <AttendanceByGradeChart
                        students={filteredStudents}
                        attendance={filteredAttendance}
                    />
                </Chart>
            </div>
        </div>
    );
}
