# Results: the analytic economy skeleton (M3 analytic part, M4)

| | |
| --- | --- |
| Protocol | [`research/03/pre-registrations/2026-11-22-economy-skeleton-m3-m4.md`](../../pre-registrations/2026-11-22-economy-skeleton-m3-m4.md); interpretations and deviations in its §8 entry of 2026-11-23, committed before any run |
| Run | 2026-11-23. Skeleton run once (both levels in one run, 29 min). Part C run once, at N = 2,000. No bug was found, so nothing was re-run |
| Code | `research/03/models/economy_skeleton.py`, `economy-skeleton-params.json`, `economy-skeleton-partc.mjs` |
| Engine | `projects/03/index.html`. Its engine script is identical to `ba2f279`'s, and its protected functions are identical to `111acdc`'s (Part C step 1) |

Every number here describes the game's invented parameters. None is a historical finding. The skeleton assumes perfect price knowledge, so it says what the game's economy allows, not what students do.

## In plain words

**Does monsoon-aware waiting pay?** Mostly not, voyage by voyage. When the next leg faces a headwind, sailing now and accepting a 35% chance of turning back usually finishes sooner, in expectation, than waiting in port for a better wind. Waiting saved time in 8 of 72 headwind cells for the dhow and 11 of 72 for the junk. Every such cell is the last month of a monsoon (February or September), when the wind turns the next month.

Hull damage hardly matters, because its only cost is broken porcelain. The direct costs of either choice are tiny next to the value of a month, so the time difference alone decides whether waiting pays (144 of 144 cells).

Planning around the monsoon still pays a little. The best cycles that never sail into a headwind beat the best cycles that sail regardless by 3–6% in projected profit, because they fit a 12-month calendar. That is a different thing from waiting before a single voyage.

**Does the larger ship pay?** Yes, by a wide margin, under every policy and at every difficulty. The junk's best cycle projects about twice the dhow's profit: +243,000 to +274,000 D at normal difficulty, at Level 0.
- Both ships start limited by cash, and while cash binds the dhow compounds slightly faster (ρ ≈ 0.48 against 0.45 per month).
- Once cash reaches the cost of a full hold, profit is set by hold size. That happens around month 5 for the dhow and month 8 for the junk.
- The junk's capacity-limited profit rate is 2.4 times the dhow's (27,556 against 11,500 D per month).
- The junk's wages do not matter: a wage anywhere from 0 to 140 D per month moves the gap by under 2%.
- The gap reverses only if the hold ratio falls to about 1.1. That means a junk of about 125 t, or a dhow of about 280 t. No other single parameter reversed it within the ranges scanned (table under P1.7).

**What the skeleton does not reproduce.** It does not reproduce §5's result that the dhow wins under *avoid headwind*. It also misses §5's *avoid* medians by 20–83% when it follows one fixed cycle. The trade-off in §5 therefore comes from how the harness picks routes one voyage at a time, not from the economics of the two ships. That supports D06's reading that the strategy, not the ship trade-off the README describes, decides which ship wins.

## Prediction scores (failures first)

Scored at Level 0 and reported at Level 1. No prediction changed score between levels, so none is level-sensitive.

