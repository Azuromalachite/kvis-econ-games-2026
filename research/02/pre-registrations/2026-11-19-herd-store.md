# Pre-registration: does a herd kept as a living food store change outcomes, strategies or the lesson?
Date: 2026-11-19 · Project: Frost & Silver, Path B, experiment 4 · Verdict: PURSUE (accepted by the author 2026-11-19, before any computation)

## Seed observation (what sparked this)
The Puna is a fourth crop zone. Crews there produce food the same year, and no herd persists
(`docs/implementation-review-2026-11-18.md` §2): no animals carried between harvests, no breeding, no decision to
slaughter. The camelid reading notes (`docs/agropastoral-literature-2026-11-18.md`) ask, as their question 2, whether a
household can meet food needs now without consuming breeding assets needed later. The food-access gap review
(`docs/food-access-recovery-gaps-2026-11-18.md`, Order of work) puts herds after a time convention (step 3) and asks
for one recovery mechanism at a time (step 4). This experiment takes both steps for one mechanism.

## Author's choices (2026-11-19, before drafting)
- **Service:** the herd as a living food store. Animals carry over; slaughtering some feeds people now and shrinks
  the breeding herd. Transport and dung are out of scope.
- **Time convention:** research-model structure. Each colonial sample year is played as a short run of consecutive
  years, so the herd never jumps decades in one turn (allowed by `research/README.md`, "What Path B may change").

## Pilot already seen
**None.** No herd mechanic has been run in any form. Every seed below is confirmatory.

## Structure
- **Base model:** the game's model read from `frost-and-silver.html` at main `23081c0` (planting late graduated in #48),
  never edited. The page applies textual replacements only where stated here. Player: `ADVANCE_PLAN` before every
  harvest, with planting late when hazy (the graduated rule). Secondary: the default plan, best land first at re-plans.
- **Years:** Inca harvests 1–3 as in the game. Colonial: three blocks (c. 1575, c. 1592, c. 1600), each of **3
  consecutive years**, 9 colonial years in all. Collapse before block 1 and the 1585–91 epidemic before block 2, as in
  the game. Mita, tribute, silver and resettlement use each block's sampled value for its three years. Weather for the
  extra years uses the game's `rollYear` with year indices 4–12, a new draw, the same for every policy on a seed.
  Outcomes are reported for all 12 years. The 3-year runs are their own structure: they are not compared harvest by
  harvest with the game (see the check below).
- **Herd stock** `Hd`, in herd units per 1,000 people at the 1500 count (`Hd0 = K`, the carrying capacity):
  - **Puna output:** the game's Puna yield is scaled by `Hd / K`, so a smaller herd yields less milk, wool and meat
    from the same crews. (Both players below put no crew in the Puna after 1573, so this term moves nothing there; it
    is kept so the model stays general.)
  - **Growth** each year: `Hd += r · Hd · (1 − Hd / K) · tend`. Here `tend` is the community's herding labour:
    surviving people over the 1500 count, less the share at Potosí under the mita, `tend = (pop / 1000) · (1 − mita
    share)`. Herding was family work, not a field crew's, so it does not draw on the crews the player assigns. Herding
    labour alone cannot create animals: `Hd = 0` stays 0.
  - **Weather:** a frost year in the Puna costs the herd nothing; that is the game's premise, "herds survive it". A dry
    year costs `d · Hd` (forage).
  - **Slaughter** `s` units in a harvest adds `s · M / K · 1000 / pop` days of 1,700 kcal per person to that harvest's
    food, before stores and the eating cap. The herd is the community's, so fewer people each get more. It removes `s`
    from `Hd`. Meat is eaten that harvest, not stored (no charqui ledger).
  - **Colonial years:** `K` falls with resettlement's yield factor (distant pastures given up). When it does, `Hd` is
    capped at the new `K`: the animals beyond it are lost, not eaten. This keeps `Hd / K = 1` under P0. The mita takes
    herders as it takes field crews. No tribute in animals.
  - **GDP:** herd growth counts as output at farm value. Slaughter does not, because it turns a stock into food. So
    eating the herd raises food and leaves GDP unchanged, a second gap between the two numbers. Report it, don't tune it.
