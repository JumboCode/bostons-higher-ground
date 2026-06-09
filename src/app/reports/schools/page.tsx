import { getEducationData } from "@/lib/getEducationData";
import SchoolsClient from "./schools-client";

const { students, attendance } = await getEducationData();

export default function Schools() {
    return <SchoolsClient students={students} attendance={attendance} />;
}
