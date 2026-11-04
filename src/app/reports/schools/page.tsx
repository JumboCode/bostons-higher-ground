import FilterBar from "@/components/FilterBar";

import SchoolsClient from "./schools-client";

export default function Schools() {
    return (
        <div>
            <div className="fixed top-0 left-62.5 z-50 flex min-h-10 w-full justify-between bg-white py-3 drop-shadow-sm">
                <FilterBar />
            </div>
            <div className="pt-14">
                <SchoolsClient />
            </div>
        </div>
    );
}
