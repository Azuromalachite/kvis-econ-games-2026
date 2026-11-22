> Imported source-context snapshot from `d64a632eaa78e2bc33f9cc4fd1726266f68ac246`. This is a dated source record, not the monorepo operating policy. Use [the Week 2 index](../README.md) and [current test instructions](../../../tests/02/README.md). Only relative Markdown links were relocated below; original run commands and status statements retain their source context.

# Research models (Path B)

The teaching game (`frost-and-silver.html`) is frozen as a baseline: it teaches one lesson, that GDP per person can
rise while food per person falls, inside a small decision space. This folder is for the questions the evidence base
has opened that the game cannot answer, such as when paid work at Potosí improves a household's food, when spreading
fields across heights protects against a bad year, or when a community with enough food overall still has hungry
households.

These models are allowed, and expected, to contradict the game. The game was tuned to land near Maddison's
estimates, so agreeing with them proves nothing. A model here earns trust only by stating in advance what would show
it wrong.

## Rules

1. **Pre-register before running.** Each experiment starts as a file in `pre-registrations/`
   (`YYYY-MM-DD-<slug>.md`) with the question, the predicted result, a decision rule, the frozen comparisons and
   every threshold or range chosen. It is committed before any result exists. Later changes are appended as dated
   deviations, never edited in.
2. **Report every outcome,** including nulls and failures, in `results/`, next to the pre-registration it answers.
   Anything chosen after seeing results is labelled exploratory.
3. **Separate from the game.** Research code reads the game's model or copies what it needs; it does not change
   `frost-and-silver.html`. The game's CI and pinned run must not move because of work here.
4. **Evidence through the registry.** A parameter that comes from a source is a claim in `evidence/claims.yml` with
   its access level. A parameter that does not is a range chosen by judgement, written down as such in the
   pre-registration, never presented as historical.
5. **Model results are not history.** Every finding states the model and assumptions it holds under. A model can
   show that a conclusion depends on an assumption; it cannot show what happened in the 1500s without independent
   evidence.
6. **Graduation.** A mechanism moves into the game only if a pre-registered result here supports it, it can be
   explained to a class in a sentence, and the author agrees. The game then gets it as a minor upgrade with its own
   claim and CI check.

## What Path B may change

Research models are not bound to the game's structure. They may run more harvests, more crews or people, separate
households, markets or assets, wherever a question needs it (the author's decision, 18 November 2026). Each such
choice is written into that model's pre-registration with its reason, because it changes what can be compared:
more harvests mean more weather draws and more re-plans, and more people add something only if they differ (land,
herds, obligations). A model that changes the structure is compared with the game only on outcomes both can measure.

## Experiments

| # | question | status |
|---|---|---|
| 1 | Does the lesson survive the game's structural choices (the player's plan; fixed tribute)? | done: robust, all four cells ≥ 2/3 ([results](../results/2026-11-18-structural-robustness.md)) |
| 2 | When does work at Potosí raise a household's food? | done: hired work raised food in 3.4% of draws, mita in 0%; supports the game's rule within these ranges; the Godoy costs carry it ([results](../results/2026-11-19-wage-food-breakeven.md)). 2b [inputs transcribed](../notes/bakewell-purchasing-power-transcription-2026-11-19.md); [execution addendum](../pre-registrations/2026-11-19-wage-food-2b-execution.md). **2b done:** with Bakewell's 1603 prices mita stays at 0% for every food; hired work rises to 12.7% for potatoes (conditional band, prediction missed) and 7.0-7.9% for maize and charqui ([results](../results/2026-11-19-wage-food-2b.md)) |
| 3 | Does planting late give the Pleiades forecast decision value, robustly or only at a tuned cost? | done: robust; late when hazy saves about 6 deaths a game at 10% / 5% on holdout seeds and wins in 9 of 14 band cells; all four graduation rules pass; two predictions missed ([results](../results/2026-11-19-plant-late.md)). **Graduated** into the game by the author's decision, 2026-11-19 |
| 4 | Does a herd kept as a living food store change outcomes, strategies or the lesson? | done: eating the herd in hungry years cut deaths in every cell (63 to 28-44 at the reference cell), but keeping a breeding core never paid (best floor 0 in all 18 cells), so it does not graduate; the lesson held on every seed ([results](../results/2026-11-19-herd-store.md)) |

## Layout

| path | what |
|---|---|
| `pre-registrations/` | one file per experiment, frozen before running |
| `results/` | what each experiment found, linked to its pre-registration |
| `models/` | code for each experiment (browser pages or scripts, runnable without the game's CI) |
