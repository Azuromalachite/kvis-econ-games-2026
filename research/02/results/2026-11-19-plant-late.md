# Results: does planting late give the Pleiades forecast decision value?
Date: 2026-11-19 · Experiment 3 · Pre-registration: [2026-11-19-plant-late.md](../pre-registrations/2026-11-19-plant-late.md)
(merged in #46, accepted by the author before any computation) · Model: [exp3-plant-late.html](../models/exp3-plant-late.html)
on the game at main 1d7dd19 · Run: 31 s in a browser, deterministic.

## Finding
In the game's model with one added choice, **planting late when the Pleiades rose hazy** is the best of the three
choosable policies. That holds at the pre-registered costs (10% dry-year loss when late, 5% normal-year cost) and in
9 of the 14 cost settings inside the band derived before the run. All four graduation conditions hold. The lever goes to
the author as a proposal for the game. It does not enter the game by this result alone (rule 6).

One sentence a class could follow: *"A hazy Pleiades means a dry year about 3 times in 7; planting late loses a little
in a normal year and much less in a dry one, so it pays to plant late only when the Pleiades are hazy."*

## Checks before any comparison
- With planting never late, the model reproduces the pinned run: `1764, 1411, 74, 52, 103, 109, 46, 73`.
- `ADVANCE_PLAN`, never late, seeds 1–80: **18.87** mean hunger deaths, against the pilot's recorded 18.9.
- The pilot's four cells replicate on seeds 1–80 (table below), within rounding of the forecast review's figures.

## Decision rule (as pre-registered)

| rule | threshold | result | pass |
| --- | --- | --- | --- |
| 1. 10% / 5%, holdout | late when hazy ≥ 2 fewer deaths than never and always; better on more seeds than worse | 14.54 vs never 20.63 and always 19.19; better on 153 seeds, worse on 49 (equal on 118) | yes |
| 2. the band | ≥ 7 of the 14 in-band cells beat both by ≥ 1 death | 9 of 14: 5/5, 5/8, 5/10, 5/12, 10/5, 10/8, 10/10, 15/3, 15/5 | yes |
| 3. the lesson | food falls under the colonial rules on every holdout seed | 320 of 320 (graded "fall") | yes |
| 4. default plan | late when hazy has the fewest deaths | 35.16 vs never 44.12, always 42.58 | yes |

**Graduate: yes** (a proposal to the author; see "What graduation still needs").

## Predictions against results

| prediction (written before the run) | result | |
| --- | --- | --- |
| 10% / 5%: late when hazy 3–6 fewer deaths than never | 6.09 fewer | **missed, slightly high** |
| 10% / 5%: always late within 2 deaths of never | 1.44 fewer | hit |
| beats both by ≥ 1 in most in-band cells for dL 5% and 10% | dL 5%: 4 of 6; dL 10%: 3 of 5 | hit |
| beats both by ≥ 1 in no more than one cell for dL 20% | two cells (20/2, 20/3) | **missed** |
| the deaths band's upper edge is at or below the analytic edge | above it: 10/12 and 15/8 lie outside the analytic band and still beat both by ≥ 1 | **missed** |
| the lesson unchanged | 320 of 320 | hit |

The band in deaths is shifted **upward** from the band in expected harvest. At low costs (5/2, 5/3, 10/2), always late does
better than late when hazy, because insurance that cheap is worth buying every year. At the upper edge, late when hazy
keeps helping a little past the analytic limit. The pilot (seeds 1–80) had suggested the opposite at the upper edge
(12/10 lost there); on the 320 holdout seeds it does not. That is why the margins were set on holdout seeds.

## Holdout grid (seeds 81–400, `ADVANCE_PLAN`, mean hunger deaths per game)

Food is kcal a day after 1573; welfare is the game-average Caloric Welfare Index. "better/worse" counts seeds where late
when hazy lost fewer / more people than never (whole people). Never late was the game at the time of this run: 20.63 deaths, 1,526 kcal,
welfare 63.7.

| dL / c | in band | always | late when hazy | perfect knowledge | better / worse | food (hazy) | welfare (hazy) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 5 / 2 | yes | 9.46 | 11.26 | 7.53 | 165 / 34 | 1,603 | 68.6 |
| 5 / 3 | yes | 10.84 | 11.65 | 7.53 | 164 / 37 | 1,599 | 68.3 |
| 5 / 5 | yes | 15.20 | 12.48 | 7.53 | 161 / 47 | 1,589 | 67.5 |
| 5 / 8 | yes | 24.29 | 14.15 | 7.53 | 152 / 75 | 1,572 | 66.1 |
| 5 / 10 | yes | 29.90 | 15.42 | 7.53 | 149 / 84 | 1,560 | 65.2 |
| 5 / 12 | yes | 36.07 | 16.79 | 7.53 | 137 / 92 | 1,548 | 64.3 |
| 10 / 2 | yes | 12.17 | 13.08 | 9.75 | 164 / 37 | 1,582 | 67.0 |
| 10 / 3 | yes | 14.07 | 13.52 | 9.75 | 164 / 38 | 1,577 | 66.6 |
| **10 / 5** | yes | 19.19 | **14.54** | 9.75 | 153 / 49 | 1,567 | 65.9 |
| 10 / 8 | yes | 28.04 | 16.47 | 9.75 | 136 / 79 | 1,550 | 64.6 |
| 10 / 10 | yes | 33.41 | 17.82 | 9.75 | 128 / 91 | 1,538 | 63.7 |
| 10 / 12 | no | 39.96 | 19.29 | 9.75 | 120 / 101 | 1,526 | 62.8 |
| 15 / 2 | yes | 15.96 | 15.53 | 12.88 | 147 / 41 | 1,560 | 65.5 |
| 15 / 3 | yes | 18.03 | 16.07 | 12.88 | 145 / 42 | 1,555 | 65.1 |
| 15 / 5 | yes | 22.93 | 17.14 | 12.88 | 131 / 56 | 1,545 | 64.4 |
| 15 / 8 | no | 31.77 | 19.03 | 12.88 | 119 / 87 | 1,528 | 63.2 |
| 15 / 10 | no | 37.70 | 20.43 | 12.88 | 103 / 107 | 1,516 | 62.4 |
| 15 / 12 | no | 44.66 | 21.96 | 12.88 | 97 / 128 | 1,504 | 61.5 |
| 20 / 2 | yes | 19.43 | 18.16 | 16.28 | 124 / 46 | 1,540 | 64.5 |
| 20 / 3 | yes | 21.39 | 18.65 | 16.28 | 123 / 49 | 1,535 | 64.2 |
| 20 / 5 | no | 26.42 | 19.69 | 16.28 | 98 / 63 | 1,525 | 63.5 |
| 20 / 8 | no | 35.88 | 21.72 | 16.28 | 74 / 129 | 1,508 | 62.3 |
| 20 / 10 | no | 41.98 | 23.21 | 16.28 | 65 / 149 | 1,496 | 61.4 |
| 20 / 12 | no | 48.78 | 24.83 | 16.28 | 62 / 160 | 1,484 | 60.6 |

## Pilot replication (seeds 1–80, `ADVANCE_PLAN`; exploratory, already seen)

| dL / c | never | always | late when hazy | perfect | better / worse |
| --- | --- | --- | --- | --- | --- |
| 10 / 5 | 18.87 | 19.84 | 14.33 | 10.68 | 31 / 12 |
| 10 / 8 | 18.87 | 28.71 | 16.16 | 10.68 | 27 / 20 |
| 12 / 10 | 18.87 | 35.74 | 18.14 | 11.64 | 24 / 30 |
| 15 / 7 | 18.87 | 28.60 | 17.71 | 13.23 | 25 / 24 |

## Default plan (best land first at each re-plan), holdout, 10% / 5%
Never 44.12 · always 42.58 · late when hazy **35.16** · perfect knowledge 27.04 deaths; late when hazy better than never on
188 seeds, worse on 81; food after 1573 1,362 → 1,406 kcal.

## What this does and does not show
- It shows that, **in this model**, a late-planting choice gives the forecast decision value across a range of costs, not
  only at one tuned setting. At 10% / 5% it closes 56% of the gap between ignoring the forecast and knowing the weather (6.09 of 10.88 deaths).
- The size of every effect follows from judged magnitudes (dL, c); Orlove et al. support the direction of the practice
  only. The game's drought is uniform across zones, and its forecast odds are play values.
- It says nothing about how much late planting saved anyone in the 1500s.
- Deviations from the pre-registration: none. The page also reports, for every cell, the lesson count for "never" and
  the per-seed comparison against "always". Both were computed and are not used in the decision.

## What graduation still needs (rule 6; the author decides)
1. The author's agreement.
2. A registry claim for the direction of the practice (Orlove et al. 2000, with its access level). The magnitudes go in as
   `game_assumption`s labelled game figures.
3. A CI check that late when hazy beats both always and never at the chosen costs.
4. A statement of whether the pinned run uses the choice. If the toggle defaults to off and the pinned play never touches
   it, the pinned run, `ADVANCE_PLAN`'s figures and the plan grid stay as they are. If the plan grid gains a "late when
   hazy" option, the hindsight numbers and the end screen's 42-of-80 note move and must be re-measured.

## Updates after this result (dated)
- **2026-11-19, #48:** planting late graduated into the game as a per-harvest toggle, off by default.
- **2026-11-19, #51:** every tested plan now plants late when hazy. As point 4 above anticipated, the hindsight
  figures and the end screen's changing-plan note were re-measured: the changing plan now beats the hindsight best on
  53 of 80 seeds (42 before). The numbers in this file are unchanged: they describe the model as it was run.
