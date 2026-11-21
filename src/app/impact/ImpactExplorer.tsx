"use client";

// Interactive shell around the server-rendered map: layer toggle, filters, legend,
// hover card and the infographic stats column. All numbers arrive pre-aggregated
// (and privacy-suppressed) from page.tsx. Layer switching is client-only (URL via
// history.replaceState); place/timeframe changes router.replace so the server
// recomputes stats without a full page reload.

import {
    ArrowLeft,
    Clock,
    Gauge,
    GraduationCap,
    House,
    Layers,
    X,
} from "lucide-react";
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
    formatPct,
    HATCH,
    IMPACT,
    LAYERS,
    NEED,
    OPACITY,
    tint,
    type Layer,
} from "@/lib/impact/mapShared";

import FilterSelect, { type SelectItem } from "./FilterSelect";

const LAYER_LABEL: Record<Layer, string> = {
    both: "Both",
    impact: "Impact",
    need: "Need",
};
const ALL = "all";

export type Bar = { name: string; pct: number };
export type ImpactStats = {
    housed: number | null;
    housedFast: number | null;
    need: number | null;
    /** e.g. "Need index (MA avg 54)" */
    needLabel: string;
    attendance: number | null;
    /** Top places in the current map view, by share of families. */
    topPlaces: Bar[];
    schools: Bar[];
};

type Card = { place: string; x: number; y: number };

const panel = "rounded-lg bg-white/90 shadow-md backdrop-blur-sm";

function SampleBadge() {
    return (
        <span className="rounded bg-bhg-yellow-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-bhg-gray-300 ring-1 ring-bhg-yellow">
            Sample
        </span>
    );
}

function Stat({
    value,
    label,
    icon: Icon,
    className,
    badge,
}: {
    value: string | null;
    label: string;
    icon: typeof House;
    className: string;
    badge?: React.ReactNode;
}) {
    return (
        <div className={`relative rounded-xl p-4 ${className}`}>
            <Icon
                size={18}
                aria-hidden
                className="absolute right-3 top-3 opacity-50"
            />
            <p className="text-3xl font-bold tabular-nums md:text-4xl">
                {value ?? "—"}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium">
                {label}
                {badge}
            </p>
            {value === null && (
                <p className="mt-0.5 text-[11px] opacity-70">Too few to show</p>
            )}
        </div>
    );
}

