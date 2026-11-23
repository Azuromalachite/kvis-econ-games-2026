// Storm and pirate markers, the crew-health alert and the port timing view in the Atlas adapter.
//
// Like atlas-events.test.mjs, this runs the real engine and the real adapter in a Node vm with a
// minimal DOM, and takes ground truth from the engine's own random draws: every Math.random() call is
// tagged with the engine source line that made it, and draws are forced to 0 or 0.999, so each hazard
// check's outcome is known by construction. Nothing is read from the log text.
//
//   - A storm marker appears after a voyage iff the engine's transition-month roll fell below that
//     leg's stormProbability; a pirate marker iff the engine's piracy check fired.
//   - The crew alert shows iff getMutinyRisk(current health) > 0.
//   - Every number in the port timing view equals the engine's: computeTransit for each month, the
//     turn-back and piracy constants read from the engine's own source, and the expected time
//     including turn-back retries computed from those.
//   - Opening the port view draws no random number and changes no state.
//   - Each check fails on a planted defect.
//
// Run: node --test tests/03/atlas-hazards.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");

function scripts(html) {
  const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const adapter = html.match(/<script id="atlas-adapter">([\s\S]*?)<\/script>/);
  if (engine.length !== 1 || !adapter) throw new Error("expected one engine <script> and the atlas-adapter script");
  return { engine: engine[0], adapter: adapter[1] };
}

