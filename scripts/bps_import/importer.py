"""Offline BPS import prototype. No Salesforce or application database writes."""

import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from statistics import mean

from openpyxl import load_workbook


FIXTURES = Path(__file__).parent / "fixtures"
METRICS = {"math_grade": "Math_Grade__c", "attendance_pct": "Attendance_Pct__c"}
PERIODS = ("2025-fall", "2026-spring")
GROUPS = ("afterschool", "housed", "comparison")
MIN_GROUP_SIZE = 5  # Demonstration policy only; requires client approval.


class ImportValidationError(ValueError):
    """Messages intentionally contain no cell contents or student identifiers."""


def normalize_id(value):
    # Reject numeric cells: their original leading zeros cannot be recovered.
    if not isinstance(value, str):
        raise ImportValidationError("Student ID must be synthetic text.")
    value = value.strip()
    if not re.fullmatch(r"MOCK-\d{4}", value):
        raise ImportValidationError("Only synthetic student IDs are supported.")
    return value


def select_metrics(metrics):
    metrics = tuple(metrics)
    if not metrics or len(set(metrics)) != len(metrics) or any(m not in METRICS for m in metrics):
        raise ImportValidationError("Select unique metrics from the approved mock allowlist.")
    return metrics


def read_rows(path, metrics):
    metrics = select_metrics(metrics)
    workbook = load_workbook(path, read_only=True, data_only=False, keep_links=False)
    try:
        if workbook.sheetnames != ["Mock BPS"]:
            raise ImportValidationError("Expected the Mock BPS worksheet.")
        rows = workbook.active.iter_rows()
        header = next(rows, ())
        names = [cell.value for cell in header]
        if len(set(names)) != len(names):
            raise ImportValidationError("Duplicate column headers.")
        required = ("student_id", "period", *metrics)
        if any(name not in names for name in required):
            raise ImportValidationError("Missing required columns.")
        indexes = {name: names.index(name) for name in required}
        selected = []
        for row in rows:
            if all(cell.value is None for cell in row):
                continue
            # Unselected values never enter the import payload.
            if any(row[index].data_type in ("f", "e") for index in indexes.values()):
                raise ImportValidationError("Selected cells cannot contain formulas or Excel errors.")
            selected.append({name: row[index].value for name, index in indexes.items()})
        return selected
    finally:
        workbook.close()


class MockSalesforce:
    """Fake student directory and upsert target, held only in process memory.

    Field names are proposed placeholders, not discovered Salesforce metadata.
    """

    def __init__(self, students):
        self.students = defaultdict(list)
        self.observations = {}
        seen_record_ids = set()
        for student in students:
            sid = normalize_id(student["student_id"])
            record_id = student["record_id"]
            if not isinstance(record_id, str) or not record_id.startswith("mock-sf-"):
                raise ImportValidationError("Only mock Salesforce records are supported.")
            if record_id in seen_record_ids or student["cohort"] not in GROUPS:
                raise ImportValidationError("Invalid mock student directory.")
            seen_record_ids.add(record_id)
            self.students[sid].append(dict(student))


