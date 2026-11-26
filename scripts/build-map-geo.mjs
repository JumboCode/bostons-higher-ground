// Builds the simplified map shapes used by src/components/ImpactMap.tsx.
// One-off: the output JSON is committed, so this only runs when the shapes need refreshing.
//
//   node scripts/build-map-geo.mjs
//
// Sources (public ArcGIS feature services):
//   - MassGIS "Massachusetts Municipalities with Generalized Coast": all 351 towns.
//   - Boston Planning Dept. "BPDA Neighborhoods": 26 areas, folded into 23 below.
// Output: src/lib/geo/ma-towns.json, src/lib/geo/boston-neighborhoods.json,
// then src/lib/geo/map-paths.json (projected paths for the map; see build-map-paths.mjs).
//
// d3-geo wants polygon rings wound the opposite way to RFC 7946 GeoJSON. A ring
// wound the wrong way renders as "the whole globe minus this town", so every
// feature is checked with geoArea and reversed if needed.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { geoArea } from "d3";

const MAPSHAPER = "mapshaper@0.7.101";
const OUT_DIR = new URL("../src/lib/geo/", import.meta.url);

const TOWNS_URL =
    "https://services1.arcgis.com/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Municipalities_Hosted/FeatureServer/0/query?where=1%3D1&outFields=TOWN&outSR=4326&f=geojson";
const NEIGHBORHOODS_URL =
    "https://gis.bostonplans.org/hosting/rest/services/Hosted/Boston_Neighborhood_Boundaries/FeatureServer/5/query?where=1%3D1&outFields=name&outSR=4326&f=geojson";

// BPDA has 26 areas; Boston's official neighborhood list has 23.
// Fold or drop the extra 3. Confirm with BHG if their list differs.
const NEIGHBORHOOD_MERGES = {
    Longwood: "Fenway",
    "South Boston Waterfront": "South Boston",
    "Harbor Islands": null, // no residents; dropped
};

const tmp = mkdtempSync(join(tmpdir(), "bhg-geo-"));

// Downloads a layer and keeps only a `name` property (null names are dropped).
// Renaming happens here, not in mapshaper -each, so no shell quoting is needed.
async function download(url, file, nameOf) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
    const json = await res.json();
    if (!json.features?.length) throw new Error(`No features from ${url}`);
    json.features = json.features
        .map((f) => ({ ...f, properties: { name: nameOf(f.properties) } }))
        .filter((f) => f.properties.name !== null);
    const path = join(tmp, file);
    writeFileSync(path, JSON.stringify(json));
    console.log(`${file}: ${json.features.length} features`);
    return path;
}

function mapshaper(args) {
    execFileSync("npx", ["-y", MAPSHAPER, ...args], {
        stdio: "inherit",
        shell: process.platform === "win32",
    });
}

// "NORTH ATTLEBOROUGH" -> "North Attleborough", "MANCHESTER-BY-THE-SEA" keeps "-by-the-".
function titleCase(name) {
    return name
        .toLowerCase()
        .replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase())
        .replace(/-By-The-/g, "-by-the-");
}

function reverseRings(geometry) {
    const rev = (poly) => poly.map((ring) => [...ring].reverse());
    if (geometry.type === "Polygon")
        geometry.coordinates = rev(geometry.coordinates);
    else geometry.coordinates = geometry.coordinates.map(rev);
}

function finish(path, outName) {
    const fc = JSON.parse(readFileSync(path, "utf8"));
    fc.features = fc.features.map((f) => {
        // geoArea > 2π sr means d3 sees the ring inside-out.
        if (geoArea(f) > 2 * Math.PI) reverseRings(f.geometry);
        return {
            type: "Feature",
            properties: { name: f.properties.name },
            geometry: f.geometry,
        };
    });
    const bad = fc.features.filter((f) => geoArea(f) > 2 * Math.PI);
    if (bad.length)
        throw new Error(
            `Still inside-out: ${bad.map((f) => f.properties.name)}`
        );
    const out = new URL(outName, OUT_DIR);
    const text = JSON.stringify(fc);
    writeFileSync(out, text);
    console.log(
        `wrote ${outName}: ${fc.features.length} features, ${(text.length / 1024).toFixed(0)} KB`
    );
}

const townsRaw = await download(TOWNS_URL, "towns.geojson", (p) =>
    titleCase(p.TOWN)
);
const hoodsRaw = await download(NEIGHBORHOODS_URL, "hoods.geojson", (p) =>
    p.name in NEIGHBORHOOD_MERGES ? NEIGHBORHOOD_MERGES[p.name] : p.name
);

// Towns: statewide view, so ~100 m precision is plenty.
const townsOut = join(tmp, "towns-out.json");
mapshaper([
    "-i",
    townsRaw,
    "-simplify",
    "1.5%",
    "keep-shapes",
    "-o",
    townsOut,
    "format=geojson",
    "precision=0.001",
]);
finish(townsOut, "ma-towns.json");

// Neighborhoods: zoomed-in view, so keep ~10 m precision and more detail.
const hoodsOut = join(tmp, "hoods-out.json");
mapshaper([
    "-i",
    hoodsRaw,
    "-dissolve",
    "fields=name",
    "-simplify",
    "15%",
    "keep-shapes",
    "-o",
    hoodsOut,
    "format=geojson",
    "precision=0.0001",
]);
finish(hoodsOut, "boston-neighborhoods.json");

// The map draws pre-projected paths, so rebuild them from the new shapes.
await import("./build-map-paths.mjs");
