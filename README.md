# KVIS Econ Games 2026

Playful economics: browser games built for the classroom. Every game runs entirely in
the browser — no installs, no accounts, no build step.

Live site: https://azuromalachite.github.io/kvis-econ-games-2026/

## Structure

```
index.html                Landing page linking to all games
assets/theme.css          Shared theme: design tokens, dark mode, layout primitives
projects/
  01/index.html           Silk Road Expedition Simulator (Han-Roman Era) — lead a
                          caravan from Chang'an to Rome: trade, exchange, water.
  01/README.md            That game's rules, source and change list
  02/index.html           Frost & Silver — steer a mountain community through the
                          Little Ice Age (c. 1500–1600): ration food, chase silver
                          from Potosí, answer the crown.
  02/README.md            That game's rules and history (frozen baseline)
  03/index.html           Monsoon Navigator — plan an Indian Ocean voyage around the
                          monsoon calendar and run a maritime freight ledger. Presented
                          as "An Atlas of Moving Worlds" (generated file).
  03/classic.html         The previous Monsoon Navigator page, kept for rollback.
  03/README.md            That game's rules (Atlas direction, build pin, licences)
guides/
  02/index.html           A guided first playthrough of Frost & Silver.
.nojekyll                 Disables Jekyll so GitHub Pages serves files as-is
```

Each game's own rules, freeze policy and licence notes live in its `projects/NN/README.md`.

## Playing

Open `index.html` in any browser, or navigate directly to a game in its
`projects/NN/` folder. A game's logic is one HTML file; its shared styling comes from
`assets/theme.css`, so keep the repo layout when copying it locally. Monsoon Navigator
embeds its fonts and needs no network to play. The other pages fetch fonts (and the
classic Monsoon Navigator page fetches libraries) online, but their game logic works
without a connection.

## Contributing

Each game's logic lives in a single `index.html` — edit that file; no toolchain
required. Use `assets/theme.css` for styling shared across pages instead of duplicating
tokens. The exception is Monsoon Navigator, whose page is generated in the game
repository and replaced whole. See [AGENTS.md](AGENTS.md) for conventions and the
game's own README before changing anything.

## Research and checks

Research evidence and test suites support the standalone games from `research/NN/` and
`tests/NN/`; they are not required to play. See each game's README and each tests
README for what is checked and how to run it.

## License

One file, [LICENSE.md](LICENSE.md), covers the repository: repository material is CC BY-NC-SA 4.0; each game has its own section, and Monsoon Navigator's adds a Commercial Derivative Exception that applies to it alone.
