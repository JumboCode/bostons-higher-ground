# Public Impact Data Implementation Plan

**Goal:** Complete the base scope of #114 on `feat/public-impact-data`, based on updated `main-devops`.
**Architecture:** Keep Salesforce Accounts as source records. Canonicalize family records for family metrics; retain raw records for investigation. Publish only fixed aggregate fields through a server-only cached loader.
**Tech stack:** Next 15, TypeScript, Drizzle/Postgres, jsforce, node:test.
**Spec:** Issue #114 supplied in conversation; user authorized implementation decisions and continuous execution.

## Constraints and decisions
- No migration-history repair or production schema/data writes in this scope.
- Use existing minimum group size 10. Hide small nonzero public counts and withhold the headline whenever a monthly bucket or historical baseline is small, protecting against subtraction.
- Reuse #103 baseline rules: earliest housing per trimmed family ID; additions strictly after baseline cutoff; no future dates.
- Public loader returns `familiesHousedToDate`, `housingOverTime`, `asOfDate`, `minimumGroupSize`, and `provisional`; no identifiers.
- Keep /impact design integration for Alex; supply import, return type and usage documentation.
- Missing Family IDs must remain visible as skipped records. Never filter them out of the SOQL result.

## Review focus
- Repeated families across baseline cutoff or date filters must not become new families.
- Conflicting dates, statuses and locations need a deterministic documented policy.
- Small groups must not be recoverable by subtracting published buckets from the total.
- Salesforce pagination must preserve skipped IDs without personal data.
- Both successful sync and baseline changes must invalidate `report-data`.

## Tasks
1. Read-only Salesforce and database audit: confirm DeveloperName, compare duplicate Accounts and report only aggregate findings. Document evidence versus interpretation.
2. Add skipped Salesforce IDs to sync outcome, sync log migration and admin banner. Test pagination, zero skips, errors, ID-only display and existing auth guard. Configure verified filter in example and as the Account default.
3. Add shared family canonicalization: earliest intake and housed dates, latest intake record for categorical fields (stable tie break). Use before filtering family charts/counters; test duplicate, whitespace, blank, conflicting and cross-filter cases.
4. Implement `getPublicImpactData()` with server-only guard, shared baseline computation, monthly first-housed aggregates, minimum group 10 and complementary suppression; cache for 300 seconds under `report-data`, keyed by Boston calendar day. Invalidate on baseline saves. Test cutoff, future dates, empty baseline, suppression and cache/auth boundaries.
5. Document deployment migration, record-type filter, verified duplicate findings and Alex's return contract. Run all tests, typecheck, lint scoped changes and production build; obtain independent final code review and fix material findings.

## Progress
- Baseline: 20 tests passed, 3 integration/opt-in tests skipped.
- Updated `main-devops` e046ffc fetched and feature branch created; existing work preserved on original branch.
- Salesforce DeveloperName verified: FLSI_Household. Database: 922 rows, 814 families, 86 repeated family IDs, 108 extra rows.
- Tasks 1–4 implemented. Core/full security suite: 45 passed, 2 opt-in/live tests skipped; PGlite migration passed. Typecheck, changed-file lint, Drizzle check and production build passed (existing unrelated lint warnings remain).
- Ruling: Keep categorical values from latest intake and earliest enrollment/housing dates — deterministic family reporting without deleting legitimate intake records; staff may later choose a different source-of-truth policy.
- Ruling: Do not migrate or run a production sync — deployment/operator steps are documented; source data and migration ledger stay untouched.
- Final review: Independent reviewer found exact-recovery cases in initial complementary suppression. Both reproductions were confirmed RED; fix withholds headline whenever any monthly bucket is suppressed. This can leave public total unavailable for sparse series; coarser periods are a possible follow-up.
- Final review fix: Also protect small historical baselines from subtraction. Three regression tests confirmed RED then GREEN; full suite 48 passed, 2 skipped (live aggregate and opt-in soak). No deferred minor findings.
