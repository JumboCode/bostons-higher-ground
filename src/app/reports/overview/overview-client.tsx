"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import FamilyIntakeBarChart from "../housing/barchart";
import LineChart from "../housing/linechart";
import DaysHousedBarChart from "../housing/barchart2";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import { type HousingRecord } from "../housing/housing-client";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import { StoredChart } from "@/lib/generateChart";

export type OverviewRecord = HousingRecord;

export type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

export default function OverviewClient({ data }: { data: OverviewRecord[] }) {
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

    const fastFacts = useMemo(() => {
        const totalFamilies = filteredData.length;
        const housedFamilies = filteredData.filter(
            (record) => record.dateHoused !== null && record.dateHoused !== undefined
        ).length;
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
        const successRate =
            totalFamilies > 0
                ? `${((housedFamilies / totalFamilies) * 100).toFixed(1)}% success rate`
                : "No families enrolled";

        return {
            totalFamilies: totalFamilies.toLocaleString(),
            housedFamilies: housedFamilies.toLocaleString(),
            averageWaitTime:
                averageWaitTime === null ? "N/A" : `${averageWaitTime} days`,
            successRate,
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
                subtext="All-time enrollment"
                bgColor="bg-[#E0F7F4]"
                title1="Families Housed to Date"
                title2="Average Wait Time"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1={fastFacts.housedFamilies}
                body2={fastFacts.averageWaitTime}
                subtext1={fastFacts.successRate}
                subtext2="Intake to housed"
                mt="-mt-[10px]"
            />
            <div className="grid grid-cols-1 items-start gap-8 p-10 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Family Intake")}
                    chartType="family-intake-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <FamilyIntakeBarChart data={filteredData} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Family Housed")}
                    chartType="families-housed-line"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>
            </div>
        </div>
    );
}
