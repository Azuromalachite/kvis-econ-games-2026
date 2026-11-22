# Crop and camelid implementation review after PR #29

Reviewed 18 November 2026 against main
[`8e443c5`](https://github.com/Azuromalachite/frost-and-silver-game/commit/8e443c566094b93561182e2ffb068e039cbb6270).
Game-file SHA-256:
`f93aa841bf3029a099c013d54c2fa70ea2e4cce6d15bdb4be327720a1b2cdefe`.
This contribution adds evidence and diagnostics, not new gameplay or parameters.
See the [twelve reading notes](agropastoral-literature-2026-11-18.md), with bounded
claims and source-specific reading depths in the registry.

## Changes already addressed upstream

The repository has developed substantially since the first research contribution.
These are current features, not outstanding fixes in this review:

| Area | Current treatment |
|---|---|
| Winter processing | Post-harvest winter conditions affect chuño throughput |
| Crew reductions | Repeated Best land first preserves hand-added wage crews; hand-set plans get their own projection |
| GDP explanation | Decomposition depends on the re-plan; no single universal cause |
| Assessment | Food is graded; GDP is shown for discussion, not graded |
| Diversification | Resilience now scores protected fields only; occupied-zone count earns no bonus |
| Strategy comparison | A strategy chosen in advance leads; the restricted hindsight comparison is separately labelled |
| Difficulty | Standard, Hard and Extreme change the seed, with survival compared on the same weather |
| Time | Sampled colonial years and the stock-carrying simplification are disclosed |
| Rendering and controls | Upstream adds redraw/error handling, comparison cancellation and visible Pause |
| Verification | CI already runs the model check and its planted-defect self-tests |

These observations are from code and the merged PRs through #29. Rendering and
control fixes were not independently re-tested in a browser for this contribution.

## Reproducible checks on this revision

```sh
node tests/review_model.cjs
node tests/review_model.cjs --self-test
node tools/review_agropastoral.cjs origin/main
```

The diagnostic tool reuses the current upstream headless loader and checks.
The loader additionally exposes the production functions needed by the diagnostic;
all upstream assertions and self-test plants are retained. The optional model ref
is verified against the reviewed game bytes, preventing a stale revision label.
The [current recorded output](../evidence/review-agropastoral-model-pr29-2026-11-18.json)
includes the input commit, exact game-file hash and policy. The
[PR #22 snapshot](../evidence/review-agropastoral-model-2026-11-18.json) is retained
unchanged as a historical record. This refresh preserves main's game HTML, pinned
constants, grading and workflow.

For seed 12345, default manual play and Best land first at each required re-plan,
the displayed pinned line remains:

`1,760 kcal | 1,410 kcal | 74 -> 52 | 103 | 109 | 45% -> 75%`

| Equal-weight seeds 1-80, same re-plan policy | Inca mean | Colonial mean |
|---|---:|---:|
| Food, model kcal/person/day | 1676.29 | 1384.85 |
| Welfare index | 64.03 | 45.63 |
| GDP index | 101.50 | 109.46 |

Food's matched effect is negative in all 80 runs. The internal GDP effect buckets
are 75 unchanged and five rising; these are not student grades since PR #21.
The existing checks cover replay, weather preservation (including winter), welfare
components, each weather preset's default-plan benchmark and planted defects.
The seed presets select weather sequences from the existing model; they do not
add new ecology or fix the biological gaps below. These checks do not validate browser behaviour, the full
strategy space, historical causal estimates or learning outcomes.

## Remaining gaps and useful next steps

### 1. Commodity mismatch: chuño can be made without tuber production

Locations: `ZONES`, `grow`, `harvest`, `settle` in the game file.

The diagnostic reproduces a valid first-harvest plan at seed 1: five Valley crews,
zero Upper-field tuber crews, five High-grain crews, two Puna crews and two chuño
crews. It produces 1752.84 model food units before returned state rations, then adds 140.02
to stores. `settle` cannot distinguish potatoes from the pooled maize, grain and
pastoral output. Winter changes a generic surplus conversion despite the
potato-specific action name.

This is a commodity mismatch, rather than a claim that non-potato foods cannot be
preserved. First decide whether the action is specifically chuño or general food
preservation. If specific, retain commodity flows and constrain it by eligible
potato surplus, including an explicit treatment of returned state rations.
Acceptance checks should cover zero eligible input, abundant non-potato surplus,
limited potato supply, winter throughput and food accounting without double-counting.

### 2. Puna output is not a persistent herd

Locations: `fresh`, `ZONES[key=puna]`, `grow`.

The puna uses the crop-style labour-power formula. A frost retains 70 percent of
otherwise identical output; frost plus drought retains 52.5 percent. These are
output ratios, not animal death rates. No herd stock, breeding structure,
recruitment, forage condition or slaughter decision persists between harvests.
Assigning more pasture labour can create current output without acquiring animals.

The [camelid readings](agropastoral-literature-2026-11-18.md#camelids-and-the-puna)
motivate distinct forage, recruitment, transport and asset questions. They do not
provide a historical parameter set. If herds become explicit, distinguish existing
adults from replacement young, and use stock-flow accounting before adding controls.
Test that herding labour alone cannot create breeding adults and that slaughter
reduces the appropriate productive stock. Do not insert the modern cohort's 22
percent mortality or its clinical-illness association as a frost coefficient.

### 3. The diversity score bonus is removed; ecological mechanisms remain open

Locations: `rollYear`, `grow`, `bestLandFirst`, welfare resilience calculation;
see also [the existing strategy review](strategies-2026-11-18.md).

Higher zones are never spared a frost that reaches a lower one. Drought applies
the same 25 percent loss everywhere. PR #29 removed the occupied-zone bonus:
resilience now counts protected fields only. Removing that score inconsistency
does not establish a biological diversification benefit. PRs #25 and #28 also
make re-plan comparisons depend on the actual board and distinguish sample
weathers from the student's weather; there is no universal lower-field dominance
claim here.

The new papers do not establish a reversal of this altitude ordering. Winkel
concerns shelter within quinoa stands; Condori concerns genotype and timing;
Arce documents modern land-use organisation. None supplies a historical spatial
shock distribution. Do not invent independent weather or a diversity bonus to
make spreading win.

A separate possibility is functional complementarity: pasture may supply transport,
fibre, manure or productive assets rather than compete with maize solely in annual
calories. Investigate those functions and their costs first. This could give the
high zone a reason to matter without misrepresenting frost physics. All proposed
mechanisms still require historical evidence for the chosen region.

### 4. Managed water, maintenance and seed reserves remain aggregated

Locations: `built`, `grow`, `cap`, `settle`.

Improvements are permanent binary flags with no upkeep or soil-water state.
Resettlement reduces output uniformly, including the puna. There is no separate
seed reserve, storage ceiling, deterioration of old stocks or entitlement system.
Winter processing addresses one throughput constraint, not these other stocks.

Test one mechanism at a time: a maintenance input, wet/dry pasture availability,
or retained planting material. Distinguish labour shortage, inaccessible land and
water-system failure. Excavated capacities and soil comparisons do not establish
annual spoilage rates, universal deterioration or historical yield bonuses.

### 5. Time is disclosed but still constrains any herd or soil extension

Locations: `YEARS`, `advanceState`, `collapseState`, `settle`.

The colonial harvests represent separated sample years. PR #26 deliberately
retains and labels per-person food-store carryover across the gap; this review
preserves that teaching choice. Applying a single annual survival, breeding,
ageing or soil-recovery update across those gaps would make new state variables
misleading. Decide between representative episodes with
specified starting stocks and an intervening annual simulation before adding
biological persistence. A scenario reset is not biological recovery.

### 6. Wage relief does not model food purchasing or a caravan economy

Locations: `harvest` tribute calculation, `WAGE_TRIB`, `silver`.

Wage crews lower a food-equivalent tribute burden; there is no explicit cash
balance, food price, market supply or transport capacity. The model cannot decide
whether a household could earn silver and buy imported food. Lecoq's opening
historical evidence motivates examining provisioning networks, but not a price
or payload calibration. A market extension would need prices, access, trade costs
and who receives wages or caravan returns; it should permit both relief and
failure under stated conditions rather than guarantee either outcome.

PR #28's wage-crew preservation fixes player control, not this accounting limit.
Its hand-set re-plan projection and stores warning are already implemented.
The household estimate continues to use food on hand before the eating cap,
rather than actual intake; differences at the same capped intake are therefore
not listed as a new bug.

### 7. The matched comparison remains conditional on each factual starting state

Location: `harvest`, counterfactual `cf`.

Each Inca-rules alternative starts from the factual population, stores, built
improvements, weather and processing allocation. It does not carry its own
population or inventory through history. New herds would likewise require a
choice between the same starting stock and an independently evolving trajectory.
Use the comparison to explain the model's mechanisms, not as a historical causal
estimate. GDP decomposition also depends on the re-plan, as main now explains.

## Suggested order

1. Resolve the preservation action's commodity meaning; state stock-flow units.
2. Choose the teaching scope of puna production and the historical time convention.
3. Prototype one mechanism at a time, with sensitivity tests and historical
   evidence distinguishing plausible alternatives.
4. Keep the classroom version's disclosed simplifications if added mechanisms
   would obscure its lesson; the research backlog need not become more controls.

Full-text access to Winkel and Gomez-Quispe is resolved. Partial reads remain
partial. Geology and potato evolutionary-genomics leads are not used as new model
evidence here. No privately circulated slides, PDFs or private file links are
included.
