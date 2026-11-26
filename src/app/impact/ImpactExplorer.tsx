"use client";

// Interactive shell around the server-rendered map: layer toggle, filters, legend,
// hover card and the infographic stats column. All numbers arrive pre-aggregated
// (and privacy-suppressed) from page.tsx. Layer switching is client-only (URL via
// history.replaceState); place/timeframe changes router.replace so the server
// recomputes stats without a full page reload.

import { ArrowLeft, Layers, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    useOptimistic,
    useState,
    useTransition,
    type FocusEvent,
    type MouseEvent,
    type PointerEvent,
} from "react";

import type { MapArea, MapView } from "@/components/ImpactMap";
import MapZoom from "@/components/MapZoom";
import {
    ALL,
    BOSTON,
    drillPhase,
    formatPct,
    LAYERS,
    NEED,
    SIDE_COLOR,
    type Layer,
} from "@/lib/impact/mapShared";
import type { StatSection } from "@/lib/impact/stats";

import FilterSelect, { type SelectItem } from "./FilterSelect";
import { SampleBadge, StatKey, StatSectionCard } from "./StatRows";

const LAYER_LABEL: Record<Layer, string> = {
    both: "Both",
    impact: "Impact",
    need: "Need",
};

type Card = { place: string; x: number; y: number };

const panel = "rounded-lg bg-white/90 shadow-md backdrop-blur-sm";

/** Need legend: the opaque blue ramp, low to high. */
function NeedLegend({ badge }: { badge?: React.ReactNode }) {
    return (
        <div>
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
                Community need
                {badge}
            </p>
            <span
                aria-hidden
                className="block h-2 w-32 rounded-full"
                style={{
                    background: `linear-gradient(to right, ${NEED.colors.join(", ")})`,
                }}
            />
            <span className="flex w-32 justify-between text-[10px] text-gray-600">
                <span>Low</span>
                <span>High</span>
            </span>
        </div>
    );
}

/**
 * Impact legend: circle size = share of BHG families, plus the hollow ring for
 * small groups. Sizes are illustrative (the map scales with the screen), so the
 * legend says "smaller/larger" rather than printing percentages.
 */
function ImpactLegend({ minGroupSize }: { minGroupSize: number }) {
    const circle = (r: number) => (
        <svg aria-hidden width={r * 2 + 2} height={r * 2 + 2}>
            <circle
                cx={r + 1}
                cy={r + 1}
                r={r}
                fill={SIDE_COLOR.impact}
                stroke="#fff"
                strokeWidth={1}
            />
        </svg>
    );
    return (
        <div>
            <p className="mb-1 font-semibold">BHG families</p>
            <p className="flex items-center gap-1.5 text-[10px] text-gray-600">
                {circle(3)}
                {circle(5.5)}
                {circle(8)}
                <span>Larger circle = larger share</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-600">
                <svg aria-hidden width={10} height={10}>
                    <circle
                        cx={5}
                        cy={5}
                        r={3.5}
                        fill="#fff"
                        stroke={SIDE_COLOR.impact}
                        strokeWidth={1.5}
                    />
                </svg>
                Under {minGroupSize} families
            </p>
        </div>
    );
}

