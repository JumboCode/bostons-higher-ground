// Map palette + formatting, shared by the server-rendered map, the client legend
// and the stats column. No geo/d3 imports here so it stays cheap to bundle on the client.
//
// Two hues, two meanings, everywhere on /impact: pink = BHG's impact (BHG
// families), blue = community need (the whole area, not BHG families).
// Step [3] of each ramp is the identity color used for circles, bars and
// swatches. That pair (#C2405D / #3D6FB0) passes the dataviz palette validator,
// including CVD separation; the old mid blue (#56779F) read as gray next to the pink.

export const IMPACT = {
    colors: ["#FBD9E0", "#F4A9B8", "#E76C82", "#C2405D", "#86203A"],
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
export const step = (value: number, cuts: number[]) =>
    cuts.filter((c) => value >= c).length;

// The map draws need as opaque blue fills and BHG's impact as pink circles on
// top, so neither color mixes into the other. Circle AREA is proportional to
// the share of families (radius ~ sqrt), per map view because the Boston view
// is zoomed in. Places with some families but under MIN_GROUP_SIZE get a small
// hollow ring, never a sized circle.
const RADIUS_K = { state: 3, boston: 4.5 } as const;
const RADIUS_MIN = { state: 3.5, boston: 5 } as const;
export const impactRadius = (pct: number, view: "state" | "boston") =>
    Math.max(RADIUS_MIN[view], RADIUS_K[view] * Math.sqrt(pct));
/** Radius of the hollow "under MIN_GROUP_SIZE families" ring. */
export const smallRadius = (view: "state" | "boston") => RADIUS_MIN[view];

// Shares arrive as whole numbers and are only published for groups that clear
// the privacy threshold, so a 0 here means "under half a percent", not none.
export const formatPct = (pct: number) =>
    pct < 1 ? "<1%" : `${Math.round(pct)}%`;

export const LAYERS = ["both", "impact", "need"] as const;
export type Layer = (typeof LAYERS)[number];
