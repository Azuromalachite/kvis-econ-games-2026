# Research for Silk Road Expedition Simulator (`projects/01`)

Exploratory audits and reproducible experiments for Week 1 (*Silk Road Expedition Simulator (Han–Roman Era)*, baseline `main` `a43a247`). None of these records modify [`projects/01/index.html`](../../projects/01/index.html) or its pinned [`tests/01/`](../../tests/01/) scenarios.

## Overarching teaching question

> *How do merchants preserve, exchange and transfer value when different communities use different forms of money?*

## Studies in this folder

| ID | Status | Focus | Location |
| --- | --- | --- | --- |
| **W1-R01** | Exploratory; engine probes reproduced on `main` (`a43a247`) | Currency transitions, `5%` fee, fee-free Rome settlement, and sensitivity of optimal cargo strategies to fees/rates | [`results/2026-11-25-w1-r01-currency-audit/`](results/2026-11-25-w1-r01-currency-audit/README.md) |
| **W1-R02** | Exploratory; hypothetical research-only parameters | Shared-currency spreads (`Kashgar ↔ Samarkand`), city-specific bid–ask spreads, commodity-margin compression, and rate uncertainty | [`results/2026-11-25-w1-r02-exchange-experiments/`](results/2026-11-25-w1-r02-exchange-experiments/README.md) |
| **W1-H01** | Exploratory literature audit (`search-summary read`; primary corpora uninspected) | Historical c. 100 CE coinage and money-changing evidence across Han China, Tarim/Sogdiana, Parthia, and Rome | [`literature/2026-11-25-w1-h01-monetary-evidence.md`](literature/2026-11-25-w1-h01-monetary-evidence.md) |

## Core takeaway

Week 1 currently teaches **currency conversion as a transaction cost on commodity arbitrage**, rather than currency trading in its own right: `40 Jade` appreciates `25×` (`76,463 F` in Normal mode, `7,546%` ROI) and dominates across `0%–60%` fees, while ordinary round trips lose `9.75%` (`1 − 0.95²`). Before changing any game rule or rate, the author should decide the primary teaching objective and pair any future rule change with a preregistered experiment.
