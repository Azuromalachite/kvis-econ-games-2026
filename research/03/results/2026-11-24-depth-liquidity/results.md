# Results: when does a larger hold pay? Market depth and liquidity (M3)

| | |
| --- | --- |
| Protocol | [`research/03/pre-registrations/2026-11-23-depth-liquidity.md`](../../pre-registrations/2026-11-23-depth-liquidity.md), registered by PR #28 (`1f08700`). Deviations and interpretations are in its §9: the first entry was committed with the code in `c5b47f3` before any run; the fallback-1 entry was committed in `977310f` before any D-arm result was read |
| Run | 2026-11-24, from `main` at `d83fd9f`. Checks run 3 times: run 1 crashed with no output (bug 1), run 2 failed C6 (bug 2, a wrong hand value), run 3 passed (33 min). D arm under fallback 1: 11 min. C9: 3 min. L arm: 2 h 46 min. H arm: 24 s. B1: 1 s. Each part ran once after its checks passed. After an independent review, four checks and one sensitivity were added and run (settlement at *k* ≥ 1, C6 on both arms, C8 through a real phase, C2 and C10 plants, unblocked *r* = 1 cells); no registered score changed |
| Code | `research/03/models/depth-liquidity.mjs`, `research/03/models/load-engine-research.mjs`. Checks at `ebce792`; D arm at `db4fa3d`; L arm, H arm and B1 at `602e7ef` (that commit only moves where a D-arm output file is written and read); C2 and C10 plants at `c90e138`; the review additions and the final scoring at `a851194`; the confirmation-review items (scoring from committed CSVs, the due-month test, outputs held until C8 passes) in the commit after `92b6290` |
| Engine | `projects/03/index.html`, page SHA-256 `5c722df9…`. Its engine script is SHA-256 `6fba1ee750cc…` (62,591 characters), byte-identical to the script at the protocol's `d2d66a3`, and pinned by the loader. The page was hashed before and after every run and never changed (C8). Every scored figure comes from the engine |
| Runtime | Node v24.22.2, single-threaded. Keyed draws: *u* = the first output of mulberry32(FNV-1a-32(`seed\|role\|month\|key`)); seeds 300001–300300 |
| Status | **Exploratory, provenance-incomplete.** An independent reviewer reran the D arm, H arm, B1, C9, the scoring, the checks phase, the plants and the review additions in full, and the L arm on a sample (550 + 100 campaigns), and reproduced the outputs. Those reruns are not retained in this repository, so nothing here is called reproduced or verified. Missing or defective fields: (1) the large traces and run logs (`external-manifest.json`, with SHA-256 and a named archive root) are not archived at an immutable external reference; (2) the reviewer's reruns are not retained; (3) the fallback-1 disclosure was misstated when first logged: the aborted run's log holds 526 scored values, and the slow solve was cell 264 (corrected in §9, 2026-11-24) |

Every depth capacity, recovery rate, impact shape and settlement delay is a hypothetical judgement range. The planners have perfect knowledge of prices, depth state and receivables (the H arm excepted). These results say what this game's economy would do with mechanisms it does not have. Nothing here is historical, and nothing proposes a game change.

## In plain words

**When does a larger hold pay?**
- **Without market depth, always.** As before, the junk earns 2.2–2.4 times the dhow's profit.
- **With a cap on what the five ports absorb in total, it depends on whether the ship may wait to sell.**
  - *Selling on arrival only.* The dhow is ahead whenever the cap is 120 t or less, and the junk from 135 t, at both difficulties (pooled hard cap, full monthly recovery). The cap acts like a hold size, as the skeleton's 120–131 t boundary predicted.
  - *May wait up to two months at the destination.* With full monthly recovery, the junk is ahead at **every** pooled cap from 60 t up: by 1.14–1.68 times at 60–180 t, and by 1.76–2.21 times above that. Waiting lets the market recover, and the larger hold sells its overhang over two or three months. With slow recovery this can fail: at hard difficulty, a pooled cap of 60 t and *r* = 0.1, the dhow is ahead even with waiting allowed (132,076 vs 129,881 D).
  - Waiting stays worth it even when the market recovers only 10% a month. That is not what was predicted (D6).
