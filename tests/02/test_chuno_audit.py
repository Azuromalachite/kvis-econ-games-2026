"""The chuño energy audit must be reproducible from its own inputs, and must be able to fail.

evidence/chuno-energy-audit-2026-11-18.json records inputs and derived values from one thesis. This test recomputes
every derived value, checks the composition checks it declares, and confirms (by planting wrong values) that a
perturbed number or an inconsistent row would be caught.

Run: python3 -m unittest discover -s tests/02
"""

import copy
import json
import math
import unittest
from pathlib import Path

AUDIT = Path(__file__).resolve().parents[2] / "research" / "02" / "evidence" / "chuno-energy-audit-2026-11-18.json"


def recompute(row):
    """Derived values from a row's inputs, by the formulae the audit declares."""
    y = row["product_kg"] / row["input_kg"]
    out = {
        "product_mass_yield": y,
        "product_kcal_per_kg_input": y * row["product_kcal_per_100g"] * 10,
        "solids_recovery_ratio": y * (1 - row["product_water_fraction"]) / (1 - row["input_water_fraction"]),
        "product_kcal_per_g_dry_matter": row["product_kcal_per_100g"] / ((1 - row["product_water_fraction"]) * 100),
    }
    comp = row.get("composition")
    if comp:
        f, c = comp["fresh"], comp["chuno"]
        out["fresh_kcal_per_g_dry_matter"] = f["kcal_per_100g"] / (100 - f["water_pct"])
        out["fresh_components_sum_pct"] = f["water_pct"] + f["carbohydrate_pct"] + f["protein_pct"]
        out["chuno_components_sum_pct"] = c["water_pct"] + c["carbohydrate_pct"] + c["protein_pct"]
        out["energy_retention"] = out["product_kcal_per_kg_input"] / (f["kcal_per_100g"] * 10)
    return out


def problems(audit):
    """Every disagreement between the audit and a recomputation, and every row that fails a check without being excluded."""
    errs = []
    checks = audit["checks"]
    lo, hi = checks["kcal_per_g_dry_matter"]["min"], checks["kcal_per_g_dry_matter"]["max"]
    smax = checks["components_sum_pct"]["max"]
    for row in audit["rows"]:
        v = row["variety"]
        mine = recompute(row)
        for k, val in mine.items():
            if k not in row["derived"]:
                errs.append(f"{v}: derived {k} missing")
            elif not math.isclose(row["derived"][k], val, rel_tol=1e-9, abs_tol=1e-12):
                errs.append(f"{v}: derived {k} is {row['derived'][k]}, recomputed {val}")
        failing = []
        for k in ("product_kcal_per_g_dry_matter", "fresh_kcal_per_g_dry_matter"):
            if k in mine and not lo <= mine[k] <= hi:
                failing.append(k)
        for k in ("fresh_components_sum_pct", "chuno_components_sum_pct"):
            if k in mine and mine[k] > smax:
                failing.append(k)
        if mine["solids_recovery_ratio"] > 1:
            failing.append("solids_recovery_ratio")
        if failing and row["flag"] != "excluded_internal_inconsistency":
            errs.append(f"{v}: fails {failing} but is not excluded")
    return errs


class ChunoAudit(unittest.TestCase):
    def setUp(self):
        self.audit = json.loads(AUDIT.read_text(encoding="utf-8"))

    def test_audit_reproduces_and_flags_correctly(self):
        self.assertEqual(problems(self.audit), [])

    def test_lukis_row_fails_both_composition_checks(self):
        luki = next(r for r in self.audit["rows"] if r["variety"] == "Luk'i")
        d = recompute(luki)
        self.assertGreater(d["fresh_kcal_per_g_dry_matter"], self.audit["checks"]["kcal_per_g_dry_matter"]["max"])
        self.assertGreater(d["fresh_components_sum_pct"], self.audit["checks"]["components_sum_pct"]["max"])
        self.assertGreater(d["chuno_components_sum_pct"], self.audit["checks"]["components_sum_pct"]["max"])
        self.assertEqual(luki["flag"], "excluded_internal_inconsistency")

    def test_a_perturbed_derived_value_is_caught(self):
        bad = copy.deepcopy(self.audit)
        bad["rows"][0]["derived"]["product_kcal_per_kg_input"] *= 1.01
        self.assertTrue(any("product_kcal_per_kg_input" in e for e in problems(bad)))

    def test_an_inconsistent_row_left_in_is_caught(self):
        bad = copy.deepcopy(self.audit)
        next(r for r in bad["rows"] if r["variety"] == "Luk'i")["flag"] = "provisional_original_annexes_not_verified"
        self.assertTrue(any("not excluded" in e for e in problems(bad)))


if __name__ == "__main__":
    unittest.main()
