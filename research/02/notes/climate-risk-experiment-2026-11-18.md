# A bounded experiment on spatial climate risk and food strategies

18 November 2026; design reviewed against main `a881766` (PR #33). Proposed
experiment only: no new climate generator, optimization results, probabilities,
historical weather reconstruction or gameplay changes are claimed.

> **Not yet runnable.** Under `research/README.md` this is a Path B experiment: no
> data are downloaded and nothing is run until a pre-registration in
> `research/pre-registrations/` fixes the decision rule below with numbers and the
> author accepts it. The section "Pre-registration required" lists what it must fix.

## Question and scope

Can modern Andean weather observations, paired with defensible crop responses,
produce a meaningful difference between the feasible allocation maximizing mean
production and the allocation protecting against severe shortfalls?

Begin with one potato crop/cultivar across three or four sites and a single
growing season. This controls for differences among crop commodities and herding.
Choose adjacent slopes or dispersed holdings explicitly. Name a representative
basin in the mita catchment, or label a Peru pilot as a methodological analogue.
Do not quietly combine a Cusco display, Peruvian gridded weather and Potosi
institutions into a calibrated single community.

The [existing climate review](climate-weather-literature-2026-11-18.md) supplies
bounded evidence on terrain, physical frost controls, phenology and geographic
heterogeneity. A temperature observation is not automatically leaf temperature,
crop injury, yield loss, food availability or observed starvation. Keep these
transitions explicit. Diversification may fail to improve either objective;
that is an admissible result.

## Experiment contract

| Component | Initial definition | Required disclosure |
|---|---|---|
| Weather | Synchronized growing-season temperature and water conditions | Sites, years, missingness, bias and spatial resolution |
| Local exposure | Terrain and inversion corrections bounded by observations | Separate observations from assumed downscaling |
| Crop response | One cultivar, stage and duration-aware injury and water stress | Parameter ranges, uncertainty and independent validation |
| Resources | Identical land, labour and feasible timing across strategies | Site capacity and travel/management costs |
| Information | Static decisions made before test-weather realization | What forecasts are known at decision time |
| Output | Physical potato yield, then explicitly defined food energy | No automatic nutrition or mortality claim |

Modern gridded temperature, rainfall or reanalysis products are candidate inputs,
not already downloaded/validated datasets. Inspect local station coverage before
choosing one. Preserve entire synchronized years or multiday blocks; never sample
independent field weather and call the resulting benefit observed diversification.
Winter processing windows are a separate season, whose dependence on growing-season
conditions needs data. Historical proxy interpolation does not yield actual weather
at the game's named harvests.

## Objectives and evaluation

Let `Y(s,w)` be production for feasible strategy `s` and weather scenario `w`.
Compare the strategy maximizing mean `Y` with the strategy maximizing the
lower-tail CVaR at 10%: the mean of the worst 10% of outcomes. For discrete
weighted scenarios, include the appropriate fractional weight at the boundary;
do not simply condition on all ties at one quantile. Also report shortfall
probability, average shortfall magnitude, resource cost and the mean-risk frontier.
State a food-need threshold as an analytical assumption, not historical intake.

Separate training/selection weather from held-out testing before fitting site
corrections, response parameters or strategy rules. Use the same held-out scenarios
for every strategy. Bootstrap whole synchronized seasons/blocks, preserving
cross-site dependence. Forty independent observed seasons contribute only about
four worst-decile seasons: drawing thousands of synthetic scenarios does not
create thousands of independent climate observations.

Run a factorial comparison:

| Exposure model | Simplified injury | Stage-aware crop response |
|---|---|---|
| Current game's high-to-low threshold | A | B |
| Observation-informed joint exposure | C | D |

Compare A/C to isolate spatial exposure and C/D to isolate crop response.
As a diagnostic, preserve site marginal hazards while changing cross-site
dependence. Independent-site and perfectly coupled cases are sensitivity bounds,
not inferred Andean realities. Check joint lower-tail failure, not correlation alone.

## Search methods: start small

**CVaR-based agricultural planning can be formulated without reinforcement learning.**
AitSahlia et al. (2011; online 2009), pp. 201-205, introduce scenario-based
planting/hedging optimization with mixed-integer programming. This is a modern
US cotton application, not historical Andean calibration. Its insurance, futures
and fitted copula are not proposed game institutions or a validated tail model
for the Andes. Claim: `claim.research.climate_scenario_optimization`.

1. Enumerate feasible static allocations for a small site set. Check whether
   the existing game's 2,304-plan grid omits the allocations of interest.
2. Use mathematical programming when constraints and responses permit it.
   Establish a small-instance exhaustive baseline before scaling.
3. Add simple forecast/reserve threshold policies, tuned only on training weather.
4. For sequential stock and labour decisions, compare finite-horizon dynamic
   programming, scenario trees with non-anticipativity, or receding-horizon control.
5. Consider RL only if meaningful sequential decisions or partial observability
   defeat these baselines. Give every method the same feasible actions, observations
   and held-out scenarios; report compute and sample budgets. Do not compare an
   adaptive agent only with a restricted static grid and attribute the advantage
   entirely to its learning algorithm.

The existing grid is a restricted benchmark, not all possible policies; a policy
uses information available at decision time, while a hindsight plan sees its
evaluation weather. Keep both benchmarks labelled. The current end-screen
death/food/welfare ordering is also different from this experiment's objective.

## Connect the experiment to food access in stages

After the field experiment, add the
[potato-processing and household-budget accounts](processing-income-spec-2026-11-18.md).
Recompute rankings rather than assuming the mean-yield winner or lower-tail-yield
winner also minimizes hunger.

- Stocks can carry food across annual seasons, subject to stated storage losses.
- Mining receipts can buy food only under explicit prices, access and obligations.
- A later hypothesis can couple drought to farm losses, milling water, employment
  and food prices. Cole motivates the water pathway but does not identify its
  quantitative joint distribution. Include this as an ablation, not a fitted fact.
- Different land, herd, cash and market access can change household outcomes.
  Transparent sensitivity cases are not an estimated historical distribution.
- Any multi-season pilot must declare consecutive annual seasons. Do not apply
  one annual debt/herd/seed transition across the game's long historical gaps.

## Pre-registration required (before any data are downloaded)

As written, "a meaningful difference" and "survives plausible … uncertainty" have no numbers, so the stop rule cannot
fail. With about 40 seasons, CVaR at 10% rests on about 4 seasons, and on a 30/10 split the held-out CVaR at 10% is
the single worst test season. The pre-registration must fix:

- **the primary measure:** CVaR at 20% or the probability of a shortfall below a stated threshold, because the season
  count cannot support CVaR at 10% (report CVaR at 10% as descriptive only);
- **the minimum gain** in the primary measure that counts as separation, in kg/ha or as a share of the mean;
- **the largest loss in mean production** allowed for that gain;
- **the split:** leave-one-block-out over whole consecutive seasons, with the block length and the number of folds;
- **the decision rule,** for example "gap at or above the minimum in at least k of K folds";
- **what counts as no separation,** reported as a result.

Proposed values, for the author to accept or change in the pre-registration (not yet fixed): primary measure CVaR at
20%; minimum gain 5% of mean production; largest mean loss 2%; blocks of 5 consecutive seasons; separation if the
gap holds in at least three quarters of the folds; no separation otherwise.

## Threats to validity

- **Modern weather is an analogue for 1530–1600.** The sixteenth century falls in the Little Ice Age, and the 1600
  Huaynaputina eruption altered Andean climate; means, variances and especially cross-site tail dependence may have
  shifted. Specific modern values are therefore not transferred: the independent and perfectly coupled cases remain
  the bounds. Any game mode built on this must be labelled "modern weather analogue", never presented as the
  weather of those years.
- **Proceeding also requires the strategy ranking to hold under a cooler, shifted-mean scenario** stated in the
  pre-registration, not only under modern observations.

## Deliverables and stop conditions

Deliver a dated dataset manifest, weather/exposure diagnostics, crop-response
specification, feasible strategy set, mean-risk frontier, held-out comparison and
uncertainty analysis. Preserve negative or fragile results.

Proceed to an optional game mode only if the pre-registered decision rule above
is met, the ranking also holds under the cooler shifted-mean scenario, and the
result remains interpretable for students. Otherwise report the lack of separation and its
causes. Any gameplay change must re-run the repository's full model checks and
re-record affected benchmarks in the same implementation PR. This proposal
leaves all current presets, probabilities, grading and pinned results intact.
