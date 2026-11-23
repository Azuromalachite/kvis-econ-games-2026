# Monsoon Navigator (`projects/03`)

Plan an Indian Ocean voyage around the monsoon calendar and run a maritime freight
ledger, presented as "An Atlas of Moving Worlds". This README holds the durable rules
for game 03. They do not live in the root `AGENTS.md`.

## Files in this folder

- [`index.html`](index.html) — the Atlas page. **Generated; do not edit by hand** (see
  "Generated page"). It loads no remote scripts or fonts; its fonts are embedded with
  their SIL Open Font Licence texts, and it shares no CSS with `assets/theme.css`: the
  build inlines the Atlas theme, and the packaging check forbids references outside
  this folder.

The previous page, `classic.html` (and its image `harbor-atlas.jpg`), was removed on
2026-11-22; the rollback copy is no longer kept beside the game. Git history preserves
it — retrieve it with `git show <commit>:projects/03/classic.html` if a rollback is
ever needed. The upstream build no longer emits a "Classic version" link (since
`9ffc0a0`), so the committed `index.html` is the build output unchanged.

## Adopted direction: An Atlas of Moving Worlds

**Status:** Atlas is the collaborators' adopted design target. Publish it through
independent review (`AGENTS.md` rule 7), preserving the applicable licences, attribution
and change notices. CC BY-NC-SA requires adapters to say what they changed and to keep
earlier change notices. Get additional permission only where the intended use falls
outside the existing permissions, for example commercial use that the Commercial
Derivative Exception doesn't cover. No separate approval by the copyright holder is
recorded here; for noncommercial use the licence doesn't require one.

Use the [reference prototype and its review notes](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/ff74d45cc92907f29126626587ae68e2d2703d37/docs/prototype.md), pinned at `ff74d45`, as the presentation target: ivory/cobalt/vermilion opening, dark seasonal navigation map, celadon market, aubergine event reports and light printable audit. Use Archivo for headings, Atkinson Hyperlegible for body text and controls, and IBM Plex Mono for measurements and metadata.

- **Reference only.** Treat it as a visual reference, not a replacement for the current
  engine. Preserve current gameplay fixes, and don't overwrite the game with an older
  prototype.
- **Licence.** Monsoon Navigator's section of [`../../LICENSE.md`](../../LICENSE.md)
  governs the original game. The Atlas visual material is CC BY-NC-SA 4.0 with a
  Commercial Derivative Exception on the same terms, granted by its author (decided
  2026-11-22; see `LICENSE.md`). The copyright holder approved the credit wording and the
  wording of the drawings' description on 2026-11-22.
- **Verification.** Run the checks in [`../../tests/03/README.md`](../../tests/03/README.md)
  (engine tests, planted-defect script and browser travel-time check) against the ported
  page, and report the results. A port that changes the page's structure may need the
  test loader adapted; say so in the PR rather than skipping the checks.
- **Packaging.** "Self-contained" means this folder: its `index.html` plus images beside
  it (`AGENTS.md` rule 4). Nothing loaded from other folders, and no new remote scripts
  (rule 3). Preserve asset attribution and licences.
- **Missing state.** If a visual needs state the engine doesn't keep (ordered visits, cash
  history, event times), never fabricate it. Prefer adding it to the engine as a game
  change under [game-change-review](../../.claude/skills/game-change-review/SKILL.md),
  without changing outcomes (the `tests/03` checks must still pass). A display layer that
  reads the engine's log text instead must be checked on seeded runs: every card shown
  matches an event of that kind the engine drew in that run, and any drawn event without a
  card is skipped by a rule the PR states (for example, once per kind). A change to the log
  wording breaks it silently, so rerun the check whenever the engine or its log text
  changes, and commit the harness or describe it in the PR.
- **New material.** Material added to this folder by other contributors is theirs to
  license. Say in the PR that they license it under this game's section of `LICENSE.md`.
  The Commercial Derivative Exception in Monsoon Navigator's section is granted by its
  copyright holder, and covers only the holder's own work.

## Generated page (approved exception, PR #5, 2026-11-22)

`projects/03/index.html` is built by
[`scripts/build-prototype.mjs` at `2c257c1`](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/2c257c1f9089e60846f7fb4833965e2011bdcb00/scripts/build-prototype.mjs)
(Antooooon125/Week3-monsoon-navigator, branch `fix/atlas-on-main`). Run
`node scripts/build-prototype.mjs` in a checkout of that commit with LF line endings;
it copies the game's inline engine verbatim from that tree's `index.html` (the game at
`ba2f279`) and writes `prototype.html`. `2c257c1` is on the unmerged draft PR
Antooooon125/Week3-monsoon-navigator#14. It is to be tagged upstream as
`kvis-atlas-2026-11-23-routes-prices`, so the pin survives that branch; until the tag
exists, the full commit above is the pin. Commit that file unchanged as `projects/03/index.html`. To change the page, change the game or the Atlas
sources there, pin the new commit here, and rebuild. Before replacing the page, run the
[`tests/03/README.md`](../../tests/03/README.md) checks, including
`tests/03/packaging.test.mjs` and the seeded event-card check
`tests/03/atlas-events.test.mjs` ("Missing state" above). Compare it side by side with
`ff74d45` and list every visual difference, and check 375 px, desktop and print. Record the commit
and the file's SHA-256 in the PR.
