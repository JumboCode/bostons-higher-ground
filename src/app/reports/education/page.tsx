import { getEducationData, type EducationRecord } from "@/lib/getEducationData";
import EducationClient from "./education-client";
import FilterBar from "@/components/FilterBar";

export default async function Education() {
    const data = await getEducationData();

    return (
        <div>
            <div className="sticky top-0 min-h-[40px] bg-white flex justify-between py-3 drop-shadow-sm z-50">
                <FilterBar />
            </div>
            <EducationClient data={data} />
        </div>
    );
}
