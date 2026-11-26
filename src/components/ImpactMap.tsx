"use client";

// SVG map for the public impact page: all 351 MA towns, or Boston's 23
// neighborhoods. Community need is an opaque blue choropleth; BHG's impact sits
// ON TOP as solid pink circles (area ~ share of families), so the two never mix:
// a big pink circle on dark blue reads as "BHG works where need is high".
// Places with 1-9 families get a small hollow pink ring instead of a number.
//
// A client component drawing pre-projected paths (mapGeometry.ts), so the
// geometry reaches the browser once, as a cached JS chunk; filter changes only
// send the per-area figures. It is still server-rendered on first load, so the
// area links work without JS. Each shape is defined once in <defs> and reused
// with <use>, which keeps the HTML small.
// Both layers are always rendered; ImpactExplorer shows/hides them via
// data-layer, draws the hover card, and turns link clicks into router.replace.
import { memo } from "react";

import { MAP_GEOMETRY } from "@/lib/impact/mapGeometry";
import {
    BOSTON,
    formatPct,
    impactRadius,
    NEED,
    SIDE_COLOR,
    smallRadius,
    step,
    type MapArea,
    type MapView,
} from "@/lib/impact/mapShared";

const BORDER = "#3F3F3F";
// Always labeled on the state map, spread across MA so visitors can orient themselves.
const LANDMARKS = [
    BOSTON,
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

// Screen-reader text for an area: every value, whatever layer is showing.
function describe(
    name: string,
    area: MapArea | undefined,
    needLabel: string,
    shareOf: string,
    minGroupSize: number
) {
    const parts: string[] = [];
    if (area?.impactPct != null)
        parts.push(`${formatPct(area.impactPct)} of ${shareOf}`);
    else if (area?.impactSmall)
        parts.push(`fewer than ${minGroupSize} families`);
    else if (area?.impactHidden) parts.push("share hidden for privacy");
    else parts.push("no families recorded");
    if (area?.need != null) parts.push(`${needLabel} ${area.need}`);
    return `${name}: ${parts.join("; ")}`;
}

// ---- Map ------------------------------------------------------------------

// Memoized: ImpactExplorer re-renders on every pointer move (the hover card),
// and redrawing ~1,400 SVG elements each time would make hovering stutter.
// Every prop is a primitive or the server's `areas` array, so they stay equal.
export default memo(function ImpactMap({
    view,
    areas,
    selected,
    needLabel,
    shareOf,
    minGroupSize,
}: {
    view: MapView;
    areas: MapArea[];
    /** Outlined and always labeled. Pass the optimistic selection so it shows instantly. */
    selected: string;
    /** e.g. "need index (sample)" */
    needLabel: string;
    /** what impact percentages are a share of, e.g. "families with a known town" */
    shareOf: string;
    /** Privacy threshold (MIN_GROUP_SIZE), for the screen-reader text. */
    minGroupSize: number;
}) {
    const { w, h, font, shapes } = MAP_GEOMETRY[view];
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

    // Impact marks, largest first so small circles are drawn on top of big ones.
    const marks = shapes
        .flatMap((s) => {
            const a = byPlace.get(s.name);
            if (a?.impactPct != null)
                return [
                    { s, r: impactRadius(a.impactPct, view), small: false },
                ];
            if (a?.impactSmall)
                return [{ s, r: smallRadius(view), small: true }];
            return [];
        })
        .sort((a, b) => b.r - a.r);
    const markRadius = new Map(marks.map((m) => [m.s.name, m.r]));

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
                .impact-map .lyr { transition: opacity .2s; }
                [data-layer=impact] .impact-map .lyr-need,
                [data-layer=need] .impact-map .lyr-impact { opacity: 0; }
                .hit use { fill: transparent; }
                .hit:hover use { fill: rgba(0,0,0,.10); }
                .hit:focus { outline: none; }
                .hit:focus-visible use { stroke: #111; stroke-width: 3px; fill: rgba(0,0,0,.10); }
                .hit.selected use { stroke: #111; stroke-width: 3px; }
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
            </defs>

            <rect width={w} height={h} fill={OUTSIDE} />

            {/* 1. base */}
            <g fill="#fff">
                {shapes.map((s) => (
                    <use key={s.id} href={`#${s.id}`} />
                ))}
            </g>

            {/* 2. community need: opaque, so its blue is exactly the legend's */}
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

            {/* 3. borders, above the fills so they stay crisp */}
            <g fill="none" stroke={BORDER} strokeWidth={0.6}>
                {shapes.map((s) => (
                    <use key={s.id} href={`#${s.id}`} />
                ))}
            </g>
            {view === "state" && (
                // Boston drills down, so give it a stronger outline.
                <use
                    href={`#${shapes.find((s) => s.name === BOSTON)?.id}`}
                    fill="none"
                    stroke={BORDER}
                    strokeWidth={2}
                />
            )}

            {/* 4. hit targets. data-place drives the hover card and click handling. */}
            {shapes.map((s) => {
                const a = byPlace.get(s.name);
                const hit = s.name === selected ? "hit selected" : "hit";
                return a?.href ? (
                    <a
                        key={s.id}
                        href={a.href}
                        className={hit}
                        data-place={s.name}
                        aria-label={describe(
                            s.name,
                            a,
                            needLabel,
                            shareOf,
                            minGroupSize
                        )}
                        aria-current={s.name === selected ? "true" : undefined}
                    >
                        <use href={`#${s.id}`} />
                    </a>
                ) : (
                    <g key={s.id} className={hit} data-place={s.name}>
                        <use href={`#${s.id}`} />
                    </g>
                );
            })}

            {/* 5. BHG's impact, the top data layer. A white ring separates each
                circle from the blue and from its neighbours. No pointer events, so
                hovering or clicking a circle reaches the place underneath. */}
            <g className="lyr lyr-impact" pointerEvents="none">
                {marks.map(({ s, r, small }) => (
                    <circle
                        key={s.id}
                        cx={s.centroid[0]}
                        cy={s.centroid[1]}
                        r={r}
                        fill={small ? "#fff" : SIDE_COLOR.impact}
                        stroke={small ? SIDE_COLOR.impact : "#fff"}
                        strokeWidth={small ? 2 : 1.5}
                        vectorEffect="non-scaling-stroke"
                    />
                ))}
            </g>

            {/* labels: white halo, no pointer events so they never block clicks.
                Under the circle when there is one, so the label doesn't hide it. */}
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
                {shapes.filter(showLabel).map((s) => {
                    const r = markRadius.get(s.name);
                    return (
                        <text
                            key={s.id}
                            x={s.centroid[0]}
                            y={r ? s.centroid[1] + r + 2 : s.centroid[1]}
                            dy={r ? "0.85em" : "0.35em"}
                        >
                            {s.name}
                        </text>
                    );
                })}
            </g>
        </svg>
    );
});
