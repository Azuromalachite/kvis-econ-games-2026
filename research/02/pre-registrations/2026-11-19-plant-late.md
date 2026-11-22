# Pre-registration: does planting late give the Pleiades forecast decision value?
Date: 2026-11-19 · Project: Frost & Silver, Path B, experiment 3 · Verdict: PURSUE (accepted by the author 2026-11-19, before any computation)

## Seed observation (what sparked this)
Classroom feedback: the June forecast is easily ignored. It is right to ignore it. In the game a dry year multiplies
every zone by the same 0.75, so no allocation responds to the forecast. A forecast review measured this on the live game
(seeds 1–80, `ADVANCE_PLAN`, ranked by `betterOutcome`):
- the best of 400 chuño policies split by clear vs hazy ignores the forecast on all 80 seeds;
- knowing every drought in advance saves about 0.5 deaths;
- every wage crew added in hazy years costs lives.

The forecast's wording was corrected in the game (#45); the game was left frozen (Path A) by the author's decision.

## The idea
Orlove, Chiang & Cane (2000) report that farmers who saw a hazy Pleiades delayed and reduced their potato planting.
A **plant late** choice is the response the sources name, and the only lever tested so far that gives the forecast value.
A late planting loses less in a dry year and costs something in a normal one. The magnitudes are game values, not
Orlove's.

## Pilot already seen (declared; exploratory, not evidence)
The forecast review ran this lever before this file existed, on seeds 1–80 with `ADVANCE_PLAN`:

| dry-year loss if late / normal-year cost | never | always | late when hazy | perfect knowledge |
| --- | --- | --- | --- | --- |
| 10% / 5% | 18.9 | 19.8 | 14.3 (better on 31 seeds, worse on 12) | 10.7 |
| 10% / 8% | 18.9 | 28.7 | 16.2 | 10.7 |
| 12% / 10% | 18.9 | 35.7 | 18.1 | 11.6 |
| 15% / 7% | 18.9 | 28.6 | 17.7 | 13.2 |

(mean hunger deaths per game). The pilot shows the gain lives in a narrow band of costs. The 10%/5% cell was chosen
after seeing those numbers. **That is the forking path this experiment guards against.** Every confirmatory comparison
below uses seeds the pilot never touched, and a grid fixed now, not the pilot's best cell alone.

## Structure (the game's, plus one switch)
- **Model:** the game's model, read from `frost-and-silver.html` at main `ab101c1` and never changed. As in experiment 1,
  the page applies one textual replacement in `grow`:
  `(Y.drought ? .75 : 1)` → `(Y.drought ? (late ? 1 − dL : .75) : (late ? 1 − c : 1))`.
  `late` is set per harvest by the policy. No new `rnd()` draw, so every seed's weather is unchanged.
- **Policies:** never late (the game today); always late; late when hazy; late in dry years only (perfect knowledge,
  a ceiling nobody can choose).
