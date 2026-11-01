import HousingClient from "./housing-client";
import FilterBar from "@/components/FilterBar";

export default function Housing() {
    return (
        <div>
            <div className="fixed top-0 left-62.5 w-full bg-white min-h-10 flex justify-between py-3 drop-shadow-sm z-50">
                        <FilterBar />
                        {/* {userName || "John Doe"} */}
            </div>
            <div className="pt-14">
                <HousingClient />
            </div>
            
        </div> );
}
