// Adaptive routes: the best hazard-free plan against the harness.
//
// Implements research/03/pre-registrations/2026-11-23-adaptive-routes.md
// (registered at 4ec44ff; interpretations in its section 9 entry, committed
// before any run). Node >= 22, no dependencies. Run from the repository root:
//
//   node research/03/models/adaptive-routes.mjs
//
// Writes research/03/results/2026-11-23-adaptive-routes/. Every number is a
// property of the game's invented parameters, not a historical finding.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { loadEngine } from "../../../tests/03/engine/load-engine.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));
const P = JSON.parse(readFileSync(at("./economy-skeleton-params.json"), "utf8"));
const FIX = JSON.parse(readFileSync(at("../../../tests/03/fixtures/baseline-transit.json"), "utf8"));
const OUT = at("../results/2026-11-23-adaptive-routes/");
mkdirSync(OUT, { recursive: true });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VESSELS = ["dhow", "junk"];
const DIFFS = ["normal", "hard", "survival"];
const POLICIES = ["sailAlways", "avoidHeadwind", "avoidHeadwindAndTransition"];
const GOODS = Object.keys(P.goods);
const PORTS = Object.keys(P.ports);
const HZ = P.hazards;
const OFF = 0.99;                                     // every draw when hazards are off (section 4.2)
const N_SEEDS = 300, SEED0 = 200001;

// --- transit and prices ----------------------------------------------------------
const TRANSIT = new Map();
for (const r of FIX.rows) TRANSIT.set(`${r.from}|${r.to}|${r.vessel}|${r.navigator}|${MONTHS.indexOf(r.month)}`, [r.months, r.status]);
const transit = (a, b, v, t) => TRANSIT.get(`${a}|${b}|${v}|false|${t % 12}`);
const isHead = s => s.startsWith("Headwind");
const isDead = s => s.startsWith("Dead Zone");
const allowed = (s, pol) => pol === "sailAlways" ? true : isHead(s) ? false : !(pol === "avoidHeadwindAndTransition" && isDead(s));
const ADJ = {};
for (const l of P.lanes) (ADJ[l.from] ||= []).push(l.to);

function price(g, port, t) {                         // getLivePortPrice, same operation order
  const base = P.goods[g].prices[port];
  const seed = port.charCodeAt(0) + g.charCodeAt(0);
  const wave = Math.sin(((t + seed) * Math.PI) / 6);
  return Math.max(10, Math.round(base * (1 + wave * P.priceWave)));
}

