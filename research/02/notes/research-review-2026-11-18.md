# Research review, 18 November 2026

Reviewed model: [7f57c09](https://github.com/Azuromalachite/frost-and-silver-game/commit/7f57c09ce3dd096c0ae96496462a2211a3b07db5).
Rechecked against [6f971e3](https://github.com/Azuromalachite/frost-and-silver-game/commit/6f971e37bbbb8036930cb80e523a59fd162a30e3), which adds crop drawings and milestone alerts.
Also rechecked against [76df1b5](https://github.com/Azuromalachite/frost-and-silver-game/commit/76df1b52e943111ea911e330156612ffafc35eb2), which restores zone names and illustrative air/soil temperatures. Those displayed temperatures are not inputs to the frost model.
Rechecked once more against [d0d9474](https://github.com/Azuromalachite/frost-and-silver-game/commit/d0d94741367d185cb0b4da66157289dcff1f358a), including the field log and four report tiles.
The independently executed model results below are unchanged.
This contribution records findings and research directions; it does not implement the proposed gameplay changes.

See [literature notes](literature-notes.md), [bibliography](../references/research.bib), and [access gaps](../references/ACCESS.md).

## Reproducible checks

From the repository root, with Node.js installed:

```sh
node tests/review_model.cjs
```

The harness executes the script embedded in the actual game file, with a stub document and disabled animation timers. It drives six harvests through the model functions. It checks the pinned run, identical replay, preservation of weather after a choice change, and the welfare component sum. It does not test rendering, buttons, accessibility, mobile layout, or whether playback pauses correctly.

The output is recorded in [review-model-2026-11-18.json](../evidence/review-model-2026-11-18.json). It is a dated snapshot of the game at commit `d0d9474`, not a check that runs: the Python tests do not run this harness, and nothing re-checks the JSON. The game has changed since (Play/Pause and dealt plans, the corrected grading sentence, the chuño winter roll, which moved the pinned run), The harness itself has since been updated to the current game and runs in CI as the model check (see CONTRIBUTING.md).
Default means use exactly seeds 1 through 80, with equal weights and the default plan.

| Measure | Inca harvest mean | Colonial harvest mean |
|---|---:|---:|
| Food per person per day, model kcal | 1,674.00 | 1,384.01 |
| Welfare index, model points | 70.39 | 48.77 |
| GDP index, 416 = 100 | 101.36 | 109.44 |

The pinned seed 12345 reproduces the documented rounded outputs: food 1,740 and 1,401; welfare 80 and 54; GDP index 103 and 108; modeled household shortfall 47% and 71%.
Identical replay reproduces the full harvest records. Moving one crew from high grain to processing in the first harvest changes results while retaining the same weather sequence.

## Findings to address

### 1. Prediction grades still depend on weather

The end screen says paired weather prevents a bad frost from making a correct prediction look wrong.
Pairing removes different weather between the two scenarios within a harvest. It does not remove interactions between weather, lost agricultural labor, and silver output.

With identical default choices:

| Seed | Mean colonial GDP effect, index points | Grade at the current 3-point tolerance |
|---|---:|---|
| 1 | +1.764 | Roughly unchanged |
| 10 | +3.127 | Rise |

Across seeds 1–80, 74 runs grade GDP as unchanged and six as rising. Effects range from +0.698 to +3.446 index points. This is a reproducible counterexample to the claim that weather cannot flip the grade, rather than evidence that the paired comparison itself is invalid.

Suggested wording: “Both scenarios use this run's people and weather. The effect can still depend on the weather and your choices.”
For assessment, ask students to explain their prediction and revise it after observing the run. A fixed class seed also gives students a common comparison.

### 2. Describe the counterfactual as conditional on each harvest

The alternative uses the factual population, stores before harvest, existing improvements, and weather. It does not carry a separate Inca population and stock trajectory through the whole colonial period.
Call it “Inca rules for this harvest, given the same starting state.”
It cannot establish what an uninterrupted alternative Inca history would have produced.

### 3. Align the README and history framing with the game's question

The game now opens with a question, but the README and history document still introduce a categorical continent-wide claim that growth did not improve life because food fell.
The historical GDP estimates, household food reconstructions, and model outputs have different geographical and evidential scopes.
Present growth without improved food access as the question being investigated; identify the simulated divergence as conditional on the chosen mechanisms and parameters.

The README's approximate default table also predates this specified seed sample. Different seed samples can yield different means. Publish the seed range alongside any refreshed table.

### 4. Separate tribute reassessment from mining obligations

The game currently holds both tribute and mita obligations fixed. The presentation of Zagalsky's book distinguishes tribute reassessment through revisitas from more rigid mining obligations.
See the timestamped, explicitly mediated evidence in [literature notes](literature-notes.md#negotiation-tribute-and-mita).

First correct the general historical explanation. Then consider a limited petition or reassessment action for tribute, with costs and uncertain success. A successful reassessment should not automatically erase the mining draft.
The presentation supplies mechanisms, not success probabilities or transferable effect sizes.

### 5. Separate storage processes and rights

The current `settle` function caps processing with `chuno * 120 * per`, then adds the processed surplus to stock.
It has no independent physical capacity ceiling and no deterioration of existing stocks. Unprocessed surplus beyond the immediate eating allowance is lost.

Tambo Viejo supports distinguishing architecture and commodity-specific storage. A useful extension would separate:

| Quantity | Meaning |
|---|---|
| Processing throughput | How much fresh food can be made storable this harvest |
| Capacity | How much a facility can physically contain |
| Inventory | What is actually present |
| Preservation loss | How inventory changes during storage |
| Access | Who may withdraw food and under what rules |

An excavated facility's estimated capacity does not establish its actual contents at one date, household entitlement, or an annual spoilage coefficient.
The sampled colonial harvests also span decades; current stocks carry between snapshots without a simulation of all intervening consumption and losses. Label that temporal abstraction before introducing annual deterioration.

### 6. An index resolves a presentation problem, not historical comparability

Rebasing GDP avoids placing unlike dollar units on the same numerical scale. It does not align different dates, regions, population denominators, or reconstruction methods.
Maddison's 1500–1600 Latin America conjectures and MPD2023's early-seventeenth-century Peru series should remain separately identified.

## Validation boundary

The evidence checker and four checker test methods passed after the research registry edits. The model checks also passed on the latest reviewed base.
A passing checker establishes structural consistency, not historical truth. Bibliography inclusion and a successful download do not by themselves establish that a work has been read.

## Added evidence from four supplied papers

The [additional literature notes](literature-notes.md#four-supplied-papers-added-to-this-contribution) connect Inkawasi accounting and competing interpretations of deductions (Urton and Chu 2015, 2019), multifactorial colonial health stress (Klaus and Tam 2009), and reflective classroom practice (McCall 2016).
They strengthen the quipu and debrief activities while limiting what the calorie-based model can claim.
McCall's full text resolves one of the eight original access gaps; seven remain.