- **Player:** `ADVANCE_PLAN`, applied before every harvest (as in experiment 1, S1). Secondary: the default plan with best
  land first at each re-plan (the pinned run's plan).
- **Grid (fixed now):** dry-year loss if late, `dL` ∈ {5, 10, 15, 20}%. Normal-year cost, `c` ∈ {2, 3, 5, 8, 10, 12}%.
  24 cells.
- **Seeds:** 81–400 (320 seeds, the holdout). Seeds 1–80 are reported separately as the pilot's replication.
- **Code:** `research/models/exp3-plant-late.html`, written after this file is committed.

## Analytic expectation (before any run)
In expected harvest (ignoring stores, the eating cap and the deaths' non-linearity), using the game's draw (P(dry) = .2,
3 in 7 hazy years dry, 1 in 13 clear years dry):
- late when hazy beats never iff `c < ¾ (0.25 − dL)` (hazy years: 3 in 7 dry);
- late when hazy beats always late iff `c > (0.25 − dL) / 12` (they differ only in clear years: 1 in 13 dry);
- always late beats never iff `c < ¼ (0.25 − dL)` (for reference).

So late when hazy beats both when `(0.25 − dL) / 12 < c < ¾ (0.25 − dL)`. For dL = 10% that band is 1.25–11.25%;
for dL = 20% it is 0.42–3.75%. "The analytic band" below means this interval. Deaths are not linear in harvest: hunger concentrates in bad years. So the band in
deaths can differ from the band in harvest. The pilot suggests its upper edge is lower.

## Outcomes
- **Interesting:** late when hazy beats both always and never across much of the analytic band, on holdout seeds. The
  forecast then has decision value in the game whenever this lever exists, and the claim does not rest on one tuned cell.
- **Boring / null:** the gain appears only at the pilot's cell, or shrinks below 2 deaths on the holdout. Worth knowing?
  **Yes.** It shows the forecast's value in the game would be a tuning artefact, which is a reason to keep the game as it is.
- **Dead:** late when hazy never beats never by 2 deaths in any cell on the holdout.

## Pre-registered prediction
- **At 10% / 5%, holdout seeds:** late when hazy has 3–6 fewer mean hunger deaths than never. Always late is within 2
  deaths of never.
- **Across the grid:** late when hazy beats both always and never (by ≥ 1 death each) in most cells inside the analytic
  band for dL = 5% and 10%. It does so in no more than one cell for dL = 20%. The upper edge of the winning band in deaths
  is at or below the analytic edge.
- **The lesson (experiment 1's test):** unchanged. With the lever at 10%/5% and late when hazy, food per person still
  falls under the colonial rules on every holdout seed.

## Decision rule (graduation, fixed now)
The lever is proposed to the author for the game **only if all four hold**:
1. at 10% / 5% on the holdout, late when hazy has **at least 2 fewer** mean hunger deaths than both never and always,
   and is better than never on more seeds than it is worse;
2. among the grid cells inside the analytic band for dL ∈ {5, 10, 15}%, late when hazy beats both by ≥ 1 death in
   **at least half**. These are 14 cells: dL 5% with every c; dL 10% with c 2–10%; dL 15% with c 2–5%. So at least 7
   must pass. Otherwise the value is a tuning artefact;
3. the lesson holds on every holdout seed, as above;
4. the same ordering (late when hazy best) holds for the secondary player, the default plan.

If any fails, the game keeps its copy-only forecast (#45), and the result is recorded here.

Graduation still needs rule 6 of `research/README.md`: one sentence a class can follow, a claim in the registry for
the direction (Orlove et al. 2000: delayed and reduced planting after a hazy Pleiades, recorded with its access level),
the magnitudes labelled game figures, a CI check that late when hazy beats both always and never, and the author's
agreement. A graduated lever moves the pinned run only if the pinned play uses it. The proposal must say which.

## Confirmatory comparisons (frozen)
- Mean hunger deaths, holdout seeds, `ADVANCE_PLAN`, for the four policies in all 24 cells.
- Seeds better / worse than never, for late when hazy, in all 24 cells.
- The lesson test at 10% / 5%.
- The ordering for the default plan at 10% / 5%.

## Forking-paths guard
- The pilot's numbers are above, and the 10% / 5% cell is named as chosen after seeing them.
- The holdout seeds, the grid, the policies, the 2-death and 1-death margins and the half-of-band rule are fixed here.
- The chuño and wage policies already tested are not re-searched. No other lever is added in this experiment.
- Food after 1573 and welfare are reported for every cell as secondary outcomes; neither decides.

## Exploratory (reported as such)
- A finer grid near the band edges.
- Late planting combined with a chuño split by forecast.
- A tally a class could pool on one `?seed` (how often hazy years turned dry), to test whether six harvests can teach
  the forecast's odds.

## Limits stated in advance
- Every magnitude is a judgement; Orlove et al. support the direction of the practice, not these numbers.
- The game's drought is uniform across zones, and its forecast odds are play values.
- The result is about this model's decision space. It cannot show how much late planting saved anyone in the 1500s.

## Verdict & reasoning
Recommended: **PURSUE.** The test costs minutes, the holdout and the band rule separate a robust lever from a tuned one,
and either answer settles a live classroom question: why the forecast is there if nothing responds to it.

## Deviations (append-only, dated)
(none yet)
