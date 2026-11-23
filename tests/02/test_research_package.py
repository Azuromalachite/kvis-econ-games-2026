"""Durable integrity/reproduction checks for the retained wage-food package; stdlib only."""
import contextlib
import csv
import importlib.util
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / "research/02/packages/2026-11-23-wage-food"
spec = importlib.util.spec_from_file_location("wage_package", PACKAGE / "run.py")
harness = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harness)


class RetainedPackageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config, cls.model = harness.config_and_model()

    def test_retained_files_and_denominators_verify(self):
        with contextlib.redirect_stdout(io.StringIO()):
            record = harness.verify()
        self.assertEqual(record["unique_input_draws"], 1000)
        self.assertEqual(record["case_evaluations"], 3000)

    def test_fresh_outputs_reproduce_and_cannot_be_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "new"
            with contextlib.redirect_stdout(io.StringIO()):
                harness.reproduce(output)
            for name in ("draws.csv", "summary.json"):
                self.assertEqual((output / name).read_bytes(), (PACKAGE / name).read_bytes())
            with self.assertRaisesRegex(ValueError, "must be empty"):
                harness.reproduce(output)

    def test_truncated_draw_table_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            shutil.copy2(PACKAGE / "summary.json", output / "summary.json")
            lines = (PACKAGE / "draws.csv").read_text(encoding="utf-8").splitlines()
            (output / "draws.csv").write_text("\n".join(lines[:-1]) + "\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "row count"):
                harness.check_outputs(output, self.config, self.model)

    def test_changed_retained_outcome_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            shutil.copy2(PACKAGE / "summary.json", output / "summary.json")
            with (PACKAGE / "draws.csv").open(encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                fields = reader.fieldnames
                rows = list(reader)
            rows[0]["hired_dfood_kcal"] = str(float(rows[0]["hired_dfood_kcal"]) + 1)
            with (output / "draws.csv").open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
                writer.writeheader()
                writer.writerows(rows)
            with self.assertRaisesRegex(ValueError, "outcome does not match"):
                harness.check_outputs(output, self.config, self.model)

    def _model_copy(self, root, mutate):
        source = ROOT / self.config["model"]["path"]
        target = root / self.config["model"]["path"]
        target.parent.mkdir(parents=True)
        data = source.read_bytes()
        self.assertIn(b"MITA_WAGE = 20.0", data)
        target.write_bytes(data.replace(b"MITA_WAGE = 20.0", b"MITA_WAGE = 21.0") if mutate else data)

    def test_unchanged_model_byte_copy_is_accepted(self):
        # Control for the mutation below: a byte-for-byte copy must pass, so a
        # failure there is caused by the mutation, not by the copy (e.g. CRLF).
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._model_copy(root, mutate=False)
            with patch.object(harness, "ROOT", root):
                config, model = harness.config_and_model()
            self.assertEqual(model.MITA_WAGE, 20.0)

    def test_changed_model_is_rejected_before_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self._model_copy(root, mutate=True)
            with patch.object(harness, "ROOT", root):
                with self.assertRaisesRegex(ValueError, "model checksum mismatch"):
                    harness.config_and_model()

    def test_wrong_manifest_counts_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            for name in ("config.json", "summary.json", "draws.csv"):
                shutil.copy2(PACKAGE / name, output / name)
            record = harness.read_json(PACKAGE / "manifest.json")
            record["counts_by_case"]["hired"]["excluded"] = 1
            (output / "manifest.json").write_text(harness.json_text(record), encoding="utf-8")
            with patch.object(harness, "PACKAGE", output):
                with self.assertRaisesRegex(ValueError, "run counts mismatch"):
                    harness.verify()

    def test_missing_failed_prediction_counterevidence_is_rejected(self):
        record = harness.read_json(PACKAGE / "manifest.json")
        predictions = record["lifecycle"]["prior_predictions"]["predictions"]
        self.assertEqual([p["id"] for p in predictions], ["P1", "P2", "P3", "P4"])
        self.assertEqual([p["met_prediction"] for p in predictions], [True, False, True, False])
        self.assertNotEqual(predictions[1]["reason"], predictions[3]["reason"])
        predictions[1].pop("counterevidence")
        with self.assertRaisesRegex(ValueError, "prediction records"):
            harness.check_lifecycle(record, self.config)

    def test_inventory_holds_only_package_members_and_model(self):
        # Living repository files (LICENSE.md, pre-registrations, results, notes,
        # tests) must never be hashed in the working tree.
        record = harness.read_json(PACKAGE / "manifest.json")
        paths = {item["path"] for item in record["files"]}
        expected = {self.config["model"]["path"],
                    *(harness.PREFIX + "/" + name for name in self.config["package_members"])}
        self.assertEqual(paths, expected)
        self.assertEqual(record["files"], harness.inventory())

    def test_context_blob_mismatch_is_rejected_when_git_is_available(self):
        status = harness.check_context(self.config)
        if not status.startswith("PASS"):
            self.skipTest(status)
        config = json.loads(json.dumps(self.config))
        config["context_documents"][0]["git_blob"] = "0" * 40
        with self.assertRaisesRegex(ValueError, "differs from its recorded Git blob"):
            harness.check_context(config)

    def test_citation_core_structure(self):
        # Project-level structural checks, not a general CFF validator.
        citation = harness.read_json(PACKAGE / "CITATION.cff")
        self.assertEqual(citation["cff-version"], "1.2.0")
        self.assertEqual(citation["type"], "dataset")
        self.assertEqual(citation["version"], self.config["version"])
        self.assertEqual(citation["license"], self.config["license"])
        self.assertTrue(citation["authors"])


if __name__ == "__main__":
    unittest.main()
