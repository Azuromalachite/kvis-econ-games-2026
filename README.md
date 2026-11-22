# KVIS Econ Games 2026

Playful economics: single-file HTML games built for the classroom. Every game runs entirely in the browser — no installs, no accounts, no build step.

Live site: https://azuromalachite.github.io/kvis-econ-games-2026/

## Structure

```
index.html            Landing page linking to all games
projects/
  02/index.html       Frost & Silver — steer a mountain community through the
                      Little Ice Age (c. 1500–1600): ration food, chase silver
                      from Potosí, answer the crown. Strategy · climate ·
                      colonial economy.
  03/index.html       Monsoon Navigator — plan an Indian Ocean voyage around
                      the monsoon calendar and run a maritime freight ledger.
                      Presented as "An Atlas of Moving Worlds" (generated
                      file; see AGENTS.md).
  03/classic.html     The previous Monsoon Navigator page, kept for rollback.
guides/
  02/index.html       A guided first playthrough of Frost & Silver.
.nojekyll             Disables Jekyll so GitHub Pages serves files as-is
```

## Playing

Open `index.html` in any browser, or navigate directly to a game at
`projects/02/` or `projects/03/`. Each game is one self-contained file:
save it anywhere and it still works. Monsoon Navigator embeds its fonts and
needs no network to play. The other pages fetch fonts (and the classic
Monsoon Navigator page fetches libraries) online, but their game logic works
without a connection.

## Contributing

Each game lives in a single `index.html` — edit that file, no toolchain
required. The exception is Monsoon Navigator, whose page is generated in the
game repository and replaced whole. See [AGENTS.md](AGENTS.md) for conventions.

## Research and checks

- Frost & Silver: [research and evidence](research/02/README.md), [checks](tests/02/README.md).
- Monsoon Navigator: [literature](research/03/literature/README.md), [checks](tests/03/README.md).

These support the standalone games; they are not required to play. Large research
sweeps run on demand. See each week's instructions for dependencies and coverage.

## License

One file, [LICENSE.md](LICENSE.md), covers the repository: repository material is CC BY-NC-SA 4.0; each game has its own section, and Monsoon Navigator's adds a Commercial Derivative Exception that applies to it alone.