// --- the engine's money logic, hazards off (planning accounting) ----------------------
// cut: apply the engine's standing tariff cut (engine-exact); planning ignores it (section 4.1).
class Sim {
  constructor(v, diff, { cut = false, penalty = 0 } = {}) {
    const d = P.difficulties[diff];
    Object.assign(this, {
      v, diff, cut, penalty, cash: d.cash, debt: d.debt, equity: d.cash - d.debt, t: 0, port: P.harness.startPort,
      hull: 100, crew: 100, ended: false, net: null, log: null,
      cargo: Object.fromEntries(GOODS.map(g => [g, 0])), dias: Object.fromEntries(PORTS.map(p => [p, 0]))
    });
    this.dias[this.port] = P.standing.home;
  }
  clone() {
    const s = Object.create(Sim.prototype);
    Object.assign(s, this, { cargo: { ...this.cargo }, dias: { ...this.dias }, log: this.log ? [...this.log] : null });
    return s;
  }
  rec(kind, extra = {}) { if (this.log) this.log.push({ kind, ...extra, cash: this.cash, month: this.t, port: this.port, debt: this.debt, ended: this.ended }); }
  tariff(port) {
    const base = P.ports[port].tariff, st = P.standing;
    return Math.max(st.tariffFloor, base - (this.cut && this.dias[port] >= st.tariffCutAt ? st.tariffCut : 0));
  }
  unit(g) { return Math.round(price(g, this.port, this.t) * (1 + this.tariff(this.port))); }
  fee(port) {
    const sd = this.dias[port];
    let m = 1;
    for (const [lim, f] of P.standing.feeTiers) if (sd >= lim) { m = f; break; }
    return Math.round(P.ports[port].fee * P.difficulties[this.diff].feeMult * m);
  }
  used() { return GOODS.reduce((a, g) => a + this.cargo[g] * P.goods[g].weight, 0); }
  sellAll() {
    for (const g of GOODS) if (this.cargo[g] > 0) { const q = this.cargo[g]; this.cash += q * price(g, this.port, this.t); this.cargo[g] = 0; this.rec("sell", { good: g, qty: q }); }
  }
  repairRule() {                                      // the harness's rule, before every delivery
    const h = P.harness, r = P.repair;
    if (this.hull < h.repairBelowHull && this.cash > h.repairAboveCash && this.hull < 100 && this.cash >= r.cost) {
      this.cash -= r.cost; this.hull = Math.min(100, this.hull + r.hull); this.rec("repair");
    }
  }
  buy(g, q) {
    const u = this.unit(g), w = P.goods[g].weight;
    const a = Math.min(q, Math.floor((P.vessels[this.v].capacity - this.used()) / w), Math.floor(this.cash / u));
    if (a <= 0) return;
    this.cash -= a * u; this.cargo[g] += a; this.rec("buy", { good: g, qty: a });
  }
  wait() {
    this.cash -= this.fee(this.port) + P.vessels[this.v].wages + this.penalty;
    this.penalty = 0;                                 // the planted defect (check 4) hits one wait only
    this.crew = Math.min(100, this.crew + HZ.crewPortPerMonth);
    this.dias[this.port] = Math.min(100, this.dias[this.port] + P.standing.perWait);
    this.advance(1); this.rec("wait");
  }
  sail(dest) {
    const V = P.vessels[this.v], D = P.difficulties[this.diff];
    const [m, s] = transit(this.port, dest, this.v, this.t);
    this.cash -= V.wages * m;
    const head = isHead(s), dead = isDead(s);
    let loss = m * HZ.crewSeaPerMonth;
    if (head) {
      loss += HZ.crewHazard;
      const dmg = Math.round((HZ.headwindDamage[0] + OFF * HZ.headwindDamage[1]) * V.damageMult * D.damageMult);
      this.hull = Math.max(HZ.hullFloor, this.hull - dmg);
    }
    if (this.cargo.porcelain > 0 && this.hull < HZ.porcelainHullBelow && (head || dead)) {
      this.cargo.porcelain -= Math.max(1, Math.floor(this.cargo.porcelain * HZ.porcelainShare));
    }
    this.port = dest;
    this.dias[dest] = Math.min(100, this.dias[dest] + P.standing.perArrival);
    this.crew = Math.max(0, this.crew - loss);
    this.advance(m); this.rec("sail", { dest });
  }
  advance(m) {
    const prev = Math.floor(this.t / P.loan.everyMonths);
    this.t += m;
    if (this.debt > 0 && Math.floor(this.t / P.loan.everyMonths) > prev) this.debt += Math.round(this.debt * P.loan.rate);
    if (this.t >= P.campaignMonths || this.cash < P.endCashBelow) this.finish();
  }
  finish() {
    for (const g of GOODS) if (this.cargo[g] > 0) { this.cash += this.cargo[g] * price(g, this.port, Math.min(23, this.t)); this.cargo[g] = 0; }
    this.cash -= this.debt; this.debt = 0; this.ended = true; this.net = this.cash - this.equity;
  }
}

