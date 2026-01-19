"use client";

import { useMemo } from "react";
import {
    HorizontalBarChart,
    type HorizontalBarDatum,
} from "@/components/charts";

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

function buildSchoolSeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const schoolCounts = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.school || !record.studentCount) return;

        const existing = schoolCounts.get(record.school) ?? {
            active: 0,
            housed: 0,
        };
        if (record.currentStatus === "active") {
            existing.active += record.studentCount;
        } else if (record.currentStatus === "housed") {
            existing.housed += record.studentCount;
        }
        schoolCounts.set(record.school, existing);
    });

    return Array.from(schoolCounts.entries())
        .map(([school, counts]) => ({
            category: school,
            series: [
                { label: "Active", value: counts.active },
                { label: "Housed", value: counts.housed },
            ],
        }))
        .sort(
            (a, b) =>
                b.series.reduce((sum, s) => sum + s.value, 0) -
                a.series.reduce((sum, s) => sum + s.value, 0)
        );
}

export default function PartnerAndHomeless({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildSchoolSeries(data), [data]);

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="# of Students"
            yLabel="School"
        />
    );
}
