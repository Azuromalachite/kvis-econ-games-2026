// Regional storm seasons (Monsoon Navigator): exposure, porcelain tail and the κ threshold.
//
// Implements research/03/pre-registrations/2026-11-23-storm-seasons.md (registered by PR #39,
// merged as 24296ed; deviations and interpretations in its §13, committed with this code
// before any scored run). Node >= 22, no dependencies. Run from the repository root, one
// phase at a time, in this order:
//
//   node research/03/models/storm-seasons.mjs checks     # K8, K3, K2, K4, K1, K1b, K5, K7
//   node research/03/models/storm-seasons.mjs plants     # K1-K8 against their planted defects (temporary clone)
//   node research/03/models/storm-seasons.mjs exposure   # H: W0-W5 normal + W0-W1 survival; R: W1 normal; expected exposure
//   node research/03/models/storm-seasons.mjs k10        # K10a-d, then their planted defects
//   node research/03/models/storm-seasons.mjs sweep      # the κ sweep: RS, then HS
//   node research/03/models/storm-seasons.mjs score      # predictions.json, from the committed CSVs
//
// Environment: SS_OUT (results directory), SS_EXT (large traces, outside the repository),
// SS_DATE (run date in the results folder name). Every phase hashes the page before and after;
// its outputs are held in memory and written only if the hash is unchanged.
//
// The tier probabilities are game parameters. Modern climatology is used only as a labelled
// proxy for relative seasonality within each sea. Nothing here is historical, and nothing
// changes the game: the new storm rule exists only as a research copy of sailTo in the vm.

import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync, rmSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { engineScript, DEFAULT_INDEX } from "../../../tests/03/engine/load-engine.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));
const ROOT = at("../../../");
const RUN_DATE = process.env.SS_DATE || "2026-11-24";
const OUT = process.env.SS_OUT || at(`../results/${RUN_DATE}-storm-seasons/`);
const EXT = process.env.SS_EXT || path.join(os.tmpdir(), "ss-storm-seasons-ext");
const PHASE = process.argv[2] || "checks";
const sha256 = x => createHash("sha256").update(x).digest("hex");
const NODE = process.execPath;

// --- pins (protocol header, §17) ---------------------------------------------------------
const ENGINE_SHA256 = "6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c";
const PAGE_SHA256_AT_REGISTRATION = "5c722df9d8432d9a5df763d8a5a460b6ccbb9f4e1730ae008a8e58908ff8dbd3"; // cedef87
const LINE_OFFSET = 1692;            // the <script> tag is on line 1693 of the page at cedef87
const ENGINE_FILENAME = "monsoon-engine.js";
const INDEX = process.env.MONSOON_INDEX || DEFAULT_INDEX;
const HARNESS = at("../../../tests/03/baseline-harness.js");
const gameHash = () => sha256(readFileSync(INDEX));

// --- progress log with heartbeat (long runs show progress) -------------------------------
const T0 = Date.now();
let lastBeat = Date.now();
const stamp = () => `[${new Date().toISOString().slice(11, 19)} +${((Date.now() - T0) / 1000).toFixed(0)}s]`;
function say(...a) { console.log(stamp(), PHASE, ...a); lastBeat = Date.now(); }
function beat(msg) { if (Date.now() - lastBeat >= 30000) say("heartbeat", typeof msg === "function" ? msg() : msg); }

// --- outputs: held until the page hash is shown unchanged ---------------------------------
const PENDING = [];
function emit(file, data) { PENDING.push([file, data]); }
function flushOutputs() {
  for (const [file, data] of PENDING) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, data); }
  PENDING.length = 0;
}
const outPath = name => path.join(OUT, name);
const extPath = name => path.join(EXT, name);
function readJSONFile(f) { return JSON.parse(readFileSync(f, "utf8")); }
function writeExt(name, obj) {
  const s = JSON.stringify(obj);
  emit(extPath(name), s);
  return { file: name, bytes: Buffer.byteLength(s), sha256: sha256(s) };
}
function csvString(rows) {
  const cols = Object.keys(rows[0]);
  const cell = v => v === null || v === undefined ? "" : typeof v === "number" ? (Number.isInteger(v) ? String(v) : String(+v.toFixed(6))) : String(v);
  return [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n") + "\n";
}
function writeCSV(name, rows) { emit(outPath(name), csvString(rows)); }
function readCSV(f) {
  const [head, ...lines] = readFileSync(f, "utf8").trim().split("\n");
  const cols = head.split(",");
  return lines.map(l => { const v = l.split(","); return Object.fromEntries(cols.map((c, i) => [c, v[i] === "" ? null : isNaN(Number(v[i])) ? v[i] : Number(v[i])])); });
}
// checks.json is built up by the phases that run checks; each phase merges its part.
function mergeChecks(part) {
  const f = outPath("checks.json");
  const prev = existsSync(f) ? readJSONFile(f) : {};
  emit(f, JSON.stringify({ ...prev, ...part }, null, 1) + "\n");
}

// --- reuse of adaptive-routes.mjs (as depth-liquidity.mjs does) -----------------------------
// adaptive-routes.mjs runs its whole study when imported, so its definitions (everything above
// its "// --- main" marker) are imported from a generated copy of that text, with only its
// relative paths made absolute. Nothing in it is edited. Sim, deliver, solve, planBuys,
// snapshot, replay and reset are used as they are; replanRun is copied below with recording hooks.
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
  src += "\nexport { P, FIX, MONTHS, GOODS, PORTS, HZ, OFF, transit, isHead, isDead, allowed, price, Sim, planBuys, projectArrival, PATHS, deliver, solve, execute, snapshot, replay, netOf, reset };\n";
  mkdirSync(EXT, { recursive: true });
  const f = path.join(EXT, `adaptive-core-${sha256(src).slice(0, 12)}.mjs`);
  writeFileSync(f, src);
  return import(pathToFileURL(f).href);
}
const AR = await importAdaptive();
const { P, GOODS, PORTS, transit, isDead, allowed, PATHS } = AR;
const AR_SHA = sha256(readFileSync(AR_PATH));
const SELF_SHA = sha256(readFileSync(fileURLToPath(import.meta.url)));
const PUB = at("../results/2026-11-23-adaptive-routes/");
const PUB_OFF = readJSONFile(PUB + "hazards-off.json");
const PUB_ON = readJSONFile(PUB + "hazards-on.json");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VESSELS = ["dhow", "junk"];
const POLICIES = ["sailAlways", "avoidHeadwind", "avoidHeadwindAndTransition"];
const CELLS = VESSELS.flatMap(v => POLICIES.map(pol => ({ v, pol })));
// SS_DEV=1: development smoke on non-registered seeds (900001+), outputs to scratch, gates skipped, nothing
// outcome-bearing printed. Never set in the run; provenance records it.
const DEV = process.env.SS_DEV === "1";
const SEED0 = DEV ? 900001 : 500001, N_SEEDS = 300;   // §5.3
const K1_SEED0 = 200001;                          // K1 and R's W0 exposure
const KAPPA = [2.4, 6, 12, 24, 60, 120, 240, 600, 1200];
const KAPPA10 = KAPPA.map(k => Math.round(k * 10));  // c × 10000 = κ10 × S, exact in integers
const MARGIN = { dhow: 35, junk: 55 };            // m_v: wages + Kilwa's fee of 20 D (§4)
const TRANSITION = new Set([2, 3, 4, 9]);         // Mar, Apr, May, Oct (getWindState isDeadZone)
const BOOT_SEED = 20261124, BOOT_N = 10000;
// Development smoke only (fewer seeds per cell in a fail-fast plantcheck of K1 or K1b). Never set in the run:
// every scored phase refuses to start when it is set.
const DEV_LIMIT = process.env.SS_DEV_LIMIT ? Number(process.env.SS_DEV_LIMIT) : N_SEEDS;

// =========================================================================================
// §2: regions, tiers and probabilities — THE RUN'S LOOKUP (dumped to checks.json; K2, K3)
// =========================================================================================
const COUNTS = {                                  // §2.2 (IMD totals 1961-2025; HKO 1961-2020 means)
  AS: [0, 0, 0, 1, 17, 15, 0, 2, 9, 20, 10, 6],
  BoB: [4, 1, 1, 10, 39, 5, 4, 6, 14, 42, 66, 31],
  SCS: [0.2, 0.0, 0.1, 0.2, 0.8, 1.4, 2.7, 3.1, 2.7, 2.1, 1.7, 0.7]
};
const REGION = {                                  // §2.1: one region per leg; the strait never decides
  "kilwa-aden": "AS", "kilwa-calicut": "AS", "aden-calicut": "AS",
  "calicut-malacca": "BoB", "malacca-quanzhou": "SCS"
};
function throwUnknownLeg(from, to) { throw new Error(`no region for leg ${from}-${to}`); }
function regionOf(from, to) { return REGION[`${from}-${to}`] ?? REGION[`${to}-${from}`] ?? throwUnknownLeg(from, to); }
function tiersOf(counts) {
  const peak = Math.max(...counts);
  return counts.map(c => { const r = c / peak; return r >= 0.7 ? "H" : r >= 0.4 ? "M" : r >= 0.1 ? "L" : "N"; });
}
function seaCounts(region, early) {
  const SCS = COUNTS.SCS;
  if (region === "SCS" && early) return SCS.map((_, m) => SCS[(m + 1) % 12]);   // p'(m) = p(m + 1)
  return COUNTS[region];
}
const MAPPING_P2000 = {                           // §2.4, in units of 1/2000 (exact integers)
  M1: { H: 700, M: 350, L: 140, N: 0 },
  M2: { H: 700, M: 525, L: 350, N: 0 },
  M3: { H: 700, M: 0, L: 0, N: 0 }
};
const navP2000 = p2000 => p2000 * 18 / 35;      // keeps today's ratio (0.35 -> 0.18)
function tierOf(region, month, early = false) { return tiersOf(seaCounts(region, early))[month]; }
function p2000Of(mapping, from, to, month, nav, early = false) {
  const base = MAPPING_P2000[mapping][tierOf(regionOf(from, to), month, early)];
  return nav ? navP2000(base) : base;
}
const W5_MIX = { "calicut-malacca": { AS: 0.208, BoB: 0.563 }, "malacca-quanzhou": { SCS: 0.895 } };
const LOOKUPS = {
  today: (from, to, month, nav) => (regionOf(from, to), TRANSITION.has(month) ? (nav ? 360 : 700) / 2000 : 0),
  W1: (from, to, month, nav) => p2000Of("M1", from, to, month, nav) / 2000,
  W2: (from, to, month, nav) => p2000Of("M2", from, to, month, nav) / 2000,
  W3: (from, to, month, nav) => p2000Of("M3", from, to, month, nav) / 2000,
  W4: (from, to, month, nav) => p2000Of("M1", from, to, month, nav, true) / 2000,
  W5: (from, to, month, nav) => {
    regionOf(from, to);
    const mix = W5_MIX[`${from}-${to}`] || W5_MIX[`${to}-${from}`];
    if (!mix) return p2000Of("M1", from, to, month, nav) / 2000;
    let p = 0;
    for (const [reg, w] of Object.entries(mix)) { const b = MAPPING_P2000.M1[tierOf(reg, month)]; p += w * (nav ? navP2000(b) : b) / 2000; }
    return p;
  }
};
const WORLDS = ["W0", "W1", "W2", "W3", "W4", "W5"];
// S for one leg: (1000 p) × 30 × stormResist × stormMult = p2000 × 15 × stormResist × stormMult (§4)
function legS(costSet, from, to, month, status, v, diff) {
  const p2000 = costSet === "new" ? p2000Of("M1", from, to, month % 12, false) : costSet === "old" ? (isDead(status) ? 700 : 0) : 0;
  const s = p2000 * 15 * P.vessels[v].damageMult * P.difficulties[diff].damageMult;
  if (!Number.isInteger(s)) throw new Error("S is not an integer");
  return s;
}
function dumpLookup() {
  const legs = P.lanes.map(l => [l.from, l.to]);
  const out = { regions: {}, tiers: {}, p: {} };
  for (const [a, b] of legs) out.regions[`${a}>${b}`] = regionOf(a, b);
  for (const r of ["AS", "BoB", "SCS"]) out.tiers[r] = tiersOf(seaCounts(r, false)).join("");
  out.tiers["SCS-early"] = tiersOf(seaCounts("SCS", true)).join("");
  for (const w of ["today", "W1", "W2", "W3", "W4", "W5"]) for (const nav of [false, true])
    out.p[`${w}${nav ? "+nav" : ""}`] = Object.fromEntries(legs.map(([a, b]) => [`${a}>${b}`, MONTHS.map((_, m) => +LOOKUPS[w](a, b, m, nav).toFixed(6))]));
  return out;
}

// =========================================================================================
// Independent rebuilds and protocol fixtures (K2 (ii), (iii); K3 (ii), (iii)). Written apart
// from the run's lookup above and never used by it.
// =========================================================================================
const FIX_K2 = {                                  // §2.1 table, transcribed
  "kilwa|aden": { AS: 1, BoB: 0, STR: 0, SCS: 0, region: "AS" },
  "kilwa|calicut": { AS: 1, BoB: 0, STR: 0, SCS: 0, region: "AS" },
  "aden|calicut": { AS: 1, BoB: 0, STR: 0, SCS: 0, region: "AS" },
  "calicut|malacca": { AS: 0.208, BoB: 0.563, STR: 0.229, SCS: 0, region: "BoB" },
  "malacca|quanzhou": { AS: 0, BoB: 0, STR: 0.105, SCS: 0.895, region: "SCS" }
};
const FIX_K3 = {                                  // §2.3 table, transcribed
  AS: { r: [0, 0, 0, .050, .850, .750, 0, .100, .450, 1, .500, .300], t: "NNNNHHNLMHML" },
  BoB: { r: [.061, .015, .015, .152, .591, .076, .061, .091, .212, .636, 1, .470], t: "NNNLMNNNLMHM" },
  SCS: { r: [.065, 0, .032, .065, .258, .452, .871, 1, .871, .677, .548, .226], t: "NNNNLMHHHMML" },
  "SCS-early": { r: [0, .032, .065, .258, .452, .871, 1, .871, .677, .548, .226, .065], t: "NNNLMHHHMMLN" }
};
const FIX_P = {                                   // §2.4 table: [high, mid, low, none], with navigator
  M1: [[0.35, 0.175, 0.07, 0], [0.18, 0.09, 0.036, 0]],
  M2: [[0.35, 0.2625, 0.175, 0], [0.18, 0.135, 0.09, 0]],
  M3: [[0.35, 0, 0, 0], [0.18, 0, 0, 0]]
};
// K3 (ii): tiers in exact integer arithmetic (HKO means × 10), from the §2.2 counts.
function k3Rebuild() {
  const intCounts = {
    AS: [0, 0, 0, 1, 17, 15, 0, 2, 9, 20, 10, 6], BoB: [4, 1, 1, 10, 39, 5, 4, 6, 14, 42, 66, 31],
    SCS: [2, 0, 1, 2, 8, 14, 27, 31, 27, 21, 17, 7]
  };
  intCounts["SCS-early"] = intCounts.SCS.slice(1).concat(intCounts.SCS.slice(0, 1));
  const out = {};
  for (const [sea, cs] of Object.entries(intCounts)) {
    let peak = 0; for (const c of cs) if (c > peak) peak = c;
    out[sea] = {
      r: cs.map(c => Math.round(1000 * c / peak) / 1000),
      t: cs.map(c => 10 * c >= 7 * peak ? "H" : 10 * c >= 4 * peak ? "M" : 10 * c >= peak ? "L" : "N").join("")
    };
  }
  return out;
}
// K2 (ii): shares recomputed from the page's seaWaypoints and the inverse projection.
function k2Rebuild(html, ports) {
  const m = /const seaWaypoints=(\{[\s\S]*?\n\s*\});/.exec(html);
  if (!m) throw new Error("seaWaypoints not found in the page");
  const wps = Function(`return (${m[1]});`)();
  const a = 8.0637, b = -228.84, c = -7.4553, d = 269.23;   // §2.1 fit: x = a·lon + b, y = c·lat + d
  const lon = x => (x - b) / a, lat = y => (y - d) / c;
  const X_CAPE = a * 77.5 + b;                            // the meridian of Cape Comorin (x = 396.1)
  const out = {};
  for (const l of P.lanes) {
    const mids = wps[`${l.from}-${l.to}`] || [...(wps[`${l.to}-${l.from}`] || [])].reverse();
    const pts = [[ports[l.from].x, ports[l.from].y], ...mids, [ports[l.to].x, ports[l.to].y]];
    // Sea of each segment, by its position along the polyline (orientation-free): between the
    // Sumatra waypoint [545, 217] and Malacca, or between Malacca and the Singapore waypoint
    // [616, 263], the strait; beyond Singapore (away from Malacca) the SCS; elsewhere AS or BoB
    // by the meridian of Cape Comorin.
    const find = (x, y) => pts.findIndex(p => p[0] === x && p[1] === y);
    const iSum = find(545, 217), iSing = find(616, 263), iMal = find(ports.malacca.x, ports.malacca.y);
    const between = (i, a, b) => a >= 0 && b >= 0 && i >= Math.min(a, b) && i < Math.max(a, b);
    const zoneAt = i => {
      if (between(i, iSum, iMal) || between(i, iMal, iSing)) return "STR";
      if (iSing >= 0 && iMal >= 0 && (iSing > iMal ? i >= iSing : i < iSing)) return "SCS";
      return null;
    };
    const len = { AS: 0, BoB: 0, STR: 0, SCS: 0 };
    let south0 = 0, south10 = 0, total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const segLen = Math.hypot(x2 - x1, y2 - y1);
      total += segLen;
      const z = zoneAt(i);
      if (z) len[z] += segLen;
      else if ((x1 - X_CAPE) * (x2 - X_CAPE) < 0) {          // crosses the meridian: split the segment
        const f = (X_CAPE - x1) / (x2 - x1);
        const west = x1 < X_CAPE ? f : 1 - f;
        len.AS += segLen * west; len.BoB += segLen * (1 - west);
      } else len[lon((x1 + x2) / 2) < 77.5 ? "AS" : "BoB"] += segLen;
      // reported only: length south of the equator and south of 10° N (linear in y along a segment)
      const part = yLim => { const s1 = y1 > yLim, s2 = y2 > yLim; if (s1 && s2) return 1; if (!s1 && !s2) return 0; const f = (yLim - y1) / (y2 - y1); return s1 ? f : 1 - f; };
      south0 += segLen * part(d); south10 += segLen * part(c * 10 + d);
    }
    void lat;
    const shares = Object.fromEntries(Object.entries(len).map(([k, v]) => [k, v / total]));
    const outside = ["AS", "BoB", "SCS"].sort((p, q) => shares[q] - shares[p]);
    out[`${l.from}|${l.to}`] = { ...shares, region: outside[0], southOfEquator: south0 / total, southOf10N: south10 / total };
  }
  return out;
}