// --- fill rules (as research/03/models/economy_skeleton.py) ----------------------------
function planBuys(s, finalPort, arrival, fill) {
  const arr = Math.min(23, arrival);
  const K = P.vessels[s.v].capacity - s.used();
  let cash = Math.max(0, s.cash - P.harness.cashReserve);
  const items = GOODS.map(g => { const c = s.unit(g), p = price(g, finalPort, arr); return { g, c, p, m: p - c, w: P.goods[g].weight }; });
  const buys = [];
  if (fill === "greedy") {
    let tons = 0;
    for (const x of items.filter(x => x.p / x.c > 1).sort((a, b) => b.p / b.c - a.p / a.c)) {
      const q = Math.min(Math.floor((K - tons) / x.w), Math.floor(cash / x.c));
      if (q > 0) { buys.push([x.g, q]); cash -= q * x.c; tons += q * x.w; }
    }
    return buys;
  }
  const pos = items.filter(x => x.m > 0);
  let best = {}, val = 0;
  for (const a of pos) { const n = Math.min(cash / a.c, K / a.w); if (n * a.m > val) { best = { [a.g]: n }; val = n * a.m; } }
  for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
    const a = pos[i], b = pos[j], det = a.c * b.w - b.c * a.w;
    if (det === 0) continue;
    const na = (cash * b.w - b.c * K) / det, nb = (a.c * K - cash * a.w) / det;
    if (na >= 0 && nb >= 0 && na * a.m + nb * b.m > val) { best = { [a.g]: na, [b.g]: nb }; val = na * a.m + nb * b.m; }
  }
  let tons = 0;
  const add = (g, q) => { const e = buys.find(b => b[0] === g); if (e) e[1] += q; else buys.push([g, q]); };
  for (const [g, n] of Object.entries(best)) {
    const x = pos.find(i => i.g === g);
    const q = Math.min(Math.floor(n + 1e-9), Math.floor((K - tons) / x.w), Math.floor(cash / x.c));
    if (q > 0) { add(g, q); cash -= q * x.c; tons += q * x.w; }
  }
  for (const x of [...pos].sort((a, b) => b.m / b.w - a.m / a.w)) {
    const q = Math.min(Math.floor((K - tons) / x.w), Math.floor(cash / x.c));
    if (q > 0) { add(x.g, q); cash -= q * x.c; tons += q * x.w; }
  }
  return buys;
}

function projectArrival(path, v, pol, t) {
  let a = path[0];
  for (const b of path.slice(1)) {
    let k = 0;
    while (!allowed(transit(a, b, v, t + k)[1], pol)) if (++k > 12) return null;
    t += k + transit(a, b, v, t + k)[0];
    a = b;
  }
  return t;
}

const PATHS = {};
for (const p of PORTS) {
  const out = [];
  const rec = path => { if (path.length > 1) out.push(path); if (path.length === 4) return; for (const q of ADJ[path.at(-1)]) rec([...path, q]); };
  rec([p]);
  PATHS[p] = out;                                     // 1-3 legs (section 4.1)
}

// One delivery from an empty hold: repair rule, buy, sail (waiting in place where the policy forbids a leg), sell.
function deliver(s, path, pol, fill) {
  s.repairRule();
  const arrival = projectArrival(path, s.v, pol, s.t);
  if (arrival === null) return false;
  for (const [g, q] of planBuys(s, path.at(-1), arrival, fill)) s.buy(g, q);
  for (let i = 1; i < path.length; i++) {
    while (!s.ended && !allowed(transit(s.port, path[i], s.v, s.t)[1], pol)) s.wait();
    if (s.ended) return true;
    s.sail(path[i]);
    if (s.ended) return true;
  }
  s.sellAll();
  return true;
}

// --- the DP (section 4.1) ----------------------------------------------------------
// Most cash per (port, month) with an empty hold; standing, hull and debt are carried, not optimised.
function solve(start, pol, fill, { allowWait = true, monotone = null } = {}) {
  const best = new Map(), key = (p, t) => `${p}|${t}`;
  best.set(key(start.port, start.t), { s: start, prev: null, act: null });
  let term = null;
  const push = (s, prev, act) => {
    if (s.ended) { if (!term || s.net > term.s.net) term = { s, prev, act }; return; }
    const k = key(s.port, s.t), cur = best.get(k);
    if (!cur || s.cash > cur.s.cash) best.set(k, { s, prev, act });
  };
  for (let t = start.t; t < P.campaignMonths; t++) {
    for (const p of PORTS) {
      const node = best.get(key(p, t));
      if (!node) continue;
      if (allowWait) { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); }
      for (const path of PATHS[p]) {
        if (!allowed(transit(path[0], path[1], start.v, t)[1], pol)) continue;   // waiting first is the wait action
        const s = node.s.clone(); s.log = null;
        if (!deliver(s, path, pol, fill)) continue;
        push(s, node, ["deliver", path]);
        if (monotone) monotone(node.s, path, pol, fill);
      }
    }
  }
  const acts = [];
  for (let n = term; n && n.act; n = n.prev) acts.unshift(n.act);
  return { net: term ? term.s.net : null, acts };
}

