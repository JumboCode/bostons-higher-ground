"use client";

import { useMemo } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import FamilyIntakeBarChart from "../housing/barchart";
import LineChart from "../housing/linechart";
import DaysHousedBarChart from "../housing/barchart2";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";
import { buildChartTitle } from "@/lib/chartTitle";
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

    const appliedCities = selectedLocations.length > 0 ? selectedLocations.join(", ") : undefined;
    const appliedSchools = selectedSchools.length > 0 ? selectedSchools.join(", ") : undefined;
    const t = (base: string) => buildChartTitle(base, timeframe, fiscalYear, customRange);

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
            <div className="p-20">
                <Chart
                    title={t("Family Intake Over Time")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <FamilyIntakeBarChart data={filteredData} />
                </Chart>

                <Chart
                    title={t("Families Housed Over Time")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <LineChart data={filteredData} />
                </Chart>

                <Chart
                    title={t("Days to House Distribution")}
                    appliedCities={appliedCities}
                    appliedSchools={appliedSchools}
                    filterState={filterState}
                >
                    <DaysHousedBarChart data={filteredData} />
                </Chart>
            </div>
        </div>
    );
}

