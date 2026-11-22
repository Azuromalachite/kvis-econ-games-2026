---
name: game-release-validation
description: Use when publishing or porting a KVIS game, integrating a visual redesign, testing a release candidate, or checking mobile layout, accessibility, offline use or printable audits. Verifies the actual playable artifact, not just its source. Not for research-only edits or unexecuted design proposals.
---

# Validate a playable classroom release

**Scope:** This is the release-specific execution checklist. For independent review, protected game mechanics and claim changes, also use the existing game-change-review skill. Do not replace that skill or duplicate its review record.

## 1. Identify the release candidate

- Record the destination repository, branch/commit, game path, published URL if any, and the intended visual reference at a pinned revision. Distinguish current live behavior from an old prototype: the approved design may be older than the current engine.
- Read any open blocking PRs and actual owner decisions. Do not infer approval, licence or readiness from a comment, a working prototype or a green test alone.
- Identify source-code differences, engine changes, asset paths, local/remote dependencies, third-party credits and a rollback copy or reproducible rollback commit.
- If generated, identify build inputs and builder revisions; rebuild rather than editing generated HTML by hand. Verify the final bytes, not just the source templates.

## 2. Verify the actual artifact

Open the exact proposed release in a browser from the same path/layout it will have on GitHub Pages (or a faithful local server). Use fictional classroom details only.

| Area | Required observations |
| --- | --- |
| Desktop and mobile | Capture setup, active gameplay, adverse event and final audit at ~1440px, 768px and 375px. Test narrower if controls approach the edge. Check clipping, overlap, sticky header space, focus and horizontal scrolling. |
| Interactive controls | Complete both available modes where relevant. Check radio/label activation, buy/sell/wait/sail, recovery from a bad decision, visible consequences and actual disabled states. |
| Accessibility | Keyboard-only action paths, focus visibility/restoration after state changes, control names/labels, contrast, scalable text, reduced-motion handling, and non-color-only cues. |
| Printed output | Print or export a multi-page audit; inspect page breaks, omitted controls, complete ledger, student-name sanitization and readability. A visible export button is not proof of working export. |
| Assets/offline | Check response status for every referenced local file, fonts and licences. Test with network disabled **if offline operation is claimed**; document features needing the network. |
| Gameplay equivalence | Re-run available baseline/engine tests against the deployed file. Compare critical state transitions and settlement against the current authorized engine, not only a dated visual prototype. |

Include before/after screenshots where design fidelity is the point. Do not mistake a visual approximation or one static screenshot for functional verification.

## 3. Tests must detect defects

- Run existing automated checks and explicitly report unrun checks. With controlled exogenous randomness, compare event order, game state and settlement across old/new versions; a seed is insufficient if different action paths consume draws differently.
- Plant at least one temporary, targeted change to verify a claimed regression check detects a wrong value. Do not edit the shipping artifact for this test.
- For responsive layout, test both sides of at least one breakpoint and exercise the actual control, not merely its DOM presence.

**Known failure patterns to catch:** ship SVGs covering labels; mobile trade buttons hidden past an unmarked overflow; sticky header taking half a small screen; audit export widening the viewport; radio labels becoming unclickable; generated CSS breakpoints overriding the intended columns; a game referencing a missing harbour image. These are real prior review findings, not a complete test plan.

## 4. Report and gate

Produce a short, reviewable release report containing: exact candidate and reference revisions; screenshots or reproducible observation paths; automated test commands and results; tested browsers/viewport widths; known regressions; owner/licence/attribution decisions; and rollback procedure.

Label each finding **blocking**, **nonblocking**, or **not checked** with evidence. Do not declare a release ready with unresolved blockers. Do not merge or publish without the authorized maintainer decision and independent review required by AGENTS.md.