| ID | Level 0 | Level 1 | Blind? | What failed, or what held |
| --- | --- | --- | --- | --- |
| **P1.1** | **contradicted** | **contradicted** | blind | One cell: dhow, easy, *sail always*. Its best cycle is the Calicut–Aden shuttle, where cloves never rank first: pepper leads Calicut→Aden (return 2.85 per D, cloves 1.12) and ivory is the only profitable good Aden→Calicut. Cloves rank first somewhere on the best cycle in the other 23 cells |
| **P1.3** | **contradicted** | **contradicted** | blind | One cell: easy, *sail always*. There the junk's best cycle compounds faster than the dhow's (ρ 0.437 against 0.359 per month). In the other 11 difficulty × policy cells the dhow's ρ ≥ the junk's, and in all 12 the junk's R_cap is larger |
| **P1.5** | **contradicted** | **contradicted** | not blind | Three cells: *avoid headwind* at normal, hard and survival. The skeleton puts the junk ahead (ΔF +261,100 / +236,679 / +225,247 D), where §5's harness had the dhow ahead. Signs match in the other six cells. The mechanism is incomplete: in this skeleton, which ship wins does not depend on the policy |
| **P1.6** | **contradicted** | **contradicted** | not blind | All 12 *avoid* cells miss by more than 25% (table below). The dhow's fixed-cycle path earns 20–44% less than §5's adaptive harness; the junk's earns 65–83% more under *avoid headwind* and 29–41% less under *avoid headwind and transition* |
| **P1.7** | **contradicted** | **contradicted** | blind | The first half held: no junk wage in 0–105 D/month (scan to 140) reverses ΔF under any policy. The second half failed: the clove spread (Malacca price 75–300), the clove lot weight (0.5–2 t) and the capacity ratio (junk 150–600 t) reverse ΔF under no policy. The ratio reverses it just outside a factor of 2, at a junk capacity of 120–131 t (ratio about 1.0–1.1) |
| **P2.1** | **contradicted** | **contradicted** | blind | Waiting is faster in expectation in 8 of 72 headwind cells for the dhow and 11 of 72 for the junk. The median time gain is −1.18 months (range −3.93 to +1.35) |
| **P2.2** | **contradicted** | **contradicted** | blind | E_naive > E_cal in 134 of 144 headwind cells; E_naive < E_cal in 10. All 10 are on the Kilwa–Calicut lane: dhow without a navigator and junk with one, Nov–Feb out and Jul back. A retry there lands in a transition month, which is slower. This is the failure route §2 item 5 named in advance |
| **P2.4** | **contradicted** | **contradicted** | blind | The share of headwind cells where waiting is worth money is 13.2% at hard's starting cash and 13.2% at the switch point (dhow 11.1%, junk 15.3%, both unchanged). The price of a month does rise with cash: λ = 383 → 11,500 D/month for the dhow and 355 → 27,556 for the junk. But time decides the sign at every cash level (P2.3), so the share cannot move |
| P1.2 | supported | supported | blind | Both ships start cash-limited on their best cycle at every difficulty and under every policy: C\* = 18,600 D (dhow) and 46,500 D (junk), both full holds of Malacca cloves. On the stricter reading (every delivery of the cycle), 8 of 24 cells, at easy or normal, already fill the hold on some delivery at month 0 |
| P1.4 | supported | supported | not blind | Projected net profit exceeds 1,200 D in all 24 cells. The lowest is 197,084 D (dhow, survival, *avoid headwind and transition*) |
| P2.3 | supported | supported | blind | sign(ΔV) = sign(Δ) in 144 of 144 headwind cells, and still 144 at both mutiny bounds |
| P2.5 | supported | supported | not blind | *Avoid headwind* projects more than *sail always* in all 8 vessel × difficulty cells. The margin is small: dhow +3.5%, junk +5.6% at normal |

## Q1 detail (Level 0, S-opt, normal difficulty)

| Vessel | Policy | Best cycle (`\|` separates deliveries) | ρ /month | R_cap D/month | C\* D | t\* months | Projected net D |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dhow | sail always | Mal>Cal \| Cal>Mal \| Mal>Qua \| Qua>Mal \| Mal>Qua \| Qua>Mal | 0.466 | 11,177 | 18,600 | 5.40 | 224,964 |
| dhow | avoid headwind | Mal>Cal \| Cal>Mal \| Mal>Qua \| Qua>Mal \| Mal>Qua \| Qua>Mal | 0.480 | 11,500 | 18,600 | 5.25 | 232,748 |
| dhow | avoid headwind and transition | Cal>Mal \| Mal>Qua \| Qua>Mal \| Mal>Cal \| Cal>Ade \| Ade>Cal | 0.446 | 11,007 | 18,600 | 5.65 | 219,107 |
| junk | sail always | Mal>Qua \| Qua>Mal \| Mal>Cal \| Cal>Mal \| Mal>Qua \| Qua>Mal | 0.436 | 26,197 | 46,500 | 7.87 | 467,599 |
| junk | avoid headwind | Cal>Mal \| Mal>Qua \| Qua>Mal \| Mal>Cal \| Cal>Ade \| Ade>Cal | 0.445 | 27,556 | 46,500 | 7.71 | 493,847 |
| junk | avoid headwind and transition | Cal>Mal \| Mal>Qua \| Qua>Mal \| Mal>Cal \| Cal>Ade \| Ade>Cal | 0.445 | 27,545 | 46,500 | 7.72 | 493,548 |

