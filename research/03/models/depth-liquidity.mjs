// Market depth and liquidity: when does a larger hold pay?
//
// Implements research/03/pre-registrations/2026-11-23-depth-liquidity.md
// (registered by PR #28, merged as 1f08700; deviations and interpretations in its
// section 9, committed with this code before any run). Node >= 22, no dependencies.
// Run from the repository root, one phase at a time:
//
//   node research/03/models/depth-liquidity.mjs checks   # C1, C1b, C3-C8 units and plants
//   node research/03/models/depth-liquidity.mjs timing   # first 64 D-arm solves, timings only
//   node research/03/models/depth-liquidity.mjs darm     # D arm + C2, C3, C9, C10 (+ brute force)
//   node research/03/models/depth-liquidity.mjs larm     # L arm (re-planning, hazards on, keyed)
//   node research/03/models/depth-liquidity.mjs harm     # H arm (harness copy, hazards on, keyed)
//   node research/03/models/depth-liquidity.mjs b1       # B1 (strict deadline, no depth)
//   node research/03/models/depth-liquidity.mjs score    # predictions.json
//
// Environment: DL_OUT (results directory), DL_EXT (directory for large traces,
// outside the repository), DL_FALLBACK=1|2 (solve-time fallbacks, section 7).
// Every depth capacity, recovery rate, impact shape and settlement delay is a
// hypothetical judgement range. Nothing here is historical.

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, appendFileSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { loadEngine, LabelledRandom, ENGINE_SHA256, LINE_OFFSET, sha256, DEFAULT_INDEX } from "./load-engine-research.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));
const OUT = process.env.DL_OUT || at("../results/2026-11-24-depth-liquidity/");
const EXT = process.env.DL_EXT || path.join(os.tmpdir(), "dl-depth-liquidity-ext");
mkdirSync(OUT, { recursive: true }); mkdirSync(EXT, { recursive: true });
const PHASE = process.argv[2] || "checks";
const FALLBACK = Number(process.env.DL_FALLBACK || 0);

// --- progress log with heartbeat ------------------------------------------------------
const T0 = Date.now();
let lastBeat = Date.now();
const stamp = () => `[${new Date().toISOString().slice(11, 19)} +${((Date.now() - T0) / 1000).toFixed(0)}s]`;
function say(...a) { console.log(stamp(), PHASE, ...a); lastBeat = Date.now(); }
function beat(msg) { if (Date.now() - lastBeat >= 30000) say("heartbeat", typeof msg === "function" ? msg() : msg); }

// --- reuse of adaptive-routes.mjs -------------------------------------------------------
// adaptive-routes.mjs runs its whole study when imported, so its definitions (everything
// above its "// --- main" marker) are imported from a generated copy of that text, with
// only its two relative paths made absolute. Nothing in it is edited.
const AR_PATH = at("./adaptive-routes.mjs");
async function importAdaptive() {
  let src = readFileSync(AR_PATH, "utf8");
  const cut = src.indexOf("// --- main ");
  if (cut < 0) throw new Error("adaptive-routes.mjs: main marker not found");
  src = src.slice(0, cut);
  const loaderUrl = pathToFileURL(at("../../../tests/03/engine/load-engine.mjs")).href;
  if (!src.includes(`from "../../../tests/03/engine/load-engine.mjs"`)) throw new Error("adaptive-routes.mjs: loader import changed");
  src = src.replace(`from "../../../tests/03/engine/load-engine.mjs"`, `from ${JSON.stringify(loaderUrl)}`);
  src = src.replaceAll("import.meta.url", JSON.stringify(pathToFileURL(AR_PATH).href));
  src += "\nexport { P, FIX, MONTHS, VESSELS, DIFFS, POLICIES, GOODS, PORTS, HZ, OFF, transit, isHead, isDead, allowed, ADJ, price, Sim, planBuys, projectArrival, PATHS, deliver, solve, execute, snapshot, replay, netOf, replanRun };\n";
  const f = path.join(EXT, `adaptive-core-${sha256(src).slice(0, 12)}.mjs`);
  writeFileSync(f, src);
  return import(pathToFileURL(f).href);
}
const AR = await importAdaptive();
const { P, GOODS, PORTS, transit, isHead, isDead, allowed, price, projectArrival, PATHS } = AR;
const AR_SHA = sha256(readFileSync(AR_PATH));

const PUB = at("../results/2026-11-23-adaptive-routes/");
const PUB_OFF = JSON.parse(readFileSync(PUB + "hazards-off.json", "utf8"));
const PUB_ON = JSON.parse(readFileSync(PUB + "hazards-on.json", "utf8"));
const VESSELS = ["dhow", "junk"];
const W = g => P.goods[g].weight;
const CAP = v => P.vessels[v].capacity;
const WAGES = v => P.vessels[v].wages;
const ETA = 0.5, PHI = 0.25;
const END = P.campaignMonths;            // 24

// --- section 4.6 roles: the frozen table, and the same table generated from the source ----
const ROLE_TABLE = [["story-occurrence", 2172], ["story-pick", 2173], ["headwind-damage", 2216], ["turn-back", 2220],
  ["teak", 2223], ["transition-roll", 2231], ["storm-damage", 2235], ["mildew", 2250], ["piracy", 2263], ["mutiny", 2287]];
function rolesFromSource(source) {
  const lines = source.split("\n"), out = [];
  lines.forEach((l, i) => { for (const _ of l.matchAll(/Math\.random\(\)/g)) out.push(i + 1 + LINE_OFFSET); });
  return out;
}
const LINE_ROLE = new Map(ROLE_TABLE.map(([r, l]) => [l, r]));

// =========================================================================================
// Market depth (section 4.3). One class, used by both the pure model and the engine wrapper.
// cfg: null (no depth) or { type: "good"|"pool", Q, scope: "S1"|"S2", shape: "hard"|"soft", r }
// =========================================================================================
class Market {
  constructor(cfg, plants = {}) {
    this.cfg = cfg; this.plants = plants;
    this.A = {};
    for (const p of PORTS) this.A[p] = cfg && cfg.type === "good" ? Object.fromEntries(GOODS.map(g => [g, 0])) : 0;
  }
  clone() { const m = Object.create(Market.prototype); m.cfg = this.cfg; m.plants = this.plants; m.A = structuredClone(this.A); return m; }
  capped(port) { const c = this.cfg; return !!c && Number.isFinite(c.Q) && (c.scope === "S2" || port === "quanzhou"); }
  w(g) { return this.cfg.type === "good" ? 1 : W(g); }
  x(port, g) { if (!this.capped(port)) return 0; return this.cfg.type === "good" ? this.A[port][g] : this.A[port]; }
  // Absorption of the next lot (section 4.3 table). Returns null when the hard cap refuses it.
  lotPrice(port, g, p, x) {
    if (!this.capped(port)) return p;
    const { Q, shape } = this.cfg, w = this.w(g);
    if (shape === "hard") return (this.plants.ltQ ? x < Q : x + w <= Q) ? p : null;
    return Math.round(p * Math.max(PHI, 1 - ETA * Math.max(0, x + w - Q) / Q));
  }
  add(port, g, n) {
    if (!this.capped(port) || n === 0) return;
    if (this.cfg.type === "good") this.A[port][g] += n; else this.A[port] += n * W(g);
  }
  recover(months) {
    if (!this.cfg || !Number.isFinite(this.cfg.Q)) return;
    const f = 1 - this.cfg.r;
    for (let i = 0; i < months; i++) for (const p of PORTS) {
      if (this.cfg.type === "good") for (const g of GOODS) this.A[p][g] *= f; else this.A[p] *= f;
    }
  }
  // Section 4.3 sale order: descending price per tonne, ties in COMMODITIES order.
  order(prices) {
    const key = this.plants.perLot ? g => prices[g] : g => prices[g] / W(g);
    return [...GOODS].sort((a, b) => key(b) - key(a) || GOODS.indexOf(a) - GOODS.indexOf(b));
  }
  // Sell up to n lots of g at price p: lot by lot, stops at the first lot the hard cap refuses.
  sell(port, g, n, p) {
    let sold = 0, revenue = 0;
    for (; sold < n; sold++) {
      const lp = this.lotPrice(port, g, p, this.x(port, g));
      if (lp === null) break;
      revenue += lp; this.add(port, g, 1);
    }
    return { n: sold, revenue };
  }
  // Offer every lot in sale order; a refused lot does not stop smaller lots of later goods.
  absorb(port, prices, cargo) {
    const out = { value: 0, sold: {}, left: {} };
    for (const g of this.order(prices)) {
      const r = cargo[g] > 0 ? this.sell(port, g, cargo[g], prices[g]) : { n: 0, revenue: 0 };
      out.value += r.revenue; out.sold[g] = r.n; out.left[g] = cargo[g] - r.n;
    }
    return out;
  }
  // Projection for the sale schedule: A at `port` after `ahead` months of recovery, then
  // after j more months for month j; lots already assigned to month j are added to month j.
  projector(port, ahead, m, t0) {
    const self = this, capped = this.capped(port), f = this.cfg ? 1 - this.cfg.r : 1;
    const base = structuredClone(this.A[port]);
    const rec = (a, n) => { for (let i = 0; i < n; i++) { if (typeof a === "number") a *= f; else for (const g of GOODS) a[g] *= f; } return a; };
    const xs = [];
    let cur = capped ? rec(base, ahead) : base;
    for (let j = 0; j <= m; j++) { xs.push(structuredClone(cur)); if (capped) cur = rec(cur, 1); }
    const prices = Array.from({ length: m + 1 }, (_, j) => Object.fromEntries(GOODS.map(g => [g, price(g, port, Math.min(23, t0 + j))])));
    return {
      prices,
      best(g) {
        let bj = null, bp = -Infinity;
        for (let j = 0; j <= m; j++) {
          const x = !capped ? 0 : self.cfg.type === "good" ? xs[j][g] : xs[j];
          const lp = self.lotPrice(port, g, prices[j][g], x);
          if (lp !== null && lp > bp) { bp = lp; bj = j; }
        }
        return bj === null ? null : { j: bj, p: bp };
      },
      add(g, j) { if (!capped) return; if (self.cfg.type === "good") xs[j][g] += 1; else xs[j] += W(g); },
      // Fallback 1: the month in which all n lots of a block are absorbed with the highest block total.
      blockBest(g, n) {
        let bj = null, bp = -Infinity;
        for (let j = 0; j <= m; j++) {
          let x = !capped ? 0 : self.cfg.type === "good" ? xs[j][g] : xs[j], total = 0, ok = true;
          for (let i = 0; i < n; i++) { const lp = self.lotPrice(port, g, prices[j][g], x); if (lp === null) { ok = false; break; } total += lp; if (capped) x += self.w(g); }
          if (ok && total > bp) { bp = total; bj = j; }
        }
        return bj === null ? null : { j: bj, total: bp };
      }
    };
  }
}

// Fallback 1 (section 7): blocks of 10 lots per good, on the plan side and in execution.
const BLOCK = FALLBACK >= 1 ? 10 : 1;

// =========================================================================================
// Cargo ledger (section 4.2), shared by the model and the engine wrapper.
// =========================================================================================
const zero = () => Object.fromEntries(GOODS.map(g => [g, 0]));
function newLedger() {
  return { loaded: zero(), delivered: zero(), sold: zero(), lost: zero(), undelivered: zero(), offered: zero(),
    liq: { E: zero(), S: zero(), S24: zero() }, writtenOff: zero(), unsold: { S: zero(), S24: zero() },
    invMonths: 0, intended: null };
}
const cloneLedger = L => structuredClone(L);
function conservation(L) {
  const bad = [];
  for (const g of GOODS) {
    const E = L.sold[g] + L.liq.E[g] + L.writtenOff[g] + L.lost[g];
    const S = L.sold[g] + L.liq.S[g] + L.unsold.S[g] + L.lost[g];
    const S24 = L.sold[g] + L.liq.S24[g] + L.unsold.S24[g] + L.lost[g];
    if (L.loaded[g] !== E || L.loaded[g] !== S || L.loaded[g] !== S24) bad.push({ g, loaded: L.loaded[g], E, S, S24 });
  }
  return bad;
}

// Nets at the campaign boundary (section 4.1). Plants (C7): sTransit, s24Drop.
function boundaryNets({ t, cashBefore, debtBefore, liqValue, lateCredited, recv, cashAfter, equity }, plants = {}) {
  const outstanding = recv.reduce((a, r) => a + r.amt, 0);
  const due23 = recv.filter(r => r.due <= 23).reduce((a, r) => a + r.amt, 0);
  const E = cashAfter + outstanding - equity;
  const strictBase = cashBefore - lateCredited - debtBefore - equity;
  let S = strictBase + (t < END ? liqValue + due23 : 0);
  let S24 = strictBase + (t < END ? liqValue + due23 : t === END && !plants.s24Drop ? liqValue : 0);
  if (plants.sTransit && t > END) S += liqValue;
  return { E, S, S24 };
}
function ledgerAtEnd(L, t, cargo, liq) {
  for (const g of GOODS) {
    L.liq.E[g] += liq.sold[g]; L.writtenOff[g] += liq.left[g];
    if (t < END) { L.liq.S[g] += liq.sold[g]; L.unsold.S[g] += liq.left[g]; } else L.unsold.S[g] += cargo[g];
    if (t <= END) { L.liq.S24[g] += liq.sold[g]; L.unsold.S24[g] += liq.left[g]; } else L.unsold.S24[g] += cargo[g];
  }
}
const pricesAt = (port, t) => Object.fromEntries(GOODS.map(g => [g, price(g, port, t)]));

// =========================================================================================
// The pure model: adaptive-routes Sim, extended (hazards off).
// =========================================================================================
class Sim2 extends AR.Sim {
  constructor(v, diff, opts = {}) {
    super(v, diff, opts);
    this.mk = new Market(opts.market || null, opts.marketPlants || {});
    this.duePlant = !!opts.duePlant;
    this.k = opts.k || 0; this.recv = []; this.lateCredited = 0; this.L = newLedger();
    this.basis = zero(); this.rule = opts.rule || "G"; this.pol = opts.pol || null; this.nets = null; this.cargoAtEnd = null;
  }
  clone() {
    const s = Object.create(Sim2.prototype);
    Object.assign(s, this, { cargo: { ...this.cargo }, dias: { ...this.dias }, log: this.log ? [...this.log] : null,
      mk: this.mk.clone(), recv: this.recv.map(r => ({ ...r })), L: cloneLedger(this.L), basis: { ...this.basis } });
    return s;
  }
  label() { return this.cash + this.recv.reduce((a, r) => a + r.amt, 0); }
  rec(kind, extra = {}) {
    if (this.log) this.log.push({ kind, ...extra, cash: this.cash, month: this.t, port: this.port, debt: this.debt, ended: this.ended,
      cargo: { ...this.cargo }, A: structuredClone(this.mk.A), recv: this.recv.map(r => ({ ...r })) });
  }
  note(kind, extra = {}) { if (this.log) this.log.push({ kind, ...extra }); }
  buy(g, q) {
    const u = this.unit(g), w = W(g);
    const a = Math.min(q, Math.floor((CAP(this.v) - this.used()) / w), Math.floor(this.cash / u));
    if (a <= 0) return;
    const prev = this.cargo[g] * this.basis[g];
    this.cash -= a * u; this.cargo[g] += a;
    this.basis[g] = Math.round((prev + a * u) / this.cargo[g]);
    this.L.loaded[g] += a; this.L.undelivered[g] += a;
    this.rec("buy", { good: g, qty: a });
  }
  // One sale through the depth layer and the settlement rule.
  sellLots(g, q) {
    const n0 = Math.min(q, this.cargo[g]);
    if (n0 <= 0) return 0;
    const r = this.mk.sell(this.port, g, n0, price(g, this.port, this.t));
    if (r.n <= 0) return 0;
    this.cargo[g] -= r.n; if (this.cargo[g] === 0) this.basis[g] = 0;
    if (this.k > 0) this.recv.push({ due: this.t + this.k + (this.duePlant ? 1 : 0), amt: r.revenue }); else this.cash += r.revenue;   // duePlant: due-month unit test
    this.L.sold[g] += r.n;
    this.rec("sell", { good: g, qty: r.n });
    return r.n;
  }
  markOffered() { for (const g of GOODS) this.L.offered[g] = this.cargo[g]; this.note("offer"); }
  // Depth-naive arrival sale: offer everything in the section 4.3 order; the market takes what it absorbs.
  sellAll() {
    for (const g of this.mk.order(pricesAt(this.port, this.t))) if (this.cargo[g] > 0) this.sellLots(g, this.cargo[g]);
    this.markOffered();
  }
  sail(dest) {
    const before = { ...this.cargo }, from = this.port;
    this.cargoAtEnd = null;
    super.sail(dest);
    const after = this.cargoAtEnd || this.cargo;
    for (const g of GOODS) {
      const lost = before[g] - after[g];
      if (lost > 0) { this.L.lost[g] += lost; this.L.undelivered[g] = Math.max(0, Math.min(this.L.undelivered[g], after[g])); this.L.offered[g] = Math.min(this.L.offered[g], after[g]); }
    }
    if (this.port === dest && dest !== from && dest === this.L.intended)
      for (const g of GOODS) { this.L.delivered[g] += Math.min(this.L.undelivered[g], after[g]); this.L.undelivered[g] = 0; }
  }
  advance(m) {
    const credit = this.recv.filter(r => r.due <= this.t + m);
    for (const r of credit) { this.cash += r.amt; if (this.t + m >= END && r.due > 23) this.lateCredited += r.amt; }
    this.recv = this.recv.filter(r => r.due > this.t + m);
    this.L.invMonths += m * GOODS.reduce((a, g) => a + this.L.offered[g] * this.basis[g], 0);
    this.mk.recover(m);
    super.advance(m);
  }
  finish() {
    const t = this.t, port = this.port, pm = Math.min(23, t);
    const cashBefore = this.cash, debtBefore = this.debt;
    this.cargoAtEnd = { ...this.cargo };
    const prices = pricesAt(port, pm);
    const undep = GOODS.reduce((a, g) => a + this.cargo[g] * prices[g], 0);
    const liq = this.mk.absorb(port, prices, this.cargo);
    ledgerAtEnd(this.L, t, this.cargoAtEnd, liq);
    for (const g of GOODS) this.cargo[g] = 0;
    this.cash += undep;
    this.cash -= this.debt; this.debt = 0; this.ended = true;
    this.cash += liq.value - undep;
    this.nets = boundaryNets({ t, cashBefore, debtBefore, liqValue: liq.value, lateCredited: this.lateCredited, recv: this.recv, cashAfter: this.cash, equity: this.equity });
    this.net = this.nets.E;
  }
}