export default function ImpactExplorer({
    children,
    view,
    aspect,
    bostonOrigin,
    neighborhoods,
    place,
    timeframe,
    initialLayer,
    areas,
    placeOptions,
    timeframes,
    needEnabled,
    needIsSample,
    minGroupSize,
    sections,
}: {
    /** The server-rendered <ImpactMap> SVG. */
    children: React.ReactNode;
    view: MapView;
    /** CSS aspect-ratio of the map's viewBox. */
    aspect: string;
    /** Boston's position on the state map, as a transform-origin. */
    bostonOrigin: string;
    neighborhoods: string[];
    place: string;
    timeframe: string;
    initialLayer: Layer;
    areas: MapArea[];
    placeOptions: SelectItem[];
    timeframes: { value: string; label: string }[];
    /** false hides everything about the need layer (e.g. sample data in production). */
    needEnabled: boolean;
    needIsSample: boolean;
    /** Privacy threshold (MIN_GROUP_SIZE), for the "Under N families" labels. */
    minGroupSize: number;
    /** The stats column: Housing (beside the map), then Education (below it on phones). */
    sections: StatSection[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    // Show the new selection immediately while the server recomputes.
    const [shown, setShown] = useOptimistic({ place, timeframe });
    const [layer, setLayer] = useState<Layer>(initialLayer);
    const [card, setCard] = useState<Card | null>(null);
    const [legendOpen, setLegendOpen] = useState(false);
    // The view being zoomed away from during a Boston drill-down.
    const [leaving, setLeaving] = useState<MapView | null>(null);

    const showImpact = layer !== "need";
    const showNeed = needEnabled && layer !== "impact";
    const byPlace = new Map(areas.map((a) => [a.place, a]));
    const viewOf = (t: string): MapView =>
        t === BOSTON || neighborhoods.includes(t) ? "boston" : "state";

    const url = (q: URLSearchParams) =>
        `${window.location.pathname}${q.size ? `?${q}` : ""}`;

    function go(next: { place?: string; timeframe?: string }) {
        const p = next.place ?? shown.place;
        const t = next.timeframe ?? shown.timeframe;
        const q = new URLSearchParams(window.location.search);
        if (p === ALL) q.delete("town");
        else q.set("town", p);
        if (t === "allTime") q.delete("timeframe");
        else q.set("timeframe", t);
        // Clear it for a same-view click, so a drill-down superseded before the
        // server answered (Boston, then straight back) doesn't animate again.
        setLeaving(viewOf(p) !== view ? view : null);
        setCard(null);
        startTransition(() => {
            setShown({ place: p, timeframe: t });
            router.replace(url(q), { scroll: false });
        });
    }

    function pickLayer(l: Layer) {
        setLayer(l);
        const q = new URLSearchParams(window.location.search);
        if (l === "both") q.delete("layer");
        else q.set("layer", l);
        // No server work needed: both layers are already in the SVG.
        window.history.replaceState(null, "", url(q));
    }

    // ---- hover / focus card (event delegation over the server SVG) ----
    const areaAt = (el: EventTarget) =>
        (el as Element).closest?.("[data-place]")?.getAttribute("data-place");
    function showCard(name: string, clientX: number, clientY: number) {
        setCard({ place: name, x: clientX, y: clientY });
    }
    function onPointer(e: PointerEvent<HTMLDivElement>) {
        const name = areaAt(e.target);
        if (name) showCard(name, e.clientX, e.clientY);
        else setCard(null);
    }
    function onFocus(e: FocusEvent<HTMLDivElement>) {
        const name = areaAt(e.target);
        if (!name) return;
        const r = (e.target as Element).getBoundingClientRect();
        showCard(name, r.left + r.width / 2, r.top + r.height / 2);
    }
    function onClick(e: MouseEvent<HTMLDivElement>) {
        const a = (e.target as Element).closest?.("a[data-place]");
        // Let modified clicks open the link in a new tab.
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        go({ place: a.getAttribute("data-place")! });
    }

    // Card position relative to the map box, flipped to stay inside it.
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    let cardStyle: React.CSSProperties | undefined;
    if (card && box) {
        const r = box.getBoundingClientRect();
        const x = card.x - r.left;
        const y = card.y - r.top;
        cardStyle = {
            left: x > r.width - 180 ? x - 172 : x + 14,
            top: y > r.height - 80 ? y - 72 : y + 14,
        };
    }
    const cardArea = card && byPlace.get(card.place);

    // Drill-down: zoom the old map toward its exit, animate the new one in.
    const phase = drillPhase(leaving, view, pending);
    const mapStyle: React.CSSProperties =
        phase === "exit"
            ? {
                  transform: view === "state" ? "scale(3)" : "scale(0.6)",
                  opacity: 0.3,
                  transformOrigin: view === "state" ? bostonOrigin : "50% 50%",
                  transition: "transform 400ms ease-in, opacity 400ms",
              }
            : phase === "enter"
              ? {
                    animation: `impact-map-in-${view} 450ms ease-out`,
                    transformOrigin:
                        view === "state" ? bostonOrigin : "50% 50%",
                }
              : {};

    const statsCol = `flex flex-col gap-4 transition-opacity ${pending ? "opacity-60" : ""}`;
    const selectPlace = (name: string) => go({ place: name });
    const [housing, ...rest] = sections;
    const timeframeLabel =
        timeframes.find((t) => t.value === shown.timeframe)?.label ?? "";

    const filters = (
        <div className="flex gap-2">
            <FilterSelect
                label="Place"
                value={shown.place}
                options={placeOptions}
                onChange={(v) => go({ place: v })}
            />
            <FilterSelect
                label="Time period"
                value={shown.timeframe}
                options={timeframes}
                onChange={(v) => go({ timeframe: v })}
            />
        </div>
    );

    return (
        <div
            data-layer={layer}
            className="impact-anim grid grid-cols-1 gap-4 text-bhg-gray-300 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]"
        >
            {shown.place !== ALL && (
                // Selection outline, drawn client-side so it appears instantly.
                // "Other places" come from free-text Salesforce cities, so escape
                // "<" (CSS \3c) as well as quotes: the name can't close the tag.
                <style>{`.impact-map .hit[data-place=${JSON.stringify(shown.place).replace(/</g, "\\3c ")}] use { stroke: #111; stroke-width: 3px; }`}</style>
            )}

            {/* ---- Stats column. Phones: housing above the map, education below. ---- */}
            <section
                aria-busy={pending}
                aria-label="Statistics"
                className={`${statsCol} lg:col-start-2 lg:row-start-1`}
            >
                {/* The selected place and period, and the color key that ties the
                    column to the map. Rows whose scope differs (the places list,
                    Education) say so with their own note. */}
                <header className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold">
                            {shown.place === ALL
                                ? "All of Massachusetts"
                                : shown.place}
                            <span className="font-normal text-gray-600">
                                {" "}
                                · {timeframeLabel}
                            </span>
                        </p>
                        {shown.place !== ALL && (
                            <button
                                type="button"
                                onClick={() => go({ place: ALL })}
                                aria-label={`Clear ${shown.place}, show all of Massachusetts`}
                                className="rounded-full p-1 hover:bg-bhg-gray-100"
                            >
                                <X size={16} aria-hidden />
                            </button>
                        )}
                    </div>
                    {/* One series needs no key: with need off, every bar is BHG's. */}
                    {needEnabled && <StatKey />}
                </header>
                {housing && (
                    <StatSectionCard
                        section={housing}
                        selected={shown.place}
                        onSelect={selectPlace}
                    />
                )}
            </section>

            {/* ---- Map ---- */}
            <div className="min-w-0 lg:sticky lg:top-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
                {/* Phones: filters above the map so they don't cover it. */}
                <div className="mb-2 sm:hidden">{filters}</div>
                <div
                    ref={setBox}
                    className="relative overflow-hidden rounded-xl bg-white shadow-sm"
                    onPointerMove={onPointer}
                    onPointerDown={onPointer}
                    onPointerLeave={() => setCard(null)}
                    onFocus={onFocus}
                    onBlur={() => setCard(null)}
                    onClick={onClick}
                >
                    <MapZoom key={view} aspect={aspect}>
                        {/* overflow-hidden: the drill zoom must not add scrollbars */}
                        <div className="overflow-hidden">
                            <div style={mapStyle}>{children}</div>
                        </div>
                    </MapZoom>

                    {/* top-left: layers + back */}
                    <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
                        {needEnabled && (
                            <div
                                role="group"
                                aria-label="Map layers"
                                className={`${panel} flex rounded-full p-0.5 text-xs font-medium`}
                            >
                                {LAYERS.map((l) => (
                                    <button
                                        key={l}
                                        type="button"
                                        aria-pressed={l === layer}
                                        onClick={() => pickLayer(l)}
                                        className={`rounded-full px-2.5 py-1 transition-colors ${
                                            l === layer
                                                ? "bg-bhg-gray-300 text-white"
                                                : "hover:bg-bhg-gray-100"
                                        }`}
                                    >
                                        {LAYER_LABEL[l]}
                                    </button>
                                ))}
                            </div>
                        )}
                        {view === "boston" && (
                            <button
                                type="button"
                                onClick={() => go({ place: ALL })}
                                className={`${panel} inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-white`}
                            >
                                <ArrowLeft size={14} aria-hidden />
                                All of Massachusetts
                            </button>
                        )}
                    </div>

                    {/* top-right: filters (wider screens), left of MapZoom's buttons */}
                    <div
                        className={`${panel} absolute right-12 top-2 hidden p-1 sm:block`}
                    >
                        {filters}
                    </div>

                    {/* bottom-left: legend (a button on phones) */}
                    <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1.5 text-[11px]">
                        <div
                            id="map-legend"
                            className={`${panel} space-y-2 p-2.5 ${legendOpen ? "" : "hidden"} sm:block`}
                        >
                            {/* Top of the map = top of the legend: BHG first. */}
                            {showImpact && (
                                <ImpactLegend minGroupSize={minGroupSize} />
                            )}
                            {showNeed && (
                                <NeedLegend
                                    badge={needIsSample && <SampleBadge />}
                                />
                            )}
                        </div>
                        <button
                            type="button"
                            aria-expanded={legendOpen}
                            aria-controls="map-legend"
                            onClick={() => setLegendOpen((o) => !o)}
                            className={`${panel} inline-flex items-center gap-1 px-2.5 py-1 font-medium sm:hidden`}
                        >
                            <Layers size={14} aria-hidden />
                            Legend
                            {showNeed && needIsSample && !legendOpen && (
                                <SampleBadge />
                            )}
                        </button>
                    </div>

                    {/* hover / focus card */}
                    {card && cardStyle && (
                        // aria-hidden: each area's aria-label already carries these values.
                        <div
                            aria-hidden
                            className="pointer-events-none absolute z-20 w-40 rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/5"
                            style={cardStyle}
                        >
                            <p className="mb-0.5 font-bold">{card.place}</p>
                            {showImpact && (
                                <p className="flex justify-between">
                                    <span>Families</span>
                                    <span className="tabular-nums">
                                        {cardArea?.impactPct != null
                                            ? formatPct(cardArea.impactPct)
                                            : cardArea?.impactSmall
                                              ? `Under ${minGroupSize}`
                                              : "—"}
                                    </span>
                                </p>
                            )}
                            {showNeed && (
                                <p className="flex justify-between gap-2">
                                    <span>Need</span>
                                    <span className="tabular-nums">
                                        {cardArea?.need ?? "—"}
                                        {needIsSample && " · Sample"}
                                    </span>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <section
                aria-busy={pending}
                aria-label="More statistics"
                className={`${statsCol} lg:col-start-2 lg:row-start-2`}
            >
                {rest.map((section) => (
                    <StatSectionCard
                        key={section.title}
                        section={section}
                        selected={shown.place}
                        onSelect={selectPlace}
                    />
                ))}
            </section>
        </div>
    );
}
