# Pre-registration: when does work at Potosí raise a household's food?
Date: 2026-11-19 · Project: Frost & Silver, Path B, experiment 2 · Verdict: PURSUE (accepted by the author 2026-11-19, before any computation)

## Seed observation (what sparked this)
From an outside assessment (pasted 2026-11-18): "When would voluntary work at Potosí improve rather than reduce
household food security?", with the smallest informative test: "Break-even household budget using documented wages,
provisions, and expenses." And from the game itself: wage crews raise GDP and cut tribute, but their pay can never buy
food, which the assessment named as the limitation that "remains".

## The idea
A one-household, one-season budget, kept apart from the game, that asks whether a worker's season at Potosí leaves
the household with more food or less than if he had farmed at home. It uses the documented wage and expense figures
recorded in `docs/processing-income-spec-2026-11-18.md` (Bakewell 1984), the accounting contract in its section B,
and judgement ranges (labelled as such) for what no source in the repository gives.

## Structure (Path B: not the game's)
- **Unit:** one household; one adult worker; one season of 26 weeks, the Godoy estimate's period.
- **Household food change over the season** (kcal):
  `Δfood = cash_net × kcal_per_real + ration_saved − farm_forgone`, where
  - `cash_net = wage_per_week × weeks_paid − cost_per_week × 26` (reales); a negative value is food the household must
    give up or borrow to cover his costs, so it counts against food at the same price;
  - `ration_saved` is the worker's food the household no longer provides while he is away;
  - `farm_forgone` is the food his labour would have grown at home that season.
- **Three cases (fixed now):**
  - **Compulsory mita:** 20 reales a week (Bakewell; the Godoy wage of 65 pesos per six months).
  - **Hired ore cutter:** 56–72 reales per five-day week (Bakewell pp. 124–125).
  - **Mixed:** mita weeks plus hired work in the rest week, as a fixed share: one week in three hired, the rest mita.
- **Not modelled:** substitute payments (who pays whom is unchecked); ore rights and their sale; debt beyond the
  season; family members travelling with him; prices away from Potosí.

## Parameters (ranges fixed before any computation)

| parameter | range | basis |
|---|---|---|
| weeks paid, of 26 | 18–26 | judgement (travel, illness, unpaid days); no source in the repo |
| hired wage | 56–72 reales per week | Bakewell pp. 124–125 (a five-day week) |
| worker's own costs in Potosí | 46–77 reales per week | Godoy's 200 pesos 1 real over six months = about 61.6 reales a week, ±25%; pesos of 8 reales is an inference (spec) |
| food price, kcal per real | 300–650 | judgement around the price Godoy implies: 120 pesos of staples over 182 days for a ration of 2,000–3,000 kcal a day gives about 380–570 kcal per real; widened |
| worker's ration saved at home | 2,000–3,000 kcal a day while away | judgement |
| farm output forgone | 0.5–1.0 million kcal a season | judgement: a household of five fed at 1,700–1,900 kcal a day for 182 days, with the worker's labour 30–60% of it |

Draws: 1,000 Latin-hypercube draws from these ranges (fixed generator seed 20261119), the same draws for every case.

## Outcomes
- **Interesting:** hired work raises the household's food in a large share of the box (50% or more), so the game's
  "wages never buy food" rule removes a real route by which work at Potosí could help.
- **Boring / null:** compulsory service lowers household food in almost every draw and hired work raises it in a
  minority. Worth knowing? **Yes**: it would give the game's rule a documented basis within these ranges, and the
  break-even price shows exactly which missing figure (p. 104's prices) would change it.
- **Dead (for wages as a food route in this model):** hired work lowers household food in every draw.

## Execution proxies
1. **Cheapest decisive experiment:** the formula over 1,000 draws × 3 cases, in a browser page or a short script:
   seconds.
2. **Baselines a hostile reviewer would demand:**
   - compulsory mita as the reference case;
   - the break-even food price per case: the kcal per real at which Δfood = 0 for the median draw of the other
     parameters, reported alongside the shares;
   - one-at-a-time sensitivity of Δfood to each parameter (reported as diagnostic);
   - a check that the arithmetic reproduces the Godoy case: 26 weeks at 20 reales = 65 pesos.
3. **Most likely null and how detected:** hired work raising household food in fewer than half the draws; read
   directly from the share.
4. **Cost:** seconds; no cluster.

## Pre-registered prediction
- **Predicted result:**
  - compulsory mita: Δfood < 0 in at least 95% of draws (wages cover about a third of his own costs);
  - hired ore cutter: Δfood > 0 in 10–35% of draws, only with many paid weeks, low costs and high kcal per real;
  - mixed: between the two, Δfood > 0 in under 10% of draws;
  - break-even price for hired work: above the middle of the range (more than about 475 kcal per real).
- **Decision rule:**
  - hired work raises food in **50% or more** of draws → wages are a plausible food route in this model. Record it,
    and consider a graduation proposal for the game only after experiment 2b (below) and the author's agreement;
  - **10–50%** → conditional: report the conditions (break-even price, weeks paid, costs) and keep the game's rule,
    labelled as a simplification with this result as its basis;
  - **under 10%** → within these ranges wages do not compensate for the farm labour lost; record it as support for the
    game's rule, within these ranges.
- **Confirmatory comparisons (frozen):**
  - the share of draws with Δfood > 0, for each of the three cases;
  - the break-even food price for each case.
- **Experiment 2b (also pre-registered now, run later):** once a reader transcribes the 1603 purchasing-power figures
  (Bakewell pp. 102–104) into the registry, re-run with that price (each food separately, never one basket, as the
  spec requires). Prediction: the verdict band above does not change.
- **Forking-paths guard:**
  - the wage figures and the Godoy costs are the sources' and the spec's, not chosen for the result;
  - the four judgement ranges, the mixed-case share (one week in three) and the 26-week season are fixed here, before
    any computation, and are labelled judgement in the results;
  - the decision thresholds (10%, 50%) are fixed here;
  - nothing is chosen on the outcome.
- **Exploratory (reported as such):** a longer season, or two workers per household; the effect of counting negative
  cash as debt carried forward rather than food given up.
- **One-sentence finding (drafted before running):** "In a one-household budget built on Bakewell's wages and the
  Godoy costs, a season of compulsory service lowered the household's food in A% of draws and a season of hired ore
  cutting raised it in B%, breaking even at about C kcal per real."

## Limits stated in advance
- Godoy's estimate is from 1608, for one worker, and later than the game's period; it is not a household sample.
- Every food price in the box is a judgement until p. 104 is transcribed (experiment 2b).
- Farm output forgone is a judgement; the game's own yields are themselves uncalibrated.
- The result is about this budget model, not about what households in the 1500s ate.

## Verdict & reasoning
Recommended: **PURSUE**. The null is worth knowing (it gives the game's rule a stated basis, or names the missing
figure that would overturn it), the test costs seconds, and experiment 2b turns the remaining judgement into a
documented comparison.

## Deviations (append-only, dated)
(none yet)
