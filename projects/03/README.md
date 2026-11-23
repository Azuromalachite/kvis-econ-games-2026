# Monsoon Navigator (`projects/03`)

Plan an Indian Ocean voyage around the monsoon calendar and run a maritime freight
ledger, presented as "An Atlas of Moving Worlds". This README holds the durable rules
for game 03. They do not live in the root `AGENTS.md`.

## Files in this folder

- [`index.html`](index.html) — the Atlas page. **Generated; do not edit by hand** (see
  "Generated page"). It loads no remote scripts or fonts; its fonts are embedded with
  their SIL Open Font Licence texts. The builder inlines the marked foundations from
  `assets/theme.css` before the Atlas theme; the page has no runtime link to that
  stylesheet, and the packaging check forbids references outside this folder.

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
[`scripts/build-prototype.mjs` at `1e8caae`](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/1e8caae6097f20a326d1508cfa5d09627417bbb9/scripts/build-prototype.mjs)
(Antooooon125/Week3-monsoon-navigator, branch `fix/atlas-decisions`, cut from the risk line `36aa0ed`; the risk line is on the unmerged draft PR
Antooooon125/Week3-monsoon-navigator#14), with the shared
foundations of this repository's `assets/theme.css` inlined. `1e8caae` is to be tagged
upstream as `kvis-atlas-2026-11-24-decisions`, so the pin survives that branch; until the
tag exists, the full commit above is the pin. The builder copies the game's inline
engine verbatim from that tree's `index.html` (the game at `ba2f279`).

The foundation block comes from `assets/theme.css` at KVIS commit `d83fd9f2fea2e0489a8c6b24be6f3594fef0c1d9`.
Put a checkout of that KVIS commit beside an upstream checkout of `1e8caae`, both with
LF line endings, and run in the upstream checkout:

```
node scripts/build-prototype.mjs --shared-theme ../kvis-econ-games-2026/assets/theme.css --shared-theme-revision d83fd9f2fea2e0489a8c6b24be6f3594fef0c1d9
```

Commit the resulting `prototype.html` unchanged as `projects/03/index.html`, and record its hash here.
Generated page SHA-256: `b5621bfd654a474744fb907ecd4ebd4e827e7af4d1321c92a4471cbec381fec1`

The packaging test fails unless the page has exactly this hash, so a hand-merged page cannot pass. That test is the real guarantee. `.gitattributes` also marks the page `-merge`, but Git applies that only in a checkout whose `.gitattributes` already has the line; a branch made before it can still merge two builds silently. Resolve any merge of this page by rebuilding.

**Coastlines.** The map's land comes from Natural Earth 1:50m Land, v5.1.2 (public domain;
[terms](https://www.naturalearthdata.com/about/terms-of-use/)). The builder's
`scripts/coastline.mjs` projects it with an axis-wise linear fit to the five ports
(x from longitude and y from latitude, each by least squares; the game's port positions
are unchanged, and the real positions land within 6.2 map units). It simplifies the result
with Douglas–Peucker at 0.75 map units and pins it in `prototype/coastline.json` (the
source's SHA-256 is checked; 16.4 KB of path data). The page inlines it at build time and
loads nothing remote. Public-domain data needs no attribution; it is recorded here and in
the builder's `docs/prototype.md`.

**What the import takes.** The builder extracts only the block between the
`KVIS foundations:begin` and `KVIS foundations:end` markers: font roles, three spacing
values, control sizing, and focus, hidden and screen-reader utilities. The shared
palette and component layouts are excluded. Atlas supplies its embedded font aliases
and 3 px focus offset, and keeps its colours and layouts. The inline block records its
source commit and SHA-256, and the source and licence notice travels with it. These
foundations remain repository material under CC BY-NC-SA 4.0; neither Commercial
Derivative Exception extends to them (`../../LICENSE.md`). Without the two options the
builder produces the independent Atlas stylesheet.

**Changing the page.** Change the game or the Atlas sources upstream, pin the new commit
here, and rebuild. For a shared-foundation edit, commit the edited KVIS sheet first, then
pass that new full commit to the builder and rebuild. `tests/03/packaging.test.mjs`
requires the embedded foundation block to match the current sheet exactly, so stale
output fails. Palette and component changes outside the marked block do not need an
Atlas rebuild.

**Before replacing the page:**
- Run all the [`tests/03/README.md`](../../tests/03/README.md) checks, including
  `tests/03/packaging.test.mjs`, the seeded event-card check
  `tests/03/atlas-events.test.mjs` ("Missing state" above), the sea-lane check and the
  browser market check.
- Compare the page side by side with `ff74d45` and list every visual difference.
- Check 375 px, desktop and print.
- Record the builder commit, the inputs and the file's SHA-256 in the PR, and update the
  pinned hash above.
