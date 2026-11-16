import contextlib
import copy
import io
import json
import unittest
from unittest.mock import patch

from importer import (
    FIXTURES, METRICS, MockSalesforce, ImportValidationError,
    aggregate, import_rows, normalize_id, read_rows, run_demo,
)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.store = MockSalesforce(json.loads((FIXTURES / "students.json").read_text()))
        self.rows = read_rows(FIXTURES / "mock-bps.xlsx", METRICS)

    def test_end_to_end_and_repeat(self):
        counts = import_rows(self.rows, self.store)
        self.assertEqual(counts, dict(inserted=36, updated=0, unchanged=0,
                                      invalid=1, unmatched=1, ambiguous=1, duplicate=2))
        repeated = import_rows(self.rows, self.store)
        self.assertEqual(repeated["inserted"], 0)
        self.assertEqual(repeated["unchanged"], 36)
        self.assertEqual(len(self.store.observations), 36)

    def test_aggregate_math(self):
        import_rows(self.rows, self.store)
        results = aggregate(self.store)["metrics"]
        self.assertEqual(results["math_grade"]["afterschool"], {
            "suppressed": False, "paired_students": 6, "before_mean": 72.5,
            "after_mean": 80.5, "mean_change": 8.0, "change_minus_comparison": 5.0,
        })
        self.assertEqual(results["math_grade"]["housed"]["change_minus_comparison"], 3)
        self.assertEqual(results["attendance_pct"]["afterschool"]["change_minus_comparison"], 4)

    def test_allowlist(self):
        rows = read_rows(FIXTURES / "mock-bps.xlsx", ["math_grade"])
        self.assertEqual(set(rows[0]), {"student_id", "period", "math_grade"})
        import_rows(rows, self.store, ["math_grade"])
        for value in self.store.observations.values():
            self.assertEqual(set(value), {"Student__c", "Period__c", "Math_Grade__c"})
        with self.assertRaises(ImportValidationError):
            import_rows(rows, self.store, ["ignored_note"])

    def test_update_preserves_other_metrics_and_blanks(self):
        import_rows(self.rows, self.store)
        changed = {**self.rows[0], "math_grade": 0, "attendance_pct": None}
        self.assertEqual(import_rows([changed], self.store)["updated"], 1)
        saved = self.store.observations[("mock-sf-1", "2025-fall")]
        self.assertEqual(saved["Math_Grade__c"], 0)
        self.assertEqual(saved["Attendance_Pct__c"], 85)

    def test_invalid_numeric_values_do_not_write(self):
        for value in (-1, 101, float("nan"), float("inf"), True, "80", "=1+1"):
            with self.subTest(value=value):
                row = {**self.rows[0], "math_grade": value}
                self.assertEqual(import_rows([row], self.store)["invalid"], 1)
                self.assertEqual(self.store.observations, {})

    def test_ids_preserve_zeros_and_reject_real_or_numeric(self):
        self.assertEqual(normalize_id(" MOCK-0001 "), "MOCK-0001")
        for value in (1234, "1234", "Jane Doe", None):
            with self.assertRaises(ImportValidationError):
                normalize_id(value)

    def test_duplicate_batch_never_overwrites_existing(self):
        import_rows([self.rows[0]], self.store)
        original = copy.deepcopy(self.store.observations)
        counts = import_rows([self.rows[0], {**self.rows[0], "math_grade": 90}], self.store)
        self.assertEqual(counts["duplicate"], 2)
        self.assertEqual(self.store.observations, original)

    def test_periods_and_missing_values(self):
        counts = import_rows([{**self.rows[0], "period": "unknown"},
                              {**self.rows[0], "math_grade": None, "attendance_pct": None}], self.store)
        self.assertEqual(counts["invalid"], 2)
        self.assertFalse(self.store.observations)

    def test_only_paired_students_and_threshold(self):
        import_rows(self.rows, self.store)
        # One missing follow-up leaves five eligible students, still publishable.
        del self.store.observations[("mock-sf-1", "2026-spring")]
        group = aggregate(self.store)["metrics"]["math_grade"]["afterschool"]
        self.assertEqual(group["paired_students"], 5)
        self.assertEqual(group["before_mean"], 73)
        # Four pairs: no means, count, or comparison difference may escape.
        del self.store.observations[("mock-sf-2", "2026-spring")]
        self.assertEqual(aggregate(self.store)["metrics"]["math_grade"]["afterschool"],
                         {"suppressed": True})

    def test_suppressed_comparison_hides_difference(self):
        import_rows(self.rows, self.store)
        for i in (13, 14):
            del self.store.observations[(f"mock-sf-{i}", "2026-spring")]
        groups = aggregate(self.store)["metrics"]["math_grade"]
        self.assertEqual(groups["comparison"], {"suppressed": True})
        self.assertNotIn("change_minus_comparison", groups["afterschool"])

    def test_public_boundary_and_no_logging(self):
        capture = io.StringIO()
        with contextlib.redirect_stdout(capture), contextlib.redirect_stderr(capture):
            result = run_demo()
        self.assertEqual(capture.getvalue(), "")
        serialized = json.dumps(result)
        for sensitive in ("MOCK-", "mock-sf-", "Student__c", "ignored_note", "unmatched"):
            self.assertNotIn(sensitive, serialized)

    def test_checksum_gate(self):
        with patch("importer.hashlib.sha256") as digest:
            digest.return_value.hexdigest.return_value = "different"
            with self.assertRaises(ImportValidationError):
                run_demo()

    def test_formula_rejected_and_workbook_closed(self):
        from types import SimpleNamespace
        from unittest.mock import MagicMock
        book = MagicMock()
        book.sheetnames = ["Mock BPS"]
        headers = [SimpleNamespace(value=x) for x in ("student_id", "period", "math_grade")]
        cells = [SimpleNamespace(value=x, data_type=t) for x, t in
                 [("MOCK-0001", "s"), ("2025-fall", "s"), ("=70+1", "f")]]
        book.active.iter_rows.return_value = iter([headers, cells])
        with patch("importer.load_workbook", return_value=book):
            with self.assertRaises(ImportValidationError):
                read_rows("unused", ["math_grade"])
        book.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
