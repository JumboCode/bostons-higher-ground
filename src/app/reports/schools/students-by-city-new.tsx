"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";
import type { StudentRecord } from "@/app/reports/education/attendance-by-grade";

function buildStudentsByCity(records: StudentRecord[]): HorizontalBarDatum[] {
    const counts = new Map<string, number>();
    records.forEach((r) => {
        if (!r.city) return;
        counts.set(r.city, (counts.get(r.city) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([city, count]) => ({
            category: city,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function StudentsByCityNewChart({ data }: { data: StudentRecord[] }) {
    const chartData = useMemo(() => buildStudentsByCity(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No student data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="# of Students"
            yLabel="City"
        />
    );
}
