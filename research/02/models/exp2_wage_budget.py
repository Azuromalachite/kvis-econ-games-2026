"""Research experiment 2: when does work at Potosí raise a household's food?

Pre-registration: research/02/pre-registrations/2026-11-19-wage-food-breakeven.md (frozen and merged before this file
existed). One household, one adult worker, one 26-week season. Pure Python, deterministic.

    python3 research/02/models/exp2_wage_budget.py            # prints the results as JSON

Household food change over the season, in kcal:
    dfood = cash_net * kcal_per_real + ration_saved - farm_forgone
    cash_net = wage_per_week * weeks_paid - cost_per_week * 26      (reales; negative = food given up to cover costs)
"""

import json
import random
import statistics

SEASON_WEEKS = 26
MITA_WAGE = 20.0  # reales per week (Bakewell; 26 x 20 / 8 = 65 pesos, the Godoy wage)
REALES_PER_PESO = 8  # an inference from the figures (processing spec), not Bakewell's statement

# Ranges fixed in the pre-registration. "judgement" ranges have no source in the repository.
RANGES = {
    "weeks_paid": (18.0, 26.0),             # judgement
    "hired_wage": (56.0, 72.0),             # Bakewell pp. 124-125, reales per (five-day) week
    "cost_per_week": (46.0, 77.0),          # Godoy 1608: 200 pesos 1 real / 26 weeks = 61.6 reales a week, +/- 25%
    "kcal_per_real": (300.0, 650.0),        # judgement around the Godoy-implied price
    "ration_kcal_per_day": (2000.0, 3000.0),  # judgement
    "farm_forgone_kcal": (0.5e6, 1.0e6),    # judgement
}
N_DRAWS, SEED = 1000, 20261119


def wage_for(case, hired_wage):
    if case == "mita":
        return MITA_WAGE
    if case == "hired":
        return hired_wage
    if case == "mixed":  # one week in three hired, the rest mita
        return (2 * MITA_WAGE + hired_wage) / 3
    raise ValueError(case)


def dfood(case, p):
    cash_net = wage_for(case, p["hired_wage"]) * p["weeks_paid"] - p["cost_per_week"] * SEASON_WEEKS
    ration_saved = p["ration_kcal_per_day"] * 7 * SEASON_WEEKS
    return cash_net * p["kcal_per_real"] + ration_saved - p["farm_forgone_kcal"]


def break_even_price(case, p):
    """kcal per real at which dfood = 0 with the other parameters at p; None if no positive price does it."""
    cash_net = wage_for(case, p["hired_wage"]) * p["weeks_paid"] - p["cost_per_week"] * SEASON_WEEKS
    gap = p["farm_forgone_kcal"] - p["ration_kcal_per_day"] * 7 * SEASON_WEEKS
    if cash_net == 0:
        return None
    price = gap / cash_net
    return price if price > 0 else None


def lhs(n, seed):
    rng = random.Random(seed)
    cols = {}
    for k, (lo, hi) in RANGES.items():
        perm = list(range(n))
        rng.shuffle(perm)
        cols[k] = [lo + (hi - lo) * (perm[i] + rng.random()) / n for i in range(n)]
    return [{k: cols[k][i] for k in RANGES} for i in range(n)]


def main():
    assert MITA_WAGE * SEASON_WEEKS / REALES_PER_PESO == 65.0, "the arithmetic no longer reproduces the Godoy wage"
    draws = lhs(N_DRAWS, SEED)
    mid = {k: (lo + hi) / 2 for k, (lo, hi) in RANGES.items()}
    out = {"godoy_check": "26 weeks x 20 reales / 8 = 65 pesos", "draws": N_DRAWS, "seed": SEED, "confirmatory": {}, "diagnostic": {}}
    for case in ("mita", "hired", "mixed"):
        vals = [dfood(case, p) for p in draws]
        q = statistics.quantiles(vals, n=20)
        be = break_even_price(case, mid)
        out["confirmatory"][case] = {
            "share_food_rises": round(sum(v > 0 for v in vals) / N_DRAWS, 3),
            "break_even_kcal_per_real_at_midpoints": None if be is None else round(be, 1),
            "dfood_kcal_p5_median_p95": [round(q[0]), round(statistics.median(vals)), round(q[18])],
        }
        # one at a time: each parameter at its low and high end, the rest at midpoints (diagnostic)
        oat = {}
        for k, (lo, hi) in RANGES.items():
            oat[k] = [round(dfood(case, {**mid, k: lo})), round(dfood(case, {**mid, k: hi}))]
        out["diagnostic"][case] = {"dfood_at_midpoints": round(dfood(case, mid)), "one_at_a_time_low_high": oat}
    # what the hired case needs: the conditions in the draws where it pays
    win = [p for p in draws if dfood("hired", p) > 0]
    if win:
        out["diagnostic"]["hired_when_it_pays"] = {k: [round(min(p[k] for p in win), 1), round(statistics.median(p[k] for p in win), 1)] for k in RANGES}
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
