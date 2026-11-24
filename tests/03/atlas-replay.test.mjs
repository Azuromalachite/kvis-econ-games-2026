// The campaign replay on the audit page, run with the real engine and adapter in a Node vm (tests/03/atlas-harness.mjs).
//
// Seeded campaigns are played to the end with buying, selling, waiting and sailing. The test keeps its own ground truth
// from the engine while it plays: every action that moved the calendar is a step; the ship's port after a voyage says
// whether it was turned back; the voyage's own log entry (the engine's outcome) says whether a storm struck and whether
// pirates did; and the log's length before the action is the row that action wrote. Then, on the audit page:
//   - the replay has exactly one step per voyage or wait, in order, with the right kind, ports, month and turn-back;
//   - a storm or pirates show on a step exactly when the engine's outcome had them;
//   - stepping through the replay highlights the log row the step wrote;
//   - playing, stepping and restarting draw no random number and change no game state;
//   - with reduced motion, Play is disabled, no animation frame is ever requested, and each step is a still frame at its end;
//   - the replay is never printed and never in the PDF export (the seeded click campaigns also compare the print itself).
// Each check fails on a planted defect.
//
// Run: node --test tests/03/atlas-replay.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { load } from "./atlas-harness.mjs";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");

const attrs = html => Object.fromEntries([...html.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));

// A small element: text, attributes, classes and dataset, enough for what the replay sets on rows and list items.
function node(text, data = {}) {
  const cls = new Set(), at = {};
  const n = { textContent: text, dataset: { ...data }, offsetTop: 0, offsetHeight: 0, parentElement: { clientHeight: 0, scrollTop: 0 },
    classList: { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c), toggle: (c, f) => ((f ?? !cls.has(c)) ? cls.add(c) : cls.delete(c), cls.has(c)) },
    setAttribute: (k, v) => { at[k] = String(v); }, getAttribute: k => at[k] ?? null, removeAttribute: k => { delete at[k]; }, hasAttribute: k => k in at,
    toggleAttribute: (k, f) => ((f ?? !(k in at)) ? (at[k] = "") : delete at[k], k in at) };
  return n;
}
// The dated log's rows from what the engine wrote into #audit-log-table, kept while its HTML is unchanged; the panel's
// step items and log-view rows the same way; and every write to the live line counted.
export function realDom(get) {
  const table = get("audit-log-table");
  let tableHtml = null, rows = [];
  Object.defineProperty(table, "children", { get() { if (table.innerHTML !== tableHtml) { tableHtml = table.innerHTML; rows = [...tableHtml.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/g)].map(m => node(m[1])); } return rows; } });
  const panel = get("atlas-replay");
  let panelHtml = null, steps = [], logRows = [];
  const refresh = () => {
    if (panel.innerHTML === panelHtml) return; panelHtml = panel.innerHTML;
    const stepList = panelHtml.match(/<ol class="atlas-replay-steps">([\s\S]*?)<\/ol><\/details>/)?.[1] ?? "";
    steps = [...stepList.matchAll(/<li ([^>]*)>/g)].map(m => node("", attrs(m[1])));
    const logList = panelHtml.match(/<ol class="atlas-replay-loglist">([\s\S]*?)<\/ol><\/details>/)?.[1] ?? "";
    logRows = [...logList.matchAll(/<li (data-row="\d+"[^>]*)>/g)].map(m => node("", attrs(m[1])));
  };
  panel.querySelectorAll = sel => { refresh(); return sel === ".atlas-replay-steps li" ? steps : sel === ".atlas-replay-log [data-row]" ? logRows : []; };
  const line = panel.querySelector("#atlas-replay-line");
  let text = "", writes = 0;
  Object.defineProperty(line, "textContent", { get: () => text, set: v => { text = v; writes++; } });
  return { rows: () => table.children, steps: () => { refresh(); return steps; }, logRows: () => { refresh(); return logRows; }, writes: () => writes };
}