// =========================================================================================
// Depth-aware planner (section 4.3, M-1)
// =========================================================================================
const RESERVE_G = P.harness.cashReserve;    // 60 D

// Depth-aware fill for one option m: buy in sale order while the lot's projected price under
// this m's schedule exceeds its unit cost. Held lots are scheduled first within their good.
function fillD(s, fin, arrival, m) {
  const t0 = Math.min(23, arrival);
  const proj = s.mk.projector(fin, arrival - s.t, m, arrival);
  let cash = Math.max(0, s.cash - RESERVE_G), K = CAP(s.v) - s.used();
  const buys = [];
  for (const g of s.mk.order(pricesAt(fin, t0))) {
    if (BLOCK === 1) for (let i = 0; i < s.cargo[g]; i++) { const b = proj.best(g); if (b) proj.add(g, b.j); }
    else for (let i = 0; i + BLOCK <= s.cargo[g]; i += BLOCK) { const b = proj.blockBest(g, BLOCK); if (b) for (let k = 0; k < BLOCK; k++) proj.add(g, b.j); }
    const c = s.unit(g), w = W(g);
    let q = 0;
    if (BLOCK === 1) {
      while (K >= w && cash >= c) { const b = proj.best(g); if (!b || !(b.p > c)) break; proj.add(g, b.j); q++; cash -= c; K -= w; }
    } else {
      // Fallback 1: a block is bought only if all its lots are projected above cost in one month
      while (K >= BLOCK * w && cash >= BLOCK * c) {
        const b = proj.blockBest(g, BLOCK); if (!b || !(b.total > BLOCK * c)) break;
        for (let i = 0; i < BLOCK; i++) proj.add(g, b.j);
        q += BLOCK; cash -= BLOCK * c; K -= BLOCK * w;
      }
    }
    if (q > 0) buys.push([g, q]);
  }
  return buys;
}

// Sale schedule at arrival (section 4.3): every lot aboard, in sale order, to the month j <= m with
// the highest projected price; ties to the earlier month; a lot that fits in no month is held.
function schedule(s, m) {
  const proj = s.mk.projector(s.port, 0, m, s.t);
  const out = Array.from({ length: m + 1 }, () => zero());
  for (const g of s.mk.order(pricesAt(s.port, Math.min(23, s.t)))) {
    if (BLOCK === 1) { for (let i = 0; i < s.cargo[g]; i++) { const b = proj.best(g); if (!b) break; proj.add(g, b.j); out[b.j][g]++; } }
    else for (let i = 0; i + BLOCK <= s.cargo[g]; i += BLOCK) { const b = proj.blockBest(g, BLOCK); if (!b) break; for (let k = 0; k < BLOCK; k++) proj.add(g, b.j); out[b.j][g] += BLOCK; }
  }
  return out;
}
function sellMonth(s, assign) {
  for (const g of s.mk.order(pricesAt(s.port, s.t))) {
    if (!(assign[g] > 0)) continue;
    if (BLOCK === 1) { s.sellLots(g, assign[g]); continue; }
    // Fallback 1: a block is sold only if all its lots are absorbed now (checked on a copy of the market),
    // so the engine is asked for exactly the block quantity and sells all of it.
    const trial = s.mk.clone(), p = price(g, s.port, s.t);
    let n = 0;
    while (n + BLOCK <= Math.min(assign[g], s.cargo[g]) && trial.sell(s.port, g, BLOCK, p).n === BLOCK) n += BLOCK;
    if (n > 0) s.sellLots(g, n);
  }
  s.markOffered();
}

// One depth-aware delivery with sell-over-time option m. Returns false if infeasible.
function deliverD(s, path, pol, m) {
  s.repairRule();
  const arrival = projectArrival(path, s.v, pol, s.t);
  if (arrival === null) return false;
  if (m > 0 && arrival + m > END) return false;          // a wait may not take monthIndex past 24
  const fin = path.at(-1);
  for (const [g, q] of fillD(s, fin, arrival, m)) s.buy(g, q);
  s.L.intended = fin; s.note("intend", { port: fin });
  for (let i = 1; i < path.length; i++) {
    while (!s.ended && !allowed(transit(s.port, path[i], s.v, s.t)[1], pol)) s.wait();
    if (s.ended) return true;
    s.sail(path[i]);
    if (s.ended) return true;
  }
  const sch = schedule(s, m);
  sellMonth(s, sch[0]);
  for (let j = 1; j <= m; j++) { s.wait(); if (s.ended) return true; sellMonth(s, sch[j]); }
  return true;
}

const hKey = s => GOODS.map(g => s.cargo[g]).join(",");
// Forward DP over (port, month, H); most cash per node; A carried. One pass gives DP-E, DP-S, DP-S24.
function solveD(start, pol, mMax, { onDelivery = null, mMin = 0 } = {}) {   // mMin > 0 only for C10's planted defect
  const buckets = Array.from({ length: END + 1 }, () => new Map());
  buckets[start.t].set(`${start.port}|${hKey(start)}`, { s: start, prev: null, act: null });
  const term = { E: null, S: null, S24: null };
  let edges = 0;
  const push = (s, prev, act) => {
    if (s.ended) { for (const r of ["E", "S", "S24"]) if (!term[r] || s.nets[r] > term[r].s.nets[r]) term[r] = { s, prev, act }; return; }
    const b = buckets[s.t], k = `${s.port}|${hKey(s)}`, cur = b.get(k);
    if (!cur || s.label() > cur.s.label()) b.set(k, { s, prev, act });
  };
  for (let t = start.t; t < END; t++) {
    for (const node of buckets[t].values()) {
      const p = node.s.port;
      { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); edges++; }
      for (const pth of PATHS[p]) {
        if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue;
        for (let m = mMax > 0 ? mMin : 0; m <= mMax; m++) {
          const s = node.s.clone(); s.log = null;
          if (!deliverD(s, pth, pol, m)) continue;
          edges++;
          push(s, node, ["deliver", pth, m]);
          if (onDelivery) onDelivery(node.s, pth, m);
        }
      }
    }
    beat(() => `solveD ${start.v} t=${t} nodes=${buckets[t].size}`);
  }
  const plans = {};
  for (const r of ["E", "S", "S24"]) {
    const acts = [], nodes = [];
    for (let n = term[r]; n && n.act; n = n.prev) { acts.unshift(n.act); nodes.unshift(n.prev); }
    plans[r] = { net: term[r] ? term[r].s.nets[r] : null, nets: term[r] ? term[r].s.nets : null, acts, nodes };
  }
  return { plans, edges, nodeCount: buckets.reduce((a, b) => a + b.size, 0), buckets };
}

// Execute a decision list in a logging model (engine-exact accounting).
function executeD(v, diff, pol, cfg, acts, { mode = "aware" } = {}) {
  const s = new Sim2(v, diff, { cut: true, market: cfg }); s.log = [];
  for (const a of acts) {
    if (s.ended) break;
    if (a[0] === "wait") { s.wait(); continue; }
    const pth = a[1];
    if (mode === "copy") {
      // copy-other: waits re-inserted where this ship's policy forbids the departure
      while (!s.ended && !allowed(transit(s.port, pth[1], v, s.t)[1], pol)) s.wait();
      if (s.ended) break;
      if (s.port !== pth[0]) break;               // cannot happen: paths start at the current port
      let m = a[2];
      const arr = projectArrival(pth, v, pol, s.t);
      if (arr === null) break;
      if (arr + m > END) m = Math.max(0, END - arr);
      if (arr >= END) m = 0;
      deliverD(s, pth, pol, m);
    } else if (mode === "naive") deliverNaive(s, pth, pol);
    else deliverD(s, pth, pol, a[2]);
  }
  // A plan that has not ended (cannot happen for a DP plan) runs out the clock by waiting.
  while (!s.ended) s.wait();
  return s;
}

// Depth-naive delivery: the published fill (planBuys, greedy), no withholding, sell what is absorbed.
function deliverNaive(s, pth, pol) {
  s.repairRule();
  const arrival = projectArrival(pth, s.v, pol, s.t);
  if (arrival === null) return false;
  for (const [g, q] of AR.planBuys(s, pth.at(-1), arrival, "greedy")) s.buy(g, q);
  s.L.intended = pth.at(-1); s.note("intend", { port: pth.at(-1) });
  for (let i = 1; i < pth.length; i++) {
    while (!s.ended && !allowed(transit(s.port, pth[i], s.v, s.t)[1], pol)) s.wait();
    if (s.ended) return true;
    s.sail(pth[i]);
    if (s.ended) return true;
  }
  s.sellAll();
  return true;
}

// The published decisions for a cell (the published planner, re-run; C1 checks they match).
const pubCell = (v, d, p) => PUB_OFF.cells.find(c => c.vessel === v && c.difficulty === d && c.policy === p);
const pubActsCache = new Map();
function publishedActs(v, diff, pol) {
  const k = `${v}|${diff}|${pol}`;
  if (!pubActsCache.has(k)) {
    const sol = AR.solve(new AR.Sim(v, diff), pol, "greedy");
    const dec = sol.acts.map(a => a[0] === "wait" ? "wait" : a[1].map(x => x.slice(0, 3)).join(">"));
    pubActsCache.set(k, { acts: sol.acts, decisionsMatch: JSON.stringify(dec) === JSON.stringify(pubCell(v, diff, pol).greedy.decisions) });
  }
  return pubActsCache.get(k);
}

