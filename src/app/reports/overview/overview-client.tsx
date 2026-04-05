"use client";

import { useMemo } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import FamilyIntakeBarChart from "../housing/barchart";
import LineChart from "../housing/linechart";
import DaysHousedBarChart from "../housing/barchart2";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import { type HousingRecord } from "../housing/housing-client";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";

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

    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Overview"
                title="Total Families Enrolled"
                body="224"
                subtext="All-time enrollment"
                bgColor="bg-[#E0F7F4]"
                title1="Families Housed to Date"
                title2="Average Wait Time"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1="158"
                body2="48 days"
                subtext1="70.5% success rate"
                subtext2="Intake to housed"
                mt="-mt-[10px]"
            />
            <div className="grid grid-cols-1 items-start gap-8 p-10 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Family Intake")}
                    chartType="family-intake-bar"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <FamilyIntakeBarChart data={filteredData} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Family Housed")}
                    chartType="families-housed-line"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>
            </div>
        </div>
    );
}
