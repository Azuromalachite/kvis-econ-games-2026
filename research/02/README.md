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
| [source context](source-context/) | Explicitly frozen source README snapshots for the original research context and published baseline table; the rules that govern this folder now are in the game's own [projects/02/README.md](../../projects/02/README.md) ("Frost & Silver is frozen") |

See [tests/02](../../tests/02/README.md) for the migrated model, evidence, syntax and mutation checks.

## Re-run research deliberately

From the repository root, using Python 3:

```sh
python3 research/02/models/exp2_wage_budget.py
python3 research/02/models/exp2b_bakewell_prices.py
```

For browser experiments, serve the repository root and open the relevant page in `research/02/models/` or `research/02/tools/`. They fetch `projects/02/index.html` without changing it. The full strategy and sensitivity sweeps are on-demand research, not a routine CI task.

`tools/review_agropastoral.cjs` requires a real Git checkout and a commit argument containing the same Week 2 game file as the working copy. Run `node research/02/tools/review_agropastoral.cjs <model-commit>`; it refuses a mismatched model. Do not substitute a different engine to make a past result reproduce.

## New retained computational package

The [23 November wage-food package](packages/2026-11-23-wage-food/README.md) is a new,
versioned rerun of the pinned standalone budget model, with all paired draws,
outputs, provenance, citation metadata and verify/reproduce commands. It does not
execute the game, reproduce the unrecorded 19 November environment, or promote any
old report's evidence status. Read its verification record for the scope actually checked.

## Status of the retained results

All five are **provenance-incomplete** under [game-change-review](../../.claude/skills/game-change-review/SKILL.md): none has been rerun by someone else from recorded inputs, so none may be called verified or confirmed. The missing fields, from a field-by-field read of each result, its pre-registration and its model:

| Result | Missing fields |
| --- | --- |
| [Experiment 1, structural robustness](results/2026-11-18-structural-robustness.md) | Repository not named (commit 575a7a5, "or later"); game path at run time; game SHA-256; harness revision; browser and version; the game's weather RNG (only the sampling generator is recorded); why weather stays paired when players move differently; end-of-game settlement; completed, failed and excluded counts |
| [Experiment 2, wage and food](results/2026-11-19-wage-food-breakeven.md) | Repository and commit; script SHA-256; Python version; failed and excluded counts. Game fields don't apply (a standalone budget model) |
| [Experiment 2b, Bakewell prices](results/2026-11-19-wage-food-2b.md) | Repository and commit; SHA-256 of the script, the experiment-2 module it imports and the input JSON; Python version; failed and excluded counts |
| [Experiment 3, planting late](results/2026-11-19-plant-late.md) | Repository not named; the result (1d7dd19) and its pre-registration (ab101c1) name different commits; game SHA-256; harness revision; browser and version; RNG; pairing beyond "no new random draw"; end-of-game settlement; completed, failed and excluded counts |
| [Experiment 4, herd store](results/2026-11-19-herd-store.md) | Repository not named; the result (c3f2ab0) and its pre-registration (23081c0) name different commits; game SHA-256; harness revision; a check against recorded gameplay; browser and version; settlement of the final herd and stores; completed, failed and excluded counts |

Read the reports with these cautions. Their text is kept as written:

- Experiments 1 and 2 head their pre-registered comparisons "Confirmatory results". That means planned in advance, not reproduced.
- Experiment 4 says the model "reproduced the game exactly". It reproduced an unmodified copy of the game run through the same harness, not the pinned run or recorded play.
- Experiment 1 quotes its pinned check in display rounding ("1,760 kcal | 1,410 kcal | … | 45% → 75%"); the code checks `[1764, 1411, …, 46, 73]`.
- Experiment 3 graduated into the game (planting late) while provenance-incomplete.
- The migrated models load the current `projects/02/index.html`, not the game version each report ran on, and no raw output was kept. A rerun tests today's game and is a new result.
- Some commands and links inside the reports and pre-registrations still use the original repository's paths (`research/models/`, `research/pre-registrations/`, `docs/`). The files are under `research/02/models/`, `research/02/pre-registrations/` and `research/02/notes/`.

## Migration provenance and status

[migration-manifest.json](migration-manifest.json) maps original paths and Git blobs to their new paths and SHA-256 checksums. At migration the source game blob matched the already published Week 2 game (`6506c48`); `projects/02/index.html` has since diverged (see [tests/02/README.md](../../tests/02/README.md)). Mechanical changes adapt paths, links, checker scope, and baseline-document lookup; model equations, numerical assertions, input numbers and scientific decisions are retained. Original preregistration timing is established by the pinned source repository history, not by this later migration commit.

Only checks and reruns explicitly listed in the manifest's verification section were performed for this migration. Carrying an old result into this folder does not mark it independently reproduced. The five dated result records are retained with migration status **provenance-incomplete** until their original run environments and complete model/output identity are established; the gaps are recorded in the manifest, not inserted retrospectively into the reports. The original repository remains the record for old issues, approvals, PR discussions, full history and superseded planning not needed by these artifacts.