Every best cycle runs through Malacca, buying cloves there. Each *avoid* cycle takes exactly 12 months: it is timed to the monsoon. All other cells, the top 10 cycles per cell, the best cycle in each regime and every delivery's rankings are in `q1-best-cycles.json`.

**Boundary table (P1.7; Level 0, normal, best cycle re-optimised).** For each parameter, the value nearest the current one at which ΔF changes sign, by policy (*sail always* / *avoid headwind* / *avoid headwind and transition*):

| Parameter (current) | Scanned | Reversal |
| --- | --- | --- |
| junk capacity (300 t) | 75–1,200 | 131 / 129 / 120 t |
| dhow capacity (120 t) | 30–480 | 272 / 277 / 300 t |
| junk wages (35) | 0–140 | none |
| dhow wages (15) | 0–60 | none |
| clove lot weight (1 t) | 0.25–4 | none |
| Malacca clove price (150) | 20–750 | none |
| starting cash (1,500) | 100–about 70,000 | none |
| campaign length (24 months) | 6–72 | none |

Level 1 gives reversals within 4 t of these, and none for the rest (`q1-boundary.json`).

**Horizon check (R-H) and P1.6.** S-greedy follows the best cycle from Calicut, through the calendar, with whole lots (Level 0, net D):

| Difficulty | Vessel | Policy | R-H | §5 median | Difference |
| --- | --- | --- | --- | --- | --- |
| normal | dhow | avoid headwind | 122,189 | 216,713 | −44% |
| normal | dhow | avoid headwind and transition | 160,338 | 217,957 | −26% |
| normal | junk | avoid headwind | 297,627 | 175,864 | +69% |
| normal | junk | avoid headwind and transition | 294,860 | 456,317 | −35% |
| hard | dhow | avoid headwind | 107,357 | 189,229 | −43% |
| hard | dhow | avoid headwind and transition | 125,570 | 190,203 | −34% |
| hard | junk | avoid headwind | 257,112 | 154,944 | +66% |
| hard | junk | avoid headwind and transition | 256,118 | 413,966 | −38% |
| survival | dhow | avoid headwind | 102,094 | 175,372 | −42% |
| survival | dhow | avoid headwind and transition | 113,447 | 176,596 | −36% |
| survival | junk | avoid headwind | 243,329 | 147,106 | +65% |
| survival | junk | avoid headwind and transition | 238,799 | 401,618 | −41% |

*Sail always* cells are reported, not scored. On a path where no hazard fires, they are 123–179% above §5's medians, since §5's runs include turn-backs. R-H falls 22–52% below the linear projection under the *avoid* policies, across all levels, fills and difficulties:
- The ship reaches the cycle from Calicut later than January, so the waits fall at different points of the cycle (§8 items 1 and 7).
- It buys whole lots and keeps 60 D back.

Under *sail always*, R-H is 0–18% above the linear projection for the dhow and 14–31% below it for the junk.

## Q2 detail

Full tables: `q2-cells-level0.csv` and `q2-cells-level1.csv` (480 rows each: 10 lanes × 12 months × 2 vessels × navigator). λ: `q2-lambda.json`.

