# Complete Public Impact Implementation Plan

**Goal:** Complete the advanced local implementation of #114 on `feat/public-impact-data`.
**Spec:** Issue #114 and the user's instruction to choose implementation details, complete the advanced work, and finish local checks before a Neon branch is available.
**Architecture:** Keep the existing server-only aggregate loader, deduplicate source families, and coarsen the entire housing series uniformly from month to quarter to year to all-time until each nonzero group contains at least 10 families. Integrate only real housing data into all existing impact design variants; retain education as clearly labeled sample data until separately approved. Build migration-ledger reconciliation separately, dry-run by default, with isolated SQL integration tests.

## Decisions
- Return typed period boundaries and labels; use a bar chart so variable granularity is explicit.
- Publish no filters or mixed-granularity releases. If fewer than 10 additions exist, omit the series rather than expose their subtotal; withhold headline when subtraction could expose a small historical baseline.
- Keep saved #103 baseline and earliest-first-housing rules. Fail closed on missing baseline storage. Show unavailable states on database errors, never housing mocks.
- Do not invent a real count for the current mock “Need” metric or publish mock education numbers as real; clearly separate sample education panels.
- No live migrations, Salesforce edits, production sync, production deployment, or messages to others.
- User chose local checks first. Neon branch verification remains explicitly pending without a supplied disposable branch connection.

## Tasks
1. Update aggregate tests first: monthly safe data; quarter/year/all-time coarsening; singleton/upper-bound inference regressions; small additions/baseline; missing baseline, dates, duplicate and future IDs. Implement typed periods with a uniform release.
2. Test/render /impact for every design, missing/suppressed/failed data and no identifiers; wire the real loader and display readable period units and source dates. Use the existing styles and design variants.
3. Independent migration tooling task: reconcile exact hashes/timestamps of 0000–0005 only after schema validation, refuse drift/partial ledgers, transaction/locking/idempotency, dry-run default. Test in isolated Postgres-compatible runtime; document Neon branch commands and outstanding external verification.
4. Read issue/comments and related #103/PR discussion for Neon ownership/access. Draft a PM/TL question if no access instructions exist; do not post it without instruction.
5. Run full suite, build, type/lint/migration checks, browser verification where available, and independent review. Fix material findings, update the handoff and save a local commit.

## Review focus
- Date cutoffs, duplicates across periods, and future housing dates.
- Integer-subtraction inference, small historical baseline and small additions.
- Mock versus real labeling and public serialization of aggregates only.
- Ledger hash mismatch, missing constraints/indexes, transaction rollback and concurrency.
- Production target refusal and no claims that local tests replace a Neon branch test.

## Progress
- Initial branch clean at f583935. Base tests being rerun.
- Neon CLI/API credentials absent and browser host unavailable. User selected “Finish local checks first.”
- Core advanced implementation complete: uniform coarsening, /impact integration, explicit education sample labeling, unavailable states and public auth independence.
- Ruling: Coarsen the entire series uniformly rather than mixing suppressed fine periods with an exact total; current real data may require the all-time fallback, which preserves the correct headline but gives limited trend detail.
- Ruling: Minimum group size protects a single release. Preserve the requested exact incrementing counter; longitudinal privacy would require a separately agreed publication policy.
- Independent review found ledger-trigger/rule drift and URI routing overrides. Regressions were confirmed RED and fixed with full ledger structural validation, rewrite-rule checks, post-insert verification, TLS query allowlisting and PGOPTIONS rejection.
- Current evidence: 76 tests passed, 2 opt-in/live tests skipped; production build, TypeScript, changed-file lint and Drizzle check passed. Local HTTP 200 and real housing headline 186; no raw ID field names in response.
- Issue #114 contains no comments/access directions; #103 points to an unlinked Slack handoff. Draft PM/TL question saved; no messages sent.
- Required Neon branch validation remains pending by user choice. No production migration, Salesforce write, sync or deployment performed.
- Final visual verification found missing SVG bars despite valid computed colors; literal fill diagnostic restored them. Both bar renderers now pass configured colors directly (two RED→GREEN tests). Fresh rebuilt desktop/mobile screenshots passed.
- Final full suite: 78 passed, 2 skipped. Production build, typecheck, changed-file lint and whitespace checks passed. No deferred minor review findings.
