# AGENTS.md

Conventions for AI agents (and humans) working in this repo. Keep this file and
`README.md` minimal: durable, game-specific detail lives in each game's
`projects/NN/README.md`, not here.

## What this repo is

A static GitHub Pages site of browser economics games for the classroom. The playable
games have **no build step, package manager or linter**. Do not run `npm install` or
`yarn` for the games. Checks use plain Node and, for game 02, Python 3 (its evidence
checker needs PyYAML in a separate test environment — see `tests/02/README.md`). Test
dependencies are not game dependencies. There is no CI: run checks by hand (rule 5).

## Layout

- `index.html` — hub page. Links to games; when adding `projects/NN/`, add a card here.
- `assets/theme.css` — the repo-wide theme: design tokens (CSS custom properties),
  dark-mode overrides, base element styles and layout primitives (`.wrap`, `.top`,
  `.mark`, `.panel`, `.btn`, …). Every hand-written page links it first and adds only
  its own rules in an inline `<style>`. Its tokens originated in `projects/02`; the hub
  was consistent with them and now shares them.
- `projects/NN/` — one folder per game: `index.html` plus `README.md` with that game's
  durable rules, decisions, licence notes and freeze policy. **Read the game's README
  before touching the game**; put game-specific rules there, never in this file.
- `research/NN/` — evidence, literature, pre-registrations and results for game NN;
  `tests/NN/` — its checks. Neither is needed to play, and neither belongs in `projects/`.
- `guides/NN/` — a student walkthrough for game NN: an `index.html` with any screenshots
  beside it. A guide is not a game, so rule 1 does not apply to it. It links to the game and
  never changes it. Guides are repository material (`LICENSE.md`); a screenshot also carries
  its game's credits and licence. Every number in a guide comes from the game: from its own
  text, or from playing it with the plan recorded on the page.
- `.nojekyll` — required for GitHub Pages; do not delete.
- `LICENSE.md` — the only licence file. It covers the repository material
  (CC BY-NC-SA 4.0) and has a section for each game, with that game's licence
  reproduced verbatim. Each game's `index.html` also carries its own notice. When adding
  a game, add its section and a row to the table there.

## Rules

1. **Game logic and markup stay in one file.** Each game's HTML, JavaScript and
   game-specific CSS live in `projects/NN/index.html`; do not split them into separate
   JS/CSS assets of their own. Shared styling goes in `assets/theme.css` (rule 4).
   **Exceptions (approved with PR #5, 2026-11-22):** Monsoon Navigator's
   `projects/03/index.html` is generated with its theme inlined, and the rollback copy
   `projects/03/classic.html` may sit beside it (see `projects/03/README.md`).
2. **New games** go in `projects/NN/index.html` using the next number (04, 05, …), link
   `../../assets/theme.css`, describe their rules in a `README.md` beside them, and get
   a card on the hub page.
3. **Remote dependencies**: the hub and hand-written games load fonts from Google Fonts
   and no scripts. Generated or rollback pages follow their game's README (game 03's
   page loads nothing remote; only `classic.html` loads CDN scripts). Do not add remote
   scripts to any hand-written page.
4. **Follow the shared theme.** Use the tokens in `assets/theme.css`; do not hardcode
   colors and do not restate shared rules inside a page. Keep game-specific styling in
   the page's inline `<style>`, as rule 1 says. An image may be embedded or sit as a
   file beside the game's `index.html`. Either way, record its creator, source and
   licence, and never reference a file that isn't in the repo.
5. **Verify game changes by opening the file** in a browser at phone and desktop
   widths; prove styling moves by comparing before/after renders (outside the repo, per
   rule 8) and by checking the game's inline script is unchanged. For documentation-only
   changes, check links, scope and consistency; do not claim a gameplay test. For each
   game you touched, run the checks in `tests/NN/README.md` and report the result. Keep
   pinned baselines passing, or replace a pinned-defect test on purpose when you fix
   that defect, or move a baseline only where the game's README allows; say so in the PR.
   Do not promote evidence status merely to pass.
6. Keep the site fully static — no server code, no build artifacts. The only exception is
   the generated `projects/03/index.html` (see that folder's README).
7. Default branch is `main`. Use a feature branch and PR for nontrivial changes,
   including redesigns, mechanics, historical claims, audits and repository policy.
   Before merging, get a review from someone other than the author (a person, or an
   agent that didn't write the change). Push directly to `main` only for trivial
   fixes: typos, broken links, or wording that changes no rule or claim.
8. **Commit only what the repo needs.** Run scratch work — one-off experiments, ad-hoc
   harnesses, exploratory test cases, screenshots, logs, exported PDFs, `node_modules` —
   **outside the repository**, in a temp directory, and report results in the PR
   description. Commit a check only when it guards a durable contract (a pinned
   baseline, a planted defect, a packaging or evidence rule); extend that game's existing
   suite in `tests/NN/` instead of adding parallel copies, and keep committed fixtures
   small and inspectable. Documentation goes to its one home: game rules to
   `projects/NN/README.md`, evidence and research to `research/NN/`, checks to
   `tests/NN/`, task-local reasoning to the PR — never a new overlapping report.

## Game-specific rules

- **Frost & Silver (`projects/02`) is a frozen teaching baseline.** Only bugs,
  accessibility, classroom feedback, evidence corrections and author decisions change
  it; new mechanics and scoring do not. The full freeze and research policy is in
  [`projects/02/README.md`](projects/02/README.md).
- **Monsoon Navigator (`projects/03`) presents the Atlas art direction, and its page is
  generated; do not edit it by hand.** The design target, licence notes, packaging and
  rebuild procedure are in [`projects/03/README.md`](projects/03/README.md).

## Agent guidance

[game-change-review](.claude/skills/game-change-review/SKILL.md) is the single workflow
guide for agents: changes, review, checks that can fail, lean commits (rule 8), and
research retention. Use the game code for current behaviour and linked evidence records
for provenance and decisions.

For these tasks, load the matching checklist alongside it; a checklist supplements
it and doesn't replace it:

| Task | Checklist |
| --- | --- |
| Deployment, visual redesign, browser/offline/print/accessibility checks | [game-release-validation](.claude/skills/game-release-validation/SKILL.md) |
| Source-backed historical claims, dates, quantitative assumptions, evidence and asset rights | [historical-evidence-audit](.claude/skills/historical-evidence-audit/SKILL.md) |
