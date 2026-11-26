// Map palette + formatting, shared by the server-rendered map, the client legend
// and the stats column. No geo/d3 imports here so it stays cheap to bundle on the client.
//
// Two hues, two meanings, everywhere on /impact: pink = BHG's impact (BHG
// families), blue = community need (the whole area, not BHG families).
// Step [3] of each ramp is the identity color used for circles, bars and
// swatches. That pair (#C2405D / #3D6FB0) passes the dataviz palette validator,
// including CVD separation; the old mid blue (#56779F) read as gray next to the pink.

import type { MapView } from "@/components/ImpactMap";

/** The "All of Massachusetts" place value, in the URL and the place filter. */
export const ALL = "all";
/** The one town that drills down into neighborhoods. */
export const BOSTON = "Boston";

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

/**
 * Drill-down animation for the map (state <-> Boston).
 * `leaving` is the view a click is moving away from (null if the click stays
 * in the same view). While the server works, the old map zooms out ("exit");
 * once the new view arrives it animates in ("enter"). If the new view never
 * arrives (a newer click went back, or navigation failed), the exit ends with
 * the transition, so the map can't get stuck zoomed out.
 */
export function drillPhase(
    leaving: MapView | null,
    view: MapView,
    pending: boolean
): "exit" | "enter" | null {
    if (!leaving) return null;
    if (leaving === view) return pending ? "exit" : null;
    return "enter";
}
