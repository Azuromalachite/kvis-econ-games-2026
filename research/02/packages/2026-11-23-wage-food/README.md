# Standalone wage-food budget: retained computational rerun

Version **1.0.0**, reporting date **23 November 2026** (Asia/Seoul).
Package identity: `urn:uuid:6c8529aa-e1e2-47ca-9519-33650486dc64`.

This package preserves a new execution of the existing one-household, one-worker,
26-week wage-food budget. It is retrospective: the 19 November report was read before
this run. It is not a new preregistered test, a reproduction of the original run's
unrecorded environment, or a validation of historical food security. The classroom
game is not loaded or changed.

The unmodified model is
[`../../models/exp2_wage_budget.py`](../../models/exp2_wage_budget.py), pinned at
`0cdc2e768ea0c751aac90df5806c0b9fd5f9ff90`. Its SHA-256 is recorded in
[`config.json`](config.json). The harness revision, runtime, full file inventory,
counts, units and accounting definitions are in [`manifest.json`](manifest.json).

## Obtain, verify and reproduce

Obtain the **full repository at the immutable Git revision being cited**, including
this package, its model and linked context files. A repository ZIP at that revision
works too; Git is not required to execute it. Copying only this directory is not a
complete source checkout. Python's standard library is sufficient; install no packages.
The recorded run used CPython 3.12.14 on Windows; other runtimes are not pre-validated.

From the repository root:

```sh
python3 research/02/packages/2026-11-23-wage-food/run.py verify
python3 research/02/packages/2026-11-23-wage-food/run.py reproduce --output /tmp/kvis-wage-food-rerun
```

Use an empty directory outside the checkout. On Windows, substitute your Python 3
executable and a path such as `C:/Users/user/AppData/Local/Temp/kvis-wage-food-rerun`.
`verify` checks the retained file hashes and recomputes all recorded CSV outcomes,
counts and summary quantiles. `reproduce` additionally regenerates the exact seeded
draws and the original model's JSON stdout in that directory, then requires both
files to match byte for byte. It never overwrites the retained outputs.

[`verification.json`](verification.json) records whether an independent agent actually
reran the package. Technical reproducibility and analysis status are distinct: an
independently reproduced computational result is still a retrospective sensitivity
analysis, not newly confirmed history. The five old result records retain their
`provenance-incomplete` status.

## What is retained and what the numbers mean

- [`draws.csv`](draws.csv): every one of 1,000 six-parameter Latin-hypercube draws,
  with the three case outcomes in the same row. Numeric cells use 17 significant
  digits so Python binary64 values round-trip. This is a parameter-box sample, not
  observations from 1,000 historical households.
- [`summary.json`](summary.json): the model's unedited JSON stdout, including its
  original `confirmatory` and `diagnostic` keys. Those names refer to the old
  protocol's categories; they do not register a new confirmatory analysis.
- [`manifest.json`](manifest.json): source/harness identities, execution timestamps,
  RNG and pairing, all attempted/completed/failed/excluded counts, data dictionary,
  interpretation limits and SHA-256 inventory. Paths are repository-relative.
- [`CITATION.cff`](CITATION.cff): citation metadata. The manifest remains the one
  authoritative record for this run and its correction relationships.

## One experiment through the lifecycle

| Stage | Concrete implementation |
| --- | --- |
| Comparable | Full-precision food-equivalent change per household per 26-week season; paired inputs, positive/zero/negative counts and denominators are explicit. |
| Organized | Model and harness commits/checksums, original protocol, prior report and all retained output identities are linked in `manifest.json`. |
| Predictive | All four original quantitative budget-model predictions are evaluated, including the two that failed. These are not relabelled as new predictions or gameplay validation. |
| Engaged | `verification.json` records an independent rerun/challenge and its limits; correction links retain earlier assertions, counterevidence and reasons. |

The versioned correction records formalize two revisions already reported on
19 November: hired work's positive share missed the predicted 10–35% interval, and
the predicted positive break-even price above 475 kcal/real did not exist at the
midpoints. Each record links assertion version 1 to version 2, the original protocol,
the old report, the new retained counterevidence and the reason. This records an
existing correction; it does not claim a newly discovered failure. Later changes must
append a versioned relationship and preserve the earlier assertion, rather than
silently replacing it. The original protocol, report and model stay unchanged.

All three cases evaluate the identical 1,000 points, with no random draws inside a
case. A gain means full-precision `dfood > 0`; zeros are not gains. The numerator is
the positive count, and each case's denominator is 1,000. The total of 3,000 case
evaluations does not mean 3,000 independent parameter draws.

The budget converts net wages less the worker's costs into food-equivalent kcal,
adds the worker's ration saved at home, and subtracts farm food forgone. Costs cover
all 26 weeks even if fewer weeks are paid. Negative cash is treated as a food-equivalent
shortfall, not debt carried into a later season. There is no game-engine settlement.

Under the retained ranges, compulsory and mixed work have no positive draws; hired
work has **34/1,000 (3.4%)**. These describe this model and parameter box. They are not
estimates of the historical probability that mining improved food security. The
source model's wages/costs and several judgement ranges have not been revalidated
against source books during this packaging task.

Historical context, source-reading limits and prior predictions remain in the
[original protocol](../../pre-registrations/2026-11-19-wage-food-breakeven.md),
[old report](../../results/2026-11-19-wage-food-breakeven.md) and
[evidence-to-mechanic specification](../../notes/processing-income-spec-2026-11-18.md).
Their bytes are inventoried as context, not claimed as new historical evidence.
No books, restricted source copies, student data or transient run logs are bundled.

## Cite and preserve

Suggested citation: **Wongsatit, Thanakrit (2026). _Frost & Silver standalone wage-food
budget: retained computational rerun_. Version 1.0.0. KVIS Econ Games 2026.** Include
the full immutable Git commit and a permalink to this directory at that commit.
Use the commit of the complete package, not only the model or harness input commit.
`CITATION.cff` supplies machine-readable authorship, title, version, date and licence.
Thanakrit Wongsatit is credited for this package's curation, with AI assistance;
this is not a claim of sole authorship of the original game or its evidence sources.

Repository material is **CC BY-NC-SA 4.0**; see [`../../../../LICENSE.md`](../../../../LICENSE.md).
Neither game's commercial exception extends to this research package. Retain the
original model and evidence attribution when reusing it.

The UUID identifies the package but is not a resolving archival PID. No DOI has been
minted and no independent archival preservation is claimed. Until an archive is
established, preserve the cited Git snapshot and its metadata together. If outputs
must be withdrawn or moved, retain the metadata, identifiers, checksums, reason and
access conditions, and point to the replacement location. Do not silently overwrite
these versioned results; a new run or changed input needs a new version/run record.
