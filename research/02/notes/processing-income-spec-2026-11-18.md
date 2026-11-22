# Potato processing and mining food access: evidence-to-mechanic specification

18 November 2026. Reviewed against main `a881766` (PR #33). This document
specifies proposed accounts and research gates; it changes no gameplay,
coefficients, grades or pinned results. It extends the
[food-access review](food-access-recovery-literature-2026-11-18.md) and
[crop review](agropastoral-literature-2026-11-18.md).

## What the current code actually does

- `settle()` preserves a capped amount of pooled surplus. The pool does not
  identify potato inputs, so non-potato output can become labelled chuño.
- A separate post-harvest winter draw already changes processing capacity through
  `WINTER_CHUNO`. That mechanic is present; its multipliers remain game assumptions.
- Wage crews add silver output and reduce food-equivalent tribute through
  `WAGE_TRIB`. There is no disposable-cash ledger, food price or purchase transaction.
- A crew is an aggregate game unit, not a measured worker-day. The conversion
  must be defined before attaching historical wages or modern processing hours.
- Colonial harvests are separated historical snapshots. Annual herd, debt, seed
  or reserve transitions cannot silently be repeated once across a decades-long gap.

The proposed [climate experiment](climate-risk-experiment-2026-11-18.md) can first
compare field production without claiming household nutrition outcomes.

## Reading ledger and bounded findings

### Processing labour

**Werge reports estimated processing labour for a specified potato batch.**
The 1977 Concepción study combines observation/interviews and a 124-household
survey. Table II (p. 232) reports 13.5-17.5 labour-hours for 23 kg of potato
input, excluding transport and guarding. Its local chuño process includes
soaking and produces white chuño; the text says black chuño was not made by
the surveyed Concepción farmers. These are estimates, not a replicated time-motion
trial or a sixteenth-century coefficient. Claim: `claim.research.processing_labour`.

The extracted component rows sum to 13.5-16.5 hours although the printed total
is reported as 13.5-17.5. Preserve that discrepancy and check the page image before
numerical adoption. Pool construction contributes 5-8 hours: linear scaling
with batch mass requires evidence on shared facilities, reuse and batch size.
Elapsed soaking/drying days are not continuous labour-hours.

### Composition and preparation state

**Cooked white-chuño composition is not a batch energy-retention measurement.**
Burgos et al. (2009, chuño paper) use nine cultivars, 60 tubers each, with half
processed by one farmer into white chuño. Three analytical samples per treatment
are not three independent household processing trials. Both comparisons are
cooked and peeled. Protein and zinc concentrations decrease, calcium increases,
and some iron measurements are affected by contamination. The study does not
measure an entire input/output energy balance.

De Haan et al. (2012) compare four cultivars from three growing environments,
three field repetitions and two regional white-chuño processes. Their described
Huancavelica and Puno schedules end around days 27 and 38. Table 1 measures dry
matter in boiled fresh potatoes and rehydrated, boiled chuño, not the yield of
dry chuño from fresh input. Neither percentage dry matter nor mineral concentration
loss may be substituted for total calories lost.
Claim: `claim.research.processing_composition`.

**Potato vitamin C concentration changes with cultivar, cooking and storage.**
The additional Burgos et al. (2009) paper studies ascorbic acid in 25 cultivars,
with cooking and storage experiments in subsets. It does not study chuño energy
recovery. It can motivate a debrief distinguishing calories from nutritional
quality, without introducing a vitamin-specific survival rule.
Claim: `claim.research.processing_vitamin_c`.

Bibliographic note: `10.1016/j.jfca.2008.05.013` identifies the vitamin C
paper; the chuño protein/mineral paper is `10.1016/j.jfca.2008.09.001`. Both
match Crossref on title, authors, volume and pages.

### Candidate mass and energy data

**Callizaya reports product weights and food-energy values that permit a provisional calculation.**
The 2021 Viacha thesis, read through a public text mirror, reports Table 6 (p. 80)
and energy results (pp. 51-52). This is our derived energy in finished product
per kilogram of reported fresh input, before cooking, not measured human
metabolizable-energy recovery. Claim: `claim.research.processing_energy_candidate`.

| Variety | Input kg | Chuño kg | Product kcal/100 g | Derived kcal/kg input |
|---|---:|---:|---:|---:|
| Waych'a | 60 | 21.75 | 315.33 | 1143.07 |
| Wila pala | 60 | 8.57 | 338.60 | 483.63 |
| Luk'i | 60 | 17.89 | 347.50 | 1036.13 |

Formula: `(output_kg / input_kg) * product_kcal_per_100g * 10`.
The Luk'i row is excluded: the source's own figures do not add up. Fresh Luk'i
is printed at 5.60 kcal per g dry matter, which is impossible without heavy fat;
its fresh composition sums to 102.2% and its chuño to 100.8%; and its implied
solids recovery is 106%, although the peel was removed. Checking the annexes
cannot rescue a row whose printed composition fails at both ends. The energy
values are calculated from composition, not measured, so they inherit any
moisture error. The Waych'a and Wila pala rows pass the dry-matter check
(3.55 and 3.83 kcal/g), but their composition has not been checked, because their
fresh energy appears only in a figure. None of these values is a validated
historical range or a game parameter; `tests/test_chuno_audit.py` recomputes
them and fails on a planted error.
The [calculation record](../evidence/chuno-energy-audit-2026-11-18.json) retains
inputs and derived values separately.

**Controlled processing provides additional mass-yield observations.**
Luque Vilca et al. (2024) report yields of 22.4% (Imilla Negra) and 24.6% (Locka).
The associated Calizaya Pari and Huaman Choque thesis, Table 14 (printed p. 101;
PDF p. 125), reports approximately 10.01 kg input and 2.24/2.46 kg output.
These describe one underlying research programme, not independent replications.
Freezer processing differs from outdoor practice. Its methods text and diagrams
also disagree on freezing durations; composition Table 13 needs an audit before
deriving energy retention. Claim: `claim.research.processing_controlled_yield`.

**Experimental black-chuño preparation shows variety-dependent mass recovery.**
Valdivieso et al. (2025), Experimental and Fig. 5 discussion, weigh three samples
per variety (initially 64-100 g). Reported weight losses imply 28.3%, 24.1% and
19.3% recovery for Imilla, Luki and Holandesa. These small-sample mass yields are
not calorie retention. Starch extraction yield is another denominator and is
not total food recovery. Claim: `claim.research.processing_black_mass`.

### Mining earnings and provisioning

**Bakewell distinguishes compulsory wages, hired earnings and substitute-worker payments.**
Supplied page images cover pp. 100-111, 122-125 and 132-133. Prescribed rates,
occupation, period and ore compensation matter. Around 1600, pp. 124-125 report
56-72 reales per five-day week for additional hired ore cutters. A worker hired
to substitute for a mita conscript is reported at that rate plus the 20-real weekly
mita wage. The [page-image transcription](bakewell-purchasing-power-transcription-2026-11-19.md)
now records that the 56-72-real premium came from those engaging the substitute;
regular mita pay is additional. This payment flow remains outside experiment 2b.
Ore payments are separate. Do not apply these earnings to every worker or add
payments to GDP as if all were separate new output.
Claim: `claim.research.mining_earnings_categories`.

**Bakewell's Godoy example estimates expenses exceeding compulsory-service wages.**
Page 105 reproduces a 1608 estimate for an individual worker over six months:
200 pesos and 1 real of expenses against 65 pesos of wages, leaving 135 pesos
and 1 real to obtain elsewhere. Staples alone cost 120 pesos. This is a dated
contemporary estimate, not a household sample. The retail-price assumption differs
from the 1603 purchasing-power reconstruction (pp. 102-104). It is later than
the game's final harvest and cannot directly calibrate 1575.
Claim: `claim.research.mining_budget_case`.

Currency warning: the table's compound amount is not decimal pesos. The ordinary
peso/reales pairing is now explicit in the visually rechecked wage passages on
pp. 124-125 (claim.research.bakewell_currency_pairing), rather than inferred only
from the Godoy arithmetic. Keep pesos corrientes distinct from pesos ensayados;
do not assign an unverified name to the final subdivision in p. 105's notation.
The [machine-readable purchasing-power transcription](../evidence/bakewell-purchasing-power-1603.json)
preserves the original daily-energy and weekly-mass tables, currency context and
five-paid-day/seven-consumption-day convention. Page 104 spends the whole wage
on each food in turn; the columns are alternatives, not a basket. Family work and
provisions brought to town can cover costs, but such support is not free at
household or community level (pp. 104, 110-111 and 132-133).

**Cole identifies water supply as an input to silver processing.**
Supplied pp. 46-54 discuss drought preceding 1609 reservoir investment,
water-powered mills and processing water. They motivate testing correlated
agricultural and mining shocks, not a fixed drought penalty. Much of this
discussion is seventeenth-century context. Employer petitions are interested
arguments; proposed land/debt remedies are not evidence of implementation.
Claim: `claim.research.mining_water_input`.

## Proposed accounting contract

### A. Potato processing

1. Declare physical units: fresh potato kg, finished-product kg, food kcal,
   viable seed kg, and labour-hours. Define the crew-to-hours conversion separately.
2. Identify potato inputs by cultivar/product class and intended processing
   method. Purchases and state returns need declared commodity composition.
3. Reserve viable seed explicitly if seed is in scope. Allocate remaining potatoes
   once among eating, selling, processing and unprocessed inventory; no double use.
4. Constrain processed input by eligible potato stock, labour, access to a
   processing site/water, and the winter exposure window. Keep black and white
   chuño methods separate; water immersion is not a universal black-chuño stage.
5. Compute output mass and energy separately. With `m` kg processed and mass
   yield `r`, output is `m*r`; stored food energy is `m*r*e`, where `e` is kcal/kg
   of the declared finished product. Moisture bases must match.
6. Account for handling losses and for failed or partially completed processing.
   Do not assume every unsuccessful batch becomes either fully edible or fully lost.
7. Treat later cooking, storage losses and digestibility separately where evidence
   permits. Reject inconsistent balances for investigation; do not hide them by
   clipping recovery to 100%.

Required future checks: no potato input means no potato chuño; adding maize does
not enlarge eligible input; processing removes its input from other uses; a shared
pool does not create food; drying alone creates no food energy; calorie concentration
per kg may rise while total energy falls. A numerical recovery coefficient remains open.

### B. Mining and household food access

Use a declared accounting period before annualizing any wage. Record work type,
occupation/skill, days actually paid, cash receipts, ore rights and sale proceeds,
household provisioning, travel, tribute, debt, other expenses, and local food prices.

`cash available for purchases = cash receipts + realized sales/transfers - cash expenses`

Food availability then combines retained farm food, provisions, net purchases and
store withdrawals. Also account for agricultural labour forgone and the opportunity
cost of family work, transport and asset sales. Distinguish gross purchases from
food available to the household remaining at home and to workers in town.

Keep worker receipt and payer cost as opposite sides of transfers. Paying a
substitute does not necessarily add a miner. Selling an allocated ore share is
not another independent unit of silver production. In an explicit cash-market
extension, replace rather than additionally retain the existing implicit tribute
relief for the same earnings.

Compare compulsory service, additional hired work and mixed schedules. Access to
well-paid work must be a stated constraint, not an entitlement of every crew.
Do not infer mortality from these monetary budgets or classify household nutrition
solely from average community food.

## Priorities and integration gates

| Priority | Smallest useful next step | Gate before gameplay calibration |
|---|---|---|
| Potato inputs | Trace potato harvest and allocation through a separate ledger | Physical quantities and commodity composition defined |
| Processing | Verify candidate batch data and labour-table discrepancy | Matching mass, moisture and energy bases; method-specific uncertainty |
| Mining | Construct dated compulsory/hired budget cases | Employment access, paid time, expenses and matched local prices |
| Spatial risk | Run the separate one-crop experiment | Synchronized exposure, crop responses and held-out evaluation |
| Household differences | Vary resources/access transparently in sensitivity cases | Historical distributions before claiming population prevalence |

An evidence note can merge while these gates remain open. Implementation should
report which parameters are measurements, reconstructions or teaching assumptions.
No course slides, supplied scans, full article text or private file links are
included. Bibliography and access status are in [research.bib](../references/research.bib),
[ACCESS.md](../references/ACCESS.md) and the evidence registry.
