# Monsoon Navigator checks (`projects/03`)

Checks that run the real game code and can fail. They were written in the game's original repository (Antooooon125/Week3-monsoon-navigator, PR #10, commit `27cb4c9`) and moved here with paths updated for `projects/03/index.html`. Nothing in the game is edited or re-implemented.

Some comments, test titles and messages still name files from that repository: `docs/baseline.md`, `CONTRIBUTING.md`, and "the README's worked example". Read those as referring to the original repository at `27cb4c9`. The defect IDs below come from its `docs/baseline.md`.

## Run

From the repository root. The quoted glob needs Node 21 or later. These have run on the Node 22 and 24 runtimes bundled in Electron apps, not yet on a standard Node install or in CI.

```
node --test "tests/03/engine/*.test.mjs"
node tests/03/engine/planted-defects.mjs
node --test tests/03/packaging.test.mjs
```

- **The first command** runs the engine tests. `engine/load-engine.mjs` evaluates the game's inline script unchanged, with a small stand-in for the page, and scripts `Math.random` so each hazard path can be forced. Any unscripted random draw fails the test.
- **The second command** makes 47 small changes to a temporary copy of `index.html`, one at a time. For each, it checks that the targeted test fails, that some tests still pass (so a copy that fails to load doesn't count as caught), and that `index.html` has the same hash afterwards.
- **The third command** checks that every `href`, `src` and `url()` in `projects/03/index.html` is absolute, an anchor, or `classic.html` / `index.html` beside it (AGENTS.md rule 4). It also checks that it fails on eight planted relative references. `MONSOON_INDEX` points it at another copy.

**Browser check:** serve the repository root (for example `python -m http.server 8000`) and open `http://localhost:8000/tests/03/baseline-check.html`. It compares the game's travel times for all 480 combinations of route, month, ship and navigator against `fixtures/baseline-transit.json`, and reports MATCH or MISMATCH. The snapshot was taken at the original repository's `111acdc`, and the sailing model hasn't changed since.

## What they cover

- **Trade:** buying and selling, tariffs and cost basis.
- **Waiting:** port fees at each standing threshold, standing, and port stories.
- **Sailing:** wages, months at sea, turn-back, jettison, storms on each ship and difficulty, becalming, cargo loss, the piracy factors on both sides of each threshold, mutiny, and arrival standing.
- **Loan interest.**
- **The real `finishCampaign`:** money fields, outcome badge and audit tallies.
- **Both game modes,** Play Only and Student Mode.
- **Previews and forecasts:** they don't change state or draw random numbers.
- **The 480-row transit comparison.**

**Not covered:**
- the audit's date and timestamp lines;
- the hypothesis and reflection text;
- PDF rendering;
- `repairHull` and `hireSpecialist`;
- the economy sweep;
- anything only a real browser would show. The page stand-in accepts every call, so an exception that only a real browser raises in `renderAll` isn't caught, and nothing checks how the page looks.

## Known defects pinned as current behaviour

These tests describe what the game does now, not what it should do. A fix for one of them is expected to make its test fail; replace the test when that happens. The IDs come from the original repository's `docs/baseline.md`.

| ID | Current behaviour |
| --- | --- |
| D01 | A voyage can arrive after month 24 (up to month 26) and is still credited; the ledger shows month 24 |
| D02 | Pepper is labelled Semi-Bulk in the market but counted as luxury in the audit |
| D03 | The freight tally counts cargo loaded, including voyages that turn back and cargo later lost |
| D07 | A campaign ended by cash below −250 D is logged as "Month 24 Liquidation" |
| D08 | Arrival log entries carry the departure month |
