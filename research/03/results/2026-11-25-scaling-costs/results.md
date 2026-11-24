# Costs that change decisions: results of the registered run

| | |
| --- | --- |
| Protocol | `research/03/pre-registrations/2026-11-24-scaling-costs.md` (v4, registered by #46); deviations and interpretations in its §9 (three dated entries) |
| Code | `research/03/models/scaling-costs.mjs`, committed at `fcc8b79` before any check or run; unchanged since |
| Engine | engine script SHA-256 `6fba1ee7…` (pinned), `lineOffset` 1776; page on `main` `6b9a9711…` (rebuilt since registration, §9 deviation 1); page hash unchanged across every phase |
| Seeds | L-EV 600001–600150 (N = 150, no fallback); H 600001–601000; keyed draws (§4.5) |
| Status | **Exploratory.** **Provenance-incomplete**: the external archive (`external-manifest.json`, root `sc_ext`) is not yet at an immutable reference. Nobody else has rerun these results |
| Players | planners with perfect information (L-EV, D-W) and a fixed myopic rule (H). **Not students** |

Every share, rate and wage multiplier is a balance parameter of an invented economy. Nothing here is historical.

## 1. Scores: failures first

| ID | Score | What decided it |
| --- | --- | --- |
| **S7** (primary) | **Contradicted** | (a) Below μ = 0.3, M already moves resting: paired median voluntary port months rise by **2** at M 0.03 (junk, easy and normal) and at M 0.1 (dhow easy, both junk cells); bound ±1. (b) At P 0.3 the junk's mean hold value at departure falls 8–10 % (bound ±5 %), and its piracy probability per laden departure falls 0.016–0.031 (easy outside ±0.02). At T 0.3 the dhow's hold value rises 11–14 % |
| **S8** (primary) | **Contradicted**, by its H clause only | L-EV: junk/dhow ≥ 1.5 in every variant and cell (2.28–2.54). H: junk median S-net < dhow's in every *avoid headwind* easy and normal cell **already under flat** (ratio 0.71–0.78), so the clause "no reversal in any H easy or normal cell" fails before any cost is applied. This is the published harness result (adaptive routes A2), seen before registration: the clause was mis-specified. The costs add one reversal under *sail always* (W 30 with G, easy: 0.96) and collapse the ratio where W ruins H (W 10/W 30 with G) |
| **S1** | **Contradicted** in 4 of 64 cells | T 0.3, junk, easy and normal, both policies: measured R_late is 2.2–3.2 points **below** `predict` (for example 7.66 % vs 9.90 %). Within ±2 points in the other 60 cells; within ±4 in all 64; outside ±1 in 8 |
| **S3(a)** | **Contradicted** | With G+, D-W stays below 3 % at every β (0.09 %, 0.28 %, 0.9 % and 2.7 % at β = 1, 3, 10, 30, nearly the same in every cell). H with G+ under *sail always* exceeds 5 % at W 10 (junk easy, 14.8 %) and W 30 (dhow 9.4–11.8 %, junk 24.6–38.6 %). Under *avoid headwind* at W 30 the junk's late profit **triples** (R_late −2.0): wage-aware ranking moves H to better lanes |
| **S5** | **Contradicted**, by the W(6) bound only | H early ruins: no excess in any cell for any P, T, M or bundle. L-EV: 0 ruins in every cell. But W(6) falls more than 2 % in some L-EV cell at P 0.1, P 0.3, T 0.03, T 0.1, T 0.3, M 0.1 and M 0.3: down to −48 % to −55 % for the dhow under T (see §5, W(6) is a cost-basis snapshot) |
| **S6** (primary) | **Supported** | M 0.3: paired median voluntary port months +2 (dhow, junk normal) and +3 (junk easy); pooled crew at departure 70–84 against 43–53 flat. All four cells meet both conditions. Testable: 46.5–58.6 % of flat departures had crew < 50 (frozen exposure table) |
| **S2** | **Supported** | K_late within 0.56 points of `predict` in all 64 cells |
| **S3(b)** | **Supported** | H with G at β ≥ 10: ruins above flat by 83–1,000 per 1,000 in easy and normal junk cells (W 10) and in all but one cell (W 30). G's 60 D reserve cannot pay the departure wage |

Untestable: none.

## 2. Primary question: do the costs change what the planner does?

Yes, in more places and at lower values than predicted. L-EV, paired by seed, against flat (`behaviour.csv`):

| Behaviour | What moved |
| --- | --- |
| **Resting** | M changes resting from **0.03** for the junk and **0.1** for the dhow: +2 voluntary port months, crew at departure 69–84 against 43–53. T also rests the crew: T 0.03 and T 0.1, +2 months (dhow) and +1 (junk); T 0.3, +2 to +4. P never changes resting |
| **Pirate waters** | P (from 0.03) moves the **junk** away from valuables-risky legs: piracy per departure with valuables 0.103 against 0.135–0.161. The dhow does not move until P 0.3. Under T the dhow's piracy exposure **rises** (0.13–0.14 against 0.11), because it shifts value from cash into cargo. The share of laden departures into Malacca, Aden or Kilwa moves by at most 0.07 |
| **Cargo** | P cuts the junk's hold value by 5–10 % from P 0.03 on (P 0.3: −8 to −10 %). T raises the dhow's hold value by 11–14 % (cash at sea is what T taxes). This happens even though `planBuys` cannot see the costs (§6) |
| **Standing** | Hardly used: laden departures into a port at standing ≥ 50 reach 6–7 % for the dhow under P 0.3, T 0.3 and M 0.1, from 0 under flat |
| **Ship choice** | Unchanged for L-EV (2.28–2.54). Under H see S8 |

**Decision flips** (`flips.csv`, 632 states, seeds 600001–600010, margin m_v):
- M 0.3 changes the first action in 31–54 states per cell of 143–170;
- T 0.3 in 29–61; T 0.1 and T 0.03 in 20–39; P 0.3 in 10–18; M 0.1 in 12–28;
- P 0.03, P 0.1 and M 0.03 change the junk only (10–25), and M 0.01 changes nothing.
- Almost every changed action is a flip at m_v, at 1 D and at 2·m_v. Fewer survive 1 % of the plan value (0–21 per cell).

**Avoidance.** The static replay (flat actions, variant costs) puts R_late at 8–35 % under P 0.3, T 0.3 and M 0.3. Re-optimising removes most of it: A = 0.13–0.95 under T, about 0.19 for the junk under P 0.3, and mostly **above 1 under M and for the dhow under P 0.3**, where the re-planned run's late profit exceeds flat's.

## 3. Secondary: the profit cut

R_late, ratio of paired sums (95 % seed-bootstrap CIs in `harness.csv` and `lev.csv`).

| Rule (value) | H, easy and normal cells | L-EV cells | L-EV median S-net vs flat | `predict` (H) |
| --- | --- | --- | --- | --- |
| P 0.3 | 4.1–5.7 % | dhow −6.8 %, junk 8.3 % | −5.0 to −10.3 % | 4.9–7.0 % |
| T 0.1 | 2.6–10.4 % | 6.7–7.4 % | −4.2 to −4.6 % | 3.4–10.4 % |
| T 0.3 | 7.7–28.3 % | 1.7–17.3 % | −10.5 to −13.3 % | 9.9–28.3 % |
| M 0.1 | 8.0–12.7 % | dhow −0.7 to 0.8 %, junk −12.9 % | −1.0 to −1.4 % | — |
| M 0.3 | 24.5–38.8 % | −13.7 % (dhow), −11.5 % (junk) | −1.6 to −2.5 % | — |
| B 2 (H only) | 11.6–17.9 % | — | — | — |
| W 30, G+ | −203 % to 35 % | not run (O7) | — | — |

- **For raids, the profit cut is the flat-ledger arithmetic for the myopic player.** K_late matched in all 64 cells and R_late in 60. The misses are the junk at T 0.3, where compounding through cash-capped buys makes the measured cut smaller than the arithmetic.
- **For the re-planner, R_late is not a stable size of the cut.**
  - Its median S-net falls by 5–13 % under P 0.3 and T 0.3 and by 1.6–2.5 % under M 0.3.
  - But R_late is small or negative because the plan shifts profit across month 12.
  - The L-EV gap to `predict` (the behavioural part) is −0.4 to −32 points under T and −14 points for the dhow under P 0.3.

## 4. P, T, M and W against the adoption rule (§6)

**No rule has a candidate value**: at R\* = 10 % (informed), at 5 % or 20 % (descriptors), and under the looser or stricter guardrails. Reasons (`predictions.json` → `adoption`):

- **P**: H never reaches 10 % in every easy and normal cell (at most 5.7 % at P 0.3). It also fails S5's W(6) bound at P 0.1 and P 0.3.
- **T**: T 0.3 reaches 7.7–28 % in H but not 10 % in every cell (junk *sail always* normal 7.7 %); the L-EV cells are as low as 1.7 %; and W(6) fails at every T value run.
- **M**: M 0.3 removes 24.5–39 % of H's late profit, but L-EV's R_late is negative (the planner rests and recovers it), and W(6) fails at M 0.1 and M 0.3.
- **W**: R_late on the G+ cells is below 5 % for D-W and *avoid headwind*, and negative where wage-aware ranking improves H. Its candidate test needs R ≥ 10 % in every easy and normal cell, which no β gives.

**Profit cut versus behaviour, rule by rule:**
- **M** is the rule that most clearly *changes a decision a player faces*: rest the crew or pay a share of the hold. It does so from μ = 0.03 for the junk, it costs the planner little profit (1–2.5 %), and it barely moves ship choice.
- **T** changes resting, hold value and timing, and cuts the planner's profit by 4–13 % at 0.1–0.3.
- **P** acts mainly as a cost. It moves the junk's cargo and valuables exposure, and cuts profit 3–10 % at 0.1–0.3.
- **W** matters only through the departure wage. With G it ruins the harness at β ≥ 3 in some cell (junk hard, all 1,000 at β = 3), and with G+ it is a small cost, except that it re-ranks H's lanes.

## 5. Guardrails and early-game solvency

- **Ruins.** No variant raised H early ruins in any cell, and L-EV had 0 ruins in every cell. W with G raised ruins massively; W with G+ raised none.
- **Floor breaches** (cash < 0 after a sail or wait) are frequent **already under flat**:
  - all 150 junk L-EV campaigns in both cells, and 1–15 dhow campaigns;
  - 174–853 of 1,000 H junk campaigns (easy 853);
  - every H campaign under W 10 or W 30 with G.
  This repeats the unfunded-departure finding (#41).
- **W(6) is a cost-basis snapshot.** It counts cargo at cost and so falls whenever a re-planned route holds goods at month 6 instead of cash. The −48 % to −55 % for the dhow under T 0.03–0.3 is a change of route timing (the dhow makes 14 departures instead of 16), not a loss in the game. S5 is scored as registered: contradicted.

## 6. Limitations

- **Cargo optimisation is cost-blind.** `planBuys` never sees the expected costs, so cargo and hold value change only through destination and timing. The decision share for P and T is a **lower bound**.
- **Perfect information.** L-EV knows every price and every hazard's expectation; D-W plans with hazards off; H is a fixed myopic rule.
- **Standing is simplified to ≥ 50 flags.** Levels 20–49 (fees −25 %) collapse in the labels, so standing-building plans are undervalued.
- **Planners are not students.** Nothing here says how a class plays. The owner's play earned an order less and hired all three specialists; no player here hires any.
- **The zero-cash raid case.** A ship with no cash and no valuables loses 0 to a raid under today's rule (X = min(max(0, cash), …), and floor(s·q) = 0 for small holds). This is what the owner noticed in play. It is **4.8 % of flat L-EV raids** (64 of 1,329, all with bulk cargo aboard) and 0.2 % of flat H raids. Under P a large enough bulk hold does lose lots in that case; under T it still loses nothing.
- **R_late and W(6) move with timing** for re-planning players. The median S-net change is reported beside them; neither is a better-scored measure after the fact.
- **Decision measures are pooled means.** L-EV is nearly deterministic across seeds, so CIs on behaviour are narrow and say nothing about other players.
- **C7 descriptor.** The mutiny-cash term sits 3.6 SE from its expectation (inside the registered 4.1) in the nine non-M rules, which share their draws. It passed and was not acted on.

## 7. Deviations and what was not run

See §9 of the protocol:
- the page hash on `main` differs from registration and the engine script is pinned instead;
- the raid replacement includes the closing brace at `:2462`;
- **D-W×depth (§7) was not run**, a decision made before any run;
- 31 interpretations were fixed before any run, and the `predict` and exposure tables were frozen with their SHA-256 before any variant run.

No fallback was used. Survival appears only as an exploratory H cell. Checks C1–C10 all passed, and all 27 planted defects were caught (`checks.json`).

## 8. Files

- `checks.json`: C1–C10 and the plants.
- `predict.csv` and `exposure.csv`: frozen before the variants.
- `harness.csv`, `lev.csv`, `behaviour.csv`, `ships.csv`, `dw.csv`, `flips.csv`: per-cell results.
- `lev-perseed.csv`: L-EV per seed.
- `predictions.json`: scores, adoption, counts and provenance.
- `timing.json`.
- `external-manifest.json`: per-campaign columns, H per seed, static replays, flip states and the dev-smoke archive, with SHA-256.
