"use client";

import { useMemo } from "react";
import {
    HorizontalBarChart,
    type HorizontalBarDatum,
} from "@/components/charts";

type HousingRecord = {
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
    intakeMonth?: number | null;
    housedMonth?: number | null;
};

function buildCitySchoolCounts(records: HousingRecord[]): HorizontalBarDatum[] {
    const citySchools = new Map<string, Set<string>>();

    records.forEach((record) => {
        if (!record.city || !record.school) return;
        const current = citySchools.get(record.city) ?? new Set<string>();
        current.add(record.school);
        citySchools.set(record.city, current);
    });

    return Array.from(citySchools.entries())
        .map(([city, schools]) => ({
            category: city,
            series: [{ label: "Schools", value: schools.size }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function SchoolsByCityChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildCitySchoolCounts(data), [data]);

    return (
        
        <div className="relative">
            <HorizontalBarChart
                data={chartData}
                xLabel="# of Schools"
                yLabel="City"
            />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No school data to display</p>
                </div>
            )}
        </div>
    );
}
