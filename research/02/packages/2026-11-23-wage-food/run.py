"""Verify or reproduce the retained standalone wage-food experiment using stdlib only.

All manifest paths are repository-relative. Reproduction always writes to a new,
empty directory, never to the retained package. A full repository checkout is needed.
"""
from __future__ import annotations

import argparse
import contextlib
import csv
import hashlib
import importlib.util
import io
import json
import math
import platform
import random
import re
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent
ROOT = PACKAGE.parents[3]
PREFIX = PACKAGE.relative_to(ROOT).as_posix()
SHA40 = re.compile(r"[a-f0-9]{40}\Z")


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def repo_path(value):
    path = (ROOT / value).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError("path escapes repository: " + value)
    return path


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def json_text(value):
    return json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"


def config_and_model():
    config = read_json(PACKAGE / "config.json")
    model_path = repo_path(config["model"]["path"])
    if digest(model_path) != config["model"]["sha256"]:
        raise ValueError("pinned model checksum mismatch; obtain the cited checkout")
    sys.dont_write_bytecode = True
    spec = importlib.util.spec_from_file_location("retained_wage_model", model_path)
    model = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(model)
    run = config["run"]
    if (model.N_DRAWS, model.SEED) != (run["draws"], run["seed"]):
        raise ValueError("model seed or draw count does not match configuration")
    if run["cases"] != ["mita", "hired", "mixed"] or run["strict_food_gain_threshold_kcal"] != 0:
        raise ValueError("case/threshold contract changed")
    return config, model


def render(model, config):
    """Retain the model's own stdout and all draws/outcomes; no model is reimplemented."""
    captured = io.StringIO()
    with contextlib.redirect_stdout(captured):
        model.main()
    summary = captured.getvalue()
    report = json.loads(summary)
    draws = model.lhs(model.N_DRAWS, model.SEED)
    parameters = list(model.RANGES)
    cases = config["run"]["cases"]
    columns = ["draw_id", *parameters, *(case + "_dfood_kcal" for case in cases)]
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, lineterminator="\n")
    writer.writerow(columns)
    for number, point in enumerate(draws, 1):
        values = [point[k] for k in parameters] + [model.dfood(case, point) for case in cases]
        if not all(math.isfinite(v) for v in values):
            raise ValueError("non-finite result at draw " + str(number))
        writer.writerow([number, *(format(v, ".17g") for v in values)])
    if report["draws"] != len(draws) or report["seed"] != model.SEED:
        raise ValueError("model stdout disagrees with retained draw identity")
    return {"draws.csv": stream.getvalue(), "summary.json": summary}


def check_outputs(directory, config, model):
    directory = Path(directory)
    with (directory / "draws.csv").open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        expected_columns = ["draw_id", *model.RANGES, *(case + "_dfood_kcal" for case in config["run"]["cases"])]
        if reader.fieldnames != expected_columns:
            raise ValueError("CSV column contract mismatch")
        rows = list(reader)
    if len(rows) != config["run"]["draws"]:
        raise ValueError("CSV row count mismatch")
    summary = read_json(directory / "summary.json")
    counts = {}
    for case in config["run"]["cases"]:
        values = []
        for number, row in enumerate(rows, 1):
            if row["draw_id"] != str(number):
                raise ValueError("draw IDs must be contiguous and unique")
            point = {key: float(row[key]) for key in model.RANGES}
            if not all(math.isfinite(v) and model.RANGES[k][0] <= v <= model.RANGES[k][1]
                       for k, v in point.items()):
                raise ValueError("parameter outside its retained range")
            value = float(row[case + "_dfood_kcal"])
            if not math.isfinite(value) or value != model.dfood(case, point):
                raise ValueError("CSV outcome does not match the pinned model")
            values.append(value)
        positive = sum(v > 0 for v in values)
        zero = sum(v == 0 for v in values)
        q = statistics.quantiles(values, n=20)
        measured = summary["confirmatory"][case]
        if measured["share_food_rises"] != round(positive / len(values), 3):
            raise ValueError("summary share differs from full-precision CSV outcomes")
        if measured["dfood_kcal_p5_median_p95"] != [round(q[0]), round(statistics.median(values)), round(q[18])]:
            raise ValueError("summary quantiles differ from CSV outcomes")
        counts[case] = {"attempted": len(values), "completed": len(values), "failed": 0,
                        "excluded": 0, "positive": positive, "zero": zero,
                        "negative": len(values) - positive - zero, "denominator": len(values)}
    return counts


def runtime():
    return {"implementation": platform.python_implementation(), "python_version": platform.python_version(),
            "python_full_version": sys.version, "platform": platform.platform(),
            "dependencies": "Python standard library only",
            "stdlib_source_sha256": {"random.py": digest(random.__file__),
                                     "statistics.py": digest(statistics.__file__)}}


