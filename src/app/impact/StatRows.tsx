// The /impact stats column: one white card per section, every value on a
// 0-100 track. Blue = community need (the whole area), pink = BHG families,
// matching the map. Numbers stay in text color; the bar beside a number says
// which side it belongs to, and pairs are also labeled ("Area" / "BHG") so
// identity never rests on color alone. Bars are aria-hidden: the label and the
// number next to each one are real text.
// Plain components (no hooks), rendered inside the client ImpactExplorer.

import { formatPct, SIDE_COLOR } from "@/lib/impact/mapShared";
import type {
    ListRow,
    MeterRow,
    PairRow,
    Side,
    StatRow,
    StatSection,
} from "@/lib/impact/stats";

const SIDE_NAME: Record<Side, string> = {
    need: "Community need",
    impact: "BHG families",
};

export function SampleBadge() {
    return (
        <span className="rounded bg-bhg-yellow-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-bhg-gray-300 ring-1 ring-bhg-yellow">
            Sample
        </span>
    );
}

const show = (value: number | null, unit: string) =>
    value === null ? "—" : unit === "%" ? formatPct(value) : `${value}${unit}`;

/** Small color chip: the same swatch the map legend and the bars use. */
function Swatch({ side, round }: { side: Side; round?: boolean }) {
    return (
        <span
            aria-hidden
            className={`inline-block shrink-0 ${round ? "size-2 rounded-full" : "h-2 w-3.5 rounded-sm"}`}
            style={{ background: SIDE_COLOR[side] }}
        />
    );
}

/** A 0-100 track with an optional reference tick (e.g. the Boston average). */
function Track({
    value,
    side,
    refValue,
    thin,
}: {
    value: number | null;
    side: Side;
    refValue?: number;
    thin?: boolean;
}) {
    return (
        <span
            aria-hidden
            className={`relative block rounded-full bg-bhg-gray-100 ${thin ? "h-1.5" : "h-2.5"}`}
        >
            {value !== null && (
                <span
                    className="block h-full rounded-full transition-[width] duration-300"
                    // 2% floor so a published "<1%" still shows a sliver.
                    style={{
                        width: `${Math.min(100, Math.max(2, value))}%`,
                        background: SIDE_COLOR[side],
                    }}
                />
            )}
            {refValue !== undefined && (
                <span
                    className="absolute -bottom-1 -top-1 w-0.5 rounded-full bg-bhg-gray-300 ring-2 ring-white"
                    style={{ left: `calc(${refValue}% - 1px)` }}
                />
            )}
        </span>
    );
}

/** "Community need ▬  BHG families ▬", the same key as the map legend. */
export function StatKey() {
    return (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
            {(["need", "impact"] as const).map((side) => (
                <span key={side} className="inline-flex items-center gap-1.5">
                    <Swatch side={side} />
                    {SIDE_NAME[side]}
                </span>
            ))}
        </p>
    );
}

