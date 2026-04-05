"use client";

import { useMemo } from "react";
import Chart from "@/components/chart";
import DashboardTop from "@/components/DashboardTop";
import FamilyIntakeBarChart from "./barchart";
import LineChart from "./linechart";
import DaysHousedBarChart from "./barchart2";
import LocationBarChart from "./locationchart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";

export type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

import { filterRecords } from "@/lib/applyFilters";

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
                pageTitle="Housing Dashboard"
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
                    title = {formatTitle(filterState, "Families Housed")}
                    chartType="families-housed-line"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title = {formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>

                <Chart
                    title = {formatTitle(filterState, "Active vs Housed Families by Location")}
                    chartType="location-bar"
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <div className="overflow-y-auto max-h-150">
                        <LocationBarChart data={filteredData} />
                    </div>
                </Chart>
            </div>
        </div>
    );
}
