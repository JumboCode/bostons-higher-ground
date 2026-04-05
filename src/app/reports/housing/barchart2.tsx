"use client";

import { useMemo } from "react";
import { VerticalBarChart, type VerticalBarDatum } from "@/components/charts";

type HousingRecord = {
    id: number;
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

function buildAverageDaysBySchool(
    records: HousingRecord[]
): VerticalBarDatum[] {
    const totals = new Map<string, { totalDays: number; count: number }>();

    records.forEach((record) => {
        if (!record.intakeDate || !record.dateHoused) return;

        const start = new Date(record.intakeDate);
        const end = new Date(record.dateHoused);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        const school = record.school ?? "Unknown";

        const current = totals.get(school) ?? { totalDays: 0, count: 0 };
        totals.set(school, {
            totalDays: current.totalDays + days,
            count: current.count + 1,
        });
    });

    return Array.from(totals.entries())
        .map(([school, { totalDays, count }]) => ({
            label: school,
            value: Math.round(totalDays / count),
        }))
        .sort((a, b) => b.value - a.value);
}

export default function DaysHousedBarChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildAverageDaysBySchool(data), [data]);

    return (
        
        <div className="relative">
            <VerticalBarChart
                data={chartData}
                xLabel="School"
                yLabel="Avg. days to house"
            />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No days to house data to display</p>
                </div>
            )}
        </div>
    );
}
