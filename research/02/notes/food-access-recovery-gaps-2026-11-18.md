# Food access and recovery: implementation gaps

18 November 2026. Static review of main `8e443c566094b93561182e2ffb068e039cbb6270`
(PR #29), linked to the [seven-paper review](food-access-recovery-literature-2026-11-18.md).
No gameplay, constants, grading or UI changes accompany this document.
The [crop/camelid PR #23](https://github.com/Azuromalachite/frost-and-silver-game/pull/23)
and [climate PR #24](https://github.com/Azuromalachite/frost-and-silver-game/pull/24)
are preceding contributions in the refreshed review stack: #23 targets main,
#24 targets #23's branch, and this contribution targets #24's branch. Review and
merge in that order; the inherited readings retain their original evidence bounds.

## Current behaviour and possible work

These are code observations and proposed investigations, not newly measured
game results or historical effect estimates. Locators refer to the named
functions in [the game](../../../projects/02/index.html) at the revision above.

| Gap | Present implementation | Proposed decision or investigation | Evidence boundary |
|---|---|---|---|
| Food purchasing power | In `harvest`, wage crews reduce the food-equivalent tribute through `WAGE_TRIB`; silver contributes to GDP. `food = H + ret - tribute` has no purchases term or food price. | Compare retained farm food with net earnings that can buy food, under explicit supply/access constraints. | Wage/basket estimates do not establish observed consumption or a village food market. |
| Obligation versus fulfilment | `crews` applies the stored mita requirement as a reduction in crew strength; `harvest` applies a fixed tribute total with wage relief and a harvest cap. | Distinguish required liability, actual labour, money paid, and household financing. Qualify historical wording before selecting a new mechanism. | Do not insert the later 1610 regional fulfilment proportions as 1575 rates. |
| Food versus productive reserves | `settle` tracks one food store and processing capacity; `grow` has no viable-seed stock or replanting demand. | Define edible stock, retained planting material and feasible replacement sources. | Do not assign a generic seed-loss penalty from retrospective survey frequencies. |
| Continuing herd services | Puna enters `grow` through the same zone-output calculation; no persistent animal count or dung ledger is present. | Decide whether a herd is a stock with food, transport or other services, and what access to those services requires. | Distinguish ownership from access; modern mixed-species budgets are not precolonial parameters. |
| Spatial scales of resilience | `grow` applies zone weather losses. PR #29 removed the occupied-zone welfare bonus; resilience now counts only protected fields. No within-zone field geometry or pest movement is represented. | Keep elevation exposure, local clustering and rotation separate in any future pest model. | One species and one season cannot set a universal diversification bonus or penalty. |
| Adoption and upkeep | Construction already occupies crews in `used` and becomes completed after the harvest. There is no learning-failure or dung/soil-maintenance account. | Ask whether an additional transition or maintenance cost creates a useful, evidenced decision. | Existing construction has a cost; kiln observations do not calibrate that cost or prove an omission needs a new control. |

Once wage relief has reduced the model's tribute to zero, additional earnings
cannot enter consumption through food purchases. This is an algebraic limit of
the current account, not a result from a strategy sweep. It does not mean every
wage allocation is dominated: farming opportunity costs, the tribute cap,
population, stores and choices all matter. A test of wages against farming must
name its starting state and policy.

PRs #25 and #26 already make re-plan advice depend on the board, qualify GDP
explanations, score terraces from the next harvest and lead with a strategy
chosen in advance. PR #28 preserves hand-added wage crews when Best land first
is chosen again, projects the hand-set plan, warns about stores at the choice
and explains disabled actions. PR #29 removes the spreading bonus and points
the frost hint to occupied Valley terraces. These issues are resolved, rather
than outstanding gaps in this review. The household shortfall estimate uses
food available before the consumption cap; different estimates at the same
displayed intake are intentional. This review preserves those decisions. It also preserves
the explicit teaching assumption that each person's stores carry across the
historical gap (claim.game.stores_carried). Existing matched harvest comparisons
remain distinct from an independently evolving alternative history.

## Order of work

Historical wording to revisit: the current player text groups mita and tribute
under a common recount explanation. The narrowed registry claim and historical
notes distinguish their adjustment paths; a later text/UI change should carry
that qualification to the player as well. This research PR flags that remaining
work without claiming the interface has already been corrected.

1. **Clarify accounts in the explanation.** Separate official allocation,
   fulfilment and payment; distinguish farm output from food acquired elsewhere.
   The evidence note can qualify historical generalizations without changing the
   current teaching model.
2. **Run a bounded purchasing-power experiment.** Specify wages, paid days,
   deductions, travel costs, food prices, physical availability and access.
   Report a break-even condition and sensitivity, rather than choosing one
   coefficient because it reproduces a desired lesson.
3. **Extend the time convention explicitly before adding productive stocks.**
   Early harvests are adjacent years; colonial sample years are separated by
   decades. PR #26 deliberately retains and labels the food-store abstraction.
   Respect that decision and specify separately how seed and herd stocks cross
   the gaps. Do not silently treat all six turns as consecutive years or present
   inventory carryover as literal preservation for decades.
4. **Choose one recovery mechanism.** Make its stock balance and feasible
   decisions visible, then measure whether it changes strategy rankings or
   downside outcomes. Do not add seeds, herds, dung, soil and pest geometry in
   one change.
5. **Add ecological detail only with a clear purpose.** Local field arrangement
   and fuel allocation may deserve a later extension; first determine which
   decision the player would make and what evidence could bound its effects.

## Acceptance criteria for later changes

- State whether every quantity is food, planting material, animals, money,
  nutrient mass, labour time or heat. Define population and time denominators.
- Record gross earnings, deductions and expenditure separately. An ore value,
  wage payment and food purchase must not be counted as three independent gains.
- Keep food sold to finance obligations distinct from food purchased with wages;
  keep tribute relief distinct from a new income stream to avoid double-counting.
- Conserve stocks and prevent using the same tubers for eating, preservation and
  planting. If transfers are allowed, state the supplier and access convention.
- Separate mortality, slaughter and breeding from recurring herd services, with
  a declared convention for the years between turns.
- Hold weather fixed when comparing policies and use only information available
  at each decision. State whether alternatives share a starting state or evolve
  separately.
- Preserve the current pinned run and presets unless a separate model PR
  deliberately changes and recalibrates them. Numerical evidence remains
  separate from play values even after local checks pass.
- For a future UI change, verify desktop/mobile rendering, reports and replay;
  a headless model test does not establish that those interactions work.

## Research questions that remain open

Which community and market are represented? Whose earnings, food and obligations
does the aggregate describe? Which dates have usable local price evidence?
What seed quantities and replacement routes are feasible for its crops? What
animal holdings, access rights and response costs can be supported? Which joint
losses across fields determine the value of spreading production?

The reviewed papers refine these questions. They do not settle a complete
historical household budget or provide a calibration for every new mechanism.
