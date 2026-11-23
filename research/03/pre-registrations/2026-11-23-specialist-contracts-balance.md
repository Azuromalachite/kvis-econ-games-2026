# Protocol: prices for specialist contracts (Monsoon Navigator, design study), final draft

| | |
| --- | --- |
| Status | **Registered by merging this file's PR; not run.** Nothing here has been coded or evaluated. Earlier drafts and their reviews are recorded in the PR. |
| Drafted | 2026-11-23, against `main` at `f475726` |
| Engine | `projects/03/index.html`, SHA-256 `1c901dd1cd6507a6deb9fabed4d91ebd5bd81204b583008eec5f5d4cd163442b` (the same hash the depth-and-liquidity protocol recorded at `d2d66a3`, so its line numbers hold) |
| Kind of study | **Design study, exploratory.** It sets balance prices for rules the owner has decided. The prices are balance parameters, not historical values. The aim is affordability plus a trade-off a student can see and follow. Budget neutrality with today's 180/160 D is not an aim. For the pilot, the intended lesson is **time value**: decline early, when money is the bottleneck; hire late, when time is |
| Kind of change | Research (Path B). **The game file is never edited.** The new rules exist only as research wrappers in a `vm` context. The game change itself is made **upstream** (Antooooon125/Week3-monsoon-navigator), then rebuilt with `scripts/build-prototype.mjs`, committed unchanged as `projects/03/index.html` and pinned, as `projects/03/README.md` ("Generated page") requires. That is a separate PR and the owner's decision |
| Status of results when run | Exploratory. Provenance-incomplete if any field `game-change-review` requires is missing, with the missing fields named |

## 1. What the game does today

From the engine at `f475726`:

- **Purchase.** `hireSpecialist(type)` (`index.html:2133-2145`) charges navigator 180 D, marines 160 D, tarpaulins 90 D once. It refuses if the item is already held or cash is short, and sets a boolean in `state.specialists` (`:1812`). Nothing clears it, so each lasts the whole 24-month campaign. The buttons follow the same conditions (`:2805-2812`).
- **Navigator.**
  - It multiplies the speed factor by 1.15 (`:2040`) and sets the storm threshold to 0.18 instead of 0.35 in transition months (`:2045`, used at `:2231-2240`).
  - It does not change whether a lane-month is a headwind, nor the 0.35 turn-back draw (`:2220`).
  - A turned-back attempt still costs `calc.months` of wages and time (`:2203-2204`, `:2301`), so a shortened leg also shortens its failed attempts.
  - On an unshortened headwind or crosswind leg the navigator does nothing: 28 of the 36 dhow headwind lane-months and all 4 dhow crosswind lane-months.
- **Marines.** They multiply the piracy probability by 0.2 (`:2260`). Piracy is checked only if the ship did not turn back (`:2256`). A raid takes **one** crate of cloves, else one lot of ivory, else min(max(0, cash), 75) D tribute (`:2263-2275`).
- **Tarpaulins.** The mildew condition short-circuits before its draw (`:2250`), so no random number is drawn for mildew.
- **Ruin.** The campaign ends when `state.cash < -250` (`:2316`), strictly.
- **Existing tests of the effects.**
  - `tests/03/engine/sail.test.mjs`: navigator storm threshold (`:154`); tarpaulins suppress the mildew draw (`:194-208`); marines' factor on both sides of the threshold (`:273`).
  - `tests/03/engine/planted-defects.mjs`: squall probability (`:42`); marines' factor (`:44`, `:56`).
  - `hireSpecialist` itself is untested (`tests/03/README.md`, "Not covered"). v1's claim that nothing pinned specialist behaviour was false.
- **Text to change with the game:** the survival card says it "requires celestial navigators & marines" (`:1048`); the Atlas layer rewrites the navigator note (`:3008`).

## 2. Rules under study (owner decisions, settled)

