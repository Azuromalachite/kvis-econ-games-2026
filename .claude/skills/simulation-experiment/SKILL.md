---
name: simulation-experiment
description: Use when designing, running, interpreting or migrating automated game strategies, large-scale simulation sweeps, counterfactuals, sensitivity analysis or model-validation experiments for a weekly game. Requires a checkable harness, defined outcomes, controls and honest uncertainty. Not for ordinary playtesting or simple gameplay fixes.
---

# Run and interpret reproducible game experiments

**Scope:** Experimental methodology, not general PR review or historical source verification. Consult game-change-review for retention, prior-look disclosure and independent review; use historical-evidence-audit when claiming real historical calibration.

## 1. Freeze the model and question

- Identify source repository and commit, game path, SHA-256 of the analyzed engine/file, analysis code and revision, runtime/dependency versions, and the relationship between the harness and the real playable engine. A stand-in function is **not** the production settlement algorithm unless equivalence has been tested.
- Write the decision question, policy definitions, comparator(s), causal assumptions, unit of analysis, outcomes, estimand and strongest falsifier *before* confirmatory runs. Record known prior sweeps/results before declaring an experiment prospective.
- Declare parameter ranges and origin of each value (observed, bounded, analogue, synthetic, unknown). Avoid tuning conditions to force a desired winner.

## 2. Specify the experiment

- Define attempted, completed, failed, bankrupt, excluded and censored runs; write down denominators, financial settlement, horizon, cargo metrics and time units. Loaded freight must not be mislabeled as delivered cargo.
- Define policy information sets and feasible actions. An omniscient price strategy is a benchmark, not a historical merchant without supporting evidence.
- Pin RNG algorithm and exact seeds or seed file. Use event-keyed exogenous randomness or a verified matching scheme if action sequences draw different numbers. Record whether hazards are independent or correlated.
- Separate policy stochasticity from environmental stochasticity. Avoid counting multiple seeds of one model as independent historical observations.
- Plan sensitivity, negative controls and competing mechanisms; define what outcome would weaken the proposed lesson. For multiple hypothesis searches, distinguish discovery from independent confirmation.

## 3. Prove the harness can detect errors

- Check a small hand-worked case against the **actual engine**, including costs, time advancement, final liquidation and debt. Where feasible, compare several complete scripted campaigns rather than only an isolated formula.
- Use one or more temporary planted errors to show relevant tests fail; capture the failing test names. Do not modify shipping game code as an experiment.
- Recheck that forecasts and reporting do not mutate game state or consume random draws unless specifically intended.
- If equivalence is only partially demonstrated, label the model a **surrogate** and narrow all conclusions accordingly.

## 4. Run, analyze and preserve

- Run a small smoke sweep first; inspect results for impossible states, divergent sums, unexpected missing values and pathological strategies. Only then scale.
- Report effects as distributions or paired differences with clearly defined uncertainties, not just top policy rankings or one winning seed. Include null, reversed and failed outcomes; inspect dominant strategies and accounting exploits.
- Keep research for each week under research/02/ or research/03/ as real artifacts arrive. Commit code, protocol/config, compact CSV, result manifest and short interpretation; archive large traces externally with version, checksum and immutable reference. Use repository-relative paths in manifests.
- Preserve consequential exploratory or unresolved results even with provenance gaps. **Preservation does not imply independent verification**; label limitations and missing identifiers.

## Minimum result report

Provide: experiment ID and status (exploratory/preregistered/confirmatory), pinned engine/harness identity and equivalence check, policies and sample counts, RNG/events protocol, metric definitions, summary/uncertainty, falsifiers and negative results, full reproducibility commands, limitations, and data location. Never call a completed simulation a historical validation without independent historical observations.
