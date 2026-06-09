import { db } from "@/lib/db";

export async function getEducationData() {
    const [students, grades, attendance] = await Promise.all([
        db.query.students.findMany(),
        db.query.grades.findMany(),
        db.query.attendance.findMany(),
    ]);

    return { students, grades, attendance };
}
