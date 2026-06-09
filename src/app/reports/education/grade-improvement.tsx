"use client";

import { useMemo } from "react";
import { HorizontalBarChart, type HorizontalBarDatum } from "@/components/charts";

export type GradeRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    rubricCode: string;
    rubricName: string;
    fMark: string | null;
    wMark: string | null;
    finalMark: string;
};

function buildImprovementData(records: GradeRecord[]): HorizontalBarDatum[] {
    const bySubject = new Map<string, { fall: number[]; winter: number[] }>();

    records.forEach((r) => {
        const f = parseFloat(r.fMark ?? "");
        const w = parseFloat(r.wMark ?? "");
        if (!r.rubricName) return;
        const entry = bySubject.get(r.rubricName) ?? { fall: [], winter: [] };
        if (!isNaN(f)) entry.fall.push(f);
        if (!isNaN(w)) entry.winter.push(w);
        bySubject.set(r.rubricName, entry);
    });

    return Array.from(bySubject.entries())
        .filter(([, v]) => v.fall.length > 0 || v.winter.length > 0)
        .map(([subject, v]) => {
            const avgFall =
                v.fall.length > 0
                    ? v.fall.reduce((a, b) => a + b, 0) / v.fall.length
                    : 0;
            const avgWinter =
                v.winter.length > 0
                    ? v.winter.reduce((a, b) => a + b, 0) / v.winter.length
                    : 0;
            return {
                category: subject,
                series: [
                    { label: "Fall", value: parseFloat(avgFall.toFixed(2)) },
                    { label: "Winter", value: parseFloat(avgWinter.toFixed(2)) },
                ],
            };
        })
        .sort(
            (a, b) =>
                b.series.reduce((s, x) => s + x.value, 0) -
                a.series.reduce((s, x) => s + x.value, 0)
        );
}

export default function GradeImprovementChart({ data }: { data: GradeRecord[] }) {
    const chartData = useMemo(() => buildImprovementData(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No grade data available.</p>;
    }

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="Average Mark (0–4)"
            yLabel="Subject"
        />
    );
}
