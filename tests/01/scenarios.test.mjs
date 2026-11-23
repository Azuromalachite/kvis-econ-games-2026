// Seeded scenarios for projects/01/index.html: the game's own inline script, run
// unchanged in Node with a small stand-in for the page.
//
// Run: node --test tests/01/scenarios.test.mjs
// WEEK1_INDEX=<path> checks another copy of the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/01/index.html", import.meta.url));
const index = process.env.WEEK1_INDEX || DEFAULT_INDEX;
const html = readFileSync(index, "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

// --- page stand-in: every element accepts every call the game makes; nothing is rendered.
function fakeElement() {
  const classes = new Set();
  return {
    value: "", textContent: "", innerHTML: "", disabled: false, style: {}, scrollTop: 0, scrollHeight: 0,
    get className() { return [...classes].join(" "); },
    set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
    classList: { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)), contains: c => classes.has(c) },
    appendChild() {}, setAttribute() {}, focus() {}, click() {}, dispatchEvent() {}, addEventListener() {},
  };
}
// Initial values the markup gives these fields.
const INITIAL = { "setup-difficulty": "normal", "setup-capital": "1000", "setup-target-roi": "3000" };

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadGame(rng) {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) { const el = fakeElement(); el.value = INITIAL[id] ?? ""; elements.set(id, el); }
      return elements.get(id);
    },
    createElement: fakeElement, createElementNS: () => fakeElement(),
  };
  const alerts = [];
  const window = { alert: m => alerts.push(String(m)), print() {} };
  const ctx = vm.createContext({ document, window, alert: window.alert, console });
  vm.runInContext(`Math.random = ${rng ? "__rng" : "Math.random"};`, Object.assign(ctx, { __rng: rng }));
  for (const s of scripts) vm.runInContext(s, ctx);
  window.onload();
  const run = code => vm.runInContext(code, ctx);
  const $ = id => document.getElementById(id);
  return { run, $, alerts };
}

// --- the moves. They never carry local currency between cities, change the difficulty
// after launch, reopen the report or run out of water.
function play(game, mode, moves) {
  const { run, $ } = game;
  $("setup-difficulty").value = mode;
  run("onDifficultyChange(); startGameExpedition();");
  const api = {
    exchangeBuy: f => { $("exchange-buy-amount").value = String(f); run("executeCurrencyExchange('buy')"); },
    convertAll: () => {
      const local = run("state.localCurrency");
      if (local > 0) { $("exchange-sell-amount").value = String(local); run("executeCurrencyExchange('sell')"); }
    },
    buy: (k, n) => { for (let i = 0; i < n; i++) run(`tradeGoods('${k}', 'buy')`); },
    sellAll: k => { while (run(`state.inventory.${k}`) > 0) run(`tradeGoods('${k}', 'sell')`); },
    water: n => { for (let i = 0; i < n; i++) run("refillWater(5)"); },
    hire: (type, n) => { for (let i = 0; i < n; i++) run(`adjustRoster('${type}', 1)`); },
    go: () => { api.convertAll(); run("advanceLeg()"); },
  };
  moves(api);
}

const SCENARIOS = {
  A: { seed: 1, mode: "normal", moves: m => { m.exchangeBuy(43); m.buy("silk", 40); m.water(4); for (let i = 0; i < 6; i++) m.go(); } },
  B: { seed: 7, mode: "hard", moves: m => {
    m.hire("guides", 1); m.water(2); m.exchangeBuy(100); m.buy("jade", 11); m.buy("silk", 7);
    m.go(); m.sellAll("silk"); m.sellAll("jade"); m.buy("silk", 29); for (let i = 0; i < 5; i++) m.go();
  } },
  C: { seed: 3, mode: "survival", moves: m => { m.hire("guides", 2); m.exchangeBuy(10); m.buy("silk", 9); for (let i = 0; i < 6; i++) m.go(); } },
  D: { seed: 11, mode: "easy", moves: m => {
    m.hire("guards", 1); m.water(4); m.exchangeBuy(2000); m.buy("jade", 40);
    m.go(); m.go(); m.go(); m.sellAll("jade"); m.buy("silk", 40); for (let i = 0; i < 3; i++) m.go();
  } },
};

// Pinned on the recovered original (with its CDN libraries) and unchanged by every fix
// since. The hash covers final cash, ROI, initial capital, every log line without its
// timestamp, and every alert, in the same form as the browser run recorded in PR #14.
const PINNED = {
  A: { finalGold: 55358, roi: "5436%", logLines: 58, alerts: 1, sha256: "3d774e26925fcb805df1f1925fc3d938d06bd879d7f32afb4825d0d47e2d2ce1" },
  B: { finalGold: 39407, roi: "7781%", logLines: 81, alerts: 2, sha256: "61e9242f3c3731f0f74567f3045bdec02166a276afda25278d22b5281a482d01" },
  C: { finalGold: 7000, roi: "2700%", logLines: 26, alerts: 4, sha256: "94ae2992effc52aefe2431ba4d16df7463c781017c676c9753fcf1a288290d27" },
  D: { finalGold: 61121, roi: "2345%", logLines: 138, alerts: 0, sha256: "453ddc45dd25dbe1396f3590c1d69a7c74a751648b63f54dc79bfa4827311418" },
};