- **Parameters (judgement ranges, none historical):** net growth `r` ∈ {0.10, 0.20, 0.30} per year. Herd food value
  `M` ∈ {30, 60, 120} days of 1,700 kcal per person if the whole herd were eaten. Dry-year loss `d` ∈ {0, 0.15}.
  18 cells. The modern cria cohort's 22% mortality (Gomez-Quispe et al. 2022) is **not** used: it is a recruitment
  figure from one modern herd, not a weather coefficient.
- **Policies (fixed now):**
  - **P0 keep:** never slaughter. This is the closest to the game today.
  - **P1 buffer:** slaughter only to lift intake to 1,500 kcal (the game's death threshold), never below a floor
    `f · K`, f ∈ {0, 0.25, 0.5}.
  - **P2 eat steadily:** slaughter a fixed 20% of `Hd` every harvest.
  - **P3 ceiling:** P1 with f = 0.25, knowing next year's weather. Not choosable; it bounds the value of foresight.
- **Seeds:** 1–400, all confirmatory.
- **Code:** `research/models/exp4-herd-store.html`, written after this file is committed.

## Analytic expectation (before any run)
- Under P0 the herd sits at `K` and the model equals the game, apart from the extra consecutive years and `d`.
  **Check:** run with blocks of **1 year** (the game's own structure) and `d = 0`. P0 must then reproduce the game
  exactly on every seed: every harvest's food, deaths, stores, GDP and welfare, to rounding. This proves the herd code
  changes nothing when nobody slaughters. If not, the harness is wrong and nothing else is reported. With 3-year blocks
  the weather indices, stores and population differ from the game's harvests 5 and 6 by construction, so no
  harvest-by-harvest comparison is made there.
- P1 converts stock into food exactly in the years the game kills people, so it must cut deaths in the harvest it
  acts. Its cost arrives later through lower Puna output and regrowth time. With `r = 0.10`, a herd halved takes about
  7 years to regain 90% of `K`. Within a 3-year block that is not repaid, so a later block in the same run starts low.
- P2 front-loads food and should lose to P1 in deaths whenever `r` is low, because it eats in good years too.

## Outcomes
- **Interesting:** P1 cuts the worst outcomes (mean deaths over the worst 10% of seeds) by a margin the class would
  notice, and the best floor `f` is not 0. A herd is then insurance with a cost: keep a breeding core. That is a
  decision a student can make and explain.
- **Also interesting:** the best floor is 0 in most cells (eat everything when hungry). That says the 12-year horizon
  is too short for breeding stock to matter. It is a reason to keep herds out of a six-harvest game.
- **Boring / null:** no policy differs from P0 by more than 2 deaths in mean or worst-decile terms in most cells.
  Worth knowing? **Yes.** The Puna-as-crop simplification then costs the lesson nothing.
- **Dead:** the P0 reproduction check fails and cannot be fixed without editing the game's model.

## Pre-registered prediction
- **P0 check:** passes.
- **P1 vs P0 (ADVANCE_PLAN, f = 0.25, r = 0.20, M = 60, d = 0.15):** 3–10 fewer mean hunger deaths over 12 years.
  The worst-decile mean falls by at least twice as many as the mean.
- **Best floor:** f = 0.25 or 0.5 beats f = 0 in at least half the cells with r ≤ 0.20; f = 0 is best when r = 0.30.
- **P2:** worse than P1 in mean deaths in every cell with r = 0.10.
- **The lesson (experiment 1's test):** holds on every seed under every policy. Food per person falls under the
  colonial rules, with the counterfactual run using the same herd policy under Inca rules.
- **GDP gap:** under P1, colonial GDP is within 1 index point of P0 while food is higher.

## Decision rule (graduation, fixed now)
A herd stock is proposed to the author for the game **only if all four hold**:
1. P0 reproduces the game (the check above);
2. P1 with some floor beats P0 by **at least 2** mean deaths and **at least 4** worst-decile deaths, in **at least
   half** of the 18 cells;
3. the best floor is above 0 in at least half of the cells with r ≤ 0.20. Otherwise the stock adds no decision a
   student needs, and a one-off "slaughter in a bad year" button would do;
4. the lesson holds on every seed under every policy.

If 2 or 3 fails, the game keeps the Puna as a crop zone and this file records why. Graduation still needs rule 6 of
`research/README.md`: one sentence a class can follow; a claim for the direction (herds as a store eaten in bad
years, with its source and access level; the reading notes have none yet, so **a source must be found and
registered before graduation**); magnitudes labelled game figures; a CI check; and the author's agreement. A game
version must also decide how the herd crosses the game's own decade gaps. The consecutive-years convention here is
research structure, not a game proposal.

## Confirmatory comparisons (frozen)
- Mean and worst-decile hunger deaths over 12 years, `ADVANCE_PLAN`, policies P0–P3, all 18 cells, all floors.
- Seeds better / worse than P0 for P1 (each floor) in every cell.
- The best floor per cell.
- The lesson test, and the GDP-gap figure, at the reference cell (r 0.20, M 60, d 0.15).
- The ordering for the default plan at the reference cell.

## Forking-paths guard
- Grid, policies, floors, 2- and 4-death margins, the half-of-cells rules and the 3-year block are fixed here.
- No other service (transport, dung, wool income) and no charqui storage are added.
- The planting-late rule stays as graduated; no new forecast lever is searched.
- Secondary outcomes (colonial food, welfare, final herd size) are reported for every cell; none decides.

## Exploratory (reported as such)
- Blocks of 2 and 5 years, to show how the horizon moves the best floor.
- Puna crews re-searched under P1 (does keeping a herd change how many crews go to the Puna?).
- Charqui: slaughter in good years, stored, as a comparison with chuño.

## Limits stated in advance
- Every rate is a judgement. The sources motivate the pathway (food now against productive stock later); none gives
  these numbers for the region or century.
- One herd per community, no ownership. The reading notes warn that access, not ownership, decides who eats.
- No mixed llama–alpaca structure, no age classes, no disease.
- Consecutive colonial years are research structure. They change the weather draws, stores, population and the number
  of re-plans, so only the 1-year-block check compares with the game.
- The harness must decouple the game's harvest number from the block year: weather (`rollYear` index), silver,
  resettlement and the 1585–91 epidemic are keyed to it in the game. The mapping is: block 1 → harvest 4's values,
  block 2 → harvest 5's (epidemic before its first year), block 3 → harvest 6's; weather indices 4–12 in order.
- A model result, not history: it can show whether the lesson depends on treating the Puna as a crop, not how
  herds fared in the 1500s.

## Changes made before commit (2026-11-19, author's decision)
The first draft had two defects, found by checking the game before committing; the author chose both fixes.
1. **Regrowth was gated by Puna crews.** On seeds 1–80 `ADVANCE_PLAN` puts **0 crews in the Puna in every harvest**, and
   the default plan puts 1 there in the Inca years and **0 in every colonial harvest** (measured on the game at
   `23081c0`). The herd could then never regrow after a slaughter, so a breeding floor could never pay and rule 3
   would fail by construction. Regrowth is now gated by the community's people (above).
2. **The reproduction check could not pass.** With 3-year blocks, blocks 2 and 3 start from different stores,
   population and weather indices than the game's harvests 5 and 6, so "first-year-of-block outcomes reproduce the
   game" fails with the herd doing nothing. The check now runs with 1-year blocks (above).

## Verdict & reasoning
Recommended: **PURSUE.** It is the step the gap review asked for (a time convention, then one mechanism). The P0 check
ties it to the game. Every outcome, including the null, decides something: whether herds belong in the game, as a
crop, as a one-off emergency choice, or as a stock.

## Deviations (append-only, dated)
(none yet)