export function play(page, seed, { vessel = "dhow", difficulty = "normal", reduced = false, onPrint = null } = {}) {
  const frames = [];
  const extra = { requestAnimationFrame: f => { frames.push(f); return frames.length; }, cancelAnimationFrame() {}, matchMedia: q => ({ matches: reduced && /prefers-reduced-motion:\s*reduce/.test(q) }), print: () => onPrint?.() };
  const env = load(page, seed, () => ({}), extra), { g, api, get, draws } = env;
  get("input-start-port").value = ["calicut", "aden", "malacca", "kilwa"][seed % 4];
  g.selectVessel(vessel); g.selectDifficulty(difficulty); g.startSimulation();
  const dom = realDom(get);
  const truth = [], goods = ["pepper", "cloves", "teak", "textiles", "ivory", "porcelain"];
  let trades = [];
  const trade = (verb, id, qty) => { const held = api.state.cargo[id], cash = api.state.cash; (verb === "bought" ? g.buyCargoQty : g.sellCargoQty)(id, qty); const n = Math.abs(api.state.cargo[id] - held); if (n) trades.push({ verb, id, qty: n, cash: api.state.cash - cash }); };
  for (let k = 0; k < 80 && !api.state.ended; k++) {
    const r = (seed * 31 + k * 17) % 10;
    if (r < 2) { trade("bought", goods[(seed + k) % goods.length], 1 + (k % 3 === 0 ? 1 : 0)); continue; }
    if (r === 2) { const held = goods.find(id => api.state.cargo[id] > 0); if (held) trade("sold", held, 1); continue; }
    const from = api.state.currentPort, month = api.state.monthIndex, log = api.state.logs.length;
    if (r === 3) {
      g.waitInPort();
      if (api.state.monthIndex !== month) { truth.push({ kind: "wait", from, to: from, month, log, trades, cash: api.state.cash }); trades = []; }
    } else {
      const lanes = api.SEA_LANES.filter(l => l.from === from), lane = lanes[(seed + k) % lanes.length];
      g.sailTo(lane.to);
      if (api.state.monthIndex !== month) {
        const entry = [...api.state.logs].reverse()[log];
        truth.push({ kind: "voyage", from, to: lane.to, month, log, turnedBack: api.state.currentPort === from, storm: /Struck by inter-monsoon cyclone/.test(entry), pirates: /Corsairs |pirate tribute/.test(entry), trades, cash: api.state.cash });
        trades = [];
      }
    }
  }
  // The step that ended the campaign: its cash is before liquidation and the final settlement (the end frame has those).
  if (api.state.ended && truth.length) {
    const chronological = [...api.state.logs].reverse(), last = truth.at(-1);
    const after = chronological.slice(last.log + 1);
    const sold = after.reduce((a, e) => a + +(e.match(/Month 24 Liquidation: Sold .* for (\d+) D\./)?.[1] ?? 0), 0);
    const repaid = after.reduce((a, e) => a + +(e.match(/Final Settlement: Deducted remaining Commenda loan of (\d+) D\./)?.[1] ?? 0), 0);
    last.cash = api.state.cash - sold + repaid;
  }
  return { env, truth, frames, dom };
}

// The narration's trade summary for a step, from the trades the test made: identical consecutive trades join.
export function tradeSummary(api, trades) {
  const groups = [];
  for (const t of trades) { const g = groups.at(-1); if (g && g.verb === t.verb && g.id === t.id && g.each === t.qty && g.eachCash === t.cash) { g.qty += t.qty; g.cash += t.cash; g.n++; } else groups.push({ ...t, each: t.qty, eachCash: t.cash, n: 1 }); }
  const name = id => api.COMMODITIES?.find?.(c => c.id === id)?.name ?? id;
  return groups.map(g => `${g.verb} ${g.qty} ${name(g.id)} (${(Math.abs(g.cash) / g.qty).toLocaleString()} D each, ${Math.abs(g.cash).toLocaleString()} D${g.n > 1 ? `, ${g.n} trades` : ""})`).join("; ");
}

const click = (panel, replay) => panel.listeners.click({ target: { closest: () => ({ dataset: { replay } }) } });

