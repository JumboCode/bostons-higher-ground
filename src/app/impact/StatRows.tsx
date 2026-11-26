// The /impact stats column, laid out like a "by the numbers" infographic:
// a dark pill heading per section, then a white card of tiles split by dotted
// yellow dividers. Every value is a 0-100 ring (Ring.tsx) with the number in
// the middle and a 2-4 word label under it. Pink = BHG families, blue =
// community need, matching the map.
//
// Only `short` labels are on the surface. The full labels, scopes and
// definitions are in the "How we count" block (privacy is in the page footer), and every tile carries an
// sr-only sentence with the full label, so the rings and short labels are
// aria-hidden and nothing is announced twice.
// Plain components (no hooks), rendered inside the client ImpactExplorer.

import {
    ChevronDown,
    GraduationCap,
    House,
    Info,
    type LucideIcon,
} from "lucide-react";

import { formatPct, SIDE_COLOR } from "@/lib/impact/mapShared";
import type {
    ListRow,
    MeterRow,
    Side,
    StatRow,
    StatSection,
} from "@/lib/impact/stats";

import Ring from "./Ring";

const SIDE_NAME: Record<Side, string> = {
    need: "Community need",
    impact: "BHG families",
};

const SECTION_ICON: Record<StatSection["title"], LucideIcon> = {
    Housing: House,
    Education: GraduationCap,
};

/** Dotted brand-yellow rules between tiles, like the reference infographics. */
const DIVIDE_Y = "divide-y-2 divide-dotted divide-bhg-yellow";
const DIVIDE_X = "divide-x-2 divide-dotted divide-bhg-yellow";
const TILE_LABEL =
    "text-[11px] font-bold uppercase leading-tight tracking-wide";

export function SampleBadge() {
    return (
        <span className="rounded bg-bhg-yellow-100 px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-bhg-gray-300 ring-1 ring-bhg-yellow">
            Sample
        </span>
    );
}

const show = (value: number | null, unit: string) =>
    value === null ? "—" : unit === "%" ? formatPct(value) : `${value}${unit}`;

/** The whole row as one sentence for screen readers. */
function srText(row: MeterRow) {
    const label = row.note ? `${row.label} (${row.note})` : row.label;
    if (row.value === null) return `${label}: ${row.emptyText}.`;
    const ref = row.ref
        ? `, ${row.ref.label} ${show(row.ref.value, row.unit)}`
        : "";
    return `${label}: ${show(row.value, row.unit)}${ref}${row.sample ? ", sample data" : ""}.`;
}

function Dot({ side }: { side: Side }) {
    return (
        <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ background: SIDE_COLOR[side] }}
        />
    );
}

/** "● Community need  ● BHG families", the same key as the map legend. */
export function StatKey() {
    return (
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
            {(["impact", "need"] as const).map((side) => (
                <span key={side} className="inline-flex items-center gap-1.5">
                    <Dot side={side} />
                    {SIDE_NAME[side]}
                </span>
            ))}
        </p>
    );
}

/** Ring with the number inside and a short uppercase label under it. */
function RingTile({ row, delay }: { row: MeterRow; delay: number }) {
    return (
        <div className="flex min-w-0 flex-col items-center px-2 text-center">
            <div aria-hidden className="flex flex-col items-center">
                <Ring
                    value={row.value}
                    color={SIDE_COLOR[row.side]}
                    refValue={row.ref?.value}
                    delay={delay}
                >
                    <span
                        className={`text-xl font-bold tabular-nums ${row.value === null ? "text-gray-400" : ""}`}
                    >
                        {show(row.value, row.unit)}
                    </span>
                </Ring>
                <p className={`mt-2 ${TILE_LABEL}`}>{row.short}</p>
                {row.value === null ? (
                    <p className="mt-0.5 text-[10px] text-gray-600">
                        {row.emptyText}
                    </p>
                ) : (
                    row.ref && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gray-600">
                            <span className="inline-block h-2.5 w-0.5 rounded-full bg-bhg-gray-300" />
                            avg {show(row.ref.value, row.unit)}
                        </p>
                    )
                )}
                {row.sample && (
                    <span className="mt-1">
                        <SampleBadge />
                    </span>
                )}
            </div>
            <span className="sr-only">{srText(row)}</span>
        </div>
    );
}

