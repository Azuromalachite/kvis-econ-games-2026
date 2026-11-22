# Strategy sweep, 18 November 2026

> **Update, planting late (19 November 2026).** Since #48 players can plant late, and since #51 every tested plan
> plants late when the Pleiades rise hazy. The figures below, including the earlier update notes, are from before
> that. Re-measured on seeds 1–80: the plan chosen in advance is still the same plan and averages 14.3 hunger deaths,
> 1,585 kcal after 1573 and 66.7 welfare (18.9, 1,550 and 65.3 before); the best tested plan averages about 1,620 kcal
> after 1573 (1,577 before). `tests/review_model.cjs` asserts the new figures (`ADVANCE`, `BEST_GRID_FOOD`).

> **Update, later on 18 November 2026.** The game now asks the player to re-plan
> when crews fall, instead of trimming silently. The strategies below set their
> own plans, so their results are unchanged; the "default plan" row now means
> choosing "Best land first" at each re-plan, which gives colonial food of about
> 1,385 kcal (1,386 before).

> **Update, terrace fix (18 November 2026).** Terraces and raised fields now count
> toward the welfare index's resilience from the harvest after they are built,
> as they always did for frost losses. Food and deaths are unchanged. The best
> plan by welfare is the same (and the same when chosen on seeds 1–40 or 41–80
> alone); its welfare averages 73.9 (75.0 before). The end screen now leads with
> it as a plan chosen in advance (`claim.game.advance_plan`). Welfare figures
> below are from before the fix.
>
> **Update, resilience (18 November 2026).** The welfare index's resilience part
> no longer gives points for spreading crews across zones (it counts only crews
> on terraces or raised fields). The default plan's welfare is now 64 → 46; the
> best plan is unchanged and averages 75.0. Food and deaths are unchanged.
>
> **Update, review round 3 (18 November 2026).** Resilience now counts protected
> fields only for a fed community with stores, so the plan chosen in advance
> loses welfare after 1573 as food falls (73 → 61). The end screen ranks plans by
> hunger deaths, then food, then welfare; the same plan is still best (18.9
> deaths, 1,550 kcal, 67.2 welfare on seeds 1–80).
>
> **Update, review 4 (18 November 2026).** Resilience counts protected crews
> against the community's full 14 crews, scaled by stores. The plan chosen in
> advance goes 72.6 → 58 and its harvest 4 is never strictly its best harvest;
> its mean welfare is 65.3. Food, deaths and the choice of plan are unchanged.

**Question.** What is the best way to play, how much better is it than the
default plan, and do the game's numbers reward what its text teaches?

**Short answer.** One strategy wins on welfare and on deaths, and comes within
27 kcal of the best colonial food: build Valley terraces in
harvest 1, keep one or two chuño crews in the Inca years, put every other crew
on the best land first, and after 1573 put every crew on the fields. It raises
welfare from 71 → 49 (default plan) to 79 → 70. But no strategy keeps colonial
food at the 1,700 goal; the best averages 1,577 kcal. And the game's text called
spreading crews across the zones "insurance" while its numbers always punished
spreading. The text is corrected; the model is unchanged (see below).

Reproduce it: serve the repository root (`python -m http.server`) and open
`tools/strategies.html` (a few minutes).

## Method

The game's own model, run headless, on weather seeds 1–80. A strategy fixes:

- **builds in harvest 1:** any combination of Valley terraces (V), Upper-field
  terraces (U) and waru waru (W): 8 options;
- **Inca years:** 0–5 chuño crews, and how the other crews are placed:
  "best" fills Valley, Upper fields, High grain, Puna in that order up to each
  zone's room; "spread" deals one crew per zone in turn;
- **colonial years:** 0–3 chuño crews, 0–2 Potosí wage crews, and the same two
  placing rules.

That is 2,304 strategies, 184,320 games. The default plan is the board as a new
player meets it, played with Next step.

## Results

| | default plan | best strategy |
| --- | --- | --- |
| plan | as given | V terraces; Inca 1 chuño, best land; colonial 0 chuño, 0 wage, best land |
| food, Inca years | 1,671 kcal | 1,761 kcal |
| food, colonial years | 1,386 kcal | 1,550 kcal |
| welfare, Inca → colonial | 70 → 49 | 79 → 70 |
| hunger deaths | 42 | 19 |

The same strategy is best by whole-game welfare and by fewest deaths. It is
within 27 kcal of the best colonial food, which spends more on terraces and
eats less in the Inca years.

**No strategy reaches the goal after 1573.** The best colonial average of all
2,304 is 1,577 kcal. Good play softens the colonial rules; it cannot undo them.

What each decision does, averaged over the grid:

- **Inca chuño has a sweet spot.** One or two crews: enough stores for a bad
  year without starving the fields. Inca food falls from 1,767 kcal (no chuño)
  to 1,284 (five crews).
- **After 1573, every crew off the fields costs food.** Colonial years rarely
  have a surplus to preserve, so chuño crews only take farm labour. Mean
  colonial food over the grid: 1,165 kcal with no chuño crews, 306 with three.
- **Wage crews replay the lesson as a choice.** With the best Inca plan, each
  crew sent to Potosí raises colonial GDP (index 111 → 116 → 121) and cuts
  colonial food (1,550 → 1,394 → 1,220). The GDP-maximising player starves the
  village.
- **Builds.** Valley terraces pay. Adding Upper-field terraces is about neutral.
  Waru waru does not pay in this model: its 2 crews cost more than it saves,
  because the High grain zone holds few crews when the best land is filled first.

## The defect this found

The game told players that spreading crews across the zones is insurance
against frost. In the model, spreading always loses: at the best settings for
each rule, "spread" gives 1,503 kcal in the Inca years and 81 deaths, and "best
land first" 1,761 kcal and 19 deaths. Averaged over the grid, spreading costs
about 105 kcal in the Inca years.

The cause is how frost works in the model. A frost reaches down to some zone and
freezes it and every zone above it, so a higher zone is never safer than a lower
one. Spreading uphill only adds exposure. Murra's insurance argument needs bad
years that hit some heights and spare others (`claim.land.vertical_archipelago`).

Changing the model to reward spreading would need such a pattern from a source.
The candidate checked, frost pooling on valley floors while slopes stay warm,
found no support: Trasmonte et al. (2008) rank frost risk by altitude, and
their abstract says nothing about valley floors freezing first. A second paper,
on pre-Hispanic fields sited to use cold air draining down slopes, could not be
retrieved. So the model is unchanged, and the game's text now says what the
model does:

- the briefing says the valley is the safest field and crews go uphill because
  the lower zones are full;
- the "Why farm the cold heights?" box keeps Murra's point as history and says
  the game's heights add room, not insurance;
- the frost milestone no longer lists "fields at several heights" as a defence.

The rule is registered as `claim.game.frost_from_top`, and the question of which
bad years differ by height is open question 7 in `history-and-evidence.md`.

The welfare index used to give a few points for spreading (its resilience part
counted the zones in use). The best strategy won on welfare anyway; since
18 November 2026 the index no longer rewards spreading at all.

## Limits

- One fixed grid: builds only in harvest 1, the same placing rule across a
  period, chuño and wage counts in steps of one crew.
- Weather, yields, frost losses and the other play values are held at the
  game's settings; the sensitivity sweep (`sensitivity-2026-11-18.md`) varies
  those.
- "Best" by averages over seeds. A player meets one weather sequence, and a
  cautious player may prefer less spread in outcomes over a higher mean.