def lifecycle(config, counts, summary):
    """Link the prior predictions to this run without rewriting either old document."""
    protocol = config["context_paths"][0]
    report = config["context_paths"][1]
    source = config["repository"] + "/blob/" + config["model"]["source_commit"] + "/"
    protocol_uri = source + protocol + "#pre-registered-prediction"
    report_uri = source + report
    predictions = []
    corrections = []
    for item in config["original_predictions"]:
        case, metric, operator = item["case"], item["metric"], item["operator"]
        if metric.endswith("_share"):
            numerator = counts[case]["negative" if metric == "negative_share" else "positive"]
            observed = numerator / counts[case]["denominator"]
        else:
            observed = summary["confirmatory"][case][metric]
        expected = item["expected"]
        met = observed is not None and (
            (operator == ">=" and observed >= expected) or
            (operator == "<" and observed < expected) or
            (operator == ">" and observed > expected) or
            (operator == "between_inclusive" and expected[0] <= observed <= expected[1]))
        earlier = {"id": config["package_id"] + "#" + item["id"] + "-assertion-v1",
                   "version": 1, "source": protocol_uri, "case": case, "metric": metric,
                   "operator": operator, "expected": expected}
        predictions.append({"id": item["id"], "earlier_assertion": earlier,
                            "observed": observed, "met_prediction": met,
                            "scope": "new retained execution of the pinned standalone model; not a new preregistration"})
        if not met:
            reason = ("The hired positive share is below the predeclared lower bound."
                      if item["id"] == "P2" else
                      "No positive break-even food price exists at the midpoint parameters: worker costs exceed wages there.")
            corrections.append({
                "id": config["package_id"] + "#" + item["id"] + "-correction-record-v1",
                "record_version": 1, "relationship": "revises",
                "earlier_assertion": earlier,
                "revised_assertion": {"id": config["package_id"] + "#" + item["id"] + "-assertion-v2",
                                      "version": 2, "case": case, "metric": metric, "observed": observed,
                                      "scope": "This pinned model and retained parameter box only; no historical population inference."},
                "counterevidence": [PREFIX + "/draws.csv", PREFIX + "/summary.json"],
                "reason": reason, "already_reported_in": report_uri,
                "formalized_on": config["reporting_date"],
                "effect": "Interpretation only; model, game and original documents are unchanged. This formalizes the old report's existing correction, not a newly discovered failure."})
    return {"comparable": {"metric": "signed household food-equivalent change, kcal per 26-week season",
                           "unit_of_comparison": "one paired parameter draw evaluated in all three cases; not an observed household",
                           "definitions": "data_dictionary, terminal_accounting, threshold and counts_by_case in this manifest"},
            "organized": {"protocol": protocol_uri, "prior_report": report_uri,
                          "identities": "model, harness, runtime and file hashes in this manifest"},
            "predictive": {"hypothesis_kind": "standalone budget-model predictions relevant to a teaching assumption, not a gameplay validation",
                           "prior_results_known": True, "predictions": predictions},
            "engaged": {"verification_record": PREFIX + "/verification.json",
                        "scope": "independent computational reproduction or challenge, with reviewer limits retained"},
            "corrections": corrections,
            "history_policy": "Append versioned assertions/corrections for later changes; preserve earlier sources, counterevidence and reasons. Do not rewrite the old protocol or result."}


