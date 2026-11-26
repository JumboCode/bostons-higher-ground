// Map palette + formatting, shared by the server-rendered map and the client legend.
// No geo/d3 imports here so it stays cheap to bundle on the client.

export const IMPACT = {
    colors: ["#FBD9E0", "#F4A9B8", "#E76C82", "#C2405D", "#86203A"],
    // pct cut points between the 5 colors
    cuts: [2, 5, 10, 25],
};
export const NEED = {
    colors: ["#DCE5F1", "#B3C6E0", "#83A1C8", "#56779F", "#33506F"],
    cuts: [20, 40, 60, 80],
};
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
