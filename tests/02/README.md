# Frost & Silver checks (`projects/02`)

Imported from [Frost & Silver at `d64a632`](https://github.com/Azuromalachite/frost-and-silver-game/tree/d64a632eaa78e2bc33f9cc4fd1726266f68ac246). The source `frost-and-silver.html` and this repository's `projects/02/index.html` have the same Git blob, `6506c48aa6777ed0c0c7adb6c44b9ebc7c864288`. This migration does not edit the game or its model assertions.

## Run from the repository root

Use Node and Python 3. The evidence checker needs PyYAML 6.x (6.0.2 or later; 6.0.3 has wheels for Python 3.14); the game, Node check, syntax check and standalone wage experiments do not need it. Install the Python test dependency in an isolated test environment, not in the playable game. Substitute your Python 3 executable if it is not named `python3`.

```sh
python3 -m pip install -r tests/02/requirements.txt
python3 research/02/evidence/check_evidence.py
python3 -m unittest discover -s tests/02 -v
python3 tests/02/check_syntax.py
node tests/02/review_model.cjs
node tests/02/review_model.cjs --self-test
```

The Node model check includes a strategy-grid benchmark and can take minutes. Its self-test repeats selected heavy checks for targeted mutations. Run it explicitly; this migration does not install or enable a CI workflow or automatically run all research sweeps.

## What is checked

- **Evidence structure:** claim IDs, source-reading levels, source use, labels, source-page anchors and named constants. The checker reads the real `projects/02/index.html` and scans only Week 2 Markdown, not other games' research. A clean exit does not establish historical truth; the checker still reports claims resting on unread sources.
- **Checker sensitivity:** each inherited planted defect must fail for its own reason, then pass with its targeted rule disabled. The additional isolation case confirms another week's claim IDs do not affect this registry.
- **Chuño audit:** recomputes derived quantities from recorded inputs, retains the internally inconsistent row's exclusion, and catches altered values and exclusion flags. It does not independently verify the original thesis.
- **JavaScript syntax:** parses the real inline script with Node; an unescaped apostrophe must fail, and a file without a script must be rejected. Temporary files stay outside the repository.
- **Model regression:** evaluates the real game's script with a minimal DOM stand-in. It checks the inherited pinned run, weather/replay, welfare accounting, re-planning, planting late, preset benchmarks, strategy comparisons and published mean table. All numerical assertions are retained. The self-test plants 15 model changes and two documentation mismatches.

## Pinned display contract

Seed `12345`, default plan, manual Next step, choosing **Best land first** at each re-plan:

`1,760 kcal | 1,410 kcal | 74 → 52 | 103 | 109 | 45% → 75%`

The test checks this display contract here and the source README's default-plan mean table below (seeds 1–80, Best land first, display rounding retained):

| Metric | Inca harvests | Colonial harvests |
| --- | --- | --- |
| Food available per person per day | ~1,675 kcal | ~1,385 kcal |
| Caloric Welfare Index | ~64 | ~46 |
| GDP per person, index | ~102 | ~109 |

These are live regression contracts, not historical measurements. The documentation self-test binds only to this file; nothing here checks the student-facing numbers in `research/02/notes/`. The [imported upstream README snapshot](../../research/02/source-context/game-readme.md) preserves the earlier published context and should not be rewritten when a future game changes. A deliberate model change must update the affected assertions and this current contract together; never change them simply to hide a failure.

## Browser checks and research tools

Serve the repository root and open [run_model_check.html](run_model_check.html) for the browser implementation of the model check. Node remains the reference. On 2026-11-22 an independent reviewer ran this page from a local server: Check passed and the self-test caught all 15 planted model changes and both documentation mismatches. The [imported manual smoke checklist](manual-smoke.md) is a dated source record, not evidence that browser testing has been repeated here.

The strategy, sensitivity and weather-selection tools and alternative models are under [research/02](../../research/02/README.md). They load the current Week 2 page; rerunning them on a later game revision yields a new result, not the old report automatically reproduced.

**Not covered by the headless checks:** actual browser layout, keyboard focus, animation/timers, pop-up behavior, clipboard interactions, font rendering or printed pagination. No changes to those features are made by this migration.
