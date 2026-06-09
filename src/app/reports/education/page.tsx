import { getEducationData } from "@/lib/getEducationData";
import EducationClient from "./education-client";

const { grades, students, attendance } = await getEducationData();

export default function Education() {
    return (
        <EducationClient
            grades={grades}
            students={students}
            attendance={attendance}
        />
    );
}
