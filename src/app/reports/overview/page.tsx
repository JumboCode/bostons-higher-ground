import { getAllData } from "@/lib/getAllData";
import OverviewClient from "./overview-client";
import FilterBar from "@/components/FilterBar";

const data = await getAllData();

const final_Data = data.map((d) => ({
    ...d,
    intakeMonth: d.intakeDate ? new Date(d.intakeDate).getMonth() : null,
    housedMonth: d.dateHoused ? new Date(d.dateHoused).getMonth() : null,
}));

export default function Overview() {
    return (
        <div>
            <div className="sticky top-16 min-h-[40px] bg-white flex justify-between py-3 drop-shadow-sm z-30 md:top-0 md:z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <OverviewClient data={final_Data} />
        </div>
    
    );
}
