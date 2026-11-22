# Pre-registration: does the ship ranking survive better route choice? (adaptive routes, M3/M6)

| | |
| --- | --- |
| Status | **Verdict accepted, not yet registered.** The owner accepted PURSUE on 2026-11-23. Nothing in this document has been coded or run. It becomes registered, and frozen, when the PR adding it merges |
| Drafted | 2026-11-23 |
| Follows | The economy skeleton: pre-registration `2026-11-22-economy-skeleton-m3-m4.md`, run in [kvis PR #24](https://github.com/Azuromalachite/kvis-econ-games-2026/pull/24), results in `research/03/results/2026-11-22-economy-skeleton/results.md` |
| Experiments | M3 (when is a larger ship advantageous), the policy part the skeleton left out; M6 (robustness), only for route choice |
| Engine | `projects/03/index.html` (engine script identical to the original repository's `ba2f279`; protected functions identical to `111acdc`, PR #24 Part C step 1) |
| Kind of change | Research (Path B). Nothing here edits the game or proposes a mechanics change |
| Verdict | **PURSUE**, accepted by the owner on 2026-11-23 (§7) |

## 1. Seed observation

Two results disagree, and the disagreement is the question.

- Baseline §5 (the original repository's `docs/baseline.md`): under *avoid headwind*, the dhow beats the junk in 300 of 300 same-seed pairs at every difficulty; under the other two policies the junk wins 300 of 300. D06 records this: which ship wins is set by the strategy.
- PR #24's skeleton: the junk is ahead by about +209,000 to +291,000 D (both price levels) under **every** policy at every difficulty, its capacity-limited profit rate is 2.4 times the dhow's, and only a hold ratio of about 1.1 reverses the ranking (P1.5 and P1.7 contradicted). Followed as one fixed cycle, the junk earns 65–83% *more* than §5's median under *avoid headwind*, and the dhow 20–44% *less* (P1.6 contradicted).

§5's harness chooses one voyage at a time by profit per month on that voyage alone. The skeleton fixes one route for the whole campaign. Neither is good play. The idea: compute the best route choice the game allows, and see which ship wins under it.

## 2. The idea

Solve the campaign exactly as a shortest-path problem on (port, month), with the hazards switched off, under each of the three wind policies. Then compare, with the same engine and the same accounting:
- the optimal plan,
- §5's harness, also with hazards off,
- the optimal plan re-solved after every event, with hazards on.

The core claim under test: §5's dhow win under *avoid headwind* comes from the harness's one-voyage look-ahead, not from the ships.

## 3. Prior looks: what is not blind

1. **Baseline §5**: every number in its table and the same-seed counts.
2. **All of PR #24**: every output, including:
   - the best fixed cycles (all through Malacca, buying cloves);
   - ρ, R_cap and C\* per ship;
   - the R-H paths against §5's medians;
   - the boundary table;
   - the Q2 cells;
   - Part C.
3. **The engine source** at `ba2f279`, and the harness `tests/03/baseline-harness.js` (`harnessPlan`, `harnessPlay`, `economySweep`).
4. **Not seen:** any optimal-plan output; §5's harness with hazards switched off; any re-planning run.

Predictions that follow from items 1–2 are marked **informed**. A success on one counts as consistency, not confirmation.

## 4. Method

### 4.1 The optimal hazard-free plan (DP)

- **State.** (port *p*, month *t*), *t* = 0…23. At each state, keep the most cash reachable with an empty hold after selling.
- **Why most cash is enough.** With no market depth (E1 in PR #24), the result of any action is non-decreasing in cash under the fill rule, as long as the fill rule is monotone. This is checked, not assumed (§4.4 check 2).
- **Actions** at (*p*, *t*):
  - wait one month (wages plus port fee);
  - make a delivery of 1–3 consecutive legs. Buy at *p* by the fill rule, priced for sale at the delivery's last port at the arrival month (capped at 23), carry the cargo unsold through intermediate ports, and wait wherever the policy forbids the next departure.
- **Policies** restrict departures as §5 defines them: *sail always* (any month), *avoid headwind*, *avoid headwind and transition*. Waiting is allowed under every policy, including *sail always*. This is a deliberate difference from the harness, which never waits under *sail always*; the harness comparison in §4.2 keeps the harness's own rule.
- **Fill rule.** S-greedy, `harnessPlan`'s rule (fill by sale/cost ratio, keep 60 D back), so the DP's action set contains every harness action. S-opt (the LP fill, floored, then topped up by margin per tonne) is reported alongside, not scored.
- **Accounting.** Planning uses Level 1: live prices, base tariffs, port fees at the standing the plan itself builds. The standing tariff cut is ignored while planning. Every plan is then replayed through the engine (§4.4), and **the replayed engine figure is the one scored**.
- **Terminal.** A delivery that arrives at month 24 or later ends the campaign and is credited (D01). Net = final cash − debt − starting equity, with interest exactly as `advanceTime` charges it.
- **Start.** Calicut, January, as in §5.
- **Cells.** Dhow and junk × normal, hard, survival (§5's difficulties) × the three policies = 18 cells.

### 4.2 The harness, hazards off

Run `harnessPlay` from `tests/03/baseline-harness.js` unchanged, through the engine, in the same 18 cells, with every `Math.random` draw returning 0.99. That means:
- no turn-back, storm, becalming, jettison, mildew, piracy, port story or mutiny;
- headwind damage near its maximum under *sail always*, which can break porcelain and trigger the harness's repair rule.

The DP's replay uses the same constant draw, so the two are compared under identical engine conditions.

### 4.3 Re-planning with hazards on

- **Rule.** Before every action, solve §4.1's DP from the current state (port, month, cash, debt, standing) and take its first action.
- **Runs.** Through the engine, in the same 18 cells, with `Math.random` fed from Mulberry32. N = 300 seeds per cell, seeds 200001–200300, disjoint from §5's (1–300) and PR #24's (100001–102000).
- **Comparison.** The harness runs on the same seeds with hazards on, which reproduces §5's design.
- **Caveat.** Pairs share a seed, not common random numbers: the ships and policies make different voyages, so they meet different hazards (as §5 notes).

### 4.4 Checks, run before any result is read

1. **Engine replay.** Every hazard-free DP plan is replayed through `buyCargoQty`, `sellCargoQty`, `sailTo` and `waitInPort`, with the draws scripted (`tests/03/engine/load-engine.mjs`). The planning cash and the engine cash are both recorded. They are expected to differ only through the standing tariff cut.
2. **Monotonicity.** For every (port, month, delivery) the DP uses, the delivery's result must be non-decreasing in starting cash, on a grid of 400 cash values from 0 to 500,000 D. Any violation is reported with its count, and the DP is then called a lower bound on the optimum, not the optimum.
3. **Containment.** In each cell, the DP's planning value must be at least the harness's hazard-free value computed in the same planning accounting, because every harness action is a DP action. A violation is a bug and is fixed before anything is scored. The fix and both outputs are reported.
4. **Planted defect.** Add 1 D to one wait's cost inside the DP. Check 3 must still pass, and the replayed engine cash for that plan must change. This shows the replay can fail.

## 5. Predictions and what would count against them

Scored on the engine-replayed figures (§4.4 check 1).

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| A1 | **The decisive one.** Under the optimal hazard-free plan, the junk's net exceeds the dhow's under all three policies at every difficulty (9 cells) | informed (PR #24) | the dhow is ahead in any cell; those cells are reported |
| A2 | §5's reversal does not need hazards: with hazards off, the harness still puts the dhow ahead under *avoid headwind* at normal, hard and survival | blind | the junk is ahead in any of those 3 cells |
| A3 | The harness's look-ahead costs the junk more than the dhow: under *avoid headwind*, optimal/harness (hazards off) is at least 1.5 for the junk and at most 1.25 for the dhow, at every difficulty | blind (magnitudes chosen from PR #24's fixed-cycle gap, which was seen) | either bound fails in any of the 3 difficulties |
| A4 | Wind avoidance is worth little under optimal play: with hazards off, the optimal *avoid headwind* plan reaches at least 90% of the optimal *sail always* plan (which can also wait), for both ships at every difficulty | informed (PR #24 P2.1, P2.5) | below 90% in any of 6 cells |
| B1 | Re-planning beats the harness with hazards on: median net is higher in all 18 cells | blind | the harness's median is equal or higher in any cell |
| B2 | With hazards on and re-planning, the junk beats the dhow on at least 270 of 300 same-seed pairs under each policy at every difficulty | informed | fewer than 270 in any of 9 cells |
| B3 | With hazards on, the re-planning *avoid headwind* median lies within ±10% of the re-planning *sail always* median, for both ships at every difficulty | blind | outside ±10% in any of 6 cells |

**Validation, not predictions:** checks 1–4 in §4.4. If check 3 fails, nothing is scored until it passes.

**Decision rule** (fixed now):
- **A1 and A2 both supported:** §5's ship ranking under *avoid headwind* is a property of the harness's one-voyage look-ahead. Report that D06's mechanism is route choice. Any change to the README, the baseline or teaching material is the owner's decision; nothing is proposed for the game.
- **A1 contradicted in some cell:** under good play the dhow wins there, so the trade-off is real in that cell. Report the cells, and the deliveries and timing that make the dhow win. A follow-up on that mechanism needs its own pre-registration.
- **A2 contradicted:** the reversal needs hazards, so turn-backs or piracy decide the ranking under the harness. Report the cells, and stop; whether to study hazard exposure is a new protocol.
- **B results** are reported whatever A shows. B1 failing means the DP's hazard-free plan is a poor guide when hazards are on, and is itself a finding.

## 6. Choices fixed in advance (forking-paths guard)

| Choice | Value | Selected on the result? |
| --- | --- | --- |
| Fill rule (scored) | S-greedy, to contain the harness's actions | No: set by check 3's containment requirement |
| Delivery span | 1–3 legs | No: PR #24 found every best cycle within 3-leg deliveries; longer is a larger search with no seen reason |
| Price level | Level 1, standing tariff ignored in planning; engine replay scored | No: matches the engine and §5 |
| Hazards off | every draw 0.99 | No: one constant for both the DP replay and the harness |
| Difficulties | normal, hard, survival | No: §5's |
| N, seeds | 300; 200001–200300 | No: §5's N; seeds disjoint from earlier runs |
| Thresholds in A3, A4, B2, B3 | 1.5 / 1.25, 90%, 270/300, ±10% | Partly. A3's bounds were set with PR #24's fixed-cycle gaps in view (+65–83% junk, −20–44% dhow). They are stated before any DP or hazard-off harness output exists, but they are not blind |
| Start | Calicut, January | No: §5's |

**Confirmatory:** A1–A4 and B1–B3, with the rule above. **Exploratory**, reported as such: S-opt results; easy difficulty; a start port other than Calicut; anything chosen after seeing output.

**One-sentence finding, drafted before running:** "Under the best route choice the game allows, the junk earns about twice the dhow's profit under every wind policy; §5's dhow win under *avoid headwind* comes from the test harness choosing one voyage at a time."

## 7. Outcomes and verdict

- **Interesting outcome:** A1 and A2 hold. D06's "strategy decides the winner" narrows to "a short-sighted strategy decides the winner", and the game's ship choice is a hold-size question under good play.
- **Null or boring outcome:** the optimal plan just reproduces PR #24's ranking (A1 holds), and the harness's reversal disappears with hazards off (A2 fails). **Worth knowing: yes.** It moves D06's cause from route choice to hazards, which says which mechanism a teacher should point at.
- **Dead outcome:** check 3 cannot be made to pass, or check 2 finds widespread non-monotonicity. The DP then gives no optimum to compare with, and the question needs a different method.

**Execution proxies**
1. **Cheapest decisive experiment:** §4.1 and §4.2 alone. 18 deterministic DP solves and 18 hazard-free harness runs through the engine, which decides A1 and A2.
2. **Baselines a hostile reviewer would demand:**
   - the harness itself (§4.2);
   - PR #24's fixed cycle (already reported);
   - S-opt beside S-greedy;
   - the DP with waiting forbidden under *sail always*, as the harness does, reported for that policy.
3. **Most likely null:** A2 fails (the harness's reversal needs hazards). Detected directly by §4.2.
4. **Cost:** the DP has 5 × 24 states and at most a few dozen actions each, so a solve takes milliseconds. §4.3 is 18 × 300 runs × about 20 re-solves, on the order of minutes in Node on a laptop. No cluster.

**Prior-art grounding:** none searched. The question concerns this game's invented parameters, and the method (deterministic dynamic programming over port and month) is standard. No published run of the decisive experiment can exist.

**Verdict: PURSUE** (accepted by the owner on 2026-11-23).
- The null outcome is worth knowing.
- The decisive test is minutes of compute.
- The prediction is scaled to effects already seen (a twofold profit gap), neither trivial nor grandiose.

## 8. Implementation, outputs and stopping

- **Code:** `research/03/models/adaptive-routes.mjs` (Node ≥ 22, no dependencies), using `tests/03/engine/load-engine.mjs` and `research/03/models/economy-skeleton-params.json` (from PR #24, so this runs after #24 merges). The DP is written in JavaScript so that §4.3 can call it inside the engine loop.
- **Outputs:** `research/03/results/<run date>-adaptive-routes/`:
  - the plans;
  - replayed engine paths;
  - per-cell nets;
  - same-seed counts;
  - checks 1–4;
  - a results note scoring every prediction, failures first.
- **Stopping:** each part runs once. N is not raised after seeing results. A bug found after results is fixed, the whole run is repeated, and both outputs and the bug are reported.
- **Order:** checks 1–4 first, then A1–A4, then B1–B3. B is run even if A is decisive.

## 9. Deviations

Append dated entries here, below this line, before any result that depends on them is reported. Each entry says what changed, why, and whether results had been seen.

---

*(none yet)*

## 10. Limits stated in advance

- Perfect price knowledge and an exact planner: this says what the game allows, not what students do.
- Hazards-off figures are not the game's typical outcomes; §4.3 is the closest to play, and it still uses a planner no student has.
- No market depth (E1) drives compounding; conclusions stand or fall with it. Nothing here is a historical claim.
- The DP keeps only the most cash per (port, month). Debt that depends on the path (interest charged once when a single action crosses two six-month blocks) and standing are carried along, not optimised. Both effects are bounded by PR #24's engine checks (debt at most 608 D on hard).
- Same seed is not common random numbers.
