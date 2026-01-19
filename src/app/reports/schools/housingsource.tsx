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

    if (!chartData.length) {
        return (
            <div className="text-sm text-gray-500">
                No housed families to display.
            </div>
        );
    }

    return <DonutChart data={chartData} centerLabel="Total Housed" />;
}