// =========================================================================================
// Engine loader: tests/03/engine/load-engine.mjs's engineScript(), evaluated with the protocol's
// lineOffset, the engine script pinned by SHA-256, and a DOM stand-in copied from that loader.
// =========================================================================================
function makeElement(id) {
  const classes = new Set(["hidden"]);
  const el = {
    id, textContent: "", innerHTML: "", className: "", value: "", disabled: false, hidden: false,
    src: "", alt: "", href: "", style: {}, attributes: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, force) => { const on = force === undefined ? !classes.has(c) : Boolean(force); if (on) classes.add(c); else classes.delete(c); return on; },
      contains: c => classes.has(c)
    },
    setAttribute(name, v) { el.attributes[name] = String(v); },
    getAttribute(name) { return el.attributes[name] ?? null; },
    querySelector: () => makeElement(null), querySelectorAll: () => [],
    appendChild: () => {}, addEventListener: () => {}, focus: () => {}, scrollIntoView: () => {}
  };
  return el;
}
function makeDocument() {
  const byId = new Map();
  const getElementById = id => { if (!byId.has(id)) byId.set(id, makeElement(id)); return byId.get(id); };
  return { byId, document: { getElementById, querySelector: () => makeElement(null), querySelectorAll: () => [], createElement: () => makeElement(null), addEventListener: () => {}, body: makeElement("body") } };
}
class RandomScript {
  constructor() { this.queue = []; this.calls = 0; }
  push(...values) { this.queue.push(...values); return this; }
  next() { this.calls += 1; if (this.queue.length === 0) throw new Error(`unscripted Math.random() call #${this.calls}`); return this.queue.shift(); }
  get remaining() { return this.queue.length; }
}
let PAGE_HTML = null;
function loadEngine() {
  const html = readFileSync(INDEX, "utf8");
  PAGE_HTML = html;
  const source = engineScript(html);
  if (sha256(source) !== ENGINE_SHA256) throw new Error(`engine script SHA-256 ${sha256(source)} is not the pinned ${ENGINE_SHA256}`);
  const { document, byId } = makeDocument();
  const rng = new RandomScript();
  const context = vm.createContext({ document, console, print: () => {}, alert: () => {}, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0 });
  context.window = context;
  vm.runInContext(source, context, { filename: ENGINE_FILENAME, lineOffset: LINE_OFFSET });
  vm.runInContext(readFileSync(HARNESS, "utf8"), context, { filename: HARNESS });
  vm.runInContext(`globalThis.__engine = { get state() { return state; }, PORTS, SEA_LANES, COMMODITIES, VESSELS, DIFFICULTIES, MONTHS, CAMPAIGN_MONTHS };
    Math.random = () => globalThis.__rng.next();
    window.renderAll = () => {};`, Object.assign(context, { __rng: rng }));
  const api = context.__engine;
  return {
    g: context, source, rng, get state() { return api.state; },
    PORTS: api.PORTS, SEA_LANES: api.SEA_LANES, COMMODITIES: api.COMMODITIES, VESSELS: api.VESSELS, DIFFICULTIES: api.DIFFICULTIES,
    lane(from, to) { return api.SEA_LANES.find(l => l.from === from && l.to === to); },
    el: id => byId.get(id) ?? null
  };
}

// =========================================================================================
// §2.5: the research copy of sailTo — the engine's own text with one replacement, asserted once
// =========================================================================================
const STORM_BLOCK = [
  "      // 2. Inter-Monsoon Dead Zone (35% Cyclone / Doldrum probability)",
  "      if (calc.isDeadZone) {",
  "        const roll = Math.random();",
  "        const stormThreshold = calc.stormProbability;",
  "        if (roll < stormThreshold) {",
  "          crewHealthLoss += 12;",
  "          const dmg = Math.round((22 + Math.random() * 16) * vessel.stormResist * diff.stormMult);",
  "          state.hull = Math.max(5, state.hull - dmg);",
  "          eventNotes.push(`Struck by inter-monsoon cyclone (-${dmg}% hull)`);",
  "        } else if (roll < stormThreshold + 0.25) {",
  "          state.cash -= 20;",
  "          eventNotes.push(`Becalmed in Doldrums (+20 D water & ration burn)`);",
  "        }",
  "      }"
].join("\n");
const NEW_BLOCK = `      // 2. RESEARCH COPY (storm-seasons protocol §2.5): p from one lookup (region of the leg, departure month, navigator)
      const stormP = __ssStormP(lane.from, lane.to, state.monthIndex % 12, state.specialists.navigator);
      if (calc.isDeadZone) {
        const roll = Math.random();
        const stormThreshold = stormP;
        if (roll < stormThreshold) {
          crewHealthLoss += 12;
          const dmg = Math.round((22 + Math.random() * 16) * vessel.stormResist * diff.stormMult);
          state.hull = Math.max(5, state.hull - dmg);
          eventNotes.push(\`Struck by inter-monsoon cyclone (-\${dmg}% hull)\`);
        } else if (roll < stormThreshold + 0.25) {
          state.cash -= 20;
          eventNotes.push(\`Becalmed in Doldrums (+20 D water & ration burn)\`);
        }
      } else if (stormP > 0) {
        if (Math.random() < stormP) {
          crewHealthLoss += 12;
          const dmg = Math.round((22 + Math.random() * 16) * vessel.stormResist * diff.stormMult);
          state.hull = Math.max(5, state.hull - dmg);
          eventNotes.push(\`Struck by inter-monsoon cyclone (-\${dmg}% hull)\`);
        }
      }`;
const STORM_AFTER_PORCELAIN = false;
function researchSailTo(source) {
  const head = "    function sailTo(destId) {";
  const i = source.indexOf(head);
  if (i < 0 || source.indexOf(head, i + 1) >= 0) throw new Error("sailTo not found exactly once");
  const j = source.indexOf("\n    function advanceTime(", i);
  const text = source.slice(i, j);
  const k = text.indexOf(STORM_BLOCK);
  if (k < 0 || text.indexOf(STORM_BLOCK, k + 1) >= 0) throw new Error("storm block not found exactly once in sailTo");
  const lineAt = pos => source.slice(0, pos).split("\n").length + LINE_OFFSET;
  const first = lineAt(i + k), last = first + STORM_BLOCK.split("\n").length - 1;
  if (first !== 2333 || last !== 2346) throw new Error(`storm block at :${first}-${last}, not :2333-2346`);
  const ct = source.indexOf("    function computeTransit(lane, monthIdxOverride = null) {");
  if (lineAt(ct) !== 2135) throw new Error("computeTransit is not at :2135");
  let copy = text.slice(0, k) + NEW_BLOCK + text.slice(k + STORM_BLOCK.length);
  if (STORM_AFTER_PORCELAIN) {
    copy = copy.replace(NEW_BLOCK, "");
    const t = copy.indexOf("      if (state.cargo.textiles > 0");
    copy = copy.slice(0, t) + NEW_BLOCK + "\n" + copy.slice(t);
  }
  return { original: text, copy, lines: [first, last], sailToLine: lineAt(i) };
}

// =========================================================================================
// Worlds and the recorder (the W0 hook and its equivalents in every arm)
// =========================================================================================
function worldEngine(world, { record = true } = {}) {
  const e = loadEngine();
  e.world = world;
  if (world !== "W0") {
    const look = LOOKUPS[world];
    if (!look) throw new Error("unknown world " + world);
    e.g.__ssStormP = (from, to, month, nav) => look(from, to, month, nav);
    const { copy } = researchSailTo(e.source);
    vm.runInContext(`sailTo = ${copy.trimStart()};`, e.g, { filename: "storm-seasons-sailTo.js" });
  }
  /*PLANT-K7*/
  if (record) installRecorder(e);
  return e;
}
const RE_HW = /Fought severe monsoon headwinds \(-(\d+)% hull\)/, RE_STORM = /Struck by inter-monsoon cyclone \(-(\d+)% hull\)/, RE_PORC = /shattered (\d+) crate/;
function installRecorder(e) {
  const rec = { cur: null, hashing: false, wantStates: false, departures: 0 };
  e.rec = rec;
  const st = () => e.state;
  const hashNow = added => {
    const s = st();
    return createHash("sha1").update(JSON.stringify({ ...s, logs: s.logs.length, visitedPorts: [...s.visitedPorts] }) + "\n" + s.logs.slice(0, added).join("\n")).digest("base64");
  };
  const after = n0 => { const c = rec.cur; if (c && c.hashes) c.hashes.push(hashNow(st().logs.length - n0)); };
  rec.begin = () => {
    rec.departures = 0;
    rec.cur = { acts: [], att: [], newIter: true, checked: false, hashes: rec.hashing ? [] : null, hstates: rec.wantStates ? [] : null,
      waits: 0, repairs: 0, mutinies: 0, doldrums: 0, deadLegs: 0, turnbacks: 0, storms: 0, stormsTB: 0 };
  };
  rec.check = () => { const c = rec.cur; if (c && !c.checked) { c.acts.push({ k: "c", cash: st().cash }); c.checked = true; } };
  rec.end = net => { const c = rec.cur; rec.cur = null; return { ...c, net, porc: attributePorcelain(c.acts, e) }; };
  e.g.__ss = {
    act(fn) { const n0 = st().logs.length; const r = fn(); after(n0); return r; },
    sail(orig, d) {
      const s = st(), c = rec.cur;
      const lane = e.lane(s.currentPort, d);
      if (!c || s.ended || !lane) { const n0 = s.logs.length; const r = orig(d); after(n0); return r; }
      const calc = e.g.computeTransit(lane);
      const from = s.currentPort, month = s.monthIndex, n0 = s.logs.length;
      /*PLANT-K1*/
      rec.departures++;
      orig(d);
      const line = s.logs[s.logs.length - n0 - 1];
      const num = re => { const m = re.exec(line); return m ? Number(m[1]) : 0; };
      const hw = num(RE_HW), storm = num(RE_STORM), pb = num(RE_PORC);
      const tb = line.includes("(TURNED BACK)") ? 1 : 0;
      const w = calc.isHeadwind ? "H" : calc.isTailwind ? "T" : calc.isDeadZone ? "D" : "C";
      c.att.push([from, d, month, w, storm > 0 ? 1 : 0, tb]);
      c.acts.push({ k: "s", to: d, hw, storm, pb, arr: s.monthIndex });
      if (storm > 0) { c.storms++; if (tb) c.stormsTB++; }
      if (tb) c.turnbacks++;
      if (calc.isDeadZone) { c.deadLegs++; if (line.includes("Becalmed in Doldrums")) c.doldrums++; }
      if (line.includes("Crew mutiny settled")) c.mutinies++;
      if (c.hstates && c.hstates.length && c.hstates.at(-1).act === null) c.hstates.at(-1).act = d;
      c.newIter = true; c.checked = false;
      after(n0);
    },
    wait(orig) {
      const s = st(), c = rec.cur, n0 = s.logs.length;
      if (!c || s.ended) { orig(); after(n0); return; }
      orig();
      const line = s.logs[s.logs.length - n0 - 1];
      c.acts.push({ k: "w", s8: line.includes("+8% Hull") ? 1 : 0 });
      c.waits++;
      if (c.hstates && c.hstates.length && c.hstates.at(-1).act === null) c.hstates.at(-1).act = "wait";
      c.newIter = true; c.checked = false;
      after(n0);
    },
    repair(orig) {
      const s = st(), c = rec.cur, n0 = s.logs.length, c0 = s.cash;
      orig();
      if (c && s.cash !== c0) { if (!c.checked) { c.acts.push({ k: "c", cash: c0 }); c.checked = true; } c.acts.push({ k: "r" }); c.repairs++; }
      after(n0);
    },
    plan() {
      const s = st(), c = rec.cur;
      if (!c || !c.newIter) return;
      c.newIter = false;
      if (!c.checked) { c.acts.push({ k: "c", cash: s.cash }); c.checked = true; }
      if (c.hstates) c.hstates.push({ port: s.currentPort, t: s.monthIndex, cash: s.cash, debt: s.debt, hull: s.hull, crew: s.crewHealth, dias: { ...s.diaspora }, cargo: GOODS.reduce((a, g) => a + s.cargo[g], 0), act: null });
    }
  };
  vm.runInContext(`(() => {
    const o = { sell: sellCargoQty, buy: buyCargoQty, sail: sailTo, wait: waitInPort, repair: repairHull, plan: harnessPlan };
    sellCargoQty = function (id, q) { return __ss.act(() => o.sell(id, q)); };
    buyCargoQty = function (id, q) { return __ss.act(() => o.buy(id, q)); };
    repairHull = function () { return __ss.repair(o.repair); };
    sailTo = function (d) { return __ss.sail(o.sail, d); };
    waitInPort = function () { return __ss.wait(o.wait); };
    harnessPlan = function (lane) { __ss.plan(); return o.plan(lane); };
  })();`, e.g);
}

// §6 attribution rule: replay the logged hull path without storm damage, with the same repair rule.
function attributePorcelain(acts, e) {
  const porcelain = e.COMMODITIES.find(c => c.id === "porcelain");
  let h = 100, spentLog = 0, spentRep = 0, lots = 0, value = 0, brokenAll = 0;
  for (const a of acts) {
    if (a.k === "c") {
      const cash = a.cash + spentLog - spentRep;
      if (h < P.harness.repairBelowHull && cash > P.harness.repairAboveCash && h < 100 && cash >= P.repair.cost) { h = Math.min(100, h + P.repair.hull); spentRep += P.repair.cost; }
    } else if (a.k === "r") spentLog += P.repair.cost;
    else if (a.k === "w") { if (a.s8) h = Math.min(100, h + 8); }
    else if (a.k === "s") {
      if (a.hw) h = Math.max(P.hazards.hullFloor, h - a.hw);
      if (a.pb > 0) {
        brokenAll += a.pb;
        if (h >= P.hazards.porcelainHullBelow) { lots += a.pb; value += a.pb * e.g.getLivePortPrice(porcelain, a.to, Math.min(23, a.arr)); }
      }
    }
  }
  return { lots, value, brokenAll };
}

// --- campaigns ---------------------------------------------------------------------------
function harnessRun(e, v, diff, pol, seed, hazardsOff = false) {
  AR.reset(e, v, diff, seed, hazardsOff);
  e.rec.begin();
  vm.runInContext(`harnessPlay(${JSON.stringify(pol)});`, e.g);
  return e.rec.end(AR.netOf(e));
}
// Copy of adaptive-routes.mjs replanRun (section 4.3 of that protocol), with two recording hooks
// that read state only: onState(s0) at every solve call, and rec.check() at the repair rule.
function replanRun(e, v, diff, pol, fill, seed, onState = null) {
  AR.reset(e, v, diff, seed, false);
  e.rec.begin();
  const g = e.g;
  for (let guard = 0; !e.state.ended && guard < 300; guard++) {
    for (const c of GOODS) if (e.state.cargo[c] > 0) g.sellCargoQty(c, 999);
    const s0 = AR.snapshot(e, v, diff);
    if (onState) onState(s0);
    const plan = AR.solve(s0, pol, fill);
    const act = plan.acts[0];
    if (!act || act[0] === "wait") { g.waitInPort(); continue; }
    const pth = act[1];
    const h = P.harness;
    e.rec.check();
    if (e.state.hull < h.repairBelowHull && e.state.cash > h.repairAboveCash) g.repairHull();
    const s1 = AR.snapshot(e, v, diff);
    const arrival = AR.projectArrival(pth, v, pol, s1.t);
    for (const [c, q] of AR.planBuys(s1, pth.at(-1), arrival, fill)) g.buyCargoQty(c, q);
    for (let i = 1; i < pth.length && !e.state.ended; i++) {
      for (let tries = 0; !e.state.ended && e.state.currentPort !== pth[i] && tries < 50; tries++) {
        while (!e.state.ended && !allowed(transit(e.state.currentPort, pth[i], v, e.state.monthIndex)[1], pol)) g.waitInPort();
        if (!e.state.ended) g.sailTo(pth[i]);
      }
    }
  }
  return e.rec.end(AR.netOf(e));
}
const stateFields = s => ({ port: s.port, t: s.t, cash: s.cash, debt: s.debt, equity: s.equity, hull: s.hull, crew: s.crew, dias: { ...s.dias }, cargo: { ...s.cargo } });
const compactCampaign = (r, seed) => ({ seed, net: r.net, att: r.att, waits: r.waits, repairs: r.repairs, mutinies: r.mutinies, doldrums: r.doldrums, deadLegs: r.deadLegs, turnbacks: r.turnbacks, storms: r.storms, stormsTB: r.stormsTB, porc: r.porc });