// The engine's own constants, read from its source, so a changed engine or a changed adapter both fail.
function engineConstants(engine) {
  const num = (re, what) => { const m = engine.match(re); if (!m) throw new Error(`engine constant not found: ${what}`); return m.slice(1).map(Number); };
  const [turnBack] = num(/if \(calc\.isHeadwind\) \{[\s\S]*?if \(Math\.random\(\) < ([\d.]+)\) \{\s*turnedBack = true;/, "turn-back");
  const [valuable, plain, survival] = num(/destPort\.piracyRisk \* \(hasHighValue \? ([\d.]+) : ([\d.]+)\) \* \(state\.diffKey === "survival" \? ([\d.]+) : 1\.0\)/, "piracy factors");
  const [marines] = num(/if \(state\.specialists\.marines\) pirateProb \*= ([\d.]+);/, "marines");
  const [standingAt, standingFactor] = num(/if \(destStanding >= (\d+)\) pirateProb \*= ([\d.]+);/, "standing");
  return { turnBack, valuable, plain, survival, marines, standingAt, standingFactor };
}

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

function makeDom() {
  const byId = new Map();
  class El {
    constructor(id = "") { this._id = ""; this.id = id; this.className = ""; this.innerHTML = ""; this.textContent = ""; this.value = ""; this.style = { setProperty() {} }; this.dataset = {}; this.attributes = {}; this.disabled = false; this.hidden = false; this.listeners = {}; this.tabIndex = 0; this.open = false; this.href = ""; this.htmlFor = ""; }
    set id(v) { this._id = v; if (v) byId.set(v, this); } get id() { return this._id; }
    get classList() { const e = this; return { add(...v) { e.className = [...new Set([...e.className.split(" "), ...v])].join(" "); }, remove(...v) { e.className = e.className.split(" ").filter(x => !v.includes(x)).join(" "); }, contains(v) { return e.className.split(" ").includes(v); }, toggle(v, f) { (f ?? !this.contains(v)) ? this.add(v) : this.remove(v); } }; }
    get parentElement() { return this._p ??= new El(); } get firstElementChild() { return this._f ??= new El(); } get lastElementChild() { return this._l ??= new El(); }
    get children() { return []; } get nextElementSibling() { return null; }
    querySelector(s) { this._q ??= new Map(); if (!this._q.has(s)) this._q.set(s, new El()); return this._q.get(s); }
    querySelectorAll() { return []; } closest() { return this.parentElement; } matches() { return false; }
    setAttribute(k, v) { this.attributes[k] = String(v); } getAttribute(k) { return this.attributes[k] ?? null; } removeAttribute(k) { delete this.attributes[k]; }
    append() {} prepend() {} after() {} before() {} remove() {} replaceWith() {} insertAdjacentHTML() {} appendChild() {}
    addEventListener(t, f) { this.listeners[t] = f; } focus() {} scrollIntoView() {} showModal() { this.open = true; } close() { this.open = false; }
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  }
  // Elements are kept by id, so what the adapter writes into a dialog it built stays readable.
  const get = id => { if (!byId.has(id)) new El(id); return byId.get(id); };
  const document = { getElementById: get, querySelector: s => get(s), querySelectorAll: () => [], createElement: () => new El(), createElementNS: () => new El(), addEventListener() {}, body: new El("body"), activeElement: new El(), hidden: false };
  return { document, get };
}

// Load engine and adapter; draws are forced to 0 or 0.999 by a seeded bit stream and recorded with their source line.
function load(page, seed) {
  const { engine, adapter } = scripts(page);
  const engineLines = engine.split("\n");
  const { document, get } = makeDom();
  let s = seed >>> 0; const bit = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; };
  const draws = [];
  const ctx = vm.createContext({ document, console, matchMedia: () => ({ matches: false }), location: { reload() {}, pathname: "/" }, print() {}, setTimeout: () => 0, clearTimeout() {} });
  ctx.window = ctx;
  vm.runInContext(engine, ctx, { filename: "engine.js" });
  ctx.__next = () => (bit() ? 0 : 0.999);
  ctx.__record = (stack, value) => { const m = stack.match(/at (?:Object\.)?(\w+) \(engine\.js:(\d+):/); draws.push({ fn: m?.[1], line: m ? engineLines[Number(m[2]) - 1] : "", value }); };
  vm.runInContext(`Math.random=function(){const v=__next();__record(new Error().stack,v);return v;};globalThis.__api={get state(){return state},PORTS,SEA_LANES,MONTHS};`, ctx, { filename: "harness.js" });
  vm.runInContext(adapter, ctx, { filename: "adapter.js" });
  return { g: ctx, api: ctx.__api, get, draws, engine };
}

// 1 and 2: seeded campaigns. After each voyage, the markers must match the engine's draws; after every action, the alert must match the mutiny risk.
export function hazardRun(page, seed, { vessel = "dhow", difficulty = "normal", voyages = 30 } = {}) {
  const { g, api, get, draws } = load(page, seed);
  get("input-start-port").value = "calicut";
  g.selectVessel(vessel); g.selectDifficulty(difficulty); g.startSimulation();
  const problems = [], counts = { storm: 0, pirates: 0, alert: 0, voyages: 0 };
  const alertCheck = label => {
    const shown = !get("atlas-crew-alert").hidden && get("atlas-crew-alert").textContent !== "";
    const want = g.getMutinyRisk(api.state.crewHealth) > 0 && !api.state.ended;
    if (shown) counts.alert++;
    if (shown !== want) problems.push({ kind: "alert", label, health: api.state.crewHealth, shown, want });
  };
  const goods = ["cloves", "teak", "ivory", "textiles", "pepper", "porcelain"];
  for (let v = 0; v < voyages && !api.state.ended; v++) {
    g.buyCargoQty(goods[(seed + v) % goods.length], 99);
    alertCheck(`buy ${v}`);
    const lanes = api.SEA_LANES.filter(l => l.from === api.state.currentPort);
    const lane = lanes[(seed * 7 + v) % lanes.length];
    const calc = g.computeTransit(lane);
    const from = draws.length;
    g.sailTo(lane.to);
    counts.voyages++;
    let storm = false, pirates = false;
    for (const d of draws.slice(from).filter(d => d.fn === "sailTo")) {
      const site = SITES.find(([re]) => re.test(d.line))?.[1];
      if (!site) throw new Error(`unknown draw site in sailTo: ${d.line.trim()}`);
      if (site === "deadzone-roll" && d.value < calc.stormProbability) storm = true;
      if (site === "piracy" && d.value === 0) pirates = true;
    }
    const layer = get("atlas-hazards").innerHTML;
    const shownStorm = /data-kind="storm"/.test(layer), shownPirates = /data-kind="pirates"/.test(layer);
    if (storm) counts.storm++; if (pirates) counts.pirates++;
    if (shownStorm !== storm || shownPirates !== pirates) problems.push({ kind: "marker", voyage: v, lane: `${lane.from}>${lane.to}`, storm, pirates, shownStorm, shownPirates });
    const note = get("atlas-voyage-note");
    if ((storm || pirates) !== (!note.hidden && note.textContent !== "")) problems.push({ kind: "note", voyage: v, storm, pirates, note: note.textContent });
    alertCheck(`voyage ${v}`);
  }
  // The full range of health, set directly.
  if (!api.state.ended) for (let h = 0; h <= 100; h += 1) { api.state.crewHealth = h; g.renderAll(); alertCheck(`health ${h}`); }
  return { problems, counts };
}

// 3 and 4: the port timing view, opened through its own click handler, in several game states.
export function portViewRun(page) {
  const { g, api, get, draws, engine } = load(page, 7);
  const K = engineConstants(engine);
  get("input-start-port").value = "calicut";
  g.selectVessel("dhow"); g.selectDifficulty("survival"); g.startSimulation();
  const problems = []; let rowsChecked = 0, lanesChecked = 0;
  const expected = (lane, m, depth = 0) => { const c = g.computeTransit(lane, m); if (!c.isHeadwind || depth > 12) return c.months; return c.months + K.turnBack * expected(lane, m + c.months, depth + 1); };
  const pirate = (dest, marines) => { const st = api.state; let p = api.PORTS[dest].piracyRisk * (st.cargo.cloves > 0 || st.cargo.ivory > 0 ? K.valuable : K.plain) * (st.diffKey === "survival" ? K.survival : 1); if (marines) p *= K.marines; if ((st.diaspora[dest] || 0) >= K.standingAt) p *= K.standingFactor; return p; };
  const states = [
    { month: 0, cargo: {}, navigator: false, diff: "survival", standing: {} },
    { month: 5, cargo: { cloves: 3 }, navigator: true, diff: "normal", standing: { aden: 60 } },
    { month: 14, cargo: { ivory: 2 }, navigator: false, diff: "hard", standing: { malacca: 55 } },
    { month: 22, cargo: {}, navigator: true, diff: "survival", standing: { kilwa: 50 } },
  ];
  for (const st of states) for (const port of Object.keys(api.PORTS)) {
    const s = api.state;
    s.monthIndex = st.month; s.diffKey = st.diff; s.specialists.navigator = st.navigator;
    for (const k of Object.keys(s.cargo)) s.cargo[k] = st.cargo[k] ?? 0;
    for (const k of Object.keys(s.diaspora)) s.diaspora[k] = st.standing[k] ?? 0;
    // 4. Preview purity: the click handler must not draw randomness or change state.
    const before = JSON.stringify({ ...s, visitedPorts: [...s.visitedPorts] }), drawsBefore = draws.length;
    get("svg-ports").listeners.click({ target: { closest: () => ({ dataset: { port } }) } });
    const after = JSON.stringify({ ...s, visitedPorts: [...s.visitedPorts] });
    if (draws.length !== drawsBefore || after !== before) problems.push({ kind: "purity", port, month: st.month, draws: draws.length - drawsBefore, changed: after !== before });
    const html = get("atlas-port-body").innerHTML;
    const lanes = api.SEA_LANES.filter(l => l.from === port);
    const sections = [...html.matchAll(/<section class="atlas-port-lane" data-to="(\w+)" data-pirates="([\d.e-]+)" data-pirates-guarded="([\d.e-]+)">([\s\S]*?)<\/section>/g)];
    if (sections.length !== lanes.length) problems.push({ kind: "lanes", port, got: sections.length, want: lanes.length });
    for (const [, to, p, pg, body] of sections) {
      const lane = lanes.find(l => l.to === to); lanesChecked++;
      if (Math.abs(+p - pirate(to, false)) > 1e-12 || Math.abs(+pg - pirate(to, true)) > 1e-12) problems.push({ kind: "piracy", port, to, month: st.month, got: [+p, +pg], want: [pirate(to, false), pirate(to, true)] });
      const rows = [...body.matchAll(/<tr data-month="(\d+)" data-days="(\d+)" data-months="(\d+)" data-wind="(\w+)" data-turnback="([\d.]+)" data-storm="([\d.]+)" data-expected="([\d.]+)"([^>]*)>/g)];
      if (rows.length !== 12) problems.push({ kind: "rows", port, to, n: rows.length });
      const yearStart = st.month - st.month % 12;
      const exps = rows.map(r => +r[7]); const best = Math.min(...exps);
      for (const r of rows) {
        const m = +r[1], c = g.computeTransit(lane, yearStart + m); rowsChecked++;
        const wind = c.isHeadwind ? "headwind" : c.isTailwind ? "tailwind" : c.isDeadZone ? "transition" : "crosswind";
        const want = { days: c.days, months: c.months, wind, turnback: c.isHeadwind ? K.turnBack : 0, storm: c.isDeadZone ? c.stormProbability : 0, expected: expected(lane, yearStart + m) };
        const got = { days: +r[2], months: +r[3], wind: r[4], turnback: +r[5], storm: +r[6], expected: +r[7] };
        if (JSON.stringify(got) !== JSON.stringify({ ...want, expected: got.expected }) || Math.abs(got.expected - want.expected) > 1e-9) problems.push({ kind: "row", port, to, m, got, want });
        if (/data-now="true"/.test(r[8]) !== (m === st.month % 12)) problems.push({ kind: "now", port, to, m });
        if (/data-best="true"/.test(r[8]) !== (Math.abs(want.expected - best) < 1e-9)) problems.push({ kind: "best", port, to, m });
      }
    }
  }
  return { problems, rowsChecked, lanesChecked };
}

const RUNS = [];
for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) for (const [vessel, difficulty] of [["dhow", "normal"], ["junk", "hard"], ["dhow", "survival"]]) RUNS.push({ seed, vessel, difficulty });
const MIN = 5;

test("storm and pirate markers appear exactly when the engine drew them, and the crew alert exactly when mutiny is possible", () => {
  const totals = { storm: 0, pirates: 0, alert: 0, voyages: 0 };
  for (const run of RUNS) {
    const { problems, counts } = hazardRun(PAGE, run.seed, run);
    for (const k of Object.keys(totals)) totals[k] += counts[k];
    assert.deepEqual(problems, [], `seed ${run.seed} ${run.vessel}/${run.difficulty}`);
  }
  for (const k of ["storm", "pirates", "alert"]) assert.ok(totals[k] >= MIN, `${k} occurred ${totals[k]} times across ${totals.voyages} voyages`);
});

test("every number in the port timing view equals the engine's, and opening it draws nothing and changes nothing", () => {
  const { problems, rowsChecked, lanesChecked } = portViewRun(PAGE);
  assert.deepEqual(problems, []);
  assert.ok(rowsChecked >= 400 && lanesChecked >= 40, `${rowsChecked} rows, ${lanesChecked} lanes`);
});

test("the checks fail on planted defects", () => {
  const plants = [
    ["storm marker on a leg without a storm", PAGE.replace("storm=draws[i++]<calc.stormProbability;", "storm=draws[i++]<=1;"), "hazard"],
    ["no storm marker on a leg with one", PAGE.replace("if(v.storm){const [x,y]=pointAlong(points,0.3);", "if(false){const [x,y]=pointAlong(points,0.3);"), "hazard"],
    ["pirate marker where none happened", PAGE.replace("pirates=draws[i++]<pre.pirate;", "pirates=draws[i++]<=1;"), "hazard"],
    ["alert threshold shifted", PAGE.replace("if(!(risk>0)||state.ended)", "if(!(risk>0.05)||state.ended)"), "hazard"],
    ["guard multiplier left out of the displayed risk", PAGE.replace("if(marines)p*=0.2;", ""), "port"],
    ["port view off by one month", PAGE.replace("const c=computeTransit(lane,yearStart+m),[kind,word]=windRelation(c);", "const c=computeTransit(lane,yearStart+m+1),[kind,word]=windRelation(c);"), "port"],
    ["port view consumes a random draw", PAGE.replace("const renderPortView=id=>{", "const renderPortView=id=>{Math.random();"), "port"],
  ];
  for (const [name, page, which] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = which === "port" ? portViewRun(page).problems.length > 0 : RUNS.slice(0, 9).some(run => hazardRun(page, run.seed, run).problems.length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
