# Depth/liquidity validation: purchase reserves do not ensure funded departures

24 November 2026. **C6 failed; prediction scoring is blocked.** This is a bounded validation finding under [the frozen protocol](../../pre-registrations/2026-11-23-depth-liquidity.md), not a completed market-depth or liquidity study. No D/L/H sweep or B1 comparison was run or scored. The playable game is unchanged.

## Counterexample

The real pinned engine and the registered quantity-only harness, with hazards disabled, give:

| Item | Value |
| --- | --- |
| Conditions | Junk, normal, avoid headwind, settlement delay 1, R-exp |
| Departure | Aden to Kilwa, monthIndex4 |
| Available cash | 97 D |
| Cargo bought / aboard | 0 / 0 lots |
| Receipts outstanding | 135 D + 13,470 D, both due at monthIndex5 |
| Voyage | 4 months; wages 4 × 35 = 140 D charged before settlement |
| Cash after charges, before credit | 97 − 140 = **−43 D** |
| Cash after advance credits the receipts | −43 + 13,605 = **13,562 D** |
| Campaign ruin |**No.** The receipt is credited before the engine's ruin check |

The computed R-exp for this departure is 150.4 D, including expected water/tribute charges. Cash is already insufficient even with an empty hold. Reducing the purchase quantity cannot enforce the zero floor while retaining that departure. This challenges the study's validation assumption; it does **not** establish that the reserve increases bankruptcy or contradict a scored L/H prediction.

## Correction relationship

Earlier implementation checks recorded the minimum only after complete actions. On this bounded trace that observation returns 97 D and would report a pass. It misses the cash state after the engine charges wages but before the wrapper credits receipts.

The corrected observation samples that state. The [machine record](counterexample.json) retains **both** the apparent pass and the failed floor, with the complete trace to the first counterexample. The failure was independently reproduced by a second agent using the pinned engine. This narrow reproduction does not reproduce the entire registered experiment.

The frozen H rule changes only quantities while preserving the baseline lane ranking. Adding a wait or rejecting an unfunded departure would change that policy. No such correction was silently applied. Any funded-departure comparison requires a dated protocol amendment or a separately registered experiment, including what happens when the next receipt or even an affordable wait is unavailable. C6 is a **failed validation gate**; the protocol's narrower “dead outcome” term is reserved for C1/C1b/C2.

## Reproduce

Node v24.22.1 was used; the script requires Node 22 or later and no packages. From a complete checkout containing the pinned commit:

```sh
node research/03/models/depth-liquidity-gate-check.mjs --output /tmp/monsoon-c6.json
```

On Windows, choose an output path in the system temporary directory. The [script](../../models/depth-liquidity-gate-check.mjs) reads four pinned files with `git show` into an OS temporary directory. It never writes the game's source. If the commit is absent from a shallow checkout, fetch it first. Alternatively, supply `--source-dir PATH` for an already materialized pinned source tree. That mode was used for the recorded run. Output creation is optional; the compact result always prints to the terminal.

Engine commit: `d2d66a3a5fc6f839890149cce427c42e2f1566a0`. SHA-256: `1c901dd1cd6507a6deb9fabed4d91ebd5bd81204b583008eec5f5d4cd163442b`. All four input checksums and the actual runtime are in the JSON. Their bytes were checked against the pinned Git objects before the recorded compact reproduction. `Math.random` returns 0.99 throughout, as registered for hazards off. The campaign stops after the first counterexample; no unfinished campaign is presented as a profit result.

Existing baseline validation also matched 18 published hazards-off plans and 10,800 original-stream campaigns. That check is supporting author-run validation, not an independent rerun of the full study; the bounded executable retained here establishes C6 alone. The game regression suite passed 66 tests and caught all 47 existing planted engine changes. C9/C10 and the prediction grids remain unrun. See [validation status](validation.json).

Historical interpretation is separately bounded in the [pepper procurement note](../../literature/2026-11-24-pepper-procurement-chain.md). Neither that note nor this accounting counterexample calibrates historical demand, prices or settlement delays.
