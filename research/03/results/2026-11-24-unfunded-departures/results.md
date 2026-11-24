# Unfunded empty departures under the frozen quantity-only rule

24 November 2026. **Status: reproduced (bounded case).** This is a finding about the design of the H arm of the [depth-and-liquidity protocol](../../pre-registrations/2026-11-23-depth-liquidity.md), from one deterministic trace. It is not a C6 result, it scores no D/L/H prediction, and it changes neither the protocol nor the playable game. The registered run is draft PR #44 (`research/03-depth-liquidity-run`).

## The finding

1. **The H arm cannot refuse a lane.** The frozen H rule (the quantity-only harness) keeps the baseline lane ranking and changes only how much it buys. When cash cannot cover the voyage, it buys nothing and sails anyway. In this trace it reaches Aden with 97 D and no cargo, buys nothing, and sails empty to Kilwa. The four-month passage charges 4 × 35 = **140 D** of wages up front.
2. **This is a structural property of the frozen H design and a scope gap in C6, not a defect in the run.** Under the protocol's cash ≥ 0 floor (§4.4, "stricter than the engine's −250"), the H rule has no way to stay above the floor once even an empty departure costs more than the cash in hand. C6 does not ask about that case.
3. **The owner decided (24 November 2026) that C6 applies as the run defined it.** That is the run's pre-results interpretation 18: the L arm, with cash checked after every sail and wait. This finding does not amend C6, does not re-score it, and does not block the run.

## The trace

The pinned engine (`d2d66a3`), with hazards off, through a copy of the H rule kept in [the check script](../../models/unfunded-departure-check.mjs):

| Item | Value |
| --- | --- |
| Conditions | Junk, normal, avoid headwind, settlement delay *k* = 1, R-exp |
| Departure | Aden to Kilwa at monthIndex 4 (May), 4 months |
| Cash in hand | 97 D |
| Cargo bought / aboard | 0 / 0 lots |
| Receipts outstanding | 135 D + 13,470 D, both due at monthIndex 5 |
| R-exp for this departure | 150.4 D, including the expected water and tribute terms |
| Cash after the 140 D wage charge, before receipt credit | 97 − 140 = **−43 D** |
| Cash after the wrapper credits the receipts | −43 + 13,605 = **13,562 D** |
| Lowest cash after any sail or wait (the run's C6 sampling) | **97 D** |
| Campaign ruin | **No.** Receipts are credited before the engine's end check, which ends a campaign only at `state.cash < −250` |

Under the protocol's cash ≥ 0 floor, the departure is unaffordable; the engine itself would allow cash down to −250 D. Buying less cannot restore the floor here, because nothing was bought. The trace stops at the first state below the floor; the campaign is intentionally unfinished and no profit is reported.

### Where the cash is observed

The −43 D is seen only when cash is read after upfront charges and before the receipt credit. That observation point is an **interpretation chosen after both outcomes were seen**: an earlier check read cash after complete actions and recorded 97 D, and the before-credit point was adopted after the −43 D was also found. §4.4 is not claimed to support it. The run's interpretation 18 reads cash after every sail and wait; on this trace that minimum is 97 D. The [machine record](counterexample.json) keeps both observations.

## Scope and provenance

- **The copy of the H rule is not the registered harness.** Its R-exp tribute term takes cash after each tentative purchase; the run's interpretation 14 uses cash before buying. On this trace the two give identical decisions and an identical trace (checked by swapping the input), but that was not checked anywhere else.
- **Reproduced (bounded case).** An independent reviewer reran both scripts from a clean checkout; the outputs were byte-identical apart from `recorded`, `node` and `sourceMode`. The scripts were rerun for this revision: every decision, advance and case value is unchanged; only labels, the record's field names and an added before-credit snapshot in each replay event changed.
- **Engine identity.** The script asserts the SHA-256 of all four inputs (page `1c901dd1…`, loader `5b922ce7…`, baseline harness `3d84e095…`, parameters `b84245ed…`) and of the page's one inline engine script, `6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c`. That engine script, the loader, the harness and the parameters are byte-identical at `d2d66a3`, `320c7dc` and main `9fe3051`, so the trace carries over to main's live page (`8cf262922b716f62…`); rerunning against main's page gave the identical trace.
- **Not claimed.** Earlier drafts also cited C1, C1b, 10,800 matched campaigns, "no early ruins", inventory-months and FIFO tags from a second implementation of the registered study. That code and its outputs are not committed, so those claims are dropped here.

## Reproduce

Node v24.22.2 was used; the scripts need Node 22 or later and no packages. From a complete checkout containing `d2d66a3`:

```sh
node research/03/models/unfunded-departure-check.mjs --output /tmp/monsoon-unfunded-check.json
node research/03/models/unfunded-departure-replay.mjs --output /tmp/monsoon-unfunded.json
```

On Windows, choose an output path in the system temporary directory. Both scripts read the pinned inputs with `git show` into an OS temporary directory and never write the game's source; `--source-dir PATH` uses an already materialized pinned tree instead. In either mode every input hash is asserted against constants in the script: a one-line edit to the harness or to the loader makes the check fail. The replay re-derives every decision state and advance of [counterexample.json](counterexample.json) before branching (not the recorded `requiredReserve`): changing one recorded cash value (97 → 98 in the Kilwa→Aden advance) makes it fail. `Math.random` returns 0.99 throughout. See [validation.json](validation.json).

## Exploratory follow-up: funded continuation

The [unfunded-departure note](../../literature/2026-11-24-unfunded-departures.md) retains three fixed empty-movement branches and two synthetic boundary fixtures, in a [standalone replay](../../models/unfunded-departure-replay.mjs) and [JSON record](unfunded-branches.json). One affordable wait reaches the receipts, but choosing a new destination changes the sailing calendar; under the protocol's cash ≥ 0 floor, an unaffordable wait or a too-small first receipt leaves no funded continuation. These cases were chosen after seeing the trace above. They neither repair the H rule nor score any hypothesis. Independent historical review of the follow-up remains pending.

Historical interpretation is bounded separately in the [pepper procurement note](../../literature/2026-11-24-pepper-procurement-chain.md). Neither note nor this trace calibrates historical demand, prices or settlement delays.
