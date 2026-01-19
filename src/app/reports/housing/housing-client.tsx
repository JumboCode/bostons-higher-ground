"use client";

import { useMemo } from "react";
import Chart from "@/components/chart";
import DashboardTop from "@/components/DashboardTop";
import FamilyIntakeBarChart from "./barchart";
import LineChart from "./linechart";
import DaysHousedBarChart from "./barchart2";
import LocationBarChart from "./locationchart";
import useFilters, { type FilterState } from "@/lib/filterStore";

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
            <div className="p-20">
                <Chart
                    title="Family Intake Over Time"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <FamilyIntakeBarChart data={filteredData} />
                </Chart>

                <Chart
                    title="Families Housed Over Time"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title="Days to House Distribution"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>

                <Chart
                    title="Active vs Housed Families by Location"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <LocationBarChart data={filteredData} />
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
