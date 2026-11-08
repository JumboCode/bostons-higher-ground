import "server-only";
import { unstable_cache } from "next/cache";
import { bostonToday } from "./baseline-calculation";
import { getHousedBaselineSummary } from "./baselines";
import { getAllData } from "./getAllData";
import {
    buildPublicImpactData,
    type PublicImpactData,
} from "./public-impact-calculation";

export type { PublicImpactData } from "./public-impact-calculation";

const loadPublicImpactData = unstable_cache(
    async (today: string): Promise<PublicImpactData> => {
        const records = await getAllData();
        const summary = await getHousedBaselineSummary(
            Promise.resolve(records)
        );
        // Fail closed during incomplete baseline installation; no made-up total.
        return buildPublicImpactData(
            records,
            summary.migrationRequired ? null : summary.baseline,
            summary.provisional,
            today
        );
    },
    ["public-impact-data-v2"],
    { tags: ["report-data"], revalidate: 300 }
);

/** Public aggregate data only. Call from a Server Component; accepts no filters. */
export async function getPublicImpactData(): Promise<PublicImpactData> {
    // Date in the cache arguments prevents future-dated outcomes staying hidden
    // after Boston midnight merely because yesterday's cache entry is warm.
    return loadPublicImpactData(bostonToday());
}
