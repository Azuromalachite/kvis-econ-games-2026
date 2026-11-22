// Model check: runs the game's own script headless under Node and asserts the
// numbers the repository records. Run it explicitly as described in tests/02/README.md.
//
//   node tests/02/review_model.cjs [game.html]   check, then print a summary
//   node tests/02/review_model.cjs --self-test   plant model changes; each must fail
//
// Asserted (each is recorded elsewhere, and a change that moves it must update
// both places in the same pull request):
//   - the pinned run (CONTRIBUTING.md, AGENTS.md): seed 12345, default plan, "Best land first" at each re-plan;
//   - an identical replay reproduces every harvest;
//   - changing a choice keeps the weather and changes the result;
//   - the welfare index equals the sum of its parts;
//   - each weather preset (WX_PRESETS, shown on the end screen): the default plan's food, deaths and the rules'
//     food effect on its seed; Hard's general plan and Extreme's best tested plan; Start uses the chosen preset;
//   - over seeds 1-80 with the default plan, under each re-plan choice: colonial food, the rules' food effect
//     (it falls in every game: the graded prediction), how the rules' GDP effect reads (shown, not graded),
//     and how often the two re-plan choices read differently (claim.game.grading_weather);
//   - which re-plan choice grows more depends on the board (claim.game.replan_dominance);
//   - the changing plan the end screen names beats the hindsight best on its recorded share of seeds.
//
// Every assertion is recorded and the check fails at the end with all of them, so the self-test can show that a
// planted change trips the assertion meant for it even when an earlier one (the pinned run) also fails.
//
// DOM stubs and disabled timers: this checks the model, not the page. It drives
// harvests the way the buttons do but skips the report screens, so it cannot
// see rendering, playback or milestone pop-ups.
// First written for the 2026-11-18 research review (docs/research-review-2026-11-18.md).
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');

const PINNED = [1764, 1411, 74, 52, 103, 109, 46, 73]; // food Inca, colonial; welfare; GDP index; % short
// Seeds 1-80, default plan, "Best land first": how the rules' GDP effect reads (shown, not graded).
const GDP_READS_1_80 = {stay: 75, rise: 5};
// Seeds 1-80, default plan: the two re-plan choices read the GDP effect differently on this many seeds.
const REPLAN_GDP_DISAGREE = 35;
// Seeds 1-80, default plan, mean colonial food (kcal a day, harvests 4-6) under each re-plan choice.
const MEAN_FOOD_1_80 = {best: 1385, shares: 1004};
// Seeds where keeping the shares grows more colonial food than best land first, by the board held before 1573.
const SHARES_WINS = {default: 0, '5/5/3/1 no chuño': 24};
// Seeds 1-80, default plan, best land first: GDP index points the rules cost apart from silver, and resettlement's
// part of it, to the nearest 0.5 (README, AGENTS.md, history-and-evidence.md: "about 6.5 … resettlement about 2.5").
const FIELD_LOSS_1_80 = {total: -6.5, resettlement: -2.5};
// The changing plan named on the end screen beats the hindsight-best fixed plan on this many of seeds 1-80, both judged
// the end screen's way (betterOutcome: hunger deaths, then food after 1573, then welfare).
const CHANGING_WINS = 53; // 42 until every tested plan planted late when hazy (2026-11-19); // 58 when judged on welfare alone; 40 before resilience counted the full 14 crews // 57 before terraces stopped counting as protection in their build year, then 52; 58 since resilience no longer rewards spreading
// The end screen's plan chosen in advance (ADVANCE_PLAN): best by betterOutcome on mean results over seeds 1-40, 41-80
// and 1-80; its mean welfare, colonial food and hunger deaths on seeds 1-80, and the seeds where it reaches 1,700 kcal.
const ADVANCE = {chosen: [true, true, true], w: 66.7, k2: 1585, deaths: 14.3, reach1700: 14}; // 65.3, 1550, 18.9, 21 before planting late (2026-11-19)
// The plan offered as chosen in advance, seeds 1-80: welfare must fall after 1573 as food does (the key message). Mean
// welfare Inca -> colonial and the seeds where it rises; it rose on 49 when resilience could max out with people hungry.
const ADVANCE_WELFARE = {inca: 73.5, colonial: 59.9, rises: 1, h4StrictlyBest: 0}; // 72.6 -> 58, 2 rises before planting late
// (until review 4: 73 -> 61.3 with 19 rises, and harvest 4 the advance plan's strictly best harvest on 48 seeds, because
// resilience counted protected crews against the crews left after the collapse rather than the community's 14)
// Quoted elsewhere and checked here (review round 3 found them unchecked):
// - Hard: the general plan's hunger deaths (intro, teaching guide "92 against 4", hard-mode doc);
// - Extreme: the fewest hunger deaths of any tested plan (intro "no tested plan avoids hunger", hard-mode doc ~130);
// - Standard: the plan chosen in advance keeps about 1,530 kcal (teaching guide);
// - the best of the 2,304 tested plans averages about 1,580 kcal after 1573 (end screen's success box);
// - the hindsight best, averaged over seeds 1-80 (claim.game.advance_plan);
// - the rules' food effect averaged over seeds 1-80 (README "about -480", hard-mode doc -479);
// - the README table of default-plan means (food to the nearest 5 kcal, welfare and GDP index to the nearest 1).
// (before every tested plan planted late when hazy, 2026-11-19: 4.1, 130.4, 1530, 1580; Hard's hazy years mostly bring rain)
const HARD_GENERAL_DEATHS = 10.5, EXTREME_MIN_DEATHS = 110.1, STANDARD_ADVANCE_FOOD = 1600, BEST_GRID_FOOD = 1620;
const HINDSIGHT = {deaths: 10.9, k2: 1599, w: 67.4, reach1700: 24}; // 16.3, 1561, 65.4, 22 before planting late
const RULES_FOOD_EFFECT_1_80 = -479;
const README_MEANS = {food: [1675, 1385], welfare: [64, 46], gdp: [102, 109]};
// Planting late (graduated from research experiment 3): ADVANCE_PLAN, seeds 1-80, mean hunger deaths when never late,
// always late, and late when the Pleiades rose hazy. Late when hazy must beat both, or the forecast has no use again.
const LATE_1_80 = {never: 18.9, always: 19.8, hazy: 14.3};
const REPLAN = 'best'; // the pinned run's re-plan choice

