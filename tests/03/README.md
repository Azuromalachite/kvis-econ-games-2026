# Monsoon Navigator checks (`projects/03`)

Checks that run the real game code and can fail. They were written in the game's original repository (Antooooon125/Week3-monsoon-navigator, PR #10, commit `27cb4c9`) and moved here with paths updated for `projects/03/index.html`. Nothing in the game is edited or re-implemented.

Some comments, test titles and messages still name files from that repository: `docs/baseline.md`, `CONTRIBUTING.md`, and "the README's worked example". Read those as referring to the original repository at `27cb4c9`. The defect IDs below come from its `docs/baseline.md`.

## Run

From the repository root. The quoted glob needs Node 21 or later. These have run on the Node 22 and 24 runtimes bundled in Electron apps, not yet on a standard Node install or in CI.

```
node --test "tests/03/engine/*.test.mjs"
node tests/03/engine/planted-defects.mjs
node --test tests/03/packaging.test.mjs
node --test tests/03/atlas-events.test.mjs
node --test tests/03/atlas-sea-lanes.test.mjs
node --test tests/03/atlas-hazards.test.mjs
```

- **The first command** runs the engine tests. `engine/load-engine.mjs` evaluates the game's inline script unchanged, with a small stand-in for the page, and scripts `Math.random` so each hazard path can be forced. Any unscripted random draw fails the test.
- **The second command** makes 47 small changes to a temporary copy of `index.html`, one at a time. For each, it checks that the targeted test fails, that some tests still pass (so a copy that fails to load doesn't count as caught), and that `index.html` has the same hash afterwards.
- **The third command** checks that every `href`, `src` and `url()` in `projects/03/index.html` is absolute, an anchor, or `index.html` beside it (AGENTS.md rule 4). It also checks that it fails on twelve planted relative references (attributes, JS assignments, `setAttribute`, `url()`, `@import`); values assembled at run time are not checked. `MONSOON_INDEX` points it at another copy.
  It also checks the shared foundations:
  - the inline `atlas-foundations` block equals the marked block in `assets/theme.css`, with its SHA-256;
  - the recorded source revision is a real commit whose `assets/theme.css` holds exactly that block (checked with Git; skipped with a notice when Git or the history is unavailable);
  - Atlas keeps its font aliases and 3 px focus offset on `:root`;
  - no other style switches the focus ring off: `outline` or `outline-width` 0 in any unit, `outline` or `outline-style` none or hidden, or an `outline-color` of transparent;
  - no other style restates the ring with an unqualified `:focus-visible` selector, one with no class, no id and no attribute selector except on a global attribute. Global attributes such as `[class]`, `[lang]`, `[role]` and `[tabindex]` can sit on any element, so they don't count, with or without a value. `:where()`, `:is()` and `:not()` are ignored;
  - no other style overrides `[hidden]` in any attribute form or case.
  - no tracked file under `projects/03/` or `tests/03/` keeps a merge-conflict marker (a line starting with `<<<<<<< ` or `>>>>>>> `, or exactly `=======`, so Markdown underlines don't count). It fails on the block that once sat in this README.

  Names are matched case-insensitively. Each rule is read separately, including inside `@media`. Not seen by this static reading:
  - styles set from script, and selectors built at run time;
  - values computed or substituted at run time: `outline:calc(0px)`, `outline:0e0px`, `outline-style:var(--x,none)`;
  - an outline colour that matches the background, or is a zero-alpha `rgba()`, `hsla()`, `#RRGGBB00` or `#0000`;
  - an `outline-offset` that hides the ring;
  - an unqualified `:focus-visible` behind a non-global attribute that every element happens to carry (`[data-x]`, `[aria-*]`) or behind a namespace (`[*|class]`).

  The browser market check's computed-style pass (below) is the backstop for all of these: it reads the ring each focused control actually gets.

  It catches missing, stale, duplicated and shadowed foundations, and the reviewers' plants, including a zero or non-foundation revision. It also fails unless `projects/03/index.html` has the exact SHA-256 that `projects/03/README.md` pins, so a page made by merging two builds by hand cannot pass. A shared-foundation edit therefore requires an Atlas rebuild; palette and component edits outside that block do not. The checks do not establish visual equivalence.
- **The fourth command** is the seeded event-card check that the "Missing state" rule in `projects/03/README.md` asks for. It plays 30 seeded campaigns through the engine and the Atlas adapter. It takes the events the engine drew from its own random-draw sites (each draw is mapped to its engine source line, and the draws are forced to 0 or 0.999), not from the log text. It then checks that every card shown matches a drawn event, and that every drawn event without a card is skipped by the adapter's stated rule (in the file's header). It also checks that it fails when hazard log wording or the adapter's rule changes. Rerun it whenever the engine or its log text changes.
- **The fifth command** checks that every sea lane on the built page runs over water. It reads the inlined coastline, the adapter's sea waypoints and the engine's port positions from `projects/03/index.html`, rebuilds each lane as the adapter draws it, and samples it every 0.25 map units. No sample may be on land, and each lane needs at least 1.5 units of water outside 9 units of each port. It fails on a waypoint moved into Sri Lanka or onto the Horn of Africa, and on a waypoint edited in the page. The upstream builder has the same check on its sources.
- **The sixth command** checks the Atlas risk and timing display, in the same way as the event-card check: seeded campaigns run through the real engine and adapter, with ground truth from the engine's own tagged draws and from its source constants. It checks six things:
  - storm and pirate markers appear exactly when the engine struck the ship with a storm or pirates on that leg. The draws are real uniform numbers from a seeded generator, not 0 or 0.999, so a threshold anywhere between them is tested. The truth is the engine's outcome (the voyage's own log entry and the hull it lost), and runs are made with and without armed marines;
  - the crew-health alert shows exactly while `getMutinyRisk` is above zero;
  - every number in the port timing view equals `computeTransit` and the engine's turn-back and piracy constants, including the expected time with turn-back retries;
  - opening the view draws no random number and changes no state;
  - the pirates' outcome under the map key is in the engine's words even when the commenda's interest is logged after the voyage;
  - a storm is named for its basin: a typhoon on the Malacca–Quanzhou leg, a cyclone on every other leg, on the map marker, the line under the map key, the event report (its title, and the basin beside the engine's own "cyclone" line) and the port view's column; and the glossary has the "Cyclone and typhoon" entry. The test writes the expected basin out by leg rather than computing it from the adapter's rule.

  It fails on thirteen planted defects. Three are for the storm name: the rule inverted, the boundary moved west to Calicut, and the engine's line shown without its basin. Two need the uniform draws: the marker decode dropping the marines factor, and a storm threshold of 0.5. One is the old way of finding the voyage's entry (the newest log line), which loses the pirates' outcome behind the interest line.

**Browser check:** serve the repository root (for example `python -m http.server 8000`) and open `http://localhost:8000/tests/03/baseline-check.html`. It compares the game's travel times for all 480 combinations of route, month, ship and navigator against `fixtures/baseline-transit.json`, and reports MATCH or MISMATCH. The snapshot was taken at the original repository's `111acdc`, and the sailing model hasn't changed since.

**Market check (browser):** with the same server, open `http://localhost:8000/tests/03/atlas-market-check.html`. It reports PASS or FAIL for the Atlas trade panel and price chart at all five ports, in seven months:
- each "Sell here" and "Buy here" label sits beside its own number, and those numbers equal the engine's prices and the cash moved by one real `sellCargoQty` and `buyCargoQty`;
- the merged hold summary matches engine state: each row's drawn icon (decorative) and tonnes aboard, the per-good weight bar and its legend, tonnes available, and the engine's bulk/luxury split; the lower hold panel stays hidden;
- each next-month direction matches the engine's price for the next month;
- every chart point, read back from its drawn position (the polyline and each dot, whose tooltip names its port, month and price), equals the engine's buy price for that port and month;
- the now and arrival markers and the highest/lowest table are right, and the key gives the destination's buy price in the arrival month;
- the month-by-month table has twelve rows, the now tag on the current month, and in every cell the engine's buy price for that port and month, matched to its column heading;
- closing the chart returns focus to the good's name. The market is re-rendered while the chart is open, so the browser cannot restore focus on its own, and the chart is closed with `requestClose()`, which runs the same path as Escape. The check waits for the dialog's `close` event, where the adapter returns focus, not for a timer;
- for every lane in every month (120 lane-months), the selected route's line style (`data-wind`), wind relation, bearing, days and months equal `computeTransit`;
- by computed style, every visible focusable control on the voyage screen matches `:focus-visible` when focused and draws an outline that isn't none, has width and isn't fully transparent; every `[hidden]` element computes to `display: none`. Run the check in a focused window: in a background tab or a headless browser without focus emulation, nothing matches `:focus-visible`, and the check fails with `focus-not-visible` rather than passing.

`?page=<same-origin path>` checks another copy. It has been shown to fail on nineteen planted changes:
- flipped arrows;
- a chart shifted by one month;
- chart dots one month off while the line is right;
- swapped buy and sell numbers;
- the words "Sell here" and "Buy here" swapped with the numbers unchanged;
- a misplaced now marker;
- a dropped hold bar;
- wrong tonnes aboard;
- the lower hold panel shown again;
- focus not returned after closing;
- tailwind and headwind swapped;
- the month table shifted by one month;
- the wrong arrival-month price in the key;
- six focus and `[hidden]` overrides the static check cannot read: `outline:calc(0px)` on the chart buttons, `outline:0e0px` and `outline-width:0` behind attributes, `outline-style:var(--x,none)`, `[class] :focus-visible{outline-color:#0000}`, and `[HIDDEN]{display:block!important}`.

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
