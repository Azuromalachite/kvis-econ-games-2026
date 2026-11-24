// Costs that change decisions (Monsoon Navigator, balance study).
//
// Implements research/03/pre-registrations/2026-11-24-scaling-costs.md (v4, registered by PR #46,
// merged as 747b6a4; deviations and interpretations in its §9, committed with this code before
// any scored run). Node >= 22, no dependencies. Run from the repository root, one phase at a time,
// in this order (§4.8 "Order"):
//
//   node research/03/models/scaling-costs.mjs checks     # C9, C4, C2, C3, C5, C6, C8, C7, C10, C1, C1b
//   node research/03/models/scaling-costs.mjs plants     # every planted defect, in a temporary clone
//   node research/03/models/scaling-costs.mjs flat       # flat H, flat D-W, flat L-EV
//   node research/03/models/scaling-costs.mjs predict    # the frozen predict table and the exposure table
//   node research/03/models/scaling-costs.mjs variants   # H, D-W and L-EV variant arms, static replays
//   node research/03/models/scaling-costs.mjs flips      # decision flips (§4.7)
//   node research/03/models/scaling-costs.mjs score      # CSVs and predictions.json
//
// Environment: SC_OUT (results directory), SC_EXT (large traces, outside the repository), SC_DATE
// (run date in the results folder name), SC_DEV=1 (development smoke on unregistered seeds 900001+,
// outputs to SC_EXT/dev only, nothing outcome-bearing printed). Every phase hashes the page before
// and after; its outputs are held in memory and written only if the two hashes are equal.
//
// Every share, rate and wage multiplier is a balance parameter. Nothing here is historical, and
// nothing changes the game: the rules exist only as research copies of sailTo and waitInPort.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, appendFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { engineScript, DEFAULT_INDEX } from "../../../tests/03/engine/load-engine.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));
const ROOT = at("../../../");
const RUN_DATE = process.env.SC_DATE || "2026-11-25";
const DEV = process.env.SC_DEV === "1";
const EXT = process.env.SC_EXT || path.join(os.tmpdir(), "sc-scaling-costs-ext");
const OUT = DEV ? path.join(EXT, "dev-out") : (process.env.SC_OUT || at(`../results/${RUN_DATE}-scaling-costs/`));
const PHASE = process.argv[2] || "checks";
const sha256 = x => createHash("sha256").update(x).digest("hex");
const NODE = process.execPath;
const SELF = fileURLToPath(import.meta.url);

// --- pins (protocol header; §9 deviation 1) -----------------------------------------------
const ENGINE_SHA256 = "6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c";
const PAGE_SHA256_AT_REGISTRATION = "0b11ae287ab32e3ee6fe1ead1dec8b5d52b4b60f34076f854a39f54b7d8c74d7"; // f71aba2
const LINE_OFFSET = 1776;            // the <script> tag is on line 1777 of the page at f71aba2
const ENGINE_FILENAME = "monsoon-engine.js";
const INDEX = process.env.MONSOON_INDEX || DEFAULT_INDEX;
const HARNESS = at("../../../tests/03/baseline-harness.js");
const gameHash = () => sha256(readFileSync(INDEX));

// --- progress log with heartbeat ------------------------------------------------------------
const T0 = Date.now();
let lastBeat = Date.now();
const stamp = () => `[${new Date().toISOString().slice(11, 19)} +${((Date.now() - T0) / 1000).toFixed(0)}s]`;
function say(...a) { console.log(stamp(), PHASE, ...a); lastBeat = Date.now(); }
function beat(msg) { if (Date.now() - lastBeat >= 30000) say("heartbeat", typeof msg === "function" ? msg() : msg); }

// --- outputs: held until the page hash is shown unchanged -----------------------------------
const PENDING = [];
function emit(file, data) { PENDING.push([file, data]); }
function flushOutputs() {
  for (const [file, data] of PENDING) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, data); }
  PENDING.length = 0;
}
const outPath = name => path.join(OUT, name);
const extPath = name => path.join(EXT, name);
const readJSONFile = f => JSON.parse(readFileSync(f, "utf8"));
function csvString(rows) {
  if (!rows.length) return "\n";
  const cols = Object.keys(rows[0]);
  const cell = v => v === null || v === undefined ? "" : typeof v === "number" ? (Number.isInteger(v) ? String(v) : Number.isFinite(v) ? String(+v.toFixed(6)) : String(v)) : typeof v === "boolean" ? (v ? "1" : "0") : String(v);
  return [cols.join(","), ...rows.map(r => cols.map(c => cell(r[c])).join(","))].join("\n") + "\n";
}
function readCSV(f) {
  const [head, ...lines] = readFileSync(f, "utf8").trim().split("\n");
  const cols = head.split(",");
  return lines.map(l => { const v = l.split(","); return Object.fromEntries(cols.map((c, i) => [c, v[i] === "" ? null : isNaN(Number(v[i])) ? v[i] : Number(v[i])])); });
}
function mergeChecks(part) {
  const f = outPath("checks.json");
  const prev = existsSync(f) ? readJSONFile(f) : {};
  emit(f, JSON.stringify({ ...prev, ...part }, null, 1) + "\n");
}

// --- reuse of adaptive-routes.mjs (as depth-liquidity.mjs and storm-seasons.mjs do) ----------
// Its definitions (everything above its "// --- main" marker) are imported from a generated copy,
// with only its relative paths made absolute. Nothing in it is edited.
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
  if (!existsSync(f)) writeFileSync(f, src);
  return import(pathToFileURL(f).href);
}
const AR = await importAdaptive();
const { P, GOODS, PORTS, HZ, transit, isHead, isDead, allowed, price, PATHS } = AR;
const AR_SHA = sha256(readFileSync(AR_PATH));
const SELF_SHA = sha256(readFileSync(SELF));
const PUB = at("../results/2026-11-23-adaptive-routes/");
const PUB_OFF = readJSONFile(PUB + "hazards-off.json");
const PUB_ON = readJSONFile(PUB + "hazards-on.json");
const DL_PERSEED = at("../results/2026-11-24-depth-liquidity/liquidity-perseed.csv");
const DL_CELLS = at("../results/2026-11-24-depth-liquidity/liquidity.csv");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const VESSELS = ["dhow", "junk"];
const END = P.campaignMonths;                       // 24
const POL_L = "avoidHeadwind";                      // L-EV and D-W policy (§4.4; §9 interpretation)
const H_POLS = ["sailAlways", "avoidHeadwind"];
const L_DIFFS = ["easy", "normal"];
const H_DIFFS = ["easy", "normal", "hard"];         // scored H cells; survival is exploratory
const DW_DIFFS = ["easy", "normal", "hard"];
const SEED_L = DEV ? 900001 : 600001, N_L = 150;   // §4.4
const SEED_H = DEV ? 900001 : 600001, N_H = 1000;
const BOOT_SEED = 20261124, BOOT_N = 10000;
const MARGIN = { easy: { dhow: 27, junk: 47 }, normal: { dhow: 35, junk: 55 }, hard: { dhow: 35, junk: 55 } }; // m_v, §4.7
const WORKERS = 3;
// Planted-defect switches: the plants phase sets one to true in a temporary clone (never here).
const SC_PLANT_C1B_IDENTITY = false;   // C1 (b): identity mode still subtracts the 5 D doldrum term
const SC_PLANT_C3 = false;             // C3: the P copy multiplies the piracy probability by (1 + s)
const SC_PLANT_VII = false;            // C2 (vii): < becomes <= in the piracy comparison
const SC_PLANT_VIII = false;           // C2 (viii): the standing >= 50 halving omitted
const DEV_N = process.env.SC_DEV_N ? Number(process.env.SC_DEV_N) : null;   // dev smoke only: fewer seeds

// =========================================================================================
// §2 and §4.3: rules. Shares in thousandths so every floor is exact integer arithmetic.
// =========================================================================================
const RULE = (id, o = {}) => ({ id, s: o.s || 0, t: o.t || 0, m: o.m || 0, beta: o.beta || 0 });
const FLAT = RULE("flat");
const GRID = [10, 30, 100, 300];                     // 0.01, 0.03, 0.1, 0.3 in thousandths
const BETAS = [1, 3, 10, 30];
const gl = x => (x / 1000).toString();
const RULES = {
  flat: FLAT,
  ...Object.fromEntries(GRID.map(x => [`P${gl(x)}`, RULE(`P${gl(x)}`, { s: x })])),
  ...Object.fromEntries(GRID.map(x => [`T${gl(x)}`, RULE(`T${gl(x)}`, { t: x })])),
  ...Object.fromEntries(GRID.map(x => [`M${gl(x)}`, RULE(`M${gl(x)}`, { m: x })])),
  ...Object.fromEntries(BETAS.map(b => [`W${b}`, RULE(`W${b}`, { beta: b })])),
  B1: RULE("B1", { s: 30, t: 30, m: 30 }),
  B2: RULE("B2", { s: 100, t: 100, m: 100 })
};
const SHARE_RULES = ["flat", ...GRID.map(x => `P${gl(x)}`), ...GRID.map(x => `T${gl(x)}`), ...GRID.map(x => `M${gl(x)}`)]; // 13 (C7)
const RAID_RULES = ["flat", ...GRID.map(x => `P${gl(x)}`), ...GRID.map(x => `T${gl(x)}`), "B1", "B2"];
const VARIANTS = Object.keys(RULES).filter(k => k !== "flat");
// H configurations (§8: 24): flat G, flat G+, P, T, M, B1, B2 with G; W with G and G+.
const H_CONFIGS = [["flat", "G"], ["flat", "G+"], ...["P", "T", "M"].flatMap(k => GRID.map(x => [`${k}${gl(x)}`, "G"])), ["B1", "G"], ["B2", "G"],
  ...BETAS.flatMap(b => [[`W${b}`, "G"], [`W${b}`, "G+"]])];
const DW_CONFIGS = [["flat", "G"], ["flat", "G+"], ...BETAS.flatMap(b => [[`W${b}`, "G"], [`W${b}`, "G+"]])];
const LEV_CORE = ["M0.1", "M0.3", "P0.3", "T0.3"];
const LEV_EXT = ["P0.03", "T0.03", "M0.03", "M0.01", "P0.1", "T0.1"];

// floor(share x q) for lots; the planner's fractional q passes through the same expression.
function shareLots(q, m1000) { return Math.floor(q * m1000 / 1000); }
// floor(tau x cash) for X.
function shareCash(c, t1000) { return Math.floor(c * t1000 / 1000); }
const zeroLots = () => Object.fromEntries(GOODS.map(g => [g, 0]));

// The raid rule (§2, steps (1)-(4)). frac: the planner's fractional state, where today's lot is
// min(1, q) of the good (an interpretation, §9); in the engine q is an integer and today's lot is 1.
function raidOutcome(cargo, cash, rule, prc, frac = false) {
  const lots = zeroLots();
  let LV = 0;
  for (const g of GOODS) { const n = shareLots(cargo[g], rule.s); lots[g] = n; LV += n * prc(g); }
  let cargoLots = lots, cargoV = LV;
  const valuables = cargo.cloves > 0 || cargo.ivory > 0;
  if (valuables) {                                                  /*PLANT-ix*/
    const g = cargo.cloves > 0 ? "cloves" : "ivory";
    const one = frac ? Math.min(1, cargo[g]) : 1;
    const todayV = one * prc(g);
    if (LV < todayV) { cargoLots = zeroLots(); cargoLots[g] = one; cargoV = todayV; }   /*PLANT-v-raid*/
  }
  const c0 = Math.max(0, cash);                                     /*PLANT-x*/
  const X = Math.min(c0, Math.max(75, shareCash(c0, rule.t)));
  if (X >= cargoV) return { kind: "cash", X, lots: null, value: X };   /*PLANT-vi*/
  return { kind: "lots", X, lots: cargoLots, value: cargoV };
}
// The M rule (§2): lots floor(mu x q_g) if worth at least 2 x upkeep, else 2 x upkeep cash.
function mutinyOutcome(cargo, rule, base, prc) {
  const lots = zeroLots();
  let V = 0;
  for (const g of GOODS) { const n = shareLots(cargo[g], rule.m); lots[g] = n; V += n * prc(g); }
  if (V >= base) return { kind: "lots", lots, value: V, cash: 0 };     /*PLANT-v-M*/
  return { kind: "cash", lots: null, value: base, cash: base };
}
const wageOf = (upkeep, beta, u, cap) => beta ? Math.round(upkeep * (1 + beta * u / cap)) : upkeep;   /*PLANT-iii*/

// =========================================================================================
// Engine loader: tests/03/engine/load-engine.mjs's engineScript(), evaluated with lineOffset 1776,
// the engine script pinned by SHA-256, a DOM stand-in copied from that loader, and a recording RNG.
// =========================================================================================
function makeElement(id) {
  const classes = new Set(["hidden"]);
  const el = {
    id, textContent: "", innerHTML: "", className: "", value: "", disabled: false, hidden: false,
    src: "", alt: "", href: "", style: {}, attributes: {}, dataset: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)),
      toggle: (c, force) => { const on = force === undefined ? !classes.has(c) : Boolean(force); if (on) classes.add(c); else classes.delete(c); return on; },
      contains: c => classes.has(c)
    },
    setAttribute(name, v) { el.attributes[name] = String(v); }, getAttribute(name) { return el.attributes[name] ?? null; },
    querySelector: () => makeElement(null), querySelectorAll: () => [], appendChild: () => {}, addEventListener: () => {}, focus: () => {}, scrollIntoView: () => {}
  };
  return el;
}
function makeDocument() {
  const byId = new Map();
  const getElementById = id => { if (!byId.has(id)) byId.set(id, makeElement(id)); return byId.get(id); };
  return { byId, document: { getElementById, querySelector: () => makeElement(null), querySelectorAll: () => [], createElement: () => makeElement(null), addEventListener: () => {}, body: makeElement("body") } };
}
const FRAME = /monsoon-engine\.js:(\d+):\d+/;
class LabelledRandom {
  constructor() { this.queue = []; this.calls = 0; this.lines = []; this.served = []; }
  push(...v) { this.queue.push(...v); return this; }
  next() {
    const m = FRAME.exec(new Error().stack);
    this.lines.push(m ? Number(m[1]) : null);
    this.calls += 1;
    if (this.queue.length === 0) throw new Error(`unscripted Math.random() call #${this.calls}`);
    const v = this.queue.shift();
    this.served.push(v);
    return v;
  }
  get remaining() { return this.queue.length; }
  clear() { this.queue.length = 0; this.lines.length = 0; this.served.length = 0; this.calls = 0; }
}
function loadRaw() {
  const html = readFileSync(INDEX, "utf8");
  const source = engineScript(html);
  if (sha256(source) !== ENGINE_SHA256) throw new Error(`engine script SHA-256 ${sha256(source)} is not the pinned ${ENGINE_SHA256}`);
  const { document, byId } = makeDocument();
  const rng = new LabelledRandom();
  const context = vm.createContext({ document, console, print: () => {}, alert: () => {}, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0 });
  context.window = context;
  vm.runInContext(source, context, { filename: ENGINE_FILENAME, lineOffset: LINE_OFFSET });
  vm.runInContext(readFileSync(HARNESS, "utf8"), context, { filename: HARNESS });
  vm.runInContext(`globalThis.__engine = { get state() { return state; }, PORTS, SEA_LANES, COMMODITIES, VESSELS, DIFFICULTIES, MONTHS, CAMPAIGN_MONTHS };
    globalThis.__keyedRandom = () => globalThis.__rng.next();
    Math.random = globalThis.__keyedRandom;
    window.renderAll = () => {};`, Object.assign(context, { __rng: rng }));
  const api = context.__engine;
  return {
    g: context, source, rng, html, get state() { return api.state; },
    PORTS: api.PORTS, SEA_LANES: api.SEA_LANES, COMMODITIES: api.COMMODITIES, VESSELS: api.VESSELS, DIFFICULTIES: api.DIFFICULTIES,
    lane(from, to) { return api.SEA_LANES.find(l => l.from === from && l.to === to); }
  };
}

// --- §4.5 roles, frozen, and regenerated from the source (C4) ---------------------------------
const ROLE_TABLE = [["story-occurrence", 2360], ["story-pick", 2361], ["headwind-damage", 2404], ["turn-back", 2408], ["teak", 2411],
  ["transition-roll", 2419], ["storm-damage", 2423], ["mildew", 2438], ["piracy", 2451], ["mutiny", 2475]];
const LINE_ROLE = new Map(ROLE_TABLE.map(([r, l]) => [l, r]));
function rolesFromSource(source) {
  const out = [];
  source.split("\n").forEach((l, i) => { for (const _ of l.matchAll(/Math\.random\(\)/g)) out.push(i + 1 + LINE_OFFSET); });
  return out;
}

// =========================================================================================
// §2: research copies of sailTo and waitInPort. Each replacement is asserted to match exactly once,
// at the protocol's line, and keeps the line count, so stack lines stay the lines of the page at
// f71aba2 (C4 (iv)). The copies are evaluated under the engine's filename at their own lines.
// =========================================================================================
const SEA_WAGE_OLD = "      const crewCost = vessel.upkeep * calc.months;";
const SEA_WAGE_NEW = "      const crewCost = __sc.wage(vessel.upkeep) * calc.months; // RESEARCH COPY (scaling-costs §2, W)";
const RAID_OLD = [
  "          if (state.cargo.cloves > 0) {",
  "            state.cargo.cloves -= 1;",
  "            eventNotes.push(`Corsairs raided 1 crate of Moluccan Cloves!`);",
  "          } else if (state.cargo.ivory > 0) {",
  "            state.cargo.ivory -= 1;",
  "            eventNotes.push(`Corsairs seized 1 lot of East African Ivory!`);",
  "          } else {",
  "            const ransom = Math.min(Math.max(0, state.cash), 75);",
  "            state.cash -= ransom;",
  "            eventNotes.push(`Paid ${ransom} D pirate tribute in coastal straits`);",
  "          }"
].join("\n");
const RAID_NEW = [
  "          // RESEARCH COPY (scaling-costs protocol §2, the raid rule): today's floor, a cargo share s",
  "          // and a cash share tau, whatever is aboard. __sc.raid reads the state here (cash after wages",
  "          // and any doldrum; cargo after mildew), takes the larger in value of the cargo loss and X",
  "          // (ties: X), applies it to state, books it and pushes the event wording (today's wording",
  "          // when today's lot or tribute is taken). At s = tau = 0 it is today's raid (check C2 (j)).",
  "          __sc.raid(destId, calc, eventNotes, crewCost);",
  "          //",
  "          //",
  "          //",
  "          //",
  "          //"
].join("\n");
const MUT_OLD = "        const settlement = 2 * vessel.upkeep;\n        state.cash -= settlement;";
const MUT_NEW = "        const settlement = __sc.mutiny(vessel.upkeep, calc, eventNotes); // RESEARCH COPY (§2, M): lots, or 2 x upkeep cash\n        state.cash -= settlement;";
const WAIT_WAGE_OLD = "      const totalExpense = layoverFee + vessel.upkeep;";
const WAIT_WAGE_NEW = "      const totalExpense = layoverFee + __sc.wage(vessel.upkeep); // RESEARCH COPY (scaling-costs §2, W)";
const WAIT_LOG_OLD = "Crew: ${vessel.upkeep} D;";
const WAIT_LOG_NEW = "Crew: ${totalExpense - layoverFee} D;";
function researchCopies(source) {
  const lineAt = pos => source.slice(0, pos).split("\n").length + LINE_OFFSET;
  const fn = (head, next, expectLine) => {
    const i = source.indexOf(head);
    if (i < 0 || source.indexOf(head, i + 1) >= 0) throw new Error(`${head.trim()} not found exactly once`);
    const j = source.indexOf(next, i);
    if (lineAt(i) !== expectLine) throw new Error(`${head.trim()} at :${lineAt(i)}, not :${expectLine}`);
    return { i, text: source.slice(i, j), line: lineAt(i) };
  };
  const rep = (f, oldT, newT, expectLine) => {
    const k = f.text.indexOf(oldT);
    if (k < 0 || f.text.indexOf(oldT, k + 1) >= 0) throw new Error(`replacement not found exactly once: ${oldT.slice(0, 50)}`);
    const line = f.line + f.text.slice(0, k).split("\n").length - 1;   // replacements keep the line count
    if (line !== expectLine) throw new Error(`replacement at :${line}, not :${expectLine}: ${oldT.slice(0, 40)}`);
    if (oldT.split("\n").length !== newT.split("\n").length) throw new Error("replacement changes the line count");
    f.text = f.text.slice(0, k) + newT + f.text.slice(k + oldT.length);
  };
  const sail = fn("    function sailTo(destId) {", "\n    function advanceTime(", 2373);
  const original = { sail: sail.text };
  rep(sail, SEA_WAGE_OLD, SEA_WAGE_NEW, 2391);
  rep(sail, RAID_OLD, RAID_NEW, 2452);
  rep(sail, MUT_OLD, MUT_NEW, 2476);
  if (SC_PLANT_C3) rep(sail, "let pirateProb = destPort.piracyRisk *", "let pirateProb = (1 + __sc.rule.s / 1000) * destPort.piracyRisk *", 2447);
  if (SC_PLANT_VII) rep(sail, "if (Math.random() < pirateProb) {", "if (Math.random() <= pirateProb) {", 2451);
  if (SC_PLANT_VIII) rep(sail, "if (destStanding >= 50) pirateProb *= 0.5;", "if (false) pirateProb *= 0.5;", 2449);
  const wait = fn("    function waitInPort() {", "\n    function sailTo(", 2345);
  original.wait = wait.text;
  rep(wait, WAIT_WAGE_OLD, WAIT_WAGE_NEW, 2351);
  rep(wait, WAIT_LOG_OLD, WAIT_LOG_NEW, 2369);
  return { sail: sail.text, wait: wait.text, sailLine: sail.line, waitLine: wait.line, original };
}