// Execute a decision list in a logging Sim (planning or engine-exact accounting).
function execute(v, diff, pol, fill, acts, opts = {}) {
  const s = new Sim(v, diff, opts); s.log = [];
  for (const a of acts) {
    if (s.ended) break;
    if (a[0] === "wait") s.wait(); else deliver(s, a[1], pol, fill);
  }
  return s;
}

// --- the harness in planning accounting (check 3) ----------------------------------------
function harnessSim(v, diff, pol) {
  const s = new Sim(v, diff);
  for (let guard = 0; !s.ended && guard < 200; guard++) {
    s.sellAll();
    s.repairRule();
    let plans = P.lanes.filter(l => l.from === s.port).map(l => {
      const [m, st] = transit(l.from, l.to, v, s.t);
      const arr = Math.min(23, s.t + m), tariff = s.tariff(s.port), K = P.vessels[v].capacity;
      const items = GOODS.map(g => { const cost = Math.round(price(g, s.port, s.t) * (1 + tariff)); const sale = price(g, l.to, arr); return { g, cost, sale, ratio: sale / cost }; })
        .filter(x => x.ratio > 1).sort((a, b) => b.ratio - a.ratio);
      let cash = Math.max(0, s.cash - 60), tons = 0, gross = 0; const buys = [];
      for (const x of items) {
        const q = Math.min(Math.floor((K - tons) / P.goods[x.g].weight), Math.floor(cash / x.cost));
        if (q > 0) { buys.push([x.g, q]); cash -= q * x.cost; tons += q * P.goods[x.g].weight; gross += q * (x.sale - x.cost); }
      }
      return { to: l.to, st, m, buys, perMonth: (gross - m * P.vessels[v].wages) / m };
    });
    if (pol !== "sailAlways") plans = plans.filter(x => !isHead(x.st));
    if (pol === "avoidHeadwindAndTransition") plans = plans.filter(x => !isDead(x.st));
    plans.sort((a, b) => b.perMonth - a.perMonth);
    if (!plans.length) { s.wait(); continue; }
    for (const [g, q] of plans[0].buys) s.buy(g, q);
    s.sail(plans[0].to);
  }
  return s;
}

// --- engine runs -----------------------------------------------------------------------
function engine() {
  const e = loadEngine({ harness: true });
  vm.runInContext(`window.renderAll = () => {};`, e.g);          // display only, as economySweep does
  return e;
}
function reset(e, v, diff, seed, hazardsOff) {
  vm.runInContext(`harnessReset(${JSON.stringify(v)}, ${JSON.stringify(diff)}, "calicut", ${seed});` +
    (hazardsOff ? ` Math.random = () => ${OFF};` : ""), e.g);
}
function snapshot(e, v, diff) {
  const st = e.state, s = new Sim(v, diff);
  Object.assign(s, { cash: st.cash, debt: st.debt, equity: st.startEquity, t: st.monthIndex, port: st.currentPort,
    hull: st.hull, crew: st.crewHealth, ended: st.ended, dias: { ...st.diaspora } });
  s.cargo = Object.fromEntries(GOODS.map(g => [g, st.cargo[g]]));
  return s;
}
// Replay a logged action list through the engine; return the engine state after each action.
function replay(e, log) {
  return log.map(a => {
    if (a.kind === "sell") e.g.sellCargoQty(a.good, a.qty);
    else if (a.kind === "buy") e.g.buyCargoQty(a.good, a.qty);
    else if (a.kind === "repair") e.g.repairHull();
    else if (a.kind === "wait") e.g.waitInPort();
    else if (a.kind === "sail") e.g.sailTo(a.dest);
    const s = e.state;
    return { cash: s.cash, month: s.monthIndex, port: s.currentPort, debt: s.debt, ended: s.ended };
  });
}
const netOf = e => e.state.ended ? e.state.cash - e.state.startEquity : null;