// =========================================================================================
// Engine with research wrappers (sellCargoQty, buyCargoQty, advanceTime, finishCampaign over
// the Atlas wrapper, sailTo/waitInPort hooks for keyed draws, renderAll as a no-op).
// =========================================================================================
const fnv1a = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const mulberry32First = seed => { let a = seed | 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// Independent implementation for C4 (ii): written separately, byte arithmetic on UTF-8.
function rebuildU(key) {
  let h = 2166136261;
  for (const b of Buffer.from(key, "utf8")) { h = (h ^ b) >>> 0; h = Number((BigInt(h) * 16777619n) % 4294967296n); }
  let a = (h + 1831565813) % 4294967296;
  const imul = (x, y) => Number((BigInt.asIntN(32, BigInt(x)) * BigInt.asIntN(32, BigInt(y))) & 0xffffffffn);
  const s32 = x => (x | 0);
  let t = imul(s32(a) ^ (a >>> 15), 1 | s32(a));
  t = s32(s32(t + imul(s32(t) ^ (t >>> 7), 61 | s32(t))) ^ s32(t));
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const KEY_RE = /^\d+\|(story-occurrence|story-pick|headwind-damage|turn-back|teak|transition-roll|storm-damage|mildew|piracy|mutiny)\|\d+\|(kilwa|aden|calicut|malacca|quanzhou)(>(kilwa|aden|calicut|malacca|quanzhou))?$/;

function makeEngine() {
  const rng = new LabelledRandom();
  const e = loadEngine({ harness: true, rng });
  if (sha256(e.source) !== ENGINE_SHA256) throw new Error("engine hash");
  if (JSON.stringify(e.COMMODITIES.map(c => c.id)) !== JSON.stringify(GOODS)) throw new Error("COMMODITIES order differs from params");
  const dl = {
    market: new Market(null), k: 0, recv: [], lateCredited: 0, L: newLedger(), plants: {}, firstSale: true,
    keyed: null, seed: 0, override: null, checks: { draws: 0, actions: 0, failures: [] }, end: null, cargoAtEnd: null,
    reset(cfg = {}) {
      this.market = new Market(cfg.market || null, cfg.marketPlants || {}); this.k = cfg.k || 0; this.recv = []; this.lateCredited = 0;
      this.L = newLedger(); this.plants = cfg.plants || {}; this.firstSale = true; this.keyed = cfg.keyed || null; this.seed = cfg.seed || 0;
      this.override = cfg.override || null; this.end = null; this.cargoAtEnd = null;
    },
    sell(orig, id, qty) {
      const st = e.state, held = st.cargo[id];
      if (held <= 0) return;
      const n0 = Math.min(qty, held);
      const item = e.COMMODITIES.find(c => c.id === id);
      const p = e.g.getLivePortPrice(item, st.currentPort, st.monthIndex);
      const r = this.market.sell(st.currentPort, id, n0, p);
      if (r.n <= 0) return;
      if (this.plants.minus1 && this.firstSale) r.revenue -= 1;     // C1b planted defect
      this.firstSale = false;
      orig(id, r.n);
      st.cash += r.revenue - r.n * p;
      const due = st.monthIndex + this.k + (this.plants.lateCredit ? 1 : 0) + (this.k > 0 && this.plants.duePlant ? 1 : 0);   // C1 plant; due-month plant
      if (due > st.monthIndex) { st.cash -= r.revenue; this.recv.push({ due, amt: r.revenue }); }
      this.L.sold[id] += r.n;
    },
    buy(orig, id, qty) {
      const before = e.state.cargo[id];
      orig(id, qty);
      const a = e.state.cargo[id] - before;
      if (a > 0) { this.L.loaded[id] += a; this.L.undelivered[id] += a; }
    },
    advance(orig, m) {
      const st = e.state;
      const credit = this.recv.filter(r => this.plants.lateCredit2 ? r.due < st.monthIndex + m : r.due <= st.monthIndex + m);   // M1 plant
      for (const r of credit) { st.cash += r.amt; if (st.monthIndex + m >= END && r.due > 23) this.lateCredited += r.amt; }
      this.recv = this.recv.filter(r => !credit.includes(r));
      this.L.invMonths += m * GOODS.reduce((a, g) => a + this.L.offered[g] * st.costBasis[g], 0);
      this.market.recover(this.plants.recoverOnce ? Math.min(1, m) : m);   // C2 planted defect: once per action
      orig(m);
    },
    finish(orig) {
      const st = e.state, t = st.monthIndex, port = st.currentPort, pm = Math.min(23, t);
      const cashBefore = st.cash, debtBefore = st.debt;
      this.cargoAtEnd = { ...st.cargo };
      const prices = Object.fromEntries(e.COMMODITIES.map(c => [c.id, e.g.getLivePortPrice(c, port, pm)]));
      const undep = GOODS.reduce((a, g) => a + st.cargo[g] * prices[g], 0);
      const liq = this.market.absorb(port, prices, st.cargo);
      ledgerAtEnd(this.L, t, this.cargoAtEnd, liq);
      orig();
      st.cash += liq.value - undep;
      this.end = { t, ruin: t < END, cashBefore, debtBefore,
        nets: boundaryNets({ t, cashBefore, debtBefore, liqValue: liq.value, lateCredited: this.lateCredited, recv: this.recv, cashAfter: st.cash, equity: st.startEquity }, this.plants) };
    },
    markOffered() { for (const g of GOODS) this.L.offered[g] = e.state.cargo[g]; },
    // --- keyed draws (section 4.6) and per-action checks (C4) ---
    roleSequence(kind, dest) {
      const st = e.state, roles = [];
      const key = kind === "wait" ? st.currentPort : `${st.currentPort}>${dest}`;
      const vals = [];
      const draw = role => {
        const forced = this.override && role in this.override;
        const k = this.plants.vesselInKey ? `${this.seed}|${st.vesselKey}|${role}|${st.monthIndex}|${key}` : `${this.seed}|${role}|${st.monthIndex}|${key}`;
        const x = forced ? this.override[role] : mulberry32First(fnv1a(k));
        roles.push({ role, key: forced ? null : k }); vals.push(x);
        return x;
      };
      if (kind === "wait") {
        if (draw("story-occurrence") < 0.75) draw("story-pick");
      } else {
        const lane = e.SEA_LANES.find(l => l.from === st.currentPort && l.to === dest);
        const calc = e.g.computeTransit(lane);
        let tb = false, storm = false;
        if (calc.isHeadwind) {
          draw("headwind-damage");
          tb = draw("turn-back") < 0.35;
          if (!tb && st.cargo.teak > 0) draw("teak");
        }
        if (calc.isDeadZone) { const roll = draw("transition-roll"); if (roll < calc.stormProbability) { storm = true; draw("storm-damage"); } }
        if (st.cargo.textiles > 0 && !st.specialists.tarpaulins && calc.isDeadZone) draw("mildew");
        if (!tb) draw("piracy");
        const loss = calc.months * 8 + (calc.isHeadwind ? 12 : 0) + (storm ? 12 : 0);
        if (Math.max(0, 50 - Math.max(0, st.crewHealth - loss)) / 100 > 0) draw("mutiny");
      }
      let seq = roles.map(r => r.role);
      if (this.plants.swapRoles) seq = seq.map(r => r === "turn-back" ? "headwind-damage" : r === "headwind-damage" ? "turn-back" : r);
      return { vals, roles: seq, keys: roles.map(r => r.key).filter(Boolean), key };
    },
    pre(kind, dest) {
      const st = e.state;
      this.cargoAtEnd = null;
      const info = { kind, dest, port: st.currentPort, month: st.monthIndex, cargo: { ...st.cargo }, calls: rng.calls, lines: rng.lines.length };
      if (this.keyed && !st.ended && (kind === "wait" || e.SEA_LANES.some(l => l.from === st.currentPort && l.to === dest))) {
        const q = this.roleSequence(kind, dest);
        info.q = q;
        rng.push(...q.vals);
      }
      return info;
    },
    post(info) {
      const st = e.state;
      if (info.q) {
        this.checks.actions++;
        const q = info.q, f = [];
        const served = rng.served.slice(rng.served.length - (rng.calls - info.calls));
        const lines = rng.lines.slice(info.lines);
        if (rng.remaining !== 0) f.push("i:remaining=" + rng.remaining);                 // (i)
        if (rng.calls - info.calls !== q.vals.length) f.push(`v:calls=${rng.calls - info.calls}/${q.vals.length}`); // (v)
        for (const k of q.keys) if (!KEY_RE.test(k)) f.push("iii:key=" + k);           // (iii)
        lines.forEach((ln, i) => {                                                          // (iv) and (ii)
          const role = LINE_ROLE.get(ln);
          if (role !== q.roles[i]) f.push(`iv:line ${ln}=${role} vs ${q.roles[i]}`);
          if (!this.override || !(role in this.override)) {
            const u = rebuildU(`${this.seed}|${role}|${info.month}|${info.kind === "wait" ? info.port : info.port + ">" + info.dest}`);
            if (u !== served[i]) f.push(`ii:${role}`);
          }
        });
        this.checks.draws += lines.length;
        if (f.length) { this.checks.failures.push({ month: info.month, kind: info.kind, port: info.port, dest: info.dest, f }); rng.queue.length = 0; }
      }
      const after = this.cargoAtEnd || st.cargo;
      for (const g of GOODS) {
        const lost = info.cargo[g] - after[g];
        if (info.kind === "sail" && lost > 0) { this.L.lost[g] += lost; this.L.undelivered[g] = Math.max(0, Math.min(this.L.undelivered[g], after[g])); this.L.offered[g] = Math.min(this.L.offered[g], after[g]); }
      }
      const arrived = info.kind === "sail" && st.currentPort === info.dest && info.port !== info.dest;
      if (info.kind === "sail" && info.dest === this.L.intended && (arrived || this.plants.tbDelivered))
        for (const g of GOODS) { this.L.delivered[g] += Math.min(this.L.undelivered[g], after[g]); this.L.undelivered[g] = 0; }
    },
    sail(orig, d) { const i = this.pre("sail", d); orig(d); this.post(i); },
    wait(orig) { const i = this.pre("wait"); orig(); this.post(i); }
  };
  e.g.__dl = dl;
  vm.runInContext(`
    const __o = { sell: sellCargoQty, buy: buyCargoQty, adv: advanceTime, fin: finishCampaign, sail: sailTo, wait: waitInPort };
    sellCargoQty = function (id, qty) { return __dl.sell(__o.sell, id, qty); };
    buyCargoQty = function (id, qty) { return __dl.buy(__o.buy, id, qty); };
    advanceTime = function (m) { return __dl.advance(__o.adv, m); };
    finishCampaign = function () { return __dl.finish(__o.fin); };
    sailTo = function (d) { return __dl.sail(__o.sail, d); };
    waitInPort = function () { return __dl.wait(__o.wait); };
    renderAll = function () {};
    globalThis.__keyedRandom = () => globalThis.__rng.next();
  `, e.g);
  e.dl = dl; e.rng = rng;
  return e;
}
// mode: "off" (every draw 0.99), "stream" (harnessReset's mulberry32), "keyed" (section 4.6)
function resetEngine(e, v, diff, seed, mode, cfg = {}) {
  vm.runInContext(`harnessReset(${JSON.stringify(v)}, ${JSON.stringify(diff)}, ${JSON.stringify(cfg.port || "calicut")}, ${seed});`, e.g);
  if (mode === "off") vm.runInContext(`Math.random = () => ${AR.OFF};`, e.g);
  if (mode === "keyed" && !(cfg.plants && cfg.plants.noReinstall)) vm.runInContext(`Math.random = globalThis.__keyedRandom;`, e.g);
  e.rng.queue.length = 0; e.rng.lines.length = 0; e.rng.served.length = 0;
  e.dl.reset({ ...cfg, keyed: mode === "keyed", seed });
}
const engState = e => { const s = e.state; return { cash: s.cash, month: s.monthIndex, port: s.currentPort, debt: s.debt, ended: s.ended, cargo: { ...s.cargo }, A: structuredClone(e.dl.market.A), recv: e.dl.recv.map(r => ({ ...r })) }; };

// Replay a model log through the engine, comparing after every action (C2).
function replayCompare(e, log, { compareModel = true } = {}) {
  let mismatch = null;
  const g = e.g;
  log.forEach((a, i) => {
    if (a.kind === "offer") { e.dl.markOffered(); return; }
    if (a.kind === "intend") { e.dl.L.intended = a.port; return; }
    if (a.kind === "sell") g.sellCargoQty(a.good, a.qty);
    else if (a.kind === "buy") g.buyCargoQty(a.good, a.qty);
    else if (a.kind === "repair") g.repairHull();
    else if (a.kind === "wait") g.waitInPort();
    else if (a.kind === "sail") g.sailTo(a.dest);
    if (!compareModel || mismatch) return;
    const s = engState(e);
    const m = { cash: a.cash, month: a.month, port: a.port, debt: a.debt, ended: a.ended, cargo: a.cargo, A: a.A, recv: a.recv };
    if (JSON.stringify(s) !== JSON.stringify(m)) mismatch = { i, kind: a.kind, engine: s, model: m };
  });
  return { mismatch, leftover: e.rng.remaining };
}

// =========================================================================================
// Reserve rules (section 4.4) and the L-arm planner
// =========================================================================================
// Outlays from purchase to the first receipt for a delivery along pth.
function reserveFor(s, pth, pol, rule, plants = {}) {
  if (rule === "G") return RESERVE_G;
  const worst = rule === "R-worst", v = s.v, w = WAGES(v);
  const arrival = projectArrival(pth, v, pol, s.t);
  if (arrival === null) return RESERVE_G;
  const dues = s.recv.map(r => r.due).filter(d => d > s.t);
  const firstReceipt = plants.ignoreRecv || !dues.length ? arrival + s.k : Math.min(Math.min(...dues), arrival + s.k);
  const highValue = s.cargo.cloves > 0 || s.cargo.ivory > 0;
  const survival = s.diff === "survival" ? 1.8 : 1;
  let t = s.t, port = pth[0], out = 0;
  for (let i = 1; i < pth.length; i++) {
    const next = pth[i];
    while (!allowed(transit(port, next, v, t)[1], pol)) { if (t < firstReceipt && !plants.noWaits) out += w + s.fee(port); t++; }
    const [M, st] = transit(port, next, v, t);
    if (t < firstReceipt) {
      out += M * w;
      if (pol === "sailAlways" && isHead(st)) out += (worst ? M : M * HZ_TB / (1 - HZ_TB)) * (w + s.fee(port));
      if (isDead(st)) out += worst ? P.hazards.becalmCost : P.hazards.becalmBand * P.hazards.becalmCost;
      if (!highValue) out += worst ? 75 : P.ports[next].piracy * 0.6 * survival * Math.min(Math.max(s.cash, 0), 75);
      if (worst) out += P.hazards.mutinyWagesMonths * w;
    }
    t += M; port = next;
  }
  for (let j = 0; j < s.k; j++) if (arrival + j < firstReceipt) out += w + s.fee(port);
  return out;
}
const HZ_TB = P.hazards.turnBack;

// planBuys (greedy branch, verbatim from adaptive-routes) with the reserve as a parameter.
function planBuysR(s, finalPort, arrival, reserve) {
  const arr = Math.min(23, arrival);
  const K = P.vessels[s.v].capacity - s.used();
  let cash = Math.max(0, s.cash - reserve);
  const items = GOODS.map(g => { const c = s.unit(g), p = price(g, finalPort, arr); return { g, c, p, m: p - c, w: P.goods[g].weight }; });
  const buys = [];
  let tons = 0;
  for (const x of items.filter(x => x.p / x.c > 1).sort((a, b) => b.p / b.c - a.p / a.c)) {
    const q = Math.min(Math.floor((K - tons) / x.w), Math.floor(cash / x.c));
    if (q > 0) { buys.push([x.g, q]); cash -= q * x.c; tons += q * x.w; }
  }
  return buys;
}
// adaptive-routes deliver, with the reserve fill and the settlement-aware model.
function deliverL(s, pth, pol) {
  s.repairRule();
  const arrival = projectArrival(pth, s.v, pol, s.t);
  if (arrival === null) return false;
  for (const [g, q] of planBuysR(s, pth.at(-1), arrival, reserveFor(s, pth, pol, s.rule))) s.buy(g, q);
  for (let i = 1; i < pth.length; i++) {
    while (!s.ended && !allowed(transit(s.port, pth[i], s.v, s.t)[1], pol)) s.wait();
    if (s.ended) return true;
    s.sail(pth[i]);
    if (s.ended) return true;
  }
  s.sellAll();
  return true;
}
// adaptive-routes solve, with the label counting receivables (section 4.4) and terminal rules.
function solveL(start, pol, termRule = "E") {
  const best = new Map(), key = (p, t) => `${p}|${t}`;
  best.set(key(start.port, start.t), { s: start, prev: null, act: null });
  let term = null;
  const val = s => termRule === "E" ? s.net : s.nets[termRule];
  const push = (s, prev, act) => {
    if (s.ended) { if (!term || val(s) > val(term.s)) term = { s, prev, act }; return; }
    const k = key(s.port, s.t), cur = best.get(k);
    if (!cur || s.label() > cur.s.label()) best.set(k, { s, prev, act });
  };
  for (let t = start.t; t < P.campaignMonths; t++) {
    for (const p of PORTS) {
      const node = best.get(key(p, t));
      if (!node) continue;
      { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); }
      for (const pth of PATHS[p]) {
        if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue;
        const s = node.s.clone(); s.log = null;
        if (!deliverL(s, pth, pol)) continue;
        push(s, node, ["deliver", pth]);
      }
    }
  }
  const acts = [];
  for (let n = term; n && n.act; n = n.prev) acts.unshift(n.act);
  return { net: term ? val(term.s) : null, nets: term ? term.s.nets : null, acts };
}
function snapshotL(e, v, diff, pol, rule, k) {
  const st = e.state, s = new Sim2(v, diff, { k, rule, pol });
  Object.assign(s, { cash: st.cash, debt: st.debt, equity: st.startEquity, t: st.monthIndex, port: st.currentPort,
    hull: st.hull, crew: st.crewHealth, ended: st.ended, dias: { ...st.diaspora } });
  s.cargo = Object.fromEntries(GOODS.map(g => [g, st.cargo[g]]));
  s.recv = e.dl.recv.map(r => ({ ...r }));
  return s;
}
// replanRun (adaptive-routes), with the reserve fill, settlement, wrappers and a draw mode.
function replanL(e, v, diff, pol, rule, k, seed, mode, cfg = {}) {
  resetEngine(e, v, diff, seed, mode, { k, ...cfg });
  const g = e.g;
  for (let guard = 0; !e.state.ended && guard < 300; guard++) {
    for (const c of GOODS) if (e.state.cargo[c] > 0) g.sellCargoQty(c, 999);
    e.dl.markOffered();
    const s0 = snapshotL(e, v, diff, pol, rule, k);
    const plan = solveL(s0, pol);
    const act = plan.acts[0];
    if (!act || act[0] === "wait") { g.waitInPort(); continue; }
    const pth = act[1];
    const h = P.harness;
    if (e.state.hull < h.repairBelowHull && e.state.cash > h.repairAboveCash) g.repairHull();
    const s1 = snapshotL(e, v, diff, pol, rule, k);
    const arrival = projectArrival(pth, v, pol, s1.t);
    for (const [c, q] of planBuysR(s1, pth.at(-1), arrival, reserveFor(s1, pth, pol, rule))) g.buyCargoQty(c, q);
    e.dl.L.intended = pth.at(-1);
    for (let i = 1; i < pth.length && !e.state.ended; i++) {
      for (let tries = 0; !e.state.ended && e.state.currentPort !== pth[i] && tries < 50; tries++) {
        while (!e.state.ended && !allowed(transit(e.state.currentPort, pth[i], v, e.state.monthIndex)[1], pol)) g.waitInPort();
        if (!e.state.ended) g.sailTo(pth[i]);
      }
    }
  }
  return runRecord(e);
}
function runRecord(e) {
  const st = e.state;
  if (!st.ended || !e.dl.end) return { net: null, ended: false };
  return { net: st.cash - st.startEquity, E: e.dl.end.nets.E, S: e.dl.end.nets.S, S24: e.dl.end.nets.S24, ruin: e.dl.end.ruin, endMonth: e.dl.end.t,
    cashBefore: e.dl.end.cashBefore, conservation: conservation(e.dl.L), ended: true };
}

// Research copy of harnessPlan / harnessPlay (tests/03/baseline-harness.js:87-124 at d2d66a3),
// with the reserve as a parameter. Lanes are ranked with 60 D exactly as published; only the
// chosen lane's buys are recomputed with the reserve.
function harnessPlanR(e, lane, reserve) {
  const st = e.state, g = e.g;
  const calc = g.computeTransit(lane);
  const arrival = Math.min(23, st.monthIndex + calc.months);
  const tariff = g.getEffectiveTariff(st.currentPort);
  const capacity = e.VESSELS[st.vesselKey].capacity;
  const items = e.COMMODITIES.map(c => {
    const cost = Math.round(g.getLivePortPrice(c, st.currentPort, st.monthIndex) * (1 + tariff));
    const sale = g.getLivePortPrice(c, lane.to, arrival);
    return { c, cost, sale, ratio: sale / cost };
  }).filter(x => x.ratio > 1).sort((a, b) => b.ratio - a.ratio);
  let cash = Math.max(0, st.cash - reserve), tons = 0, gross = 0;
  const buys = [];
  for (const x of items) {
    const q = Math.min(Math.floor((capacity - tons) / x.c.weight), Math.floor(cash / x.cost));
    if (q > 0) { buys.push([x.c.id, q]); cash -= q * x.cost; tons += q * x.c.weight; gross += q * (x.sale - x.cost); }
  }
  const wages = calc.months * e.VESSELS[st.vesselKey].upkeep;
  return { lane, calc, buys, perMonth: (gross - wages) / calc.months };
}
function harnessL(e, v, diff, pol, rule, k, seed, mode, cfg = {}) {
  resetEngine(e, v, diff, seed, mode, { k, ...cfg });
  const st = () => e.state, g = e.g;
  let guard = 0;
  while (!st().ended && guard++ < 200) {
    for (const c of e.COMMODITIES) if (st().cargo[c.id] > 0) g.sellCargoQty(c.id, 999);
    e.dl.markOffered();
    if (st().hull < 60 && st().cash > 200) g.repairHull();
    let plans = e.SEA_LANES.filter(l => l.from === st().currentPort).map(l => harnessPlanR(e, l, 60));
    if (pol !== "sailAlways") plans = plans.filter(p => !p.calc.isHeadwind);
    if (pol === "avoidHeadwindAndTransition") plans = plans.filter(p => !p.calc.isDeadZone);
    plans.sort((a, b) => b.perMonth - a.perMonth);
    if (!plans.length) { g.waitInPort(); continue; }
    let buys = plans[0].buys;
    if (rule !== "G") {
      const s = snapshotL(e, v, diff, pol, rule, k);
      buys = harnessPlanR(e, plans[0].lane, reserveFor(s, [plans[0].lane.from, plans[0].lane.to], pol, rule)).buys;
    }
    for (const [id, q] of buys) g.buyCargoQty(id, q);
    e.dl.L.intended = plans[0].lane.to;
    g.sailTo(plans[0].lane.to);
  }
  return runRecord(e);
}

// =========================================================================================
// Helpers
// =========================================================================================
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
const median = xs => quant(xs, 0.5);
const INDEX = process.env.MONSOON_INDEX || DEFAULT_INDEX;    // the file loadEngine reads
// C8 copy-hash variant (for the planted defect only): hash a copy taken when the phase starts.
let C8_COPY = null;
const gameHash = () => sha256(readFileSync(C8_COPY || INDEX));
// Every output goes through emit(). In phases that assert C8 (all but checks and c8phase), outputs are
// held in memory and written only after the page hash is shown unchanged; on a failure nothing is written.
const PENDING = [];
let HOLD_OUTPUTS = false;
function emit(file, data) { if (HOLD_OUTPUTS) PENDING.push([file, data]); else writeFileSync(file, data); }
function flushOutputs() { for (const [file, data] of PENDING) writeFileSync(file, data); PENDING.length = 0; }
function writeJSON(name, obj) { emit(path.join(OUT, name), JSON.stringify(obj, null, 1) + "\n"); }
function readJSON(name) { const f = existsSync(path.join(OUT, name)) ? path.join(OUT, name) : path.join(EXT, name); return JSON.parse(readFileSync(f, "utf8")); }
function writeExt(name, obj) { const f = path.join(EXT, name); const s = JSON.stringify(obj); emit(f, s); return { file: name, bytes: Buffer.byteLength(s), sha256: sha256(s) }; }
const provenance = () => ({ engineScriptSha256: ENGINE_SHA256, pageSha256: gameHash(), adaptiveRoutesSha256: AR_SHA, node: process.version,
  lineOffset: LINE_OFFSET, fallback: FALLBACK, rng: "u = first output of mulberry32(FNV-1a-32(`seed|role|month|key`)); key = origin>destination (sailTo) or port (waitInPort)" });
function cmpBlocks(model, pub) {
  // C1: action for action. Sells within one arrival are compared as a set (sale order differs at
  // Q = infinity, where it cannot change any number); every other action and every block end exactly.
  const blocks = log => { const out = []; let cur = null;
    for (const a of log) { if (a.kind === "offer" || a.kind === "intend") continue;
      if (a.kind === "sell") { if (!cur) { cur = { kind: "sells", items: [], state: null }; out.push(cur); } cur.items.push(`${a.good}:${a.qty}`); cur.state = [a.cash, a.month, a.port, a.debt, a.ended]; }
      else { cur = null; out.push({ kind: a.kind, id: `${a.good || ""}:${a.qty || ""}:${a.dest || ""}`, state: [a.cash, a.month, a.port, a.debt, a.ended] }); } }
    for (const b of out) if (b.items) b.items.sort();
    return JSON.stringify(out); };
  return blocks(model) === blocks(pub);
}

// =========================================================================================
// PHASE: checks (C1, C1b, C3 unit, C4 unit + plants, C5, C6, C7, C8 plant)
// =========================================================================================
async function phaseChecks() {
  const H0 = gameHash();
  const checks = { provenance: provenance() };
  const e = makeEngine();

  // ---- roles generated from the source, against the frozen table ----
  const gen = rolesFromSource(e.source);
  checks.roleTable = { generated: gen, frozen: ROLE_TABLE.map(r => r[1]), pass: JSON.stringify(gen) === JSON.stringify(ROLE_TABLE.map(r => r[1])) };
  say("role table", checks.roleTable.pass);

  // ---- C1: identity, hazards off ----
  const c1 = (plants = {}) => {
    const rows = [];
    for (const v of VESSELS) for (const d of ["normal", "hard", "survival"]) for (const pol of AR.POLICIES) {
      const pub = pubCell(v, d, pol).greedy;
      const { acts, decisionsMatch } = publishedActs(v, d, pol);
      const s = executeD(v, d, pol, null, acts, { mode: "naive" });
      const modelMatchesPublished = cmpBlocks(s.log, pub.actionsLog);
      resetEngine(e, v, d, 1, "off", { plants });
      const r = replayCompare(e, s.log);
      const eng = runRecord(e);
      const pubBlocksEngine = (() => { // published log against the engine replay (cash etc. after every action)
        resetEngine(e, v, d, 1, "off", { plants });
        const st = pub.actionsLog.map(a => { if (a.kind === "sell") e.g.sellCargoQty(a.good, a.qty); else if (a.kind === "buy") e.g.buyCargoQty(a.good, a.qty);
          else if (a.kind === "repair") e.g.repairHull(); else if (a.kind === "wait") e.g.waitInPort(); else if (a.kind === "sail") e.g.sailTo(a.dest);
          const x = e.state; return [x.cash, x.monthIndex, x.currentPort, x.debt, x.ended]; });
        return pub.actionsLog.every((a, i) => JSON.stringify(st[i]) === JSON.stringify([a.cash, a.month, a.port, a.debt, a.ended])) && e.state.cash - e.state.startEquity === pub.engineNet;
      })();
      const pass = decisionsMatch && modelMatchesPublished && !r.mismatch && eng.E === pub.engineNet && pubBlocksEngine;
      rows.push({ v, d, pol, decisionsMatch, modelMatchesPublished, engineMatchesModel: !r.mismatch, engineNet: eng.E, publishedNet: pub.engineNet, publishedLogReplays: pubBlocksEngine, pass });
    }
    return rows;
  };
  const c1rows = c1();
  const c1plant = c1({ lateCredit: true });
  checks.C1 = { pass: c1rows.every(r => r.pass), rows: c1rows,
    plant: { defect: "settlement wrapper credits receivables one month late at k = 0", caught: !c1plant.every(r => r.pass), failingCells: c1plant.filter(r => !r.pass).length } };
  say("C1", checks.C1.pass, "plant caught", checks.C1.plant.caught);

  // ---- C1b: identity, hazards on, seed-stream feed; records end causes ----
  const c1b = { cells: [], pass: true };
  for (const cell of PUB_ON.cells) {
    const { vessel: v, difficulty: d, policy: pol } = cell;
    const rep = [], har = [], endsR = [], endsH = [];
    for (let i = 0; i < 300; i++) {
      const seed = 200001 + i;
      const a = replanL(e, v, d, pol, "G", 0, seed, "stream");
      rep.push(a.E); endsR.push(a.ruin ? `ruin@${a.endMonth}` : `end@${a.endMonth}`);
      const b = harnessL(e, v, d, pol, "G", 0, seed, "stream");
      har.push(b.E); endsH.push(b.ruin ? `ruin@${b.endMonth}` : `end@${b.endMonth}`);
      // the published harness itself, through the same wrappers
      if (i < 300) { resetEngine(e, v, d, seed, "stream"); vm.runInContext(`harnessPlay(${JSON.stringify(pol)});`, e.g); if (e.state.cash - e.state.startEquity !== cell.harness[i]) c1b.originalHarnessMismatch = (c1b.originalHarnessMismatch || 0) + 1; }
      beat(() => `C1b ${v} ${d} ${pol} seed ${i}`);
    }
    const okR = rep.every((x, i) => x === cell.replan[i]), okH = har.every((x, i) => x === cell.harness[i]);
    const ruinsR = endsR.map((x, i) => [i, x, rep[i]]).filter(x => x[1].startsWith("ruin"));
    const ruinsH = endsH.map((x, i) => [i, x, har[i]]).filter(x => x[1].startsWith("ruin"));
    c1b.cells.push({ v, d, pol, replanReproduced: okR, harnessReproduced: okH, replanMismatches: rep.filter((x, i) => x !== cell.replan[i]).length,
      harnessMismatches: har.filter((x, i) => x !== cell.harness[i]).length, replanRuins: ruinsR, harnessRuins: ruinsH,
      replanEndMonths: tally(endsR), harnessEndMonths: tally(endsH) });
    c1b.pass &&= okR && okH;
    say("C1b", v, d, pol, okR, okH, "ruins", ruinsR.length, ruinsH.length);
  }
  // plant: identity depth wrapper subtracts 1 D on the first sale (first cell, all 300 seeds)
  { const cell = PUB_ON.cells[0]; let mm = 0;
    for (let i = 0; i < 300; i++) {
      const a = replanL(e, cell.vessel, cell.difficulty, cell.policy, "G", 0, 200001 + i, "stream", { plants: { minus1: true } });
      const b = harnessL(e, cell.vessel, cell.difficulty, cell.policy, "G", 0, 200001 + i, "stream", { plants: { minus1: true } });
      if (a.E !== cell.replan[i] || b.E !== cell.harness[i]) mm++;
    }
    c1b.plant = { defect: "identity depth wrapper subtracts 1 D on the first sale of each campaign", cell: [cell.vessel, cell.difficulty, cell.policy], seedsMismatched: mm, caught: mm > 0 };
  }
  checks.C1b = c1b;
  say("C1b", c1b.pass, "plant caught", c1b.plant.caught);

  // ---- C3 unit test + C4 (iv) unit: forced turn-back Aden -> Calicut in January ----
  const turnBack = plants => {
    resetEngine(e, "dhow", "normal", 1, "keyed", { port: "aden", override: { "turn-back": 0 }, plants });
    e.state.cash = 100000;                               // enough for 10 cloves at Aden
    e.g.buyCargoQty("cloves", 10);
    e.dl.L.intended = "calicut";
    const before = e.rng.lines.length;
    e.g.sailTo("calicut");
    const lines = e.rng.lines.slice(before);
    return { port: e.state.currentPort, loaded: e.dl.L.loaded.cloves, delivered: e.dl.L.delivered.cloves, aboard: e.state.cargo.cloves,
      turnBackLine: lines[1], lines, checkFailures: e.dl.checks.failures.splice(0) };
  };
  const tb = turnBack({}), tbPlant = turnBack({ tbDelivered: true });
  const tbPass = r => r.port === "aden" && r.loaded === 10 && r.delivered === 0 && r.aboard === 10;
  checks.C3unit = { result: tb, pass: tbPass(tb) && tb.turnBackLine === 2220,
    plant: { defect: "a turned-back voyage counted as delivered", result: tbPlant, caught: !tbPass(tbPlant) } };
  say("C3 unit", checks.C3unit.pass, "plant caught", checks.C3unit.plant.caught);

  // ---- C4: keyed draws on real hazards-on runs, and the three plants ----
  const c4run = plants => {
    e.dl.checks = { draws: 0, actions: 0, failures: [] };
    const out = [];
    for (const v of VESSELS) for (const pol of ["sailAlways", "avoidHeadwind"]) for (let i = 0; i < 3; i++) {
      out.push(replanL(e, v, "normal", pol, "G", 0, 300001 + i, "keyed", { plants }).E);
      out.push(harnessL(e, v, "normal", pol, "G", 1, 300001 + i, "keyed", { plants }).E);
    }
    return { ...e.dl.checks, failures: e.dl.checks.failures.slice(0, 5), failureCount: e.dl.checks.failures.length, nets: out };
  };
  const c4 = c4run({});
  checks.C4 = { sample: "24 campaigns (2 vessels x 2 policies x 3 seeds x re-planning and harness), normal; every L and H run also applies C4", ...c4, pass: c4.failureCount === 0 && c4.draws > 0,
    plants: {
      vesselInKey: (() => { const r = c4run({ vesselInKey: true }); return { caught: r.failureCount > 0, firstFailure: r.failures[0] }; })(),
      swapRoles: (() => { const r = c4run({ swapRoles: true }); return { caught: r.failureCount > 0, firstFailure: r.failures[0] }; })(),
      noReinstall: (() => { const r = c4run({ noReinstall: true }); return { caught: r.failureCount > 0, firstFailure: r.failures[0] }; })()
    } };
  say("C4", checks.C4.pass, JSON.stringify(Object.fromEntries(Object.entries(checks.C4.plants).map(([k, x]) => [k, x.caught]))));

  // ---- C5: depth arithmetic, hand values ----
  checks.C5 = c5();
  say("C5", checks.C5.pass, JSON.stringify(checks.C5.plants));
  // ---- C6: reserve arithmetic, hand values; hazards-off cash never below 0 under R-exp ----
  checks.C6 = c6(e);
  say("C6", checks.C6.pass, JSON.stringify(checks.C6.plants));
  // ---- C7: boundary rules ----
  checks.C7 = c7(e);
  say("C7", checks.C7.pass, JSON.stringify(checks.C7.plants));
  // ---- C8: planted defect in a temporary copy ----
  checks.C8plant = c8plant();
  say("C8 plant", JSON.stringify(checks.C8plant));

  checks.gameHashBefore = H0; checks.gameHashAfter = gameHash(); checks.gameUntouched = H0 === checks.gameHashAfter;
  writeJSON("checks-pre.json", checks);
  say("done; game untouched", checks.gameUntouched);
}
const tally = xs => xs.reduce((a, x) => (a[x] = (a[x] || 0) + 1, a), {});

function c5() {
  const res = {};
  const P0 = { cloves: 620, pepper: 310, ivory: 820, teak: 95, porcelain: 60, textiles: 115 };
  const run = plants => {
    const out = {};
    // per good, Q = 10, cloves at p = 620, x = Q - 1, Q, Q + 1
    for (const shape of ["hard", "soft"]) {
      const m = new Market({ type: "good", Q: 10, scope: "S2", shape, r: 1 }, plants);
      out[`good-${shape}`] = [9, 10, 11].map(x => m.lotPrice("quanzhou", "cloves", 620, x));
      out[`good-${shape}-floor`] = m.lotPrice("quanzhou", "cloves", 620, 100);
    }
    // pooled, Q_t = 10, A = 7: cloves 1 t, pepper 2 t, ivory 3 t
    const m = new Market({ type: "pool", Q: 10, scope: "S2", shape: "hard", r: 1 }, plants);
    m.A.quanzhou = 7;
    const a = m.absorb("quanzhou", P0, { teak: 0, porcelain: 0, textiles: 0, pepper: 1, cloves: 1, ivory: 1 });
    out.pooledHard = { order: m.order(P0).filter(g => ["cloves", "pepper", "ivory"].includes(g)), sold: { cloves: a.sold.cloves, pepper: a.sold.pepper, ivory: a.sold.ivory }, value: a.value, A: m.A.quanzhou };
    const ms = new Market({ type: "pool", Q: 10, scope: "S2", shape: "soft", r: 1 }, plants);
    ms.A.quanzhou = 7;
    const b = ms.absorb("quanzhou", P0, { teak: 0, porcelain: 0, textiles: 0, pepper: 1, cloves: 1, ivory: 1 });
    out.pooledSoft = { value: b.value, A: ms.A.quanzhou };
    // recovery: r = 0 and r = 1 one month; r = 0.5 over a two-month action
    for (const r of [0, 1, 0.5]) { const mm = new Market({ type: "pool", Q: 10, scope: "S2", shape: "hard", r }, plants); mm.A.quanzhou = 8; mm.recover(r === 0.5 ? 2 : 1); out[`recover-${r}`] = mm.A.quanzhou; }
    return out;
  };
  // Hand values (worked by hand; see the protocol's section 9 entry):
  //  hard per good: x=9 -> 9+1<=10 sells at 620; x=10, 11 refused.
  //  soft per good: x=9 -> no excess, 620; x=10 -> excess 1: 620*(1-0.5*1/10)=589; x=11 -> 620*0.9=558; x=100 -> floor 0.25*620=155.
  //  pooled hard from A=7: order by price per tonne cloves 620, ivory 273.3, pepper 155. cloves 7+1=8 sells;
  //  ivory 8+3=11>10 refused; pepper 8+2=10 sells. Value 620+310=930, A=10.
  //  pooled soft from A=7: cloves x=7: 7+1-10<0 -> 620, A=8; ivory 8+3-10=1 -> 820*(1-0.05)=779, A=11;
  //  pepper 11+2-10=3 -> 310*(1-0.15)=263.5 -> 264 (Math.round), A=13. Value 620+779+264=1663.
  //  recovery: r=0: 8; r=1: 0; r=0.5 over 2 months: 8*0.5*0.5 = 2.
  const HAND = { "good-hard": [620, null, null], "good-hard-floor": null, "good-soft": [620, 589, 558], "good-soft-floor": 155,
    pooledHard: { order: ["cloves", "ivory", "pepper"], sold: { cloves: 1, pepper: 1, ivory: 0 }, value: 930, A: 10 },
    pooledSoft: { value: 1663, A: 13 }, "recover-0": 8, "recover-1": 0, "recover-0.5": 2 };
  const got = run({});
  res.values = got; res.hand = HAND;
  res.pass = JSON.stringify(got) === JSON.stringify(HAND);
  // the engine wrapper applies recovery per month over a two-month action
  {
    const e = makeEngine();
    resetEngine(e, "dhow", "normal", 1, "off", { market: { type: "pool", Q: 10, scope: "S2", shape: "hard", r: 0.5 } });
    e.dl.market.A.quanzhou = 8; e.g.advanceTime(2);
    res.engineTwoMonth = e.dl.market.A.quanzhou; res.pass &&= res.engineTwoMonth === 2;
  }
  const pa = run({ ltQ: true }), pb = run({ perLot: true });
  res.plants = { ltQ: JSON.stringify(pa) !== JSON.stringify(HAND), ltQOnlyMultiWeight: JSON.stringify(pa["good-hard"]) === JSON.stringify(HAND["good-hard"]) && JSON.stringify(pa.pooledHard) !== JSON.stringify(HAND.pooledHard),
    perLot: JSON.stringify(pb) !== JSON.stringify(HAND) };
  return res;
}

function c6(e) {
  // Four hand-worked deliveries (values worked by hand; see the protocol's section 9 entry).
  const mk = (v, diff, port, t, opts = {}) => { const s = new Sim2(v, diff, { k: opts.k || 0 }); s.port = port; s.t = t; s.dias = { kilwa: 0, aden: 0, calicut: 0, malacca: 0, quanzhou: 0, ...(opts.dias || {}) }; s.cash = opts.cash ?? 1000; if (opts.recv) s.recv = opts.recv; return s; };
  const cases = [];
  // (1) scheduled waits: dhow, normal, avoid headwind, Calicut -> Aden departing month 5 (Jun, headwind).
  //     Calicut->Aden is headwind Jun-Sep (months 5-8) for the dhow; Oct is dead zone (3 months).
  //     Waits at Calicut in months 5, 6, 7, 8: 4 x (15 + fee(calicut)); fee(calicut) at standing 0 = 25. Then 3 sea
  //     months x 15 = 45, dead-zone doldrum 0.25 x 20 = 5, tribute 0.15 x 0.6 x 75 = 6.75 (Aden piracy 0.15).
  //     R-exp = 4 x 40 + 45 + 5 + 6.75 = 216.75.
  //     (Bug 2: the first checks run used Aden -> Calicut, which is a 1-month tailwind leg in June; the hand
  //     value 251.8 was wrong, the code's 16.8 = 15 + 1.8 was right for that leg.)
  cases.push({ name: "scheduled waits", s: mk("dhow", "normal", "calicut", 5), path: ["calicut", "aden"], pol: "avoidHeadwind", rule: "R-exp", hand: 216.75 });
  // (2) sail-always headwind leg: junk, normal, Aden -> Calicut in January (headwind, 3 months).
  //     Sea 3 x 35 = 105; expected retries 3 x 0.35/0.65 = 1.6154 months at (35 + fee(aden) 35) = 113.0769;
  //     tribute 0.04 x 0.6 x 75 = 1.8. R-exp = 105 + 113.0769... + 1.8 = 219.8769...
  cases.push({ name: "sail-always headwind leg", s: mk("junk", "normal", "aden", 0), path: ["aden", "calicut"], pol: "sailAlways", rule: "R-exp", hand: 105 + 3 * 0.35 / 0.65 * 70 + 1.8 });
  //     R-worst on the same leg: 105 + 3 x 70 (one full retry) + 75 (tribute) + 2 x 35 (mutiny) = 460.
  cases.push({ name: "sail-always headwind leg, R-worst", s: mk("junk", "normal", "aden", 0), path: ["aden", "calicut"], pol: "sailAlways", rule: "R-worst", hand: 460 });
  // (3) dead-zone leg, no cloves or ivory aboard: dhow, normal, Calicut -> Kilwa departing month 2 (Mar,
  //     dead zone, 2 months). Sea 2 x 15 = 30; doldrum 0.25 x 20 = 5; tribute 0.12 x 0.6 x 75 = 5.4. = 40.4
  cases.push({ name: "dead-zone leg, doldrum and tribute", s: mk("dhow", "normal", "calicut", 2), path: ["calicut", "kilwa"], pol: "avoidHeadwind", rule: "R-exp", hand: 40.4 });
  // (4) k = 2 with an existing receivable due earlier: dhow, normal, Calicut -> Malacca at month 0 (Jan,
  //     crosswind, 2 months), arrival 2, arrival + k = 4; a receivable is due at month 1, so the first
  //     receipt is month 1: only the leg (starting at 0 < 1) counts: 2 x 15 = 30, tribute 0.26 x 0.6 x 75 = 11.7.
  //     The k-month terms (months 2, 3) start after the first receipt and do not count. = 41.7
  cases.push({ name: "k = 2, earlier receivable", s: mk("dhow", "normal", "calicut", 0, { k: 2, recv: [{ due: 1, amt: 500 }] }), path: ["calicut", "malacca"], pol: "avoidHeadwind", rule: "R-exp", hand: 41.7 });
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  const evalCases = plants => cases.map(c => ({ name: c.name, hand: c.hand, got: reserveFor(c.s, c.path, c.pol, c.rule, plants) }));
  const rows = evalCases({});
  // hazards-off cash never below 0 under R-exp (re-planning, every L cell, k = 0, 1, 2)
  const minCash = [];
  for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) for (const k of [0, 1, 2]) {
    resetEngine(e, v, d, 1, "off", { k });
    let lo = Infinity;
    const orig = e.dl.post.bind(e.dl);
    e.dl.post = info => { orig(info); lo = Math.min(lo, e.state.cash); };
    replanLNoReset(e, v, d, pol, "R-exp", k);
    e.dl.post = orig;
    minCash.push({ v, d, pol, k, minCash: lo });
  }
  const pa = evalCases({ noWaits: true }), pb = evalCases({ ignoreRecv: true });
  return { rows, pass: rows.every(r => close(r.got, r.hand)) && minCash.every(x => x.minCash >= 0), minCash,
    plants: { noWaits: pa.some((r, i) => !close(r.got, rows[i].hand)), ignoreRecv: pb.some((r, i) => !close(r.got, rows[i].hand)) } };
}
// replanL without the reset (C6 installs its own hook after resetting); hazards off.
function replanLNoReset(e, v, diff, pol, rule, k) {
  const g = e.g;
  for (let guard = 0; !e.state.ended && guard < 300; guard++) {
    for (const c of GOODS) if (e.state.cargo[c] > 0) g.sellCargoQty(c, 999);
    const s0 = snapshotL(e, v, diff, pol, rule, k);
    const act = solveL(s0, pol).acts[0];
    if (!act || act[0] === "wait") { g.waitInPort(); continue; }
    const pth = act[1];
    if (e.state.hull < 60 && e.state.cash > 200) g.repairHull();
    const s1 = snapshotL(e, v, diff, pol, rule, k);
    for (const [c, q] of planBuysR(s1, pth.at(-1), projectArrival(pth, v, pol, s1.t), reserveFor(s1, pth, pol, rule))) g.buyCargoQty(c, q);
    for (let i = 1; i < pth.length && !e.state.ended; i++) {
      for (let tries = 0; !e.state.ended && e.state.currentPort !== pth[i] && tries < 50; tries++) {
        while (!e.state.ended && !allowed(transit(e.state.currentPort, pth[i], v, e.state.monthIndex)[1], pol)) g.waitInPort();
        if (!e.state.ended) g.sailTo(pth[i]);
      }
    }
  }
}