// =========================================================================================
// §4.5 keyed draws (as #44 §4.6), with C4's per-action checks.
// =========================================================================================
const fnv1a = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; };
const mulberry32First = seed => { let a = seed | 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// Independent implementation for C4 (ii): byte arithmetic on UTF-8, BigInt multiplication.
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
// Mulberry32 stream for the bootstrap.
function mulberry32(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// =========================================================================================
// The research engine: copies installed, keyed draws, ledger and recorder in wrappers that only read
// state (the rules themselves act inside the copies through __sc).
// =========================================================================================
const COMMODITY = {};
function makeEngine({ copies = true } = {}) {
  const e = loadRaw();
  const rng = e.rng;
  for (const c of e.COMMODITIES) COMMODITY[c.id] = c;
  if (JSON.stringify(e.COMMODITIES.map(c => c.id)) !== JSON.stringify(GOODS)) throw new Error("COMMODITIES order differs from params");
  const sc = {
    rule: FLAT, plants: {}, keyed: false, seed: 0, override: null, pol: POL_L, cur: null, rec: null, end: null, preCargo: null,
    checks: { draws: 0, actions: 0, failures: [] }, logOps: false, firstMut: 0,
    // --- the rules, called from inside the research copies ---
    wage(upkeep) {
      const st = e.state, cap = e.VESSELS[st.vesselKey].capacity;
      const w = wageOf(upkeep, this.rule.beta, e.g.getUsedTonnage(), cap);
      if (this.cur) this.cur.wage = w;
      return w;
    },
    raid(destId, calc, notes, crewCost) {
      const st = e.state;
      const am = Math.min(23, st.monthIndex + calc.months);
      const prc = g => e.g.getLivePortPrice(COMMODITY[g], destId, am);
      const cashAtRaid = st.cash;                                   /*PLANT-ii*/
      const cargoAtRaid = { ...st.cargo };                          /*PLANT-iv*/
      const out = raidOutcome(cargoAtRaid, cashAtRaid, this.rule, prc);
      if (out.kind === "cash") {
        st.cash -= out.X;
        notes.push(`Paid ${out.X} D pirate tribute in coastal straits`);
      } else {
        const parts = [];
        for (const g of GOODS) if (out.lots[g] > 0) { st.cargo[g] -= out.lots[g]; parts.push(`${out.lots[g]}× ${COMMODITY[g].name}`); }
        const today = GOODS.filter(g => out.lots[g] > 0);
        if (today.length === 1 && out.lots[today[0]] === 1 && today[0] === "cloves") notes.push(`Corsairs raided 1 crate of Moluccan Cloves!`);
        else if (today.length === 1 && out.lots[today[0]] === 1 && today[0] === "ivory") notes.push(`Corsairs seized 1 lot of East African Ivory!`);
        else notes.push(`Corsairs raided ${parts.join(", ")}!`);
      }
      if (this.cur) {
        const prices = {};
        for (const g of GOODS) if (cargoAtRaid[g] > 0) prices[g] = prc(g);
        this.cur.raid = { kind: out.kind, X: out.kind === "cash" ? out.X : 0, lots: out.lots, value: out.value, cashAtRaid, cargo: cargoAtRaid, prices };
      }
    },
    mutiny(upkeep, calc, notes) {
      const st = e.state, base = 2 * upkeep;
      const am = Math.min(23, st.monthIndex + calc.months), port = st.currentPort;
      const prc = g => e.g.getLivePortPrice(COMMODITY[g], port, am);
      const out = mutinyOutcome(st.cargo, this.rule, base, prc);
      if (out.kind === "lots") {
        for (const g of GOODS) if (out.lots[g] > 0) st.cargo[g] -= out.lots[g];
        notes.push(`Crew took ${GOODS.filter(g => out.lots[g] > 0).map(g => `${out.lots[g]}× ${COMMODITY[g].name}`).join(", ")} in settlement`);
        if (this.cur) this.cur.mut = { kind: "lots", lots: out.lots, value: out.value, cash: 0 };   /*PLANT-C5*/
        return 0;
      }
      if (this.cur) this.cur.mut = { kind: "cash", lots: null, value: base, cash: base };
      return base;                                                  /*PLANT-C1a*/
    },
    // --- keyed draws (§4.5) ---
    roleSequence(kind, dest) {
      const st = e.state, roles = [], vals = [];
      const key = kind === "wait" ? st.currentPort : `${st.currentPort}>${dest}`;
      let months = 1;
      if (kind !== "wait") months = e.g.computeTransit(e.lane(st.currentPort, dest)).months;
      const keyMonth = st.monthIndex;                                /*PLANT-C1b*/
      const draw = role => {
        const forced = this.override && role in this.override;
        const k = this.plants.variantInKey ? `${this.seed}|${this.rule.id}|${role}|${keyMonth}|${key}` : `${this.seed}|${role}|${keyMonth}|${key}`;
        const x = forced ? this.override[role] : mulberry32First(fnv1a(k));
        roles.push({ role, key: forced ? null : k }); vals.push(x);
        return x;
      };
      if (kind === "wait") {
        if (draw("story-occurrence") < 0.75) draw("story-pick");
      } else {
        const calc = e.g.computeTransit(e.lane(st.currentPort, dest));
        let tb = false, storm = false;
        if (calc.isHeadwind) { draw("headwind-damage"); tb = draw("turn-back") < 0.35; if (!tb && st.cargo.teak > 0) draw("teak"); }
        if (calc.isDeadZone) { const roll = draw("transition-roll"); if (roll < calc.stormProbability) { storm = true; draw("storm-damage"); } }
        if (st.cargo.textiles > 0 && !st.specialists.tarpaulins && calc.isDeadZone) draw("mildew");
        if (!tb) draw("piracy");
        const loss = calc.months * 8 + (calc.isHeadwind ? 12 : 0) + (storm ? 12 : 0);
        if (Math.max(0, 50 - Math.max(0, st.crewHealth - loss)) / 100 > 0) draw("mutiny");
      }
      void months;
      let seq = roles.map(r => r.role);
      if (this.plants.swapRoles) seq = seq.map(r => r === "piracy" ? "mutiny" : r === "mutiny" ? "piracy" : r);
      return { vals, roles: seq, keys: roles.map(r => r.key).filter(Boolean) };
    },
    pre(kind, dest) {
      const st = e.state;
      const info = { kind, dest, port: st.currentPort, month: st.monthIndex, calls: rng.calls, lines: rng.lines.length };
      if (this.keyed && !st.ended && (kind === "wait" || e.lane(st.currentPort, dest))) {
        info.q = this.roleSequence(kind, dest);
        rng.push(...info.q.vals);
      }
      return info;
    },
    post(info) {
      if (!info.q) return;
      this.checks.actions++;
      const q = info.q, f = [];
      const n = rng.calls - info.calls;
      const served = rng.served.slice(rng.served.length - n);
      const lines = rng.lines.slice(info.lines);
      if (rng.remaining !== 0) f.push("i:remaining=" + rng.remaining);
      if (n !== q.vals.length) f.push(`v:calls=${n}/${q.vals.length}`);
      for (const k of q.keys) if (!KEY_RE.test(k)) f.push("iii:key=" + k);
      lines.forEach((ln, i) => {
        const role = LINE_ROLE.get(ln);
        if (role !== q.roles[i]) f.push(`iv:line ${ln}=${role} vs ${q.roles[i]}`);
        if (!this.override || !(role in this.override)) {
          const u = rebuildU(`${this.seed}|${role}|${info.month}|${info.kind === "wait" ? info.port : info.port + ">" + info.dest}`);
          if (u !== served[i]) f.push(`ii:${role}`);
        }
      });
      this.checks.draws += lines.length;
      info.served = served; info.lines = lines;
      if (f.length) { this.checks.failures.push({ month: info.month, kind: info.kind, port: info.port, dest: info.dest, f }); rng.queue.length = 0; }
    }
  };
  e.g.__sc = sc;
  e.sc = sc;
  if (copies) {
    const rc = researchCopies(e.source);
    e.copies = rc;
    vm.runInContext(`sailTo = ${rc.sail.trimStart()};`, e.g, { filename: ENGINE_FILENAME, lineOffset: rc.sailLine - 1 });
    vm.runInContext(`waitInPort = ${rc.wait.trimStart()};`, e.g, { filename: ENGINE_FILENAME, lineOffset: rc.waitLine - 1 });
  }
  installRecorder(e);
  return e;
}

// mode: "off" (every draw 0.99), "stream" (harnessReset's mulberry32), "keyed" (§4.5)
function resetEngine(e, v, diff, seed, mode, cfg = {}) {
  vm.runInContext(`harnessReset(${JSON.stringify(v)}, ${JSON.stringify(diff)}, ${JSON.stringify(cfg.port || "calicut")}, ${seed});`, e.g);
  if (mode === "off") vm.runInContext(`Math.random = () => 0.99;`, e.g);
  if (mode === "keyed" && !e.sc.plants.noReinstall) vm.runInContext(`Math.random = globalThis.__keyedRandom;`, e.g);
  e.rng.clear();
  const sc = e.sc;
  sc.rule = cfg.rule || FLAT; sc.keyed = mode === "keyed"; sc.seed = seed; sc.override = cfg.override || null;
  sc.pol = cfg.pol || POL_L; sc.end = null; sc.cur = null; sc.firstMut = 0;
  sc.logOps = !!cfg.logOps;
  sc.rec = newRec(e, cfg);
}

// =========================================================================================
// Ledger and recorder (§4.1 outcomes; C5; C6). One record per campaign.
// =========================================================================================
const W_OF = st => st.cash + GOODS.reduce((a, g) => a + st.cargo[g] * st.costBasis[g], 0) - st.debt;
function newRec(e, cfg) {
  const st = e.state;
  return {
    W0: W_OF(st), acts: [], sails: [], waits: [], raids: [], ops: cfg.logOps ? [] : null, events: cfg.events ? [] : null,
    breaches: 0, minCashAfter: Infinity, minInsideWait: Infinity, capEvents: 0, capLots: 0,
    loaded: zeroLots(), sold: zeroLots(), lost: { raid: zeroLots(), mut: zeroLots(), jet: zeroLots(), porc: zeroLots(), mild: zeroLots() },
    c5: [], mutinies: 0, raidsN: 0, logC: 0, ledgerC: 0, decision: 0
  };
}
const RE_PORC = /shattered (\d+) crate/;
const COST_KEYS = ["wage", "fee", "dold", "raidCash", "raidLotsV", "mutCash", "mutLotsV"];
const SEP_KEYS = ["jet", "porc", "mild", "rep"];
function installRecorder(e) {
  const sc = e.sc, st = () => e.state;
  const addedLine = n0 => st().logs[st().logs.length - n0 - 1] || "";
  const act = (k, m0, c, extra) => {
    const s = st(), rec = sc.rec;
    if (!rec) return;
    rec.acts.push({ k, m0, m1: s.monthIndex, cash: s.cash, W: W_OF(s), c, ...extra });
  };
  const breach = () => { const rec = sc.rec, s = st(); if (!rec) return; rec.minCashAfter = Math.min(rec.minCashAfter, s.cash); if (s.cash < 0) rec.breaches++; };   /*PLANT-C6b*/
  sc.decisionPoint = () => { /*PLANT-C6b-dp*/ };
  e.g.__rec = {
    sell(orig, id, qty) {
      const s = st(), rec = sc.rec, before = s.cargo[id], c0 = s.cash, m0 = s.monthIndex;
      if (s.ended) return orig(id, qty);
      const p = e.g.getLivePortPrice(COMMODITY[id], s.currentPort, s.monthIndex);
      orig(id, qty);
      const n = before - s.cargo[id];
      if (n > 0 && rec) {
        rec.sold[id] += n;
        if (s.cash - c0 !== n * p) rec.c5.push({ k: "sell", d: s.cash - c0, want: n * p });
        act("x", m0, null);
        if (rec.ops) rec.ops.push(["x", id, 999]);
      }
    },
    buy(orig, id, qty) {
      const s = st(), rec = sc.rec, before = s.cargo[id], c0 = s.cash, m0 = s.monthIndex;
      if (s.ended) return orig(id, qty);
      const unit = Math.round(e.g.getLivePortPrice(COMMODITY[id], s.currentPort, s.monthIndex) * (1 + e.g.getEffectiveTariff(s.currentPort)));
      orig(id, qty);
      const a = s.cargo[id] - before;
      if (rec) {
        if (a < qty) { rec.capEvents++; rec.capLots += qty - a; }
        if (a > 0) {
          rec.loaded[id] += a;
          if (c0 - s.cash !== a * unit) rec.c5.push({ k: "buy", d: c0 - s.cash, want: a * unit });
          act("b", m0, null);
          if (rec.ops) rec.ops.push(["b", id, a]);
        }
      }
    },
    repair(orig) {
      const s = st(), rec = sc.rec, c0 = s.cash, m0 = s.monthIndex;
      if (s.ended) return orig();
      orig();
      if (rec && s.cash !== c0) {
        if (c0 - s.cash !== 60) rec.c5.push({ k: "repair", d: c0 - s.cash });
        act("r", m0, null, { sep: { rep: 60 } });
        if (rec.ops) rec.ops.push(["r"]);
      }
    },
    wait(orig) {
      const s = st(), rec = sc.rec;
      if (s.ended) return orig();
      const info = sc.pre("wait");
      const m0 = s.monthIndex, c0 = s.cash, port = s.currentPort, n0 = s.logs.length;
      const fee = e.g.getEffectiveLayoverFee(port);
      const wantWage = wageOf(e.VESSELS[s.vesselKey].upkeep, sc.rule.beta, e.g.getUsedTonnage(), e.VESSELS[s.vesselKey].capacity);
      const voluntary = e.SEA_LANES.some(l => l.from === port && allowed(e.g.computeTransit(l).alignmentStatus, sc.pol));
      sc.cur = {};
      orig();
      sc.post(info);
      const line = addedLine(n0);
      const story = line.includes("+25 D") ? 25 : line.includes("+20 D") ? 20 : line.includes("+15 D") ? 15 : 0;
      const wage = sc.cur.wage;
      sc.cur = null;
      if (!rec) return;
      const inside = c0 - fee - wage;
      rec.minInsideWait = Math.min(rec.minInsideWait, inside);
      if (wage !== wantWage) rec.c5.push({ k: "wait-wage", wage, wantWage });
      // the finish (if this wait ended the campaign) is accounted separately; compare only before it
      const cashAfterWait = sc.end && sc.end.atAction === rec.acts.length ? sc.end.cashBefore : s.cash;
      if (cashAfterWait - c0 !== -(fee + wage) + story) rec.c5.push({ k: "wait", d: cashAfterWait - c0, want: -(fee + wage) + story });
      // log-derived cost (C5 "C from the log"): "Layover: F D + Crew: W D"
      const ml = /Layover: (\d+) D \+ Crew: (\d+) D/.exec(line);
      rec.logC += ml ? Number(ml[1]) + Number(ml[2]) : NaN;
      rec.ledgerC += fee + wage;
      rec.waits.push({ m0, voluntary, port });
      act("w", m0, { wage, fee }, { story });
      breach();
      if (rec.ops) rec.ops.push(["w"]);
      if (rec.events) rec.events.push({ k: "w", m: m0, served: info.served || null, ev: [story] });
    },
    sail(orig, d) {
      const s = st(), rec = sc.rec;
      const lane = e.lane(s.currentPort, d);
      if (s.ended || !lane) return orig(d);
      const calc = e.g.computeTransit(lane);
      const guard = [s.cargo.teak > 0 ? 1 : 0, s.cargo.textiles > 0 ? 1 : 0, (s.cargo.cloves > 0 || s.cargo.ivory > 0) ? 1 : 0, s.crewHealth];
      const info = sc.pre("sail", d);
      const m0 = s.monthIndex, c0 = s.cash, from = s.currentPort, n0 = s.logs.length, crew0 = s.crewHealth;
      const cargo0 = { ...s.cargo }, used0 = e.g.getUsedTonnage();
      sc.preCargo = cargo0;
      const cap = e.VESSELS[s.vesselKey].capacity, upkeep = e.VESSELS[s.vesselKey].upkeep;
      const am = Math.min(23, m0 + calc.months);
      const hv = cargo0.cloves > 0 || cargo0.ivory > 0;
      const stand = s.diaspora[d] || 0;
      let p = e.PORTS[d].piracyRisk * (hv ? 1.5 : 0.6) * (s.diffKey === "survival" ? 1.8 : 1.0);
      if (stand >= 50) p *= 0.5;
      const prcDest = g => e.g.getLivePortPrice(COMMODITY[g], d, am);
      const holdV = GOODS.reduce((a, g) => a + cargo0[g] * prcDest(g), 0);
      const valV = cargo0.cloves * prcDest("cloves") + cargo0.ivory * prcDest("ivory");
      sc.cur = {};
      orig(d);
      sc.post(info);
      const cur = sc.cur; sc.cur = null;
      if (!rec) return;
      const line = addedLine(n0);
      const tb = line.includes("(TURNED BACK)");
      const after = sc.end && sc.end.atAction === rec.acts.length ? sc.end.cargoBefore : s.cargo;
      const cashAfter = sc.end && sc.end.atAction === rec.acts.length ? sc.end.cashBefore : s.cash;
      const portAfter = tb ? from : d;
      const prcAfter = g => e.g.getLivePortPrice(COMMODITY[g], portAfter, am);
      const dold = line.includes("Becalmed in Doldrums") ? 20 : 0;
      const jet = line.includes("Jettisoned 1 lot of heavy Teak") ? 1 : 0;
      const mild = line.includes("mildewed 1 bale") ? 1 : 0;
      const pm = RE_PORC.exec(line); const porc = pm ? Number(pm[1]) : 0;
      const wantWage = wageOf(upkeep, sc.rule.beta, used0, cap);
      const wage = cur.wage * calc.months;
      if (cur.wage !== wantWage) rec.c5.push({ k: "sail-wage", wage: cur.wage, wantWage });
      const raid = cur.raid || null, mut = cur.mut || null;
      const raidCash = raid && raid.kind === "cash" ? raid.X : 0;
      const raidLotsV = raid && raid.kind === "lots" ? raid.value : 0;
      const mutCash = mut ? mut.cash : 0;
      const mutLotsV = mut && mut.kind === "lots" ? mut.value : 0;
      // C5: cash change recomputed independently (wages from the tonnage at departure, the doldrum from the log) + rule charges
      if (cashAfter - c0 !== -(wantWage * calc.months) - dold - raidCash - mutCash) rec.c5.push({ k: "sail", d: cashAfter - c0, want: -(wantWage * calc.months) - dold - raidCash - mutCash });
      // lost by cause, and the cargo change it must explain
      if (raid && raid.kind === "lots") for (const g of GOODS) rec.lost.raid[g] += raid.lots[g];
      if (mut && mut.kind === "lots") for (const g of GOODS) rec.lost.mut[g] += mut.lots[g];
      rec.lost.jet.teak += jet; rec.lost.mild.textiles += mild; rec.lost.porc.porcelain += porc;
      for (const g of GOODS) {
        const booked = (raid && raid.kind === "lots" ? raid.lots[g] : 0) + (mut && mut.kind === "lots" ? mut.lots[g] : 0) + (g === "teak" ? jet : 0) + (g === "textiles" ? mild : 0) + (g === "porcelain" ? porc : 0);
        if (cargo0[g] - after[g] !== booked) rec.c5.push({ k: "sail-cargo", g, d: cargo0[g] - after[g], booked });
      }
      // log-derived cost (C5 "C from the log")
      const mw = /Crew: -(\d+) D\)/.exec(line);
      let logC = mw ? Number(mw[1]) : NaN;
      logC += dold;
      const mt = /Paid (\d+) D pirate tribute/.exec(line); if (mt) logC += Number(mt[1]);
      const mm = /Crew mutiny settled at port \(-(\d+) D\)/.exec(line); if (mm) logC += Number(mm[1]);
      const lotsFromLog = {};
      if (line.includes("Corsairs raided 1 crate of Moluccan Cloves!")) lotsFromLog.cloves = (lotsFromLog.cloves || 0) + 1;
      if (line.includes("Corsairs seized 1 lot of East African Ivory!")) lotsFromLog.ivory = (lotsFromLog.ivory || 0) + 1;
      const many = /Corsairs raided ([^!]*\d+× [^!]*)!/.exec(line);
      const parseLots = txt => { for (const [, n, name] of txt.matchAll(/(\d+)× ([^,]+?)(?=,|$)/g)) { const g = GOODS.find(x => COMMODITY[x].name === name.trim()); if (g) lotsFromLog[g] = (lotsFromLog[g] || 0) + Number(n); } };
      if (many) parseLots(many[1]);
      const mlots = /Crew took ([^;|]*) in settlement/.exec(line);
      const raidLogV = GOODS.reduce((a, g) => a + (lotsFromLog[g] || 0) * prcAfter(g), 0);
      const mutLog = {};
      if (mlots) for (const [, n, name] of mlots[1].matchAll(/(\d+)× ([^,]+?)(?=,|$)/g)) { const g = GOODS.find(x => COMMODITY[x].name === name.trim()); if (g) mutLog[g] = Number(n); }
      const mutLogV = GOODS.reduce((a, g) => a + (mutLog[g] || 0) * prcAfter(g), 0);
      logC += raidLogV + mutLogV;
      const ledC = wage + dold + raidCash + raidLotsV + mutCash + mutLotsV;
      rec.logC += logC; rec.ledgerC += ledC;
      if (raid) rec.raidsN++;
      if (mut) rec.mutinies++;
      const c = { wage, dold, raidCash, raidLotsV, mutCash, mutLotsV };
      const sep = { jet: jet * prcAfter("teak"), porc: porc * prcAfter("porcelain"), mild: mild * prcAfter("textiles") };
      act("s", m0, c, { sep, tb });
      rec.sails.push({ m0, from, to: d, crew0, laden: used0 > 0, hv, p, holdV, valV, stand50: stand >= 50, tb, months: calc.months, dead: calc.isDeadZone, head: calc.isHeadwind });
      if (raid) rec.raids.push({ i: rec.acts.length - 1, cash: raid.cashAtRaid, cargo: raid.cargo, prices: raid.prices, kind: raid.kind, value: raid.value });
      breach();
      if (rec.ops) rec.ops.push(["s", d]);
      if (rec.events) rec.events.push({ k: "s", m: m0, guard, served: info.served || null, roles: info.q ? info.q.roles : null,
        ev: [tb ? 1 : 0, line.includes("Struck by inter-monsoon cyclone") ? 1 : 0, dold ? 1 : 0, jet, mild, porc > 0 ? 1 : 0, raid ? 1 : 0, mut ? 1 : 0] });
    },
    finish(orig) {
      const s = st(), t = s.monthIndex, pm = Math.min(23, t);
      const cashBefore = s.cash, debtBefore = s.debt, cargoBefore = { ...s.cargo };
      const liq = GOODS.reduce((a, g) => a + s.cargo[g] * e.g.getLivePortPrice(COMMODITY[g], s.currentPort, pm), 0);
      const rec = sc.rec;
      sc.end = { t, cashBefore, debtBefore, cargoBefore, liq, atAction: rec ? rec.acts.length : -1 };
      orig();
      const E = s.cash - s.startEquity;
      const S = cashBefore - debtBefore - s.startEquity + (t < END ? liq : 0);    /*PLANT-C8*/
      Object.assign(sc.end, { E, S, cashAfter: s.cash, ruin: ruinOf(cashBefore, s), ruinMonth: t });
      if (rec && cashBefore + liq - debtBefore !== s.cash) rec.c5.push({ k: "finish", d: s.cash - cashBefore, want: liq - debtBefore });
    }
  };
  vm.runInContext(`(() => {
    const o = { sell: sellCargoQty, buy: buyCargoQty, repair: repairHull, sail: sailTo, wait: waitInPort, fin: finishCampaign };
    sellCargoQty = function (id, q) { return __rec.sell(o.sell, id, q); };
    buyCargoQty = function (id, q) { return __rec.buy(o.buy, id, q); };
    repairHull = function () { return __rec.repair(o.repair); };
    sailTo = function (d) { return __rec.sail(o.sail, d); };
    waitInPort = function () { return __rec.wait(o.wait); };
    finishCampaign = function () { return __rec.finish(o.fin); };
    renderAll = function () {};
  })();`, e.g);
}
// D07: ruin from the end check's cash, never from log text.
function ruinOf(cashBefore, s) { return cashBefore < -250; }        /*PLANT-C6a*/

// A campaign's record, summarised (§4.1).
function summarise(e, extra = {}) {
  const sc = e.sc, rec = sc.rec, end = sc.end, st = e.state;
  if (!st.ended || !end) return { ended: false };
  const acts = rec.acts;
  const Wat = t => { let w = rec.W0; for (const a of acts) if (a.m1 <= t) w = a.W; return w; };
  let i12 = -1;
  acts.forEach((a, i) => { if (a.m1 <= 12) i12 = i; });
  const sumC = (from, pred) => { const o = Object.fromEntries([...COST_KEYS, ...SEP_KEYS].map(k => [k, 0])); acts.forEach((a, i) => { if (!pred(a, i)) return; if (a.c) for (const k of COST_KEYS) o[k] += a.c[k] || 0; if (a.sep) for (const k of SEP_KEYS) o[k] += a.sep[k] || 0; }); return o; };
  const late = sumC(0, (a, i) => i > i12), early = sumC(0, a => a.m1 <= 6);
  const tot = o => COST_KEYS.reduce((x, k) => x + o[k], 0);
  // conservation (C5): loaded = sold + liquidated + lost by cause
  const cons = [];
  for (const g of GOODS) {
    const lost = rec.lost.raid[g] + rec.lost.mut[g] + rec.lost.jet[g] + rec.lost.porc[g] + rec.lost.mild[g];
    if (rec.loaded[g] !== rec.sold[g] + end.cargoBefore[g] + lost) cons.push({ g, loaded: rec.loaded[g], sold: rec.sold[g], liq: end.cargoBefore[g], lost });
  }
  const sails = rec.sails, laden = sails.filter(x => x.laden), hvS = sails.filter(x => x.hv);
  const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0);
  return {
    ended: true, S: end.S, E: end.E, ruin: end.ruin ? 1 : 0, ruinMonth: end.ruin ? end.ruinMonth : null, endMonth: end.t,
    W6: Wat(6), W12: Wat(12), W24: Wat(24), dWlate: Wat(24) - Wat(12), Clate: tot(late), Cearly: tot(early), late, early,
    breaches: rec.breaches, minCashAfter: rec.minCashAfter, minInsideWait: rec.minInsideWait, capEvents: rec.capEvents, capLots: rec.capLots,
    c5: rec.c5.length, c5first: rec.c5[0] || null, cons: cons.length, consFirst: cons[0] || null, logC: rec.logC, ledgerC: rec.ledgerC,
    raids: rec.raidsN, mutinies: rec.mutinies,
    deps: sails.length, laden: laden.length, hvDeps: hvS.length,
    volWaits: rec.waits.filter(w => w.voluntary).length, waits: rec.waits.length,
    crewDepSum: sum(sails, x => x.crew0), crewLt50: sails.filter(x => x.crew0 < 50).length,
    postLt50: sails.filter(x => x.crew0 - x.months * 8 - (x.head ? 12 : 0) < 50).length,
    pHVsum: sum(hvS, x => x.p), pLadenSum: sum(laden, x => x.p), pAllSum: sum(sails, x => x.p),
    ladenRisky: laden.filter(x => ["malacca", "aden", "kilwa"].includes(x.to)).length,
    holdVsum: sum(laden, x => x.holdV), valVsum: sum(laden, x => x.valV), ladenStand50: laden.filter(x => x.stand50).length,
    ...extra
  };
}

