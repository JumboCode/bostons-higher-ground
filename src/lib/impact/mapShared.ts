// Map palette + formatting, shared by the server-rendered map, the client legend
// and the stats column. No geo/d3 imports here so it stays cheap to bundle on the client.
//
// Two hues, two meanings, everywhere on /impact: pink = BHG's impact (BHG
// families), blue = community need (the whole area, not BHG families).
// The ramps share lightness step for step, so neither layer outweighs the other,
// and step [3] of each is the identity color used for bars and swatches. That
// pair (#C2405D / #3D6FB0) passes the dataviz palette validator, including CVD
// separation; the old mid blue (#56779F) read as gray next to the pink.

export const IMPACT = {
    colors: ["#FBD9E0", "#F4A9B8", "#E76C82", "#C2405D", "#86203A"],
    // pct cut points between the 5 colors
    cuts: [2, 5, 10, 25],
};
export const NEED = {
    colors: ["#DAE2F4", "#ACBFE6", "#6F97D7", "#3D6FB0", "#214B7D"],
    cuts: [20, 40, 60, 80],
};
/** Identity colors: the bar/swatch color for each side in the stats column. */
export const SIDE_COLOR = {
    impact: IMPACT.colors[3],
    need: NEED.colors[3],
} as const;
/** Hatch for areas with some families, but fewer than MIN_GROUP_SIZE. */
export const HATCH = IMPACT.colors[2];
// Per-layer opacity: lower when both layers share the map so neither hides the other.
export const OPACITY = { both: 0.75, single: 1 };

export const step = (value: number, cuts: number[]) =>
    cuts.filter((c) => value >= c).length;

// What `hex` at `alpha`, multiply-blended over white, looks like, so legend
// colors match the map exactly.
export const tint = (hex: string, alpha: number) =>
    `#${[1, 3, 5]
        .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) =>
            Math.round((1 - alpha + alpha * c) * 255)
                .toString(16)
                .padStart(2, "0")
        )
        .join("")}`;

// Shares arrive as whole numbers and are only published for groups that clear
// the privacy threshold, so a 0 here means "under half a percent", not none.
export const formatPct = (pct: number) =>
    pct < 1 ? "<1%" : `${Math.round(pct)}%`;

export const LAYERS = ["both", "impact", "need"] as const;
export type Layer = (typeof LAYERS)[number];
