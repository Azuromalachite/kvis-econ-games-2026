# Costs that change decisions: results of the registered run

| | |
| --- | --- |
| Protocol | `research/03/pre-registrations/2026-11-24-scaling-costs.md` (v4, registered by #46); deviations, interpretations and corrections in its §9 (four dated entries) |
| Code | `research/03/models/scaling-costs.mjs`, committed at `fcc8b79` (SHA-256 `9069eaff…`) for every registered phase. That commit came **after a complete scored development smoke run** on unregistered seeds (03:00–03:04 JST). The dev run's two script versions are recovered and diffed in `dev-script-diff.txt`, and differ only in print lines, a debug phase and the plant runner. Later commits add check CB and the first-leg descriptor, both after results |
| Engine | engine script SHA-256 `6fba1ee7…` (pinned), `lineOffset` 1776; page on `main` `6b9a9711…` (rebuilt since registration, §9 deviation 1); page hash unchanged across every phase |
| Seeds | L-EV 600001–600150 (N = 150, no fallback); H 600001–601000; keyed draws (§4.5) |
| Status | **Exploratory.** **Provenance-incomplete**: the external archive (`external-manifest.json`, root `sc_ext`) is not yet at an immutable reference. An independent review re-derived the scores from the CSVs; nobody else has yet rerun the study from the recorded inputs |
| Players | planners with perfect information (L-EV, D-W) and a fixed myopic rule (H). **Not students** |

Every share, rate and wage multiplier is a balance parameter of an invented economy. Nothing here is historical.

**On blindness.** A complete scored smoke run on dev seeds existed before the code and interpretations were committed (§9, entry of the review). The author reports reading its files for structure only, and a reader cannot verify that. D-W ignores seeds and L-EV is nearly the same plan on every seed, so the dev files effectively held the final D-W and L-EV behaviour results; the dev scores match the final ones apart from S2. **S6, S7 and S8 are therefore labelled informed** (owner decision, 2026-11-25), as S1–S3 and S5 already were. No score is changed.

## 1. Scores: failures first

| ID | Score | What decided it |
| --- | --- | --- |
| **S7** (primary, *informed*: dev run) | **Contradicted**, real but thin | (a) Below μ = 0.3, M already moves the junk's voluntary port months by **+2** at M 0.03, and by +2 at M 0.1 for the dhow (easy) and both junk cells (bound ±1). (b) At P 0.3 the junk's mean hold value at departure falls 8–10 % (bound ±5 %) and its piracy per laden departure falls 0.016–0.031 (easy outside ±0.02). At T 0.3 the dhow's hold value rises 11–14 %. Each failing cell is one deterministic plan change, shared across seeds, at about 1–7 decision positions per campaign (§2). Some are near-indifferent (§2) |
| **S8** (primary, *informed*: dev run) | **Contradicted** | L-EV: junk/dhow ≥ 1.5 in every variant and cell (2.28–2.54). H: interpretation 6 read "no reversal in any H easy or normal cell" as absolute. That guaranteed a contradiction: adaptive-routes A2, seen before registration, already has the dhow ahead under H *avoid headwind* under flat (junk/dhow 0.71–0.78). Neither the author nor the protocol's reviewers caught it. **On the relative reading** (a cell whose side differs from flat's), S8 is still contradicted, **but only through W**: W 30 with G, easy, *sail always*: 0.96 against 1.80; W 30 with G+, *avoid headwind*: 1.59 against 0.78 (easy) and 1.53 against 0.71 (normal). **P, T, M and the bundles change the side of no H cell** |
| **S1** | **Contradicted** in 4 of 64 cells | T 0.3, junk, easy and normal, both policies: measured R_late is 2.2–3.2 points **below** `predict` (for example 7.66 % vs 9.90 %). Within ±2 points in the other 60 cells; within ±4 in all 64; outside ±1 in 8 |
| **S3(a)** | **Contradicted** | D-W with G+ stays below 3 % at every β (0.09 %, 0.28 %, 0.9 % and 2.7 % at β = 1, 3, 10, 30, nearly the same in every cell). H with G+ under *sail always* exceeds 5 % at W 10 (junk easy, 14.8 %) and W 30 (dhow 9.4–11.8 %, junk 24.6–38.6 %). Part of this is timing, not loss: for example W 30 with G+, junk hard, R_late 0.386 with a **higher** median S-net (105,056 against 94,130). Under *avoid headwind* at W 30 the junk's late profit triples (R_late −2.0), because wage-aware ranking moves H to better lanes |
| **S5** | **Contradicted**, by the W(6) bound only | H early ruins: no excess in any cell for any P, T, M or bundle. L-EV: 0 ruins in every cell. But W(6) falls more than 2 % in some L-EV cell at P 0.1, P 0.3, T 0.03, T 0.1, T 0.3, M 0.1 and M 0.3: down to −48 % to −55 % for the dhow under T (§5: W(6) is a cost-basis snapshot) |
| **S6** (primary, *informed*: dev run) | **Supported** | M 0.3: paired median voluntary port months +2 (dhow, junk normal) and +3 (junk easy); pooled crew at departure 70–84 against 43–53 flat. All four cells meet both conditions. Testable: 46.5–58.6 % of flat departures had crew < 50 (frozen exposure table) |
| **S2** | **Supported** | K_late within 0.56 points of `predict` in all 64 cells |
| **S3(b)** | **Supported** | H with G at β ≥ 10: ruins above flat by 83–1,000 per 1,000 in the easy and normal junk cells at W 10, and in every easy and normal cell but one at W 30. G's 60 D reserve cannot pay the departure wage |