// =========================================================================================
// Players
// =========================================================================================
// --- H: the published harness, research copy (baseline-harness.js:87-122), with the fill rule and the
// wage in force. Lanes are ranked on the plan made under the fill in force and the wage the engine will
// charge for the planned cargo (§4.2; §9 interpretation).
function hPlan(e, lane, rule, fill) {
  const st = e.state, g = e.g;
  const calc = g.computeTransit(lane);
  const arrival = Math.min(23, st.monthIndex + calc.months);
  const tariff = g.getEffectiveTariff(st.currentPort);
  const V = e.VESSELS[st.vesselKey], capacity = V.capacity;
  const items = e.COMMODITIES.map(c => {
    const cost = Math.round(g.getLivePortPrice(c, st.currentPort, st.monthIndex) * (1 + tariff));
    const sale = g.getLivePortPrice(c, lane.to, arrival);
    return { c, cost, sale, ratio: sale / cost };
  }).filter(x => x.ratio > 1).sort((a, b) => b.ratio - a.ratio);
  const used0 = g.getUsedTonnage();
  let cash = Math.max(0, st.cash - 60), tons = 0, gross = 0, spent = 0;
  const buys = [];
  for (const x of items) {
    let q = Math.min(Math.floor((capacity - tons) / x.c.weight), Math.floor(cash / x.cost));
    if (fill === "G+") while (q > 0 && st.cash - spent - q * x.cost < 60 + calc.months * wageOf(V.upkeep, rule.beta, used0 + tons + q * x.c.weight, capacity)) q--;
    if (q > 0) { buys.push([x.c.id, q]); cash -= q * x.cost; spent += q * x.cost; tons += q * x.c.weight; gross += q * (x.sale - x.cost); }
  }
  const wages = calc.months * wageOf(V.upkeep, rule.beta, used0 + tons, capacity);
  return { lane, calc, buys, perMonth: (gross - wages) / calc.months };
}
function hRun(e, v, diff, pol, rule, fill, seed, mode = "keyed", cfg = {}) {
  resetEngine(e, v, diff, seed, mode, { rule, pol, ...cfg });
  const st = () => e.state, g = e.g;
  let guard = 0;
  while (!st().ended && guard++ < 200) {
    for (const c of e.COMMODITIES) if (st().cargo[c.id] > 0) g.sellCargoQty(c.id, 999);
    e.sc.decisionPoint();
    if (st().hull < 60 && st().cash > 200) g.repairHull();
    let plans = e.SEA_LANES.filter(l => l.from === st().currentPort).map(l => hPlan(e, l, rule, fill));
    if (pol !== "sailAlways") plans = plans.filter(p => !p.calc.isHeadwind);
    if (pol === "avoidHeadwindAndTransition") plans = plans.filter(p => !p.calc.isDeadZone);
    plans.sort((a, b) => b.perMonth - a.perMonth);
    if (!plans.length) { g.waitInPort(); continue; }
    for (const [id, q] of plans[0].buys) g.buyCargoQty(id, q);
    g.sailTo(plans[0].lane.to);
  }
  return e.state.ended ? e.state.cash - e.state.startEquity : null;
}

// --- L-EV: the crew-aware expected-cost re-planner (§4.2) ---------------------------------------
const portBit = Object.fromEntries(PORTS.map((p, i) => [p, 1 << i]));
const rOf = h => Math.max(0, 50 - Math.max(0, h)) / 100;
class PSim extends AR.Sim {
  constructor(v, diff, opts = {}) {
    super(v, diff, opts);
    this.rule = opts.rule || FLAT; this.identity = !!opts.identity; this.netS = null;
  }
  clone() {
    const s = Object.create(PSim.prototype);
    Object.assign(s, this, { cargo: { ...this.cargo }, dias: { ...this.dias }, log: this.log ? [...this.log] : null });
    return s;
  }
  flags() { let f = 0; for (const p of PORTS) if (this.dias[p] >= 50) f |= portBit[p]; return f; }
  sail(dest) {
    const V = P.vessels[this.v], D = P.difficulties[this.diff];
    const [m, st] = transit(this.port, dest, this.v, this.t);
    this.cash -= V.wages * m;
    const head = isHead(st), dead = isDead(st);
    let loss = m * HZ.crewSeaPerMonth;
    if (head) {
      loss += HZ.crewHazard;
      const dmg = Math.round((HZ.headwindDamage[0] + AR.OFF * HZ.headwindDamage[1]) * V.damageMult * D.damageMult);
      this.hull = Math.max(HZ.hullFloor, this.hull - dmg);
    }
    if (this.cargo.porcelain > 0 && this.hull < HZ.porcelainHullBelow && (head || dead)) {
      this.cargo.porcelain -= Math.max(1, Math.floor(this.cargo.porcelain * HZ.porcelainShare));
    }
    let h = Math.max(0, this.crew - loss), q = 0;
    if (!this.identity) ({ h, q } = applyTerms(this, dest, m, dead, loss));
    if (this.identity && dead && SC_PLANT_C1B_IDENTITY) this.cash -= HZ.becalmBand * HZ.becalmCost;
    this.port = dest;
    this.dias[dest] = Math.min(100, this.dias[dest] + P.standing.perArrival);
    this.crew = this.identity ? h : Math.max(0, h - HZ.crewHazard * q);       // the label's crew: h - 12q
    this.advance(m); this.rec("sail", { dest });
  }
  finish() {
    const t = this.t, pm = Math.min(23, t), cashBefore = this.cash, debt = this.debt;
    const liq = GOODS.reduce((a, g) => a + (this.cargo[g] > 0 ? this.cargo[g] * price(g, this.port, pm) : 0), 0);
    super.finish();
    this.netS = cashBefore - debt - this.equity + (t < END ? liq : 0);
  }
}
// The planner's raid term at a state (shared with C7): p in the engine's order, and the rule's loss at
// the state's cash (after wages and the expected doldrum) and cargo.
function expectedRaid(s, dest, prc) {
  const hv = s.cargo.cloves > 0 || s.cargo.ivory > 0;
  let p = P.ports[dest].piracy * (hv ? 1.5 : 0.6) * (s.diff === "survival" ? 1.8 : 1.0);   /*PLANT-C7a*/
  if (s.dias[dest] >= 50) p *= 0.5;
  return { p, out: raidOutcome(s.cargo, s.cash, s.rule, prc, true) };
}
// Two-point expected mutiny risk over the storm (§4.2, §3): h is the crew after the leg's ordinary loss.
function mutinyRisk2(h, q) { return (1 - q) * rOf(h) + q * rOf(h - HZ.crewHazard); }
function plannerRisk(h, q) { return mutinyRisk2(h, q); }                    /*PLANT-C7b*/
// The expected terms of one planned leg (§4.2), applied to a planning state whose cash is already net
// of the leg's wages, in the engine's order: doldrum, raid (at the destination's standing before
// arrival), mutiny (two-point over the storm, and for lots two-point over the raid). Returns each
// term in D (lots at the valuation convention), the crew h after the ordinary loss and the storm q.
// L-EV's planning and check C7 both use this function.
function applyTerms(s, dest, m, dead, loss) {
  const q = dead ? HZ.storm : 0, am = Math.min(23, s.t + m), prc = g => price(g, dest, am), V = P.vessels[s.v];
  const T = { dold: 0, raidLotsV: 0, raidCash: 0, mutLotsV: 0, mutCash: 0 };
  if (dead) { T.dold = HZ.becalmBand * HZ.becalmCost; s.cash -= T.dold; }
  const cargoPre = { ...s.cargo };
  const r = expectedRaid(s, dest, prc), p = r.p;
  let raidLots = null;
  if (r.out.kind === "lots") { raidLots = r.out.lots; for (const g of GOODS) s.cargo[g] -= p * raidLots[g]; T.raidLotsV = p * r.out.value; }
  else { s.cash -= p * r.out.X; T.raidCash = p * r.out.X; }
  const h = Math.max(0, s.crew - loss);
  const rbar = plannerRisk(h, q);
  if (rbar > 0) {
    const base = 2 * V.wages;
    const A = mutinyOutcome(cargoPre, s.rule, base, prc);
    const B = raidLots ? mutinyOutcome(Object.fromEntries(GOODS.map(g => [g, cargoPre[g] - raidLots[g]])), s.rule, base, prc) : A;
    for (const [w, o] of [[1 - p, A], [p, B]]) {
      if (o.kind === "lots") { for (const g of GOODS) s.cargo[g] -= rbar * w * o.lots[g]; T.mutLotsV += rbar * w * o.value; }
      else { s.cash -= rbar * w * base; T.mutCash += rbar * w * base; }
    }
  }
  return { T, h, q, p, rbar };
}

// Pareto labels on (cash, crew, standing flags) at each (port, month); ties keep the first label.
function dominates(a, b, mode) {
  if (a.cash < b.cash) return false;
  if (mode === "cash") return true;                                     /*PLANT-C10a*/
  if (a.crew < b.crew) return false;
  if (mode === "noflags") return true;
  const fa = a.flags(), fb = b.flags();
  return (fa & fb) === fb;                                              /*PLANT-C10b*/
}
function solveP(start, pol, { identity = false, forced = null, domMode = null, stats = null } = {}) {
  const mode = identity ? "cash" : (domMode || "full");
  const nodes = new Map(), key = (p, t) => `${p}|${t}`;
  nodes.set(key(start.port, start.t), [{ s: start, prev: null, act: null }]);
  let term = null, labels = 1;
  const val = s => identity ? s.net : s.netS;
  const push = (s, prev, act) => {
    if (s.ended) { if (!term || val(s) > val(term.s)) term = { s, prev, act }; return; }
    const k = key(s.port, s.t);
    const list = nodes.get(k);
    if (!list) { nodes.set(k, [{ s, prev, act }]); labels++; return; }
    for (const x of list) if (dominates(x.s, s, mode)) return;
    const kept = list.filter(x => !dominates(s, x.s, mode));
    kept.push({ s, prev, act }); labels++;
    nodes.set(k, kept);
  };
  for (let t = start.t; t < END; t++) {
    for (const p of PORTS) {
      const list = nodes.get(key(p, t));
      if (!list) continue;
      for (const node of list) {
        const root = node.prev === null;
        if (!(root && forced && forced[0] !== "wait")) { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); }
        for (const pth of PATHS[p]) {
          if (root && forced && (forced[0] === "wait" || forced[1].join(">") !== pth.join(">"))) continue;
          if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue;
          const s = node.s.clone(); s.log = null;
          if (!AR.deliver(s, pth, pol, "greedy")) continue;
          push(s, node, ["deliver", pth]);
        }
      }
    }
  }
  if (stats) stats.labels = labels;
  const acts = [];
  for (let n = term; n && n.act; n = n.prev) acts.unshift(n.act);
  return { net: term ? val(term.s) : null, acts };
}
function snapP(e, v, diff, opts) {
  const st = e.state, s = new PSim(v, diff, opts);
  Object.assign(s, { cash: st.cash, debt: st.debt, equity: st.startEquity, t: st.monthIndex, port: st.currentPort,
    hull: st.hull, crew: st.crewHealth, ended: st.ended, dias: { ...st.diaspora } });
  s.cargo = Object.fromEntries(GOODS.map(g => [g, st.cargo[g]]));
  return s;
}
const actKey = a => !a ? "none" : a[0] === "wait" ? "wait" : a[1].join(">");
// replanRun (adaptive-routes §4.3), with the crew-aware solve. onState(s0, act) sees every decision point.
function levRun(e, v, diff, rule, seed, { identity = false, mode = "keyed", pol = POL_L, onState = null, cfg = {} } = {}) {
  resetEngine(e, v, diff, seed, mode, { rule, pol, ...cfg });
  const g = e.g;
  for (let guard = 0; !e.state.ended && guard < 300; guard++) {
    for (const c of GOODS) if (e.state.cargo[c] > 0) g.sellCargoQty(c, 999);
    e.sc.decisionPoint();
    const s0 = snapP(e, v, diff, { rule, identity });
    e.sc.rec.decision++;
    const plan = solveP(s0, pol, { identity });
    const act = plan.acts[0];
    if (onState) onState(s0, act, plan.net);
    if (!act || act[0] === "wait") { g.waitInPort(); continue; }
    const pth = act[1];
    const h = P.harness;
    if (e.state.hull < h.repairBelowHull && e.state.cash > h.repairAboveCash) g.repairHull();
    const s1 = AR.snapshot(e, v, diff);
    const arrival = AR.projectArrival(pth, v, pol, s1.t);
    for (const [c, q] of AR.planBuys(s1, pth.at(-1), arrival, "greedy")) g.buyCargoQty(c, q);
    for (let i = 1; i < pth.length && !e.state.ended; i++) {
      for (let tries = 0; !e.state.ended && e.state.currentPort !== pth[i] && tries < 50; tries++) {
        while (!e.state.ended && !allowed(transit(e.state.currentPort, pth[i], v, e.state.monthIndex)[1], pol)) g.waitInPort();
        if (!e.state.ended) g.sailTo(pth[i]);
      }
    }
  }
  return e.state.ended ? e.state.cash - e.state.startEquity : null;
}
// Static replay (A, §4.1): the flat run's logged engine calls under the variant, same keyed draws.
function staticRun(e, v, diff, rule, seed, ops) {
  resetEngine(e, v, diff, seed, "keyed", { rule });
  const g = e.g;
  for (const op of ops) {
    if (e.state.ended) break;
    if (op[0] === "x") g.sellCargoQty(op[1], 999);
    else if (op[0] === "b") g.buyCargoQty(op[1], op[2]);
    else if (op[0] === "r") g.repairHull();
    else if (op[0] === "w") g.waitInPort();
    else if (op[0] === "s") g.sailTo(op[1]);
  }
  // a list that ends before the campaign does (cannot happen for a flat list replayed under flat) runs out the clock by waiting
  for (let k = 0; !e.state.ended && k < 30; k++) g.waitInPort();
}

// --- D-W: the published hazards-off DP with W in its planning Sim (§4.2) -------------------------
class DSim extends AR.Sim {
  constructor(v, diff, opts = {}) { super(v, diff, opts); this.beta = opts.beta || 0; this.fill = opts.fill || "G"; this.netS = null; }
  clone() { const s = Object.create(DSim.prototype); Object.assign(s, this, { cargo: { ...this.cargo }, dias: { ...this.dias }, log: this.log ? [...this.log] : null }); return s; }
  wageNow() { const V = P.vessels[this.v]; return wageOf(V.wages, this.beta, this.used(), V.capacity); }
  wait() {
    this.cash -= this.fee(this.port) + this.wageNow() + this.penalty;
    this.penalty = 0;
    this.crew = Math.min(100, this.crew + HZ.crewPortPerMonth);
    this.dias[this.port] = Math.min(100, this.dias[this.port] + P.standing.perWait);
    this.advance(1); this.rec("wait");
  }
  sail(dest) {
    const V = P.vessels[this.v], D = P.difficulties[this.diff];
    const [m, st] = transit(this.port, dest, this.v, this.t);
    this.cash -= this.wageNow() * m;
    const head = isHead(st), dead = isDead(st);
    let loss = m * HZ.crewSeaPerMonth;
    if (head) { loss += HZ.crewHazard; const dmg = Math.round((HZ.headwindDamage[0] + AR.OFF * HZ.headwindDamage[1]) * V.damageMult * D.damageMult); this.hull = Math.max(HZ.hullFloor, this.hull - dmg); }
    if (this.cargo.porcelain > 0 && this.hull < HZ.porcelainHullBelow && (head || dead)) this.cargo.porcelain -= Math.max(1, Math.floor(this.cargo.porcelain * HZ.porcelainShare));
    this.port = dest;
    this.dias[dest] = Math.min(100, this.dias[dest] + P.standing.perArrival);
    this.crew = Math.max(0, this.crew - loss);
    this.advance(m); this.rec("sail", { dest });
  }
  finish() {
    const t = this.t, pm = Math.min(23, t), cashBefore = this.cash, debt = this.debt;
    const liq = GOODS.reduce((a, g) => a + this.cargo[g] * price(g, this.port, pm), 0);
    super.finish();
    this.netS = cashBefore - debt - this.equity + (t < END ? liq : 0);
  }
}
// G+ (§4.2): a lot is bought only if cash after it >= 60 D + the first leg's wages at the post-purchase tonnage.
function planBuysGplus(s, finalPort, arrival, legMonths) {
  const arr = Math.min(23, arrival), V = P.vessels[s.v];
  const K = V.capacity - s.used(), u0 = s.used();
  let cash = Math.max(0, s.cash - P.harness.cashReserve), tons = 0, spent = 0;
  const items = GOODS.map(g => { const c = s.unit(g), p = price(g, finalPort, arr); return { g, c, p, w: P.goods[g].weight }; });
  const buys = [];
  for (const x of items.filter(x => x.p / x.c > 1).sort((a, b) => b.p / b.c - a.p / a.c)) {
    let q = Math.min(Math.floor((K - tons) / x.w), Math.floor(cash / x.c));
    while (q > 0 && s.cash - spent - q * x.c < P.harness.cashReserve + legMonths * wageOf(V.wages, s.beta, u0 + tons + q * x.w, V.capacity)) q--;
    if (q > 0) { buys.push([x.g, q]); cash -= q * x.c; spent += q * x.c; tons += q * x.w; }
  }
  return buys;
}
function deliverDW(s, pth, pol) {
  s.repairRule();
  const arrival = AR.projectArrival(pth, s.v, pol, s.t);
  if (arrival === null) return false;
  const buys = s.fill === "G+" ? planBuysGplus(s, pth.at(-1), arrival, transit(pth[0], pth[1], s.v, s.t)[0]) : AR.planBuys(s, pth.at(-1), arrival, "greedy");
  for (const [g, q] of buys) s.buy(g, q);
  for (let i = 1; i < pth.length; i++) {
    while (!s.ended && !allowed(transit(s.port, pth[i], s.v, s.t)[1], pol)) s.wait();
    if (s.ended) return true;
    s.sail(pth[i]);
    if (s.ended) return true;
  }
  s.sellAll();
  return true;
}
function solveDW(start, pol) {
  const best = new Map(), key = (p, t) => `${p}|${t}`;
  best.set(key(start.port, start.t), { s: start, prev: null, act: null });
  let term = null;
  const push = (s, prev, act) => {
    if (s.ended) { if (!term || s.netS > term.s.netS) term = { s, prev, act }; return; }
    const k = key(s.port, s.t), cur = best.get(k);
    if (!cur || s.cash > cur.s.cash) best.set(k, { s, prev, act });
  };
  for (let t = start.t; t < END; t++) for (const p of PORTS) {
    const node = best.get(key(p, t));
    if (!node) continue;
    { const s = node.s.clone(); s.log = null; s.wait(); push(s, node, ["wait"]); }
    for (const pth of PATHS[p]) {
      if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue;
      const s = node.s.clone(); s.log = null;
      if (!deliverDW(s, pth, pol)) continue;
      push(s, node, ["deliver", pth]);
    }
  }
  const acts = [];
  for (let n = term; n && n.act; n = n.prev) acts.unshift(n.act);
  return { net: term ? term.s.netS : null, acts };
}
// Solve, execute with engine-exact accounting, replay through the engine (draws 0.99) under the W copy.
function dwCell(e, v, diff, ruleId, fill) {
  const rule = RULES[ruleId];
  const sol = solveDW(new DSim(v, diff, { beta: rule.beta, fill }), POL_L);
  const ex = new DSim(v, diff, { beta: rule.beta, fill, cut: true }); ex.log = [];
  for (const a of sol.acts) { if (ex.ended) break; if (a[0] === "wait") ex.wait(); else deliverDW(ex, a[1], POL_L); }
  resetEngine(e, v, diff, 1, "off", { rule, pol: POL_L });
  let mism = -1;
  ex.log.forEach((a, i) => {
    if (a.kind === "sell") e.g.sellCargoQty(a.good, a.qty); else if (a.kind === "buy") e.g.buyCargoQty(a.good, a.qty);
    else if (a.kind === "repair") e.g.repairHull(); else if (a.kind === "wait") e.g.waitInPort(); else if (a.kind === "sail") e.g.sailTo(a.dest);
    const s = e.state;
    if (mism < 0 && (s.cash !== a.cash || s.monthIndex !== a.month || s.currentPort !== a.port || s.debt !== a.debt || s.ended !== a.ended)) mism = i;
  });
  const sum = summarise(e);
  return { v, diff, rule: ruleId, fill, dpNetS: sol.net, exactNetS: ex.netS, engineMatches: mism < 0 && ex.ended, firstMismatch: mism, ...sum,
    decisions: sol.acts.map(a => a[0] === "wait" ? "wait" : a[1].map(x => x.slice(0, 3)).join(">")).join(" ") };
}


