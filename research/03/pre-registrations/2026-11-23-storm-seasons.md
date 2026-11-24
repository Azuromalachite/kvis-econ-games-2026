# Protocol: regional storm seasons (Monsoon Navigator), a short run that records the expected null

| | |
| --- | --- |
| Status | **Registered by merging this file's PR; not run.** Nothing here has been coded or evaluated, except the arithmetic and the timing prototype disclosed in §9 item 9. It is frozen when the PR adding it merges. Earlier drafts (v1–v3) and their reviews are recorded in the PR; §15 lists the changes from v1, §16 the changes from v2 and v3, and §17 the owner's confirmation. This text is v4 with the owner's confirmation of 2026-11-24 |
| Drafted | 2026-11-23 (v1) to 2026-11-24 (v4), against `main` at `cedef87` (merge of #31; #34 merged at `1425bfb` before it) |
| Engine | `projects/03/index.html` at `cedef87`, SHA-256 `5c722df9d8432d9a5df763d8a5a460b6ccbb9f4e1730ae008a8e58908ff8dbd3`. `projects/` and `tests/` are unchanged between `d83fd9f` and `cedef87` (only `research/03/` changed), so this is the same file v2 pinned; the hash was recomputed at `cedef87`. Its inline engine script (the string `engineScript()` in `tests/03/engine/load-engine.mjs` returns) has SHA-256 `6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c`, byte-identical to the script at `d2d66a3` cited by the earlier protocols, starting 104 lines lower: the `<script>` tag is on line 1693 (was 1589). `computeTransit` is `:2135-2167`, and the storm block is `:2333-2346`. The registered specialist-pricing protocol cites line numbers at `f475726`, 104 lines higher than these. **Note at registration (2026-11-24):** `main` has since moved to `b297507`…`3588261` (#43 replay, #45 design, #50 waterfront); the page hash changed with each rebuild, but the inline engine script is still `6fba1ee7…` (62,591 characters). The run loads the engine through `engineScript()`, so it pins the engine script, not the page; line numbers above refer to the page at `cedef87` |
| Kind of change | A **game change**, tested in research first (Path B). The game file is never edited. The new rule exists only as a research copy of `sailTo` inside the loader's `vm` context. If the change is adopted, it is made upstream, then rebuilt and pinned as `projects/03/README.md` ("Generated page") requires. That is a separate PR and the owner's decision |
| What this run is for | **Owner decision, 2026-11-24.** Arithmetic predicts the null in most decisions, with one named exception (§3). This short run records it: where storms would land, the porcelain-loss tail, and the **κ threshold**, meaning how highly a storm would have to be valued before a storm-aware player's decisions change by more than a margin and at a cost in D. The owner then decides on storm damage using that number. Nothing here proposes a damage change |
| Status of results when run | **Exploratory.** They are provenance-incomplete if any field `game-change-review` requires is missing, and the missing fields are named. Results go to `research/03/results/<run date>-storm-seasons/` |
| Specialists | The run uses the **current** specialist rules: the navigator is a campaign-long purchase through `hireSpecialist` at 180 D. As in every published run, no player hires one. The per-passage pilot and guards of the **registered** specialist-pricing protocol (`research/03/pre-registrations/2026-11-23-specialist-contracts-balance.md`, merged with #31 at `cedef87`) are combined with this change in the later combined engine change, not here (§10) |

Modern climatology is used **only as a labelled proxy for relative seasonality within each sea**. No number here is a historical per-voyage probability. The tier probabilities are game parameters.

There is no `research/03/README.md` at `cedef87`. The research conventions used here are `AGENTS.md` and `.claude/skills/game-change-review/SKILL.md`.

## 1. What the game does today

- **Storms happen only on legs that depart in a transition month.** `getWindState` (`:2078-2108`) marks March, April, May and October as `isDeadZone`. In those months `computeTransit` sets `stormProbability` to 0.35, or to 0.18 with a navigator (`:2149`).
- **One roll decides storm and doldrum** (`sailTo`, `:2333-2346`).
  - A roll below p is a storm. It costs hull, round((22 + 16u) × stormResist × stormMult), and 12 crew health. stormResist is 1.0 for the dhow and 0.5 for the junk (`:1873`, `:1881`); stormMult is 1 at normal and 2 at survival.
  - A roll from p up to p + 0.25 is a doldrum (−20 D). So P(doldrum) = 0.25 on every transition leg, and a storm and a doldrum never happen together.
- **Storms cost little.** Hull matters only in two places: porcelain breaks when hull is below 70 on a headwind or transition leg (`:2349`), and the harness repairs when hull is below 60 and cash above 200, at 60 D per 25 points. There is no sinking and no loss of speed. Hull never falls below 5.
  - The economy skeleton found that "hull damage hardly matters". Time alone decided whether waiting paid in 144 of 144 headwind cells (`research/03/results/2026-11-22-economy-skeleton/results.md:16`; P2.3 at `:45`).
- **The status text shows the probability.** `alignmentStatus` reads "Dead Zone (35% Storm)" (`:2154`), and that string is part of the 480-row transit fixture.

## 2. Rules under study (owner's design; mechanics confirmed 2026-11-24)

### 2.1 Regions: one region per leg (owner-confirmed)

**How each leg is placed on the globe.**
- Each directed leg is taken as the **polyline** from the port, through the Atlas adapter's sea waypoints (`seaWaypoints`, `index.html:3302-3308`), to the next port. The page draws a smoothed curve through the same points (`lanePath`, `:3311-3315`); **all shares here are measured on the polyline, not on the drawn curve.**
- Waypoints are converted to longitude and latitude by inverting the builder's projection. The projection is x = a·lon + b and y = c·lat + d, fitted by least squares to the five ports (`scripts/coastline.mjs` at upstream `3eaa293`, its `REAL` positions, against the page's port positions at `:1740-1796`).
- The fit, recomputed for v3, gives a = 8.0637, b = −228.84, c = −7.4553, d = 269.23.

| Sea | Stretch |
| --- | --- |
| Arabian Sea (AS) | west of 77.5° E (the meridian of Cape Comorin; x = 396.1) |
| Bay of Bengal (BoB) | from 77.5° E to waypoint [545, 217] (96.0° E, 7.0° N), the turn at the northern tip of Sumatra |
| Strait of Malacca (STR) | from [545, 217] to Malacca, and from Malacca to waypoint [616, 263] (104.8° E, 0.8° N), the exit of the Singapore Strait |
| South China Sea / NW Pacific (SCS) | east of [616, 263] to Quanzhou |

| Leg (both directions) | AS | BoB | STR | SCS | **Region** |
| --- | --- | --- | --- | --- | --- |
| Kilwa–Aden | 1 | | | | AS |
| Kilwa–Calicut | 1 | | | | AS |
| Aden–Calicut | 1 | | | | AS |
| Calicut–Malacca | 0.208 | 0.563 | 0.229 | | **BoB** (mixed) |
| Malacca–Quanzhou | | | 0.105 | 0.895 | SCS |

Shares are fractions of each leg's polyline length, in map units (arithmetic, recomputed for v3).

- **Assignment.** A leg takes the region with the largest share of its length **outside the strait**. The strait counts as **none** and never decides a region.
- **Calicut–Malacca mixes regions.** It passes Cape Comorin, crosses the mouth of the Bay of Bengal south of Sri Lanka, and runs down the strait. It is assigned to BoB. Exploratory arm W5 uses the length-weighted mix instead (§5).
- **Known gap: Kilwa's South-West Indian Ocean exposure.** Kilwa lies at about 9° S. On the polyline, **Kilwa–Aden runs south of the equator for 0.34 of its length, and Kilwa–Calicut for 0.48.**
  - That water is in the South-West Indian Ocean cyclone basin, which has its own season. The IMD counts don't cover it.
  - It is assigned to AS by the owner's rule. Its season is **not represented**.
- **Malacca–Quanzhou** runs south of the HKO area's southern edge (10° N) for 0.44 of its length. The whole leg takes the SCS profile.

### 2.2 Data (IMD counts as supplied and verified by the owner; HKO table re-read for v3)

| Region | Jan–Dec | Annual | Peak | Source |
| --- | --- | --- | --- | --- |
| AS | 0, 0, 0, 1, 17, 15, 0, 2, 9, 20, 10, 6 | 80 in 65 years (1.23 a year) | Oct | IMD RSMC New Delhi, cyclonic storms (≥ 34 kt), totals 1961–2025: <https://rsmcnewdelhi.imd.gov.in/uploads/climatology/cswin.pdf>, `cspre.pdf`, `csmon.pdf`, `cspos.pdf` |
| BoB | 4, 1, 1, 10, 39, 5, 4, 6, 14, 42, 66, 31 | 223 (3.43 a year) | Nov | same |
| SCS / NWP, HKO area 10–30° N, 105–125° E | 0.2, 0.0, 0.1, 0.2, 0.8, 1.4, 2.7, 3.1, 2.7, 2.1, 1.7, 0.7 | **printed total 15.6 a year**; the printed months sum to 15.7 (rounding of the monthly means) | Aug | HKO, *Tropical Cyclones in 2024*, Table 2.1, "Average (1961–2020)" row: <https://www.hko.gov.hk/en/publica/tc/tc2024/table21.html> |

- **What HKO counts.** Table 2.1 counts tropical cyclones in Hong Kong's area of responsibility, "based on the first occurrence of the tropical cyclone in the month" (table title). §2.1.2 of the same publication defines that area as "the area bounded by 10°N, 30°N, 105°E and 125°E". **Depressions are included:** §1.2 lists six tropical-cyclone categories, the first being a tropical depression, "maximum sustained winds of 62 km/h or below". The second category, tropical storm, starts at 63 km/h (about 34 kt), which is IMD's threshold for a cyclonic storm. (HKO pages read 2026-11-24.)
- **The IMD counts stand on the owner's verification.** They were not re-opened for v3.
- **The two sources count different things.** HKO counts all tropical cyclones, depressions included. IMD counts only storms of 34 kt and above.
  - **Handling:** each sea is tiered on its own shape relative to its own peak (§2.3).
  - **Remaining risk:** the share of depressions may vary by month. If so, the SCS shape of damaging storms differs from the all-cyclone shape near a tier boundary: Oct 0.677, May 0.258, Dec 0.226 (OPEN 1).
- **The areas differ too.** HKO's area is a 20° × 20° box; IMD's AS and BoB counts cover whole basins. Absolute rates are therefore not comparable across the two sources even before the definitions are considered (§2.3).
- **The AS counts are noisy.** The sea averages about 1.2 storms a year. Single-storm fragility is listed in §2.3.
  - Over 1991–2020, May and June each reach 0.75 of October (owner's figure). Both are **high** under the 1961–2025 shape as well (0.85 and 0.75), so the choice of period doesn't move them.
- **Not used:**
  - HKO Table 2.2 ("affecting Hong Kong"): late-season storms track further south than Hong Kong.
  - Evan & Camargo 2011 and Liu et al. 2001 are not cited for any number.
- **Historical limit.** Chen et al. (2019), *Climate of the Past* 15:279–289, doi:10.5194/cp-15-279-2019, found that paleotyphoons made landfall in China about one month earlier in the Medieval Warm Period **than in the Little Ice Age**.
  - It motivates **one** sensitivity arm that shifts the SCS profile one month earlier (W4).
  - **The shift in W4 is applied to the 1961–2020 climatology.** The paper compares two past periods; it gives no offset between the Medieval Warm Period and 1961–2020. W4 therefore assumes that the modern climatology sits where the Little Ice Age did. That is a modelling assumption, not a finding of the paper.
  - It supplies no probability. It concerns landfall timing in China, not the risk along a route.

### 2.3 Tiers: each sea scaled to its own peak (owner decision; fixed now)

**Rule.** r = the month's count ÷ that sea's peak-month count. Lower bounds are inclusive:
- **none:** r < 0.1
- **low:** 0.1 ≤ r < 0.4
- **mid:** 0.4 ≤ r < 0.7
- **high:** r ≥ 0.7

| Region | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AS r | 0 | 0 | 0 | .050 | .850 | .750 | 0 | .100 | .450 | 1 | .500 | .300 |
| **AS** | N | N | N | N | **H** | **H** | N | L | M | **H** | M | L |
| BoB r | .061 | .015 | .015 | .152 | .591 | .076 | .061 | .091 | .212 | .636 | 1 | .470 |
| **BoB** | N | N | N | L | M | N | N | N | L | M | **H** | M |
| SCS r | .065 | 0 | .032 | .065 | .258 | .452 | .871 | 1 | .871 | .677 | .548 | .226 |
| **SCS** | N | N | N | N | L | M | **H** | **H** | **H** | M | M | L |
| SCS one month earlier, r | 0 | .032 | .065 | .258 | .452 | .871 | 1 | .871 | .677 | .548 | .226 | .065 |
| **SCS-early** | N | N | N | L | M | **H** | **H** | **H** | M | M | L | N |

SCS-early sets each month to the next month's count: p′(m) = p(m + 1). (All 48 tier cells recomputed for v3; unchanged.)

**The consequence of scaling each sea to its own peak, stated plainly:**
- **Absolute frequencies are not compared across seas.** The AS high months average 0.23–0.31 storms a year (June 15/65 = 0.23, May 17/65 = 0.26, **October 20/65 = 0.31**). The SCS high months average 2.7–3.1 cyclones a year (July and September 2.7, August 3.1). That is about **10 times** as many (8.8 to 13.5 across pairings), counted over different areas (§2.2) and with different definitions. The game gives every high month 0.35.
- The game therefore says *when* in its year each sea is stormy. It does not say *which* sea is stormier.
- This is the owner's proxy, chosen because the two sources' definitions and areas differ (§2.2). It is not a claim about absolute risk.

**Knife edges and single-storm fragility, named now.** Each IMD month was moved by one storm (±1) and its whole row re-tiered:

| Month | Count | One storm changes it | Effect |
| --- | --- | --- | --- |
| AS April | 1 of peak 20 | +1 → 2/20 = 0.100 | none → **low** |
| AS August | 2 of 20 | −1 → 1/20 = 0.05 | low → **none**. Also +1 in AS October (peak 21): 2/21 = 0.095, none |
| BoB August | 6 of 66 (0.091) | +1 → 7/66 = 0.106 | none → **low** |
| AS June | 15 of 20 | −1 → 14/20 = 0.700, still high on the inclusive bound; −2 → 0.65, mid | **two** storms change it; one puts it exactly on the boundary |

No other single-storm change moves any tier. AS August is exactly 0.100: a strict ">" would make it none. SCS October (0.677) sits just below a boundary. HKO's SCS values are means, not counts, so this table does not apply to them.

The table is not re-cut after any run.

### 2.4 Tier probabilities (game parameters, fixed now)

High stays at today's 0.35. The navigator multiplies every tier by 18/35, which keeps today's ratio exactly (high → 0.18).

| Mapping | high | mid | low | none | with navigator (high / mid / low) |
| --- | --- | --- | --- | --- | --- |
| **M1, primary** (1, ½, ⅕, 0) | 0.35 | 0.175 | 0.07 | 0 | 0.18 / 0.09 / 0.036 |
| M2, flat (1, ¾, ½, 0) | 0.35 | 0.2625 | 0.175 | 0 | 0.18 / 0.135 / 0.09 |
| M3, peaks only (1, 0, 0, 0) | 0.35 | 0 | 0 | 0 | 0.18 / 0 / 0 |

**Exposure arithmetic, unweighted.** Mean storm probability over lane-months, from the transit fixture (no navigator). The dhow's and the junk's wind statuses are identical in all 120 lane-months, so the table holds for both vessels:

| | All 120 | 40 transition | 40 tailwind | 36 headwind | 4 crosswind |
| --- | --- | --- | --- | --- | --- |
| Today | 0.117 | 0.350 | 0 | 0 | 0 |
| M1 | 0.123 | 0.138 | 0.115 | 0.113 | 0.131 |
| M2 | 0.158 | 0.162 | 0.155 | 0.156 | 0.153 |
| M3 | 0.076 | 0.105 | 0.061 | 0.058 | 0.0875 |
| M1, SCS-early | 0.123 | 0.147 | 0.110 | 0.108 | 0.131 |

- **Unweighted, M1 keeps the overall level close to today's** (0.123 against 0.117 per lane-month) and moves the risk out of the transition months into the monsoon months.
- **On the paths players actually sail, M1 does not keep the level.** Expected storms per campaign on the published hazards-off greedy plans at normal (`research/03/results/2026-11-23-adaptive-routes/hazards-off.json`, the 6 normal cells; Σ p over the legs sailed, departure month):

| Policy | Legs | Today | M1 | M1 share on Malacca–Quanzhou, June–November |
| --- | --- | --- | --- | --- |
| Sail always (dhow and junk) | 15 | 0.7 | 2.6 | 0.47 |
| Avoid headwind, dhow | 16 | 2.1 | 2.2 | 0.24 |
| Avoid headwind, junk | 16 | 1.4 | 2.9 | 0.36 |
| Avoid headwind and transition (dhow and junk) | 14 | 0 | 2.1 | 0.50 |

  These are seen numbers (§9 item 8). They replace v2's N4 as a descriptive statement (§8).
- **Seven tailwind lane-months become high, for the dhow and the junk alike:**
  - June on the three AS legs out of Kilwa and Aden: Kilwa→Aden, Kilwa→Calicut, Aden→Calicut;
  - November, Malacca→Calicut;
  - July, August and September, Malacca→Quanzhou.
- Every best cycle in the skeleton runs through Malacca (`economy-skeleton/results.md:59`). The SCS peak therefore coincides with the best wind for China.

### 2.5 Mechanics of the new rule (all owner-confirmed defaults, 2026-11-24)

The research copy of `sailTo` is the engine's own source text, extracted from the file the loader read. It has **one programmatic replacement** of the block at `:2333-2346`, asserted to match exactly once. Everything else is verbatim.

- **Probability.** p = mapping(tier(region(leg), departure month), navigator), read from **one lookup table** that the run builds once and dumps to `checks.json` (K2, K3).
- **Only the departure month counts,** as today: the month is `state.monthIndex % 12` at the call. Legs last up to 5 months, and the later months don't count.
- **Transition months** (`calc.isDeadZone`) **keep the shared roll.**
  - A roll below p is a storm.
  - A roll from p up to p + 0.25 is a doldrum.
  - Becalming stays at 0.25, and a storm and a doldrum stay exclusive (p ≤ 0.35 < 0.75).
- **Other months.**
  - If p > 0, one roll is drawn. A roll below p is a storm, with today's damage and crew loss.
  - If p = 0, **no number is drawn**.
- **Turned-back attempts** draw a storm too. Headwind damage already applies to them today.
- **Order.** The storm block keeps its position: after the headwind block and before porcelain and mildew. So a storm is checked before porcelain, as today.
- **Unchanged:** `computeTransit` (and with it transit times, wind status and the display string), the porcelain, mildew and harness rules that read `isDeadZone`, damage, turn-backs, piracy, mutiny, prices, fees and debt.

## 3. The prediction, stated up front

**Seasonality alone is not expected to create a meaningful trade-off between sailing now, waiting in port and choosing another route, except where the options already tie in time.** The arithmetic, on constants (recomputed for v3):

**The cost of waiting instead of sailing now is λ·|Δt| + (fee − E[story])**, where Δt is the change in the arrival month. Wages cancel at a time tie: a month in port and a month at sea cost the same wages.

| | dhow | junk |
| --- | --- | --- |
| Expected cost of a high-tier storm, hull at the repair price (0.35 × 30 × stormResist × stormMult × 2.4 D a point), normal | **25.2 D** | **12.6 D** |
| The same at survival (stormMult 2) | 50.4 D | 25.2 D |
| λ, the value of a month (`economy-skeleton/results.md:42`, P2.4) | 383 → 11,500 D | 355 → 27,556 D |
| Port fee − expected port story, normal, standing < 20 (Kilwa, Aden, Calicut, Malacca, Quanzhou) | 5.0, 18.1, 19.4, 13.8, 16.9 D | same |
| The same at standing 20–49 (fee × 0.75) | 0 to 13.4 D (Kilwa 0, Aden 9.1, Calicut 13.4, Malacca 7.8, Quanzhou 9.9) | same |
| The same at standing ≥ 50 (fee × 0.5) | −5.0 to 7.4 D | same |
| The same at survival (fee × 1.1), standing < 20 | 7.0 to 22.4 D | same |
| A full month in port (wages + fee), normal, standing < 20 | 35–50 D | 55–70 D |

E[story] = 0.75 × the mean of the port's two cash vignettes (`waitInPort`, `:2276-2282`): Kilwa 15.0, Aden 16.9, Calicut 5.6, Malacca 11.3, Quanzhou 13.1 D. Calicut's other vignette adds 8 hull points, which is not counted.

**What follows from the table:**
- **When waiting delays arrival (|Δt| ≥ 1),** a storm costs 25 D at most at normal against λ ≥ 355 D. No mapping with high ≤ 0.35 and today's damage can make that wait pay in expectation.
- **At a time tie (Δt = 0),** the operative gap is the fee net of the story, −5 to 19 D at normal across all standing bands and up to 22 D at survival. **A dhow's high-tier storm (25 D; 50 D at survival) is larger than that gap.** So storms can flip time-tied wait-or-sail choices already at κ = 2.4, and route choices whose planned values are within the plan's storm cost of each other.
- **So the null rests on time ties being rare among decision states,** plus the porcelain tail (§6). §4's flip margin (35 D dhow, 55 D junk) is larger than any single high-tier storm at κ = 2.4, so a single time-tied flip at κ = 2.4 does not count as a T1 flip unless the plan's storm cost difference exceeds the margin. T3(a) and T4 carry **no** margin on purpose: in N1 they are the test of "time ties are rare" (§4, §8).

**The registered outputs are therefore:**
1. **The exposure picture:** where storms would land under M1, M2 and M3, by region, month and leg.
2. **The porcelain-loss tail.**
3. **The κ threshold,** κ\*, read on T1 and T2D (§4): the hull valuation at which the storm-aware players' decisions change by more than the margin and at a cost in D.

A null on T1 and T2D at κ = 2.4 is the expected result and gets no further interpretation. The owner decides on storm damage after reading κ\*.

## 4. "Meaningful" and the κ threshold (fixed now)

**Storm-aware players.** They value a leg's expected storm cost as **c = p × 30 × stormResist × stormMult × κ**, where κ is in D per hull point and p is the departure month's probability. c leaves out porcelain and mutiny. It is computed in exact integers as κ × S / 1000, where S sums (1000 p) × 30 × stormResist × stormMult over the legs (dhow 30, junk 15 at normal), so every comparison of S is exact.

**c is kept in a separate ledger (B1).** It never touches planning cash. Planning cash alone drives `planBuys`, the harness repair rule and the < −250 D end (`advance` → `finish`), exactly as in R. Each player's value is **Q = planning net − Σc** for RS, and the per-month score with c subtracted for HS (§5.2).

**Two cost sets.** "New" uses the M1 lookup (§2.4) for p. "Old" uses today's rule: p = 0.35 if the leg-month is a transition month, else 0. Both scale with κ.

**Decision states.** A decision state is any point where the storm-blind player chooses its next action. RS's states are R's states from its W1 runs at normal: the planning snapshot `snapshot(e, v, diff)` that R passes to `solve`, recorded at every call. HS's states are H's states from its W1 runs at normal: every point where `harnessPlay` scores lanes. RS and HS never act in the engine; they only choose at recorded states. **Distinct states** are states equal on every solver input (port, month, cash, debt, equity, hull, crew, standing vector, cargo); identical states are solved once (exact by construction).

**At each state and each κ the player names a first action under each cost set: a_new and a_old.** For RS a first action is *wait* or a delivery path; for HS it is a lane, or *wait one month first*.

| # | Measure, per vessel × policy cell (6 cells per player) | Meaningful if | Role |
| --- | --- | --- | --- |
| T1 | **Flips with a margin:** share of state visits where Q_new(a_old) < Q_new(a_new) − m_v | ≥ 10% | κ\* criterion |
| T2D | **Regret in D:** mean over state visits of max(0, Q_new(a_new) − Q_new(a_old)) | ≥ m_v | κ\* criterion |
| T2′ | **Regret as a share:** Σ regret ÷ Σ the storm-blind player's own planned net at the state (κ-free; defined below). A ratio of sums, not a mean of ratios | reported only | descriptor |
| T3 | **Waiting:** (a) share of visits where *wait* is first under one cost set and not the other; (b) per state, Δ = [Q_new(wait) − max Q_new(sail)] − [Q_old(wait) − max Q_old(sail)], and the median over visits of \|Δ\| ÷ m_v | flagged if (a) ≥ 5% or (b) ≥ 1 | descriptor |
| T4 | **Route:** share of visits where the **first delivery** (the first non-wait action of the plan) differs between the new and old plans. The whole remaining sequence of ports is reported alongside | flagged if ≥ 10% | descriptor |

- **The margin m_v** is one month in port at the cheapest port at normal, standing < 20: wages + Kilwa's fee of 20 D. **m_dhow = 35 D, m_junk = 55 D.** Fixed now. The same m_v is the T2D threshold and T3's scale, so all three use one scale in D.
  - **Why this value (the rationale predates the leak in §9 item 9).** v2 already set T3's threshold at "one month's wages + fee at that port", and the review of v2 asked for a fixed margin in D on one scale with T3. m_v is that month made constant by taking one port. Choosing Kilwa, the cheapest port, makes m_v the **smallest** such month, so it is the most lenient margin: it lets more flips count and makes κ\* reachable sooner. Any bias from the choice therefore runs **against** the registered expectation of a null at κ = 2.4 (N1) and a high κ\* (N2).
  - **The margin applies to T1 (and the T2D threshold) only.** In T1, a flip at exact or near ties, including tie-breaking differences at c ≠ 0, cannot count. T3(a) and T4 are **deliberately margin-free**: N1 uses them to test §3's claim that time ties are rare, and a margin would hide exactly those ties.
  - **Sensitivity descriptors, reported only.** T1, T2D and κ\* are also computed at **m = 1 D** and at **m = 2·m_v** (70 D dhow, 110 D junk), with the T2D threshold equal to the same m. They need no extra solves. They do not replace κ\* and no prediction is scored on them.
- **Q(·) is each player's own value, in D.**
  - **RS:** Q(a) = planning net − Σc of the best plan that starts with a. Q_new(a_new) is the new solve's value; Q_new(a_old) is the value of a_old under the new costs (solve list, §5.3).
  - **HS, for T1 and T2D:** its per-month score difference times the months of a_new (the leg's months, plus one if a_new waits first): the D it gives up over that commitment by taking a_old's rate.
  - **HS, absolute Q for T3(b):** the numerator of its score over the option's own horizon. For *sail lane L now*: expected gross − wages × m − c_L. For *wait one month first*: gross_next − wages × m_next − c_next − (fee + wages). The two options span different horizons (m and m_next + 1 months); T3(b) compares them as HS's own numbers do not, and this is stated beside the values.
- **The T2′ denominator** ("the storm-blind player's own planned net at the state", κ-free):
  - **RS:** R's projected planning net from `solve` at that state.
  - **HS:** H plans one leg at a time, so its plan horizon is the chosen lane's leg. The denominator is **H's chosen lane's expected gross − wages × m** at that state, exactly the numerator of `harnessPlan`'s `perMonth` (`tests/03/baseline-harness.js:103-104`). A sailing leg pays no port fee, so fees enter only if H waits; at a state where H waits because no lane is allowed, the denominator is −(fee + wages). If a cell's sum is ≤ 0, its T2′ is reported as undefined.
- **κ grid:** 2.4 (the repair price), 6, 12, 24, 60, 120, 240, 600 and 1,200 D per point.
  - At 1,200 a dhow's high-tier storm costs 0.35 × 30 × 1,200 = 12,600 D, about one capacity-limited dhow month.
- **κ\*** is the smallest grid value at which **T1 and T2D are both meaningful in the same cell, in at least 2 of the 6 cells.** It is reported per player.
  - **Monotonicity is not required.** Every qualifying grid value is listed. If qualification is not monotone in κ, the pattern is reported as found and κ\* is still the smallest qualifying value; nothing is smoothed.
  - It is also given as an **expected cost per high-tier leg in D** (dhow and junk, normal) and as a **multiple of today's storm cost** (κ\*/2.4). The owner uses that number.
  - If no grid value qualifies, κ\* is reported as "> 1,200".
  - **Junk κ\* is reported, with this caveat beside the number:** the junk's c is half the dhow's because stormResist = 0.5 (`:1881`). The literature records (#34; `research/03/literature/p02-p03-extended-search-addendum.md:129`) state that the sources do not establish a storm-damage advantage for the junk. Junk κ\* is a property of that game parameter, not of evidence.
- **Few states.** Each cell reports state visits and distinct states. T1–T4 are computed per visit (the registered form) and per distinct state (reported). A cell with fewer than 20 distinct states is flagged "few states" beside its values; the flag does not change κ\*.

**The dominance rule in RS's DP (owner default 1).** R's `solve` keeps, at each (port, month) with an empty hold, the single state with the most planning cash, and at the end the most net (strict ">", so the first state found wins ties). RS keeps **every label not dominated on (planning cash, Σc)**: a new label is discarded if an existing label at that (port, month) has cash ≥ and S ≤ (ties keep the first); otherwise it removes the labels it dominates. At the end RS takes the largest Q, strict ">", in the order labels were found.
- **Why this rule.** Pruning by planning cash with Σc carried lets c decide only among complete plans whose prefixes survived on cash, so c could barely influence routing and κ\* would be biased upward. Pruning on Q-to-date (cash − Σc) lets c route, but it discards a richer label whenever a poorer one has less Σc, although a dinar of cash early is worth more than a dinar at the end: it buys cargo (λ). The Pareto rule keeps both kinds of label, so RS adds no approximation beyond the one R already makes (that more planning cash never hurts). Adaptive routes found that assumption can fail (`adaptive-routes/results.md`, "One caveat about 'best'"), so RS, like R, is a lower-bound planner.
- **Buys and ruin stay on planning cash.** Labels differ only in which deliveries they contain; each label's cash path is R's for those deliveries.
- **At κ = 0 it is R.** All S are 0 in the per-κ form, so Pareto reduces to "most cash, first wins ties" (K10a).
- **One solve serves every κ > 0.** Dominance on (cash, S) is unchanged by multiplying S by any κ > 0, so the labels kept are the same at every grid value. RS solves once per state and cost set, keeps all terminal labels with their first action, and evaluates Q = net − κS/1000 at each κ (strict ">", in insertion order). This equals running the per-κ DP at each κ (K10c), and it is why the solve list in §5.3 does not scale with the grid. K10c tests that the evaluation reproduces the per-κ DP; it does not test optimality, which RS does not claim (the lower-bound statement above).
- **Measured cost** (timing prototype, §5.4 and §9 item 9): a Pareto solve under the new costs keeps about 5 times R's labels and takes about 35–48 ms against R's 5.7 ms; under the old costs, 13–16 ms.

## 5. Arms, players and run (owner decision: checks plus a short run)

### 5.1 Worlds

| Arm | Storm rule | How it is measured |
| --- | --- | --- |
| W0 | **Control:** the engine unmodified (original `sailTo`) | H runs; R's W0 exposure from K1's normal runs (seeds 200001–200300) |
| W1 | M1, regions §2.1, tiers §2.3 | H and R runs; κ sweep states |
| W2 | M2 | H runs; expected exposure on R's paths |
| W3 | M3 | H runs; expected exposure on R's paths |
| W4 | M1 with SCS-early | H runs; expected exposure on R's paths |
| W5 | M1, with two legs mixed by length: Calicut–Malacca p = 0.208 p_AS + 0.563 p_BoB + 0.229 × 0, and Malacca–Quanzhou p = 0.895 p_SCS (strait none) | H runs only (exploratory) |

W4 and W5 cost seconds as harness runs, so both are kept. Neither enters the κ sweep.

**Expected exposure on R's paths** is Σ p over the legs R sailed in its W1 runs, under each mapping. It is arithmetic on recorded paths, so no extra re-planning runs are needed.
- R ignores storms, so its route changes between worlds only through hull damage, repairs and their effect on cash. W1's paths are therefore an adequate stand-in for W2–W5 **for expected storm counts**, which depend only on which legs are sailed in which months. They are not a stand-in for realised storms, porcelain losses or nets.
- Realised storm counts and porcelain losses for W2–W5 come from H's runs.

### 5.2 Players

| Player | What | Source |
| --- | --- | --- |
| H | the published harness; ignores storms | `harnessPlay` (`tests/03/baseline-harness.js:108-122`), unchanged |
| R | the published re-planning DP; ignores storms | a **copy** of `Sim`, `deliver`, `solve`, `planBuys` and `replanRun` from `research/03/models/adaptive-routes.mjs` (the file runs and writes on import) |
| HS | **storm-aware myopic** (κ sweep only; scores at H's states, never acts) | research code |
| RS | **storm-aware re-planning** (κ sweep only; solves at R's states, never acts): R's DP with Σc in a separate ledger, Q = planning net − Σc, and the Pareto dominance rule of §4 | research code |

**How HS scores its options** (the same policy filter as H):
- **Sail lane L now:** (gross − wages × m − c_L) / m.
- **Wait one month first, then sail the best lane next month:** (gross_next − wages × m_next − c_next − (fee + wages)) / (m_next + 1), with next month's prices and transit.
- The higher score wins. "New" and "old" differ only in c.
- **Known bias:** the wait score omits the expected port story (5.6–16.9 D by port, §3), as H's own scoring does. It understates waiting by that amount in both cost sets, so it biases HS slightly towards sailing; it cancels in a_new against a_old only where both or neither wait.

### 5.3 Cells, seeds, feed and the solve list

- **Cells:** 2 vessels × 3 policies (*sail always*, *avoid headwind*, *avoid headwind and transition*), at normal, starting at Calicut.
- **Survival:** H in W0 and W1 only. Survival doubles storm damage, so it shows the widest porcelain tail.
- **Seeds:** N = 300 per cell, **500001–500300**, disjoint from all earlier runs. R's W0 exposure reuses K1's normal runs on 200001–200300.
- **Feed:** the seed stream that `harnessReset` installs (mulberry32 per seed), as the published runs used.
  - Arms are therefore **unpaired:** the extra monsoon-month roll shifts every later draw.
  - Arm comparisons are of distributions and counts. No paired net difference is claimed.
- **κ sweep sample:**
  - **RS:** R's W1 decision states from the **first 20 seeds** of each normal cell (120 campaigns; about 18–20 states each, so about 2,100–2,400 state visits).
  - **HS:** H's W1 states from all 300 seeds; its scoring is cheap.

**RS solve list, per distinct state (each solve is the κ-free Pareto solve of §4, which serves all nine κ):**

| Solve | Gives | Needed for |
| --- | --- | --- |
| F_new: full solve, new costs | a_new(κ) and Q_new(a_new)(κ) for every κ; the new plan (T4) | T1, T2D, T4 |
| F_old: full solve, old costs | a_old(κ) and the old plan for every κ | T1, T2D, T4 |
| W_new: wait first, then solve, new costs | Q_new(wait)(κ) | T1 and T2D whenever a_old = wait ≠ a_new; T3(b) |
| D_new(path): that delivery first, then solve, new costs | Q_new(path)(κ) | T1 and T2D, once for each **distinct** delivery path that is a_old ≠ a_new at some κ (none if a_old = a_new at every κ; no solve if the delivery ends the campaign) |
| N_new: no wait at the root, new costs | max Q_new(sail)(κ) | T3(b) only |
| W_old, N_old: the same under old costs | Q_old(wait), max Q_old(sail) | T3(b) only |

So each distinct state takes **6 + d** Pareto solves, where d is the number of distinct D_new paths (0 to 9). κ = 0 needs no solve beyond K10a, because RS at κ = 0 is R. **HS** needs no solves: each score is a few lookups.

### 5.4 Run size and time

**Basis, measured for v3 and v4** on the drafting machine (Windows 11, Node 24.22.2) in the scratch folder, not on the run machine:
- R's `solve`: 5.7 ms mean over 106 states along R's hazards-off normal plans (6 cells).
- One R campaign through the engine (`replanRun`, hazards on, seeds 200001–200005, every vessel × difficulty × policy cell): 68–118 ms; mean 89 ms at normal, 95 at hard, 84 at survival. *Sail always* is the slowest policy (94–118 ms). (v3 had timed only *avoid headwind* at normal, 97 ms with 10 seeds; the estimates below now use the per-cell range.)
- One H campaign: 0.6–1.5 ms per cell (50 seeds each); a first, unwarmed batch gave 4.1 ms.
- Pareto solves, mean per state over the same 106 states: F_new 47.5 ms, W_new 39.7, N_new 35.2, F_old 16.2, W_old 14.4, N_old 13.0; D_new 5.3 ms per state on average. **All six plus D_new: 171 ms per state for all nine κ.** The required four (F_new, F_old, W_new, D_new): 109 ms.
- These replace v2's "a solve takes at most about 3 ms", which came from the published run on another machine.

| Block | Work | Time (estimate) |
| --- | --- | --- |
| K8, K3, K2, K4, K5, K7 | lookups, scripted cases, engine suites, `planted-defects.mjs` | ≤ 2 min (not timed) |
| K1 | W0 through the original `sailTo`: 5,400 R + 5,400 H campaigns (seeds 200001–200300) + 36 hazards-off replays, **once** | ≈ 8–10.5 min (5,400 × 89–118 ms) |
| K1b | the `sailTo` copy at the "today" mapping: 5,400 H campaigns + 36 hazards-off replays, **once** | ≤ 0.5 min |
| Exposure, H | W0–W5 normal (10,800) + W0–W1 survival (3,600) = 14,400 campaigns | ≤ 0.5 min |
| Exposure, R | W1 normal, 1,800 campaigns, recording RS states | ≈ 2.7–3.5 min |
| Expected exposure, W2–W5 | Σ p on R's W1 paths | seconds |
| K10 | κ = 0 identity on all RS states; the liquidity invariant at κ = 1,200; frontier against per-κ DP on 300 states at 3 κ; HS scripted cases | ≈ 1 min |
| κ sweep, RS | ≈ 2,100–2,400 visits × 171 ms (≈ 210 ms if d averages 1) | ≈ 6–8.5 min |
| κ sweep, HS | 1,800 campaigns' states × 2 cost sets × 9 κ | ≤ 1 min |
| **Total** | **≈ 27,000 campaigns + ≈ 15,000 Pareto solves** | **≈ 22–28 min**, one Node ≥ 22 process |

W1 campaigns may run somewhat slower than W0 ones (more storms, more repairs); the per-cell range above is from W0. The d term (≈ 210 ms if d averages 1) is set from the prototype's count of 0.10 forced solves per state (§9 item 9).

**Cap and stopping rules, fixed now:**
- **Wall-clock cap: 30 min.** Before each block starts, and after its first 10%, the projected total is computed: elapsed time + this block's projection from its first 10% + each unstarted block's estimate above × the largest ratio of measured to estimated time among the blocks run so far (at least 1).
- **If the projection exceeds the cap, these cuts are made in order, re-projecting after each, until it fits:**
  1. the T3(b) solves (N_new, W_old, N_old) are dropped; T3(a) is kept. Saves about 36% of the RS sweep (≈ 2–3 min). If this cut fires during the sweep, the T3(b) values already computed are **discarded**, not reported for a partial sample;
  2. the RS sample shrinks to the first 10 seeds per cell. Halves what is left of the RS sweep (≈ 2–3 min);
  3. K1's re-planning reproduction is restricted to normal (1,800 of 5,400 R campaigns; all harness nets still checked). Saves ≈ 5.5–7 min if K1 has not started;
  4. **if the projection still exceeds the cap,** the RS sweep is not run. κ\*(RS) is reported as "not measured (cap)", everything else is reported, and the owner decides whether to rerun with a higher cap. Checks are never cut except as in step 3.
- Any cut is logged in §13 before a result is read.
- **One heavy job at a time.** Each block runs once, and N is not raised.
- **Bugs.** A bug found after results means a full rerun, with both outputs reported.

## 6. Measures

Per campaign, the net is the engine's E-net (`state.cash − state.startEquity` at `finishCampaign`). Every figure gets a mean, a 95% seed-level percentile bootstrap CI (10,000 resamples, bootstrap seed 20261124) and p10–p90.

- **Exposure (registered output 1):**
  - storms by region × departure month × leg × wind status, per world and player, realised and expected;
  - storms per campaign, and storms on turned-back attempts;
  - the realised and expected storm count on each of the **seven tailwind lane-months** that become high (§2.4), listed one by one, per vessel.
- **Porcelain tail (registered output 2):** per campaign,
  - porcelain lots broken on legs where hull was below 70 *because of storms*;
  - their value at the destination's live price at arrival;
  - reported as p90, p99, maximum, and the share of campaigns with any such loss, per cell, world and difficulty.
  - **Attribution rule.** For each campaign the logged hull path is **replayed without storm damage**: starting from 100, every logged non-storm hull change is applied in order (headwind damage, the hull floor of 5, the Calicut story's +8 capped at 100), and the **same repair rule** is re-evaluated on the replayed hull (repair 25 points for 60 D when hull < 60 and cash > 200, with cash adjusted by the replay's own repair spending). A broken lot counts as storm-caused if the logged hull was below 70 on that leg and the replayed hull was ≥ 70. The player's actions are those logged; only hull and repairs are replayed.
- **κ threshold (registered output 3):** T1 and T2D at each κ, per player and cell; κ\* per player, also expressed in D per high-tier leg and as κ\*/2.4; T2′, T3 and T4 beside them; visits and distinct states per cell.
- **Reported, not registered:**
  - departures by calendar month;
  - waits;
  - legs per lane;
  - repairs and mutinies;
  - doldrums per transition leg (0.25 expected);
  - turn-backs;
  - the spread of net (SD, p10–p90, minimum);
  - median net, W1 against W0 (unpaired);
  - RS's planning-net change from reacting (planning net of the new plan − of the old plan, c excluded): what storm avoidance costs in cash.

## 7. Checks

All checks run before any result is read, and each must fail on its planted defect. The exposure blocks write their outputs before K10 runs, but nothing is read until every check has passed. Defects are planted in a temporary copy of the research code; K8's are planted in a temporary clone. If any check fails, nothing is scored, and the fix is reported with both outputs.

| # | Check | Pass | Planted defect that must make it fail |
| --- | --- | --- | --- |
| K1 | **Control reproduces published nets.** W0, seed stream as `harnessReset` (seeds 200001–200300), players H and R, run once | All 5,400 harness and 5,400 re-planning nets in `research/03/results/2026-11-23-adaptive-routes/hazards-on.json` (in seed order), and the 18 hazards-off harness nets and 36 plan nets in `hazards-off.json`, exactly | the W0 hook deducts 1 D at the first departure |
| K1b | **The `sailTo` copy is the engine at today's rule.** The copy runs with a "today" lookup (0.35 / 0.18 in transition months, 0 otherwise, every region); same feed, player H, plus the 36 hazards-off replays, run once | Every net identical; state equal after every action | doldrum band width 0.24 in the copy |
| K2 | **Region assignment, three ways.** (i) the run's own lookup, as dumped; (ii) separate code that recomputes §2.1's shares from the page's `seaWaypoints` and the inverse projection and assigns all 10 directed legs; (iii) §2.1's table, transcribed as a fixture | (i) = (ii) = (iii) for all 10 legs; each reverse leg equals its forward leg; an unknown leg throws | in the **run's lookup**: (a) Calicut–Malacca assigned to AS; (b) a reverse-leg lookup that falls back to none instead of throwing |
| K3 | **Tier and probability table, three ways.** (i) the run's lookup (region × month → tier → p, per mapping and navigator); (ii) separate code rebuilding §2.3 and §2.4 from the §2.2 counts; (iii) §2.3's table as a fixture | All 48 tier cells and every p equal across (i), (ii), (iii) | in the **run's lookup**: (a) `>` for `≥` at 0.1 (AS August becomes none); (b) the SCS shift made one month later; (c) the peak taken over all regions |
| K4 | **Per-tier probability boundaries**, per tier × navigator, with scripted rolls. Includes the doldrum band | **Transition month:** p − 1e-9 → storm; p → doldrum; p + 0.25 − 1e-9 → doldrum; p + 0.25 → calm. **Monsoon month:** p − 1e-9 → storm; p → calm; tier none → **no draw** (an unscripted draw throws). Navigator values are exactly 18/35 of each tier | (a) navigator factor applied twice; (b) a roll drawn when p = 0; (c) `<=` for `<`; (d) doldrum band fixed at [0.35, 0.60) whatever p is |
| K5 | **Scripted RNG.** `tests/03/engine/*.test.mjs` pass against the real file. The copy at the "today" lookup passes the same `sail.test.mjs` cases. Two new scripted cases: a storm on a headwind leg that turns back, and the draw order (headwind damage, turn-back, teak, storm roll, storm damage, mildew, piracy, mutiny) | All pass | the storm block moved after the porcelain check: in a scripted transition leg, the storm takes hull from 75 to below 70 and then no porcelain breaks |
| K7 | **Transit baseline unchanged.** In every arm, `computeTransit` reproduces `tests/03/fixtures/baseline-transit.json`, status strings included | 480/480 | a wrapper that marks high-tier months as `isDeadZone` (transit times change) |
| K8 | **Game file unchanged.** SHA-256 of the file the loader actually read, before and after every run, equals the header hash; `MONSOON_INDEX` is unset; the engine suites and `planted-defects.mjs` pass | All hold | (a) `index.html` edited during a run, in a temporary clone; (b) `MONSOON_INDEX` pointed at a copy |
| K10a | **RS at κ = 0 is R.** The per-κ RS DP at κ = 0, on every RS state | First action, plan and net identical to R's `solve` | RS's DP omits the wait action |
| K10b | **Liquidity invariant (B1).** At κ = 1,200, on every RS state: RS's chosen new plan, executed in the planning `Sim`, has the same buys, repairs, cash after every action and end condition (ended, month, cash < −250 D) as the same plan executed at κ = 0; and RS's Q equals that plan's planning net − Σc, recomputed from its legs and the K3 lookup | All equal | c deducted from planning cash in RS's `Sim` |
| K10c | **One solve serves every κ.** On the first 300 RS states, at κ = 2.4, 120 and 1,200: the frontier evaluation (§4) against a per-κ RS DP. It tests the evaluation, not optimality (RS is a lower bound, §4) | Identical a_new and Q | the frontier evaluated without κ (S used at κ = 1) |
| K10d | **HS scores.** (i) One scripted state per cell at κ = 120: HS's sail and wait scores, new and old, equal an independent evaluation of §5.2's formulas. (ii) HS at κ = 0 with waiting disabled decides as H on all H states | (i) equal to 1e-9; (ii) identical decisions | c divided by (months + 1) in HS's sail score |

**Order:** K8, K3, K2, K4, K1, K1b, K5, K7, then the exposure blocks, then K10a–d, then the κ sweep.

RS and HS never execute an action in the engine, so c cannot reach engine cash; v2's engine-cash clause in K10 is dropped because it could not fail.

**Dropped from v1:**
- K6 (keyed draws): v2 uses the seed stream.
- K9: folded into K4.

**Intended changes.** None in the research code: transit, wind status and the fixture stay unchanged by construction.

**At implementation (upstream), only text changes** (line numbers at `cedef87`):
- the status label "Dead Zone (35% Storm)" (`:2154`). The fixture's `status` column changes for transition rows; `days`, `months` and `effSpeed` do not;
- the transition label "Dead Zone • 6 kts (Cyclone/Doldrum Risk)" (`:2106`) and the route hint "⚠ Cyclone/Doldrum Dead Zone" (`:2808`);
- the log line "Struck by inter-monsoon cyclone" (`:2341`);
- the glossary and navigator notes (`:1002`, `:1441`, `:1459`), and the Atlas override of the navigator note, "about half the cyclone risk in transition months (game rules)" (`:3106`);
- the junk card "-50% Headwind & Cyclone Hull Damage" (`:1132`) and the survival card "2x cyclone severity" (`:1163`). The junk's storm text at `:1124` and `:3095` is listed too, for the literature caveat in §4;
- the Atlas cyclone card (`:3358`);
- the source lines that `tests/03/atlas-events.test.mjs` maps.

## 8. Predictions

| ID | Prediction | Blind? | Contradicted if |
| --- | --- | --- | --- |
| N1 | **The null.** At κ = 2.4, for RS and HS: T1 < 2%, T2′ < 0.1%, T3(a) < 1% and T4 < 2% in every normal cell | informed (§3; skeleton `:16`). Thresholds unchanged from v2; T1 now carries the margin m_v (B2) | any fails in any cell |
| N2 | κ\*(RS) > 24 D a point, i.e. a dhow high-tier storm would have to cost more than about 250 D | **informed**: by §3, and by the timing prototype's count of forced solves (§9 item 9). Wording unchanged from v2; κ\* is now the v3/v4 definition | κ\* ≤ 24 |
| N3 | κ\*(HS) ≤ κ\*(RS): the myopic player reacts sooner, because its scores leave out the value of later months | **informed** by the timing prototype's count (§9 item 9), which concerns RS-type choices; written blind in v2 | κ\*(HS) > κ\*(RS) |
| N4 | **Withdrawn as a prediction; descriptive statement, seen.** On the published hazards-off greedy paths, M1 puts 0.24 (dhow) and 0.36 (junk) of expected storms under *avoid headwind* on Malacca–Quanzhou in June–November, so v2's "≥ 50%" is expected false. The per-path table is in §2.4. W1's realised share for R is reported, not scored | seen (§9 item 8) | — |
| N5 | Storm-caused porcelain loss (attribution rule, §6) has p99 < 1% of the cell's median net in every normal cell, for H in W1 | blind | ≥ 1% in any cell |
| N6 | H's median net in W1 is within ±1% of W0's in every normal cell (unpaired) | informed | outside in any cell |

**No replacement for N4.** Every statement about where R's or H's W1 storms fall is now informed by the per-path expected counts, so none would be blind.

**One-sentence finding, drafted before running:**

> "Regional storm seasons would move the game's storms out of the transition months and onto the best China-bound and Bay of Bengal winds, and raise the expected storms on the paths players sail. At today's damage, though, a storm costs tens of dinars against hundreds or thousands for a month of delay, so wind and prices still decide when and where to sail, except between options that already tie in time. A storm would have to be valued at κ\* = … D a hull point (… times today's cost) before a storm-aware player's decisions change by more than a month's port costs."

## 9. Results already seen (complete list)

1. **Economy skeleton**, all outputs (`research/03/results/2026-11-22-economy-skeleton/`). In particular:
   - hull damage hardly matters (`results.md:16`), and time alone decides waiting (P2.3, `:45`);
   - λ = 383 → 11,500 D a month for the dhow and 355 → 27,556 for the junk (P2.4, `:42`);
   - every best cycle runs through Malacca (`:59`).
2. **Adaptive routes**, all outputs (`research/03/results/2026-11-23-adaptive-routes/`), including the nets K1 reproduces, the hazards-off plans used in §2.4, and the finding that more cash can hurt (check 2).
3. **Depth-and-liquidity protocol** (registered, not run): its §3 disclosures and its keyed-draw design.
4. **Specialist-pricing protocol, now registered** (#31, merged at `cedef87`; `research/03/pre-registrations/2026-11-23-specialist-contracts-balance.md`): its §3 disclosures, its pilot storm term (§4.3, reported only) and its pairing of the transition roll (§6).
5. **#34, merged at `1425bfb`:** the DR08 results (`research/03/results/2026-11-23-copeland-dr08/`: a bounded reproduction of Copeland (2026) Table 5 column 1, N 107, −0.311, SE 0.155) and the dated literature corrections. DR08 concerns trade and sailing time, not storms, and bears on nothing here. The literature correction used here: the Bakau/Maranei comparator "does not establish … a storm-damage advantage" for the junk (`p02-p03-extended-search-addendum.md:129`).
6. **Open draft PR #32** (head `74f8ed9`): storms and pirates on the Atlas map. Its design was seen; no run of it bears on this protocol.
7. **R0 baseline,** through the adaptive-routes "§5 harness median" column.
8. **Arithmetic done for v1, v2 and v3, and the review of v2:**
   - §2.1 shares and the projection fit, §2.3 tiers and the single-storm table, §2.4 exposure and lane-month tables (from the transit fixture), and §3's costs, all recomputed for v3;
   - **the per-path expected storms in §2.4,** computed by the review of v2 and recomputed for v3 from `hazards-off.json`. N4 is relabelled because of them;
   - **the porcelain tail as arithmetic:** a dhow with 15 lots of porcelain whose hull a storm drops below 70 loses 20% (3 lots, up to about 630 D at Kilwa's price of 210) on each later headwind or transition leg until it is repaired. The harness repairs only below 60.
9. **The v3 timing prototype** (scratch folder, not committed). On 106 states along R's hazards-off normal plans (W0 states, not W1), it ran R's `solve` and three storm-aware variants under the M1 and today's cost sets. It printed only times, label and terminal counts, three equality booleans (each rule equals R at κ = 0; the frontier equals the per-κ DP at κ = 2.4, 120 and 1,200; the liquidity invariant held on 40 states at κ = 1,200), **and one count that carries information about the outcome: 0.10 forced delivery solves per state.** That means that on at most about 10% of those W0 states, at some κ in the grid, today's cost set chose a delivery as first action that differed from the M1 choice, with no margin applied (flips where today's choice was *wait* were not counted). **The margin m_v, the T2D threshold, the solve list and the RS sample were fixed after that count was printed**, and the d term of the time estimate in §5.4 (≈ 210 ms per state if d averages 1) uses it too. The rationale for m_v and T2D predates the count (§4), and the m = 1 D and m = 2·m_v descriptors are reported so the choice can be seen. N2 and N3 are relabelled informed because of it. N1, N5, N6 and T1's 10% threshold are v2's, unchanged. No decision, value or flip was printed per state. A second timing script for v4 timed R and H campaigns in every cell and printed times only.
10. **v1 and v2 of this protocol and their reviews.** Nothing in v2 was chosen after any run.
11. **Seen after v4 was drafted and before registration (2026-11-24):**
    - the depth-and-liquidity results (#44, `research/03/results/2026-11-24-depth-liquidity/`), including the owner's C6 ruling (cash observed after every sail and wait, all arms) and the before-credit minima;
    - the unfunded-departure finding (#41, `research/03/results/2026-11-24-unfunded-departures/`): the H harness cannot refuse a lane;
    - the registered scaling-costs protocol (#46, `research/03/pre-registrations/2026-11-24-scaling-costs.md`), which adopted this protocol's m_v as a physical scale and whose wage rule W overlaps any wage effect here. Both studies feed the one combined engine change; neither study's numbers carry over to the combination.
    None of these is a run with storm regions or tiers, and none changes a value, threshold or prediction here.
12. **Not seen:** any run with regions or tiers in the engine, or any storm-aware player at a W1 state.

## 10. Interaction with the specialist redesign (registered protocol)

- This study runs under the **current** rules, and no player buys a navigator. The navigator's effect therefore enters only through K4 and K3's navigator column.
- The specialist-pricing protocol is now **registered** (§9 item 4). Its pilot (the navigator's effect) and armed guards (the marines' effect) become roles on a per-passage booking. **Both enter the later combined engine change**, which also carries this storm rule if it is adopted. Neither study's numbers carry over to the combination.
- **The pilot's storm term.** In the registered protocol it is "reported only, not part of the price": 0.17 × mean storm damage × 2.4 D, on dead-zone attempts. Under this change the pilot's reduction becomes (17/35) × p_tier on **any** leg whose tier isn't none: under M1, 0.17, 0.085 and 0.034 for high, mid and low. It is zero on transition legs whose tier is none (AS and SCS in March and April). The pilot's price basis (EV_time, time value) does not include storms, so the price rule itself is unaffected, but the reported storm term must be recomputed in the combined change.
- **Pairing.** The registered protocol pairs storms through the transition roll alone ("the same transition roll gives a storm for u < 0.35 without a pilot and u < 0.18 with one"). Under this change, monsoon months add a storm draw, so the draw order and that pairing must be re-specified in the combined change.
- **Guards** are unaffected directly (piracy is unchanged here), but a storm draw in monsoon months shifts every later draw in the seed stream, including piracy's.
- The registered protocol's line numbers are at `f475726`, 104 lines higher than this protocol's (header).

## 11. Decisions recorded (owner, 2026-11-24)

| Item | Decision |
| --- | --- |
| Scope | Checks plus a short run (≈ 22–28 min, cap 30) instead of v1's full design (≈ 81,000 campaigns, 1–1.5 h). The null is predicted up front; the registered outputs are the exposure picture, the porcelain tail and κ\* |
| Scaling | Each sea scaled to its own peak; absolute frequencies are not compared across seas (§2.3) |
| Shared roll | Kept in transition months; becalming stays 0.25 |
| Turned-back attempts | A storm is drawn, as headwind damage is today |
| Storm before porcelain | As today |
| Month | The departure month only |
| Regions | One region per leg (W5 kept as an exploratory comparison) |
| Kilwa's SWIO exposure | A known gap (§2.1, §14) |
| *Avoid headwind and transition* | Keeps its definition (it avoids `isDeadZone`). **Consequence:** under the new rule it still avoids doldrums and slow transition legs, but no longer avoids storms. Under M1 it runs into the high-tier monsoon months (2.1 expected storms per campaign on its published path, against 0 today), so its name no longer describes its storm exposure. It is kept for comparability with the published runs |
| PR #32 | If the change is adopted, #32's storm display follows the new rule |
| Storm damage | Decided by the owner after this run, using κ\* |

### 11.1 Owner choices recorded as defaults

These were written in as defaults. **Owner confirmation, 2026-11-24: A, B and C are approved as written**, with the qualifications listed under them; after registration they are frozen.

**To confirm before registration** (set after the timing prototype's count, §9 item 9):

A. **m_v and T2D:** m_dhow = 35 D, m_junk = 55 D, and T2D's threshold = m_v (§4, with the pre-leak rationale).
B. **The sensitivity descriptors:** T1, T2D and κ\* also at m = 1 D and m = 2·m_v, reported only (§4).
C. **HS's T2′ denominator:** H's chosen lane's expected gross − wages × m at the state, and the matching absolute Q for T3(b) (§4).

**Qualifications recorded with the confirmation (owner, 2026-11-24):**
- The primary result is the pre-specified 35/55 D definition. The 1 D and 2·m_v values are descriptive, not separately scored, and are reported **together** with the primary value. If κ\* moves materially across the three, that dependence is itself a finding and is reported as such; the primary threshold is not presented as objectively correct.
- N2 and N3 stay labelled **informed** after confirmation; the report does not present every hypothesis as blind.
- For HS's T2′, report the denominator and the number of contributing states per cell. HS's one-leg expected net is not comparable to the re-planner's full-horizon net, so no cross-player percentage comparison is made.
- Confirming these values does not authorise any change to the game's storm mechanics. Storm damage is decided by the owner after the run (§11), using κ\*.

**Recorded earlier:**

1. **c in a separate ledger:** yes. RS keeps Σc apart from planning cash; buys, repairs and the < −250 D end read planning cash only. **Dominance rule: Pareto on (planning cash, Σc)** at each (port, month), with one κ-free solve serving the whole grid (§4). Measured cost: about 171 ms per state for all nine κ, against 5.7 ms for one R solve (§5.4).
2. **κ\* requires a flip margin and a regret in D:** m_dhow = 35 D, m_junk = 55 D; κ\* needs T1 ≥ 10% and T2D ≥ m_v in the same cell, in at least 2 cells (§4).
3. **N4** is relabelled as an informed (seen) descriptive statement with the per-path table (§2.4, §8). It is not counted as a prediction, and there is no replacement, because none would be uninformed.
4. **Re-pinned to `cedef87`.** §10 is updated for the registered specialist-pricing protocol, noting that pilots and guards enter the later combined engine change.
5. **Junk κ\*** is reported, with the literature caveat beside the number (§4).

## 12. Outputs and provenance

- **Code:** `research/03/models/storm-seasons.mjs` (Node ≥ 22, no dependencies).
- **Outputs,** in `research/03/results/<run date>-storm-seasons/`:
  - `checks.json`: K1–K10d with their plant outcomes, and the dumped lookup (K2, K3);
  - `exposure.csv`: region × month × leg × wind status, per world and player, realised and expected;
  - `porcelain.csv`;
  - `kappa.csv`: T1, T2D, T2′, T3(a), T3(b) and T4 per κ, player and cell, with visits, distinct states and the solve counts (d per state); T1, T2D and κ\* also at m = 1 D and m = 2·m_v;
  - `predictions.json`;
  - `results.md`, failures first, with any cut from §5.4 stated first.
- **Provenance:** commit, engine and script SHA-256, Node version, RNG, seeds, bootstrap seed, counts per cell, and wall-clock time per block against §5.4's estimates.

## 13. Deviations

Append dated entries below this line before any result that depends on them is reported. Each entry says what changed, why, and whether results had been seen.

### 2026-11-24 — engine pin, implementation choices and interpretations, fixed before any run (no result seen)

Written with the code (`research/03/models/storm-seasons.mjs`) and committed with it, before any check or scored block was run on the registered seeds. **No result of this study had been seen.** The development smoke runs disclosed in item 17 printed no metric value.

**Deviation**

1. **K8 "equals the header hash" cannot hold; the engine script is pinned instead.** `main` (at `a4062ae` when the run branch was cut) serves `projects/03/index.html` with SHA-256 `0fa1c5e2…`, not the header's `5c722df9…` (the page was rebuilt by #43, #45 and #50). Its inline engine script is still `6fba1ee7…` (62,591 characters), byte-identical to the registered one, as the header note and §17 record. The run therefore:
   - loads the page through `tests/03/engine/load-engine.mjs` `engineScript()` and refuses any engine script whose SHA-256 is not `6fba1ee7…`;
   - evaluates it with `lineOffset` 1692 (the `<script>` tag is on line 1693 at `cedef87`), and asserts that the storm block it replaces is at `:2333-2346` and `computeTransit` at `:2135` in that numbering;
   - hashes the page it read before and after every phase, and writes a phase's outputs only if the two hashes are equal (as #44 learned to do);
   - records both page hashes in the provenance.
   K2 reads `seaWaypoints` from the same page (the Atlas adapter, outside the engine script). Its text is identical at `cedef87` and on `main` (checked by `diff` when the code was written).

**Interpretations**

2. **Plants.** Each planted defect is a text substitution in a temporary copy of the committed `storm-seasons.mjs`, inside a temporary `git clone` of the run commit (so K8's plants are in a temporary clone too). The copy runs only the check concerned, stopping at the first failure ("plantcheck"); a plant counts as caught if that check reports a failure. The real checks run in full. K8's plants run a short probe phase in the clone: (a) appends to the clone's page after the start hash; (b) points `MONSOON_INDEX` at a copy. Each is caught if the probe exits non-zero and writes nothing. An unplanted probe in the same clone must exit 0 and write its output (control). K2's plant (b) is placed in the run's leg lookup: an unknown or reversed leg falls back to `"none"`.
3. **The W0 hook (K1)** is a recorder that wraps `sellCargoQty`, `buyCargoQty`, `repairHull`, `sailTo`, `waitInPort` and `harnessPlan` and only reads state; the same recorder runs in every arm. K1 compares the 5,400 harness and 5,400 re-planning nets of `hazards-on.json` in seed order, the 36 plan nets of `hazards-off.json` (each published `actionsLog` replayed with every draw 0.99), and its 18 harness nets. **K1b's "state equal after every action"** compares, after every wrapped action, a SHA-1 of the whole engine state (logs as a count) plus the log lines that action added, against W0's harness run on the same seed in K1. The 36 replays and 18 hazards-off harness runs are compared the same way.
4. **K4** takes the expected *p* from the §2.4 table and the tiers from K3's independent rebuild, not from the run's lookup. For each tier it picks a leg-month that is not a headwind and lasts at most 3 months, so no mutiny draw can occur; piracy is scripted at 0.99. For tier *none* in a transition month, "*p* − 1e-9 → storm" is a scripted roll below 0, which tests that the shared roll is still drawn at *p* = 0. Outcomes are read from the leg's log line.
5. **K5.** "The copy at today's lookup passes `sail.test.mjs`" is run on a copy of the page outside the repository, in which `sailTo` is the research copy and the today lookup is inlined; the test runs as a child process with `MONSOON_INDEX` pointing at the copy (the run's own `MONSOON_INDEX` stays unset). There are four new scripted cases, with hand-worked values:
   - (1) a storm on a monsoon headwind leg that turns back (Calicut→Kilwa, June);
   - (2) the draw order on that leg (headwind damage, turn-back, teak, storm roll, storm damage, piracy, mutiny);
   - (3) the draw order on a transition leg (storm roll, storm damage, mildew, piracy, mutiny). Mildew occurs only in transition months and headwinds only outside them, so no single leg has all eight draws;
   - (4) storm before porcelain: hull 75 → 53, and 2 of 10 crates break. This is the case K5's plant must fail.
6. **K7's arms** are W0, the "today" copy and W1–W5.
7. **Porcelain attribution (§6).**
   - The repair rule is replayed where the player applies it: for H at every harness iteration (after selling), for R at the start of every delivery.
   - A broken lot is valued at the attempted destination's live price in the month after the leg, turned-back attempts included.
   - The Calicut story's +8 is read from the wait's log line.
8. **Storms and expected storms.**
   - A storm is counted from the leg's log line ("Struck by inter-monsoon cyclone", verbatim in the copy).
   - Expected exposure is Σ *p* over every `sailTo` attempt, at the departure month and with no navigator. Turned-back attempts are included, because each attempt draws.
   - R's W0 exposure is realised from K1's normal re-planning runs and expected under today's rule.
9. **HS.**
   - (a) A state is the first `harnessPlan` call of a harness iteration, which comes after selling and repair.
   - (b) The wait option evaluates next month with cash − (fee + wages) and standing +15 at the port, as `waitInPort` does, and without the story (§5.2's stated bias). The next month's lane is the best by HS's own per-month score under the same cost set and κ. The option is unavailable if month + 1 ≥ 24 or no lane is allowed next month.
   - (c) Lanes tie in H's stable order. Wait is chosen only if its score is strictly higher.
   - (d) T3(b)'s "max *Q*(sail)" is the largest absolute numerator over allowed lanes. States without both a wait option and a lane are left out of T3(b)'s median, and their number is reported.
   - (e) T4 compares the first non-wait lane (for *wait*, next month's lane). The "whole sequence" is not applicable to one-leg plans.
   - (f) A lane's numerator is round(`perMonth` × *m*), which is exactly H's gross − wages × *m*.
   - (g) HS's T2′ denominator follows (C): H's chosen lane's numerator, or −(fee + wages) when H waits because no lane is allowed.
10. **RS.**
    - *Q*_new(*a*_old) comes from W_new or D_new as §5.3 lists. A D_new whose delivery ends the campaign returns that single terminal and is not counted in *d*.
    - T3(b) uses states where both N and W are feasible.
    - T4's "whole remaining sequence" is the plan's deliveries in order.
    - T2′'s denominator is R's `solve` net at the state (the projected campaign net).
11. **κ\*.** T2D is the mean regret, which does not depend on the margin. The thresholds are *m*_v (primary), 1 D and 2·*m*_v. "Meaningful" uses ≥ (§4: "≥ 10%", "≥ m_v").
12. **Figures and CIs.** §6's mean, 95% seed-level bootstrap CI and p10–p90 are given for the per-campaign figures (net, storms, porcelain loss). In the κ sweep, T1 and T2D get a seed-level bootstrap CI (campaigns resampled; 10,000 resamples, seed 20261124); the other κ-sweep descriptors are shares without a CI. Quantiles are sorted[⌊*q*(*n* − 1)⌋], as in the published runs.
13. **The cap (§5.4).**
    - "Elapsed" is the sum of the measured wall-clock times of the blocks. Phases run as separate processes, so time between phases is not counted.
    - Estimates are the upper ends of §5.4: K1 10.5 min, K1b 0.5, H exposure 0.5, R exposure 3.5, expected exposure 0.1 (the table says "seconds"), K10 1, RS sweep 8.5, HS sweep 1. The 2 min row for K8, K3, K2, K4, K5 and K7 runs in two pieces around K1 and K1b; the first piece carries the 2 min, the second what is left of it.
    - The plant runs §7 requires have no estimate in §5.4. They are timed and reported, outside the projection.
    - The F_new solves are computed once, in K10b, and cached for the sweep (they are κ-free and deterministic). Their time is charged to the RS sweep block, whose 171 ms per state includes F_new.
    - Cut 3 is taken to save 6.25 min, the midpoint of §5.4's 5.5–7.
    - K1's projection "after its first 10%" is made after 2 of its 18 cells.
14. **Output size.** `exposure.csv` is committed per cell (world × player × difficulty × vessel × policy × leg × month × wind status) if it is under 400 KB. Otherwise the committed file is aggregated over policies, keeping region × month × leg × wind status per world and player, and the per-cell file goes to the external archive. Per-campaign records, RS and HS states and the sweep detail go to the external archive, with SHA-256 in a manifest that names its root.
15. **Scoring edge cases.**
    - N1: a cell whose T2′ is undefined leaves that sub-test untestable ("supported where testable" if nothing fails).
    - N2: "> 1,200" counts as > 24.
    - N3: if both κ\* are "> 1,200", N3 is untestable.
16. **Samples.** R's W1 runs record RS states for the first 20 seeds of each normal cell (500001–500020); H's W1 normal runs record HS states for all 300 seeds.
17. **Development smoke runs, before this commit** (no metric value printed or read):
    - K1 and K1b on the first 3 seeds of each cell (seeds 200001–200003; these are published nets, already seen);
    - K2, K3, K4, K5 and K7 in full;
    - exposure → K10 → sweep → score on 2 non-registered seeds per cell (900001–900002), with only timings, check booleans and output structure (row counts, empty cells) inspected.
    No block was run on seeds 500001–500300.

---

## 14. Limits and remaining OPEN items

**Known limits (not open):**
- **Kilwa's legs.** The South-West Indian Ocean season is not represented on them (0.34 and 0.48 of the two legs lie south of the equator).
- **Departure month only.** Using the highest tier over the months at sea would raise exposure on long legs.
- **Storm-blind players.** H and R measure exposure, not trade-offs; the κ sweep rests on HS and RS, evaluated at H's and R's states, never acting.
- **c is a lower bound.** It leaves out porcelain and mutiny, which the porcelain tail reports separately.
- **κ\* is for these players.** RS is a lower-bound planner (adaptive-routes check 2), and neither player is a student.
- **Unpaired arms.** Comparisons between worlds are of distributions only. R's W0 exposure comes from different seeds (200001–200300) than its W1 exposure.
- **Few distinct states.** Shares may rest on few distinct states per cell (§4 flags them).
- **Timing measured on the drafting machine.** The run machine may be faster or slower; the stopping rule in §5.4 handles it.

**Still OPEN:**
1. **HKO and IMD count different things over different areas.** The SCS row is tiered on the all-cyclone shape. If a verified monthly SCS series of storms of 34 kt and above is supplied before registration, the row is re-tiered then, never after a run.
2. **Committed tests.** Whether K2, K3, K4 or K5 become committed tests in `tests/03/` at implementation is the owner's call, under AGENTS.md rule 8.

## 15. Changes from v1

| v1 | v2 |
| --- | --- |
| Full design: 6 worlds × 5 players, ≈ 81,000 campaigns, 1–1.5 h | Checks plus a short run, ≈ 34,000 cheap campaigns + ≈ 130,000 solves, ≈ 15–20 min, 30 min cap |
| Predictions S1–S7 among other aims | The null stated first (§3, N1); registered outputs: exposure, porcelain tail, κ\* |
| Keyed draws, pairing and K6 | The seed stream; arms unpaired; K6 dropped; K9 folded into K4 |
| Realised T2 (RSo runs) | T2′, the planned value of reacting, on identical states |
| κ sweep at 24 and 120 | A 9-point grid from 2.4 to 1,200, with κ\* defined |
| RS run in full in W0–W4; HS run in full | RS and HS evaluated on states from R's and H's W1 runs |
| OPEN 1–8 | Owner defaults recorded (§11); two items still open (§14) |

## 16. Changes from v2 and v3 (2026-11-24)

### From v2 to v3 (adversarial review of v2)

**Blocking**
- **B1 (c reduced planning cash).** c now sits in a separate ledger and never touches planning cash; Q = planning net − Σc (§4, §5.2). The DP's dominance rule is stated: R keeps the most cash per (port, month); RS keeps the Pareto set on (cash, Σc), with the reason and measured cost (§4, §5.4, §11.1 item 1). New check K10b with a plant: at κ = 1,200 the chosen plan's buys, repairs, cash path and end condition equal those at κ = 0, and the plant (c deducted from planning cash) must fail it (§7).
- **B2 (T1 nearly equal to its alternatives; mixed scales; missing solves).** A flip counts only if Q_new(a_old) < Q_new(a_new) − m_v, with m_dhow = 35 D and m_junk = 55 D fixed now. κ\* requires T1 **and** a regret in D (T2D ≥ m_v), **in the same cells**, in at least 2 cells. T2′ is a ratio of sums (no mean of ratios) and is reported only. T3 uses a per-state ratio |Δ|/m_v and its median (no median-against-per-port threshold). T4 compares the first delivery; the whole plan is reported. Every solve per state is listed, including Q_new(a_old) (W_new or D_new) and the T3 solves (N_new, W_old, N_old); one κ-free solve per state and cost set serves all nine κ (§4, §5.3). Re-timed: ≈ 171 ms per state for all κ, ≈ 23–26 min in all (§5.4).
- **B3 (K10 could not fail).** K10 is split: K10a (κ = 0 identity, plant: no wait action), K10b (the B1 invariant at κ = 1,200), K10c (frontier against per-κ DP, plant: κ omitted) and K10d (HS scores against an independent evaluation at κ = 120, plant: c divided by months + 1). The engine-cash clause is dropped: RS and HS never act in the engine (§7).

**Medium**
- **M1 (N4 scorable and false).** Per-path expected storms recomputed from `hazards-off.json` and tabled (§2.4); they match the review's numbers. N4 relabelled as a seen descriptive statement; no replacement (§8). §2.4 now says M1 keeps the level only per unweighted lane-month.
- **M2 (AS rate and ratio).** AS October is 20/65 = 0.31 a year; AS high months 0.23–0.31 against SCS 2.7–3.1, about 10× (8.8–13.5); the area difference is stated (§2.2, §2.3).
- **M3 (wrong comparison in the null).** §3 restated as λ·|Δt| + (fee − E[story]); survival's fee × 1.1 included. At a time tie the gap (−5 to 19 D at normal, up to 22 D at survival) is smaller than a dhow's high-tier storm (25 D), so time-tied choices can flip at κ = 2.4; the null now rests on time ties being rare (§3).
- **M4 (re-pin).** Header re-pinned to `cedef87`; engine hash recomputed and unchanged. §9 adds the registered specialist protocol, #34 (DR08 and the literature corrections, including the junk storm-damage caveat) and open draft #32. §10 updated for the registered protocol (§9, §10).
- **M5 (K2, K3 compared the wrong things).** Both now assert run lookup = independent recomputation = protocol table, with the plants placed in the run's lookup (§7).
- **M6 (stopping rule).** The nonexistent "HS survival runs" cut is removed. Cuts are re-ordered with their measured savings (≈ 2–3, 2–3 and 6 min), a projection rule is defined, and a final rule covers a projection that still exceeds the cap (§5.4). "Twice" is replaced: K1 and K1b each run once (§5.4, §7).

**Low**
- **L1.** Kilwa–Aden 0.34 and Kilwa–Calicut 0.48 south of the equator (§2.1, §14).
- **L2.** HKO's printed annual total 15.6 and the monthly sum 15.7 are both stated; HKO §1.2 cited for depressions being included, §2.1.2 for the area; the IMD counts are marked as resting on the owner's verification (§2.2).
- **L3.** W4's one-month shift is stated as relative to the Little Ice Age in the source, applied to 1961–2020 as an assumption (§2.2).
- **L4.** Single-storm fragility tabled from a ±1 recomputation: AS April, AS August (including via the AS October peak), BoB August; AS June needs two storms (§2.3).
- **L5.** Porcelain attribution defined as a replay of the hull path without storm damage under the same repair rule, including the hull floor of 5 (§6).
- **L6.** `:2106`, `:2808`, `:1132`, `:1163` and the `:3106` navigator note added to the implementation list, plus `:1124` and `:3095` for the junk caveat (§7).
- **L7.** The seven tailwind lane-months stated for the junk too; statuses checked identical in all 120 lane-months (§2.4, §6).
- **L8.** Visits and distinct states reported per cell, with a "few states" flag below 20; κ\* need not be monotone, and every qualifying value is listed (§4, §6).
- **L9.** W1 paths stated as a stand-in for W2–W5 for expected counts only (§5.1).
- **L10.** Shares stated as measured on the polyline, not on the drawn curves (§2.1).

**Also changed.** RS sample reduced from 30 to 20 seeds per cell, and R's W0 exposure taken from K1's normal runs, to fit the re-timed budget (§5.3, §5.4). M3 crosswind exposure written as 0.0875 (exactly one of four lane-months high). The timing prototype and the one outcome-bearing count it printed are disclosed (§9 item 9). There is no `research/03/README.md` at `cedef87`; this is noted under the header.

### From v3 to v4 (confirmation review of v3, 2026-11-24)

The review found every v2 finding fixed, the Pareto rule and its scale invariance sound, and upheld v3's two disagreements with the review of v2 (the time-tie gap of −5 to 19 D, not 3–29 D; AS June needs two storms). It asked for these text fixes before registration:

- **Leak handling.** m_v and T2D = m_v are justified on the rationale that predates the timing prototype's count (v2's T3 scale and the review of v2's request for a fixed margin), and the choice of Kilwa is stated as the most lenient, so any bias runs against the registered expectation (§4). T1, T2D and κ\* are pre-registered at m = 1 D and m = 2·m_v as reported descriptors (§4, §12). N2 and N3 are relabelled informed (§8). §9 item 9 says the d term of the time estimate also uses the count.
- **HS's T2′ denominator** defined as H's chosen lane's expected gross − wages × m (its one-leg plan horizon; fees only when it waits; undefined if a cell's sum is ≤ 0), and HS's absolute Q for T3(b) defined the same way, with the different horizons stated (§4).
- **Margins.** The "flips at ties cannot count" sentence is scoped to T1; T3(a) and T4 are stated as deliberately margin-free, because N1 uses them to test that time ties are rare (§3, §4).
- **Time budget.** R and H campaigns re-timed in every vessel × difficulty × policy cell (R 68–118 ms, H 0.6–1.5 ms); K1 and R exposure widened to those ranges; total ≈ 22–28 min (§5.4). Partial T3(b) values are discarded if cut 1 fires mid-sweep (§5.4).
- **Lows.** K10c is stated to test the evaluation, not optimality, pointing to the lower-bound statement (§4, §7). HS's wait score omits the expected port story (5.6–16.9 D); the bias towards sailing is stated (§5.2). The standing 20–49 band (0 to 13.4 D) is added to §3's table.
- **Owner choices.** §11.1 lists the three items to confirm before registration (m_v and T2D; the m = 1 and 2·m_v descriptors; the HS denominator), and keeps the earlier five.
- **Registration form.** The header now reads "registered by merging this file's PR; not run", and the earlier drafts are recorded in the PR.

## 17. Owner confirmation before registration (2026-11-24)

- A (m_v 35/55 D and T2D = m_v), B (descriptors at 1 D and 2·m_v) and C (HS's T2′ denominator) approved as written (§11.1), with the qualifications recorded there: report all three thresholds together, keep N2/N3 informed, report HS's denominator and contributing-state counts, and no game change authorised by the confirmation.
- Header: note that `main` and the page hash moved after `cedef87` while the engine script stayed `6fba1ee7`; the run pins the engine script.
- §9 item 11: results seen after v4 was drafted (#44 with the C6 ruling, #41, the registered scaling-costs protocol #46); none bears on a value here.