function load(html) {
  const m = html.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(m, 'no inline <script> in the game file');
  const code = m[1].replace(/\}\)\(\);\s*$/, `globalThis.game={get state(){return S}, fresh,rollYear,clampAlloc,harvest,nextYear,showTransition,showEnd,replaySame,settle,grow,crews,ZONES,shortShare,gi,dir,reportText,PLAY,replanTo,GDP_TOL,WX_PRESETS,simulatePlan,PLAN_GRID,applyGridPlan,collapseState,advanceState,P,ADVANCE_PLAN,betterOutcome};})();`);
  assert.notEqual(code, m[1], 'the game script no longer ends in })(); so the harness cannot reach the model');
  return code;
}

const nodes = new Map();
let WX_CHOICE = null; // the weather radio the stubbed page reports as checked
function node(id) {
  if (nodes.has(id)) return nodes.get(id);
  const handlers = {};
  const n = {id, style:{}, dataset:{}, hidden:false, disabled:false, innerHTML:'', textContent:'', value:'',
    classList:{add(){}, remove(){}, toggle(){}},
    addEventListener(e, f){(handlers[e] ||= []).push(f)}, setAttribute(){},
    insertAdjacentHTML(){}, insertAdjacentElement(){}, remove(){}, scrollIntoView(){}, focus(){},
    getBoundingClientRect(){return {width:1000, height:550, top:0, bottom:550}},
    getContext(){return new Proxy({}, {get:()=>()=>{}})},
    querySelectorAll(){return []}, querySelector(){return node('nested')},
    click(){for (const f of handlers.click || []) f({target:n}); if (n.onclick) n.onclick()},
  };
  nodes.set(id, n); return n;
}
function make(code, seed) {
  nodes.clear();
  const context = {console, URLSearchParams, location:{search: seed ? '?seed=' + seed : ''}, Math, JSON,
    performance:{now:()=>0}, requestAnimationFrame(){},
    setTimeout(){return 1}, clearTimeout(){}, setInterval(){return 1}, clearInterval(){},
    matchMedia:()=>({matches:true, addEventListener(){}}),
    ResizeObserver:class{observe(){}}, MutationObserver:class{observe(){}}, IntersectionObserver:class{observe(){}},
    getComputedStyle:()=>({position:'relative', getPropertyValue:()=>'#000000'}),
    devicePixelRatio:1, innerHeight:800,
    window:{scrollTo(){}, addEventListener(){}},
    navigator:{clipboard:{writeText:async()=>{}}},
    document:{getElementById:node, documentElement:{}, addEventListener(){}, querySelectorAll(){return []},
      querySelector(sel){ return /name=wx/.test(sel) ? (WX_CHOICE ? {value: WX_CHOICE} : null) : {value:'stay'}; },
      createElement:()=>node('el' + Math.random())}
  };
  vm.createContext(context); vm.runInContext(code, context, {timeout:30000}); return context.game;
}
// Play six harvests the way Next step does. kind: the choice at each re-plan. edit(g): changes the board before a harvest.
function finish(g, replay = false, edit, kind = REPLAN) {
  if (replay) g.replaySame(); else { g.state.phase = 'plan'; g.state.yr = g.rollYear(); g.clampAlloc(); }
  while (g.state.hist.length < 6) {
    if (edit) edit(g);
    g.harvest();
    if (g.state.year === 3) { g.showTransition(); node('go').click(); }
    else if (g.state.year < 6) g.nextYear();
    if (g.state.replan && !g.state.replan.kind) g.replanTo(kind);
  }
  g.showEnd();
  const h = g.state.hist, a = h.slice(0, 3), b = h.slice(3);
  const avg = (x, k) => x.reduce((s, r) => s + r[k], 0) / x.length;
  return {food:[avg(a,'intake'), avg(b,'intake')], welfare:[avg(a,'cwi'), avg(b,'cwi')],
    gdp:[g.gi(avg(a,'gdp')), g.gi(avg(b,'gdp'))],
    short:[...[a, b].map(x => x.reduce((s, r) => s + g.shortShare(r.avail), 0) / x.length * 100)],
    deaths:h.reduce((s, r) => s + Math.max(0, r.popBefore - r.pop), 0),
    ck:b.reduce((s, r) => s + r.intake - r.cf.intake, 0) / 3, cg:b.reduce((s, r) => s + r.gdp - r.cf.gdp, 0) / 3,
    // the rules' GDP effect apart from silver (index points): field output lost to the mita, wage crews and resettlement,
    // and resettlement's part of it, P·(H/rf − H)
    lostIdx:g.gi(b.reduce((s, r) => s + r.gdp - r.cf.gdp - r.silver, 0) / 3), resettleIdx:g.gi(b.reduce((s, r) => s + g.P * (r.H / r.rf - r.H), 0) / 3),
    weather:h.map(r => ({line:r.line, drought:r.drought, hazy:r.hazy, winter:r.winter})),
    history:JSON.parse(JSON.stringify(h))};
}
// A plan given harvest by harvest as grid plans, played the way the end screen's comparison plays them.
function playPlans(code, seed, planFor, lateFor = null) { // lateFor overrides the plans' own rule (plant late when hazy)
  const g = make(code, seed), S = () => g.state;
  S().phase = 'plan'; S().yr = g.rollYear(); g.clampAlloc();
  while (S().hist.length < 6) {
    g.applyGridPlan(planFor(S().year)); if (lateFor) S().plantLate = lateFor(S().yr); g.harvest();
    if (S().year === 3) { g.collapseState(); g.advanceState(); } else if (S().year < 6) g.advanceState();
  }
  const h = S().hist, a = h.slice(0, 3), b = h.slice(3);
  return {w: h.reduce((s, r) => s + r.cwi, 0) / 6, deaths: h.reduce((s, r) => s + Math.max(0, r.popBefore - r.pop), 0),
    k2: b.reduce((s, r) => s + r.intake, 0) / 3, w1: a.reduce((s, r) => s + r.cwi, 0) / 3, w2: b.reduce((s, r) => s + r.cwi, 0) / 3, ws: h.map(r => r.cwi)};
}
const BOARD_5531 = g => { if (g.state.year <= 3) { Object.assign(g.state.alloc, {yunga:5, quechua:5, suni:3, puna:1}); g.state.chuno = 0; g.state.wage = 0; g.clampAlloc(); } };
const GENERAL = {build:['yunga'], incaChuno:1, incaRule:'best', colChuno:0, wage:0, colRule:'best'};
const CHANGING = y => ({build:['yunga', 'quechua'], incaChuno: y === 1 ? 0 : 3, incaRule:'best', colChuno:0, wage:0, colRule:'best'});
const r1 = v => Math.round(v * 10) / 10;

