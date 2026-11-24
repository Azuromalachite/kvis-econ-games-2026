# Frost & Silver (`projects/02`)

Steer a mountain community through the Little Ice Age (c. 1500–1600): ration food,
chase silver from Potosí, answer the crown. The game is
[`index.html`](index.html) — all markup, logic and game-specific styles inline; the
shared design tokens and layout primitives come from [`../../assets/theme.css`](../../assets/theme.css)
(moved there on 2026-11-22 by the adaptation's author's request; the inline `<script>`
and the rendered page are byte-identical to before the move).

This README holds the durable rules for game 02. They do not live in the root
`AGENTS.md`.

## Frost & Silver is frozen

`projects/02/` is a frozen teaching baseline, as its own repository's rules have said
since 18 November 2026 ([`AGENTS.md` at `d64a632`](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/AGENTS.md#L12-L19)).

- **Allowed changes:** bugs, accessibility, classroom feedback, evidence corrections, and
  decisions by the adaptation's author (Thanakrit Wongsatit) or the original game's author
  (Amnuayvit Thitibordin). Styling that follows the shared theme counts under these only
  when the authors ask for it.
- **Not allowed:** new mechanics, decisions or scoring.
- **New questions** start with a pre-registration written before any result exists.
  Results found without one are still kept, with a status from
  [game-change-review](../../.claude/skills/game-change-review/SKILL.md) (at best exploratory).
- **Research lives here,** in [`research/02/`](../../research/02/), with its checks in
  [`tests/02/`](../../tests/02/). The original repository is the record of the earlier
  history. These rules are adopted from its
  [research rules 1–5](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/research/README.md#L13-L28):
  1. **Pre-register before running:** a file in `research/02/pre-registrations/`
     (`YYYY-MM-DD-<slug>.md`) with the question, the predicted result, a decision rule,
     the frozen comparisons and every threshold or range chosen, committed before any
     result exists.
     Later changes are appended as dated deviations, never edited in.
  2. **Report every outcome,** including nulls and failures, in `research/02/results/`
     next to its pre-registration. Anything chosen after seeing results is exploratory.
  3. **Separate from the game:** research code reads the game's model or copies what it
     needs, and never changes `projects/02/index.html`. The pinned run in `tests/02/` must
     not move because of research.
  4. **Evidence through the registry:** a parameter from a source is a claim in
     `research/02/evidence/claims.yml` with its access level; one that isn't is a range
     chosen by judgement, written as such in the pre-registration, never presented as
     historical.
  5. **Model results are not history:** each finding states the model and assumptions it
     holds under. A model can show that a conclusion depends on an assumption; it cannot
     show what happened in the 1500s without independent evidence.
- **Graduation:** a mechanism moves into the game only if a pre-registered result in
  `research/02/` (or one already in the original repository at `d64a632`) supports it, it
  can be explained to a class in a sentence, and the adaptation's author agrees. The game then
  gets it as a minor upgrade with its own evidence claim and a check in `tests/02/` (upstream
  [rule 6](https://github.com/Azuromalachite/frost-and-silver-game/blob/d64a632eaa78e2bc33f9cc4fd1726266f68ac246/research/README.md#L29-L31)).
  As of `d64a632` one mechanism has graduated, by the adaptation's author's decision: planting late
  (2026-11-19), a toggle that is off by default.

## Authorship and licence

Thanakrit Wongsatit's adaptation of Amnuayvit Thitibordin's original. Licensed CC BY-NC-SA
4.0 with a Commercial Derivative Exception granted by both, each for the rights he holds,
as set out in [Frost & Silver's section](../../LICENSE.md#frost--silver-commercial-derivative-exception)
of `LICENSE.md`; the inline IconMCP icons are third-party material and excluded from it.
Confirmed by the owners, 2026-11-24.

## Checks and known baselines

Run the checks in [`tests/02/README.md`](../../tests/02/README.md) when you change
`projects/02/index.html` or the evidence registry, and keep the pinned baseline, unless a
change this README allows moves it; say so in the PR. Do not promote evidence status
merely to pass. The tests read the game's inline `<script>`; a change to page styling
must leave it byte-identical (`python3 tests/02/extract_game_script.py` proves it).

Fonts load from Google Fonts; no scripts are loaded remotely.
