// Server-rendered SVG map for the public impact page: all 351 MA towns, or Boston's
// 23 neighborhoods. Two semi-transparent choropleth layers ("our impact" in pink,
// "community need" in blue) multiply where they overlap, so high-on-both reads purple.
// Shapes come from src/lib/geo (built by scripts/build-map-geo.mjs, already wound for d3).
// Each shape is defined once in <defs> and reused with <use>, which keeps the HTML small.
// Both layers are always rendered; ImpactExplorer (client) shows/hides them via
// data-layer, draws the hover card and the selection outline, and turns link clicks
// into router.replace. Links still work without JS.
import {
    geoMercator,
    geoPath,
    type ExtendedFeature,
    type ExtendedFeatureCollection,
    type GeoGeometryObjects,
} from "d3";

import neighborhoodShapes from "@/lib/geo/boston-neighborhoods.json";
import townShapes from "@/lib/geo/ma-towns.json";
import { MIN_GROUP_SIZE } from "@/lib/chart-definitions";
import {
    formatPct,
    HATCH,
    IMPACT,
    NEED,
    OPACITY,
    step,
} from "@/lib/impact/mapShared";

type Shapes = ExtendedFeatureCollection<
    ExtendedFeature<GeoGeometryObjects, { name: string }>
>;

export type MapView = "state" | "boston";
export type MapArea = {
    place: string;
    /** Share of families as a whole-number percent, or null if not published. */
    impactPct: number | null;
    /** Fewer than MIN_GROUP_SIZE families: shown as a hatch, never as a number. */
    impactSmall: boolean;
    /** Enough families, but too few elsewhere to publish a share: no fill. */
    impactHidden: boolean;
    need: number | null;
    /** Filter link, or null if the area can't be selected. */
    href: string | null;
};

const BORDER = "#3F3F3F";
// Always labeled on the state map, spread across MA so visitors can orient themselves.
const LANDMARKS = [
    "Boston",
    "Worcester",
    "Springfield",
    "Pittsfield",
    "Lowell",
    "Lynn",
    "Brockton",
    "New Bedford",
    "Barnstable",
];
const OUTSIDE = "#F1F1F1";

// ---- Geometry (computed once per server process) --------------------------

const VIEWS = {
    state: {
        shapes: townShapes as unknown as Shapes,
        w: 800,
        h: 500,
        font: 10,
    },
    boston: {
        shapes: neighborhoodShapes as unknown as Shapes,
        w: 640,
        h: 560,
        font: 11,
    },
} as const;

const GEOMETRY = Object.fromEntries(
    (Object.keys(VIEWS) as MapView[]).map((view) => {
        const { shapes, w, h } = VIEWS[view];
        const projection = geoMercator().fitExtent(
            [
                [10, 10],
                [w - 10, h - 10],
            ],
            shapes
        );
        const path = geoPath(projection).digits(1);
        const areas = shapes.features.map((f, i) => ({
            name: f.properties.name,
            id: `${view}-${i}`,
            d: path(f) ?? "",
            centroid: path.centroid(f),
            size: path.area(f),
        }));
        return [view, areas];
    })
) as Record<
    MapView,
    {
        name: string;
        id: string;
        d: string;
        centroid: [number, number];
        size: number;
    }[]
>;

/** CSS aspect-ratio of a view's viewBox. */
export const mapAspect = (view: MapView) =>
    `${VIEWS[view].w} / ${VIEWS[view].h}`;

/** Boston's centre as a CSS transform-origin on the state map, for the drill-down zoom. */
export const BOSTON_ORIGIN = (() => {
    const b = GEOMETRY.state.find((s) => s.name === "Boston");
    const { w, h } = VIEWS.state;
    return b
        ? `${((b.centroid[0] / w) * 100).toFixed(1)}% ${((b.centroid[1] / h) * 100).toFixed(1)}%`
        : "50% 50%";
})();

// Screen-reader text for an area: every value, whatever layer is showing.
function describe(
    name: string,
    area: MapArea | undefined,
    needLabel: string,
    shareOf: string
) {
    const parts: string[] = [];
    if (area?.impactPct != null)
        parts.push(`${formatPct(area.impactPct)} of ${shareOf}`);
    else if (area?.impactSmall)
        parts.push(`fewer than ${MIN_GROUP_SIZE} families`);
    else if (area?.impactHidden) parts.push("share hidden for privacy");
    else parts.push("no families recorded");
    if (area?.need != null) parts.push(`${needLabel} ${area.need}`);
    return `${name}: ${parts.join("; ")}`;
}

// ---- Map ------------------------------------------------------------------

