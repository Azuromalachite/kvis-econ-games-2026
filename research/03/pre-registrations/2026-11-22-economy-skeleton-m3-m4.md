<!-- Provenance note added on transfer. Everything from the title down through section 8's opening paragraph is byte-identical to the registered commit. -->
> **Moved here** from Monsoon Navigator's original repository on 2026-11-22. It was registered there in [Antooooon125/Week3-monsoon-navigator#13](https://github.com/Antooooon125/Week3-monsoon-navigator/pull/13) at commit `d31f0ef` (unmerged), not in this repository's PR #8.
>
> - **Frozen text.** Everything above section 8's dated entries is byte-identical to `d31f0ef` and must not be edited. Record any change as a dated entry in section 8, as the protocol itself provides. The frozen part can be checked with `cmp` against that commit.
> - **Paths and references.** Every path, PR number and commit in the registered text refers to the original repository. That covers `index.html`, `docs/baseline.md`, `tools/`, `tests/engine/`, `tests/fixtures/`, `research/models/`, `research/results/`, the README, `CONTRIBUTING.md`, the tracker, PRs #10 and #11, and commits `111acdc` and `ba2f279`. In this repository:
>   - the game is `projects/03/index.html`, byte-identical to that repository's `ba2f279` `index.html`;
>   - the fixture is `tests/03/fixtures/baseline-transit.json`;
>   - the harness, browser check and engine loader are under `tests/03/` (#6);
>   - any run here should put its code and outputs under `research/03/`, recorded as a section 8 entry.
> - **Prior reading.** Section 2 states that the literature in PR #11 had not been seen. #11 was written in the same GitHub account about an hour earlier, by a separate agent session. Whether this protocol's author had read it before registering isn't recorded.
> - **Authorship.** Written through Thanakrit Wongsatit's account with AI assistance. It is licensed as repository material under `LICENSE.md` (CC BY-NC-SA 4.0).

# Pre-registration: an analytic economy skeleton (M3, M4)

| | |
| --- | --- |
| Status | **Registered, not run.** No model in this document has been coded or evaluated. |
| Registered | 2026-11-22, in the PR that adds this file |
| Experiments | M4 ("when does waiting pay"), in full. M3 ("when is a larger ship advantageous"), only its analytic part; the policy sweep M3 also asks for is not registered here |
| Work package | P03 (transport economics) |
| Engine | `index.html` as pinned in `docs/baseline.md` §1 (`111acdc`). `main` at `ba2f279` changes `index.html`, but only its setup screen, game modes and audit display; no value in baseline §2 changes, and `tools/baseline-check.html` reports MATCH on `ba2f279` (see the PR) |
| Inputs | `docs/baseline.md` §2 tables; `tests/fixtures/baseline-transit.json` (480 rows, revision `111acdc`) |
| Validation dependency | `tests/engine/load-engine.mjs` from PR #10, **not yet merged**. Part C below waits for it |
| Kind of change | Research (Path B). Nothing here edits `index.html` or proposes a mechanics change |

## 1. Why

`docs/baseline.md` §5 shows two things no one designed: every one of 5,400 automated campaigns clears the 1,200 D target (D05), and which ship wins is set by the strategy rather than by the trade-off the README describes (D06). Reading the engine suggests a common cause. Trade has no market depth: prices do not respond to purchases and any quantity can be bought (`buyCargoQty` is limited only by cash and free tonnage). So a campaign is a compounding arbitrage that is capped by the hold, and the clock matters more than the hazards, because hull damage has almost no economic consequence. That is a hypothesis. This protocol writes down two small models that would make it testable, and says in advance what result would count against it.

The models are deliberately skeletal. They are not a replacement for the game and not a claim about historical trade. Every number they produce is a property of the game's invented parameters (baseline §2), not a historical finding.

## 2. Prior looks: what is not blind

The following were seen before this protocol was written. Predictions that depend on them are marked **not blind** below, and a success on them counts only as a consistency check.

1. **Baseline §5 (exploratory sweep, `economySweep()` in `tools/baseline-harness.js`).** By median, *avoid headwind* beats *sail always* for both ships at every difficulty; every run clears 1,200 D; the dhow wins 300/300 same-seed pairs under *avoid headwind* and the junk wins 300/300 under the other two policies, at every difficulty. The medians and minima in its table were seen.
2. **The engine source.** The author read `index.html` at `ba2f279`: `computeTransit`, `buyCargoQty`, `sellCargoQty`, `waitInPort`, `sailTo`, `advanceTime`, `finishCampaign`, `getWindState`, the price, tariff and fee functions, and every use of `state.hull`. Facts used below (§3) come from that reading.
3. **The candidate mechanism** in §4.1 (cloves dominate; the junk's hold only pays once cash exceeds the cost of a full dhow hold) came from reading the base-price table and the code, before this protocol. It is the hypothesis under test, not a result.
4. **The transit fixture.** Its structure and first row were seen. No derived quantity (expected months, waiting gain) was computed from it.
5. **One analytic observation from the code.** On a headwind (cos < −0.5) the speed factor `cos·α + 0.5` is below the 0.25 floor for both vessels (α = 0.85 and 0.60), so a lane's months charged are the same in every headwind month for a given vessel and navigator choice. The stationarity that *E_naive* (§4.2) assumes therefore holds while the headwind lasts, and P2.2 can fail only through retries that land in slow transition months (factor × 0.65). This was worked out before writing P2.2.
6. **Not seen:** any output of either model below; any per-voyage margin, threshold, growth rate or waiting gain; the R5 tests' outputs beyond their pass counts reported in PR #10; the literature in PR #11.

## 3. Engine facts the models rely on

Each is from code reading at `ba2f279` and is re-checked against the engine in Part C.

| # | Fact | Where |
| --- | --- | --- |
| E1 | Purchase quantity is `min(requested, floor(free tonnage / lot weight), floor(cash / unit cost))`. There is no supply limit and no price response to trade | `buyCargoQty` |
| E2 | Unit cost = `round(live price × (1 + effective tariff))`; sale revenue = live price at the port and month of sale, with no tariff | `buyCargoQty`, `sellCargoQty` |
| E3 | Live price = `max(10, round(base × (1 + 0.08·sin((month + seed)·π/6))))` | `getLivePortPrice` |
| E4 | Sailing charges `wages × months` at departure; waiting charges one month of wages plus the port fee | `sailTo`, `waitInPort` |
| E5 | A headwind (not a transition month, cos < −0.5) turns the ship back with probability 0.35. The months are charged either way and the cargo stays aboard. Whether a lane-month is a headwind does not depend on the vessel or the navigator | `sailTo`, `computeTransit` |
| E6 | Hull has a floor of 5 and nothing ends the campaign or sinks the ship. Its only effect is the porcelain loss (20% of lots, at least 1) on a headwind or transition voyage when hull is below 70 after that voyage's damage. Repair (60 D, +25) exists only to prevent that | `sailTo`, `repairHull`; no other read of `state.hull` |
| E7 | The campaign starts in January (month index 0) and ends when an action takes the month index to 24 or more, or cash below −250 D. Cargo is then sold at the current port at the price of month `min(23, index)`, and debt is deducted. A voyage may end past month 24 and is still credited (D01) | `advanceTime`, `finishCampaign` |
| E8 | Other money effects of time and weather: loan interest 5% at each multiple of 6 months; mutiny probability `(50 − crew health)/100` after a voyage, cost 2 months' wages; crew health −8 per month at sea, −12 after a headwind or storm, +20 per month in port; piracy, port stories, teak jettison and textile loss as in baseline §2 | `advanceTime`, `getMutinyRisk`, `sailTo`, `waitInPort` |

## 4. The models (written before any evaluation)

### 4.0 Notation

Goods *g* with lot weight *w_g*. Ports *i, j*. Calendar month *t* (index from 0). Vessel *v* with capacity *K_v* and wages *u_v* per month. Directed lane *ℓ = (i → j)*. *M_v(ℓ, t)* is the months charged for lane *ℓ* departing at *t*, read from the fixture (no navigator unless stated). *p_g(i, t)* is the live price (E3), *τ_i* the effective tariff, *c_g(i, t)* the unit cost (E2). The margin per lot on a delivery from *i* at *t* to *j* arriving at *t′* is *m_g = p_g(j, t′) − c_g(i, t)*.

Two price levels are used throughout:

- **Level 0 (primary):** base prices, base tariffs, no seasonal wave. Cleanest statement of the mechanism.
- **Level 1 (sensitivity):** live prices with the ±8% wave, standing-dependent tariff ignored.

Multi-leg holding is allowed: a good may be carried through an intermediate port unsold (for example Malacca → Calicut → Aden). A *delivery* is the pair (buy port and month, sell port and month).

### 4.1 Q1 — compounding with a ceiling (M3, analytic part)

**Per delivery.** With cash *C* at the buy port, the cargo choice is the two-constraint problem

> maximise Σ_g n_g·m_g subject to Σ_g n_g·c_g ≤ C, Σ_g n_g·w_g ≤ K_v, n_g ≥ 0 integer.

Its linear relaxation is solved exactly (at most two goods are bought). Two rankings fall out of it: **return on cash** *r_g = m_g / c_g*, which decides the cargo while cash binds, and **margin per tonne** *m_g / w_g*, which decides it while the hold binds. For the single best good the regime boundary is the **full-hold cost**

> C*_v,g = c_g · K_v / w_g.

Below it, profit per delivery is *C·r_g − (costs)*; above it, *(K_v / w_g)·m_g − (costs)*. Costs per delivery are *u_v·M* (wages; E4) and, at Level 0, nothing else.

A second fill rule is computed alongside, because it is what the §5 harness does: **S-greedy** fills the hold by descending sale/cost ratio among goods with ratio > 1 (`harnessPlan` in `tools/baseline-harness.js`). The LP fill is **S-opt**. Under S-greedy the cargo is ranked by return on cash in both regimes.

**Per cycle.** A *cycle* is a closed sequence of deliveries that returns to its starting port, with total time *T* = Σ M (plus any waits the policy imposes). For each candidate cycle and vessel:

- cash-limited growth factor per cycle *G* = Π_legs (1 + r_leg) with wages subtracted leg by leg, and rate **ρ = ln G / T** per month;
- capacity-limited profit rate **R_cap = (Σ_legs (K_v / w_leg)·m_leg − u_v·T) / T** in D per month;
- switch month **t\* = ln(C* / C_0) / ρ**, with *C_0* the starting cash of the difficulty (for *hard*, cash 800 with debt 500; equity is what the target is measured on);
- projected gain in cash **F = C* − C_0 + R_cap·(24 − t\*)** if *t\* < 24*, else *C_0·(e^{24ρ} − 1)*. The game's net profit is final cash minus remaining debt minus starting equity, so on *hard* it is F less the accrued loan interest; the comparison with 1,200 D uses that.

Candidate cycles are all closed walks of at most 6 legs on the five-lane graph (two-port shuttles, the Kilwa–Aden–Calicut triangle, and walks such as Calicut → Malacca → Quanzhou → Malacca → Calicut), with each delivery spanning one or more consecutive legs. For each vessel, difficulty and policy (§4.3) the best cycle by *F* is reported, along with the best cycle in each regime separately.

**Horizon check (R-H).** Because voyages are whole months and the last one can overrun (E7), *F* is also computed by stepping cycle by cycle through the actual calendar to month 24 with integer purchases (E1, E2), on a hazard-free path, starting at Calicut as §5 does and including the legs needed to reach the cycle. The linear *F* is primary; R-H says how much the linearisation moves it.

**Trade-off boundary.** For each policy, the junk's advantage is *ΔF = F_junk − F_dhow*. The README's trade-off ("lower overhead versus a bigger hold") exists in this skeleton only where *ΔF* changes sign across the range of starting cash or horizon a class could plausibly use. For each of these parameters, singly, the smallest change that puts *ΔF* = 0 under each policy is reported: junk wages, dhow wages, junk capacity, dhow capacity, clove lot weight, the clove base-price spread (Malacca buy price), starting cash, campaign length. This is an analysis of the current model. It proposes no change; any change to these values needs the owner's agreement (CONTRIBUTING).

### 4.2 Q2 — the price of time (M4)

**Months.** For directed lane *ℓ*, departure month *t*, vessel *v* and navigator choice, where *ℓ* is a headwind at *t*:

- **E_naive(t) = M(t) / (1 − 0.35)**: expected months to complete the voyage if every retry faced the same headwind (geometric retries).
- **E_cal(t)**: the same "sail now, retry at once if turned back" rule, evaluated on the calendar: *E_cal(t) = M(t) + 0.35 · E_cal′(t + M(t))*, where *E_cal′* uses the lane's status at the new month (no turn-back risk if it is no longer a headwind). Truncated at month 24 with the E7 crediting rule.
- **W_nh(t) = k_nh + M(t + k_nh)**: wait in port for the first month that is not a headwind on *ℓ*, then sail.
- **W_tw(t) = k_tw + M(t + k_tw)**: wait for the first tailwind month on *ℓ*, then sail.

A waiting option whose departure month would be 24 or later is unavailable and dropped from the minimum below.

The **time gain from waiting** is **Δ(t) = E_cal(t) − min(W_nh(t), W_tw(t))** months; *Δ > 0* means waiting completes the voyage sooner in expectation. *E_naive* is reported beside *E_cal* to show how much the simple formula misleads.

The same quantities are computed for non-headwind departures (crosswind or transition months), comparing sailing now with waiting for a tailwind, because "wait for the monsoon" is also advice about those months.

**Money.** The monetary value of waiting is

> ΔV(t) = λ · Δ(t) + (D_sail(t) − D_wait(t)),

where *λ* is the value of a month from Q1 and *D* are expected direct costs:

- *λ* = **ρ·C(t)** in the cash-limited regime (so the price of a month grows with cash), and **R_cap** in the capacity-limited regime, each on the vessel's best cycle under the relevant policy;
- *D_sail*: wages for the expected months at sea; expected teak jettison; expected porcelain loss under E6 for a given starting hull; expected mutiny cost bounded between 0 and 2·u_v; for transition voyages, becalming (−20 D) and textile loss;
- *D_wait*: *k* months of wages plus port fee (difficulty and standing as at the start; the standing gain and port-story income of waiting are reported as a separate term, not netted silently).

Hull damage enters only through the porcelain term (E6). That is the claim being tested, not an assumption: Part C checks that forcing heavy hull damage on a cargo without porcelain leaves the cash path unchanged.

Outputs are tables over the 10 directed lanes × 12 months × 2 vessels × navigator (yes/no), plus the share of headwind cells with *Δ > 0* and with *ΔV > 0*.

### 4.3 Policies

The three §5 policies, as the harness defines them (*sail always*, *avoid headwind*, *avoid headwind and transition*), enter Q1 only through the months each cycle takes: the policy decides which departures are allowed and how long the ship waits. In Q1 at Level 0 the turn-back risk of *sail always* is charged at its expectation (*E_cal*). No new policy is introduced in this protocol.

## 5. Predictions and what would count against them

Each prediction is scored **supported**, **contradicted** or **inconclusive** by the rule given. All are at Level 0 unless stated; Level 1 is reported for each and a prediction that flips between levels is reported as **level-sensitive** whatever its Level 0 score.

### Q1

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| P1.1 | Cloves rank first by return on cash on at least one delivery of the best cycle, for both ships, at every difficulty | blind (but suggested by reading the price table) | another good ranks first by return on cash on every delivery of the best cycle, for either ship at any difficulty |
| P1.2 | Both ships start cash-limited at every difficulty: *C_0 < C*_v* on their best cycle | blind | either ship is capacity-limited at month 0 at any difficulty |
| P1.3 | The junk's hold only pays after cash passes the dhow's full-hold cost: in the cash-limited regime the dhow's ρ is at least the junk's on each ship's best cycle, and in the capacity-limited regime the junk's R_cap exceeds the dhow's | blind | ρ_junk > ρ_dhow, or R_cap,junk ≤ R_cap,dhow, under any of the three policies |
| P1.4 | D05: the projected final profit F exceeds 1,200 D for every vessel × difficulty × policy cell | **not blind** (§5) | any cell has F ≤ 1,200 D |
| P1.5 | D06: the sign of ΔF matches §5 in all 9 policy × difficulty cells (dhow ahead under *avoid headwind*, junk ahead under the other two) | **not blind** (§5) | the sign differs in any cell; the cells that differ are reported and the mechanism is then incomplete |
| P1.6 | The skeleton's level is right without fitting: S-greedy's R-H final profit falls within ±25% of the §5 median in each *avoid* cell (where §5's seed spread is about 3%) | **not blind** (the target values were seen, but the skeleton has no free parameter to tune) | any *avoid* cell misses by more than 25%. *Sail always* cells are reported, not scored, because their spread is wide |
| P1.7 | Overhead is not the lever: no junk wage in 0–105 D/month (0–3×) reverses the sign of ΔF under all three policies, while at least one of the clove spread, the clove lot weight and the junk-to-dhow capacity ratio does so within a factor of 2 of its current value | blind | a junk wage in that range reverses ΔF under all three policies, or none of the three margin/capacity parameters does within a factor of 2 |

### Q2

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| P2.1 | Waiting saves time: Δ > 0 in more than half of headwind cells, for each vessel | blind | Δ ≤ 0 in half or more of headwind cells for either vessel |
| P2.2 | The simple formula overstates the cost of sailing now: E_naive ≥ E_cal in every headwind cell, and strictly greater in at least one | blind | E_naive < E_cal in any cell |
| P2.3 | Time, not damage, sets the money: in the capacity-limited regime, sign(ΔV) = sign(Δ) in at least 90% of headwind cells | blind | fewer than 90% agree |
| P2.4 | The price of time rises with cash: the share of headwind cells with ΔV > 0 is larger at the switch point *C\** than at the starting cash of *hard* | blind | the share is the same or smaller |
| P2.5 | Avoiding headwinds beats sailing regardless of wind for both ships at every difficulty, in the skeleton's F | **not blind** (§5) | *sail always* has the larger F in any vessel × difficulty cell |

A contradicted prediction is reported as such, in the results file, with the cells that failed. No prediction is dropped, reworded or re-scored after results are seen; deviations go in §8.

## 6. Part C — validation against the real engine

Runs only after PR #10 merges, against the engine at the revision this protocol pins (or, if the engine has moved, against `111acdc` checked out explicitly, with the move reported).

1. **Parameter identity.** Load the engine with `load-engine.mjs` and compare `COMMODITIES`, `VESSELS`, `PORTS`, `SEA_LANES`, `DIFFICULTIES` with the skeleton's parameter file (transcribed from baseline §2). Any difference blocks the comparison until resolved.
2. **Hazard-free path, exact.** Script `Math.random` so that no hazard fires (values that skip turn-back, piracy, port stories, storms, becalming, jettison and mutiny; the script is committed with the results). Drive S-greedy through the engine's own `buyCargoQty`, `sellCargoQty`, `sailTo`, `waitInPort` for the best cycle of each vessel at each difficulty. **Pass:** the engine's cash at every arrival equals the skeleton's R-H integer path exactly. A mismatch is a defect in the skeleton or in a fact in §3 and is reported before anything else.
3. **Forced turn-back.** Script a turn-back on a headwind departure and check the months charged, cargo retained and position (E5).
4. **Hull has no cash effect (E6).** On a cargo without porcelain, script maximal hull damage on every voyage and compare the cash path with the hazard-free path. **Pass:** identical cash at every step.
5. **Expected months, stochastic.** For each headwind cell, run the "sail now, retry at once" rule for N = 2,000 replicates, feeding `Math.random` from a Mulberry32 stream with seeds 100001–102000 (disjoint from the §5 seeds). If the merged loader accepts only a finite queue, the queue is pre-generated from the same stream. **Pass:** E_cal lies inside the 95% interval of the replicate mean in at least 95% of cells.

The comparison of Q2 against the engine is against an analytic expectation, not a paired policy contrast, so it does not need common random numbers. The policy contrasts in P1.5 and P2.5 are checked against §5 as already reported (same seed, not common random numbers; see the tracker §4).

## 7. Implementation, outputs and stopping

- **Code:** `research/models/economy_skeleton.py`, standard library only (Python ≥ 3.10), reading `tests/fixtures/baseline-transit.json` and a parameter file `research/models/economy-skeleton-params.json`. Part C: a Node script under `research/models/` using the PR #10 loader (Node ≥ 22). Nothing under `research/` is loaded by `index.html`.
- **Outputs:** `research/results/2026-11-22-economy-skeleton/` with machine-readable tables (per-delivery rankings and thresholds; per-cycle ρ, R_cap, t\*, F; ΔF and the boundary table; the Q2 cell table) and a results note scoring every prediction in §5, with the failures listed first.
- **Stopping:** the skeleton is deterministic and is run once per level. Part C runs once at N = 2,000; N is not increased after seeing a result. If a bug is found, the fixed code is re-run in full and the bug and both outputs are reported.
- **Exclusions:** none planned. A lane-month the fixture does not contain is reported as missing, not imputed.
- **Data split:** not applicable to the deterministic skeleton. Part C's seeds are disjoint from §5's.

## 8. Deviations

Append dated entries here, below this line, before any result that depends on them is reported. Each entry says what changed, why, and whether results had been seen.

---

### 2026-11-23 — run setup and interpretations, fixed before any output

Written before either model or Part C was run. No output of any kind had been seen. (A syntax check of the code is the only thing that had run.)

**Where things are (moved repository).**
- Code: `research/03/models/economy_skeleton.py`, `research/03/models/economy-skeleton-params.json` and `research/03/models/economy-skeleton-partc.mjs`.
- Outputs: `research/03/results/2026-11-22-economy-skeleton/`.
- Fixture: `tests/03/fixtures/baseline-transit.json`.
- Loader: `tests/03/engine/load-engine.mjs`. This is PR #10's loader, moved here in #6, so Part C's dependency is met.

**Engine revision (deviation).** Part C runs against `projects/03/index.html`, not `111acdc` as §6 asks.
- Its inline engine script is byte-identical to `ba2f279`'s.
- In both `111acdc` and `ba2f279`, these are byte-identical: every protected constant (`PORTS`, `SEA_LANES`, `COMMODITIES`, `VESSELS`, `DIFFICULTIES`) and `getWindState`, `getLivePortPrice`, `computeTransit`, `buyCargoQty`, `sellCargoQty`, `waitInPort`, `sailTo`, `advanceTime`, `getMutinyRisk` and `repairHull`.
- `finishCampaign` differs only in its audit display. Part C step 1 re-checks this and reports any difference.
- `111acdc` is not loaded because the loader's `start()` needs `selectGameMode`, which `111acdc` lacks.
- Runtimes: Python 3.14 and Node 22.21 (the runtime bundled in an Electron app, run as Node).

**Interpretations of §4–§6 (choices the registered text leaves open).**

*Q1, timing and fills*
1. **Cycle timing.** A cycle is repeated from January at its first port, and the waits are set by the policy. The steady state is the loop of passes after the starting calendar month first repeats. ρ, R_cap and T are taken over that loop. Each rotation of a walk is a separate candidate, so every phase is covered.
2. **Sail-always time.** Under *sail always*, a headwind leg is charged *E_cal* months (§4.3). The calendar then advances by the no-turn-back months.
3. **Wait costs in Q1.** A wait month costs wages plus the port fee (E4), at the starting standing.
4. **Fills.** Both fills are computed. Predictions P1.1–P1.5, P1.7 and P2.5 are scored with S-opt, the §4.1 LP. P1.6 is scored with S-greedy, as registered.
5. **Switch cash.** C\* for a cycle is the largest full-hold cost of its profitable deliveries, so R_cap applies to the whole cycle after t\*. The smallest is reported beside it, as a stricter reading of P1.2.
6. **Starting cash in ρ.** ρ is computed from the difficulty's starting cash, with costs subtracted delivery by delivery.

*Q1, the horizon check (R-H)*
7. **Policy rules.** R-H follows the best cycle, not the harness's myopic route choice. Before each delivery it sells everything, then repairs when hull < 60 and cash > 200. Buying keeps 60 D back (`harnessPlay`, `harnessPlan`).
8. **Delivery pricing.** A multi-leg delivery prices its sale at the final port, at the projected arrival month (capped at 23).
9. **Hazard-free.** Damage draws return 0, the least damage, and every other draw returns 0.99. Under *sail always*, headwind damage still occurs, and the porcelain rule (E6) still applies.
10. **Levels.** R-H runs at Level 0 (base prices and tariffs) and at Level 1 (live prices). Port fees follow standing in both, as the engine's do.
11. **Engine-exact path.** Part C compares the engine with an engine-exact R-H path: Level 1 plus the standing tariff cut (−1 point at standing ≥ 50), which the engine applies. The Level 1 linear model still ignores that cut, as registered.

*Scoring scope*
12. **Policies and difficulties.** P1.1–P1.4 and P2.5 are scored for every policy and all four difficulties, easy included. P1.5 and P1.6 are scored on §5's three.
13. **P1.7 reading.** "Reverses the sign of ΔF under all three policies" is read as: for each policy separately, some value in the range reverses that policy's sign.
    - The clove spread is the Malacca base price, from 75 to 300.
    - The capacity ratio is varied through the junk's capacity, from 150 to 600, with the dhow fixed.
    - The boundary scan is at normal difficulty, and the best cycle is re-optimised for each value.

*Q2*
14. **λ.** λ comes from the vessel's best cycle by F over all three policies (S-opt), at the same level. P2.3 uses R_cap at normal. For P2.4:
    - the low point is ρ·800 on hard, with the cash-limited cargo;
    - the switch point is R_cap on hard's best cycle, with a full hold. ρ·C\* is reported beside it.
    - P2.4's share pools both vessels and both navigator choices, and the per-vessel shares are reported.
15. **Symmetric voyage costs (deviation from the §4.2 wording).** *D_wait* also counts the voyage that follows the wait: its wages and, in a transition month, becalming and textile loss. Otherwise one option's voyage would be costed and the other's not.
16. **D-term inputs.** The cargo for the D terms is the S-opt LP fill for that lane and month, at the regime's cash. Starting hull is 100.
17. **Mutiny.** The primary ΔV leaves mutiny out. ΔV is also reported at the two bounds: sailing pays 2·u_v on every attempt, or the delayed voyage pays 2·u_v. P2.3 also reports agreement at both bounds.
18. **Non-headwind cells.** These compare sailing now (*M(t)*) with waiting for the first tailwind month (k ≥ 0, so a tailwind cell gives Δ = 0). They are reported, not scored.

**Part C details.**
19. Step 2 replays the skeleton's engine-exact action plans through the engine's own functions. Before each action it pushes the draws the skeleton predicts, then asserts that no scripted draw is left over.
20. Step 4 disables the harness's repair rule, because repair is a policy cash effect, not an engine one. It then compares least-damage and most-damage (draw 0.9999) runs.
21. Step 5 replaces `renderAll` with a no-op, as `economySweep` does. The page display is not part of the claim.

## 9. Limits stated in advance

- The skeleton assumes perfect price knowledge, as the §5 harness does. It says what the game's economy permits, not what students do.
- No market depth is a property of the game (E1). The skeleton's conclusions about compounding stand or fall with it; a historical claim about compounding trade is outside this protocol.
- Level 0 drops the seasonal price wave; Level 1 reinstates it. Neither models piracy losses or mutiny in the cash path; they are reported as side terms (mutiny bounded by 0 to 2 months' wages per voyage). Under constant sailing crew health only falls, so the mutiny term may not be small; Part C's hazard-free path scripts it away and says so.
- The expected-value treatment of turn-backs (§4.2) ignores the variance a single class run sees. Part C reports the spread, not only the mean.
- A success on a not-blind prediction (P1.4, P1.5, P1.6, P2.5) shows only that the skeleton is consistent with what was already seen.
