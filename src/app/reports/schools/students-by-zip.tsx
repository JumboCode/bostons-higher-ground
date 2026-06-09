"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";
import type { StudentRecord } from "@/app/reports/education/attendance-by-grade";

function buildStudentsByZip(records: StudentRecord[]): HorizontalBarDatum[] {
    const counts = new Map<string, number>();
    records.forEach((r) => {
        if (!r.zip) return;
        const zip = String(r.zip);
        counts.set(zip, (counts.get(zip) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([zip, count]) => ({
            category: zip,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value)
        .slice(0, 15); // top 15 zip codes
}

export default function StudentsByZipChart({ data }: { data: StudentRecord[] }) {
    const chartData = useMemo(() => buildStudentsByZip(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No student data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="# of Students"
            yLabel="ZIP Code"
        />
    );
}
