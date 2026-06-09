"use client";

import { useEffect, useMemo, useState } from "react";

import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
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

    return (
        <div className="w-full">
            <div className="w-full px-4 pt-10 pb-5 sm:px-6 lg:px-10">
                <h1 className="text-2xl font-extrabold text-[#555555] sm:text-3xl lg:text-4xl">
                    Education Dashboard
                </h1>
            </div>
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
