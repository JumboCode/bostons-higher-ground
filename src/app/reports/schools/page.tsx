import { getAllData } from "@/lib/getAllData";
import SchoolsClient from "./schools-client";
import FilterBar from "@/components/FilterBar";

// Grabbing all data from the database
const data = await getAllData();

export default function Schools() {
    return (
        <div>
            <div className="fixed top-0 left-62.5 w-full bg-white min-h-10 flex justify-between py-3 drop-shadow-sm z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <div className="pt-14">
                <SchoolsClient data={data} />
            </div>
            
        </div>
    
    );
}