/** A big ring beside a phrase: "71% | of students attend / 90%+ of school days". */
function SentenceTile({ row }: { row: MeterRow }) {
    const [before, after] = row.sentence!;
    return (
        <div className="flex items-center gap-4">
            <div aria-hidden className="flex items-center gap-4">
                <Ring value={row.value} color={SIDE_COLOR[row.side]} size="lg">
                    <span
                        className={`text-2xl font-bold tabular-nums ${row.value === null ? "text-gray-400" : ""}`}
                    >
                        {show(row.value, row.unit)}
                    </span>
                </Ring>
                {row.value === null ? (
                    <p>
                        <span className={`block ${TILE_LABEL}`}>
                            {row.short}
                        </span>
                        <span className="text-xs text-gray-600">
                            {row.emptyText}
                        </span>
                    </p>
                ) : (
                    <p className="text-lg leading-snug">
                        {before}
                        <strong className="block font-bold">{after}</strong>
                    </p>
                )}
            </div>
            <span className="sr-only">{srText(row)}</span>
        </div>
    );
}

/** Up to five small rings in a row, e.g. the places with the most BHG families. */
function MiniRingStrip({
    row,
    selected,
    onSelect,
}: {
    row: ListRow;
    selected: string;
    onSelect: (name: string) => void;
}) {
    return (
        <div>
            <h3 className={`mb-2 text-center ${TILE_LABEL}`}>{row.short}</h3>
            {/* Up to 72px per item, centered, so one or two items don't sit in a corner. */}
            <ol
                className="grid justify-center gap-1"
                style={{
                    gridTemplateColumns: `repeat(${row.items.length}, minmax(0, 72px))`,
                }}
            >
                {row.items.map((item, i) => {
                    const isSelected = item.name === selected;
                    const desc = `${item.name}: ${formatPct(item.pct)} of BHG families${
                        row.showNeed && item.need !== null
                            ? `, need ${item.need}`
                            : ""
                    }`;
                    const cells = (
                        <>
                            <Ring
                                value={item.pct}
                                color={SIDE_COLOR.impact}
                                size="sm"
                                delay={150 + i * 60}
                            >
                                <span className="text-[11px] font-bold tabular-nums">
                                    {formatPct(item.pct)}
                                </span>
                            </Ring>
                            <span
                                className={`mt-1 block w-full truncate text-[11px] leading-tight ${isSelected ? "font-bold" : ""}`}
                            >
                                {item.name}
                            </span>
                            {row.showNeed && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-600">
                                    <Dot side="need" />
                                    {item.need ?? "—"}
                                </span>
                            )}
                        </>
                    );
                    const tile =
                        "flex w-full min-w-0 flex-col items-center rounded-lg p-1 text-center";
                    return (
                        <li key={item.name} className="min-w-0">
                            {row.selectable ? (
                                <button
                                    type="button"
                                    onClick={() => onSelect(item.name)}
                                    aria-pressed={isSelected}
                                    aria-label={desc}
                                    title={item.name}
                                    className={`${tile} transition-colors hover:bg-bhg-gray-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bhg-gray-300 ${isSelected ? "bg-bhg-pink-100" : ""}`}
                                >
                                    {cells}
                                </button>
                            ) : (
                                <div
                                    className={tile}
                                    title={item.name}
                                    role="img"
                                    aria-label={desc.replace(
                                        "BHG families",
                                        "BHG students"
                                    )}
                                >
                                    {cells}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

type Block =
    | { kind: "rings"; rows: MeterRow[] }
    | { kind: "sentence"; row: MeterRow }
    | { kind: "list"; row: ListRow };

/** Consecutive plain meters share one divided row; sentence and list rows stand alone. */
function toBlocks(rows: StatRow[]): Block[] {
    const blocks: Block[] = [];
    for (const row of rows) {
        const last = blocks.at(-1);
        if (row.kind === "list") {
            if (row.items.length) blocks.push({ kind: "list", row });
        } else if (row.sentence) blocks.push({ kind: "sentence", row });
        else if (last?.kind === "rings") last.rows.push(row);
        else blocks.push({ kind: "rings", rows: [row] });
    }
    return blocks;
}

/** One section ("Housing", "Education"): a pill heading and one card of tiles. */
export function StatSectionCard({
    section,
    selected,
    onSelect,
}: {
    section: StatSection;
    selected: string;
    onSelect: (name: string) => void;
}) {
    const Icon = SECTION_ICON[section.title];
    return (
        <div>
            <div className="mb-2 flex items-center gap-2">
                <h2 className="inline-flex items-center gap-1.5 rounded-full bg-bhg-gray-300 px-3 py-1 text-sm font-bold uppercase tracking-wider text-white">
                    <Icon size={15} aria-hidden />
                    {section.title}
                </h2>
                {section.chip && (
                    <span className="rounded-full bg-bhg-yellow-100 px-2 py-0.5 text-[11px] font-medium ring-1 ring-bhg-yellow">
                        {section.chip}
                    </span>
                )}
            </div>
            <div className={`rounded-xl bg-white px-4 shadow-sm ${DIVIDE_Y}`}>
                {toBlocks(section.rows).map((block) => (
                    <div
                        key={
                            block.kind === "rings"
                                ? block.rows[0].id
                                : block.row.id
                        }
                        className="py-4"
                    >
                        {block.kind === "rings" ? (
                            <div
                                className={`grid ${DIVIDE_X}`}
                                style={{
                                    gridTemplateColumns: `repeat(${block.rows.length}, minmax(0, 1fr))`,
                                }}
                            >
                                {block.rows.map((row, i) => (
                                    <RingTile
                                        key={row.id}
                                        row={row}
                                        delay={i * 80}
                                    />
                                ))}
                            </div>
                        ) : block.kind === "sentence" ? (
                            <SentenceTile row={block.row} />
                        ) : (
                            <MiniRingStrip
                                row={block.row}
                                selected={selected}
                                onSelect={onSelect}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Definitions for every tile, folded away so the column stays numbers-first. */
export function HowWeCount({ sections }: { sections: StatSection[] }) {
    return (
        <details className="group rounded-xl bg-white px-4 py-3 text-xs shadow-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-semibold [&::-webkit-details-marker]:hidden">
                <Info size={14} aria-hidden />
                How we count
                <ChevronDown
                    size={14}
                    aria-hidden
                    className="ml-auto transition-transform group-open:rotate-180"
                />
            </summary>
            <dl className="mt-3 space-y-2.5">
                {sections.flatMap((section) => [
                    ...section.rows.map((row) => (
                        <div key={row.id}>
                            <dt className="font-semibold">{row.short}</dt>
                            <dd className="text-gray-600">
                                {row.hint}
                                {row.kind === "meter" &&
                                    row.ref &&
                                    ` The tick marks the ${row.ref.label} (${show(row.ref.value, row.unit)}).`}
                                {row.kind === "meter" &&
                                    row.sample &&
                                    " Sample data, for layout only."}
                            </dd>
                        </div>
                    )),
                    ...(section.note
                        ? [
                              <div key={`${section.title}-note`}>
                                  <dt className="font-semibold">
                                      {section.title}
                                  </dt>
                                  <dd className="text-gray-600">
                                      {section.note}.
                                  </dd>
                              </div>,
                          ]
                        : []),
                ])}
            </dl>
        </details>
    );
}