export default function ImpactMap({
    view,
    areas,
    selected,
    needLabel,
    shareOf,
}: {
    view: MapView;
    areas: MapArea[];
    selected: string;
    /** e.g. "need index (sample)" */
    needLabel: string;
    /** what impact percentages are a share of, e.g. "families with a known town" */
    shareOf: string;
}) {
    const { w, h, font } = VIEWS[view];
    const shapes = GEOMETRY[view];
    const byPlace = new Map(areas.map((a) => [a.place, a]));

    // Label the selected area, the top impact areas, and a few big cities so the
    // state is recognizable.
    const top = areas
        .filter((a) => a.impactPct !== null)
        .sort((a, b) => b.impactPct! - a.impactPct!)
        .slice(0, 4)
        .map((a) => a.place);
    const labelled = new Set([selected, ...top, ...LANDMARKS]);
    // In the Boston view label everything that has room; tiny downtown areas only when selected.
    const showLabel = (s: { name: string; size: number }) =>
        s.name === selected ||
        (view === "boston" ? s.size > 900 : labelled.has(s.name));

    return (
        <svg
            viewBox={`0 0 ${w} ${h}`}
            className="impact-map block h-auto w-full"
            role="group"
            aria-label={
                view === "state"
                    ? "Map of Massachusetts towns"
                    : "Map of Boston neighborhoods"
            }
        >
            {/* Layer visibility follows data-layer on an ancestor (set by ImpactExplorer). */}
            <style>{`
                .impact-map use { transition: fill .2s; }
                .impact-map .lyr { transition: opacity .2s; mix-blend-mode: multiply; }
                [data-layer=both] .impact-map .lyr { opacity: ${OPACITY.both}; }
                [data-layer=impact] .impact-map .lyr-need,
                [data-layer=need] .impact-map .lyr-impact { opacity: 0; }
                .hit use { fill: transparent; }
                .hit:hover use { fill: rgba(0,0,0,.10); }
                .hit:focus { outline: none; }
                .hit:focus-visible use { stroke: #111; stroke-width: 3px; fill: rgba(0,0,0,.10); }
            `}</style>
            <defs>
                {shapes.map((s) => (
                    <path
                        key={s.id}
                        id={s.id}
                        d={s.d}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
                <pattern
                    id="few-families"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                >
                    <rect width="6" height="6" fill="#fff" />
                    <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="6"
                        stroke={HATCH}
                        strokeWidth="2.5"
                    />
                </pattern>
            </defs>

            <rect width={w} height={h} fill={OUTSIDE} />

            {/* 1. base */}
            <g fill="#fff">
                {shapes.map((s) => (
                    <use key={s.id} href={`#${s.id}`} />
                ))}
            </g>

            {/* 2. community need */}
            <g className="lyr lyr-need">
                {shapes.map((s) => {
                    const v = byPlace.get(s.name)?.need;
                    return v == null ? null : (
                        <use
                            key={s.id}
                            href={`#${s.id}`}
                            fill={NEED.colors[step(v, NEED.cuts)]}
                        />
                    );
                })}
            </g>

            {/* 3. our impact */}
            <g className="lyr lyr-impact">
                {shapes.map((s) => {
                    const a = byPlace.get(s.name);
                    const fill =
                        a?.impactPct != null
                            ? IMPACT.colors[step(a.impactPct, IMPACT.cuts)]
                            : a?.impactSmall
                              ? "url(#few-families)"
                              : null;
                    return fill ? (
                        <use key={s.id} href={`#${s.id}`} fill={fill} />
                    ) : null;
                })}
            </g>

            {/* 4. borders, above the fills so they stay crisp */}
            <g fill="none" stroke={BORDER} strokeWidth={0.6}>
                {shapes.map((s) => (
                    <use key={s.id} href={`#${s.id}`} />
                ))}
            </g>
            {view === "state" && (
                // Boston drills down, so give it a stronger outline.
                <use
                    href={`#${shapes.find((s) => s.name === "Boston")?.id}`}
                    fill="none"
                    stroke={BORDER}
                    strokeWidth={2}
                />
            )}

            {/* 5. hit targets. data-place drives the hover card and click handling. */}
            {shapes.map((s) => {
                const a = byPlace.get(s.name);
                return a?.href ? (
                    <a
                        key={s.id}
                        href={a.href}
                        className="hit"
                        data-place={s.name}
                        aria-label={describe(s.name, a, needLabel, shareOf)}
                        aria-current={s.name === selected ? "true" : undefined}
                    >
                        <use href={`#${s.id}`} />
                    </a>
                ) : (
                    <g key={s.id} className="hit" data-place={s.name}>
                        <use href={`#${s.id}`} />
                    </g>
                );
            })}

            {/* labels: white halo, no pointer events so they never block clicks */}
            <g
                pointerEvents="none"
                fontSize={font}
                fontWeight={600}
                textAnchor="middle"
                fill="#1F1F1F"
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
                strokeLinejoin="round"
            >
                {shapes.filter(showLabel).map((s) => (
                    <text
                        key={s.id}
                        x={s.centroid[0]}
                        y={s.centroid[1]}
                        dy="0.35em"
                    >
                        {s.name}
                    </text>
                ))}
            </g>
        </svg>
    );
}
