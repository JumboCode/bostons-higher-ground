"use client";

import { useMemo } from "react";
import { LineChart, type LineDatum } from "@/components/charts";

type HousingRecord = {
    id: number;
    intakeDate: string | null;
    dateHoused: string | null;
    currentStatus: string | null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth: number | null;
    housedMonth: number | null;
};

const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function buildHousedSeries(records: HousingRecord[]): LineDatum[] {
    const counts = new Array(12).fill(0);

    records.forEach((record) => {
        if (record.housedMonth === null || record.housedMonth === undefined)
            return;
        counts[record.housedMonth] += 1;
    });

    return MONTH_NAMES.map((month, index) => ({
        label: month,
        value: counts[index] || 0,
    }));
}

export default function HousingLineChart({ data }: { data: HousingRecord[] }) {
    const chartData = useMemo(() => buildHousedSeries(data), [data]);

    return (
        <div className="relative">
            <LineChart data={chartData} xLabel="Month" yLabel="Families housed" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No housing data to display</p>
                </div>
            )}
        </div>
    );
}
