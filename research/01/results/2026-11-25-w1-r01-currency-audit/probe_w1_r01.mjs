import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const htmlPath = fileURLToPath(new URL('../../../../projects/01/index.html', import.meta.url));
const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

function fakeElement() {
  const classes = new Set();
  return {
    value: '', textContent: '', innerHTML: '', disabled: false, style: {}, scrollTop: 0, scrollHeight: 0,
    get className() { return [...classes].join(' '); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    classList: { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)), contains: c => classes.has(c) },
    appendChild() {}, setAttribute() {}, focus() {}, click() {}, dispatchEvent() {}, addEventListener() {},
  };
}
const INITIAL = { 'setup-difficulty': 'normal', 'setup-capital': '1000', 'setup-target-roi': '3000' };

function loadGame(mode = 'normal') {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        const el = fakeElement();
        el.value = INITIAL[id] ?? '';
        elements.set(id, el);
      }
      return elements.get(id);
    },
    createElement: fakeElement,
    createElementNS: () => fakeElement(),
  };
  const alerts = [];
  const window = { alert: m => alerts.push(String(m)), print() {} };
  const ctx = vm.createContext({ document, window, alert: window.alert, console });
  vm.runInContext('Math.random = () => 0.5;', ctx);
  for (const s of scripts) vm.runInContext(s, ctx);
  window.onload();
  document.getElementById('setup-difficulty').value = mode;
  vm.runInContext('onDifficultyChange(); startGameExpedition();', ctx);
  const run = code => vm.runInContext(code, ctx);
  const $ = id => document.getElementById(id);
  return { run, $, alerts };
}

const results = {};

// 1. Buy 100 F -> Chang'an Wen (rate 10, 5% fee) & round trip
{
  const g = loadGame('normal');
  g.$('exchange-buy-amount').value = '100';
  g.run("executeCurrencyExchange('buy')");
  results.buy100F_changan = {
    gold: g.run('state.gold'),
    local: g.run('state.localCurrency'),
  };
  g.$('exchange-sell-amount').value = String(results.buy100F_changan.local);
  g.run("executeCurrencyExchange('sell')");
  results.roundTrip_changan = {
    gold: g.run('state.gold'),
    local: g.run('state.localCurrency'),
    lossPct: Number(((1000 - g.run('state.gold')) / 100 * 100).toFixed(4)),
  };
}

// 2. Carry 100 F pre-fee local across every leg
const legNames = [
  "Chang'an->Dunhuang",
  'Dunhuang->Kashgar',
  'Kashgar->Samarkand',
  'Samarkand->Merv',
  'Merv->Antioch',
  'Antioch->Rome',
];
results.transitions = [];
for (let targetLeg = 0; targetLeg < 6; targetLeg++) {
  const g = loadGame('normal');
  for (let i = 0; i < targetLeg; i++) {
    g.run('state.water = 20; advanceLeg();');
  }
  const depRate = g.run('ROUTE_NODES[state.currentLeg].rateToFlorin');
  g.run(`state.gold = 0; state.localCurrency = ${100 * depRate}; state.water = 20; advanceLeg();`);
  results.transitions.push({
    leg: legNames[targetLeg],
    arrivedCity: g.run('ROUTE_NODES[state.currentLeg].short'),
    goldAfter: g.run('state.gold'),
    localAfter: g.run('state.localCurrency'),
    ended: g.run('state.isFinished'),
    finalGoldText: g.$('pdf-final-gold').textContent,
  });
}

// 3. Rome settlement: 123.45 Denarii + 1 Jade + 0 F
{
  const g = loadGame('normal');
  g.run('state.currentLeg = 5; state.gold = 0; state.localCurrency = 123.45; state.inventory.jade = 1; state.water = 20; advanceLeg();');
  results.romeSettlement_123_45_jade1 = {
    gold: g.run('state.gold'),
    ended: g.run('state.isFinished'),
    finalGoldText: g.$('pdf-final-gold').textContent,
  };
}

// 4. Antioch 100 Denarii: keep vs voluntarily convert before Rome
{
  const gKeep = loadGame('normal');
  gKeep.run('state.currentLeg = 5; state.gold = 0; state.localCurrency = 100; state.water = 20; advanceLeg();');

  const gConv = loadGame('normal');
  gConv.run('state.currentLeg = 5; state.gold = 0; state.localCurrency = 100; state.water = 20;');
  gConv.$('exchange-sell-amount').value = '100';
  gConv.run("executeCurrencyExchange('sell'); advanceLeg();");

  results.antioch100Denarii = {
    keepUntilRome: gKeep.run('state.gold'),
    convertBeforeRome: gConv.run('state.gold'),
  };
}

