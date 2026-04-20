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
            <div className="sticky top-0 min-h-[40px] bg-white top-0 flex justify-between py-3 drop-shadow-sm z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <OverviewClient data={final_Data} />
        </div>
    
    );
}
