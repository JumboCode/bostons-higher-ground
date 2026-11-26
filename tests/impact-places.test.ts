import test from "node:test";
import assert from "node:assert/strict";
import {
    BOSTON_NEIGHBORHOODS,
    MA_TOWNS,
    placeOf,
} from "../src/lib/impact/places";
import { publicNeedMetric, SAMPLE_NEED } from "../src/lib/impact/need";

test("a trailing state name is stripped only after a comma or space", () => {
    assert.deepEqual(placeOf("Boston, MA", null), {
        town: "Boston",
        neighborhood: null,
    });
    assert.equal(placeOf("Worcester MA", null).town, "Worcester");
    assert.equal(placeOf("worcester, Mass.", null).town, "Worcester");
    // Out-of-state names that merely end in "ma" stay whole.
    for (const city of ["Tacoma", "Yuma", "Panama", "Lima", "Oklahoma City"])
        assert.equal(placeOf(city, null).town, city);
});

test("Boston neighborhoods come from the city name or the ZIP", () => {
    assert.deepEqual(placeOf("Roxbury", null), {
        town: "Boston",
        neighborhood: "Roxbury",
    });
    assert.equal(placeOf("DORCHESTER CENTER", null).neighborhood, "Dorchester");
    assert.equal(placeOf("Boston", "2134").neighborhood, "Allston");
    assert.equal(placeOf("Boston", "02124-3301").neighborhood, "Dorchester");
    assert.deepEqual(placeOf(null, 2119), {
        town: "Boston",
        neighborhood: "Roxbury",
    });
    // A neighborhood name wins over a ZIP from another neighborhood.
    assert.equal(placeOf("Mattapan", "02124").neighborhood, "Mattapan");
});

test("town names keep their map spelling and non-places are dropped", () => {
    assert.equal(
        placeOf("manchester-by-the-sea", null).town,
        "Manchester-by-the-Sea"
    );
    assert.equal(placeOf("Confidential Address", null).town, null);
    // Not a place, but a Boston ZIP still places the family by ZIP.
    assert.equal(
        placeOf("Confidential Address", "02124").neighborhood,
        "Dorchester"
    );
    assert.equal(placeOf("  ", null).town, null);
});

test("map name lists are complete and don't collide", () => {
    assert.equal(MA_TOWNS.length, 351);
    assert.equal(BOSTON_NEIGHBORHOODS.length, 23);
    assert.deepEqual(
        MA_TOWNS.filter((t) => BOSTON_NEIGHBORHOODS.includes(t)),
        []
    );
});

test("sample need data is hidden in production only", () => {
    assert.equal(
        publicNeedMetric(SAMPLE_NEED, { VERCEL_ENV: "production" }),
        null
    );
    assert.equal(
        publicNeedMetric(SAMPLE_NEED, { VERCEL_ENV: "preview" }),
        SAMPLE_NEED
    );
    // Off Vercel, a production build counts as production.
    assert.equal(
        publicNeedMetric(SAMPLE_NEED, { NODE_ENV: "production" }),
        null
    );
    assert.equal(
        publicNeedMetric(SAMPLE_NEED, { NODE_ENV: "development" }),
        SAMPLE_NEED
    );
    const real = { ...SAMPLE_NEED, isSample: false };
    assert.equal(publicNeedMetric(real, { VERCEL_ENV: "production" }), real);
});
