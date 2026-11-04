import { getAllData } from "@/lib/getAllData";
import OverviewClient from "./overview-client";
import { getHousedBaselineSummary } from "@/lib/baselines";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

export default async function Overview() {
    const housedSummary = await getHousedBaselineSummary(getAllData());

    return (
        <div>
            <div className="fixed top-0 left-62.5 w-full bg-white min-h-10 flex justify-between py-3 drop-shadow-sm z-50">
                <FilterBar />
                {/* {userName || "John Doe"} */}
            </div>
            <div className="pt-14">
                <OverviewClient housedSummary={housedSummary} />
            </div>
        </div>
    );
}