- **With a cap per good** (hard, full recovery, selling on arrival), the two ships are within about 4% of each other up to 25 lots per good. As registered (10-lot blocks under fallback 1), the junk leads at 10–15 lots, the dhow at 20–25 by 0.1–1.1%, and the junk from 30; above that the junk's lead grows to 1.2 times at 60 lots.
  - **This ranking is not robust to block granularity.** The depth-aware planner trades in 10-lot blocks under fallback 1, so 10 and 15 lots behave the same, as do 20 and 25; at 10–15 lots the dhow cannot fit a 100 t teak block. Rerun unblocked (exploratory), the dhow is ahead at 15 lots in both difficulties (70,522 vs 69,464 D normal; 65,118 vs 64,255 hard), the flip falls at 15 (normal) and 20 (hard), and D2 would be supported. The registered score stays contradicted.
- **One limited port changes little.** Capping only Quanzhou leaves the junk ahead by at least 1.82 times in every cell: the ships sell elsewhere.

**Does depth or liquidity make the dhow preferable anywhere?**
- **Depth: yes, but narrowly.** The dhow is ahead (or tied) in 60 of 1,024 depth cells (E-net, best of three strategies), all with every port capped:
  - pooled hard caps of 60–120 t (to 135 t at some recovery rates) with selling on arrival only;
  - pooled soft caps of 60 t;
  - per-good caps of 10–25 lots: 19 of the 60 cells, all from blocked depth-aware plans in the range where block granularity binds (above).
  - With selling over time allowed, that falls to 10 cells: per-good caps of 10–25 lots, and one pooled 60 t cell at 10% recovery (hard).
- **Liquidity: no.** Delayed payment and cash reserves never put the dhow ahead on the planner's path. The junk's median exceeds the dhow's in every one of the 72 re-planning cells.
  - A one-month payment delay costs the junk 16.5% and the dhow 5.6% (*avoid headwind*, normal, R-exp). The larger hold is hit harder but still wins by a wide margin. These figures are quoted only because the settlement check added after the review (*k* ∈ {1, 2}, model vs engine after every action) passes and fails on its plant.
  - The myopic harness already has the dhow ahead under *avoid headwind*, which is known from adaptive routes. A one-month delay widens that gap.

**Is ruin a real risk?** Rarely.
- With no payment delay, there was no ruin in any of the 8 re-planning cells × 300 seeds.
- With a one-month delay and the greedy 60 D reserve, the junk under *sail always* at normal ruined in 11 of 300 campaigns, all at months 16–18. The expected-outlay reserve (R-exp) removed every ruin, in all 24 cells.
- The harness never ruined. A reserve costs at most 0.18% of median profit.
- The two "plausible ruins" in the published hazards-on runs (dhow, normal, *sail always*, 48,415 and 48,585 D) are not ruins. C1b reproduced every published run and found no ruin among the 10,800.

**A strict month-23 deadline.** Re-optimised for it, the dhow keeps 90.8% of its profit and the junk 91.3%. The junk's strict plan is exactly the known feasible plan the protocol used as its floor (589,587 D). Read strictly without re-optimising, the published plans would lose 36% (dhow) and 16% (junk).

## Prediction scores (failures first)

Scored on engine-replayed nets. D1–D5 and D7 use each ship's best of {depth-aware, depth-naive, copy-other}; D6 uses the junk's depth-aware plan.

