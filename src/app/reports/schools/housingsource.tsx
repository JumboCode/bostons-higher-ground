"use client";

import { useMemo } from "react";
import { DonutChart, type DonutDatum } from "@/components/charts";

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

function buildHousingSourceData(records: HousingRecord[]): DonutDatum[] {
    const counts = new Map<string, number>();

    records.forEach((record) => {
        if (record.currentStatus !== "housed" || !record.sourceOfHousing)
            return;
        const current = counts.get(record.sourceOfHousing) ?? 0;
        counts.set(record.sourceOfHousing, current + 1);
    });

    return Array.from(counts.entries())
        .map(([source, count]) => ({ label: source, value: count }))
        .sort((a, b) => b.value - a.value);
}

export default function HousingSourceChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildHousingSourceData(data), [data]);

    return (
        <div className="relative">
            <DonutChart data={chartData} centerLabel="Total Housed" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No source data to display</p>
                </div>
            )}
        </div>
    );
}