for (const [name, s] of Object.entries(SCENARIOS)) {
  test(`scenario ${name} (${s.mode}, seed ${s.seed}) keeps its pinned result`, () => {
    const game = loadGame(mulberry32(s.seed));
    play(game, s.mode, s.moves);
    const result = {
      scenario: name,
      finalGold: game.run("state.gold"),
      roi: game.$("pdf-roi-text").textContent,
      initial: game.$("pdf-initial-gold").textContent,
      logs: game.run("state.logs").map(l => l.replace(/^\[[^\]]*\] /, "")),
      alerts: game.alerts,
    };
    const sha256 = createHash("sha256").update(JSON.stringify(result)).digest("hex");
    assert.deepEqual(
      { finalGold: result.finalGold, roi: result.roi, logLines: result.logs.length, alerts: result.alerts.length, sha256 },
      PINNED[name]);
  });
}

// --- the fixes made in PR #14, as contracts.
test("local currency is converted on arrival in a city with another currency", () => {
  const game = loadGame(() => 0.5);
  play(game, "normal", m => { m.exchangeBuy(780); m.hire("guides", 1); m.water(1); for (let i = 0; i < 6; i++) game.run("advanceLeg()"); });
  assert.equal(game.run("state.gold"), 754);
  assert.equal(game.$("pdf-roi-text").textContent, "-25%");
  assert.ok(game.run("state.logs").some(l => l.includes("7410.0 Chinese Copper Cash (Wen) is not accepted here; exchanged for 703.9 Florins")));
});

test("currency carried between two cities that share it is not converted", () => {
  // Kashgar and Samarkand both use Sogdian Silver Dirhams at 2 per Florin: no fee is due.
  const game = loadGame(() => 0.5);
  play(game, "normal", m => {
    game.run("advanceLeg(); advanceLeg();");
    m.exchangeBuy(100);
    game.run("advanceLeg()");
  });
  assert.equal(game.run("ROUTE_NODES[state.currentLeg].short"), "Samarkand");
  assert.equal(game.run("state.localCurrency"), 190);
  assert.equal(game.run("state.gold"), 900);
  assert.ok(!game.run("state.logs").some(l => l.includes("Money changer")));
});

test("the difficulty and the ROI baseline are fixed at launch", () => {
  const game = loadGame(() => 0.5);
  play(game, "normal", m => {
    game.$("setup-difficulty").value = "easy";
    game.run("onDifficultyChange()");
    m.water(4); for (let i = 0; i < 6; i++) game.run("advanceLeg()");
  });
  assert.equal(game.$("setup-difficulty").disabled, true);
  assert.equal(game.run("state.mode"), "normal");
  assert.equal(game.$("pdf-initial-gold").textContent, "1,000 Florins");
  assert.equal(game.$("pdf-roi-text").textContent, "-20%");
});

test("after the report, nothing more can be bought, hired or logged", () => {
  const game = loadGame(() => 0.5);
  play(game, "normal", m => { m.water(4); for (let i = 0; i < 6; i++) game.run("advanceLeg()"); });
  const lines = game.run("state.logs.length");
  game.run("closeEndgameModal(); advanceLeg(); closeEndgameModal(); advanceLeg();");
  game.run("state.localCurrency = 5000; tradeGoods('silk', 'buy'); refillWater(5); adjustRoster('guards', 1);");
  const gold = game.run("state.gold");
  game.$("exchange-buy-amount").value = "10";
  game.$("exchange-sell-amount").value = "100";
  game.run("executeCurrencyExchange('buy'); executeCurrencyExchange('sell');");
  assert.equal(game.run("state.logs.length"), lines);
  assert.equal(game.run("state.gold"), gold, "the money changer is closed too");
  assert.equal(game.run("state.inventory.silk"), 0);
  assert.equal(game.$("endgame-modal").classList.contains("hidden"), false, "travel reopens the report");
});

test("a stranded caravan ends with a report; one that can still buy water gets an alert", () => {
  const stranded = loadGame(() => 0.5);
  play(stranded, "normal", m => { m.hire("guards", 10); for (let i = 0; i < 4; i++) stranded.run("advanceLeg()"); });
  assert.equal(stranded.run("state.isFinished"), true);
  assert.equal(stranded.alerts.length, 0);
  assert.match(stranded.$("endgame-title").textContent, /^Stranded at Samarkand/);

  // 30 Florins is still short of the 50 that 5 water rations cost.
  const poor = loadGame(() => 0.5);
  play(poor, "normal", m => { m.hire("guards", 10); for (let i = 0; i < 3; i++) poor.run("advanceLeg()"); poor.run("state.gold = 30; advanceLeg()"); });
  assert.equal(poor.run("state.isFinished"), true, "30 Florins left is stranded");
  assert.equal(poor.alerts.length, 0);

  const short = loadGame(() => 0.5);
  play(short, "normal", () => { for (let i = 0; i < 4; i++) short.run("advanceLeg()"); });
  assert.equal(short.run("state.isFinished"), false);
  assert.deepEqual(short.alerts, ["Insufficient water to cross! Required: 6 Units."]);
});