function c7(e) {
  // Dhow, normal, hazards off, from Calicut. Calicut -> Malacca is 2 months for the dhow in Nov and Dec.
  const run = (scenario, plants) => {
    const cfg = scenario === "wait24" ? { market: { type: "good", Q: 5, scope: "S2", shape: "hard", r: 0.5 } } : {};
    resetEngine(e, "dhow", "normal", 1, "off", { ...cfg, plants });
    const g = e.g, st = () => e.state;
    let depart = scenario === "arrive25" ? 23 : 22;   // Calicut -> Malacca: 2 months for the dhow in Nov and Dec
    if (scenario === "wait24") depart = 21;           // Oct: 1 month; arrive at 22, sell, wait to 23, wait to 24
    st().cash = 100000;                               // enough for 10 cloves after the waits
    while (st().monthIndex < depart) g.waitInPort();
    g.buyCargoQty("cloves", 10);
    e.dl.L.intended = "malacca";
    g.sailTo("malacca");
    let sold = 0;
    if (scenario === "wait24") { g.sellCargoQty("cloves", 10); sold = 10 - st().cargo.cloves; e.dl.markOffered(); g.waitInPort(); g.waitInPort(); }
    const end = e.dl.end;
    return { t: end.t, cashBefore: end.cashBefore, debt: end.debtBefore, nets: end.nets, equity: st().startEquity, aboard: e.dl.cargoAtEnd.cloves, soldOnArrival: sold, conservation: conservation(e.dl.L) };
  };
  const p23 = price("cloves", "malacca", 23);
  const hand = r => {
    // E counts the cargo at the month-23 price after the depth step; S counts zero; S24 counts it only at 24.
    const base = r.cashBefore - r.debt - r.equity;
    let liq = r.aboard * p23;
    if (r.aboard && r.soldOnArrival) {
      // wait24: Q = 5 per good, r = 0.5. 5 sold at month 22 (A = 5); A after two months = 5 x 0.25 = 1.25;
      // a lot is absorbed iff x + 1 <= 5: x = 1.25, 2.25, 3.25 absorb (to 4.25); x = 4.25 -> 5.25 refused.
      // 3 lots absorbed at the month-23 price, 2 written off (E) / unsold (S24).
      liq = 3 * p23;
    }
    return { E: base + liq, S: base, S24: r.t === 24 ? base + liq : base };
  };
  const out = {}, plants = {};
  for (const sc of ["arrive25", "arrive24", "wait24"]) {
    const r = run(sc, {}); out[sc] = { ...r, hand: hand(r), pass: JSON.stringify(r.nets) === JSON.stringify(hand(r)) && r.conservation.length === 0 };
  }
  out.expected = { arrive25: "t = 25", arrive24: "t = 24", wait24: "t = 24, 5 sold at 22, 5 aboard" };
  out.pass = ["arrive25", "arrive24", "wait24"].every(k => out[k].pass) && out.arrive25.t === 25 && out.arrive24.t === 24 && out.wait24.t === 24 && out.wait24.aboard === 5 && out.wait24.soldOnArrival === 5;
  const ra = run("arrive25", { sTransit: true }); plants.sTransit = JSON.stringify(ra.nets) !== JSON.stringify(hand(ra));
  const rb = run("arrive24", { s24Drop: true }); plants.s24Drop = JSON.stringify(rb.nets) !== JSON.stringify(hand(rb));
  out.plants = plants;
  return out;
}