def prepare_output(path):
    output = Path(path).resolve()
    if output == ROOT or output.is_relative_to(ROOT):
        raise ValueError("scratch output must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        raise ValueError("output directory must be empty")
    return output


def generate(path, harness_commit):
    if not SHA40.fullmatch(harness_commit):
        raise ValueError("supply the full immutable harness commit")
    config, model = config_and_model()
    output = prepare_output(path)
    started = datetime.now(timezone.utc).isoformat()
    for name, content in render(model, config).items():
        (output / name).write_text(content, encoding="utf-8", newline="\n")
    counts = check_outputs(output, config, model)
    record = {"schema_version": 1, "package_id": config["package_id"], "version": config["version"],
              "status": "exploratory", "analysis_type": config["analysis_type"],
              "started_at_utc": started, "completed_at_utc": datetime.now(timezone.utc).isoformat(),
              "reporting_date": config["reporting_date"], "reporting_timezone": config["reporting_timezone"],
              "model": config["model"],
              "harness": {"repository": config["repository"], "commit": harness_commit,
                          "path": PREFIX + "/run.py", "sha256": digest(__file__)},
              "runtime": runtime(), "randomness": config["run"],
              "unique_input_draws": model.N_DRAWS, "case_evaluations": sum(v["completed"] for v in counts.values()),
              "counts_by_case": counts, "original_model_ranges": model.RANGES,
              "data_dictionary": {
                  "draw_id": {"unit": "dimensionless", "meaning": "1-based paired parameter-draw index, not a household observation"},
                  "weeks_paid": {"unit": "weeks per 26-week season", "meaning": "worker's paid weeks"},
                  "hired_wage": {"unit": "reales per five-day earning week", "meaning": "hired case's wage-rate input"},
                  "cost_per_week": {"unit": "reales per calendar week", "meaning": "worker costs, charged for all 26 weeks"},
                  "kcal_per_real": {"unit": "kcal per real", "meaning": "food purchasing-power assumption; not a validated historical price"},
                  "ration_kcal_per_day": {"unit": "kcal per day", "meaning": "worker ration saved by the household while away"},
                  "farm_forgone_kcal": {"unit": "kcal per household per 26-week season", "meaning": "food forgone from the worker's absent farm labour"},
                  **{case + "_dfood_kcal": {"unit": "kcal per household per 26-week season", "meaning": "signed food-equivalent difference from farming at home"}
                     for case in config["run"]["cases"]},
                  "summary.share_food_rises": {"unit": "dimensionless fraction", "meaning": "positive outcomes / 1000 parameter draws, not an observed frequency or population probability"}},
              "terminal_accounting": "One household, one adult worker, one 26-week season. Net wages less all 26 weeks of worker costs are converted to food-equivalent kcal; add the worker ration saved at home and subtract farm output forgone. Negative cash is a food-equivalent shortfall, not debt carried forward. No game settlement is executed.",
              "threshold": "Full-precision dfood > 0; exact zeros are not gains.",
              "quantile_method": config["run"]["quantiles"],
              "files": [], "manifest_self_hash": "Excluded to avoid a recursive hash; cite the immutable Git revision of the complete package.",
              "archive_doi": None, "preservation": config["preservation"]}
    record["lifecycle"] = lifecycle(config, counts, read_json(output / "summary.json"))
    (output / "manifest.json").write_text(json_text(record), encoding="utf-8", newline="\n")
    print(json_text({"output": str(output), "counts_by_case": counts}), end="")


def verify():
    manifest = read_json(PACKAGE / "manifest.json")
    if not manifest["files"]:
        raise ValueError("manifest file inventory is empty")
    paths = [f["path"] for f in manifest["files"]]
    if len(paths) != len(set(paths)):
        raise ValueError("duplicate file inventory entry")
    for item in manifest["files"]:
        path = repo_path(item["path"])
        if path.stat().st_size != item["bytes"] or digest(path) != item["sha256"]:
            raise ValueError("retained file checksum mismatch: " + item["path"])
    config, model = config_and_model()
    if manifest["harness"]["sha256"] != digest(__file__):
        raise ValueError("harness identity mismatch")
    if check_outputs(PACKAGE, config, model) != manifest["counts_by_case"]:
        raise ValueError("run counts mismatch")
    if manifest["case_evaluations"] != 3000 or manifest["unique_input_draws"] != 1000:
        raise ValueError("evaluation denominator mismatch")
    check_lifecycle(manifest, config)
    for name in ("draws.csv", "summary.json", "config.json", "run.py", "README.md", "CITATION.cff", "verification.json"):
        if PREFIX + "/" + name not in paths:
            raise ValueError("missing retained package member: " + name)
    print("PASS: retained file integrity, model identity, 1000 paired draws and all three outcome summaries")
    return manifest


def check_lifecycle(manifest, config):
    expected = lifecycle(config, manifest["counts_by_case"], read_json(PACKAGE / "summary.json"))
    if manifest.get("lifecycle") != expected:
        raise ValueError("versioned prediction/correction links or counterevidence are missing or inconsistent")


def reproduce(path):
    verify()
    config, model = config_and_model()
    output = prepare_output(path)
    for name, content in render(model, config).items():
        (output / name).write_text(content, encoding="utf-8", newline="\n")
        if (output / name).read_bytes() != (PACKAGE / name).read_bytes():
            raise ValueError("reproduction differs: " + name)
    print("MATCH: draws.csv and summary.json reproduced byte for byte")
    print(json_text({"runtime": runtime(), "output": str(output)}), end="")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("verify")
    rerun = commands.add_parser("reproduce")
    rerun.add_argument("--output", required=True)
    initial = commands.add_parser("generate", help="curator: generate a new retained run in scratch")
    initial.add_argument("--output", required=True)
    initial.add_argument("--harness-commit", required=True)
    args = parser.parse_args()
    if args.command == "verify":
        verify()
    elif args.command == "reproduce":
        reproduce(args.output)
    else:
        generate(args.output, args.harness_commit)


if __name__ == "__main__":
    main()
