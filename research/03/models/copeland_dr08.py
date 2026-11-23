"""Bounded independent reconstruction of Copeland Table 5 column 1.

Reads the supplied ZIP without executing its Stata code or extracting it.
Requires Python 3, NumPy and pandas. No random numbers or external downloads.
This does not implement ppmlhdfe's general separation or singleton handling.
The bounded baseline has strictly positive outcomes and explicit city dummies.
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


def full_rank_columns(x):
    """Keep earliest linearly independent columns after norm scaling."""
    scales = np.linalg.norm(x, axis=0)
    scales[scales == 0] = 1
    a = x / scales
    keep, qcols = [], []
    for j in range(a.shape[1]):
        v = a[:, j].copy()
        for _ in range(2):
            for q in qcols:
                v -= q * (q @ v)
        norm = np.linalg.norm(v)
        if norm > 1e-10:
            keep.append(j)
            qcols.append(v / norm)
    return keep, scales


def fit_ppml(x_full, y, names):
    if not np.all(np.isfinite(x_full)) or not np.all(np.isfinite(y)):
        raise ValueError("Nonfinite input")
    if not np.all(y > 0):
        raise ValueError("Bounded fitter requires strictly positive baseline outcomes")
    keep, scales = full_rank_columns(x_full)
    x = x_full[:, keep] / scales[keep]
    # Intercept is first and scaled to a vector with norm 1.
    b = np.zeros(x.shape[1])
    b[0] = np.log(y.mean()) * scales[keep[0]]
    converged = False
    for it in range(100):
        eta = x @ b
        mu = np.exp(eta)
        score = x.T @ (y - mu)
        h = x.T @ (mu[:, None] * x)
        step = np.linalg.solve(h, score)
        ll = float(y @ eta - mu.sum())
        fraction = 1.0
        while fraction >= 2 ** -30:
            candidate = b + fraction * step
            next_eta = x @ candidate
            if np.max(next_eta) < 100:
                next_ll = float(y @ next_eta - np.exp(next_eta).sum())
                if next_ll >= ll - 1e-11:
                    break
            fraction *= 0.5
        else:
            raise RuntimeError("Line search failed")
        b = candidate
        if np.max(np.abs(score)) < 1e-9:
            converged = True
            break
    eta = x @ b
    mu = np.exp(eta)
    residual = y - mu
    h = x.T @ (mu[:, None] * x)
    bread = np.linalg.inv(h)
    meat = x.T @ ((residual ** 2)[:, None] * x)
    covariance = bread @ meat @ bread
    k = len(keep)
    n = len(y)
    beta = b / scales[keep]
    hc0 = np.sqrt(np.maximum(np.diag(covariance), 0)) / scales[keep]
    hc1 = hc0 * np.sqrt(n / (n - k))
    # ppmlhdfe.mata calls reghdfe_solve_ols with vce_asymptotic;
    # reghdfe5.mata robust VCE uses variance adjustment N/(N-1).
    # The source versions inspected are recorded below; the author's are unpinned.
    ppml_se = hc0 * np.sqrt(n / (n - 1))
    return {
        "n": n, "rank": k, "iterations": it + 1,
        "converged": converged,
        "max_scaled_score": float(np.max(np.abs(x.T @ residual))),
        "coefficients": {names[j]: float(beta[i]) for i, j in enumerate(keep)},
        "robust_se_hc0": {names[j]: float(hc0[i]) for i, j in enumerate(keep)},
        "robust_se_hc1": {names[j]: float(hc1[i]) for i, j in enumerate(keep)},
        "robust_se_ppml_asymptotic": {names[j]: float(ppml_se[i]) for i, j in enumerate(keep)},
        "dropped_collinear": [names[j] for j in range(len(names)) if j not in keep],
        "fitted_mean_min": float(mu.min()), "fitted_mean_max": float(mu.max()),
    }


def design(df, divisor=24.0, use_city_fe=True):
    columns = [np.ones(len(df)), np.log(df.p_sea_time_hr.to_numpy(dtype=float) / divisor),
               (df.region1 == df.region2).to_numpy(dtype=float),
               np.abs(df.lat1.to_numpy(dtype=float) - df.lat2.to_numpy(dtype=float))]
    names = ["intercept", "log_sailing_days", "same_region", "latitude_difference"]
    if use_city_fe:
        for field in ("pcode1", "pcode2"):
            for index, value in enumerate(sorted(df[field].unique()), start=1):
                if index == 7:  # Matches the supplied do-file's explicit omissions.
                    continue
                columns.append((df[field] == value).to_numpy(dtype=float))
                names.append(f"{field}_{value:g}")
    return np.column_stack(columns), names


def published_match(fit):
    return (fit["converged"] and fit["n"] == 107
            and abs(fit["coefficients"]["log_sailing_days"] - (-0.311)) < 0.0005)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    archive_bytes = args.archive.read_bytes()
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as z:
        inventory = [{"path": info.filename, "bytes": info.file_size,
                      "sha256": hashlib.sha256(z.read(info)).hexdigest()}
                     for info in z.infolist() if not info.is_dir()]
        tables = {}
        for name in z.namelist():
            if name.endswith(".dta"):
                table = pd.read_stata(io.BytesIO(z.read(name)), convert_categoricals=False)
                tables[name] = {"rows": len(table), "columns": list(table.columns),
                                "missing": {key: int(value) for key, value in table.isna().sum().items()}}
        df = pd.read_stata(io.BytesIO(z.read("Replication Pack/gravity_trade_data.dta")),
                           convert_categoricals=False)
    y = df.good_count.to_numpy(dtype=float)
    x, names = design(df)
    baseline = fit_ppml(x, y, names)
    x_hours, names_hours = design(df, divisor=1.0)
    hours = fit_ppml(x_hours, y, names_hours)
    x_no_fe, names_no_fe = design(df, use_city_fe=False)
    mutant = fit_ppml(x_no_fe, y, names_no_fe)
    checks = {
        "published_coefficient_and_n_match": published_match(baseline),
        "published_standard_error_match": abs(baseline["robust_se_ppml_asymptotic"]["log_sailing_days"]
                                              - 0.155) < 0.0005,
        "hours_vs_days_coefficient_invariance": abs(baseline["coefficients"]["log_sailing_days"]
                                                    - hours["coefficients"]["log_sailing_days"]) < 1e-8,
        "omitting_city_effects_is_detected": not published_match(mutant),
    }
    result = {
        "scope": "independent NumPy implementation of Table 5 column 1; not native Stata execution",
        "rights": {
            "derived_outputs": ("The coefficients, standard errors and diagnostics in this file are "
                                "independently computed derived outputs of this script; no input rows are included."),
            "article": "Copeland (2025/2026), doi:10.1111/ehr.70016, CC BY 4.0 (Crossref version-of-record licence)",
            "replication_archive": ("Publicly linked from https://www.conradcopeland.com/research/rtm "
                                    "(Google Drive file id 1g191sqck9rvoazF6AmwgmiWqAlFNA2NR); "
                                    "no licence found in the archive or on that page"),
            "repository_licence": ("The repository licence grants no permission to redistribute the original "
                                   "data, which are not included"),
        },
        "input_zip_sha256": hashlib.sha256(archive_bytes).hexdigest(),
        "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "runtime": {"python": sys.version, "platform": platform.platform(),
                    "numpy": np.__version__, "pandas": pd.__version__},
        "rng": "none; deterministic analysis", "inventory": inventory, "tables": tables,
        "published": {"n": 107, "coefficient": -0.311, "se": 0.155,
                      "coefficient_rounding_tolerance": 0.0005},
        "variance_convention_source": {
            "ppmlhdfe_commit": "b85665d8f674e93c1e07446a9a2b29be7f797910",
            "ppmlhdfe_path": "src/ppmlhdfe.mata",
            "ppmlhdfe_blob": "f75c0cf5b294df5e3137a0fb9943f1117aa9a14a",
            "ppmlhdfe_locator": "line 468, vce_asymptotic call",
            "reghdfe_commit": "29b2b203f534413369d675d0c0f674d61291f536",
            "reghdfe_path": "src/reghdfe5.mata",
            "reghdfe_blob": "fc76ce368bf70a87a335656a05355df4cee7e8f2",
            "reghdfe_locator": "lines 2804-2805, robust variance adjustment N/(N-1)",
            "author_package_versions": "not specified in supplied archive"
        },
        "baseline": baseline,
        "hours_coefficient": hours["coefficients"]["log_sailing_days"],
        "omitted_city_effects_coefficient": mutant["coefficients"]["log_sailing_days"],
        "checks": checks,
        "limitations": ["No native Stata execution", "No full raw-data or GIS reconstruction",
                        "Robust SE uses N/(N-1) from inspected package source; author versions not pinned or natively executed",
                        "No general zero-outcome separation routine; restricted to positive-outcome baseline"],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"checks": checks, "coefficient": baseline["coefficients"]["log_sailing_days"],
                      "se_hc0": baseline["robust_se_hc0"]["log_sailing_days"],
                      "se_hc1": baseline["robust_se_hc1"]["log_sailing_days"],
                      "se_ppml_asymptotic": baseline["robust_se_ppml_asymptotic"]["log_sailing_days"],
                      "n": baseline["n"], "rank": baseline["rank"],
                      "mutant_coefficient": result["omitted_city_effects_coefficient"],
                      "output": str(args.output)}, indent=2))
    if not all(checks.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
