# Sensitivity sweep, 18 November 2026

> **Update, later on 18 November 2026.** The silent trim described below is
> gone. When crews fall, the game now asks the player to re-plan: keep the plan's
> shares, put every crew on the best land first, or set them by hand.
> `tools/sweep.html` chooses "Best land first", which reproduces the old trim
> closely: GDP grading split 75 stay / 5 rise instead of 74 / 6; across the 500
> random settings the lesson now holds in 88% instead of 81%, and the colonial rules
> still cut food in all of them. Keeping the same shares gives colonial food of
> about 1,000 kcal and a 40 / 40 split. The analysis below was measured on the
> earlier version and is kept as measured.

**Question.** The game is tuned with about ten constants that no source fixes. Does
its lesson come from the history the game describes, or from those settings? And
when GDP per person rises over time, what in the model makes it rise?

**Short answer.** The lesson holds across most settings a teacher could defend.
The colonial rules cut food in every one of 500 random settings. GDP rising over
time while food falls holds in 81% of them. But the game's explanation of the GDP
rise was mostly wrong. It said the population collapse left "more land per
survivor". In the model that is about a quarter of the effect. Most of the rest
comes from how the board cuts a plan when crews are lost: it drops the chuño crews
and the highest fields first, so survivors farm only their best land. The game,
the README, the evidence document and `claim.game.gdp_rise_from_land` now say so.

Reproduce it: serve the repository root (`python -m http.server`) and open
`tools/sweep.html`. It runs in about 15 seconds and first checks that the
unchanged model still gives the pinned run and the 75/5 grading split (74/6 when this was written). If it
does not, the game has changed and this page needs re-measuring.

## What kind of analysis this is

The constants cannot be estimated from data. There are about ten, and only two
or three targets: Maddison's 416 and 438, and the unsourced 1,700 → 1,200 kcal.
With more free constants than targets, no value is pinned down by evidence. So
this is not a fit. It asks how robust a qualitative result is: across
plausible values, how often does the lesson hold, and which constants decide it?

## Method

- **The model.** The game's own script, run headless, as the CI model check does.
  Default plan, played with Next step. Each game is played on fixed weather seeds.
- **What was swept.** Ten constants, each over a range chosen by judgement, wide
  enough to cover any value a teacher might defend. The ranges are not sourced.

  | constant | game value | range |
  | --- | --- | --- |
  | land exponent (`ALPHA`) | 0.9 | 0.6–1.0 |
  | Inca labour duty | 10% | 5–20% |
  | share of the state harvest returned | 50% | 25–75% |
  | population fall before 1573 | 50% | 30–70% |
  | the 1585–91 epidemics | 15% | 5–25% |
  | tribute (kcal per person at the 1573 count) | 500 | 300–700 |
  | farm output's weight in GDP (`P`) | 0.045 | 0.03–0.06 |
  | silver path (multiplier) | 1 | 0.5–1.5 |
  | final resettlement loss | 15% | 5–25% |
  | chuño per crew | 120 | 80–160 |

- **Held fixed.** Frost and drought odds and losses, zone yields, the mita's one
  man in seven, crews per 1,000 people, the default plan. The GDP constant `G0`
  is also fixed, but it only sets the level, and only changes are compared.
- **Two designs.**
  - One at a time: each constant at seven points over its range, the rest at the
    game's values, seeds 1–80.
  - All at once: a Latin hypercube of 500 draws, uniform on each range, from a
    fixed generator seed, each played on seeds 1–40.
- **Outcomes**, averaged over the seeds:
  - change over time (Inca harvests to colonial harvests) in GDP per person
    (index points) and in food per person (kcal a day);
  - the colonial rules' own effect: the same people and weather under Inca
    rules, as the end screen computes it.

  "The lesson holds" means GDP rises at least 3 index points (the end screen's
  "stay" band) and food falls at least 50 kcal.

## Results

### Across all 500 settings

