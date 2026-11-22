# KVIS Econ Games 2026

Playful economics: single-file HTML games built for the classroom. Every game runs entirely in the browser — no installs, no accounts, no build step.

Live site: https://azuromalachite.github.io/kvis-econ-games-2026/

## Structure

```
index.html            Landing page linking to all games
projects/
  01/index.html       Silk Road Merchant — the recovered Week 1 caravan game;
                      exchange currencies, trade cargo, manage water and guards.
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
`projects/01/`, `projects/02/` or `projects/03/`. Each game is one self-contained file:
save it anywhere and it still works (fonts/CDN assets need internet, game
logic does not).

## Week 1 import

[Silk Road Merchant](https://sites.google.com/view/silkroadmerchant/full-page-embed)
was recovered from the Google Sites embed’s `data-code` attribute on 22 November
2026. The decoded UTF-8 source (no trailing newline) has SHA-256
`05cda7c43f644b9a4641b1208f72b84b58811c830c6be4b89e744f72e2ba152d`.
The import adds only a source/licence-status footer and a final newline; its
inline simulation script is unchanged (SHA-256
`8aa8337731af480af1ff7125a250eafa0602eb48320b5dc3c7e7630ab9d096d4`).
Google’s embedding wrapper is not included. The original Tailwind, jsPDF 2.5.1
and html2canvas 1.4.1 CDN dependencies remain; this is not an offline release.
Research notes and a Week 1 regression suite are deferred. Historical and economic
claims in this snapshot have not been validated by this migration. Authorship and
licensing are unresolved: see [the Week 1 licence status](LICENSE.md#silk-road-merchant-projects01).

## Contributing

Each game lives in a single `index.html` — edit that file, no toolchain
required. See [AGENTS.md](AGENTS.md) for conventions.

## License

One file, [LICENSE.md](LICENSE.md), covers the repository: repository material is CC BY-NC-SA 4.0; each game has its own section, and Monsoon Navigator's adds a Commercial Derivative Exception that applies to it alone.
