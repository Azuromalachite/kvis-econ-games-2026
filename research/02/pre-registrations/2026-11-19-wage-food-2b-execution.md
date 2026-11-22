# Experiment 2b: execution addendum for documented food purchasing power
Prepared 19 November 2026, after experiment 2 and after reading the supplied source pages, but before computing any 2b output.

## Relationship to the frozen plan

The original [wage-food pre-registration](2026-11-19-wage-food-breakeven.md), merged in PR #40, already specifies experiment 2b: re-run using Bakewell's purchasing power for each food separately and predict that the verdict band does not change.

This file operationalizes that plan after source transcription. The primary wage row and the rounding checks below are declared now; they were not separately specified in PR #40. They must not be described later as choices frozen before experiment 2 or before seeing the source. The original pre-registration, model and results remain unchanged.

**Execution gate: commit and merge this addendum and the input transcription before computing any experiment-2b outcome.** No execution code or result accompanies this addendum.

## Inputs and mapping

Source: Bakewell (1984), pp. 102–104 and 122–125, visually checked supplied page images. Data: [bakewell-purchasing-power-1603.json](../evidence/bakewell-purchasing-power-1603.json).

Use the printed daily energy table on p. 104, not calories reconstructed from the rounded mass table. For food f and wage row r:
kcal_per_real(f,r) = reported_kcal_per_day(f,r) × 7 / weekly_wage_reales(r).

Five paid workdays generate the wage; the printed calories already spread purchases over seven consumption days. Do not multiply by five again. Do not add different food columns. Keep oca and chuño out of the calorie scenarios because the table supplies no calorie values for them.

Primary row: mine worker, 20 reales per week. Reason: the frozen model uses that same mine-worker mita wage and a hired ore-cutter alternative. Primary food scenarios: potatoes, maize and charqui, each separately.

The freighter and refinery rows provide declared rounding checks at the same underlying source prices. They are not independent market observations, new occupational model cases or evidence of three different price distributions. Show these checks separately from the primary outcomes.

## Frozen comparisons retained

Keep the one-household, one-worker, 26-week accounting boundary, all three work arrangements, all original judgement ranges other than the food-price range, original seed 20261119, 1,000 draws, and decision thresholds.

Generate the exact original six-column Latin-hypercube draws using the unmodified experiment-2 routine. Only then replace each draw's kcal_per_real field with the documented fixed value for the selected food and row. Do not remove the old price column before generating draws: that would change the random sequence used for later columns.

Keep the original Godoy-based total cash-cost range unchanged. This holds a 1608 mitayo retail-cost estimate fixed while changing the exchange value of surplus/deficit cash using the 1603 reconstruction. It is a conditional comparison, not a coherent reconstruction of all costs in one year. The source mismatch must remain in the results.

Keep original cash wages: compulsory mine service, hired extra-hand ore cutting and the one-in-three mixed case. Do not add substitute premiums, ore proceeds or family earnings. Those would change mechanisms beyond the registered price substitution and require a separate pre-registration.

The paired ordinary-peso/reales examples now clarify a unit already used in experiment 2; they do not revise that experiment's numerical ranges or results.

## Confirmatory outcomes and prediction

For each primary food separately and for each original work arrangement, report:
- fraction of the matched draws with food change greater than zero;
- fifth percentile, median and ninety-fifth percentile of food change;
- the original midpoint break-even price calculation and whether a positive solution exists;
- verdict band for the hired-work case using the unchanged thresholds: under 10%, 10% to under 50%, or at least 50%.

Prediction retained from PR #40: the verdict band does not change. Assess it separately for potatoes, maize and charqui, not only after pooling foods. Report a missed prediction if any primary food changes the band. Do not pool all food scenarios into a frequency claiming historical prevalence.

Report the additional wage-row conversions as rounding checks. State whether any changes alter the verdict band. Differences do not create confidence intervals or independent replications.

## Verification and interpretation limits

Before reading outcomes, confirm that the data rows match the supplied images, five-day/seven-day units are respected, no 2b calculation mutates the original model or results, and the exact original draw array is reused.

Do not present rounded source values as exact historical prices. No uncertainty distribution around them is fitted here. The source's commodity composition, weight and currency conventions remain limitations; these checks do not establish dietary adequacy.

A larger kcal-per-real figure can increase either purchased food or the food-equivalent burden of negative cash in this model. Its effect is not constrained to improve outcomes.

Read the work as a budget sensitivity test under frozen cost and opportunity-cost assumptions. It does not establish what all paid miners earned or ate. Any subsequent alternative cost structure, ore-income scenario, substitute case or basket must be registered separately before computation.

## Deviations (append only)
None. No 2b computation has been run in preparing this addendum.

