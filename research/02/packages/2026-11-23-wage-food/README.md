# Standalone wage-food budget: retained computational rerun

Version **1.0.0**, reporting date **23 November 2026** (Asia/Seoul).
Package identity: `urn:uuid:6c8529aa-e1e2-47ca-9519-33650486dc64`.

**Status: exploratory.** Under
[game-change-review](../../../../.claude/skills/game-change-review/SKILL.md),
"reproduced" requires that someone other than the author rerun the package from its
recorded inputs and get the same result. That has not happened yet: the only reruns so
far are the author's own, recorded in the pull request that added this package.

This package preserves a new execution of the existing one-household, one-worker,
26-week wage-food budget. It is retrospective: the 19 November report was read before
this run. It is not a new preregistered test, a reproduction of the original run's
unrecorded environment, or a check of historical food security. The classroom game is
not loaded or changed.

**This is not a blind test.** The harness inputs were committed before the run, but
that adds no evidential weight: the model is deterministic and its results had already
been published in the 19 November report.

The unmodified model is
[`../../models/exp2_wage_budget.py`](../../models/exp2_wage_budget.py). It is cited at
repository snapshot `0cdc2e768ea0c751aac90df5806c0b9fd5f9ff90` (the merge of PR #23);
the file itself last changed at `9cf75ccc1befeaa4a46e73ee9f552988bec74189`. Its SHA-256
and Git blob are recorded in [`config.json`](config.json). The harness revision,
runtime, file inventory, counts, units and accounting definitions are in
[`manifest.json`](manifest.json).

## Obtain, check and reproduce

Obtain the repository at the immutable Git revision being cited. A repository ZIP at
that revision works too; Git is not required to execute it. Python's standard library
is sufficient; install no packages. The recorded run used CPython 3.14.10 on Windows (see `runtime` in the manifest);
other runtimes are not pre-tested.

From the repository root:

```sh
python3 research/02/packages/2026-11-23-wage-food/run.py verify
python3 research/02/packages/2026-11-23-wage-food/run.py reproduce --output /tmp/kvis-wage-food-rerun
```

Use an empty directory outside the checkout. On Windows, substitute your Python 3
executable and a path such as `C:/Users/user/AppData/Local/Temp/kvis-wage-food-rerun`.

- `verify` hashes only this package's own files and the pinned model, recomputes every
  CSV outcome, count and summary quantile, and requires `manifest.json` to equal what
  `generate` would write from them.
- The context documents (pre-registration, 19 November report, processing
  specification and `LICENSE.md`) are living repository files: pre-registrations take
  appended dated deviations and `LICENSE.md` takes a row per game. They are therefore
  pinned by commit and Git blob in `config.json`, not hashed in the working tree. When
  Git and the pinned commit are available, `verify` compares `git show <commit>:<path>`
  with each recorded blob; otherwise it prints `SKIP` and says why.
- `reproduce` additionally regenerates the seeded draws and the original model's JSON
  stdout in the new directory, and requires both files to match byte for byte. It never
  overwrites the retained outputs.

### Regenerating the manifest (curator)

```sh
python3 research/02/packages/2026-11-23-wage-food/run.py generate --output <empty-dir> --harness-commit <full-sha>
```

`generate` writes `draws.csv`, `summary.json` and the complete `manifest.json`
(inventory, status and all metadata, taken from `config.json`). Two steps stay manual:
commit every package member except `manifest.json` first and pass that commit as
`--harness-commit`; then copy the generated `manifest.json` into this directory and
commit it. The manifest records no wall-clock timestamps, so under the recorded runtime
`generate` rewrites it byte for byte; on another interpreter or platform only the
`runtime` block differs.

## What is retained and what the numbers mean

- [`draws.csv`](draws.csv): every one of 1,000 six-parameter Latin-hypercube draws,
  with the three case outcomes in the same row. Numeric cells use 17 significant
  digits so Python binary64 values round-trip. This is a parameter-box sample, not
  observations from 1,000 historical households.
- [`summary.json`](summary.json): the model's unedited JSON stdout, including its
  original `confirmatory` and `diagnostic` keys. Those names refer to the old
  protocol's categories; they do not register a new confirmatory analysis.
- [`manifest.json`](manifest.json): source and harness identities, RNG and pairing, all
  attempted, completed, failed and excluded counts, the data dictionary, interpretation
  limits, the SHA-256 inventory and the prior-prediction records. Paths are
  repository-relative.
- [`CITATION.cff`](CITATION.cff): citation metadata, with references crediting
  Frost & Silver and the original game it adapts.

All three cases evaluate the identical 1,000 points, with no random draws inside a
case. A gain means full-precision `dfood > 0`; zeros are not gains. The numerator is
the positive count, and each case's denominator is 1,000. The total of 3,000 case
evaluations does not mean 3,000 independent parameter draws.

The budget converts net wages less the worker's costs into food-equivalent kcal, adds
the worker's ration saved at home, and subtracts farm food forgone. Costs cover all 26
weeks even if fewer weeks are paid. Negative cash is treated as a food-equivalent
shortfall, not debt carried into a later season. There is no game-engine settlement.

Under the retained ranges, compulsory and mixed work have no positive draws; hired work
has **34/1,000 (3.4%)**. These describe this model and parameter box. They are not
estimates of the historical probability that mining improved food security. The source
model's wages, costs and several judgement ranges have not been rechecked against the
source books during this packaging task.

## The pre-registered predictions

The manifest records the **quantitative part** of each of the four predictions in the
[pre-registration](../../pre-registrations/2026-11-19-wage-food-breakeven.md) and
whether this run met it:

| | Prediction (quantitative part) | This run | Met |
| --- | --- | --- | --- |
| P1 | compulsory service lowers food in ≥ 95% of draws | 100% | yes |
| P2 | hired work raises food in 10–35% of draws (read as an inclusive interval) | 3.4% | no |
| P3 | mixed work raises food in < 10% of draws | 0% | yes |
| P4 | hired break-even price at the midpoints > 475 kcal per real | none exists | no |

Both failures were already reported on 19 November; each failed prediction in the
manifest links that report, the reason (from `config.json`) and the retained
counterevidence. The pre-registration and the report are not edited.

**P2's qualitative clause was not encoded.** P2 also said hired work would pay "only
with many paid weeks, low costs and high kcal per real". That clause is not in the
manifest, and it partly failed: the 34 paying draws have kcal per real from 329.8
(near the bottom of the 300–650 range) with median 495.7, so high food prices were not
required.

## Found in this package's review (2026-11-23)

This was found while reviewing this package on 2026-11-23; the 19 November report is
not edited. Its "When hired work pays" paragraph gives "46–51 reales a week" for the
worker's costs and "0.50–0.56 million kcal" for farm food forgone. These are not
ranges: they are the [minimum, median] pairs that the model's `hired_when_it_pays`
diagnostic prints. Recomputed from `draws.csv` over the 34 paying hired draws:

| Parameter | Minimum | Median | Maximum |
| --- | --- | --- | --- |
| cost per week, reales | 46.18 | 51.27 | 64.33 |
| farm food forgone, million kcal | 0.500 | 0.559 | 0.698 |
| weeks paid | 20.76 | 24.20 | 25.95 |
| kcal per real | 329.78 | 495.69 | 647.83 |

So hired work paid with costs up to 64.33 reales a week and farm forgone up to 0.698
million kcal, and weeks paid start at 20.76, not "at least 21".

## Cite and preserve

Suggested citation: **Wongsatit, Thanakrit (2026). _Frost & Silver standalone wage-food
budget: retained computational rerun_. Version 1.0.0. KVIS Econ Games 2026.** Include
the full immutable Git commit and a permalink to this directory at that commit. Use the
commit of the complete package, not only the model or harness input commit. Also credit
Frost & Silver, Thanakrit Wongsatit's adaptation of Amnuayvit Thitibordin's original,
as listed in `CITATION.cff`. Thanakrit Wongsatit is credited for this package's
curation, with AI assistance; this is not a claim of sole authorship of the original
game or its evidence sources.

Repository material is **CC BY-NC-SA 4.0**; see [`../../../../LICENSE.md`](../../../../LICENSE.md).
Neither game's commercial exception extends to this research package. Retain the
original model and evidence attribution when reusing it.

The UUID identifies the package but is not a resolving archival PID. No DOI has been
minted and no independent archival preservation is claimed. Until an archive is
established, preserve the cited Git snapshot and its metadata together. If outputs must
be withdrawn or moved, retain the metadata, identifiers, checksums, reason and access
conditions, and point to the replacement location. Do not silently overwrite these
versioned results; a new run or changed input needs a new version and run record.
