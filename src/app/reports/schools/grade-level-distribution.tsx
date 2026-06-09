"use client";

import { useMemo } from "react";
import { VerticalBarChart, type VerticalBarDatum } from "@/components/charts";
import type { StudentRecord } from "@/app/reports/education/attendance-by-grade";

const GRADE_ORDER = ["K0", "K1", "K2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function buildGradeLevelData(records: StudentRecord[]): VerticalBarDatum[] {
    const counts = new Map<string, number>();
    records.forEach((r) => {
        if (!r.gradeLevel) return;
        counts.set(r.gradeLevel, (counts.get(r.gradeLevel) ?? 0) + 1);
    });
    return GRADE_ORDER.filter((g) => counts.has(g)).map((grade) => ({
        label: grade,
        value: counts.get(grade)!,
    }));
}

export default function GradeLevelDistributionChart({ data }: { data: StudentRecord[] }) {
    const chartData = useMemo(() => buildGradeLevelData(data), [data]);

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No student data available.</p>;
    }

    return (
        <VerticalBarChart
            data={chartData}
            xLabel="Grade Level"
            yLabel="# of Students"
        />
    );
}
