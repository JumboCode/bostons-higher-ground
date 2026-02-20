import { getAllData } from "@/lib/getAllData";
import SchoolsClient from "./schools-client";
import FilterBar from "@/components/FilterBar";

// Grabbing all data from the database
const data = await getAllData();

export default function Schools() {
    return (
        <div>
            <div className="sticky top-0 min-h-[40px] bg-white top-0 flex justify-between py-3 drop-shadow-sm z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <SchoolsClient data={data} />
        </div>
    
    );
}
