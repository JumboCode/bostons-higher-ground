// The map's pre-projected SVG paths (src/lib/geo/map-paths.json, built by
// `pnpm build:map-paths`). Imported by the client map, so the browser downloads
// the geometry once as a cached JS chunk instead of with every filter change.
// Both views are bundled so a direct link into Boston renders straight away.

import paths from "@/lib/geo/map-paths.json";

import { BOSTON, type MapView } from "./mapShared";

export type MapShape = {
    name: string;
    /** Stable id for <defs>/<use>, unique across both views. */
    id: string;
    d: string;
    centroid: [number, number];
    size: number;
};

export const MAP_GEOMETRY = Object.fromEntries(
    (["state", "boston"] as const).map((view) => {
        const { w, h, font, areas } = paths[view];
        const shapes = areas.map(
            (a, i): MapShape => ({
                name: a.name,
                id: `${view}-${i}`,
                d: a.d,
                centroid: a.centroid as [number, number],
                size: a.size,
            })
        );
        return [view, { w, h, font, shapes }];
    })
) as Record<
    MapView,
    { w: number; h: number; font: number; shapes: MapShape[] }
>;

/** CSS aspect-ratio of a view's viewBox. */
export const mapAspect = (view: MapView) =>
    `${MAP_GEOMETRY[view].w} / ${MAP_GEOMETRY[view].h}`;

/** Boston's centre as a CSS transform-origin on the state map, for the drill-down zoom. */
export const BOSTON_ORIGIN = (() => {
    const { w, h, shapes } = MAP_GEOMETRY.state;
    const b = shapes.find((s) => s.name === BOSTON);
    return b
        ? `${((b.centroid[0] / w) * 100).toFixed(1)}% ${((b.centroid[1] / h) * 100).toFixed(1)}%`
        : "50% 50%";
})();
