# AGENTS.md

Conventions for AI agents (and humans) working in this repo.

## What this repo is

A static GitHub Pages site of single-file HTML economics games. There is **no build
system, no package manager, no linter**. Never run `npm install`, `yarn`, or
similar — nothing to install. Game 03 has engine checks under `tests/03/`, run
with plain Node and no dependencies.

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
- `tests/03/` — Monsoon Navigator's checks: Node engine tests, a planted-defect script
  and a browser travel-time check. See `tests/03/README.md`. Rule 1 applies to games,
  not to tests.
- `.nojekyll` — required for GitHub Pages; do not delete.
- `LICENSE.md` — the only licence file. It covers the repository material
  (CC BY-NC-SA 4.0) and has a section for each game, with that game's licence
  reproduced verbatim. Each game's `index.html` also carries its own notice. When adding
  a game, add its section and a row to the table there.

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
   do not claim a gameplay test. For any change to `projects/03/index.html`, also run
   the checks in `tests/03/README.md` and report the result. Keep them passing, or
   replace a pinned-defect test on purpose when you fix that defect.
6. Keep the site fully static — no server code, no build artifacts.
7. Default branch is `main`. Use a feature branch and PR for nontrivial changes,
   including redesigns, mechanics, historical claims, audits and repository policy.
   Before merging, get a review from someone other than the author (a person, or an
   agent that didn't write the change). Push directly to `main` only for trivial
   fixes: typos, broken links, or wording that changes no rule or claim.

## Frost & Silver is frozen

`projects/02/` is a frozen teaching baseline, as its own repository's rules have said
since 18 November 2026 ([`AGENTS.md` at `d64a632`](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/AGENTS.md#L12-L19)).

- **Allowed changes:** bugs, accessibility, classroom feedback, evidence corrections and
  the original author's decisions.
- **Not allowed:** new mechanics, decisions or scoring. A checklist for designing
  mechanics never licenses one here.
- **New questions** start with a pre-registration written before any result exists.
  Results found without one are still kept, with a status from
  [game-change-review](.claude/skills/game-change-review/SKILL.md) (at best exploratory).
  Upstream runs this work in its own `research/` (Path B). Whether kvis keeps Frost &
  Silver research in `research/02/` or sends it upstream is for the owners to decide.
- **Graduation (upstream [rule 6](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/research/README.md#L29-L31)):** a mechanism moves into the game only
  if a pre-registered result in upstream `research/` supports it, it can be explained to
  a class in a sentence, and the author agrees. The game then gets it as a minor upgrade
  with its own claim and CI check. As of `d64a632` one mechanism has graduated, by the
  author's decision: planting late (2026-11-19), a toggle that is off by default.

## Adopted Monsoon Navigator direction

**Status:** Atlas is the collaborators' adopted design target. Publish it through
independent review (rule 7), preserving the applicable licences, attribution and change
notices. CC BY-NC-SA requires adapters to say what they changed and to keep
earlier change notices. Get additional permission
only where the intended use falls outside the existing permissions, for example
commercial use that the Commercial Derivative Exception doesn't cover. No separate
approval by the copyright holder is recorded here; for noncommercial use the
licence doesn't require one.

Use **An Atlas of Moving Worlds** as the presentation target: ivory/cobalt/vermilion
opening, dark seasonal navigation map, celadon market, aubergine event reports and
light printable audit. Use Archivo for headings, Atkinson Hyperlegible for body text
and controls, and IBM Plex Mono for measurements and metadata.

When porting the design, consult the
[reference prototype and its review notes](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/ff74d45cc92907f29126626587ae68e2d2703d37/docs/prototype.md), pinned at `ff74d45`.

- **Reference only.** Treat it as a visual reference, not a replacement for the current
  engine. Preserve current gameplay fixes, and don't overwrite the game with an older
  prototype.
- **Licence.** Monsoon Navigator's section of `LICENSE.md` governs the original game.
  The prototype's new visual material is CC BY-NC-SA 4.0, as its author states, without
  the Commercial Derivative Exception.
- **Verification.** Run the checks in `tests/03/README.md` (engine tests, planted-defect
  script and browser travel-time check) against the ported page, and report the
  results. A port that changes the page's structure may need the test loader adapted;
  say so in the PR rather than skipping the checks.
- **Packaging.** "Self-contained" means the game's folder: its `index.html` plus
  images beside it (rule 4). Nothing loaded from other folders, and no
  new remote scripts (rule 3). Preserve asset attribution and licences.
- **New material.** Material added to a game folder by other contributors is theirs to
  license. Say in the PR that they license it under that game's section of `LICENSE.md`.
  The Commercial Derivative Exception in Monsoon Navigator's section is granted by its
  copyright holder, and covers only the holder's own work.

## Agent guidance

[game-change-review](.claude/skills/game-change-review/SKILL.md) is the single workflow
guide for agents: changes, review, checks that can fail, and research retention. Use the
game code for current behaviour and linked evidence records for provenance and decisions.

For these tasks, load the matching checklist alongside it; a checklist supplements
it and doesn't replace it:

| Task | Checklist |
| --- | --- |
| Deployment, visual redesign, browser/offline/print/accessibility checks | [game-release-validation](.claude/skills/game-release-validation/SKILL.md) |
| Source-backed historical claims, dates, quantitative assumptions, evidence and asset rights | [historical-evidence-audit](.claude/skills/historical-evidence-audit/SKILL.md) |
