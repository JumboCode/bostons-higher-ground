# Public impact data — #114

## Alex's integration contract

Import from a **Server Component** (for example `src/app/impact/page.tsx`):

```tsx
import { getPublicImpactData } from "@/lib/getPublicImpactData";

const impact = await getPublicImpactData();
```

The final return type is:

```ts
type PublicImpactData = {
    familiesHousedToDate: number | null;
    housingOverTime: {
        month: string; // YYYY-MM, ascending, includes zero months
        familiesHoused: number | null;
    }[];
    asOfDate: string; // YYYY-MM-DD, America/New_York
    minimumGroupSize: number; // currently 10, shared with existing charts
    provisional: boolean;
};
```

`familiesHousedToDate` uses #103's saved historical baseline plus distinct
families first housed **strictly after** its inclusive cutoff and no later than
`asOfDate`. A family with housing before the cutoff is never counted again for
a later intake. IDs are trimmed; blank IDs and invalid/future housing dates do
not count. No baseline fields, identifiers, names, addresses, or source rows
leave this function.

`housingOverTime` is **monthly new families housed since the baseline cutoff**,
not a cumulative series. It starts with the cutoff's calendar month (only dates
after the cutoff count) and ends with the current Boston month. Historical
baseline families have no invented monthly dates. The series may therefore
have a different sum from the all-time headline. The current month is partial.

`null` means withheld or unavailable. Display “Not available” for a null
headline. Chart nulls must remain gaps/withheld buckets; **never coerce them to
zero or connect a line across gaps**. Zero is a measured zero. Do not add public
location/school/date filters, unsuppressed totals, or baseline breakdowns without
revisiting privacy. Additional releases could defeat suppression by subtraction.

Nonzero monthly groups below 10 are withheld. **Whenever any monthly bucket is
withheld, the headline is also withheld**, even when the historical baseline is
large. A nonzero historical baseline smaller than 10 also withholds the
headline, preventing recovery by subtracting visible months. Hiding just one
extra month is insufficient: for example, ten hidden
positive months totaling ten reveals every month's count as one. This
conservative rule prevents recovery from the headline and visible months in
this release. Sparse monthly data can therefore leave the public headline
unavailable; a future design could instead publish coarser time periods. It
does not claim protection against all historical snapshots or other datasets.

If baseline storage is missing, return a null headline and empty series. If the
table exists but no baseline is saved, use #103's provisional zero baseline
before the first intake and set `provisional: true`. Database failures propagate;
the UI should show an unavailable state, not mock numbers.

The loader is guarded by `server-only`, cached for 300 seconds under
`report-data`, and keyed by Boston calendar day. Successful Salesforce syncs and
baseline saves invalidate that tag. Only finished aggregates should be passed
to client components. There is intentionally no public route exposing raw rows.

The /impact design and its existing mock education data are left for Alex to
integrate. No message has been sent to Alex; this document is the handoff.

## Verified duplicate-family findings (2026-11-08)

Read-only Salesforce metadata confirms the Account record type label
**FLSI Household**, API name **FLSI_Household**. Current Salesforce counts differ
slightly from the issue's older snapshot:

| Salesforce Account type | Accounts |
| --- | ---: |
| FLSI_Household | 934 |
| HH_Account | 1,113 |
| Organization | 53 |

Of the 934 program Accounts, **8 lack a Family ID**. Filtering to this type
would currently import **926 rows representing 818 distinct families** and skip
8. Counts naturally change as staff edit Salesforce; these are audit results,
not hard-coded expectations in the sync.

The existing database snapshot contains **922 rows / 814 distinct family IDs**.
There are **86 repeated family IDs**, accounting for **108 extra rows**. The
issue's subtraction does not imply 108 different duplicated families.

The Salesforce audit finds the same 86 repeated family IDs and 108 extra rows.
**Every repeated group contains distinct Salesforce Account IDs.** This is
multiple source Accounts sharing a Family ID, rather than the sync inserting
the same Account multiple times. Across those repeated groups:

- 36 have multiple distinct intake dates.
- 7 have identical values for every configured, available mapped field.
- In the database snapshot, 3 have multiple housing dates, 17 have multiple
  statuses, 11 have multiple cities, and 38 have multiple housing sources.
  These groups overlap; do not add the counts.

Different intake dates support repeat intake as an explanation for some
families. Identical mapped fields support duplicate Accounts for others, but
these fields cannot prove staff intent. **Staff must confirm whether the
Accounts represent repeat intakes, duplicate entry, or another process before
any source records are merged or deleted.** No source records were modified.

Family metrics now group by trimmed, nonempty `family_id` before applying
report filters. They use the earliest valid intake and earliest valid housing
date per family. Categorical charts use the record with the latest valid intake
date; ties resolve deterministically by field values. This is a reporting
policy, not a claim that we know which Account staff consider authoritative.
Earliest dates may come from separate Accounts, so the wait-time metric is
first enrollment to first housing, not the duration of each intake episode.

This policy covers family intake, families housed, days to house, active/housed
families by location, housing sources, and the overview family counter/wait
time. The #103 housed baseline already deduplicated family IDs. Student and
school metrics retain their own units; raw synced rows remain available for
authorized investigation.

Re-run the read-only audit from the repository root:

```sh
node --import tsx scripts/audit-impact-data.ts
```

It loads `.env.local` without printing credentials, queries Salesforce metadata
and mapped records, and prints only metadata and aggregate diagnostics. It
does not print family IDs, Salesforce Account IDs, or personal data.

## Deployment

1. Apply `drizzle/0006_skipped_salesforce_record_ids.sql` **before deploying the
   updated sync/admin code**. For environments with an accurate migration
   ledger, use the normal migration process. For the production environment
   with an empty ledger, do not replay 0000–0005: first verify 0005 is installed,
   back up, and have the database operator apply only 0006 transactionally:

   ```sh
   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 --single-transaction \
     -f drizzle/0006_skipped_salesforce_record_ids.sql
   ```

   Verify the new nullable `sync_log.skipped_record_ids` JSONB column. Existing
   log rows stay null; they cannot retroactively identify skipped Accounts.
2. Set `SALESFORCE_QUERY_FILTER="RecordType.DeveloperName = 'FLSI_Household'"`
   in deployment settings. This is also the code default for Account syncs.
   An explicitly blank override intentionally disables filtering; remove any
   old blank override. Never add `Family_Id__c != null` to this filter, because
   admins need the missing-ID records to appear in skipped diagnostics.
3. Deploy and run one admin sync. The admin banner shows a collapsible list of
   skipped Salesforce IDs from the latest **successful** sync. Staff fix
   `Family_Id__c` in Salesforce and sync again. Only validated 15/18-character
   IDs are persisted; no names or other Account fields are stored in the log.
   The existing sync GET/POST routes remain admin-authorized.
4. Alex wires the contract above into /impact, replacing housing placeholders.

No live schema migration, sync, Salesforce cleanup, deployment, or migration
ledger modification was performed for this change. The migration-history
stretch goal remains out of scope.