| ID | Score | Blind? | Result |
| --- | --- | --- | --- |
| **D2** | **contradicted** | informed | S2, per good, hard, *r* = 1, *m* ≤ 0. The junk is ahead at *Q* = 15 in both difficulties: 55,895 vs 53,716 D (normal) and 52,552 vs 52,052 (hard). The dhow is ahead at 20 and 25, by 95 D (normal) and 981 D (hard). The junk is ahead from 30. The flip point is 25 in both, inside {15–30}, but the registered contradiction ("junk ahead at *Q* = 15") holds. Under fallback 1 the depth-aware side works in 10-lot blocks, so *Q* = 10 ≡ 15 and 20 ≡ 25 there. **Not robust to block granularity:** at *Q* = 10 and 15 both ships' figures come from the blocked depth-aware plan (the dhow is 53,716 at both, because a 100 t teak block cannot fit). An exploratory unblocked rerun of the S2 *r* = 1 *m* ≤ 0 cells puts the dhow ahead at 15 in both difficulties (70,522 vs 69,464; 65,118 vs 64,255), with the flip at 15 (normal) and 20 (hard): D2 would be supported (`depth-unblocked-r1.csv`, `predictions.json` → `sensitivityUnblocked`) |
| **D4** | **contradicted** | partly informed | S2, pooled, hard, *Q_t* = 150, *m* ≤ 0, the junk's net. *r* 1 → 0.25 lowers it by **11.9%** (normal) and **11.0%** (hard), against a bound of ≤ 5%. *r* 1 → 0.1 lowers it by 20.5% and 18.9% (> 5%, held). The scored figure mixes planners: depth-naive at *r* = 1, depth-aware at 0.25. The depth-aware plan's own drop is **7.1%** (normal) and **7.0%** (hard) at 0.25, and 16.1% and 17.9% at 0.1; the contradiction holds either way |
| **D6** | **contradicted** | blind (margin arithmetic rests on the seen R_cap) | The junk's depth-aware plan, S2, pooled, hard. At *r* = 1 it uses a counted *m* ≥ 1 in **6 of 6** cells with *Q_t* ≤ 150 in both difficulties (bar ≥ 4: held). At *r* = 0.1 it still uses one in **6 of 6** (bar: none): counted options per cell 3/3/1/2/1/2 (normal) and 2/1/1/2/2/2 (hard) |
| **B1** | **contradicted** (above the band for the dhow; at the floor for the junk) | informed | No depth, *k* = 0, hazards off, *avoid headwind*, normal. DP-S's S-net / DP-E's E-net: dhow 245,066 / 270,012 = **0.9076** (band 0.80–0.90: above); junk 589,587 / 645,687 = **0.9131** (band 0.92–0.97; in [0.913, 0.92), which the protocol counts as contradicted). Neither is below its floor, so there is no planner defect. DP-E reproduces the published 270,012 and 645,687 D exactly |
| **L5** | untestable | blind | *k* = 2, G: ruins (junk, dhow) = (0, 0), (0, 0), (1, 0), (0, 0) across the four policy × difficulty cells; every cell has fewer than 5 ruins |
| **H1** | partly untestable: (a) untestable, (b) supported, (c) supported | (a) informed; (b), (c) blind | (a) No ruins under either the harness (60 D) or re-planning (G) at *k* = 0 in any cell: untestable everywhere. (b) R-exp: 0 ruins in all 16 harness cells. (c) Paired median (60 D − R-exp) is 0 in 6 cells and negative in 2 (dhow, hard: −305 and −1,518 D); the largest share is 0% (bound ≤ 2%) |
| D1 | supported | informed | S2, pooled, hard, *r* = 1, *m* ≤ 0, E-net: flip point **120 t** at normal and at hard (dhow 292,030 vs junk 263,663 at 120; junk 293,822 vs 292,030 at 135, normal) |
| D3 | supported | partly informed | S1 (Quanzhou only), hard, *r* = 1, *m* ≤ 0, both cap types and difficulties: junk/dhow ≥ **1.82** in all 32 cells |
| D5 | supported | blind | Pooled, *r* = 1, *m* ≤ 0. S2: soft flips at 60 t, hard at 120 t, in both difficulties. S1: neither flips (untestable there) |
| D7 | supported | blind | S2, pooled, hard, *r* = 1: flip at 120 t with *m* ≤ 0 and no flip with *m* ≤ 2, in both difficulties (registered as "lower") |
| L1 | supported | informed | *k* = 0, G: 0 ruins in all 8 L cells |
| L2 | supported | blind | R-exp: 0 ruins in all 24 L cells |
| L3 | supported | blind | *k* = 0, *avoid headwind*, normal: paired median (G − R-exp) = 0 D for the dhow (0% of 268,718) and 1,151 D for the junk (0.18% of 644,739) |
| L4 | supported | blind (bands from a reviewer's arithmetic) | R-exp, *avoid headwind*, normal, *k* 0 → 1: the junk's median falls 16.5% (643,331 → 536,890), the dhow's 5.6% (268,718 → 253,636); the junk's fall is larger. Quoted after the settlement check (*k* ∈ {1, 2}) passed |

**Decision rule** (protocol §5):
- **D1 supported:** in the engine, a pooled cap is an effective hold size.
- **D2 contradicted on the low side, as registered:** at 10–15 lots per good the junk's diversification into lower-margin goods is worth slightly more than its slower months. This reading depends on 10-lot blocks: unblocked, the dhow is ahead at 15 lots and the registered rule would score D2 supported. The margins are within about 4% throughout 10–25 lots.
- **D3:** one limited port changes little, because ships reroute.
- **D4 contradicted:** revisit timing is tighter than the cycles suggest. At *r* = 0.25 the junk already loses 11–12% (scored figure) or 7% (its depth-aware plan alone).
- **D5 supported:** the soft floor's near-break-even pricing hurts less than a hard stop.
- **D6 contradicted, D7 supported:** the inventory question has an answer in time. The larger hold pays by waiting to sell, so D7's "supported" reading applies. But waiting pays even at 10% recovery, so D6's second half (the time cost of waiting dominates when recovery is slow) is wrong.
- **L1, L2, L3 supported; L4 supported:** delay hits the larger hold harder in proportion.
- **L5:** untestable.
- **H1:** (b) and (c) hold. Whether the reserve matters "mainly for myopic play" cannot be said, because neither planner ruined at *k* = 0.
- **B1 contradicted:** above the band for the dhow (the month-24 effect is smaller still), and at the floor for the junk (strict re-optimisation gains less than expected: DP-S found exactly the known feasible plan).

Any teaching use is the owner's decision.

## Market depth (D arm): selected cells

E-net, D, each ship's scored figure (best of three engine-replayed strategies). S2 = all five ports capped. Full table: `depth.csv` (1,024 rows, with S- and S24-nets, each strategy's nets, cargo outcomes, inventory-months and the *m* options used).