def import_rows(rows, store, metrics=tuple(METRICS)):
    """Validate a batch before applying it. Quarantine ambiguous source keys.

    Return counts only. An invalid row is skipped as a whole. All occurrences
    of a duplicate student/period key are skipped, avoiding last-row-wins.
    """
    metrics = select_metrics(metrics)
    counts = Counter({name: 0 for name in (
        "inserted", "updated", "unchanged", "invalid", "unmatched", "ambiguous", "duplicate"
    )})
    normalized = []
    for row in rows:
        try:
            sid = normalize_id(row.get("student_id"))
            period = row.get("period")
            if period not in PERIODS:
                raise ImportValidationError("Unknown reporting period.")
            normalized.append((sid, period, row))
        except ImportValidationError:
            counts["invalid"] += 1
    frequencies = Counter((sid, period) for sid, period, _ in normalized)
    staged = {}
    for sid, period, row in normalized:
        if frequencies[sid, period] > 1:
            counts["duplicate"] += 1
            continue
        matches = store.students.get(sid, [])
        if len(matches) != 1:
            counts["unmatched" if not matches else "ambiguous"] += 1
            continue
        values = {}
        invalid = False
        for metric in metrics:
            value = row.get(metric)
            if value is None or value == "":
                continue  # Missing is not zero and does not erase prior data.
            if type(value) not in (int, float) or not math.isfinite(value) or not 0 <= value <= 100:
                invalid = True
                break
            values[METRICS[metric]] = float(value)
        if invalid or not values:
            counts["invalid"] += 1
            continue
        record_id = matches[0]["record_id"]
        key = (record_id, period)
        previous = store.observations.get(key)
        payload = {**(previous or {}), "Student__c": record_id, "Period__c": period, **values}
        outcome = "inserted" if previous is None else "unchanged" if previous == payload else "updated"
        counts[outcome] += 1
        staged[key] = payload
    store.observations.update(staged)
    return dict(counts)


def aggregate(store, metrics=tuple(METRICS)):
    """Fixed, disjoint mock cohorts. Only matched before/after pairs count.

    No student-level payload or small-group count crosses this boundary.
    No total or overlapping subgroup is published that could reveal a
    suppressed group's values by subtraction.
    """
    metrics = select_metrics(metrics)
    results = {}
    for metric in metrics:
        field = METRICS[metric]
        groups = {}
        for cohort in GROUPS:
            pairs = []
            for matches in store.students.values():
                if len(matches) != 1 or matches[0]["cohort"] != cohort:
                    continue
                rid = matches[0]["record_id"]
                before = store.observations.get((rid, PERIODS[0]), {}).get(field)
                after = store.observations.get((rid, PERIODS[1]), {}).get(field)
                if before is not None and after is not None:
                    pairs.append((before, after))
            if len(pairs) < MIN_GROUP_SIZE:
                groups[cohort] = {"suppressed": True}
            else:
                groups[cohort] = {
                    "suppressed": False,
                    "paired_students": len(pairs),
                    "before_mean": round(mean(p[0] for p in pairs), 2),
                    "after_mean": round(mean(p[1] for p in pairs), 2),
                    "mean_change": round(mean(p[1] - p[0] for p in pairs), 2),
                }
        comparison = groups["comparison"]
        for cohort in ("afterschool", "housed"):
            group = groups[cohort]
            if not group["suppressed"] and not comparison["suppressed"]:
                group["change_minus_comparison"] = round(group["mean_change"] - comparison["mean_change"], 2)
        results[metric] = groups
    return {"synthetic_only": True, "periods": PERIODS, "metrics": results}


def run_demo():
    # The CLI accepts no external files. Verify bundled fixtures before reading.
    manifest = json.loads((FIXTURES / "manifest.json").read_text())
    for name in ("mock-bps.xlsx", "students.json"):
        if hashlib.sha256((FIXTURES / name).read_bytes()).hexdigest() != manifest[name]:
            raise ImportValidationError("Mock fixture checksum mismatch.")
    store = MockSalesforce(json.loads((FIXTURES / "students.json").read_text()))
    rows = read_rows(FIXTURES / "mock-bps.xlsx", METRICS)
    first = import_rows(rows, store)
    second = import_rows(rows, store)
    if first["inserted"] != 36 or second["inserted"] != 0 or second["unchanged"] != 36:
        raise ImportValidationError("Mock repeat-import verification failed.")
    # Operational rejection counts stay private in memory. Public output is
    # restricted to fixed aggregate results, never raw rows or identifiers.
    return aggregate(store)


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 1:
        sys.exit("This demo only supports its bundled synthetic fixtures.")
    try:
        print(json.dumps(run_demo(), indent=2))
    except Exception:
        sys.exit("Mock import failed. Run the local tests for diagnostics.")
