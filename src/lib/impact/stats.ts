// Shape of the /impact stats column. Built on the server (aggregate.ts), drawn
// on the client (StatRows.tsx). Types only, so it's free to import anywhere.
//
// Design rules (see docs/impact-stats-rings-plan.md):
//   - side "need" is blue (the whole area), side "impact" is pink (BHG families);
//   - every value is 0-100 and drawn as a ring that fills to it, so a fuller
//     ring always means a bigger number (counts never go on a ring);
//   - the surface shows only `short` labels; the long `label`/`note`/`ref`
//     text is read in the column's "How we count" block.

export type Side = "need" | "impact";

/** One value on its own 0-100 track. */
export type MeterRow = {
    kind: "meter";
    /** Stable key; also what tests look rows up by. */
    id: string;
    /** Full label, for "How we count" and screen readers. */
    label: string;
    /** Tile label on the ring, at most 4 words. */
    short: string;
    /** One plain sentence for "How we count": what the number measures. */
    hint: string;
    /**
     * Draw as a sentence tile: "[value] before after", e.g. "71% of students
     * attend / 90%+ of school days". Absent = a plain ring tile.
     */
    sentence?: [string, string];
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
    /** Strip heading on the surface, at most 4 words. */
    short: string;
    /** One plain sentence for "How we count". */
    hint: string;
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
    /** Read in "How we count" when the section's scope differs from the header's. */
    note?: string;
    /** A word or two beside the section heading for that scope, e.g. "All years". */
    chip?: string;
    rows: StatRow[];
};
