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
.nojekyll             Disables Jekyll so GitHub Pages serves files as-is
```

## Playing

Open `index.html` in any browser, or navigate directly to a game at
`projects/02/` or `projects/03/`. Each game is one self-contained file:
save it anywhere and it still works (fonts/CDN assets need internet, game
logic does not).

## Contributing

Each game lives in a single `index.html` — edit that file, no toolchain
required. See [AGENTS.md](AGENTS.md) for conventions.

## License

One file, [LICENSE.md](LICENSE.md), covers the repository: repository material is CC BY-NC-SA 4.0; each game has its own section, and Monsoon Navigator's adds a Commercial Derivative Exception that applies to it alone.