- **Where waiting is faster** (headwind cells, either vessel or navigator choice): Aden→Kilwa Sep, Calicut→Aden Sep, Calicut→Kilwa Aug and Sep, Kilwa→Aden Feb, Malacca→Calicut Sep, Malacca→Quanzhou Feb, Quanzhou→Malacca Sep. Each departs one month before its monsoon ends.
- **Non-headwind cells** (crosswind or transition, not scored): waiting for a tailwind is faster in 33 of 176 cells that are not already tailwind.
- **Size of the direct costs.** At the switch point, λ is 11,500 D/month (dhow) or 27,556 D/month (junk). The expected direct-cost difference between sailing and waiting is at most 299 D in any headwind cell. The time difference is at least 0.25 month in every headwind cell, which is worth at least 2,875 D in the capacity-limited regime. At hard's starting cash (λ ≈ 360 D/month) the costs could in principle tip a cell, but the share of cells favouring waiting is the same there (P2.4).
- **Separate terms.** The income from port stories and the standing a wait earns are reported per cell and not netted in.

## Part C: validation against the engine (`partc.json`)

All five steps passed.

| Step | Result |
| --- | --- |
| 1. Parameter identity | The parameter file matches `PORTS`, `SEA_LANES`, `COMMODITIES`, `VESSELS`, `DIFFICULTIES`, the port stories and `CAMPAIGN_MONTHS` exactly. The protected functions are identical to `111acdc`'s; `finishCampaign` differs only in its display, and its money lines are identical |
| 2. Hazard-free path, exact | 24 paths (2 vessels × 4 difficulties × 3 policies, Level 1 best cycles, engine-exact accounting). The engine's cash, month, port and debt equal the skeleton's after every action, final profits included, and no scripted draw was left unused |
| 3. Forced turn-back | Dhow and junk, Aden→Calicut in January: the months and wages are charged, the cargo stays aboard, and the ship stays in Aden |
| 4. Hull has no cash effect | 8 runs under *sail always* with no porcelain and no repair. Most damage takes the hull to 5% (dhow) and 5–76% (junk), and the cash path is identical to the least-damage path at every step |
| 5. Expected months, stochastic | E_cal is inside the replicate mean's 95% interval in 144 of 144 headwind cells. All cells use the same seeds and many share a lane, so they are not independent; 144/144 should not be read as better than the 95% the test asks for |

Step 5 spread: the turn-back rule gives each cell a spread of whole months. Per-cell standard deviations, minima, maxima and the share of runs that retried are in `partc.json`. A class sees this variance; the skeleton's expectations do not.

## What the results do and do not license

- **Interpretation choices behind the failures.** P1.6 depends on §8 items 1 and 7: the cycle's timing from January, and R-H following one fixed cycle. An adaptive route choice, like §5's harness, may close the gap; that would be a new protocol. P1.5's failure has the same root: the skeleton fixes the route for the whole campaign, and §5's harness re-chooses it each voyage. P1.7's second half depends on reading the ranges as a factor of 2 of the value, as §8 item 13 fixed.
- **What sets profit.** Compounding with no market depth (E1) dominates. Projected profits are 160–450 times the target (D05) whatever the policy, so the 1,200 D target tests nothing in this economy.
- **Not shown.** That students behave this way, or that anything here is historical.

## Files

| File | Contents |
| --- | --- |
| `predictions.json` | Scores per prediction and level, with the failing cells |
| `q1-best-cycles.json` | Best cycle per vessel × difficulty × policy × level × fill: ρ, R_cap, C\*, t\*, F, the top 10 cycles, the best by ρ and by R_cap, each delivery's rankings |
| `q1-horizon-check.json` | R-H against the linear F and §5's medians; engine-exact R-H at Level 1 |
| `q1-boundary.json` | ΔF scans and reversal points per parameter, policy and level |
| `q2-cells-level0.csv`, `q2-cells-level1.csv` | The Q2 table |
| `q2-lambda.json` | λ and the cycle it comes from, per vessel and regime |
| `partc-plans.json` | The scripted action plans and `Math.random` values that Part C replays |
| `partc.json` | Part C results |