Untestable: none. `predictions.json` is generated output and keeps the registered labels; this file and §9 carry the relabelling.

## 2. Primary question: do the costs change what the planner does?

Yes, in more places and at lower values than predicted, though often by one plan change per cell. L-EV, paired by seed, against flat (`behaviour.csv`).

**What a voluntary port month measures.** It is a wait in a month when some lane from that port is allowed by the policy. It therefore also counts waiting out a headwind on the lane the planner wants, so it is not always rest. Crew at departure is the rest signal.

| Behaviour | What moved |
| --- | --- |
| **Resting** | **M** rests the crew from **0.03** for the junk and **0.1** for the dhow: voluntary port months +2, crew at departure 69–84 against 43–53. **T rests the crew only at 0.3**: crew 57–74 against 53 (dhow) and 65 against 43 (junk), with +2 to +4 voluntary port months. At T 0.03 and T 0.1 the dhow's voluntary port months rise by 2, but its crew at departure **falls** (49.6–51 against 52.6), so those are waits for timing, not rest; the junk's crew is unchanged (43). P never changes resting |
| **Pirate waters** | P, from 0.03, moves the **junk** away from valuables-risky legs: piracy per departure with valuables 0.103 against 0.135–0.161. The dhow does not move until P 0.3. Under T the dhow's piracy exposure **rises** (0.13–0.14 against 0.11), as it moves value from cash into cargo. The share of laden departures into Malacca, Aden or Kilwa moves by at most 0.07 |
| **Cargo** | P cuts the junk's hold value by 5–10 % from P 0.03 on (P 0.3: −8 to −10 %). T raises the dhow's by 11–14 % (cash at sea is what T taxes). The hold value per departure counts every leg of a delivery, so raid losses on leg 1 feed into later legs' values mechanically. **On the first leg alone** (`firstleg.csv`; a post-run rerun that reproduces the committed runs seed for seed), the junk's hold value under P 0.3 falls **12.6 % (easy) and 9.5 % (normal)**, and the dhow's under T 0.3 rises **15.2 % and 12.6 %**. The cargo changes are therefore not an artefact of later-leg raids. P 0.3 moves the dhow's first leg by −0.7 % and −2.1 %, and T 0.3 moves the junk's by −3.3 % and −5.4 % |
| **Standing** | Hardly used: laden departures into a port at standing ≥ 50 reach 6–7 % for the dhow under P 0.3, T 0.3 and M 0.1, from 0 under flat |
| **Ship choice** | Unchanged for L-EV (2.28–2.54). Under H see S8 |

**How thin S7's changes are.** These are distinct decision states (seeds 600001–600010) where the variant's first action differs from flat's, out of all states, with the implied positions per campaign (weighted count ÷ 10 seeds) in brackets:

| Cell | Differing states | Positions per campaign |
| --- | --- | --- |
| M 0.03, junk easy | 25 of 143 | 2.5 |
| M 0.03, junk normal | 19 of 149 | 2 |
| M 0.1, dhow easy | 13 of 170 | 3 |
| M 0.1, junk easy | 28 of 143 | 3 |
| M 0.1, junk normal | 19 of 149 | 2 |
| P 0.3, junk easy | 18 of 143 | 2 |
| P 0.3, junk normal | 10 of 149 | 1 |
| T 0.3, dhow easy | 59 of 170 | 6 |
| T 0.3, dhow normal | 61 of 170 | 7 |

Some are near-indifferent: P 0.03 changes the junk's action in 10–18 states but **none** survives a margin of 2·m_v, and M 0.03's junk changes include **none** above 1 % of the plan value.