// =========================================================================================
// CHECKS (§4.8). Expected values come from the engine's own state change or hand-worked cases.
// =========================================================================================
const NOEV = { "story-occurrence": 0.99, "story-pick": 0, "headwind-damage": 0.5, "turn-back": 0.99, teak: 0.99, "transition-roll": 0.99,
  "storm-damage": 0.5, mildew: 0.99, piracy: 0.99, mutiny: 0.99 };
// A scripted state: keyed mode with every role forced (no event unless the case forces one).
function scripted(e, { v = "junk", diff = "normal", port, month, cash, cargo = {}, crew = 100, dias = {}, rule = FLAT, force = {}, hull = 100 }) {
  resetEngine(e, v, diff, 1, "keyed", { rule, override: { ...NOEV, ...force }, port });
  const st = e.state;
  Object.assign(st, { monthIndex: month, cash, crewHealth: crew, hull });
  for (const g of GOODS) { st.cargo[g] = cargo[g] || 0; st.costBasis[g] = cargo[g] ? 1 : 0; }
  Object.assign(st.diaspora, dias);
  e.sc.rec = newRec(e, {});
}
function doSail(e, dest) {
  const st = e.state, b = { cash: st.cash, cargo: { ...st.cargo } };
  const calc = e.g.computeTransit(e.lane(st.currentPort, dest));
  const n0 = e.sc.rec.raids.length, mu0 = e.sc.rec.mutinies;
  e.g.sailTo(dest);
  const line = st.logs.find(l => l.includes("Sailed") || l.includes("Attempted")) || "";
  return { dCash: st.cash - b.cash, dCargo: Object.fromEntries(GOODS.map(g => [g, st.cargo[g] - b.cargo[g]])), months: calc.months, calc, line,
    raid: e.sc.rec.raids.length > n0 ? e.sc.rec.raids.at(-1) : null, raided: e.sc.rec.raids.length > n0, mutinied: e.sc.rec.mutinies > mu0, lastAct: e.sc.rec.acts.at(-1) };
}
// The first (lane, month) for a vessel whose transit satisfies pred (months from 0 to 21).
function findLeg(e, v, pred, from = null, to = null) {
  resetEngine(e, v, "normal", 1, "off");
  for (let m = 0; m < 22; m++) for (const l of e.SEA_LANES) {
    if ((from && l.from !== from) || (to && l.to !== to)) continue;
    const c = e.g.computeTransit(l, m);
    if (pred(c, m)) return { from: l.from, to: l.to, m, months: c.months, calc: c };
  }
  throw new Error("no leg for " + pred.toString());
}
const plain = c => !c.isHeadwind && !c.isDeadZone;

function c2() {
  const e = makeEngine(), cases = [];
  const add = (name, pass, got, want) => cases.push({ name, pass: !!pass, got, want });
  const R = RULES;
  // (a) raid, P 0.03, junk with 217 cloves + 40 pepper (297 t), cash 50: 6 cloves and 1 pepper lot.
  { const L = findLeg(e, "junk", plain);
    scripted(e, { port: L.from, month: L.m, cash: 50, cargo: { cloves: 217, pepper: 40 }, rule: R["P0.03"], force: { piracy: 0 } });
    const r = doSail(e, L.to);
    add("(a) P 0.03, 217 cloves + 40 pepper, cash 50", r.dCargo.cloves === -6 && r.dCargo.pepper === -1 && r.dCash === -35 * L.months,
      { cloves: r.dCargo.cloves, pepper: r.dCargo.pepper, dCash: r.dCash }, { cloves: -6, pepper: -1, dCash: -35 * L.months }); }
  // (b) raid, P 0.03, 20 cloves, cash 2,000: floor(0.6) = 0 lots, so today's crate (worth more than X = 75).
  { const L = findLeg(e, "junk", plain);
    scripted(e, { port: L.from, month: L.m, cash: 2000, cargo: { cloves: 20 }, rule: R["P0.03"], force: { piracy: 0 } });
    const r = doSail(e, L.to);
    add("(b) P 0.03, 20 cloves, cash 2000: today's crate", r.dCargo.cloves === -1 && r.dCash === -35 * L.months, { cloves: r.dCargo.cloves, dCash: r.dCash }, { cloves: -1, dCash: -35 * L.months }); }
  // (c) raid, T 0.1, no cloves or ivory, cash 2,000 before a 3-month non-transition junk leg: 189 D on cash after wages.
  { const L = findLeg(e, "junk", c => !c.isHeadwind && !c.isDeadZone && c.months === 3);
    scripted(e, { port: L.from, month: L.m, cash: 2000, cargo: { pepper: 10 }, rule: R["T0.1"], force: { piracy: 0 } });
    const r = doSail(e, L.to);
    add("(c) T 0.1, cash 2000, 3-month leg: X = 189 on cash after wages", r.dCash === -105 - 189 && r.dCargo.pepper === 0, { dCash: r.dCash }, { dCash: -294 }); }
  // (d) W, junk with 150 t, beta = 3, 4-month leg: 88 D a month, 352 D.
  { const L = findLeg(e, "junk", c => c.months === 4);
    scripted(e, { port: L.from, month: L.m, cash: 5000, cargo: { pepper: 75 }, rule: R.W3 });
    const r = doSail(e, L.to);
    add("(d) W 3, junk 150 t, 4-month leg: 88 D a month", r.dCash === -352 && r.lastAct.c.wage === 352, { dCash: r.dCash, wage: r.lastAct.c.wage }, { dCash: -352 }); }
  // (e) M, mu = 0.1, 30 cloves arriving at Quanzhou in a month priced 595: 3 crates, no cash.
  { const L = findLeg(e, "junk", (c, m) => [3, 11, 15, 23].includes(m + c.months), "malacca", "quanzhou");
    scripted(e, { port: "malacca", month: L.m, cash: 3000, cargo: { cloves: 30 }, crew: 40, rule: R["M0.1"], force: { mutiny: 0 } });
    const p595 = e.g.getLivePortPrice(COMMODITY.cloves, "quanzhou", L.m + L.months);
    const r = doSail(e, "quanzhou");
    add("(e) M 0.1, 30 cloves at Quanzhou (595): 3 crates, no cash", p595 === 595 && r.mutinied && r.dCargo.cloves === -3 && r.dCash === -35 * L.months,
      { price: p595, cloves: r.dCargo.cloves, dCash: r.dCash }, { price: 595, cloves: -3, dCash: -35 * L.months });
    // (f) M with 5 cloves: 70 D.
    scripted(e, { port: "malacca", month: L.m, cash: 3000, cargo: { cloves: 5 }, crew: 40, rule: R["M0.1"], force: { mutiny: 0 } });
    const f = doSail(e, "quanzhou");
    add("(f) M 0.1, 5 cloves: 70 D", f.mutinied && f.dCargo.cloves === 0 && f.dCash === -35 * L.months - 70, { cloves: f.dCargo.cloves, dCash: f.dCash }, { cloves: 0, dCash: -35 * L.months - 70 }); }
  // (g) bait: 10 pepper lots, cash 20,000, one clove crate injected with cash unchanged, forced raid.
  { const L = findLeg(e, "junk", plain, "malacca", "quanzhou");
    const am = Math.min(23, L.m + L.months);
    const loss = (rule, crate) => {
      scripted(e, { port: "malacca", month: L.m, cash: 20000, cargo: { pepper: 10, cloves: crate ? 1 : 0 }, rule, force: { piracy: 0 } });
      const r = doSail(e, "quanzhou");
      return -(r.dCash + 35 * L.months) + GOODS.reduce((a, g) => a + Math.max(0, -r.dCargo[g]) * e.g.getLivePortPrice(COMMODITY[g], "quanzhou", am), 0);
    };
    const rows = RAID_RULES.map(id => { const w = loss(RULES[id], true), o = loss(RULES[id], false); return { rule: id, withCrate: w, without: o, neverLower: w >= o }; });
    const by = id => rows.find(r => r.rule === id);
    const hand = { "T0.1 equal": by("T0.1").withCrate === by("T0.1").without, "B2 equal": by("B2").withCrate === by("B2").without,
      "P0.03 higher": by("P0.03").withCrate > by("P0.03").without, "flat higher": by("flat").withCrate > by("flat").without, "P0.3 equal": by("P0.3").withCrate === by("P0.3").without };
    add("(g) bait: never lower with the crate", rows.every(r => r.neverLower) && Object.values(hand).every(Boolean), { rows, hand }, "never lower; hand statements hold"); }
  // (h) P, s = 0.1, cash 50, dead-zone leg with 30 textiles, mildew forced: 29 textiles at the raid, 2 taken.
  { const L = findLeg(e, "junk", c => c.isDeadZone && !c.isHeadwind);
    scripted(e, { port: L.from, month: L.m, cash: 50, cargo: { textiles: 30 }, rule: R["P0.1"], force: { mildew: 0, piracy: 0 } });
    const r = doSail(e, L.to);
    add("(h) P 0.1, 30 textiles, mildew forced: 2 taken at the raid", r.dCargo.textiles === -3 && r.raid && r.raid.kind === "lots" && e.sc.rec.lost.raid.textiles === 2,
      { textiles: r.dCargo.textiles, raidLots: e.sc.rec.lost.raid.textiles }, { textiles: -3, raidLots: 2 }); }
  // (i) thresholds: p from engine constants in the engine's order; draws at p - 1e-9, p, p + 1e-9.
  { const L = findLeg(e, "junk", plain, "malacca", "quanzhou");
    const rows = [];
    for (const [label, cargo, stand] of [["cloves aboard, standing 0", { cloves: 10 }, 0], ["cloves aboard, standing 55", { cloves: 10 }, 55], ["pepper only, standing 0", { pepper: 10 }, 0]]) {
      resetEngine(e, "junk", "normal", 1, "off");
      const hv = (cargo.cloves || 0) > 0 || (cargo.ivory || 0) > 0;
      let p = e.PORTS.quanzhou.piracyRisk * (hv ? 1.5 : 0.6) * (e.state.diffKey === "survival" ? 1.8 : 1.0);
      if (stand >= 50) p *= 0.5;
      for (const [d, want] of [[-1e-9, true], [0, false], [1e-9, false]]) {
        scripted(e, { port: "malacca", month: L.m, cash: 3000, cargo, dias: { quanzhou: stand }, rule: FLAT, force: { piracy: p + d } });
        const r = doSail(e, "quanzhou");
        rows.push({ case: label, p, draw: d === 0 ? "p" : d < 0 ? "p-1e-9" : "p+1e-9", raided: r.raided, want, pass: r.raided === want });
      }
    }
    // mutiny at r with crew 46 after the leg (r = 0.04)
    const M = findLeg(e, "junk", c => plain(c) && c.months === 1);
    const r0 = e.g.getMutinyRisk(46);
    for (const [d, want] of [[-1e-9, true], [0, false], [1e-9, false]]) {
      scripted(e, { port: M.from, month: M.m, cash: 3000, crew: 46 + 8 * M.months, rule: FLAT, force: { mutiny: r0 + d } });
      const r = doSail(e, M.to);
      rows.push({ case: "mutiny, crew 46 after the leg", p: r0, draw: d === 0 ? "r" : d < 0 ? "r-1e-9" : "r+1e-9", raided: r.mutinied, want, pass: r.mutinied === want && e.state.crewHealth === 46 });
    }
    add("(i) thresholds", rows.every(r => r.pass) && r0 === 0.04, rows, "raid/mutiny below the threshold only"); }
  // (j) identity at s = tau = 0: every cargo state x cash grid, against the original engine.
  { const L = findLeg(e, "junk", c => plain(c));
    const o = loadRaw();
    const states = { "cloves only": { cloves: 5 }, "ivory only": { ivory: 5 }, both: { cloves: 3, ivory: 3 }, "pepper only": { pepper: 10 }, empty: {} };
    const rows = [];
    for (const [label, cargo] of Object.entries(states)) for (const cash of [-40, 0, 40, 75, 76, 10000]) {
      const pre = cash + 35 * L.months;                      // cash at the raid = the grid value
      scripted(e, { port: L.from, month: L.m, cash: pre, cargo, rule: FLAT, force: { piracy: 0 } });
      e.g.sailTo(L.to);
      const a = { cash: e.state.cash, cargo: { ...e.state.cargo }, line: e.state.logs[0] };
      vm.runInContext(`harnessReset("junk", "normal", ${JSON.stringify(L.from)}, 1); Math.random = globalThis.__keyedRandom;`, o.g);
      o.rng.clear();
      Object.assign(o.state, { monthIndex: L.m, cash: pre, crewHealth: 100, hull: 100 });
      for (const g of GOODS) { o.state.cargo[g] = cargo[g] || 0; o.state.costBasis[g] = cargo[g] ? 1 : 0; }
      o.rng.push(0);
      o.g.sailTo(L.to);
      const b = { cash: o.state.cash, cargo: { ...o.state.cargo }, line: o.state.logs[0] };
      rows.push({ cargo: label, cash, pass: JSON.stringify(a) === JSON.stringify(b) && o.rng.remaining === 0, research: { cash: a.cash, cargo: a.cargo }, engine: { cash: b.cash, cargo: b.cargo } });
    }
    add("(j) identity at s = tau = 0 (30 states)", rows.every(r => r.pass), rows.filter(r => !r.pass).slice(0, 5), "state change equals the original engine's"); }
  const c4f = e.sc.checks.failures.length;
  return { pass: cases.every(c => c.pass) && c4f === 0, c4FailuresInScriptedCases: c4f, cases };
}

// C3: severity only. Action lists replayed under every variant with the same draws.
const toOp = a => a.kind === "sell" ? ["x", a.good, a.qty] : a.kind === "buy" ? ["b", a.good, a.qty] : a.kind === "repair" ? ["r"] : a.kind === "wait" ? ["w"] : ["s", a.dest];
function replayOps(e, list, rule, extra = {}) {
  resetEngine(e, list.v, list.diff, list.seed, list.mode, { rule, events: true, ...extra });
  const g = e.g;
  for (const op of list.ops) {
    if (e.state.ended) break;
    if (op[0] === "x") g.sellCargoQty(op[1], op[2]); else if (op[0] === "b") g.buyCargoQty(op[1], op[2]);
    else if (op[0] === "r") g.repairHull(); else if (op[0] === "w") g.waitInPort(); else if (op[0] === "s") g.sailTo(op[1]);
  }
  return { events: e.sc.rec.events, ruin: e.sc.end ? e.sc.end.ruin : false };
}
function c3Lists(e) {
  const lists = [];
  for (const cell of PUB_OFF.cells) for (const fill of ["greedy", "opt"]) lists.push({ src: `off|${cell.vessel}|${cell.difficulty}|${cell.policy}|${fill}`, v: cell.vessel, diff: cell.difficulty, seed: 1, mode: "off", ops: cell[fill].actionsLog.map(toOp) });
  const cells = [];
  for (const v of VESSELS) for (const d of H_DIFFS) for (const pol of H_POLS) cells.push({ v, d, pol });
  for (let i = 0; i < 100; i++) {
    const c = cells[i % cells.length], seed = 200001 + i;
    hRun(e, c.v, c.d, c.pol, FLAT, "G", seed, "keyed", { logOps: true });
    lists.push({ src: `H|${c.v}|${c.d}|${c.pol}|${seed}`, v: c.v, diff: c.d, seed, mode: "keyed", ops: e.sc.rec.ops });
  }
  return lists;
}
function c3({ failFast = false } = {}) {
  const e = makeEngine();
  const lists = c3Lists(e);
  const rows = [];
  let fail = false;
  for (const vid of VARIANTS) {
    let compared = 0, mismatches = 0, diverged = 0, firstMonth = null;
    const ex = [];
    for (const L of lists) {
      const a = replayOps(e, L, FLAT).events, b = replayOps(e, L, RULES[vid]).events;
      for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i].k === "s" && JSON.stringify(a[i].guard) !== JSON.stringify(b[i].guard)) { diverged++; firstMonth = firstMonth === null ? a[i].m : Math.min(firstMonth, a[i].m); break; }
        compared++;
        if (JSON.stringify(a[i].served) !== JSON.stringify(b[i].served) || JSON.stringify(a[i].ev) !== JSON.stringify(b[i].ev)) { mismatches++; if (ex.length < 3) ex.push({ list: L.src, i, flat: a[i], variant: b[i] }); break; }
      }
    }
    rows.push({ variant: vid, actionsCompared: compared, mismatches, listsWithGuardDivergence: diverged, firstDivergenceMonth: firstMonth, examples: ex });
    if (mismatches) { fail = true; if (failFast) break; }
  }
  return { pass: !fail && e.sc.checks.failures.length === 0, lists: lists.length, hazardsOffLists: 36, keyedHLists: 100, rows, c4Failures: e.sc.checks.failures.length };
}

// C4: keyed draws on hazards-on runs (every scored run also applies (i)-(v)), and a forced turn-back.
function c4() {
  const e = makeEngine();
  const gen = rolesFromSource(e.source);
  const roleTable = { generated: gen, frozen: ROLE_TABLE.map(r => r[1]), pass: JSON.stringify(gen) === JSON.stringify(ROLE_TABLE.map(r => r[1])) };
  for (const v of VESSELS) for (const pol of H_POLS) for (let i = 0; i < 3; i++) {
    hRun(e, v, "normal", pol, RULES["P0.3"], "G", 300001 + i, "keyed");
    hRun(e, v, "easy", pol, RULES.W10, "G+", 300001 + i, "keyed");
  }
  for (const v of VESSELS) for (const rid of ["flat", "M0.3"]) levRun(e, v, "normal", RULES[rid], 300001, {});
  // forced turn-back: Aden -> Calicut in a headwind month reports line 2408
  const L = findLeg(e, "dhow", c => c.isHeadwind, "aden", "calicut");
  resetEngine(e, "dhow", "normal", 7, "keyed", { port: "aden", override: { "turn-back": 0 } });
  e.state.monthIndex = L.m;
  const before = e.rng.lines.length;
  e.g.sailTo("calicut");
  const lines = e.rng.lines.slice(before);
  const tb = { leg: `aden>calicut @${MONTHS[L.m]}`, port: e.state.currentPort, turnBackLine: lines[1], lines, pass: e.state.currentPort === "aden" && lines[1] === 2408 };
  const ch = e.sc.checks;
  return { pass: roleTable.pass && ch.failures.length === 0 && ch.draws > 0 && tb.pass, roleTable, actions: ch.actions, draws: ch.draws, failures: ch.failures.length, examples: ch.failures.slice(0, 3), forcedTurnBack: tb,
    sample: "24 H campaigns (2 vessels x 2 policies x 3 seeds 300001-300003; normal under P 0.3 and easy under W 10 with G+) and 4 L-EV campaigns (seed 300001, normal, flat and M 0.3)" };
}

// C5: ledger and conservation on a sample of campaigns under several rules.
function c5({ failFast = false } = {}) {
  const e = makeEngine();
  const rows = [];
  let mutLots = 0, raidLots = 0, raidCash = 0;
  for (const rid of ["flat", "P0.3", "T0.3", "M0.3", "M0.03", "W10", "B2"]) for (const v of VESSELS) for (const pol of H_POLS) for (let i = 0; i < 10; i++) {
    hRun(e, v, "normal", pol, RULES[rid], "G", 200001 + i, "keyed");
    const s = summarise(e);
    mutLots += GOODS.reduce((a, g) => a + e.sc.rec.lost.mut[g], 0); raidLots += GOODS.reduce((a, g) => a + e.sc.rec.lost.raid[g], 0);
    raidCash += e.sc.rec.acts.reduce((a, x) => a + (x.c ? x.c.raidCash : 0), 0);
    const ok = s.c5 === 0 && s.cons === 0 && Math.abs(s.logC - s.ledgerC) < 1e-6;
    if (!ok) { rows.push({ rule: rid, v, pol, seed: 200001 + i, c5: s.c5first, cons: s.consFirst, logC: s.logC, ledgerC: s.ledgerC }); if (failFast) return { pass: false, failures: rows }; }
  }
  for (const rid of ["flat", "M0.3", "T0.3"]) { levRun(e, "dhow", "normal", RULES[rid], 200001, {}); const s = summarise(e); if (!(s.c5 === 0 && s.cons === 0 && Math.abs(s.logC - s.ledgerC) < 1e-6)) rows.push({ rule: rid, lev: true, c5: s.c5first, cons: s.consFirst }); }
  return { pass: rows.length === 0 && mutLots > 0 && raidLots > 0, campaigns: 7 * 2 * 2 * 10 + 3, lotsTakenByMutiny: mutLots, lotsTakenByRaids: raidLots, raidCashTotal: raidCash, failures: rows.slice(0, 10) };
}

// C6: ruin and the floor.
function c6() {
  const e = makeEngine(), out = {};
  // (a) junk, 30 teak lots (300 t), 60 D, beta = 10, a 3-month leg from month <= 20
  const L = findLeg(e, "junk", (c, m) => plain(c) && c.months === 3 && m <= 20);
  scripted(e, { port: L.from, month: L.m, cash: 60, cargo: { teak: 30 }, rule: RULES.W10 });
  doSail(e, L.to);
  const end = e.sc.end;
  out.a = { wages: e.sc.rec.acts.at(-1).c.wage, cashAtEndCheck: end ? end.cashBefore : null, ruin: end ? end.ruin : null, ruinMonth: end ? end.ruinMonth : null,
    liquidationLine: e.state.logs.some(l => l.includes("Month 24 Liquidation")) };
  out.a.pass = out.a.wages === 1155 && out.a.cashAtEndCheck === -1095 && out.a.ruin === true && out.a.ruinMonth < 24 && out.a.liquidationLine;
  // (b) junk departs with 30 D on a 3-month leg (-75 after the sail), sells on arrival back above 0
  scripted(e, { port: L.from, month: L.m, cash: 30, cargo: { pepper: 10 }, rule: FLAT });
  doSail(e, L.to);
  const afterSail = e.state.cash;
  e.g.sellCargoQty("pepper", 999);
  e.sc.decisionPoint();
  out.b = { cashAfterSail: afterSail, cashAfterSale: e.state.cash, breaches: e.sc.rec.breaches };
  out.b.pass = afterSail === -75 && e.state.cash > 0 && out.b.breaches === 1;
  // (c) dhow waits at Kilwa (normal) with 20 D: -15 before the story's +20 D, +5 after
  resetEngine(e, "dhow", "normal", 1, "keyed", { port: "kilwa", override: { ...NOEV, "story-occurrence": 0, "story-pick": 0 } });
  e.state.cash = 20; e.sc.rec = newRec(e, {});
  e.g.waitInPort();
  out.c = { cashAfter: e.state.cash, breaches: e.sc.rec.breaches, lowestInsideWait: e.sc.rec.minInsideWait };
  out.c.pass = out.c.cashAfter === 5 && out.c.breaches === 0 && out.c.lowestInsideWait === -15;
  return { pass: out.a.pass && out.b.pass && out.c.pass, ...out };
}

