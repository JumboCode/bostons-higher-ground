// Writes src/lib/geo/map-paths.json: the SVG paths ImpactMap draws, projected
// from the committed shapes. Runs offline (no downloads). Rerun after
// scripts/build-map-geo.mjs changes the shapes; tests/impact-map-paths.test.ts
// fails until you do.
//
//   pnpm build:map-paths

import { readFileSync, writeFileSync } from "node:fs";

import { projectMapPaths } from "./map-paths.mjs";

const geo = new URL("../src/lib/geo/", import.meta.url);
const read = (name) => JSON.parse(readFileSync(new URL(name, geo), "utf8"));

const paths = projectMapPaths(
    read("ma-towns.json"),
    read("boston-neighborhoods.json")
);
const text = JSON.stringify(paths);
writeFileSync(new URL("map-paths.json", geo), text);
console.log(
    `wrote map-paths.json: ${paths.state.areas.length} towns, ` +
        `${paths.boston.areas.length} neighborhoods, ` +
        `${(text.length / 1024).toFixed(0)} KB`
);
