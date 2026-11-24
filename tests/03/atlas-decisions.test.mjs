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
import { load as loadPage, SITES } from "./atlas-harness.mjs";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The engine's constants, read from its source.
export function engineConstants(engine) {
  const one = (re, what) => { const m = engine.match(re); if (!m) throw new Error(`engine constant not found: ${what}`); return Number(m[1]); };
  return {
    turnBack: one(/if \(calc\.isHeadwind\) \{[\s\S]*?if \(Math\.random\(\) < ([\d.]+)\) \{\s*turnedBack = true;/, "turn-back"),
    standingStep: one(/getEffectiveLayoverFee\(currentPort, Math\.min\(100, currentStanding \+ (\d+) \* month\)\)/, "standing step while waiting"),
    valuable: one(/destPort\.piracyRisk \* \(hasHighValue \? ([\d.]+) :/, "piracy, valuable cargo"),
    plain: one(/destPort\.piracyRisk \* \(hasHighValue \? [\d.]+ : ([\d.]+)\)/, "piracy, plain cargo"),
    survival: one(/\(state\.diffKey === "survival" \? ([\d.]+) : 1\.0\)/, "piracy, survival"),
    marines: one(/if \(state\.specialists\.marines\) pirateProb \*= ([\d.]+);/, "piracy, marines"),
    standingAt: one(/if \(destStanding >= (\d+)\) pirateProb \*=/, "piracy, standing threshold"),
    standingFactor: one(/if \(destStanding >= \d+\) pirateProb \*= ([\d.]+);/, "piracy, standing factor"),
    tribute: one(/const ransom = Math\.min\(Math\.max\(0, state\.cash\), (\d+)\);/, "tribute cap"),
  };
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
    let year = null;
    for (let m = 0; m < 12; m++) { const c = g.computeTransit(lane, m); if (!year || c.days < year.days) year = { m, days: c.days }; }
    return { options, now: options[0], best, fastest, year, cut: fastest.c.days > year.days };
  };
  return { expected, waiting, plan };
}

const attrs = html => Object.fromEntries([...html.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const expandRanges = text => { const out = []; for (const part of text.split(/, | and /)) { const [a, b] = part.split("–").map(x => MONTH_NAMES.indexOf(x)); if (a < 0) return null; for (let m = a; ; m = (m + 1) % 12) { out.push(m); if (m === (b ?? a)) break; } } return out.sort((x, y) => x - y); };

// 1 and 2: calendar and card in many game states; 3: purity while painting them.
export function cardRun(page) {
  const env = loadPage(page, 5, engineConstants), { g, api, get, draws } = env, M = model(env), problems = [];
  get("input-start-port").value = "calicut";
  g.selectVessel("dhow"); g.selectDifficulty("normal"); g.startSimulation();
  let cards = 0, lines = 0;
  const WORD = { tailwind: "fast", crosswind: "steady", headwind: "slow", transition: "transition" };
  for (const vessel of ["dhow", "junk"]) for (const navigator of [false, true]) for (const diff of ["normal", "survival"]) for (const port of Object.keys(api.PORTS)) for (const month of [0, 3, 5, 9, 10, 14, 20, 21, 22, 23]) {
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
      if (other && other !== p.best) {
        const title = cols[1][2].match(/<h4>([^<]*)<\/h4>/)?.[1];
        if (title !== `Wait for the fastest crossing${p.cut ? " left this campaign" : ""} (${MONTH_NAMES[other.w % 12]})`) problems.push({ kind: "fastest-title", port, month, to: lane.to, title, cut: p.cut });
      }
      const wantStart = !other ? (p.cut ? `Sailing now is the earliest expected arrival and the fastest crossing left this campaign; the year’s fastest (${MONTH_NAMES[p.year.m]}, ${p.year.days} days) comes after it ends.` : "Sailing now is both the year’s fastest crossing") : other.arrival < p.now.arrival - 1e-9 ? `In expectation, waiting until ${MONTH_NAMES[other.w % 12]} arrives` : "In expectation, sailing now arrives";
      if (!verdict.startsWith(wantStart)) problems.push({ kind: "verdict", port, month, to: lane.to, verdict, wantStart });
      cards++;
    }
  }
  return { problems, cards, lines };
}

// 4: the explanation after each voyage of seeded campaigns, against the engine's tagged draws.
export function explainRun(page, seed, { vessel = "dhow", difficulty = "normal", voyages = 30 } = {}) {
  const env = loadPage(page, seed, engineConstants), { g, api, get, draws } = env, M = model(env), problems = [];
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
    const fastestSentence = calc.days === p.year.days ? "That was this route’s fastest crossing of the year."
      : p.fastest.w === departed ? `That was the fastest crossing left this campaign; the year’s fastest (${MONTH_NAMES[p.year.m]}, ${p.year.days} days) comes after it ends.`
      : `takes ${p.fastest.c.days} days${p.cut ? " (the fastest left this campaign)" : ""}, but waiting for it would have delayed departure by ${p.fastest.w - departed} month`;
    if (!text.includes(fastestSentence)) bad.push("fastest");
    if (p.cut && /fastest crossing of the year/.test(text) && calc.days !== p.year.days) bad.push("fastest-of-year-claimed");
    if (p.best.w === departed ? !text.includes("earliest expected arrival") : !text.includes(`leaving in ${MONTH_NAMES[p.best.w % 12]} would have arrived`)) bad.push("best");
    const labels = text.match(/Predictable: (.*?)\. Luck: (.*)\.$/);
    if (!!labels !== (calc.isHeadwind || calc.isDeadZone)) bad.push("predictable-vs-luck");
    if (labels) {
      // Predictable holds the season's chances; Luck holds what the draws did. Swapped or mixed labels fail.
      const [, known, drawn] = labels;
      if (calc.isHeadwind && !/35% turn-back chance/.test(known)) bad.push("predictable-missing-turnback-chance");
      if (calc.isDeadZone && !/\d+% (cyclone|typhoon) chance/.test(known)) bad.push("predictable-missing-storm-chance");
      if (/draw|came|hull −/.test(known)) bad.push("predictable-holds-an-outcome");
      if (calc.isHeadwind && !/turn-back draw went (against you|your way)/.test(drawn)) bad.push("luck-missing-turnback-draw");
      if (calc.isDeadZone && !/(no )?(cyclone|typhoon) came/.test(drawn)) bad.push("luck-missing-storm-outcome");
      if (/chance/.test(drawn)) bad.push("luck-holds-a-chance");
    }
    if (calc.isHeadwind && !text.includes(turnedBack ? "the turn-back draw went against you" : "the turn-back draw went your way")) bad.push("turnback-fact");
    if (calc.isDeadZone && !(storm ? / came \((hull −[1-9]\d*%|no further hull loss)(, hull at its minimum)?\)/.test(text) : /no (cyclone|typhoon) came/.test(text))) bad.push("storm-fact");
    // Never call a choice wrong, least of all for a draw.
    if (BLAME.test(text)) bad.push("blames-the-choice");
    if (bad.length) problems.push({ voyage: v, lane: `${from}>${lane.to}`, departed, turnedBack, storm, bad, text });
  }
  return { problems, counts };
}

// 5: the pirate warning above the departure buttons and its line on the card, in many cargo, guard, standing and
//    difficulty states; a port whose risk is set to 0 must show no warning.
export function pirateRun(page) {
  const env = loadPage(page, 9, engineConstants), { g, api, get, draws, K } = env, problems = [];
  get("input-start-port").value = "calicut";
  g.selectVessel("dhow"); g.selectDifficulty("normal"); g.startSimulation();
  const chance = (dest, marines) => { const st = api.state; let p = api.PORTS[dest].piracyRisk * (st.cargo.cloves > 0 || st.cargo.ivory > 0 ? K.valuable : K.plain) * (st.diffKey === "survival" ? K.survival : 1); if (marines) p *= K.marines; if ((st.diaspora[dest] || 0) >= K.standingAt) p *= K.standingFactor; return p; };
  const pc = p => (p > 0 && p < 0.005 ? "<1%" : `${Math.round(p * 100)}%`), AT = 0.10;
  let shown = 0, quiet = 0, hiddenZero = 0;
  for (const diff of ["normal", "survival"]) for (const marines of [false, true]) for (const cargo of [{}, { cloves: 2 }, { ivory: 1 }, { teak: 3 }]) for (const standing of [0, 60]) for (const port of Object.keys(api.PORTS)) {
    const st = api.state;
    Object.assign(st, { diffKey: diff, currentPort: port, monthIndex: 4, ended: false, cash: 50, hoveredLaneTo: null });
    st.specialists.marines = marines;
    for (const k of Object.keys(st.cargo)) st.cargo[k] = cargo[k] ?? 0;
    for (const k of Object.keys(st.diaspora)) st.diaspora[k] = standing;
    for (const lane of api.SEA_LANES.filter(l => l.from === port)) for (const zero of [false, true]) {
      const risk = api.PORTS[lane.to].piracyRisk; if (zero) api.PORTS[lane.to].piracyRisk = 0;
      st.windRouteTo = lane.to;
      const before = JSON.stringify({ ...st, visitedPorts: [...st.visitedPorts] }), drawsBefore = draws.length;
      g.renderAll();
      if (draws.length !== drawsBefore || JSON.stringify({ ...st, visitedPorts: [...st.visitedPorts] }) !== before) problems.push({ kind: "purity", port, to: lane.to });
      const w = get("atlas-pirate-warning"), p = chance(lane.to, marines), guarded = chance(lane.to, true);
      const text = w.querySelector(".atlas-pirate-text").textContent, card = get("atlas-decision").innerHTML;
      const guards = marines ? " with your marines" : ` (${pc(guarded)} with armed marines)`;
      if (!(p > 0)) {
        if (!w.hidden || /atlas-decision-pirates/.test(card)) problems.push({ kind: "shown-at-zero", diff, port, to: lane.to });
        hiddenZero++;
      } else if (p < AT) {
        // Below the owner's 10% line: no warning, and a quiet line on the card (no icon, no live region).
        if (!w.hidden) problems.push({ kind: "warning-below-threshold", diff, marines, cargo, standing, port, to: lane.to, p });
        if (!card.includes(`<p class="atlas-decision-pirates-quiet" data-chance="${p}" data-level="quiet">Pirates on arrival, either way: ${pc(p)}${guards}.</p>`)) problems.push({ kind: "quiet-line", port, to: lane.to, p });
        quiet++;
      } else {
        const months = g.computeTransit(lane).months, upkeep = api.VESSELS[st.vesselKey].upkeep;
        const cost = st.cargo.cloves > 0 ? "you lose 1 crate of Moluccan Cloves" : st.cargo.ivory > 0 ? "you lose 1 lot of E. African Ivory" : `you pay up to ${Math.min(Math.max(0, st.cash - upkeep * months), K.tribute)} D in tribute`;
        const want = `Pirates on arrival at ${api.PORTS[lane.to].name}: ${pc(p)} chance ${marines ? "with your armed marines" : "with your current crew"}${marines ? "" : `, ${pc(guarded)} with armed marines (Care for ship and crew)`}. If they strike, ${cost}. Marines don't reduce the chance of being turned back.`;
        if (w.hidden || w.dataset.to !== lane.to || Math.abs(+w.dataset.chance - p) > 1e-12 || Math.abs(+w.dataset.guarded - guarded) > 1e-12 || text !== want || w.getAttribute("aria-live") !== "polite") problems.push({ kind: "warning", diff, marines, cargo, standing, port, to: lane.to, got: { hidden: w.hidden, chance: +w.dataset.chance, guarded: +w.dataset.guarded, text }, want: { chance: p, guarded, text: want } });
        if (!card.includes(`data-level="warning"><span aria-hidden="true">⚠</span> Pirates on arrival, either way: ${pc(p)}${guards}.</p>`)) problems.push({ kind: "card-line", port, to: lane.to });
        shown++;
      }
      api.PORTS[lane.to].piracyRisk = risk;
    }
  }
  return { problems, shown, quiet, hiddenZero };
}

// The threshold itself: a departure whose chance is just under 10% (9.9%) gets no warning; one at 10% gets it.
// The port's risk is set so the engine's own chance lands on each value.
export function thresholdRun(page) {
  const env = loadPage(page, 11, engineConstants), { g, api, get, K } = env, problems = [];
  get("input-start-port").value = "aden";
  g.selectVessel("dhow"); g.selectDifficulty("normal"); g.startSimulation();
  const st = api.state; st.windRouteTo = "calicut"; st.specialists.marines = false;
  const chance = r => r * K.plain;
  for (const [target, want] of [[0.099, false], [0.10, true], [0.25, true], [0.05, false]]) {
    let r = target / K.plain; while (chance(r) < target) r += Number.EPSILON * r;   // the smallest risk that reaches the target
    api.PORTS.calicut.piracyRisk = r; g.renderAll();
    const shown = !get("atlas-pirate-warning").hidden;
    if (shown !== want) problems.push({ kind: "threshold", target, chance: chance(r), shown, want });
  }
  return { problems };
}

// The tribute the warning names, against the tribute the engine takes: every draw 0, a leg with neither headwind
// nor transition month (so only the piracy check draws, and the ship is never becalmed), no valuable cargo.
export function tributeRun(page) {
  const problems = []; let checked = 0;
  for (const cash of [0, 20, 60, 80, 100, 150, 400]) for (const [from, to] of [["aden", "calicut"], ["calicut", "malacca"], ["malacca", "quanzhou"]]) {
    const env = loadPage(page, 3, engineConstants), { g, api, get } = env;
    get("input-start-port").value = from;
    g.selectVessel("dhow"); g.selectDifficulty("normal"); g.startSimulation();
    const lane = api.SEA_LANES.find(l => l.from === from && l.to === to);
    const month = [...Array(12).keys()].find(m => { const c = g.computeTransit(lane, m); return !c.isHeadwind && !c.isDeadZone; });
    Object.assign(api.state, { monthIndex: month, cash, windRouteTo: to }); api.PORTS[to].piracyRisk = 1; g.renderAll();
    const said = get("atlas-pirate-warning").querySelector(".atlas-pirate-text").textContent.match(/you pay up to (\d+) D in tribute/)?.[1];
    g.__next = () => 0; g.sailTo(to);
    const took = api.state.logs.find(e => e.includes(" | Events: "))?.match(/Paid (\d+) D pirate tribute/)?.[1];
    if (said === undefined || took === undefined || +said !== +took) problems.push({ cash, lane: `${from}>${to}`, said, took });
    checked++;
  }
  return { problems, checked };
}

// Words that would call a choice wrong. The counterfactual ("would have arrived about N months earlier") stays a
// plain fact; none of these may appear anywhere in the explanation.
export const BLAME = /\bwrong\b|\bmistak\w*|\b(poor|bad)\s+(decision|choice|call)s?\b|\bmisjudg\w*|\bfault\b|\bblam\w*|\bunwise\b|\berrors?\b|\bshould(?:\s+have|'ve|’ve)\b|\bought to\b/i;

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

test("the pirate warning shows exactly when the engine's piracy chance is above zero, with the engine's numbers, and reads only", () => {
  const { problems, shown, quiet, hiddenZero } = pirateRun(PAGE);
  assert.deepEqual(problems.slice(0, 5), []);
  assert.ok(shown >= 60 && quiet >= 100 && hiddenZero >= 300, `${shown} warnings, ${quiet} quiet lines, ${hiddenZero} hidden at zero`);
  assert.deepEqual(thresholdRun(PAGE).problems, []);
  const tribute = tributeRun(PAGE);
  assert.deepEqual(tribute.problems, []);
  assert.ok(tribute.checked >= 20);
});

test("the pirate warning check fails on planted defects", () => {
  for (const [name, page] of [
    ["warning shown on a zero-piracy departure", PAGE.replace("if(!(p>=PIRATE_WARNING_AT)){if(!pirateWarning.hidden)", "if(p>0&&!(p>=PIRATE_WARNING_AT)){if(!pirateWarning.hidden)")],
    ["warning missing on a positive one", PAGE.replace("if(!(p>=PIRATE_WARNING_AT)){if(!pirateWarning.hidden)", "if(!(p>=PIRATE_WARNING_AT)||p>0.3){if(!pirateWarning.hidden)")],
    ["guard multiplier omitted", PAGE.replace("if(marines)p*=0.2;", "")],
    ["warning at 9.9%", PAGE.replace("const PIRATE_WARNING_AT=0.10;", "const PIRATE_WARNING_AT=0.099;")],
    ["no warning at 10%", PAGE.replace("if(!(p>=PIRATE_WARNING_AT))", "if(!(p>PIRATE_WARNING_AT))")],
    ["threshold read from the guarded chance", PAGE.replace("const p=lane&&!state.ended?pirateChance(lane.to):0;", "const p=lane&&!state.ended?pirateChance(lane.to,{marines:true}):0;")],
    ["tribute ignores the wages taken first", PAGE.replace("Math.min(Math.max(0,state.cash-VESSELS[state.vesselKey].upkeep*computeTransit(lane).months),75)", "Math.min(Math.max(0,state.cash),75)")],
    ["warning consumes a draw", PAGE.replace("const paintPirateWarning=()=>{", "const paintPirateWarning=()=>{Math.random();")],
  ]) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    assert.ok(pirateRun(page).problems.length > 0 || thresholdRun(page).problems.length > 0 || tributeRun(page).problems.length > 0, `${name}: the check should fail`);
  }
});

test("the checks fail on planted defects", () => {
  const plants = [
    ["best month off by one", PAGE.replace("return {lane,options,now:options[0],best,fastest,year,", "return {lane,options,now:options[0],best:options[Math.min(options.indexOf(best)+1,options.length-1)],fastest,year,"), "card"],
    ["wait cost leaves out port fees", PAGE.replace("<dd>${cost.crewWages+cost.portFees} D (wages", "<dd>${cost.crewWages} D (wages"), "card"],
    ["card consumes a draw", PAGE.replace("const paintDecision=()=>{", "const paintDecision=()=>{Math.random();"), "card"],
    ["calendar one month late", PAGE.replace("const months=MONTHS.map((_,m)=>{const c=computeTransit(lane,m);", "const months=MONTHS.map((_,m)=>{const c=computeTransit(lane,m+1);"), "card"],
    ["explanation blames bad luck on the choice", PAGE.replace("luck.push(v.turnedBack?`the turn-back draw went against you`", "luck.push(v.turnedBack?`the turn-back draw went against you, because sailing into a headwind was the wrong decision`"), "explain"],
    ["explanation calls a storm the result of the choice", PAGE.replace("luck.push(v.storm?`the ${stormName(v.from,v.to)} came", "luck.push(v.storm?`a bad decision: the ${stormName(v.from,v.to)} came"), "explain"],
    ["explanation reads the season one month late", PAGE.replace("in ${seasonWord(v.departed)}: ${word.toLowerCase()}", "in ${seasonWord(v.departed+1)}: ${word.toLowerCase()}"), "explain"],
    ["Predictable and Luck swapped", PAGE.replace("s.push(`Predictable: ${predictable.join('; ')}. Luck: ${luck.join(', and ')}.`)", "s.push(`Predictable: ${luck.join(', and ')}. Luck: ${predictable.join('; ')}.`)"), "explain"],
    ["explanation calls it a mistaken choice", PAGE.replace("luck.push(v.turnedBack?`the turn-back draw went against you`", "luck.push(v.turnedBack?`the turn-back draw went against you after a mistaken choice`"), "explain"],
    ["explanation calls it a poor decision", PAGE.replace("`Leaving when you did gave the earliest expected arrival.`", "`Leaving when you did gave the earliest expected arrival, after a poor decision.`"), "explain"],
    ["explanation calls it your own fault", PAGE.replace("luck.push(v.storm?`the ${stormName(v.from,v.to)} came", "luck.push(v.storm?`your own fault: the ${stormName(v.from,v.to)} came"), "explain"],
    ["fastest of the year taken from the campaign window", PAGE.replace("if(v.calc.days===y.c.days)s.push(", "if(f.w===v.departed)s.push("), "explain"],
    ["card's fastest of the year taken from the campaign window", PAGE.replace("const year=MONTHS.map((_,m)=>({m,c:computeTransit(lane,m)})).reduce((a,b)=>b.c.days<a.c.days?b:a);", "const year={m:fastest.w%12,c:fastest.c};"), "card"],
  ];
  for (const [name, page, which] of plants) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    const failed = which === "card" ? cardRun(page).problems.length > 0 : RUNS.some(run => explainRun(page, run.seed, run).problems.length > 0);
    assert.ok(failed, `${name}: the check should fail`);
  }
});