// 5. Replay representative optimal policies through the unchanged engine
results.replays = {};

// Normal: 40 jade at Chang'an, 4x5 water, hold to Rome
{
  const g = loadGame('normal');
  for (let i = 0; i < 4; i++) g.run('refillWater(5)');
  g.$('exchange-buy-amount').value = String(3200 / (10 * 0.95) + 1e-6);
  g.run("executeCurrencyExchange('buy')");
  for (let i = 0; i < 40; i++) g.run("tradeGoods('jade', 'buy')");
  for (let i = 0; i < 6; i++) g.run('advanceLeg()');
  results.replays.normal_40jade = {
    gold: g.run('state.gold'),
    rounded: Math.round(g.run('state.gold')),
    finalGoldText: g.$('pdf-final-gold').textContent,
  };
}

// Hard: 40 jade + 3x5 water at Chang'an, travel 5 legs to Antioch, sell 1 jade, convert exact gap to 100 F, buy 2x5 water, buy 1 silk, travel to Rome
{
  const g = loadGame('hard');
  g.$('exchange-buy-amount').value = String(3200 / (10 * 0.95) + 1e-6);
  g.run("executeCurrencyExchange('buy')");
  for (let i = 0; i < 40; i++) g.run("tradeGoods('jade', 'buy')");
  for (let i = 0; i < 3; i++) g.run('refillWater(5)');
  for (let i = 0; i < 5; i++) g.run('advanceLeg()');
  g.run("tradeGoods('jade', 'sell')");
  const needF = 100 - g.run('state.gold');
  g.$('exchange-sell-amount').value = String(needF / 0.95 + 1e-6);
  g.run("executeCurrencyExchange('sell')");
  for (let i = 0; i < 2; i++) g.run('refillWater(5)');
  g.run("tradeGoods('silk', 'buy')");
  g.run('advanceLeg()');
  results.replays.hard = {
    gold: g.run('state.gold'),
    rounded: Math.round(g.run('state.gold')),
    finalGoldText: g.$('pdf-final-gold').textContent,
  };
}

// Rate=1 (in-memory perturbation): wait until Dunhuang, buy 40 jade at Dunhuang
{
  const g = loadGame('normal');
  g.run('ROUTE_NODES[0].rateToFlorin = 1');
  for (let i = 0; i < 4; i++) g.run('refillWater(5)');
  g.run('advanceLeg()');
  g.$('exchange-buy-amount').value = String(4800 / (9.5 * 0.95) + 1e-6);
  g.run("executeCurrencyExchange('buy')");
  for (let i = 0; i < 40; i++) g.run("tradeGoods('jade', 'buy')");
  for (let i = 0; i < 5; i++) g.run('advanceLeg()');
  results.replays.rate1_waitDunhuang = {
    gold: g.run('state.gold'),
    rounded: Math.round(g.run('state.gold')),
    finalGoldText: g.$('pdf-final-gold').textContent,
  };
}

// Rate=4 (in-memory perturbation): buy 40 silk at Chang'an, sell at Dunhuang (keep 1,200 Hexi Cash in localCurrency), top up for 40 jade
{
  const g = loadGame('normal');
  g.run('ROUTE_NODES[0].rateToFlorin = 4');
  for (let i = 0; i < 2; i++) g.run('refillWater(5)');
  g.$('exchange-buy-amount').value = String(400 / (4 * 0.95) + 1e-6);
  g.run("executeCurrencyExchange('buy')");
  for (let i = 0; i < 40; i++) g.run("tradeGoods('silk', 'buy')");
  g.run('advanceLeg()');
  for (let i = 0; i < 40; i++) g.run("tradeGoods('silk', 'sell')");
  const localHexi = g.run('state.localCurrency');
  for (let i = 0; i < 2; i++) g.run('refillWater(5)');
  g.$('exchange-buy-amount').value = String((4800 - localHexi) / (9.5 * 0.95) + 1e-6);
  g.run("executeCurrencyExchange('buy')");
  for (let i = 0; i < 40; i++) g.run("tradeGoods('jade', 'buy')");
  for (let i = 0; i < 5; i++) g.run('advanceLeg()');
  results.replays.rate4_silkThenJade = {
    gold: g.run('state.gold'),
    rounded: Math.round(g.run('state.gold')),
    finalGoldText: g.$('pdf-final-gold').textContent,
  };
}

console.log(JSON.stringify(results, null, 2));
