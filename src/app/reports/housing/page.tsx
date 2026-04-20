import { getAllData } from "@/lib/getAllData";
import HousingClient from "./housing-client";
import FilterBar from "@/components/FilterBar";

// Grabbing all data from the database
const data = await getAllData();

// Temporary filter for input data
// TODO: write function to connect front end filtering to this function
const filtered_Data = data.filter(function (d) {
    return d.intakeDate?.substring(0, 4) == "2025";
});

const final_Data = filtered_Data.map((d) => ({
    ...d,
    intakeMonth: d.intakeDate ? new Date(d.intakeDate).getMonth() : null,
    housedMonth: d.dateHoused ? new Date(d.dateHoused).getMonth() : null,
}));

export default function Housing() {
    return (
        <div>
            <div className="fixed top-0 left-62.5 w-full bg-white min-h-10 flex justify-between py-3 drop-shadow-sm z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <div className="pt-14">
                <HousingClient data={final_Data}/>
            </div>
            
        </div> );
}