**Decision flips overall** (`flips.csv`, 632 states, margin m_v):
- M 0.3 changes the first action in 31–54 states per cell (of 143–170);
- T 0.3 in 29–61; T 0.1 and T 0.03 in 20–39; P 0.3 in 10–18; M 0.1 in 12–28;
- P 0.03, P 0.1 and M 0.03 change the junk only (10–25), and M 0.01 changes nothing.
- Fewer survive 1 % of the plan value (0–21 per cell).

**Avoidance.** The static replay (flat actions, variant costs) puts R_late at 8–35 % under P 0.3, T 0.3 and M 0.3. Re-optimising removes much of it: A = 0.13–0.95 under T, about 0.19 for the junk under P 0.3, and mostly **above 1 under M and for the dhow under P 0.3**, where the re-planned run's late profit exceeds flat's.

## 3. Secondary: the profit cut

R_late, ratio of paired sums (95 % seed-bootstrap CIs in `harness.csv` and `lev.csv`).

| Rule (value) | H, easy and normal cells | L-EV cells | L-EV median S-net vs flat | `predict` (H) |
| --- | --- | --- | --- | --- |
| P 0.3 | 4.1–5.7 % | dhow −6.8 %, junk 8.3 % | −5.0 to −10.3 % | 4.9–7.0 % |
| T 0.1 | 2.6–10.4 % | 6.7–7.4 % | −4.2 to −4.6 % | 3.4–10.4 % |
| T 0.3 | 7.7–28.3 % | 1.7–17.3 % | −10.5 to −13.3 % | 9.9–28.3 % |
| M 0.03 | 1.9–3.0 % | dhow 1.0 %, junk −13.4 % | −0.7 to −1.2 % | — |
| M 0.1 | 8.0–12.7 % | dhow −0.7 to 0.8 %, junk −12.9 % | −1.0 to −1.4 % | — |
| M 0.3 | 24.5–38.8 % | −13.7 % (dhow), −11.5 % (junk) | −1.6 to −2.5 % | — |
| B 2 (H only) | 11.6–17.9 % | — | — | — |
| W 30, G+ | −203 % to 35 % | not run (O7) | — | — |

- **For raids, the myopic player's profit cut is the flat-ledger arithmetic.** K_late matched in all 64 cells and R_late in 60. The misses are the junk at T 0.3, where compounding through cash-capped buys makes the measured cut smaller than the arithmetic.
- **For the re-planner, R_late is not a stable size of the cut.**
  - Its median S-net falls 5–13 % under P 0.3 and T 0.3 and 1.6–2.5 % under M 0.3.
  - But R_late is small or negative, because the plan shifts profit across month 12.
  - The L-EV gap to `predict` (the behavioural part) is −0.4 to −32 points under T and −14 points for the dhow under P 0.3.

## 4. P, T, M and W against the adoption rule (§6)

**No rule has a candidate value**: at R\* = 10 % (informed), at 5 % or 20 % (descriptors), and under the looser or stricter guardrails (`predictions.json` → `adoption`).

- **P**: H never reaches 10 % in every easy and normal cell (at most 5.7 % at P 0.3), and P fails S5's W(6) bound at P 0.1 and P 0.3.
- **T**: T 0.3 reaches 7.7–28 % in H but not 10 % in every cell (junk *sail always* normal 7.7 %). The L-EV cells are as low as 1.7 %, and W(6) fails at every T value run.
- **M**: M 0.3 removes 24.5–39 % of H's late profit, but L-EV's R_late is negative (the planner rests and recovers it), and W(6) fails at M 0.1 and M 0.3.
- **W**: R_late on the G+ cells is below 5 % for D-W and *avoid headwind*, and negative where wage-aware ranking improves H. No β gives R ≥ 10 % in every easy and normal cell.

**Profit cut versus behaviour, rule by rule:**
- **M** most clearly *changes a decision the planner faces*: rest the crew or pay a share of the hold. It does so from μ = 0.03 for the junk, **at little cost to the planner** (L-EV median S-net −0.2 to −2.5 %), and barely moves ship choice. **For the myopic harness, which never rests, M is a straight cost**: R_late 1.9–3.0 % at M 0.03, 8.0–12.7 % at M 0.1 and 24.5–38.8 % at M 0.3, with 3.5–5.0 mutinies per campaign under flat.
- **T** changes hold value and timing (and rests the crew at 0.3), and cuts the planner's profit 4–13 % at 0.1–0.3.
- **P** acts mainly as a cost. It moves the junk's cargo and valuables exposure, and cuts profit 3–10 % at 0.1–0.3.
- **W** matters only through the departure wage. With G it ruins the harness at β ≥ 3 in some cell (junk hard, all 1,000 at β = 3), and with G+ it is a small cost, except that it re-ranks H's lanes.

