# Pre-registration: when does a larger hold pay? Market depth and liquidity (M3, research mechanisms)

| | |
| --- | --- |
| Status | **Registered, not run.** Nothing in this document has been coded or evaluated. It is registered, and frozen, when the PR adding it merges. The owner's decisions of 2026-11-23 (strict deadline, sell-over-time with withholding, harness reserve arm, per-good grid, C10's status, B1's bands) are built in |
| Drafted | 2026-11-23, against `main` at `d2d66a3` |
| Follows | Economy skeleton (`research/03/pre-registrations/2026-11-22-economy-skeleton-m3-m4.md`; results `research/03/results/2026-11-22-economy-skeleton/results.md`). Adaptive routes (`research/03/pre-registrations/2026-11-23-adaptive-routes.md`, registered `4ec44ff`; results `research/03/results/2026-11-23-adaptive-routes/results.md`, `565928a`) |
| Experiment | M3 (when is a larger ship advantageous), with two mechanisms the game lacks: market depth and payment timing |
| Engine | `projects/03/index.html` at `d2d66a3`, SHA-256 `1c901dd1cd6507a6deb9fabed4d91ebd5bd81204b583008eec5f5d4cd163442b` |
| Kind of change | Research (Path B). **The game file is never edited.** Both mechanisms are research-code wrappers around engine functions inside the loader's `vm` context. Nothing here proposes a game change |
| Status of results when run | **Exploratory** until someone other than the author reruns them from the recorded inputs. They are **provenance-incomplete** if any field game-change-review requires is missing, and the missing fields are named |

Every depth capacity, recovery rate, impact shape and settlement delay below is a **hypothetical judgement range**, chosen to bracket the game's hold sizes and calendar. None is historical, and none is calibrated to a source.

## 1. Seed observation

Both earlier studies ran with no market depth. `buyCargoQty` is capped only by cash and tonnage (`projects/03/index.html:2081-2104`), and `sellCargoQty` sells any quantity at the live price (`:2106-2123`).

- **Hold size decides the ranking.** The junk's capacity-limited profit rate is 2.4 times the dhow's (27,556 vs 11,500 D/month). Only a hold ratio of about 1.1 reverses the ranking (`…/2026-11-22-economy-skeleton/results.md:23,25`), at a junk capacity of 120–131 t (`:65`).
- **The junk wins under good routing.** Under the best plan found, the junk earns 2.1–2.4 times the dhow's profit (`…/2026-11-23-adaptive-routes/results.md:15`).
- **The greedy fill can ruin.** It keeps 60 D, and waits can push cash below −250 D, which ends the campaign (`results.md:28-30,38`; `index.html:2316`).

**Motivation, not calibration.**
- **PGP 9063** (§11), an Aden account of c. 1134, records storage and care costs: warehouse rent and mats (line 26) and airing textiles (line 27). The same account lists transaction costs, namely cargo registration fees (28), brokerage and weighing (29) and packing (30), and goods still remaining (34–35).
- **PGP 5448**, already in this repository, describes a tax collection deferred so that pepper owners weren't forced to sell into weak demand (`research/03/literature/p02-p03-extended-search-addendum.md:13`).
- **Seland (2013)** describes monsoon seasonality forcing absences of months and limiting communication with the home base. It concerns the western Indian Ocean, mainly the 1st–3rd centuries CE. The game includes Malacca and Quanzhou and evokes a much later period.

None of these supplies a rate, a capacity or a delay used below.

## 2. The idea

Add each mechanism separately to the adaptive-routes planner, to a myopic student-like harness and to the engine. Then measure how the junk's advantage, the inventory left unsold and the risk of ruin change.

1. **Market depth, with selling over time.** A port absorbs a limited quantity at full price. Further sales depress the price, and the market recovers month by month. A ship may wait up to two months at the destination to sell its overhang.
2. **Payment timing.** Sale proceeds arrive *k* months after the sale. A **cash-reserve rule** keeps enough for wages and port charges until the next receipt.

The headline question stays the inventory one: how much capital a larger hold ties up in goods that can't be sold yet, or in cash that can't cover the waits, and when that cancels the advantage. The informative targets are magnitudes and thresholds. The direction is largely known in advance (§3).

## 3. Prior looks: what is not blind

1. **Economy skeleton, all outputs** (`research/03/results/2026-11-22-economy-skeleton/`).
   - ρ, R_cap, C\* and t\* (`results.md:21-23,43,50-57`).
   - The boundary table (`:61-74`).
   - Its Q1 best cycles (`q1-best-cycles.json`). Under *avoid headwind* at normal, Level 0, S-opt, the junk's cycle visits Quanzhou **once** per 12-month cycle and the dhow's **twice** (`results.md:53,56`).
