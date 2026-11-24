# Results: adaptive routes against the harness (M3/M6)

| | |
| --- | --- |
| Protocol | [`research/03/pre-registrations/2026-11-23-adaptive-routes.md`](../../pre-registrations/2026-11-23-adaptive-routes.md), registered at `4ec44ff`; interpretations in its §9 entry, committed with the code in `4debd76` before any run |
| Run | 2026-11-23, once, 5 min 38 s (Node 22.21). No bug was found, so nothing was re-run |
| Code | `research/03/models/adaptive-routes.mjs` |
| Engine | `projects/03/index.html`, through `tests/03/engine/load-engine.mjs`; every scored figure comes from the engine |

Every number describes the game's invented parameters. The planner has perfect price knowledge, so this says what the game allows, not what students do.

## In plain words

**Which ship wins under good route choice? The junk, everywhere.**
- With hazards off, the best plan found gives the junk 2.1–2.4 times the dhow's profit under every wind policy at every difficulty.
- With hazards on, re-planning after every event, the junk beat the dhow on all 300 seeds in each of the 9 policy × difficulty cells.

> **Correction, 24 November 2026.** The line above records the original wording. "Re-planning after every event" overstates how often the planner recalculates. `replanRun` (`research/03/models/adaptive-routes.mjs`, about lines 309–334) re-plans after each completed delivery path (one to three legs, including any policy waits and turn-back retries inside it) or after a standalone port wait; it does not re-plan after a storm, a turn-back or an intermediate leg within a delivery. The same wording appears in the registered protocol (`research/03/pre-registrations/2026-11-23-adaptive-routes.md:27`), which is frozen and left as it is. This is a wording correction only: no number in this file changes and nothing was rerun.

**Where does §5's dhow win under *avoid headwind* come from? The harness's one-voyage look-ahead, not hazards.**
- With hazards switched off, the harness still puts the dhow ahead under *avoid headwind*, at every difficulty (217,937 against 176,848 D at normal).
- Its hazards-on medians on new seeds reproduce §5 to within 0.6%. For example, junk *avoid headwind* is 175,879 here against §5's 175,864.
- Under that policy the harness leaves the junk at about a quarter of what a better route earns (ratio 3.7–3.9). The dhow loses far less (ratio 1.2–1.5).
- So D06's "the strategy decides which ship wins" narrows to: a short-sighted strategy decides it.

**Does avoiding headwinds pay under good play? It depends on the ship, and hazards decide it.**
- *With hazards off*, sailing regardless is always better: nothing turns back, so headwinds cost only their slower months. The best *avoid headwind* plan reaches 84–86% of it.
- *With hazards on*, the dhow does better avoiding headwinds (median +12 to +14%). The junk still does better sailing regardless (avoiding costs it 7%). The junk's damage multiplier is half the dhow's, and its long legs at the speed floor lose little to a turn-back.

**One caveat about "best".** The planner keeps only the most cash at each port and month. That works only if more cash never hurts, and the check found it can.
- The greedy fill spends all but 60 D. A delivery with long waits mid-route can then drive cash below −250 D, which ends the campaign at once and sells the cargo at the wrong port.
- So, by the rule fixed in advance, the plans here are **lower bounds** on the best the game allows, not the optimum.
- That leaves the conclusions above intact, since a better optimum could only widen the gaps over the harness.

## Checks (run before scoring)

| Check | Result |
| --- | --- |
| 1. Engine replay | **Pass.** All 36 hazards-off plans (18 cells × S-greedy and S-opt) replay through the engine with cash, month, port, debt and end state equal to the engine-exact model after every action. The engine earns 0–415 D more per cell than planning accounting; that difference is the standing tariff cut |
| 2. Monotonicity | **Fail**, as reported. 371 of 22,446 deliveries (1.7%) give less cash after the delivery for more cash before it, somewhere on the 400-point grid. Cause, traced in one case (dhow, Malacca, April, Malacca→Quanzhou→Malacca→Quanzhou): with 7,519 D the fill buys 50 cloves, and the waits push cash to −261 D, ending the campaign at Malacca (net 7,296); with 6,264 D it buys 41 cloves, cash stays above −250, and the cloves sell at Quanzhou (25,484). The DP is therefore called a lower bound |
| 3. Containment | **Pass.** In all 18 cells the DP's planning value is at least the harness's, computed in the same accounting |
| 4. Planted defect | **Pass.** 1 D added to the first wait of the dhow, normal, *sail always* plan: check 3 still passed, and check 1's exact comparison flagged the mismatch |

