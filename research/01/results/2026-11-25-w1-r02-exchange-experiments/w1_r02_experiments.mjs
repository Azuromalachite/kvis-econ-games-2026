import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const htmlPath = fileURLToPath(new URL('../../../../projects/01/index.html', import.meta.url));
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('Inline script not found');

// Extract ROUTE_NODES from the live game script without modifying projects/01/index.html
const ctx = vm.createContext({
  document: { getElementById: () => ({ value: '', textContent: '', innerHTML: '', style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, addEventListener() {} }), createElement: () => ({}), createElementNS: () => ({}) },
  window: { alert() {}, print() {} },
  alert() {},
  console,
});
vm.runInContext(scriptMatch[1], ctx);
const BASE_NODES = JSON.parse(vm.runInContext('JSON.stringify(ROUTE_NODES)', ctx));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const results = {
  meta: {
    status: 'EXPLORATORY_HYPOTHETICAL_RESEARCH_CODE',
    sourceCommit: 'a43a247',
    note: 'All alternative rates, spreads, and shocks are synthetic test parameters, not historical rates.',
  },
};

// 1. Shared-Currency Cross-Border Spread (Kashgar -> Samarkand)
{
  const fee = 0.05;
  const rKashgar = BASE_NODES[2].rateToFlorin; // 2.0
  const samarkandRates = [1.5, 1.6, 1.7, 1.8, 1.805, 1.9, 2.0, 2.2, 2.5];
  const exp1 = samarkandRates.map((rSam) => {
    const dirhamsBought = 100 * rKashgar * (1 - fee);
    const florinsReturned = (dirhamsBought / rSam) * (1 - fee);
    const netReturnPct = Number((florinsReturned - 100).toFixed(2));
    const florinsNeededAtSamarkandFor220Dirhams = 220 / (rSam * (1 - fee));
    const florinsNeededAtKashgarFor220Dirhams = 220 / (rKashgar * (1 - fee));
    return {
      rSamarkand: rSam,
      dirhamsPer100F: Number(dirhamsBought.toFixed(2)),
      roundTripFlorins: Number(florinsReturned.toFixed(2)),
      pureFxProfitPct: netReturnPct,
      profitableFxArbitrage: florinsReturned > 100,
      silkCostViaSamarkandF: Number(florinsNeededAtSamarkandFor220Dirhams.toFixed(2)),
      silkCostViaKashgarCarryF: Number(florinsNeededAtKashgarFor220Dirhams.toFixed(2)),
      cheaperToCarryDirhamsForTrade: florinsNeededAtKashgarFor220Dirhams < florinsNeededAtSamarkandFor220Dirhams,
    };
  });
  results.exp1_sharedCurrencySpread = exp1;
  assert.equal(exp1.find(x => x.rSamarkand === 1.8).profitableFxArbitrage, true);
  assert.equal(exp1.find(x => x.rSamarkand === 1.9).profitableFxArbitrage, false);
  assert.equal(exp1.find(x => x.rSamarkand === 2.0).profitableFxArbitrage, false);
}

// 2. City-Specific Bid-Ask Spreads (Hubs 2% vs Frontier Oases 10%)
{
  const fees = {
    changan: 0.02,
    dunhuang: 0.10,
    kashgar: 0.10,
    samarkand: 0.02,
    merv: 0.10,
    antioch: 0.02,
  };
  const exp2 = BASE_NODES.slice(0, 6).map((n) => {
    const f = fees[n.id];
    const rtRetention = (1 - f) * (1 - f);
    const jadeCostFlorins = n.goods.jade.buy / (n.rateToFlorin * (1 - f));
    return {
      city: n.short,
      hypotheticalFeePct: f * 100,
      roundTripLossPct: Number(((1 - rtRetention) * 100).toFixed(2)),
      jadeCostF: Number(jadeCostFlorins.toFixed(2)),
    };
  });
  const hubRoundTrip = (1 - 0.02) ** 2;
  const oasisRoundTrip = (1 - 0.10) ** 2;
  results.exp2_citySpreads = {
    perCity: exp2,
    hubRoundTripLossPct: Number(((1 - hubRoundTrip) * 100).toFixed(2)),
    oasisRoundTripLossPct: Number(((1 - oasisRoundTrip) * 100).toFixed(2)),
  };
  assert.ok(results.exp2_citySpreads.oasisRoundTripLossPct > results.exp2_citySpreads.hubRoundTripLossPct * 4);
}

// 3. Commodity Margin Compression vs Conversion Friction
{
  const investableF = 800; // 1000 F - 200 F water
  const fee = 0.05;
  const multipliers = [1.05, 1.10, 1.15, 1.25, 1.50, 2.00, 25.0];
  const exp3 = multipliers.map((M) => {
    const holdTerminal = investableF * (1 - fee) * M;
    const churnTerminal = investableF * (1 - fee) * M * Math.pow((1 - fee) ** 2, 4);
    const idleFlorins = investableF;
    return {
      routeAppreciationX: M,
      idleFlorins,
      holdCargoTerminalF: Number(holdTerminal.toFixed(2)),
      churnAt4BordersTerminalF: Number(churnTerminal.toFixed(2)),
      holdBeatsIdle: holdTerminal > idleFlorins,
      churnBeatsIdle: churnTerminal > idleFlorins,
      churnPenaltyF: Number((holdTerminal - churnTerminal).toFixed(2)),
    };
  });
  results.exp3_marginCompression = exp3;
  assert.equal(exp3.find(x => x.routeAppreciationX === 1.05).holdBeatsIdle, false);
  assert.equal(exp3.find(x => x.routeAppreciationX === 1.50).holdBeatsIdle, true);
  assert.equal(exp3.find(x => x.routeAppreciationX === 1.50).churnBeatsIdle, false);
}

// 4. Exchange-Rate Uncertainty (1,000 Monte Carlo Trials)
{
  const rng = mulberry32(42);
  const N = 1000;
  const fee = 0.05;
  const carryReturns = [];
  let beatHoldCount = 0;
  for (let i = 0; i < N; i++) {
    const eps = (rng() * 0.5) - 0.25;
    const rSam = 2.0 * (1 + eps);
    const dirhams = 500 * 2.0 * (1 - fee);
    const florinsBack = (dirhams / rSam) * (1 - fee);
    carryReturns.push(florinsBack);
    if (florinsBack > 500) beatHoldCount++;
  }
  carryReturns.sort((a, b) => a - b);
  const mean = carryReturns.reduce((s, x) => s + x, 0) / N;
  results.exp4_rateUncertainty = {
    trials: N,
    shockRange: '±25% around r=2.0',
    holdFlorinsFixedF: 500,
    carryDirhamsMeanF: Number(mean.toFixed(2)),
    carryDirhamsMinF: Number(carryReturns[0].toFixed(2)),
    carryDirhamsP10F: Number(carryReturns[Math.floor(0.10 * N)].toFixed(2)),
    carryDirhamsP50F: Number(carryReturns[Math.floor(0.50 * N)].toFixed(2)),
    carryDirhamsP90F: Number(carryReturns[Math.floor(0.90 * N)].toFixed(2)),
    carryDirhamsMaxF: Number(carryReturns[N - 1].toFixed(2)),
    probabilityProfitableVsHold: Number((beatHoldCount / N).toFixed(3)),
  };
  assert.ok(results.exp4_rateUncertainty.carryDirhamsMinF < 400);
  assert.ok(results.exp4_rateUncertainty.carryDirhamsMaxF > 550);
}

console.log(JSON.stringify(results, null, 2));
