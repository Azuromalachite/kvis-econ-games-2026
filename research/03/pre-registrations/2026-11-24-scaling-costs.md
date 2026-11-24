# Protocol: costs that change decisions (Monsoon Navigator, balance study)

| | |
| --- | --- |
| Status | **Registered by merging this file's PR; not run.** No outcome under any share rule has been evaluated. Computation before registration: page and engine-script hashes, arithmetic on constants, and two timing pilots under **flat** rules that printed solve times and peak memory only (§8; §3 item 12). This text is v4. The PR body summarises v1–v3 and their reviews; the full review reports are kept in the owner's session. §15–§17 list the changes. Remaining owner choices are marked **OWNER** (§12) and stand at their recommended values unless the owner changes them before merging |
| Drafted | 2026-11-24 (v1–v3), against `main` at `f71aba2` (merge of #44) |
| Follows | Depth and liquidity (`research/03/pre-registrations/2026-11-23-depth-liquidity.md`, registered `1f08700`; results `research/03/results/2026-11-24-depth-liquidity/results.md`). Adaptive routes (`research/03/pre-registrations/2026-11-23-adaptive-routes.md`; results `research/03/results/2026-11-23-adaptive-routes/results.md`) |
| Engine | `projects/03/index.html` at `f71aba2`, page SHA-256 `0b11ae287ab32e3ee6fe1ead1dec8b5d52b4b60f34076f854a39f54b7d8c74d7` (bytes of `git show f71aba2:projects/03/index.html`). Its one bare `<script>` (`engineScript()` in `tests/03/engine/load-engine.mjs`) has SHA-256 `6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c`, 62,591 characters, byte-identical to the script of every earlier Monsoon study. Its `<script>` tag is on **line 1777**. Every `:NNNN` is a line of the file at `f71aba2`: 188 lower than at `d2d66a3`/`f475726` (depth-and-liquidity, specialist protocols) and 84 lower than at `cedef87` (storm-seasons draft, #39) |
| Kind of change | **Game change, tested in research first (Path B).** The game file is never edited. The rules exist only as research copies of `sailTo` and `waitInPort` in the loader's `vm` context. Anything the owner adopts goes into the **combined engine change**, made upstream, rebuilt and pinned as `projects/03/README.md` ("Generated page") requires: a separate PR and the owner's decision |
| Owner instruction | 2026-11-24: pre-register; measure early-game ruin as well as late-game profit, because flat costs hit poor players hardest; no tuning by feel; anything adopted goes into the combined engine change; run after the depth results (merged). **Owner decisions, 2026-11-24:** on v1, (1) the primary question is costs that change decisions, (2) a raid compares a cargo share and a cash share whatever is aboard, (3) the planner is crew-aware, N = 150; on v2, (4) the raid keeps today's floor, (5) the adoption rule selects on R_late, (6) the run uses 3 workers with nothing else running |
| Status of results when run | **Exploratory** until someone other than the author reruns them from the recorded inputs; **provenance-incomplete** if any field `game-change-review` requires is missing, with the missing fields named |

Every share, rate and wage multiplier is a **balance parameter** on a fixed numeric series (§4.3). None is historical; no source supplies a piracy share, a mutiny settlement or a wage schedule.

## 1. What the game does today (verified at `f71aba2`)

- **Wages:** `upkeep` per month, 15 D (dhow) and 35 D (junk) (`:1956`, `:1964`), whatever is aboard. At sea `upkeep × calc.months`, up front, turned-back attempts included (`:2391-2392`); in port `upkeep + getEffectiveLayoverFee` per wait (`:2350-2353`).
- **Doldrums:** on a transition-month leg a roll in [p, p + 0.25) costs 20 D (`:2419`, `:2427-2428`).
- **Piracy** (`:2444-2464`), only if the ship did not turn back:
  - probability, in the engine's order (`:2447-2449`): destination risk (Kilwa 0.12, Aden 0.15, Calicut 0.04, Malacca 0.26, Quanzhou 0.10; `:1828-1884`) × (1.5 if cloves or ivory are aboard, `:2445`, else 0.6) × (1.8 at survival, else 1.0); then × 0.2 with marines; then × 0.5 at destination standing ≥ 50. Draw at `:2451`;
  - loss: **one** clove crate, else one ivory lot (`:2452-2457`), else tribute `min(max(0, cash), 75)` (`:2459`), on cash already net of this voyage's wages and any doldrum.
- **Mutiny** (`:2474-2480`): risk max(0, 50 − crew health)/100 (`:2511-2513`), drawn once per `sailTo` after piracy, turned-back attempts included; settlement 2 × upkeep (`:2476`), 30 or 70 D. Crew health falls 8 per month at sea and 12 more on a headwind or a storm (`:2396`, `:2403`, `:2422`), applied before the mutiny draw (`:2472`); it rises 20 per wait (`:2355`), and nothing else restores it.
- **Buying** is capped by cash and free tonnage (`:2278-2279`); nothing reserves for the wages charged at departure.
- **Ruin:** `advanceTime` ends the campaign when `state.cash < -250` at its end check (`:2504`), in any month. `finishCampaign` liquidates at month `min(23, monthIndex)` and logs "Month 24 Liquidation" **only for goods aboard** (`:2692-2697`). Net = cash − `state.startEquity` (`:2709`, `:2099`).
- **Difficulties** (`:1969-1974`): easy "Coastal Guild Apprentice" 3,000 D, no debt, storm damage × 0.5, fees × 0.6 (Kilwa's fee 12 D); normal 1,500; hard 800 with 500 debt; survival 600, damage × 2, fees × 1.1, piracy × 1.8.
- **Known defects touching these outcomes** (`tests/03/README.md`): **D01** arrivals at 25–26 credited; **D03** freight tally counts loaded cargo; **D07** a ruin is logged as liquidation. D02 and D08 touch no measure here.
- **The Atlas adapter** decodes each voyage's draws by position (`:3593-3597`), searches the voyage's log entry (`:3600`) and reads the pirate outcome from its text (`:3601`, and the event pattern at `:3453`: "Corsairs …", "Paid N D pirate tribute"). The draw positions are unchanged by every rule here (§2). A changed raid must keep that wording or update the adapter in the combined change.

**The seed (owner, 2026-11-24).** A real play of the junk on easy ended at 88,869 D (+2,862 %): a net of 85,869 D on 3,000 D. The itemised flat costs sum to **1,680 D** (wages at sea about 700; 2 mutinies 140; 1 pirate lot about 390; doldrums 20; specialists 430, i.e. all three: 180 + 160 + 90). The owner's total of about 1,900 D implies about 220 D of port stays, not itemised. About 2 % of the gain. **The owner hired all three specialists; no player in this study hires any.**

**What scaled costs can and cannot do.** A cost proportional to **cargo** (P, M) or to **tonnage** (W) lowers the value of a month (λ) by a fraction and cannot bound wealth. A cost proportional to **cash** (T) is a wealth tax: with raids at a monthly rate π and share τ, wealth growth λ − τπW stops near a ceiling **W\* ≈ λ/(τπ)**. Illustration (an assumption, not a measurement): a junk with valuables aboard on legs into Quanzhou (p = 0.15) at about 0.4 departures a month has π ≈ 0.06, so W\* ≈ 27,556/(0.06 τ): about 4.6 million D at τ = 0.1 and 1.5 million at τ = 0.3, above what a junk reaches in 24 months in the published plans (about 0.6–0.8 million). So T can bound wealth in principle, but within the campaign it mostly acts as a growing cost. The question is therefore not whether these rules "end the runaway" but whether they **change what a player does**.

## 2. Rules under study

**Design principle: change severity, never frequency.** No rule changes a probability, a draw, its key or its position in the voyage. Only what an event costs changes.

**Form: today's cost is the floor** for every rule (owner decision 4 for raids; **OWNER**, recommended, for W and M).

| ID | Rule | Replaces | Exact change (research copy; each replacement asserted to match exactly once) |
| --- | --- | --- | --- |
| **Raid** (P, T and both) | today's floor, a cargo share and a cash share, whatever is aboard (owner decisions 2 and 4; the reviewer's form R1) | `:2452-2461` (both branches) | (1) lots L_g = floor(*s* · q_g) of every good aboard; (2) if cloves or ivory are aboard and the L_g are worth less than today's lot (one clove crate, else one ivory lot), the cargo loss is today's lot instead; (3) X = min(max(0, cash), max(75, floor(τ · max(0, cash)))), cash read where today (after wages and any doldrum); (4) the raid takes the **larger in value** of the cargo loss from (1)–(2) and X (ties: X). **P** = (*s* on the grid, τ = 0); **T** = (*s* = 0, τ on the grid); bundles set both. The probability, including its 1.5/0.6 cargo factor, is unchanged |
| **W** | wages rise with tonnage | `:2391`, `:2351` | monthly wage = round(upkeep · (1 + β · u / capacity)), u = tonnes aboard when the action starts (after purchases for a departure); charged where today's wage is; mutiny keeps 2 × base upkeep |
| **M** | mutiny settlement as a cargo share | `:2476-2477` | L_g = floor(μ · q_g); if their value ≥ 2 × upkeep the crew takes them and no cash, else 2 × upkeep cash, as today |

- **Valuation, one convention everywhere** (comparisons inside a rule, C, avoidance, the planner): `getLivePortPrice(good, port after the voyage, min(23, departure month + calc.months))`, the sale price without tariff. The port after the voyage is the destination, or the origin after a turn-back.
- **At *s* = τ = 0 the raid rule is today's raid** in every case: with valuables aboard, (2) gives today's lot, worth at least 138 D (the cheapest clove price, at Malacca: 150 × 0.92), more than X ≤ 75 D; with none, the cargo loss is zero and X is today's tribute. Check C2(j) tests this exhaustively.
- **The bait never pays.** Under v1's T a ship with large cash could carry one clove crate (about 155 D) so that a raid took the crate instead of a cash share, once τ · cash exceeded about 1,550 D. Under the raid rule a single crate has floor(*s* · 1) = 0 lots, so it brings in today's lot; the raid then takes the larger of that crate and X. Adding a crate therefore never lowers a raid's cost (equal when X ≥ the crate's value, higher otherwise), and it raises the raid probability (factor 1.5). Check C2(g).
- **Unchanged:** every probability, `computeTransit`, prices, tariffs, fees, debt, storms, turn-backs, porcelain, mildew, repair, specialists (`:2321-2333`).

## 3. Results already seen (not blind) and the arithmetic

**Seen before drafting** (2026-11-24):
1. `AGENTS.md`; `.claude/skills/game-change-review/SKILL.md`.
2. The depth-and-liquidity protocol in full, with every §9 entry and the owner's C6 ruling ("C6 observed after every sail and wait (after credit), all arms").
3. Its results in full: junk/dhow 2.2–2.4 with no depth; the pooled-cap flip at 120 t on arrival-only selling; L-arm medians by cell; **ruins** (0 at *k* = 0 in all 8 L cells; 11/300 junk *sail always* normal at *k* = 1 under G; 1/300 at *k* = 2; 0 in all 48 harness cells); reserve cost ≤ 0.18 %; C1b's "no ruin in 10,800"; B1's ratios (0.9076, 0.9131).
4. Unfunded departures (`research/03/results/2026-11-24-unfunded-departures/results.md`).
5. Adaptive routes results, hazards-off and hazards-on tables (read as the "hazards results"; no other hazards directory exists at `f71aba2`).
6. The specialist-pricing protocol (registered with #31), in full.
7. The storm-seasons draft (#39): §1–§4, §5.2–§5.4 (its timings: one re-planning campaign 68–118 ms, one harness campaign 0.6–1.5 ms, R's `solve` 5.7 ms, "about 18–20 states" per re-planning campaign), §9–§11.
8. `tests/03/README.md`.
9. Code: the engine lines cited; `research/03/models/adaptive-routes.mjs` (`Sim`, `planBuys`, `deliver`, `solve`, `harnessSim`, `replanRun`); `tests/03/baseline-harness.js:60-125`; `economy-skeleton-params.json`; the adapter lines in §1.
10. The owner's play (§1).
11. v1 and v2 of this protocol and their two reviews, including the reviewers' arithmetic (the 0.195 fill threshold; r = 0.028 at crew 54; the wealth-tax ceiling).
12. **Two timing pilots** (§8), flat rules only: they printed mean and maximum solve times per cell, the published solver's time from month 0, and (v3) peak resident memory per process. Nothing else.
13. **Not seen:** any run under a share rule, any per-campaign mutiny or piracy count (the published files don't record them), any easy-difficulty run, any reading note in `research/03/literature/`.

**Arithmetic on constants** (base prices; λ from `economy-skeleton/results.md`, seen):

| Quantity | dhow | junk |
| --- | --- | --- |
| Full clove hold at Quanzhou's base price (620) | 74,400 D | 186,000 D |
| Today's lot as a share of it | 0.83 % | 0.33 % |
| Expected raid loss per laden Quanzhou leg (p = 0.15), today | 93 D | 93 D |
| … P at *s* = 0.01 / 0.03 / 0.1 / 0.3 (for *s* = 0.01, today's lot is the floor for the dhow) | 112 / 335 / 1,116 / 3,348 D | 279 / 837 / 2,790 / 8,370 D |
| λ, capacity-limited value of a month | 11,500 D | 27,556 D |
| Extra wage per month, full hold, W at β = 1 / 3 / 10 / 30 | 15 / 45 / 150 / 450 D | 35 / 105 / 350 / 1,050 D |
| … at β = 30 as a share of λ | 3.9 % | 3.8 % |

- **Piracy with valuables aboard:** Kilwa 0.18, Aden 0.225, Calicut 0.06, Malacca 0.39, Quanzhou 0.15; halved at standing ≥ 50. Without: × 0.4 of those.
- **T.** A raid at τ costs τ · cash on any leg, valuables or not. At τ = 0.1 and cash 300,000 D, 30,000 D per raid; expected 4,500 D on a leg into Quanzhou with valuables aboard. The ceiling W\* is in §1.
- **Mutiny.** A ship that never waits has health 100 − 8m after m sea months (less 12 per headwind or storm): risk 0 until m = 7 (0.06), 0.5 from m = 13. Keeping health ≥ 50 needs about two waits per five sea months, about 29 % of the calendar in port. M's expected loss at risk 0.5: 0.5 · μ · hold value, 930 / 2,790 / 9,300 / 27,900 D per leg for the junk's clove hold at μ = 0.01 / 0.03 / 0.1 / 0.3: about 0.7 / 2 / 7 / 20 % of a Malacca→Quanzhou delivery's margin (300 × 465 = 139,500 D). **Resting the crew can pay only near μ = 0.3**, and partial resting is a real choice there, which is why M is the rule most likely to change decisions and why the outcome is open.
- **Mutiny risk is convex in health.** A storm (probability q on a dead-zone leg) takes 12 more health before the draw, so the expected risk on a leg is (1 − q) · r(h) + q · r(h − 12), h the health after the leg's ordinary loss. At h = 54 on a dead-zone leg (q = 0.35): 0.65 × 0 + 0.35 × 0.08 = **0.028**, not r(54 − 4.2) = 0.002.
- **W at the transition.** The published fill keeps 60 D (`baseline-harness.js:97`; `planBuys`, `adaptive-routes.mjs:134-169`) and wages are charged after buying. A junk departing with 60 D on a 3-month leg pays 105 + 1,050 f D at β = 10, f the share of the hold filled, so it ruins if **f > 0.195** (60 − 105 − 1,050 f < −250); at β = 3 a full hold needs at least 170 D after buying. Under today's wages the worst voyage costs a junk 265 D (175 wages + 20 doldrum + 70 mutiny), which the floor absorbs from 60 D. W is negligible late (≤ 3.9 % of λ at β = 30) but can ruin **G's wage-blind 60 D reserve** at the transition.

Predictions resting on items 3, 5, 7, 11 or λ are marked **informed**.

## 4. Method

### 4.1 Question and outcomes

**Primary question (owner decision 1): do scaled costs make players act differently?** The four behaviours the owner named, plus ship choice:

| Behaviour | Measure (L-EV, paired by seed, variant − flat) |
| --- | --- |
| **Rest the crew** | voluntary port months per campaign: waits taken in a month when the policy allowed a departure from that port; and mean crew health at departure |
| **Avoid pirate waters** | mean engine piracy probability per departure with valuables aboard (from the state before the leg, without marines); share of laden departures into Malacca, Aden or Kilwa |
| **Carry less or change cargo** | mean hold value at departure (valuation convention, §2); share of that value in cloves and ivory |
| **Standing** | share of laden departures into a port where standing ≥ 50 |
| **Ship choice** | junk/dhow ratio of median S-nets per difficulty; share of seeds with junk > dhow; any reversal |
| **Decision flips** (descriptor) | §4.7 |

**Most likely null:** P and T leave behaviour within noise; M changes resting only at μ = 0.3, if at all; ship choice does not move.

**Secondary: the profit cut.** W(t) = cash + cargo at cost basis − debt, after the last action whose **resulting** month (monthIndex after its advance) ≤ t. Each cost is attributed to the action's resulting month. Late = actions after the one that defines W(12); early = actions with resulting month ≤ 6.
- **R_late** = 1 − Σ_seeds ΔW_late(variant) / Σ_seeds ΔW_late(flat), ΔW_late = W(24) − W(12), over the same seeds (a ratio of paired sums); the number of seeds with ΔW_late(flat) ≤ 0 is reported. R_late includes what avoidance costs (waiting, rerouting).
- **C** (running cost): wages, layover fees, doldrums, raid cash, mutiny cash, and lots lost to raids or mutiny at the valuation convention. Jettison, porcelain, mildew and repair are reported separately.
- **K_late** = Σ C_late / Σ (C_late + ΔW_late), over seeds (descriptor). K_early, R_early likewise.
- **Avoidance** A = 1 − R_late(re-optimised) / R_late(static). *Static* replays the flat run's logged actions under the variant with the same keyed draws: the logged buy quantities, capped by the engine at `:2278`, with every cap event counted.

**Early fragility (guardrails).** **Ruin** = cash < −250 at `advanceTime`'s end check (`:2504`), in any month; the ruin month is monthIndex after the advance; **early ruin** = ruin month ≤ 12. **Floor breach** = cash < 0 after every sail and wait, all arms (owner's C6 ruling; with no settlement delay there is no credit to order); the lowest cash inside a wait before the port story's credit is disclosed, not gated. **W(6) change** = Σ W(6)(variant) / Σ W(6)(flat) − 1.

### 4.2 Players and arms

| Arm | Player | Hazards | Rules | Why |
| --- | --- | --- | --- | --- |
| **L-EV** | crew-aware expected-cost re-planner (below) | on, keyed | §8 | the feasible good player; can reroute, rest and build standing |
| **H** | the published harness, research copy (`baseline-harness.js:87-122`) | on, keyed | all variants; W with G and G+ | the myopic published harness: cost-blind except the wage it is charged; N = 1,000 |
| **D-W** | the published hazards-off DP with W in its planning `Sim`, engine-replayed | off | flat and W, G and G+ | W is deterministic, so the response is exact here |

**L-EV** (owner decision 3):
- **Decisions.** As `replanRun` (`adaptive-routes.mjs:306-329`): at each decision point it sells, solves, and executes the first action. A wait is one action; a delivery is a whole path of 1–3 legs, executed with its policy waits and turn-back retries before the next solve. It does **not** re-plan after every event inside a delivery.
- **Labels.** At each (port, month) node it keeps every label not dominated on **(cash, crew health, standing flags)**: a dominates b if a's cash ≥ b's, a's crew ≥ b's, and a's set of ports with standing ≥ 50 contains b's (one flag per port). A new label that an existing one dominates, **including an exact tie, is discarded**: ties keep the first label found. Terminal choice by S-net, strict ">", first found wins.
- **Expected costs in the planning state**, under the rule in force, flat included, on each planned sail:
  - **raid:** E = p × the rule's loss at the planning state (§2, steps (1)–(4), with floor(*s* · q) applied to the planning q). If the rule takes lots, cargo_g falls by p · (the lots taken); if cash, cash falls by p · X. Under flat, p × today's lot or tribute, the same way;
  - **mutiny, two-point** (convex risk, §3): with h the planning crew after the leg's ordinary loss (8 per month, 12 on a headwind) and q = stormProbability on dead-zone legs (else 0), expected risk r̄ = (1 − q) · r(h) + q · r(h − 12). Cargo falls by r̄ · floor(μ · q_g), or cash by r̄ · 2 · upkeep, by the M rule. The same form is used for M's cash and lots, and under flat;
  - **the label's crew** is then h − 12q (the expected storm loss), carried to later legs; this is the crew the dominance rule compares;
  - **doldrum:** 0.25 × 20 D on dead-zone legs;
  - fractional lots carry across the legs of one delivery and are sold at its final port by `sellAll` at fractional quantity; values use the valuation convention.
  - Turn-backs and storm hull damage stay as in the published hazards-off planning; mutinies on turned-back attempts are not anticipated.
- **What it cannot see.** `planBuys` (`adaptive-routes.mjs:134-169`) fills by projected price and ignores expected costs, so the planner changes cargo only by changing the destination. **Decision measures for P and T are lower bounds** (§11).
- **No cost-blind re-planner.** It enters only as identity checks (C1, C1b).
- **H and #41.** H cannot refuse a lane; its floor breaches are a property of the harness. Under W it ranks lanes with the wage the engine will charge for the planned cargo.
- **Fills.** G = published (keep 60 D) everywhere. For W only, G+ also: a lot is bought only if cash after it ≥ 60 D + the leg's wages at the post-purchase tonnage; G+ runs under flat too.
- **Specialists:** none hired.

### 4.3 Grid (fixed now; not selected on any output)

| Parameter | Values | Basis |
| --- | --- | --- |
| *s*, τ, μ | 0.01, 0.03, 0.1, 0.3 | the 1–3–10 series; *s*, μ < 1 so a share never empties a good; starts just above today's lot shares (0.33 %, 0.83 %). The upper end was checked against §3's arithmetic: **informed by arithmetic on seen λ**, by no run |
| β | 1, 3, 10, 30 | the same series |
| Bundles | B1 (*s* = τ = μ = 0.03), B2 (0.1) | grid values 2 and 3; H only |

### 4.4 Cells, seeds, terminal rule

- **Difficulties:** easy (the owner's setting; never run before), normal, hard. L-EV: easy and normal (§8); hard is H and D-W only. Survival: H only, exploratory.
- **Policies:** L-EV *avoid headwind*; H *sail always* and *avoid headwind*. Start Calicut.
- **Seeds:** L-EV N = 150 (owner decision 3), **600001–600150**; H N = 1,000, 600001–601000; disjoint from earlier runs (#44 300001–300300, specialists 400001–400300, #39 500001–500300). All variants use the same seeds.
- **Terminal rule (OWNER, recommended):** **S-net scored** (strict months 0–23; #44 §4.1), planners solved for it; **E-net reported**. **D03:** this study's own cargo ledger. **D07:** ruin recorded by a wrapper on the end check, never from log text.

### 4.5 Keyed draws and what pairs

- *u* = the first output of mulberry32(FNV-1a-32(`seed|role|month|key`)); `sailTo` keyed by (departure month, origin, destination), `waitInPort` by (month, port), as #44 §4.6; the keyed source reinstalled after every reset.
- **Roles at `f71aba2`** (research loader `lineOffset: 1776`, so stack lines equal file lines; regenerated and compared, C4): story occurrence 2360, story pick 2361, headwind damage 2404, turn-back 2408, teak 2411, transition roll 2419, storm damage 2423, mildew 2438, piracy 2451, mutiny 2475.
- **What pairs.** Draws pair by key. **Events pair only until the first action at which a guard input differs:** turnedBack, teak > 0 (`:2411`), textiles > 0 (`:2438`), hasHighValue (`:2445`), or mutinyRisk > 0 (crew). Even on one action list, guard inputs can diverge: buys capped by cash (`:2278`) differ once cash differs (T, W, M's and the raid's cash parts); a raid that takes cash where flat takes a ship's last crate (or the reverse) changes hasHighValue; and W lists end at a ruin. floor(*s* · q) < q itself never empties a good. Re-optimising players diverge further after their first different action.

### 4.6 Analytic predictions for P and T, frozen before any variant run

Owner decision 1, as corrected by the v2 review. The script `predict` is committed with the code before any run. After the **flat** H and L-EV runs, and **before any variant run**, it computes for each P and T grid value and each cell, from the flat ledgers alone:
- **Events, not expectations.** It walks each flat run's ledger in order. At each **realised** raid it computes the variant's loss at that state, with **cash carried forward**: the variant's cash at that raid = the flat cash − the cumulative extra cost so far (so T's base shrinks as it would in play), floored at the engine's own rules (X uses max(0, cash)). Cargo is taken from the flat ledger. extra = variant loss − flat loss (valuation convention). Draws pair by key, so these are the variant's own raids for as long as guard inputs agree (§4.5).
- **R_late^pred** = Σ_seeds extra_late / Σ_seeds ΔW_late(flat);
- **K_late^pred** = (Σ C_late(flat) + Σ extra_late) / (Σ C_late(flat) + Σ ΔW_late(flat)).

The table and its SHA-256 go into §9 before any variant run, with **N8's exposure table**: per L-EV cell, the share of flat departures with crew < 50 (the states where M can bite).

**What the gap means.** Measured − predicted contains (i) compounding through cash-capped buys, (ii) guard divergence after the first differing guard input, and (iii) any change of route or timing. For H, (iii) arises only through state, so S1/S2 test the arithmetic. For L-EV, the gap is reported as the behavioural part, beside the static replay's R_late (A, §4.1).

### 4.7 Decision flips (descriptor)

- **States:** L-EV's decision points in its flat runs, easy and normal, seeds 600001–600010 (about 18–20 per campaign, #39's count; about 760 states). Identical states solved once.
- For each L-EV variant run: a_flat, a_var; Q_var(a) = the variant's planning S-net of the best plan starting with a (forced first action).
- **Flip:** Q_var(a_flat) < Q_var(a_var) − m_v. **m_v = wages + Kilwa's fee at standing < 20 at that difficulty**: one month in port at the cheapest port, the smallest cash cost of the cheapest alternative to sailing (a physical scale of the game). Normal and hard 35 D (dhow) and 55 D (junk); easy 27 and 47 D (Kilwa's fee 12 D). Reported also at m = 1 D, 2·m_v and 1 % of Q_var(a_var).

### 4.8 Checks, run before any result is read

Planted defects go into a temporary copy of the research code (C9: a temporary clone). If C1–C10 fail, nothing is scored, and the fix is reported with both outputs. Expected values come from the engine's own state change or hand-worked cases, never from a copy of the expression under test.

| # | Check | Pass | Planted defect that must make it fail |
| --- | --- | --- | --- |
| C1 | **Identity, published.** Research `sailTo`/`waitInPort` at flat; H copy; L-EV in identity mode (expected terms off, cash-only labels, E-net terminal). Seed-stream feed as `harnessReset` (200001–200300) | The 36 published hazards-off logs replay action for action; all 10,800 hazards-on nets in `adaptive-routes/hazards-on.json` exactly | (a) the research `sailTo` charges 1 D extra on the first mutiny; (b) L-EV with terms "off" still subtracts the 5 D doldrum term |
| C1b | **Identity, #44 keyed.** L-EV identity mode, G, *k* = 0, #44's keyed grammar and seeds 300001–300300, its 8 L cells | Every per-seed net in `depth-liquidity/liquidity-perseed.csv` for (G, *k* = 0) | the key's month field read after the advance |
| C2 | **Rule arithmetic**, hand-worked engine cases, the relevant draw forced: (a) raid, P, *s* = 0.03, junk with 217 cloves + 40 pepper (297 t), cash 50: 6 cloves and 1 pepper lot; (b) raid, P, *s* = 0.03, 20 cloves, cash 2,000: lots floor(0.6) = 0, so today's crate (worth more than X = 75); (c) raid, T, τ = 0.1, no cloves or ivory, cash 2,000 before a 3-month non-transition junk leg (105 D wages): 189 D, **on cash after wages**; (d) W, junk with 150 t, β = 3, 4-month leg: 88 D a month, 352 D; (e) M, μ = 0.1, 30 cloves arriving at Quanzhou in a month priced 595 (departure + months ∈ {3, 11, 15, 23}): 3 crates, no cash; (f) M with 5 cloves: 70 D; **(g) bait:** a state with no cloves or ivory (10 pepper lots), one clove crate **injected into state with cash unchanged**, forced raid: at cash 20,000 under T 0.1 and B2 the cost is equal with and without the crate (X = 2,000); under P at *s* = 0.03 (lots floor(0.3) = 0, X = 75) and under flat it is higher with the crate; at P *s* = 0.3 it is equal (3 pepper lots, about 930 D at Quanzhou, already outweigh a crate); **the pass condition is "never lower with the crate"** in every rule; (h) P, *s* = 0.1, cash 50, dead-zone leg with 30 textiles, mildew forced: 29 textiles at the raid, 2 taken; (i) **thresholds:** p computed from engine constants **in the engine's order** (`:2447-2449`); piracy draws at p − 10⁻⁹ (raid), exactly p (none) and p + 10⁻⁹ (none), including a destination at standing 55; mutiny likewise at r with crew 46 (r = 0.04); **(j) identity at *s* = τ = 0:** for every cargo state (cloves only, ivory only, both, pepper only, empty) × cash (−40, 0, 40, 75, 76, 10,000), the forced raid's state change equals the original engine's | Exact | (i) `floor` → `round` (a takes 7 cloves); (ii) tribute share on cash before wages (c gives 200); (iii) W reads capacity (d gives 140 a month); (iv) P computed before the mildew step (h takes 3); (v) the floor dropped (b takes 75 D; f takes nothing); (vi) the raid keeps v1's branch on valuables (g differs); (vii) `<` → `<=` in the piracy comparison (the draw at exactly p raids); (viii) the standing ≥ 50 halving omitted (the standing-55 draw at p + 10⁻⁹ raids); (ix) step (2) applied without the valuables condition (j: pepper-only loses a crate it doesn't have, or the state differs; this plant can go unseen if the missing lot is coded as a loss of 0, hence (x)); **(x) X computed without `max(0, ·)`**: caught by (j)'s cash grid whatever the lot coding. Worked by hand at *s* = τ = 0, pepper only, cash −40: the original engine takes min(max(0, −40), 75) = 0; the plant takes min(−40, max(75, floor(0 · −40))) = −40, so the raid adds 40 D and the state differs (cash −40 → 0). Also at cash −40 with cloves aboard: the crate (≥ 138 D) still beats X = −40, so that row passes, and the pepper-only and empty rows fail |
| C3 | **Severity only.** The 36 hazards-off logs and 100 keyed hazards-on H action lists, replayed under every variant | Draws and events agree at **every action where the guard inputs agree**; for each variant, the count and first month of guard divergence are reported; W lists are excluded after a ruin | the P copy multiplies the piracy probability by (1 + *s*) |
| C4 | **Keyed draws:** #44 C4 (i)–(v), roles by stack line (`lineOffset` 1776); forced turn-back reports 2408 | All hold on every hazards-on action | (a) variant id in the key; (b) piracy and mutiny roles swapped; (c) keyed source not reinstalled after `harnessReset` |
| C5 | **Ledger and conservation.** Per action, Δcash = engine charges recomputed independently + rule charges; per run, loaded = sold + liquidated (by the rule) + unsold at deadline + lost by cause; C from the ledger = C from the log | Exact in every run | mutiny lots in kind not booked as lost |
| C6 | **Ruin and the floor.** (a) Junk with 30 teak lots (300 t), 60 D, β = 10, a 3-month leg starting at month ≤ 20: 1,155 D of wages, cash −1,095, **ruin** with ruin month < 24, and a "Month 24 Liquidation" line (D07). (b) Junk departs with 30 D on a 3-month leg (−75 D after the sail) and sells cargo on arrival back above 0: a breach recorded. (c) Dhow waits at Kilwa (normal) with 20 D: −15 before the story's +20 D, +5 after: **no** gated breach; −15 disclosed | (a) ruin; (b) one breach; (c) zero breaches, −15 disclosed | (a) ruin read from log text; (b) cash read only at decision points (misses b); (c) cash read before the story credit (flags c) |
| C7 | **Expected terms, term by term.** For 5 fixed *avoid headwind* action lists with no textiles, teak or porcelain, 1,000 keyed seeds each, flat and every share rule (13 rules): for each term (raid lots, raid cash, mutiny lots, mutiny cash, doldrum) and each action, the planner's expected term **computed from the engine state before the action** (mutiny in the two-point form over the storm; the mutiny-lots term also two-point over the raid, since the raid comes first: (1 − p) · floor(μ · q_g) + p · floor(μ · (q_g − raid lots_g)), which removes a floor bias of about 0.3 SE) vs the engine ledger's realised term. L-EV's planning uses the same form. **Scripted:** crew 54 after the leg's ordinary loss, dead-zone leg, no navigator: the planner's expected risk equals 0.028, from engine constants | **About 65 tests** (5 terms × 13 rules). Each passes if the mean of (realised − expected) is within **±4.1 standard errors** of 0 (Bonferroni: family-wise false-fail rate about 0.3 %), and within ±1 D where the SE is below 1/4 D. Tests outside ±3 SE are reported as descriptors (at 3 SE with no correction the chance of at least one false fail would be about 16 %). The scripted case is exact | (a) the planner uses factor 0.6 for high-value cargo; (b) the mutiny term evaluated at the expected crew h − 12q instead of the two-point form (the scripted case gives 0.002) |
| C8 | **Terminal rules:** #44 C7's three scripted runs | As #44 C7 | S counts goods in transit |
| C9 | **Game untouched:** #44 C8 as amended (real-path hash before and after every phase; outputs held until it passes); engine suites and `planted-defects.mjs` pass | Same hash; suites pass | `index.html` modified during a phase on a temporary clone |
| C10 | **Crew-aware planner.** Two scripted states, each starting at month ≥ 17 so that an independent brute-force enumeration of every action sequence to month 23 is feasible; the number of branches enumerated is reported. (a) **Rest:** M at μ = 0.3, crew 46, chosen so that brute force finds *wait* first strictly best and a sail-first and a wait-first label meet at one node, the wait label with less cash and more crew. (b) **Standing:** P at *s* = 0.3, chosen so that brute force finds building standing at Malacca (waits that take it to ≥ 50 before a laden arrival) strictly best; the scripted start may set Malacca's standing at 35–45, so that one wait (+15) reaches 50. Also: L-EV in identity mode equals the published `solve` on 106 states | L-EV chooses the brute-force first action in (a) and (b); identity equal | (a) **dominance on cash only**; (b) **standing flags omitted from dominance**. Each case is accepted only after its plant has been shown to fail on it |

**Order:** C9, C4, C2, C3, C5, C6, C8, C7, C10, C1, C1b; then flat H, flat D-W and flat L-EV; then `predict` and the exposure table (§4.6, logged in §9); then the variant arms; then decision flips; then scoring.

## 5. Predictions and what would count against them

S-net; paired by seed; "each cell" = each ship × difficulty (× policy for H) named.

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| **S6** (primary) | **Mutiny-share at μ = 0.3 makes the planner rest the crew.** L-EV: paired median voluntary port months per campaign rise by ≥ 1, and mean crew health at departure rises, for at least one ship at easy or normal | informed (λ, crew arithmetic, §3) | neither ship in either difficulty meets both. **Untestable** (not contradicted) if the exposure table (§4.6) shows fewer than 5 % of flat departures with crew < 50 in every L-EV cell |
| **S7** (primary) | **Below that, and for raids, behaviour doesn't change.** L-EV, at the values run: (a) M at μ ≤ 0.1: **paired median** of voluntary port months within ±1 of flat in each cell (M 0.01 may be dropped by fallback, §8); (b) P and T at 0.3: mean piracy probability per laden departure within ±0.02 of flat, and mean hold value at departure within ±5 %, in each cell | informed (§3: resting pays only near 0.3; `planBuys` ignores costs) | any clause fails in any cell |
| **S8** (primary) | **Ship choice holds.** Junk/dhow ≥ 1.5 in every L-EV variant and cell; no reversal in any H easy or normal cell | informed (2.2–2.4) | any ratio < 1.5; any reversal |
| S1 | **The raid profit cut is the arithmetic.** H, **easy and normal, both policies**, every P and T value: measured R_late within ±2 percentage points of R_late^pred (§4.6). Hard and survival reported as descriptors; L-EV's gap reported as the behavioural part | informed (owner's tolerance) | outside ±2 in any named cell; reported also at ±1 and ±4 |
| S2 | **Incidence likewise:** measured K_late within ±2 points of K_late^pred, same cells | informed | as S1 |
| S3 | **Wages bite only through the fill.** (a) H and D-W with G+: R_late < 5 % at every β, every cell. (b) H with G: at β ≥ 10, ruins exceed flat by ≥ 10 per 1,000 in at least one easy or normal cell | (a) informed (≤ 3.9 % of λ); (b) informed (G's wage-blind 60 D reserve; f > 0.195, §3) | (a) any cell ≥ 5 %; (b) no such cell |
| S5 | **Early fragility unchanged** for every P, T, M variant and bundle: H early ruins ≤ flat + 2 per 1,000 in every H cell; L-EV ruins ≤ 1/150 per cell; W(6) change ≥ −2 % in every L-EV cell | informed (#44's zero ruins at *k* = 0; §2's construction) | any bound fails. **Descriptors** (reported, not scored): + 1 and + 5 per 1,000; 0 and 3/150; −1 % and −5 % |

**Validation, not predictions:** C1–C10. **Reported, not scored:** M's R_late and K_late; W's behaviour; bundles; decision flips (§4.7); avoidance A; the L-EV gap to `predict`; events; hard (H, D-W); survival (H); D-W×depth (§7).

**Decision rule (reported whatever it shows):**
- **S6 supported:** a mutiny cost that scales with cargo makes the planner rest its crew, so the rule changes a decision a student also faces. Contradicted: even at μ = 0.3 the planner sails on and pays.
- **S7 supported:** P, T and M below 0.3 act on this planner as costs, not as decisions; for P and T this is a lower bound, because the fill ignores costs. Contradicted: report which behaviour moved, by how much and where.
- **S8 contradicted:** scaled costs are not ship-neutral; cells reported for the combined change.
- **S1, S2 supported:** for raids, the profit cut is predictable from the flat route ledger, so its size is a value choice, not a measurement. Contradicted: compounding through buys or guard divergence matters; the gap is reported per cell.
- **S3:** (a) supported: W is irrelevant late. (b) supported: **W requires the engine to show or guard the departure wage**, whatever its β.
- **S5 contradicted:** that rule is not eligible under §6.

## 6. The owner's adoption rule (not a finding)

The study proposes; the owner decides. Fixed now so no value is chosen by feel.
- **Selection on R_late** (owner decision 5): the profit removed, avoidance included. **Target R\* = 10 % (informed:** set with the owner's 2 % and §3's arithmetic in view; a value judgement**).** A rule's **candidate value** is the smallest grid value at which R_late ≥ R\* in every H easy and normal cell **and** in every L-EV cell where that value was run, with S5's guardrails holding at it (under W, S3(b)'s ruin bound not exceeded with G+). No value qualifies: "no candidate". No interpolation, no grid extension.
- **Descriptors:** the candidate at R\* = 5 % and 20 %, and under S5's looser and stricter guardrails; K_late at every candidate.
- **Predicted candidates (arithmetic, §3; informed):** P 0.3 or none; T 0.1 or 0.3 (a cash share grows with wealth); M 0.1 or 0.3 (resting, if it happens, still costs profit and so counts in R_late); W none.

## 7. Depth (OWNER; recommended: off)

All arms run with no depth (today's game). Interactions by arithmetic: held lots under depth sail again and meet the raid rule twice; waits to sell cost more under W and restore crew (+20 each), lowering M's exposure. One exploratory arm: D-W×depth, hazards off, W only, at the interaction setting #44 registered before its results and never ran (S2, pooled, hard cap, Q_t = 150 t, *r* = 0.25, *m* ≤ 2), both ships, normal, G and G+, every β.

## 8. Run size, time and stopping

**Timing pilots (flat rules only, drafting machine, Windows 11, Node 24.22.2).** A scratch prototype of the crew-aware Pareto solver (labels on cash, crew and the five standing flags; flat expected terms, **including the storm crew term**: in v2 as 12 × stormProbability, in v3 in the two-point form of §4.2) was timed at each decision point along its own hazards-off plan, *avoid headwind*, both ships, easy, normal and hard. Nothing was printed but times and memory: no net, cash, action, label count or count of decision points.
- **v2, one process:** mean 74–121 ms per solve by cell, maximum 325–574 ms; the published solver from month 0 took 7.5–25 ms.
- **v3, three processes at once** (one per difficulty; nothing else heavy running): mean 56–96 ms per solve, maximum 279–388 ms; **peak resident memory 120–121 MB per process**, about 0.36 GB for three.
- The prototypes do not include the share rules' terms; a factor of 1.5 is allowed for them.

**Estimate, 3 workers** (owner decision 6; nothing else running). One L-EV campaign ≈ 19 decision points (#39's count) × 56–121 ms + about 0.1 s in the engine = **1.2–2.4 s at flat, up to 3.6 s** under share rules.

| Block | Work | Estimate (3 workers) |
| --- | --- | --- |
| Checks | C1 10,800 campaigns; C1b 2,400; C7 5 lists × 1,000 seeds × 13 rules; C10 brute force; scripted cases; suites | ≈ 20 min |
| H | 24 configurations × 2 ships × 3 difficulties × 2 policies × 1,000 = 288,000 | ≈ 3 min |
| D-W | 10 configurations × 6 cells + 16 depth solves | ≈ 1 min |
| Flat L-EV, then `predict` and exposure | 4 cells × 150 = 600 campaigns | ≈ 4–8 min |
| Variant L-EV, core | M 0.1, M 0.3, P 0.3, T 0.3: 4 × 4 × 150 = 2,400 | ≈ 16–48 min |
| Variant L-EV, extended | P 0.03, T 0.03, M 0.03, M 0.01, P 0.1, T 0.1: 6 × 600 = 3,600 | ≈ 24–72 min |
| Decision flips | ≈ 760 states × 10 variants × 2 solves (56–180 ms each) | ≈ 5–15 min |
| **Total** | | **≈ 1.2–2.8 h; cap 3 h** |

- **Workers:** 3 Node processes, each a fixed partition of seeds; outputs are per seed and do not depend on scheduling. Nothing else heavy runs during the study.
- **Fallbacks**, applied in this order whenever the **projected total exceeds 3 h** (projected before each block and after its first 10 %): (1) drop M 0.01; (2) drop P 0.1; (3) decision flips on 5 seeds per cell; (4) drop P 0.03, T 0.03 and M 0.03; (5) drop T 0.1 (kept longest: it is a predicted candidate); (6) **if the projection still exceeds 3 h, run the core block at N = 100** (600001–600100) **and log the overrun**. Step (6) is an **owner-approved exception to decision 3's N = 150**: the owner approved this ladder when choosing 3 workers. Flat runs and every check are never cut. Each cut is logged in §9 before any result is read. S1 and S2 are scored on H regardless.
- **Stopping:** each block runs once; N is not raised; a bug after results means a full rerun, both outputs reported.
- **Statistics:** medians as the element at floor(0.5 × (N − 1)); paired medians of per-seed differences; ratios of paired sums for R, K and W(6); 95 % seed-level percentile bootstrap, 10,000 resamples within cell, seed 20261124; ruins as counts with denominators; attempted, completed, ruined and excluded runs per cell.

## 9. Deviations

Append dated entries below this line before any result that depends on them is reported. Each says what changed, why, and whether results had been seen. The `predict` table and the exposure table (§4.6) are entered here, with their SHA-256, before any variant run.

---

### 2026-11-25 — engine pin, implementation choices and interpretations, fixed before any run (no result seen)

Written with the code (`research/03/models/scaling-costs.mjs`) and committed with it, before any check or scored block was run on a registered or check seed. **No result of this study had been seen.** The development smoke runs disclosed in item 34 printed only pass/fail, counts, hashes and timings.

**Deviations**

1. **The page hash cannot equal the header's; the engine script is pinned instead.** `main` at `e9e1663` (where the run branch was cut) serves `projects/03/index.html` with SHA-256 `6b9a9711…`, not the header's `0b11ae28…`: the page was rebuilt after registration (#49, #53, #56 and the Atlas imports before them). Its one bare `<script>` is still `6fba1ee7…` (62,591 characters), byte-identical to the registered one. The run therefore, as #55 did:
   - loads the page through `tests/03/engine/load-engine.mjs` `engineScript()` and refuses any engine script whose SHA-256 is not `6fba1ee7…`;
   - evaluates it with `lineOffset` 1776, so stack lines are lines of the page at `f71aba2`, and asserts that `sailTo` starts at `:2373`, `waitInPort` at `:2345`, and each replaced block at its protocol line; regenerates the role table from the source and compares it with §4.5's (C4);
   - hashes the page it read before and after every phase (and every worker), and writes a phase's outputs only if the two hashes are equal; C9's "same hash" is read as "unchanged during each phase";
   - records both page hashes in the provenance.
2. **The raid replacement covers `:2452-2462`**, the protocol's `:2452-2461` plus the closing brace of the `else` branch on `:2462`, which belongs to the same block. Every replacement keeps the line count (the raid block 11 lines, W at `:2391` and `:2351`, M at `:2476-2477`), so the copies run under the engine's filename at their own lines. The `waitInPort` log line (`:2369`) prints the wage charged instead of the base upkeep: identical text at flat, and C5's log reading needs it under W.
3. **D-W×depth (§7) is not run.** It needs #44's depth market inside the W planning model and in an engine wrapper on the `f71aba2` numbering, which this code does not port. It is an exploratory, reported-only arm. Dropped now, before any run, so that the registered arms keep the cap; the 16 depth solves are not part of any score.

**Interpretations**

4. **Plants (§4.8).** Each planted defect is a text substitution in a temporary copy of the committed `scaling-costs.mjs`, inside a temporary `git clone` of the run commit. The copy runs only the check concerned (`plantcheck`), stopping at its first failure where the check loops over campaigns; the plant counts as caught if that check reports a failure. C9's plant appends to the clone's page during a short probe phase: caught if the probe exits non-zero and writes nothing; an unplanted probe in the same clone must exit 0 and write (control). C2 (vii), (viii) and C3's plant act on the research copy's text through switches that make a line-preserving replacement.
5. **Today's lot** is 1 unit in the engine (one clove crate, else one ivory lot). In the planner's fractional state it is min(1, q) of that good. A tie between the cargo loss and X goes to X (X ≥ cargo value → cash).
6. **Departures** are every `sailTo` attempt, turned-back attempts included. A departure is laden if tonnage > 0. Its piracy probability is computed from the state before the leg, in the engine's order, without marines. Its hold value is Σ q × the valuation price at the attempted destination in the arrival month.
   - Cell means are pooled over departures (for example, mean crew at departure = Σ crew / Σ departures).
   - A **voluntary port month** is a wait in a month when at least one lane from that port is allowed by the player's policy (*avoid headwind*: not a headwind).
   - S6's "mean crew health at departure rises" compares pooled means, variant > flat.
   - S7(b) uses laden departures, as its text says; the behaviour table's "with valuables aboard" measure is reported beside it. Its hold value is within ±5 % if the pooled mean ratio is.
   - S8: the junk/dhow ratio of median S-nets per difficulty for every L-EV variant that was run (flat reported). An H reversal is a junk median S-net below the dhow's in any H easy or normal cell (every configuration, both policies).
7. **Exposure table (§4.6).** "Share of flat departures with crew < 50" is crew at departure, before the leg. The share whose crew after the leg's ordinary loss is below 50 (where the mutiny draw can happen) is reported beside it as a descriptor. S6's untestable rule uses the registered at-departure share. The table also reports the flat H cells.
8. **W(t)** = cash + Σ cargo × the engine's cost basis − debt after the last action (wait, sail, buy, sell, repair) whose resulting month ≤ t, or before any action. An action resulting at month 25 or 26 (D01) is outside W(24), and its costs count in C_late (the literal reading). C counts wages, layover fees, doldrums, raid cash, mutiny cash and lots lost to raids or mutiny; jettison, porcelain, mildew and repair are reported apart.
9. **Ruin** = cash < −250 at the end check, read on entry to `finishCampaign` (which `advanceTime` calls at its end check), in any month; ruin month = monthIndex then; early ruin ≤ 12. E-net = cash after `finishCampaign` − start equity. S-net = cash on entry − debt − start equity + the liquidation value only if month < 24.
10. **Floor breach** = cash < 0 after a sail or wait completes (after the port story's credit, before any end liquidation). The lowest cash inside a wait (cash before − fee − wage) is disclosed, not gated.
11. **H.** A research copy of `harnessPlay`/`harnessPlan`, run in the host against the engine's functions. Lanes are ranked on the plan made under the fill in force, with wages = months × the W wage at the planned tonnage (today's wage at flat). G+ buys a lot only if cash after it ≥ 60 D + months × the wage at the post-purchase tonnage, on top of G's 60 D cap.
12. **D-W** uses *avoid headwind* (L-EV's policy; §8's "6 cells" are ship × difficulty). G+'s "leg" is the delivery's first leg, which departs at once in the DP. The terminal is S-net. Each plan is executed with engine-exact accounting and replayed through the research engine with every draw 0.99, compared after every action.
13. **L-EV** as §4.2:
    - h = max(0, crew − 8m − 12 × headwind); the storm probability is the engine's without a navigator (0.35); the label's crew is max(0, h − 12q);
    - the expected terms use the planning cash after the leg's wages and the expected doldrum;
    - the fill is `planBuys` *greedy*, as in the published `replanRun`;
    - identity mode has no terms, cash-only labels and an E-net terminal.
14. **Static replay (A).** The flat L-EV run's engine calls (sell all, buy with the quantity actually bought, repair, wait, sail) are replayed under the variant with the same keyed draws. A buy the engine caps is a cap event, counted with the lots refused.
15. **C1** has four parts:
    - each published hazards-off `actionsLog` (36) replayed through the research engine, with cash, month, port, debt and end compared after every action, and its net;
    - the 18 published hazards-off harness nets;
    - L-EV in identity mode, solved from month 0 with hazards off, reproducing the published greedy decisions and planning net in all 18 cells;
    - the 10,800 hazards-on nets (H copy and L-EV identity, seed stream).
16. **C1b** compares both E- and S-nets per seed with `liquidity-perseed.csv` for the 8 (G, *k* = 0) cells.
17. **C3.** The 100 keyed H lists are flat H (G) runs on check seeds 200001–200100, cycling through the 12 (ship × easy/normal/hard × policy) cells. Each list and each of the 36 published hazards-off logs is replayed under flat and under each of the 18 variants. At each wait or sail the draws served and the events are compared until the first sail whose guard inputs (teak > 0, textiles > 0, valuables aboard, crew health) differ. The events are turn-back, storm, doldrum, jettison, mildew, porcelain, raid, mutiny and the story credit.
18. **C4.** Every keyed run in every phase applies (i)–(v); failures are counted and reported per phase. The checks-phase sample is in `checks.json`.
19. **C5**:
    - the sample is 280 H campaigns (7 rules × 2 ships × 2 policies × 10 seeds, normal) and 3 L-EV campaigns;
    - "C from the log" parses the engine's log lines (wages, layover, doldrum, tribute, settlement, and the lots named in the raid and settlement notes at the valuation convention).
20. **C7**:
    - the five lists are built here with H's fill restricted to pepper, cloves and ivory, never waiting except when no lane is allowed, hazards off;
    - the seeds are 700001–701000, and the unit is (list, seed): per unit, Σ over its sails of (realised − expected) per term;
    - the SE is across the 5,000 units of a rule, giving 65 tests;
    - the scripted case takes q and both risks from the engine (`computeTransit`, `getMutinyRisk`).
21. **C8.** #44 C7's three runs, without depth. In *wait24* the ship sells 5 of its 10 cloves on arrival and keeps 5 aboard (there is no depth to refuse them).
22. **C10.** The scripted states were found by the deterministic search in the code, run before any check:
    - *rest*: junk, normal, Quanzhou, month 21, 600 D, crew 46, M 0.3;
    - *standing*: junk, normal, Malacca at standing 35, month 18, 600 D, P 0.3;
    - the 106 identity states are the first 106 decision points of identity runs on C1's first cell.
23. **Predict.** The H cells are the flat H (G) cells in every difficulty and both policies; the L-EV cells are the flat L-EV cells. Cash is carried forward within each campaign. An extra is late if its raid's action comes after the action that defines W(12).
24. **S1 and S2 cells:** H easy and normal × both ships × both policies × the 8 P and T values (64 cells), measured against `predict` per cell.
25. **S3.** (a): H (easy, normal and hard) and D-W (6 cells) with G+, R_late against flat with G+. (b): W 10 and W 30 with G, ruins per 1,000 against flat with G.
26. **S5's H cells** are easy, normal and hard (both ships, both policies); survival is reported.
27. **§6 under W.** R_late is read on H's G+ cells, since W is assessed with the guard. The guardrail is S3(b)'s bound with G+: G+ ruins minus flat G+ ruins < 10 per 1,000 in every easy and normal cell. For P, T and M: the G cells and S5's guardrails.
28. **Bootstrap:** R_late only (H and L-EV cells), as specified in §8, from one mulberry32(20261124) stream in a fixed cell order.
29. **Cap projection (§8).**
    - Elapsed time is the sum of the measured wall times of the blocks. Phases are separate processes, so time between them is not counted.
    - L-EV blocks are projected from the measured wall minutes per campaign of the latest finished L-EV block (core, else flat).
    - Flips are projected from flat's wall minutes per solve × states × variants × 2 × 1.5.
    - Otherwise §8's upper ends apply (checks 20 min, H 3, D-W 1, flat L-EV 8, core 48, extended 72, flips 15).
    - Projections are made before each block and after its first 10 % (for the extended block, after its first variant).
    - Plants and static replays are timed and reported outside the projection.
30. **Workers.** Three Node processes; item index mod 3 picks the worker; outputs are per item.
31. **Core.** The core block runs seeds 600001–600100, then 600101–600150, so that fallback 6 can still apply to the second part. The extended block runs T 0.1, P 0.03, T 0.03, M 0.03, P 0.1, M 0.01 in that order (the reverse of the ladder), so that a later cut can still drop a variant not yet run.
32. **Flips.** The states are flat L-EV decision points (solve calls) at seeds 600001–600010 (600001–600005 after fallback 3), both ships, easy and normal. Identical (state, flat action) pairs are solved once, with their counts. Q_var(a_flat) comes from a solve whose first action is forced.
33. **Outputs.** Committed: the compact CSVs named in §10, plus `ships.csv` (ship choice), `lev-perseed.csv` (if under 1 MB), `timing.json` and `external-manifest.json`. Per-campaign columns, the H per-seed file, the static replays and the flip states go to the external archive with SHA-256.
34. **Development smoke runs.** These used `SC_DEV=1`: unregistered seeds from 900001 (C1, C1b and C7 seeds unchanged but only 3–4 per cell), outputs in the external directory only. They printed only pass/fail, counts, hashes and timings, and the files they wrote were read only for structure (row counts, empty columns, all-true flags), never for values. They are outcome-bearing (3 seeds per cell on unregistered seeds), so they are disclosed here and archived unread in the external archive as `dev-smoke-archive.tar` (1,085,440 bytes, SHA-256 `a840edd5ccb8682814828dbfc7ca039f0b7212d9010ab1382f65201fdc3c986a`), then deleted from the working directory. The plant runner was also smoke-tested on that code: every plant was caught and the C9 control passed.

### 2026-11-25 — checks, flat runs, and the frozen `predict` and exposure tables (before any variant run)

**Results seen when this entry was written:** checks C1–C10 (all pass; `checks.json`, committed at `1c61e18`), every planted defect caught with the C9 control passing, and the flat runs of H (G and G+, every difficulty), D-W (G and G+) and L-EV (easy and normal). **No variant run had been started.** No fallback was needed: the projected total was 149.7 min after the first 10 % of the flat L-EV block (cap 180).

Timings so far (3 workers): checks 5.97 min (§8: about 20); flat H 0.61 min; flat D-W under 0.01 min; flat L-EV 9.26 min for 600 campaigns (§8: 4–8). Plants (outside the projection): 2.9 min.

C7 descriptor: the mutiny-cash term is beyond 3 SE (z = −3.60, within the registered ±4.1) in the nine non-M rules, which share their mutiny draws, so this is one deviation seen nine times. It passes and is reported, not acted on.

**The `predict` table.** Computed by `node research/03/models/scaling-costs.mjs predict`: the script committed at `fcc8b79` (SHA-256 `9069eaff…`), unchanged since. It used only the flat ledgers: H flat (G) in every cell and flat L-EV. Every row is in `research/03/results/2026-11-25-scaling-costs/predict.csv`, SHA-256 **`8b7781bad4e7b360dc9fd69bc5488f27c39469ff4c81aa0c3c5394ae9eead025`** (160 rows: R_late^pred, K_late^pred, Σ extra_late and the flat sums). R_late^pred in percent:

| arm | ship | difficulty | policy | P0.01 | P0.03 | P0.1 | P0.3 | T0.01 | T0.03 | T0.1 | T0.3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H | dhow | easy | sailAlways | 0.00 | 0.13 | 1.48 | 4.89 | 0.31 | 1.28 | 4.71 | 13.93 |
| H | dhow | easy | avoidHeadwind | 0.00 | 0.22 | 1.66 | 5.52 | 0.87 | 3.08 | 10.42 | 28.33 |
| H | dhow | normal | sailAlways | 0.00 | 0.13 | 1.49 | 4.90 | 0.27 | 1.10 | 4.11 | 12.31 |
| H | dhow | normal | avoidHeadwind | 0.00 | 0.22 | 1.66 | 5.52 | 0.81 | 2.90 | 9.85 | 27.00 |
| H | dhow | hard | sailAlways | 0.00 | 0.13 | 1.51 | 4.97 | 0.22 | 0.92 | 3.51 | 10.58 |
| H | dhow | hard | avoidHeadwind | 0.00 | 0.22 | 1.66 | 5.52 | 0.58 | 2.22 | 7.72 | 21.48 |
| H | dhow | survival | sailAlways | 0.00 | 0.24 | 2.72 | 8.92 | 0.37 | 1.52 | 5.81 | 17.14 |
| H | dhow | survival | avoidHeadwind | 0.00 | 0.43 | 3.13 | 10.38 | 0.90 | 3.55 | 12.18 | 32.10 |
| H | junk | easy | sailAlways | 0.06 | 0.44 | 1.79 | 5.55 | 0.34 | 1.17 | 4.04 | 11.85 |
| H | junk | easy | avoidHeadwind | 0.04 | 0.50 | 2.22 | 6.98 | 0.43 | 1.61 | 5.67 | 16.62 |
| H | junk | normal | sailAlways | 0.06 | 0.44 | 1.79 | 5.55 | 0.27 | 0.96 | 3.35 | 9.90 |
| H | junk | normal | avoidHeadwind | 0.04 | 0.50 | 2.22 | 6.98 | 0.32 | 1.27 | 4.56 | 13.48 |
| H | junk | hard | sailAlways | 0.06 | 0.44 | 1.79 | 5.55 | 0.20 | 0.71 | 2.53 | 7.55 |
| H | junk | hard | avoidHeadwind | 0.04 | 0.50 | 2.22 | 6.99 | 0.19 | 0.87 | 3.24 | 9.72 |
| H | junk | survival | sailAlways | 0.11 | 0.79 | 3.24 | 10.05 | 0.30 | 1.09 | 3.86 | 11.42 |
| H | junk | survival | avoidHeadwind | 0.08 | 0.95 | 4.18 | 13.16 | 0.30 | 1.35 | 5.09 | 15.01 |
| L-EV | dhow | easy | avoidHeadwind | 0.00 | 0.41 | 2.35 | 7.61 | 0.86 | 3.05 | 10.44 | 29.19 |
| L-EV | dhow | normal | avoidHeadwind | 0.00 | 0.41 | 2.35 | 7.62 | 0.83 | 2.96 | 10.15 | 28.50 |
| L-EV | junk | easy | avoidHeadwind | 0.16 | 0.81 | 3.11 | 9.70 | 1.19 | 3.85 | 12.77 | 35.02 |
| L-EV | junk | normal | avoidHeadwind | 0.16 | 0.81 | 3.11 | 9.70 | 1.11 | 3.64 | 12.09 | 33.24 |

**The exposure table (N8).** `research/03/results/2026-11-25-scaling-costs/exposure.csv`, SHA-256 **`b2ae316a13e8722696f787c886bf7a5981ac5b2a0fa6545611fb6afc514bcf29`**. Shares of flat departures:

| arm | ship | difficulty | policy | departures | crew < 50 at departure | crew < 50 after the leg (descriptor) | raids / campaign | mutinies / campaign |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-EV | dhow | easy | avoidHeadwind | 2400 | 46.50 % | 63.88 % | 2.05 | 1.92 |
| L-EV | dhow | normal | avoidHeadwind | 2400 | 46.50 % | 63.88 % | 2.05 | 1.92 |
| L-EV | junk | easy | avoidHeadwind | 2250 | 58.62 % | 70.62 % | 2.52 | 3.21 |
| L-EV | junk | normal | avoidHeadwind | 2250 | 58.62 % | 70.62 % | 2.25 | 3.21 |
| H | dhow | easy | sailAlways | 13141 | 73.97 % | 79.78 % | 0.85 | 4.98 |
| H | dhow | easy | avoidHeadwind | 16000 | 69.86 % | 77.28 % | 1.97 | 4.86 |
| H | dhow | normal | sailAlways | 13141 | 73.97 % | 79.78 % | 0.85 | 4.98 |
| H | dhow | normal | avoidHeadwind | 16000 | 69.86 % | 77.28 % | 1.97 | 4.86 |
| H | dhow | hard | sailAlways | 13403 | 67.09 % | 72.88 % | 1.07 | 4.67 |
| H | dhow | hard | avoidHeadwind | 16000 | 69.86 % | 77.28 % | 1.97 | 4.86 |
| H | dhow | survival | sailAlways | 13403 | 67.09 % | 72.88 % | 1.87 | 4.67 |
| H | dhow | survival | avoidHeadwind | 16000 | 69.86 % | 77.28 % | 3.56 | 4.86 |
| H | junk | easy | sailAlways | 11508 | 65.24 % | 73.93 % | 0.98 | 3.83 |
| H | junk | easy | avoidHeadwind | 11000 | 63.64 % | 72.73 % | 1.12 | 3.51 |
| H | junk | normal | sailAlways | 11508 | 65.24 % | 73.93 % | 0.98 | 3.83 |
| H | junk | normal | avoidHeadwind | 11000 | 63.64 % | 72.73 % | 1.12 | 3.51 |
| H | junk | hard | sailAlways | 11508 | 65.24 % | 73.93 % | 0.98 | 3.83 |
| H | junk | hard | avoidHeadwind | 11000 | 63.64 % | 72.73 % | 1.12 | 3.51 |
| H | junk | survival | sailAlways | 11508 | 65.24 % | 73.93 % | 1.74 | 3.83 |
| H | junk | survival | avoidHeadwind | 11000 | 63.64 % | 72.73 % | 2.03 | 3.51 |

Every L-EV cell has at least 5 % of flat departures with crew < 50, so S6 is testable (§5, P4).

## 10. Outputs and provenance

- **Code:** `research/03/models/scaling-costs.mjs` (Node ≥ 22, no dependencies), importing `adaptive-routes.mjs`'s definitions from a generated copy (#44 deviation 3) and `research/03/models/load-engine-research.mjs` with `lineOffset` 1776 and the engine-script pin `6fba1ee7…`.
- **Results:** `research/03/results/<run date>-scaling-costs/`: `behaviour.csv`, `lev.csv`, `harness.csv`, `dw.csv`, `predict.csv`, `exposure.csv`, `flips.csv`; per-seed CSVs if under about 1 MB, otherwise archived externally with SHA-256; `checks.json` (C1–C10 with plants); `predictions.json`; `results.md`, failures first.
- **Provenance:** commit, page and engine-script SHA-256, Node version, worker partition, RNG and key grammar, seeds, bootstrap seed, counts per cell.

## 11. What this can and cannot license

- **Licensed (exploratory; planner lower bounds):** within this game's economy and these players, whether each rule changes resting, routing, cargo value at risk, standing and ship choice; how far the raid rules' profit cut follows the flat-ledger arithmetic; whether any rule raises early ruin.
- **Not licensed:**
  - **How students play.** L-EV knows prices and every hazard's expectation; H is a fixed myopic rule. The owner's junk earned about 86k on easy, an order below the planners, and hired all three specialists.
  - **Cargo choice under P and T.** `planBuys` ignores expected costs, so "carry less or change cargo" is measured only through destination changes: a lower bound.
  - **Standing below 50.** The labels carry one flag per port for standing ≥ 50 and **collapse levels 20–49** (where port fees fall by a quarter); a plan that builds standing for fees alone is undervalued, another lower bound.
  - **Historical rates.** Every share and β is a balance parameter.
  - **Optimality.** Labels make every plan a lower bound (adaptive routes check 2; #44 C9).
  - **The combined change.** Specialists, storms and depth each interact (§7, §13).
  - **A wealth ceiling under T within the campaign.** T can bound wealth in principle (§1), but the ceiling at these τ lies above what a campaign reaches; the study reports the cut, not a ceiling.

## 12. Owner choices still open (recommendation stands unless changed before merging)

| # | Choice | Recommended | Alternative |
| --- | --- | --- | --- |
| O2 | Rule form for W and M | today's cost as floor | pure share (small holds immune under rounding) |
| O3 | Grid | 0.01, 0.03, 0.1, 0.3; β 1, 3, 10, 30 | finer, chosen now |
| O4 | Depth | off; one W×depth exploratory arm | both (needs a hazards-on depth-aware planner that doesn't exist) |
| O5 | Terminal rule | S-net scored, E-net reported; fix D01, D03, D07 first in the combined change | E-net scored |
| O7 | W | H and D-W, G and G+ | also in L-EV |
| O8 | Difficulties | L-EV easy and normal; H and D-W easy, normal, hard; survival H only | L-EV also at hard (+50 % L-EV time) |
| O10 | Valuation | §2's convention (sale price at the port after the voyage, arrival month) | cost basis |
| O12 | Standing flag | one flag per port in the label | only the next destination's flag |

Settled by the owner on 2026-11-24: the primary question, the raid rule with today's floor, the crew-aware planner with N = 150, selection on R_late with R\* informed, 3 workers.

## 13. Interaction with the specialist protocol and the storm draft

- **Specialists (registered, #31).** No player hires one.
  - **Guards** multiply the raid probability by 0.2 (`:2448`). The registered price rests on a loss of one crate or ≤ 75 D. Under the raid rule the loss scales with cargo or cash, on any leg: at *s* = 0.1 a full junk bound for Quanzhou gives 0.8 × 0.15 × 0.1 × 186,000 = 2,232 D per passage, against a registered price expected around 15–25 D. **If P or T is adopted, the guards price must be re-derived.**
  - **Pilot:** EV_time uses (V + upkeep), which W changes; shorter legs cost less crew health, which M turns into value the price basis omits. **Coverings:** unaffected.
- **Storm seasons (#39).** A storm costs 12 crew health (`:2422`); under M that becomes a cargo share through mutiny, and the draft's storm cost leaves mutiny out, so its κ\* would be overstated in the combination. Its extra monsoon-month storm draw shifts no other draw under role keys, but shifts every later draw under the seed-stream feed; the combined change must use keyed draws.
- **Adapter:** §1 (raid log wording).
- **Order recommended for the combined change:** fix D01, D03, D07; adopt any cost rule (with the adapter's wording); re-price specialists; then storms.

## 14. Triage

- **Interesting:** S6 holds (the planner rests its crew under M at 0.3), or P/T move routing despite the cost-blind fill, or S8 fails (costs not ship-neutral).
- **Boring / null (most likely):** P and T are costs whose cut matches the ledger arithmetic (S1, S2); M changes resting only at 0.3 or not at all; ship choice holds; W matters only through the fill. **Worth knowing: yes.** It says which rule, if any, adds a decision to the game; that the raid rules' size is a value choice computable from a route ledger; and that W can't ship without a wage guard.
- **Dead:** C1, C1b, C3, C7 or C10 cannot be made to pass.
- **Cheapest decisive experiment:** H and D-W under all variants (minutes), then the L-EV core block (M 0.3 decides S6).
- **Hostile-reviewer baselines:** flat under the same player and seeds; the static replay (A); G+ under flat; the published planner and harness (C1, C1b); E-net beside S-net; the frozen `predict` table.
- **Forking-paths guard:**

  | Choice | Value | Selected on the result? |
  | --- | --- | --- |
  | Grid | 1–3–10 series | **Partly:** upper end checked against arithmetic on seen λ; no run |
  | Raid rule, planner, N, selection on R_late, workers | owner decisions 2026-11-24 | No: made on v1/v2's text and their reviews, before any run |
  | Windows | resulting months ≤ 6, after W(12), early ruin ≤ 12 | No: calendar fractions |
  | m_v | wages + Kilwa fee, standing < 20, per difficulty | No: physical scale; descriptors at 1 D, 2·m_v, 1 % of Q |
  | S1–S8 thresholds | as stated | **Partly:** S1/S2's ±2 is the owner's; S3, S5–S8 set with λ, #44's ruins and the 2.2–2.4 ratio in view (informed); looser and stricter descriptors reported |
  | R\* | 10 % (descriptors 5 %, 20 %) | informed; a value judgement |
  | Analytic predictions | computed by a script frozen before the flat runs, from flat ledgers only | No: mechanical; entered in §9 before any variant run |
  | C7 tolerance | ±4.1 SE (Bonferroni over about 65 tests) | No: fixed now |
  | Fallback order | §8 | No |

- **Confirmatory:** S1–S3, S5–S8. **Exploratory:** bundles, M's profit cut, decision flips, avoidance, the L-EV gap to `predict`, hard, survival, D-W×depth, every descriptor, anything chosen after output.
- **One-sentence finding, drafted before running:** "Scaled costs change one decision: a mutiny settlement worth a large share of the cargo makes the planner rest its crew, while raid costs that scale with cargo or cash act as costs whose cut follows the flat route ledger; none moves ship choice or early ruin, and tonnage-scaled wages need a wage guard at departure."
- **Verdict recommended: PURSUE.** The owner's acceptance is recorded by merging the PR that registers this protocol.

## 15. Changes from v1 (2026-11-24)

**Owner decisions.**
1. Primary question → costs that change decisions (§4.1; S6–S8 primary). Profit cut secondary. "End the runaway" removed. P and T get analytic predictions frozen before any variant run, tested by S1–S2 at ±2 points (§4.6). §6 became the owner's adoption rule.
2. Raid compares a cargo share and a cash share whatever is aboard (§2); bait check C2(g); v1's exploit noted.
3. Crew-aware L-EV with Pareto labels, expected storm crew loss, N = 150, re-timed; check C10.

**Review of v1.** B1 (not itemised to me; taken as the reframing); B2 (`replanRun` re-plans per wait or delivery path); B3 (pairing restated, C3 rebuilt, static replay with capped buys); B4 (C6 and C7 rebuilt); M1 (C2 cases and plants, thresholds); M2 (ruin definition); M3 (S3(b) informed, decision rule); M4 (L-EV specification, C1(b), C1b); M5 (not received); M6 (labels, m_v as a physical scale, easy's fee, 1 % of Q); M7 (ratio of paired sums, resulting month); M8 (one valuation); lows (§1 sums, wording, fallback trigger, adapter, ruin channels).

## 16. Changes from v2 (2026-11-24)

**Owner decisions.**
4. **Raid keeps today's floor** (reviewer's R1, §2): lots, today's lot when valuables are aboard and the lots are worth less, then the larger of that and X. Identical to today at *s* = τ = 0 (new C2(j), plant (ix)); the bait never pays (C2(g) rewritten: never lower with the crate). v2's "price of closing the bait" removed.
5. **Adoption rule selects on R_late** with R\* = 10 % informed (descriptors 5 %, 20 %); K_late a descriptor (§6); predicted candidates updated.
6. **3 workers, nothing else running;** peak RSS measured in a three-process timing pilot (120–121 MB per process) and the time arithmetic redone (§8: 1.2–2.8 h, cap 3 h).

**Confirmation review of v2.**
- **N1.** Two-point mutiny expectation in L-EV and C7 (§4.2), label crew stated (h − 12q after the leg), scripted crew-54 case expecting 0.028, plant (b).
- **N2.** `predict` walks the flat ledgers' realised raids with cash carried forward (§4.6); the gap's meaning corrected; S1/S2 cells named (H easy and normal, both policies; hard and survival descriptors).
- **N5.** T can bound wealth (W\* ≈ λ/(τπ)), P, M and W cannot (§1, §11).
- **N6.** C2(g): crate injected with cash unchanged.
- **N7.** C10(b) standing case at *s* = 0.3 with an "omit standing flags" plant; start month ≥ 17 and branch count; ties keep the first label (§4.2).
- **N8.** Exposure table (share of flat departures with crew < 50) entered with `predict` before any variant run.
- **N9.** S7(a) uses the paired median at the values run; M 0.01 droppable.
- **N10.** Last fallback: core at N = 100, overrun logged.
- **Lows.** Fallback (1) now drops M 0.01, and T 0.1 is kept longest; C2(i) computes p in the engine's order; C7's multiplicity stated and Bonferroni applied (±4.1 SE, about 65 tests); §11 notes the collapsed standing levels 20–49; §8 states that both pilots included the storm crew term; adapter lines corrected (decode `:3593-3597`, log search `:3600`, outcome text `:3601`).

## 17. Changes from v3 (2026-11-24; confirmation review of v3, "register after two fixes")

- **P2.** Plant (ix) can go unseen if a missing lot is coded as a loss of 0. New plant (x): X without `max(0, ·)`. C2(j)'s cash grid catches it whatever the coding; worked by hand at cash −40, where the raid would add 40 D in the pepper-only and empty rows.
- **P3.** C2(g): "higher with the crate" is stated for P at *s* = 0.03 and for flat; at *s* = 0.3 the cost is equal (3 pepper lots already outweigh a crate). The pass condition stays "never lower with the crate".
- **P4.** S6 is **untestable**, not contradicted, if fewer than 5 % of flat departures have crew < 50 in every L-EV cell.
- **Lows.** Plant (vi) reads "(g differs)". C10(b) may start with Malacca's standing at 35–45. C7's and L-EV's mutiny-lots term is two-point over the raid outcome. Fallback (6), the core at N = 100, is named an owner-approved exception to decision 3.
- **Status row.** The PR body summarises v1–v3 and their reviews; the full reports are kept in the owner's session.
