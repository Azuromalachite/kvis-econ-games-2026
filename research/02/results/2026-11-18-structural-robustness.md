# Results: does the lesson survive the game's structural choices?
Experiment 1 · run 2026-11-18 on the game at main `575a7a5` · pre-registration:
[`../pre-registrations/2026-11-18-structural-robustness.md`](../pre-registrations/2026-11-18-structural-robustness.md)
(committed and accepted before the run) · code: [`../models/exp1-structural.html`](../models/exp1-structural.html)

## Finding
Across the 18 November sweep's 500 settings of the game's ten unsourced constants, the lesson (GDP per person up at
least 3 index points and food per person down at least 50 kcal a day, Inca harvests to colonial harvests, averaged
over weather seeds 1–40) held in **88%** of settings for the default player and **78%** for a player using the plan
chosen in advance. Re-counting tribute every colonial harvest moved these to **81%** and **72%**. Under the decision
rule fixed beforehand, every cell is at two thirds or more: **the lesson is robust to these two structural choices.**
Next: experiment 2 (wages and food markets).

This is a result about the model. It shows that the game's lesson does not hinge on the player's plan or on fixed
quotas, within the ranges tested; it does not show what happened in the 1500s.

## Confirmatory results (frozen comparisons)

| cell | lesson holds | predicted | colonial rules cut food by ≥ 50 kcal | predicted |
|---|---|---|---|---|
| baseline (default plan, fixed tribute) | **88%** | 88% (must lie in 85–91%) | 100% | ≥ 95% |
| S1: plan chosen in advance | **78%** | 75–95% | 98% | ≥ 95% |
| S2: tribute re-counted each harvest | **81%** | 55–80% (**missed, just above**) | 100% | ≥ 95% |
| S1 + S2 | **72%** | 45–75% | 97% | ≥ 95% |

The baseline reproduced the sweep's update (88%, rules cut food in 100%), and the game passed its pinned-run check
(`1,760 kcal | 1,410 kcal | 74 → 52 | 103 | 109 | 45% → 75%`, GDP reading split 75 / 5) before any switch was read.

**One prediction missed.** I expected re-counting tribute to matter more (55–80%); it moved the share only from 88%
to 81%. The fixed quota bearing down on fewer people is a smaller part of the food fall than predicted: the mita's
lost labour and resettlement carry most of it.

## Paired, per draw (how each switch moves the same setting across the line)

| switch | lesson held, then not | did not hold, then did |
|---|---|---|
| S1 (plan chosen in advance) | 63 | 14 |
| S2 (tribute re-counted) | 36 | 0 |
| S1 + S2 | 93 | 10 |

Re-counting tribute never creates the lesson where it was absent; it only removes it from 36 settings, all where the
food fall was small to begin with. The better plan moves settings both ways.

## Spread (5th percentile, median, 95th percentile over the 500 settings)

| cell | GDP change over time (index points) | food change over time (kcal a day) |
|---|---|---|
| baseline | +3.9, +8.2, +12.2 | −528, −221, −16 |
| S1 | +3.2, +7.5, +11.7 | −504, −174, +35 |
| S2 | +3.9, +8.2, +12.2 | −443, −165, +17 |
| S1 + S2 | +3.2, +7.5, +11.6 | −413, −139, +60 |

GDP rises in 96–98% of settings in every cell; where the lesson fails it is almost always because food does not fall
by 50 kcal, not because GDP does not rise.

## Exploratory (chosen before running, reported as exploratory)

| cell | lesson holds | GDP rises | food falls |
|---|---|---|---|
| "Keep the same shares" at each re-plan, fixed tribute | 78% | 81% | 97% |
| "Keep the same shares", tribute re-counted | 76% | 81% | 95% |

With the shares kept, food falls more often but GDP rises less often: the GDP rise owes part of itself to retreating
to the best land, as the 18 November sweep found.

## What this does not test
- **Wages that buy food, and any food market.** Experiment 2.
- **The weather model:** frost always from the top, independent zones, fixed odds. Spatially correlated losses by
  height are open question 7 in `docs/history-and-evidence.md`.
- **The ranges themselves.** They are the sweep's, set by judgement; a different range could move the shares.
- **Households.** The model has one community; inequality inside it is not represented.
- **The thresholds** (3 index points, 50 kcal) are the game's own and were not varied.

## Deviations
None. The run followed the frozen plan.
