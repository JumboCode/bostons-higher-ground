# Impact stats column: ring redesign plan

Branch: `feat/impact-stats-rings` (stacked on `perf/impact-map-geometry`,
which also edits `ImpactExplorer.tsx`; rebase onto `main` once that PR merges).

## Problem

The right-hand column on `/impact` reads like a report. Every row has a
sentence-length label, a qualifier, a 0-100 bar, a reference caption and an
empty-state line, so a visitor has to read most of it before any number lands.

## Goal

A "by the numbers" panel you can take in at a glance:

- **Number first, words second.** Each stat is a big number inside a ring
  that fills to its value, with a 2-4 word uppercase label underneath, like
  the "Our Results" row (icon, short label, big number).
- **Circular progress rings instead of line bars**, filling up when they appear.
- **An infographic-style arrangement** like the "By the Numbers" example:
  dark pill headings, dotted dividers, uneven tiles, and one sentence-style
  hero stat per section where the number sits inside a short phrase.
- **Explanations available but out of the way.** The definitions and scope
  notes move into one collapsible "How we count" block at the bottom of the
  column.

Everything else stays: same data, same privacy rules, pink = BHG families,
blue = community need, and clickable places.

## What the column shows today (and in production)

| Row id       | Section   | Kind  | Production?                         |
| ------------ | --------- | ----- | ----------------------------------- |
| `need`       | Housing   | meter | **No.** Need is sample-only, hidden in prod |
| `housed`     | Housing   | meter | Yes                                 |
| `housedFast` | Housing   | meter (nested, "of housed") | Yes           |
| `topPlaces`  | Housing   | list (clickable, up to 5) | Yes             |
| `attendance` | Education | meter | Yes                                 |
| `schools`    | Education | list (up to 5) | Yes                        |

So the layout has to look finished **without** the need tile. That is the
version real visitors will see.

## Proposed layout

The column is about 380px wide at `lg`. Mock (production, need off):

```
 ███ HOUSING ███                       All of MA · All time
┌────────────────────────────────────────────────────────┐
│        ╭───╮            ┊            ╭───╮              │
│       │ 62% │           ┊           │ 48% │             │
│        ╰───╯            ┊            ╰───╯              │
│    FAMILIES HOUSED      ┊       HOUSED IN 6 MONTHS      │
│┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈│
│  WHERE FAMILIES LIVE                                    │
│   ◔ 24%    ◔ 18%    ◔ 11%    ◔ 9%     ◔ 6%              │
│  Dorch.   Roxbury  Mattapan  Brockton  Quincy           │
└────────────────────────────────────────────────────────┘

 ███ EDUCATION ███   all years
┌────────────────────────────────────────────────────────┐
│   ╭────╮                                               │
│  │ 71% │   71% of students attend                      │
│   ╰────╯   90%+ of school days                         │
│┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈│
│  TOP SCHOOLS                                            │
│   ◔ 30%    ◔ 22%    ◔ 15%    ◔ 9%     ◔ 7%              │
│  Ellis    Holland   Mather   ...                        │
└────────────────────────────────────────────────────────┘

 ▸ How we count
```

With need on (dev/staging), the top row becomes three tiles: `housed`,
`housedFast`, then the blue need ring with its average tick. Three 72px rings
fit across 380px.

Why this arrangement:

- **Row of ring tiles with dotted vertical dividers** follows the "Our Results"
  layout. Dividers use `bhg-yellow`, playing the same role as the gold dots there.
- **Sentence tile for Education** (ring on the left, number in bold inside a
  phrase) follows the "27 million acres" / "177 herd management areas" tiles,
  so the two cards look different and the column doesn't feel like a form.
- **Mini-ring strips** replace the ranked bar lists. Five 40px rings with
  short names underneath. Places stay buttons, so clicking still drills down.
  The full name goes in `aria-label` and `title` when it's truncated.
- **Dark pill section headings** (`bg-bhg-gray-300 text-white rounded-full`)
  follow the "Wild Horses and Burros" pill. Scope notes shrink to one small
  chip beside the pill ("all years"), not a sentence.

