# Silk Road Expedition Simulator checks (`projects/01`)

Checks that read or run the real `projects/01/index.html` and can fail. Nothing in the
game is edited or re-implemented.

## Run

From the repository root, with Node 20 or later (they have run on Node 24, not yet in CI):

```
node --test tests/01/page.test.mjs
node --test tests/01/scenarios.test.mjs
node tests/01/planted-defects.mjs
```

`WEEK1_INDEX=<path>` points the first two at another copy of the page.

- **`page.test.mjs`** checks packaging and styling rules:
  - the page is LF only;
  - the embedded jsPDF 2.5.1 and html2canvas 1.4.1 are the released cdnjs builds
    (SHA-256 below);
  - nothing remote is loaded except Google Fonts (`AGENTS.md` rule 3), and
    `../../assets/theme.css` is linked before the page's one inline style;
  - that style hard-codes no colour. Attribute selectors may name the route map's colours,
    which the game script writes;
  - every class the page uses, in markup or script strings, has a rule;
  - the game script parses.
- **`scenarios.test.mjs`** evaluates the game's inline script unchanged, with a small
  stand-in for the page that accepts every call and renders nothing.
  - Four seeded scenarios replace `Math.random` with mulberry32, stub `alert`, and play a
    fixed sequence of moves through the game's own functions. The moves never carry local
    currency between cities, change the difficulty after launch, reopen the report or run
    dry, so they gave the same result on the recovered original and give it now.
  - Only `processLegEvents` draws random numbers (one per leg), so a scenario sees the
    same draw on the same leg on every run.
  - Four more tests pin the fixes made in PR #14: currency conversion on arrival, the
    difficulty and ROI baseline fixed at launch, the lock after the report, and the
    stranded-caravan ending.
- **`planted-defects.mjs`** makes 12 changes to a temporary copy of the page, one at a
  time. For each, the named test must fail while others in the same file still pass,
  and `index.html` must have the same hash afterwards.

## Pinned scenarios

The hash covers final cash, ROI, initial capital, every log line without its timestamp,
and every alert. The same values were recorded from a browser run of the recovered
original, with its CDN libraries, before any fix.

| Scenario | Mode, seed | Final cash (Florins) | ROI | Log lines |
| --- | --- | --- | --- | --- |
| A | Normal, 1 | 55,358 | 5436% | 58 |
| B | Hard, 7 | 39,407 | 7781% | 81 |
| C | Survival, 3 | 7,000 | 2700% | 26 |
| D | Easy, 11 | 61,121 | 2345% | 138 |

These are regression contracts for the game as it is, not historical results. A
deliberate change to prices, rates, events or scoring must update them and this table
together, and say so in the PR.

## Library hashes

| File | SHA-256 |
| --- | --- |
| `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` | `98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875` |
| `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js` | `e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb` |

## Not covered

- Anything only a browser shows: layout, fonts, light and dark rendering, focus, the PDF
  capture and its pagination. Check those by opening the page (`AGENTS.md` rule 5).
- The report's date and timestamp lines, the hypothesis text, and `window.print()`.
- The historical and economic claims behind the game's numbers.