**Pooled hard cap, *r* = 1** (normal; hard is the same pattern, flip 120 t with *m* ≤ 0, no flip with *m* ≤ 2):

| *Q_t* (t) | dhow, *m* ≤ 0 | junk, *m* ≤ 0 | junk/dhow | dhow, *m* ≤ 2 | junk, *m* ≤ 2 | junk/dhow | junk inventory-months, *m* ≤ 2 (D·months) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 60 | 150,050 | 136,490 | 0.91 | 231,338 | 263,711 | 1.14 | 63,750 |
| 90 | 222,940 | 202,765 | 0.91 | 245,859 | 381,689 | 1.55 | 88,150 |
| 105 | 246,280 | 228,924 | 0.93 | 256,220 | 416,789 | 1.63 | 96,050 |
| 120 | 292,030 | 263,663 | 0.90 | 292,030 | 426,885 | 1.46 | 141,830 |
| 135 | 292,030 | 293,822 | 1.01 | 292,030 | 444,375 | 1.52 | 144,660 |
| 150 | 292,030 | 327,835 | 1.12 | 292,030 | 477,983 | 1.64 | 155,220 |
| 180 | 292,030 | 395,489 | 1.35 | 292,030 | 480,463 | 1.65 | 152,760 |
| 240 | 292,030 | 518,076 | 1.77 | 292,030 | 518,076 | 1.77 | 122,580 |
| 300 | 292,030 | 645,687 | 2.21 | 292,030 | 645,687 | 2.21 | 7,440 |

**Per-good hard cap, *r* = 1, *m* ≤ 0** (normal / hard):

| *Q* (lots) | dhow | junk | junk/dhow |
| --- | --- | --- | --- |
| 10, 15 | 53,716 / 52,052 | 55,895 / 52,552 | 1.04 / 1.01 |
| 20, 25 | 92,870 / 91,823 | 92,775 / 90,842 | 1.00 / 0.99 |
| 30 | 120,455 / 115,813 | 129,280 / 121,982 | 1.07 / 1.05 |
| 40 | 143,970 / 139,333 | 159,190 / 151,892 | 1.11 / 1.09 |
| 60 | 181,430 / 178,712 | 220,760 / 213,462 | 1.22 / 1.19 |

**Notes on the D arm.**
- **Which strategy scores.**
  - The dhow's figure comes from its depth-aware plan in 970 cells, the depth-naive plan in 50 and copy-other in 4.
  - The junk's comes from depth-aware in 785, naive in 231 and copy-other in 8.
  - At large pooled caps the junk's best plan is the published one (645,687 D at 300 t). The depth-aware fill buys in the §4.3 sale order (price per tonne, not margin), in 10-lot blocks, and reaches only 549,265 D there. Its plans are lower bounds (C9).
