"use client";

import { useMemo } from "react";
import DashboardTop from "@/components/DashboardTop";
import SchoolFilterBar from "@/components/SchoolFilterBar";
import Chart from "@/components/chart";
import PartnerAndHomeless from "./partnerandhomeless";
import SchoolsByCityChart from "./schoolsbycity";
import HousingSourceChart from "./housingsource";
import StudentsByCityChart from "./studentsbycity";
import useFilters, { type FilterState } from "@/lib/filterStore";
import { filterRecords } from "@/lib/applyFilters";

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
        <>
            <div className="w-full">
                <DashboardTop
                    pageTitle="Schools Dashboard"
                    title="Homeless Students"
                    body="45"
                    subtext=""
                    bgColor="bg-[#FFE5EA99]"
                    title1="Families Housed to Date"
                    title2="Average Wait Time"
                    bgColor1="bg-[#E0F7F4]"
                    bgColor2="bg-[#FDF6EC]"
                    body1="82%"
                    body2="92%"
                    subtext1=""
                    subtext2=""
                    mt="mt-10"
                >
                    <SchoolFilterBar />
                </DashboardTop>
            </div>
            <div className="p-20">
                <Chart
                    title="Partner Schools & Homeless Student Counts"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <PartnerAndHomeless data={filteredData} />
                </Chart>
                <Chart
                    title="Schools by City"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <div className="w-[600px]">
                        <SchoolsByCityChart data={filteredData} />
                    </div>
                </Chart>
                <Chart
                    title="Housing Sources"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <HousingSourceChart data={filteredData} />
                </Chart>
                <Chart
                    title="Students by City"
                    appliedFilters={formattedFilters(filterState)}
                >
                    <div className="w-[600px]">
                        <StudentsByCityChart data={filteredData} />
                    </div>
                </Chart>
            </div>
        </>
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
