"use client";

import { useMemo } from "react";
import { VerticalBarChart, type VerticalBarDatum } from "@/components/charts";
import type { AttendanceRecord } from "./attendance-breakdown";

export type StudentRecord = {
    id: number;
    schoolCode: number;
    schoolName: string;
    studentId: number;
    gradeLevel: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    address: string;
    city: string;
    zip: number;
};

const GRADE_ORDER = ["K0", "K1", "K2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

function buildAdaByGrade(
    students: StudentRecord[],
    attendance: AttendanceRecord[]
): VerticalBarDatum[] {
    const adaByGrade = new Map<string, number[]>();
    const gradeByStudent = new Map<number, string>();

    students.forEach((s) => gradeByStudent.set(s.studentId, s.gradeLevel));

    attendance.forEach((a) => {
        const grade = gradeByStudent.get(a.studentId);
        if (!grade) return;
        const ada = parseFloat(a.ada);
        if (isNaN(ada)) return;
        const arr = adaByGrade.get(grade) ?? [];
        arr.push(ada * 100); // convert to percentage
        adaByGrade.set(grade, arr);
    });

    return GRADE_ORDER.filter((g) => adaByGrade.has(g)).map((grade) => {
        const vals = adaByGrade.get(grade)!;
        return {
            label: grade,
            value: parseFloat(
                (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
            ),
        };
    });
}

export default function AttendanceByGradeChart({
    students,
    attendance,
}: {
    students: StudentRecord[];
    attendance: AttendanceRecord[];
}) {
    const chartData = useMemo(
        () => buildAdaByGrade(students, attendance),
        [students, attendance]
    );

    if (!chartData.length) {
        return <p className="text-sm text-gray-400">No data available.</p>;
    }

    return (
        <VerticalBarChart
            data={chartData}
            xLabel="Grade Level"
            yLabel="Avg Daily Attendance (%)"
        />
    );
}