- **Inventory-months** are zero for every *m* ≤ 0 depth-aware plan: that fill buys only lots the market is projected to absorb on arrival. With *m* ≤ 2 they reach 64,000–155,000 D·months for the junk at 60–180 t. The depth-naive strategy writes off up to 41 junk lots per campaign at liquidation (60 t pooled hard).
- **Recovery** (S2, pooled, hard, 150 t, *m* ≤ 0, junk): 327,835 (*r* = 1), 311,580 (0.5), 288,730 (0.25), 260,736 (0.1) D at normal.
- **Strict and inclusive nets.** The pooled hard *r* = 1 *m* ≤ 0 flip point is 120 t under E, S and S24 alike. The dhow is ahead in 50 cells by S-net and 60 by S24-net. S24 figures are exploratory.

## Liquidity (L arm, re-planning, hazards on, *Q* = ∞) and the harness (H arm)

Medians of E-net, D, N = 300 keyed seeds per cell; full quantiles, ruin counts and ruin months in `liquidity.csv` and `harness.csv`, per-seed nets in `liquidity-perseed.json` and `harness-perseed.json`. Attempted 300, completed 300, excluded 0 in every cell of both arms.

| Vessel | Difficulty | Policy | G, *k* 0 | R-exp, *k* 0 | R-exp, *k* 1 | R-exp, *k* 2 | Ruins (any reserve, any *k*) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dhow | normal | sail always | 283,479 | 283,414 | 274,060 | 273,236 | 0 |
| dhow | normal | avoid headwind | 268,718 | 268,718 | 253,636 | 241,208 | 0 |
| dhow | hard | sail always | 278,665 | 278,858 | 245,011 | 234,633 | 0 |
| dhow | hard | avoid headwind | 262,467 | 263,566 | 231,069 | 211,488 | 0 |
| junk | normal | sail always | 690,959 | 689,720 | 500,474 | 471,574 | 11 (G, *k* 1; months 16–18) |
| junk | normal | avoid headwind | 644,739 | 643,331 | 536,890 | 503,677 | 0 |
| junk | hard | sail always | 633,848 | 631,671 | 454,493 | 395,665 | 1 (G, *k* 2; month 18) |
| junk | hard | avoid headwind | 587,015 | 584,749 | 502,755 | 428,389 | 0 |

- **Ruins.** The harness had no ruin in any of its 48 cells.
- **Reserve and the myopic harness.** In some harness cells at *k* = 1, R-exp or R-worst has a *higher* median than the 60 D reserve; for example junk, normal, *sail always*: 184,838 vs 129,009 D. A different purchase changes the harness's later lane choices, because it ranks lanes with the cash it has. H1 does not score these cells. They are a property of the myopic harness, not of the reserve.

## Checks

