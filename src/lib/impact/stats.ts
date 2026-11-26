// Shape of the /impact stats column. Built on the server (aggregate.ts), drawn
// on the client (StatRows.tsx). Types only, so it's free to import anywhere.
//
// Design rules (see the stats design plan):
//   - side "need" is blue (the whole area), side "impact" is pink (BHG families);
//   - every value sits on a 0-100 track so length can be compared before reading;
//   - need and impact values each get their own meter (they answer different
//     questions), with a reference tick for context.

export type Side = "need" | "impact";

/** One value on its own 0-100 track. */
export type MeterRow = {
    kind: "meter";
    /** Stable key; also what tests look rows up by. */
    id: string;
    label: string;
    side: Side;
    /** 0-100, or null when suppressed / unknown. */
    value: number | null;
    /** How the value is written, e.g. "%" for shares, "" for an index. */
    unit: string;
    /** A comparison tick on the track, e.g. the Boston average. */
    ref?: { label: string; value: number };
    /** A subset of the row above (e.g. housed within 6 months, of housed). */
    nested?: boolean;
    /** Short qualifier after the label, e.g. "of housed". */
    note?: string;
    /** Shown under "—" when value is null. */
    emptyText: string;
    sample?: boolean;
};

/** Ranked impact bars, optionally with each item's need value beside it. */
export type ListRow = {
    kind: "list";
    id: string;
    title: string;
    /** What the percentages are a share of, e.g. "Share of Boston families...". */
    note?: string;
    items: { name: string; pct: number; need: number | null }[];
    /** Rows are places the reader can click to select. */
    selectable: boolean;
    /** Show the need column (false when there is no need metric). */
    showNeed: boolean;
};

export type StatRow = MeterRow | ListRow;
export type StatSection = {
    title: "Housing" | "Education";
    /** Shown under the title when the section's scope differs from the header's. */
    note?: string;
    rows: StatRow[];
};
