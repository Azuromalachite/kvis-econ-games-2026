"""Research experiment 2b: experiment 2 re-run with Bakewell's documented 1603 food purchasing power.

Pre-registration: research/02/pre-registrations/2026-11-19-wage-food-breakeven.md (experiment 2b, PR #40) and its
execution addendum research/02/pre-registrations/2026-11-19-wage-food-2b-execution.md (merged in #44 before this file
existed). Inputs: research/02/evidence/bakewell-purchasing-power-1603.json. Pure Python, deterministic.

    python3 research/02/models/exp2b_bakewell_prices.py       # prints the results as JSON

Experiment 2's model is imported unchanged. Its exact Latin-hypercube draws are generated with its own routine and
seed (all six columns, so the random sequence is untouched); only then is each draw's kcal_per_real replaced by the
documented fixed value for one food and one wage row: kcal_per_real = printed kcal per day x 7 / weekly wage (reales).
Foods are never summed; oca and chuno have no printed calorie values and are left out.
"""

import json
import pathlib
import statistics
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import exp2_wage_budget as e2  # noqa: E402  (the frozen experiment-2 model, imported, never edited)

CASES = ("mita", "hired", "mixed")
PRIMARY_ROW, FOODS = "mine_worker", ("potatoes", "maize", "charqui")
# experiment 2's published shares (research/02/results/2026-11-19-wage-food-breakeven.md): the draws must reproduce them
EXP2_SHARES = {"mita": 0.0, "hired": 0.034, "mixed": 0.0}


def band(share):
    return "under 10%" if share < 0.10 else "10% to under 50%" if share < 0.50 else "at least 50%"


def summarize(draws, case):
    vals = [e2.dfood(case, p) for p in draws]
    q = statistics.quantiles(vals, n=20)
    share = sum(v > 0 for v in vals) / len(vals)
    return {"share_food_rises": round(share, 3), "band": band(share),
            "dfood_kcal_p5_median_p95": [round(q[0]), round(statistics.median(vals)), round(q[18])]}


def main():
    data = json.loads((ROOT / "evidence" / "bakewell-purchasing-power-1603.json").read_text(encoding="utf-8"))
    cal = data["calendar"]
    assert cal["earning_days_per_week"] == 5 and cal["consumption_days_per_week"] == 7, "calendar units changed"
    rows = {r["occupation"]: r for r in data["daily_energy_purchasing_power"]["rows"]}

    # 1. the exact experiment-2 draw array, checked against experiment 2's published shares
    draws = e2.lhs(e2.N_DRAWS, e2.SEED)
    for case, share in EXP2_SHARES.items():
        got = summarize(draws, case)["share_food_rises"]
        assert got == share, f"draws do not reproduce experiment 2 ({case}: {got} vs {share}); stop"
    before = json.dumps(draws)

    def with_price(kpr):
        return [{**p, "kcal_per_real": kpr} for p in draws]  # copies: the original array is never mutated

    out = {"inputs": "research/02/evidence/bakewell-purchasing-power-1603.json (Bakewell 1984, p. 104 daily energy table)",
           "draws": e2.N_DRAWS, "seed": e2.SEED, "experiment2_reproduced": EXP2_SHARES,
           "kcal_per_real_original_range": list(e2.RANGES["kcal_per_real"]), "confirmatory": {}, "rounding_checks": {}}

    # 2. primary: mine-worker row, each food separately
    for food in FOODS:
        r = rows[PRIMARY_ROW]
        kpr = r[food] * 7 / r["weekly_wage_reales"]
        d = with_price(kpr)
        res = {"kcal_per_real": round(kpr, 1)}
        for case in CASES:
            res[case] = summarize(d, case)
        out["confirmatory"][food] = res

    # 3. break-even at the midpoints of the other ranges: the price where dfood = 0 (independent of the food price)
    mid = {k: (lo + hi) / 2 for k, (lo, hi) in e2.RANGES.items()}
    out["break_even_kcal_per_real_at_midpoints"] = {
        case: (None if (b := e2.break_even_price(case, mid)) is None else round(b, 1)) for case in CASES}

    # 4. declared rounding checks: the other wage rows at the same underlying prices
    for occ in ("freighter", "refinery_worker"):
        r = rows[occ]
        out["rounding_checks"][occ] = {}
        for food in FOODS:
            kpr = r[food] * 7 / r["weekly_wage_reales"]
            out["rounding_checks"][occ][food] = {"kcal_per_real": round(kpr, 1),
                                                 "hired_share": summarize(with_price(kpr), "hired")["share_food_rises"]}

    # 5. the prediction (PR #40): the hired-work verdict band does not change (under 10% in experiment 2)
    exp2_band = band(EXP2_SHARES["hired"])
    out["prediction_band_unchanged"] = {food: out["confirmatory"][food]["hired"]["band"] == exp2_band for food in FOODS}
    out["rounding_checks_change_band"] = {occ: {f: band(v["hired_share"]) != out["confirmatory"][f]["hired"]["band"]
                                                for f, v in fs.items()} for occ, fs in out["rounding_checks"].items()}
    assert json.dumps(draws) == before, "the original draw array was mutated"
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