| Item | In the game | Kind | Payment |
| --- | --- | --- | --- |
| Specialist pilot (navigator's effect) | "Hire a specialist pilot" | role on the **one active passage booking** | upfront passage pay |
| Armed guards (marines' effect) | "Hire armed guards" | role on the same booking | upfront passage pay |
| Cargo coverings (tarpaulins' effect) | "Install cargo coverings" | durable, campaign-long | once |

- **The booking.**
  - There is one active booking, for one named directed leg.
  - Pilot and guards are bought separately for it. Neither role can be bought twice.
  - A turn-back keeps both contracts, and so do waits before a retry.
  - Arrival ends both, after that voyage's hazards.
  - Previewing another route keeps the booking.
- **Changing passage.**
  - It needs **explicit cancellation**, which shows the lost payment. There is no refund.
  - The hire buttons are disabled until the booking is cancelled.
  - Departing elsewhere is a cancellation.
  - There is no refund at campaign end either.
- **Display (pinned).**
  - The game shows the **months the pilot saves** on the named passage, for the attempt about to depart.
  - It shows the **piracy chance for that voyage with and without guards**, as the **full engine probability**: port risk × cargo factor (1.5 with cloves or ivory, else 0.6) × difficulty factor × the standing ≥ 50 discount (`:2259-2261`).
  - Rule R and the guards classes use exactly these displayed values.
- **Accounting.**
  - Crew upkeep (dhow 15, junk 35 D a month) is unchanged and covers the ordinary crew only.
  - Passage pay is the specialist's whole pay for the passage.
  - Port fees are separate.
  - Nothing is counted twice.
- **Effects** are exactly today's. Repair is unchanged.
- **Evidence status.** "The contract lasts through turn-backs and waits, with no second fee" is a **game abstraction with no direct evidence**. Udovitch (p. 44) notes that contracts could be dissolved (§13).

## 3. Results already seen (not blind)

All of this was read before writing. Anything resting on it is **informed**.

1. **Economy skeleton** (`research/03/results/2026-11-22-economy-skeleton/results.md`): ρ, R_cap, C\*, t\* (cash binds until about month 5 for the dhow and month 8 for the junk). λ (383 → 11,500 and 355 → 27,556 D a month) is a **perfect-knowledge planner's** value of a month. Hull damage costs money only through porcelain. Q2 includes the navigator.
2. **Part C** (`partc.json`, `partc-plans.json`; `results.md:108-120`): the engine with the navigator carried **through turn-backs** in headwind cells (`economy-skeleton-partc.mjs:190-197`), and a forced turn-back on Aden→Calicut in January.
3. **Adaptive routes**: results tables and per-seed nets.
   - The lowest of the 5,400 published harness nets is **35,534 D**, and none is negative (re-planning minimum 48,415; checked 2026-11-23).
   - **No harness campaign was ruined. The argument (from the reviewer, checked against the source):**
     - The harness fill keeps 60 D, so a voyage with cargo aboard departs with cash ≥ 60.
     - One `sailTo` costs at most wages + doldrum + mutiny = 265 D for the junk (a 5-month dead-zone leg: 175 + 20 + 70) and 95 + 30 = 125 D for the dhow.
     - Tribute can't add to that once cash is ≤ 0: it takes min(max(0, cash), 75) after wages and doldrum, and it can't take cash above that point without leaving it ≥ 0.
     - Cash ≥ 60 then ends at ≥ −205, above the −250 floor.
     - A ruin therefore needs an empty hold. An empty hold with cash below −250 leaves nothing to liquidate, so the net is negative.
     - All 5,400 nets are ≥ 35,534. Ruin is therefore a **non-measure** for the published harness.
     - **The exception:** a junk with an empty hold and cash below 15 D (15 − 265 = −250).
     - **Rechecked for v3:** rule R pays only from **spare** cash after the planned buys (§4.5), so a hire never empties the hold, and the exception can't be created by a hire. K10 counts it anyway.
4. **R0 baseline**, seen only through the adaptive-routes "§5 harness median" column. **No published run hires any specialist.**
5. **Depth-and-liquidity protocol** (registered, not run): §3 disclosures, keyed-draw design (§4.6, C4).
6. **Existing engine tests** of the effects (§1).
7. **Read while drafting v1–v3** (2026-11-23).
   - **Transit fixture.** The navigator shortens 20 of 120 dhow lane-months (8 headwind, 12 dead zone) and 48 of 120 junk lane-months (28 headwind, 16 dead zone, 4 crosswind). It never shortens a tailwind leg.
   - **The 18 published hazards-off planner plans:**
     - 14–16 departures each;
     - 0–8 non-tailwind departures;
     - 0–2 shortened departures;
     - 8–11 departures with cloves or ivory aboard, 4–6 of them to Calicut;
     - 0–3 dead-zone departures with textiles aboard.
   - **Fixture maximum** of 5 months at sea for both vessels.
   - **v1's constant arithmetic:** storm value about 12 D (dhow) and 6 D (junk) per dead-zone leg; guards' loss avoided per destination.
   - **Both reviews** of v1 and v2.
8. **Disclosure (review M3).** v1's grids and rule were anchored on item 7. v3's ingredients were chosen with items 1–7 and both reviews in view: the classes, the quantiles, the ladder, the spare-cash form of R with k = 1, the thresholds, and q = 0.25 for coverings, which was chosen knowing 0–3 textile dead-zone legs per plan.
9. **Not seen:** any run with a hire, a booking, keyed draws, or the harness's counts per class.

## 4. Design in four steps

1. **Count**: one keyed never-hire run, counting passage opportunities per visible class.
2. **Value**: each class's expected value, by formula from constants and the step-1 state.
3. **Price**: a stated rule per factor, which can fail.
4. **Confirm**: rule R against never-hire and arm C at the chosen prices and their ladder neighbours, judged on means with seed-level bootstrap CIs.

Steps 1–3 compare no outcomes of hiring, and the class counts are fixed before any hiring run exists.

### 4.1 Players and cells

- **Route policies.** A research copy of the harness (`tests/03/baseline-harness.js:87-124`): *sail always*, *avoid headwind*, *avoid headwind and transition*, from Calicut.
- **Coverings variant.** The same copy with textiles excluded from the fill ("no-textile"). The default copy is "textile-allowed".
- **Cells.** Selection uses **normal** only: 2 vessels × 3 policies = 6 cells. **Hard** is also run for affordability (§4.6 Q2). Hard and survival are reported **for the chosen prices only**.
- **Seeds.** 300 keyed seeds per cell, 400001–400300.
- **Passage opportunity.** A departure on a lane, plus every retry of the same lane after a turn-back with no departure elsewhere in between. One booking covers one opportunity.

### 4.2 Step 1: visible classes, counted once

| Factor | Class key (all shown to the student) |
| --- | --- |
| Pilot | vessel × wind status at the first attempt × **shortened** (the game shows "saves ≥ 1 month" on at least one attempt) × month of the first attempt |
| Guards | vessel × displayed piracy chance without guards (full engine probability, §2) × lot at stake (cloves aboard / ivory only / neither) |
| Coverings | campaign × strategy (textile-allowed / no-textile). A campaign is **textile-exposed** if it makes at least one dead-zone departure with textiles aboard |

**What step 1 records**, per opportunity, from the never-hire path:
- each attempt's departure month and its displayed months saved, *m_s*(attempt), from the fixture at that attempt's month;
- whether the opportunity ends in arrival or cancellation;
- the unpiloted and the projected piloted arrival months;
- cash before buying, cash after the planned buys, and cargo.

**Wealth path.** W(t) = cash + cargo at cost basis − debt, after the last action whose resulting monthIndex ≤ t, for t = 0…23. **W(24) is the campaign's final E-net + `state.startEquity`**. So it includes the final credited voyage, even one arriving at month 25 or 26 (D01), as liquidated by `finishCampaign`.

### 4.3 Step 2: expected values (formula, not simulation)

**Value of a month.** For an arrival month t ≤ 23 (the month the ship reaches port):
- V(t) = mean over the cell's seeds of [W(min(t + 6, 24)) − W(t)] / (min(t + 6, 24) − t).
- At t = 23 this is W(24) − W(23), which includes one final credited voyage.
- **V = 0 only when the piloted arrival is ≥ 24.**
- When the piloted arrival is 23 and the unpiloted one 24 or later, the piloted ship can complete one more credited voyage (D01; adaptive-routes `results.md:58`). That is valued at V(23).

**Pilot, the price basis** (shortened opportunities only):
- **EV_time** = [Σ over attempts of *m_s*(attempt month)] × (V(t_p) + upkeep).
  - Each attempt uses its own month's saving, so failed attempts count.
  - t_p is the projected piloted arrival month: the never-hire path's arrival minus the summed months saved.
- **This is an approximation.** The piloted path's later attempts depart earlier, and they are keyed to other months. The confirmation measures the real effect, and §5 reports the fit.

**Pilot, the storm term** (reported only, **not** part of the price): 0.17 × mean storm damage (dhow 30, junk 15 hull points at normal) × 2.4 D per point (repair: 60 D per 25 points, `:2126-2128`), on dead-zone attempts. It applies to shortened and unshortened opportunities alike.

**Guards.** EV = (1 if the opportunity ends in arrival, else 0) × 0.8 *p* × L.
- *p* is the displayed probability.
- L is the destination's live price of one clove crate at arrival if cloves are aboard; else one ivory lot; else min(max(0, cash at the piracy step), 75).

**Coverings.** Per textile-exposed campaign: Σ over its dead-zone departures with textiles aboard of 0.35 × the destination's live textile price at arrival.

**Weights.** Each opportunity (for coverings, each textile-exposed campaign) in the 6 normal cells counts once. The vessels are pooled, because the game has one price.

### 4.4 Step 3: the pricing rule (fixed now)

**Ladder (D):** 5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1,000, 1,200, 1,500, 2,000, 2,500, 3,000, 4,000, 5,000, 6,000, 8,000, 10,000. If *m_f* is above 10,000, *P_f* = 10,000 and this is flagged.

For each factor *f*:

1. **Basis set.**
   - Pilot: the **shortened** opportunities, valued at EV_time.
   - Guards: every opportunity with *p* > 0.
   - Coverings: the textile-exposed campaigns.
2. ***m_f*** is the weighted q-quantile of EV over the basis set: the **smallest** EV value *e* with a share ≥ q at or below *e*, so an even count takes the lower middle value. q = 0.5 for the pilot and the guards; q = 0.25 for the coverings (durable, bought at first exposure).
3. ***P_f*** is the ladder value with the smallest |P − *m_f*|. Ties go to the lower value.
4. **Minimum basis.**
   - Pilot: ≥ 200 shortened opportunities across the 1,800 normal campaigns.
   - Guards: ≥ 200 opportunities.
   - Coverings: ≥ 10% of textile-allowed campaigns textile-exposed.
   - Otherwise there is **no price** (untestable).
5. **V1, the visible trade-off.**
   - **Pilot.** The share of shortened opportunities with EV_time ≤ 0.8 *P* is **≥ 0.25** (decline is right), **and** the share with EV_time ≥ 1.25 *P* is **≥ 0.25** (hire is right). **And** the weighted median first-attempt month of the low group is **at least 3 months earlier** than the high group's. The trade-off must be early against late, not noise.
   - **Guards.** Both shares ≥ 0.20 (low ≤ 0.8 *P*, high ≥ 1.25 *P*).
   - **Coverings.** Both shares ≥ 0.20, within the textile-exposed campaigns.
6. **V2, rule R agrees with the price** (pilot and guards).
   - The weighted share of basis-set opportunities where R's decision (§4.5) equals [EV ≥ *P*] must be **≥ 0.75**.
   - **R's decision** for an opportunity means a hire at its **first** attempt. A hire made only at a retry counts as "no hire".
   - For the pilot, this is the test that the stage condition (spare cash) tracks the value of a month.
   - **No V2 for coverings.** R buys exactly when a campaign becomes textile-exposed, so agreement would be true by construction. The coverings price rests on V1 and Q1.
7. **Failures.**
   - V1 or the minimum basis fails: **no price** for *f*. These are properties of the value distribution, not of the price, so there is no widening.
   - V2 fails: this is price-sensitive, so the **one step** for *f* is used (§4.6).
     - Take the adjacent ladder value with the **higher agreement**. It must reach **≥ 0.75**, with V1 and the minimum basis still holding at that value.
     - If both neighbours have equal agreement, take the lower price.
     - If neither qualifies, there is **no price** for *f*.

### 4.5 Rule R, the student rule (fixed now; uses only what the game shows)

**In displayed terms**, every factor's cash condition reads: **"hire when the cash left after loading ≥ P + 60 D"**.
- For students, the 60 D is described as **"keep enough for the voyage's wages and mishaps"**.
- In the code, **spare** = cash before buying − cost of the planned buys − 60 D, and the condition is spare ≥ P. The computation is identical.
- The 60 D reserve is the harness's reserve and the owner's default. The ruin argument (§3 item 3; K10) depends on it.

| Factor | Hire when (all conditions) |
| --- | --- |
| Pilot | the game shows that the pilot saves **≥ 1 month** on this attempt; **spare ≥ P_pilot** (k = 1); the piloted voyage arrives by month 23 |
| Guards | cloves or ivory are aboard; the displayed piracy chance without guards is **≥ 0.15**; spare ≥ *P_guards* |
| Coverings | the ship is about to sail a dead-zone passage with textiles aboard, for the first time; spare ≥ *P_cov* |

**Why the pilot uses the spare-cash form with k = 1.**
- From §4.3, the pilot is worth (V + upkeep) per month saved.
- **While cash binds**, the fill spends everything above 60 D, so spare is below one unit of the best good. Paying P then displaces cargo, and its cost compounds at the cash-limited growth rate (ρ ≈ 0.45 a month, item 1). Its true cost exceeds P, while V early is low.
- **Once the hold is full** and cash is left over, paying P displaces nothing. Its cost is exactly P, while V is at its capacity-limited level.
- So "spare ≥ P" is the visible point at which money stops being the bottleneck. k = 1 is the smallest k at which the payment can't reduce the cargo.
- The month-24 condition follows from V = 0 at a piloted arrival ≥ 24.
- A month-index form (*t\**) was rejected: the cash-limited phase ends at different months for the two vessels (about 5 and 8), and a student can see cash but not the phase.

**Order of operations at each departure:**
1. The copy sells, repairs and ranks lanes exactly as published, with contract effects off.
2. R is evaluated on the **planned** buys.
3. Pay.
4. Recompute the buys with the copy of `harnessPlan`, with the contract's effects. The pilot changes the arrival month and so the prices; the spare condition means payment can't reduce the quantities.
5. A contract stays paid if the recomputed buys change the cargo condition. Such hires are counted ("condition lost after recompute").

Other rules:
- After a turn-back, the copy re-ranks as published. Choosing another lane is a cancellation with no refund, and R then applies afresh.
- **"Declined for lack of spare"** counts opportunities where every condition except spare held. It feeds Q2.

### 4.6 Step 4: confirmation (fixed now)

**One step per factor, at most.** Each factor may move once in total from *P_f* to an adjacent ladder value: for V2, Q1 or Q2, whichever fires first in that order. There are no compound steps.
- **The run set.** Every price a step can reach is in the run set.
- **After a V2 step** (taken in step 3, before any confirmation run), R(f−) and R(f+) are the neighbours of the **stepped** price.
- **Re-checks after a step:**
  - A **Q1 step** re-checks V1 and the minimum basis at the new value (required, §4.6 Q1). It re-checks V2 too, and the step is refused if V2 then fails.
  - A **Q2 step** re-checks V1, the minimum basis and V2 at the new value. The step is refused if any of them fails, and the result is then "not affordable at the rule's price".
  - These re-checks use step 1 and step 2 data only, so they need no new run.

The configurations:

| Name | What |
| --- | --- |
| N | never hire |
| R | rule R at (*P_pilot*, *P_guards*, *P_cov*) |
| R(f−), R(f+) | R with factor *f* one ladder value down or up, the others at their chosen prices: 6 configurations, plus coverings at the **90 D baseline** |
| R−f | R without factor *f*, for each factor (3) |
| R-final | if any factor stepped, R at the final prices (one configuration, reported, and its Q1 and Q2 recomputed). No further step is possible. A Q1 contradiction at R-final is **investigated as a defect and reported**; a Q2 failure at R-final is reported as "not affordable at the rule's price" |
| C-always | arm C: today's engine, all three bought at the first port (180/160/90, campaign-long, through `hireSpecialist`) |
| C-R | arm C: each item bought campaign-long at today's price, at the first departure where R's visible condition (ignoring spare and price) holds |
| B | one monthly-pay comparison at the final prices. Rule R; wage *w_f* = *P_f* / 1.5, rounded to the nearest 5 D (minimum 5), charged like crew upkeep for each month retained, waits and turn-backs included; an advance of *w_f* × planned sea months at hiring, set against the wages, and forfeited on cancellation. **Reported, not selectable** |

- **Variants and cells.** Coverings configurations run in both the textile-allowed and no-textile variants. All configurations run in the 6 normal cells; R and N also run at hard (Q2).
- **Statistics.** Means of seed-paired differences, with a 95% seed-level percentile bootstrap: 10,000 resamples of seeds within each cell, bootstrap seed 20261123.

**Q1, sanity check (not a selector in practice).** Δ_f = mean(net R − net R−f) per normal cell, labelled confirmed (CI lower bound > 0), neutral, or contradicted (CI upper bound < 0).
- **Q1 can in practice only confirm or come out neutral.**
  - For the pilot, R hires only where payment displaces no cargo and a month is saved.
  - For the guards, V2 ensures that most hires have EV ≥ P.
  - For the coverings, the price is the lower quartile of exposed campaigns' value.
- A contradiction would therefore point to a defect in the EV model or the code, not to a price choice.
- **If a factor is contradicted in ≥ 2 of 6 cells**, and its one step is unused, it moves to the adjacent value that is contradicted in < 2 cells and meets V1, the minimum basis and V2. The value closest to *m_f* is preferred, with ties going to the lower. Otherwise there is no price for that factor. Either way, the contradiction is investigated as a possible defect before results are reported.

**Q2, affordability (the criterion).**
- **Measure.** The lowest cash after buying in months 0–6: the minimum, over departures in months 0–6, of cash after the purchase step.
- **Test.** The mean paired difference (R − N) has a bootstrap CI lower bound **≥ −25 D** in **every** normal cell and **every** hard cell.
- **What prevents ruin is not this bound.** Ruin is prevented by the **per-departure invariant**, checked by K10 on every departure: whenever the hold is non-empty, cash after buying is ≥ 60 D. With the worst single voyage costing 265 D (§3 item 3), such a voyage ends at ≥ −205 D.
- **What the −25 D bound does.** It is a mean-level check that hiring doesn't erode early liquidity. It keeps the average early-cash loss within about half of the 45 D slack between −205 D and the −250 D floor.
- **This is close to a non-measure by construction.** R pays only from spare, and the fill keeps 60 D. It can fail only through a defect in the hiring hook or the order of operations, which is why it pairs with K9 and K10.
- **If Q2 fails** in any cell and that factor's step is unused, the **most expensive factor** (highest mean R spend per campaign at normal, pooled; ties → pilot, then guards, then coverings) moves one value down. The step's re-checks (§4.6, "One step per factor") apply, and Q2 is re-checked on R-final. Otherwise the result is "not affordable at the rule's price".

**Q2-guard, declined for lack of spare (reported, not a criterion).**
- Opportunities in months 0–6 where R's visible condition held but spare < P, as a share of those where it held.
- **Reviewer's bound:** this can bind only for prices above about 600 D. Step 1 records the minimum pre-buy cash in months 0–6 per cell, so the bound is checked, not assumed.
- For the pilot this share is expected to be large early. That is the intended "decline early" behaviour.

**Reported, not criteria:** mean(R − C-always) and mean(R − C-R) with CIs; arm B against R; hard and survival at the final prices; the storm term; all §5 measures.

## 5. Measures

All are per campaign, using the engine's E-net. Every figure gets a mean and bootstrap CI, with p10–p90 beside it.

- **Hiring:** frequency per factor and class; declines for lack of spare; cancellations and the payments lost; retries covered at no fee; condition lost after recompute.
- **Spend:** specialist spend per campaign; arm B's wages and forfeited advances.
- **Cash and ruin:** lowest cash after buying in months 0–6; minimum cash over the whole campaign; ruins (monthIndex < 24 at `finishCampaign`, recorded by a wrapper; never from the log text, because of D07).
- **Losses**, and losses avoided against N on the same seed (only partly paired): storms, doldrums, raids by lot type and tribute, mildew, porcelain, teak, mutiny.
- **Turn-backs**, with **repeated** turn-backs (≥ 2 per opportunity) reported separately. **Slow routes** (≥ 3 months at sea) separately.
- **Final net.**
- **EV model fit:** predicted EV per class against the confirmation's mean realised gain per hire. For the pilot, also the hire month against V(t).

## 6. Method

- **Code:** `research/03/models/specialist-contracts.mjs` (Node ≥ 22, no dependencies).
- **Research loader.** A copy of `tests/03/engine/load-engine.mjs` that evaluates the extracted script with **`lineOffset: 1588`**, so stack lines equal file lines. It loads `baseline-harness.js` and makes `renderAll` a no-op.
- **Arm C** installs no wrapper on any effect function.
- **Booking.** A research record `{lane, pilot, guards, paid}`.
  - A `sailTo` wrapper sets `state.specialists.navigator` and `.marines` true only for the booked lane.
  - A departure elsewhere cancels the booking first.
  - After the original call: arrival clears the booking; a turn-back keeps it. The flags return to false either way.
  - Coverings set `state.specialists.tarpaulins` once, through the ledger.
  - `waitInPort` and the previews are not wrapped.
- **Keyed draws** as the depth-and-liquidity protocol's §4.6 and C4.
  - *u* = the first output of mulberry32(FNV-1a-32(`seed|role|month|lane`)).
  - Roles at `:2172`, `:2173`, `:2216`, `:2220`, `:2223`, `:2231`, `:2235`, `:2250`, `:2263`, `:2287`, identified by stack line.
  - **The keyed source is reinstalled after every `harnessReset`.**
  - Role keys are needed because coverings remove the mildew draw.
- **Pairing.** The same transition roll gives a storm for *u* < 0.35 without a pilot and *u* < 0.18 with one. Doldrums move from [0.35, 0.60) to [0.18, 0.43), with unchanged probability. Piracy pairs monotonically.
- **Arm C under keyed draws has no published reference.** Only K1 (seed stream, never-hire) reproduces published nets.
- **Budget.** About 25 configurations × 6–12 cells × 300 seeds of cheap harness campaigns, plus step 1: well under an hour, one heavy job at a time. Nothing is cut.

### 6.1 Checks, before any step-2 value is computed

Each planted defect is applied to a temporary copy of the research code (K7: a temporary clone). If any check fails, nothing is computed beyond it, and the fix is reported with both outputs.

| # | Check | Pass | Planted defect that must make it fail |
| --- | --- | --- | --- |
| K1 | **Published identity.** Arm C, never-hire, seed-stream feed as `harnessReset` (200001–200300) | All 5,400 harness nets in `hazards-on.json` (in seed order) and the 18 hazards-off harness nets exactly | the arm C hook deducts 1 D at the first departure with no hire |
| K2 | **Arm C is the engine.** The original function objects are in place; the 480 fixture rows are reproduced with the navigator flag true and false | Identity; 480/480 | `computeTransit` wrapped to apply 1.15 twice |
| K3 | **A booking on every passage equals campaign-long.** The 36 published hazards-off action logs are replayed under keyed hazards-on draws (seeds 400001–400010): (a) arm C, all flags set at month 0 at no charge; (b) a pilot-and-guards booking on every opportunity at 0 D, with coverings at month 0. A turned-back `sail` is re-issued until it arrives (≤ 50 tries), in both set-ups, then the log resumes | Equal state after every action | booking cleared before the piracy step |
| K4 | **Booking state machine** (unit tests, draws scripted per role). Sub-tests (a)–(g) are listed below the table | All pass | one per test: (a) cleared on turn-back; (b) kept for another lane, or refunded; (c1) cleared before hazards, (c2) not cleared on arrival; (d) a preview clears it; (e) a refund at campaign end; (f) coverings expire; (g) `waitInPort` clears the booking |
| K5 | **No double charge.** Per action, Δcash = the engine's charges recomputed independently + the ledger's specialist charges. **Arm B unit case:** hire at wage *w* on Aden→Calicut in January (dhow, 2 planned sea months); wait 1 month; depart in February (headwind, 2 months) and turn back; retry in April (dead zone, 3 months) and arrive. The advance at hiring is 2*w*, and the total charged is *w* × (1 + 2 + 3) = 6*w*, with the advance netted against the first wages | Exact for every action. Crew upkeep is unchanged by any booking. Passage pay appears once per role per booking. The arm B case is exact | (a) pay charged again on the retry; (b) arm B charges the advance and the first wage for the same month; (c) specialist pay added to `vessel.upkeep`; (d) arm B charges no wage during waits |
| K6 | **Keyed draws**, depth-and-liquidity C4 (i)–(v), roles by research-loader stack lines | All hold | (a) price, arm or rule in the key; (b) mildew and piracy roles swapped; (c) keyed source not reinstalled after `harnessReset` |
| K7 | **Game untouched.** SHA-256 of **the file the loader actually read**, before and after every run, equals the header hash; `process.env.MONSOON_INDEX` is **unset**; the engine suites and `planted-defects.mjs` pass | All hold | (a) `index.html` modified during a run, in a temporary clone; (b) `MONSOON_INDEX` pointed at a copy |
| K8 | **Never-hire is the same everywhere.** N's net per seed is identical in arm C and under the booking wrappers | Identical | the booking set-up installs coverings for N |
| K9 | **Hire audit.** Every R evaluation is re-derived by separate code from the logged state **before payment**: months saved from the fixture lookup with the navigator off, displayed piracy chance from the constants, spare from the planned buys. Scripted cases: a pilot with spare = P − 1 (no hire) and spare = P (hire); guards with exactly one clove crate at a displayed 0.15 (hire) and the same leg with the crate sold (no hire) | Every decision agrees; the scripted cases are exact | months saved computed **with the navigator flag already true**, so it is always 0 and R never hires a pilot. The audit disagrees on every shortened opportunity with enough spare, and the spare = P case fails |
| K10 | **Per-departure invariant.** At every departure in every run, assert **cash after buying ≥ 60 D whenever the hold is non-empty**. Also, after every hire, the recomputed buys are non-empty whenever the planned buys were. The count of junk departures with an empty hold and cash < 15 D is recorded | The invariant holds at every departure; the hold is non-empty in every case | the spare condition dropped from R: in a scripted cash-limited case, paying leaves cash after buying below 60 D with cargo aboard, so the invariant fails |

**K4 sub-tests:**
- **(a) Turn-back keeps the booking.** Dhow, Aden→Calicut in January (headwind, 2 months), turn-back *u* = 0. The retry departs in March (dead zone). There is no second fee, the transit equals the fixture's navigator row, and a transition roll of 0.25 (in [0.18, 0.35)) gives a doldrum, not a storm.
- **(b) Departing elsewhere cancels.** Then sail Aden→Kilwa: no navigator transit, a 0.35 storm threshold, no refund.
- **(c) Arrival ends the booking after hazards.** Calicut→Malacca in July (tailwind), cloves aboard, standing < 50, guards, piracy *u* = 0.2: no raid. The next departure is unguarded.
- **(d) Preview keeps the booking and draws nothing.** The preview functions and `computeTransit` on other lanes change no state and draw nothing. Other lanes match the no-navigator rows.
- **(e)** A campaign ending during a booking: no refund.
- **(f)** Coverings are charged once and suppress mildew on three dead-zone legs.
- **(g) Hire, wait, sail the same lane.** The booking survives the wait, with no second fee, and the effect applies.

**Order:** K7, K1, K2, K4, K5, K6, K9, K10, K3, K8, then steps 1–4.

## 7. What is still predictable in advance

1. **The pilot's price will be large.**
   - The basis is shortened opportunities valued at a month's wealth growth. In the harness that is hundreds of D while cash binds and thousands once the hold is full. So *P_pilot* is expected in the high hundreds to low thousands.
   - The early-decline, late-hire pattern is **built into** V(t), which grows with wealth until near the end. V1's early/late condition is therefore likely to pass whenever the counts suffice.
   - **What is genuinely open:**
     - whether ≥ 200 shortened opportunities exist (the planner plans have 0–2 per campaign, so 1,800 campaigns give roughly 0–3,600);
     - whether ≥ 25% of them fall on each side;
     - **V2**: whether spare ≥ P tracks EV ≥ P. It can fail if V(t) jumps at the cash-limited to capacity-limited switch earlier or later than spare cash appears;
     - how the end-of-campaign months (V(23), V = 0 at arrival ≥ 24) split.
   - Pilot Q1 is positive by construction.
2. **The guards' price** is likely 15–25 D and hinges on the Calicut share. Displayed probabilities with standing ≥ 50 halved move some legs under 0.15. V2 can fail on Calicut ivory (about 26 D). Q1 is likely neutral.
3. **Coverings with q = 0.25** are nearly determined once the exposure counts are known.
4. **Q2 is close to a non-measure** by construction (§4.6). Ruin is a non-measure (§3 item 3).
5. **Arm C at 180 D** will look cheap next to a pilot priced in the thousands. That comparison is reported, not judged.

## 8. Deviations

Append dated entries below this line before any result that depends on them is reported. Each says what changed, why, and whether results had been seen.

---

## 9. Outputs

`research/03/results/<run date>-specialist-contracts/`, status **exploratory**:
- `classes.csv` (step 1 counts, EVs, V(t) per cell);
- `pricing.json` (*m_f*, *P_f*, minimum basis, V1, V2, any step, or "no price");
- `confirmation.csv`;
- `checks.json` (K1–K10 with the plant outcomes);
- `results.md` (failures first).

**Provenance:** commit, engine SHA-256, Node version, RNG and key grammar, seeds, bootstrap seed, counts per cell. **Stopping:** each step runs once. A bug found after results means a full rerun, with both outputs reported.

## 10. Limits

- **The players are a myopic harness and a fixed rule R, not students.** The ranking ignores specialist costs and benefits.
- **V(t) is the harness's own average wealth growth by month.** That is an approximation, and EV_time uses never-hire attempt months.
- **The storm term values hull at the repair price.**
- **Prices are chosen at normal.**

## 11. OPEN items

1. **The cancellation dialog** is a UI matter for the upstream PR. The research treats any departure elsewhere as a confirmed cancellation.
2. **The re-planning player is dropped.** `adaptive-routes.mjs` runs and writes on import.
3. **Whether K2, K4, K5 or K9 become committed tests** (the `hireSpecialist` gap) is the owner's call, under AGENTS.md rule 8.
4. **Ruin threshold.** The engine uses cash < −250; the owner's text said ≤ −250.
5. **Muʿallim pay in merchandise** is not modelled.
6. **Wording to change upstream:** the survival card (`:1048`) and the Atlas navigator note (`:3008`).
7. **The display PR must show months saved per attempt, not per lane.** A retry in another month can show a different figure. Rule R and EV_time assume the per-attempt figure.
(Closed since v2:
- the displayed piracy chance is the full engine probability;
- months saved over retries are summed per attempt;
- source reading depth is recorded in §13;
- spare is worded in displayed terms as "cash left after loading ≥ P + 60 D", with the 60 D described to students as "keep enough for the voyage's wages and mishaps" (§4.5).)

## 12. What could still make it uninformative

- **Too few shortened opportunities**, so the pilot has no price. That is a real answer: per-passage pricing has too few passages where the pilot matters.
- **Spare cash may switch on at a different time than V(t) rises,** so V2 fails at every reachable price. That would say the visible stage cue is wrong, not the price.
- **The guards' value is capped at one lot,** so Q1 is likely neutral everywhere.
- **Path divergence** after the first differing event limits the pairing.

## 13. Sources (cite only these, with these labels; motivation only)

| Label | Locator | Reading depth | Supports | Does not support |
| --- | --- | --- | --- | --- |
| Tolmacheva 2008 | Tolmacheva, "Navigation in the Indian Ocean and Red Sea", in Selin (ed.), *Encyclopaedia of the History of Science, Technology, and Medicine in Non-Western Cultures*, 2nd ed., Springer 2008, pp. 1738–1739, doi:10.1007/978-1-4020-4425-0_8808 | Springer preview only; tertiary | the *muʿallim* was hired for the voyage and could carry merchandise as part of his pay | prices; turn-back or waiting rules |
| Prange 2011 | Prange, "A Trade of No Dishonor…", *American Historical Review* 116(5), 2011, 1269–1293, doi:10.1086/ahr.116.5.1269 | article text read in HTML; page numbers not verified | armed men aboard merchant ships | how they were hired or paid |
| Udovitch 1994 | Udovitch, "An Eleventh Century Islamic Treatise on the Law of the Sea", *Annales islamologiques* 27 (IFAO, 1994), 37–54, <https://www.ifao.egnet.net/anisl/27/3> | pp. 41–45 read in the IFAO PDF | p. 41: chartering a ship to a destination (freight), not hiring specialists. pp. 44–45: no freight on a failed direct crossing, proportional freight on coastal voyages. p. 44: contracts could be dissolved | specialists: it is Mediterranean law about freight. It does not support "lasts through turn-backs with no second fee", and p. 44 points the other way |
| Ravenstein 1898 | Ravenstein (trans.), *A Journal of the First Voyage of Vasco da Gama*, Hakluyt Society 1898, p. 25 | p. 25 read (Project Gutenberg text via the Internet Archive) | two pilots paid 30 mitkals of gold and cloaks before sailing (upfront pay) | typical practice: it is Portuguese, 1498, coercive |
| Mahajan 2025 | Mahajan, *Moorings*, UC Press 2025, doi:10.1525/luminos.234, pp. 169–170 | pp. 169–170 read in the UC Press open-access PDF | monthly salary alongside per-voyage payments (motivates the single arm B comparison) | anything pre-modern: it is a modern analogy |

"Lasts through turn-backs and waits" is a game abstraction with no direct evidence. No source supplies a price, a probability or a duration used here.

## 14. Changes from v2 (confirmation review and owner decisions, 2026-11-23)

| Item | v3 |
| --- | --- |
| Owner 1: price the pilot on months saved | §4.3 EV_time on shortened opportunities; storm term reported only; R's spare-cash form with k = 1 (§4.5); V1 early/late test (§4.4) |
| Owner 2: displayed piracy chance = full engine probability | pinned in §2; used by the classes and R |
| Owner 3: affordability = lowest cash after buying in months 0–6, at normal and hard | Q2 (−25 D CI bound); refusals kept as Q2-guard with the ~600 D bound |
| V = 0 rule; t defined; W includes the final credited voyage | §4.2, §4.3 |
| EV over retries | Σ *m_s* per attempt month (§4.3) |
| K9's plant must be able to fire | K9 plant (months saved computed with the navigator on), plus scripted spare and crate cases |
| Coverings V2 tautology | dropped and labelled (§4.4 item 6) |
| Q1 only confirms or is neutral | stated (§4.6) |
| Reachable configurations; ties | one step per factor; all neighbours run; R-final; ties defined (§4.4, §4.6) |
| Arm B wages in waits and turn-backs | K5 unit case and plant (d) |
| Ruin argument | §3 item 3; K10 |
| Reading depth | §13 |
| Final review (low fixes) | V2 step direction and ties restored (§4.4 item 7); R(f±) after a V2 step; Q1 contradiction at R-final; re-checks after Q1 and Q2 steps (§4.6); R in displayed terms (§4.5); K10 invariant; Q2 rationale; V2 decision at the first attempt |

v2's changes from v1 are listed in v2 §14.
