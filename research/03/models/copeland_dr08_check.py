"""Independent machine check of the DR08 reconstruction (Copeland, Table 5 col. 1).

Written separately from copeland_dr08.py and sharing no code with it: it does
not import, read or call that script. It reads the public replication ZIP in
memory (nothing is extracted or executed), rebuilds the do-file's baseline

    ppmlhdfe good_count ldist_ptime_da same_reg lat_diff $city_fe

with explicit city dummies (Stata `tabulate, generate` order, dummy 7 of each
set dropped as in the do-file) and fits it by iteratively reweighted least
squares, solving each weighted step with numpy.linalg.lstsq (SVD).

Robust standard errors are reported three ways:
  hc0             plain sandwich
  hc1             hc0 * sqrt(N / (N - K))
  ppml_asymptotic hc0 * sqrt(N / (N - 1)), the reghdfe/ppmlhdfe robust convention

The primary comparison uses ppml_asymptotic. Requires Python 3, NumPy, pandas.
Deterministic: no random numbers, no network access.
"""
import argparse
import hashlib
import io
import json
import platform
import sys
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

MEMBER = "Replication Pack/gravity_trade_data.dta"
EXPECTED_ARCHIVE_SHA256 = "c76ec21c57741844419b4bf3d4f38e851ddcec07c239880275227a71aeb12ef6"

# Targets. "reconstruction" values are those reported by the PR's script,
# stated to six decimals; "published" values are Table 5 col. 1 as printed.
TARGET = {"n": 107, "beta": -0.310639, "se": 0.154838, "mutant_beta": 0.2583}
TOL = {"beta": 5e-7, "se": 5e-7, "mutant_beta": 5e-5}
PUBLISHED = {"n": 107, "beta": -0.311, "se": 0.155, "tol": 5e-4}


def dummies(codes):
    """One column per distinct code in ascending order; drop the 7th, as the do-file does."""
    levels = np.unique(codes)
    block = (codes[:, None] == levels[None, :]).astype(float)
    return np.delete(block, 6, axis=1), np.delete(levels, 6)


def build(frame, city_effects=True):
    y = frame["good_count"].to_numpy(float)
    cols = {
        "_cons": np.ones(len(frame)),
        "ldist_ptime_da": np.log(frame["p_sea_time_hr"].to_numpy(float) / 24.0),
        "same_reg": (frame["region1"].to_numpy() == frame["region2"].to_numpy()).astype(float),
        "lat_diff": np.abs(frame["lat1"].to_numpy(float) - frame["lat2"].to_numpy(float)),
    }
    names, blocks = list(cols), [np.column_stack(list(cols.values()))]
    if city_effects:
        for side in ("pcode1", "pcode2"):
            block, levels = dummies(frame[side].to_numpy())
            blocks.append(block)
            names += [f"{side}=={lv:g}" for lv in levels]
    return y, np.hstack(blocks), names


def irls_poisson(y, X, tol=1e-13, max_iter=200):
    n, k = X.shape
    rank = np.linalg.matrix_rank(X)
    if rank != k:
        raise SystemExit(f"design is rank {rank} < {k} columns; this check expects full rank")
    if np.any(y <= 0):
        raise SystemExit("check is restricted to strictly positive outcomes")
    mu = 0.5 * (y + y.mean())
    eta = np.log(mu)
    dev_old = np.inf
    for it in range(1, max_iter + 1):
        z = eta + (y - mu) / mu
        sw = np.sqrt(mu)
        beta, *_ = np.linalg.lstsq(X * sw[:, None], z * sw, rcond=None)
        eta = X @ beta
        mu = np.exp(eta)
        dev = 2.0 * np.sum(y * np.log(y / mu) - (y - mu))
        if abs(dev - dev_old) <= tol * (1.0 + abs(dev)):
            break
        dev_old = dev
    else:
        raise SystemExit("IRLS did not converge")
    resid = y - mu
    # Bread via SVD of sqrt(W) X, so no explicit normal-equation inverse.
    u, s, vt = np.linalg.svd(X * np.sqrt(mu)[:, None], full_matrices=False)
    bread = (vt.T / s**2) @ vt
    meat = (X * resid[:, None]).T @ (X * resid[:, None])
    hc0 = np.sqrt(np.diag(bread @ meat @ bread))
    return {
        "n": n, "k": k, "rank": int(rank), "iterations": it, "deviance": float(dev),
        "max_abs_score": float(np.max(np.abs(X.T @ resid))),
        "beta": beta, "hc0": hc0,
        "hc1": hc0 * np.sqrt(n / (n - k)),
        "ppml_asymptotic": hc0 * np.sqrt(n / (n - 1)),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("archive", type=Path, help="public replication ZIP (rtm)")
    ap.add_argument("--output", type=Path, help="write the check record as JSON here")
    args = ap.parse_args()

    raw = args.archive.read_bytes()
    archive_sha = hashlib.sha256(raw).hexdigest()
    with zipfile.ZipFile(io.BytesIO(raw)) as zf:
        frame = pd.read_stata(io.BytesIO(zf.read(MEMBER)), convert_categoricals=False)

    y, X, names = build(frame)
    fit = irls_poisson(y, X)
    j = names.index("ldist_ptime_da")
    y0, X0, names0 = build(frame, city_effects=False)
    mutant = irls_poisson(y0, X0)
    mutant_beta = float(mutant["beta"][names0.index("ldist_ptime_da")])

    beta = float(fit["beta"][j])
    se = {key: float(fit[key][j]) for key in ("hc0", "hc1", "ppml_asymptotic")}
    checks = {
        "archive_sha256_matches": archive_sha == EXPECTED_ARCHIVE_SHA256,
        "n_matches": fit["n"] == TARGET["n"],
        "beta_matches_reconstruction": abs(beta - TARGET["beta"]) <= TOL["beta"],
        "se_ppml_asymptotic_matches_reconstruction": abs(se["ppml_asymptotic"] - TARGET["se"]) <= TOL["se"],
        "beta_rounds_to_published": abs(beta - PUBLISHED["beta"]) < PUBLISHED["tol"],
        "se_rounds_to_published": abs(se["ppml_asymptotic"] - PUBLISHED["se"]) < PUBLISHED["tol"],
        "mutant_beta_matches": abs(mutant_beta - TARGET["mutant_beta"]) <= TOL["mutant_beta"],
        "mutant_fails_published_check": abs(mutant_beta - PUBLISHED["beta"]) >= PUBLISHED["tol"],
    }
    record = {
        "check": "independent IRLS re-fit of Copeland Table 5 col. 1; not native Stata, not the full study",
        "archive_sha256": archive_sha,
        "check_script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "runtime": {"python": platform.python_version(), "numpy": np.__version__,
                    "pandas": pd.__version__, "platform": platform.platform()},
        "design": {"n": fit["n"], "columns": fit["k"], "rank": fit["rank"]},
        "fit": {"iterations": fit["iterations"], "deviance": fit["deviance"],
                "max_abs_score": fit["max_abs_score"]},
        "ldist_ptime_da": {"beta": beta, "se": se},
        "omitted_city_effects_beta": mutant_beta,
        "targets": TARGET, "tolerances": TOL, "published": PUBLISHED,
        "checks": checks,
        "passed": all(checks.values()),
    }
    text = json.dumps(record, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8", newline="\n")
    sys.stdout.write(text)
    if not record["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
