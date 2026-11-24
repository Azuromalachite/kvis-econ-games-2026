# W1-R01 — Currency mechanics and strategy-sensitivity audit

- **Status:** Exploratory, not preregistered; engine probes and representative policy replays independently verified against `main` (`a43a247`, [`../../../projects/01/index.html`](../../../projects/01/index.html)).
- **Reproduce engine probes:**
  ```bash
  node research/01/results/2026-11-25-w1-r01-currency-audit/probe_w1_r01.mjs
  ```

## 1. Engine currency mechanics (verified directly)

For a city quoting `r` local units per accounting Florin at the code's `5%` fee (`f = 0.95`):

| Operation / Transition | Observed Engine Result |
| --- | --- |
| Buy `100 F` into Chang'an Wen (`r = 10`, `5%` fee) | `900 F` remaining, `950 Wen` received |
| Sell `950 Wen` back at Chang'an | `990.25 F` (`0` local), **`9.75%` round-trip loss** |
| Carry `100 F` pre-fee local `Chang'an → Dunhuang` | `95 F` credited, `0` local |
| Carry `100 F` pre-fee local `Dunhuang → Kashgar` | `95 F` credited, `0` local |
| Carry `100 F` pre-fee local `Kashgar → Samarkand` | `0 F`, `200` Dirhams **preserved** (same currency & rate) |
| Carry `100 F` pre-fee local `Samarkand → Merv` | `95 F` credited, `0` local |
| Carry `100 F` pre-fee local `Merv → Antioch` | `95 F` credited, `0` local |
| Carry `100 F` pre-fee local `Antioch → Rome` | **`100 F`** (`isFinished = true`), **no `5%` fee at settlement** |
| Arrive at Rome with `123.45` Denarii + `1` Jade + `0 F` | **`2,023 Florins`** (`Math.round(123.45 + 1900)`) |
| At Antioch with `100` Denarii: keep vs. convert before Rome | **`100 F`** (kept) vs. **`95 F`** (converted voluntarily) |

## 2. Representative optimal policies replayed on `main` (`a43a247`, `Math.random = () => 0.5`)

| Scenario / Policy | Engine Result | Note |
| --- | --- | --- |
| Normal (`1,000 F`, `40` Jade at Chang'an, `4×5` water) | **`76,463 Florins`** | `25×` Jade appreciation dominates `0%–60%` fees |
| Hard (`500 F`, `40` Jade + `3×5` water; at Antioch sell `1` Jade, convert `100 - state.gold` F, buy `2×5` water + `1` Silk) | **`75,609 Florins`** | Water constraint forces late-route liquidation |
| Chang'an `r = 1` (in-memory rate test: wait until Dunhuang to buy `40` Jade) | **`76,268 Florins`** | Rate shifts trading location via Florin-equivalent goods cost |
| Chang'an `r = 4` (in-memory rate test: buy `40` Silk at Chang'an, sell at Dunhuang, keep `1,200` Hexi Cash, top up for `40` Jade) | **`76,296 Florins`** | Keeping Dunhuang proceeds in local currency avoids a double fee |

*Scope note:* An external 19-case `scipy.optimize.milp` sweep reported `76,463 F` (Normal), `77,963 F` (Easy), `75,609 F` (Hard), `67,506 F` (Survival), `76,268 F` (`r=1`), and `76,296 F` (`r=4`), and found `40 Jade` remained optimal across `0%–60%` fees (shifting only at `70%`). `scipy` was not installed in the local Python environment, so the MILP sweep itself was not re-solved locally; the engine probes and representative optimal policies above were directly executed through `projects/01/index.html`.
