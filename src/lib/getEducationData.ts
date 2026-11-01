import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";

// Only the columns charts aggregate on. No names, no street addresses.
// Server-only: charts are built in /api/reports/chart-preview, never in the browser.
export const getEducationData = unstable_cache(
    async () => {
        const [students, grades, attendance] = await Promise.all([
            db.query.students.findMany({
                columns: {
                    studentId: true,
                    schoolName: true,
                    gradeLevel: true,
                    city: true,
                    zip: true,
                },
            }),
            db.query.grades.findMany({
                columns: {
                    schoolName: true,
                    rubricName: true,
                    fMark: true,
                    wMark: true,
                    finalMark: true,
                },
            }),
            db.query.attendance.findMany({
                columns: { schoolName: true, studentId: true, ada: true },
            }),
        ]);

        return { students, grades, attendance };
    },
    ["education-data"],
    { tags: ["report-data"], revalidate: 300 }
);
