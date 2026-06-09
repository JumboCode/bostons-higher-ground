"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";
import type { StudentRecord } from "@/app/reports/education/attendance-by-grade";

function buildStudentsPerSchool(records: StudentRecord[]): HorizontalBarDatum[] {
    const counts = new Map<string, number>();
    records.forEach((r) => {
        counts.set(r.schoolName, (counts.get(r.schoolName) ?? 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([school, count]) => ({
            category: school,
            series: [{ label: "Students", value: count }],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function StudentsPerSchoolChart({ data }: { data: StudentRecord[] }) {
    const chartData = useMemo(() => buildStudentsPerSchool(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No student data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="# of Students"
            yLabel="School"
        />
    );
}
