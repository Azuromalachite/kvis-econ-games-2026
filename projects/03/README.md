# Monsoon Navigator (`projects/03`)

Plan an Indian Ocean voyage around the monsoon calendar and run a maritime freight
ledger, presented as "An Atlas of Moving Worlds". This README holds the durable rules
for game 03. They do not live in the root `AGENTS.md`.

## Files in this folder

- [`index.html`](index.html) — the Atlas page. **Generated; do not edit by hand** (see
  "Generated page"). It loads no remote scripts or fonts; its fonts are embedded with
  their SIL Open Font Licence texts, and the builder inlines the marked foundations from `assets/theme.css` before
  the Atlas theme. It has no runtime link to that stylesheet; the packaging check
  forbids references outside this folder.

The previous page, `classic.html` (and its image `harbor-atlas.jpg`), was removed on
2026-11-22; the rollback copy is no longer kept beside the game. Git history preserves
it — retrieve it with `git show <commit>:projects/03/classic.html` if a rollback is
ever needed. The patched builder omits the removed Classic-version link; do not edit
the generated file after building.

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

Use [`scripts/build-prototype.mjs` at `af55675`](https://github.com/Antooooon125/Week3-monsoon-navigator/blob/af55675e34f48d6c3c20932c2670d3f2a4da448d/scripts/build-prototype.mjs)
in an upstream checkout of `af55675e34f48d6c3c20932c2670d3f2a4da448d`, with
[`../../tools/03/atlas-shared-foundations.patch`](../../tools/03/atlas-shared-foundations.patch)
applied. The patch SHA-256 is
`87698e0714a6d634143ee927454383f3abb2295b85e9cd067e6e2384ab38f430`.
It is a versioned builder input, not a scratch experiment. It changes the upstream
builder, removes the obsolete Classic link from its adapter and documents the option;
it does not change the game engine. This preserves the game at `ba2f279`.
The patch is retained here because upstream publishing was unavailable during this
change; it is not claimed to be an upstream commit.

The shared foundation block comes from `assets/theme.css` at KVIS commit
`02b62184aa8cd516fe646aeb22057c9f51dd3c53`. The current KVIS checkout contains those same
foundation bytes and the builder patch. Use this KVIS checkout beside the upstream
checkout above, with LF line endings, and run from the upstream game repository:

```
git apply --check ../kvis-econ-games-2026/tools/03/atlas-shared-foundations.patch
git apply ../kvis-econ-games-2026/tools/03/atlas-shared-foundations.patch
node scripts/build-prototype.mjs --shared-theme ../kvis-econ-games-2026/assets/theme.css --shared-theme-revision 02b62184aa8cd516fe646aeb22057c9f51dd3c53
```

Copy `prototype.html` unchanged to this folder as `index.html`. The builder extracts
only the block between the `KVIS foundations:begin` and `KVIS foundations:end`
markers: font roles, three spacing values, control sizing, focus and hidden/screen-reader
utilities. The shared palette and component layouts are excluded. Atlas supplies its
embedded font aliases and 3 px focus offset, and retains its colours and layouts. The
inline block records its source commit and SHA-256; the source/licence notice travels
with it. These foundations remain repository material under CC BY-NC-SA 4.0; neither
Commercial Derivative Exception extends to them (`../../LICENSE.md`).

To change the generated page, change and pin the upstream builder/Atlas sources (or
the versioned patch until it is published upstream). For a shared-foundation edit,
commit the edited KVIS sheet first, pass that new full commit to the builder and
rebuild. `tests/03/packaging.test.mjs` requires the embedded foundation block to match
the current sheet exactly, so stale output fails. Palette and component changes
outside the marked block do not require an Atlas rebuild.

Run [`tests/03/README.md`](../../tests/03/README.md), including the packaging and
seeded event-card checks. Compare before/after at 375 px and desktop, and inspect
print; record results, builder/input identities and output SHA-256 in the PR. The
original visual target remains `ff74d45`; a shared-foundation rebuild should introduce
no additional visual change relative to the deployed Atlas page.
