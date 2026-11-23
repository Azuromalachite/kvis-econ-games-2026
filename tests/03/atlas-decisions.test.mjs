// The route sailing calendar, the sail-now-or-wait card and the explanation after each voyage in the Atlas adapter.
//
// Like atlas-hazards.test.mjs, this runs the real engine and the real adapter in a Node vm with a minimal DOM.
// Expected values are computed here, independently of the adapter's code, from the engine's own functions
// (computeTransit, getWindState) and from constants read out of the engine's source (the turn-back chance,
// wages and port fees), so a changed adapter or a changed engine both fail:
//   - every calendar line's months and days per wind relation equal computeTransit for that month;
//   - every number on the card (departure, wait, wages, port fees and their sum as shown, days, months, wind,
//     expected arrival) and its choice of "best month" (earliest expected arrival, earlier on a tie) and of the
//     second column equal an independent computation;
//   - painting the card and the calendar draws no random number and changes no state;
//   - after each voyage of seeded campaigns, the explanation states facts that match the engine's draws (turned
//     back or not, storm or not, headwind or transition), names the season of the departure month, compares with
//     the year's fastest crossing and best month correctly, and never calls a choice wrong.
//   - each check fails on a planted defect.
//
// Run: node --test tests/03/atlas-decisions.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function scripts(html) {
  const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const adapter = html.match(/<script id="atlas-adapter">([\s\S]*?)<\/script>/);
  if (engine.length !== 1 || !adapter) throw new Error("expected one engine <script> and the atlas-adapter script");
  return { engine: engine[0], adapter: adapter[1] };
}

