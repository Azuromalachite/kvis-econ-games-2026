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
node --test tests/03/atlas-decisions.test.mjs
node --test tests/03/atlas-replay.test.mjs
node --test tests/03/atlas-notebook.test.mjs
node --test tests/03/atlas-itcz.test.mjs
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
- **The sixth command** checks the Atlas risk and timing display, in the same way as the event-card check: seeded campaigns run through the real engine and adapter, with ground truth from the engine's own tagged draws and from its source constants. It checks eight things:
  - storm and pirate markers appear exactly when the engine struck the ship with a storm or pirates on that leg. The draws are real uniform numbers from a seeded generator, not 0 or 0.999, so a threshold anywhere between them is tested. The truth is the engine's outcome (the voyage's own log entry and the hull it lost), and runs are made with and without armed marines;
  - the crew-health alert shows exactly while `getMutinyRisk` is above zero;
  - every number in the port timing view equals `computeTransit` and the engine's turn-back and piracy constants, including the expected time with turn-back retries;
  - opening the view draws no random number and changes no state;
  - the pirates' outcome under the map key is in the engine's words even when the commenda's interest is logged after the voyage;
  - on a headwind leg with teak aboard that is not turned back, the extra jettison draw is skipped before the piracy draw is read (Kilwa → Aden, teak jettisoned, then the corsairs seize the ivory, or don't);
  - a storm that takes the hull to the engine's 5% floor shows the actual loss and "hull at its minimum (5%)", and one that leaves the hull above it doesn't;
  - a storm is named for its basin: a typhoon on the Malacca–Quanzhou leg, a cyclone on every other leg, on the map marker, the line under the map key, the event report (its title, and the basin beside the engine's own "cyclone" line) and the port view's column; and the glossary has the "Cyclone and typhoon" entry. The test writes the expected basin out by leg rather than computing it from the adapter's rule.

  It fails on fifteen planted defects, including the jettison draw left out of the decode and the hull-floor wording removed. Three are for the storm name: the rule inverted, the boundary moved west to Calicut, and the engine's line shown without its basin. Two need the uniform draws: the marker decode dropping the marines factor, and a storm threshold of 0.5. One is the old way of finding the voyage's entry (the newest log line), which loses the pirates' outcome behind the interest line.
- **The seventh command** checks the season-and-decision display (the route calendar, the sail-now-or-wait card, the explanation after each voyage and the pirate warning) the same way, with expected values computed independently from `computeTransit`, `getWindState` and constants read from the engine's source (turn-back chance, port-fee standing step, piracy factors, tribute cap):
  - every calendar line's months and day ranges per wind relation, for both ships, with and without a navigator, at every port;
  - every card number (departure, months waiting, wages, port fees and their shown sum, days, months, wind, turn-back row, expected arrival), the best month (earliest expected arrival, earlier departure on a tie), the second column and its title, and the closing line, in 400 game states (800 cards) including the last months of the campaign, where the year's fastest crossing (months 0–11) can come after the campaign ends;
  - painting the card and calendar draws no random number and changes no state;
  - after each voyage of 12 seeded campaigns, the explanation's facts match the engine's draws (turned back or not, storm or not), its season is the departure month's, its fastest-crossing sentence matches the year's fastest or the fastest left this campaign, and its best-month sentence is right. "Predictable:" must hold the season's chances and "Luck:" the draws' outcomes. No word that calls a choice wrong may appear (wrong, mistake, poor or bad decision/choice/call, misjudge, fault, blame, unwise, error, should have, ought to);
  - the pirate warning above the departure buttons shows exactly when the engine's chance on arrival is at least 10% (the owner's display threshold), with the chance now and with armed marines, the encounter's cost and a polite live region. Below 10% the card shows a quiet line, and at zero nothing. A chance of 9.9% gets no warning and one of 10% does. The tribute named equals the tribute the engine takes when pirates strike, at seven cash levels on three legs.

  It fails on twenty-one planted defects:
  - the best month off by one;
  - the wait cost without port fees;
  - a card that draws a random number;
  - the calendar a month late;
  - the season read a month late;
  - the fastest of the year taken from the campaign window, in the explanation and on the card;
  - Predictable and Luck swapped;
  - five explanations that blame the choice ("the wrong decision", "a bad decision", "a mistaken choice", "a poor decision", "your own fault");
  - the warning shown on a zero-piracy departure;
  - the warning missing on a positive one;
  - the guard multiplier omitted;
  - a warning that draws a random number;
  - a warning at 9.9%;
  - no warning at 10%;
  - the threshold read from the guarded chance;
  - the tribute ignoring the wages taken first.

  `tests/03/atlas-harness.mjs` holds the vm harness this check shares with the preview-purity test. `engine/preview-purity.test.mjs` now also paints the pirate warning, the card and the calendar for every route from every port, with and without guards and valuable cargo, and requires no draw and no state change; it fails on a warning that draws.
- **The eighth command** checks the campaign replay on the audit page. It plays 12 seeded campaigns to the end (buying, selling, waiting and sailing) and keeps its own ground truth from the engine while it plays: each action that moved the calendar is a step, the ship's port after a voyage says whether it was turned back, the voyage's own log entry says whether a storm or pirates struck, the log's length before the action is the row it wrote, and the trades and cash come from engine state. The dated log's rows and the panel's lists are real elements in the test, so the highlight is read where the page puts it. It checks:
  - one step per voyage or wait, in order, with the right kind, ports, month and turn-back;
  - storms and pirates exactly as the engine had them;
  - for every step, exactly one row of the dated log carries the highlight and `aria-current="step"`, and it is the row that step wrote; the steps list and the log view mark the same step;
  - the narration names the step and month, the trades made at that port (identical consecutive trades joined), and the cash after the step (before liquidation for the last one);
  - nothing is announced until a control is used, and playing writes the live line once per step, not once per frame;
  - stepping, restarting and playing to the end (every animation frame) draw nothing and change no state;
  - with reduced motion, Play is disabled, no animation frame is requested, and each step is a still frame at its end;
  - the replay is hidden in print and excluded from the PDF export, its log-row highlight is screen-only, and the export runs with the highlight cleared and restored afterwards (the seeded click campaigns also compare the printed audit with the live page's).

  It also plays a campaign shaped like a real one (junk from Malacca: teak bought 1, 2 and 2 at one price, fifteen single-unit purchases and fifteen identical sales, a five-month crossing, two mutinies, the corsairs taking a crate, liquidation). It checks that every grouped trade row's count, quantity and total equal its raw lines, that only identical trades join in the log view and the narration, that the end is labelled once as "End of campaign (liquidation)", and that the replay shows the Atlas vessel name.

  It fails on eighteen planted defects: waits not recorded, storms dropped, pirates on every voyage, the highlight's step one row late, the real row highlighted one late, the highlight skipping past commenda-interest rows, the cash line showing post-liquidation cash, the narration dropping the last trade, the live line rewritten every frame, an announcement on first paint, a replay that draws a random number, reduced motion ignored, the replay printed, the log-row highlight printed, the export keeping the highlight, a group count off by one, the log view joining non-identical rows, and the narration joining trades of different quantities.
- **The ninth command** checks the pilot's notebook, the fixed text after the sailing calendar. The text is static, so the check has two parts.
  - **The copy keeps its rules:**
    - the heading, the four sub-heads and the "Game rule" box are there, in reading order, with the Chinese phrase in `lang="zh-Hant"`;
    - there are five sources, each with its year and locator, and the first three with their reading date;
    - the game-rule box holds no date, place, source or "history", and the history holds no game number;
    - there is no nationality for Zhu Yu's pilots, no landmarks for Zhu Yu (landmarks only under Ibn Mājid), no wait, stop or voyage read into the letters, no ship bound for Aden (PGP 5417's was bound for the islands), and no per-passage pilot;
    - the Mao Kun chart is "from a treatise of c. 1621", with nothing firmer in the visible text, and its source gives the Oxford date and the unconfirmed printing date;
    - every character outside the Chinese spans is in the `cmap` of both embedded Atkinson faces, read from the page itself;
    - the visible text is at most 190 words.
  - **Every number in the game-rule box is read from the copy and checked against the engine:**
    - the storm chance with and without a navigator, in April;
    - the storm roll happening in exactly the transition months, from sailing all 10 lanes in all 12 months and reading the engine's own draws;
    - the speed multiplier on every leg, month and ship, against an independent computation; at least one leg saves no month and at least one saves some;
    - headwinds unchanged by the navigator, and the turn-back chance as read from the engine's source;
    - the price charged once: 23 waits with a navigator end exactly the price below the same seed without one, with cash never reset, and the navigator is still aboard.

  It fails on fourteen planted copy changes, each failing the right check. It fails on six planted engine changes, each failing exactly one check: storm 0.18 → 0.2, speed 1.15 → 1.2, price 180 → 200, a navigator charge on every wait, a storm roll in every month, and turn-back 0.35 → 0.4. It also runs the preview-purity test against five planted notebooks and requires that test to fail on each: one repainted from the game state, one that draws, one shown after the campaign, one hidden during it, and one not hidden on the real end path. `engine/preview-purity.test.mjs` now paints the notebook too, with and without a navigator (80 route paints), and requires its HTML to be the same in every state, and hidden after the last wait ends the campaign (with no extra `renderAll`).
- **The tenth command** checks the ITCZ panel, the closed "Show ITCZ" section under the month planner. It was rebuilt after a pre-PR review, so it shows the ITCZ only as a latitude marker beside each map, never as a band across it. The checks:
  - **No game wind.** Nothing in the panel comes from the game's wind: `getWindState` is never called while it is built, and there are no bearings, speeds, directions or arrowheads in the figures.
  - **No band on the map.** Each map has one rectangle (the ground) and no pattern, mask or other filled shape, and "ITCZ" is never written on the map itself.
  - **The markers.** They sit at the cited 20° N (June–August) and 8° S (December–February), on the game map's own projection, which the builder injects. Their text, the captions and the text equivalents say the same, and the dashed meridians sit at 65° and 95° E.
  - **The copy.** The sector-average label and its citation, "two seasonal positions, not a path", "warming" (the paper's word), and the pointer to the main map's arrows are present, and there are no coastal-approach labels.
  - **Colours.** They are on the allow-list, with at least 4.5:1 for text and 3:1 for the meridians, over both sea and land.
  - **The game map.** Opening the panel never touches `#ocean-svg`.

  It fails on thirteen planted changes, among them a band reintroduced, arrows reintroduced, the latitudes swapped, a marker off its latitude, a sector from 60° E, and "warmer hemisphere". It also runs the preview-purity test against three planted panels and requires that test to fail on each: one that draws when built, one repainted from the game state, and one that adds to the game map. `engine/preview-purity.test.mjs` now paints every state with the panel closed and then open (160 route paints). It requires that opening the panel draws nothing and changes nothing, that the panel's HTML is the same in every state, and that the game map's layers are identical with the panel closed and open.

**Browser check:** serve the repository root (for example `python -m http.server 8000`) and open `http://localhost:8000/tests/03/baseline-check.html`. It compares the game's travel times for all 480 combinations of route, month, ship and navigator against `fixtures/baseline-transit.json`, and reports MATCH or MISMATCH. The snapshot was taken at the original repository's `111acdc`, and the sailing model hasn't changed since.

**Market check (browser):** with the same server, open `http://localhost:8000/tests/03/atlas-market-check.html`. It reports PASS or FAIL for the Atlas trade panel and price chart at all five ports, in seven months:
- the two action groups come Buy before Sell; each caption gives the price it trades at ("Buy · N D", "Sell · N D") and its group holds only that action's buttons, in order (+1, +5, Max; −1, −5, Max), each calling the engine with the quantity shown, Max with `Infinity`, never 99. The caption prices equal the engine's prices and the cash moved by one real `sellCargoQty` and `buyCargoQty`;
- the merged hold summary matches engine state: each row's drawn icon (decorative) and tonnes aboard, the per-good weight bar and its legend, tonnes available, and the engine's bulk/luxury split; the lower hold panel stays hidden;
- each group is named by its own caption (`aria-labelledby`), so the price is read; the row found the engine's five buttons (a changed engine template fails here instead of disabling every control);
- the arrow beside each price matches the engine's direction for next month, and its visually hidden text gives the direction and next month's price;
- the buttons are enabled exactly as the engine allows (`canBuy = cash >= buy price && used + weight <= capacity`, `canSell = held > 0`) at each edge: zero cash, cash one short of the price and exactly the price, a full hold, free space one short of the weight and exactly the weight, nothing held and one held;
- every chart point, read back from its drawn position (the polyline and each dot, whose tooltip names its port, month and price), equals the engine's buy price for that port and month;
- the now and arrival markers and the highest/lowest table are right, and the key gives the destination's buy price in the arrival month;
- the month-by-month table has twelve rows, the now tag on the current month, and in every cell the engine's buy price for that port and month, matched to its column heading;
- closing the chart returns focus to the good's name. The market is re-rendered while the chart is open, so the browser cannot restore focus on its own, and the chart is closed with `requestClose()`, which runs the same path as Escape. The check waits for the dialog's `close` event, where the adapter returns focus, not for a timer;
- for every lane in every month (120 lane-months), the selected route's line style (`data-wind`), wind relation, bearing, days and months equal `computeTransit`;
- through the page's own buttons, in an empty junk with plenty of cash, Max buys as many cloves as fit and can be paid for (300), Max on the sell side sells all 217 held, and +5 and −5 move five;
- by computed style, every visible focusable control on the voyage screen matches `:focus-visible` when focused and draws an outline that isn't none, has width and isn't fully transparent; every `[hidden]` element computes to `display: none`. This pass needs a focused window: in a background tab nothing matches `:focus-visible`. The check asks for focus; if the window still has none, it skips this pass and reports INCOMPLETE (not FAIL, and not PASS);
- at 320 px, every chart dialog (every good, four ports and months, with and without a route, the month table open and closed) must not scroll sideways, and each chart table's narrowest layout must fit the dialog's box inside its borders and padding (from `offsetWidth`, which a drawn scrollbar does not shrink) less 17 px for a classic scrollbar, so the result does not depend on whether this browser draws scrollbars. Shown both ways: with scrollbars drawn (headless Chrome without `--hide-scrollbars`) and with them hidden, this page passes and the page before the fix fails.

Pages built before #45 now fail this check, because they have no action captions (and pages before this change have no −5 or `Infinity`); compare older builds with the seeded campaigns instead.

`?page=<same-origin path>` checks another copy. It has been shown to fail on twenty-seven planted changes:
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
- six focus and `[hidden]` overrides the static check cannot read: `outline:calc(0px)` on the chart buttons, `outline:0e0px` and `outline-width:0` behind attributes, `outline-style:var(--x,none)`, `[class] :focus-visible{outline-color:#0000}`, and `[HIDDEN]{display:block!important}`;
- the action captions' prices swapped;
- Max passing 99, as the engine's own template does;
- the Sell group before the Buy group;
- next month's arrows pointing the wrong way;
- every trade button always enabled;
- the engine template with one button removed;
- an action group without its caption as its name;
- the price chart's summary table at 6 px cell padding (the page before this fix): it needs 233–235 px against 223 with scrollbars hidden, and with scrollbars drawn the dialog also scrolls sideways (273 px against 268).

**UX check (browser):** with the same server, open `http://localhost:8000/tests/03/atlas-ux-check.html`. It reports PASS or FAIL for the UX audit's Student Mode errors, its `beforeunload` guard and the pinned status strip:
- **Student Mode, nine inputs.** The ground truth is the engine's own condition in `startSimulation`, applied to what the fields hold: name and student number non-empty after trimming, `parseInt(target, 10)` a number of at least 100, and the prediction at least 15 characters after trimming. The inputs are:
  - all empty;
  - a short prediction;
  - target `1e3`, which `Number` reads as 1000 and `parseInt` as 1;
  - target `150abc` with a short prediction (a number field holds it as empty, so the engine rejects both);
  - a name of spaces;
  - targets 99 and 100;
  - predictions of 14 and 15 characters inside spaces;
  - a valid entry.

  Exactly the rejected fields must carry `aria-invalid="true"` and `aria-describedby="setup-error"`, and the first must take focus. The error keeps `role="alert"` without `aria-live`, and a valid entry starts the voyage.
- **`beforeunload`:**
  - not prevented on the setup screen or at month 0;
  - prevented after one lot is bought in month 0 and after a wait;
  - not prevented once the campaign ends.
- **The strip, at 375, 768 and 1440 px.**
  - Up to 1099 px it is sticky, and no more than 80 px of it stays on screen, below the engine's header where that is sticky.
  - Its tools come first in the DOM, and none stays on screen.
  - Every number stays visible.
  - `scroll-padding-top` reaches the bottom of what is pinned.
  - Moving focus backwards through every control of the voyage screen (as Shift+Tab does) leaves none of it under what is pinned. Controls taller than the room left are skipped.

  At 1440 px the strip is not pinned and its tools come last.

It has been shown to fail on ten planted changes and on two real pages:
- the planted changes:
  - the audit's first checks (`Number(target) >= 100`, a non-empty prediction);
  - `aria-live` back beside `role="alert"`;
  - no `aria-describedby`;
  - no focus on the first error;
  - the guard only after month 0;
  - the guard left on after the end;
  - the whole strip sticky at `top: 0`;
  - no `scroll-padding-top`;
  - the tools last in the DOM;
  - the header's height ignored;
- the real pages:
  - the live page before the audit (`0fa1c5e2…`);
  - the audit's first rebuild (`3cb99ddf…`).

A real Tab and Shift+Tab sweep (Chrome DevTools key events at 320, 375, 768 and 1024 px) is in the PR, not here, because a page cannot press Tab itself.

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
