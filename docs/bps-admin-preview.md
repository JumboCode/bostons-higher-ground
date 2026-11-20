# Admin BPS upload preview

Issue: https://github.com/JumboCode/bostons-higher-ground/issues/104

Implemented on `feat/bps-data-import`, based on `origin/main-devops` at
`65d5e1c`. TypeScript is the selected implementation for the real importer.
The offline Python mock under `scripts/bps_import/` is a frozen historical demo;
its older ID rules are not the current production design.

## Run the upload demo

1. Run `pnpm install --frozen-lockfile` in this worktree.
2. Configure the usual application database/auth environment for your development
   environment. The preview does not need Salesforce credentials. Do not connect
   development to production just to test this feature.
3. Run `pnpm dev`, sign in with an existing development admin, and open `/admin`.
4. In **BPS upload preview**, download the sample workbook.
5. Choose that workbook, confirm it contains synthetic data, and select
   **Preview upload**.

Expected: 41 total rows, 36 matched, 1 unmatched, 4 with errors. Errors are one
ambiguous directory match, two duplicate student/period rows, and one grade over
100. The response includes Excel row numbers and fixed reasons, never IDs,
names, metric values, or original cell contents. Refreshing/previewing again
does not create records because the feature has no write operation.

`public/mock-bps.xlsx` is entirely synthetic and intentionally downloadable.
Regenerate it with `node scripts/create-bps-mock.mjs`.

## API and validation

`POST /api/admin/bps-preview` accepts multipart fields `file` and `mockOnly=true`.
It checks the session and database-backed admin role before reading the body,
returns 401/403 for unauthorized requests, and rejects cross-origin browser
requests. The existing middleware restricts `/admin` to admins. The API performs
its own check because middleware excludes API routes.

The prototype accepts exactly one unencrypted worksheet named `Mock BPS` with
required headers `student_id`, `period`, `math_grade`, and `attendance_pct`.
Additional columns are ignored. Synthetic student IDs may be text like
`MOCK-0001`, digit-only text, or nonnegative whole-number cells up to 15 digits.
The mock directory includes numeric test student `1001`. Text `"1001"` and
numeric `1001` match identically; text `"001001"` stays distinct and unmatched.
Zeros are never stripped or guessed from a display format. Longer numeric cells,
fractions, negatives and formulas are errors; long text IDs are preserved.
Periods are `2025-fall` and `2026-spring`. At least one metric must
be present per row. Selected metrics must be finite numbers from 0 to 100;
zero is valid, missing is not zero, and formula/error cells are rejected.

All occurrences of a duplicate student/period key are errors. The same student
in two different periods is valid. Unknown mock IDs count as unmatched. An ID
with multiple directory matches counts as an error. Invalid structure rejects
the whole workbook; malformed data rows are excluded from matched counts.

Limits: 1 MiB compressed file, request size capped by actual streamed bytes,
8 MiB expanded ZIP data, 100 archive entries, 1,000 data rows, 30 columns,
50 displayed issues. Reject encrypted files, macros and external-link parts.
All responses containing preview results use `Cache-Control: no-store`.
There are no Salesforce imports, database writes, file persistence, or raw-data
logs in this feature. Confirmation and mock ID formats help prevent accidental
real input; they cannot prove arbitrary uploaded content is synthetic.

The seven password-protected source workbooks are not used by this prototype.
No password is stored in code, docs, or comments. A sandbox and approved privacy
terms/columns are prerequisites to a separate real-data import implementation.

## Tests

```sh
node --import tsx --test tests/bps-preview.test.ts
pnpm exec eslint src/lib/bps-preview.ts src/lib/bps-preview-handler.ts src/components/BpsUploadPreview.tsx src/app/api/admin/bps-preview/route.ts tests/bps-preview.test.ts
pnpm exec tsc --noEmit
```

Parser tests use in-memory synthetic XLSX workbooks. They cover sample counts,
missing/duplicate headers, duplicate IDs by period, malformed values, formulas,
zero/blank handling, invalid/encrypted files, size/row limits, and bounded output.
Handler tests cover auth rejection before body parsing, cross-origin rejection,
confirmation, wrong file types, multiple files, and streaming size enforcement.

See `docs/bps-import-plan.md` for mappings, aggregate methodology, and BHG questions.

## Validation performed

- 15 parser/API tests, 4 existing baseline-handler tests, and 13 historical Python mock tests passed.
- TypeScript and targeted ESLint checks passed.
- A temporary browser harness exercised this component with the real multipart
  handler and synthetic fixture: expected counts, disabled/confirmation states,
  clearing stale results, malformed-upload errors, and a 390px mobile viewport
  without horizontal overflow. The harness used a stub admin identity; it did
  not exercise a real login. Production code still uses the real session/role checks.
- Production compilation succeeded. Full `pnpm build` could not complete page-data
  collection for existing routes because this isolated worktree has no
  `DATABASE_URL`. No production credentials were copied for testing. Existing
  lint warnings elsewhere in the application remain unchanged.
