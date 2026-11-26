/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: public-facing summary of BHG's impact, next to community need.
    Everything is computed on the server (src/lib/impact/aggregate.ts); the
    browser only receives whole-number percentages and map paths. ImpactExplorer
    (client) handles layers, hover and selection. Public filters live in the URL
    (?town=&timeframe=&layer=).
*/

import ImpactMap, { BOSTON_ORIGIN, mapAspect } from "@/components/ImpactMap";
import {
    MIN_GROUP_SIZE,
    type HousingChartRecord,
} from "@/lib/chart-definitions";
import { getAllData } from "@/lib/getAllData";
import { getEducationData } from "@/lib/getEducationData";
import { ALL, buildImpactView, TIMEFRAMES } from "@/lib/impact/aggregate";
import { LAYERS, type Layer } from "@/lib/impact/mapShared";
import { publicNeedMetric, SAMPLE_NEED } from "@/lib/impact/need";
import { BOSTON_NEIGHBORHOODS, MA_TOWNS } from "@/lib/impact/places";

import type { SelectItem } from "./FilterSelect";
import ImpactExplorer from "./ImpactExplorer";

// Filters read searchParams so the route is dynamic; caching lives in the loaders.

export default async function Impact({
    searchParams,
}: {
    searchParams: Promise<{
        town?: string;
        timeframe?: string;
        layer?: string;
    }>;
}) {
    const params = await searchParams;
    // Both loaders are unstable_cache'd (5 min). Raw rows stay on the server.
    const [housing, education] = await Promise.all([
        getAllData() as Promise<HousingChartRecord[]>,
        getEducationData(),
    ]);

    // Sample need data never reaches production; without it the map is impact-only.
    const need = publicNeedMetric(SAMPLE_NEED);
    const { place, timeframe, view, areas, shareOf, otherPlaces, sections } =
        buildImpactView(housing, education, params, need);
    const layer: Layer = !need
        ? "impact"
        : (LAYERS.find((l) => l === params.layer) ?? "both");

    const placeOptions: SelectItem[] = [
        { value: ALL, label: "All of Massachusetts" },
        {
            group: "Boston neighborhoods",
            options: BOSTON_NEIGHBORHOODS.map((n) => ({ value: n, label: n })),
        },
        {
            group: "Massachusetts towns",
            options: MA_TOWNS.map((t) => ({ value: t, label: t })),
        },
        ...(otherPlaces.length
            ? [
                  {
                      group: "Other places",
                      options: otherPlaces.map((t) => ({ value: t, label: t })),
                  },
              ]
            : []),
    ];

    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <h1 className="mb-6 text-center text-4xl font-bold text-bhg-gray-300 md:mb-8 md:text-5xl">
                Our Impact
            </h1>

            <ImpactExplorer
                view={view}
                aspect={mapAspect(view)}
                bostonOrigin={BOSTON_ORIGIN}
                neighborhoods={BOSTON_NEIGHBORHOODS}
                place={place}
                timeframe={timeframe}
                initialLayer={layer}
                areas={areas}
                placeOptions={placeOptions}
                timeframes={TIMEFRAMES}
                needEnabled={need !== null}
                needIsSample={need?.isSample ?? false}
                minGroupSize={MIN_GROUP_SIZE}
                sections={sections}
            >
                <ImpactMap
                    view={view}
                    areas={areas}
                    selected={place}
                    needLabel={
                        need
                            ? `${need.shortLabel}${need.isSample ? " (sample)" : ""}`
                            : ""
                    }
                    shareOf={shareOf}
                />
            </ImpactExplorer>

            {/* Wording pending BHG sign-off (the hollow ring reveals that 1–9 families live there). */}
            <p className="mt-6 text-xs text-gray-500">
                For privacy, no figure is shown for fewer than {MIN_GROUP_SIZE}{" "}
                families or students. Places with 1–{MIN_GROUP_SIZE - 1}{" "}
                families are marked with a small ring, without a number.
            </p>
        </main>
    );
}
