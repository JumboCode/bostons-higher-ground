"use client";

import { useEffect, useMemo, useState } from "react";
import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import type { StoredChart } from "@/lib/generateChart";

export type SchoolRecord = {
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
};

type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

export default function SchoolsClient({ data }: { data: SchoolRecord[] }) {
    const [charts, setCharts] = useState<StoredChart[]>([]);
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
        <>
            <div className="w-full">
                <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 pb-5">
                    <h1 className="text-2xl font-extrabold text-[#555555] sm:text-3xl lg:text-4xl">
                        Schools Dashboard
                    </h1>
                </div>
            </div>
            <div className="grid grid-cols-1 items-start gap-8 p-10 py-5 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Partner Schools & Homeless Student Counts")}
                    chartType="partner-schools-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150 w-full min-w-0">
                        <DashboardChart chartKey="partner-schools-bar" records={filteredData} />
                    </div>
                </Chart>
                <Chart
                    title = {formatTitle(filterState, "Schools by City")}
                    chartType="schools-by-city-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150 w-full min-w-0">
                        <DashboardChart chartKey="schools-by-city-bar" records={filteredData} />
                    </div>
                </Chart>
                <Chart
                    title = {formatTitle(filterState, "Housing Sources")}
                    chartType="housing-sources-donut"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150 w-full min-w-0">
                        <DashboardChart chartKey="housing-sources-donut" records={filteredData} />
                    </div>
                </Chart>
                <Chart
                    title = {formatTitle(filterState, "Students by City")}
                    chartType="students-by-city-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150 w-full min-w-0">
                        <DashboardChart chartKey="students-by-city-bar" records={filteredData} />
                    </div>
                </Chart>
            </div>
        </>
    );
}