| Check | Result | Planted defect |
| --- | --- | --- |
| Role table | **Pass.** The ten `Math.random()` call sites generated from the loaded engine script (stack lines, `lineOffset` 1588) equal the frozen §4.6 table | — |
| C1 | **Pass.** All 18 published S-greedy plans regenerated (decision strings equal), executed at identity, matched the published logs action for action, and replayed through the engine with every state equal; engine nets equal the published ones (e.g. 645,687 and 270,012 D). The published logs themselves also replay exactly through the wrappers | Late crediting at *k* = 0: **caught** in all 18 cells |
| C1b | **Pass.** All 10,800 published hazards-on nets (18 cells × 300 × re-planning and harness) reproduced exactly by this study's copies on the seed stream; the published `harnessPlay` through the wrappers also matched all 5,400. **End causes:** no ruin in any of the 10,800. Every campaign ended at month 24–26 (dhow, normal, *sail always*, re-planning: 215 at 26, 85 at 24) | −1 D on the first sale: **caught** (300 of 300 seeds differ) |
| C2 | **Pass.** 12,289 D-arm engine replays (every scored plan, under every rule, for every strategy): cash, month, port, debt, cargo, *A* and receivables equal after every action; nets equal; no scripted draw left over. B1's 12 replays also match | Recovery applied once per action in the wrapper only: **caught** in 72 of 72 replays (every S2 pooled hard *r* = 0.5 cell, both ships, DP-E plan; run after the arms, `checks-plants.json`). The defect changes nothing unless *A* > 0 when a multi-month action starts, so each replay is flagged at the first such action: in 3 replays that is the plan's first multi-month sail, in the other 69 a later one |
| C3 | **Pass.** The identities hold in all 12,289 D-arm runs, 21,600 L runs and 14,400 H runs. Forced turn-back (Aden → Calicut, January, *u* = 0): port Aden, loaded 10, delivered 0, aboard 10 | Turn-back counted as delivered: **caught** (delivered 10) |
| C4 | **Pass.** (i)–(v) on every hazards-on action: L arm 396,222 actions and 836,106 draws, H arm 194,809 actions and 497,076 draws, 0 failures. The forced turn-back reports line 2220 | Vessel in the key: **caught** by (iii) and (ii). Turn-back and headwind-damage roles swapped: **caught** by (iv). Keyed source not reinstalled after `harnessReset`: **caught** by (i) and (v), call count 0 |
| C5 | **Pass.** Hand values: per good *x* = 9, 10, 11 (hard 620/refused/refused; soft 620/589/558); soft floor 155; pooled three-good sale from *A* = 7 (hard: cloves and pepper sell, ivory refused, 930 D; soft 1,663 D); recovery *r* = 0 → 8, *r* = 1 → 0; *r* = 0.5 over a two-month action → 2, in the model and in the engine wrapper | `x < Q`: **caught**, only by the multi-weight case. Per-lot order: **caught** |
| C6 | **Pass on run 3** (failed on run 2; see bug 2). Hand values 216.75, 219.88, 460, 40.4 and 41.7 D. Cash after every sail and wait, after credit (the run's pre-results reading, confirmed by the owner's ruling of 2026-11-24, §9), never below 0 under R-exp, hazards off, in all 24 L cells (lowest 18 D) and, added after the review, all 24 H cells (lowest 25 D) (`checks-c6-arms.json`). **Disclosed, not a gate:** after charges and *before* credit, cash goes negative in 2 L cells (junk, hard, *sail always*: −20 at *k* = 1, −15 at *k* = 2; normal *k* = 1 reaches 0) and 5 H cells (junk, normal, *k* = 1: −43 under both policies; junk, hard: −6 at *k* = 1 under both policies, −42 at *k* = 2, *sail always*). The H-arm case is the unfunded departure found in #41 (`research/03/results/2026-11-24-unfunded-departures/`) | Wait months omitted: **caught**. Earlier receivable ignored: **caught** |
| C7 | **Pass.** Arrival at 25: E counts the cargo, S and S24 count zero. Arrival at exactly 24: E and S24 count it at the month-23 price, S zero. Wait into 24 with 5 held lots (per good *Q* = 5, *r* = 0.5): 3 absorbed at the month-23 price, 2 written off, as worked by hand. All against `state.startEquity` | S counts goods in transit: **caught**. S24 drops the arrival at 24: **caught** |
| C8 | **Pass.** The real page's SHA-256 was the same before and after every run phase. Added after the review: every phase except `checks` now asserts this itself, holds its outputs until the assertion passes, and on a failure writes nothing and exits non-zero | Original plant: modifying a temporary copy is **caught** by hashing the real path, and **missed** by the copy-hash variant. Added after the review, through a real phase: the `b1` phase run on a temporary copy of the page modified during the run **fails** (exit 3) and writes no output; the variant that hashes a copy taken at the start **misses** it (`checks-c8-phase.json`). `node --test "tests/03/engine/*.test.mjs"` (66/66) and `node tests/03/engine/planted-defects.mjs` (47/47) pass after all runs |
| C9 (reported) | 690 of 3,001 (dhow) and 991–994 of 2,912 (junk) deliveries evaluated by the depth-aware DP give less cash after the delivery for more cash before it, on the 400-point grid (S2, pooled, hard, 150 t, *r* = 1, *m* ≤ 2). Traced example (Calicut → Kilwa, month 0): 1,253 D more buys one 10-lot clove block in place of pepper and textiles, and ends about 800 D lower. Cause: the registered fill orders goods by price per tonne, not margin, and fallback 1 trades in blocks. The depth-aware plans are therefore lower bounds | — |
| C10 (not a gate) | **Holds in every *r* = 1 cell** (*m* ≤ 2 value ≥ *m* ≤ 0 value under all three rules), so no brute force was needed. At *r* < 1, 21 (cell, ship, rule) violations, largest 7,366 D (normal, per good, soft, 30, *r* = 0.1, junk, E); listed in `darm-checks.json` | Options restricted to *m* ∈ {1, 2}: **caught**: 589 (cell, ship, rule) violations across the 128 *r* = 1 cells (run after the arms, `checks-plants.json`) |
| Settlement at *k* ≥ 1 (added after the review) | **Pass.** Hazards off, all 8 L policy × difficulty cells × *k* ∈ {1, 2} × {G, R-exp}: the L-arm planner's plan executed in the model and replayed through the engine; cash, month, port, debt, cargo, *A* and receivables equal after every action, nets equal (`checks-settlement.json`). Before this check, nothing failed when receivables were credited a month late at *k* ≥ 1 | Wrapper credits a receivable one month late (`r.due <` for `<=`): **caught** in 32 of 32 cells |
| Due month (added after the confirmation review) | **Pass.** A sale at month 1 with *k* = 1 is credited at month 2, and with *k* = 2 at month 3, in the model and in the engine wrapper, each against the absolute month; the engine's cash change equals the revenue less the wait's charges (`checks-due-month.json`) | Due month *k* + 1 on **both** sides: **caught** (credited at 3 and 4; the model-vs-engine checks agree with each other and cannot see it) |
| Solve-time limits | First 64 solves: max 0.60 s, mean 0.21 s. A later solve exceeded 60 s, so **fallback 1** was applied (§9). Under fallback 1: first 64 mean 0.17 s (fallback 2 not applied); whole D arm mean 0.32 s, max 12.4 s | — |

