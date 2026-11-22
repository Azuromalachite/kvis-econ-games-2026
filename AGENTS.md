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
  the current implementation; follow the approved visual direction below.
- `.nojekyll` — required for GitHub Pages; do not delete.
- `LICENSE`, `LICENSE.md` — repository licence (CC BY-NC-SA 4.0). Each game folder also
  has its own `LICENSE.md`; it is not game code, so rule 1 doesn't apply to it. Keep a
  game's licence file verbatim from its source, and give every new game one.

## Rules

1. **One file per game.** All markup, styles, and logic stay inside the game's
   `index.html`. Do not split into separate JS/CSS assets.
2. **New games** go in `projects/NN/index.html` using the next number
   (04, 05, …) and get a card on the hub page.
3. **CDN dependencies**: `projects/03` already loads Tailwind, jsPDF,
   html2canvas from CDNs. Do not add new CDN libraries to other projects —
   games 02 and the hub are dependency-free by design.
4. **Follow each project's approved visual direction.** Keep 02's existing tokens;
   use the Atlas direction below for 03. Its current Tailwind styling is not a
   requirement to preserve. Keep game assets inline as required by rule 1.
5. **Verify game changes by opening the file** in a browser at phone and desktop
   widths. For documentation-only changes, check links, scope and consistency;
   do not claim a gameplay test. Reuse applicable checks if available.
6. Keep the site fully static — no server code, no build artifacts.
7. Default branch is `main`. Use a feature branch and PR for nontrivial changes,
   including redesigns, mechanics, historical claims, audits and repository policy.
   Obtain independent review before merging. Reserve direct pushes for trivial
   corrections within the user-authorized scope.

## Approved Monsoon Navigator direction

Use **An Atlas of Moving Worlds** as the presentation target: ivory/cobalt/vermilion
opening, dark seasonal navigation map, celadon market, aubergine event reports and
light printable audit. Use Archivo for headings, Atkinson Hyperlegible for body text
and controls, and IBM Plex Mono for measurements and metadata.

Consult the [reference prototype and its review notes](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/design/atlas-of-moving-worlds/docs/prototype.md)
when porting the design. Treat it as a visual reference, not a replacement for the
current engine. Preserve current gameplay fixes and verify behavior against the
current revision; do not overwrite the game with an older prototype. Keep the
published page self-contained, and preserve asset attribution and licences.

## On-demand review guidance

For game mechanics, historical claims, research handoffs, and cross-week reviews,
read [game-change-review](.claude/skills/game-change-review/SKILL.md).
Keep this as the single workflow guide for agents; use the game code for current
behavior and linked evidence records for provenance and decisions.