function c8plant() {
  // A temporary copy of the game file stands in for the clone; the "run" modifies it midway.
  const dir = path.join(EXT, "c8-clone"); mkdirSync(dir, { recursive: true });
  const f = path.join(dir, "index.html"); copyFileSync(DEFAULT_INDEX, f);
  const h0 = sha256(readFileSync(f));
  const copy = path.join(dir, "index.copy.html"); copyFileSync(f, copy);
  const hc0 = sha256(readFileSync(copy));
  appendFileSync(f, "\n<!-- modified during a run -->\n");     // the planted modification
  const realPathCheck = sha256(readFileSync(f)) === h0;
  const copyCheck = sha256(readFileSync(copy)) === hc0;
  return { realPathCheckPasses: realPathCheck, caughtByRealPath: !realPathCheck, copyVariantPasses: copyCheck, copyVariantMisses: copyCheck };
}

// =========================================================================================
// PHASE: D arm (timing, darm)
// =========================================================================================
const POOL_GRID = FALLBACK >= 2 ? [90, 120, 150, 240] : [60, 90, 105, 120, 135, 150, 180, 240, 300];
const GOOD_GRID = [10, 15, 20, 25, 30, 40, 60];
function dCells() {
  const cells = [];
  for (const diff of ["normal", "hard"]) for (const scope of ["S1", "S2"]) for (const type of ["good", "pool"]) for (const shape of ["hard", "soft"])
    for (const Q of type === "good" ? GOOD_GRID : POOL_GRID) for (const r of [1, 0.5, 0.25, 0.1]) for (const mMax of [0, 2])
      cells.push({ diff, scope, type, shape, Q, r, mMax });
  return cells;
}
const cellId = c => `${c.diff}|${c.scope}|${c.type}|${c.shape}|${c.Q}|${c.r}|m${c.mMax}`;
const POL_D = "avoidHeadwind";

function phaseTiming() {
  const cells = dCells(), times = [];
  for (const c of cells) {
    for (const v of VESSELS) {
      if (times.length >= 64) break;
      const t0 = performance.now();
      solveD(new Sim2(v, c.diff, { cut: true, market: c }), POL_D, c.mMax);
      times.push({ cell: cellId(c), v, ms: performance.now() - t0 });
      say("timing", times.length, cellId(c), v, (times.at(-1).ms / 1000).toFixed(2) + " s");
    }
    if (times.length >= 64) break;
  }
  const total = cells.length * 2;
  const mean = times.reduce((a, x) => a + x.ms, 0) / times.length;
  const out = { solvesMeasured: times.length, maxSeconds: Math.max(...times.map(x => x.ms)) / 1000, meanSeconds: mean / 1000, totalSolves: total,
    projectedHours: mean * total / 3.6e6, fallback1: times.some(x => x.ms > 60000), fallback2: mean * total > 4 * 3.6e6, fallbackInForce: FALLBACK, times };
  writeJSON(`timing${FALLBACK ? "-fallback" + FALLBACK : ""}.json`, out);
  say("timing done", JSON.stringify({ ...out, times: undefined }));
}