export function replayRun(page, seed, opts = {}) {
  const { env, truth, frames, dom } = play(page, seed, opts), { api, get, draws } = env, problems = [];
  if (!api.state.ended) return { problems: [{ kind: "campaign-did-not-end" }], truth };
  const panel = get("atlas-replay");
  if (panel.querySelector("#atlas-replay-line").textContent !== "") problems.push({ kind: "announced-on-first-paint", line: panel.querySelector("#atlas-replay-line").textContent.slice(0, 40) });
  const list = panel.innerHTML.match(/<ol class="atlas-replay-steps">([\s\S]*?)<\/ol><\/details>/)?.[1] ?? "";
  const all = [...list.matchAll(/<li ([^>]*)>/g)].map(m => attrs(m[1])), items = all.filter(a => a.kind !== "end");
  if (all.at(-1)?.kind !== "end") problems.push({ kind: "no-end-frame" });
  if (items.length !== truth.length) problems.push({ kind: "step-count", got: items.length, want: truth.length });
  truth.forEach((t, i) => {
    const a = items[i] || {};
    const got = { kind: a.kind, from: a.from, to: a.to, month: +a.month, log: +a.log, turnedBack: t.kind === "voyage" ? a["turned-back"] === "true" : undefined, storm: t.kind === "voyage" ? a.storm === "true" : undefined, pirates: t.kind === "voyage" ? a.pirates === "true" : undefined };
    const want = { kind: t.kind, from: t.from, to: t.to, month: t.month, log: t.log, turnedBack: t.turnedBack, storm: t.storm, pirates: t.pirates };
    if (JSON.stringify(got) !== JSON.stringify(want)) problems.push({ kind: "step", i, got, want });
  });
  // Stepping highlights the row the step wrote; the row is the engine's own entry for that month and action.
  const chronological = [...api.state.logs].reverse(), before = JSON.stringify({ ...api.state, visitedPorts: [...api.state.visitedPorts] }), drawn = draws.length;
  click(panel, "restart");
  for (let i = 0; i < truth.length; i++) {
    if (i) click(panel, "forward");
    const row = +panel.dataset.logRow, entry = chronological[row] || "", t = truth[i];
    const wantWord = t.kind === "wait" ? "Wintered" : t.turnedBack ? "Attempted" : "Sailed";
    if (+panel.dataset.step !== i || row !== t.log || !entry.startsWith(`[M${t.month + 1} `) || !entry.includes(wantWord)) problems.push({ kind: "highlight", i, step: panel.dataset.step, row, want: t.log, entry: entry.slice(0, 60) });
    const line = panel.querySelector("#atlas-replay-line").textContent;
    if (!line.startsWith(`Step ${i + 1} of ${truth.length}. Month ${t.month + 1} `)) problems.push({ kind: "line", i, line: line.slice(0, 60) });
    // The narrated trades at the port where the step begins, and the cash after it.
    const summary = tradeSummary(api, t.trades);
    if (t.trades.length ? !line.includes(`: At ${api.PORTS[t.from].name}: ${summary}. `) : / At [A-Z]\w+: (bought|sold) /.test(line)) problems.push({ kind: "narrated-trades", i, want: summary, line });
    if (!line.endsWith(` Cash ${t.cash.toLocaleString()} D.`)) problems.push({ kind: "narrated-cash", i, want: t.cash, line: line.slice(-40) });
    // The real highlight: exactly the step's row of the dated log, with aria-current; the step's item; the log view's row.
    const lit = dom.rows().map((r, k) => [k, r]).filter(([, r]) => r.classList.contains("atlas-replay-current"));
    if (lit.length !== 1 || lit[0][0] !== t.log || lit[0][1].getAttribute("aria-current") !== "step" || dom.rows().some((r, k) => k !== t.log && r.getAttribute("aria-current"))) problems.push({ kind: "dom-highlight", i, lit: lit.map(([k]) => k), want: t.log });
    const items = dom.steps().filter(li => li.hasAttribute("data-current")).map(li => +li.dataset.step);
    if (items.length !== 1 || items[0] !== i) problems.push({ kind: "steps-current", i, items });
    const views = dom.logRows().filter(r => r.hasAttribute("data-current")).map(r => +r.dataset.row);
    if (views.length !== 1 || views[0] !== t.log) problems.push({ kind: "log-view-current", i, views, want: t.log });
  }
  click(panel, "back"); click(panel, "restart");
  const writesBefore = dom.writes();
  click(panel, "play");
  // Run the animation itself: every requested frame, 100 ms apart, until it stops or 600 frames have run.
  let time = 0, ran = 0;
  while (frames.length && ran < 600) { frames.shift()(time += 100); ran++; }
  if (ran < 10) problems.push({ kind: "animation-did-not-run", ran });
  // One narration per step, not one per frame: at most one write per frame shown (steps plus the end frame), plus the Play press.
  if (dom.writes() - writesBefore > truth.length + 2) problems.push({ kind: "live-line-per-frame", writes: dom.writes() - writesBefore, frames: ran, steps: truth.length });
  // The last frame is the end of the campaign (liquidation), after the last step.
  if (truth.length && +panel.dataset.step !== truth.length) problems.push({ kind: "animation-did-not-reach-the-end", step: panel.dataset.step, want: truth.length });
  click(panel, "play"); click(panel, "play");
  if (draws.length !== drawn || JSON.stringify({ ...api.state, visitedPorts: [...api.state.visitedPorts] }) !== before) problems.push({ kind: "purity", draws: draws.length - drawn });
  return { problems, truth };
}