| result | share of settings | 5th percentile, median, 95th percentile |
| --- | --- | --- |
| the colonial rules cut food (by 50 kcal or more) | **100%** | −721, −368, −121 kcal |
| GDP per person rises over time (≥ 3 points) | 99% (100% rise at all) | +4.3, +8.7, +12.8 points |
| food per person falls over time (≥ 50 kcal) | 82% | −517, −194, +32 kcal |
| **both: the lesson** | **81%** | per seed, median 63% of seeds |
| the rules' own effect on GDP grades "stay" | 63% ("rise" 33%, "fall" 4%) | −2.9, +1.5, +6.6 points |

### What decides each outcome

Spearman rank correlation between each constant and each outcome, over the 500
draws. Only correlations of 0.3 or more are shown.

| outcome | constants that drive it |
| --- | --- |
| GDP change over time | silver +0.86, resettlement loss −0.37 |
| food change over time | tribute −0.64, land exponent −0.42, resettlement loss −0.42 |
| the rules' effect on GDP | silver +0.81, farm weight in GDP −0.43, resettlement loss −0.39 |
| the rules' effect on food | land exponent −0.59, tribute −0.55, resettlement loss −0.40 |

The Inca labour duty, the share returned, chuño per crew and the epidemics' size
each correlate below 0.2 with every outcome.

### Where the GDP rise comes from

At the game's settings GDP per person rises about 8.1 points over time. The
colonial rules account for about 1.5 points: silver minus the field labour the
mita takes. The other 6.5 points are not caused by the rules, and they vanish
without the deaths (0.9 points with no population fall). But they barely depend
on the land exponent: 7.6 points at 0.6, 6.2 at 1.0, where more land per
survivor adds nothing.

The cause is the board, not the land. When crews fall after 1573, the game trims
the plan to fit: chuño crews first, then the highest zones. In the default plan
the survivors keep valley and upper-field crews only. They stop making chuño,
and they farm only the most productive, least frost-hit land. Replacing the trim
with the 1500 plan scaled to the crews available separates the channels (seeds
1–80, non-rules GDP points):

| colonial plan | land exponent 0.6 | 0.9 (game) | 1.0 |
| --- | --- | --- | --- |
| trimmed (the game) | 7.6 | **6.5** | 6.2 |
| zone shares kept, chuño crews moved to the fields | 9.7 | 4.5 | 3.2 |
| zone and chuño shares both kept | 6.7 | **1.5** | 0.0 |

So at the game's settings:

| channel | GDP points |
| --- | --- |
| more land per survivor | about 1.5 |
| chuño crews moved to the fields | about 3.0 |
| retreating to the best zones | about 2.0 |

The last two follow from the trim order in `clampAlloc`, a rule for fitting a
plan to the board, which was never written as a claim about history.
"Survivors stopped storing food and fell back on their best fields" is a
plausible historical story, but nothing in this repository sources it. The game
now describes the mechanism as the model has it, and does not claim it as history.

The end screen's "reverse" panel uses a simplified formula with the land channel
only. It is a separate approximation, labelled as such, and it is not changed here.

## What this means for teaching

- **The core lesson is robust.** In every plausible setting tried, the colonial
  rules take food; in four of five, GDP rises while food falls. A teacher can say
  the lesson does not hinge on any single number the game chose.
- **What can make it fail.** Food stops falling over time when tribute is low
  (about 300 kcal per person), when the land exponent is low (strong gains from
  more land per survivor), or when the resettlement loss is small.
- **The "right" GDP prediction is fragile.** The game grades "stay" as correct
  for the colonial rules' effect on GDP. In a third of plausible settings, mostly
  those with a higher value on silver, the answer would be "rise". The food
  prediction ("fall") is correct in every setting. Weight the debrief
  accordingly: the food answer is the lesson, and the GDP answer is the model's.

## Limits

- The ranges are judgement. A different, sourced range for silver's value or for
  tribute would change the shares, not the direction.
- One plan only: the default plan as the board trims it. A player who keeps
  chuño crews after 1573 sees less GDP rise and more food kept.
- The weather, zone yields and frost losses were held fixed. They are play
  values too, and a later sweep could include them.
- The decomposition replaces the board's trim with a proportional plan. That is
  one counterfactual; there are others.
