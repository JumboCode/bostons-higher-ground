// Server-rendered SVG map for the public impact page: all 351 MA towns, or Boston's
// 23 neighborhoods. Two semi-transparent choropleth layers ("our impact" in pink,
// "community need" in blue) multiply where they overlap, so high-on-both reads purple.
// Shapes come from src/lib/geo (built by scripts/build-map-geo.mjs, already wound for d3).
// Each shape is defined once in <defs> and reused with <use>, which keeps the HTML small.
// Only path strings reach the browser; hover = native <title>, click = filter link.
import {
    geoMercator,
    geoPath,
    type ExtendedFeature,
    type ExtendedFeatureCollection,
    type GeoGeometryObjects,
} from "d3";

import MapZoom from "@/components/MapZoom";
import neighborhoodShapes from "@/lib/geo/boston-neighborhoods.json";
import townShapes from "@/lib/geo/ma-towns.json";

type Shapes = ExtendedFeatureCollection<
    ExtendedFeature<GeoGeometryObjects, { name: string }>
>;

export type MapView = "state" | "boston";
export type MapLayers = { impact: boolean; need: boolean };
export type MapArea = {
    place: string;
    /** Share of families (0–100, unrounded), or null if hidden. */
    impactPct: number | null;
    /** 1–9 families: shown as a hatch, never as a number. */
    impactSmall: boolean;
    need: number | null;
    /** Filter link, or null if the area can't be selected. */
    href: string | null;
};

// ---- Colors ---------------------------------------------------------------

const IMPACT = {
    colors: ["#FBD9E0", "#F4A9B8", "#E76C82", "#C2405D", "#86203A"],
    // pct cut points between the 5 colors
    cuts: [2, 5, 10, 25],
    labels: ["Under 2%", "2–5%", "5–10%", "10–25%", "25%+"],
};
const NEED = {
    colors: ["#DCE5F1", "#B3C6E0", "#83A1C8", "#56779F", "#33506F"],
    cuts: [20, 40, 60, 80],
    labels: ["0–19", "20–39", "40–59", "60–79", "80–100"],
};
// Per-layer opacity: lower when both layers share the map so neither hides the other.
const OPACITY = { both: 0.75, single: 1 };
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

const step = (value: number, cuts: number[]) =>
    cuts.filter((c) => value >= c).length;

const hexToRgb = (hex: string) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const rgbToHex = (rgb: number[]) =>
    `#${rgb
        .map((c) =>
            Math.round(c * 255)
                .toString(16)
                .padStart(2, "0")
        )
        .join("")}`;
// What a color at `alpha`, multiply-blended over white, looks like. Used for the legend
// so its swatches match the map exactly.
const tint = (hex: string, alpha: number) =>
    hexToRgb(hex).map((c) => 1 - alpha + alpha * c);
const multiply = (a: number[], b: number[]) => a.map((c, i) => c * b[i]);

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

// ---- Text helpers ---------------------------------------------------------

export const formatPct = (pct: number) =>
    pct > 0 && pct < 1 ? "<1%" : `${Math.round(pct)}%`;

function describe(
    name: string,
    area: MapArea | undefined,
    layers: MapLayers,
    needLabel: string,
    shareOf: string
) {
    const parts: string[] = [];
    if (layers.impact) {
        if (area?.impactPct != null)
            parts.push(`${formatPct(area.impactPct)} of ${shareOf}`);
        else if (area?.impactSmall) parts.push("fewer than 10 families");
        else parts.push("no families recorded");
    }
    if (layers.need && area?.need != null)
        parts.push(`${needLabel} ${area.need}`);
    return `${name}: ${parts.join("; ")}`;
}

// ---- Map ------------------------------------------------------------------