// C8: terminal rules, #44 C7's three scripted runs (no depth here: wait24 keeps 5 of 10 cloves aboard).
function c8() {
  const e = makeEngine();
  const run = sc => {
    resetEngine(e, "dhow", "normal", 1, "off");
    const g = e.g, st = () => e.state;
    let depart = sc === "arrive25" ? 23 : sc === "arrive24" ? 22 : 21;
    st().cash = 100000;
    while (st().monthIndex < depart) g.waitInPort();
    g.buyCargoQty("cloves", 10);
    g.sailTo("malacca");
    let sold = 0;
    if (sc === "wait24") { g.sellCargoQty("cloves", 5); sold = 5; g.waitInPort(); g.waitInPort(); }
    const end = e.sc.end;
    return { t: end.t, cashBefore: end.cashBefore, debt: end.debtBefore, equity: st().startEquity, aboard: end.cargoBefore.cloves, sold, E: end.E, S: end.S };
  };
  const p23 = price("cloves", "malacca", 23), out = {};
  for (const sc of ["arrive25", "arrive24", "wait24"]) {
    const r = run(sc), base = r.cashBefore - r.debt - r.equity;
    const hand = { E: base + r.aboard * p23, S: base };          // S counts no goods in transit or aboard at the deadline
    out[sc] = { ...r, hand, pass: r.E === hand.E && r.S === hand.S };
  }
  out.pass = out.arrive25.pass && out.arrive24.pass && out.wait24.pass && out.arrive25.t === 25 && out.arrive24.t === 24 && out.wait24.t === 24 && out.wait24.aboard === 5;
  return out;
}

// C7: expected terms, term by term. Five fixed avoid-headwind action lists with no textiles, teak or
// porcelain (built here, hazards off, before any run), 1,000 keyed seeds each, flat and every share rule.
const C7_SEED0 = 700001, C7_N = 1000, TERMS = ["raidLotsV", "raidCash", "mutLotsV", "mutCash", "dold"];
function c7Lists(e) {
  const specs = [
    { v: "junk", diff: "normal", goods: ["cloves", "pepper"] },
    { v: "dhow", diff: "normal", goods: ["pepper", "ivory"] },
    { v: "junk", diff: "easy", goods: ["ivory", "cloves", "pepper"] },
    { v: "dhow", diff: "easy", goods: ["cloves"] },
    { v: "junk", diff: "hard", goods: ["pepper", "cloves", "ivory"] }
  ];
  return specs.map(sp => {
    resetEngine(e, sp.v, sp.diff, 1, "off");
    const st = () => e.state, g = e.g, ops = [];
    for (let guard = 0; !st().ended && guard < 60; guard++) {
      for (const c of GOODS) if (st().cargo[c] > 0) { g.sellCargoQty(c, 999); ops.push(["x", c, 999]); }
      const lanes = e.SEA_LANES.filter(l => l.from === st().currentPort && !g.computeTransit(l).isHeadwind);
      if (!lanes.length) { g.waitInPort(); ops.push(["w"]); continue; }
      const plans = lanes.map(l => { const pl = hPlan(e, l, FLAT, "G"); return { l, buys: pl.buys.filter(b => sp.goods.includes(b[0])), pm: pl.perMonth }; });
      plans.sort((a, b) => b.pm - a.pm);
      for (const [id, q] of plans[0].buys) { g.buyCargoQty(id, q); ops.push(["b", id, q]); }
      g.sailTo(plans[0].l.to); ops.push(["s", plans[0].l.to]);
    }
    return { ...sp, ops };
  });
}
function c7Unit(e, list, rid, seed) {
  const rule = RULES[rid];
  resetEngine(e, list.v, list.diff, seed, "keyed", { rule });
  const g = e.g, d = Object.fromEntries(TERMS.map(t => [t, 0]));
  for (const op of list.ops) {
    if (e.state.ended) break;
    if (op[0] === "x") g.sellCargoQty(op[1], op[2]); else if (op[0] === "b") g.buyCargoQty(op[1], op[2]); else if (op[0] === "w") g.waitInPort();
    else if (op[0] === "s") {
      const s = snapP(e, list.v, list.diff, { rule });
      const [m, status] = transit(s.port, op[1], s.v, s.t);
      s.cash -= P.vessels[s.v].wages * m;
      const loss = m * HZ.crewSeaPerMonth + (isHead(status) ? HZ.crewHazard : 0);
      const { T } = applyTerms(s, op[1], m, isDead(status), loss);
      g.sailTo(op[1]);
      const c = e.sc.rec.acts.at(-1).c;
      for (const t of TERMS) d[t] += c[t] - T[t];
    }
  }
  return d;
}
function c7Stats(units) {
  // units: { rule: [ {term: diff} per (list, seed) ] }
  const rows = [];
  for (const rid of SHARE_RULES) for (const t of TERMS) {
    const xs = units[rid].map(u => u[t]), n = xs.length;
    const mean = xs.reduce((a, x) => a + x, 0) / n;
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1));
    const se = sd / Math.sqrt(n);
    const pass = se < 0.25 ? Math.abs(mean) <= 1 : Math.abs(mean) <= 4.1 * se;
    rows.push({ rule: rid, term: t, n, mean: +mean.toFixed(4), se: +se.toFixed(4), z: se > 0 ? +(mean / se).toFixed(3) : null, pass, beyond3SE: se > 0 && Math.abs(mean) > 3 * se });
  }
  return rows;
}
function c7Scripted(e) {
  // crew 54 after the leg's ordinary loss, dead-zone leg, no navigator: expected risk from engine constants
  const L = findLeg(e, "dhow", c => c.isDeadZone && !c.isHeadwind);
  resetEngine(e, "dhow", "normal", 1, "off");
  const q = e.g.computeTransit(e.lane(L.from, L.to), L.m).stormProbability;
  const want = (1 - q) * e.g.getMutinyRisk(54) + q * e.g.getMutinyRisk(54 - 12);
  const got = plannerRisk(54, q);
  return { q, want, got, pass: Math.abs(got - 0.028) < 1e-12 && Math.abs(got - want) < 1e-15 };
}

// C10: the crew-aware planner against an independent brute-force enumeration.
function bruteForce(start, pol, budget = 5e6) {
  let branches = 0;
  const best = { val: -Infinity, first: null }, firstVals = new Map();
  const rec = (s, first) => {
    if (s.ended) { branches++; const v = s.netS; if (v > best.val) { best.val = v; best.first = first; } const k = actKey(first); if (!firstVals.has(k) || v > firstVals.get(k)) firstVals.set(k, v); return; }
    if (branches > budget) throw new Error("brute-force budget exceeded");
    { const c = s.clone(); c.log = null; c.wait(); rec(c, first || ["wait"]); }
    for (const pth of PATHS[s.port]) {
      if (!allowed(transit(pth[0], pth[1], s.v, s.t)[1], pol)) continue;
      const c = s.clone(); c.log = null;
      if (!AR.deliver(c, pth, pol, "greedy")) continue;
      rec(c, first || ["deliver", pth]);
    }
  };
  rec(start, null);
  const vals = [...firstVals.entries()].sort((a, b) => b[1] - a[1]);
  return { branches, best: actKey(best.first), value: best.val, strictlyBest: vals.length < 2 || vals[0][1] > vals[1][1], firstVals: Object.fromEntries(vals) };
}
// The scripted states were found by the deterministic search below (run when the code was written);
// each is re-verified here: brute force, L-EV, the meeting labels, and (in the plants phase) its plant.
function c10State(spec) {
  const s = new PSim(spec.v, spec.diff, { rule: RULES[spec.rule] });
  Object.assign(s, { t: spec.t, port: spec.port, cash: spec.cash, crew: spec.crew });
  s.dias = { kilwa: 0, aden: 0, calicut: 0, malacca: 0, quanzhou: 0, ...spec.dias };
  return s;
}
function meetCheck(start, pol) {
  // solve once more recording, at every node, whether a wait-first label and a sail-first label meet there
  // with the wait label holding less cash and more crew
  let found = null;
  const nodes = new Map(), key = (p, t) => `${p}|${t}`;
  nodes.set(key(start.port, start.t), [{ s: start, first: null }]);
  for (let t = start.t; t < END; t++) for (const p of PORTS) {
    const list = nodes.get(key(p, t)); if (!list) continue;
    for (const node of list) {
      const kids = [];
      { const c = node.s.clone(); c.log = null; c.wait(); kids.push([c, node.first || "wait"]); }
      for (const pth of PATHS[p]) { if (!allowed(transit(pth[0], pth[1], start.v, t)[1], pol)) continue; const c = node.s.clone(); c.log = null; if (!AR.deliver(c, pth, pol, "greedy")) continue; kids.push([c, node.first || "sail"]); }
      for (const [c, first] of kids) {
        if (c.ended) continue;
        const k = key(c.port, c.t), l = nodes.get(k) || [];
        for (const x of l) if (!found && x.first !== first) { const w = first === "wait" ? c : x.s, sl = first === "wait" ? x.s : c; if (w.cash < sl.cash && w.crew > sl.crew) found = { node: k, wait: { cash: +w.cash.toFixed(2), crew: +w.crew.toFixed(2) }, sail: { cash: +sl.cash.toFixed(2), crew: +sl.crew.toFixed(2) } }; }
        if (l.some(x => dominates(x.s, c, "full"))) continue;
        nodes.set(k, [...l.filter(x => !dominates(c, x.s, "full")), { s: c, first }]);
      }
    }
  }
  return found;
}
// Found by c10Search() below when the code was written (before any run), and fixed here so that each
// plant is tested on the accepted state (§9 records them).
const C10_STATES = {
  rest: { v: "junk", diff: "normal", t: 21, port: "quanzhou", cash: 600, crew: 46, rule: "M0.3", dias: { quanzhou: 0 } },
  standing: { v: "junk", diff: "normal", t: 18, port: "malacca", cash: 600, crew: 100, rule: "P0.3", dias: { malacca: 35 } }
};
function c10Search(kind) {
  // Deterministic search over a fixed grid (crew 46 for rest, Malacca standing 35-45 for standing;
  // start month >= 17); the first state that meets every condition is used, and recorded in C10_STATES.
  const cashes = [200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 13000, 16000, 20000, 25000, 32000, 40000, 50000, 60000, 80000, 100000, 150000, 200000, 300000];
  for (const v of ["junk", "dhow"]) for (const diff of ["normal", "easy", "hard"]) for (const t of [17, 18, 19, 20, 21])
    for (const port of kind === "rest" ? PORTS : ["malacca"]) for (const sd of kind === "rest" ? [0, 20, 50] : [35, 40, 45]) for (const cash of cashes) {
      const spec = { v, diff, t, port, cash, crew: kind === "rest" ? 46 : 100, rule: kind === "rest" ? "M0.3" : "P0.3", dias: { [port]: sd } };
      const s0 = c10State(spec);
      const full = solveP(s0.clone(), POL_L, {});
      if (actKey(full.acts[0]) !== "wait") continue;
      const plant = solveP(s0.clone(), POL_L, { domMode: kind === "rest" ? "cash" : "noflags" });
      if (actKey(plant.acts[0]) === "wait") continue;
      if (kind === "rest" && !meetCheck(s0.clone(), POL_L)) continue;
      let bf;
      try { bf = bruteForce(s0.clone(), POL_L); } catch { continue; }
      if (bf.best !== "wait" || !bf.strictlyBest) continue;
      return spec;
    }
  return null;
}
function c10(e) {
  const out = {};
  for (const kind of ["rest", "standing"]) {
    const spec = C10_STATES[kind] || c10Search(kind);
    if (!spec) { out[kind] = { pass: false, error: "no scripted state met every condition" }; continue; }
    const s0 = c10State(spec);
    const bf = bruteForce(s0.clone(), POL_L);
    const lev = solveP(s0.clone(), POL_L, {});
    const meet = kind === "rest" ? meetCheck(s0.clone(), POL_L) : null;
    // standing: the brute-force best plan builds Malacca's standing to >= 50 before a laden arrival there
    let builds = null;
    if (kind === "standing") {
      const x = s0.clone(); x.log = [];
      for (const a of lev.acts) { if (x.ended) break; if (a[0] === "wait") x.wait(); else AR.deliver(x, a[1], POL_L, "greedy"); }
      const iWait = x.log.findIndex(r => r.kind === "wait" && r.port === "malacca");
      builds = { firstAction: actKey(lev.acts[0]), waitsAtMalaccaFirst: iWait === 0, plan: lev.acts.map(actKey) };
      // a laden arrival at Malacca after the standing reached 50
      let dias = spec.dias.malacca, laden = false, ok = false;
      for (const r of x.log) {
        if (r.kind === "wait" && r.port === "malacca") dias = Math.min(100, dias + 15);
        if (r.kind === "buy") laden = true;
        if (r.kind === "sail") { if (r.dest === "malacca" && laden && dias >= 50) ok = true; if (r.dest === "malacca") dias = Math.min(100, dias + 5); }
        if (r.kind === "sell") laden = false;
      }
      builds.ladenArrivalAt50 = ok;
    }
    const pass = actKey(lev.acts[0]) === bf.best && bf.strictlyBest && (kind === "rest" ? !!meet && bf.best === "wait" : builds.waitsAtMalaccaFirst && builds.ladenArrivalAt50);
    out[kind] = { spec, bruteForce: { branches: bf.branches, best: bf.best, value: +bf.value.toFixed(2), strictlyBest: bf.strictlyBest, firstValues: Object.fromEntries(Object.entries(bf.firstVals).map(([k, v]) => [k, +v.toFixed(2)])) },
      lev: actKey(lev.acts[0]), meet, builds, pass };
  }
  return out;
}
function c10Identity(states) {
  const f = [];
  for (const st of states) {
    const a = AR.solve(st.ar, st.pol, "greedy");
    const b = solveP(st.p, st.pol, { identity: true });
    if (a.net !== b.net || JSON.stringify(a.acts) !== JSON.stringify(b.acts)) f.push({ seed: st.seed, t: st.p.t, port: st.p.port, published: a.net, identity: b.net });
  }
  return { states: states.length, pass: f.length === 0 && states.length === 106, failures: f.slice(0, 5) };
}

// C1 and C1b work units (run by workers in the checks phase).
function c1Unit(e, cellIdx, i, { collect = null } = {}) {
  const cell = PUB_ON.cells[cellIdx], seed = 200001 + i;
  const h = hRun(e, cell.vessel, cell.difficulty, cell.policy, FLAT, "G", seed, "stream");
  const r = levRun(e, cell.vessel, cell.difficulty, FLAT, seed, { identity: true, mode: "stream", pol: cell.policy,
    onState: collect ? (s0) => { if (collect.length < 106) collect.push({ seed, pol: cell.policy, p: s0.clone(), ar: Object.assign(Object.create(AR.Sim.prototype), s0.clone(), { log: null }) }); } : null });
  return { cellIdx, i, h, r, hOk: h === cell.harness[i], rOk: r === cell.replan[i] };
}
function c1Off(e) {
  // the 36 published hazards-off logs replay action for action; the 18 hazards-off harness nets; and L-EV in
  // identity mode reproduces the published hazards-off decisions and planning net from month 0
  const f = [];
  let n = 0;
  for (const cell of PUB_OFF.cells) {
    for (const fill of ["greedy", "opt"]) {
      resetEngine(e, cell.vessel, cell.difficulty, 1, "off");
      const log = cell[fill].actionsLog;
      const bad = log.findIndex(a => { const o = toOp(a); if (o[0] === "x") e.g.sellCargoQty(o[1], o[2]); else if (o[0] === "b") e.g.buyCargoQty(o[1], o[2]); else if (o[0] === "r") e.g.repairHull(); else if (o[0] === "w") e.g.waitInPort(); else e.g.sailTo(o[1]);
        const s = e.state; return s.cash !== a.cash || s.monthIndex !== a.month || s.currentPort !== a.port || s.debt !== a.debt || s.ended !== a.ended; });
      n++;
      if (bad >= 0 || e.state.cash - e.state.startEquity !== cell[fill].engineNet) f.push({ replay: [cell.vessel, cell.difficulty, cell.policy, fill], firstMismatch: bad });
    }
    const hn = hRun(e, cell.vessel, cell.difficulty, cell.policy, FLAT, "G", 1, "off");
    if (hn !== cell.harness.engineNet) f.push({ offHarness: [cell.vessel, cell.difficulty, cell.policy], got: hn, want: cell.harness.engineNet });
    const sol = solveP(new PSim(cell.vessel, cell.difficulty, { identity: true }), cell.policy, { identity: true });
    const dec = sol.acts.map(a => a[0] === "wait" ? "wait" : a[1].map(x => x.slice(0, 3)).join(">"));
    if (sol.net !== cell.greedy.dpNet || JSON.stringify(dec) !== JSON.stringify(cell.greedy.decisions)) f.push({ identityPlan: [cell.vessel, cell.difficulty, cell.policy], got: sol.net, want: cell.greedy.dpNet });
  }
  return { replays: n, failures: f };
}
let DL_ROWS = null;
function dlRows() {
  if (DL_ROWS) return DL_ROWS;
  const cells = readFileSync(DL_CELLS, "utf8").trim().split("\n").slice(1).map(l => l.split(",").map(x => x.replace(/^"|"$/g, "")));
  const per = readCSV(DL_PERSEED);
  DL_ROWS = [];
  cells.forEach((c, idx) => {
    if (c[3] !== "0" || c[4] !== "G") return;
    const rows = per.filter(r => r.cell === idx + 1);
    DL_ROWS.push({ cellRow: idx + 1, v: c[0], d: c[1], pol: c[2], E: rows.map(r => r.E), S: rows.map(r => r.S) });
  });
  return DL_ROWS;
}
function c1bUnit(e, k, i) {
  const c = dlRows()[k], seed = 300001 + i;
  levRun(e, c.v, c.d, FLAT, seed, { identity: true, mode: "keyed", pol: c.pol });
  const end = e.sc.end;
  return { k, i, E: end.E, S: end.S, ok: end.E === c.E[i] && end.S === c.S[i] };
}

// =========================================================================================
// Workers (§8: 3 Node processes, each a fixed partition of the work: item index mod 3; outputs per
// item, so nothing depends on scheduling).
// =========================================================================================
function doItem(e, kind, it, ctx) {
  if (kind === "c1") return c1Unit(e, it.cell, it.i);
  if (kind === "c1b") return c1bUnit(e, it.k, it.i);
  if (kind === "c7") return c7Unit(e, ctx.lists[it.l], it.rule, it.seed);
  if (kind === "h") {
    hRun(e, it.v, it.d, it.pol, RULES[it.rule], it.fill, it.seed, "keyed");
    return compactCampaign(e, it.withRaids);
  }
  if (kind === "lev") {
    const states = [];
    const wantStates = it.flipStates;
    levRun(e, it.v, it.d, RULES[it.rule], it.seed, { cfg: { logOps: !!it.withOps }, onState: wantStates ? (s0, act, net) => states.push({ s: stateFields(s0), act, net }) : null });
    const c = compactCampaign(e, it.withRaids);
    if (it.withOps) c.ops = e.sc.rec.ops;
    if (wantStates) c.states = states;
    return c;
  }
  if (kind === "static") {
    staticRun(e, it.v, it.d, RULES[it.rule], it.seed, ctx.ops[`${it.v}|${it.d}|${it.seed}`]);
    return compactCampaign(e, false);
  }
  if (kind === "flips") return flipUnit(it, ctx);
  throw new Error("unknown work kind " + kind);
}
const stateFields = s => ({ v: s.v, diff: s.diff, port: s.port, t: s.t, cash: s.cash, debt: s.debt, equity: s.equity, hull: s.hull, crew: s.crew, dias: { ...s.dias } });
function compactCampaign(e, withRaids) {
  const s = summarise(e);
  delete s.late; delete s.early; delete s.c5first; delete s.consFirst;
  s.solves = e.sc.rec.decision;
  s.logLedgerDiff = Math.abs(s.logC - s.ledgerC) < 1e-6 ? 0 : 1; delete s.logC; delete s.ledgerC;
  if (withRaids) {
    const acts = e.sc.rec.acts;
    let i12 = -1; acts.forEach((a, i) => { if (a.m1 <= 12) i12 = i; });
    s.raidList = e.sc.rec.raids.map(r => ({ late: r.i > i12 ? 1 : 0, m1: acts[r.i].m1, cash: r.cash, cargo: Object.fromEntries(Object.entries(r.cargo).filter(([, q]) => q > 0)), prices: r.prices, value: r.value, kind: r.kind }));
  }
  return s;
}
async function phaseWorker() {
  const job = readJSONFile(process.argv[3]);
  const H0 = gameHash();
  const e = makeEngine();
  const out = [];
  let n = 0;
  for (const it of job.items) {
    out.push({ idx: it.idx, r: doItem(e, job.kind, it, job.ctx) });
    n++;
    if (n % 5 === 0 || n === job.items.length) console.log(`PROGRESS ${n}`);
  }
  if (gameHash() !== H0) { console.error("PAGE CHANGED during the worker"); process.exit(3); }
  writeFileSync(job.out, JSON.stringify({ out, c4: { actions: e.sc.checks.actions, draws: e.sc.checks.draws, failures: e.sc.checks.failures.length, examples: e.sc.checks.failures.slice(0, 3) } }));
}
async function runWorkers(block, kind, items, ctx = {}, onProgress = null) {
  const dir = extPath("jobs");
  mkdirSync(dir, { recursive: true });
  items.forEach((it, i) => { it.idx = i; });
  const procs = [];
  let done = 0;
  for (let w = 0; w < WORKERS; w++) {
    const part = items.filter((_, i) => i % WORKERS === w);
    const jf = path.join(dir, `${block}-w${w}.json`), of = path.join(dir, `${block}-w${w}-out.json`);
    rmSync(of, { force: true });
    writeFileSync(jf, JSON.stringify({ kind, ctx, items: part, out: of }));
    procs.push(new Promise((resolve, reject) => {
      const p = spawn(NODE, ["--max-old-space-size=2048", SELF, "worker", jf], { cwd: ROOT, env: process.env });
      let last = 0, buf = "";
      p.stdout.on("data", d => {
        buf += d.toString();
        const lines = buf.split("\n"); buf = lines.pop();
        for (const l of lines) { const m = /^PROGRESS (\d+)/.exec(l); if (m) { done += Number(m[1]) - last; last = Number(m[1]); if (onProgress) onProgress(done, items.length); beat(() => `${block}: ${done}/${items.length}`); } }
      });
      let err = "";
      p.stderr.on("data", d => { err += d.toString(); });
      p.on("exit", code => code === 0 ? resolve(of) : reject(new Error(`${block} worker ${w} exited ${code}: ${err.slice(-2000)}`)));
    }));
  }
  const files = await Promise.all(procs);
  const res = new Array(items.length);
  const c4 = { actions: 0, draws: 0, failures: 0, examples: [] };
  for (const f of files) {
    const j = readJSONFile(f);
    for (const o of j.out) res[o.idx] = o.r;
    c4.actions += j.c4.actions; c4.draws += j.c4.draws; c4.failures += j.c4.failures; c4.examples.push(...j.c4.examples);
    rmSync(f, { force: true });
  }
  return { res, c4 };
}