// =========================================================================================
// §5.4 cap and stopping rules (projection ledger kept in SS_EXT/timing.json across phases)
// =========================================================================================
const CAP_MIN = 30;
const EST = { checksRow: 2, K1: 10.5, K1b: 0.5, expH: 0.5, expR: 3.5, expected: 0.1, K10: 1, sweepRS: 8.5, sweepHS: 1 };
const BLOCK_ORDER = ["checksA", "K1", "K1b", "checksB", "expH", "expR", "expected", "K10", "sweepRS", "sweepHS"];
function ledger() { const f = extPath("timing.json"); return existsSync(f) ? readJSONFile(f) : { blocks: {}, cuts: [], projections: [] }; }
function saveLedger(L) { mkdirSync(EXT, { recursive: true }); writeFileSync(extPath("timing.json"), JSON.stringify(L, null, 1)); }
function estOf(L, name) {
  // The §5.4 row "K8, K3, K2, K4, K5, K7" (≤ 2 min) runs in two pieces around K1 and K1b: the first
  // piece carries the row's estimate; the second, what is left of it once the first is measured.
  let est = name === "checksA" ? EST.checksRow : name === "checksB" ? (L.blocks.checksA?.done ? Math.max(0, EST.checksRow - L.blocks.checksA.min) : 0) : EST[name];
  if (name === "K1" && L.cuts.includes(3)) est -= 6.25;
  if (name === "sweepRS") { if (L.cuts.includes(1)) est *= 0.64; if (L.cuts.includes(2)) est *= 0.5; if (L.cuts.includes(4)) est = 0; }
  return est;
}
function ratioOf(L) {
  let r = 1;
  for (const [name, b] of Object.entries(L.blocks)) {
    if (!b.done) continue;
    if (name === "checksA" || name === "checksB") continue;
    const e = EST[name]; if (e > 0) r = Math.max(r, b.min / e);
  }
  if (L.blocks.checksA?.done && L.blocks.checksB?.done) r = Math.max(r, (L.blocks.checksA.min + L.blocks.checksB.min) / EST.checksRow);
  return r;
}
function project(L, current, currentProjection) {
  let total = 0;
  for (const b of Object.values(L.blocks)) if (b.done) total += b.min;
  const ratio = ratioOf(L);
  total += currentProjection;
  for (const name of BLOCK_ORDER.slice(BLOCK_ORDER.indexOf(current) + 1)) if (!L.blocks[name]?.done) total += estOf(L, name) * ratio;
  return { total, ratio };
}
// Called before a block starts (fraction 0) and after its first 10% (fraction = done share).
function capCheck(name, fraction, elapsedMin) {
  const L = ledger();
  const proj = () => fraction > 0 ? elapsedMin / fraction : estOf(L, name) * ratioOf(L);
  let p = project(L, name, proj());
  L.projections.push({ block: name, at: fraction > 0 ? "after 10%" : "before", total: +p.total.toFixed(2), ratio: +p.ratio.toFixed(3) });
  const started = name => !!L.blocks[name];
  for (const cut of [1, 2, 3, 4]) {
    if (p.total <= CAP_MIN) break;
    if (L.cuts.includes(cut)) continue;
    if (cut === 3 && (started("K1") && !(name === "K1" && fraction === 0))) continue;   // only if K1 has not started
    if ((cut === 1 || cut === 2 || cut === 4) && L.blocks.sweepRS?.done) continue;
    L.cuts.push(cut);
    say(`CAP: projected ${p.total.toFixed(1)} min > ${CAP_MIN}; cut ${cut} made (log it in §13 before reading any result)`);
    p = project(L, name, name === "sweepRS" && fraction > 0 ? proj() * (cut === 1 ? 0.64 : cut === 2 ? 0.5 : cut === 4 ? 0 : 1) : proj());
    L.projections.push({ block: name, afterCut: cut, total: +p.total.toFixed(2) });
  }
  saveLedger(L);
  return L.cuts;
}
function blockStart(name) { const L = ledger(); L.blocks[name] = { started: new Date().toISOString(), done: false }; saveLedger(L); return Date.now(); }
function blockEnd(name, t0, extra = {}) { const L = ledger(); L.blocks[name] = { ...L.blocks[name], done: true, min: (Date.now() - t0) / 60000, ...extra }; saveLedger(L); say(`block ${name}: ${((Date.now() - t0) / 60000).toFixed(2)} min (estimate ${name.startsWith("checks") ? "row ≤ 2" : EST[name]})`); }
const cutsNow = () => ledger().cuts;

// =========================================================================================
// CHECKS
// =========================================================================================
const mismatch = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
function runNodeTests(files, env = {}) {
  const r = spawnSync(NODE, ["--test", ...files], { cwd: ROOT, env: { ...process.env, ...env }, encoding: "utf8" });
  const tail = (r.stdout + r.stderr).split("\n").filter(l => /^ℹ (tests|pass|fail)/.test(l));
  return { exit: r.status, pass: r.status === 0, summary: tail };
}
function k8pre() {
  const env = !process.env.MONSOON_INDEX;
  const page = gameHash();
  const e = loadEngine();
  return { monsoonIndexUnset: env, pageSha256: page, pageEqualsRegistration: page === PAGE_SHA256_AT_REGISTRATION, engineScriptSha256: sha256(e.source), engineScriptPinned: sha256(e.source) === ENGINE_SHA256, engineScriptChars: e.source.length };
}
function k8suites() {
  const suites = runNodeTests(["tests/03/engine/*.test.mjs"]);
  const pd = spawnSync(NODE, ["tests/03/engine/planted-defects.mjs"], { cwd: ROOT, encoding: "utf8" });
  const pdTail = (pd.stdout + pd.stderr).trim().split("\n").slice(-2);
  return { engineSuites: suites, plantedDefects: { exit: pd.status, pass: pd.status === 0, tail: pdTail } };
}
// K3: tiers and probabilities three ways.
function k3() {
  const reb = k3Rebuild(), f = [];
  for (const sea of ["AS", "BoB", "SCS", "SCS-early"]) {
    const run = sea === "SCS-early" ? tiersOf(seaCounts("SCS", true)).join("") : tiersOf(seaCounts(sea, false)).join("");
    if (run !== reb[sea].t || run !== FIX_K3[sea].t) f.push({ sea, run, rebuild: reb[sea].t, fixture: FIX_K3[sea].t });
    reb[sea].r.forEach((r, m) => { if (Math.abs(r - FIX_K3[sea].r[m]) > 1e-9) f.push({ sea, month: MONTHS[m], rebuildR: r, fixtureR: FIX_K3[sea].r[m] }); });
  }
  // every p: run lookup against the §2.4 fixture applied to the rebuilt tiers, per mapping, navigator, leg, month
  const idx = { H: 0, M: 1, L: 2, N: 3 };
  const fixSea = (from, to) => FIX_K2[`${from}|${to}`]?.region ?? FIX_K2[`${to}|${from}`].region;
  let cellsChecked = 0;
  for (const [world, mapping, early] of [["W1", "M1", false], ["W2", "M2", false], ["W3", "M3", false], ["W4", "M1", true]])
    for (const nav of [false, true]) for (const l of P.lanes) for (let m = 0; m < 12; m++) {
      const sea = fixSea(l.from, l.to), key = sea === "SCS" && early ? "SCS-early" : sea;
      const want = FIX_P[mapping][nav ? 1 : 0][idx[reb[key].t[m]]];
      const got = LOOKUPS[world](l.from, l.to, m, nav);
      cellsChecked++;
      if (Math.abs(got - want) > 1e-12) f.push({ world, nav, leg: `${l.from}>${l.to}`, month: MONTHS[m], got, want });
    }
  // W5's mix and today's rule, from the fixtures
  for (const nav of [false, true]) for (const l of P.lanes) for (let m = 0; m < 12; m++) {
    const pt = (sea) => FIX_P.M1[nav ? 1 : 0][idx[reb[sea].t[m]]];
    const leg = [l.from, l.to].sort().join("|");
    const want5 = leg === "calicut|malacca" ? 0.208 * pt("AS") + 0.563 * pt("BoB") : leg === "malacca|quanzhou" ? 0.895 * pt("SCS") : pt(fixSea(l.from, l.to));
    if (Math.abs(LOOKUPS.W5(l.from, l.to, m, nav) - want5) > 1e-12) f.push({ world: "W5", nav, leg, month: MONTHS[m] });
    const wantT = [2, 3, 4, 9].includes(m) ? (nav ? 0.18 : 0.35) : 0;
    if (LOOKUPS.today(l.from, l.to, m, nav) !== wantT) f.push({ world: "today", nav, leg, month: MONTHS[m] });
    cellsChecked += 2;
  }
  return { pass: f.length === 0, tierCells: 48, pCellsChecked: cellsChecked, failures: f.slice(0, 20) };
}
// K2: region assignment three ways.
function k2(e) {
  const reb = k2Rebuild(PAGE_HTML, e.PORTS), f = [];
  const shares = {};
  for (const l of P.lanes) {
    const fwd = FIX_K2[`${l.from}|${l.to}`] || FIX_K2[`${l.to}|${l.from}`];
    const r = reb[`${l.from}|${l.to}`];
    let run;
    try { run = regionOf(l.from, l.to); } catch (err) { run = "THREW"; }
    shares[`${l.from}>${l.to}`] = { AS: +r.AS.toFixed(3), BoB: +r.BoB.toFixed(3), STR: +r.STR.toFixed(3), SCS: +r.SCS.toFixed(3), region: r.region, southOfEquator: +r.southOfEquator.toFixed(2), southOf10N: +r.southOf10N.toFixed(2) };
    if (!(run === r.region && run === fwd.region)) f.push({ leg: `${l.from}>${l.to}`, run, rebuild: r.region, fixture: fwd.region });
    for (const s of ["AS", "BoB", "STR", "SCS"]) if (Math.abs(r[s] - fwd[s]) > 0.0005) f.push({ leg: `${l.from}>${l.to}`, sea: s, rebuild: r[s], fixture: fwd[s] });
    let rev; try { rev = regionOf(l.to, l.from); } catch (err) { rev = "THREW"; }
    if (rev !== run) f.push({ leg: `${l.from}>${l.to}`, reverse: rev, forward: run });
  }
  const unknown = [["kilwa", "quanzhou"], ["aden", "malacca"], ["calicut", "calicut"]].map(([a, b]) => { try { regionOf(a, b); return false; } catch (err) { return true; } });
  if (!unknown.every(Boolean)) f.push({ unknownLegThrows: unknown });
  // the run's lookup applied to every leg (the throw must reach the p lookup too)
  let pThrows = false; try { LOOKUPS.W1("kilwa", "quanzhou", 6, false); } catch (err) { pThrows = true; }
  if (!pThrows) f.push({ unknownLegInPLookupThrows: false });
  return { pass: f.length === 0, legs: 10, shares, failures: f };
}
// K4: per-tier probability boundaries with scripted rolls (expected p from the protocol tables).
function k4(failFast = false) {
  const reb = k3Rebuild(), idx = { H: 0, M: 1, L: 2, N: 3 }, rows = [], f = [];
  const fixSea = (from, to) => (FIX_K2[`${from}|${to}`] || FIX_K2[`${to}|${from}`]).region;
  const e = worldEngine("W1", { record: false });
  const setup = (port, month, nav) => {
    AR.reset(e, "dhow", "normal", 1, false);
    vm.runInContext("Math.random = () => globalThis.__rng.next();", e.g);
    e.rng.queue.length = 0; e.rng.calls = 0;
    Object.assign(e.state, { currentPort: port, monthIndex: month, crewHealth: 100, hull: 100, cash: 1500 });
    e.state.specialists.navigator = nav;
  };
  // one leg-month per (transition?, tier): not headwind, at most 3 months at sea (no mutiny draw)
  const pick = (trans, tier, nav) => {
    for (const l of P.lanes) for (let m = 0; m < 12; m++) {
      if (TRANSITION.has(m) !== trans || reb[fixSea(l.from, l.to)].t[m] !== tier) continue;
      setup(l.from, m, nav);
      const c = e.g.computeTransit(e.lane(l.from, l.to));
      if (!c.isHeadwind && c.months <= 3) return { from: l.from, to: l.to, m };
    }
    throw new Error(`no leg for ${trans ? "transition" : "monsoon"} ${tier}`);
  };
  const outcome = (case_, port, to, month, nav, rolls) => {
    setup(port, month, nav);
    const h0 = e.state.hull, c0 = e.state.cash, n0 = e.state.logs.length;
    e.rng.push(...rolls);
    let threw = null;
    try { e.g.sailTo(to); } catch (err) { threw = String(err.message || err); }
    const line = e.state.logs.length > n0 ? e.state.logs[e.state.logs.length - n0 - 1] : "";
    const res = threw ? "threw" : line.includes("Struck by inter-monsoon cyclone") ? "storm" : line.includes("Becalmed") ? "doldrum" : "calm";
    return { ...case_, result: res, remaining: e.rng.remaining, calls: e.rng.calls, threw, hullDrop: h0 - e.state.hull, cashDrop: c0 - e.state.cash };
  };
  const PIR = 0.99;
  for (const nav of [false, true]) for (const tier of ["H", "M", "L", "N"]) {
    const p = FIX_P.M1[nav ? 1 : 0][idx[tier]];
    const navRatio = MAPPING_P2000.M1[tier] === 0 ? true : navP2000(MAPPING_P2000.M1[tier]) * 35 === MAPPING_P2000.M1[tier] * 18;
    if (!navRatio) f.push({ tier, navigatorNot18of35: navP2000(MAPPING_P2000.M1[tier]) });
    const T = pick(true, tier, nav), M = pick(false, tier, nav);
    const cases = [
      [T, "transition", p - 1e-9, "storm", [p - 1e-9, 0.5, PIR]],
      [T, "transition", p, "doldrum", [p, PIR]],
      [T, "transition", p + 0.25 - 1e-9, "doldrum", [p + 0.25 - 1e-9, PIR]],
      [T, "transition", p + 0.25, "calm", [p + 0.25, PIR]]
    ];
    if (p > 0) cases.push([M, "monsoon", p - 1e-9, "storm", [p - 1e-9, 0.5, PIR]], [M, "monsoon", p, "calm", [p, PIR]]);
    else cases.push([M, "monsoon", "none: no draw", "calm", [PIR]]);
    for (const [L, kind, roll, want, rolls] of cases) {
      const o = outcome({ tier, nav, kind, leg: `${L.from}>${L.to}`, month: MONTHS[L.m], roll, want }, L.from, L.to, L.m, nav, rolls);
      o.pass = o.result === want && o.remaining === 0 && o.calls === rolls.length && (want !== "doldrum" || o.cashDrop >= 20);
      rows.push(o);
      if (!o.pass) { f.push(o); if (failFast) return { pass: false, failures: f }; }
    }
  }
  return { pass: f.length === 0, cases: rows.length, rows, failures: f };
}
// K1: W0 reproduces the published nets. K1b: the copy at today's rule is the engine.
function k1(e, { failFast = false, normalOnly = false, hashStore = null } = {}) {
  const f = [], rNormal = [];
  let nH = 0, nR = 0;
  for (const cell of PUB_ON.cells) {
    for (let i = 0; i < DEV_LIMIT; i++) {
      const seed = K1_SEED0 + i;
      e.rec.hashing = true;
      const h = harnessRun(e, cell.vessel, cell.difficulty, cell.policy, seed);
      e.rec.hashing = false;
      nH++;
      if (hashStore) hashStore.set(`${cell.vessel}|${cell.difficulty}|${cell.policy}|${i}`, h.hashes);
      if (h.net !== cell.harness[i]) { f.push({ player: "H", cell: [cell.vessel, cell.difficulty, cell.policy], seed, got: h.net, want: cell.harness[i] }); if (failFast) return { pass: false, failures: f }; }
      if (normalOnly && cell.difficulty !== "normal") continue;
      const r = replanRun(e, cell.vessel, cell.difficulty, cell.policy, "greedy", seed);
      nR++;
      if (r.net !== cell.replan[i]) { f.push({ player: "R", cell: [cell.vessel, cell.difficulty, cell.policy], seed, got: r.net, want: cell.replan[i] }); if (failFast) return { pass: false, failures: f }; }
      if (cell.difficulty === "normal") rNormal.push({ v: cell.vessel, pol: cell.policy, ...compactCampaign(r, seed) });
      beat(() => `K1 ${cell.vessel}/${cell.difficulty}/${cell.policy} seed ${seed}`);
    }
    if (K1_PROGRESS) K1_PROGRESS();
  }
  const off = hazardsOffReplays(e, null);
  f.push(...off.failures);
  if (failFast && f.length) return { pass: false, failures: f };
  return { pass: f.length === 0, harnessNets: nH, replanNets: nR, offReplays: off.n, failures: f.slice(0, 20), rNormal };
}
let K1_PROGRESS = null;
function hazardsOffReplays(e, hashStore) {
  const f = [];
  let n = 0;
  for (const cell of PUB_OFF.cells) {
    for (const fill of ["greedy", "opt"]) {
      AR.reset(e, cell.vessel, cell.difficulty, 1, true);
      e.rec.hashing = true; e.rec.begin();
      AR.replay(e, cell[fill].actionsLog);
      const r = e.rec.end(AR.netOf(e)); e.rec.hashing = false;
      n++;
      if (hashStore) hashStore.set(`off|${cell.vessel}|${cell.difficulty}|${cell.policy}|${fill}`, r.hashes);
      if (r.net !== cell[fill].engineNet) f.push({ offReplay: [cell.vessel, cell.difficulty, cell.policy, fill], got: r.net, want: cell[fill].engineNet });
    }
    e.rec.hashing = true;
    const hr = harnessRun(e, cell.vessel, cell.difficulty, cell.policy, 1, true);
    e.rec.hashing = false;
    if (hashStore) hashStore.set(`offH|${cell.vessel}|${cell.difficulty}|${cell.policy}`, hr.hashes);
    if (hr.net !== cell.harness.engineNet) f.push({ offHarness: [cell.vessel, cell.difficulty, cell.policy], got: hr.net, want: cell.harness.engineNet });
  }
  return { n, failures: f };
}
function k1b({ failFast = false, w0Hashes = null } = {}) {
  const e = worldEngine("today"), w0 = w0Hashes ? null : worldEngine("W0");
  const f = [];
  let n = 0, actions = 0;
  const N = DEV_LIMIT;
  const w0hashOf = (key, run) => w0Hashes ? w0Hashes.get(key) : run();
  for (const cell of PUB_ON.cells) for (let i = 0; i < N; i++) {
    const seed = K1_SEED0 + i, key = `${cell.vessel}|${cell.difficulty}|${cell.policy}|${i}`;
    e.rec.hashing = true;
    const h = harnessRun(e, cell.vessel, cell.difficulty, cell.policy, seed);
    e.rec.hashing = false;
    const ref = w0hashOf(key, () => { w0.rec.hashing = true; const r = harnessRun(w0, cell.vessel, cell.difficulty, cell.policy, seed); w0.rec.hashing = false; return r.hashes; });
    n++; actions += h.hashes.length;
    const at = h.hashes.findIndex((x, j) => x !== ref[j]);
    if (h.net !== cell.harness[i] || at >= 0 || h.hashes.length !== ref.length) {
      f.push({ cell: [cell.vessel, cell.difficulty, cell.policy], seed, got: h.net, want: cell.harness[i], firstStateDifference: at });
      if (failFast) return { pass: false, failures: f };
    }
    beat(() => `K1b ${key}`);
  }
  // the hazards-off replays and harness runs in the copy, against the published nets and W0's states
  const offHashes = new Map(), offRef = new Map();
  const off = hazardsOffReplays(e, offHashes);
  f.push(...off.failures);
  const w0e = w0 || worldEngine("W0");
  hazardsOffReplays(w0e, offRef);
  for (const [k, hs] of offHashes) if (mismatch(hs, offRef.get(k))) f.push({ offState: k });
  return { pass: f.length === 0, harnessCampaigns: n, actionsCompared: actions, offReplays: off.n, failures: f.slice(0, 20) };
}
// K5: scripted RNG.
function k5(failFast = false) {
  const out = {};
  out.engineSuites = runNodeTests(["tests/03/engine/*.test.mjs"]);
  // the copy at today's lookup passes sail.test.mjs (a page copy outside the repository; the game file is never written)
  const html = readFileSync(INDEX, "utf8"), source = engineScript(html);
  const { original, copy } = researchSailTo(source);
  const lookupJs = "function __ssStormP(from, to, month, nav) { return [2, 3, 4, 9].includes(month) ? (nav ? 0.18 : 0.35) : 0; }\n";
  if (source.split(original).length !== 2) throw new Error("sailTo text not unique");
  const newSource = lookupJs + source.split(original).join(copy);
  const pageCopy = html.split(source).join(newSource);
  mkdirSync(EXT, { recursive: true });
  const copyPath = extPath(`k5-index-today-${process.pid}.html`);
  writeFileSync(copyPath, pageCopy);
  out.copySailTests = runNodeTests(["tests/03/engine/sail.test.mjs"], { MONSOON_INDEX: copyPath });
  rmSync(copyPath, { force: true });
  // new scripted cases, in the W1 copy (hand-worked expected values)
  const e = worldEngine("W1", { record: false });
  const setup = (port, month, patch = {}) => {
    AR.reset(e, "dhow", "normal", 1, false);
    vm.runInContext("Math.random = () => globalThis.__rng.next();", e.g);
    e.rng.queue.length = 0; e.rng.calls = 0;
    Object.assign(e.state, { currentPort: port, monthIndex: month, crewHealth: 100, hull: 100, cash: 1500 }, patch.state || {});
    for (const [g, q] of Object.entries(patch.cargo || {})) e.state.cargo[g] = q;
  };
  const cases = [];
  const run = (name, port, dest, month, patch, rolls, expect) => {
    setup(port, month, patch);
    const calc = e.g.computeTransit(e.lane(port, dest));
    const c0 = e.state.cash;
    e.rng.push(...rolls(calc));
    let threw = null;
    try { e.g.sailTo(dest); } catch (err) { threw = String(err.message || err); }
    const got = { port: e.state.currentPort, hull: e.state.hull, remaining: e.rng.remaining, calls: e.rng.calls, teak: e.state.cargo.teak, textiles: e.state.cargo.textiles, porcelain: e.state.cargo.porcelain, mutinies: e.state.mutinies, cashDrop: c0 - e.state.cash, threw };
    const want = expect(calc);
    const pass = !threw && Object.entries(want).every(([k, v]) => got[k] === v);
    cases.push({ name, leg: `${port}>${dest}`, month: MONTHS[month], status: calc.alignmentStatus, months: calc.months, pass, got, want });
    if (!pass && failFast) throw new Error("K5 case failed: " + name);
  };
  try {
    // (1) headwind leg in a high-tier monsoon month (Calicut -> Kilwa, June, AS high): turned back, then a storm
    run("storm on a headwind leg that turns back", "calicut", "kilwa", 5, {},
      c => { if (!c.isHeadwind || c.isDeadZone) throw new Error("case 1 leg is not a monsoon headwind"); return [0.5, 0.30, 0.10, 0.5]; },
      c => ({ port: "calicut", hull: 100 - 27 - 30, remaining: 0, calls: 4, cashDrop: 15 * c.months }));
    // (2) draw order on a monsoon headwind leg: headwind damage, turn-back, teak, storm roll, storm damage, piracy, mutiny
    run("draw order, headwind leg", "calicut", "kilwa", 5, { state: { crewHealth: 60 }, cargo: { teak: 2 } },
      () => [0.25, 0.9, 0.1, 0.2, 0.75, 0.99, 0.1],
      c => ({ port: "kilwa", hull: 100 - 24 - 34, teak: 1, mutinies: 1, remaining: 0, calls: 7, cashDrop: 15 * c.months + 30 }));
    // (3) draw order on a transition leg (Calicut -> Malacca, May, BoB mid 0.175): storm roll, storm damage, mildew, piracy, mutiny
    run("draw order, transition leg", "calicut", "malacca", 4, { state: { crewHealth: 60 }, cargo: { textiles: 3 } },
      c => { if (!c.isDeadZone) throw new Error("case 3 leg is not a transition leg"); return [0.1, 0.5, 0.2, 0.99, 0.1]; },
      c => ({ port: "malacca", hull: 70, textiles: 2, mutinies: 1, remaining: 0, calls: 5, cashDrop: 15 * c.months + 30 }));
    // (4) storm before porcelain: hull 75, a storm of 22 takes it to 53, so 2 of 10 crates break
    run("storm before the porcelain check", "calicut", "malacca", 4, { state: { hull: 75 }, cargo: { porcelain: 10 } },
      () => [0.1, 0.0, 0.99],
      c => ({ port: "malacca", hull: 53, porcelain: 8, remaining: 0, calls: 3, cashDrop: 15 * c.months }));
  } catch (err) {
    if (failFast) return { pass: false, cases, error: String(err.message || err) };
    cases.push({ name: "error", pass: false, error: String(err.message || err) });
  }
  const pass = out.engineSuites.pass && out.copySailTests.pass && cases.every(c => c.pass);
  return { pass, ...out, cases };
}
// K7: every arm reproduces the transit fixture.
function k7(failFast = false) {
  const res = {}, FIX = AR.FIX;
  for (const w of ["W0", "today", ...WORLDS.slice(1)]) {
    const e = worldEngine(w, { record: false });
    const rows = vm.runInContext("transitTable()", e.g);
    let same = 0;
    FIX.rows.forEach((r, i) => { const x = rows[i]; if (x && x.from === r.from && x.to === r.to && x.vessel === r.vessel && x.navigator === r.navigator && x.month === r.month && x.days === r.days && x.months === r.months && x.effSpeed === r.effSpeed && x.status === r.status) same++; });
    res[w] = `${same}/${FIX.rows.length}`;
    if ((same !== FIX.rows.length || rows.length !== FIX.rows.length) && failFast) return { pass: false, arms: res };
  }
  return { pass: Object.values(res).every(x => x === `${FIX.rows.length}/${FIX.rows.length}`), arms: res };
}

