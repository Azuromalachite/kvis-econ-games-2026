# Results: when does work at Potosí raise a household's food?
Experiment 2 · run 2026-11-19 · pre-registration:
[`../pre-registrations/2026-11-19-wage-food-breakeven.md`](../pre-registrations/2026-11-19-wage-food-breakeven.md)
(merged in #40 before any computation) · code: [`../models/exp2_wage_budget.py`](../models/exp2_wage_budget.py)
(pure Python, deterministic: `python3 research/models/exp2_wage_budget.py`)

## Finding
In a one-household, 26-week budget built on Bakewell's wages and the Godoy costs, a season of compulsory service
lowered the household's food in every one of 1,000 draws, and a season of hired ore cutting raised it in only
**3.4%**. There was no break-even food price at the middle of the ranges: there, the worker's own costs in Potosí
exceed his season's wages, so his net cash is negative and dearer food makes the household worse off, not better.
Under the decision rule fixed beforehand (hired work under 10%), **within these ranges, wages do not make up for the
farm labour lost; this supports the game's "wages never buy food" rule as a simplification, within these ranges.**

This is a result about one budget model, not about what households in the 1500s ate.

## Confirmatory results (frozen comparisons)

| case | Δfood > 0 | predicted | Δfood over the season, kcal (5th percentile, median, 95th percentile) | break-even kcal per real, at midpoints |
|---|---|---|---|---|
| compulsory mita (20 reales a week) | **0%** | ≤ 5% | −1,233,000, −837,000, −485,000 | none |
| hired ore cutting (56–72 reales a week) | **3.4%** | 10–35% (**missed, lower**) | −723,000, −382,000, −48,000 | none (**prediction failed**) |
| mixed (one week in three hired) | **0%** | < 10% | −1,053,000, −696,000, −348,000 | none |

The arithmetic reproduced the Godoy wage (26 weeks × 20 reales ÷ 8 = 65 pesos) before any case was read.

**Two predictions missed.**
- Hired work paid in 3.4% of draws, below the predicted 10–35%.
- I predicted a break-even price above about 475 kcal per real. In fact there is none at the midpoints, because the
  prediction assumed the worker clears cash after his own costs. At the midpoints he does not (64 reales × 22 paid
  weeks = 1,408 reales against 61.5 × 26 = 1,599 reales of costs). The price of food then works against him: the
  household must replace the shortfall in food.

## When hired work pays (diagnostic)
In the 34 draws where it paid, the worker's costs were 46–51 reales a week (the bottom of the range), the farm food
forgone was 0.50–0.56 million kcal (the bottom of its range), and he was paid for at least 21 weeks. One at a time,
the two parameters that move the result most are his costs in Potosí and the farm food forgone; the food price moves
it least.

## What this depends on, and does not show
- **The Godoy costs carry the result.** They are one 1608 estimate for a worker serving the mita, later than the
  game's period. Whether a hired ore cutter, often a longer-term resident, had costs this high is not known from the
  repository's sources. This is the figure most worth checking: if hired workers' costs were nearer 45 reales a week,
  the answer could change.
- **Every food price is a judgement** until Bakewell pp. 102–104 are transcribed (experiment 2b, pre-registered).
  Since the price mattered least here, 2b is unlikely to change the verdict unless costs also change.
- **Farm output forgone is a judgement,** and the game's own yields are uncalibrated.
- **Not modelled:** substitute payments, ore rights and their sale, debt carried across seasons, family members who
  went with him, women's earnings in town, and prices outside Potosí.

## Exploratory
None run. (A longer season and debt carried forward were listed as exploratory in the pre-registration; they are left
for a later run, so as not to look for a different answer after this one.)

## Deviations
None. The run followed the frozen plan. The break-even price was computed with the other parameters at their
midpoints (the medians of uniform ranges), as "the median draw of the other parameters" in the plan means.