function check(html, {heavy = true} = {}) {
  const code = load(html), fails = [];
  const soft = f => { try { f(); } catch (e) { fails.push(e.message); } };
  const g = make(code, 12345), first = finish(g), replay = finish(g, true);
  soft(() => assert.deepEqual(replay.history, first.history, 'an identical replay must reproduce every harvest'));
  const pinned = [...first.food, ...first.welfare, ...first.gdp, ...first.short].map(Math.round);
  soft(() => assert.deepEqual(pinned, PINNED, 'pinned run (seed 12345, default plan) moved: update tests/02/README.md and PINNED together'));
  const edited = finish(g, true, x => { if (x.state.year === 1) { x.state.alloc.suni -= 1; x.state.chuno += 1; } });
  soft(() => assert.deepEqual(edited.weather, first.weather, 'changing a choice must not change the weather'));
  soft(() => assert.notDeepEqual(edited.history, first.history, 'changing a choice must change the result'));
  for (const r of first.history) soft(() => assert.ok(Math.abs(r.cwi - r.cwiParts.cal - r.cwiParts.buf - r.cwiParts.res) < 1e-8, 'welfare index must equal the sum of its parts'));

  // Weather presets: the end screen's yardstick for each, and the Start button's use of the choice.
  const presets = JSON.parse(JSON.stringify(g.WX_PRESETS)), presetOut = {};
  for (const [key, p] of Object.entries(presets)) {
    const t = finish(make(code, p.seed));
    presetOut[key] = {k2: r1(t.food[1]), deaths: r1(t.deaths), ck: Math.round(t.ck)};
    soft(() => assert.deepEqual(presetOut[key], p.def, `weather preset ${key} (seed ${p.seed}) benchmark moved: re-run tools/seeds.html and update WX_PRESETS and docs/hard-mode-2026-11-18.md together`));
  }
  const gen = playPlans(code, presets.hard.seed, () => GENERAL);
  soft(() => assert.equal(r1(gen.deaths), HARD_GENERAL_DEATHS, `weather preset hard: the general plan lost ${r1(gen.deaths)} people, recorded ${HARD_GENERAL_DEATHS}; the intro says careful planning saves many lives: update HARD_GENERAL_DEATHS, the teaching guide and docs/hard-mode-2026-11-18.md`));
  const stdAdv = playPlans(code, presets.standard.seed, () => g.ADVANCE_PLAN);
  soft(() => assert.equal(Math.round(stdAdv.k2 / 10) * 10, STANDARD_ADVANCE_FOOD, `on Standard the plan chosen in advance keeps ${Math.round(stdAdv.k2)} kcal, recorded about ${STANDARD_ADVANCE_FOOD}: update the teaching guide and STANDARD_ADVANCE_FOOD`));
  if (heavy) {
    const ge = make(code, presets.extreme.seed);
    const minDeaths = Math.min(...ge.PLAN_GRID.map(p => ge.simulatePlan(presets.extreme.seed, p).deaths));
    soft(() => assert.equal(r1(minDeaths), EXTREME_MIN_DEATHS, `weather preset extreme: the fewest hunger deaths of any tested plan is ${r1(minDeaths)}, recorded ${EXTREME_MIN_DEATHS}; the intro says no tested plan avoids hunger: update EXTREME_MIN_DEATHS and docs/hard-mode-2026-11-18.md`));
    presetOut.extremeMinDeaths = r1(minDeaths);
  }
  for (const key of ['hard', 'extreme']) soft(() => {
    WX_CHOICE = key; const gs = make(code, 0);
    try { node('start').click(); } finally { WX_CHOICE = null; }
    assert.deepEqual({seed: gs.state.seed, mode: gs.state.mode}, {seed: presets[key].seed, mode: key}, `weather choice ${key}: Start did not use the chosen preset`);
  });

  // Seeds 1-80, default plan, under each re-plan choice.
  const runs = {best: [], shares: []};
  for (let seed = 1; seed <= 80; seed++) for (const kind of ['best', 'shares']) runs[kind].push(finish(make(code, seed), false, null, kind));
  const reads = k => runs[k].map(t => g.dir(0, t.cg, g.GDP_TOL));
  const counts = {}; for (const x of reads('best')) counts[x] = (counts[x] || 0) + 1;
  soft(() => assert.deepEqual(counts, GDP_READS_1_80, 'GDP effect reading split over seeds 1-80 moved (shown, not graded): update claim.game.grading_weather, README and GDP_READS_1_80 together'));
  const disagree = reads('best').filter((x, i) => x !== reads('shares')[i]).length;
  soft(() => assert.equal(disagree, REPLAN_GDP_DISAGREE, `the two re-plan choices read the GDP effect differently on ${disagree} of 80 seeds, recorded ${REPLAN_GDP_DISAGREE}: update claim.game.grading_weather, the end screen and REPLAN_GDP_DISAGREE`));
  const foodFalls = Object.fromEntries(Object.entries(runs).map(([k, ts]) => [k, ts.filter(t => g.dir(0, t.ck, 50) === 'fall').length]));
  soft(() => assert.deepEqual(foodFalls, {best: 80, shares: 80}, 'the rules\' food effect must fall in every game under both re-plans (the graded prediction rests on it)'));
  const half = v => Math.round(v * 2) / 2, mb = k => runs.best.reduce((s, t) => s + t[k], 0) / runs.best.length;
  const fieldLoss = {total: half(mb('lostIdx')), resettlement: half(-mb('resettleIdx'))};
  soft(() => assert.deepEqual(fieldLoss, FIELD_LOSS_1_80, 'field output lost to the mita and resettlement moved: update the current Week 2 explanations and FIELD_LOSS_1_80'));
  const meanFood = Object.fromEntries(Object.entries(runs).map(([k, ts]) => [k, Math.round(ts.reduce((s, t) => s + t.food[1], 0) / ts.length)]));
  soft(() => assert.deepEqual(meanFood, MEAN_FOOD_1_80, 'mean colonial food by re-plan choice moved: update the assumptions list, README, claim.game.crew_trim_order and MEAN_FOOD_1_80'));

  // Which re-plan choice grows more depends on the board held before 1573.
  const sharesWins = {default: runs.shares.filter((t, i) => t.food[1] > runs.best[i].food[1]).length};
  let w5531 = 0;
  for (let seed = 1; seed <= 80; seed++) if (finish(make(code, seed), false, BOARD_5531, 'shares').food[1] > finish(make(code, seed), false, BOARD_5531, 'best').food[1]) w5531++;
  sharesWins['5/5/3/1 no chuño'] = w5531;
  soft(() => assert.deepEqual(sharesWins, SHARES_WINS, 're-plan dominance by board moved: update claim.game.replan_dominance, the docs and SHARES_WINS'));

  // The changing plan the end screen names, against the best fixed plan picked after the weather is known.
  // The plan offered as chosen in advance loses welfare after 1573, as food falls (claim.game.welfare_index).
  // ...and its first colonial harvest is never strictly its best one (it may tie an Inca harvest: fed, with the stores
  // carried across the 70 years)
  let aw = {inca: 0, colonial: 0, rises: 0, h4StrictlyBest: 0};
  for (let seed = 1; seed <= 80; seed++) { const t = playPlans(code, seed, () => g.ADVANCE_PLAN); aw.inca += t.w1 / 80; aw.colonial += t.w2 / 80; if (t.w2 > t.w1) aw.rises++;
    if (t.ws[3] > Math.max(...t.ws.filter((_, i) => i !== 3)) + 0.5) aw.h4StrictlyBest++; }
  aw = {inca: r1(aw.inca), colonial: r1(aw.colonial), rises: aw.rises, h4StrictlyBest: aw.h4StrictlyBest};
  soft(() => assert.ok(aw.h4StrictlyBest <= 8, `harvest 4 (c. 1575) is the advance plan's best harvest on ${aw.h4StrictlyBest} of 80 seeds: life looks best just after the mita and the collapse`));
  soft(() => assert.deepEqual(aw, ADVANCE_WELFARE, 'the advance plan\'s welfare across 1573 moved: it must fall as food falls; update ADVANCE_WELFARE and claim.game.welfare_index'));
  soft(() => assert.ok(aw.colonial < aw.inca - 5, `the advance plan's welfare does not fall after 1573 (${aw.inca} -> ${aw.colonial}), while food does: the welfare index contradicts the key message`));

  // Planting late: late when hazy must beat both always and never by 2 deaths (research experiment 3's margin)
  const late = {};
  for (const [k, f] of Object.entries({never: () => false, always: () => true, hazy: yr => yr.hazy}))
    late[k] = r1([...Array(80).keys()].reduce((s, i) => s + playPlans(code, i + 1, () => g.ADVANCE_PLAN, f).deaths, 0) / 80);
  soft(() => assert.ok(late.hazy <= late.never - 2 && late.hazy <= late.always - 2, `plant late: late when hazy lost ${late.hazy} against never ${late.never} and always ${late.always}; the forecast no longer pays`));
  soft(() => assert.deepEqual(late, LATE_1_80, 'plant late: deaths by planting policy moved: update claim.game.plant_late_costs, research/results and LATE_1_80'));

  // The plan the end screen offers as one chosen in advance: the grid's best by mean welfare on seeds 1-40, on 41-80
  // and on 1-80, scored on each weather (claim.game.advance_plan).
  let changingWins = null, advance = null;
  if (heavy) {
    changingWins = 0;
    const grid = g.PLAN_GRID, W = [], K = [], D = [];
    for (let seed = 1; seed <= 80; seed++) {
      const gg = make(code, seed), res = grid.map(p => gg.simulatePlan(seed, p));
      W.push(res.map(r => r.w)); K.push(res.map(r => r.k2)); D.push(res.map(r => r.deaths));
      const best = res.reduce((b, r) => g.betterOutcome(r, b) ? r : b);
      if (g.betterOutcome(playPlans(code, seed, CHANGING), best)) changingWins++;
    }
    soft(() => assert.equal(changingWins, CHANGING_WINS, `the changing plan beat the hindsight best on ${changingWins} of 80 seeds, recorded ${CHANGING_WINS}: update the end screen, claim.game.changing_plan and CHANGING_WINS`));
    const mean = (A, j, a, b) => { let t = 0; for (let s = a; s <= b; s++) t += A[s - 1][j]; return t / (b - a + 1); };
    const at = (j, a, b) => ({deaths: mean(D, j, a, b), k2: mean(K, j, a, b), w: mean(W, j, a, b)});
    const pick = (a, b) => { let bj = 0; grid.forEach((_, j) => { if (g.betterOutcome(at(j, a, b), at(bj, a, b))) bj = j; }); return bj; };
    const key = p => JSON.stringify(p), aj = grid.findIndex(p => key(p) === key(g.ADVANCE_PLAN));
    advance = {chosen: [pick(1, 40), pick(41, 80), pick(1, 80)].map(j => j === aj),
      w: r1(W.reduce((s, w) => s + w[aj], 0) / 80), k2: Math.round(K.reduce((s, k) => s + k[aj], 0) / 80), deaths: r1(D.reduce((s, d) => s + d[aj], 0) / 80), reach1700: K.filter(k => k[aj] >= 1700).length};
    soft(() => assert.deepEqual(advance, ADVANCE, 'the advance plan is no longer the best chosen on seeds 1-40, 41-80 and 1-80, or its record moved: update ADVANCE_PLAN, claim.game.advance_plan and ADVANCE'));
    // the hindsight best on each weather (the end screen's rule), averaged over seeds 1-80
    const hb = Array.from({length: 80}, (_, s) => grid.reduce((bj, _p, j) => g.betterOutcome({deaths: D[s][j], k2: K[s][j], w: W[s][j]}, {deaths: D[s][bj], k2: K[s][bj], w: W[s][bj]}) ? j : bj, 0));
    const hindsight = {deaths: r1(hb.reduce((t, j, s) => t + D[s][j], 0) / 80), k2: Math.round(hb.reduce((t, j, s) => t + K[s][j], 0) / 80),
      w: r1(hb.reduce((t, j, s) => t + W[s][j], 0) / 80), reach1700: hb.filter((j, s) => K[s][j] >= 1700).length};
    soft(() => assert.deepEqual(hindsight, HINDSIGHT, 'the hindsight best\'s record over seeds 1-80 moved: update claim.game.advance_plan and HINDSIGHT'));
    const bestGridFood = Math.max(...grid.map((_, j) => mean(K, j, 1, 80)));
    soft(() => assert.equal(Math.round(bestGridFood / 10) * 10, BEST_GRID_FOOD, `the best tested plan averages ${Math.round(bestGridFood)} kcal after 1573, the end screen says about ${BEST_GRID_FOOD}: update both`));
    presetOut.hindsight = hindsight; presetOut.bestGridFood = Math.round(bestGridFood);
  }

  const mean = k => [0, 1].map(i => runs.best.reduce((s, t) => s + t[k][i], 0) / runs.best.length);
  const ckMean = Math.round(runs.best.reduce((s, t) => s + t.ck, 0) / runs.best.length);
  soft(() => assert.equal(ckMean, RULES_FOOD_EFFECT_1_80, `the rules' food effect averages ${ckMean} kcal over seeds 1-80, recorded ${RULES_FOOD_EFFECT_1_80}: update README, docs/hard-mode-2026-11-18.md and RULES_FOOD_EFFECT_1_80`));
  const readme = {food: mean('food').map(v => Math.round(v / 5) * 5), welfare: mean('welfare').map(Math.round), gdp: mean('gdp').map(Math.round)};
  soft(() => assert.deepEqual(readme, README_MEANS, 'the README table of default-plan means moved: update README.md and README_MEANS'));
  if (fails.length) throw new assert.AssertionError({message: fails.join('\n')});
  return {pinned, presets: presetOut, hard_general_plan: {deaths: r1(gen.deaths), w: r1(gen.w)}, gdp_reads_1_80: counts, replan_gdp_disagree: disagree,
    advance_plan: advance, advance_welfare: aw, food_falls: foodFalls, mean_colonial_food: meanFood, field_loss: {total: r1(mb('lostIdx')), resettlement: r1(-mb('resettleIdx'))}, shares_wins: sharesWins, changing_wins: changingWins,
    plant_late_1_80: late, means_1_80_best_land:{food:mean('food'), welfare:mean('welfare'), gdp:mean('gdp')}};
}