async function phaseChecks() {
  const checks = { provenance: provenance() };
  // ---- checksA: K8 (before), K3, K2, K4 ----
  capCheck("checksA", 0, 0);
  let t = blockStart("checksA");
  checks.K8 = { before: k8pre(), ...k8suites() };
  if (!checks.K8.before.monsoonIndexUnset) throw new Error("K8: MONSOON_INDEX is set");
  say("K8 (before)", JSON.stringify({ unset: checks.K8.before.monsoonIndexUnset, pinned: checks.K8.before.engineScriptPinned, suites: checks.K8.engineSuites.pass, planted: checks.K8.plantedDefects.pass }));
  checks.K3 = k3(); say("K3", checks.K3.pass);
  const e0 = loadEngine();
  checks.K2 = k2(e0); say("K2", checks.K2.pass);
  checks.K4 = k4(); say("K4", checks.K4.pass, checks.K4.cases, "cases");
  checks.lookup = dumpLookup();
  blockEnd("checksA", t);
  // ---- K1 ----
  const cuts = capCheck("K1", 0, 0);
  t = blockStart("K1");
  const eW0 = worldEngine("W0");
  const hashes = new Map();
  let doneCells = 0, projected = false;
  K1_PROGRESS = () => { doneCells++; if (!projected && doneCells >= 2) { projected = true; capCheck("K1", doneCells / 18, (Date.now() - t) / 60000); } };
  const r1 = k1(eW0, { normalOnly: cuts.includes(3), hashStore: hashes });
  const { rNormal, ...k1rest } = r1;
  checks.K1 = { ...k1rest, cut3: cuts.includes(3) };
  say("K1", checks.K1.pass, checks.K1.harnessNets, "H +", checks.K1.replanNets, "R +", checks.K1.offReplays, "off");
  blockEnd("K1", t);
  // ---- K1b ----
  capCheck("K1b", 0, 0);
  t = blockStart("K1b");
  checks.K1b = k1b({ w0Hashes: hashes });
  say("K1b", checks.K1b.pass, checks.K1b.harnessCampaigns, "campaigns,", checks.K1b.actionsCompared, "actions");
  blockEnd("K1b", t);
  // ---- checksB: K5, K7 ----
  capCheck("checksB", 0, 0);
  t = blockStart("checksB");
  checks.K5 = k5(); say("K5", checks.K5.pass);
  checks.K7 = k7(); say("K7", checks.K7.pass, JSON.stringify(checks.K7.arms));
  blockEnd("checksB", t);
  checks.allPass = ["K8", "K3", "K2", "K4", "K1", "K1b", "K5", "K7"].every(k => k === "K8" ? checks.K8.before.engineScriptPinned && checks.K8.engineSuites.pass && checks.K8.plantedDefects.pass : checks[k].pass);
  mergeChecks({ checksPhase: checks });
  writeExt("r-w0-normal-k1.json", rNormal);   // R's W0 exposure (K1's normal runs, seeds 200001-200300)
  say("checks phase: all pass =", checks.allPass);
}