// The engine's constants, read from its source.
function engineConstants(engine) {
  const one = (re, what) => { const m = engine.match(re); if (!m) throw new Error(`engine constant not found: ${what}`); return Number(m[1]); };
  return {
    turnBack: one(/if \(calc\.isHeadwind\) \{[\s\S]*?if \(Math\.random\(\) < ([\d.]+)\) \{\s*turnedBack = true;/, "turn-back"),
    standingStep: one(/getEffectiveLayoverFee\(currentPort, Math\.min\(100, currentStanding \+ (\d+) \* month\)\)/, "standing step while waiting"),
  };
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
    append() {} prepend() {} after() {} before() {} remove() {} replaceWith() {} insertAdjacentHTML() {} appendChild() {} dispatchEvent() {}
    addEventListener(t, f) { this.listeners[t] = f; } focus() {} scrollIntoView() {} showModal() { this.open = true; } close() { this.open = false; }
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  }
  const get = id => { if (!byId.has(id)) new El(id); return byId.get(id); };
  const document = { getElementById: get, querySelector: s => get(s), querySelectorAll: () => [], createElement: () => new El(), createElementNS: () => new El(), addEventListener() {}, body: new El("body"), activeElement: new El(), hidden: false };
  return { document, get };
}

function load(page, seed) {
  const { engine, adapter } = scripts(page);
  const engineLines = engine.split("\n");
  const { document, get } = makeDom();
  let s = seed >>> 0; const bit = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; };
  const draws = [];
  const ctx = vm.createContext({ document, console, matchMedia: () => ({ matches: false }), location: { reload() {}, pathname: "/" }, print() {}, setTimeout: () => 0, clearTimeout() {}, Event: class { constructor(t) { this.type = t; } } });
  ctx.window = ctx;
  vm.runInContext(engine, ctx, { filename: "engine.js" });
  ctx.__next = () => (bit() ? 0 : 0.999);
  ctx.__record = (stack, value) => { const m = stack.match(/at (?:Object\.)?(\w+) \(engine\.js:(\d+):/); draws.push({ fn: m?.[1], line: m ? engineLines[Number(m[2]) - 1] : "", value }); };
  vm.runInContext(`Math.random=function(){const v=__next();__record(new Error().stack,v);return v;};globalThis.__api={get state(){return state},PORTS,SEA_LANES,MONTHS,VESSELS,DIFFICULTIES,CAMPAIGN_MONTHS};`, ctx, { filename: "harness.js" });
  vm.runInContext(adapter, ctx, { filename: "adapter.js" });
  return { g: ctx, api: ctx.__api, get, draws, K: engineConstants(engine) };
}

// Independent computations from the engine's functions and constants.
const relation = c => (c.isHeadwind ? "headwind" : c.isTailwind ? "tailwind" : c.isDeadZone ? "transition" : "crosswind");
function model({ g, api, K }) {
  const expected = (lane, m, depth = 0) => { const c = g.computeTransit(lane, m); if (!c.isHeadwind || depth > 12) return c.months; return c.months + K.turnBack * expected(lane, m + c.months, depth + 1); };
  const fee = (port, standing) => Math.round(api.PORTS[port].layoverBase * api.DIFFICULTIES[api.state.diffKey].layoverMult * (standing >= 50 ? 0.5 : standing >= 20 ? 0.75 : 1));
  const waiting = n => { const st = api.state, s0 = st.diaspora[st.currentPort] || 0; let fees = 0; for (let k = 0; k < n; k++) fees += fee(st.currentPort, Math.min(100, s0 + K.standingStep * k)); return { wages: n * api.VESSELS[st.vesselKey].upkeep, fees }; };
  const plan = (lane, from) => {
    const options = [];
    for (let w = from; w <= Math.min(from + 11, api.CAMPAIGN_MONTHS - 1); w++) { const c = g.computeTransit(lane, w); options.push({ w, c, arrival: w + expected(lane, w) }); }
    let best = options[0], fastest = options[0];
    for (const o of options) { if (o.arrival < best.arrival - 1e-9) best = o; if (o.c.days < fastest.c.days) fastest = o; }
    return { options, now: options[0], best, fastest };
  };
  return { expected, waiting, plan };
}

const attrs = html => Object.fromEntries([...html.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const expandRanges = text => { const out = []; for (const part of text.split(/, | and /)) { const [a, b] = part.split("–").map(x => MONTH_NAMES.indexOf(x)); if (a < 0) return null; for (let m = a; ; m = (m + 1) % 12) { out.push(m); if (m === (b ?? a)) break; } } return out.sort((x, y) => x - y); };

// 1 and 2: calendar and card in many game states; 3: purity while painting them.
export function cardRun(page) {
  const env = load(page, 5), { g, api, get, draws } = env, M = model(env), problems = [];
  get("input-start-port").value = "calicut";
  g.selectVessel("dhow"); g.selectDifficulty("normal"); g.startSimulation();
  let cards = 0, lines = 0;
  const WORD = { tailwind: "fast", crosswind: "steady", headwind: "slow", transition: "transition" };
  for (const vessel of ["dhow", "junk"]) for (const navigator of [false, true]) for (const diff of ["normal", "survival"]) for (const port of Object.keys(api.PORTS)) for (const month of [0, 3, 5, 9, 10, 14, 20, 23]) {
    const st = api.state;
    Object.assign(st, { vesselKey: vessel, diffKey: diff, currentPort: port, monthIndex: month, ended: false });
    st.specialists.navigator = navigator; st.diaspora[port] = month % 3 === 0 ? 10 : 35;
    for (const lane of api.SEA_LANES.filter(l => l.from === port)) {
      st.windRouteTo = lane.to;
      const before = JSON.stringify({ ...st, visitedPorts: [...st.visitedPorts] }), drawsBefore = draws.length;
      g.renderAll();
      if (draws.length !== drawsBefore || JSON.stringify({ ...st, visitedPorts: [...st.visitedPorts] }) !== before) problems.push({ kind: "purity", port, month, to: lane.to, draws: draws.length - drawsBefore });
      // Calendar line for this lane.
      const cal = get("atlas-route-calendar").innerHTML.match(new RegExp(`<li data-to="${lane.to}">([^<]*)</li>`))?.[1] ?? "";
      const body = cal.replace(/^[^:]*: /, "").replace(/\.$/, "");
      for (const kind of Object.keys(WORD)) {
        const want = [...Array(12).keys()].filter(m => relation(g.computeTransit(lane, m)) === kind);
        const seg = body.split("; ").find(x => x.startsWith(`${WORD[kind]} `));
        if (!want.length) { if (seg) problems.push({ kind: "calendar-extra", port, to: lane.to, seg }); continue; }
        const m = seg?.match(/^\w+ (.+?) \((?:[\w ]+, )?~(\d+)(?:–(\d+))? d\)$/);
        const days = want.map(k => g.computeTransit(lane, k).days), lo = Math.min(...days), hi = Math.max(...days);
        if (!m || JSON.stringify(expandRanges(m[1])) !== JSON.stringify(want) || +m[2] !== lo || +(m[3] ?? m[2]) !== hi) problems.push({ kind: "calendar", vessel, navigator, port, to: lane.to, relation: kind, got: seg, want: { months: want.map(k => MONTH_NAMES[k]), lo, hi } });
      }
      lines++;
      // Card.
      const card = get("atlas-decision"), html = card.innerHTML;
      const p = M.plan(lane, month), other = p.best.w !== p.now.w ? p.best : p.fastest.w !== p.now.w ? p.fastest : null;
      const cols = [...html.matchAll(/<div class="atlas-decision-option" ([^>]*)>([\s\S]*?)<\/dl><\/div>/g)];
      if (card.dataset.best !== String(p.best.w)) problems.push({ kind: "best", vessel, port, month, to: lane.to, got: card.dataset.best, want: p.best.w });
      if (cols.length !== (other ? 2 : 1)) { problems.push({ kind: "columns", port, month, to: lane.to, got: cols.length }); continue; }
      [p.now, other].filter(Boolean).forEach((o, k) => {
        const a = attrs(cols[k][1]), w = M.waiting(o.w - month), text = cols[k][2];
        const want = { depart: o.w, wait: o.w - month, days: o.c.days, months: o.c.months, wind: relation(o.c), wages: w.wages, fees: w.fees };
        const got = { depart: +a.depart, wait: +a.wait, days: +a.days, months: +a.months, wind: a.wind, wages: +a.wages, fees: +a.fees };
        if (JSON.stringify(got) !== JSON.stringify(want) || Math.abs(+a.arrival - o.arrival) > 1e-9) problems.push({ kind: "card", column: k, port, month, to: lane.to, got: { ...got, arrival: +a.arrival }, want: { ...want, arrival: o.arrival } });
        if (want.wait && !text.includes(`<dd>${w.wages + w.fees} D (wages ${w.wages} D + port fees ${w.fees} D)</dd>`)) problems.push({ kind: "wait-cost-text", port, month, to: lane.to, want: w });
        if (!text.includes(`<dd>month ${Math.round((o.arrival + 1) * 10) / 10} of ${api.CAMPAIGN_MONTHS}`)) problems.push({ kind: "arrival-text", port, month, to: lane.to, want: o.arrival });
        if (o.c.isHeadwind !== text.includes("<dt>Turn-back chance</dt><dd>35%")) problems.push({ kind: "turnback-row", port, month, to: lane.to });
      });
      const verdict = html.match(/<p class="atlas-decision-verdict" data-verdict>([^<]*)<\/p>/)?.[1] ?? "";
      const wantStart = !other ? "Sailing now is both" : other.arrival < p.now.arrival - 1e-9 ? `In expectation, waiting until ${MONTH_NAMES[other.w % 12]} arrives` : "In expectation, sailing now arrives";
      if (!verdict.startsWith(wantStart)) problems.push({ kind: "verdict", port, month, to: lane.to, verdict, wantStart });
      cards++;
    }
  }
  return { problems, cards, lines };
}

// 4: the explanation after each voyage of seeded campaigns, against the engine's tagged draws.
export function explainRun(page, seed, { vessel = "dhow", difficulty = "normal", voyages = 30 } = {}) {
  const env = load(page, seed), { g, api, get, draws } = env, M = model(env), problems = [];
  get("input-start-port").value = "aden";
  g.selectVessel(vessel); g.selectDifficulty(difficulty); g.startSimulation();
  const counts = { voyages: 0, turnback: 0, storm: 0, headwind: 0 };
  for (let v = 0; v < voyages && !api.state.ended; v++) {
    const from = api.state.currentPort, departed = api.state.monthIndex;
    const lanes = api.SEA_LANES.filter(l => l.from === from), lane = lanes[(seed * 3 + v) % lanes.length];
    const calc = g.computeTransit(lane), p = M.plan(lane, departed), first = draws.length;
    g.sailTo(lane.to);
    if (api.state.ended) break;
    counts.voyages++;
    const turnedBack = api.state.currentPort === from;
    let storm = false;
    for (const d of draws.slice(first).filter(d => d.fn === "sailTo")) {
      const site = SITES.find(([re]) => re.test(d.line))?.[1];
      if (!site) throw new Error(`unknown draw site: ${d.line.trim()}`);
      if (site === "deadzone-roll" && d.value < calc.stormProbability) storm = true;
    }
    if (turnedBack) counts.turnback++; if (storm) counts.storm++; if (calc.isHeadwind) counts.headwind++;
    const text = get("atlas-voyage-why").textContent, bad = [];
    const season = api.MONTHS && (g.getWindState(departed).isDeadZone ? "the transition between monsoons" : g.getWindState(departed).regime.startsWith("SW") ? "the southwest monsoon" : "the northeast monsoon");
    if (get("atlas-voyage-why").hidden) bad.push("hidden");
    if (!text.startsWith(turnedBack ? "You set out " : "You sailed ")) bad.push("opening");
    if (!text.includes(`from ${api.PORTS[from].name} in ${MONTH_NAMES[departed % 12]}, in ${season}`)) bad.push("season");
    if (!turnedBack && !text.includes(`${calc.days} days at sea`)) bad.push("days");
    if (p.fastest.w === departed ? !text.includes("fastest crossing of the year") : !text.includes(`takes ${p.fastest.c.days} days, but waiting for it would have delayed departure by ${p.fastest.w - departed} month`)) bad.push("fastest");
    if (p.best.w === departed ? !text.includes("earliest expected arrival") : !text.includes(`leaving in ${MONTH_NAMES[p.best.w % 12]} would have arrived`)) bad.push("best");
    const hasLuck = /Predictable: .* Luck: /.test(text);
    if (hasLuck !== (calc.isHeadwind || calc.isDeadZone)) bad.push("predictable-vs-luck");
    if (calc.isHeadwind && !text.includes(turnedBack ? "the turn-back draw went against you" : "the turn-back draw went your way")) bad.push("turnback-fact");
    if (calc.isDeadZone && !(storm ? / came \(hull −\d+%\)/.test(text) : /no (cyclone|typhoon) came/.test(text))) bad.push("storm-fact");
    // Never call a choice wrong, least of all for a draw.
    if (/\bwrong\b|\bmistake\b|bad (decision|choice)|should have|poor choice/i.test(text)) bad.push("blames-the-choice");
    if (bad.length) problems.push({ voyage: v, lane: `${from}>${lane.to}`, departed, turnedBack, storm, bad, text });
  }
  return { problems, counts };
}

const RUNS = [];
for (const seed of [1, 2, 3, 5, 8, 13]) for (const [vessel, difficulty] of [["dhow", "normal"], ["junk", "survival"]]) RUNS.push({ seed, vessel, difficulty });

test("the calendar and the sail-or-wait card equal an independent computation, and painting them draws nothing and changes nothing", () => {
  const { problems, cards, lines } = cardRun(PAGE);
  assert.deepEqual(problems.slice(0, 5), []);
  assert.ok(cards >= 600 && lines >= 600, `${cards} cards, ${lines} calendar lines`);
});

test("the explanation after each voyage matches the engine's draws and never calls a choice wrong", () => {
  const totals = { voyages: 0, turnback: 0, storm: 0, headwind: 0 };
  for (const run of RUNS) {
    const { problems, counts } = explainRun(PAGE, run.seed, run);
    for (const k of Object.keys(totals)) totals[k] += counts[k];
    assert.deepEqual(problems.slice(0, 3), [], `seed ${run.seed} ${run.vessel}/${run.difficulty}`);
  }
  for (const k of ["turnback", "storm", "headwind"]) assert.ok(totals[k] >= 5, `${k} occurred ${totals[k]} times in ${totals.voyages} voyages`);
});

test("the checks fail on planted defects", () => {
  const plants = [
    ["best month off by one", PAGE.replace("return {lane,options,now:options[0],best,fastest};", "return {lane,options,now:options[0],best:options[Math.min(options.indexOf(best)+1,options.length-1)],fastest};"), "card"],
    ["wait cost leaves out port fees", PAGE.replace("<dd>${cost.crewWages+cost.portFees} D (wages", "<dd>${cost.crewWages} D (wages"), "card"],
    ["card consumes a draw", PAGE.replace("const paintDecision=()=>{", "const paintDecision=()=>{Math.random();"), "card"],
    ["calendar one month late", PAGE.replace("const months=MONTHS.map((_,m)=>{const c=computeTransit(lane,m);", "const months=MONTHS.map((_,m)=>{const c=computeTransit(lane,m+1);"), "card"],
    ["explanation blames bad luck on the choice", PAGE.replace("luck.push(v.turnedBack?`the turn-back draw went against you`", "luck.push(v.turnedBack?`the turn-back draw went against you, because sailing into a headwind was the wrong decision`"), "explain"],
    ["explanation calls a storm the result of the choice", PAGE.replace("luck.push(v.storm?`the ${stormName(v.from,v.to)} came", "luck.push(v.storm?`a bad decision: the ${stormName(v.from,v.to)} came"), "explain"],
    ["explanation reads the season one month late", PAGE.replace("in ${seasonWord(v.departed)}: ${word.toLowerCase()}", "in ${seasonWord(v.departed+1)}: ${word.toLowerCase()}"), "explain"],
  ];
  for (const [name, page, which] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = which === "card" ? cardRun(page).problems.length > 0 : RUNS.some(run => explainRun(page, run.seed, run).problems.length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
