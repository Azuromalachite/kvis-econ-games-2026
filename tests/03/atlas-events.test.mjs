// Seeded check for the Atlas event cards (AGENTS.md, Atlas section, "Missing state").
//
// The Atlas display layer in projects/03/index.html reads the engine's log text to show
// an event card. This check plays seeded campaigns through the real engine and the real
// adapter, and compares the cards shown with the events the engine actually drew.
//
// Ground truth does NOT come from the log text. Every Math.random() call is recorded with
// the engine source line that made it, and each draw site is identified by its code, not
// by the words it logs. Every draw returns 0 or 0.999, so each hazard check's outcome is
// known by construction: 0 passes every "< p" test with p > 0, and 0.999 fails all of them.
//
// The adapter's skip rule, as stated in PR #5:
//   - Only voyage log entries (those containing " | Events: ") are read. Other entries
//     never become a card. Survival's charter line names "Cyclone & Piracy Crisis" and
//     once did.
//   - Six kinds: turnback, cyclone, headwind, piracy, cargo, mutiny.
//   - At most one card per kind per game.
//   - At most one card per repaint. For each new log entry, only the first matching kind
//     in that order is considered. If it has been shown already, the entry is skipped, even
//     if it also contains a kind not yet shown. After a card is shown, later entries in the
//     same repaint are marked processed and never shown. Entries are read newest first.
//   - No card on a voyage that ends the campaign: the engine shows the audit and does not
//     repaint the voyage screen, so the adapter never sees that voyage's entry.
// So the expected card for a voyage is the first drawn kind in that order, if it hasn't
// been shown yet; otherwise none.
//
// Run: node --test tests/03/atlas-events.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
const KIND_ORDER = ["turnback", "cyclone", "headwind", "piracy", "cargo", "mutiny"];

function scripts(html) {
  const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const adapter = html.match(/<script id="atlas-adapter">([\s\S]*?)<\/script>/);
  if (engine.length !== 1 || !adapter) throw new Error("expected one engine <script> and the atlas-adapter script");
  return { engine: engine[0], adapter: adapter[1] };
}