// =========================================================================================
// PLANTS: each check against its planted defect, in a temporary clone (K8's too)
// =========================================================================================
const PLANTS = [
  { id: "K1", check: "K1", defect: "the W0 hook deducts 1 D at the first departure", subs: [["/*PLANT-K1*/", "if (rec.departures === 0) s.cash -= 1;"]] },
  { id: "K1b", check: "K1b", defect: "doldrum band width 0.24 in the copy", subs: [["        } else if (roll < stormThreshold + 0.25) {\n          state.cash -= 20;\n          eventNotes.push(\\`Becalmed", "        } else if (roll < stormThreshold + 0.24) {\n          state.cash -= 20;\n          eventNotes.push(\\`Becalmed"]] },
  { id: "K2a", check: "K2", defect: "Calicut–Malacca assigned to AS in the run's lookup", subs: [[`"calicut-malacca": "BoB"`, `"calicut-malacca": "AS"`]] },
  { id: "K2b", check: "K2", defect: "a reverse-leg lookup that falls back to none instead of throwing", subs: [["REGION[`${to}-${from}`] ?? throwUnknownLeg(from, to)", "REGION[`${to}-${from}`] ?? \"none\""]] },
  { id: "K3a", check: "K3", defect: "> for ≥ at 0.1 (AS August becomes none)", subs: [[`r >= 0.1 ? "L"`, `r > 0.1 ? "L"`]] },
  { id: "K3b", check: "K3", defect: "the SCS shift made one month later", subs: [["SCS[(m + 1) % 12]", "SCS[(m + 11) % 12]"]] },
  { id: "K3c", check: "K3", defect: "the peak taken over all regions", subs: [["  const peak = Math.max(...counts);", "  const peak = Math.max(...Object.values(COUNTS).flat());"]] },
  { id: "K4a", check: "K4", defect: "navigator factor applied twice", subs: [["const navP2000 = p2000 => p2000 * 18 / 35;", "const navP2000 = p2000 => p2000 * 18 / 35 * 18 / 35;"]] },
  { id: "K4b", check: "K4", defect: "a roll drawn when p = 0", subs: [["      } else if (stormP > 0) {\n        if (Math.random() < stormP) {", "      } else {\n        if (Math.random() < stormP) {"]] },
  { id: "K4c", check: "K4", defect: "<= for <", subs: [["        const stormThreshold = stormP;\n        if (roll < stormThreshold) {", "        const stormThreshold = stormP;\n        if (roll <= stormThreshold) {"], ["        if (Math.random() < stormP) {", "        if (Math.random() <= stormP) {"]] },
  { id: "K4d", check: "K4", defect: "doldrum band fixed at [0.35, 0.60) whatever p is", subs: [["        } else if (roll < stormThreshold + 0.25) {\n          state.cash -= 20;\n          eventNotes.push(\\`Becalmed", "        } else if (roll >= 0.35 && roll < 0.60) {\n          state.cash -= 20;\n          eventNotes.push(\\`Becalmed"]] },
  { id: "K5", check: "K5", defect: "the storm block moved after the porcelain check", subs: [["const STORM_AFTER_PORCELAIN = false;", "const STORM_AFTER_PORCELAIN = true;"]] },
  { id: "K7", check: "K7", defect: "a wrapper that marks high-tier months as isDeadZone (transit times change)", subs: [["  /*PLANT-K7*/", "  if (world !== \"W0\") vm.runInContext(`computeTransit = (() => { const o = computeTransit; return function (lane, mo = null) { const c = o(lane, mo); const m = (mo !== null ? mo : state.monthIndex) % 12; if (!c.isDeadZone && __ssStormP(lane.from, lane.to, m, false) >= 0.35) { const days = Math.round(c.days / 0.65); return { ...c, days, months: Math.max(1, Math.ceil(days / 30)), isDeadZone: true, isHeadwind: false, isTailwind: false, alignmentStatus: \"Dead Zone (35% Storm)\" }; } return c; }; })();`, e.g);"]] },
  { id: "K8a", check: "K8", defect: "index.html edited during a run (temporary clone)", subs: [["/*PLANT-K8a*/", "appendFileSync(INDEX, \"\\n<!-- K8 plant: modified during a run -->\\n\");"]], phase: "k8probe" },
  { id: "K8b", check: "K8", defect: "MONSOON_INDEX pointed at a copy (temporary clone)", subs: [], phase: "k8probe", env: "MONSOON_INDEX" },
  { id: "K10a", check: "K10a", defect: "RS's DP omits the wait action", subs: [["const WAIT_ACTION = true;", "const WAIT_ACTION = false;"]], after: "k10" },
  { id: "K10b", check: "K10b", defect: "c deducted from planning cash in RS's Sim", subs: [["    /*PLANT-K10b*/", "    this.cash -= Math.round(this.kappa10 * s / 10000);"]], after: "k10" },
  { id: "K10c", check: "K10c", defect: "the frontier evaluated without κ (S used at κ = 1)", subs: [["    const k10 = KAPPA10[ki];", "    const k10 = 10;"]], after: "k10" },
  { id: "K10d", check: "K10d", defect: "c divided by (months + 1) in HS's sail score", subs: [["const hsSail = (num, m, S, k10) => num / m - (k10 * S) / (10000 * m);", "const hsSail = (num, m, S, k10) => num / m - (k10 * S) / (10000 * (m + 1));"]], after: "k10" },
  // added after results were seen (§13, 2026-11-24, review of #55)
  { id: "A1", check: "A1", defect: "every broken lot counted as storm-caused (h >= 0)", subs: [["        if (h >= P.hazards.porcelainHullBelow) {", "        if (h >= 0) {"]], after: "review" },
  { id: "R1agg", check: "R1", defect: "T1 at the margin counted with m = 1 D in aggregate()", subs: [["    const f1 = flips(m);", "    const f1 = flips(1);"]], after: "review" },
  { id: "R1kstar", check: "R1", defect: "κ* scoring with T1 ≥ 5% instead of 10% in kstarOf()", subs: [["return t1 >= 0.10 && r.T2D >= m; });", "return t1 >= 0.05 && r.T2D >= m; });"]], after: "review" },
  // added after results were seen (§13, 2026-11-24, verification follow-up)
  { id: "S1mid", check: "S1", defect: "M1 mid-tier p 0.15 instead of 0.175", subs: [["  M1: { H: 700, M: 350, L: 140, N: 0 },", "  M1: { H: 700, M: 300, L: 140, N: 0 },"]], after: "sigmap" },
  { id: "S1month", check: "S1", defect: "expected exposure read one month late", subs: [["(a[0], a[1], a[2] % 12, false); }", "(a[0], a[1], (a[2] + 1) % 12, false); }"]], after: "sigmap" }
];
function makeClone() {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const dirty = spawnSync("git", ["status", "--porcelain", "--", "research/03/models/storm-seasons.mjs"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  if (dirty) throw new Error("storm-seasons.mjs has uncommitted changes; plants run on committed code only");
  const dir = extPath(`clone-${head.slice(0, 7)}`);
  if (!existsSync(dir)) {
    const r = spawnSync("git", ["clone", "-q", "--no-checkout", ROOT, dir], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("git clone failed: " + r.stderr);
    const c = spawnSync("git", ["-c", "core.autocrlf=false", "checkout", "-q", head], { cwd: dir, encoding: "utf8" });
    if (c.status !== 0) throw new Error("git checkout failed: " + c.stderr);
  }
  return { dir, head };
}
function runPlant(pl, clone, extraEnv = {}) {
  const src = readFileSync(path.join(clone.dir, "research/03/models/storm-seasons.mjs"), "utf8");
  if (sha256(src) !== SELF_SHA) throw new Error("the clone's storm-seasons.mjs differs from the running file");
  // Anchors are matched outside this PLANTS table (whose own text repeats them), exactly once each.
  const t0i = src.indexOf("const PLANTS = ["), t1i = src.indexOf("\n];\nfunction makeClone");
  if (t0i < 0 || t1i < 0) throw new Error("PLANTS table markers not found");
  let before = src.slice(0, t0i), after = src.slice(t1i);
  const table = src.slice(t0i, t1i);
  for (const [find, repl] of pl.subs) {
    const n = before.split(find).length - 1 + after.split(find).length - 1;
    if (n !== 1) throw new Error(`plant ${pl.id}: anchor found ${n} times`);
    before = before.split(find).join(repl); after = after.split(find).join(repl);
  }
  const planted = before + table + after;
  const file = path.join(clone.dir, "research/03/models", `storm-seasons-plant-${pl.id}.mjs`);
  writeFileSync(file, planted);
  const out = extPath(`plant-out-${pl.id}`), ext = extPath(`plant-ext-${pl.id}`);
  rmSync(out, { recursive: true, force: true }); rmSync(ext, { recursive: true, force: true });
  mkdirSync(out, { recursive: true }); mkdirSync(ext, { recursive: true });
  const env = { ...process.env, SS_OUT: out, SS_EXT: ext, SS_STATES: EXT, SS_RESULTS_IN: OUT, ...extraEnv };
  delete env.MONSOON_INDEX;
  if (pl.env === "MONSOON_INDEX") { const copy = path.join(ext, "index-copy.html"); copyFileSync(path.join(clone.dir, "projects/03/index.html"), copy); env.MONSOON_INDEX = copy; }
  const t0 = Date.now();
  const r = spawnSync(NODE, [file, pl.phase || "plantcheck", pl.check], { cwd: clone.dir, env, encoding: "utf8", maxBuffer: 64 << 20 });
  const sec = (Date.now() - t0) / 1000;
  const text = r.stdout + r.stderr;
  const m = /PLANTRESULT (\{.*\})/.exec(text);
  const res = m ? JSON.parse(m[1]) : null;
  let caught, how;
  if (pl.phase === "k8probe") {
    const wrote = existsSync(path.join(out, "k8probe.json"));
    caught = r.status !== 0 && !wrote;
    how = `exit ${r.status}; output written: ${wrote}; ${text.trim().split("\n").filter(l => /K8/.test(l)).slice(-1)[0] || ""}`;
  } else {
    caught = res !== null && res.pass === false;
    how = res ? `check ran; pass = ${res.pass}` : `no result (exit ${r.status}): ${text.trim().split("\n").slice(-2).join(" | ")}`;
  }
  rmSync(file, { force: true });
  // restore the clone's page (K8a's plant appends to it) and confirm it is the committed page again
  spawnSync("git", ["checkout", "-q", "--", "projects/03/index.html"], { cwd: clone.dir });
  const pageAfter = sha256(readFileSync(path.join(clone.dir, "projects/03/index.html")));
  if (pageAfter !== gameHash()) throw new Error(`plant ${pl.id}: the clone's page could not be restored`);
  if (pl.id === "K8control" && !text.includes(`page hash unchanged ${gameHash().slice(0, 12)}`)) how += " (control did NOT see the committed page)";
  return { id: pl.id, check: pl.check, defect: pl.defect, caught, how, seconds: +sec.toFixed(1), detail: res ? res.detail : null };
}
async function phasePlants(which) {
  const clone = makeClone();
  const t0 = Date.now();
  const rows = [];
  for (const pl of PLANTS.filter(p => which === "main" ? !p.after : p.after === which)) {
    const r = runPlant(pl, clone);
    rows.push(r);
    say("plant", pl.id, r.caught ? "CAUGHT" : "NOT CAUGHT", r.how, `${r.seconds}s`);
  }
  // control: the unplanted copy in the same clone passes the K8 probe (so the plant, not the probe, fails it)
  if (which === "main") {
    const ctl = runPlant({ id: "K8control", check: "K8", defect: "none (control)", subs: [], phase: "k8probe" }, clone);
    rows.push({ ...ctl, caught: null, control: true, controlPassed: ctl.how.startsWith("exit 0") && !ctl.how.includes("did NOT") });
    say("plant control (unplanted k8probe):", ctl.how);
  }
  const key = which === "k10" ? "plantsK10" : which === "review" ? "plantsPostReview" : which === "sigmap" ? "plantsS1" : "plants";
  const allCaught = rows.filter(r => !r.control).every(r => r.caught) && rows.filter(r => r.control).every(r => r.controlPassed);
  mergeChecks({ [key]: { clone: path.basename(clone.dir), commit: clone.head, minutes: +((Date.now() - t0) / 60000).toFixed(2), allCaught, rows } });
}
// A single check, fail-fast, for a planted copy. Prints PLANTRESULT.
async function phasePlantcheck(check) {
  let res;
  if (check === "K1") res = k1(worldEngine("W0"), { failFast: true });
  else if (check === "K1b") res = k1b({ failFast: true });
  else if (check === "K2") res = k2(loadEngine());
  else if (check === "K3") res = k3();
  else if (check === "K4") res = k4(true);
  else if (check === "K5") res = k5(true);
  else if (check === "K7") res = k7(true);
  else if (check.startsWith("K10")) res = await k10Checks({ only: check, failFast: true, statesDir: process.env.SS_STATES || EXT });
  else if (check === "A1" || check === "R1") res = await reviewChecks({ only: check, statesDir: process.env.SS_STATES || EXT });
  else if (check === "S1") res = s1SigmaP();
  else throw new Error("no plantcheck for " + check);
  const detail = res.failures && res.failures.length ? res.failures.slice(0, 2) : res.cases ? res.cases.filter(c => !c.pass).slice(0, 2) : res.arms || res.shares || [];
  console.log("PLANTRESULT " + JSON.stringify({ check, pass: res.pass, detail }));
}
async function phaseK8probe() {
  const e = worldEngine("W1");
  const r = harnessRun(e, "dhow", "normal", "avoidHeadwind", 999001);
  emit(outPath("k8probe.json"), JSON.stringify({ probe: true, steps: r.att.length }) + "\n");
}

// =========================================================================================
// EXPOSURE (H: W0-W5 normal, W0-W1 survival; R: W1 normal; expected exposure on R's paths)
// =========================================================================================
async function phaseExposure() {
  const checks = existsSync(outPath("checks.json")) ? readJSONFile(outPath("checks.json")) : {};
  if (!DEV && !checks.checksPhase?.allPass) throw new Error("checks phase has not passed");
  if (!DEV && !checks.plants?.allCaught) throw new Error("not every K1-K8 plant was caught");
  const H = [];
  // ---- H runs ----
  capCheck("expH", 0, 0);
  let t = blockStart("expH");
  const hRuns = [...WORLDS.map(w => [w, "normal"]), ["W0", "survival"], ["W1", "survival"]];
  const total = hRuns.length * CELLS.length * N_SEEDS;
  let done = 0, projected = false;
  const hStates = [];
  for (const [w, diff] of hRuns) {
    const e = worldEngine(w);
    for (const { v, pol } of CELLS) {
      const camp = [];
      e.rec.wantStates = w === "W1" && diff === "normal";
      for (let i = 0; i < DEV_LIMIT; i++) {
        const seed = SEED0 + i;
        const r = harnessRun(e, v, diff, pol, seed);
        camp.push(compactCampaign(r, seed));
        if (r.hstates) hStates.push({ v, pol, seed, states: r.hstates });
        done++;
        if (!projected && done >= total / 10) { projected = true; capCheck("expH", done / total, (Date.now() - t) / 60000); }
      }
      e.rec.wantStates = false;
      H.push({ world: w, player: "H", diff, v, pol, seeds: `${SEED0}–${SEED0 + N_SEEDS - 1}`, camp });
      beat(() => `H ${w} ${diff} ${v}/${pol}`);
    }
    say("H world done", w, diff);
  }
  blockEnd("expH", t);
  // ---- R runs (W1 normal), recording RS states for the first 20 seeds of each cell ----
  capCheck("expR", 0, 0);
  t = blockStart("expR");
  const R = [], rsStates = [];
  const e = worldEngine("W1");
  done = 0; projected = false;
  for (const { v, pol } of CELLS) {
    const camp = [];
    for (let i = 0; i < DEV_LIMIT; i++) {
      const seed = SEED0 + i;
      const rec = i < 20 ? [] : null;
      const r = replanRun(e, v, "normal", pol, "greedy", seed, rec ? s0 => rec.push(stateFields(s0)) : null);
      camp.push(compactCampaign(r, seed));
      if (rec) rsStates.push({ v, pol, seed, idx: i, states: rec });
      done++;
      if (!projected && done >= 180) { projected = true; capCheck("expR", done / 1800, (Date.now() - t) / 60000); }
      beat(() => `R W1 ${v}/${pol} seed ${seed}`);
    }
    R.push({ world: "W1", player: "R", diff: "normal", v, pol, seeds: `${SEED0}–${SEED0 + N_SEEDS - 1}`, camp });
    say("R W1 cell done", v, pol);
  }
  blockEnd("expR", t);
  // ---- expected exposure and the outputs ----
  capCheck("expected", 0, 0);
  t = blockStart("expected");
  const rW0 = DEV && !existsSync(extPath("r-w0-normal-k1.json")) ? null : readJSONFile(extPath("r-w0-normal-k1.json"));
  if (rW0) for (const { v, pol } of CELLS) R.unshift({ world: "W0", player: "R", diff: "normal", v, pol, seeds: `${K1_SEED0}–${K1_SEED0 + N_SEEDS - 1} (K1)`, camp: rW0.filter(c => c.v === v && c.pol === pol) });
  const groups = [...H, ...R];
  const expRows = [], campRows = [], porcRows = [];
  const pOf = expectedP;
  const regionCol = (world, a) => world === "W5" && (W5_MIX[`${a[0]}-${a[1]}`] || W5_MIX[`${a[1]}-${a[0]}`]) ? "mix" : regionOf(a[0], a[1]);
  const addExposure = (world, player, g, realised) => {
    const agg = new Map();
    for (const c of g.camp) for (const a of c.att) {
      const k = `${a[0]}>${a[1]}|${a[2] % 12}|${a[3]}`;
      const x = agg.get(k) || { attempts: 0, storms: 0, stormsTB: 0, expected: 0, a };
      x.attempts++; x.storms += a[4]; x.stormsTB += a[4] && a[5] ? 1 : 0; x.expected += pOf(world, a);
      agg.set(k, x);
    }
    for (const [k, x] of [...agg].sort()) {
      const [leg, m, w] = k.split("|");
      expRows.push({ world, player, difficulty: g.diff, vessel: g.v, policy: g.pol, leg, month: MONTHS[+m], region: regionCol(world, x.a), wind: w,
        attempts: x.attempts, storms: realised ? x.storms : null, stormsTB: realised ? x.stormsTB : null, expected: +x.expected.toFixed(4) });
    }
  };
  for (const g of groups) addExposure(g.world, g.player, g, true);
  for (const g of R.filter(g => g.world === "W1")) for (const w of ["W2", "W3", "W4", "W5"]) addExposure(w, "R", { ...g, world: w }, false);
  const boot = makeBoot();
  for (const g of groups) {
    const nets = g.camp.map(c => c.net), storms = g.camp.map(c => c.storms), exp = g.camp.map(c => c.att.reduce((a, x) => a + pOf(g.world, x), 0));
    const deps = Array(12).fill(0), lanes = Object.fromEntries(P.lanes.map(l => [`${l.from}>${l.to}`, 0]));
    for (const c of g.camp) for (const a of c.att) { deps[a[2] % 12]++; lanes[`${a[0]}>${a[1]}`]++; }
    const sum = k => g.camp.reduce((a, c) => a + c[k], 0), n = g.camp.length;
    const bn = boot(nets), bs = boot(storms);
    const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length, sd = xs => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1)); };
    campRows.push({ world: g.world, player: g.player, difficulty: g.diff, vessel: g.v, policy: g.pol, seeds: g.seeds, n,
      netMean: +mean(nets).toFixed(1), netLo: bn.lo, netHi: bn.hi, netMedian: quant(nets, 0.5), netSD: +sd(nets).toFixed(1), netP10: quant(nets, 0.1), netP90: quant(nets, 0.9), netMin: Math.min(...nets),
      stormsMean: +mean(storms).toFixed(4), stormsLo: bs.lo, stormsHi: bs.hi, stormsP10: quant(storms, 0.1), stormsP90: quant(storms, 0.9), stormsTBPerCampaign: +(sum("stormsTB") / n).toFixed(4),
      expectedStormsMean: +mean(exp).toFixed(4), attemptsPerCampaign: +(g.camp.reduce((a, c) => a + c.att.length, 0) / n).toFixed(3),
      waits: +(sum("waits") / n).toFixed(3), repairs: +(sum("repairs") / n).toFixed(3), mutinies: +(sum("mutinies") / n).toFixed(4), turnbacks: +(sum("turnbacks") / n).toFixed(4),
      transitionLegs: +(sum("deadLegs") / n).toFixed(3), doldrumsPerTransitionLeg: sum("deadLegs") ? +(sum("doldrums") / sum("deadLegs")).toFixed(4) : null,
      departuresByMonth: deps.join("/"), legsByLane: Object.values(lanes).join("/") });
    const val = g.camp.map(c => c.porc.value), lots = g.camp.map(c => c.porc.lots);
    const bv = boot(val), med = quant(nets, 0.5);
    porcRows.push({ world: g.world, player: g.player, difficulty: g.diff, vessel: g.v, policy: g.pol, n,
      shareAnyStormLoss: +(val.filter(x => x > 0).length / n).toFixed(4), lotsMean: +mean(lots).toFixed(4), valueMean: +mean(val).toFixed(2), valueLo: bv.lo, valueHi: bv.hi,
      valueP10: quant(val, 0.1), valueP90: quant(val, 0.9), valueP99: quant(val, 0.99), valueMax: Math.max(...val), medianNet: med,
      p99OverMedianNet: med > 0 ? +(quant(val, 0.99) / med).toFixed(6) : null, anyCauseLotsMean: +mean(g.camp.map(c => c.porc.brokenAll)).toFixed(4) });
  }
  // §13 item 14: per cell if under 400 KB; otherwise aggregated over policies, the per-cell file to the archive
  const perCell = csvString(expRows);
  let exposureNote;
  if (Buffer.byteLength(perCell) < 400 * 1024) { emit(outPath("exposure.csv"), perCell); exposureNote = "per cell"; }
  else {
    const agg = new Map();
    for (const r of expRows) {
      const k = [r.world, r.player, r.difficulty, r.vessel, r.leg, r.month, r.region, r.wind].join("|");
      const x = agg.get(k) || { ...r, policy: "all", attempts: 0, storms: r.storms === null ? null : 0, stormsTB: r.stormsTB === null ? null : 0, expected: 0 };
      x.attempts += r.attempts;
      if (x.storms !== null) { x.storms += r.storms; x.stormsTB += r.stormsTB; }
      x.expected = +(x.expected + r.expected).toFixed(4);
      agg.set(k, x);
    }
    emit(outPath("exposure.csv"), csvString([...agg.values()]));
    emit(extPath("exposure-per-cell.csv"), perCell);
    exposureNote = `aggregated over policies; the per-cell file (${Buffer.byteLength(perCell)} bytes) is exposure-per-cell.csv in the archive`;
  }
  writeCSV("campaigns.csv", campRows);
  writeCSV("porcelain.csv", porcRows);
  const manifest = [writeExt("h-campaigns.json", H), writeExt("r-campaigns.json", R), writeExt("rs-states.json", rsStates), writeExt("hs-states.json", hStates)];
  emit(extPath("exposure-manifest.json"), JSON.stringify({ exposureCsv: exposureNote, files: manifest }, null, 1));
  blockEnd("expected", t);
  say("exposure phase: outputs held for the hash check;", expRows.length, "exposure rows,", rsStates.reduce((a, c) => a + c.states.length, 0), "RS visits,", hStates.reduce((a, c) => a + c.states.length, 0), "HS visits");
}
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
const mulberry32 = seed => { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// Seed-level percentile bootstrap of the mean: 10,000 resamples, bootstrap seed 20261124 (§6).
function makeBoot() {
  const cache = new Map();
  const idx = n => {
    if (!cache.has(n)) { const r = mulberry32(BOOT_SEED), a = new Uint32Array(BOOT_N * n); for (let i = 0; i < a.length; i++) a[i] = Math.floor(r() * n); cache.set(n, a); }
    return cache.get(n);
  };
  return xs => {
    const n = xs.length, ix = idx(n), means = new Float64Array(BOOT_N);
    for (let b = 0; b < BOOT_N; b++) { let s = 0; for (let i = 0; i < n; i++) s += xs[ix[b * n + i]]; means[b] = s / n; }
    means.sort();
    return { lo: +means[Math.floor(0.025 * (BOOT_N - 1))].toFixed(4), hi: +means[Math.floor(0.975 * (BOOT_N - 1))].toFixed(4) };
  };
}

// =========================================================================================
// RS: R's DP with Σc in a separate ledger and Pareto dominance on (planning cash, S) (§4)
// =========================================================================================
class SimRS extends AR.Sim {
  constructor(v, diff, costSet) { super(v, diff); this.S = 0; this.costSet = costSet; this.kappa10 = 0; }
  static from(f, v, diff, costSet) {
    const s = new SimRS(v, diff, costSet);
    Object.assign(s, { port: f.port, t: f.t, cash: f.cash, debt: f.debt, equity: f.equity, hull: f.hull, crew: f.crew, ended: false, dias: { ...f.dias }, cargo: { ...f.cargo } });
    return s;
  }
  clone() { const s = Object.create(SimRS.prototype); Object.assign(s, this, { cargo: { ...this.cargo }, dias: { ...this.dias }, log: this.log ? [...this.log] : null }); return s; }
  sail(dest) {
    const [, status] = transit(this.port, dest, this.v, this.t);
    const s = legS(this.costSet, this.port, dest, this.t, status, this.v, this.diff);
    if (this.log) this.log.push({ kind: "leg", from: this.port, to: dest, month: this.t });
    this.S += s;
    /*PLANT-K10b*/
    super.sail(dest);
  }
}
const WAIT_ACTION = true;
// root: "all" | "wait" (wait first) | "nowait" (no wait at the root) | a path (that delivery first)
// kappa10: null = the κ-free frontier solve (dominance on S); a number = the per-κ DP (dominance on κ10 × S)
function solveRS(start, pol, fill, { root = "all", kappa10 = null } = {}) {
  const key = (p, t) => `${p}|${t}`;
  const nodes = new Map();
  const rootL = { s: start, prev: null, act: null, first: null };
  nodes.set(key(start.port, start.t), [rootL]);
  const terms = [];
  let kept = 1;
  const w = kappa10 === null ? 1 : kappa10;
  const rootPath = Array.isArray(root) ? root.join(">") : null;
  const push = (s, prev, act) => {
    const L = { s, prev, act, first: prev.act === null ? act : prev.first };
    if (s.ended) { terms.push(L); return; }
    const k = key(s.port, s.t), list = nodes.get(k);
    if (!list) { nodes.set(k, [L]); kept++; return; }
    const c = s.cash, S = w * s.S;
    for (const o of list) if (o.s.cash >= c && w * o.s.S <= S) return;   // dominated; ties keep the first
    const next = list.filter(o => !(c >= o.s.cash && S <= w * o.s.S));
    next.push(L); nodes.set(k, next); kept++;
  };
  for (let t = start.t; t < P.campaignMonths; t++) for (const p of PORTS) {
    const list = nodes.get(key(p, t));
    if (!list) continue;
    for (const node of list) {
      const atRoot = node === rootL;
      if (WAIT_ACTION && (!atRoot || root === "all" || root === "wait")) { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); }
      if (atRoot && root === "wait") continue;
      for (const pth of PATHS[p]) {
        if (atRoot && rootPath !== null && pth.join(">") !== rootPath) continue;
        if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue;
        const s = node.s.clone(); s.log = null;
        if (!AR.deliver(s, pth, pol, fill)) continue;
        push(s, node, ["deliver", pth]);
      }
    }
  }
  return { terms, kept };
}
const actKey = a => a === null ? null : a[0] === "wait" ? "wait" : a[1].join(">");
const chain = L => { const acts = []; for (let n = L; n && n.act; n = n.prev) acts.unshift(n.act); return acts; };
function bestAt(terms, k10) {
  let best = null, bq = 0;
  for (const L of terms) { const q = L.s.net * 10000 - k10 * L.s.S; if (best === null || q > bq) { best = L; bq = q; } }
  return best ? { L: best, q: bq } : null;
}
function frontier(terms) {
  const out = [];
  for (let ki = 0; ki < KAPPA10.length; ki++) {
    const k10 = KAPPA10[ki];
    let best = null, bq = 0;
    for (const L of terms) { const q = L.s.net * 10000 - k10 * L.s.S; if (best === null || q > bq) { best = L; bq = q; } }
    out.push(best ? { L: best, q: bq } : null);
  }
  return out;
}
function execPlan(st, v, pol, acts, kappa10) {
  const s = SimRS.from(st, v, "normal", "new"); s.kappa10 = kappa10; s.log = [];
  for (const a of acts) { if (s.ended) break; if (a[0] === "wait") s.wait(); else AR.deliver(s, a[1], pol, "greedy"); }
  return s;
}
// Independent Σc of a plan's legs (K10b): the K3 rebuild and the §2.4 fixture, not the run's lookup.
function independentS(log, v) {
  const reb = k3Rebuild(), idx = { H: 0, M: 1, L: 2, N: 3 };
  let S = 0;
  for (const x of log) if (x.kind === "leg") {
    const sea = (FIX_K2[`${x.from}|${x.to}`] || FIX_K2[`${x.to}|${x.from}`]).region;
    const p = FIX_P.M1[0][idx[reb[sea].t[x.month % 12]]];
    S += Math.round(p * 2000) * 15 * P.vessels[v].damageMult;
  }
  return S;
}
function loadStates(dir) {
  const rs = readJSONFile(path.join(dir, "rs-states.json"));
  const visits = [];
  for (const c of rs) c.states.forEach((st, j) => visits.push({ v: c.v, pol: c.pol, seed: c.seed, idx: c.idx, j, st }));
  return visits;
}
const stKey = (v, pol, st) => JSON.stringify([v, pol, st.port, st.t, st.cash, st.debt, st.equity, st.hull, st.crew, PORTS.map(p => st.dias[p]), GOODS.map(g => st.cargo[g])]);

