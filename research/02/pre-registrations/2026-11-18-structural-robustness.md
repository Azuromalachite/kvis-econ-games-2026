# Pre-registration: does the lesson survive the game's structural choices?
Date: 2026-11-18 · Project: Frost & Silver, Path B, experiment 1 · Verdict: PURSUE (accepted by the author 2026-11-18, before any run)

## Seed observation (what sparked this)
From an outside assessment of the project (pasted 2026-11-18): "the original game is partly calibrated to
illustrate a known conclusion. A research simulation must be allowed to produce results that contradict its initial
hypothesis", and its first-priority question: "Is the GDP–food-security paradox robust? Sensitivity sweep over the
load-bearing economic assumptions, checking sign reversals."

## The idea
The 18 November sensitivity sweep (`docs/sensitivity-2026-11-18.md`) varied ten numeric constants within ranges set by
judgement, and the lesson held in 88% of 500 settings. It never varied the game's *structural* choices. This
experiment crosses the same 500 settings with two structural switches the reviews keep pointing at, and asks how
often the lesson still holds.

Since that sweep, the model's food and GDP have not changed (later changes touched welfare only), so simply
re-running it would reproduce 88%; that is why the switches are the experiment.

## The two switches (fixed now)
- **S1, the player.** The default plan (as the sweep used) versus the plan offered as chosen in advance
  (`ADVANCE_PLAN`: Valley terraces, one Inca chuño crew, best land first throughout). Question: does the lesson hold
  for a competent player, or only for one who leaves the default board?
- **S2, the tribute.** Tribute as a fixed total set at the 1573 count (the game's rule) versus tribute re-counted every
  colonial harvest: total = tribute per person × the population at that harvest. Question: is the food fall mostly
  the fixed quota bearing down on fewer people?

Four cells: baseline, S1, S2, S1 + S2. Re-plan: "Best land first" in every cell (the default plan's rule in the
sweep). Not in this experiment: wages buying food (that is experiment 2, which needs sourced wage and price ranges).

## Outcomes
- **Interesting:** one switch alone drops the share of settings where the lesson holds below one third, showing the
  lesson depends on that structural choice.
- **Boring / null:** the lesson holds in two thirds or more of settings in all four cells. Worth knowing? **Yes**:
  the lesson does not hinge on the player's plan or on fixed quotas, so the next effort should go to what the model
  leaves out entirely (markets, assets, households), not to tuning these.
- **Dead (for the lesson, not for Path B):** S1 + S2 together drop it below 10%, showing the lesson exists only for a
  default player under fixed quotas.

## Execution proxies
1. **Cheapest decisive experiment:** 4 cells × the sweep's 500 Latin-hypercube draws (same ranges, same generator
   seed) × weather seeds 1–40 = 80,000 games, headless, in the browser like `tools/sweep.html`.
2. **Baselines a hostile reviewer would demand:**
   - the baseline cell must reproduce the sweep's update (lesson in 85–91% of draws; rules cut food by 50 kcal or
     more in 100%) before any switch is read. If not, stop and find out why;
   - each switch alone, and both together;
   - the switches' effects reported per draw (paired), not only as shares, so a switch that helps some settings
     and hurts others is visible.
3. **Most likely null and how detected:** all four cells at or above two thirds. Detected directly from the shares.
4. **Cost:** about 1 ms per game: 2–3 minutes in a browser tab. No cluster.

## Pre-registered prediction
- **Predicted result:**
  - baseline: 88% (reproduction);
  - S1 (the advance plan): 75–95%. The plan grows more food under the Inca and after 1573, and silver still raises
    GDP;
  - S2 (re-counted tribute): 55–80%. The food fall shrinks, because tribute per survivor no longer rises after the
    collapse and the epidemics;
  - S1 + S2: 45–75%;
  - "the colonial rules cut food by 50 kcal or more": at least 95% of draws in every cell, because the mita's lost
    labour and the tribute remain.
- **Decision rule:**
  - all four cells at two thirds or more → the lesson is robust to these choices. Record it, and proceed to
    experiment 2 (wages and food markets);
  - any single switch below one third → the lesson is conditional on that choice. Register it as a game claim with
    its condition, tell the original author, and source that assumption before experiment 2;
  - anything in between → report the lesson as conditional, with the shares, and proceed to experiment 2.
- **Confirmatory comparisons (frozen):**
  - the share of draws where the lesson holds, in each of the four cells;
  - the share where the rules cut food by 50 kcal or more, in each cell.
- **Forking-paths guard:**
  - the thresholds (GDP up at least 3 index points, food down at least 50 kcal) are the game's existing ones, fixed
    before this experiment;
  - the ten ranges, the 500 draws, the generator seed and seeds 1–40 are the 18 November sweep's, not re-chosen;
  - `ADVANCE_PLAN` was chosen earlier on welfare and deaths, not on this outcome;
  - the re-count rule (full re-count every colonial harvest) is the simplest alternative, chosen before running.
    Partial or delayed re-counts are not tested;
  - nothing is chosen on the dependent variable.
- **Exploratory (reported as such):** the "Keep the same shares" re-plan in each cell; rank correlations of the ten
  constants with the outcome per cell.
- **One-sentence finding (drafted before running):** "Across 500 settings of the game's ten unsourced constants, the
  lesson held in A% for the default player and B% for a player using the plan chosen in advance; re-counting tribute
  every harvest moved these to C% and D%."

## Verdict & reasoning
Recommended: **PURSUE**. The null is worth knowing, the test is cheap (minutes), and it is the first test that can
come out against the game's lesson on structural grounds. It does not need new sources.

## Deviations (append-only, dated)
(none yet)
