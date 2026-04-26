import { db } from "./db";

export type RawEducationRecord = {
    id: number;
    school: string | null;
    schoolCode: string | null;
    courseSubject: string | null;
    grade: number | null;
    student_id: number | null;
};

export type EducationRecord = RawEducationRecord & {
    intakeDate?: string | null;
};

export async function getEducationData(): Promise<RawEducationRecord[]> {
    try {
        return await db.query.educationRecords.findMany();
    } catch (error) {
        console.error(
            "Failed to load education_records. Make sure the table exists and migrations are applied.",
            error
        );
        return [];
    }
}