// =========================================================================================
// HS: storm-aware myopic scores at H's states (§5.2)
// =========================================================================================
const hsSail = (num, m, S, k10) => num / m - (k10 * S) / (10000 * m);
const hsWait = (num, m, S, feeWages, k10) => (num - (k10 * S) / 10000 - feeWages) / (m + 1);
function hsOptions(e, v, pol, st) {
  const s = e.state;
  Object.assign(s, { vesselKey: v, diffKey: "normal", currentPort: st.port, monthIndex: st.t, cash: st.cash, debt: st.debt, hull: st.hull, crewHealth: st.crew, ended: false });
  s.diaspora = { ...st.dias };
  for (const g of GOODS) s.cargo[g] = 0;
  s.specialists = { navigator: false, marines: false, tarpaulins: false };
  const plans = () => {
    let ps = e.SEA_LANES.filter(l => l.from === s.currentPort).map(l => e.g.harnessPlan(l));
    if (pol !== "sailAlways") ps = ps.filter(p => !p.calc.isHeadwind);
    if (pol === "avoidHeadwindAndTransition") ps = ps.filter(p => !p.calc.isDeadZone);
    const month = s.monthIndex % 12;
    return ps.map(p => ({ to: p.lane.to, m: p.calc.months, num: Math.round(p.perMonth * p.calc.months),
      Snew: legS("new", p.lane.from, p.lane.to, month, p.calc.alignmentStatus, v, "normal"), Sold: legS("old", p.lane.from, p.lane.to, month, p.calc.alignmentStatus, v, "normal") }));
  };
  const now = plans();
  let wait = null;
  if (st.t + 1 < P.campaignMonths) {
    const fee = e.g.getEffectiveLayoverFee(st.port), wages = e.VESSELS[v].upkeep;
    const saved = { monthIndex: s.monthIndex, cash: s.cash, dias: { ...s.diaspora } };
    s.monthIndex = st.t + 1; s.cash = st.cash - fee - wages; s.diaspora[st.port] = Math.min(100, (s.diaspora[st.port] || 0) + 15);
    const next = plans();
    s.monthIndex = saved.monthIndex; s.cash = saved.cash; s.diaspora = saved.dias;
    wait = { feeWages: fee + wages, next };
  }
  return { now, wait, waitOnlyFee: wait ? wait.feeWages : e.g.getEffectiveLayoverFee(st.port) + e.VESSELS[v].upkeep };
}
// HS's choice under one cost set at one κ: the best lane by score (H's stable order), or wait if strictly higher.
function hsChoose(o, set, k10, allowWait = true) {
  const S = x => set === "new" ? x.Snew : set === "old" ? x.Sold : 0;
  const sails = o.now.map(x => ({ x, score: hsSail(x.num, x.m, S(x), k10) })).sort((a, b) => b.score - a.score);
  let w = null;
  if (allowWait && o.wait && o.wait.next.length) {
    const nb = o.wait.next.map(x => ({ x, score: hsSail(x.num, x.m, S(x), k10) })).sort((a, b) => b.score - a.score)[0].x;
    w = { act: "wait", next: nb.to, months: nb.m + 1, score: hsWait(nb.num, nb.m, S(nb), o.wait.feeWages, k10), qabs: nb.num - k10 * S(nb) / 10000 - o.wait.feeWages };
  }
  const best = sails[0] ? { act: sails[0].x.to, next: sails[0].x.to, months: sails[0].x.m, score: sails[0].score, qabs: sails[0].x.num - k10 * S(sails[0].x) / 10000 } : null;
  const maxSailQabs = o.now.length ? Math.max(...o.now.map(x => x.num - k10 * S(x) / 10000)) : null;
  const choice = best && (!w || !(w.score > best.score)) ? best : w || { act: "wait", next: null, months: 1, score: null, qabs: null };
  return { choice, sails, w, maxSailQabs };
}
function hsValue(o, set, k10, act) {           // HS's own score for action act under one cost set
  const r = hsChoose(o, set, k10, true);
  if (act === "wait") return r.w ? r.w.score : null;
  const s = r.sails.find(x => x.x.to === act);
  return s ? s.score : null;
}
// K10d (i): an independent evaluation of §5.2's formulas, in planning terms (adaptive-routes prices
// and transit, the params file, and the protocol's tables), at a scripted state.
function hsIndependent(v, pol, st, k10) {
  const V = P.vessels[v], reb = k3Rebuild(), idx = { H: 0, M: 1, L: 2, N: 3 };
  const tariff = (port, sd) => Math.max(P.standing.tariffFloor, P.ports[port].tariff - (sd >= P.standing.tariffCutAt ? P.standing.tariffCut : 0));
  const fee = (port, sd) => { let m = 1; for (const [lim, f] of P.standing.feeTiers) if (sd >= lim) { m = f; break; } return Math.round(P.ports[port].fee * m); };
  const pNew = (from, to, t) => FIX_P.M1[0][idx[reb[(FIX_K2[`${from}|${to}`] || FIX_K2[`${to}|${from}`]).region].t[t % 12]]];
  const lanePlan = (port, t, cash, dias) => P.lanes.filter(l => l.from === port).map(l => {
    const [m, status] = transit(l.from, l.to, v, t);
    const arr = Math.min(23, t + m), tr = tariff(port, dias[port] || 0);
    const items = GOODS.map(g => { const cost = Math.round(AR.price(g, port, t) * (1 + tr)); const sale = AR.price(g, l.to, arr); return { g, cost, sale, ratio: sale / cost }; }).filter(x => x.ratio > 1).sort((a, b) => b.ratio - a.ratio);
    let c = Math.max(0, cash - 60), tons = 0, gross = 0;
    for (const x of items) { const q = Math.min(Math.floor((V.capacity - tons) / P.goods[x.g].weight), Math.floor(c / x.cost)); if (q > 0) { c -= q * x.cost; tons += q * P.goods[x.g].weight; gross += q * (x.sale - x.cost); } }
    return { to: l.to, m, status, gross, cNew: pNew(l.from, l.to, t) * 30 * V.damageMult * k10 / 10, cOld: (isDead(status) ? 0.35 : 0) * 30 * V.damageMult * k10 / 10 };
  }).filter(x => pol === "sailAlways" ? true : !x.status.startsWith("Headwind") && !(pol === "avoidHeadwindAndTransition" && x.status.startsWith("Dead Zone")));
  const now = lanePlan(st.port, st.t, st.cash, st.dias);
  const fw = fee(st.port, st.dias[st.port] || 0) + V.wages;
  const dias2 = { ...st.dias, [st.port]: Math.min(100, (st.dias[st.port] || 0) + 15) };
  const next = lanePlan(st.port, st.t + 1, st.cash - fw, dias2);
  const out = {};
  for (const set of ["new", "old"]) {
    const c = x => set === "new" ? x.cNew : x.cOld;
    out[set] = { sail: Object.fromEntries(now.map(x => [x.to, (x.gross - V.wages * x.m - c(x)) / x.m])) };
    const nb = next.map(x => ({ x, s: (x.gross - V.wages * x.m - c(x)) / x.m })).sort((a, b) => b.s - a.s)[0];
    out[set].wait = nb ? (nb.x.gross - V.wages * nb.x.m - c(nb.x) - fw) / (nb.x.m + 1) : null;
  }
  return out;
}

// =========================================================================================
// K10a-d
// =========================================================================================
async function k10Checks({ only = null, failFast = false, statesDir = EXT, cache = null, timer = { ms: 0 } } = {}) {
  const visits = loadStates(statesDir);
  const distinct = new Map();
  for (const x of visits) { const k = stKey(x.v, x.pol, x.st); if (!distinct.has(k)) distinct.set(k, x); }
  const D = [...distinct.values()];
  const res = {};
  const want = id => !only || only === id;
  // K10a: RS's per-κ DP at κ = 0 equals R's solve (first action, plan, net) on every RS state
  if (want("K10a")) {
    const f = [];
    for (const x of D) {
      const sR = AR.solve(Object.assign(new AR.Sim(x.v, "normal"), { ...x.st, ended: false, dias: { ...x.st.dias }, cargo: { ...x.st.cargo } }), x.pol, "greedy");
      const b = bestAt(solveRS(SimRS.from(x.st, x.v, "normal", "new"), x.pol, "greedy", { kappa10: 0 }).terms, 0);
      const ra = sR.acts.map(actKey), ba = b ? chain(b.L).map(actKey) : [];
      if (!b || sR.net !== b.L.s.net || mismatch(ra, ba)) { f.push({ cell: [x.v, x.pol], seed: x.seed, j: x.j, rNet: sR.net, rsNet: b && b.L.s.net, rFirst: ra[0], rsFirst: ba[0] }); if (failFast) break; }
    }
    res.K10a = { pass: f.length === 0, states: D.length, failures: f.slice(0, 10) };
    if (failFast && f.length) return { pass: false, failures: f, ...res };
  }
  // K10b: liquidity invariant at κ = 1,200 on every RS state (the F_new solve is cached for the sweep)
  if (want("K10b")) {
    const f = [];
    for (const x of D) {
      const ts = Date.now();
      const sol = solveRS(SimRS.from(x.st, x.v, "normal", "new"), x.pol, "greedy");
      const F = frontier(sol.terms);
      timer.ms += Date.now() - ts;
      if (cache) cache.set(stKey(x.v, x.pol, x.st), packFrontier(F, sol.kept));
      const b = F[KAPPA.indexOf(1200)];
      const acts = chain(b.L);
      const a = execPlan(x.st, x.v, x.pol, acts, 12000), z = execPlan(x.st, x.v, x.pol, acts, 0);
      const endA = { ended: a.ended, month: a.t, ruin: a.ended && a.t < P.campaignMonths }, endZ = { ended: z.ended, month: z.t, ruin: z.ended && z.t < P.campaignMonths };
      const Sind = independentS(z.log, x.v);
      const qOk = b.q === z.net * 10000 - 12000 * Sind && z.net === b.L.s.net;
      if (mismatch(a.log, z.log) || mismatch(endA, endZ) || !qOk) { f.push({ cell: [x.v, x.pol], seed: x.seed, j: x.j, logsEqual: !mismatch(a.log, z.log), endEqual: !mismatch(endA, endZ), qOk }); if (failFast) break; }
      beat(() => `K10b ${f.length} failures`);
    }
    res.K10b = { pass: f.length === 0, states: D.length, failures: f.slice(0, 10) };
    if (failFast && f.length) return { pass: false, failures: f, ...res };
  }
  // K10c: the frontier against the per-κ DP on the first 300 RS states, at κ = 2.4, 120 and 1,200
  if (want("K10c")) {
    const f = [];
    const first = visits.slice(0, 300);
    for (const x of first) {
      const F = frontier(solveRS(SimRS.from(x.st, x.v, "normal", "new"), x.pol, "greedy").terms);
      for (const k of [2.4, 120, 1200]) {
        const ki = KAPPA.indexOf(k), k10 = KAPPA10[ki];
        const b = bestAt(solveRS(SimRS.from(x.st, x.v, "normal", "new"), x.pol, "greedy", { kappa10: k10 }).terms, k10);
        if (actKey(F[ki].L.first) !== actKey(b.L.first) || F[ki].q !== b.q) { f.push({ cell: [x.v, x.pol], seed: x.seed, j: x.j, kappa: k, frontier: [actKey(F[ki].L.first), F[ki].q], perKappa: [actKey(b.L.first), b.q] }); if (failFast) break; }
      }
      if (failFast && f.length) break;
    }
    res.K10c = { pass: f.length === 0, states: first.length, failures: f.slice(0, 10) };
    if (failFast && f.length) return { pass: false, failures: f, ...res };
  }
  // K10d: HS scores
  if (want("K10d")) {
    const f = [], e = loadEngine();
    const scripted = { port: "malacca", t: 6, cash: 3000, debt: 0, hull: 100, crew: 100, dias: { kilwa: 0, aden: 0, calicut: 10, malacca: 5, quanzhou: 0 } };
    const k10 = KAPPA10[KAPPA.indexOf(120)], cases = [];
    for (const { v, pol } of CELLS) {
      const o = hsOptions(e, v, pol, scripted), ind = hsIndependent(v, pol, scripted, k10);
      for (const set of ["new", "old"]) {
        for (const x of o.now) { const got = hsValue(o, set, k10, x.to), want_ = ind[set].sail[x.to]; cases.push({ v, pol, set, act: x.to, got, want: want_ }); if (!(Math.abs(got - want_) <= 1e-9)) f.push(cases.at(-1)); }
        const gw = hsValue(o, set, k10, "wait"); cases.push({ v, pol, set, act: "wait", got: gw, want: ind[set].wait });
        if (!(gw === null && ind[set].wait === null) && !(Math.abs(gw - ind[set].wait) <= 1e-9)) f.push(cases.at(-1));
      }
    }
    // (ii) HS at κ = 0 with waiting disabled decides as H on every H state
    const hs = readJSONFile(path.join(statesDir, "hs-states.json"));
    let n = 0, diff = 0;
    for (const c of hs) for (const st of c.states) {
      if (st.act === null) continue;
      const o = hsOptions(e, c.v, c.pol, st);
      const ch = hsChoose(o, "zero", 0, false).choice.act;
      n++;
      if (ch !== st.act) { diff++; if (f.length < 10) f.push({ cell: [c.v, c.pol], seed: c.seed, t: st.t, hs: ch, h: st.act }); if (failFast) break; }
    }
    res.K10d = { pass: f.length === 0, scriptedCases: cases.length, scriptedSample: cases.slice(0, 6), hStates: n, hDisagreements: diff, failures: f.slice(0, 10) };
    if (failFast && f.length) return { pass: false, failures: f, ...res };
  }
  return { pass: Object.values(res).every(r => r.pass), failures: Object.values(res).flatMap(r => r.failures), ...res, distinctStates: D.length, visits: visits.length };
}
function packFrontier(F, kept) {
  return { kept, k: F.map(b => b && { first: actKey(b.L.first), q: b.q, net: b.L.s.net, S: b.L.s.S, plan: chain(b.L).map(actKey) }) };
}
async function phaseK10() {
  const checks = existsSync(outPath("checks.json")) ? readJSONFile(outPath("checks.json")) : {};
  if (!DEV && (!checks.checksPhase?.allPass || !checks.plants?.allCaught)) throw new Error("earlier checks have not passed");
  capCheck("K10", 0, 0);
  const t = blockStart("K10");
  const cache = new Map();
  const timer = { ms: 0 };
  const r = await k10Checks({ cache, timer });
  writeExt("fnew-cache.json", [...cache]);
  const minutes = (Date.now() - t) / 60000;
  // §13 interpretation: the F_new solves done in K10b are the sweep's F_new (κ-free, deterministic),
  // computed once and cached; their time is charged to the RS sweep block, whose §5.4 estimate includes them.
  const fnewMin = timer.ms / 60000;
  blockEnd("K10", t, { fnewMinutesChargedToSweep: +fnewMin.toFixed(2) });
  const L = ledger(); L.blocks.K10.min = minutes - fnewMin; L.blocks.K10.wallMinutes = +minutes.toFixed(2); L.fnewMinutes = fnewMin; saveLedger(L);
  mergeChecks({ K10: r });
  say("K10", JSON.stringify({ a: r.K10a.pass, b: r.K10b.pass, c: r.K10c.pass, d: r.K10d.pass, distinct: r.distinctStates, visits: r.visits, fnewMin: +fnewMin.toFixed(2) }));
}