const SUFFIX = process.env.DL_SUFFIX || "";
const CELL_FILTER = process.env.DL_CELLS || "";          // "s2r1m0": S2, r = 1, m <= 0 only (sensitivity runs)
function phaseDarm() {
  const H0 = gameHash();
  const cells = dCells().filter(c => CELL_FILTER !== "s2r1m0" || (c.scope === "S2" && c.r === 1 && c.mMax === 0));
  const e = makeEngine();
  const rows = [], c2 = { replays: 0, mismatches: [], leftovers: 0 }, c3 = { runs: 0, failures: [] }, c10 = [];
  const plansExt = [];
  const t0 = Date.now();
  // naive: one execution per (vessel, diff, cfg)
  const runEngine = (v, diff, cfg, log) => {
    resetEngine(e, v, diff, 1, "off", { market: cfg });
    const r = replayCompare(e, log);
    c2.replays++; if (r.mismatch) c2.mismatches.push(r.mismatch); if (r.leftover) c2.leftovers++;
    const rec = runRecord(e);
    c3.runs++; if (rec.conservation.length) c3.failures.push(rec.conservation);
    return { ...rec, L: cloneLedger(e.dl.L), mismatch: !!r.mismatch };
  };
  const nPlans = cells.length;
  let done = 0;
  const solveTimes = [];
  for (const c of cells) {
    const sol = {}, exec = {};
    for (const v of VESSELS) {
      const ts = performance.now();
      sol[v] = solveD(new Sim2(v, c.diff, { cut: true, market: c }), POL_D, c.mMax);
      solveTimes.push(performance.now() - ts);
      delete sol[v].buckets;
    }
    for (const v of VESSELS) {
      const other = v === "dhow" ? "junk" : "dhow";
      exec[v] = { aware: {}, copy: {}, naive: null };
      const seen = new Map();
      for (const rule of ["E", "S", "S24"]) {
        const acts = sol[v].plans[rule].acts, key = JSON.stringify(acts);
        if (!seen.has(key)) {
          const m = executeD(v, c.diff, POL_D, c, acts);
          const eng = runEngine(v, c.diff, c, m.log);
          const modelNetsMatch = JSON.stringify(m.nets) === JSON.stringify({ E: eng.E, S: eng.S, S24: eng.S24 });
          if (!modelNetsMatch) c2.mismatches.push({ cell: cellId(c), v, rule, model: m.nets, engine: [eng.E, eng.S, eng.S24] });
          seen.set(key, { ...eng, dpValue: sol[v].plans[rule].net, mUsed: acts.filter(a => a[0] === "deliver" && a[2] > 0).length, acts });
        }
        exec[v].aware[rule] = seen.get(key);
        const cacts = sol[other].plans[rule].acts;
        const cm = executeD(v, c.diff, POL_D, c, cacts, { mode: "copy" });
        exec[v].copy[rule] = runEngine(v, c.diff, c, cm.log);
      }
      const pub = publishedActs(v, c.diff, POL_D).acts;
      const nm = executeD(v, c.diff, POL_D, c, pub, { mode: "naive" });
      exec[v].naive = runEngine(v, c.diff, c, nm.log);
    }
    const row = { id: cellId(c), ...c };
    for (const v of VESSELS) {
      const x = exec[v];
      for (const rule of ["E", "S", "S24"]) {
        row[`${v}_aware_${rule}`] = x.aware[rule][rule];
        row[`${v}_naive_${rule}`] = x.naive[rule];
        row[`${v}_copy_${rule}`] = x.copy[rule][rule];
        row[`${v}_scored_${rule}`] = Math.max(x.aware[rule][rule], x.naive[rule], x.copy[rule][rule]);
        row[`${v}_dp_${rule}`] = sol[v].plans[rule].net;
      }
      const best = ["aware", "naive", "copy"].reduce((b, k) => { const val = k === "naive" ? x.naive.E : x[k].E.E; return val > b[1] ? [k, val] : b; }, [null, -Infinity]);
      row[`${v}_scored_from`] = best[0];
      const L = x.aware.E.L;
      for (const k of ["loaded", "delivered", "sold", "lost", "writtenOff"]) row[`${v}_aware_${k}`] = GOODS.reduce((a, g) => a + L[k][g], 0);
      row[`${v}_aware_liquidatedE`] = GOODS.reduce((a, g) => a + L.liq.E[g], 0);
      row[`${v}_aware_unsoldS`] = GOODS.reduce((a, g) => a + L.unsold.S[g], 0);
      row[`${v}_aware_invMonths`] = Math.round(L.invMonths);
      const Ln = x.naive.L;
      row[`${v}_naive_writtenOff`] = GOODS.reduce((a, g) => a + Ln.writtenOff[g], 0);
      row[`${v}_naive_invMonths`] = Math.round(Ln.invMonths);
      row[`${v}_m_used`] = x.aware.E.mUsed;
      row[`${v}_m_counted`] = countedOptions(x.aware.E.acts, v, c.diff, c);
      row[`${v}_nodes`] = sol[v].nodeCount; row[`${v}_edges`] = sol[v].edges;
    }
    rows.push(row);
    plansExt.push({ id: row.id, dhow: { E: exec.dhow.aware.E.acts }, junk: { E: exec.junk.aware.E.acts } });
    done++;
    say(`cell ${done}/${nPlans}`, row.id, "E scored dhow", row.dhow_scored_E, "junk", row.junk_scored_E);
  }
  // C10 containment at r = 1 (and reported at r < 1)
  for (const r of rows.filter(r => r.mMax === 2)) {
    const base = rows.find(x => x.id === r.id.replace("|m2", "|m0"));
    for (const v of VESSELS) for (const rule of ["E", "S", "S24"]) {
      const a = r[`${v}_dp_${rule}`], b = base[`${v}_dp_${rule}`];
      if (!(a >= b)) c10.push({ id: r.id, v, rule, r: r.r, m2: a, m0: b });
    }
  }
  const c10r1 = c10.filter(x => x.r === 1);
  const out = { provenance: provenance(), solveSeconds: { mean: solveTimes.reduce((a, x) => a + x, 0) / solveTimes.length / 1000, max: Math.max(...solveTimes) / 1000, total: solveTimes.reduce((a, x) => a + x, 0) / 1000 },
    C2: { pass: c2.mismatches.length === 0 && c2.leftovers === 0, replays: c2.replays, mismatches: c2.mismatches.slice(0, 10), mismatchCount: c2.mismatches.length },
    C3: { pass: c3.failures.length === 0, runs: c3.runs, failures: c3.failures.slice(0, 10) },
    C10: { holdsAtR1: c10r1.length === 0, violationsR1: c10r1, violationsBelowR1: c10.filter(x => x.r < 1).length, violationsBelowR1List: c10.filter(x => x.r < 1).slice(0, 50) },
    gameHashBefore: H0, gameHashAfter: gameHash(), wallSeconds: (Date.now() - t0) / 1000 };
  writeJSON(`darm-checks${SUFFIX}.json`, out);
  const rowsExt = writeExt(`darm-rows${SUFFIX}.json`, rows);   // outside the repository (manifest)
  writeCSV(`depth${SUFFIX}.csv`, rows);
  const m = writeExt(`darm-plans${SUFFIX}.json`, plansExt);
  writeJSON(`darm-ext-manifest${SUFFIX}.json`, { files: [m, rowsExt] });
  say("D arm done", JSON.stringify({ C2: out.C2.pass, C3: out.C3.pass, C10r1: out.C10.holdsAtR1, solve: out.solveSeconds }));
}
function countedOptions(acts, v, diff, cfg) {
  // replay the decision list in the model to find each m >= 1 option's port and arrival month
  const s = new Sim2(v, diff, { cut: true, market: cfg });
  let n = 0;
  for (const a of acts) {
    if (s.ended) break;
    if (a[0] === "wait") { s.wait(); continue; }
    const pth = a[1], m = a[2];
    if (m >= 1) {
      const arr = projectArrival(pth, v, POL_D, s.t), fin = pth.at(-1);
      let ok = false;
      for (let j = 0; j < m && !ok; j++) for (const q of AR.ADJ[fin]) if (allowed(transit(fin, q, v, arr + j)[1], POL_D)) ok = true;
      if (ok) n++;
    }
    deliverD(s, pth, POL_D, m);
  }
  return n;
}
function writeCSV(name, rows) {
  const cols = Object.keys(rows[0]);
  emit(path.join(OUT, name), [cols.join(","), ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? "")).join(","))].join("\n") + "\n");
}
// Item 1: score reads only committed files. depth CSVs hold one JSON value per field (none contains a comma).
function readDepthCSV(name) {
  const [head, ...lines] = readFileSync(path.join(OUT, name), "utf8").trim().split("\n");
  const cols = head.split(",");
  return lines.map(l => { const v = l.split(","); if (v.length !== cols.length) throw new Error(`${name}: field count`); return Object.fromEntries(cols.map((c, i) => [c, JSON.parse(v[i])])); });
}
// Per-seed CSV (cell = row of the summary CSV) back to the per-cell arrays the scoring uses.
function readPerseedCSV(name) {
  const summ = readFileSync(path.join(OUT, `${name}.csv`), "utf8").trim().split("\n").slice(1).map(l => l.split(",").slice(0, 5).map(x => JSON.parse(x)));
  const cells = summ.map(([vessel, difficulty, policy, k, reserve]) => ({ vessel, difficulty, policy, k, reserve, E: [], S: [], ruin: [], endMonth: [] }));
  const [head, ...lines] = readFileSync(path.join(OUT, `${name}-perseed.csv`), "utf8").trim().split("\n");
  if (head !== "cell,seed,E,S,ruin,endMonth") throw new Error(`${name}-perseed.csv header`);
  for (const l of lines) { const [c, seed, E, S, ruin, endMonth] = l.split(","); const x = cells[Number(c) - 1]; if (Number(seed) !== 300001 + x.E.length) throw new Error("seed order");
    x.E.push(E === "" ? null : Number(E)); x.S.push(S === "" ? null : Number(S)); x.ruin.push(Number(ruin)); x.endMonth.push(endMonth === "" ? null : Number(endMonth)); }
  return cells;
}

// ---- C9 monotonicity (reported) and the C10 brute force (only if C10 fails at r = 1) ----
function phaseC9() {
  const GRID = Array.from({ length: 400 }, (_, i) => Math.round(i * 500000 / 399));
  const res = [];
  for (const v of VESSELS) for (const diff of ["normal", "hard"]) {
    const cfg = { diff, scope: "S2", type: "pool", shape: "hard", Q: 150, r: 1, mMax: 2 };
    const seen = new Set(); let tested = 0; const viol = [];
    solveD(new Sim2(v, diff, { cut: true, market: cfg }), POL_D, 2, { onDelivery: (node, pth, m) => {
      const k = `${node.port}|${node.t}|${hKey(node)}|${pth.join(">")}|${m}`;
      if (seen.has(k)) return; seen.add(k);
      let prev = -Infinity;
      for (const c of GRID) {
        const s = node.clone(); s.log = null; s.cash = c;
        if (!deliverD(s, pth, POL_D, m)) break;
        const out = s.ended ? s.nets.E + s.equity : s.label();
        tested++;
        if (out < prev) { viol.push({ k, cash: c, out, prev }); break; }
        prev = out;
      }
      beat(() => `C9 ${v} ${diff} ${seen.size}`);
    } });
    res.push({ v, diff, cell: cfg, deliveries: seen.size, evaluations: tested, violations: viol.length, examples: viol.slice(0, 5) });
    say("C9", v, diff, seen.size, viol.length);
  }
  writeJSON("c9.json", { note: "Reported, not a gate. Cells: S2, pooled, hard, Q_t = 150, r = 1, m <= 2 (section 9 entry).", res });
}

function phaseBrute() {
  const dc = readJSON("darm-checks.json");
  const inst = [];
  for (const v of VESSELS) for (const Q of [120, 150]) inst.push({ v, cfg: { diff: "normal", scope: "S2", type: "pool", shape: "hard", Q, r: 1, mMax: 2 } });
  for (const x of dc.C10.violationsR1) {
    const [diff, scope, type, shape, Q, r] = x.id.split("|");
    const cfg = { diff, scope, type, shape, Q: Number(Q), r: Number(r), mMax: 2 };
    if (!inst.some(i => i.v === x.v && cellId(i.cfg) === cellId(cfg))) inst.push({ v: x.v, cfg });
  }
  const results = [];
  for (const { v, cfg } of inst) {
    const sol = solveD(new Sim2(v, cfg.diff, { cut: true, market: cfg }), POL_D, 2);
    for (const rule of ["E", "S", "S24"]) {
      const plan = sol.plans[rule];
      // the DP's own state at monthIndex 18: the first node on its plan path with t >= 18
      let start = null, rest = null;
      for (let i = 0; i < plan.nodes.length; i++) if (plan.nodes[i].s.t >= 18) { start = plan.nodes[i]; rest = plan.acts.slice(i); break; }
      if (!start) { results.push({ v, id: cellId(cfg), rule, note: "plan has no node at t >= 18" }); continue; }
      // (i) independent re-evaluation of the DP's plan from that state
      const reeval = (() => { const s = start.s.clone(); s.log = null; for (const a of rest) { if (s.ended) break; if (a[0] === "wait") s.wait(); else deliverD(s, a[1], POL_D, a[2]); } return s.ended ? s.nets[rule] : null; })();
      // brute force: every action sequence, no pruning
      let best = -Infinity, bestPath = null, count = 0;
      const rec = (s, pathActs, states) => {
        if (s.ended) { count++; if (s.nets[rule] > best) { best = s.nets[rule]; bestPath = { acts: pathActs, states }; } return; }
        { const x = s.clone(); x.log = null; x.wait(); rec(x, [...pathActs, ["wait"]], [...states, x]); }
        for (const pth of PATHS[s.port]) {
          if (!allowed(transit(pth[0], pth[1], v, s.t)[1], POL_D)) continue;
          for (let m = 0; m <= 2; m++) { const x = s.clone(); x.log = null; if (!deliverD(x, pth, POL_D, m)) continue; rec(x, [...pathActs, ["deliver", pth, m]], [...states, x]); }
        }
        beat(() => `brute ${v} ${cellId(cfg)} ${rule} leaves=${count}`);
      };
      const s0 = start.s.clone(); s0.log = null;
      rec(s0, [], []);
      // (ii) where the DP falls short, the optimum passes through a node where it was not the max-cash label
      let pruned = null;
      if (best > plan.net) {
        pruned = false;
        for (const st of bestPath.states) {
          if (st.ended) continue;
          const lab = sol.buckets?.[st.t]?.get(`${st.port}|${hKey(st)}`);
          if (lab && lab.s.label() > st.label()) { pruned = true; break; }
        }
      }
      results.push({ v, id: cellId(cfg), rule, startMonth: start.s.t, dpValue: plan.net, reevaluated: reeval, agreeI: reeval === plan.net, bruteBest: best, leaves: count,
        dpShortfall: best - plan.net, agreeII: best > plan.net ? pruned : true });
      say("brute", v, cellId(cfg), rule, plan.net, best, count);
    }
  }
  writeJSON("c10-brute.json", { instances: results, agree: results.every(r => r.agreeI !== false && r.agreeII !== false) });
}

