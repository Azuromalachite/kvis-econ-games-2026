# AGENTS.md

Conventions for AI agents (and humans) working in this repo.

## What this repo is

A static GitHub Pages site of single-file HTML economics games. There is **no build
system, no package manager, no linter**. Never run `npm install`, `yarn`, or
similar — nothing to install. Game 03 has engine checks under `tests/03/`, run
with plain Node and no dependencies.

**Proposed exception (PR #5), in force only once the owners have approved that PR's
merge:** Monsoon Navigator's `projects/03/index.html` may be a generated file, built
outside this repo and committed whole, with a rollback copy of the previous page as
`projects/03/classic.html`. It is allowed only with pinned build inputs, reproducible
build instructions, retained licence and font notices, and passing checks (see
"Generated page" below). Players never install or build anything. No other file may be
generated. The collaborator recommended this exception on 2026-11-22.

## Layout

- `index.html` — hub page. Links to games; when adding `projects/NN/`, add a card here.
  Its design tokens (CSS variables, fonts, dark-mode pattern) are copied from
  `projects/02` — keep them consistent.
- `projects/02/index.html` — *Frost & Silver*. Vanilla JS + inline CSS. Styling is driven
  by CSS custom properties in `:root` with `prefers-color-scheme` and
  `data-theme` dark-mode overrides. Use these tokens; do not hardcode colors.
- `projects/03/index.html` — *Monsoon Navigator*: the Atlas art direction from `ff74d45`,
  rebuilt on the current game. **Generated; do not edit by hand** (see "Generated page").
  It loads no remote scripts or fonts; its fonts are embedded with their SIL Open Font
  Licence texts.
- `projects/03/classic.html` — the previous Monsoon Navigator page (Tailwind via CDN plus
  html2canvas and jsPDF from cdnjs), kept byte-for-byte for rollback, with its image
  `harbor-atlas.jpg`. Do not restyle or update it. To roll back, copy it over `index.html`.
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
   `index.html`. Do not split into separate JS/CSS assets. **Proposed exception (PR #5),
   in force only once the owners have approved that PR's merge:** the rollback copy
   `projects/03/classic.html` may sit beside Monsoon Navigator's page. It is the only
   second page allowed in a game folder.
2. **New games** go in `projects/NN/index.html` using the next number
   (04, 05, …) and get a card on the hub page.
3. **Remote dependencies**: the hub and game 02 load fonts from Google Fonts and no
   scripts. Game 03's page loads nothing remote; only its rollback copy `classic.html` loads
   Tailwind, jsPDF and html2canvas from CDNs. Do not add remote scripts to any page.
4. **Follow each project's adopted visual direction.** Keep 02's existing tokens;
   use the Atlas direction below for 03. Keep code inline as rule 1 says. An image may be
   embedded or sit as a file beside the game's `index.html`. Either way, record its
   creator, source and licence, and never reference a file that isn't in the repo.
5. **Verify game changes by opening the file** in a browser at phone and desktop
   widths. For documentation-only changes, check links, scope and consistency;
   do not claim a gameplay test. For any change to `projects/03/index.html`, also run
   the checks in `tests/03/README.md` and report the result. Keep them passing, or
   replace a pinned-defect test on purpose when you fix that defect.
6. Keep the site fully static — no server code, no build artifacts. The only exception is
   the proposed one for the generated `projects/03/index.html` (see above).
7. Default branch is `main`. Use a feature branch and PR for nontrivial changes,
   including redesigns, mechanics, historical claims, audits and repository policy.
   Before merging, get a review from someone other than the author (a person, or an
   agent that didn't write the change). Push directly to `main` only for trivial
   fixes: typos, broken links, or wording that changes no rule or claim.

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
  The Atlas visual material is CC BY-NC-SA 4.0 with a Commercial Derivative Exception on
  the same terms, granted by its author (decided 2026-11-22; see `LICENSE.md`). The
  credit wording awaits the copyright holder's confirmation.
- **Verification.** Run the checks in `tests/03/README.md` (engine tests, planted-defect
  script and browser travel-time check) against the ported page, and report the
  results. A port that changes the page's structure may need the test loader adapted;
  say so in the PR rather than skipping the checks.
- **Packaging.** "Self-contained" means the game's folder: its `index.html` plus
  images beside it (rule 4). Nothing loaded from other folders, and no
  new remote scripts (rule 3). Preserve asset attribution and licences.
- **Missing state.** If a visual needs state the engine doesn't keep (ordered visits, cash
  history, event times), never fabricate it. Prefer adding it to the engine as a game
  change under game-change-review, without changing outcomes (the `tests/03` checks must
  still pass). A display layer that reads the engine's log text instead must be checked on
  seeded runs: every card shown matches an event of that kind the engine drew in that run,
  and any drawn event without a card is skipped by a rule the PR states (for example, once
  per kind). A change to the log wording breaks it silently, so rerun the check whenever
  the engine or its log text changes, and commit the harness or describe it in the PR.
- **New material.** Material added to a game folder by other contributors is theirs to
  license. Say in the PR that they license it under that game's section of `LICENSE.md`.
  The Commercial Derivative Exception in Monsoon Navigator's section is granted by its
  copyright holder, and covers only the holder's own work.
- **Generated page.** `projects/03/index.html` is built by
  [`scripts/build-prototype.mjs` at `f25a23d`](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/f25a23d/scripts/build-prototype.mjs)
  (Antooooon125/Week3-monsoon-navigator, branch `fix/atlas-on-main`). Run
  `node scripts/build-prototype.mjs` in a checkout of that commit with LF line endings;
  it copies the game's inline engine verbatim from that tree's `index.html` (the game at
  `ba2f279`) and writes `prototype.html`. `f25a23d` is on the unmerged draft PR
  Antooooon125/Week3-monsoon-navigator#14 and is tagged upstream as
  `kvis-atlas-2026-11-22`, so the pin survives that branch. Commit that file unchanged as
  `projects/03/index.html`. To change the page, change the game or the Atlas sources
  there, pin the new commit here, and rebuild. Before replacing the page, run the
  `tests/03/README.md` checks, including `tests/03/packaging.test.mjs` and the seeded
  event-card check `tests/03/atlas-events.test.mjs` ("Missing state" above). Also play the same seeded clicks on the new page and on
  `classic.html` and compare (no harness for this is in the repo yet; describe the one
  you used in the PR). Compare it side by side with `ff74d45` and list every visual
  difference, and check 375 px, desktop and print. Record the commit and the file's
  SHA-256 in the PR.

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