// Draw sites in sailTo, identified by their code. A draw from an unknown line in sailTo
// fails the check, so an engine change cannot silently escape it.
const SITES = [
  [/\(20 \+ Math\.random\(\) \* 14\)/, "headwind-damage"],
  [/^\s*if \(Math\.random\(\) < 0\.35\) \{/, "turnback"],
  [/state\.cargo\.teak > 0 && Math\.random\(\) < 0\.4/, "jettison"],
  [/const roll = Math\.random\(\)/, "deadzone-roll"],
  [/\(22 \+ Math\.random\(\) \* 16\)/, "cyclone-damage"],
  [/calc\.isDeadZone && Math\.random\(\) < 0\.35/, "mildew"],
  [/Math\.random\(\) < pirateProb/, "piracy"],
  [/Math\.random\(\) < mutinyRisk/, "mutiny"],
];

// Minimal DOM for the engine and the adapter. It accepts every call; elements are kept by id.
function makeDom() {
  const byId = new Map();
  class El {
    constructor(id = "") { this._id = ""; this.id = id; this.className = ""; this.innerHTML = ""; this.textContent = ""; this.value = ""; this.style = { setProperty() {} }; this.dataset = {}; this.attributes = {}; this.disabled = false; this.hidden = false; this.listeners = {}; this.tabIndex = 0; this.open = false; this.href = ""; this.htmlFor = ""; }
    set id(v) { this._id = v; if (v) byId.set(v, this); } get id() { return this._id; }
    get classList() { const e = this; return { add(...v) { e.className = [...new Set([...e.className.split(" "), ...v])].join(" "); }, remove(...v) { e.className = e.className.split(" ").filter(x => !v.includes(x)).join(" "); }, contains(v) { return e.className.split(" ").includes(v); }, toggle(v, f) { const on = f ?? !this.contains(v); on ? this.add(v) : this.remove(v); return on; } }; }
    get parentElement() { return this._p ??= new El(); } get firstElementChild() { return this._f ??= new El(); } get lastElementChild() { return this._l ??= new El(); }
    querySelector(s) { this._q ??= new Map(); if (!this._q.has(s)) this._q.set(s, new El()); return this._q.get(s); }
    querySelectorAll() { return []; } closest() { return this.parentElement; } matches() { return false; }
    setAttribute(k, v) { this.attributes[k] = String(v); } getAttribute(k) { return this.attributes[k] ?? null; } removeAttribute(k) { delete this.attributes[k]; }
    append() {} prepend() {} after() {} before() {} remove() {} replaceWith() {} insertAdjacentHTML() {} appendChild() {}
    addEventListener(t, f) { this.listeners[t] = f; } focus() {} scrollIntoView() {} showModal() {} close() {}
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  }
  const get = id => byId.get(id) ?? new El(id);
  const document = { getElementById: get, querySelector: s => get(s), querySelectorAll: () => [], createElement: () => new El(), createElementNS: () => new El(), addEventListener() {}, body: new El("body"), activeElement: new El(), hidden: false };
  return { document, get };
}

// One seeded campaign. Returns the per-voyage comparison of expected and shown cards.
export function playCampaign(page, seed, { vessel = "dhow", difficulty = "normal", mode = "play", voyages = 30 } = {}) {
  const { engine, adapter } = scripts(page);
  const engineLines = engine.split("\n");
  const { document, get } = makeDom();
  let s = seed >>> 0; const bit = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; };
  const draws = [];
  const ctx = vm.createContext({ document, console, matchMedia: () => ({ matches: false }), location: { reload() {}, pathname: "/" }, print() {}, setTimeout: () => 0, clearTimeout() {} });
  ctx.window = ctx;
  vm.runInContext(engine, ctx, { filename: "engine.js" });
  ctx.__next = () => (bit() ? 0 : 0.999);
  ctx.__record = (stack, value, crew) => { const m = stack.match(/at (?:Object\.)?(\w+) \(engine\.js:(\d+):/); draws.push({ fn: m?.[1], line: m ? engineLines[Number(m[2]) - 1] : "", value, crew }); };
  vm.runInContext(`Math.random=function(){const v=__next();__record(new Error().stack,v,state.crewHealth);return v;};globalThis.__api={get state(){return state},PORTS,SEA_LANES};`, ctx, { filename: "harness.js" });
  vm.runInContext(adapter, ctx, { filename: "adapter.js" });
  const api = ctx.__api, g = ctx;
  if (mode === "student") { g.selectGameMode?.("student"); get("input-name").value = "Fictional Student"; get("input-id").value = "TEST-001"; get("input-hypothesis").value = "My dhow will carry pepper with favorable monsoon winds."; get("input-target-profit").value = "1200"; }
  get("input-start-port").value = "calicut";
  g.selectVessel(vessel); g.selectDifficulty(difficulty); g.startSimulation();
  const card = get("atlas-event"); const shownKinds = new Set(); const rows = [];
  // Repaints that are not voyages (game start, purchases) draw no hazard and must show no card.
  const nonVoyage = label => { rows.push({ voyage: label, lane: "-", drawn: [], expected: null, shown: card.hidden ? null : card.dataset.kind ?? null }); card.hidden = true; delete card.dataset.kind; };
  nonVoyage("start");
  for (let v = 0; v < voyages && !api.state.ended; v++) {
    const goods = ["teak", "porcelain", "textiles", "pepper", "cloves", "ivory"];
    g.buyCargoQty(goods[v % goods.length], 99); if (v % 4 === 1) g.buyCargoQty("teak", 99);
    nonVoyage(`buy before voyage ${v}`);
    const lanes = api.SEA_LANES.filter(l => l.from === api.state.currentPort);
    const lane = lanes[(seed + v) % lanes.length];
    const calc = g.computeTransit(lane);
    const porcelainBefore = api.state.cargo.porcelain;
    card.hidden = true; delete card.dataset.kind;             // the reader dismissed the last card
    const from = draws.length;
    g.sailTo(lane.to);
    const voyageDraws = draws.slice(from).filter(d => d.fn === "sailTo");
    const drawn = new Set();
    for (const d of voyageDraws) {
      const site = SITES.find(([re]) => re.test(d.line))?.[1];
      if (!site) throw new Error(`unknown draw site in sailTo: ${d.line.trim()}`);
      const fires = d.value === 0;
      if (site === "headwind-damage") drawn.add("headwind");
      if (site === "turnback" && fires) drawn.add("turnback");
      if ((site === "jettison" || site === "mildew") && fires) drawn.add("cargo");
      if (site === "deadzone-roll" && d.value < calc.stormProbability) drawn.add("cyclone");
      if (site === "piracy" && fires && api.PORTS[lane.to].piracyRisk > 0) drawn.add("piracy");
      if (site === "mutiny" && d.value < g.getMutinyRisk(d.crew)) drawn.add("mutiny");
    }
    if (api.state.cargo.porcelain < porcelainBefore) drawn.add("cargo");   // shatter: no draw, a state change
    const top = KIND_ORDER.find(k => drawn.has(k));
    const expected = top && !shownKinds.has(top) && !api.state.ended ? top : null;
    if (expected) shownKinds.add(expected);
    const shown = card.hidden ? null : card.dataset.kind ?? null;
    rows.push({ voyage: v, lane: `${lane.from}>${lane.to}`, drawn: [...drawn], expected, shown });
    card.hidden = true; delete card.dataset.kind;             // the reader dismisses the card
  }
  return rows;
}

export function mismatches(rows) { return rows.filter(r => r.expected !== r.shown); }

const RUNS = [];
for (const seed of [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]) for (const [vessel, difficulty] of [["dhow", "normal"], ["junk", "hard"], ["dhow", "survival"]]) RUNS.push({ seed, vessel, difficulty });

test("every Atlas event card matches an event the engine drew, and every drawn event without a card is skipped by the stated rule", () => {
  const seen = new Set(); let voyages = 0;
  for (const run of RUNS) {
    const rows = playCampaign(PAGE, run.seed, run);
    voyages += rows.length; rows.forEach(r => r.drawn.forEach(k => seen.add(k)));
    assert.deepEqual(mismatches(rows), [], `seed ${run.seed} ${run.vessel}/${run.difficulty}`);
  }
  // The runs must actually exercise every kind, or the check proves little.
  assert.deepEqual([...seen].sort(), [...KIND_ORDER].sort(), `kinds drawn across ${voyages} voyages`);
});

test("the check fails when the log wording changes or the adapter's rule changes", () => {
  const plants = [
    ["adapter reads every log line", PAGE.replace("if(!entry.includes(' | Events: '))continue;", "")],
    ["headwind wording", PAGE.replace("Fought severe monsoon headwinds", "Fought strong monsoon headwinds")],
    ["piracy wording", PAGE.replace(/Corsairs raided/, "Pirates raided").replace(/pirate tribute/, "pirate toll")],
    ["cyclone wording", PAGE.replace("Struck by inter-monsoon cyclone", "Struck by inter-monsoon storm")],
    ["adapter priority", PAGE.replace("['turnback',/TURNED BACK|forced vessel back/i,'The crossing was interrupted'],", "").replace("['mutiny',/mutiny settled/i,'A settlement with the crew']", "['mutiny',/mutiny settled/i,'A settlement with the crew'],['turnback',/TURNED BACK|forced vessel back/i,'The crossing was interrupted']")],
  ];
  for (const [name, page] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = RUNS.slice(0, 12).some(run => mismatches(playCampaign(page, run.seed, run)).length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