// =========================================================================================
// PHASE: L arm, H arm
// =========================================================================================
function phaseLarm() {
  const H0 = gameHash(); const e = makeEngine();
  e.dl.checks = { draws: 0, actions: 0, failures: [] };
  const cells = [];
  for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) for (const k of [0, 1, 2]) for (const rule of ["G", "R-exp", "R-worst"]) {
    const runs = [];
    for (let i = 0; i < 300; i++) { runs.push(replanL(e, v, d, pol, rule, k, 300001 + i, "keyed")); beat(() => `L ${v} ${d} ${pol} k${k} ${rule} seed ${i}`); }
    cells.push({ v, d, pol, k, rule, runs });
    say("L cell", v, d, pol, `k${k}`, rule, "ruins", runs.filter(r => r.ruin).length, "C4 failures so far", e.dl.checks.failures.length);
  }
  saveStoch("liquidity", cells, e, H0);
}
function phaseHarm() {
  const H0 = gameHash(); const e = makeEngine();
  e.dl.checks = { draws: 0, actions: 0, failures: [] };
  const cells = [];
  for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) for (const k of [0, 1]) for (const rule of ["G", "R-exp", "R-worst"]) {
    const runs = [];
    for (let i = 0; i < 300; i++) { runs.push(harnessL(e, v, d, pol, rule, k, 300001 + i, "keyed")); beat(() => `H ${v} ${d} ${pol} k${k} ${rule} seed ${i}`); }
    cells.push({ v, d, pol, k, rule: rule === "G" ? "60D" : rule, runs });
    say("H cell", v, d, pol, `k${k}`, rule, "ruins", runs.filter(r => r.ruin).length, "C4 failures so far", e.dl.checks.failures.length);
  }
  saveStoch("harness", cells, e, H0);
}
function saveStoch(name, cells, e, H0) {
  const summary = cells.map(c => {
    const nets = c.runs.filter(r => r.ended).map(r => r.E);
    return { vessel: c.v, difficulty: c.d, policy: c.pol, k: c.k, reserve: c.rule, attempted: c.runs.length, completed: nets.length, excluded: c.runs.length - nets.length,
      ruins: c.runs.filter(r => r.ruin).length, min: Math.min(...nets), p10: quant(nets, 0.1), median: median(nets), p90: quant(nets, 0.9),
      conservationFailures: c.runs.filter(r => r.conservation && r.conservation.length).length,
      ruinCases: c.runs.map((r, i) => r.ruin ? { seed: 300001 + i, month: r.endMonth, net: r.E, cashBefore: r.cashBefore } : null).filter(Boolean) };
  });
  writeCSV(`${name}.csv`, summary.map(s => ({ ...s, ruinCases: s.ruinCases.map(x => `${x.seed}@${x.month}`).join(" ") })));
  const perSeed = cells.map(c => ({ vessel: c.v, difficulty: c.d, policy: c.pol, k: c.k, reserve: c.rule, E: c.runs.map(r => r.E), S: c.runs.map(r => r.S), ruin: c.runs.map(r => r.ruin ? 1 : 0), endMonth: c.runs.map(r => r.endMonth) }));
  writeJSON(`${name}-perseed.json`, { seeds: "300001-300300", cells: perSeed });
  writeJSON(`${name}-checks.json`, { provenance: provenance(), summary, C4: { actions: e.dl.checks.actions, draws: e.dl.checks.draws, failures: e.dl.checks.failures.length, examples: e.dl.checks.failures.slice(0, 5), pass: e.dl.checks.failures.length === 0 && e.dl.checks.draws > 0 },
    C3: { runs: cells.reduce((a, c) => a + c.runs.length, 0), failures: summary.reduce((a, s) => a + s.conservationFailures, 0) }, gameHashBefore: H0, gameHashAfter: gameHash() });
  say(name, "done");
}

// =========================================================================================
// PHASE: B1 (no depth, k = 0, hazards off, avoid headwind; the published greedy planner
// solved under each terminal rule, replayed through the engine)
// =========================================================================================
function phaseB1() {
  const H0 = gameHash(); const e = makeEngine();
  const out = [];
  for (const v of VESSELS) for (const d of ["normal", "hard"]) {
    const row = { v, d };
    for (const rule of ["E", "S", "S24"]) {
      const sol = solveL(new Sim2(v, d, { rule: "G" }), POL_D, rule);
      const m = new Sim2(v, d, { cut: true }); m.log = [];
      for (const a of sol.acts) { if (m.ended) break; if (a[0] === "wait") m.wait(); else deliverL(m, a[1], POL_D); }
      resetEngine(e, v, d, 1, "off");
      const r = replayCompare(e, m.log);
      const rec = runRecord(e);
      row[rule] = { dpPlanningNet: sol.net, engine: { E: rec.E, S: rec.S, S24: rec.S24 }, replayMatches: !r.mismatch, decisions: sol.acts.map(a => a[0] === "wait" ? "wait" : a[1].map(x => x.slice(0, 3)).join(">")) };
    }
    row.ratioS = row.S.engine.S / row.E.engine.E;
    row.ratioS24 = row.S24.engine.S24 / row.E.engine.E;
    out.push(row);
    say("B1", v, d, row.ratioS.toFixed(4));
  }
  writeJSON("b1.json", { provenance: provenance(), rows: out, gameHashBefore: H0, gameHashAfter: gameHash() });
}

// =========================================================================================
// PHASE: score
// =========================================================================================
function phaseScore() {
  const rows = readDepthCSV("depth.csv");
  const L = readPerseedCSV("liquidity"), H = readPerseedCSV("harness");
  const b1 = readJSON("b1.json").rows;
  const S = {};
  const R = (q) => rows.find(r => Object.entries(q).every(([k, v]) => r[k] === v));
  const flip = (sel, grid, net = "E", src = "scored") => {
    let fp = null;
    const pts = grid.map(Q => { const r = R({ ...sel, Q }); const d = r[`dhow_${src}_${net}`], j = r[`junk_${src}_${net}`]; if (d >= j) fp = Q; return { Q, dhow: d, junk: j, dhowAhead: d >= j }; });
    return { flip: fp, pts };
  };
  // D1
  { const res = {}, fail = [], unt = [];
    for (const diff of ["normal", "hard"]) {
      const f = flip({ diff, scope: "S2", type: "pool", shape: "hard", r: 1, mMax: 0 }, POOL_GRID); res[diff] = f;
      if (FALLBACK >= 2) {
        const at = Q => f.pts.find(p => p.Q === Q);
        if (!at(90).dhowAhead || at(150).dhowAhead || f.flip === null) fail.push(diff);
        else if (at(120).dhowAhead && !at(150).dhowAhead) { /* supported */ }
        else if (at(90).dhowAhead && !at(120).dhowAhead) unt.push(diff);
        else fail.push(diff);
      } else if (f.flip === null || f.flip <= 90 || f.flip >= 150) fail.push(diff);
    }
    S.D1 = { score: fail.length ? "contradicted" : unt.length ? "untestable" : "supported", failed: fail, untestable: unt, flips: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.flip])), curves: res, label: "informed" }; }
  // D2
  { const res = {}, fail = [];
    for (const diff of ["normal", "hard"]) {
      const f = flip({ diff, scope: "S2", type: "good", shape: "hard", r: 1, mMax: 0 }, GOOD_GRID); res[diff] = f;
      const at = Q => f.pts.find(p => p.Q === Q);
      if (!at(15).dhowAhead || at(40).dhowAhead) fail.push(diff);
    }
    S.D2 = { score: fail.length ? "contradicted" : "supported", failed: fail, flips: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v.flip])), curves: res, label: "informed" }; }
  // D3
  { const fail = [], ratios = [];
    for (const diff of ["normal", "hard"]) for (const type of ["good", "pool"]) for (const Q of type === "good" ? GOOD_GRID : POOL_GRID) {
      const r = R({ diff, scope: "S1", type, shape: "hard", Q, r: 1, mMax: 0 }); const x = r.junk_scored_E / r.dhow_scored_E;
      ratios.push([diff, type, Q, x]); if (!(x >= 1.5)) fail.push([diff, type, Q, x]);
    }
    S.D3 = { score: fail.length ? "contradicted" : "supported", failed: fail, minRatio: Math.min(...ratios.map(x => x[3])), ratios, label: "partly informed" }; }
  // D4
  { const fail = [], res = [];
    for (const diff of ["normal", "hard"]) {
      const j = r => R({ diff, scope: "S2", type: "pool", shape: "hard", Q: 150, r, mMax: 0 }).junk_scored_E;
      const d25 = 1 - j(0.25) / j(1), d10 = 1 - j(0.1) / j(1);
      const a = r => R({ diff, scope: "S2", type: "pool", shape: "hard", Q: 150, r, mMax: 0 }).junk_aware_E;
      const src = r => R({ diff, scope: "S2", type: "pool", shape: "hard", Q: 150, r, mMax: 0 }).junk_scored_from;
      res.push({ diff, base: j(1), r025: j(0.25), r01: j(0.1), drop025: d25, drop01: d10, scoredFrom: { r1: src(1), r025: src(0.25), r01: src(0.1) },
        depthAwareOnly: { r1: a(1), r025: a(0.25), r01: a(0.1), drop025: 1 - a(0.25) / a(1), drop01: 1 - a(0.1) / a(1) } });
      if (!(d25 <= 0.05) || !(d10 > 0.05)) fail.push(diff);
    }
    S.D4 = { score: fail.length ? "contradicted" : "supported", failed: fail, res, label: "partly informed" }; }
  // D5
  { const res = [], fail = []; let tested = 0;
    for (const scope of ["S1", "S2"]) for (const diff of ["normal", "hard"]) {
      const h = flip({ diff, scope, type: "pool", shape: "hard", r: 1, mMax: 0 }, POOL_GRID).flip;
      const s = flip({ diff, scope, type: "pool", shape: "soft", r: 1, mMax: 0 }, POOL_GRID).flip;
      const status = h === null && s === null ? "untestable" : (s !== null && h === null) || (s !== null && s > h) ? "contradicted" : "supported";
      if (status !== "untestable") tested++;
      if (status === "contradicted") fail.push([scope, diff, h, s]);
      res.push({ scope, diff, hardFlip: h, softFlip: s, status });
    }
    S.D5 = { score: tested === 0 ? "untestable" : fail.length ? "contradicted" : "supported", failed: fail, res, label: "blind" }; }
  // D6
  { const res = [], fail = [];
    const small = FALLBACK >= 2 ? [90, 120, 150] : [60, 90, 105, 120, 135, 150];
    const bar = FALLBACK >= 2 ? 2 : 4;
    for (const diff of ["normal", "hard"]) {
      const at1 = small.map(Q => R({ diff, scope: "S2", type: "pool", shape: "hard", Q, r: 1, mMax: 2 }).junk_m_counted);
      const at01 = small.map(Q => R({ diff, scope: "S2", type: "pool", shape: "hard", Q, r: 0.1, mMax: 2 }).junk_m_counted);
      const n1 = at1.filter(x => x > 0).length, n01 = at01.filter(x => x > 0).length;
      res.push({ diff, caps: small, countedR1: at1, countedR01: at01, cellsUsingR1: n1, cellsUsingR01: n01 });
      if (!(n1 >= bar) || n01 !== 0) fail.push(diff);
    }
    S.D6 = { score: fail.length ? "contradicted" : "supported", failed: fail, res, label: "blind (margin arithmetic rests on seen R_cap)" }; }
  // D7
  { const res = [];
    for (const diff of ["normal", "hard"]) {
      const f0 = flip({ diff, scope: "S2", type: "pool", shape: "hard", r: 1, mMax: 0 }, POOL_GRID).flip;
      const f2 = flip({ diff, scope: "S2", type: "pool", shape: "hard", r: 1, mMax: 2 }, POOL_GRID).flip;
      const status = f0 === null && f2 === null ? "untestable" : (f0 !== null && f2 === null) || (f0 !== null && f2 !== null && f2 < f0) ? "lower" : "not lower";
      res.push({ diff, flipM0: f0, flipM2: f2, status });
    }
    const tested = res.filter(r => r.status !== "untestable");
    S.D7 = { score: !tested.length ? "untestable" : tested.some(r => r.status === "lower") ? "supported" : "contradicted", res, label: "blind" }; }
  // L arm
  const Lc = (v, d, pol, k, rule) => L.find(c => c.vessel === v && c.difficulty === d && c.policy === pol && c.k === k && c.reserve === rule);
  const Hc = (v, d, pol, k, rule) => H.find(c => c.vessel === v && c.difficulty === d && c.policy === pol && c.k === k && c.reserve === rule);
  const ruins = c => c.ruin.reduce((a, x) => a + x, 0);
  const med = c => median(c.E.filter(x => x !== null));
  const pairedMed = (a, b) => median(a.E.map((x, i) => x - b.E[i]));
  const LC = [];
  for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) LC.push([v, d, pol]);
  { const res = LC.map(([v, d, p]) => ({ v, d, p, ruins: ruins(Lc(v, d, p, 0, "G")) })); const fail = res.filter(r => r.ruins > 3);
    S.L1 = { score: fail.length ? "contradicted" : "supported", failed: fail, res, label: "informed" }; }
  { const res = []; for (const k of [0, 1, 2]) for (const [v, d, p] of LC) res.push({ v, d, p, k, ruins: ruins(Lc(v, d, p, k, "R-exp")) });
    const fail = res.filter(r => r.ruins > 0); S.L2 = { score: fail.length ? "contradicted" : "supported", failed: fail, res, label: "blind" }; }
  { const res = VESSELS.map(v => { const g = Lc(v, "normal", "avoidHeadwind", 0, "G"), r = Lc(v, "normal", "avoidHeadwind", 0, "R-exp"); const pm = pairedMed(g, r), gm = med(g); return { v, pairedMedian: pm, gMedian: gm, share: pm / gm }; });
    const fail = res.filter(r => !(r.share <= 0.04)); S.L3 = { score: fail.length ? "contradicted" : "supported", failed: fail, res, label: "blind" }; }
  { const res = VESSELS.map(v => { const a = med(Lc(v, "normal", "avoidHeadwind", 0, "R-exp")), b = med(Lc(v, "normal", "avoidHeadwind", 1, "R-exp")); return { v, k0: a, k1: b, fall: 1 - b / a }; });
    const j = res.find(r => r.v === "junk"), dh = res.find(r => r.v === "dhow");
    const ok = j.fall >= 0.10 && j.fall <= 0.25 && dh.fall >= 0.05 && dh.fall <= 0.15 && j.fall > dh.fall;
    S.L4 = { score: ok ? "supported" : "contradicted", res, label: "blind (bands from a reviewer's arithmetic)" }; }
  { const res = []; let tested = 0; const fail = [];
    for (const d of ["normal", "hard"]) for (const p of ["sailAlways", "avoidHeadwind"]) {
      const j = ruins(Lc("junk", d, p, 2, "G")), dh = ruins(Lc("dhow", d, p, 2, "G"));
      const status = j + dh < 5 ? "untestable" : dh > j ? "contradicted" : "supported";
      if (status !== "untestable") tested++; if (status === "contradicted") fail.push([d, p, j, dh]);
      res.push({ d, p, junkRuins: j, dhowRuins: dh, status });
    }
    S.L5 = { score: tested === 0 ? "untestable" : fail.length ? "contradicted" : "supported", failed: fail, res, label: "blind" }; }
  { const a = [], b = [], c = [];
    for (const [v, d, p] of LC) {
      const h60 = ruins(Hc(v, d, p, 0, "60D")), lg = ruins(Lc(v, d, p, 0, "G"));
      a.push({ v, d, p, harnessRuins60: h60, replanRuinsG: lg, status: h60 + lg < 5 ? "untestable" : h60 >= lg ? "supported" : "contradicted" });
      for (const k of [0, 1]) b.push({ v, d, p, k, ruins: ruins(Hc(v, d, p, k, "R-exp")) });
      const hh = Hc(v, d, p, 0, "60D"), hr = Hc(v, d, p, 0, "R-exp"); const pm = pairedMed(hh, hr), gm = med(hh);
      c.push({ v, d, p, pairedMedian: pm, median60: gm, share: pm / gm });
    }
    const aT = a.filter(x => x.status !== "untestable");
    const sa = !aT.length ? "untestable" : aT.some(x => x.status === "contradicted") ? "contradicted" : "supported";
    const sb = b.some(x => x.ruins > 0) ? "contradicted" : "supported";
    const sc = c.some(x => !(x.share <= 0.02)) ? "contradicted" : "supported";
    const overall = [sa, sb, sc].includes("contradicted") ? "contradicted" : [sa, sb, sc].every(x => x === "supported") ? "supported" : "partly untestable";
    S.H1 = { score: overall, parts: { a: sa, b: sb, c: sc }, a, b, c, label: "(a) informed; (b), (c) blind" }; }
  // B1
  { const res = b1.map(r => ({ v: r.v, d: r.d, ratio: r.ratioS, E: r.E.engine.E, S: r.S.engine.S })); const n = res.filter(r => r.d === "normal");
    const dh = n.find(r => r.v === "dhow"), j = n.find(r => r.v === "junk");
    const inD = dh.ratio >= 0.80 && dh.ratio <= 0.90, inJ = j.ratio >= 0.92 && j.ratio <= 0.97;
    const floorDefect = dh.ratio < 0.797 || j.ratio < 0.913;
    S.B1 = { score: inD && inJ ? "supported" : "contradicted", plannerDefectBelowFloor: floorDefect, res, label: "informed (floors known in advance)" }; }
  {
    let U = null; try { U = readDepthCSV("depth-unblocked-r1.csv"); } catch { U = null; }
    if (U) {
      const RU = q => U.find(r => Object.entries(q).every(([k, v]) => r[k] === v));
      const flipU = (sel, grid) => { let fp = null; const pts = grid.map(Q => { const r = RU({ ...sel, Q }); const d = r.dhow_scored_E, j = r.junk_scored_E; if (d >= j) fp = Q; return { Q, dhow: d, junk: j, dhowAhead: d >= j }; }); return { flip: fp, pts }; };
      const out = { label: "exploratory sensitivity (unblocked, DL_FALLBACK=0); registered scores are unchanged" };
      for (const diff of ["normal", "hard"]) {
        const g = flipU({ diff, scope: "S2", type: "good", shape: "hard", r: 1, mMax: 0 }, GOOD_GRID);
        const p = flipU({ diff, scope: "S2", type: "pool", shape: "hard", r: 1, mMax: 0 }, [60, 90, 105, 120, 135, 150, 180, 240, 300]);
        const at = Q => g.pts.find(x => x.Q === Q);
        out[diff] = { D2wouldBe: at(15).dhowAhead && !at(40).dhowAhead ? "supported" : "contradicted", D2flip: g.flip, D2curve: g.pts, D1flip: p.flip, D1curve: p.pts };
      }
      S.sensitivityUnblocked = out;
    }
  }
  writeJSON("predictions.json", { provenance: provenance(), scores: S });
  say("scores", JSON.stringify(Object.fromEntries(Object.entries(S).map(([k, v]) => [k, v.score]))));
}