// =========================================================================================
// §8 run size, time and the fallback ladder (projection ledger in SC_EXT/timing.json)
// =========================================================================================
const CAP_MIN = 180;
const EST = { checks: 20, H: 3, DW: 1, flatLEV: 8, core: 48, ext: 72, flips: 15 };   // §8, upper ends (minutes)
const BLOCKS = ["checks", "H", "DW", "flatLEV", "core", "ext", "flips"];
function ledger() { const f = extPath(DEV ? "timing-dev.json" : "timing.json"); return existsSync(f) ? readJSONFile(f) : { blocks: {}, cuts: [], projections: [], log: [] }; }
function saveLedger(L) { mkdirSync(EXT, { recursive: true }); writeFileSync(extPath(DEV ? "timing-dev.json" : "timing.json"), JSON.stringify(L, null, 1)); }
function extVariants(cuts) {
  return LEV_EXT.filter(id => !(cuts.includes(1) && id === "M0.01") && !(cuts.includes(2) && id === "P0.1") && !(cuts.includes(4) && ["P0.03", "T0.03", "M0.03"].includes(id)) && !(cuts.includes(5) && id === "T0.1"));
}
const coreN = cuts => cuts.includes(6) ? 100 : N_L;
// Wall minutes per L-EV campaign: the latest finished L-EV block (core, else flat).
function perCampaign(L) {
  for (const b of ["core", "flatLEV"]) if (L.blocks[b]?.done && L.blocks[b].campaigns) return L.blocks[b].min / L.blocks[b].campaigns;
  return null;
}
function blockProjection(L, name, cuts) {
  const pc = perCampaign(L);
  if (name === "core") return pc ? pc * 4 * 4 * coreN(cuts) : EST.core * coreN(cuts) / N_L;
  if (name === "ext") { const left = extVariants(cuts).filter(v => !(L.blocks.ext?.ran || []).includes(v)).length; return pc ? pc * left * 4 * N_L : EST.ext * left / 6; }
  if (name === "flips") {
    const f = L.blocks.flatLEV;
    const solves = f?.solveWallMin && f?.solves ? f.solveWallMin / f.solves : null;
    const states = (f?.flipStates || 760) * (cuts.includes(3) ? 0.5 : 1);
    const nv = 4 + extVariants(cuts).length;
    return solves ? states * nv * 2 * solves * 1.5 : EST.flips * (cuts.includes(3) ? 0.5 : 1);
  }
  return EST[name];
}
function project(L, current, currentMin) {
  let total = 0;
  for (const [, b] of Object.entries(L.blocks)) if (b.done) total += b.min;
  total += currentMin;
  for (const name of BLOCKS.slice(BLOCKS.indexOf(current) + 1)) if (!L.blocks[name]?.done) total += blockProjection(L, name, L.cuts);
  return total;
}
// Called before a block (fraction 0) and after its first 10% (fraction = the share done).
function capCheck(name, fraction, elapsedMin) {
  const L = ledger();
  const cur = () => fraction > 0 ? elapsedMin / fraction : blockProjection(L, name, L.cuts);
  let p = project(L, name, cur());
  L.projections.push({ block: name, at: fraction > 0 ? `after ${(100 * fraction).toFixed(0)}%` : "before", projectedTotalMin: +p.toFixed(1), cuts: [...L.cuts] });
  for (const cut of [1, 2, 3, 4, 5, 6]) {
    if (p <= CAP_MIN) break;
    if (L.cuts.includes(cut)) continue;
    if (cut === 6 && L.blocks.core?.done) continue;
    if ([1, 2, 4, 5].includes(cut) && L.blocks.ext?.done) continue;
    if (cut === 3 && L.blocks.flips?.done) continue;
    L.cuts.push(cut);
    p = project(L, name, name === "core" && cut === 6 && fraction > 0 ? cur() * 100 / N_L : cur());
    L.projections.push({ block: name, afterCut: cut, projectedTotalMin: +p.toFixed(1) });
    say(`CAP: projected ${p.toFixed(1)} min > ${CAP_MIN}; fallback ${cut} made (logged in §9 before any result is read)`);
  }
  if (p > CAP_MIN) L.overrun = true;
  saveLedger(L);
  return L.cuts;
}
function blockStart(name) { const L = ledger(); L.blocks[name] = { ...(L.blocks[name] || {}), started: new Date().toISOString(), done: false }; saveLedger(L); return Date.now(); }
function blockEnd(name, t0, extra = {}) {
  const L = ledger();
  const min = (Date.now() - t0) / 60000;
  L.blocks[name] = { ...L.blocks[name], done: true, min: +min.toFixed(3), estimateMin: EST[name], ...extra };
  saveLedger(L);
  say(`block ${name}: ${min.toFixed(2)} min (§8 estimate ${EST[name]} min)`);
}

// =========================================================================================
// PHASES
// =========================================================================================
function provenance() {
  let commit = null;
  try { commit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim(); } catch { /* none */ }
  return { commit, pageSha256: gameHash(), pageSha256AtRegistration: PAGE_SHA256_AT_REGISTRATION, engineScriptSha256: ENGINE_SHA256, lineOffset: LINE_OFFSET,
    adaptiveRoutesSha256: AR_SHA, scriptSha256: SELF_SHA, node: process.version, workers: WORKERS, partition: "item index mod 3",
    rng: "u = first output of mulberry32(FNV-1a-32(`seed|role|month|key`)); key = origin>destination (sailTo) or port (waitInPort); month before the action",
    seeds: { lev: `${SEED_L}-${SEED_L + N_L - 1}`, h: `${SEED_H}-${SEED_H + N_H - 1}`, c1: "200001-200300 (seed stream)", c1b: "300001-300300 (keyed)", c7: `${C7_SEED0}-${C7_SEED0 + C7_N - 1}` },
    bootstrap: { seed: BOOT_SEED, resamples: BOOT_N }, dev: DEV };
}
function runNodeTests(files, env = {}) {
  const r = spawnSync(NODE, ["--test", ...files], { cwd: ROOT, env: { ...process.env, ...env }, encoding: "utf8" });
  const tail = (r.stdout + r.stderr).split("\n").filter(l => /^ℹ (tests|pass|fail)/.test(l));
  return { exit: r.status, pass: r.status === 0, summary: tail };
}
function c9pre() {
  const page = gameHash(), e = loadRaw();
  return { monsoonIndexUnset: !process.env.MONSOON_INDEX, pageSha256: page, pageEqualsRegistration: page === PAGE_SHA256_AT_REGISTRATION,
    engineScriptSha256: sha256(e.source), engineScriptPinned: sha256(e.source) === ENGINE_SHA256, engineScriptChars: e.source.length,
    pass: !process.env.MONSOON_INDEX && sha256(e.source) === ENGINE_SHA256 };
}
function c9suites() {
  const suites = runNodeTests(["tests/03/engine/*.test.mjs"]);
  const pd = spawnSync(NODE, ["tests/03/engine/planted-defects.mjs"], { cwd: ROOT, encoding: "utf8" });
  return { engineSuites: suites, plantedDefects: { exit: pd.status, pass: pd.status === 0, tail: (pd.stdout + pd.stderr).trim().split("\n").slice(-2) }, pass: suites.pass && pd.status === 0 };
}

async function phaseChecks() {
  const t0 = blockStart("checks");
  const ck = { provenance: provenance() };
  ck.C9pre = c9pre(); say("C9 (pins)", ck.C9pre.pass);
  ck.C4 = c4(); say("C4", ck.C4.pass);
  ck.C2 = c2(); say("C2", ck.C2.pass, ck.C2.cases.map(c => c.pass ? "." : "F").join(""));
  ck.C3 = c3(); say("C3", ck.C3.pass);
  ck.C5 = c5(); say("C5", ck.C5.pass);
  ck.C6 = c6(); say("C6", ck.C6.pass);
  ck.C8 = c8(); say("C8", ck.C8.pass);
  // C7
  { const e = makeEngine(); const lists = c7Lists(e);
    const items = [];
    for (let l = 0; l < lists.length; l++) for (const rule of SHARE_RULES) for (let i = 0; i < (DEV_N || C7_N); i++) items.push({ l, rule, seed: C7_SEED0 + i });
    const { res, c4 } = await runWorkers("c7", "c7", items, { lists });
    const units = Object.fromEntries(SHARE_RULES.map(r => [r, []]));
    items.forEach((it, i) => units[it.rule].push(res[i]));
    const rows = c7Stats(units), scr = c7Scripted(e);
    ck.C7 = { lists: lists.map(L => ({ v: L.v, diff: L.diff, goods: L.goods, actions: L.ops.length, sails: L.ops.filter(o => o[0] === "s").length })), seeds: `${C7_SEED0}-${C7_SEED0 + C7_N - 1}`,
      tests: rows.length, failed: rows.filter(r => !r.pass), descriptorsBeyond3SE: rows.filter(r => r.beyond3SE).map(r => [r.rule, r.term, r.z]), scripted: scr, c4,
      pass: rows.every(r => r.pass) && scr.pass && c4.failures === 0, rows };
    say("C7", ck.C7.pass); }
  // C10, with the identity states collected from C1's first cell
  { const e = makeEngine(); const states = [];
    for (let i = 0; states.length < 106 && i < 300; i++) { const cell = PUB_ON.cells[0]; levRun(e, cell.vessel, cell.difficulty, FLAT, 200001 + i, { identity: true, mode: "stream", pol: cell.policy,
      onState: s0 => { if (states.length < 106) states.push({ seed: 200001 + i, pol: cell.policy, p: s0.clone(), ar: Object.assign(Object.create(AR.Sim.prototype), s0.clone(), { log: null }) }); } }); }
    const sc = c10(e), id = c10Identity(states);
    ck.C10 = { rest: sc.rest, standing: sc.standing, identity: { ...id, source: "the first 106 decision points of L-EV identity runs on C1's first cell (seeds from 200001, seed stream)" },
      pass: sc.rest.pass && sc.standing.pass && id.pass };
    say("C10", ck.C10.pass); }
  // C1
  { const e = makeEngine();
    const off = c1Off(e);
    const items = [];
    for (let c = 0; c < PUB_ON.cells.length; c++) for (let i = 0; i < (DEV_N || 300); i++) items.push({ cell: c, i });
    const { res, c4 } = await runWorkers("c1", "c1", items);
    const bad = res.filter(r => !r.hOk || !r.rOk).map(r => ({ cell: [PUB_ON.cells[r.cellIdx].vessel, PUB_ON.cells[r.cellIdx].difficulty, PUB_ON.cells[r.cellIdx].policy], seed: 200001 + r.i, hOk: r.hOk, rOk: r.rOk }));
    ck.C1 = { hazardsOff: off, harnessNets: res.length, replanNets: res.length, mismatches: bad.length, examples: bad.slice(0, 10), c4,
      pass: off.failures.length === 0 && bad.length === 0 && res.length === 5400 };
    say("C1", ck.C1.pass); }
  // C1b
  { const items = [];
    for (let k = 0; k < dlRows().length; k++) for (let i = 0; i < (DEV_N || 300); i++) items.push({ k, i });
    const { res, c4 } = await runWorkers("c1b", "c1b", items);
    const bad = res.filter(r => !r.ok).map(r => ({ cellRow: dlRows()[r.k].cellRow, seed: 300001 + r.i, E: r.E, S: r.S }));
    ck.C1b = { cells: dlRows().map(c => ({ row: c.cellRow, v: c.v, d: c.d, pol: c.pol })), campaigns: res.length, mismatches: bad.length, examples: bad.slice(0, 10), c4,
      pass: bad.length === 0 && res.length === 2400 && c4.failures === 0 };
    say("C1b", ck.C1b.pass); }
  ck.C9 = c9suites(); say("C9 (suites)", ck.C9.pass);
  const order = ["C9pre", "C4", "C2", "C3", "C5", "C6", "C8", "C7", "C10", "C1", "C1b", "C9"];
  ck.allPass = order.every(k => ck[k].pass);
  ck.summary = Object.fromEntries(order.map(k => [k, ck[k].pass]));
  blockEnd("checks", t0);
  ck.minutes = ledger().blocks.checks.min;
  mergeChecks({ checksPhase: ck });
  say("checks", JSON.stringify(ck.summary));
}

