import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { projectMapPaths } from "../scripts/map-paths.mjs";
import neighborhoodShapes from "../src/lib/geo/boston-neighborhoods.json";
import townShapes from "../src/lib/geo/ma-towns.json";
import { BOSTON_ORIGIN, MAP_GEOMETRY } from "../src/lib/impact/mapGeometry";
import { BOSTON_NEIGHBORHOODS, MA_TOWNS } from "../src/lib/impact/places";

test("map-paths.json is up to date with the map shapes", () => {
    const committed = JSON.parse(
        readFileSync(
            new URL("../src/lib/geo/map-paths.json", import.meta.url),
            "utf8"
        )
    );
    assert.deepEqual(
        committed,
        // Through JSON so the comparison matches what the build script writes.
        JSON.parse(
            JSON.stringify(projectMapPaths(townShapes, neighborhoodShapes))
        ),
        "Shapes changed without rebuilding the paths: run `pnpm build:map-paths`."
    );
});

test("the drawn areas are exactly the selectable places", () => {
    const names = (view: "state" | "boston") =>
        MAP_GEOMETRY[view].shapes.map((s) => s.name).sort();
    assert.deepEqual(names("state"), MA_TOWNS);
    assert.deepEqual(names("boston"), BOSTON_NEIGHBORHOODS);
    assert.ok(
        MAP_GEOMETRY.state.shapes.every((s) => s.d.startsWith("M")),
        "every town has a path"
    );
    // Ids are unique across both views (they share one page's <defs>).
    const ids = [
        ...MAP_GEOMETRY.state.shapes,
        ...MAP_GEOMETRY.boston.shapes,
    ].map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    // Boston was found, so the drill-down zooms toward it, not the middle.
    assert.notEqual(BOSTON_ORIGIN, "50% 50%");
});
