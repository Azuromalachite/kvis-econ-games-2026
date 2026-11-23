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

export function play(page, seed, { vessel = "dhow", difficulty = "normal", reduced = false } = {}) {
  const frames = [];
  const extra = { requestAnimationFrame: f => { frames.push(f); return frames.length; }, cancelAnimationFrame() {}, matchMedia: q => ({ matches: reduced && /prefers-reduced-motion:\s*reduce/.test(q) }) };
  const env = load(page, seed, () => ({}), extra), { g, api, get, draws } = env;
  get("input-start-port").value = ["calicut", "aden", "malacca", "kilwa"][seed % 4];
  g.selectVessel(vessel); g.selectDifficulty(difficulty); g.startSimulation();
  const truth = [], goods = ["pepper", "cloves", "teak", "textiles", "ivory", "porcelain"];
  for (let k = 0; k < 80 && !api.state.ended; k++) {
    const r = (seed * 31 + k * 17) % 10;
    if (r < 2) { g.buyCargoQty(goods[(seed + k) % goods.length], 2); continue; }
    if (r === 2) { const held = goods.find(id => api.state.cargo[id] > 0); if (held) g.sellCargoQty(held, 1); continue; }
    const from = api.state.currentPort, month = api.state.monthIndex, log = api.state.logs.length;
    if (r === 3) {
      g.waitInPort();
      if (api.state.monthIndex !== month) truth.push({ kind: "wait", from, to: from, month, log });
    } else {
      const lanes = api.SEA_LANES.filter(l => l.from === from), lane = lanes[(seed + k) % lanes.length];
      g.sailTo(lane.to);
      if (api.state.monthIndex !== month) {
        const entry = [...api.state.logs].reverse()[log];
        truth.push({ kind: "voyage", from, to: lane.to, month, log, turnedBack: api.state.currentPort === from, storm: /Struck by inter-monsoon cyclone/.test(entry), pirates: /Corsairs |pirate tribute/.test(entry) });
      }
    }
  }
  return { env, truth, frames };
}

const click = (panel, replay) => panel.listeners.click({ target: { closest: () => ({ dataset: { replay } }) } });

export function replayRun(page, seed, opts = {}) {
  const { env, truth, frames } = play(page, seed, opts), { api, get, draws } = env, problems = [];
  if (!api.state.ended) return { problems: [{ kind: "campaign-did-not-end" }], truth };
  const panel = get("atlas-replay");
  const items = [...panel.innerHTML.matchAll(/<li ([^>]*)>/g)].map(m => attrs(m[1]));
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
  }
  click(panel, "back"); click(panel, "restart"); click(panel, "play");
  // Run the animation itself: every requested frame, 100 ms apart, until it stops or 600 frames have run.
  let time = 0, ran = 0;
  while (frames.length && ran < 600) { frames.shift()(time += 100); ran++; }
  if (ran < 10) problems.push({ kind: "animation-did-not-run", ran });
  if (truth.length && +panel.dataset.step !== truth.length - 1) problems.push({ kind: "animation-did-not-reach-the-end", step: panel.dataset.step, want: truth.length - 1 });
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

// Never printed, never in the PDF export: the print rule and the html2canvas opt-out are both in the page.
export function printProblems(page) {
  const problems = [];
  if (!/@media print\{#atlas-replay\{display:none!important\}\}/.test(page)) problems.push("no print rule hides #atlas-replay");
  if (!/panel\.setAttribute\('data-html2canvas-ignore','true'\)/.test(page)) problems.push("the replay is not excluded from the PDF export");
  return problems;
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

test("the replay is never printed and never in the PDF export", () => {
  assert.deepEqual(printProblems(PAGE), []);
});

test("the checks fail on planted defects", () => {
  const plants = [
    ["waits not recorded", PAGE.replace("history.steps.push({kind:'wait'", "void({kind:'wait'"), "replay"],
    ["storms dropped from the replay", PAGE.replace("storm:v?!!v.storm:null", "storm:v?false:null"), "replay"],
    ["pirates shown on every voyage", PAGE.replace("pirates:v?!!v.pirates:null", "pirates:v?true:null"), "replay"],
    ["highlight one row late", PAGE.replace("panel.dataset.step=String(index);panel.dataset.logRow=String(s.log);", "panel.dataset.step=String(index);panel.dataset.logRow=String(s.log+1);"), "replay"],
    ["replay draws a random number", PAGE.replace("const paintFrame=()=>{", "const paintFrame=()=>{Math.random();"), "replay"],
    ["reduced motion ignored", PAGE.replace("const reduce=()=>!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;", "const reduce=()=>false;"), "reduced"],
    ["replay printed", PAGE.replace("@media print{#atlas-replay{display:none!important}}", ""), "print"],
  ];
  for (const [name, page, which] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = which === "print" ? printProblems(page).length > 0 : which === "reduced" ? [1, 5].some(seed => reducedRun(page, seed).problems.length > 0) : RUNS.some(run => replayRun(page, run.seed, run).problems.length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
