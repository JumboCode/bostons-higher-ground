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

export default function SchoolsClient({
    students,
    attendance,
}: {
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
        () => ({ housing: [], students, attendance }),
        [attendance, students]
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
                    Schools Dashboard
                </h1>
            </div>
            <div className="grid grid-cols-1 items-start gap-8 p-10 py-5 lg:grid-cols-2">
                <Chart
                    title={formatTitle(filterState, "Students per Partner School")}
                    chartType="students-per-school-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="students-per-school-bar" source={source} filters={filterState} />
                    </div>
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Students by City")}
                    chartType="education-students-by-city-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="education-students-by-city-bar" source={source} filters={filterState} />
                    </div>
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Students by ZIP Code")}
                    chartType="students-by-zip-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="students-by-zip-bar" source={source} filters={filterState} />
                    </div>
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Grade Level Distribution")}
                    chartType="grade-level-distribution-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="grade-level-distribution-bar" source={source} filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Average Attendance Rate by School")}
                    chartType="attendance-by-school-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="max-h-150 w-full min-w-0 overflow-y-auto">
                        <DashboardChart chartKey="attendance-by-school-bar" source={source} filters={filterState} />
                    </div>
                </Chart>
            </div>
        </div>
    );
}
