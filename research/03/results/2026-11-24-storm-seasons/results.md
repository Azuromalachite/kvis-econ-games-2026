# Results: regional storm seasons (Monsoon Navigator), the short run

| | |
| --- | --- |
| Protocol | [`research/03/pre-registrations/2026-11-23-storm-seasons.md`](../../pre-registrations/2026-11-23-storm-seasons.md), registered by #39 (`24296ed`). Deviations and interpretations are in its §13. The first entry was committed with the code in `657a12b`, the plant-runner fix in `b26bcf8`; both came before any exposure block ran |
| Run | 2026-11-24, from `main` at `a4062ae`. Each block ran once, in the order of §7: checks (K8, K3, K2, K4, K1, K1b, K5, K7) at `657a12b`; then K1–K8 plants twice (the first run's K8 control was invalid, see §13), exposure, K10 with its plants, the κ sweep and scoring, all at `b26bcf8`. After an independent review of #55 (which reran everything clean and got byte-identical outputs), two checks were added and run alone, and the score phase was rerun unchanged, at `f53d32c` (§13 entry written after results were seen) |
| Corrections | This file was corrected after the review. Two sentences of the first version were false ("nothing flips below κ = 240"; "T1 identical at all three margins in every row"), κ\* is now given as a bracket, and its dependence on the month-0 state is reported. Development smoke runs had produced complete outcome files (seeds 900001–900002) before the code was committed; no value in them was read, and they are archived (§13) |
| Cuts (§5.4) | **None.** The largest projection was 27.6 min, made before any block ran. The measured total was 9.6 min |
| Code | `research/03/models/storm-seasons.mjs`, which imports `research/03/models/adaptive-routes.mjs` (Sim, deliver, solve, planBuys) unedited, as `depth-liquidity.mjs` does |
| Engine | `projects/03/index.html` on `main`, page SHA-256 `0fa1c5e2…` (registered: `5c722df9…` at `cedef87`; §13 deviation 1). Its engine script, SHA-256 `6fba1ee750cc…` (62,591 characters), is pinned by the run and evaluated with `lineOffset` 1692. The storm block it replaces was asserted at `:2333-2346`. The page was hashed before and after every phase and never changed |
| Runtime | Node v24.22.2, Windows 11, single-threaded. Seed stream of `harnessReset` (mulberry32 per seed); arms are unpaired. Seeds 500001–500300 (K1 and R's W0: 200001–200300). Bootstrap: 10,000 resamples, seed 20261124 |
| Status | **Exploratory, provenance-incomplete.** Missing: (1) the large traces (`external-manifest.json`, with SHA-256 and a named root) are not archived at an immutable reference; (2) nobody other than the author has rerun the study |

> **Correction, 24 November 2026.** Item (2) of the Status row above records the original wording and is kept as written. Since then, an AI review agent working for the owner, separate from the author agent, has rerun every phase from a clean checkout of `8cb7601` on the same machine and toolchain. Its CSVs are byte-identical to the committed ones, and its run traces match `external-manifest.json`; the reviewer's record is [`verification.json`](verification.json), committed as the reviewer wrote it. This is an AI rerun on the same machine, not an independently provisioned reproduction, and the reviewer had read the author's code before rerunning it. The later head `d0fe56e` was confirmed only through the score phase and the A1 and R1 checks. The status stays **exploratory, provenance-incomplete**, because the trace archive still has no immutable reference. No number in this file changes.

The tier probabilities are game parameters. Modern climatology is used only as a proxy for relative seasonality within each sea. The players are planners, not students. **Nothing here proposes or authorises a change to the game's storms** (owner qualification, §11.1). Storm damage is the owner's decision, using κ\*.

## Predictions scored (failures first)

**No prediction failed.**

| ID | Score | Blind? | Result |
| --- | --- | --- | --- |
| N1 | supported | informed | At κ = 2.4, in all 12 player × cell combinations: T1 = 0, T2D = 0, T2′ = 0, T3(a) = 0, T4 = 0. Not one decision differs between the new and the old cost sets |
| N2 | supported | **informed** (§3; §9 item 9; and see the dev-smoke disclosure in §13) | κ\*(RS) = **600** D per hull point (first qualifying grid value), against the bound of > 24. It rests on one shared month-0 state: without it, 1,200 (below) |
| N3 | supported | **informed** (§9 item 9; §13) | κ\*(HS) = 600 = κ\*(RS). The bound is ≤, so it holds at equality. HS does not react *sooner* on this grid: it qualifies in more cells at 600 (4 against 2), but neither player qualifies at 240 |
| N5 | supported | blind | H in W1, normal: storm-caused porcelain loss has p99 = **0** in five cells. In the sixth (dhow, *avoid headwind*) it is 708 D, which is 0.33% of the median net of 216,949 (bound < 1%) |
| N6 | supported | informed | H's median net in W1 is within **0.08%** of W0's in every normal cell (ratios 0.9992–1.0007) |
| N4 | — | seen | Withdrawn as a prediction (§8). R's realised W1 share of storms on Malacca–Quanzhou, June–November: dhow 0.47 / 0.26 / 0.50 and junk 0.38 / 0.35 / 0.50 (*sail always* / *avoid headwind* / *avoid headwind and transition*). The registered path arithmetic gave 0.47, 0.24, 0.36 and 0.50 |

## κ\* — registered output 3

Read with the three thresholds together (owner qualification, §11.1):

| Player | κ\* at *m*_v (primary: 35 D dhow, 55 D junk) | at *m* = 1 D | at *m* = 2·*m*_v | Qualifying grid values (cells) |
| --- | --- | --- | --- | --- |
| RS (re-planner) | **600** | 600 | 600 | 600 (dhow *sail always*, dhow *avoid headwind*); 1,200 (all three dhow cells) |
| HS (myopic) | **600** | 600 | 600 | 600 (all three dhow cells, junk *avoid headwind*); 1,200 (those, plus junk *sail always*) |

- **κ\* lies between 240 and 600 on this grid; the first qualifying grid value is 600**, for both players. The grid is coarse there, so 600 is an upper end, not a point estimate (owner default after the review). At 600 a high-tier storm costs an expected 6,300 D for the dhow and 3,150 D for the junk (0.35 × 30 × stormResist × κ); at 240, 2,520 and 1,260 D.
- **Flips do occur below 240, short of the criteria.** At κ = 120, T1 with the margin is 7.1% for RS dhow *avoid headwind* (T2D 161 D), 5.9% for HS dhow *sail always* and 8.3% for HS dhow *avoid headwind and transition*. At 240 the largest T1 is 8.3% (HS dhow *avoid headwind and transition*). Nothing flips at κ ≤ 60 with the margin.
- **The three margins give the same κ\*, but that is the coarse grid.** T1 is the same at 1 D, *m*_v and 2·*m*_v in every row except RS dhow *sail always* at κ = 6 and 12, where T1 at 1 D is 3.5% and at *m*_v 0 (T2D 0.88 and 0.44 D). The review finds that most flips stable at 600 break even somewhere between 240 and 600 (and the month-0 dhow *sail always* state near κ ≈ 130), so a finer grid would separate the margins. The primary threshold is pre-specified; it is not presented as objectively right (owner qualification).
- **Junk κ\*.** No junk cell qualifies for RS at any κ, so the RS value is a dhow result. HS reaches two junk cells only at 1,200. The junk's storm cost is half the dhow's because stormResist = 0.5 (`:1881`). The literature records (#34; `p02-p03-extended-search-addendum.md:129`) do not establish a storm-damage advantage for the junk, so any junk threshold is a property of that game parameter, not of evidence.
- **Not monotone in two cells,** as reported, not smoothed. RS junk *avoid headwind* has T1 = 5.6% at 600 and 0% at 1,200; RS dhow *sail always* has 26.9% at 600 and 26.2% at 1,200.
- **The flips come from a few states that every campaign shares.** The RS sample is 2,080 visits (1,621 distinct states) and the HS sample 30,459 visits. Many visits are the same state: the opening state (Calicut, month 0) occurs once in every campaign, and so do several waits in June at Kilwa and Aden. As a result:
  - the seed-level CIs on T1 are often degenerate (for example [0.143, 0.143]);
  - per distinct state, T1 at 600 is lower in some cells: RS dhow *avoid headwind* 3.6% against 14.3% per visit, and HS junk *sail always* 0.6% against 8.7%.
  - at κ = 600, in six cells every campaign contributes exactly the same number of flip visits, so T1 comes entirely from the same few decision points in every campaign and its seed-level CI collapses to a point: RS dhow *avoid headwind*, RS dhow *avoid headwind and transition*, RS junk *avoid headwind*, HS dhow *avoid headwind*, HS junk *avoid headwind* and HS junk *avoid headwind and transition*. Those CIs say nothing about uncertainty.
  κ\* is registered per visit and stays primary. No cell has fewer than 20 distinct states.
- **κ\*(RS) = 600 hinges on one seed-independent state** (reported beside the registered value, owner default):
  - In the month-0 Calicut state of dhow *avoid headwind*, it is the **today's-rule** player that changes: at κ = 600 its first delivery switches from Calicut→Malacca to Calicut→Aden, with a regret of 2,279 D at 600 and at 1,200. The seasonal-rule player keeps Calicut→Malacca. T1 measures the divergence between the seasonal-rule and today's-rule storm-aware players, not storms moving a storm-blind player.
  - Without the month-0 states, κ\*(RS) is **1,200**. Per distinct state κ\*(RS) is also **1,200**: at 600 only dhow *sail always* passes.
  - **HS's 600 holds per distinct state** (dhow *sail always* 23.0%, dhow *avoid headwind and transition* 11.7%, dhow *avoid headwind* 17.6%, junk *avoid headwind* 15.0%).
- **What flips at 600 (RS),** by distinct state: mostly *wait a month* against *sail now* into a high-tier monsoon month: June out of Aden and Kilwa, October and November out of Quanzhou, and month 17 at Kilwa and Aden. There are a few route swaps: Calicut→Kilwa against Calicut→Aden in May, the month-0 states above (in dhow *sail always* the seasonal-rule player switches Calicut→Kilwa to Calicut→Malacca from κ = 240). Reacting costs RS planning cash: the mean planning-net change of the new plan, with *c* excluded, is −1,214 to −8,325 D at 600 in the dhow cells.
- **T2′, the regret as a share** (descriptor, κ-free denominators):
  - RS stays ≤ 0.66% at every κ;
  - HS reaches 20% at 1,200 (dhow *sail always*).
  HS's denominator is one leg's expected net, not a campaign's (§4, owner qualification), so the two players' T2′ are not compared. HS's denominator and contributing states per cell (all visits contribute) are in `kappa.csv` (`T2pDen`, `T2pStates`, `regretStates`). For example, HS dhow *sail always*: denominator 32,119,693 D over 3,902 states.
- **T3 and T4.**
  - At κ = 2.4 neither is flagged: T3(a) = 0, T4 = 0, and T3(b) ≤ 0.86.
  - T3(b) passes 1 from κ = 24 in several cells. The gap between waiting and sailing moves by about one storm's cost while the choice stays the same.
  - RS's whole remaining port sequence changes much more often than its first delivery. At 240, dhow *avoid headwind*: 78.6% of visits against 7.1%.

## Exposure — registered output 1

From `exposure.csv` (per cell; 65 KB) and `campaigns.csv`; normal difficulty unless stated.

- **Where storms land.** Today (W0) every storm falls on a transition-month leg. Under M1 (W1):
  - H's 3,316 storms fall 59% on tailwind legs, 37% on transition legs and 4% on headwind legs. By sea: AS 2,034, SCS 966, BoB 316.
  - R's 4,262 storms: 79% tailwind; by sea AS 1,668, SCS 1,737, BoB 857.
  Realised counts match expected counts in every region (for example, H in W1: SCS 966 realised against 945 expected).
- **Storms per campaign, W0 → W1** (H, unpaired):
  - dhow 1.66 → 1.41, 2.12 → 1.43 and 0 → 2.15 (*sail always*, *avoid headwind*, *avoid headwind and transition*);
  - junk 1.91 → 2.10, 2.26 → 1.80 and 0 → 2.15.
  R, W0 (seeds 200001–200300) → W1:
  - dhow 0.99 → 2.03, 2.08 → 2.19 and 0 → 2.15;
  - junk 0.77 → 2.53, 1.35 → 3.15 and 0 → 2.15.
  *Avoid headwind and transition* keeps its name but now meets about two storms a campaign (§11).
- **Storms on turned-back attempts:** at most 0.16 per campaign (H, dhow, *sail always*).
- **The seven tailwind lane-months that become high** (§2.4), W1, realised storms / attempts (expected):

  | Lane-month | H dhow | H junk | R dhow | R junk |
  | --- | --- | --- | --- | --- |
  | Kilwa→Aden, Jun | — | — | — | — |
  | Kilwa→Calicut, Jun | 220 / 600 (210) | 220 / 600 (210) | 333 / 900 (315) | 220 / 600 (210) |
  | Aden→Calicut, Jun | — | 84 / 195 (68.3) | 100 / 263 (92.1) | 345 / 900 (315) |
  | Malacca→Calicut, Nov | — | — | 142 / 390 (136.5) | 87 / 247 (86.5) |
  | Malacca→Quanzhou, Jul | — | — | 43 / 115 (40.3) | 59 / 169 (59.2) |
  | Malacca→Quanzhou, Aug | 432 / 1,200 (420) | 225 / 600 (210) | 464 / 1,260 (441) | 576 / 1,500 (525) |
  | Malacca→Quanzhou, Sep | — | — | — | — |

- **Expected storms on R's W1 paths under W2–W5** (summed over the six cells): M2 4,903, M3 2,895, SCS-early 3,811, mixed legs 3,703, against M1's 4,137. Realised W2–W5 storms come from H's runs (`campaigns.csv`).
  - W4 and W5 leave H's nets and storm counts **identical** to W1's in every cell where H never sails a leg-month they change. For example, H's dhow sails Malacca→Quanzhou only in August, which is high in both W1 and W4.

## Porcelain tail — registered output 2

From `porcelain.csv`.

- **Storm-caused loss appears in only three player × cell combinations, and today's rule already produces it in each.** In each, the loss is one fixed lot pattern:
  - H dhow *avoid headwind*: 708 D (W0 in 72.3% of campaigns; W1 47.7%; survival W1 52.0%);
  - R junk *sail always*: 833 D (W0 27.3%; W1 43.7%);
  - R dhow *avoid headwind*: 195 D (W0 only, 5%).
- **Every other cell has none,** in every world and at both difficulties. The tail is therefore no wider under M1 than today.

## Reported, not registered

These are in `campaigns.csv`, per world, player, difficulty, vessel and policy:
- doldrums per transition leg: 0.22–0.27, against 0.25 expected;
- repairs, mutinies, waits and turn-backs;
- departures by calendar month and legs per lane;
- the spread of net (SD, p10–p90, minimum).

## Checks

Every check passed, and every plant was caught (`checks.json`):

| Check | Result | Plants caught |
| --- | --- | --- |
| K8 | Engine script pinned. `MONSOON_INDEX` unset. 68/68 engine tests. All 47 `planted-defects.mjs` changes caught. Page unchanged in every phase | 2/2. (a) Exit 3, nothing written. (b) Exit 4. The control probe passed on the committed page |
| K3 | 48 tier cells and 1,440 *p* cells, three ways | 3/3 |
| K2 | 10 directed legs, three ways. Shares rebuilt from the page: 0.208 / 0.563 / 0.229 and 0.105 / 0.895. South of the equator: 0.34 and 0.48 | 2/2 |
| K4 | 46 scripted boundary cases | 4/4 |
| K1 | 5,400 harness and 5,400 re-planning nets, 36 plan replays and 18 hazards-off harness nets, exact | 1/1 |
| K1b | 5,400 campaigns; 247,712 actions state-equal; replays equal | 1/1 |
| K5 | 68/68 engine tests; 22/22 `sail.test.mjs` cases on the copy; 4/4 new scripted cases | 1/1 |
| K7 | 480/480 in all seven arms | 1/1 |
| K10a | 1,621 distinct states | 1/1 |
| K10b | 1,621 distinct states | 1/1 |
| K10c | 300 states × 3 κ | 1/1 |
| K10d | 28 scripted scores; 30,459 H states, 0 disagreements | 1/1 |
| A1 (added after results, §13) | Hand-worked porcelain attribution: 4 of 7 broken lots storm-caused, 875 D | 1/1 (every lot counted as storm-caused) |
| R1 (added after results, §13) | T1 at three margins and T2D recounted in all 108 rows (432 values): equal to `aggregate()` on the same inputs and to `kappa.csv`. κ\* recounted: equal to `kstarOf()` and `predictions.json` at all three margins | 2/2 (T1 counted at 1 D in `aggregate()`; κ\* scored at T1 ≥ 5%) |

Expected exposure (Σ *p*) has no planted check.

## Wall-clock time per block against §5.4

| Block | Measured (min) | §5.4 estimate |
| --- | --- | --- |
| K8, K3, K2, K4 / K5, K7 | 0.71 / 0.02 | ≤ 2 (the row) |
| K1 | 4.91 | 8–10.5 |
| K1b | 0.08 | ≤ 0.5 |
| Exposure, H | 0.15 | ≤ 0.5 |
| Exposure, R | 1.52 | 2.7–3.5 |
| Expected exposure | 0.02 | seconds |
| K10 | 0.70 (1.17 wall, of which F_new 0.47 charged to the sweep, §13 item 13) | ≈ 1 |
| κ sweep, RS | 1.44 (0.97 wall + F_new 0.47) | 6–8.5 |
| κ sweep, HS | 0.07 | ≤ 1 |
| **Total** | **9.6** | 22–28 (cap 30) |

The plant runs are timed outside the cap (§13 item 13): K1–K8 about 4 s (first run) and 5 s (rerun), K10 about 3 s; the post-review checks A1 and R1 about 5 s and their plants about 11 s. Projections and the cut ledger are in `predictions.json` → `timing`.

## Files

| File | Contents |
| --- | --- |
| `checks.json` | K1–K10d and the plant outcomes; the dumped lookup (K2, K3) |
| `exposure.csv` | Region × month × leg × wind status, per world, player and cell, realised and expected |
| `porcelain.csv` | The porcelain tail |
| `campaigns.csv` | Nets and per-campaign figures, with means, CIs and p10–p90 |
| `kappa.csv` | T1 (three margins, with CI), T2D (with CI), T2′ with its denominator, T3(a), T3(b), T4, and per-distinct-state values, per κ, player and cell |
| `predictions.json` | Scores, κ\* and timing |
| `external-manifest.json` | The large traces, with SHA-256 |

## One-sentence finding

> Regional storm seasons would move the game's storms out of the transition months onto the best China-bound, Bay of Bengal and Arabian Sea monsoon winds, and raise the expected storms on the re-planner's paths. At today's damage, though, a storm costs tens of dinars against hundreds or thousands for a month of delay, so wind and prices still decide when and where to sail. A storm would have to be valued at between 240 and 600 D a hull point on this grid (first qualifying grid value 600) before the seasonal-rule and today's-rule storm-aware players' decisions diverge by more than a month's port costs. For the re-planner that value rests on one opening state shared by every campaign; without it, or counted per distinct state, it is 1,200.
