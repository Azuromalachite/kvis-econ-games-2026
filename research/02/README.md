# Frost & Silver research (`projects/02`)

Migration checkpoint: 22 November 2026. Imported from [Azuromalachite/frost-and-silver-game at `d64a632`](https://github.com/Azuromalachite/frost-and-silver-game/tree/d64a632eaa78e2bc33f9cc4fd1726266f68ac246). Original authorship and CC BY-NC-SA attribution remain recorded in the repository's [licence](../../LICENSE.md).

This preserves the research programs, including unsuccessful predictions, negative findings, source-access gaps and excluded evidence. It does not change the playable game, register new hypotheses, or establish that the historical claims are verified. Dated reports describe their original models and runs; their original commit references and scientific wording remain. Relative links and executable file paths are relocated for this repository.

## Find the artifacts

| Location | Contents |
| --- | --- |
| [models](models/) | Structural robustness, wage/food budgets, planting-late and herd/store experiments |
| [pre-registrations](pre-registrations/) | Five original protocols/addenda; preserve their source history and append any future deviations rather than rewriting predictions |
| [results](results/) | Five original results, including missed predictions and non-graduating mechanisms |
| [evidence](evidence/) | Claim/source registries, recorded numerical evidence, exclusion flags and the consistency checker |
| [notes](notes/) | Historical evidence, literature/access gaps, dated reviews, strategy/sensitivity findings and supporting specifications referenced by the registry |
| [references](references/) | Bibliography and access inventory; no source books, lecture slides or private files are included |
| [tools](tools/) | Browser strategy/sensitivity/seed-selection tools and the agropastoral diagnostic script |
| [source context](source-context/) | Explicitly frozen source README snapshots for the original research context and published baseline table; these are not current monorepo governance |

See [tests/02](../../tests/02/README.md) for the migrated model, evidence, syntax and mutation checks.

## Re-run research deliberately

From the repository root, using Python 3:

```sh
python3 research/02/models/exp2_wage_budget.py
python3 research/02/models/exp2b_bakewell_prices.py
```

For browser experiments, serve the repository root and open the relevant page in `research/02/models/` or `research/02/tools/`. They fetch `projects/02/index.html` without changing it. The full strategy and sensitivity sweeps are on-demand research, not a routine CI task.

`tools/review_agropastoral.cjs` requires a real Git checkout and a commit argument containing the same Week 2 game file as the working copy. Run `node research/02/tools/review_agropastoral.cjs <model-commit>`; it refuses a mismatched model. Do not substitute a different engine to make a past result reproduce.

## Migration provenance and status

[migration-manifest.json](migration-manifest.json) maps original paths and Git blobs to their new paths and SHA-256 checksums. The source game blob matches the already published Week 2 game. Mechanical changes adapt paths, links, checker scope, and baseline-document lookup; model equations, numerical assertions, input numbers and scientific decisions are retained. Original preregistration timing is established by the pinned source repository history, not by this later migration commit.

Only checks and reruns explicitly listed in the manifest's verification section were performed for this migration. Carrying an old result into this folder does not mark it independently reproduced. The five dated result records are retained with migration status **provenance-incomplete** until their original run environments and complete model/output identity are established; the gaps are recorded in the manifest, not inserted retrospectively into the reports. The original repository remains the record for old issues, approvals, PR discussions, full history and superseded planning not needed by these artifacts.