2. **Adaptive routes, all outputs** (`research/03/results/2026-11-23-adaptive-routes/`): the hazards-off nets (`results.md:58-77`) and the hazards-on medians (`:86-105`).
3. **Read from published files while drafting** (2026-11-23).
   - **Plan endings** (`hazards-off.json`). 33 of the 36 published hazards-off plans (18 cells × S-greedy and S-opt) end with a full hold of cloves arriving at monthIndex 24, liquidated by `finishCampaign`. The other three are the junk *sail always* S-opt plans, which arrive at 26 (D01).
     - **Dhow, normal, *avoid headwind*, S-greedy.** It buys 120 cloves at Malacca at month 22 for 19,800 D and sails via Calicut to Aden, arriving at 24. Cash rises by 97,185 D (liquidation 97,200 less 15 D wages), which is 36% of the 270,012 D net. That delivery's profit after the clove cost is 77,385 D, or 29%.
     - **Junk, same cell.** It buys 300 cloves at month 23 for 50,100 D and arrives at Calicut at 24. Cash rises by 106,165 D (16% of 645,687). The delivery's profit is 56,065 D, or 8.7%.
   - **Sales by port** (S-greedy, per campaign). Cloves at Quanzhou are the largest sale, or tied for largest, in 16 of 18 cells.
     - Dhow, hard and survival, *avoid headwind*: Calicut is first (134 and 130 lots against Quanzhou's 120).
     - Dhow, normal, *avoid headwind*: a three-way tie at 120 (Quanzhou, Calicut, Aden).
     - Junk, *avoid headwind*: Calicut is second (329 / 314 / 310) and Aden third (300).
     - Junk *avoid headwind* plans visit Quanzhou twice in 24 months (600 lots = 2 × 300).
   - **Ruin-like cases.** `checks.check2.examples` in `hazards-off.json` holds 20 cases where more starting cash gave less cash after the delivery. The first is dhow, normal, *avoid headwind*, Malacca, month 3, Malacca→Quanzhou→Malacca→Quanzhou: 7,519 D in gives 7,296 out, against 25,486 for the previous grid point.
   - **Lowest plan cash.** −45 D (junk, both *sail always* and *avoid headwind*).
   - **Lower tail of `hazards-on.json`.**
     - Dhow, normal, *sail always*: the two lowest re-planning nets are 48,415 and 48,585, and the next is 97,776. The harness's lowest are 40,299 and 52,891.
     - Dhow, hard and survival, harness: 38,298 / 38,381 then 43,928; 35,534 / 35,737 then 41,284. The junk's *sail always* re-planning tails have no low outliers (minimum 553,638 at normal).
     - The file doesn't record how campaigns ended. These pairs are **plausible ruins, not confirmed** (§10).
   - **Transit fixture** (`tests/03/fixtures/baseline-transit.json`, no navigator). The junk is never faster than the dhow. It is slower in 44 of 120 lane-months: 28 headwind (unavailable under *avoid headwind*), 12 dead zone and 4 crosswind (Calicut→Malacca in Jan, Feb, Nov and Dec).
4. **Engine source** at `d2d66a3`: prices (`:2007-2013`), tariffs and fees (`:2015-2029`), trade (`:2081-2123`), `waitInPort` (`:2157-2183`), `sailTo` (`:2185-2302`), `advanceTime` (`:2304-2321`), `finishCampaign` (`:2499-2520`), and the Atlas wrapper around `finishCampaign` (`:3175`).
5. **Arithmetic on constants**, by an independent reviewer of the draft, and checked here (§4.3 (c)). The per-good grid and the D2 interval were chosen after it.
6. **The keyed-draw design** of an unregistered scratch draft (not in the repository). Adaptive routes shared seeds and **did not** key draws (`adaptive-routes.md:202`; results `:109`).
7. **Not seen:** any run with depth, sell-over-time, delayed settlement, a reserve rule, the strict deadline, or keyed draws.

Predictions marked **informed** follow from items 1–5. A success on one counts as consistency, not confirmation.

## 4. Method

### 4.1 Accounting: campaign boundary (owner decision 1; fixed before any model)

All nets are measured against **`state.startEquity`**, the engine's starting cash less starting debt (`:1911`). That is the quantity `finishCampaign` subtracts (`netProfit = state.cash − state.startEquity`).

| Net | Rule |
| --- | --- |
| **E-net** (existing, scored for comparability) | The engine's end: `finishCampaign` fires when an action takes monthIndex to ≥ 24 or cash below −250 (`:2316`). It liquidates cargo at the current port at month `min(23, monthIndex)` (`:2506`), with the depth step of §4.3, and deducts debt. Arrivals at 25–26 are credited (D01). Outstanding receivables are added at face value |
| **S-net** (strict, months 0–23) | Only sales at monthIndex ≤ 23 count. Cargo still aboard when monthIndex reaches 24 is **unsold** and valued at zero, whether the ship is in transit (arriving at 24, 25 or 26) or in port (it reached 24 by waiting). Receivables due after 23 count zero. Every wage already charged counts, including wages for months after 24. Debt includes the interest `advanceTime` adds on reaching 24 |
| **S24-net** (inclusive variant; **exploratory**) | As S-net, except cargo **at a port at monthIndex 24** counts: a ship that arrives at exactly 24, or is in port at 24 after a wait, is valued at that port's month-23 price through the depth step. Arrivals at 25–26 count zero. A receivable due at exactly month 24 counts zero, like any receivable due after 23 |

- **Planner variants.** The DP is solved under each rule: *DP-E* (may use D01), *DP-S* and *DP-S24*. Each plan is reported under all three nets. Predictions are scored on the net named in each.
- **Completed voyage:** `sailTo` reaches its destination (no turn-back) at monthIndex ≤ 23 for S-net, or ≤ 24 for S24-net.
- **Ruin:** the campaign ended with monthIndex < 24. A wrapper records cash before `finishCampaign`. The log text isn't used, because ruin is logged as "Month 24 Liquidation" (D07).

### 4.2 Accounting: cargo outcomes (fixed before any model)

Counted in lots per good per run, with tonnes and cost-basis value beside them.

| Outcome | Definition |
| --- | --- |
| loaded | lots bought (`buyCargoQty` actual quantity) |
| delivered | lots aboard when `sailTo` reaches the port where the plan intends to sell them. A turned-back voyage delivers nothing. A lot carried over from an earlier sale attempt counts as delivered **once**, at its first arrival at an intended sale port. It is not counted again at later ports. Delivered is **not** the engine's freight tally, which counts loaded cargo, turn-backs included (D03, `:2198-2201`) |
| sold | lots sold through `sellCargoQty` and the depth layer, at full or depressed price |
| liquidated | lots priced by `finishCampaign`'s liquidation, after the depth step |
| written off | under a hard cap, lots the depth step can't absorb at liquidation (E-net), valued zero |
| unsold at deadline | S- and S24-net only: lots aboard at monthIndex 24 that the rule values at zero |
| lost | piracy, teak jettison, porcelain breakage, textile mildew (`:2212-2276`) |
| **inventory-months** (headline) | Σ over months of the cost basis of lots aboard that were offered for sale and not absorbed (D·months). It measures capital tied up in goods that couldn't be sold yet |

**Conservation identities** (check C3):
- E-net: loaded = sold + liquidated + written off + lost.
- S-net and S24-net: loaded = sold + (liquidated counted by the rule) + unsold at deadline + lost.

Each identity is exact per run. Nothing is "held at the end": at the end every lot is liquidated, written off or unsold, depending on the rule.

### 4.3 Mechanism 1: market depth, with sell-over-time

**State.** Absorbed quantity *A_{d,g}* (per-good cap, in lots) or *A_d* (pooled cap, in tonnes) at port *d*, starting at 0. Recovery: each month advanced, *A ← A·(1 − r)*. It is applied once per month (an *m*-month action applies it *m* times), after monthIndex advances and before any sale at the new port.

**Sale order.** Lots are offered in descending live price per tonne at that port and month (`getLivePortPrice` / lot weight). Ties go in `COMMODITIES` order. The fill uses the same order when it projects sales.

**Absorption of the next lot** (weight *w*: 1 for the per-good cap, the lot weight in tonnes for the pooled cap; *x* = quantity already absorbed, including earlier lots of this sale):

| Shape | Sellable | Price |
| --- | --- | --- |
| hard | iff *x + w ≤ Q* | *p* |
| soft | always | round(*p* · max(φ, 1 − η · max(0, *x + w − Q*)/*Q*)), η = 0.5, φ = 0.25 fixed |

After each lot is sold, *A ← A + w*. Under the hard cap, a lot that can't be absorbed stays aboard. Under either cap, a lot may also be **withheld** (owner decision; next paragraphs).

**Sell-over-time** (owner decision 2). At the final port of a delivery, after the arrival sale, the plan chooses *m* ∈ {0, 1, 2}.
- **Mechanics.** Each extra month is the engine's `waitInPort` at that port. It costs wages (dhow 15, junk 35) plus `getEffectiveLayoverFee` at the standing then (`:2022-2029`; Quanzhou base 30 × difficulty multiplier × standing multiplier). Standing rises 15, and crew health rises 20 (`:2157-2183`).
- **Hazards during the waits.** Only the port-story draws (occurrence and pick, `:2172-2173`) can fire, adding 15–25 D or +8 hull. There is no piracy, storm or turn-back in port. With hazards off, every draw is 0.99, so no story fires.
- **Selling and withholding** (owner decision, both caps).
  - **Schedule.** For each candidate *m*, a sale schedule assigns every lot aboard, in the §4.3 sale order, to the month *j* ∈ {0, …, *m*} that gives it the highest projected price. The projection uses *A* after *j* months of recovery and after the lots already assigned to month *j*; ties go to the earlier month. Under the hard cap, a lot that fits in no month is left **held**.
  - **Choosing *m*.** Each *m* is a **separate DP edge** from the delivery's start node into the node (arrival port, arrival month + *m*, *H_m*). It carries that option's cash after the *m* months' wages and fees and the scheduled sales. Options are compared only through the DP's node values, never by local cash after costs.
  - **Effect.** The soft cap no longer forces a sale at the floor: a lot is sold in month 0 only if no later month allowed by *m* prices it higher.
  - **Execution.** The engine sells, in month *j*, exactly the lots the schedule assigned to *j*, through `sellCargoQty` and the depth layer.
- **Lots still unsold after *m* months** stay aboard as **held** cargo. They reduce the free tonnage of the next delivery (`buyCargoQty`'s weight cap counts them). They are offered, together with the rest of the cargo and in the §4.3 sale order, in the arrival sale and *m* schedule of every later delivery. A plain `wait` at the same port does **not** offer held lots: only an *m* schedule sells them, so plain waits don't duplicate *m*.
- **Deadline.** A wait is allowed only if it doesn't take monthIndex past 24. A wait that takes monthIndex to 24 triggers `finishCampaign`: E-net liquidates through the depth step, S24-net values the lots in port at 24, and S-net values them at zero. The DP sees the same rule as the net it is solved for.

**Explicit DP state.** The adaptive-routes DP node (port, month) becomes (port, month, *H*), where *H* is the held-lot vector, exact in lots, with the hold empty except for *H*. This is a forward DP over reachable nodes, keeping the most cash per node. *A* is carried along each node's best path, not keyed, as debt and standing already are (`adaptive-routes.md:201`). With *r* = 1 the carried *A* resets every month, so the DP is exact in *A*; that is the setting where C10 tests containment (reported, not a gate). Plans are feasible policies, and so are **lower bounds**.

**Terminal depth step.** `finishCampaign` prices liquidation itself. The research wrapper replaces the global `finishCampaign`, which is the Atlas wrapper at `:3175` around the engine's function. Before calling it, the wrapper:
1. computes, for the cargo aboard, the depth-adjusted liquidation value at the current port and month `min(23, monthIndex)`, in the §4.3 order;
2. records the engine's undepressed value of the same cargo.

It then calls the wrapped `finishCampaign` and afterwards adds (adjusted − undepressed) to `state.cash`. Lots the hard cap can't absorb are recorded as written off. S- and S24-net are computed from the cash recorded before the call (§4.1).

**Cap types and scope.**
- **per good:** *Q* lots per good;
- **pooled:** *Q_t* tonnes per port, across goods;
- **S1:** Quanzhou only, all goods. It is first or tied first in 16 of 18 seen plans (§3 item 3);
- **S2:** all five ports;
- buying is unchanged (supply stays unlimited).

**Judgement ranges (hypothetical).**

| Parameter | Grid | Note |
| --- | --- | --- |
| per-good *Q* (lots) | 10, 15, 20, 25, 30, 40, 60 | refined after an independent reviewer's arithmetic (owner decision); **informed** |
| pooled *Q_t* (t) | 60, 90, 105, 120, 135, 150, 180, 240, 300 | around the dhow (120 t) and junk (300 t) holds |
| recovery *r* per month | 0.1, 0.25, 0.5, 1.0 | |
| shape | hard; soft | |
| sell-over-time | *m* ≤ 0 (disabled); *m* ≤ 2 | both solved |

*Q* = ∞ is run only for the identity check C1.

**Arithmetic on constants** (informed; base prices, Malacca buy price round(price × 1.03)):
- **(a) Revisit spacing**, from the skeleton's cycles (§3 item 1). The junk's 12-month *avoid headwind* cycle visits Quanzhou once, and Malacca and Calicut twice each (under S2 all three are capped). At Quanzhou, *r* = 0.25 leaves 0.75¹² ≈ 3% of the overhang and *r* = 0.1 leaves 0.9¹² ≈ 28%. The spacing between the two Malacca visits, between the two Calicut visits, and between the dhow's two Quanzhou visits is not derived (**OPEN**).
- **(b) Soft floor.** φ · 620 = 155 D, the floor for a clove lot at Quanzhou's base price. That equals the Malacca clove cost, so soft-cap excess cloves sell at about break-even there.
- **(c) Per-good caps.** Margins per tonne, Malacca→Quanzhou: cloves 620 − 155 = 465; pepper (310 − 113)/2 ≈ 98; ivory (820 − 608)/3 ≈ 71; teak (95 − 57)/10 ≈ 4. Textiles and porcelain lose money on this leg, and return-leg bulk earns about 6–8 per tonne.
  - **Sellable tonnage.** Under a per-good cap, the profitable sellable tonnage on this leg is 16*Q* t (*Q* + 2*Q* + 3*Q* + 10*Q*). The dhow fills 120 t from the top of that list; the junk takes up to 300 t.
  - **The junk's extra per Quanzhou delivery:** about 150 D at *Q* = 10 (40 t of teak); about 684 at 20 (18 teak lots in its remaining 180 t); about 2.7k at 25. At 30 it is about 4.7k outbound, plus about 0.9k of return-leg bulk, about 5.6k in all. About 8.7k at 40 and about 14.4k at 60 (outbound only).
  - **Against that:** the junk pays 20 D/month more in wages and loses time on its slower lane-months. Under *avoid headwind* only 16 of the 44 matter (12 dead zone, 4 crosswind). A slower month is worth roughly 9k: the dhow's capped margin per Quanzhou delivery at *Q* = 30 is about 22k (30 cloves × 465 + 30 pepper lots × 197 + 10 ivory lots × 212 = 21,980 D), and a round trip takes about 2.5 months (an assumption).
  - **The copy argument cuts both ways.** When the junk's profitable sellable tonnage is ≤ 120 t, the dhow is weakly ahead. Hence D2's interval.

**Planners and scoring** (M-1).
- **Depth-aware DP:** the adaptive-routes DP extended as above. For each candidate *m*, its fill buys lots in the §4.3 sale order while a lot's projected price under that *m*'s schedule exceeds its unit cost. Projections use the delivery's final port, arrival month + *j* and the carried *A*. The *m* months' costs then enter the DP's comparison of options.
- **Depth-naive:** the published decision sequence from `hazards-off.json` (paths, waits, no sell-over-time, **no withholding**: it sells whatever the market absorbs on arrival) executed in the depth world.
  - **Fills** are recomputed at each delivery by the published `planBuys` from the current state. It doesn't see depth, but it does see reduced cash, and reduced free tonnage because held lots count in `s.used()` and in the engine's weight cap.
  - **Held lots** are offered, in the §4.3 sale order together with the rest of the cargo, at each later arrival where the plan sells.
- **Copy-other:** the other ship's depth-aware decision sequence (paths, waits, *m*), executed with this ship's transit months (waits re-inserted where the policy forbids a departure) and the depth-aware fill at this ship's capacity.
- **Scored figure:** each ship's best of {depth-aware, depth-naive, copy-other}, all engine-replayed. This is fixed now; all three are feasible strategies.

**Runs.**
- Hazards off (every draw 0.99), *avoid headwind*, normal and hard.
- Cells: 2 vessels × 2 difficulties × 2 scopes × 2 shapes × (7 + 9) caps × 4 recovery rates × 2 sell-over-time settings = 2,048 depth-aware solves, plus the naive and copy-other replays.
- *Sail always* is exploratory.

### 4.4 Mechanism 2: payment timing and reserve rules

- **Settlement delay *k*** (hypothetical): 0, 1 or 2 months.
  - A sale moves its revenue from cash into a receivable due at month *t + k*.
  - The wrapper on `advanceTime(m)` first credits to `state.cash` every receivable due at or before monthIndex + *m*. It then calls the original `advanceTime(m)`, which advances monthIndex, adds debt interest at a six-month boundary (this touches only `state.debt`), and runs the end check.
  - So receivables are credited before interest and before the ruin check. Interest doesn't depend on cash, so its order relative to the credit doesn't change any number.
  - The wrapper replaces `window.advanceTime`, which `sailTo` and `waitInPort` resolve through the global binding. Liquidation proceeds are immediate, as in the game.
  - The planner counts receivables in the cash label but buys only with cash in hand. The receivables are carried along, not optimised (a lower bound).
- **Reserve rules** (applied in the fill before buying; floor cash ≥ 0, stricter than the engine's −250):
  - **G**: keep 60 D (`tests/03/baseline-harness.js:97`; `planBuys`).
  - **R-exp**: keep the largest cumulative outlay from purchase to the **first receipt**.
    - **First receipt:** the earliest month after purchase at which cash in hand rises. That is the earlier of the due month of any existing receivable, and the delivery's arrival month + *k* (arrival itself when *k* = 0).
    - **Outlays to that month:**
      - wages for scheduled sea months (fixture);
      - wages plus `getEffectiveLayoverFee` for each scheduled wait, at current standing;
      - for each headwind leg under *sail always*, expected retry months M · 0.35/0.65 at wages plus the origin fee;
      - expected doldrum burn on dead-zone legs, 0.25 × 20 D (probability 0.25 with no navigator, `:2229-2240`);
      - expected pirate tribute, on legs with no cloves or ivory aboard: piracy probability × min(cash, 75), using the destination's risk × 0.6 × survival multiplier (`:2256-2272`);
      - *k* months of wages plus the destination fee.
  - **R-worst**: R-exp with every expected term replaced by its maximum: one full retry per headwind leg, 20 D per dead-zone leg, 75 D tribute per leg, and a mutiny settlement of 2 × wages per leg (`:2287-2292`).
- **Arithmetic on constants.**
  - Slack to ruin under G is 310 D: 8.9 months of junk wages, or 20.7 of dhow wages.
  - A wait costs 35–50 D (dhow) or 55–70 D (junk) at normal and standing 0.
  - **Arithmetic only, not an explanation of the seen tails.** The junk at −45 D on a 3-month headwind leg (105 D of wages) would reach −255 D after two turn-backs (0.35² ≈ 12%). The junk's *sail always* tail shows no low outliers (minimum 553,638), and the mechanism doesn't apply to the dhow (wages 15). The cause of the two low dhow nets is **OPEN** until C1b records end causes.
- **Planner runs (L arm).** Hazards on, re-planning as `replanRun` (`research/03/models/adaptive-routes.mjs`), with the reserve rule as the fill.
  - Cells: 2 vessels × normal, hard × *sail always*, *avoid headwind* × *k* ∈ {0, 1, 2} × {G, R-exp, R-worst} = 72 cells, N = 300 keyed seeds each (300001–300300).
  - No depth (*Q* = ∞) in these cells.
- **Harness runs (H arm, owner decision).** A research copy of `harnessPlan` and `harnessPlay` (`tests/03/baseline-harness.js:87-124` at `d2d66a3`).
  - **The reserve changes only how much the harness buys, never which lane it picks.** Lanes are ranked by `perMonth` exactly as the published code computes it, keeping 60 D. The chosen lane's buys are then recomputed in the same greedy order, keeping the reserve (60 D, R-exp or R-worst for that one leg) instead.
  - **Why this design.** In the published code the ranking depends on the 60 D, because `perMonth` uses the quantities bought (`:97-104`). Separating the two steps is possible in a research copy, and it isolates the reserve's effect on quantity from any change of route.
  - Cells: 2 vessels × normal, hard × *sail always*, *avoid headwind* × *k* ∈ {0, 1} × {60 D, R-exp, R-worst} = 48 cells, N = 300 keyed seeds each (same seeds).
  - Under *k* ≥ 1 the copy plans with cash in hand. This is the myopic, student-like case.
- **Interaction (exploratory).** S2, pooled, hard, *Q_t* = 150, *r* = 0.25, *m* ≤ 2, crossed with *k* × reserve.

### 4.5 Debt

- Starting debt (hard: 500 D) accrues 5% at each six-month boundary (`:2310-2314`).
- No strategy repays early, as in adaptive routes.
- The −250 D floor works as an interest-free overdraft. The reserve rules don't use it.

### 4.6 Paired randomness

- **Keyed draws.** Each draw is *u* = the first output of mulberry32(FNV-1a-32(`seed|role|month|key`)).
  - Keys: `sailTo` by (departure month, origin, destination); `waitInPort` by (month, port).
  - Every `sailTo` and `waitInPort` advances the month by at least 1 (`:2182`, `:2301`), so keys don't repeat within a campaign.
- **Roles and their engine call sites at `d2d66a3`** (generated from the source by the code, then checked against this list):

  | Role | Line |
  | --- | --- |
  | story occurrence | 2172 |
  | story pick | 2173 |
  | headwind damage | 2216 |
  | turn-back | 2220 |
  | teak | 2223 |
  | transition roll | 2231 |
  | storm damage | 2235 |
  | mildew | 2250 |
  | piracy | 2263 |
  | mutiny | 2287 |

- **Feeding.** Values go through `RandomScript` (`tests/03/engine/load-engine.mjs:84-94`).
- **What pairing means.** Strategies sailing the same lane in the same month meet the same draws. Strategies sailing differently still meet different events.

### 4.7 Checks, run before any result is read

Each planted defect is applied to a temporary copy of the research code (C8: a temporary clone), never to `projects/03/index.html`. If C1–C8 fail, nothing is scored, and the fix is reported with both outputs. C9 is reported. C10 follows the rule below the table.

**Thresholds are frozen.** No prediction threshold changes after C1b reveals the end causes of the published runs. Any change for any reason goes in §9 as a deviation, stating whether results had been seen.

| # | Check | Pass | Planted defect that must make it fail |
| --- | --- | --- | --- |
| C1 | **Identity, hazards off.** All wrappers at identity settings (*Q* = ∞, *k* = 0, reserve G, *m* = 0) | All 18 published S-greedy plans (*sail always* and both *avoid* policies, three difficulties) are reproduced action for action, with their engine nets exactly (e.g. 645,687 and 270,012 D, `adaptive-routes/results.md:61,70`) | the settlement wrapper credits receivables one month late even when *k* = 0 |
| C1b | **Identity, hazards on, before keyed draws.** Seed-stream feed as `harnessReset` (mulberry32 per seed, 200001–200300), identity wrappers | Every re-planning and harness net in `hazards-on.json` is reproduced exactly (18 cells × 300 × 2) | the identity-setting depth wrapper subtracts 1 D on the first sale of each campaign |
| C2 | **Engine replay of every scored plan.** The pure model (adaptive-routes `Sim`, extended) and engine-plus-wrappers run side by side | Cash, month, port, debt, cargo, *H*, *A* and receivables are equal after every action; no scripted draw left over | recovery applied **once per action in the wrapper only** (the model stays correct). It must be flagged on the first multi-month action |
| C3 | **Conservation** (§4.2), plus a forced turn-back unit test: Aden→Calicut in January (headwind), 10 cloves aboard, turn-back *u* = 0 | Identities hold in every run. Unit test: port Aden, loaded 10, delivered **0**, cargo 10 aboard | a turned-back voyage counted as delivered (the unit test gives delivered 10 ≠ 0) |
| C4 | **Keyed draws.** (i) `rng.remaining` = 0 after each action. (ii) An independent key rebuild from `state` read before the action, with a separate FNV/mulberry32. (iii) A key-grammar whitelist that rejects vessel, policy, reserve, *k* or *m* tokens. (iv) **Call-site role label:** `RandomScript.next` takes `new Error().stack` and reads the caller's line. A research loader evaluates the extracted script with `lineOffset: 1588` (its `<script>` tag is on `index.html` line 1589), so stack lines equal file lines. The line is mapped through the §4.6 table and must equal the sequencer's role; a unit test asserts that a forced turn-back reports line 2220. (v) **The source can't be bypassed.** `harnessReset` installs its own RNG (`baseline-harness.js:69`), and so does any reset, so the keyed source is reinstalled after every reset. Every hazards-on action asserts that RandomScript was called exactly the number of times the role sequence predicts | All five hold for every draw and action | (a) the vessel in the key fails (iii); (b) the sequencer swaps the turn-back and headwind-damage roles, failing (iv); (c) the keyed source not reinstalled after `harnessReset` fails (v), because the call count is 0 |
| C5 | **Depth arithmetic.** Per good: *x* = *Q* − 1, *Q*, *Q* + 1. Pooled: a three-good sale (cloves 1 t, pepper 2 t, ivory 3 t) with *Q_t* = 10 starting from *A* = 7 (sale order by price per tonne; a 3 t lot refused when *x* + 3 > 10 while a later 1 t or 2 t lot that fits is still offered); soft floor; *r* = 0 and 1; a two-month action | Exact hand values | (a) `x + w ≤ Q` replaced by `x < Q` (only the multi-weight case catches it); (b) sale order by price per lot instead of per tonne |
| C6 | **Reserve arithmetic.** Four hand-worked deliveries: scheduled waits; a *sail always* headwind leg; a dead-zone leg with no cloves or ivory (doldrum and tribute terms); *k* = 2 with an existing receivable due earlier | Exact hand values; hazards-off cash never below 0 under R-exp | (a) wait months omitted; (b) "first receipt" taken as arrival + *k*, ignoring the earlier receivable |
| C7 | **Boundary rules.** Three scripted runs: last voyage arrives at 25; last voyage arrives at exactly 24; a ship waits into 24 with held lots | (25) E counts the cargo, S and S24 count zero. (24) E and S24 count it at the month-23 price after the depth step, S counts zero. (wait to 24) as the 24 case. All against `state.startEquity` | (a) S counts goods in transit; (b) S24 drops the arrival at 24 |
| C8 | **Game untouched.** SHA-256 of the real path `projects/03/index.html` before and after every run; `node --test "tests/03/engine/*.test.mjs"` and `node tests/03/engine/planted-defects.mjs` pass | Same hash; suites pass | in a temporary clone, `index.html` is modified during a run, and C8 must fail. A variant that hashes a **copy** taken at start would miss it; it is run once to show the difference |
| C9 | **Monotonicity**, as adaptive-routes check 2, for the depth-aware DP | Reported, not a gate | — |
| C10 | **Sell-over-time containment** at *r* = 1 (DP exact in *A*): each cell's *m* ≤ 2 value ≥ its *m* = 0 value. **Not a gate** (owner decision). It tests the search, not the mechanics (C2 does), and its brute-force follow-up starts at monthIndex 18 | Holds in every *r* = 1 cell; violations at *r* < 1 reported | options restricted to *m* ∈ {1, 2} |

**If C10 fails** (owner decision), the planner is checked against brute force before anything is scored.
- **Instance, fixed now.** Dhow and junk, normal, *avoid headwind*, S2, pooled, hard, *r* = 1, *Q_t* ∈ {120, 150}, plus every C10-failing cell (if any falls outside these). The search starts from the DP's own state at monthIndex 18 and runs to the end, under each net's rule.
- **Brute force.** It enumerates every action sequence without pruning: waits, deliveries of 1–3 legs and *m* ∈ {0, 1, 2}, each with the §4.3 fill and schedule.
- **Agreement.** (i) Brute force's independent re-evaluation of the DP's chosen plan equals the DP's value exactly. (ii) Wherever the DP falls short of the brute-force optimum, the optimum's path passes through a node where it was not the max-cash label (the shortfall is pruning).
- **If they agree,** the C10 failure is reported as a property of the max-cash planner. Adaptive-routes check 2 already found 371 of 22,446 deliveries non-monotone (`adaptive-routes/results.md:38`).
- **If they disagree,** it is a bug: it is fixed, everything is rerun, and both outputs and the bug are reported (§8).

## 5. Predictions and what would count against them

Scored on engine-replayed nets, using the scored figure of §4.3. "Flip point" means the largest grid cap at which the dhow's net ≥ the junk's. "No flip" means the junk is ahead at every grid point.

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| D1 | **A pooled cap acts as a hold size.** S2, pooled, hard, *r* = 1, *m* ≤ 0, *avoid headwind*, E-net: flip point ∈ {105, 120, 135} t at normal and hard | informed (skeleton boundary 120–131 t, `economy-skeleton/results.md:65`) | no flip, or flip point ≤ 90 or ≥ 150, in either difficulty |
| D2 | **Two-sided per-good flip.** S2, per good, hard, *r* = 1, *m* ≤ 0, E-net: the dhow is ahead at *Q* = 15 and the junk at *Q* = 40, so the flip point ∈ {15, 20, 25, 30} | informed: no run outputs, but the fixture and the reviewer's constant arithmetic were seen and the grid was chosen after them (§4.3 (c)) | junk ahead at *Q* = 15, or dhow ahead at *Q* = 40, in either difficulty |
| D3 | **One limited port is routed around.** S1, either cap type, hard, *r* = 1, *m* ≤ 0: junk/dhow ≥ 1.5 at every cap | partly informed (Calicut and Aden are the other clove outlets in the seen plans, §3 item 3) | below 1.5 in any cell |
| D4 | **Recovery threshold.** S2, pooled, hard, *Q_t* = 150, *m* ≤ 0: *r* 1 → 0.25 lowers the junk's net by ≤ 5%, and *r* 1 → 0.1 by > 5% | partly informed (revisit spacing from the skeleton's cycles, §4.3 (a)) | either bound fails at normal or hard |
| D5 | **Soft caps bite less.** For each scope and difficulty (pooled, *r* = 1, *m* ≤ 0), soft flip point ≤ hard flip point | blind (arithmetic (b)) | soft flips where hard doesn't, or soft's flip point is larger. Untestable for a scope and difficulty where neither flips |
| D6 | **Selling over time pays for the larger hold.** Scored on the junk's **depth-aware** plan with *m* ≤ 2 (not the best-of figure). An option with *m* ≥ 1 counts only if the policy allowed a departure from that port in at least one of its *m* months. Equivalently, waits that the *m* = 0 plan from the same node also takes are excluded, so forced *avoid headwind* waits don't count. S2, pooled, hard, *r* = 1: in each difficulty, the plan uses a counted *m* ≥ 1 in at least 4 of the 6 cells with *Q_t* ≤ 150 (60–150). At *r* = 0.1 it uses one in none of them | blind with respect to runs, but the margin arithmetic rests on R_cap, which was seen (a junk overhang of 150 t of cloves × 465 ≈ 70k D, against a month valued at about 27.6k) | either half fails in either difficulty |
| D7 | **Selling over time moves the flip.** The pooled hard *r* = 1 flip point with *m* ≤ 2 is lower than with *m* ≤ 0 in at least one difficulty. A flip under *m* ≤ 0 with no flip under *m* ≤ 2 counts as lower | blind | equal or higher in both. Untestable if neither setting flips |
| L1 | **Ruin is rare on the planner's path.** *k* = 0, G: ruin in ≤ 3 of 300 runs in every L cell | informed: the threshold was set with the seen tail in view (two plausible ruins in 300, dhow normal *sail always*, §3 item 3) | > 3/300 in any of 8 cells |
| L2 | **The reserve removes ruin.** R-exp: 0 of 300 ruins in all 24 L cells | blind | any ruin under R-exp |
| L3 | **A reserve is cheap.** *k* = 0, *avoid headwind*, normal: paired median (G − R-exp) ≤ 4% of G's median, for each ship | blind; the magnitude comes from arithmetic on seen numbers. Delaying C\* by ln(C₀/(C₀ − R))/ρ months at R_cap, with R = 300 D (an **assumption**), costs about 13.8k (junk) and 5.3k (dhow): **2.1% and 2.0%** of the re-planning medians 644,684 and 268,744 (`adaptive-routes/results.md:98,89`) | > 4% for either ship |
| L4 | **A one-month delay costs the junk more.** R-exp, *avoid headwind*, normal, *k* = 1 vs 0: the junk's median falls 10–25%, the dhow's 5–15%, and the junk's fall is larger | blind with respect to runs; the bands were narrowed from an independent reviewer's arithmetic: ρ scaled by T/(T + k), T ≈ 2.5 months, an assumption, **OPEN**; about 17% and 10%) | any bound fails |
| L5 | **The larger hold is more exposed.** *k* = 2, G: junk ruins ≥ dhow ruins in each L policy × difficulty cell | blind | dhow ruins > junk ruins in any cell. **Untestable** in a cell with fewer than 5 ruins across both ships |
| H1 | **The myopic harness is more exposed, and the reserve fixes it cheaply.** *k* = 0. (a) In each harness cell, ruins under 60 D ≥ re-planning ruins under G on the same seeds. (b) R-exp gives 0 ruins in all 16 harness cells at *k* ∈ {0, 1}. (c) Paired median (60 D − R-exp) ≤ 2% of the 60 D median in every *k* = 0 cell | (a) informed (harness tail 40,299 then 52,891, and the dhow hard and survival pairs, §3 item 3); (b), (c) blind | (a) fails in any cell with ≥ 5 ruins across both strategies (otherwise untestable); (b) any ruin; (c) > 2% in any cell |
| B1 | **A strict deadline costs the dhow more, but less than the plan endings suggest.** No depth, *k* = 0, hazards off, *avoid headwind*, normal: DP-S's S-net / DP-E's E-net ∈ [0.80, 0.90] for the dhow and [0.92, 0.97] for the junk | informed. **Floors known in advance**, from feasible strict plans that sell the final cloves at month 23 instead. Dhow: sell at Calicut at month 23, 120 × 354 = 42,480 D, giving 215,292 / 270,012 ≥ 0.797 (215,307 if the last leg's 15 D isn't charged; same ratio to three places). Junk: (591,122 − 35 − 1,500) / 645,687 ≥ 0.913. The bands are set above these floors | outside either band. A ratio in [0.797, 0.80) for the dhow, or [0.913, 0.92) for the junk, counts as **contradicted**. Only a ratio below the floor is a planner defect, reported as such |

**Validation, not predictions:** C1–C10.

**Decision rule (fixed now).** Results are reported whatever they show; each line says what is concluded.
- **D1 supported:** a pooled cap is an effective hold size in the engine. Contradicted: it isn't, and the curve is reported. A mechanism follow-up needs its own protocol.
- **D2 supported:** under per-good depth the larger hold's advantage survives down to about 15–30 lots per good, because the junk diversifies into lower-margin goods. Contradicted on the low side (the junk is ahead at 15): diversification is worth more than the slower months. On the high side (the dhow is ahead at 40): the junk's slower lane-months cost more than the arithmetic says. Report the cells.
- **D3:** supported means one limited port changes little because ships reroute. Contradicted means a single port's depth matters, and its route share is reported.
- **D4:** supported means recovery faster than about 0.25 per month is effectively full for semi-annual or annual visits. Contradicted means revisit timing is tighter than the cycles suggest, and the spacing is measured.
- **D5:** contradicted means the soft floor's near-break-even pricing hurts more than a hard stop, and this is reported as a property of φ = 0.25.
- **D6, D7:** supported means the inventory question has an answer in time: the larger hold pays by waiting to sell. Contradicted means the time cost of waiting dominates.
- **L1–L5:**
  - L1 contradicted: ruin is a real cost of the greedy fill on the planner's own path.
  - L2 contradicted: R-exp is too small, and its ruin cases are listed with their outlays.
  - L3 contradicted: insurance is expensive, and the cost per ship is reported.
  - L4: the bands say whether delay hits the larger hold harder.
  - L5 contradicted: the dhow's lower cash buffer matters more than the junk's longer cash-limited phase.
- **H1:** supported means the reserve matters mainly for myopic play, which is the teaching-relevant case. Any teaching use is the owner's decision.
- **B1:** supported means the month-24 end effect is real but modest once the plan is re-optimised. Below band but at or above the floor (contradicted) means strict re-optimisation gains less than expected. Below the floor means DP-S missed a known feasible strict plan, which is a planner defect. Above band means the month-24 effect is smaller still. Published nets include the liquidation of a final cargo on arrival at month 24 under the game's end rule. A strict months-0–23 reading would lower the dhow's normal *avoid headwind* S-greedy net by at most about 20% and the junk's by about 9%, which widens the junk's lead.
- Nothing here proposes a game change.

## 6. Choices fixed in advance (forking-paths guard)

| Choice | Value | Selected on the result? |
| --- | --- | --- |
| Per-good grid | 10, 15, 20, 25, 30, 40, 60 | **Yes, on arithmetic:** chosen after an independent reviewer's constant arithmetic (owner decision); D2 is labelled informed |
| Pooled grid, *r*, η, φ, *k*, *m* | §4.3, §4.4 | No: judgement ranges |
| S1 = Quanzhou | first or tied first in 16 of 18 seen plans | **Partly:** chosen from seen plan tallies |
| Scored figure | each ship's best of {depth-aware, depth-naive, copy-other} | No: fixed before runs |
| Policies, difficulties | §4.3, §4.4 | No |
| N, seeds | 300; 300001–300300 | No |
| Thresholds | as stated | Partly: D1, D2, B1, H1(a) and L1 were set with seen outputs or arithmetic in view; L3 and L4 come from arithmetic on seen numbers |
| Reserve floor | cash ≥ 0 | No |

**Confirmatory:** D1–D7, L1–L5, H1, B1. **Exploratory:** *sail always* depth runs; survival; the interaction arm; all S24-net figures; anything chosen after output.

**One-sentence finding, drafted before running:** "Market depth erodes the junk's advantage only when it caps total saleable tonnage near 120 t, or per-good sales near 15–30 lots, and withholding stock for a month or two recovers part of that. A cash reserve costs about 2% of profit, and matters mainly for myopic play. A strict month-23 deadline removes at most about a fifth of the dhow's profit in the published plans and under a tenth of the junk's."

## 7. Outcomes and verdict

- **Interesting outcome:**
  - D2's flip falls outside 15–30, either way;
  - D6 or D7 holds, so selling over time is a real lever for the larger hold;
  - L1 or H1(a) shows ruin on realistic paths.
- **Null or boring outcome:** every prediction holds. **Worth knowing: partly.** It quantifies inventory-months and reserve costs per ship, though D1 is implied by the skeleton.
- **Dead outcome:** C1, C1b or C2 can't be made to pass. A C10 failure is not a dead outcome (owner decision).

**Points that still argue for caution** (for the owner):
1. **The pooled flip point is largely predicted** by the skeleton (D1). The informative depth outputs are D2's interval, D6–D7 and inventory-months.
2. **Planner-dependence.** *A* and receivables are carried, not optimised. Thresholds are thresholds for these planners.
3. **The plausible ruins in `hazards-on.json` are unconfirmed.** C1b reproduces those runs and records their end causes, as a check output before any new result. This is a check output, recorded before any new result.
4. **Published nets and month 24.** Published nets include the liquidation of a final cargo on arrival at month 24 under the game's end rule. A strict months-0–23 reading would lower the dhow's normal *avoid headwind* S-greedy net by at most about 20% and the junk's by about 9%, which widens the junk's lead.

**Execution proxies**
1. **Cheapest decisive experiment:** the D arm at *r* = 1, *m* ≤ 0, S2. That is 2 vessels × 2 difficulties × 2 shapes × 16 caps = 128 solves, which decides D1, D2 and D5.
2. **Baselines a hostile reviewer would demand:** the published plans (C1, C1b), depth-naive, copy-other, the S- and S24-nets beside E, reserve G, and the 60 D harness.
3. **Most likely null:** D1 lands where the skeleton put it, and D2 lands inside its interval.
4. **Cost:**
   - The L arm is 21,600 re-planning campaigns: 2 times adaptive routes' 10,800 hazards-on campaigns, or 4 times its 5,400 re-planning ones. Adaptive routes took 5 min 38 s in all (`adaptive-routes/results.md:6`).
   - The H arm is 14,400 cheap harness campaigns, and C1b reruns 10,800.
   - **D-arm solve-time limit, fixed now.** 60 s wall-clock per depth-aware solve, and 4 h for the whole D arm.
     - **Fallback 1.** If any solve exceeds 60 s, the D arm switches in **every** cell (not only the slow ones) to blocks of 10 lots per good. The depth-aware fill buys in multiples of 10 lots per good (rounded down), and the schedule sells whole blocks: a block is sold in a month only if all 10 lots are absorbed then, each lot priced as in §4.3. So *H* is always a multiple of 10 per good, and no lots are written off on the plan side. The engine executes the same block quantities, so C2's exact cargo equality still holds.
     - **Fallback 2.** "Would still exceed 4 h" means the mean wall-clock time of the first 64 solves (after fallback 1, if applied) × the total number of D-arm solves exceeds 4 h. The pooled grid is then reduced to {90, 120, 150, 240} t, and scoring changes as follows:
       - **D1:** supported if the dhow is ahead at 120 and the junk at 150. Contradicted if the junk is ahead at 90 or the dhow at 150, or there is no flip. **Untestable** if the dhow is ahead at 90 and the junk at 120, because 105 can't be told apart from 90–104.
       - **D5 and D7:** scored as written on the reduced grid.
       - **D6:** the bar becomes at least 2 of the 3 cells with *Q_t* ≤ 150 (90, 120, 150), and none at *r* = 0.1.
     - Either fallback is logged in §9 before any result is read.
   - The total is plausibly under an hour in Node, with one heavy job at a time.

**Prior-art grounding:** the impact and settlement forms are generic modelling choices. No calibration literature is claimed.

**Verdict: PURSUE.** The owner's acceptance is recorded by merging the PR that registers this protocol.

## 8. Implementation, outputs and stopping

- **Code:** `research/03/models/depth-liquidity.mjs` (Node ≥ 22, no dependencies).
  - It reuses `Sim`, `solve`, `planBuys` and `replanRun` from `research/03/models/adaptive-routes.mjs`, `tests/03/engine/load-engine.mjs` (`harness: true`) and `research/03/models/economy-skeleton-params.json`.
  - It holds a research copy of `harnessPlan` and `harnessPlay` (`tests/03/baseline-harness.js:87-124`) with the reserve as a parameter. The copy's identity at 60 D is checked by C1b.
  - The wrappers (`sellCargoQty`, `advanceTime`, `finishCampaign` over the Atlas wrapper at `:3175`, `renderAll` as a no-op) are installed with `vm.runInContext`.
- **Outputs:** `research/03/results/<run date>-mn-depth-liquidity/`:
  - `depth.csv` (per cell: E/S/S24 nets for all three strategies, the scored figure, cargo outcomes, inventory-months, the *m* chosen);
  - `liquidity.csv` and `harness.csv` (quantiles, ruin counts, paired differences);
  - `checks.json` (C1–C10 with plant outcomes, and the end causes of reproduced published runs);
  - `predictions.json`;
  - `results.md`, failures first.

  Per-seed nets go in the repository only if small (under about 1 MB); otherwise they are archived externally with a checksum.
- **Provenance to record:** commit, engine SHA-256, Node version, RNG and key grammar, seeds, and counts of attempted, completed, ruined and excluded runs per cell.
- **Stopping:** each part runs once. N is not raised. A bug found after results is fixed, the whole run is repeated, and both outputs and the bug are reported.
- **Order:** C1, C1b, C2–C8, C10, then the D arm, the L arm, the H arm and B1. Each arm is run whatever the others show.

## 9. Deviations

Append dated entries here, below this line, before any result that depends on them is reported. Each entry says what changed, why, and whether results had been seen.

---

### 2026-11-24 — registration, engine pin, run setup and interpretations, fixed before any run

Written before any code of this study was run. No output of any kind had been seen: only `node --check` on the study code, and a smoke test of the research loader (one scripted turn-back, to confirm that stack lines are read).

**Registration.** This protocol was registered when PR #28 merged into `main` as `1f08700`, on 2026-11-23. The Status row still reads "Registered, not run" because the text is frozen; this entry and the results supersede it.

**Deviation 1: the engine pin moved (the engine did not).**
- The Engine row pins `projects/03/index.html` at `d2d66a3`, page SHA-256 `1c901dd1…`. The run is from `main` at `d83fd9f`, after #22 and #30 merged; the page is now `5c722df9d8432d9a5df763d8a5a460b6ccbb9f4e1730ae008a8e58908ff8dbd3`.
- **The engine script is byte-identical.** The single bare `<script>` block, extracted with the loader's own `engineScript`, hashes to `6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c` (62,591 characters) at both revisions. Verified by this study's author on both files.
- **What changed is the display layer.** The page has a second script, `<script id="atlas-adapter">`, which no loader evaluates (the loader takes only the bare `<script>`; adaptive routes ran the same way). It grew from 42,664 to 59,220 characters (SHA-256 prefix `c4786b251b1c` → `ee250115ca64`). In both revisions it reassigns only `renderAll`, `startSimulation` and `finishCampaign`, and writes no `state` field. Its `finishCampaign` calls the engine's function first, then writes display text. The rest of the diff is markup and CSS. The engine script's `<script>` tag moved from line 1589 to line 1693.
- **How the checks are adapted, without weakening them.**
  1. *Pin.* The research loader (`research/03/models/load-engine-research.mjs`) refuses to load unless the engine script it is about to evaluate hashes to `6fba1ee7…`. Every output records the engine-script hash and the page hash of the run. A page-hash pin would fail on display-only changes; the engine-script pin fails on any change to code the runs actually execute.
  2. *C8 is unchanged.* It hashes the whole real page, `projects/03/index.html`, before and after every run, and requires equality. It compares the page with itself, not with a pin, so the move does not affect it.
  3. *Line numbers.* `lineOffset: 1588` is kept, as §4.7 says, so stack-trace lines equal the line numbers of the file at `d2d66a3`, which is what the §4.6 role table and every `:NNNN` citation in this protocol refer to. In the current file the same lines are 104 lower (2172 → 2276, …). The role table is also generated from the loaded script and compared with the frozen table (C4).
- **The finishCampaign wrapper.** §4.3 says the research wrapper replaces "the Atlas wrapper at `:3175`". That wrapper is in the adapter script, which is not loaded, so in the loader's context the global `finishCampaign` is the engine's own function, and the research wrapper wraps that. Money is unaffected: the Atlas wrapper only adds display after calling the engine's function.

**Deviation 2: output directory.** `research/03/results/2026-11-24-depth-liquidity/` instead of `<run date>-mn-depth-liquidity/`, as the owner's run instruction names it, matching the sibling directories. Large traces go outside the repository, with SHA-256 checksums in a manifest.

**Deviation 3: how adaptive-routes code is reused.** `adaptive-routes.mjs` runs its whole study when imported. Its definitions (everything above its `// --- main` marker: `Sim`, `solve`, `planBuys`, `deliver`, `projectArrival`, `PATHS`, …) are imported from a generated copy of that text, with only its two relative paths made absolute; its SHA-256 is recorded. Where the protocol changes a function (the DP's labels and terminal rules, the fill's reserve, the delivery's sale step, `replanRun`'s wrappers and draws), the change is a copy in `depth-liquidity.mjs`. C1 and C1b check that each copy reduces to the published function at identity settings.

**Code and runtime.**
- Code: `research/03/models/depth-liquidity.mjs` and `research/03/models/load-engine-research.mjs` (the research copy of `tests/03/engine/load-engine.mjs`; its header lists the five differences).
- Runtime: Node v24.22.2 (the `node.exe` bundled with Adobe Creative Cloud Experience, run as Node). One heavy job at a time, single-threaded.
- Phases: `checks`, `timing`, `darm`, `c9`, `brute` (only if C10 fails at *r* = 1), `larm`, `harm`, `b1`, `score`, in the order of §8.

**Interpretations of §4 (choices the registered text leaves open).**
1. **C1, "action for action".** The published decisions are regenerated by the published planner, and must equal the published decision strings. They are executed by the depth-naive executor at identity settings. The resulting log is compared with the published `actionsLog`: every buy, wait, sail and repair exactly, with cash, month, port, debt and end state after each. Sells within one arrival are compared as a set, with the state at the end of the block. The §4.3 sale order differs from `COMMODITIES` order, but at *Q* = ∞ it cannot change any number. The log is then replayed through the engine with identity wrappers and compared after every action. The published log itself is also replayed through the wrappers.
2. **C1b.** This study's re-planning and harness copies run at identity (G, *k* = 0, *Q* = ∞) on `harnessReset`'s own stream. The published `harnessPlay` is also run through the same wrappers. End causes (ruin or month 24) are recorded for every reproduced run. The planted defect is run on one cell (dhow, normal, *sail always*) × 300 seeds.
3. **C2's scope.** C2 replays every hazards-off plan that enters a scored figure: in the D arm, all three strategies under all three rules in every cell; and B1. The L and H arms run policies in the engine with hazards on. Their figures come straight from the engine; the pure model is hazards-off planning only, so there is no side-by-side model there. C3 and C4 apply to every L and H run.
4. **Accounting.** The depth-aware DP plans in engine-exact accounting (the standing tariff cut applied), so its value is the engine's value. B1 and the L arm keep the published planning accounting (no cut), as C1 and C1b require.
5. **DP-E, DP-S, DP-S24.** One forward pass gives all three: intermediate labels (most cash per node) do not depend on the rule; only the choice of terminal label does.
6. **Ruin before month 24.** The ruin liquidation happens at a month ≤ 23, so S- and S24-net count it, through the depth step. Receivables due ≤ 23 count at face value, later ones zero. A lot the hard cap cannot absorb at the end is *written off* under E and *unsold at deadline* under S and S24.
7. **Schedule projection.** Read literally: for month *j*, *x* = *A* after the months to arrival plus *j* months of recovery, plus the lots already assigned to month *j*. Lots assigned to earlier months are not carried into a later month's projection. Execution prices every lot through the real *A*. A lot the projection placed but the market refuses stays aboard, held.
8. **Order inside a schedule.** Lots are assigned in the arrival month's sale order. Each month's sales are executed in that month's sale order.
9. **Inventory-months.** After each sale step (an arrival sale, each month of *m*, the depth-naive arrival sale), every lot still aboard counts as offered and not absorbed. Each month advanced adds the sum of those lots × the engine's cost basis. Lost lots leave the count. New purchases join it only once offered.
10. **Delivered.** The intended sale port is the delivery's final port.
11. **Copy-other.** The other ship's plan under the same rule. *m* is clamped so that arrival + *m* ≤ 24.
12. **Scored figure.** For each net, the maximum over the three strategies under that net.
13. **B1's planner.** B1 is "no depth", and its floors are plans with the published greedy fill. So B1 uses the published greedy-fill planner, solved under each terminal rule and replayed with engine-exact accounting. DP-E must reproduce 270,012 and 645,687 D.
14. **Reserve details.**
    - R-exp's last term: *k* × (wages + the destination fee at current standing).
    - An outlay counts if the month it starts in is before the first receipt.
    - The tribute term uses the hold and the cash before buying. It applies unless cloves or ivory are already aboard. There is no standing halving: the protocol's formula has none.
    - R-worst: the retry term applies only under *sail always*; tribute is 75 D per leg unless cloves or ivory are aboard; mutiny is 2 × wages per leg.
    - The budget is max(0, cash − reserve).
15. **L-arm planner.** The DP's internal fill uses the same reserve rule. Settlement is modelled in the planning `Sim`; its label is cash + receivables; it buys with cash in hand.
16. **Statistics.** Ruin: the campaign ended with monthIndex < 24. Median: the element at index floor(0.5 × (N − 1)), as in the sibling studies. Paired median: the median of the per-seed differences. A ship is "ahead" for a flip if dhow ≥ junk.
17. **C4.** Unit tests, and a live check on every hazards-on action in every L and H run. The three plants are each run on 24 campaigns (2 vessels × 2 policies × 3 seeds × re-planning and harness, normal).
18. **C6's "hazards-off cash never below 0 under R-exp".** Re-planning with hazards off, in all 8 L policy cells × *k* ∈ {0, 1, 2}, with cash checked after every sail and wait.
19. **C9.** S2, pooled, hard, *Q_t* = 150, *r* = 1, *m* ≤ 2, both ships, both difficulties, a 400-point cash grid. The output is the cash label after the delivery, or final cash if the delivery ends the campaign.
20. **C10.** Compared on DP values under each rule, each *m* ≤ 2 cell against its *m* ≤ 0 counterpart. The brute force starts from the first node on the DP's plan path with monthIndex ≥ 18.
21. **D6's counted options.** An *m* ≥ 1 option in the junk's DP-E plan counts if some lane from its final port is allowed under *avoid headwind* in at least one of months arrival … arrival + *m* − 1.
22. **Hazards off.** Every draw is 0.99, as in adaptive routes. The research hooks on `sailTo` and `waitInPort` feed keyed draws and keep the cargo ledger; they change no engine behaviour.
23. **Exploratory parts.** The interaction arm, *sail always* depth runs and survival are run only if time allows after every confirmatory part. Otherwise they are listed as not run.


### 2026-11-24 — fallback 1 applied (a D-arm solve exceeded 60 s), before any D-arm result was read

**What happened.**
- The first 64 solves (`timing.json`, all S1 cells) took at most 0.60 s each, with a mean of 0.21 s, projecting 0.12 h for 2,048 solves. Neither fallback applied on that measurement, so the D arm was started unblocked.
- In cell 263 of 1,024 (`normal|S2|good|hard|10|0.1|m0`), the depth-aware solve for the dhow began at 16:54:32 and was still running at month 23 at 16:56:10 (≥ 98 s), with 9,393 nodes at month 23. Per-good hard caps with slow recovery leave many distinct held-lot vectors *H*.
- §7 says fallback 1 applies "if **any** solve exceeds 60 s", not only one of the first 64. So the unblocked D arm was stopped.

**What was seen.** The unblocked run writes its outputs only at the end, so nothing was written. Two partial log lines were seen while locating the slow solve: the dhow's scored E-net in cells 261 (`normal|S2|good|hard|10|0.25|m0`) and 262 (same, *m* ≤ 2), 45,908 and 55,279 D. No junk value was seen, and no other cell. Neither number enters any result: the D arm is rerun from the start under fallback 1.

**What changes (exactly as §7 defines fallback 1, in every D-arm cell).**
- The depth-aware fill buys in multiples of 10 lots per good. A block is bought if, in some month of the schedule, all 10 lots are absorbed and the block's projected total exceeds 10 × unit cost; the month with the highest block total is used, ties to the earlier month.
- The schedule assigns whole blocks.
- In execution, a block is sold in a month only if all 10 lots are absorbed then. This is checked on a copy of the market state, and the engine is then asked for exactly that quantity, so C2's exact cargo equality still holds.
- Held lots are therefore multiples of 10 per good on the depth-aware side.
- Unchanged: the depth-naive strategy (the published fill, and selling what the market absorbs); the terminal depth step, which is lot by lot as in §4.3; the L, H and B1 arms.
- Code change (block-atomic sale in `sellMonth`) committed with this entry, before any run under it.

**Fallback 2.** Per §7, it is decided on the mean time of the first 64 solves after fallback 1. Those are measured next (`timing-fallback1.json`), and any switch is logged here before the D arm runs.

### 2026-11-24 — correction to the fallback-1 entry (written after all results were seen)

The fallback-1 entry above misstates three things. An independent review of #44 found them; this entry corrects them and leaves the entry itself unchanged. No score changes.

1. **"Nothing was written" is false.** The unblocked run wrote no JSON or CSV output. But its log, `logs/darm.log` (SHA-256 `42b44bb9…`, listed in `results/2026-11-24-depth-liquidity/external-manifest.json`), holds the scored E-nets of both ships for the 263 cells it finished: 526 values, including every normal-difficulty S1 cell that feeds D3. The log was archived with the other logs. The author's own views of it were truncated lines, but the values were written, and anyone with the archive can read them.
2. **"No junk value was seen" is false as a statement about the record.** The log lines for cells 261 and 262 carry the junk's values, 46,223 and 56,130 D, alongside the dhow's 45,908 and 55,279. The author's terminal output was cut before the junk values, but the lines exist.
3. **The slow solve was cell 264, not 263.** Cell 263 (`normal|S2|good|hard|10|0.1|m0`) finished at 16:54:32. The dhow solve of cell 264 (`normal|S2|good|hard|10|0.1|m2`) started then and was still running at month 23 at 16:56:10 (≥ 98 s). Fallback 1 applies either way.

None of the unblocked values enters any result. The block-mode D arm was rerun from the start.

### 2026-11-24 — owner ruling on C6 (written after results were seen)

Owner ruling 2026-11-24: C6 observed after every sail and wait (after credit), all arms; written after results were seen.

- This is the reading the run used before any result: interpretation 18 checked cash after every sail and wait, after receivables are credited.
- The registered text of C6 does not limit it to the L arm, so the check is extended to the H arm on the same reading (phase `c6arms`, hazards off, R-exp, *k* ∈ {0, 1, 2}). This drops the arm restriction in interpretation 18's application.
- The lowest cash after charges and **before** credit is also reported, as a disclosure, not a gate. It can be negative when a receivable falls due in the same action. The unfunded-departure finding of #41 (`research/03/results/2026-11-24-unfunded-departures/`) is the same mechanism seen from the harness side.

### 2026-11-24 — changes already made after the registered results were read

- **C2's and C10's planted defects** were not run with the arms. Their code was added in `c90e138`, after every arm's results had been read, and both were run then (`checks-plants.json`). Both were caught. This departs from the §8 order.
- **`darm-rows.json` moved out of the repository.** The D arm ended at 17:10 UTC and wrote it into the results directory (1.8 MB, pretty-printed). At 17:14 UTC a one-off command re-serialised the same rows as compact JSON (1,513,395 bytes) into the external archive, recorded its SHA-256 in the manifest, and deleted the in-repository copy. The code was changed in the same commit to write it externally (file location only). `depth.csv` holds the same rows.

### 2026-11-24 — additions from the independent review, fixed before they are run (written after results were seen)

None of these changes a registered score. Each is reported in `results.md` with its own output file.

1. **Settlement at *k* ≥ 1 (new check, `settle`).** No existing check failed when receivables were credited a month late at *k* ≥ 1. The new check runs hazards off, for every L policy × difficulty cell × *k* ∈ {1, 2} × {G, R-exp}. It executes the L-arm planner's plan in the model (engine-exact accounting), replays it through the engine, and compares cash, month, port, debt, cargo, *A* and receivables after every action, plus the three nets. Planted defect: the wrapper credits a receivable one month late (`r.due <` in place of `<=`); it must fail. **L4 is quoted only if this check passes.**
2. **C8 through a real phase (`c8phase`).** Every phase except `checks` now asserts that the page it loaded has the same SHA-256 before and after, and exits non-zero if not. Planted defect: the `b1` phase is run in a child process on a temporary copy of the page, which is modified during the run; the phase must fail. The variant that hashes a copy taken at the start must miss it. The real page is never modified (the code refuses).
3. **Block granularity (exploratory sensitivity).** D2's registered score comes from 10-lot blocks. The S2, *r* = 1, *m* ≤ 0 cells are rerun unblocked (`DL_FALLBACK=0`, `DL_CELLS=s2r1m0`, outputs suffixed `-unblocked-r1`) and scored by D1's and D2's rules as a sensitivity. The registered D1 and D2 scores stay as scored.
4. **C6 on both arms** (above).
5. **D4 by planner.** D4's registered figure is each ship's scored figure, which comes from different strategies at *r* = 1 and *r* = 0.25. The depth-aware plan's own drop is reported beside it.
6. **Output format.** `liquidity-perseed.json` and `harness-perseed.json` (pretty-printed) are replaced in the repository by compact CSV. The JSON files move to the external archive with their SHA-256. The external manifest names its archive root.

### 2026-11-24 — confirmation-review items (written after results were seen)

None of these changes a registered score.

1. **Scoring from a clean checkout.** `score` now reads only committed files: `depth.csv`, `depth-unblocked-r1.csv`, `liquidity.csv` / `liquidity-perseed.csv`, `harness.csv` / `harness-perseed.csv` and `b1.json`. It no longer falls back to the external archive's JSON. Run from a clean checkout of this commit with an empty external directory, it reproduces the committed `predictions.json` byte for byte.
2. **Due-month unit test (`duemonth`).** A sale at month *t* with *k* = 1 must be credited when month *t* + 1 is reached, and with *k* = 2 at *t* + 2. The test checks this in the model and in the engine wrapper, each against those absolute months; in the engine it also checks that the cash change equals the revenue less the wait's charges. Planted defect: due month *k* + 1 on **both** sides, which the model-vs-engine checks cannot see. It must fail.
3. **Outputs only after C8.** Every phase that asserts the page hash now holds its outputs in memory and writes them only after the hash is shown unchanged. On a failure nothing is written. `c8phase` now also reports that the failing phase wrote no output.

## 10. Limits stated in advance

- Neither mechanism exists in the game. Results say what this game's economy would do with them under hypothetical parameters. Nothing here is historical.
- Perfect knowledge of prices, depth state and receivables, except for the H arm's myopia.
- Plans are lower bounds; *A* and receivables are carried, not optimised.
- Keyed pairing removes only the avoidable part of the noise.
- Buying stays unlimited; supply-side depth at Malacca is not tested.
- Published nets include the liquidation of a final cargo on arrival at month 24 under the game's end rule. A strict months-0–23 reading would lower the dhow's normal *avoid headwind* S-greedy net by at most about 20% and the junk's by about 9%, which widens the junk's lead. Comparisons with the earlier studies use the E-net.
- The plausible ruins in `hazards-on.json` remain unconfirmed until C1b records end causes.
- The sources motivate the structure only.

## 11. Sources (motivation only; verified 2026-11-23)

| Source | Verified locator | What it supports | What it does not support |
| --- | --- | --- | --- |
| Khalaf b. Isaac (Aden), account of business done for Ḥalfon b. Netanel, c. 1134. Cambridge University Library, T-S J1.53. Edited in Goitein, Friedman and Ashur, *India Book* IV (as cited on the record; volume not checked). English digital translation by Marina Rustow. **PGP 9063** | <https://geniza.princeton.edu/documents/9063/> (opened; English recto lines 15–35, the Judaeo-Arabic transcription and the Hebrew translation of lines 17 and 33 read) | **Storage and care costs:** warehouse rent and mats (line 26) and airing textiles (line 27). **Transaction costs:** cargo registration fees (28), brokerage and weighing (29) and packing (30). **Goods remaining:** two burds, musk and pepper (34–35). "Carried over" (33–34) refers to the credit balance, not to goods | Rates per unit or per month, market capacity, recovery, price impact or settlement delay. It is a single account from Aden in the 1130s. The English translation has two numeric slips (line 17: 1,496 for 1,469; line 33: 1,760 for 167 13/24). The transcription and the Hebrew agree, and 1,469 17/24 − 1,302 4/24 = 167 13/24. Nothing here depends on those figures. Reading note: `research/03/literature/2026-11-23-pgp9063-reading-note.md` |
| Eivind Heldaas Seland, "Networks and social cohesion in ancient Indian Ocean trade: geography, ethnicity, religion", *Journal of Global History* 8(3), 2013, 373–390, open access CC BY 3.0 | <https://doi.org/10.1017/S1740022813000338> (resolved; Cambridge Core text read up to character 100,000) | Monsoon seasonality forced long absences and limited communication between travelling merchants and their home base; visitors spent "a minimum of several months" in port (Introduction). Motivates waits and delayed information | Prices, demand capacity, payment timing or any quantity. Its region is the western Indian Ocean, its period mainly the 1st–3rd centuries CE, and its argument concerns trust networks. The game includes Malacca and Quanzhou. That this is the Seland work the original suggestion meant is an inference (**OPEN**) |
| PGP 5448 (already in this repository) | `research/03/literature/p02-p03-extended-search-addendum.md:13` | A deferred tax collection avoided a forced pepper sale into weak demand. The lower price is the writer's counterfactual | As recorded there: no causal return to waiting, and no price curve |

`research/03/literature/` covers neither PGP 9063 nor Seland (searched 2026-11-23). Both are openly accessible, so no document request is needed.