// Re-planning with hazards on (section 4.3; decision points as section 9 item 3).
function replanRun(e, v, diff, pol, fill, seed) {
  reset(e, v, diff, seed, false);
  const g = e.g;
  for (let guard = 0; !e.state.ended && guard < 300; guard++) {
    for (const c of GOODS) if (e.state.cargo[c] > 0) g.sellCargoQty(c, 999);
    const s0 = snapshot(e, v, diff);
    const plan = solve(s0, pol, fill);
    const act = plan.acts[0];
    if (!act || act[0] === "wait") { g.waitInPort(); continue; }
    const path = act[1];
    const h = P.harness;
    if (e.state.hull < h.repairBelowHull && e.state.cash > h.repairAboveCash) g.repairHull();
    const s1 = snapshot(e, v, diff);
    const arrival = projectArrival(path, v, pol, s1.t);
    for (const [c, q] of planBuys(s1, path.at(-1), arrival, fill)) g.buyCargoQty(c, q);
    for (let i = 1; i < path.length && !e.state.ended; i++) {
      for (let tries = 0; !e.state.ended && e.state.currentPort !== path[i] && tries < 50; tries++) {
        while (!e.state.ended && !allowed(transit(e.state.currentPort, path[i], v, e.state.monthIndex)[1], pol)) g.waitInPort();
        if (!e.state.ended) g.sailTo(path[i]);    // a turn-back leaves the ship in port; the leg is retried
      }
    }
  }
  return netOf(e);
}

// --- main ----------------------------------------------------------------------------------
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
const results = { cells: [], checks: {}, stochastic: [] };
const monoViol = [];
let monoTested = 0;
const GRID = Array.from({ length: 400 }, (_, i) => Math.round(i * 500000 / 399));
const monoSeen = new Set();
function monotone(node, path, pol, fill) {
  const k = `${node.v}|${node.diff}|${pol}|${fill}|${node.port}|${node.t}|${path.join(">")}`;
  if (monoSeen.has(k)) return;
  monoSeen.add(k);
  let prev = -Infinity;
  for (const c of GRID) {
    const s = node.clone(); s.log = null; s.cash = c;
    deliver(s, path, pol, fill);
    const out = s.ended ? s.net + s.equity : s.cash;           // cash after the delivery (final cash if it ends)
    monoTested++;
    if (out < prev) { monoViol.push({ key: k, cash: c, out, prev }); break; }
    prev = out;
  }
}

