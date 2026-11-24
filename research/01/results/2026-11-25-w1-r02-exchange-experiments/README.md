# W1-R02 — Exchange-rate and arbitrage experiments

- **Status:** **Exploratory, hypothetical research code** — all alternative exchange rates, spreads, margin factors, and shocks are synthetic test parameters, **not** historical rates.
- **Reproduce:**
  ```bash
  node research/01/results/2026-11-25-w1-r02-exchange-experiments/w1_r02_experiments.mjs
  ```

## Summary of findings

1. **Shared-currency cross-border spread (`Kashgar ↔ Samarkand`, Sogdian Silver Dirhams):**
   - Pure FX arbitrage (`buy Dirhams in Kashgar → carry → sell in Samarkand`) becomes profitable only when `r_Kashgar / r_Samarkand > 1 / 0.95²` (`r_Samarkand < 1.805`, e.g. `+12.81%` at `1.6`, `+0.28%` at `1.8`).
   - Carrying Dirhams to **buy goods** in Samarkand already saves money whenever `r_Samarkand < 2.0` (e.g. `115.79 F` vs `121.88 F` for `220` Dirhams of silk at `r_Samarkand = 1.9`).
2. **City-specific bid–ask spreads (`2%` hubs vs. `10%` frontier oases):**
   - Round-trip loss is `3.96%` at major hubs (`Chang'an`, `Samarkand`, `Antioch`) vs. `19.00%` at frontier oases (`Dunhuang`, `Kashgar`, `Merv`), shifting conversion timing to low-spread hubs.
3. **Commodity margin compression (`800 F` investable):**
   - Between `1.10×` and `1.50×` total route appreciation, holding cargo with a single entry conversion profits (`836 F`–`1,140 F` vs. `800 F` idle), whereas churning currency across `4` borders **loses money** (`554.62 F`–`756.30 F`).
   - At `25×` (current Jade), even `4`-border churn still returns `12,604.99 F`, hiding the conversion lesson.
4. **Exchange-rate uncertainty (`1,000` seeded trials, `±25%` shock around `r = 2.0`):**
   - Carrying `950` Dirhams (`500 F` initial) into Samarkand yields mean `458.60 F`, median `447.27 F`, 10th–90th percentile `376.13 F`–`564.49 F`, beating `500 F` idle in only `28.7%` of trials due to the `9.75%` two-way fee.