// Reduced motion: Play is disabled and does nothing, no frame is requested, and each step is drawn at its end.
export function reducedRun(page, seed) {
  const { env, truth, frames } = play(page, seed, { reduced: true }), { api, get } = env, problems = [];
  const panel = get("atlas-replay");
  if (!/data-replay="play" aria-pressed="false" disabled/.test(panel.innerHTML)) problems.push({ kind: "play-not-disabled" });
  click(panel, "play");
  for (let i = 0; i < truth.length; i++) {
    if (i) click(panel, "forward");
    const t = truth[i], end = t.kind === "wait" || t.turnedBack ? api.PORTS[t.from] : api.PORTS[t.to];
    const at = panel.querySelector("#atlas-replay-ship").getAttribute("transform");
    if (at !== `translate(${end.x.toFixed(1)},${end.y.toFixed(1)})`) problems.push({ kind: "not-a-still-end-frame", i, at, want: [end.x, end.y] });
  }
  if (frames.length) problems.push({ kind: "animation-requested", frames: frames.length });
  return { problems, steps: truth.length };
}

// The PDF export: with no html2canvas loaded the engine falls back to window.print(), which the harness records; at that
// moment no row of the dated log may carry the replay's highlight, and afterwards the highlight is back.
export function exportRun(page, seed) {
  let atExport = null, rowsRef = null;
  const { env, truth, dom } = play(page, seed, { onPrint: () => { atExport = rowsRef().filter(r => r.classList.contains("atlas-replay-current") || r.getAttribute("aria-current")).length; } });
  rowsRef = dom.rows;
  const { g, api, get } = env, problems = [];
  if (!api.state.ended || !truth.length) return { problems: [{ kind: "campaign-did-not-end" }] };
  get("atlas-replay").listeners.click({ target: { closest: () => ({ dataset: { replay: "forward" } }) } });
  const before = dom.rows().filter(r => r.classList.contains("atlas-replay-current")).length;
  Object.assign(api.state, { mode: "student", reflection: "A reflection long enough to export." });
  return Promise.resolve(g.exportAuditPDF()).then(() => {
    const after = dom.rows().filter(r => r.classList.contains("atlas-replay-current")).length;
    if (before !== 1 || atExport !== 0 || after !== 1) problems.push({ before, atExport, after });
    return { problems };
  });
}

