"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";
import type { GradeRecord } from "./grade-improvement";

function buildDistributionData(records: GradeRecord[]): HorizontalBarDatum[] {
    const bySubject = new Map<string, number[]>();

    records.forEach((r) => {
        if (!r.rubricName) return;
        const mark = parseFloat(r.finalMark);
        if (isNaN(mark)) return;
        const arr = bySubject.get(r.rubricName) ?? [];
        arr.push(mark);
        bySubject.set(r.rubricName, arr);
    });

    return Array.from(bySubject.entries())
        .map(([subject, marks]) => ({
            category: subject,
            series: [
                {
                    label: "Avg Final Mark",
                    value: parseFloat(
                        (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2)
                    ),
                },
            ],
        }))
        .sort((a, b) => b.series[0].value - a.series[0].value);
}

export default function GradeDistributionChart({ data }: { data: GradeRecord[] }) {
    const chartData = useMemo(() => buildDistributionData(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No grade data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="Average Final Mark (0–4)"
            yLabel="Subject"
        />
    );
}
