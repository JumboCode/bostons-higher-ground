# Mock BPS importer

Offline prototype for the BPS import ticket. It uses only the bundled synthetic
Excel workbook and mock student directory. No Salesforce credentials, network,
application database, or web route is used.

From the repository root, with Python 3.9 or newer:

```sh
python3 -m venv scripts/bps_import/.venv
scripts/bps_import/.venv/bin/python -m pip install -r scripts/bps_import/requirements.txt
scripts/bps_import/.venv/bin/python scripts/bps_import/importer.py
scripts/bps_import/.venv/bin/python -m unittest discover -s scripts/bps_import -v
```

The CLI has no file arguments and verifies fixture checksums before importing.
It imports the workbook twice into an in-memory mock Salesforce store to check
repeat-import behavior, then prints aggregate JSON. Each process starts fresh.
There is no live Salesforce adapter or persistent student-level output.

The fixture includes 18 paired students in three disjoint cohorts of six, plus
an unmatched ID, an ambiguous ID, two conflicting duplicate rows, and an invalid
grade. IDs are synthetic text with a `MOCK-` prefix. The `ignored_note` column
demonstrates that unapproved columns never enter the import payload.

Expected grade changes: afterschool +8, housed +6, comparison +3 points.
Expected differences versus comparison: +5 and +3 points. Attendance changes
are +6, +4, and +2 percentage points. These are invented demonstration values.

See [the local import plan](../../docs/bps-import-plan.md) for proposed mappings,
matching rules, aggregation assumptions, and requirements before using real data.
The tests exercise the import and aggregate boundaries; they do not certify
privacy of the existing application's dashboards.
