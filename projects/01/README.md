# Silk Road Expedition Simulator (`projects/01`)

*Silk Road Expedition Simulator (Han-Roman Era)*, the Week 1 game: lead a caravan from
Chang'an to Rome, exchange currencies, trade cargo, hire guards and guides, and manage
water. This README holds the durable rules for game 01. They do not live in the root
`AGENTS.md`.

## Authorship and terms: not yet confirmed

The recovered page carries no author credit or licence notice. Who wrote it, what
attribution it needs, and on what terms it may be published or adapted are not known;
only the owner can confirm them. Until then, Week 1's section of
[`../../LICENSE.md`](../../LICENSE.md) asserts no licence for the game, and the import
must not be merged or deployed.

## Files in this folder

- [`index.html`](index.html) — the game. It links `../../assets/theme.css` and loads
  fonts from Google Fonts, as `AGENTS.md` rule 3 allows; it loads no remote scripts.
  jsPDF 2.5.1 and html2canvas 1.4.1, used for the PDF report, are embedded in it as their
  released cdnjs builds, byte for byte, with their MIT licence headers. To update one,
  replace its `<script id="vendor-…">` contents with the new release unchanged and change
  its hash in `tests/01/page.test.mjs`.

## Source

Recovered on 22 November 2026 from the `data-code` attribute of the
[Google Sites embed](https://sites.google.com/view/silkroadmerchant/full-page-embed)
(whose address says "silkroadmerchant"; the game's own title is the one above). Google's
embedding wrapper is not included.

| What | SHA-256 |
| --- | --- |
| Decoded UTF-8 payload (no trailing newline) | `05cda7c43f644b9a4641b1208f72b84b58811c830c6be4b89e744f72e2ba152d` |
| Its inline game script, as recovered | `8aa8337731af480af1ff7125a250eafa0602eb48320b5dc3c7e7630ab9d096d4` |

## Changes from the recovered original

Made by the KVIS collaborators, 22 November 2026, in PR #14. Game constants, prices,
exchange rates and random events are unchanged.

1. **No remote scripts.** The Tailwind Play CDN is gone: the page uses the shared theme,
   and its inline style keeps the recovered Tailwind class names, with the layout values
   Tailwind CSS v3.4.17 (MIT) generated for them and colours mapped to the theme's tokens.
   jsPDF and html2canvas are embedded (see "Files").
2. **PDF report.** The student name and ID are drawn as text (they captured empty), the
   whole audit log is captured (it was cut to its scroll box), and the PDF breaks across
   A4 pages between log lines (it was one image on one page).
3. **Currency carry-over.** Local currency is no longer carried into a city with a
   different currency and revalued there. On arrival, a money changer converts it back to
   Florins at its own rate, less the usual 5% fee, and the log says so.
4. **Difficulty.** The difficulty is locked at launch, and the ROI baseline is the capital
   the expedition started with. Changing the menu mid-game used to change both.
5. **After the report.** Trading, hiring, water and travel are locked; the travel button
   reopens the report instead of adding another arrival in Rome.
6. **Text matches the code.** Guards and guides are paid once, not per stage. Two or more
   guards stop raids and one gives no protection. Raids seize 1 Silk Bolt; there are no
   casualties. Each guide saves 2 of 6 water units, minimum 2, not 30%, and the claim
   that guides navigate mountain weather is removed. The menu shows Easy's 0.5x hazard
   and Hard's 1.2x water and 1.5x hazard multipliers.
7. **Stranded caravans.** A caravan that cannot cross and cannot raise 50 Florins for
   water, even by selling its cargo, now ends the expedition with a report instead of
   stalling.
8. **Accessibility.** The 8 visual labels are linked to their fields, the report is a
   labelled dialog, and focus moves into it when it opens.
9. **Presentation.** The page follows the shared theme in light and dark mode (it was
   always dark), with a source notice at its top and a footer, and a print rule that shows
   the whole audit log.

## Rules for changing this game

- **The game script.** Markup and CSS can change without touching the inline game
  script. A styling change must leave it byte-identical: record its SHA-256 before and
  after in the PR.
- **Colours** come from `assets/theme.css` tokens (`AGENTS.md` rule 4). The route map's
  colours are written by the game script, so the page maps each of them to a token with
  an attribute selector; keep those selectors in step if the script's colours change.
- **Checks.** Run [`../../tests/01/README.md`](../../tests/01/README.md) for any change
  to `index.html`. The seeded scenarios pin final cash and ROI; a deliberate change to
  the economy moves them, and the PR must say so.

**Known limits:**
- The PDF's page background is fixed in the game script to the dark report colour, so in
  light mode the unused part of the report's last page is dark.
- The historical and economic claims and parameters are as recovered and have not been
  reviewed against sources.