## 5. Guardrails and early-game solvency

- **Ruins.** No P, T, M or bundle value raised H early ruins in any cell, and L-EV had 0 ruins in every cell. W with G raised ruins massively; W with G+ raised none.
  - D-W's W 30 with G, junk easy, "chooses" a ruin: under G every purchase at β = 30 leaves too little for the departure wage. This is an artefact of G's 60 D reserve, not a plan anyone would choose.
- **Floor breaches** (cash < 0 after a sail or wait) are frequent **already under flat**:
  - all 150 junk L-EV campaigns in both cells, and 1–15 dhow campaigns;
  - 174–853 of 1,000 H junk campaigns (853 on easy);
  - every H campaign under W 10 or W 30 with G.
  This repeats the unfunded-departure finding (#41).
- **W(6) is a cost-basis snapshot.** It values cargo at cost, so it falls whenever a re-planned route holds goods at month 6 instead of cash. The −48 % to −55 % for the dhow under T 0.03–0.3 is a change of route timing (the dhow makes 14 departures instead of 16), not a loss in the game. S5 is scored as registered: contradicted.

## 6. Limitations

- **Cargo optimisation is cost-blind.** `planBuys` never sees the expected costs, so cargo and hold value change only through destination and timing. The decision share for P and T is a **lower bound**.
- **Perfect information.** L-EV knows every price and every hazard's expectation; D-W plans with hazards off; H is a fixed myopic rule.
- **Standing is simplified to ≥ 50 flags.** Levels 20–49 (fees −25 %) collapse in the labels, so standing-building plans are undervalued.
- **Planners are not students.** Nothing here says how a class plays. The owner's play earned an order less and hired all three specialists; no player here hires any.
- **The zero-cash raid case**, as observed in the owner's own play on 2026-11-24, outside this study (the protocol does not source it). A ship with no cash and no valuables loses 0 to a raid under today's rule: X = min(max(0, cash), …), and floor(s·q) = 0 for small holds.
  - In this study's flat runs it is **4.8 % of L-EV raids** (64 of 1,329, all with bulk cargo aboard) and 0.2 % of H raids.
  - Under P a large enough bulk hold does lose lots in that case; under T it still loses nothing.
- **R_late and W(6) move with timing** for re-planning players. The median S-net change is reported beside them; neither is a better-scored measure after the fact.
- **Behaviour changes are single plan changes.** L-EV is nearly deterministic across seeds, so each cell's change is one plan shared by every seed. CIs on behaviour are narrow and say nothing about other players.
- **No registered check covered the behaviour metrics.** Check CB was added after results (§9): it recomputes them by hand on a scripted campaign, passes, and catches its three plants.
- **C7 descriptor.** The mutiny-cash term sits 3.6 SE from its expectation (inside the registered 4.1) in the nine non-M rules, which share their draws. It passed and was not acted on.

## 7. Deviations and what was not run

See §9 of the protocol:
- the page hash on `main` differs from registration, so the engine script is pinned instead;
- the raid replacement includes the closing brace at `:2462`;
- **D-W×depth (§7) was not run**; that was decided before the registered runs;
- 31 interpretations were committed before the registered runs but **after the dev smoke run** (see the review entry), and the `predict` and exposure tables were frozen with their SHA-256 before any variant run on registered seeds;
- after results: the dev run disclosed in full, S6–S8 relabelled informed, check CB, and the first-leg rerun.

No fallback was used. Survival appears only as an exploratory H cell. Checks C1–C10 all passed, and all 27 registered plants and the 3 CB plants were caught (`checks.json`).

## 8. Files

- `checks.json`: C1–C10 and their plants; CB in `postRunBehaviourCheck`.
- `predict.csv` and `exposure.csv`: frozen before the variants.
- `harness.csv`, `lev.csv`, `behaviour.csv`, `ships.csv`, `dw.csv`, `flips.csv`: per-cell results.
- `firstleg.csv`: post-run first-leg descriptor.
- `lev-perseed.csv`: L-EV per seed.
- `predictions.json`: scores, adoption, counts and provenance.
- `timing.json`.
- `dev-script-diff.txt`: the recovered dev-run script versions against the committed one.
- `external-manifest.json`: per-campaign columns, H per seed, static replays, flip states and the dev-smoke archive, with SHA-256.
