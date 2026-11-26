// Community-need metrics: area baselines (not BHG families) to compare with BHG's impact.
// ponytail: only a sample metric until BHG sends its 10 metrics + baseline sources.
// A real metric implements the same NeedMetric shape and replaces SAMPLE_NEED below.
// Server-only (reads the town shapes).

import {
    geoCentroid,
    geoDistance,
    type ExtendedFeature,
    type ExtendedFeatureCollection,
    type GeoGeometryObjects,
} from "d3";

import townShapes from "@/lib/geo/ma-towns.json";
import { isNeighborhood } from "@/lib/impact/places";

type Shapes = ExtendedFeatureCollection<
    ExtendedFeature<GeoGeometryObjects, { name: string }>
>;

export type NeedMetric = {
    key: string;
    label: string;
    /** Short form for tooltips and list headers. */
    shortLabel: string;
    /** Shown after the value, e.g. "%" or "" for an index. */
    unit: string;
    /** Sample metrics are labeled "Sample data" everywhere they appear. */
    isSample: boolean;
    source: string;
    /** Value for a town or Boston neighborhood, or null if unknown. */
    valueFor: (place: string) => number | null;
};

// FNV-1a: a stable 32-bit hash, so sample values don't change between renders.
function hash(text: string) {
    let h = 0x811c9dc5;
    for (const ch of text) {
        h ^= ch.codePointAt(0)!;
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

// Sample values vary smoothly (higher closer to Boston, plus noise) so the map
// overlay reads like a real comparison instead of static. Not a claim about any place.
const DOWNTOWN: [number, number] = [-71.058, 42.358];
const EARTH_KM = 6371;
const townKm = new Map(
    (townShapes as unknown as Shapes).features.map((f) => [
        f.properties.name,
        geoDistance(geoCentroid(f), DOWNTOWN) * EARTH_KM,
    ])
);
const noise = (place: string, range: number) =>
    (hash(place) % (2 * range + 1)) - range;

function sampleNeed(place: string) {
    // Neighborhoods are all close to downtown, so they just spread across 40–95.
    if (isNeighborhood(place)) return 40 + (hash(place) % 56);
    const km = townKm.get(place);
    if (km === undefined) return null;
    const v = Math.round(85 - 0.4 * km + noise(place, 15));
    return Math.min(100, Math.max(0, v));
}

export const SAMPLE_NEED: NeedMetric = {
    key: "sample-need-index",
    label: "Community need index",
    shortLabel: "need index",
    unit: "",
    isSample: true,
    source: "Made-up values for layout only. Not real data.",
    valueFor: sampleNeed,
};

/**
 * The metric the public page may show, or null to hide the need layer.
 * Sample metrics are for layout only, so they never reach the production site.
 * Off Vercel (no VERCEL_ENV), a production build counts as production.
 */
export function publicNeedMetric(
    metric: NeedMetric,
    env: { VERCEL_ENV?: string; NODE_ENV?: string } = process.env
): NeedMetric | null {
    const deployment =
        env.VERCEL_ENV ??
        (env.NODE_ENV === "production" ? "production" : "development");
    return metric.isSample && deployment === "production" ? null : metric;
}

/** Rounded average of a metric over places that have a value. */
export function averageNeed(metric: NeedMetric, places: string[]) {
    const values = places
        .map(metric.valueFor)
        .filter((v): v is number => v !== null);
    return values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
}