// =========================================================================================
// PHASE: plants (run after the arms): C2's and C10's planted defects on scored cells.
// =========================================================================================
function phasePlants() {
  const H0 = gameHash(); const e = makeEngine(); const out = {};
  // C2: recovery applied once per action in the wrapper only; the model stays correct. Every
  // D-arm cell at r = 0.5 (S2, pooled, hard), both ships, the DP-E plan replayed with the plant.
  const c2 = [];
  for (const diff of ["normal", "hard"]) for (const Q of POOL_GRID) for (const mMax of [0, 2]) {
    const cfg = { diff, scope: "S2", type: "pool", shape: "hard", Q, r: 0.5, mMax };
    for (const v of VESSELS) {
      const sol = solveD(new Sim2(v, diff, { cut: true, market: cfg }), POL_D, mMax);
      const m = executeD(v, diff, POL_D, cfg, sol.plans.E.acts);
      resetEngine(e, v, diff, 1, "off", { market: cfg, plants: { recoverOnce: true } });
      const r = replayCompare(e, m.log);
      const firstMulti = m.log.findIndex((a, i) => a.month !== undefined && i > 0 && a.kind === "sail" && a.month - (m.log.slice(0, i).reverse().find(x => x.month !== undefined)?.month ?? 0) > 1);
      c2.push({ id: cellId(cfg), v, flagged: !!r.mismatch, at: r.mismatch ? r.mismatch.i : null, firstMultiMonthSail: firstMulti, flaggedAtOrBeforeFirstMultiMonthAction: !!r.mismatch && (firstMulti < 0 || r.mismatch.i <= firstMulti) });
    }
  }
  out.C2plant = { defect: "recovery applied once per action in the wrapper only", cells: c2.length, flagged: c2.filter(x => x.flagged).length,
    notFlagged: c2.filter(x => !x.flagged).map(x => [x.id, x.v]), caught: c2.some(x => x.flagged), rows: c2 };
  say("C2 plant", out.C2plant.flagged, "of", c2.length);
  // C10: options restricted to m in {1, 2}; containment against the m <= 0 values must fail somewhere.
  const rows = readJSON("darm-rows.json"); const c10 = [];
  for (const diff of ["normal", "hard"]) for (const scope of ["S1", "S2"]) for (const type of ["good", "pool"]) for (const shape of ["hard", "soft"])
    for (const Q of type === "good" ? GOOD_GRID : POOL_GRID) {
      const cfg = { diff, scope, type, shape, Q, r: 1, mMax: 2 };
      const base = rows.find(x => x.id === cellId({ ...cfg, mMax: 0 }));
      for (const v of VESSELS) {
        const sol = solveD(new Sim2(v, diff, { cut: true, market: cfg }), POL_D, 2, { mMin: 1 });
        for (const rule of ["E", "S", "S24"]) if (!(sol.plans[rule].net >= base[`${v}_dp_${rule}`])) c10.push({ id: cellId(cfg), v, rule, restricted: sol.plans[rule].net, m0: base[`${v}_dp_${rule}`] });
      }
      beat(() => `C10 plant ${cellId(cfg)}`);
    }
  out.C10plant = { defect: "options restricted to m in {1, 2}", violationsR1: c10.length, caught: c10.length > 0, examples: c10.slice(0, 10) };
  say("C10 plant", c10.length);
  out.gameHashBefore = H0; out.gameHashAfter = gameHash();
  writeJSON("checks-plants.json", out);
}

// =========================================================================================
// PHASE: settle (M1). Hazards off, k in {1, 2}: the L-arm planner's plan executed in the model
// (engine-exact accounting) and replayed through the engine with every state compared, including
// receivables. Plant: the wrapper credits a receivable one month late (lateCredit2).
// =========================================================================================
function phaseSettle() {
  const e = makeEngine(); const run = plants => {
    const rows = [];
    for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) for (const k of [1, 2]) for (const rule of ["G", "R-exp"]) {
      const sol = solveL(new Sim2(v, d, { k, rule, pol }), pol, "E");
      const m = new Sim2(v, d, { cut: true, k, rule, pol }); m.log = [];
      for (const a of sol.acts) { if (m.ended) break; if (a[0] === "wait") m.wait(); else deliverL(m, a[1], pol); }
      while (!m.ended) m.wait();
      resetEngine(e, v, d, 1, "off", { k, plants });
      const r = replayCompare(e, m.log);
      const rec = runRecord(e);
      const netsMatch = JSON.stringify(m.nets) === JSON.stringify({ E: rec.E, S: rec.S, S24: rec.S24 });
      rows.push({ v, d, pol, k, rule, actions: m.log.length, sells: m.log.filter(a => a.kind === "sell").length, mismatch: r.mismatch ? { i: r.mismatch.i, kind: r.mismatch.kind } : null, netsMatch, E: rec.E, modelE: m.nets.E });
    }
    return rows;
  };
  const clean = run({}), plant = run({ lateCredit2: true });
  const out = { note: "M1 (review of #44): settlement at k >= 1, hazards off, model vs engine after every action",
    pass: clean.every(r => !r.mismatch && r.netsMatch), rows: clean,
    plant: { defect: "wrapper credits a receivable one month late (r.due < t + m)", caught: plant.some(r => r.mismatch || !r.netsMatch), cellsFlagged: plant.filter(r => r.mismatch || !r.netsMatch).length, cells: plant.length } };
  writeJSON("checks-settlement.json", out);
  say("settle", out.pass, "plant caught", out.plant.caught, out.plant.cellsFlagged, "of", out.plant.cells);
}

// PHASE: duemonth. A sale at month t with k = 1 is credited when month t + 1 is reached, and with k = 2
// at t + 2, in the model and in the engine wrapper, each against the absolute expectation. Plant: due
// month k + 1 on both sides (the model-vs-engine checks cannot see an error both sides share).
function phaseDuemonth() {
  const e = makeEngine();
  const test = plant => {
    const rows = [];
    for (const k of [1, 2]) {
      // engine: dhow, normal, hazards off; buy 10 pepper at Calicut at month 0, wait to month 1, sell there
      resetEngine(e, "dhow", "normal", 1, "off", { k, plants: plant ? { duePlant: true } : {} });
      e.g.buyCargoQty("pepper", 10); e.g.waitInPort();
      const t = e.state.monthIndex, p = e.g.getLivePortPrice(e.COMMODITIES.find(c => c.id === "pepper"), "calicut", t);
      e.g.sellCargoQty("pepper", 10);
      const revenue = 10 * p; let creditedAt = null, creditOk = null;
      while (creditedAt === null && e.state.monthIndex < t + 4) {
        const before = e.state.cash, cost = e.g.getEffectiveLayoverFee("calicut") + e.VESSELS.dhow.upkeep;
        e.g.waitInPort();
        if (e.dl.recv.length === 0) { creditedAt = e.state.monthIndex; creditOk = e.state.cash === before - cost + revenue; }
      }
      // model: the same actions in Sim2
      const m = new Sim2("dhow", "normal", { cut: true, k, duePlant: plant });
      m.buy("pepper", 10); m.wait();
      const tm = m.t; m.sellLots("pepper", 10);
      let mAt = null;
      while (mAt === null && m.t < tm + 4) { m.wait(); if (m.recv.length === 0) mAt = m.t; }
      rows.push({ k, saleMonth: t, expected: t + k, engineCreditedAt: creditedAt, engineCashDeltaOk: creditOk, modelSaleMonth: tm, modelCreditedAt: mAt,
        pass: creditedAt === t + k && creditOk === true && mAt === tm + k });
    }
    return rows;
  };
  const clean = test(false), planted = test(true);
  const out = { note: "Due-month unit test (confirmation review of #44): sale at t, k = 1 credited at t + 1, k = 2 at t + 2", pass: clean.every(r => r.pass), rows: clean,
    plant: { defect: "due month k + 1 on both sides (model and wrapper)", caught: planted.some(r => !r.pass), rows: planted } };
  writeJSON("checks-due-month.json", out);
  say("duemonth", out.pass, "plant caught", out.plant.caught);
}

// PHASE: c6arms (B3). Hazards off, R-exp, both arms, k in {0, 1, 2}: lowest cash after every sail and
// wait (after credit; the owner's ruling) and, for disclosure, lowest cash after charges, before credit.
function phaseC6arms() {
  const e = makeEngine(); const rows = [];
  for (const arm of ["L", "H"]) for (const v of VESSELS) for (const d of ["normal", "hard"]) for (const pol of ["sailAlways", "avoidHeadwind"]) for (const k of [0, 1, 2]) {
    resetEngine(e, v, d, 1, "off", { k });
    let after = Infinity, before = Infinity;
    const op = e.dl.post.bind(e.dl), oa = e.dl.advance.bind(e.dl);
    e.dl.post = info => { op(info); after = Math.min(after, e.state.cash); };
    e.dl.advance = (orig, m) => { before = Math.min(before, e.state.cash); return oa(orig, m); };
    if (arm === "L") replanLNoReset(e, v, d, pol, "R-exp", k);
    else harnessLNoReset(e, v, d, pol, "R-exp", k);
    e.dl.post = op; e.dl.advance = oa;
    rows.push({ arm, v, d, pol, k, minCashAfterAction: after, minCashAfterChargesBeforeCredit: before, E: runRecord(e).E, ruin: runRecord(e).ruin });
  }
  const out = { note: "C6, owner ruling 2026-11-24: observed after every sail and wait (after credit), all arms. Before-credit minima disclosed, not a gate.",
    pass: rows.every(r => r.minCashAfterAction >= 0), rows };
  writeJSON("checks-c6-arms.json", out);
  say("c6arms", out.pass, JSON.stringify(rows.filter(r => r.minCashAfterChargesBeforeCredit < 0).map(r => [r.arm, r.v, r.d, r.pol, r.k, r.minCashAfterChargesBeforeCredit])));
}
// harnessL without the reset, as replanLNoReset (C6 installs its hooks after resetting).
function harnessLNoReset(e, v, diff, pol, rule, k) {
  const st = () => e.state, g = e.g; let guard = 0;
  while (!st().ended && guard++ < 200) {
    for (const c of e.COMMODITIES) if (st().cargo[c.id] > 0) g.sellCargoQty(c.id, 999);
    if (st().hull < 60 && st().cash > 200) g.repairHull();
    let plans = e.SEA_LANES.filter(l => l.from === st().currentPort).map(l => harnessPlanR(e, l, 60));
    if (pol !== "sailAlways") plans = plans.filter(p => !p.calc.isHeadwind);
    plans.sort((a, b) => b.perMonth - a.perMonth);
    if (!plans.length) { g.waitInPort(); continue; }
    let buys = plans[0].buys;
    if (rule !== "G") buys = harnessPlanR(e, plans[0].lane, reserveFor(snapshotL(e, v, diff, pol, rule, k), [plans[0].lane.from, plans[0].lane.to], pol, rule)).buys;
    for (const [id, q] of buys) g.buyCargoQty(id, q);
    g.sailTo(plans[0].lane.to);
  }
}

// PHASE: c8phase (M5). Runs a real phase (b1) in a child process on a temporary copy of the page,
// with the copy modified during the run; the phase's own before/after assertion must fail. The variant
// that hashes a copy taken at the start must miss it.
async function phaseC8phase() {
  const { spawnSync } = await import("node:child_process");
  const dir = path.join(EXT, "c8-phase"); mkdirSync(dir, { recursive: true });
  const run = variant => {
    const idx = path.join(dir, `index-${variant}.html`); copyFileSync(DEFAULT_INDEX, idx);
    const out = path.join(dir, `out-${variant}`); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
    const env = { ...process.env, MONSOON_INDEX: idx, DL_OUT: out, DL_PLANT_C8: "1", ...(variant === "copy" ? { DL_C8_COPYVARIANT: "1" } : {}) };
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "b1"], { env, encoding: "utf8" });
    return { variant, exit: r.status, failed: r.status !== 0, outputWritten: existsSync(path.join(out, "b1.json")), tail: (r.stdout + r.stderr).split("\n").filter(Boolean).slice(-3) };
  };
  const real = run("real"), copy = run("copy");
  const out = { note: "M5 (review of #44): C8 planted through a real phase", realPath: real, copyVariant: copy, caughtByRealPath: real.failed, failedPhaseWroteNothing: !real.outputWritten, copyVariantMisses: !copy.failed };
  writeJSON("checks-c8-phase.json", out);
  say("c8phase", JSON.stringify({ caught: out.caughtByRealPath, copyMisses: out.copyVariantMisses }));
}

// =========================================================================================
const phases = { duemonth: phaseDuemonth, settle: phaseSettle, c6arms: phaseC6arms, c8phase: phaseC8phase, plants: phasePlants, checks: phaseChecks, timing: phaseTiming, darm: phaseDarm, c9: phaseC9, brute: phaseBrute, larm: phaseLarm, harm: phaseHarm, b1: phaseB1, score: phaseScore };
if (!phases[PHASE]) throw new Error("unknown phase " + PHASE);
say("start", JSON.stringify({ out: OUT, ext: EXT, fallback: FALLBACK, node: process.version }));
const ASSERT_C8 = !["checks", "c8phase"].includes(PHASE);
if (ASSERT_C8 && process.env.DL_C8_COPYVARIANT) { C8_COPY = path.join(EXT, `c8-copy-${process.pid}.html`); copyFileSync(INDEX, C8_COPY); }
HOLD_OUTPUTS = ASSERT_C8;
const H_START = gameHash();
if (process.env.DL_PLANT_C8 && path.resolve(INDEX) === path.resolve(DEFAULT_INDEX)) throw new Error("the C8 plant never touches the real page");
if (process.env.DL_PLANT_C8) appendFileSync(INDEX, "\n<!-- modified during a run (C8 plant) -->\n");   // planted defect (M5)
await phases[PHASE]();
if (ASSERT_C8) {
  const H_END = gameHash();
  if (H_END !== H_START) { say("C8 FAIL: page hash changed during the run", H_START.slice(0, 12), "->", H_END.slice(0, 12), "; outputs discarded:", PENDING.length); process.exit(3); }
  say("C8 page hash unchanged", H_START.slice(0, 12), "; writing", PENDING.length, "outputs");
  flushOutputs();
}
say("end");