// --- planted defects (§4.8: each in a temporary copy of the research code, inside a temporary clone) ---
const PLANTS = [
  { id: "C1a", check: "C1", defect: "the research sailTo charges 1 D extra on the first mutiny", subs: [["return base;                                                  /*PLANT-C1a*/", "return base + (this.firstMut++ === 0 ? 1 : 0);"]] },
  { id: "C1b-terms", check: "C1", defect: "L-EV with terms off still subtracts the 5 D doldrum term", subs: [["const SC_PLANT_C1B_IDENTITY = false;", "const SC_PLANT_C1B_IDENTITY = true;"]] },
  { id: "C1b", check: "C1b", defect: "the key's month field read after the advance", subs: [["const keyMonth = st.monthIndex;                                /*PLANT-C1b*/", "const keyMonth = st.monthIndex + months;"]] },
  { id: "C2-i", check: "C2", defect: "floor -> round in the lots", subs: [["function shareLots(q, m1000) { return Math.floor(q * m1000 / 1000); }", "function shareLots(q, m1000) { return Math.round(q * m1000 / 1000); }"]] },
  { id: "C2-ii", check: "C2", defect: "tribute share on cash before wages", subs: [["const cashAtRaid = st.cash;                                   /*PLANT-ii*/", "const cashAtRaid = st.cash + crewCost;"]] },
  { id: "C2-iii", check: "C2", defect: "W reads capacity", subs: [["const wageOf = (upkeep, beta, u, cap) => beta ? Math.round(upkeep * (1 + beta * u / cap)) : upkeep;", "const wageOf = (upkeep, beta, u, cap) => beta ? Math.round(upkeep * (1 + beta * cap / cap)) : upkeep;"]] },
  { id: "C2-iv", check: "C2", defect: "P computed before the mildew step", subs: [["const cargoAtRaid = { ...st.cargo };                          /*PLANT-iv*/", "const cargoAtRaid = { ...this.preCargo };"]] },
  { id: "C2-v", check: "C2", defect: "today's floor dropped (raid and M)", subs: [["if (LV < todayV) { cargoLots = zeroLots(); cargoLots[g] = one; cargoV = todayV; }   /*PLANT-v-raid*/", "void todayV;"], ["if (V >= base) return { kind: \"lots\", lots, value: V, cash: 0 };     /*PLANT-v-M*/", "return { kind: \"lots\", lots, value: V, cash: 0 };"]] },
  { id: "C2-vi", check: "C2", defect: "the raid keeps v1's branch on valuables", subs: [["if (X >= cargoV) return { kind: \"cash\", X, lots: null, value: X };   /*PLANT-vi*/", "if (!valuables && X >= cargoV) return { kind: \"cash\", X, lots: null, value: X };"]] },
  { id: "C2-vii", check: "C2", defect: "< -> <= in the piracy comparison", subs: [["const SC_PLANT_VII = false;", "const SC_PLANT_VII = true;"]] },
  { id: "C2-viii", check: "C2", defect: "the standing >= 50 halving omitted", subs: [["const SC_PLANT_VIII = false;", "const SC_PLANT_VIII = true;"]] },
  { id: "C2-ix", check: "C2", defect: "step (2) applied without the valuables condition", subs: [["if (valuables) {                                                  /*PLANT-ix*/", "if (true) {"]] },
  { id: "C2-x", check: "C2", defect: "X computed without max(0, .)", subs: [["const c0 = Math.max(0, cash);                                     /*PLANT-x*/", "const c0 = cash;"]] },
  { id: "C3", check: "C3", defect: "the P copy multiplies the piracy probability by (1 + s)", subs: [["const SC_PLANT_C3 = false;", "const SC_PLANT_C3 = true;"]] },
  { id: "C4-a", check: "C4", defect: "variant id in the key", subs: [["rule: FLAT, plants: {}, keyed", "rule: FLAT, plants: { variantInKey: true }, keyed"]] },
  { id: "C4-b", check: "C4", defect: "piracy and mutiny roles swapped", subs: [["rule: FLAT, plants: {}, keyed", "rule: FLAT, plants: { swapRoles: true }, keyed"]] },
  { id: "C4-c", check: "C4", defect: "keyed source not reinstalled after harnessReset", subs: [["rule: FLAT, plants: {}, keyed", "rule: FLAT, plants: { noReinstall: true }, keyed"]] },
  { id: "C5", check: "C5", defect: "mutiny lots in kind not booked as lost", subs: [["if (this.cur) this.cur.mut = { kind: \"lots\", lots: out.lots, value: out.value, cash: 0 };   /*PLANT-C5*/", "if (this.cur) this.cur.mut = { kind: \"cash\", lots: null, value: 0, cash: 0 };"]] },
  { id: "C6-a", check: "C6", defect: "ruin read from log text", subs: [["function ruinOf(cashBefore, s) { return cashBefore < -250; }        /*PLANT-C6a*/", "function ruinOf(cashBefore, s) { return !s.logs.some(l => l.includes(\"Month 24 Liquidation\")); }"]] },
  { id: "C6-b", check: "C6", defect: "cash read only at decision points", subs: [["if (s.cash < 0) rec.breaches++; };   /*PLANT-C6b*/", "};"], ["sc.decisionPoint = () => { /*PLANT-C6b-dp*/ };", "sc.decisionPoint = () => { if (sc.rec && e.state.cash < 0) sc.rec.breaches++; };"]] },
  { id: "C6-c", check: "C6", defect: "cash read before the story credit", subs: [["act(\"w\", m0, { wage, fee }, { story });\n      breach();", "act(\"w\", m0, { wage, fee }, { story });\n      if (inside < 0) rec.breaches++; else breach();"]] },
  { id: "C7-a", check: "C7", defect: "the planner uses factor 0.6 for high-value cargo", subs: [["let p = P.ports[dest].piracy * (hv ? 1.5 : 0.6) * (s.diff === \"survival\" ? 1.8 : 1.0);   /*PLANT-C7a*/", "let p = P.ports[dest].piracy * (hv ? 0.6 : 0.6) * (s.diff === \"survival\" ? 1.8 : 1.0);"]] },
  { id: "C7-b", check: "C7", defect: "the mutiny term at the expected crew h - 12q", subs: [["function plannerRisk(h, q) { return mutinyRisk2(h, q); }                    /*PLANT-C7b*/", "function plannerRisk(h, q) { return rOf(h - HZ.crewHazard * q); }"]] },
  { id: "C8", check: "C8", defect: "S counts goods in transit", subs: [["const S = cashBefore - debtBefore - s.startEquity + (t < END ? liq : 0);    /*PLANT-C8*/", "const S = cashBefore - debtBefore - s.startEquity + liq;"]] },
  { id: "C9", check: "C9probe", defect: "index.html modified during a phase (temporary clone)", subs: [["/*PLANT-C9*/", "appendFileSync(INDEX, \"\\n<!-- modified during a phase -->\\n\");"]] },
  { id: "C10-a", check: "C10", defect: "dominance on cash only", subs: [["if (mode === \"cash\") return true;                                     /*PLANT-C10a*/", "return true;"]] },
  { id: "C10-b", check: "C10", defect: "standing flags omitted from dominance", subs: [["return (fa & fb) === fb;                                              /*PLANT-C10b*/", "return true;"]] }
];
function makeClone() {
  const dir = path.join(EXT, `plant-clone-${Date.now()}`);
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const dirty = spawnSync("git", ["status", "--porcelain", "research/03/models/scaling-costs.mjs"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  if (dirty && !DEV) throw new Error("scaling-costs.mjs has uncommitted changes; plants run on the committed code");
  let r = spawnSync("git", ["clone", "--quiet", "--no-checkout", ROOT, dir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("clone failed: " + r.stderr);
  r = spawnSync("git", ["-c", "core.autocrlf=false", "checkout", "--quiet", head], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) throw new Error("checkout failed: " + r.stderr);
  if (DEV) writeFileSync(path.join(dir, "research/03/models/scaling-costs.mjs"), readFileSync(SELF));
  return { dir, head };
}
function runPlant(pl, clone) {
  const f = path.join(clone.dir, "research/03/models/scaling-costs.mjs");
  const orig = readFileSync(f, "utf8");
  // the PLANTS table quotes every target, so it is left out of the search
  const i0 = orig.indexOf("const PLANTS = ["), i1 = orig.indexOf("\nfunction makeClone(", i0);
  let head = orig.slice(0, i0), tail = orig.slice(i1);
  const table = orig.slice(i0, i1);
  for (const [a, b] of pl.subs) {
    const n = head.split(a).length - 1 + tail.split(a).length - 1;
    if (n !== 1) throw new Error(`plant ${pl.id}: substitution found ${n} times: ${a.slice(0, 60)}`);
    if (head.includes(a)) head = head.replace(a, () => b); else tail = tail.replace(a, () => b);
  }
  writeFileSync(f, head + table + tail);
  const t0 = Date.now();
  const ext = path.join(EXT, `plant-ext-${pl.id}`);
  const out = path.join(EXT, `plant-out-${pl.id}`);
  rmSync(out, { recursive: true, force: true });
  const idx = path.join(clone.dir, "projects/03/index.html"), page0 = readFileSync(idx);
  const r = spawnSync(NODE, ["--max-old-space-size=2048", f, pl.check === "C9probe" ? "c9probe" : "plantcheck", pl.check], { cwd: clone.dir, encoding: "utf8", env: { ...process.env, SC_EXT: ext, SC_OUT: out, SC_DEV: "" }, maxBuffer: 1 << 28 });
  writeFileSync(f, orig);
  writeFileSync(idx, page0);                                   // the C9 plant appends to the clone page; restore it
  const secs = +((Date.now() - t0) / 1000).toFixed(1);
  let caught, how;
  if (pl.check === "C9probe") {
    const wrote = existsSync(path.join(out, "c9probe.json"));
    caught = r.status !== 0 && !wrote; how = `exit ${r.status}; output ${wrote ? "written" : "not written"}`;
  } else {
    const m = /PLANTRESULT (.*)/.exec(r.stdout || "");
    const res = m ? JSON.parse(m[1]) : null;
    caught = res ? res.pass === false : false;                // a crash is not a catch
    how = res ? `check reported ${res.pass ? "pass" : "FAIL"}` : `no result line; exit ${r.status}: ${(r.stderr || "").trim().split("\n").slice(-1)[0]}`;
    if (res && res.detail) how += `; ${JSON.stringify(res.detail).slice(0, 300)}`;
  }
  return { id: pl.id, check: pl.check, defect: pl.defect, caught, how, seconds: secs };
}
async function phasePlants() {
  const clone = makeClone(), t0 = Date.now(), rows = [];
  const only = process.env.SC_PLANTS ? process.env.SC_PLANTS.split(",") : null;
  for (const pl of PLANTS.filter(p => !only || only.includes(p.id))) {
    const r = runPlant(pl, clone);
    rows.push(r);
    say("plant", pl.id, r.caught ? "CAUGHT" : "NOT CAUGHT", `${r.seconds}s`);
  }
  const ctl = runPlant({ id: "C9-control", check: "C9probe", defect: "none (control: the unplanted probe must exit 0 and write)", subs: [] }, clone);
  ctl.control = true; ctl.controlPassed = ctl.how.startsWith("exit 0") && ctl.how.includes("written") && !ctl.how.includes("not written"); ctl.caught = null;
  rows.push(ctl);
  rmSync(clone.dir, { recursive: true, force: true });
  const allCaught = rows.filter(r => !r.control).every(r => r.caught) && ctl.controlPassed;
  mergeChecks({ plants: { commit: clone.head, minutes: +((Date.now() - t0) / 60000).toFixed(2), allCaught, rows } });
}
// One check, fail-fast where it has a loop, for a planted copy. Prints PLANTRESULT.
async function phasePlantcheck(check) {
  let res;
  if (check === "C1") {
    const e = makeEngine();
    const off = c1Off(e);
    res = { pass: off.failures.length === 0, failures: off.failures.slice(0, 2) };
    if (res.pass) {
      outer: for (let c = 0; c < PUB_ON.cells.length; c++) for (let i = 0; i < 300; i++) {
        const u = c1Unit(e, c, i);
        if (!u.hOk || !u.rOk) { res = { pass: false, failures: [{ cell: c, seed: 200001 + i, hOk: u.hOk, rOk: u.rOk }] }; break outer; }
      }
    }
  } else if (check === "C1b") {
    const e = makeEngine();
    res = { pass: true };
    outer: for (let k = 0; k < dlRows().length; k++) for (let i = 0; i < 300; i++) { const u = c1bUnit(e, k, i); if (!u.ok) { res = { pass: false, failures: [{ k, seed: 300001 + i }] }; break outer; } }
  } else if (check === "C2") res = c2(); else if (check === "C3") res = c3({ failFast: true }); else if (check === "C4") res = c4();
  else if (check === "C5") res = c5({ failFast: true }); else if (check === "C6") res = c6(); else if (check === "C8") res = c8();
  else if (check === "C7") {
    const e = makeEngine(), lists = c7Lists(e), scr = c7Scripted(e);
    res = { pass: scr.pass, scripted: scr };
    if (scr.pass) {
      const units = Object.fromEntries(SHARE_RULES.map(r => [r, []]));
      for (const rule of SHARE_RULES) for (let l = 0; l < lists.length; l++) for (let i = 0; i < C7_N; i++) units[rule].push(c7Unit(e, lists[l], rule, C7_SEED0 + i));
      const rows = c7Stats(units);
      res = { pass: rows.every(r => r.pass), failures: rows.filter(r => !r.pass).slice(0, 3) };
    }
  } else if (check === "C10") { const e = makeEngine(); const r = c10(e); res = { pass: r.rest.pass && r.standing.pass, detail: [r.rest.lev, r.rest.bruteForce?.best, r.standing.lev, r.standing.bruteForce?.best] }; }
  else throw new Error("no plantcheck for " + check);
  const detail = Array.isArray(res.failures) ? res.failures.slice(0, 2) : res.examples ? res.examples.slice(0, 2) : res.cases ? res.cases.filter(c => !c.pass).map(c => c.name) : res.detail || res.rows?.filter(r => r.mismatches).slice(0, 2) || [];
  console.log("PLANTRESULT " + JSON.stringify({ check, pass: res.pass, detail }));
}
async function phaseC9probe() {
  const e = makeEngine();
  hRun(e, "dhow", "normal", "avoidHeadwind", FLAT, "G", 999001, "keyed");
  /*PLANT-C9*/
  emit(outPath("c9probe.json"), JSON.stringify({ probe: true, net: null }) + "\n");
}

// --- flat runs ---------------------------------------------------------------------------
function requireChecks() {
  if (DEV) return;
  const f = outPath("checks.json");
  const ck = existsSync(f) ? readJSONFile(f) : {};
  if (!ck.checksPhase?.allPass) throw new Error("the checks phase has not passed: nothing is scored (§4.8)");
  if (!ck.plants?.allCaught) throw new Error("not every planted defect was caught: nothing is scored (§4.8)");
}
const nL = () => DEV_N || N_L, nH = () => DEV_N || N_H;
function hItems(configs, diffs, withRaidsFor = []) {
  const items = [];
  for (const [rule, fill] of configs) for (const v of VESSELS) for (const d of diffs) for (const pol of H_POLS) for (let i = 0; i < nH(); i++)
    items.push({ rule, fill, v, d, pol, seed: SEED_H + i, withRaids: withRaidsFor.includes(`${rule}|${fill}`) });
  return items;
}
function columnar(items, res, keyOf, fields) {
  const cells = new Map();
  items.forEach((it, i) => {
    const k = keyOf(it);
    if (!cells.has(k)) cells.set(k, { key: k, ...it, seeds: [], cols: Object.fromEntries(fields.map(f => [f, []])), extra: [] });
    const c = cells.get(k), r = res[i];
    c.seeds.push(it.seed);
    for (const f of fields) c.cols[f].push(r[f] ?? null);
    c.extra.push(r.raidList || r.ops || r.states ? { raidList: r.raidList, ops: r.ops, states: r.states } : null);
  });
  return [...cells.values()].map(c => { delete c.idx; delete c.seed; return c; });
}
const H_FIELDS = ["S", "E", "ruin", "ruinMonth", "endMonth", "W6", "W12", "W24", "dWlate", "Clate", "Cearly", "breaches", "minCashAfter", "minInsideWait", "raids", "mutinies",
  "deps", "laden", "crewLt50", "postLt50", "c5", "cons", "logLedgerDiff", "capEvents", "capLots", "ended"];
const L_FIELDS = [...H_FIELDS, "hvDeps", "volWaits", "waits", "crewDepSum", "pHVsum", "pLadenSum", "pAllSum", "ladenRisky", "holdVsum", "valVsum", "ladenStand50", "solves"];
function saveExt(name, obj) { const s = JSON.stringify(obj); emit(extPath(name), s); return { file: name, bytes: Buffer.byteLength(s), sha256: sha256(s) }; }
function loadExt(name) { return readJSONFile(extPath(name)); }

async function phaseFlat() {
  requireChecks();
  const manifest = [];
  // H, flat G and flat G+ (G+ runs under flat too), every difficulty (survival exploratory)
  capCheck("H", 0, 0);
  let t = blockStart("H");
  { const items = hItems([["flat", "G"], ["flat", "G+"]], [...H_DIFFS, "survival"], ["flat|G"]);
    const { res, c4 } = await runWorkers("hflat", "h", items);
    const cells = columnar(items, res, it => `${it.rule}|${it.fill}|${it.v}|${it.d}|${it.pol}`, H_FIELDS);
    manifest.push(saveExt("h-flat.json", { c4, cells }));
    say("H flat done; campaigns", items.length, "C4 failures", c4.failures); }
  const tH = (Date.now() - t) / 60000;
  // D-W flat (G, G+)
  let t2 = Date.now();
  { const e = makeEngine(); const rows = [];
    for (const [rid, fill] of [["flat", "G"], ["flat", "G+"]]) for (const v of VESSELS) for (const d of DW_DIFFS) rows.push(dwCell(e, v, d, rid, fill));
    manifest.push(saveExt("dw-flat.json", { rows }));
    say("D-W flat done"); }
  const tDW = (Date.now() - t2) / 60000;
  // H's block time includes its variant part (in the variants phase); flat part recorded here
  { const L = ledger(); L.blocks.H = { ...L.blocks.H, flatMin: +tH.toFixed(3) }; L.blocks.DW = { flatMin: +tDW.toFixed(3) }; saveLedger(L); }
  // flat L-EV, recording ops (static replay), raids (predict) and decision states (flips: first 10 seeds)
  capCheck("flatLEV", 0, 0);
  t = blockStart("flatLEV");
  const items = [];
  for (const v of VESSELS) for (const d of L_DIFFS) for (let i = 0; i < nL(); i++) items.push({ rule: "flat", v, d, seed: SEED_L + i, withOps: true, withRaids: true, flipStates: i < 10 });
  let projected = false;
  const { res, c4 } = await runWorkers("levflat", "lev", items, {}, (done, total) => { if (!projected && done >= total / 10) { projected = true; capCheck("flatLEV", done / total, (Date.now() - t) / 60000); } });
  const cells = columnar(items, res, it => `${it.rule}|${it.v}|${it.d}`, L_FIELDS);
  manifest.push(saveExt("lev-flat.json", { c4, cells }));
  const solves = res.reduce((a, r) => a + r.solves, 0), flipStates = res.reduce((a, r) => a + (r.states ? r.states.length : 0), 0);
  blockEnd("flatLEV", t, { campaigns: items.length, solves, solveWallMin: (Date.now() - t) / 60000, flipStates });
  emit(extPath("manifest-flat.json"), JSON.stringify(manifest, null, 1));
  say("flat L-EV done; C4 failures", c4.failures);
}

// --- predict (§4.6): frozen; flat ledgers only -----------------------------------------------
// At each realised raid of a flat run: the variant's loss at that state with cash carried forward
// (flat cash at the raid minus the cumulative extra so far, floored by the rule's own max(0, .)),
// cargo from the flat ledger; extra = variant loss - flat loss (valuation convention).
function predictCampaign(raids, rule) {
  let cum = 0, late = 0, all = 0;
  for (const r of raids) {
    const cargo = { ...zeroLots(), ...r.cargo };
    const prc = g => r.prices[g] ?? 0;
    const vLoss = raidOutcome(cargo, r.cash - cum, rule, prc).value;
    const fLoss = raidOutcome(cargo, r.cash, FLAT, prc).value;
    if (Math.abs(fLoss - r.value) > 1e-9) throw new Error("predict: the flat loss recomputed differs from the ledger's");
    const extra = vLoss - fLoss;
    cum += extra; all += extra;
    if (r.late) late += extra;
  }
  return { late, all };
}
function predictTable(cells, arm) {
  const rows = [];
  for (const c of cells) {
    const dW = c.cols.dWlate, Cl = c.cols.Clate;
    const sdW = dW.reduce((a, x) => a + x, 0), sCl = Cl.reduce((a, x) => a + x, 0);
    for (const rid of [...GRID.map(x => `P${gl(x)}`), ...GRID.map(x => `T${gl(x)}`)]) {
      let ex = 0, raids = 0;
      c.extra.forEach(x => { const p = predictCampaign(x.raidList, RULES[rid]); ex += p.late; raids += x.raidList.length; });
      rows.push({ arm, vessel: c.v, difficulty: c.d, policy: c.pol || POL_L, rule: rid, seeds: c.seeds.length, flatRaids: raids, sumExtraLate: ex, sumDWlateFlat: sdW, sumClateFlat: sCl,
        R_late_pred: ex / sdW, K_late_pred: (sCl + ex) / (sCl + sdW), seedsDWlateFlatLE0: dW.filter(x => x <= 0).length });
    }
  }
  return rows;
}
function exposureTable(cells, arm) {
  return cells.map(c => {
    const s = k => c.cols[k].reduce((a, x) => a + (x || 0), 0);
    return { arm, vessel: c.v, difficulty: c.d, policy: c.pol || POL_L, seeds: c.seeds.length, departures: s("deps"), ladenDepartures: s("laden"),
      shareDeparturesCrewLt50: s("crewLt50") / s("deps"), shareDeparturesPostLegCrewLt50: s("postLt50") / s("deps"), raidsPerCampaign: s("raids") / c.seeds.length, mutiniesPerCampaign: s("mutinies") / c.seeds.length,
      ...(c.cols.hvDeps ? { departuresWithValuables: s("hvDeps"), meanPiracyPerValuablesDeparture: s("pHVsum") / Math.max(1, s("hvDeps")), voluntaryWaitsPerCampaign: s("volWaits") / c.seeds.length, meanCrewAtDeparture: s("crewDepSum") / s("deps") } : {}) };
  });
}
async function phasePredict() {
  requireChecks();
  const H = loadExt("h-flat.json"), L = loadExt("lev-flat.json");
  const hG = H.cells.filter(c => c.rule === "flat" && c.fill === "G");
  const pred = [...predictTable(hG, "H"), ...predictTable(L.cells, "L-EV")];
  const expo = [...exposureTable(L.cells, "L-EV"), ...exposureTable(hG, "H")];
  const p = csvString(pred), x = csvString(expo);
  emit(outPath("predict.csv"), p);
  emit(outPath("exposure.csv"), x);
  say("predict.csv SHA-256", sha256(p), "rows", pred.length);   // a hash and a count, no value
  say("exposure.csv SHA-256", sha256(x), "rows", expo.length);
}
function requirePredictRecorded() {
  if (DEV) return;
  const p = outPath("predict.csv"), x = outPath("exposure.csv");
  if (!existsSync(p) || !existsSync(x)) throw new Error("predict.csv and exposure.csv must exist before any variant run (§4.6)");
  const proto = readFileSync(at("../pre-registrations/2026-11-24-scaling-costs.md"), "utf8");
  for (const f of [p, x]) if (!proto.includes(sha256(readFileSync(f)))) throw new Error(`${path.basename(f)}'s SHA-256 is not in the protocol's §9: enter it before any variant run`);
}

// --- variant arms --------------------------------------------------------------------------
async function phaseVariants() {
  requireChecks(); requirePredictRecorded();
  const manifest = [];
  // H variants (22 configurations), every difficulty
  let t = Date.now();
  { const cfgs = H_CONFIGS.filter(([r]) => r !== "flat");
    const items = hItems(cfgs, [...H_DIFFS, "survival"]);
    const { res, c4 } = await runWorkers("hvar", "h", items);
    const cells = columnar(items, res, it => `${it.rule}|${it.fill}|${it.v}|${it.d}|${it.pol}`, H_FIELDS);
    manifest.push(saveExt("h-variants.json", { c4, cells }));
    const L = ledger(); L.blocks.H = { ...L.blocks.H, done: true, variantMin: +((Date.now() - t) / 60000).toFixed(3) }; L.blocks.H.min = +(L.blocks.H.flatMin + L.blocks.H.variantMin).toFixed(3); L.blocks.H.estimateMin = EST.H; saveLedger(L);
    say("H variants done; campaigns", items.length, "C4 failures", c4.failures); }
  // D-W variants
  t = Date.now();
  { const e = makeEngine(), rows = [];
    for (const [rid, fill] of DW_CONFIGS.filter(([r]) => r !== "flat")) for (const v of VESSELS) for (const d of DW_DIFFS) rows.push(dwCell(e, v, d, rid, fill));
    manifest.push(saveExt("dw-variants.json", { rows }));
    const L = ledger(); L.blocks.DW = { ...L.blocks.DW, done: true, min: +(L.blocks.DW.flatMin + (Date.now() - t) / 60000).toFixed(3), estimateMin: EST.DW }; saveLedger(L);
    say("D-W variants done"); }
  // L-EV core, in two parts (seeds 1-100, then 101-150) so that fallback 6 can still apply to the second
  const levCells = [];
  const runLev = async (name, variants, seedFrom, seedTo, tStart, totalForProjection) => {
    const items = [];
    for (const rid of variants) for (const v of VESSELS) for (const d of L_DIFFS) for (let i = seedFrom; i < seedTo; i++) items.push({ rule: rid, v, d, seed: SEED_L + i });
    let projected = false;
    const { res, c4 } = await runWorkers(name, "lev", items, {}, (done, total) => {
      if (!projected && totalForProjection && done >= total / 10) { projected = true; capCheck(totalForProjection.block, (totalForProjection.doneBefore + done) / totalForProjection.total, (Date.now() - tStart) / 60000); }
    });
    levCells.push(...columnar(items, res, it => `${it.rule}|${it.v}|${it.d}|${seedFrom}`, L_FIELDS));
    return c4;
  };
  let cuts = capCheck("core", 0, 0);
  t = blockStart("core");
  const nA = Math.min(100, nL());
  const c4a = await runLev("core-a", LEV_CORE, 0, nA, t, { block: "core", doneBefore: 0, total: LEV_CORE.length * 4 * coreN(cuts) });
  cuts = ledger().cuts;
  let c4b = { failures: 0 };
  if (!cuts.includes(6) && nL() > 100) c4b = await runLev("core-b", LEV_CORE, 100, nL(), t, null);
  blockEnd("core", t, { campaigns: LEV_CORE.length * 4 * (cuts.includes(6) ? nA : nL()), c4Failures: c4a.failures + c4b.failures });
  // extended, in reverse ladder order so that a later cut can still drop a variant not yet run
  cuts = capCheck("ext", 0, 0);
  t = blockStart("ext");
  const order = ["T0.1", "P0.03", "T0.03", "M0.03", "P0.1", "M0.01"];
  const ran = [];
  for (const rid of order) {
    cuts = ledger().cuts;
    if (!extVariants(cuts).includes(rid)) { say("ext: dropped by the fallback ladder:", rid); continue; }
    await runLev(`ext-${rid}`, [rid], 0, nL(), t, null);
    ran.push(rid);
    const L = ledger(); L.blocks.ext = { ...L.blocks.ext, ran }; saveLedger(L);
    if (ran.length === 1) capCheck("ext", ran.length / extVariants(cuts).length, (Date.now() - t) / 60000);
  }
  blockEnd("ext", t, { campaigns: ran.length * 4 * nL(), ran });
  // merge the core parts per cell
  const merged = new Map();
  for (const c of levCells) {
    const k = `${c.rule}|${c.v}|${c.d}`;
    if (!merged.has(k)) merged.set(k, { ...c, key: k });
    else { const m = merged.get(k); m.seeds.push(...c.seeds); for (const f of L_FIELDS) m.cols[f].push(...c.cols[f]); }
  }
  const variantCells = [...merged.values()].map(c => { delete c.extra; return c; });
  manifest.push(saveExt("lev-variants.json", { cells: variantCells }));
  // static replays of the flat L-EV runs under each variant that was run (A, §4.1)
  t = Date.now();
  { const flat = loadExt("lev-flat.json"), ops = {};
    for (const c of flat.cells) c.seeds.forEach((s, i) => { ops[`${c.v}|${c.d}|${s}`] = c.extra[i].ops; });
    const items = [];
    for (const c of variantCells) for (const s of c.seeds) items.push({ rule: c.rule, v: c.v, d: c.d, seed: s });
    const { res, c4 } = await runWorkers("static", "static", items, { ops });
    const cells = columnar(items, res, it => `${it.rule}|${it.v}|${it.d}`, L_FIELDS).map(c => { delete c.extra; return c; });
    manifest.push(saveExt("lev-static.json", { c4, cells }));
    const L = ledger(); L.blocks.static = { done: true, min: +((Date.now() - t) / 60000).toFixed(3), campaigns: items.length, note: "not in the §8 table; timed and reported" }; saveLedger(L); }
  emit(extPath("manifest-variants.json"), JSON.stringify(manifest, null, 1));
}

// --- decision flips (§4.7) ---------------------------------------------------------------------
function flipUnit(it, ctx) {
  const st = it.state, out = [];
  for (const rid of ctx.variants) {
    const s = new PSim(st.v, st.diff, { rule: RULES[rid] });
    Object.assign(s, { port: st.port, t: st.t, cash: st.cash, debt: st.debt, equity: st.equity, hull: st.hull, crew: st.crew, dias: { ...st.dias } });
    const best = solveP(s.clone(), POL_L, {});
    const aVar = best.acts[0] || null;
    const qVar = best.net;
    const qFlat = actKey(aVar) === actKey(it.act) ? qVar : solveP(s.clone(), POL_L, { forced: it.act }).net;
    out.push({ rule: rid, aVar: actKey(aVar), aFlat: actKey(it.act), qVar, qFlat });
  }
  return out;
}
async function phaseFlips() {
  requireChecks(); requirePredictRecorded();
  const L = ledger();
  let cuts = capCheck("flips", 0, 0);
  const t = blockStart("flips");
  const flat = loadExt("lev-flat.json");
  const nSeeds = cuts.includes(3) ? 5 : 10;
  const seen = new Map();
  for (const c of flat.cells) c.seeds.forEach((seed, i) => {
    if (seed >= SEED_L + nSeeds || !c.extra[i].states) return;
    for (const x of c.extra[i].states) {
      const k = JSON.stringify([x.s, actKey(x.act)]);
      if (!seen.has(k)) seen.set(k, { state: x.s, act: x.act, cell: `${c.v}|${c.d}`, count: 0 });
      seen.get(k).count++;
    }
  });
  const variants = [...LEV_CORE, ...(L.blocks.ext?.ran || [])];
  const items = [...seen.values()];
  const { res } = await runWorkers("flips", "flips", items, { variants });
  const rows = [];
  items.forEach((it, i) => res[i].forEach(r => rows.push({ cell: it.cell, t: it.state.t, port: it.state.port, weight: it.count, ...r })));
  saveExt("flips-states.json", { nSeeds, states: items.length, rows });
  blockEnd("flips", t, { states: items.length, variants: variants.length, nSeeds });
}

// =========================================================================================
// SCORE (§5, §6): from the external per-campaign files and the committed predict table.
// =========================================================================================
const sumOf = xs => xs.reduce((a, x) => a + (x || 0), 0);
const quant = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(q * (s.length - 1))]; };
// R_late and its 95% seed-level percentile bootstrap (paired, resampled within the cell).
function rLate(varD, flatD) { return 1 - sumOf(varD) / sumOf(flatD); }
function bootR(varD, flatD, rnd) {
  const n = varD.length, out = new Float64Array(BOOT_N);
  for (let b = 0; b < BOOT_N; b++) {
    let a = 0, c = 0;
    for (let k = 0; k < n; k++) { const j = Math.floor(rnd() * n); a += varD[j]; c += flatD[j]; }
    out[b] = 1 - a / c;
  }
  out.sort();
  return [out[Math.floor(0.025 * (BOOT_N - 1))], out[Math.floor(0.975 * (BOOT_N - 1))]];
}
function cellStats(c, f, rnd, { boot = true } = {}) {
  const C = c.cols, F = f.cols, n = C.S.length;
  if (JSON.stringify(c.seeds) !== JSON.stringify(f.seeds.slice(0, n))) throw new Error("seeds do not pair: " + c.key);
  const fd = F.dWlate.slice(0, n), fW6 = F.W6.slice(0, n), fCl = F.Clate.slice(0, n), fRuin = F.ruin.slice(0, n);
  const R = rLate(C.dWlate, fd);
  const early = C.ruin.filter((r, i) => r && C.ruinMonth[i] <= 12).length, earlyF = fRuin.filter((r, i) => r && F.ruinMonth[i] <= 12).length;
  const sCl = sumOf(C.Clate);
  return {
    seeds: n, completed: C.ended.filter(Boolean).length, ruins: sumOf(C.ruin), earlyRuins: early, flatRuins: sumOf(fRuin), flatEarlyRuins: earlyF,
    medianS: quant(C.S, 0.5), p10S: quant(C.S, 0.1), p90S: quant(C.S, 0.9), medianE: quant(C.E, 0.5), medianSflat: quant(F.S.slice(0, n), 0.5),
    R_late: R, R_late_lo: boot ? null : null, R_late_hi: null, ...(boot ? (() => { const [lo, hi] = bootR(C.dWlate, fd, rnd); return { R_late_lo: lo, R_late_hi: hi }; })() : {}),
    K_late: sCl / (sCl + sumOf(C.dWlate)), K_late_flat: sumOf(fCl) / (sumOf(fCl) + sumOf(fd)), W6change: sumOf(C.W6) / sumOf(fW6) - 1,
    seedsDWlateFlatLE0: fd.filter(x => x <= 0).length, campaignsWithBreach: C.breaches.filter(x => x > 0).length, minCashAfter: Math.min(...C.minCashAfter), minInsideWait: Math.min(...C.minInsideWait),
    raidsPerCampaign: sumOf(C.raids) / n, mutiniesPerCampaign: sumOf(C.mutinies) / n, c5Failures: sumOf(C.c5), consFailures: sumOf(C.cons), logLedgerDiffs: sumOf(C.logLedgerDiff), capEvents: sumOf(C.capEvents)
  };
}
function behaviour(c, f) {
  const C = c.cols, F = f.cols, n = C.S.length, s = (X, k) => sumOf(X[k].slice(0, n));
  const dv = C.volWaits.map((x, i) => x - F.volWaits[i]);
  const m = X => ({ crew: s(X, "crewDepSum") / s(X, "deps"), pHV: s(X, "pHVsum") / Math.max(1, s(X, "hvDeps")), pLaden: s(X, "pLadenSum") / Math.max(1, s(X, "laden")),
    risky: s(X, "ladenRisky") / Math.max(1, s(X, "laden")), holdV: s(X, "holdVsum") / Math.max(1, s(X, "laden")), valShare: s(X, "valVsum") / Math.max(1, s(X, "holdVsum")),
    stand50: s(X, "ladenStand50") / Math.max(1, s(X, "laden")), volWaits: s(X, "volWaits") / n, deps: s(X, "deps") / n });
  const a = m(C), b = m(F);
  return { pairedMedianDVolWaits: quant(dv, 0.5), meanVolWaits: a.volWaits, meanVolWaitsFlat: b.volWaits,
    meanCrewAtDeparture: a.crew, meanCrewAtDepartureFlat: b.crew, meanPiracyValuablesDep: a.pHV, meanPiracyValuablesDepFlat: b.pHV,
    meanPiracyLadenDep: a.pLaden, meanPiracyLadenDepFlat: b.pLaden, shareLadenIntoMalAdenKilwa: a.risky, shareLadenIntoMalAdenKilwaFlat: b.risky,
    meanHoldValueAtDeparture: a.holdV, meanHoldValueAtDepartureFlat: b.holdV, valuablesShareOfHold: a.valShare, valuablesShareOfHoldFlat: b.valShare,
    shareLadenIntoStanding50: a.stand50, shareLadenIntoStanding50Flat: b.stand50, departuresPerCampaign: a.deps, departuresPerCampaignFlat: b.deps };
}
async function phaseScore() {
  const rnd = mulberry32(BOOT_SEED);
  const hF = loadExt("h-flat.json"), hV = loadExt("h-variants.json"), lF = loadExt("lev-flat.json"), lV = loadExt("lev-variants.json"), lS = loadExt("lev-static.json");
  const dwF = loadExt("dw-flat.json"), dwV = loadExt("dw-variants.json");
  const flips = existsSync(extPath("flips-states.json")) ? loadExt("flips-states.json") : null;
  const pred = readCSV(outPath("predict.csv")), expo = readCSV(outPath("exposure.csv"));
  const L = ledger();
  const predOf = (arm, v, d, pol, rule) => pred.find(r => r.arm === arm && r.vessel === v && r.difficulty === d && r.policy === pol && r.rule === rule);
  // ---- H ----
  const hAll = [...hF.cells, ...hV.cells];
  const hRef = (c, fill) => hAll.find(x => x.rule === "flat" && x.fill === fill && x.v === c.v && x.d === c.d && x.pol === c.pol);
  const harness = [];
  for (const c of hAll) {
    const f = hRef(c, c.fill), st = cellStats(c, f, rnd, { boot: c.rule !== "flat" });
    const p = /^[PT]/.test(c.rule) ? predOf("H", c.v, c.d, c.pol, c.rule) : null;
    harness.push({ rule: c.rule, fill: c.fill, vessel: c.v, difficulty: c.d, policy: c.pol, ...st, R_late_pred: p ? p.R_late_pred : null, K_late_pred: p ? p.K_late_pred : null,
      gapR: p ? st.R_late - p.R_late_pred : null, gapK: p ? st.K_late - p.K_late_pred : null });
  }
  // ---- L-EV ----
  const lAll = [...lF.cells, ...lV.cells];
  const lRef = c => lF.cells.find(x => x.v === c.v && x.d === c.d);
  const lev = [], beh = [];
  for (const c of lAll) {
    const f = lRef(c), st = cellStats(c, f, rnd, { boot: c.rule !== "flat" });
    const sc = lS.cells.find(x => x.rule === c.rule && x.v === c.v && x.d === c.d);
    const stS = sc ? cellStats(sc, f, rnd, { boot: false }) : null;
    const p = /^[PT]/.test(c.rule) ? predOf("L-EV", c.v, c.d, POL_L, c.rule) : null;
    lev.push({ rule: c.rule, vessel: c.v, difficulty: c.d, ...st, R_late_static: stS ? stS.R_late : null, staticCapEvents: stS ? stS.capEvents : null, staticRuins: stS ? stS.ruins : null,
      A: stS && stS.R_late !== 0 ? 1 - st.R_late / stS.R_late : null, R_late_pred: p ? p.R_late_pred : null, gapR_behavioural: p ? st.R_late - p.R_late_pred : null, K_late_pred: p ? p.K_late_pred : null });
    beh.push({ rule: c.rule, vessel: c.v, difficulty: c.d, seeds: c.seeds.length, ...behaviour(c, f) });
  }
  // ship choice
  const ships = [];
  for (const rid of [...new Set(lAll.map(c => c.rule))]) for (const d of L_DIFFS) {
    const j = lAll.find(c => c.rule === rid && c.v === "junk" && c.d === d), h = lAll.find(c => c.rule === rid && c.v === "dhow" && c.d === d);
    if (!j || !h) continue;
    const n = Math.min(j.cols.S.length, h.cols.S.length);
    ships.push({ arm: "L-EV", rule: rid, difficulty: d, policy: POL_L, ratioMedianS: quant(j.cols.S, 0.5) / quant(h.cols.S, 0.5), shareSeedsJunkGtDhow: j.cols.S.slice(0, n).filter((x, i) => x > h.cols.S[i]).length / n });
  }
  for (const [rid, fill] of H_CONFIGS) for (const d of [...H_DIFFS, "survival"]) for (const pol of H_POLS) {
    const j = hAll.find(c => c.rule === rid && c.fill === fill && c.v === "junk" && c.d === d && c.pol === pol), h = hAll.find(c => c.rule === rid && c.fill === fill && c.v === "dhow" && c.d === d && c.pol === pol);
    ships.push({ arm: "H", rule: `${rid}${fill === "G+" ? "/G+" : ""}`, difficulty: d, policy: pol, ratioMedianS: quant(j.cols.S, 0.5) / quant(h.cols.S, 0.5), shareSeedsJunkGtDhow: j.cols.S.filter((x, i) => x > h.cols.S[i]).length / j.cols.S.length });
  }
  // ---- D-W ----
  const dwAll = [...dwF.rows, ...dwV.rows];
  const dw = dwAll.map(r => { const f = dwAll.find(x => x.rule === "flat" && x.fill === r.fill && x.v === r.v && x.diff === r.diff);
    return { rule: r.rule, fill: r.fill, vessel: r.v, difficulty: r.diff, S: r.S, E: r.E, dpNetS: r.dpNetS, engineMatchesPlan: r.engineMatches, ruin: r.ruin, W6: r.W6, dWlate: r.dWlate,
      R_late: 1 - r.dWlate / f.dWlate, breaches: r.breaches, minCashAfter: r.minCashAfter, decisions: r.decisions }; });
  // ---- flips ----
  const flipRows = [];
  if (flips) for (const rid of [...new Set(flips.rows.map(r => r.rule))]) for (const cell of [...new Set(flips.rows.map(r => r.cell))]) {
    const rows = flips.rows.filter(r => r.rule === rid && r.cell === cell);
    const [v, d] = cell.split("|"), mv = MARGIN[d][v];
    const flipAt = m => rows.filter(r => r.qFlat !== null && r.qVar !== null && r.qFlat < r.qVar - m(r));
    const w = xs => xs.reduce((a, r) => a + r.weight, 0);
    const at = { mv: flipAt(() => mv), one: flipAt(() => 1), twice: flipAt(() => 2 * mv), pct: flipAt(r => 0.01 * Math.abs(r.qVar)) };
    flipRows.push({ rule: rid, vessel: v, difficulty: d, m_v: mv, uniqueStates: rows.length, weightedStates: w(rows), actionDiffers: rows.filter(r => r.aVar !== r.aFlat).length,
      flips_mv: at.mv.length, flips_1D: at.one.length, flips_2mv: at.twice.length, flips_1pctQ: at.pct.length, weightedFlips_mv: w(at.mv), seedsPerCell: flips.nSeeds });
  }
  // ---- scores ----
  const S = {};
  const hc = (rule, fill, v, d, pol) => harness.find(r => r.rule === rule && r.fill === fill && r.vessel === v && r.difficulty === d && r.policy === pol);
  const lc = (rule, v, d) => lev.find(r => r.rule === rule && r.vessel === v && r.difficulty === d);
  const bc = (rule, v, d) => beh.find(r => r.rule === rule && r.vessel === v && r.difficulty === d);
  const ranL = new Set(lV.cells.map(c => c.rule));
  // S6 (primary)
  { const exposed = expo.filter(r => r.arm === "L-EV");
    const untestable = exposed.every(r => r.shareDeparturesCrewLt50 < 0.05);
    const rows = [];
    if (ranL.has("M0.3")) for (const v of VESSELS) for (const d of L_DIFFS) { const b = bc("M0.3", v, d); rows.push({ v, d, pairedMedianDVolWaits: b.pairedMedianDVolWaits, crew: b.meanCrewAtDeparture, crewFlat: b.meanCrewAtDepartureFlat, meets: b.pairedMedianDVolWaits >= 1 && b.meanCrewAtDeparture > b.meanCrewAtDepartureFlat }); }
    S.S6 = { score: !ranL.has("M0.3") ? "not run" : untestable ? "untestable" : rows.some(r => r.meets) ? "supported" : "contradicted", exposure: exposed.map(r => [r.vessel, r.difficulty, r.shareDeparturesCrewLt50]), rows }; }
  // S7 (primary)
  { const fa = [], fb = [], ra = [], rb = [];
    for (const rid of ["M0.01", "M0.03", "M0.1"]) { if (!ranL.has(rid)) continue; for (const v of VESSELS) for (const d of L_DIFFS) { const b = bc(rid, v, d); ra.push([rid, v, d, b.pairedMedianDVolWaits]); if (Math.abs(b.pairedMedianDVolWaits) > 1) fa.push([rid, v, d, b.pairedMedianDVolWaits]); } }
    for (const rid of ["P0.3", "T0.3"]) { if (!ranL.has(rid)) continue; for (const v of VESSELS) for (const d of L_DIFFS) { const b = bc(rid, v, d);
      const dp = b.meanPiracyLadenDep - b.meanPiracyLadenDepFlat, hv = b.meanHoldValueAtDeparture / b.meanHoldValueAtDepartureFlat - 1;
      rb.push([rid, v, d, +dp.toFixed(4), +hv.toFixed(4)]); if (Math.abs(dp) > 0.02 || Math.abs(hv) > 0.05) fb.push([rid, v, d, dp, hv]); } }
    S.S7 = { score: fa.length || fb.length ? "contradicted" : "supported", a: { rows: ra, failed: fa }, b: { rows: rb, failed: fb } }; }
  // S8 (primary)
  { const fl = ships.filter(r => r.arm === "L-EV" && r.rule !== "flat" && r.ratioMedianS < 1.5);
    const fh = ships.filter(r => r.arm === "H" && ["easy", "normal"].includes(r.difficulty) && r.ratioMedianS < 1);
    S.S8 = { score: fl.length || fh.length ? "contradicted" : "supported", levRatios: ships.filter(r => r.arm === "L-EV").map(r => [r.rule, r.difficulty, +r.ratioMedianS.toFixed(4)]), levFailed: fl, hReversals: fh.map(r => [r.rule, r.difficulty, r.policy, r.ratioMedianS]) }; }
  // S1, S2
  for (const [id, gap] of [["S1", "gapR"], ["S2", "gapK"]]) {
    const cells = harness.filter(r => /^[PT]/.test(r.rule) && ["easy", "normal"].includes(r.difficulty));
    const out = t => cells.filter(r => Math.abs(r[gap]) > t);
    S[id] = { score: out(0.02).length ? "contradicted" : "supported", cells: cells.length, outside2pp: out(0.02).map(r => [r.rule, r.vessel, r.difficulty, r.policy, +(100 * r[gap]).toFixed(2)]),
      outside1pp: out(0.01).length, outside4pp: out(0.04).length, maxAbsGapPp: +(100 * Math.max(...cells.map(r => Math.abs(r[gap])))).toFixed(3),
      descriptors: harness.filter(r => /^[PT]/.test(r.rule) && ["hard", "survival"].includes(r.difficulty)).map(r => [r.rule, r.vessel, r.difficulty, r.policy, +(100 * r[gap]).toFixed(2)]) };
  }
  // S3
  { const a = [...harness.filter(r => /^W/.test(r.rule) && r.fill === "G+" && H_DIFFS.includes(r.difficulty)).map(r => ({ arm: "H", cell: [r.rule, r.vessel, r.difficulty, r.policy], R: r.R_late })),
      ...dw.filter(r => /^W/.test(r.rule) && r.fill === "G+").map(r => ({ arm: "D-W", cell: [r.rule, r.vessel, r.difficulty], R: r.R_late }))];
    const fa = a.filter(x => !(x.R < 0.05));
    const b = harness.filter(r => ["W10", "W30"].includes(r.rule) && r.fill === "G" && ["easy", "normal"].includes(r.difficulty)).map(r => ({ cell: [r.rule, r.vessel, r.difficulty, r.policy], excess: (r.ruins - r.flatRuins) * 1000 / r.seeds }));
    S.S3 = { a: { score: fa.length ? "contradicted" : "supported", failed: fa, maxR: Math.max(...a.map(x => x.R)) }, b: { score: b.some(x => x.excess >= 10) ? "supported" : "contradicted", cells: b } }; }
  // S5
  const s5For = (rid, hBound, lBound, w6Bound) => {
    const f = [];
    for (const r of harness.filter(r => r.rule === rid && r.fill === "G" && H_DIFFS.includes(r.difficulty))) if ((r.earlyRuins - r.flatEarlyRuins) * 1000 / r.seeds > hBound) f.push(["H", r.vessel, r.difficulty, r.policy, r.earlyRuins, r.flatEarlyRuins]);
    for (const r of lev.filter(r => r.rule === rid)) { if (r.ruins > lBound) f.push(["L-EV ruins", r.vessel, r.difficulty, r.ruins]); if (r.W6change < w6Bound) f.push(["L-EV W6", r.vessel, r.difficulty, r.W6change]); }
    return f;
  };
  { const rules = [...["P", "T", "M"].flatMap(k => GRID.map(x => `${k}${gl(x)}`)), "B1", "B2"];
    const failed = rules.map(rid => [rid, s5For(rid, 2, 1, -0.02)]).filter(x => x[1].length);
    S.S5 = { score: failed.length ? "contradicted" : "supported", failed,
      descriptors: { loose: rules.filter(rid => s5For(rid, 5, 3, -0.05).length).map(r => r), strict: rules.filter(rid => s5For(rid, 1, 0, -0.01).length) } }; }
  // ---- §6 adoption rule (the owner decides; reported whatever it shows) ----
  const candidate = (fam, Rstar, bounds = [2, 1, -0.02]) => {
    for (const x of fam === "W" ? BETAS : GRID) {
      const rid = fam === "W" ? `W${x}` : `${fam}${gl(x)}`;
      const fill = fam === "W" ? "G+" : "G";
      const hcells = harness.filter(r => r.rule === rid && r.fill === fill && ["easy", "normal"].includes(r.difficulty));
      const lcells = lev.filter(r => r.rule === rid);
      if (!hcells.every(r => r.R_late >= Rstar) || !lcells.every(r => r.R_late >= Rstar)) continue;
      if (fam === "W") { const ex = harness.filter(r => r.rule === rid && r.fill === "G+" && ["easy", "normal"].includes(r.difficulty)).some(r => (r.ruins - r.flatRuins) * 1000 / r.seeds >= 10); if (ex) continue; }
      else if (s5For(rid, ...bounds).length) continue;
      return { value: fam === "W" ? x : x / 1000, rule: rid, K_late: { H: hcells.map(r => [r.vessel, r.difficulty, r.policy, +r.K_late.toFixed(4)]), LEV: lcells.map(r => [r.vessel, r.difficulty, +r.K_late.toFixed(4)]) } };
    }
    return "no candidate";
  };
  const adoption = {};
  for (const fam of ["P", "T", "M", "W"]) adoption[fam] = { "R*=10% (informed)": candidate(fam, 0.10), "R*=5% (descriptor)": candidate(fam, 0.05), "R*=20% (descriptor)": candidate(fam, 0.20),
    "R*=10%, looser guardrails": fam === "W" ? null : candidate(fam, 0.10, [5, 3, -0.05]), "R*=10%, stricter guardrails": fam === "W" ? null : candidate(fam, 0.10, [1, 0, -0.01]) };
  // ---- outputs ----
  const ck = existsSync(outPath("checks.json")) ? readJSONFile(outPath("checks.json")) : {};
  emit(outPath("harness.csv"), csvString(harness));
  emit(outPath("lev.csv"), csvString(lev));
  emit(outPath("behaviour.csv"), csvString(beh));
  emit(outPath("ships.csv"), csvString(ships));
  emit(outPath("dw.csv"), csvString(dw));
  if (flipRows.length) emit(outPath("flips.csv"), csvString(flipRows));
  const perSeed = [];
  for (const c of lAll) c.seeds.forEach((s, i) => perSeed.push({ rule: c.rule, vessel: c.v, difficulty: c.d, seed: s, S: c.cols.S[i], E: c.cols.E[i], ruin: c.cols.ruin[i], volWaits: c.cols.volWaits[i], dWlate: c.cols.dWlate[i], W6: c.cols.W6[i] }));
  const ps = csvString(perSeed);
  if (Buffer.byteLength(ps) < 1e6) emit(outPath("lev-perseed.csv"), ps); else saveExt("lev-perseed.csv", ps);
  const hPerSeed = csvString(hAll.flatMap(c => c.seeds.map((s, i) => ({ rule: c.rule, fill: c.fill, vessel: c.v, difficulty: c.d, policy: c.pol, seed: s, S: c.cols.S[i], ruin: c.cols.ruin[i], ruinMonth: c.cols.ruinMonth[i], dWlate: c.cols.dWlate[i], W6: c.cols.W6[i] }))));
  const hps = saveExt("h-perseed.csv", hPerSeed);
  const c4 = { H: [hF.c4, hV.c4], LEV: [lF.c4], static: lS.c4 };
  emit(outPath("predictions.json"), JSON.stringify({ status: "exploratory; provenance-incomplete (the external archive is not yet at an immutable reference)", provenance: provenance(),
    checks: ck.checksPhase?.summary, plantsAllCaught: ck.plants?.allCaught, c4, scores: S, adoption, timing: L,
    counts: { H: hAll.map(c => [c.rule, c.fill, c.v, c.d, c.pol, c.seeds.length, sumOf(c.cols.ended)]), LEV: lAll.map(c => [c.rule, c.v, c.d, c.seeds.length, sumOf(c.cols.ended)]) } }, null, 1) + "\n");
  // external archive manifest (neutral root name, repository-relative nothing local)
  const files = [];
  for (const m of ["manifest-flat.json", "manifest-variants.json"]) if (existsSync(extPath(m))) files.push(...readJSONFile(extPath(m)));
  for (const f of ["flips-states.json", "timing.json"]) if (existsSync(extPath(f))) { const b = readFileSync(extPath(f)); files.push({ file: f, bytes: b.length, sha256: sha256(b) }); }
  files.push(hps);
  emit(outPath("external-manifest.json"), JSON.stringify({ archiveRoot: "scaling-costs external archive: the directory sc_ext (SC_EXT) on the author machine at the run, not yet published at an immutable reference; until it is, this result is provenance-incomplete. Every path below is relative to that root.", files }, null, 1) + "\n");
  emit(outPath("timing.json"), JSON.stringify(L, null, 1) + "\n");
  if (!DEV) say("scores", JSON.stringify(Object.fromEntries(Object.entries(S).map(([k, x]) => [k, x.score || { a: x.a?.score, b: x.b?.score }]))));
}

// =========================================================================================
// main: every phase hashes the page before and after; outputs are written only if unchanged
// =========================================================================================
const phases = { checks: phaseChecks, plants: phasePlants, plantcheck: () => phasePlantcheck(process.argv[3]), c9probe: phaseC9probe, worker: phaseWorker,
  flat: phaseFlat, predict: phasePredict, variants: phaseVariants, flips: phaseFlips, score: phaseScore };
if (!phases[PHASE]) throw new Error("unknown phase " + PHASE);
if (process.env.MONSOON_INDEX && PHASE !== "plantcheck") throw new Error("MONSOON_INDEX must be unset (C9)");
const H_START = gameHash();
await phases[PHASE]();
const H_END = gameHash();
if (H_START !== H_END) { console.error(`PAGE CHANGED during phase ${PHASE}: ${H_START} -> ${H_END}; no output written`); process.exit(3); }
if (PHASE !== "worker") {
  flushOutputs();
  if (PHASE !== "plantcheck") say(`page ${H_START.slice(0, 12)} unchanged; outputs written`);
}
