# Results: does a herd kept as a living food store change outcomes, strategies or the lesson?
Date: 2026-11-19 · Experiment 4 · Pre-registration: [2026-11-19-herd-store.md](../pre-registrations/2026-11-19-herd-store.md)
(merged in #49, accepted by the author before any computation) · Model: [exp4-herd-store.html](../models/exp4-herd-store.html)
on the game at main c3f2ab0 · Run: 22 s in a browser, deterministic.

## Finding
A herd eaten in hungry years saves many lives in this model: at the reference cell, slaughtering to keep intake at
1,500 kcal cut mean hunger deaths over 12 years from 63.2 to between 28.4 and 43.8, depending on the floor kept.
**But keeping a breeding core never paid**: the best floor was 0 (eat the whole herd if needed) in all 18 cells.
The herd regrows too slowly over nine colonial years, with half the people left to tend it, for breeding stock to repay
what it costs in lives now. Rule 3 fails, so **the herd stock does not graduate**: the game keeps the Puna as a crop zone.

The pre-registration named this outcome in advance: the best floor being 0 "says that the 12-year horizon is too short
for breeding stock to matter. It is a reason to keep herds out of a six-harvest game." Rule 2 passing in every cell
says the value lies in the store, not in the herd's growth. In rule 3's words, "a one-off 'slaughter in a bad year'
button would do". That would need its own experiment and the author's agreement. It is not proposed here.

## Reproduction check (rule 1)
With 1-year blocks, no slaughter and d = 0, the model reproduced the game exactly. It compared intake, population,
stores, GDP, welfare, tribute and silver for every harvest of both players on seeds 1–400: 33,600 values, maximum
difference 0. The six textual replacements change nothing when the herd does nothing.

## Decision rule (as pre-registered)

| rule | threshold | result | pass |
| --- | --- | --- | --- |
| 1. reproduction | the 1-year-block check | exact on 33,600 values | yes |
| 2. buffer | some floor beats P0 by ≥ 2 mean and ≥ 4 worst-decile deaths in ≥ 9 of 18 cells | 18 of 18 (every floor, every cell) | yes |
| 3. breeding core | best floor above 0 in ≥ 6 of the 12 cells with r ≤ 0.20 | 0 of 12 (and 0 of 18) | **no** |
| 4. lesson | food falls under the colonial rules on every seed, every policy | 400 of 400 in every cell and policy | yes |

**Graduate: no.**

## Predictions against results

| prediction (written before the run) | result | |
| --- | --- | --- |
| P0 check passes | exact | hit |
| reference cell (r .20, M 60, d .15), P1 f = .25 vs P0: 3–10 fewer mean deaths | 28.0 fewer (63.21 → 35.19) | **missed, far larger** |
| …worst-decile fall at least twice the mean fall | 30.3 against 28.0 | **missed** |
| f = .25 or .5 beats f = 0 in at least half the cells with r ≤ .20 | 0 of 12 | **missed** |
| f = 0 best when r = .30 | best in all 6 | hit |
| P2 worse than P1 in mean deaths in every cell with r = .10 | worse than every floor in all 6 | hit |
| the lesson holds on every seed under every policy | 400 / 400 everywhere | hit |
| GDP gap: under P1 colonial GDP within 1 index point of P0 while food is higher | 111.32 vs 111.48, food 1,511 vs 1,458 kcal | hit |

The size missed because the herd's food value is large next to the shortfalls. Even the smallest setting
(M = 30 days for the whole community) covers many of the hungry years, which drive the deaths. The floor missed because
regrowth is slow: after 1573 the herding labour (`tend`) is about 0.4, half the people less the mita's share. From a
floor of 0.25, r = 0.30 adds about 0.02 of K a year, so nine years cannot replace what the floor held back.

## The grid (`ADVANCE_PLAN` with planting late when hazy; seeds 1–400; 12 years)

Mean hunger deaths / mean over the worst 40 seeds (each policy's own worst decile). P0 is 63.21 / 142.56 in every cell:
neither player puts a crew in the Puna, so a herd that is never eaten changes nothing. "Herd" is the mean herd left at
the end (share of the 1500 carrying capacity; P0 ends at K = 0.85, or lower after dry years). P1 with f = .25 was
better than P0 on all 400 seeds in every cell.

| cell | f = 0 | f = .25 | f = .5 | P2 (20%/yr) | P3 | herd: f 0 / f .25 / P2 | food P0 → f .25 | GDP P0 → f .25 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| r .1 M 30 d 0 | 42.46 / 122.58 | 46.56 / 125.80 | 51.20 / 129.89 | 57.02 / 133.82 | 42.76 / 122.64 | 0.01 / 0.22 / 0.10 | 1,458 → 1,490 | 111.44 → 111.34 |
| r .1 M 30 d .15 | 44.46 / 124.54 | 49.00 / 128.70 | 53.93 / 133.45 | 57.99 / 135.34 | 44.96 / 124.92 | 0.01 / 0.20 / 0.07 | 1,458 → 1,484 | 111.45 → 111.36 |
| r .1 M 60 d 0 | 25.72 / 101.45 | 31.95 / 108.44 | 40.07 / 117.13 | 51.48 / 124.77 | 26.68 / 102.35 | 0.09 / 0.25 / 0.10 | 1,458 → 1,518 | 111.44 → 111.27 |
| r .1 M 60 d .15 | 29.36 / 106.15 | 36.72 / 114.68 | 45.38 / 124.41 | 53.33 / 127.86 | 30.59 / 107.48 | 0.06 / 0.22 / 0.07 | 1,458 → 1,508 | 111.46 → 111.30 |
| r .1 M 120 d 0 | 7.91 / 61.29 | 13.34 / 74.92 | 22.46 / 91.86 | 39.45 / 108.02 | 9.60 / 66.73 | 0.29 / 0.37 / 0.10 | 1,458 → 1,554 | 111.44 → 111.20 |
| r .1 M 120 d .15 | 11.74 / 71.69 | 19.83 / 88.23 | 32.09 / 107.16 | 42.92 / 113.40 | 13.94 / 75.64 | 0.20 / 0.29 / 0.07 | 1,458 → 1,540 | 111.48 → 111.25 |
| r .2 M 30 d 0 | 42.18 / 122.40 | 45.78 / 124.34 | 50.31 / 128.28 | 56.03 / 132.53 | 42.43 / 122.40 | 0.01 / 0.22 / 0.13 | 1,458 → 1,491 | 111.44 → 111.35 |
| r .2 M 30 d .15 | 43.96 / 124.28 | 48.13 / 127.45 | 53.05 / 132.18 | 57.11 / 134.24 | 44.43 / 124.62 | 0.01 / 0.21 / 0.09 | 1,458 → 1,486 | 111.46 → 111.37 |
| r .2 M 60 d 0 | 25.15 / 100.98 | 30.66 / 105.73 | 38.52 / 114.08 | 49.55 / 122.08 | 26.07 / 101.77 | 0.09 / 0.25 / 0.13 | 1,458 → 1,521 | 111.44 → 111.29 |
| **r .2 M 60 d .15** | 28.43 / 105.40 | 35.19 / 112.27 | 43.78 / 122.01 | 51.61 / 125.59 | 29.61 / 106.63 | 0.07 / 0.23 / 0.09 | 1,458 → 1,511 | 111.48 → 111.32 |
| r .2 M 120 d 0 | 7.42 / 59.61 | 11.98 / 69.76 | 20.53 / 86.31 | 36.23 / 103.60 | 9.11 / 65.28 | 0.31 / 0.39 / 0.13 | 1,458 → 1,557 | 111.44 → 111.24 |
| r .2 M 120 d .15 | 10.74 / 69.42 | 17.76 / 83.61 | 29.48 / 102.72 | 39.80 / 109.50 | 12.85 / 73.51 | 0.22 / 0.31 / 0.10 | 1,458 → 1,545 | 111.51 → 111.30 |
| r .3 M 30 d 0 | 41.91 / 122.27 | 45.02 / 122.92 | 49.47 / 126.80 | 55.02 / 131.21 | 42.11 / 122.21 | 0.01 / 0.23 / 0.17 | 1,458 → 1,493 | 111.44 → 111.35 |
| r .3 M 30 d .15 | 43.52 / 124.05 | 47.25 / 126.14 | 52.16 / 130.87 | 56.19 / 133.09 | 43.94 / 124.33 | 0.01 / 0.22 / 0.12 | 1,458 → 1,488 | 111.47 → 111.38 |
| r .3 M 60 d 0 | 24.62 / 100.54 | 29.44 / 103.08 | 37.09 / 111.35 | 47.36 / 119.08 | 25.51 / 101.22 | 0.10 / 0.26 / 0.17 | 1,458 → 1,523 | 111.44 → 111.30 |
| r .3 M 60 d .15 | 27.60 / 104.70 | 33.68 / 109.74 | 42.20 / 119.56 | 49.74 / 123.17 | 28.73 / 105.81 | 0.08 / 0.24 / 0.12 | 1,458 → 1,514 | 111.49 → 111.34 |
| r .3 M 120 d 0 | 6.98 / 57.91 | 10.82 / 64.98 | 18.89 / 81.37 | 33.08 / 99.44 | 8.65 / 63.76 | 0.33 / 0.40 / 0.17 | 1,458 → 1,559 | 111.44 → 111.28 |
| r .3 M 120 d .15 | 9.90 / 67.34 | 15.92 / 78.72 | 27.09 / 98.13 | 36.78 / 105.45 | 11.91 / 71.68 | 0.25 / 0.34 / 0.13 | 1,458 → 1,549 | 111.54 → 111.35 |

## Default plan (best land first at each re-plan), reference cell
P0 140.54 / 244.07 · P1 f 0 98.69 / 212.93 · f .25 107.54 / 218.36 · f .5 117.91 / 226.36 · P2 121.26 / 224.85 ·
P3 99.00 / 213.05. Same ordering as `ADVANCE_PLAN`: eat when hungry, keep no floor. Colonial food 1,237 → 1,311 kcal
(f .25), GDP index 110.40 → 110.15.

## How the model was built, where the pre-registration left room (declared)
- **P3 ("P1 with f = 0.25, knowing next year's weather")** did not say how foresight is used. As implemented, P3 keeps a
  floor of 0.5 when next year will be dry and 0 otherwise. Under this reading it is **not a ceiling**: it is slightly
  worse than P1 with f = 0 in every cell, because holding stock for a dry year costs lives this year and regrowth cannot
  repay it. P3 is in no decision rule.
- **Worst decile:** each policy's own 40 worst seeds.
- **Best floor:** the floor with the lowest mean deaths; a floor above 0 counts only if strictly lower than f = 0 to
  0.01. No cell was close: f = 0 led by at least 3 deaths everywhere.
- **The lesson's counterfactual** gets the same meat as the run (the same slaughter under Inca rules).
- **GDP:** herd growth is the natural increase (births) at farm value; dry-year losses and slaughter are not output.
- **Exploratory items** (blocks of 2 and 5 years, re-searching Puna crews, charqui) were **not run**.

## What this does and does not show
- In this model, a herd matters as a store to eat in hungry years, not as a capital stock to breed back. The six-harvest
  game's choice to treat the Puna as a crop zone costs the lesson nothing: the lesson held on every seed and policy.
- It is not evidence about herds in the 1500s. Every rate is a judgement, the herd food value dominates the effect,
  regrowth is gated by an assumed labour rule, and no age structure, disease or ownership is modelled.
- The finding depends on the horizon (9 colonial years) and on `tend`. A longer run or a different herding-labour rule
  could change rule 3. That would be a new pre-registration, not a re-reading of this one.
