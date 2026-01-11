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

function buildLocationSeries(records: HousingRecord[]): HorizontalBarDatum[] {
    const cityCounts = new Map<string, { active: number; housed: number }>();

    records.forEach((record) => {
        if (!record.city) return;

        const existing = cityCounts.get(record.city) ?? {
            active: 0,
            housed: 0,
        };
        if (record.currentStatus === "active") {
            existing.active += 1;
        } else if (record.currentStatus === "housed") {
            existing.housed += 1;
        }
        cityCounts.set(record.city, existing);
    });

    return Array.from(cityCounts.entries())
        .map(([city, counts]) => ({
            category: city,
            series: [
                { label: "Active Families", value: counts.active },
                { label: "Housed Families", value: counts.housed },
            ],
        }))
        .sort(
            (a, b) =>
                b.series.reduce((sum, s) => sum + s.value, 0) -
                a.series.reduce((sum, s) => sum + s.value, 0)
        );
}

export default function LocationBarChart({ data }: { data: HousingRecord[] }) {
    const chartData = useMemo(() => buildLocationSeries(data), [data]);

    return (
        <HorizontalBarChart
            data={chartData}
            xLabel="# of Families"
            yLabel="Location"
        />
    );
}