// =========================================================================================
// THE κ SWEEP
// =========================================================================================
function rsState(x, cachedFnew, withT3b) {
  const S0 = set => SimRS.from(x.st, x.v, "normal", set);
  const ev = (set, root) => frontier(solveRS(S0(set), x.pol, "greedy", { root }).terms);
  const Fn = cachedFnew.k;
  const Fo = frontier(solveRS(S0("old"), x.pol, "greedy").terms);
  const Wn = ev("new", "wait");
  const Nn = withT3b ? ev("new", "nowait") : null, Wo = withT3b ? ev("old", "wait") : null, No = withT3b ? ev("old", "nowait") : null;
  const dPaths = new Map();
  let d = 0;
  const qOf = (F, ki) => F[ki] ? F[ki].q : null;
  const per = KAPPA.map((_, ki) => {
    const aN = Fn[ki].first, aO = actKey(Fo[ki].L.first);
    let qNO;
    if (aO === aN) qNO = Fn[ki].q;
    else if (aO === "wait") qNO = qOf(Wn, ki);
    else {
      if (!dPaths.has(aO)) { const pth = aO.split(">"); const F = ev("new", pth); dPaths.set(aO, F); if (!F.every(b => b && b.L.prev && b.L.prev.act === null && b.L.act && b.L.s.ended)) d++; }
      qNO = qOf(dPaths.get(aO), ki);
    }
    const planN = Fn[ki].plan, planO = chain(Fo[ki].L).map(actKey);
    const firstDel = plan => plan.find(a => a !== "wait") || null;
    const seq = plan => plan.filter(a => a !== "wait").join("|");
    return { aN, aO, qNA: Fn[ki].q, qNO, waitN: aN === "wait", waitO: aO === "wait",
      t3b: withT3b && qOf(Nn, ki) !== null && qOf(Wn, ki) !== null && qOf(No, ki) !== null && qOf(Wo, ki) !== null ? ((qOf(Wn, ki) - qOf(Nn, ki)) - (qOf(Wo, ki) - qOf(No, ki))) / 10000 : null,
      delN: firstDel(planN), delO: firstDel(planO), seqDiff: seq(planN) !== seq(planO), planNetChange: Fn[ki].net - Fo[ki].L.s.net };
  });
  return { per, d, Rnet: null };
}
async function phaseSweep() {
  const checks = existsSync(outPath("checks.json")) ? readJSONFile(outPath("checks.json")) : {};
  if (!DEV && (!checks.K10?.pass || !checks.plantsK10?.allCaught)) throw new Error("K10 or its plants have not passed");
  const visits = loadStates(EXT);
  const cache = new Map(readJSONFile(extPath("fnew-cache.json")));
  let cuts = capCheck("sweepRS", 0, 0);
  const rows = [], detail = [];
  if (!cuts.includes(4)) {
    const t = blockStart("sweepRS");
    const L0 = ledger();
    const seedLimit = cuts.includes(2) ? 10 : 20;
    const sample = visits.filter(x => x.idx < seedLimit);
    const distinct = new Map();
    for (const x of sample) { const k = stKey(x.v, x.pol, x.st); if (!distinct.has(k)) distinct.set(k, x); }
    const D = [...distinct];
    const results = new Map();
    let withT3b = !cuts.includes(1), projected = false;
    for (let i = 0; i < D.length; i++) {
      const [k, x] = D[i];
      const r = rsState(x, cache.get(k), withT3b);
      r.Rnet = cache.get(k) ? AR.solve(Object.assign(new AR.Sim(x.v, "normal"), { ...x.st, ended: false, dias: { ...x.st.dias }, cargo: { ...x.st.cargo } }), x.pol, "greedy").net : null;
      results.set(k, r);
      if (!projected && i + 1 >= D.length / 10) {
        projected = true;
        const el = (Date.now() - t) / 60000 + (L0.fnewMinutes || 0) * (i + 1) / D.length;
        cuts = capCheck("sweepRS", (i + 1) / D.length, el);
        if (cuts.includes(1) && withT3b) { withT3b = false; for (const r2 of results.values()) for (const p of r2.per) p.t3b = null; say("cut 1 mid-sweep: T3(b) values so far discarded"); }
        if (cuts.includes(4)) { say("cut 4: RS sweep stopped"); break; }
      }
      beat(() => `RS ${i + 1}/${D.length}`);
    }
    if (!cuts.includes(4)) {
      const sampleNow = cuts.includes(2) ? sample.filter(x => x.idx < 10) : sample;
      for (const { v, pol } of CELLS) {
        const vis = sampleNow.filter(x => x.v === v && x.pol === pol).map(x => ({ x, r: results.get(stKey(v, pol, x.st)) })).filter(z => z.r);
        rows.push(...aggregate("RS", v, pol, vis, z => z.r, z => z.x.seed));
      }
      for (const [k, r] of results) detail.push([k, r.d, r.Rnet, r.per.map(p => [p.aN, p.aO, p.qNA, p.qNO, p.t3b])]);
      blockEnd("sweepRS", t, { distinctStates: D.length, visits: sampleNow.length, seedsPerCell: seedLimit, t3b: withT3b });
      const L = ledger(); L.blocks.sweepRS.wallMinutes = L.blocks.sweepRS.min; L.blocks.sweepRS.min += L.fnewMinutes || 0; saveLedger(L);
    }
  }
  // ---- HS ----
  capCheck("sweepHS", 0, 0);
  const t2 = blockStart("sweepHS");
  const hs = readJSONFile(extPath("hs-states.json"));
  const e = loadEngine();
  for (const { v, pol } of CELLS) {
    const vis = [];
    for (const c of hs.filter(c => c.v === v && c.pol === pol)) for (const st of c.states) {
      const o = hsOptions(e, v, pol, st);
      const per = KAPPA10.map(k10 => {
        const n = hsChoose(o, "new", k10), od = hsChoose(o, "old", k10);
        const aN = n.choice.act, aO = od.choice.act;
        const sN = n.choice.score, sNO = hsValue(o, "new", k10, aO);
        const regretD = sN !== null && sNO !== null ? (sN - sNO) * n.choice.months : 0;
        const t3b = n.w && n.maxSailQabs !== null && od.w && od.maxSailQabs !== null ? (n.w.qabs - n.maxSailQabs) - (od.w.qabs - od.maxSailQabs) : null;
        return { aN, aO, regretD, waitN: aN === "wait", waitO: aO === "wait", t3b, delN: n.choice.next, delO: od.choice.next, seqDiff: null };
      });
      const hChoice = o.now.find(x => x.to === st.act);
      const denom = st.act === "wait" ? (o.now.length ? null : -o.waitOnlyFee) : hChoice ? hChoice.num : null;
      vis.push({ seed: c.seed, key: stKey(v, pol, { ...st, equity: 1500, cargo: Object.fromEntries(GOODS.map(g => [g, 0])) }), r: { per, denom } });
    }
    rows.push(...aggregate("HS", v, pol, vis, z => z.r, z => z.seed, z => z.key));
    beat(() => `HS ${v}/${pol}`);
  }
  blockEnd("sweepHS", t2);
  writeCSV("kappa.csv", rows);
  writeExt("rs-sweep-detail.json", detail);
  say("sweep: kappa.csv held for the hash check;", rows.length, "rows");
}
// Per κ, per cell: T1 (three margins), T2D, T2′, T3(a), T3(b), T4 — per visit and per distinct state.
function aggregate(player, v, pol, vis, getR, getSeed, getKey = z => stKey(v, pol, z.x.st)) {
  const m = MARGIN[v], out = [];
  const keys = new Map(); vis.forEach(z => { const k = getKey(z); keys.set(k, (keys.get(k) || 0) + 1); });
  const nDistinct = keys.size;
  const boot = makeBoot();
  for (let ki = 0; ki < KAPPA.length; ki++) {
    const regretOf = z => { const p = getR(z).per[ki]; return player === "RS" ? (p.qNO === null ? 0 : Math.max(0, (p.qNA - p.qNO) / 10000)) : Math.max(0, p.regretD); };
    const lossOf = z => { const p = getR(z).per[ki]; return player === "RS" ? (p.qNO === null ? 0 : (p.qNA - p.qNO) / 10000) : p.regretD; };
    const flips = mm => vis.map(z => lossOf(z) > mm ? 1 : 0);
    const share = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    const regrets = vis.map(regretOf);
    const t3a = vis.map(z => { const p = getR(z).per[ki]; return p.waitN !== p.waitO ? 1 : 0; });
    const t3b = vis.map(z => getR(z).per[ki].t3b).filter(x => x !== null).map(x => Math.abs(x) / m);
    const t4 = vis.map(z => { const p = getR(z).per[ki]; return p.delN !== p.delO ? 1 : 0; });
    const t4seq = player === "RS" ? vis.map(z => getR(z).per[ki].seqDiff ? 1 : 0) : null;
    const den = vis.map(z => player === "RS" ? getR(z).Rnet : getR(z).denom);
    const denSum = den.reduce((a, b) => a + (b ?? 0), 0), denN = den.filter(x => x !== null).length;
    const numSum = regrets.reduce((a, b) => a + b, 0);
    // per distinct state: each distinct state once
    const seen = new Set(), dv = [];
    vis.forEach(z => { const k = getKey(z); if (!seen.has(k)) { seen.add(k); dv.push(z); } });
    const dShare = f => share(dv.map(f));
    // seed-level bootstrap CIs for T1 and T2D (resampling campaigns)
    const bySeed = new Map(); vis.forEach((z, i) => { const s = getSeed(z); if (!bySeed.has(s)) bySeed.set(s, []); bySeed.get(s).push(i); });
    const seedsArr = [...bySeed.values()];
    const f1 = flips(m);
    const ciRatio = vals => {
      const n = seedsArr.length; if (n < 2) return { lo: null, hi: null };
      const sums = seedsArr.map(ix => ix.reduce((a, i) => a + vals[i], 0)), cnts = seedsArr.map(ix => ix.length);
      const rr = mulberry32(BOOT_SEED), means = new Float64Array(BOOT_N);
      for (let b = 0; b < BOOT_N; b++) { let s = 0, c = 0; for (let i = 0; i < n; i++) { const j = Math.floor(rr() * n); s += sums[j]; c += cnts[j]; } means[b] = s / c; }
      means.sort();
      return { lo: +means[Math.floor(0.025 * (BOOT_N - 1))].toFixed(6), hi: +means[Math.floor(0.975 * (BOOT_N - 1))].toFixed(6) };
    };
    void boot;
    const c1 = ciRatio(f1), c2 = ciRatio(regrets);
    out.push({ player, vessel: v, policy: pol, kappa: KAPPA[ki], margin: m, visits: vis.length, distinct: nDistinct, fewStates: nDistinct < 20 ? 1 : 0,
      T1: share(f1), T1lo: c1.lo, T1hi: c1.hi, T2D: share(regrets), T2Dlo: c2.lo, T2Dhi: c2.hi,
      T1_m1: share(flips(1)), T1_2m: share(flips(2 * m)),
      T2p: denSum > 0 ? numSum / denSum : null, T2pNum: +numSum.toFixed(4), T2pDen: denSum, T2pStates: denN, regretStates: regrets.filter(x => x > 0).length,
      T3a: share(t3a), T3bMedian: t3b.length ? quant(t3b, 0.5) : null, T3bN: t3b.length, T4: share(t4), T4seq: t4seq ? share(t4seq) : null,
      T1_d: dShare(z => lossOf(z) > m ? 1 : 0), T2D_d: dShare(regretOf), T3a_d: dShare(z => { const p = getR(z).per[ki]; return p.waitN !== p.waitO ? 1 : 0; }), T4_d: dShare(z => { const p = getR(z).per[ki]; return p.delN !== p.delO ? 1 : 0; }),
      dMean: player === "RS" ? share(vis.map(z => getR(z).d)) : null, planNetChange: player === "RS" ? share(vis.map(z => getR(z).per[ki].planNetChange)) : null });
  }
  return out;
}

// =========================================================================================
// SCORE (from the committed CSVs)
// =========================================================================================
// κ* from kappa.csv rows (§4): the smallest grid κ at which T1 ≥ 10% and T2D ≥ m in the same cell,
// in at least 2 of the 6 cells. which: "mv" (primary), "1" (m = 1 D), "2m" (m = 2·m_v).
function kstarOf(kap, player, which) {
  const q = [];
  for (const k of KAPPA) {
    const rows = kap.filter(r => r.player === player && r.kappa === k);
    if (!rows.length) return { kstar: "not measured (cap)", qualifying: [] };
    const ok = rows.filter(r => { const m = which === "1" ? 1 : which === "2m" ? 2 * r.margin : r.margin; const t1 = which === "1" ? r.T1_m1 : which === "2m" ? r.T1_2m : r.T1; return t1 >= 0.10 && r.T2D >= m; });
    if (ok.length >= 2) q.push({ kappa: k, cells: ok.map(r => `${r.vessel}/${r.policy}`) });
  }
  const ks = q.length ? q[0].kappa : "> 1,200";
  return { kstar: ks, qualifying: q, perHighTierLegD: typeof ks === "number" ? { dhow: +(0.35 * 30 * 1 * ks).toFixed(1), junk: +(0.35 * 30 * 0.5 * ks).toFixed(1) } : null, multipleOfToday: typeof ks === "number" ? +(ks / 2.4).toFixed(2) : null };
}

