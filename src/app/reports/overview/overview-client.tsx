"use client";

import { useRouter } from "next/navigation";
import type { HousedBaselineSummary } from "@/lib/baselines";
import { useEffect, useMemo, useState } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import type { ChartDataSource, HousingChartRecord } from "@/lib/chart-definitions";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import type { StoredChart } from "@/lib/generateChart";

export type OverviewRecord = HousingChartRecord;

export type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

export default function OverviewClient({ data, housedSummary }: { data: OverviewRecord[]; housedSummary: HousedBaselineSummary }) {
    const router = useRouter();
    useEffect(() => {
        const refresh = () => router.refresh();
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
    }, [router]);
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const selectedLocations = useFilters((s) => s.selectedLocations);
    const selectedSchools = useFilters((s) => s.selectedSchools);
    const timeframe = useFilters((s) => s.timeframe);
    const fiscalYear = useFilters((s) => s.fiscalYear);
    const customRange = useFilters((s) => s.customRange);
    const chartSource = useMemo<ChartDataSource>(
        () => ({ housing: data }),
        [data]
    );

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

    const fastFacts = useMemo(() => {
        const totalFamilies = filteredData.length;
        const waitTimes = filteredData
            .map((record) => {
                if (!record.intakeDate || !record.dateHoused) return null;

                const start = new Date(record.intakeDate).getTime();
                const end = new Date(record.dateHoused).getTime();
                const days = (end - start) / (1000 * 60 * 60 * 24);

                return Number.isFinite(days) ? days : null;
            })
            .filter((days): days is number => days !== null);
        const averageWaitTime =
            waitTimes.length > 0
                ? Math.round(
                      waitTimes.reduce((sum, days) => sum + days, 0) /
                          waitTimes.length
                  )
                : null;
        return {
            totalFamilies: totalFamilies.toLocaleString(),
            averageWaitTime:
                averageWaitTime === null ? "N/A" : `${averageWaitTime} days`,
        };
    }, [filteredData]);

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
            <DashboardTop
                pageTitle="Overview"
                title="Total Families Enrolled"
                body={fastFacts.totalFamilies}
                subtext="Selected report filters"
                bgColor="bg-[#E0F7F4]"
                title1="Families Housed to Date"
                title2="Average Wait Time"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1={housedSummary.total?.toLocaleString() ?? "Not set"}
                body2={fastFacts.averageWaitTime}
                subtext1={housedSummary.baseline ? `${housedSummary.provisional ? "Provisional · " : ""}${housedSummary.baseline.startingValue.toLocaleString()} historical + ${housedSummary.additions?.toLocaleString()} since ${housedSummary.baseline.asOfDate} · All families` : "Historical baseline not set"}
                subtext2="Intake to housed"
                mt="-mt-[10px]"
            />
            <div className="grid grid-cols-1 items-start gap-8 p-10 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Family Intake Over Time")}
                    chartType="family-intake-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="family-intake-bar" source={chartSource} filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Families Housed Over Time")}
                    chartType="families-housed-line"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="families-housed-line" source={chartSource} filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="days-to-house-bar" source={chartSource} filters={filterState} />
                </Chart>
            </div>
        </div>
    );
}
