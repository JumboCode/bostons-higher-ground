"use client";

import { useEffect, useState } from "react";
import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import type { StoredChart } from "@/lib/generateChart";

export type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

export type HousingRecord = {
    id: number;
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
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

export default function HousingClient({ data }: { data: HousingRecord[] }) {
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
            <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 pb-5">
                <h1 className="text-2xl font-extrabold text-[#555555] sm:text-3xl lg:text-4xl">
                    Housing Dashboard
                </h1>
            </div>
            <div className="grid grid-cols-1 items-start gap-8 p-10 py-5 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Family Intake Over Time")}
                    chartType="family-intake-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="family-intake-bar" records={data} filters={filterState} />
                </Chart>

                <Chart
                    title = {formatTitle(filterState, "Families Housed Over Time")}
                    chartType="families-housed-line"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="families-housed-line" records={data} filters={filterState} />
                </Chart>

                <Chart
                    title = {formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="days-to-house-bar" records={data} filters={filterState} />
                </Chart>

                <Chart
                    title = {formatTitle(filterState, "Active vs Housed Families by Location")}
                    chartType="location-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150">
                        <DashboardChart chartKey="location-bar" records={data} filters={filterState} />
                    </div>
                </Chart>
            </div>
        </div>
    );
}
