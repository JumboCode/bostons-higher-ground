# BPS import plan for team review — issue #104

## Implemented scope

Built on `main-devops` (base `65d5e1c`) in branch `feat/bps-data-import`.
The admin page now has a synthetic Excel upload preview backed by
`POST /api/admin/bps-preview`. Both the page's existing middleware and the API's
session/admin check restrict access. The API checks authorization before reading
the upload, parses the mock workbook, and returns matched/unmatched/error counts
plus row numbers and fixed reasons. It does not return student IDs or metric
values, persist uploaded files, log raw rows, or write to Salesforce or the app DB.

The sample yields 41 rows: 36 matched, 1 unmatched, 4 errors (one ambiguous ID,
two duplicate student/period rows, one invalid grade). Tests cover parsing,
validation, request limits, and unauthorized requests. The existing Python mock
still demonstrates repeat-safe imports and before/after aggregates in memory.
Run instructions are in `docs/bps-admin-preview.md`.

Validation: 15 upload parser/API tests and 13 historical Python mock tests pass, along with
TypeScript and targeted lint checks. A local browser harness checked the upload
flow and mobile layout with synthetic data. Production compilation succeeded;
full build completion remains blocked by missing application database configuration
in the isolated worktree. No real login or Salesforce sandbox integration was tested.

## Implementation language

Use **TypeScript for the real importer**, extending `src/lib/bps-preview.ts` and
the existing Next.js admin API. This keeps authentication, validation, Salesforce
integration, and deployment in the application's current stack, without a Python
runtime or subprocess in the upload route. The Python code in `scripts/bps_import/`
is a frozen historical demonstration of in-memory upserts and aggregates, not a
second production importer. Its older text-only ID rule is superseded by the
TypeScript policy below. Port any approved aggregation/upsert behavior into tested
TypeScript modules before implementing sandbox writes.

## Source workbooks and current limits

Seven source workbooks have been supplied: MCAS, Attendance, ElemGrades,
SecGrades, Suspensions, Tardiness, and Demo. The user described year tabs for
2017–2018, 2018–2019, and 2019–2020. The MCAS filename ends in SY18_19 and the
Demo filename ends in SY20_21, so exact tab coverage needs confirmation.

These password-protected files have not been decrypted or read for this work.
No real column names, scales, or row granularity are claimed here. The mock
preview accepts only the documented synthetic layout, not these seven files.
Production mappings require approved headers and a data dictionary. Sandbox
availability is necessary for integration testing but does not replace privacy
or column approval.

## Salesforce discovery

Earlier metadata-only inspection found two candidate student ID fields:

| Object | Field | Type | Unique / External ID |
| --- | --- | --- | --- |
| `Contact` | `Student_ID__c` | Text, length 64 | Both false |
| `Household_Composition_Youth__c` | `Student_ID__c` | Text, length 25 | Both false |

Contact also has school and student-grade fields; the youth object references
an intake form. This makes Contact a plausible primary student object, but BHG
must confirm which is authoritative and that the field holds the BPS identifier.
No student records were queried during metadata inspection. Field names/types
cannot establish actual ID format or whether records have duplicate IDs.

## Spreadsheet columns → proposed Salesforce fields

This is an explicit mapping for the implemented synthetic workbook. Destination
academic fields and object are proposals, not verified/deployed Salesforce schema.

| Mock Excel column | Destination | Rule |
| --- | --- | --- |
| `student_id` | Match `Contact.Student_ID__c` (candidate); use resolved Contact ID in proposed result `Student__c` lookup | Normalize text or valid whole-number cells to text; retain text zeros; require exactly one match |
| `period` | Proposed academic result `Period__c` | Required; mock accepts `2025-fall`, `2026-spring` |
| `math_grade` | Proposed academic result `Math_Grade__c` | Optional selected value; mock numeric range 0–100 |
| `attendance_pct` | Proposed academic result `Attendance_Pct__c` | Optional selected value; mock numeric range 0–100 |
| Other columns | Not imported | Excluded from payloads and responses |

Both metric headers are required in this preview, but one value may be blank.
At least one valid metric must be present on each row. Blank is not zero and
must not erase a prior result. Zero is valid. Formulas, Excel errors, booleans,
numeric-looking text in metric cells, out-of-range metric values, and unsupported
periods are errors. Digit-only text is valid for student IDs.

For the real multi-workbook import, preserve academic history in related result
records rather than repeatedly overwriting fields on Contact. Proposed dimensions
are student lookup, school year, term, subject/course/assessment, metric, value,
and unit/scale. The stable unique key must include all dimensions needed to
distinguish legitimate observations. This design needs sandbox schema review.