const e = engine();
for (const v of VESSELS) for (const diff of DIFFS) for (const pol of POLICIES) {
  const row = { vessel: v, difficulty: diff, policy: pol };
  for (const fill of ["greedy", "opt"]) {
    const sol = solve(new Sim(v, diff), pol, fill, { monotone: fill === "greedy" ? monotone : null });
    const plan = execute(v, diff, pol, fill, sol.acts);            // planning accounting
    const exact = execute(v, diff, pol, fill, sol.acts, { cut: true });
    reset(e, v, diff, 1, true);
    const eng = replay(e, exact.log);
    const mism = exact.log.findIndex((a, i) => a.cash !== eng[i].cash || a.month !== eng[i].month || a.port !== eng[i].port || a.debt !== eng[i].debt || a.ended !== eng[i].ended);
    row[fill] = {
      dpNet: sol.net, planningNet: plan.net, engineExactNet: exact.net, engineNet: netOf(e), engineMatchesExact: mism === -1 && exact.ended,
      firstMismatch: mism, decisions: sol.acts.map(a => a[0] === "wait" ? "wait" : a[1].map(x => x.slice(0, 3)).join(">")),
      actionsLog: exact.log
    };
  }
  if (pol === "sailAlways") {
    const sol = solve(new Sim(v, diff), pol, "greedy", { allowWait: false });
    const ex = execute(v, diff, pol, "greedy", sol.acts, { cut: true });
    reset(e, v, diff, 1, true); replay(e, ex.log);
    row.greedyNoWait = { dpNet: sol.net, engineNet: netOf(e) };
  }
  // harness, hazards off: planning accounting (check 3) and the real harness through the engine (scored)
  const hs = harnessSim(v, diff, pol);
  reset(e, v, diff, 1, true);
  vm.runInContext(`harnessPlay(${JSON.stringify(pol)});`, e.g);
  row.harness = { planningNet: hs.net, engineNet: netOf(e) };
  row.check3 = row.greedy.planningNet >= hs.net;
  results.cells.push(row);
}

// Check 4: planted +1 D on the first wait of the first greedy plan that waits.
{
  const c = results.cells.find(r => r.greedy.decisions.includes("wait") || r.greedy.actionsLog.some(a => a.kind === "wait"));
  const { vessel: v, difficulty: diff, policy: pol } = c;
  const sol = solve(new Sim(v, diff, { penalty: 1 }), pol, "greedy");
  const exact = execute(v, diff, pol, "greedy", sol.acts, { cut: true, penalty: 1 });
  reset(e, v, diff, 1, true);
  const eng = replay(e, exact.log);
  const flagged = exact.log.some((a, i) => a.cash !== eng[i].cash);
  const hs = harnessSim(v, diff, pol);
  results.checks.check4 = { cell: { v, diff, pol }, check3StillPasses: sol.net >= hs.net, replayFlagsMismatch: flagged, pass: (sol.net >= hs.net) && flagged };
}
results.checks.check1 = { pass: results.cells.every(r => r.greedy.engineMatchesExact && r.opt.engineMatchesExact),
  planningMinusEngine: results.cells.map(r => [r.vessel, r.difficulty, r.policy, r.greedy.planningNet - r.greedy.engineNet]) };
results.checks.check2 = { pass: monoViol.length === 0, deliveriesTested: monoSeen.size, evaluations: monoTested, violations: monoViol.length, examples: monoViol.slice(0, 20) };
results.checks.check3 = { pass: results.cells.every(r => r.check3), failed: results.cells.filter(r => !r.check3).map(r => [r.vessel, r.difficulty, r.policy, r.greedy.planningNet, r.harness.planningNet]) };
writeFileSync(OUT + "hazards-off.json", JSON.stringify(results, null, 1) + "\n");
console.log("checks", JSON.stringify(Object.fromEntries(Object.entries(results.checks).map(([k, x]) => [k, x.pass]))));

// --- hazards on (section 4.3) -----------------------------------------------------------------
const stoch = [];
for (const v of VESSELS) for (const diff of DIFFS) for (const pol of POLICIES) {
  const dp = [], hn = [];
  for (let i = 0; i < N_SEEDS; i++) {
    const seed = SEED0 + i;
    dp.push(replanRun(e, v, diff, pol, "greedy", seed));
    reset(e, v, diff, seed, false);
    vm.runInContext(`harnessPlay(${JSON.stringify(pol)});`, e.g);
    hn.push(netOf(e));
  }
  stoch.push({ vessel: v, difficulty: diff, policy: pol, replan: dp, harness: hn });
  console.log("hazards on", v, diff, pol, quant(dp, 0.5), quant(hn, 0.5));
}
writeFileSync(OUT + "hazards-on.json", JSON.stringify({ seeds: `${SEED0}-${SEED0 + N_SEEDS - 1}`, cells: stoch }) + "\n");

