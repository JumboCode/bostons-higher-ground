// Turns Salesforce's free-text city + ZIP into a map place: a Massachusetts town,
// plus a Boston neighborhood when the family is in Boston.
// Server-only (imports the town shapes for their names).

import neighborhoodShapes from "@/lib/geo/boston-neighborhoods.json";
import townShapes from "@/lib/geo/ma-towns.json";

export type Place = { town: string | null; neighborhood: string | null };

export const BOSTON = "Boston";

const namesOf = (fc: { features: { properties: { name: string } }[] }) =>
    fc.features.map((f) => f.properties.name).sort();

/** All 351 MA towns, as spelled on the map. */
export const MA_TOWNS = namesOf(townShapes);
/** Boston's 23 neighborhoods, as spelled on the map (see scripts/build-map-geo.mjs). */
export const BOSTON_NEIGHBORHOODS = namesOf(neighborhoodShapes);

const byKey = (names: string[]) =>
    new Map(names.map((n) => [n.toLowerCase(), n]));
const TOWN_KEYS = byKey(MA_TOWNS);
const NEIGHBORHOOD_KEYS = byKey(BOSTON_NEIGHBORHOODS);

// Typos, nicknames and Postal Service place names seen in (or likely in) Salesforce.
// Value: a canonical town/neighborhood name, or null for "not a place".
const CITY_FIXES: Record<string, string | null> = {
    dorcheseter: "Dorchester",
    "dorchester center": "Dorchester",
    "dorchester ctr": "Dorchester",
    rosindale: "Roslindale",
    jp: "Jamaica Plain",
    "roxbury crossing": "Roxbury",
    eastie: "East Boston",
    southie: "South Boston",
    kenmore: "Fenway",
    "fenway-kenmore": "Fenway",
    "fenway/kenmore": "Fenway",
    // Brighton and Allston share ZIPs; this name alone can't pick one.
    "allston/brighton": BOSTON,
    "allston-brighton": BOSTON,
    "confidential address": null,
    "west broadway": null,
};

// Each Boston ZIP's main neighborhood. ZIPs that cross a boundary go to the
// neighborhood covering most of the ZIP (noted where it matters).
const BOSTON_ZIPS: Record<string, string> = {
    "02108": "Beacon Hill", // also part of Downtown
    "02109": "Downtown", // waterfront; small part of North End
    "02110": "Downtown",
    "02111": "Chinatown", // also Leather District
    "02113": "North End",
    "02114": "West End", // also part of Beacon Hill
    "02115": "Fenway", // also parts of Back Bay, Mission Hill
    "02116": "Back Bay", // also Bay Village, part of South End
    "02118": "South End",
    "02119": "Roxbury",
    "02120": "Mission Hill",
    "02121": "Dorchester",
    "02122": "Dorchester",
    "02124": "Dorchester",
    "02125": "Dorchester",
    "02126": "Mattapan",
    "02127": "South Boston",
    "02128": "East Boston",
    "02129": "Charlestown",
    "02130": "Jamaica Plain",
    "02131": "Roslindale",
    "02132": "West Roxbury",
    "02134": "Allston",
    "02135": "Brighton",
    "02136": "Hyde Park",
    "02163": "Allston",
    "02199": "Back Bay",
    "02210": "South Boston",
    "02215": "Fenway",
};

/** "2124", 2124, "02124-3301" -> "02124". */
function normalizeZip(zip: string | number | null | undefined) {
    const digits = String(zip ?? "").replace(/\D/g, "");
    if (!digits) return null;
    return digits.length > 5 ? digits.slice(0, 5) : digits.padStart(5, "0");
}

function cleanCity(city: string | null | undefined): string | null {
    const k = city
        ?.trim()
        .toLowerCase()
        .replace(/,?\s*(ma|mass|massachusetts)\.?$/, "")
        .trim();
    if (!k) return null;
    if (k in CITY_FIXES) return CITY_FIXES[k];
    return (
        NEIGHBORHOOD_KEYS.get(k) ??
        TOWN_KEYS.get(k) ??
        // Not a known MA name: keep it readable so it still shows in lists.
        k.replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

export const isNeighborhood = (name: string) =>
    NEIGHBORHOOD_KEYS.has(name.toLowerCase());

/**
 * City "Boston" (or no city) + a Boston ZIP -> that ZIP's neighborhood.
 * A neighborhood name as the city -> Boston + that neighborhood.
 */
export function placeOf(
    city: string | null | undefined,
    zip: string | number | null | undefined
): Place {
    const name = cleanCity(city);
    const zipHood = BOSTON_ZIPS[normalizeZip(zip) ?? ""] ?? null;

    if (name && isNeighborhood(name))
        return { town: BOSTON, neighborhood: name };
    if (name === BOSTON || (!name && zipHood))
        return { town: BOSTON, neighborhood: zipHood };
    return { town: name, neighborhood: null };
}
