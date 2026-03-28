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

export type OverviewRecord = HousingRecord;

type FilterSummary = Pick<
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
                    // title="Family Intake Over Time"
                    title = {formatTitle(filterState, "Family Intake")}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <FamilyIntakeBarChart data={filteredData} />
                </Chart>

                <Chart
                    title="Families Housed Over Time"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title="Days to House Distribution"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>
            </div>
        </div>
    );
}

function formattedFilters(filters: FilterSummary) {
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

function formatTitle(filters: FilterSummary, title: string) {
  console.log(title)
    const today = new Date();
    if (
        filters.timeframe === "custom" &&
        filters.customRange?.from &&
        filters.customRange?.to
    ) {
        return title + " Between " + `${filters.customRange.from.toLocaleDateString()} and ${filters.customRange.to.toLocaleDateString()}`;
    }
    else if (filters.fiscalYear) {
        return title + " in " + `${filters.fiscalYear}`;
    }
    else if (filters.timeframe == "allTime") {
        return title + " Over Time";
    }
    else if (filters.timeframe == "thisMonth") {
        return title + " in " + `${today.toLocaleString('en-US', {month: 'long'})}`;
    }
    else if (filters.timeframe == "lastMonth") {
        const last_month = new Date(today.setDate(0))
        return title + " in " + `${last_month.toLocaleString('en-US', {month: 'long'})}`;
    }
    else if (filters.timeframe == "thisFY") {
        if (today.getMonth() >= 9) {
            return title + " in " + `${today.getFullYear() + 1 }`;
        }
        else {
            return title + " in " + `${today.getFullYear()}`;
        }
    }
    else {
        return title;
    }
}