// Projects the committed map shapes (src/lib/geo/*.json) into SVG path data for
// src/components/ImpactMap.tsx. Shared by scripts/build-map-paths.mjs, which
// writes src/lib/geo/map-paths.json, and tests/impact-map-paths.test.ts, which
// checks the committed file is still up to date with the shapes.
//
// Doing this at build time keeps d3 and the raw GeoJSON off the client: the
// browser only downloads finished path strings, once, as a cached JS chunk.

import { geoMercator, geoPath } from "d3";

/** viewBox size and label font size for each map view. */
export const VIEWS = {
    state: { w: 800, h: 500, font: 10 },
    boston: { w: 640, h: 560, font: 11 },
};

const round1 = (n) => Math.round(n * 10) / 10;

/** One view's paths, in the source file's feature order. */
function project(shapes, { w, h, font }) {
    const projection = geoMercator().fitExtent(
        [
            [10, 10],
            [w - 10, h - 10],
        ],
        shapes
    );
    const path = geoPath(projection).digits(1);
    return {
        w,
        h,
        font,
        areas: shapes.features.map((f) => ({
            name: f.properties.name,
            d: path(f) ?? "",
            /** Label and circle anchor, in viewBox units. */
            centroid: path.centroid(f).map(round1),
            /** Area in square viewBox units; only compared against a label threshold. */
            size: Math.round(path.area(f)),
        })),
    };
}

/** { state, boston } path data for the two map views. */
export function projectMapPaths(townShapes, neighborhoodShapes) {
    return {
        state: project(townShapes, VIEWS.state),
        boston: project(neighborhoodShapes, VIEWS.boston),
    };
}