function Meter({ row }: { row: MeterRow }) {
    return (
        <div
            className={
                row.nested ? "ml-3 border-l-2 border-bhg-gray-100 pl-3" : ""
            }
        >
            <div className="mb-1.5 flex items-end justify-between gap-3">
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-medium">
                    {row.label}
                    {row.note && (
                        <span className="font-normal text-gray-600">
                            {row.note}
                        </span>
                    )}
                    {row.sample && <SampleBadge />}
                </p>
                <p
                    className={`shrink-0 font-bold leading-none ${row.nested ? "text-xl" : "text-3xl"}`}
                >
                    {show(row.value, row.unit)}
                </p>
            </div>
            <Track
                value={row.value}
                side={row.side}
                refValue={row.ref?.value}
                thin={row.nested}
            />
            {(row.value === null || row.ref) && (
                <p className="mt-1.5 flex justify-between gap-2 text-[11px] text-gray-600">
                    <span>{row.value === null ? row.emptyText : ""}</span>
                    {row.ref && (
                        <span className="inline-flex items-center gap-1">
                            <span
                                aria-hidden
                                className="inline-block h-2.5 w-0.5 rounded-full bg-bhg-gray-300"
                            />
                            {row.ref.label} {show(row.ref.value, row.unit)}
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}

function Pair({ row }: { row: PairRow }) {
    const lines = [
        { side: "need" as const, label: row.needLabel, value: row.need },
        { side: "impact" as const, label: row.impactLabel, value: row.impact },
    ];
    return (
        <div>
            <p className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-medium">
                {row.label}
                {row.sample && <SampleBadge />}
            </p>
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-x-2 gap-y-2">
                {lines.map((l) => (
                    <div key={l.side} className="contents">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
                            <Swatch side={l.side} round />
                            {l.label}
                        </span>
                        <Track value={l.value} side={l.side} />
                        <span className="text-right text-lg font-bold leading-none">
                            {show(l.value, row.unit)}
                        </span>
                    </div>
                ))}
            </div>
            {row.impact === null && (
                <p className="mt-1.5 text-[11px] text-gray-600">
                    {row.impactLabel}: {row.emptyText}
                </p>
            )}
        </div>
    );
}

function List({
    row,
    selected,
    onSelect,
}: {
    row: ListRow;
    selected: string;
    onSelect: (name: string) => void;
}) {
    if (!row.items.length) return null;
    const cols = row.showNeed
        ? "grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_2.5rem_2.5rem]"
        : "grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_2.5rem]";
    return (
        <div>
            <div
                className={`mb-1.5 grid items-end gap-x-2 text-xs font-semibold ${cols}`}
            >
                <h3 className="col-span-3 flex items-center gap-1.5">
                    {row.title}
                </h3>
                {row.showNeed && (
                    <span className="inline-flex items-center justify-end gap-1 text-[11px] font-medium text-gray-600">
                        <Swatch side="need" round />
                        Need
                    </span>
                )}
            </div>
            <ol className="text-xs">
                {row.items.map((item) => {
                    const isSelected = item.name === selected;
                    const cells = (
                        <>
                            <span
                                className={`truncate ${isSelected ? "font-bold" : ""}`}
                            >
                                {item.name}
                            </span>
                            <Track value={item.pct} side="impact" thin />
                            <span className="text-right tabular-nums">
                                {formatPct(item.pct)}
                            </span>
                            {row.showNeed && (
                                <span className="text-right tabular-nums">
                                    {item.need ?? "—"}
                                </span>
                            )}
                        </>
                    );
                    const grid = `grid min-h-7 w-full items-center gap-x-2 ${cols}`;
                    const desc = `${item.name}: ${formatPct(item.pct)} of BHG families${
                        row.showNeed && item.need !== null
                            ? `, need ${item.need}`
                            : ""
                    }`;
                    return (
                        <li key={item.name}>
                            {row.selectable ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(item.name)}
                                    aria-pressed={isSelected}
                                    aria-label={desc}
                                    className={`${grid} rounded text-left hover:bg-bhg-gray-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300`}
                                >
                                    {cells}
                                </button>
                            ) : (
                                <div className={grid}>{cells}</div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function Row(props: {
    row: StatRow;
    selected: string;
    onSelect: (name: string) => void;
}) {
    const { row } = props;
    if (row.kind === "meter") return <Meter row={row} />;
    if (row.kind === "pair") return <Pair row={row} />;
    return <List {...props} row={row} />;
}

/** One section ("Housing", "Education"): a heading and one white card of rows. */
export function StatSectionCard({
    section,
    selected,
    onSelect,
}: {
    section: StatSection;
    selected: string;
    onSelect: (name: string) => void;
}) {
    return (
        <div>
            <h2 className="mb-2 text-xl font-semibold">{section.title}</h2>
            <div className="space-y-5 rounded-xl bg-white p-4 shadow-sm">
                {section.rows.map((row) => (
                    <Row
                        key={row.id}
                        row={row}
                        selected={selected}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}