function Bars({
    title,
    bars,
    color,
    selected,
    onSelect,
}: {
    title: string;
    bars: Bar[];
    color: string;
    selected?: string;
    onSelect?: (name: string) => void;
}) {
    if (!bars.length) return null;
    const max = Math.max(...bars.map((b) => b.pct));
    return (
        <div className="col-span-2 rounded-xl bg-white p-4">
            <h3 className="mb-2 text-xs font-semibold">{title}</h3>
            <ol className="space-y-1.5 text-xs">
                {bars.map((b) => {
                    const body = (
                        <>
                            <span className="flex justify-between gap-2">
                                <span
                                    className={`truncate ${b.name === selected ? "font-bold" : ""}`}
                                >
                                    {b.name}
                                </span>
                                <span className="tabular-nums">
                                    {formatPct(b.pct)}
                                </span>
                            </span>
                            <span className="mt-0.5 block h-2 rounded-full bg-bhg-gray-100">
                                <span
                                    className="block h-2 rounded-full transition-[width] duration-300"
                                    // Scaled to the largest bar so small shares stay visible.
                                    style={{
                                        width: `${Math.max(3, (b.pct / max) * 100)}%`,
                                        background: color,
                                    }}
                                />
                            </span>
                        </>
                    );
                    return (
                        <li key={b.name}>
                            {onSelect ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(b.name)}
                                    aria-pressed={b.name === selected}
                                    className="block w-full rounded text-left hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300"
                                >
                                    {body}
                                </button>
                            ) : (
                                body
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function GradientRow({
    title,
    colors,
    alpha,
    badge,
}: {
    title: string;
    colors: string[];
    alpha: number;
    badge?: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
                {title}
                {badge}
            </p>
            <span
                aria-hidden
                className="block h-2 w-32 rounded-full"
                style={{
                    background: `linear-gradient(to right, ${colors.map((c) => tint(c, alpha)).join(", ")})`,
                }}
            />
            <span className="flex w-32 justify-between text-[10px] text-gray-600">
                <span>Low</span>
                <span>High</span>
            </span>
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
    needIsSample,
    stats,
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
    needIsSample: boolean;
    stats: ImpactStats;
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
    const showNeed = layer !== "impact";
    const alpha = layer === "both" ? OPACITY.both : OPACITY.single;
    const byPlace = new Map(areas.map((a) => [a.place, a]));
    const viewOf = (t: string): MapView =>
        t === "Boston" || neighborhoods.includes(t) ? "boston" : "state";

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
        if (viewOf(p) !== view) setLeaving(view);
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
    const exiting = leaving === view;
    const mapStyle: React.CSSProperties = exiting
        ? {
              transform: view === "state" ? "scale(3)" : "scale(0.6)",
              opacity: 0.3,
              transformOrigin: view === "state" ? bostonOrigin : "50% 50%",
              transition: "transform 400ms ease-in, opacity 400ms",
          }
        : leaving
          ? {
                animation: `impact-map-in-${view} 450ms ease-out`,
                transformOrigin: view === "state" ? bostonOrigin : "50% 50%",
            }
          : {};

    const statsGrid = `grid grid-cols-2 content-start gap-3 transition-opacity ${pending ? "opacity-60" : ""}`;

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
                <style>{`.impact-map .hit[data-place=${JSON.stringify(shown.place)}] use { stroke: #111; stroke-width: 3px; }`}</style>
            )}

            {/* ---- Stats column. Phones: housing above the map, education below. ---- */}
            <section
                aria-busy={pending}
                className={`${statsGrid} lg:col-start-2 lg:row-start-1`}
            >
                {shown.place !== ALL && (
                    <button
                        type="button"
                        onClick={() => go({ place: ALL })}
                        aria-label={`Clear ${shown.place}, show all of Massachusetts`}
                        className="col-span-2 inline-flex items-center gap-1 justify-self-start rounded-full bg-bhg-gray-300 py-1 pl-3 pr-2 text-xs font-semibold text-white hover:bg-black"
                    >
                        {shown.place}
                        <X size={14} aria-hidden />
                    </button>
                )}
                <h2 className="col-span-2 text-xl font-semibold">Housing</h2>
                <Stat
                    value={stats.need === null ? null : String(stats.need)}
                    label={stats.needLabel}
                    icon={Gauge}
                    badge={needIsSample && <SampleBadge />}
                    className="col-span-2 bg-[#E3EAF4]"
                />
                <Stat
                    value={stats.housed === null ? null : `${stats.housed}%`}
                    label="Families housed"
                    icon={House}
                    className="bg-bhg-pink-100"
                />
                <Stat
                    value={
                        stats.housedFast === null
                            ? null
                            : `${stats.housedFast}%`
                    }
                    label="Housed within 6 months"
                    icon={Clock}
                    className="bg-bhg-mint-100"
                />
                <Bars
                    title="Where families live"
                    bars={stats.topPlaces}
                    color={IMPACT.colors[2]}
                    selected={shown.place}
                    onSelect={(name) => go({ place: name })}
                />
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
                            {showImpact && (
                                <GradientRow
                                    title="Impact"
                                    colors={IMPACT.colors}
                                    alpha={alpha}
                                />
                            )}
                            {showNeed && (
                                <GradientRow
                                    title="Need"
                                    colors={NEED.colors}
                                    alpha={alpha}
                                    badge={needIsSample && <SampleBadge />}
                                />
                            )}
                            {showImpact && (
                                <p className="flex items-center gap-1.5">
                                    <span
                                        aria-hidden
                                        className="inline-block h-3 w-4 rounded-sm border border-black/20"
                                        style={{
                                            background: `repeating-linear-gradient(45deg, ${HATCH} 0 2px, #fff 2px 5px)`,
                                        }}
                                    />
                                    Under 10 families
                                </p>
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
                                              ? "Under 10"
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
                className={`${statsGrid} lg:col-start-2 lg:row-start-2`}
            >
                <h2 className="col-span-2 text-xl font-semibold">Education</h2>
                <Stat
                    value={
                        stats.attendance === null
                            ? null
                            : `${stats.attendance}%`
                    }
                    label="Students at 90%+ attendance"
                    icon={GraduationCap}
                    className="col-span-2 bg-bhg-yellow-100"
                />
                <Bars
                    title="Students by school"
                    bars={stats.schools}
                    color="#F5CB6A"
                />
            </section>
        </div>
    );
}