Phones: same split as today (Housing above the map, Education below), with
tiles in a 2-column grid and the mini strips scrolling horizontally only if
they really need to (5 × 56px fits on a 360px screen, so normally they won't).

## Ring component

New `src/app/impact/Ring.tsx`, an SVG donut with no dependencies:

- Props: `value: number | null`, `color`, `size` (`lg` 96 / `md` 72 / `sm` 40),
  optional `refValue` (drawn as a short dark radial tick on the ring, which
  replaces the bar's "Avg MA town" tick), and `children` for the center number.
- Track: `bhg-gray-100` circle. Arc: `stroke-dasharray` on a circle starting
  at 12 o'clock (`rotate(-90)`), round caps, with a 2% floor so "<1%" still
  shows a sliver (same rule as `Track` today).
- **Fill animation:** the arc animates `stroke-dashoffset` from empty to value
  on mount, and from old to new value when filters change (CSS transition,
  ~700ms ease-out). Mini rings in a strip are staggered by 60ms. Turned off
  under `prefers-reduced-motion`.
- `null` value (suppressed): empty track, "—" in the center, and a tiny
  "Too few" caption. That's the only empty-state text left on the surface.
- SVG is `aria-hidden`. The number and label stay real text, and each tile gets
  an `sr-only` sentence, e.g. "62% of families housed".

## Data-model changes (`src/lib/impact/stats.ts`, `aggregate.ts`)

Keep the row ids and the server/client split. Add short copy and move the
long copy:

- `MeterRow.short`: the tile label, at most 4 words ("Families housed",
  "Housed in 6 months", "Need index", "90%+ attendance").
- `MeterRow.hint` and `ListRow.hint`: one plain sentence for "How we count"
  (what the percentage is a share of, the average used for the tick,
  "not filtered by time period", the privacy threshold). These take over
  today's `note`, `ref.label` and section `note` text.
- `MeterRow.sentence?: [before, after]`: present only on the hero row
  (`attendance`), e.g. `["of students attend", "90%+ of school days"]`.
  The client draws a sentence tile when it's set and a ring tile otherwise,
  so the server picks the emphasis and the client stays layout-only.
- `ListRow.short`: "Where families live", "Top schools".
- `nested` stays. The client no longer indents it; it just becomes the
  next tile in the row. Its `short` label carries the "of housed" meaning.

`tests/impact-aggregate.test.ts` looks rows up by `id`, so it keeps passing.
Add assertions that every row has a `short` of 4 words or fewer and a
non-empty `hint`, so the copy can't drift back to long labels.

## Component changes

- `src/app/impact/StatRows.tsx`: rewrite. Exports `SectionPill`, `RingTile`,
  `SentenceTile`, `MiniRingStrip`, `StatSectionCard` (picks a tile per row,
  groups consecutive meters into one divided row) and `HowWeCount` (a
  `<details>` listing each row's `short` → `hint`, plus the Sample note when
  need is sample). Delete `Track`, `Meter` and `List`.
- `src/app/impact/ImpactExplorer.tsx`: smaller header (place · period on one
  line, key as two dots, clear button kept). Render `HowWeCount` at the end
  of the second stats section. No change to map, filters or drill-down logic.
- `src/app/globals.css`: ring transition and a reduced-motion override.
- Optional: one lucide icon per section pill (`Home`, `GraduationCap`) as a
  light nod to the icon circles in "Our Results". I'd keep icons off the
  individual tiles because the rings already carry the visual weight.

## Accessibility / honesty checks

- Color is never the only cue. Every ring has a text label, and the pink/blue
  key stays whenever need is shown.
- Rings are always 0-100 percentages (or the 0-100 need index), so a fuller
  ring always means a bigger number. Counts must never go on a ring.
- Clickable mini rings keep `aria-pressed`, a visible focus ring, and a target
  of at least 40px.
- Text contrast: numbers in `bhg-gray-300`, not in the ring color.

## Steps

1. Add `short`, `hint`, `sentence` to the types and fill them in `aggregate.ts`.
   Extend the aggregate tests.
2. Build `Ring.tsx` and check it on its own (0, <1, 50, 100, null, with a ref tick).
3. Rewrite `StatRows.tsx` with the tiles, strips, pills and `HowWeCount`.
4. Update `ImpactExplorer.tsx` header and placement.
5. Animation and reduced-motion CSS.
6. Verify: `npm test`, `npm run lint`, `npm run dev`, then screenshot `/impact`
   at 1280px and 375px, need on and off, with All of MA, a town, a Boston
   neighborhood, and a place where values are suppressed.

## Decisions

- Education gets the sentence tile; Housing is a row of ring tiles.
- "Families housed" and "Housed in 6 months" are side-by-side rings, not concentric.
- Section pills carry a lucide icon (`House`, `GraduationCap`); tiles have none.
- The privacy rule stays in the page footer, so "How we count" doesn't repeat it.
