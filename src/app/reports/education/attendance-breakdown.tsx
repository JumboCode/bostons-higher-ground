"use client";

import { useMemo } from "react";
import { DonutChart, type DonutDatum } from "@/components/charts";

export type AttendanceRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    daysPresent: number;
    daysAbsent: number;
    daysUnexcusedAbsent: number;
    daysMembership: number;
    ada: string; // numeric stored as string by drizzle
};

function buildBreakdownData(records: AttendanceRecord[]): DonutDatum[] {
    let regular = 0;
    let atRisk = 0;
    let chronic = 0;

    records.forEach((r) => {
        const ada = parseFloat(r.ada);
        if (isNaN(ada)) return;
        if (ada >= 0.9) regular++;
        else if (ada >= 0.8) atRisk++;
        else chronic++;
    });

    return [
        { label: "Regular (≥90%)", value: regular, color: "#20B2AA" },
        { label: "At Risk (80–90%)", value: atRisk, color: "#F59E0B" },
        { label: "Chronic (<80%)", value: chronic, color: "#F4A6B0" },
    ].filter((d) => d.value > 0);
}

export default function AttendanceBreakdownChart({
    data,
}: {
    data: AttendanceRecord[];
}) {
    const chartData = useMemo(() => buildBreakdownData(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No attendance data available.</p>;
    }

    return <DonutChart data={chartData} centerLabel="Students" />;
}
