# Public impact data — #114

## Loader contract

`getPublicImpactData()` is a server-only loader that returns public housing
aggregates. It is not yet wired into `/impact`: the page from #116 (town map,
filters, shares) is the current public page, and adopting this loader there
(for example for the headline count) is a follow-up.

```tsx
import { getPublicImpactData } from "@/lib/getPublicImpactData";
const impact = await getPublicImpactData(); // Server Component only
```

```ts
type PublicImpactData = {
    familiesHousedToDate: number | null;
    housingOverTime: {
        periodStart: string; // YYYY-MM-DD, inclusive
        periodEnd: string;   // YYYY-MM-DD, inclusive
        label: string;       // e.g. Feb 2025, Q1 2025, 2025, or 2024–2025
        familiesHoused: number;
    }[];
    housingGranularity: "month" | "quarter" | "year" | "allTime" | null;
    asOfDate: string; // YYYY-MM-DD, America/New_York
    minimumGroupSize: number; // 10
    provisional: boolean;
};
```

No identifiers, source rows or baseline breakdown leave the loader. It accepts
no filters.

## Counting and privacy rules

The headline follows #103: saved historical baseline plus distinct families
first housed **strictly after** its inclusive cutoff, through `asOfDate`.
Trim Family IDs, ignore blank IDs and invalid/future housing dates, and never
count a previously housed family again after a repeat intake.

**Housed means a valid `dateHoused`.** Families whose status is "housed" but
who have no `dateHoused` cannot be placed before or after the baseline cutoff,
so they are not counted as additions. This is consistent with the #103 baseline
but undercounts compared with #116's public page, which also counts status-only
families. The team should decide which definition public figures use before
this loader replaces or sits alongside #116's counts.

The series contains **newly housed families since the baseline cutoff**, not
cumulative totals. It counts families housed from the day after that cutoff
through the current Boston day. Periods are reported with calendar boundaries
(e.g. a quarter starts on its first day), so the first and current periods may
be partial; the exact series start is not published, because with a
provisional baseline it would be one family's intake date. Historical baseline
families have no invented housing dates. The series sum therefore excludes the
historical baseline while the headline includes it.

Try one uniform calendar granularity at a time: month, quarter, year, then one
all-time period. Publish the finest complete series in which every nonzero
bucket has at least 10 distinct families. Zero remains a measured zero. Never
publish the rejected finer buckets. For example, ten singleton months become
one yearly group of 10, rather than ten hidden positive months whose values
could be recovered from a total. Use bars and the returned labels/boundaries,
since the reporting unit can change.

When the entire additions population is between 1 and 9, return an empty
series, null granularity, and null headline: subtracting a known historical
baseline from the headline would otherwise disclose that small population.
When a nonzero historical baseline is smaller than 10, withhold the headline
to prevent recovery by subtracting the visible series. A total of zero is valid;
null means unavailable/withheld, never zero.

These rules protect minimum groups **within a single release**. Exact public
incrementing counters can disclose changes when compared across snapshots or
against other datasets. This is not differential privacy or a promise of
longitudinal inference protection.

If baseline storage is missing, return a null headline and empty series. If its
table exists but no baseline is saved, use #103's provisional zero baseline
before the first intake and set `provisional: true`.

The loader is cached for 300 seconds under `report-data` and keyed by Boston
calendar day. Successful Salesforce syncs and baseline saves invalidate that tag.

## Repeated Family IDs

Salesforce contains program Accounts that share a Family ID. In an audit, every
repeated group consisted of distinct Salesforce Accounts (not the sync inserting
one Account twice). Some groups have different intake dates, consistent with
repeat intakes; others have identical mapped fields, consistent with duplicate
entry. **Staff must confirm which before any source records are merged or
deleted.** No source records were modified.

Family metrics therefore count each trimmed, nonempty `family_id` once
(`canonicalFamilies` in `src/lib/family-metrics.ts`), using these rules:

- **Date windows.** Report filters (timeframe, city, school) are applied to a
  family's individual records first. A family appears in a window if any of its
  records falls in it, and is then merged from only those in-window records. A
  family that returned for a new intake this period therefore appears in this
  period with its current details, while earlier windows still see its earlier
  episodes. (Merging all records first and filtering on the earliest intake
  would hide returning families from recent windows, including the default
  "past two years" view.)
- **Time series** (family intake, families housed) count distinct families per
  period: several records in one period count once, and a family that returns
  in a later period also counts in that later period.
- **Current details.** Within the merged records, categorical fields (city,
  school, status) come from the record with the latest valid intake date; ties
  resolve deterministically. The location chart's active/housed split uses this
  current status, so a family housed earlier that has since returned counts as
  **active**.
- **Housing source** comes from the family's housed record, so a family housed
  earlier that has since returned is still counted in the housing-sources chart.
- **Days to house** uses intake and housing dates from the **same record**, so a
  wait is never computed across two different intake episodes (which could be
  negative or inflated).

This covers family intake, families housed, days to house, active/housed
families by location, housing sources, partner-school and city family/student
counts, and the overview family counter/wait time. The public loader uses all
of a family's records (it takes no filters). Raw synced rows remain available
for authorized investigation.

`scripts/audit-impact-data.ts` re-runs the read-only audit
(`node --import tsx scripts/audit-impact-data.ts`). It prints only metadata and
aggregate diagnostics, never family IDs, Account IDs or personal data. Do not
commit its output: several of its counts are smaller than the minimum group size.

## Deployment

1. Migration **0006** adds nullable `sync_log.skipped_record_ids`. The code
   tolerates the column being absent: sync and the admin banner keep working,
   and only the skipped-ID list is unavailable until the migration is applied.
   Apply it through the team's normal, reviewed migration process. Do not replay
   historical migrations against a database with an empty Drizzle ledger.
2. The Account sync now defaults to
   `SALESFORCE_QUERY_FILTER="RecordType.DeveloperName = 'FLSI_Household'"`
   (program families only), so report numbers will change after the next sync.
   An explicitly blank override disables the filter; remove old blank entries.
   Do not add `Family_Id__c != null`: records missing a Family ID must stay in
   scope so staff can see them in the skipped diagnostics.
3. Run an admin sync. The admin banner lists Salesforce IDs skipped for a
   missing Family ID in the latest successful sync. Staff fill in
   `Family_Id__c` in Salesforce and sync again.
