# Public impact data — #114

## Final integration contract

`src/app/impact/page.tsx` now calls the server-only `getPublicImpactData()` loader
for real housing figures in all three design variants. Mock housing counters
and the mock housing series are removed. Education remains a clearly labeled
sample-data design preview; it is not presented as reported program results.

```tsx
import { getPublicImpactData } from "@/lib/getPublicImpactData";
const impact = await getPublicImpactData();
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

This replaces the initial `month`/nullable-bucket contract. Alex can use the
page's finished integration or import the loader elsewhere in a Server
Component. No identifiers, source rows or baseline breakdown leave the loader;
only finished aggregate chart models are passed to the client renderer.
The public page also renders an accessible data table of the same aggregates.

## Counting and privacy rules

The headline follows #103: saved historical baseline plus distinct families
first housed **strictly after** its inclusive cutoff, through `asOfDate`.
Trim Family IDs, ignore blank IDs and invalid/future housing dates, and never
count a previously housed family again after a repeat intake.

The series contains **newly housed families since the baseline cutoff**, not
cumulative totals. Its first date is the day after that cutoff; its last date
is the current Boston day. Historical baseline families have no invented
housing dates. The current period may be partial. Its sum therefore excludes
the historical baseline while the headline includes it.

Try one uniform calendar granularity at a time: month, quarter, year, then one
all-time period. Publish the finest complete series in which every nonzero
bucket has at least 10 distinct families. Zero remains a measured zero. Never
publish the rejected finer buckets or allow public filters to retrieve them.
For example, ten singleton months become one yearly group of 10, rather than
ten hidden positive months whose values could be recovered from a total.
Use bars and the returned labels/boundaries, since the reporting unit can change.

When the entire additions population is between 1 and 9, return an empty
series, null granularity, and null headline: subtracting a known historical
baseline from the headline would otherwise disclose that small population.
When a nonzero historical baseline is smaller than 10, withhold the headline
to prevent recovery by subtracting the visible series. A total of zero is valid;
null means unavailable/withheld, never zero.

These rules protect minimum groups **within a single release**. Exact public
incrementing counters can disclose changes when compared across snapshots or
against other datasets. This is not differential privacy or a promise of
longitudinal inference protection. Stronger protection would require a separate
publication/batching policy and coordination across all public releases.

If baseline storage is missing, return a null headline and empty series. If its
table exists but no baseline is saved, use #103's provisional zero baseline
before the first intake and set `provisional: true`. Database failures render a
generic unavailable state on /impact; they do not expose diagnostics or fall
back to housing mocks. /impact does not depend on the authenticated session
service. Other route authorization is unchanged.

The loader is cached for 300 seconds under `report-data` and keyed by Boston
calendar day. Successful Salesforce syncs and baseline saves invalidate that
tag. The v2 cache key prevents reuse of the old return shape.

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

## Deployment and remaining external verification

1. Apply migration **0006 before deploying** the updated sync/admin code. Do
   not blindly replay historical migrations on the production database with
   an empty ledger. Use the branch-only reconciliation procedure in
   [migration-history-reconciliation.md](migration-history-reconciliation.md)
   to validate 0000–0005 and exercise ordinary migration of 0006 on a disposable
   Neon branch first. That tool defaults to dry run, refuses production endpoint
   selection, rejects drift and never executes historical migration SQL on its
   target. Local tests are not a substitute for the required Neon branch test.
2. Set `SALESFORCE_QUERY_FILTER="RecordType.DeveloperName = 'FLSI_Household'"`
   in deployment settings. It is also the Account code default. Remove old
   explicitly blank overrides. Do not add `Family_Id__c != null`, because staff
   need the missing-ID records to appear in skipped diagnostics.
3. Deploy and run an admin sync. The admin banner shows validated skipped
   Salesforce IDs from the latest successful sync. Staff fill in `Family_Id__c`
   in Salesforce and sync again. Old log rows cannot retroactively supply IDs.
4. Verify /impact in each design and admin baseline changes/cache invalidation.

No production migration, sync, Salesforce cleanup, deployment, or message to
Alex/PM/TL has been performed. The local implementation and migration tests are
complete, but **Neon branch verification is pending**. The user selected local
checks first because no branch connection/management session is available.
See [the draft PM/TL access question](issue-114-neon-question.md); it includes
what was found in the issue discussions. Do not mark the stretch acceptance
criterion complete until the actual branch test has passed.

## Local validation receipt

- Full application/security suite with isolated PGlite enabled: **78 passed,
  2 skipped** (live aggregate and opt-in Salesforce soak).
- Reconciliation tests cover dry-run rollback, exact ledger records,
  drift/trigger/rule refusal, injected write rollback, endpoint-routing guards,
  and the installed Drizzle migrator applying only 0006.
- Production build, TypeScript, changed-file ESLint, Drizzle check and whitespace
  checks passed. Existing unrelated build lint warnings remain.
- Real local HTTP/browser verification: `/impact` returns 200, headline **186**
  for the current cached database snapshot, one safe `2017–2026` reporting
  period, explicit education sample labels, and no raw ID field names in HTML.
- Desktop/mobile screenshots confirmed visible chart bars. Browser diagnosis
  isolated an SVG paint issue with CSS-variable fills; both shared bar renderers
  now pass their configured colors directly, with two regression tests.
- No actual Neon branch reconciliation test or production changes performed.
