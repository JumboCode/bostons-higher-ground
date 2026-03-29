"use client";

import { useMemo } from "react";
import { VerticalBarChart, type VerticalBarDatum } from "@/components/charts";

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

function buildMonthlyIntakeData(records: HousingRecord[]): VerticalBarDatum[] {
    const counts = new Array(12).fill(0);

    records.forEach((record) => {
        if (record.intakeMonth === null || record.intakeMonth === undefined)
            return;
        counts[record.intakeMonth] += 1;
    });

    return MONTH_NAMES.map((month, index) => ({
        label: month,
        value: counts[index] || 0,
    }));
}

export default function FamilyIntakeBarChart({
    data,
}: {
    data: HousingRecord[];
}) {
    const chartData = useMemo(() => buildMonthlyIntakeData(data), [data]);

    return (
        <div className="relative">
            <VerticalBarChart data={chartData} xLabel="Month" yLabel="Families" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-gray-600 text-lg font-semibold">No family data to display</p>
                </div>
            )}
        </div>
    );
}