// Never printed, never in the PDF export: the print rule and the html2canvas opt-out are both in the page.
export function printProblems(page) {
  const problems = [];
  if (!/@media print\{#atlas-replay\{display:none!important\}\}/.test(page)) problems.push("no print rule hides #atlas-replay");
  if (!/panel\.setAttribute\('data-html2canvas-ignore','true'\)/.test(page)) problems.push("the replay is not excluded from the PDF export");
  // The highlight on the dated log's current row is outside the panel, so it must be screen-only (it once changed the print).
  const rule = "#audit-log-table>.atlas-replay-current{", at = [];
  for (let k = page.indexOf(rule); k >= 0; k = page.indexOf(rule, k + 1)) at.push(k);
  if (at.length !== 1 || page.slice(at[0] - 14, at[0]) !== "@media screen{") problems.push("the log-row highlight is not screen-only");
  return problems;
}

// A campaign shaped like the owner's real play (junk, Coastal Guild Apprentice, from Malacca): many single-unit trades,
// a five-month crossing, two mutinies, the corsairs taking a crate, and liquidation at the end. Draws are scripted.
export function fixtureRun(page) {
  const { env } = { env: load(page, 1, () => ({}), { requestAnimationFrame: () => 0, cancelAnimationFrame() {} }) }, { g, api, get } = env;
  get("input-start-port").value = "malacca";
  g.selectVessel("junk"); g.selectDifficulty("easy"); g.startSimulation();
  const st = api.state; st.cash = 60000;
  let queue = []; g.__next = () => (queue.length ? queue.shift() : 0.999);
  const sail = (to, draws = []) => { queue = [...draws]; g.sailTo(to); queue = []; };
  const calm = (from, to) => [...Array(24).keys()].find(m => { const c = g.computeTransit(api.SEA_LANES.find(l => l.from === from && l.to === to), st.monthIndex + m); return !c.isHeadwind && !c.isDeadZone; });
  const waitFor = n => { for (let k = 0; k < n && !st.ended; k++) g.waitInPort(); };
  for (const q of [1, 2, 2]) g.buyCargoQty("teak", q);                     // same price, different quantities
  for (let k = 0; k < 15; k++) g.buyCargoQty("cloves", 1);                 // fifteen single-unit purchases
  waitFor(calm("malacca", "quanzhou")); sail("quanzhou");
  for (let k = 0; k < 15; k++) g.sellCargoQty("cloves", 1);                // fifteen identical sales
  g.buyCargoQty("porcelain", 3);
  waitFor(calm("quanzhou", "malacca")); st.crewHealth = 10; sail("malacca", [0.999, 0]);   // no pirates; mutiny
  for (let k = 0; k < 4; k++) g.buyCargoQty("cloves", 1);
  waitFor(calm("malacca", "calicut")); st.crewHealth = 10; sail("calicut", [0, 0]);         // corsairs take a crate; mutiny
  // A five-month crossing: the first lane and month from here that charges five months.
  let five = null;
  for (let m = 0; m < 12 && !five; m++) for (const l of api.SEA_LANES.filter(l => l.from === st.currentPort)) { const c = g.computeTransit(l, st.monthIndex + m); if (c.months === 5 && !c.isHeadwind) { five = { l, m }; break; } }
  if (five) { waitFor(five.m); st.crewHealth = 100; sail(five.l.to, [0.9, 0.999, 0.999]); }
  for (let k = 0; k < 6; k++) g.buyCargoQty("pepper", 1);
  while (!st.ended) g.waitInPort();                                       // to the end: liquidation
  return { env, five: !!five };
}

// Grouping is exact: each grouped row's count, quantity and total equal its raw lines.
export function groupingProblems(env) {
  const { api, get } = env, html = get("atlas-replay").innerHTML, problems = [];
  const groups = [...html.matchAll(/<li data-row="(\d+)" data-group="(\d+)" data-qty="(\d+)" data-total="(\d+)"><details><summary>([^<]*)<\/summary><ol>([\s\S]*?)<\/ol><\/details><\/li>/g)];
  for (const [, row, n, qty, total, summary, raw] of groups) {
    const lines = [...raw.matchAll(/<li>([^<]*)<\/li>/g)].map(m => m[1]);
    const sum = lines.reduce((a, l) => a + +(l.match(/ for (\d+) D/)?.[1] ?? NaN), 0);
    const units = lines.reduce((a, l) => a + +(l.match(/(?:Sold|Bought) (\d+)×/)?.[1] ?? NaN), 0);
    const said = summary.match(/^(Sold|Bought) (\d+)× .* ([\d,]+) D each, ([\d,]+) D \((\d+) trades\)$/);
    if (!said || lines.length !== +n || +said[5] !== lines.length || +said[2] !== units || +qty !== units || +said[4].replace(/,/g, "") !== sum || +total !== sum || new Set(lines).size !== 1) problems.push({ row, n, qty, total, summary, lines: lines.length, units, sum });
  }
  return { problems, groups: groups.map(m => ({ n: +m[2], summary: m[5] })) };
}

const RUNS = [];
for (const seed of [1, 2, 3, 5, 8, 13]) for (const [vessel, difficulty] of [["dhow", "normal"], ["junk", "hard"]]) RUNS.push({ seed, vessel, difficulty });

test("the replay has one step per voyage or wait, storms and pirates as the engine had them, and highlights each step's log row", () => {
  let steps = 0, storms = 0, pirates = 0, waits = 0, turnbacks = 0;
  for (const run of RUNS) {
    const { problems, truth } = replayRun(PAGE, run.seed, run);
    assert.deepEqual(problems.slice(0, 4), [], `seed ${run.seed} ${run.vessel}/${run.difficulty}`);
    steps += truth.length; storms += truth.filter(t => t.storm).length; pirates += truth.filter(t => t.pirates).length; waits += truth.filter(t => t.kind === "wait").length; turnbacks += truth.filter(t => t.turnedBack).length;
  }
  for (const [name, n] of [["storms", storms], ["pirates", pirates], ["waits", waits], ["turn-backs", turnbacks]]) assert.ok(n >= 3, `${name}: ${n} in ${steps} steps`);
});

test("with reduced motion the replay never animates: Play is disabled and each step is a still frame", () => {
  for (const seed of [1, 5]) assert.deepEqual(reducedRun(PAGE, seed).problems, []);
});

test("the replay is never printed and never in the PDF export, and the export runs without its highlight", async () => {
  assert.deepEqual(printProblems(PAGE), []);
  for (const seed of [1, 3]) assert.deepEqual((await exportRun(PAGE, seed)).problems, []);
});

test("a campaign shaped like the owner's: trades grouped exactly, the end labelled once, the Atlas vessel name", () => {
  fixtureCheck(PAGE);
});

export function fixtureCheck(page) {
  const { env, five } = fixtureRun(page), { api, get } = env;
  // The narration is read from the step list's text alternative (the same text the live line speaks).
  const html = get("atlas-replay").innerHTML;
  assert.ok(five, "the fixture needs a five-month crossing");
  assert.equal(api.state.mutinies, 2, "two mutinies");
  assert.ok(api.state.logs.some(e => /Corsairs raided 1 crate of Moluccan Cloves/.test(e)), "the corsairs took a crate");
  assert.ok(api.state.logs.some(e => /Month 24 Liquidation: Sold/.test(e)), "liquidation at the end");
  const { problems, groups } = groupingProblems(env);
  assert.deepEqual(problems, []);
  assert.ok(groups.some(g => g.n === 15 && /^Sold 15× Moluccan Cloves at Quanzhou, [\d,]+ D each, [\d,]+ D \(15 trades\)$/.test(g.summary)), "fifteen sales grouped into one row");
  assert.ok(groups.some(g => g.n === 15 && /^Bought 15× Moluccan Cloves at Malacca/.test(g.summary)), "fifteen purchases grouped into one row");
  // 1, 2, 2 teak at one price: the two identical purchases join, the different one stays apart, in the log view and the narration.
  assert.ok(groups.some(g => g.n === 2 && /^Bought 4× Teak/.test(g.summary)) && !groups.some(g => /^Bought 5× Teak/.test(g.summary)), "only identical teak purchases joined in the log view");
  assert.match(html, /bought 1 Teak Timber \(\d+ D each, [\d,]+ D\); bought 4 Teak Timber \([\d,]+ D each, [\d,]+ D, 2 trades\)/, "only identical teak purchases joined in the narration");
  // The end: one frame labelled "End of campaign (liquidation)", and no liquidation row tagged "[M24 • Jan]".
  assert.match(html, /<li data-step="\d+" data-kind="end">End of campaign \(liquidation\): sold /);
  assert.doesNotMatch(html, /data-end="true">\[M24/);
  assert.match(html, /data-end="true">End of campaign \(liquidation\): Month 24 Liquidation: Sold/);
  // The adapter's vessel name for the engine's "Chinese Treasure Junk", in the replay and its log.
  assert.doesNotMatch(html, /Chinese Treasure Junk/);
  assert.match(html, /Charter signed at Malacca aboard Chinese ocean-going junk/);
  // The engine's log and the printed audit are untouched.
  assert.ok(api.state.logs.some(e => /aboard Chinese Treasure Junk/.test(e)));
}

test("the checks fail on planted defects", async () => {
  const plants = [
    ["waits not recorded", PAGE.replace("history.steps.push({kind:'wait'", "void({kind:'wait'"), "replay"],
    ["storms dropped from the replay", PAGE.replace("storm:v?!!v.storm:null", "storm:v?false:null"), "replay"],
    ["pirates shown on every voyage", PAGE.replace("pirates:v?!!v.pirates:null", "pirates:v?true:null"), "replay"],
    ["highlight one row late", PAGE.replace("panel.dataset.step=String(index);panel.dataset.logRow=String(s.log);", "panel.dataset.step=String(index);panel.dataset.logRow=String(s.log+1);"), "replay"],
    ["replay draws a random number", PAGE.replace("const paintFrame=()=>{", "const paintFrame=()=>{Math.random();"), "replay"],
    ["reduced motion ignored", PAGE.replace("const reduce=()=>!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;", "const reduce=()=>false;"), "reduced"],
    ["replay printed", PAGE.replace("@media print{#atlas-replay{display:none!important}}", ""), "print"],
    ["log-row highlight printed", PAGE.replace("@media screen{#audit-log-table>.atlas-replay-current{", "#audit-log-table>.atlas-replay-current{"), "print"],
    ["real row highlighted one late", PAGE.replace("const on=r===s.log;rows[r].classList", "const on=r===s.log+1;rows[r].classList"), "replay"],
    ["highlight skips past commenda-interest rows", PAGE.replace("const on=r===s.log;rows[r].classList", "const on=r===s.log-[...Array(s.log).keys()].filter(k=>/interest/i.test(rows[k]?.textContent||'')).length;rows[r].classList"), "replay"],
    ["cash line shows post-liquidation cash", PAGE.replaceAll("cashAfter:history.end&&history.end.log>=pre.log?history.end.cashBefore:state.cash,log:pre.log,trades});", "cashAfter:state.cash,log:pre.log,trades});"), "replay"],
    ["narration drops the last trade", PAGE.replace("const tradeText=t=>groupTrades(t).map(", "const tradeText=t=>groupTrades(t.slice(0,-1)).map("), "replay"],
    ["live line rewritten every frame", PAGE.replace("const t=reduce()?1:progress,[x,y]=svgPoint(s,t);", "const t=reduce()?1:progress,[x,y]=svgPoint(s,t);panel.querySelector('#atlas-replay-line').textContent=stepText(s,index)+' '.repeat(Math.round(t*20));"), "replay"],
    ["log view joins non-identical rows", PAGE.replace("while(byRow.get(k)&&logs[k]===logs[r]&&", "while(byRow.get(k)&&").replace("last.each===t.qty&&last.eachCash===t.cash", "Math.abs(last.unit*t.qty)===Math.abs(t.cash)"), "fixture"],
    ["narration joins trades of different quantities", PAGE.replace("last.each===t.qty&&last.eachCash===t.cash", "Math.abs(last.unit*t.qty)===Math.abs(t.cash)"), "fixture"],
    ["announced on first paint", PAGE.replace("if(steps.length){announce(false);paintFrame();}", "if(steps.length){announce();paintFrame();}"), "replay"],
    ["export keeps the highlight", PAGE.replace("exportAuditPDF=async function(...args){clearHighlight();try{", "exportAuditPDF=async function(...args){try{"), "export"],
    ["group count off by one", PAGE.replace("${g.n>1?` (${g.n} trades)`:''}`;", "${g.n>1?` (${g.n+1} trades)`:''}`;"), "group"],
  ];
  for (const [name, page, which] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = which === "export" ? (await exportRun(page, 1)).problems.length > 0 : which === "fixture" ? (() => { try { fixtureCheck(page); return false; } catch { return true; } })() : which === "group" ? groupingProblems(fixtureRun(page).env).problems.length > 0 : which === "print" ? printProblems(page).length > 0 : which === "reduced" ? [1, 5].some(seed => reducedRun(page, seed).problems.length > 0) : RUNS.some(run => replayRun(page, run.seed, run).problems.length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