export default function ImpactMap({
    view,
    layers,
    areas,
    selected,
    needLabel,
    shareOf,
    backHref,
}: {
    view: MapView;
    layers: MapLayers;
    areas: MapArea[];
    selected: string;
    /** e.g. "community need index (sample)" */
    needLabel: string;
    /** what impact percentages are a share of, e.g. "families with a known town" */
    shareOf: string;
    /** Link back to the statewide map (Boston view only). */
    backHref: string;
}) {
    const { w, h, font } = VIEWS[view];
    const shapes = GEOMETRY[view];
    const byPlace = new Map(areas.map((a) => [a.place, a]));
    const alpha = layers.impact && layers.need ? OPACITY.both : OPACITY.single;

    // Label the selected area, the top areas on the main visible layer (only ones
    // with a value), and a few big cities so the state is recognizable.
    const rank = (a: MapArea) => (layers.impact ? a.impactPct : a.need);
    const top = areas
        .filter((a) => rank(a) !== null)
        .sort((a, b) => rank(b)! - rank(a)!)
        .slice(0, 4)
        .map((a) => a.place);
    const labelled = new Set([selected, ...top, ...LANDMARKS]);
    // In the Boston view label everything that has room; tiny downtown areas only when selected.
    const showLabel = (s: { name: string; size: number }) =>
        s.name === selected ||
        (view === "boston" ? s.size > 900 : labelled.has(s.name));

    return (
        <div className="relative">
            {view === "boston" && (
                <a
                    href={backHref}
                    className="absolute left-2 top-2 z-10 rounded-md border border-bhg-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-bhg-gray-300 shadow-sm hover:bg-bhg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300"
                >
                    ← All of Massachusetts
                </a>
            )}
            <MapZoom key={view} aspect={`${w} / ${h}`}>
                <svg
                    viewBox={`0 0 ${w} ${h}`}
                    className="h-auto w-full"
                    role="group"
                    aria-label={
                        view === "state"
                            ? "Map of Massachusetts towns. Each town links to its figures."
                            : "Map of Boston neighborhoods. Each neighborhood links to its figures."
                    }
                >
                    <style>{`
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
                                stroke={IMPACT.colors[2]}
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
                    {layers.need && (
                        <g
                            style={{ mixBlendMode: "multiply" }}
                            fillOpacity={alpha}
                        >
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
                    )}

                    {/* 3. our impact */}
                    {layers.impact && (
                        <g
                            style={{ mixBlendMode: "multiply" }}
                            fillOpacity={alpha}
                        >
                            {shapes.map((s) => {
                                const a = byPlace.get(s.name);
                                const fill =
                                    a?.impactPct != null
                                        ? IMPACT.colors[
                                              step(a.impactPct, IMPACT.cuts)
                                          ]
                                        : a?.impactSmall
                                          ? "url(#few-families)"
                                          : null;
                                return fill ? (
                                    <use
                                        key={s.id}
                                        href={`#${s.id}`}
                                        fill={fill}
                                    />
                                ) : null;
                            })}
                        </g>
                    )}

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
                    {shapes
                        .filter((s) => s.name === selected)
                        .map((s) => (
                            <use
                                key={s.id}
                                href={`#${s.id}`}
                                fill="none"
                                stroke="#111"
                                strokeWidth={3}
                            />
                        ))}

                    {/* 5. hit targets: links for selectable areas, tooltips for all */}
                    {shapes.map((s) => {
                        const a = byPlace.get(s.name);
                        const text = describe(
                            s.name,
                            a,
                            layers,
                            needLabel,
                            shareOf
                        );
                        return a?.href ? (
                            <a
                                key={s.id}
                                href={a.href}
                                className="hit"
                                aria-label={text}
                                aria-current={
                                    s.name === selected ? "true" : undefined
                                }
                            >
                                <title>{text}</title>
                                <use href={`#${s.id}`} />
                            </a>
                        ) : (
                            <g key={s.id} className="hit">
                                <title>{text}</title>
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
            </MapZoom>
        </div>
    );
}

// ---- Legend ---------------------------------------------------------------

function Swatch({ color, label }: { color: string; label: string }) {
    return (
        <li className="flex items-center gap-1.5">
            <span
                aria-hidden
                className="inline-block h-3.5 w-5 rounded-sm border border-black/20"
                style={{ background: color }}
            />
            {label}
        </li>
    );
}

export function MapLegend({
    layers,
    needTitle,
    needIsSample,
}: {
    layers: MapLayers;
    needTitle: string;
    needIsSample: boolean;
}) {
    const both = layers.impact && layers.need;
    const alpha = both ? OPACITY.both : OPACITY.single;
    const shade = (hex: string) => rgbToHex(tint(hex, alpha));
    // 3×3 overlap key uses the low / middle / high colors of each ramp.
    const keySteps = [0, 2, 4];
    const levels = ["Low", "Mid", "High"];

    return (
        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-xs text-bhg-gray-300">
            {layers.impact && (
                <div>
                    <p className="mb-1 font-semibold">
                        Our impact: share of families
                    </p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {IMPACT.colors.map((c, i) => (
                            <Swatch
                                key={c}
                                color={shade(c)}
                                label={IMPACT.labels[i]}
                            />
                        ))}
                        <li className="flex items-center gap-1.5">
                            <svg
                                aria-hidden
                                width="20"
                                height="14"
                                className="rounded-sm border border-black/20"
                            >
                                <defs>
                                    <pattern
                                        id="few-legend"
                                        width="6"
                                        height="6"
                                        patternUnits="userSpaceOnUse"
                                        patternTransform="rotate(45)"
                                    >
                                        <line
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="6"
                                            stroke={IMPACT.colors[2]}
                                            strokeWidth="2.5"
                                        />
                                    </pattern>
                                </defs>
                                <rect
                                    width="20"
                                    height="14"
                                    fill="url(#few-legend)"
                                />
                            </svg>
                            Fewer than 10 families
                        </li>
                    </ul>
                </div>
            )}
            {layers.need && (
                <div>
                    <p className="mb-1 font-semibold">
                        {needTitle}
                        {needIsSample && (
                            <span className="ml-1.5 rounded bg-bhg-yellow-100 px-1.5 py-0.5 font-medium">
                                Sample data — illustrative only
                            </span>
                        )}
                    </p>
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {NEED.colors.map((c, i) => (
                            <Swatch
                                key={c}
                                color={shade(c)}
                                label={NEED.labels[i]}
                            />
                        ))}
                    </ul>
                </div>
            )}
            {both && (
                <div>
                    <p className="mb-1 font-semibold">Where they overlap</p>
                    <table className="border-separate border-spacing-0.5 text-[10px]">
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    className="text-left font-normal"
                                >
                                    Need ↓ / Impact →
                                </th>
                                {levels.map((l) => (
                                    <th
                                        key={l}
                                        scope="col"
                                        className="font-normal"
                                    >
                                        {l}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {keySteps.map((n, row) => (
                                <tr key={n}>
                                    <th
                                        scope="row"
                                        className="text-left font-normal"
                                    >
                                        {levels[row]}
                                    </th>
                                    {keySteps.map((i) => (
                                        <td key={i}>
                                            <span
                                                className="block h-4 w-6 rounded-sm border border-black/20"
                                                style={{
                                                    background: rgbToHex(
                                                        multiply(
                                                            tint(
                                                                NEED.colors[n],
                                                                alpha
                                                            ),
                                                            tint(
                                                                IMPACT.colors[
                                                                    i
                                                                ],
                                                                alpha
                                                            )
                                                        )
                                                    ),
                                                }}
                                                title={`${levels[row]} need, ${levels[keySteps.indexOf(i)].toLowerCase()} impact`}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