## Prediction scores (failures first)

| ID | Score | Blind? | Result |
| --- | --- | --- | --- |
| **A3** | **contradicted** | blind (bounds set with PR #24's gaps in view) | Optimal/harness under *avoid headwind*: junk 3.65 / 3.78 / 3.85 (≥ 1.5 held); dhow 1.24 / **1.38 / 1.46** (≤ 1.25 failed at hard and survival). The harness costs the junk more, as predicted, but it also costs the dhow more than the bound |
| **A4** | **contradicted** | informed | With hazards off, optimal *avoid headwind* / optimal *sail always* = 0.84–0.86 in all 6 cells (bound 0.90). With turn-backs off, sailing into headwinds costs only slower months |
| **B3** | **contradicted** | blind | Re-planning medians, *avoid headwind* / *sail always*: dhow 1.14 / 1.14 / 1.12 (outside ±10%); junk 0.93 / 0.93 / 0.93 (inside) |
| A1 | supported | informed | The junk is ahead in all 9 cells (table below) |
| A2 | supported | blind | With hazards off, the harness has the dhow ahead under *avoid headwind* at normal (217,937 vs 176,848), hard (190,840 vs 156,051) and survival (178,526 vs 148,593) |
| B1 | supported | blind | Re-planning has the higher median in all 18 cells (table below) |
| B2 | supported | informed | The junk beats the dhow on 300 of 300 same-seed pairs in all 9 cells |

**Decision rule** (§5 of the protocol): A1 and A2 are both supported. §5's ship ranking under *avoid headwind* is a property of the harness's one-voyage look-ahead, and D06's mechanism is route choice. Any change to the README, the baseline or teaching material is the owner's decision. Nothing is proposed for the game.

## Hazards off (engine-replayed net profit, D)

| Vessel | Difficulty | Policy | Best plan found (S-greedy) | Harness | Ratio | S-opt plan (exploratory) |
| --- | --- | --- | --- | --- | --- | --- |
| dhow | normal | sail always | 314,061 | 111,824 | 2.81 | 353,494 |
| dhow | normal | avoid headwind | 270,012 | 217,937 | 1.24 | 304,957 |
| dhow | normal | avoid headwind and transition | 256,489 | 217,937 | 1.18 | 267,184 |
| dhow | hard | sail always | 308,879 | 93,213 | 3.31 | 343,386 |
| dhow | hard | avoid headwind | 263,623 | 190,840 | 1.38 | 300,899 |
| dhow | hard | avoid headwind and transition | 227,379 | 188,827 | 1.20 | 238,074 |
| dhow | survival | sail always | 306,295 | 90,509 | 3.38 | 339,618 |
| dhow | survival | avoid headwind | 260,614 | 178,526 | 1.46 | 297,372 |
| dhow | survival | avoid headwind and transition | 215,370 | 176,818 | 1.22 | 226,048 |
| junk | normal | sail always | 757,031 | 224,423 | 3.37 | 810,637 |
| junk | normal | avoid headwind | 645,687 | 176,848 | 3.65 | 682,752 |
| junk | normal | avoid headwind and transition | 551,365 | 454,985 | 1.21 | 578,080 |
| junk | hard | sail always | 700,756 | 203,626 | 3.44 | 758,142 |
| junk | hard | avoid headwind | 589,404 | 156,051 | 3.78 | 630,257 |
| junk | hard | avoid headwind and transition | 510,425 | 414,045 | 1.23 | 537,140 |
| junk | survival | sail always | 683,589 | 196,048 | 3.49 | 730,010 |
| junk | survival | avoid headwind | 572,295 | 148,593 | 3.85 | 602,179 |
| junk | survival | avoid headwind and transition | 498,539 | 402,159 | 1.24 | 525,211 |

Notes on the table:
- **Waiting under *sail always*.** The DP may wait under *sail always*; the harness never does. Forbidding waits changes the DP's *sail always* figure by under 0.2% for the dhow and about 4% for the junk (`greedyNoWait` in `hazards-off.json`).
- **S-opt** finds 4–13% more than S-greedy. It is reported, not scored.
- **The harness's junk under *avoid headwind*.** This is its weakest cell, about 177,000 D at normal, against 455,000 under the stricter *avoid headwind and transition*. A stricter wind rule helps the harness's junk because it removes some of its myopic choices.

## Hazards on (N = 300, seeds 200001–200300; net profit, D)

| Vessel | Difficulty | Policy | Re-planning median (p10–p90) | Harness median (p10–p90) | §5 harness median |
| --- | --- | --- | --- | --- | --- |
| dhow | normal | sail always | 235,425 (158,343–313,111) | 88,049 (68,282–111,259) | 88,305 |
| dhow | normal | avoid headwind | 268,744 (267,573–269,562) | 216,755 (215,919–217,348) | 216,713 |
| dhow | normal | avoid headwind and transition | 255,864 (254,986–256,604) | 217,937 (217,274–218,383) | 217,957 |
| dhow | hard | sail always | 230,243 (158,516–307,929) | 79,926 (58,443–93,043) | 79,478 |
| dhow | hard | avoid headwind | 262,436 (261,515–263,261) | 189,268 (187,179–190,208) | 189,229 |
| dhow | hard | avoid headwind and transition | 226,961 (225,634–228,806) | 190,174 (188,273–190,803) | 190,203 |
| dhow | survival | sail always | 228,073 (151,975–304,622) | 76,736 (55,729–90,174) | 76,409 |
| dhow | survival | avoid headwind | 255,857 (252,361–258,274) | 175,405 (173,337–177,108) | 175,372 |
| dhow | survival | avoid headwind and transition | 214,130 (212,536–215,117) | 176,601 (175,352–178,081) | 176,596 |
| junk | normal | sail always | 690,117 (583,835–756,806) | 168,018 (148,274–223,365) | 167,826 |
| junk | normal | avoid headwind | 644,684 (643,277–645,437) | 175,879 (174,825–176,501) | 175,864 |
| junk | normal | avoid headwind and transition | 550,795 (549,566–551,633) | 456,321 (454,431–456,990) | 456,317 |
| junk | hard | sail always | 632,519 (505,477–700,311) | 147,151 (127,492–202,518) | 146,944 |
| junk | hard | avoid headwind | 587,040 (585,102–588,705) | 155,027 (153,894–155,576) | 154,944 |
| junk | hard | avoid headwind and transition | 509,748 (508,443–510,816) | 413,927 (413,173–414,491) | 413,966 |
| junk | survival | sail always | 613,386 (487,484–681,248) | 139,426 (119,456–194,498) | 139,119 |
| junk | survival | avoid headwind | 568,519 (560,640–570,804) | 147,205 (145,963–148,123) | 147,106 |
| junk | survival | avoid headwind and transition | 497,215 (495,257–498,060) | 401,687 (400,019–402,229) | 401,618 |

**Spread.** Under *sail always*, re-planning has a wide spread (dhow p10–p90 about 155,000 D) because turn-backs land at random. The *avoid* policies are almost deterministic, as in §5.

**Seeds.** Same seed is not common random numbers: the ships make different voyages, so they meet different hazards.

## What this does and does not license

- **Licensed:** in this game's economy, the ship ranking under good route choice is the junk's, under every wind policy. §5's reversal under *avoid headwind* is produced by the test harness choosing one voyage at a time. Hazards decide whether avoiding headwinds pays, and they decide it differently for the two ships.
- **Not licensed:**
  - That the plans are optimal (check 2).
  - That students play like either planner.
  - Anything historical.
- **For the owner:** D06's wording in the original repository's baseline could name the mechanism (route choice) instead of "the strategy". Whether to change it is the owner's decision.

## Files

| File | Contents |
| --- | --- |
| `hazards-off.json` | Per cell: DP plans (decisions and engine-exact action logs), planning, engine-exact and engine nets, the harness (planning and engine), checks 1–4 |
| `hazards-on.json` | Per cell: the 300 net profits for re-planning and for the harness, in seed order |
| `predictions.json` | Check outcomes, scores with failing cells, hazards-on quantiles |
