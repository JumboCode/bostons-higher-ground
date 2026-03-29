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

function buildCityStudentCounts(
    records: HousingRecord[]
): HorizontalBarDatum[] {
    const cityTotals = new Map<string, number>();

    records.forEach((record) => {
        if (!record.city || !record.studentCount) return;
        const current = cityTotals.get(record.city) ?? 0;
        cityTotals.set(record.city, current + record.studentCount);
    });

    return Array.from(cityTotals.entries())
        .map(([city, totalStudents]) => ({
            category: city,
            series: [{ label: "Students", value: totalStudents }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function StudentsByCityChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildCityStudentCounts(data), [data]);

    return (
        <div className="relative">
            <HorizontalBarChart
                data={chartData}
                xLabel="# of Students"
                yLabel="City"
            />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No student data to display</p>
                </div>
            )}
        </div>
    );
}