| Source category | Decisions required before a real mapping |
| --- | --- |
| MCAS | Subject, grade level, test/version, score scale, participation codes |
| Elementary / secondary grades | Course/subject, rubric or letter/numeric scale, term, grading period |
| Attendance | Days present, membership denominator, rate units, reporting window |
| Tardiness / absence | Counts versus days/minutes, excused/unexcused definitions, overlap with attendance |
| Suspensions | Event versus annual total, days versus count, in-school/out-of-school |
| Demo | Meaning of file, approved cohort attributes, year coverage; do not assume every demographic column is needed |

No 0–100 rule should be carried over to MCAS, suspension counts, or other metrics
without confirming their definitions. The actual seven-workbook column map is
pending approved headers; we will not invent it from filenames.

## ID matching, duplicates, unmatched IDs, and retries

1. Validate workbook structure and selected columns before preparing writes.
2. Normalize IDs to text. Accept nonnegative whole-number cells up to 15 digits,
   converting the stored value to a decimal string. Reject fractions, negatives,
   non-finite/unsafe numbers, and numeric cells longer than 15 digits. Trim text
   IDs without parsing or removing zeros. Thus numeric `1001` and text `"1001"`
   share a match/duplicate key, but text `"001001"` remains distinct. Never infer
   digits from Excel display formats, pad an ID, or recover rounded/truncated data.
   Numeric IDs are not intrinsically invalid; their interpretation still needs
   BHG's confirmation if the source identifier has a fixed width or leading zeros.
   Excel has [15 digits of numeric precision](https://support.microsoft.com/en-us/excel/keeping-leading-zeros-and-large-numbers);
   longer identifiers must arrive as text from the authoritative source.
3. Match exactly against the authoritative Salesforce ID field. Never fuzzy-match
   names or automatically create students for unmatched IDs.
4. Zero matches: skip and count as unmatched. More than one match: skip and count
   as an ambiguous-ID error. BHG resolves these in a restricted exception workflow.
5. Duplicate student/period keys in the mock: exclude all occurrences. The same
   student across different periods is valid. Real imports will add subject,
   course, assessment, or event dimensions where needed; repeated student IDs
   alone do not imply duplicate academic observations.
6. Later, upsert result records by an approved unique result key, updating corrected
   selected values without duplicating results. Store job status and per-record
   errors privately and retry only failed records. The preview currently performs
   no writes, and the Python mock only models this behavior in memory.

## Aggregate calculation

Define cohorts from approved program participation and housing dates, not from
the workbook year alone. Define baseline/follow-up windows and a suitable
comparison group; resolve overlapping housed/afterschool participation explicitly.
For each comparable metric, use the same students with valid observations before
and after, compute their mean change, and compare with the comparison group's
mean change. Missing observations are excluded, not replaced with zero.

Attendance differences are percentage points when using percentage rates.
MCAS results require consistent subject, assessment/version, grade-level rules,
and scale. Graduation requires eligibility and follow-up definitions. Report
descriptive associations, not causal claims. School closures or other changes
to reporting coverage must be considered when interpreting 2019–2020 results.

The Python demo uses a provisional minimum group size of five; BHG must approve
the actual disclosure policy and align it with public-dashboard requirements.
Suppress small counts and associated statistics, check complementary/overlapping
groups and repeated filter releases, and generate all public summaries on the
server. The admin preview's operational row counts are not public impact figures.

## Questions for BHG

1. Which outcomes are priorities: MCAS, graduation, grades, attendance, tardiness,
   absences, suspensions, or another measure? What definitions/scales apply?
2. Which exact columns in each workbook are approved? Can BHG provide a header-only
   template and a data dictionary, including missing-value and special-value codes?
3. What school years/tabs are present, especially for MCAS and Demo? What does one
   row represent in each file, and are there multiple subjects, terms or events?
4. Is `Contact.Student_ID__c` the authoritative BPS key, or should we use the youth
   intake object? How should missing IDs, duplicate matches, and leading zeros be resolved?
5. Should academic results live in a new related Salesforce object, an existing
   object, or only in a restricted reporting store? Who will provision the sandbox
   and approve the schema and least-privilege integration access?
6. What privacy/data-sharing terms apply? Which BHG and JumboCode roles may see
   raw files, student-level Salesforce records, upload errors, or exports?
7. Where may files be processed and stored, how long may they be retained, and
   what deletion/audit procedures are required? Is any decryption authorized yet?
8. Which program/housing dates define exposure, baseline/follow-up windows and
   comparison eligibility? How should students in both cohorts be handled?
9. What minimum group size and suppression policy should apply across charts,
   downloads and filters? What missing-data coverage may be reported?

## Next gate

Continue with synthetic inputs until privacy terms and selected columns are
confirmed. Use Brandy's sandbox for the first approved integration test. The next
production step is an agreed source/header map and sandbox result schema, not
uploading the supplied real files into this preview.