// The pinned display contract and mean table live in tests/02/README.md.
const fmtK = n => n.toLocaleString('en-US');
// as the end screen shows it: food to the nearest 10 kcal, household shares to the nearest 5%
const r10 = v => Math.round(v / 10) * 10, r5 = v => Math.round(v / 5) * 5;
const pinnedLine = p => `${fmtK(r10(p[0]))} kcal | ${fmtK(r10(p[1]))} kcal | ${p[2]} → ${p[3]} | ${p[4]} | ${p[5]} | ${r5(p[6])}% → ${r5(p[7])}%`;
function checkDocs(pinned, texts) {
  for (const [name, text] of Object.entries(texts))
    assert.ok(text.includes('`' + pinnedLine(pinned) + '`'), `${name} does not quote the pinned run ${pinnedLine(pinned)}`);
}
const docTexts = () => ({'tests/02/README.md': fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8')});
function checkReadme(m, text) {
  const k = v => '~' + v.toLocaleString('en-US');
  for (const row of [`| ${k(m.food[0])} kcal | ${k(m.food[1])} kcal |`, `| ${k(m.welfare[0])} | ${k(m.welfare[1])} |`, `| ${k(m.gdp[0])} | ${k(m.gdp[1])} |`])
    assert.ok(text.includes(row), `tests/02/README.md's table of default-plan means does not quote ${row}`);
}
const readmeText = () => fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');

// Each planted change must make check() fail, with every expected assertion among the failures.
// The last field (heavy) also runs the slow checks (the 2,304-plan grid), needed only by the plants that target them.
const PLANTS = [
  ['tribute raised (a model constant)', 'TRIB_PP = 500', 'TRIB_PP = 520', [/pinned run/]],
  // planting late made worthless: a late planting loses as much in a dry year and costs nothing in a normal one
  ['late planting does nothing', 'const LATE_DRY = .90, LATE_NORMAL = .95;', 'const LATE_DRY = .75, LATE_NORMAL = 1;', [/plant late: late when hazy/]],
  // Frost almost never reaches the fields. (A first version moved .15 to .25,
  // which seed 12345 happens never to draw, so it tested nothing.)
  ['frost odds changed (the weather)', 'const line = r < .15 ? 4', 'const line = r < .95 ? 4', [/pinned run/]],
  ['winter roll removed', "winter = w < .25 ? 'hard' : w < .75 ? 'normal' : 'mild'", "winter = 'normal'", [/pinned run/]],
  // the tolerance moves only how the GDP effect reads, not the pinned numbers
  ['GDP tolerance changed', 'const GDP_TOL = 12.5;', 'const GDP_TOL = 2.5;', [/reading split/]],
  // a preset pointing at another seed must fail on its benchmark, not slip through to the end screen
  ['Hard preset seed changed', 'hard:     {seed: 313,', 'hard:     {seed: 314,', [/weather preset hard \(seed/, /the general plan lost/]],
  ['Extreme preset seed changed', 'extreme:  {seed: 2024,', 'extreme:  {seed: 2025,', [/weather preset extreme \(seed/, /fewest hunger deaths of any tested plan/], true],
  // Start ignoring the radio: the seed stays random
  ['Start ignores the weather choice', 'if (WX_PRESETS[wx]) S.seed = WX_PRESETS[wx].seed;', 'if (WX_PRESETS[wx]) S.seed = S.seed;', [/weather choice hard/]],
  // "Keep the same shares" silently doing best land first: no board then does better by keeping its shares,
  // and the two choices always read GDP the same way
  ['re-plan choices merged', "  setCounts(kind === 'best' ? bestLandFirst(S.replan.B) : keepShares(S.replan.from, S.replan.B));\n  S.replan.kind = kind;", "  setCounts(bestLandFirst(S.replan.B));\n  S.replan.kind = kind;", [/re-plan dominance/, /read the GDP effect differently/]],
  // tribute paid TO the community: food then rises under the colonial rules, and the changing plan's record moves
  ['tribute reversed', 'const tribute = a2 ? Math.min(', 'const tribute = a2 ? -0.3 * H + 0 * Math.min(', [/food effect must fall/, /mean colonial food/, /changing plan/], true],
  // no resettlement loss: the field output the rules cost apart from silver shrinks by its resettlement part
  ['resettlement removed', 'const REDUC_BY_HARVEST = {4: 0.93, 5: 0.88, 6: 0.85};', 'const REDUC_BY_HARVEST = {4: 1, 5: 1, 6: 1};', [/field output lost/]],
  // the end screen offering a plan that is not the one chosen on the test weathers
  ['advance plan changed', "const ADVANCE_PLAN = {build: ['yunga'], incaChuno: 1,", "const ADVANCE_PLAN = {build: ['yunga'], incaChuno: 2,", [/advance plan/], true],
  // terraces counted as protection in the year they are built again: the changing plan's record moves
  // resilience maxing out for survivors on terraced land however hungry they are: welfare stops falling after 1573
  ['resilience ignores the stores', 'res: 20 * protShare * Math.min(1, (S.store / GOAL * 365) / 90)', 'res: 20 * protShare', [/advance plan's welfare across 1573 moved/]],
  // protection as a share of the crews left: survivors crowded onto terraces score as fully protected again
  ['resilience against the crews left', '0) / BASE_CREWS;', '0) / Math.max(1, farm);', [/best harvest on/]],
  // (welfare only: since plans are ranked by deaths first it no longer moves the changing plan's count)
  ['terraces protect a year early', "builtBefore[z.key] && z.build ? S.alloc[z.key] : 0", "S.built[z.key] && z.build ? S.alloc[z.key] : 0", [/advance plan's welfare across 1573 moved/, /advance plan is no longer the best/], true],
];
function selfTest(html) {
  check(html); // the unplanted game must pass first, or a failure below proves nothing
  for (const [name, from, to, expect, heavy = false] of PLANTS) {
    assert.ok(html.includes(from), `self-test plant drifted: ${JSON.stringify(from)} not in the game`);
    let err = null;
    try { check(html.replace(from, to), {heavy}); } catch (e) { err = e; }
    assert.ok(err, `self-test: the check passed a planted change (${name})`);
    for (const re of expect) assert.match(String(err.message), re, `self-test: ${name} did not trip ${re}: ${err.message}`);
    console.log(`caught: ${name}`);
  }
  let docErr = null;
  // +10 kcal: the docs quote food to the nearest 10, so a 1-kcal plant would round away and test nothing
  try { checkDocs(PINNED.map((v, i) => i === 1 ? v + 10 : v), docTexts()); } catch (e) { docErr = e; }
  assert.ok(docErr && /does not quote the pinned run/.test(docErr.message), 'self-test: a pinned line that differs from the docs was not caught');
  console.log('caught: docs quoting a different pinned run');
  let rmErr = null;
  try { checkReadme({...README_MEANS, welfare: [README_MEANS.welfare[0] + 1, README_MEANS.welfare[1]]}, readmeText()); } catch (e) { rmErr = e; }
  assert.ok(rmErr && /does not quote/.test(rmErr.message), 'self-test: a README table that differs from the model was not caught');
  console.log('caught: README quoting different means');
  console.log(`confirmed: all ${PLANTS.length} planted model changes and the docs mismatch are rejected`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--')) || path.join(__dirname, '..', '..', 'projects', '02', 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  if (args.includes('--self-test')) selfTest(html);
  else { checkDocs(PINNED, docTexts()); checkReadme(README_MEANS, readmeText()); console.log(JSON.stringify({commit:process.env.GITHUB_SHA || 'local', ...check(html)}, null, 2)); }
}
module.exports = {load, make, finish, check};