// --- scoring ------------------------------------------------------------------------------------
const cell = (v, d, p) => results.cells.find(r => r.vessel === v && r.difficulty === d && r.policy === p);
const scell = (v, d, p) => stoch.find(r => r.vessel === v && r.difficulty === d && r.policy === p);
const S = {};
{
  const f = [];
  for (const d of DIFFS) for (const p of POLICIES) { const j = cell("junk", d, p).greedy.engineNet, h = cell("dhow", d, p).greedy.engineNet; if (!(j > h)) f.push([d, p, j, h]); }
  S.A1 = { score: f.length ? "contradicted" : "supported", failed: f };
}
{
  const f = [];
  for (const d of DIFFS) { const j = cell("junk", d, "avoidHeadwind").harness.engineNet, h = cell("dhow", d, "avoidHeadwind").harness.engineNet; if (!(h > j)) f.push([d, j, h]); }
  S.A2 = { score: f.length ? "contradicted" : "supported", failed: f };
}
{
  const f = [], ratios = [];
  for (const d of DIFFS) {
    const rj = cell("junk", d, "avoidHeadwind").greedy.engineNet / cell("junk", d, "avoidHeadwind").harness.engineNet;
    const rd = cell("dhow", d, "avoidHeadwind").greedy.engineNet / cell("dhow", d, "avoidHeadwind").harness.engineNet;
    ratios.push([d, rj, rd]);
    if (!(rj >= 1.5 && rd <= 1.25)) f.push([d, rj, rd]);
  }
  S.A3 = { score: f.length ? "contradicted" : "supported", failed: f, ratios };
}
{
  const f = [], r = [];
  for (const v of VESSELS) for (const d of DIFFS) {
    const x = cell(v, d, "avoidHeadwind").greedy.engineNet / cell(v, d, "sailAlways").greedy.engineNet;
    r.push([v, d, x]); if (!(x >= 0.9)) f.push([v, d, x]);
  }
  S.A4 = { score: f.length ? "contradicted" : "supported", failed: f, ratios: r };
}
{
  const f = [], r = [];
  for (const c of stoch) { const a = quant(c.replan, 0.5), b = quant(c.harness, 0.5); r.push([c.vessel, c.difficulty, c.policy, a, b]); if (!(a > b)) f.push([c.vessel, c.difficulty, c.policy, a, b]); }
  S.B1 = { score: f.length ? "contradicted" : "supported", failed: f, medians: r };
}
{
  const f = [], r = [];
  for (const d of DIFFS) for (const p of POLICIES) {
    const j = scell("junk", d, p).replan, h = scell("dhow", d, p).replan;
    const wins = j.filter((x, i) => x > h[i]).length;
    r.push([d, p, wins]); if (wins < 270) f.push([d, p, wins]);
  }
  S.B2 = { score: f.length ? "contradicted" : "supported", failed: f, junkWins: r };
}
{
  const f = [], r = [];
  for (const v of VESSELS) for (const d of DIFFS) {
    const x = quant(scell(v, d, "avoidHeadwind").replan, 0.5) / quant(scell(v, d, "sailAlways").replan, 0.5);
    r.push([v, d, x]); if (Math.abs(x - 1) > 0.1) f.push([v, d, x]);
  }
  S.B3 = { score: f.length ? "contradicted" : "supported", failed: f, ratios: r };
}
const summary = {
  stoch: stoch.map(c => ({ vessel: c.vessel, difficulty: c.difficulty, policy: c.policy,
    replan: { min: Math.min(...c.replan), p10: quant(c.replan, 0.1), median: quant(c.replan, 0.5), p90: quant(c.replan, 0.9) },
    harness: { min: Math.min(...c.harness), p10: quant(c.harness, 0.1), median: quant(c.harness, 0.5), p90: quant(c.harness, 0.9) } }))
};
writeFileSync(OUT + "predictions.json", JSON.stringify({ checks: Object.fromEntries(Object.entries(results.checks).map(([k, x]) => [k, x.pass])), scores: S, ...summary }, null, 1) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(S).map(([k, x]) => [k, x.score]))));
