"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";
import type { AttendanceRecord } from "@/app/reports/education/attendance-breakdown";

function buildAdaBySchool(records: AttendanceRecord[]): HorizontalBarDatum[] {
    const bySchool = new Map<string, number[]>();
    records.forEach((r) => {
        if (!r.schoolName) return;
        const ada = parseFloat(r.ada);
        if (isNaN(ada)) return;
        const arr = bySchool.get(r.schoolName) ?? [];
        arr.push(ada * 100); // to percentage
        bySchool.set(r.schoolName, arr);
    });
    return Array.from(bySchool.entries())
        .map(([school, vals]) => ({
            category: school,
            series: [
                {
                    label: "Avg Attendance %",
                    value: parseFloat(
                        (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    ),
                },
            ],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function AttendanceBySchoolChart({ data }: { data: AttendanceRecord[] }) {
    const chartData = useMemo(() => buildAdaBySchool(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No attendance data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="Avg Daily Attendance (%)"
            yLabel="School"
        />
    );
}