**Bugs found by the checks, fixed, and rerun** (both outputs kept):
1. **Bug 1, run 1.** A crash in C1: `Market.x` dereferenced a null configuration on an uncapped market. No check output was produced. Fixed in `ac9081d`.
2. **Bug 2, run 2.** C6's first hand case used Aden → Calicut in June. That is a one-month tailwind leg, so the hand value 251.8 was wrong, and the code's 16.8 (= 15 + 1.8) was right for that leg. Every other check and plant had passed. The case was changed to Calicut → Aden (headwind June–September, hand value 216.75), and the whole checks phase was rerun. Run 2's output is `checks-pre-run2.json`.

## Deviations (protocol §9)

1. **Engine pin moved; the engine did not.** The page hash changed from `1c901dd1…` to `5c722df9…` (#22, #30). The engine script is byte-identical (`6fba1ee750cc…`). The loader pins the engine script; C8 still hashes the whole page before and after every run. `lineOffset` 1588 keeps stack lines equal to the `d2d66a3` line numbers the protocol cites. The Atlas `finishCampaign` wrapper is in a display-only adapter script that the loader does not evaluate, so the research wrapper wraps the engine's own `finishCampaign`.
2. **Output directory** `2026-11-24-depth-liquidity/`, not `…-mn-depth-liquidity/`.
3. **Reuse of adaptive-routes code**: imported from a generated copy of its definitions, because importing the module runs its study.
4. **Fallback 1 applied.**
   - The dhow solve of cell 264 (`normal|S2|good|hard|10|0.1|m2`) exceeded 60 s (≥ 98 s); the entry first logged it as cell 263, which had finished. The unblocked D arm was stopped. It wrote no JSON or CSV output, but its log (`logs/darm.log`, in the external archive) holds both ships' scored E-nets for the 263 cells it finished: 526 values, including every normal S1 cell that feeds D3. The first entry said nothing was written; that was false.
   - The entry also said only two dhow values were seen (45,908 and 55,279 D, cells 261–262). The log lines also carry the junk's values for those cells (46,223 and 56,130 D); the author's terminal view was truncated before them. Corrected in a dated §9 entry; none of these values enters any result.
   - The whole D arm was rerun in 10-lot blocks. Fallback 2 was checked afterwards and not needed.
5. **Interpretations 1–23** in §9, fixed before any run. Those that matter most here:
   - C1 compares sells within an arrival as a set.
   - C2 covers hazards-off plans only.
   - The depth-aware DP plans in engine-exact accounting.
   - Ruin liquidation counts under S-net.
   - The schedule projection is read literally.
   - B1 uses the published greedy-fill planner.
   - The reserve-term details.
6. **After results were read** (all recorded in dated §9 entries of 2026-11-24, written after the results):
   - `darm-rows.json` moved out of the repository. The D arm ended at 17:10 UTC; at 17:14 UTC a one-off command re-serialised the same rows as compact JSON (1,513,395 bytes; the in-repository file had been 1.8 MB pretty-printed) into the external archive, with its checksum. `depth.csv` holds the same rows.
   - C2's and C10's planted defects were added (`c90e138`) and run after the arms.
   - The fallback-1 disclosure was corrected (point 4).
   - The owner ruled on C6: observed after every sail and wait, after credit, on all arms.
   - Added after an independent review (`a851194`, committed before they ran): the settlement check at *k* ≥ 1, C6 on the H arm, C8 through a real phase, the unblocked *r* = 1 sensitivity, D4 by planner, and compact per-seed CSV in place of pretty-printed JSON.
   - No registered score changed.

## What was not run

- **The exploratory parts:** the interaction arm (S2, pooled, hard, 150 t, *r* = 0.25, *m* ≤ 2 crossed with *k* × reserve), *sail always* depth runs, and survival difficulty.
- **The C10 brute force**, which the protocol requires only if C10 fails at *r* = 1; it did not.
- **C2's and C10's planted defects were not run with the arms.** They were added after every arm's results had been read (`c90e138`) and run then. Both were caught. This departs from the §8 order.
- **The unblocked D arm**, which was replaced by fallback 1. Every registered D-arm figure is from block mode. Only the S2, *r* = 1, *m* ≤ 0 cells were rerun unblocked, as an exploratory sensitivity.
- **A retained rerun by anyone other than the author.** An independent reviewer reran most phases (the L arm only on a sample) and reproduced the outputs, but those reruns are not in the repository, so the result stays exploratory.

## What this does and does not license

- **Licensed** (every D-arm figure is a planner lower bound; nothing here speaks to how students play):
  - In this game's economy, a cap on total saleable tonnage near the dhow's hold size makes the dhow competitive only if goods must be sold on arrival.
  - Allowing a ship to wait two months to sell restores the junk's lead at every pooled cap tested when the market recovers fully each month; with slow recovery it can fail (hard, 60 t, *r* = 0.1).
  - Payment delays hurt the larger hold more in proportion, but never reverse the ranking on the planner's path.
  - Ruin is rare, and the expected-outlay reserve removes it at almost no cost.
- **Not licensed:**
  - That the plans are optimal (C9: lower bounds).
  - Fine distinctions among per-good caps below 30 lots, including D2's registered score: block granularity reverses the ranking at 15 lots, and margins are under about 4%.
  - That students play like any of these planners.
  - Anything historical.

## Files

| File | Contents |
| --- | --- |
| `depth.csv` | D arm, one row per cell (1,024): E/S/S24 nets for depth-aware, depth-naive and copy-other, the scored figure and its source, DP values, cargo outcomes, inventory-months, *m* options used and counted, DP size |
| `darm-checks.json` | C2, C3, C10 and solve times for the D arm |
| `c9.json` | C9 monotonicity |
| `liquidity.csv`, `liquidity-checks.json`, `liquidity-perseed.csv` | L arm: per-cell quantiles, ruin counts and cases, C3/C4; per-seed E- and S-nets, ruins and end months (`cell` = row of `liquidity.csv`). The pretty-printed JSON first written is in the external archive with its SHA-256 |
| `harness.csv`, `harness-checks.json`, `harness-perseed.csv` | H arm, the same (`cell` = row of `harness.csv`) |
| `b1.json` | B1: DP-E, DP-S and DP-S24 plans, engine nets under all three rules, replay checks |
| `checks-pre.json`, `checks-pre-run2.json` | Checks before any arm (run 3, passing; run 2, failing C6) |
| `checks-plants.json` | C2's and C10's planted defects, run after the arms |
| `checks-settlement.json`, `checks-c6-arms.json`, `checks-c8-phase.json`, `checks-due-month.json` | Checks added after the reviews: settlement at *k* ≥ 1, C6 on both arms (with before-credit minima), C8 through a real phase, the due-month unit test |
| `depth-unblocked-r1.csv`, `darm-checks-unblocked-r1.json`, `darm-ext-manifest-unblocked-r1.json` | Exploratory sensitivity: the S2, *r* = 1, *m* ≤ 0 cells unblocked (64 cells; C2 and C3 pass) |
| `timing.json`, `timing-fallback1.json` | First 64 solves, before and after fallback 1 |
| `predictions.json` | Every score with its cells. `score` reads only committed files and, from a clean checkout with an empty external directory, reproduces this file byte for byte |
| `external-manifest.json`, `darm-ext-manifest.json` | SHA-256 of the large traces (`darm-rows.json`, `darm-plans.json`) and of every run log, kept outside the repository |