// =========================================================================================
// POST-REVIEW CHECKS (§13, added after results were seen): A1 porcelain attribution, a hand-worked
// case; R1 a recount of T1, T2D and κ* from the stored sweep detail (RS) and from H's states (HS),
// independent of aggregate() and kstarOf(), compared with them and with the committed outputs.
// =========================================================================================
function a1Porcelain() {
  const e = loadEngine();
  // Hand-worked: hull 100 -> headwind 34 (66) breaks 1 (not storm-caused: replayed 66 < 70) -> repair check at
  // 66 (none) -> storm leg breaks 2 (replayed 66 < 70: not storm-caused) -> Calicut story +8 (74) -> storm leg
  // to Aden, month 9, breaks 3 (replayed 74 >= 70: storm-caused) -> headwind 30 (44) -> check, cash 250 > 200:
  // replay repairs to 69 -> logged repair -> check, cash 150 + 60 - 60 = 150: none -> story +8 (77) -> leg to
  // Kilwa, month 14, breaks 1 (77 >= 70: storm-caused). Porcelain at Aden in month 9 is
  // round(205 × (1 + 0.08 sin(218π/6))) = 219; at Kilwa in month 14, round(210 × (1 + 0.08 sin(233π/6))) = 218.
  const acts = [
    { k: "c", cash: 1500 }, { k: "s", to: "aden", hw: 34, storm: 0, pb: 1, arr: 2 },
    { k: "c", cash: 1000 }, { k: "s", to: "kilwa", hw: 0, storm: 30, pb: 2, arr: 4 },
    { k: "w", s8: 1 }, { k: "s", to: "aden", hw: 0, storm: 30, pb: 3, arr: 9 },
    { k: "s", to: "calicut", hw: 30, storm: 0, pb: 0, arr: 11 },
    { k: "c", cash: 250 }, { k: "r" }, { k: "c", cash: 150 }, { k: "w", s8: 1 },
    { k: "s", to: "kilwa", hw: 0, storm: 25, pb: 1, arr: 14 }
  ];
  const got = attributePorcelain(acts, e), want = { lots: 4, value: 3 * 219 + 218, brokenAll: 7 };
  return { pass: !mismatch(got, want), got, want, failures: mismatch(got, want) ? [{ got, want }] : [] };
}
function r1Recount(statesDir) {
  const IN = process.env.SS_RESULTS_IN || OUT;   // plant runs read the committed outputs
  const f = [], kap = readCSV(path.join(IN, "kappa.csv")), pred = readJSONFile(path.join(IN, "predictions.json"));
  const K = KAPPA.length, rowsAgg = [], ind = [];
  const close = (a, b) => (a === null && b === null) || (a !== null && b !== null && Math.abs(a - b) <= 1e-6);
  // RS: visits of the first 20 seeds, the stored detail per distinct state
  const visits = loadStates(statesDir).filter(x => x.idx < 20);
  const detail = new Map(readJSONFile(path.join(statesDir, "rs-sweep-detail.json")).map(d => [d[0], d]));
  const hsAll = readJSONFile(path.join(statesDir, "hs-states.json")), e = loadEngine();
  for (const { v, pol } of CELLS) {
    const m = MARGIN[v];
    // RS
    const zs = visits.filter(x => x.v === v && x.pol === pol).map(x => { const d = detail.get(stKey(v, pol, x.st)); return { x, r: { d: d[1], Rnet: d[2], per: d[3].map(p => ({ aN: p[0], aO: p[1], qNA: p[2], qNO: p[3], t3b: p[4], waitN: p[0] === "wait", waitO: p[1] === "wait", delN: null, delO: null, seqDiff: false, planNetChange: 0 })) } }; });
    rowsAgg.push(...aggregate("RS", v, pol, zs, z => z.r, z => z.x.seed));
    for (let ki = 0; ki < K; ki++) {
      let n = 0, c1 = 0, cm = 0, c2 = 0, reg = 0;
      for (const z of zs) { const p = z.r.per[ki]; const loss = p.qNO === null ? 0 : (p.qNA - p.qNO) / 10000; n++; if (loss > 1) c1++; if (loss > m) cm++; if (loss > 2 * m) c2++; if (loss > 0) reg += loss; }
      ind.push({ player: "RS", vessel: v, policy: pol, kappa: KAPPA[ki], margin: m, T1: cm / n, T1_m1: c1 / n, T1_2m: c2 / n, T2D: reg / n });
    }
    // HS: H's states, scored again with HS's own functions (checked by K10d), counted here
    const hz = [];
    for (const c of hsAll.filter(c => c.v === v && c.pol === pol)) for (const st of c.states) {
      const o = hsOptions(e, v, pol, st);
      const per = KAPPA10.map(k10 => { const n = hsChoose(o, "new", k10), od = hsChoose(o, "old", k10), sN = n.choice.score, sNO = hsValue(o, "new", k10, od.choice.act);
        return { regretD: sN !== null && sNO !== null ? (sN - sNO) * n.choice.months : 0, aN: n.choice.act, aO: od.choice.act, waitN: n.choice.act === "wait", waitO: od.choice.act === "wait", t3b: null, delN: null, delO: null }; });
      hz.push({ seed: c.seed, key: stKey(v, pol, { ...st, equity: 1500, cargo: Object.fromEntries(GOODS.map(g => [g, 0])) }), r: { per, denom: 0 } });
    }
    rowsAgg.push(...aggregate("HS", v, pol, hz, z => z.r, z => z.seed, z => z.key));
    for (let ki = 0; ki < K; ki++) {
      let n = 0, c1 = 0, cm = 0, c2 = 0, reg = 0;
      for (const z of hz) { const loss = z.r.per[ki].regretD; n++; if (loss > 1) c1++; if (loss > m) cm++; if (loss > 2 * m) c2++; if (loss > 0) reg += loss; }
      ind.push({ player: "HS", vessel: v, policy: pol, kappa: KAPPA[ki], margin: m, T1: cm / n, T1_m1: c1 / n, T1_2m: c2 / n, T2D: reg / n });
    }
  }
  // compare: independent count = aggregate() on the same inputs = the committed kappa.csv
  let compared = 0;
  for (const r of ind) {
    const a = rowsAgg.find(x => x.player === r.player && x.vessel === r.vessel && x.policy === r.policy && x.kappa === r.kappa);
    const c = kap.find(x => x.player === r.player && x.vessel === r.vessel && x.policy === r.policy && x.kappa === r.kappa);
    for (const col of ["T1", "T1_m1", "T1_2m", "T2D"]) {
      compared++;
      if (!close(r[col], a[col])) f.push({ against: "aggregate()", player: r.player, cell: `${r.vessel}/${r.policy}`, kappa: r.kappa, col, recount: r[col], got: a[col] });
      if (!close(r[col], c[col])) f.push({ against: "kappa.csv", player: r.player, cell: `${r.vessel}/${r.policy}`, kappa: r.kappa, col, recount: r[col], got: c[col] });
    }
  }
  // κ*, counted independently from the recount, against kstarOf() on the committed rows and predictions.json
  const indK = (player, which) => {
    for (const k of KAPPA) {
      let cells = 0;
      for (const r of ind.filter(x => x.player === player && x.kappa === k)) {
        const m = which === "1" ? 1 : which === "2m" ? 2 * r.margin : r.margin, t1 = which === "1" ? r.T1_m1 : which === "2m" ? r.T1_2m : r.T1;
        if (t1 >= 0.1 && r.T2D >= m) cells++;
      }
      if (cells >= 2) return k;
    }
    return "> 1,200";
  };
  const kstars = {};
  for (const pl of ["RS", "HS"]) for (const [which, name] of [["mv", "primary"], ["1", "m1"], ["2m", "m2"]]) {
    const a = indK(pl, which), b = kstarOf(kap, pl, which).kstar, c = pred.kstar[pl][name].kstar;
    kstars[`${pl} ${name}`] = a;
    if (a !== b || a !== c) f.push({ kstar: `${pl} ${name}`, recount: a, kstarOf: b, predictions: c });
  }
  return { pass: f.length === 0, valuesCompared: compared, rsVisits: visits.length, kstars, failures: f.slice(0, 10) };
}
async function reviewChecks({ only = null, statesDir = EXT } = {}) {
  const res = {};
  if (!only || only === "A1") res.A1 = a1Porcelain();
  if (!only || only === "R1") res.R1 = r1Recount(statesDir);
  return { pass: Object.values(res).every(r => r.pass), failures: Object.values(res).flatMap(r => r.failures), ...res };
}
// The probability that expected exposure sums over attempts (§13 item 8): the departure month's p, no navigator.
// Moved here unchanged from phaseExposure (§13, 2026-11-24, written after results were seen) so that S1 can test it.
function expectedP(world, a) { return (world === "W0" ? LOOKUPS.today : LOOKUPS[world])(a[0], a[1], a[2] % 12, false); }
// S1 (added after results were seen): expected exposure on hand-worked attempts. H is the engine's own transition
// storm probability (computeTransit's stormProbability, 0.35); the tiers are §2.3's table and the mappings §2.4's
// fractions: M1 (1, 1/2, 1/5, 0), M2 (1, 3/4, 1/2, 0), M3 (1, 0, 0, 0); W5 mixes Calicut–Malacca as
// 0.208·AS + 0.563·BoB and Malacca–Quanzhou as 0.895·SCS. Attempts are [from, to, absolute month].
function s1SigmaP() {
  const e = loadEngine();
  const H = e.g.computeTransit(e.lane("calicut", "aden"), 3).stormProbability;   // April, a transition month
  const M1 = { H, M: H / 2, L: H / 5 }, M2 = { H, M: 3 * H / 4, L: H / 2 };
  //            attempt                          W0 (today)  W1      W2      W3   W4 (SCS-early)  W5
  const cases = [
    [["kilwa", "calicut", 5], "AS Jun H",        0,          M1.H,   M2.H,   H,   M1.H,           M1.H],
    [["malacca", "quanzhou", 7], "SCS Aug H",    0,          M1.H,   M2.H,   H,   M1.H,           0.895 * M1.H],
    [["malacca", "quanzhou", 8], "SCS Sep H",    0,          M1.H,   M2.H,   H,   M1.M,           0.895 * M1.H],
    [["calicut", "malacca", 4], "BoB May M",     H,          M1.M,   M2.M,   0,   M1.M,           0.208 * M1.H + 0.563 * M1.M],
    [["aden", "calicut", 7], "AS Aug L",         0,          M1.L,   M2.L,   0,   M1.L,           M1.L],
    [["kilwa", "aden", 0], "AS Jan N",           0,          0,      0,      0,   0,              0],
    [["calicut", "kilwa", 17], "AS Jun H (month 17)", 0,     M1.H,   M2.H,   H,   M1.H,           M1.H],
    [["quanzhou", "malacca", 9], "SCS Oct M",    H,          M1.M,   M2.M,   0,   M1.M,           0.895 * M1.M]
  ];
  const f = [], sums = {};
  WORLDS.forEach((w, wi) => {
    let got = 0, want = 0;
    for (const c of cases) {
      const g = expectedP(w, c[0]), x = c[2 + wi];
      got += g; want += x;
      if (Math.abs(g - x) > 1e-12) f.push({ world: w, attempt: c[0].join(">"), case: c[1], got: g, want: x });
    }
    sums[w] = { got: +got.toFixed(6), want: +want.toFixed(6) };
    if (Math.abs(got - want) > 1e-12) f.push({ world: w, sum: true, got, want });
  });
  return { pass: f.length === 0 && H === 0.35, engineH: H, caseCount: cases.length, sums, failures: f.slice(0, 10) };
}
async function phaseSigmaP() {
  const r = s1SigmaP();
  mergeChecks({ postRunS1: { note: "added after results were seen (§13, 2026-11-24); rerun alone; no score or number changes", ...r } });
  say("S1 expected exposure", JSON.stringify({ pass: r.pass, sums: r.sums }));
}
async function phaseReview() {
  const r = await reviewChecks();
  mergeChecks({ postReview: { note: "added after results were seen (§13, 2026-11-24); rerun alone", ...r } });
  say("post-review checks", JSON.stringify({ A1: r.A1.pass, R1: r.R1.pass, compared: r.R1.valuesCompared, kstars: r.R1.kstars }));
}

async function phaseScore() {
  const checks = existsSync(outPath("checks.json")) ? readJSONFile(outPath("checks.json")) : {};
  const allChecks = checks.checksPhase?.allPass && checks.plants?.allCaught && checks.K10?.pass && checks.plantsK10?.allCaught;
  if (!allChecks && !DEV) throw new Error("not every check passed; nothing is scored");
  const kap = readCSV(outPath("kappa.csv")), camp = readCSV(outPath("campaigns.csv")), porc = readCSV(outPath("porcelain.csv")), expo = readCSV(outPath("exposure.csv"));
  const L = ledger();
  const kstar = (player, which) => kstarOf(kap, player, which);
  const K = {};
  for (const pl of ["RS", "HS"]) K[pl] = { primary: kstar(pl, "mv"), m1: kstar(pl, "1"), m2: kstar(pl, "2m") };
  const S = {};
  // N1: the null at κ = 2.4
  {
    const f = [], und = [];
    for (const pl of ["RS", "HS"]) for (const r of kap.filter(r => r.player === pl && r.kappa === 2.4)) {
      const cell = `${pl} ${r.vessel}/${r.policy}`;
      if (!(r.T1 < 0.02)) f.push([cell, "T1", r.T1]);
      if (r.T2p === null) und.push([cell, "T2′ undefined"]); else if (!(r.T2p < 0.001)) f.push([cell, "T2′", r.T2p]);
      if (!(r.T3a < 0.01)) f.push([cell, "T3(a)", r.T3a]);
      if (!(r.T4 < 0.02)) f.push([cell, "T4", r.T4]);
    }
    const rsMissing = !kap.some(r => r.player === "RS");
    S.N1 = { score: f.length ? "contradicted" : rsMissing ? "partly untestable (RS not measured)" : und.length ? "supported where testable" : "supported", blind: "informed", failed: f, undefined: und };
  }
  const num = x => x === "> 1,200" ? Infinity : typeof x === "number" ? x : null;
  { const k = num(K.RS.primary.kstar); S.N2 = { score: k === null ? "untestable (RS not measured)" : k > 24 ? "supported" : "contradicted", blind: "informed", kstarRS: K.RS.primary.kstar }; }
  { const h = num(K.HS.primary.kstar), r = num(K.RS.primary.kstar);
    S.N3 = { score: h === null || r === null ? "untestable" : h === Infinity && r === Infinity ? "untestable (both > 1,200)" : h <= r ? "supported" : "contradicted", blind: "informed", kstarHS: K.HS.primary.kstar, kstarRS: K.RS.primary.kstar }; }
  {
    const rows = porc.filter(r => r.world === "W1" && r.player === "H" && r.difficulty === "normal");
    const f = rows.filter(r => !(r.valueP99 < 0.01 * r.medianNet)).map(r => [r.vessel, r.policy, r.valueP99, r.medianNet]);
    S.N5 = { score: f.length ? "contradicted" : "supported", blind: "blind", failed: f, cells: rows.map(r => [r.vessel, r.policy, r.valueP99, r.medianNet, r.p99OverMedianNet]) };
  }
  {
    const f = [], r6 = [];
    for (const { v, pol } of CELLS) {
      const a = camp.find(r => r.world === "W1" && r.player === "H" && r.difficulty === "normal" && r.vessel === v && r.policy === pol);
      const b = camp.find(r => r.world === "W0" && r.player === "H" && r.difficulty === "normal" && r.vessel === v && r.policy === pol);
      const ratio = a.netMedian / b.netMedian; r6.push([v, pol, a.netMedian, b.netMedian, +ratio.toFixed(5)]);
      if (Math.abs(ratio - 1) > 0.01) f.push([v, pol, a.netMedian, b.netMedian, +ratio.toFixed(5)]);
    }
    S.N6 = { score: f.length ? "contradicted" : "supported", blind: "informed", failed: f, medians: r6 };
  }
  // N4 (descriptive, seen): R's realised W1 share of storms on Malacca–Quanzhou, June–November
  {
    const rows = expo.filter(r => r.world === "W1" && r.player === "R");
    const out = [];
    for (const { v, pol } of CELLS) {
      const x = rows.filter(r => r.vessel === v && r.policy === pol), tot = x.reduce((a, r) => a + r.storms, 0);
      const mq = x.filter(r => (r.leg === "malacca>quanzhou" || r.leg === "quanzhou>malacca") && MONTHS.indexOf(r.month) >= 5 && MONTHS.indexOf(r.month) <= 10).reduce((a, r) => a + r.storms, 0);
      out.push([v, pol, mq, tot, tot ? +(mq / tot).toFixed(3) : null]);
    }
    S.N4 = { score: "descriptive (seen; not a prediction)", realisedShareR: out };
  }
  // the seven tailwind lane-months that become high (§2.4), realised and expected, W1, per vessel
  const seven = [["kilwa>aden", "Jun"], ["kilwa>calicut", "Jun"], ["aden>calicut", "Jun"], ["malacca>calicut", "Nov"], ["malacca>quanzhou", "Jul"], ["malacca>quanzhou", "Aug"], ["malacca>quanzhou", "Sep"]];
  const sevenRows = [];
  for (const pl of ["H", "R"]) for (const v of VESSELS) for (const [leg, mo] of seven) {
    const x = expo.filter(r => r.world === "W1" && r.player === pl && r.difficulty === "normal" && r.vessel === v && r.leg === leg && r.month === mo);
    sevenRows.push({ player: pl, vessel: v, leg, month: mo, attempts: x.reduce((a, r) => a + r.attempts, 0), storms: x.reduce((a, r) => a + r.storms, 0), expected: +x.reduce((a, r) => a + r.expected, 0).toFixed(2), wind: [...new Set(x.map(r => r.wind))].join("") });
  }
  const pred = { checksAllPass: true, cuts: L.cuts, kstar: K, scores: S, sevenTailwindLaneMonths: sevenRows,
    timing: { blocks: Object.fromEntries(Object.entries(L.blocks).map(([k, b]) => [k, { minutes: +(b.min ?? 0).toFixed(2), wallMinutes: b.wallMinutes ? +b.wallMinutes.toFixed(2) : undefined, estimate: k.startsWith("checks") ? "row ≤ 2" : EST[k] }])), projections: L.projections, fnewMinutesChargedToSweep: L.fnewMinutes },
    provenance: provenance() };
  emit(outPath("predictions.json"), JSON.stringify(pred, null, 1) + "\n");
  // the large traces stay outside the repository, checksummed here
  const extFiles = [["r-w0-normal-k1.json", "R's W0 normal campaigns from K1 (seeds 200001-200300): net, attempts, storms, porcelain attribution"],
    ["h-campaigns.json", "every H campaign (W0-W5 normal, W0-W1 survival; seeds 500001-500300): net, attempts, storms, porcelain attribution"],
    ["r-campaigns.json", "every R campaign (W1 normal, and W0 normal from K1)"], ["rs-states.json", "R's W1 decision states, first 20 seeds per normal cell (RS sample)"],
    ["hs-states.json", "H's W1 normal decision states with H's choice (HS sample)"], ["fnew-cache.json", "the F_new frontier per distinct RS state (K10b), reused by the sweep"],
    ["rs-sweep-detail.json", "per distinct RS state: d, R's net, and per κ a_new, a_old, Q_new(a_new), Q_new(a_old), T3(b) Δ"],
    ["exposure-per-cell.csv", "exposure per cell, if the committed exposure.csv is aggregated (§13 item 14)"], ["timing.json", "block times, projections and cuts (§5.4)"]];
  const walk = (rel, contents) => existsSync(extPath(rel)) ? readdirSync(extPath(rel), { recursive: true }).map(x => path.join(rel, String(x)).split(path.sep).join("/")).filter(x => statSync(extPath(x)).isFile()).sort().map(x => [x, contents]) : [];
  extFiles.push(...walk("logs", "console log of one phase of the run (stdout and stderr)"),
    ...walk("dev-smoke", "development smoke output written before 657a12b was committed (§13 entry of 2026-11-24, written after results were seen): seeds 900001-900002 (2 per cell), SS_DEV=1; complete outcome files"));
  const files = extFiles.filter(([f]) => existsSync(extPath(f))).map(([f, contents]) => { const b = readFileSync(extPath(f)); return { file: f, bytes: b.length, sha256: sha256(b), contents }; });
  emit(outPath("external-manifest.json"), JSON.stringify({ archiveRoot: `storm-seasons external archive: the directory ${path.basename(EXT)} (SS_EXT) on the author machine at the run, not yet published at an immutable reference; until it is, this result is provenance-incomplete. Every path below is relative to that root.`, files }, null, 1) + "\n");
  if (!DEV) say("scores", JSON.stringify(Object.fromEntries(Object.entries(S).map(([k, x]) => [k, x.score]))));
  if (!DEV) say("kstar", JSON.stringify(Object.fromEntries(Object.entries(K).map(([k, x]) => [k, [x.primary.kstar, x.m1.kstar, x.m2.kstar]]))));
}

// =========================================================================================
const provenance = () => {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  return { commit: head, modelSha256: SELF_SHA, adaptiveRoutesSha256: AR_SHA, engineScriptSha256: ENGINE_SHA256, pageSha256: gameHash(),
    pageSha256AtRegistration: PAGE_SHA256_AT_REGISTRATION, lineOffset: LINE_OFFSET, node: process.version, platform: `${os.platform()} ${os.release()}`,
    rng: "harnessReset's mulberry32 per seed (the seed stream); arms unpaired", seeds: { H_R: `${SEED0}-${SEED0 + N_SEEDS - 1}`, K1_and_R_W0: `${K1_SEED0}-${K1_SEED0 + N_SEEDS - 1}`, RS_sample: "first 20 seeds per normal cell" },
    bootstrap: { seed: BOOT_SEED, resamples: BOOT_N, rng: "mulberry32" }, extRoot: "SS_EXT (the storm-seasons external archive; see external-manifest.json)", devMode: DEV, devLimit: process.env.SS_DEV_LIMIT || null };
};
const phases = { checks: phaseChecks, plants: () => phasePlants("main"), exposure: phaseExposure, k10: phaseK10, sweep: phaseSweep, score: phaseScore,
  plantcheck: () => phasePlantcheck(process.argv[3]), k8probe: phaseK8probe, review: phaseReview, sigmap: phaseSigmaP };
if (!phases[PHASE]) throw new Error("unknown phase " + PHASE);
say("start", JSON.stringify({ out: OUT, ext: EXT, node: process.version }));
// K8 at every phase: MONSOON_INDEX unset, page hashed before and after, outputs written only if unchanged.
if (process.env.MONSOON_INDEX) { say("K8 FAIL: MONSOON_INDEX is set; nothing runs"); process.exit(4); }
if (process.env.SS_DEV_LIMIT && PHASE !== "plantcheck" && !DEV) throw new Error("SS_DEV_LIMIT is for development smoke only");
const H_START = gameHash();
/*PLANT-K8a*/
await phases[PHASE]();
const H_END = gameHash();
if (H_END !== H_START) { say("K8 FAIL: page hash changed during the phase", H_START.slice(0, 12), "->", H_END.slice(0, 12), "; outputs discarded:", PENDING.length); process.exit(3); }
say("K8 page hash unchanged", H_START.slice(0, 12), "; writing", PENDING.length, "outputs");
flushOutputs();
// The K10 plants run after K10's outputs are written (they read the RS states from SS_EXT).
if (PHASE === "sigmap") { await phasePlants("sigmap"); const H2 = gameHash(); if (H2 !== H_START) { say("K8 FAIL after S1 plants"); process.exit(3); } flushOutputs(); }
if (PHASE === "review") { await phasePlants("review"); const H2 = gameHash(); if (H2 !== H_START) { say("K8 FAIL after review plants"); process.exit(3); } flushOutputs(); }
if (PHASE === "k10" && !DEV) { await phasePlants("k10"); const H2 = gameHash(); if (H2 !== H_START) { say("K8 FAIL after K10 plants"); process.exit(3); } flushOutputs(); }
say("end");
