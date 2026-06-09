import FilterBar from "@/components/FilterBar";
import { getEducationData } from "@/lib/getEducationData";

import EducationClient from "./education-client";

const { grades, students, attendance } = await getEducationData();

export default function Education() {
    return (
        <div>
            <div className="fixed top-0 left-62.5 z-50 flex min-h-10 w-full justify-between bg-white py-3 drop-shadow-sm">
                <FilterBar />
            </div>
            <div className="pt-14">
                <EducationClient
                    grades={grades}
                    students={students}
                    attendance={attendance}
                />
            </div>
        </div>
    );
}
