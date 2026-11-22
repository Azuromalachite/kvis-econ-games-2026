---
name: game-release-validation
description: Use when publishing or porting a KVIS game, integrating a visual redesign, testing a release candidate, or checking mobile layout, accessibility, offline use or printable audits. Verifies the actual playable artifact, not just its source. Not for research-only edits or unexecuted design proposals.
---

# Validate a playable classroom release

**Scope:** This is the release-specific execution checklist. For independent review, game mechanics and claim changes, also use the existing game-change-review skill. Do not replace that skill or duplicate its review record.

## 1. Identify the release candidate

- Record the destination repository, branch/commit, game path, published URL if any, and the intended visual reference at a pinned revision. Distinguish current live behavior from an old prototype: the intended design may be older than the current engine.
- Check open PRs that touch the same game file or describe `main` (see "Stale branches" in game-change-review), and the recorded terms in `LICENSE.md` and `AGENTS.md`. Do not infer licence or readiness from a comment, a working prototype or a green test alone.
- Identify source-code differences, engine changes, asset paths, local/remote dependencies, third-party credits and a rollback copy or reproducible rollback commit.
- If generated, identify build inputs and builder revisions; rebuild rather than editing generated HTML by hand. Verify the final bytes, not just the source templates.

## 2. Verify the actual artifact

Open the exact proposed release in a browser from the same path/layout it will have on GitHub Pages (or a faithful local server). Use fictional classroom details only.

Report a row for a feature the game doesn't have as **N/A**, not as a pass.

| Area | Observations (where the game has the feature) |
| --- | --- |
| Desktop and mobile | Capture setup, active gameplay, an adverse event if the game has one, and the final screen or audit. Phone and desktop widths are the minimum (`AGENTS.md` rule 5); ~1440px, 768px and 375px is the recommended set. Test narrower if controls approach the edge. Check clipping, overlap, sticky header space, focus and horizontal scrolling. |
| Interactive controls | Complete every available mode (Monsoon Navigator: Play Only and Student Mode). Exercise each game action (Monsoon Navigator: buy, sell, wait, sail, loans, hull repair and hiring a specialist; the last two have no engine tests). Check radio/label activation, recovery from a bad decision, visible consequences and actual disabled states. |
| Accessibility | Keyboard-only action paths, focus visibility/restoration after state changes, control names/labels, contrast, scalable text, reduced-motion handling, and non-color-only cues. |
| Printed output | Where the game prints or exports an audit (Monsoon Navigator's PDF), print or export a multi-page one; inspect page breaks, omitted controls, complete ledger, student-name sanitization and readability. A visible export button is not proof of working export. |
| Assets/offline | Check response status for every referenced local file, fonts and licences. Hand-written pages may reference the repo-wide `assets/theme.css`; beyond that, no new remote scripts (rule 3) and game folders load nothing from other folders (rule 4 and "Packaging" in `projects/03/README.md`), and no page may reference a file that isn't in the repo. Test with network disabled **if offline operation is claimed**; document features needing the network. |
| Gameplay equivalence | For Monsoon Navigator, run the checks in `tests/03/README.md` (rule 5) against the candidate `projects/03/index.html`; they don't cover PDF rendering or what only a real browser shows (see that README). Compare critical state transitions and settlement against the current engine on `main`, not only a dated visual prototype. |

Include before/after screenshots where design fidelity is the point. Do not mistake a visual approximation or one static screenshot for functional verification.

## 3. Tests must detect defects

- Apply game-change-review's "check that can fail" section, including its rules on controlling randomness. For Monsoon Navigator, `node tests/03/engine/planted-defects.mjs` is the planted-defect check for the existing engine tests; a new check, such as a layout or PDF check, needs its own. Report unrun checks explicitly.
- For responsive layout, test both sides of every breakpoint you claim to support, and exercise the actual control, not merely its DOM presence.
- **Validate outside the repo, commit only what lasts (`AGENTS.md` rule 8).** Run the browser pass, screenshots, print/PDF exports and any one-off layout harness from a temp directory outside the repository. Keep every artifact of the validation session — images, logs, profiling dumps, throwaway test files — out of Git; report observations in the release file below. Commit into `tests/NN/` only a reusable check that guards a durable contract, and extend an existing suite (for example `tests/03/packaging.test.mjs` for new reference forms) rather than adding a parallel one.

**Known failure patterns to catch:** ship SVGs covering labels; mobile trade buttons hidden past an unmarked overflow; sticky header taking half a small screen; audit export widening the viewport; radio labels becoming unclickable; generated CSS breakpoints overriding the intended columns; a game referencing a missing harbour image. These are patterns to look for, not a complete test plan. Only the missing harbour image is recorded in this repository (PR #2).

## 4. Report and gate

Produce a short, reviewable release report containing: exact candidate and reference revisions; screenshots or reproducible observation paths; automated test commands and results; tested browsers/viewport widths; known regressions; open licence and attribution questions (see `LICENSE.md`); and rollback procedure.

Label each finding **blocking**, **nonblocking**, or **not checked** with evidence. Do not declare a release ready with unresolved blockers. Do not merge or publish without the independent review required by `AGENTS.md` rule 7.
