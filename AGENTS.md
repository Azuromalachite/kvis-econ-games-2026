# AGENTS.md

Conventions for AI agents (and humans) working in this repo.

## What this repo is

A static GitHub Pages site of single-file HTML economics games. There is **no build
system, no package manager, no tests, no linter**. Never run `npm install`,
`yarn`, or similar — nothing to install.

## Layout

- `index.html` — hub page. Links to games; when adding `projects/NN/`, add a card here.
  Its design tokens (CSS variables, fonts, dark-mode pattern) are copied from
  `projects/02` — keep them consistent.
- `projects/02/index.html` — *Frost & Silver*. Vanilla JS + inline CSS. Styling is driven
  by CSS custom properties in `:root` with `prefers-color-scheme` and
  `data-theme` dark-mode overrides. Use these tokens; do not hardcode colors.
- `projects/03/index.html` — *Monsoon Navigator*. Currently uses Tailwind via CDN
  (`cdn.tailwindcss.com`) plus html2canvas and jsPDF from cdnjs. This describes
  the current implementation; follow the adopted visual direction below.
- `.nojekyll` — required for GitHub Pages; do not delete.
- `LICENSE`, `LICENSE.md` — repository licence (CC BY-NC-SA 4.0). Each game folder also
  has its own `LICENSE.md`; it is not game code, so rule 1 doesn't apply to it. Keep a
  game's licence file verbatim from its source, and give every new game one.

## Rules

1. **One file per game.** All markup, styles, and logic stay inside the game's
   `index.html`. Do not split into separate JS/CSS assets.
2. **New games** go in `projects/NN/index.html` using the next number
   (04, 05, …) and get a card on the hub page.
3. **Remote dependencies**: the hub and game 02 load fonts from Google Fonts and no
   scripts. Game 03 currently loads Tailwind, jsPDF and html2canvas from CDNs. Do not
   add remote scripts to the hub or 02. A port of 03 to the Atlas direction may drop
   Tailwind; it should not add new remote scripts.
4. **Follow each project's adopted visual direction.** Keep 02's existing tokens;
   use the Atlas direction below for 03. Its current Tailwind styling is not a
   requirement to preserve. Keep code inline as rule 1 says. An image may be
   embedded or sit as a file beside the game's `index.html`. Either way, record its
   creator, source and licence, and never reference a file that isn't in the repo.
5. **Verify game changes by opening the file** in a browser at phone and desktop
   widths. For documentation-only changes, check links, scope and consistency;
   do not claim a gameplay test. Reuse applicable checks if available.
6. Keep the site fully static — no server code, no build artifacts.
7. Default branch is `main`. Use a feature branch and PR for nontrivial changes,
   including redesigns, mechanics, historical claims, audits and repository policy.
   Before merging, get a review from someone other than the author (a person, or an
   agent that didn't write the change). Push directly to `main` only for trivial
   fixes: typos, broken links, or wording that changes no rule or claim.

## Adopted Monsoon Navigator direction

**Status:** adopted by the collaborators as the design target. No approval by
Monsoon Navigator's copyright holder is recorded in this repository. Get and link
that approval before replacing the published game's design.

Use **An Atlas of Moving Worlds** as the presentation target: ivory/cobalt/vermilion
opening, dark seasonal navigation map, celadon market, aubergine event reports and
light printable audit. Use Archivo for headings, Atkinson Hyperlegible for body text
and controls, and IBM Plex Mono for measurements and metadata.

When porting the design, consult the
[reference prototype and its review notes](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/ff74d45cc92907f29126626587ae68e2d2703d37/docs/prototype.md), pinned at `ff74d45`.

- **Reference only.** Treat it as a visual reference, not a replacement for the current
  engine. Preserve current gameplay fixes, and don't overwrite the game with an older
  prototype.
- **Licence.** The prototype's own licence statement predates the project licence and
  is not authoritative; `projects/03/LICENSE.md` is.
- **Verification.** This repo has no automated check yet; Monsoon Navigator's 480-row
  transit check and engine tests are in the original repository. Before a port, either
  bring a check that can fail into this repo, or say in the PR that behaviour was
  verified by hand, and how.
- **Assets.** Keep the published page self-contained, and preserve asset attribution
  and licences.
- **New material.** Material added to a game folder by other contributors is theirs to
  license. Say in the PR that they license it under that folder's `LICENSE.md`. The
  Commercial Derivative Exception there is granted by Monsoon Navigator's copyright
  holder, and covers only the holder's own work.

## On-demand review guidance

For game mechanics, historical claims, research handoffs, and cross-week reviews,
read [game-change-review](.claude/skills/game-change-review/SKILL.md).
Keep this as the single workflow guide for agents; use the game code for current
behavior and linked evidence records for provenance and decisions.
