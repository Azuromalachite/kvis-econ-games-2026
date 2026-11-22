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
- `projects/03/index.html` — *Monsoon Navigator*. Uses Tailwind via CDN
  (`cdn.tailwindcss.com`) plus html2canvas and jsPDF from cdnjs. Styling is
  utility-class based; follow the existing Tailwind conventions in this file.
- `.nojekyll` — required for GitHub Pages; do not delete.

## Rules

1. **One file per game.** All markup, styles, and logic stay inside the game's
   `index.html`. Do not split into separate JS/CSS assets.
2. **New games** go in `projects/NN/index.html` using the next number
   (04, 05, …) and get a card on the hub page.
3. **CDN dependencies**: `projects/03` already loads Tailwind, jsPDF,
   html2canvas from CDNs. Do not add new CDN libraries to other projects —
   games 02 and the hub are dependency-free by design.
4. **Preserve each project's style.** Don't introduce Tailwind into 02 or
   hand-rolled CSS tokens into 03.
5. **Verify by opening the file** in a browser (or `open projects/02/index.html`).
   There is no automated check.
6. Keep the site fully static — no server code, no build artifacts.
7. Default branch is `main`; push there directly.
