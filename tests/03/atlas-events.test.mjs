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
// been shown yet; otherwise none. Each card shown must also carry the title the adapter's
// kind table gives that kind, and the voyage part of that voyage's log entry as its message.
//
// Known blind spot: jettisoning teak happens only on a headwind voyage, and headwind
// outranks cargo, so a change to the jettison wording never changes which card is shown.
// That is harmless, and the check cannot detect it. Porcelain breakage on a dead-zone
// voyage with no other hazard is the one path where cargo is the top kind without mildew;
// a scripted plan (hull already below 70 %, every hazard draw failing) exercises it.
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
// The title each kind's card must show. Fixed here, not read from the page, so a wrong
// title on the page fails the check; change it here only with the adapter's table.
const TITLE = { turnback: "The crossing was interrupted", cyclone: "A cyclone on the crossing", headwind: "Against the monsoon", piracy: "A costly encounter", cargo: "Cargo lost at sea", mutiny: "A settlement with the crew" };

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
export function playCampaign(page, seed, { vessel = "dhow", difficulty = "normal", mode = "play", voyages = 30, plan = null } = {}) {
  const { engine, adapter } = scripts(page);
  const TITLES = Object.fromEntries([...adapter.matchAll(/\['(\w+)',\/(?:[^\/\\]|\\.)*\/i,'([^']*)'\]/g)].map(m => [m[1], m[2]]));
  if (Object.keys(TITLES).length !== KIND_ORDER.length) throw new Error(`adapter kind table not found (${Object.keys(TITLES)})`);
  const engineLines = engine.split("\n");
  const { document, get } = makeDom();
  let s = seed >>> 0; const bit = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; };
  const draws = [];
  const ctx = vm.createContext({ document, console, matchMedia: () => ({ matches: false }), location: { reload() {}, pathname: "/" }, print() {}, setTimeout: () => 0, clearTimeout() {} });
  ctx.window = ctx;
  vm.runInContext(engine, ctx, { filename: "engine.js" });
  ctx.__next = plan === "shatter" ? () => 0.999 : () => (bit() ? 0 : 0.999);
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
  if (plan === "shatter") {
    // Porcelain aboard, hull already below 70 %, then wait for a dead-zone crossing.
    voyages = 1; g.buyCargoQty("porcelain", 99); api.state.hull = 60; nonVoyage("shatter setup");
    for (let w = 0; w < 12 && !api.SEA_LANES.some(l => l.from === api.state.currentPort && g.computeTransit(l).isDeadZone); w++) { g.waitInPort(); nonVoyage(`wait ${w}`); }
  }
  for (let v = 0; v < voyages && !api.state.ended; v++) {
    if (!plan) {
      const goods = ["teak", "porcelain", "textiles", "pepper", "cloves", "ivory"];
      g.buyCargoQty(goods[v % goods.length], 99); if (v % 4 === 1) g.buyCargoQty("teak", 99);
      nonVoyage(`buy before voyage ${v}`);
    }
    const lanes = api.SEA_LANES.filter(l => l.from === api.state.currentPort && (plan !== "shatter" || g.computeTransit(l).isDeadZone));
    if (!lanes.length) throw new Error("no dead-zone lane for the shatter plan");
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
    const row = { voyage: v, lane: `${lane.from}>${lane.to}`, drawn: [...drawn], expected, shown };
    if (shown) {
      const entry = api.state.logs.find(e => e.includes(" | Events: ")) ?? "";
      row.title = get("atlas-event-title").textContent; row.titleOk = row.title === TITLE[shown];
      row.message = get("atlas-event-message").textContent; row.messageOk = row.message !== "" && row.message === entry.split(" | Events: ")[0];
    }
    rows.push(row);
    card.hidden = true; delete card.dataset.kind;             // the reader dismisses the card
  }
  return rows;
}

export function mismatches(rows) { return rows.filter(r => r.expected !== r.shown || (r.shown && !(r.titleOk && r.messageOk))); }

const RUNS = [];
for (const seed of [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]) for (const [vessel, difficulty] of [["dhow", "normal"], ["junk", "hard"], ["dhow", "survival"]]) RUNS.push({ seed, vessel, difficulty });
// Scripted shatter-only cargo voyages (see the header).
const PLANS = [["dhow", "normal"], ["junk", "normal"], ["dhow", "hard"], ["junk", "hard"]].map(([vessel, difficulty], i) => ({ seed: i, vessel, difficulty, plan: "shatter" }));
const MIN_EXPECTED_CARDS = 3;

test("every Atlas event card matches an event the engine drew, and every drawn event without a card is skipped by the stated rule", () => {
  const expectedCards = Object.fromEntries(KIND_ORDER.map(k => [k, 0])); let voyages = 0, shatterCards = 0;
  for (const run of [...RUNS, ...PLANS]) {
    const rows = playCampaign(PAGE, run.seed, run);
    voyages += rows.filter(r => typeof r.voyage === "number").length;
    rows.forEach(r => { if (r.expected) expectedCards[r.expected]++; });
    if (run.plan === "shatter" && rows.some(r => r.expected === "cargo" && r.shown === "cargo")) shatterCards++;
    assert.deepEqual(mismatches(rows), [], `seed ${run.seed} ${run.vessel}/${run.difficulty}${run.plan ? " " + run.plan : ""}`);
  }
  // Every kind must be expected as a card several times, or the check proves little.
  for (const k of KIND_ORDER) assert.ok(expectedCards[k] >= MIN_EXPECTED_CARDS, `${k} expected as a card ${expectedCards[k]} times across ${voyages} voyages`);
  assert.equal(shatterCards, PLANS.length, "every shatter plan shows a cargo card");
});

test("the check fails when the log wording changes or the adapter's rule changes", () => {
  const plants = [
    ["adapter reads every log line", PAGE.replace("if(!entry.includes(' | Events: '))continue;", "")],
    ["shatter wording", PAGE.replace("Rough seas shattered", "Rough seas broke")],
    ["wrong card title", PAGE.replace("'A cyclone on the crossing'", "'Against the monsoon'")],
    ["blank card message", PAGE.replace("$('atlas-event-message').textContent=voyage;", "$('atlas-event-message').textContent='';")],
    ["headwind wording", PAGE.replace("Fought severe monsoon headwinds", "Fought strong monsoon headwinds")],
    ["piracy wording", PAGE.replace(/Corsairs raided/, "Pirates raided").replace(/pirate tribute/, "pirate toll")],
    ["cyclone wording", PAGE.replace("Struck by inter-monsoon cyclone", "Struck by inter-monsoon storm")],
    ["adapter priority", PAGE.replace("['turnback',/TURNED BACK|forced vessel back/i,'The crossing was interrupted'],", "").replace("['mutiny',/mutiny settled/i,'A settlement with the crew']", "['mutiny',/mutiny settled/i,'A settlement with the crew'],['turnback',/TURNED BACK|forced vessel back/i,'The crossing was interrupted']")],
  ];
  for (const [name, page] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = [...RUNS.slice(0, 12), ...PLANS].some(run => mismatches(playCampaign(page, run.seed, run)).length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
