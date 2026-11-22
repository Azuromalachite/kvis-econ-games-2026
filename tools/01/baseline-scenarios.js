// Week 1 behaviour check: scripted, seeded playthroughs of projects/01/index.html.
//
// Run in a browser on a freshly loaded copy of the page (any static server), e.g. in
// the devtools console:
//
//   (0, eval)(await (await fetch('/tools/01/baseline-scenarios.js')).text());
//   await week1Scenario('A');   // full result; reload the page before each scenario
//   await week1Digest('A');     // final cash, ROI, counts and a SHA-256 of the result
//
// Each scenario replaces Math.random with a seeded mulberry32 generator, stubs
// alert(), and plays a fixed sequence of moves through the game's own functions.
// The moves are chosen so that they never trigger the defects fixed in PR #14
// (no local currency is carried between cities, the difficulty is set before launch,
// the report is opened once and never closed, the caravan never runs dry). The fixed
// page must therefore give the same final cash, ROI and log lines as the recovered
// original. Log lines are compared without their wall-clock timestamps.
//
// Only processLegEvents() draws random numbers (one per leg), so every scenario sees
// the same draw on the same leg before and after the change.
(function () {
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const $ = id => document.getElementById(id);
  const exchangeBuy = f => { $('exchange-buy-amount').value = String(f); executeCurrencyExchange('buy'); };
  const convertAll = () => {
    if (state.localCurrency > 0) { $('exchange-sell-amount').value = String(state.localCurrency); executeCurrencyExchange('sell'); }
  };
  const buy = (k, n) => { for (let i = 0; i < n; i++) tradeGoods(k, 'buy'); };
  const sellAll = k => { while (state.inventory[k] > 0) tradeGoods(k, 'sell'); };
  const water = times => { for (let i = 0; i < times; i++) refillWater(5); };
  const go = () => { convertAll(); advanceLeg(); };

  const SCENARIOS = {
    // Normal, one guard: cheap silk to Rome, raids possible.
    A: { seed: 1, mode: 'normal', play() {
      exchangeBuy(43); buy('silk', 40); water(4);
      for (let i = 0; i < 6; i++) go();
    } },
    // Hard: a guide, jade and silk out of Chang'an, re-bought as silk in Kashgar.
    B: { seed: 7, mode: 'hard', play() {
      adjustRoster('guides', 1); water(2); exchangeBuy(100); buy('jade', 11); buy('silk', 7);
      go(); sellAll('silk'); sellAll('jade'); buy('silk', 29);
      for (let i = 0; i < 5; i++) go();
    } },
    // Survival: two guides, a small silk load, raids at doubled risk.
    C: { seed: 3, mode: 'survival', play() {
      adjustRoster('guides', 1); adjustRoster('guides', 1); exchangeBuy(10); buy('silk', 9);
      for (let i = 0; i < 6; i++) go();
    } },
    // Easy, two guards: jade to Samarkand, silk on to Rome.
    D: { seed: 11, mode: 'easy', play() {
      adjustRoster('guards', 1); water(4); exchangeBuy(2000); buy('jade', 40);
      go(); go(); go(); sellAll('jade'); buy('silk', 40);
      for (let i = 0; i < 3; i++) go();
    } },
  };

  window.week1Scenario = async function (name) {
    const s = SCENARIOS[name];
    const alerts = [];
    window.alert = m => alerts.push(String(m));
    Math.random = mulberry32(s.seed);
    $('setup-difficulty').value = s.mode;
    $('setup-difficulty').dispatchEvent(new Event('change'));
    startGameExpedition();
    s.play();
    return {
      scenario: name,
      finalGold: state.gold,
      roi: $('pdf-roi-text').textContent,
      initial: $('pdf-initial-gold').textContent,
      logs: state.logs.map(l => l.replace(/^\[[^\]]*\] /, '')),
      alerts,
    };
  };

  // Compact form for comparing runs: the numbers plus a SHA-256 of the whole result.
  window.week1Digest = async function (name) {
    const r = await window.week1Scenario(name);
    const bytes = new TextEncoder().encode(JSON.stringify(r));
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(b => b.toString(16).padStart(2, '0')).join('');
    return { scenario: name, finalGold: r.finalGold, roi: r.roi, logLines: r.logs.length,
      alerts: r.alerts.length, sha256: hash };
  };
})();
