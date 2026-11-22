// Part C of research/03/pre-registrations/2026-11-22-economy-skeleton-m3-m4.md:
// validation of the economy skeleton against the real engine.
//
//   node research/03/models/economy-skeleton-partc.mjs
//
// Run after economy_skeleton.py, which writes the action plans this replays.
// Uses tests/03/engine/load-engine.mjs: the game's own inline script, unchanged,
// with every Math.random draw scripted. Writes partc.json beside the skeleton's
// outputs. ECON_111ACDC_INDEX=<path to 111acdc index.html> adds the source
// comparison of the protected functions in step 1.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEngine, DEFAULT_INDEX, engineScript } from "../../../tests/03/engine/load-engine.mjs";

const at = p => fileURLToPath(new URL(p, import.meta.url));
const PARAMS = JSON.parse(readFileSync(at("./economy-skeleton-params.json"), "utf8"));
const OUT = at("../results/2026-11-22-economy-skeleton/");
const PLANS = JSON.parse(readFileSync(OUT + "partc-plans.json", "utf8"));
const report = { engine: DEFAULT_INDEX, steps: {} };

// --- step 1: parameter identity ------------------------------------------------
{
  const e = loadEngine();
  const diffs = [];
  const eq = (path, a, b) => { if (a !== b) diffs.push({ path, engine: a, params: b }); };
  for (const [k, v] of Object.entries(PARAMS.vessels)) {
    const V = e.VESSELS[k];
    eq(`vessels.${k}.capacity`, V.capacity, v.capacity); eq(`vessels.${k}.speed`, V.speed, v.speed);
    eq(`vessels.${k}.alpha`, V.agility, v.alpha); eq(`vessels.${k}.wages`, V.upkeep, v.wages);
    eq(`vessels.${k}.damageMult`, V.stormResist, v.damageMult);
  }
  eq("vessels.keys", Object.keys(e.VESSELS).join(), Object.keys(PARAMS.vessels).join());
  for (const [k, d] of Object.entries(PARAMS.difficulties)) {
    const D = e.DIFFICULTIES[k];
    eq(`difficulties.${k}.cash`, D.cash, d.cash); eq(`difficulties.${k}.debt`, D.debt, d.debt);
    eq(`difficulties.${k}.damageMult`, D.stormMult, d.damageMult); eq(`difficulties.${k}.feeMult`, D.layoverMult, d.feeMult);
  }
  eq("difficulties.keys", Object.keys(e.DIFFICULTIES).join(), Object.keys(PARAMS.difficulties).join());
  for (const [k, p] of Object.entries(PARAMS.ports)) {
    const P = e.PORTS[k];
    eq(`ports.${k}.tariff`, P.tariff, p.tariff); eq(`ports.${k}.fee`, P.layoverBase, p.fee); eq(`ports.${k}.piracy`, P.piracyRisk, p.piracy);
    // waitInPort reads "+25 D", then "+20 D", then "+15 D", and "+8% Hull", in that order.
    const cash = P.vignettes.map(s => s.includes("+25 D") ? 25 : s.includes("+20 D") ? 20 : s.includes("+15 D") ? 15 : 0);
    const hull = P.vignettes.map(s => s.includes("+8% Hull") ? 8 : 0);
    eq(`ports.${k}.storyCash`, cash.join(), p.storyCash.join()); eq(`ports.${k}.storyHull`, hull.join(), p.storyHull.join());
  }
  eq("ports.keys", Object.keys(e.PORTS).join(), Object.keys(PARAMS.ports).join());
  eq("lanes", JSON.stringify(e.SEA_LANES), JSON.stringify(PARAMS.lanes));
  eq("goods.order", e.COMMODITIES.map(c => c.id).join(), Object.keys(PARAMS.goods).join());
  for (const c of e.COMMODITIES) {
    const g = PARAMS.goods[c.id];
    eq(`goods.${c.id}.weight`, c.weight, g.weight); eq(`goods.${c.id}.category`, c.category, g.category);
    eq(`goods.${c.id}.prices`, JSON.stringify(c.prices), JSON.stringify(g.prices));
  }
  eq("campaignMonths", e.CAMPAIGN_MONTHS, PARAMS.campaignMonths);

  // Source identity of the protected functions against 111acdc, if given.
  let source = null;
  if (process.env.ECON_111ACDC_INDEX) {
    const grab = (src, name) => {
      const m = new RegExp(`(?:const|function) ${name}\\b`).exec(src);
      let i = m.index, k;
      if (src.startsWith("function", i)) {          // body brace: the first "{" after the parameter list closes
        let depth = 0, j = src.indexOf("(", i);
        for (; j < src.length; j++) { if (src[j] === "(") depth++; else if (src[j] === ")" && --depth === 0) break; }
        k = src.indexOf("{", j);
      } else {
        const a = src.indexOf("{", i), b = src.indexOf("[", i);
        k = b >= 0 && (a < 0 || b < a) ? b : a;
      }
      const open = src[k], close = open === "{" ? "}" : "]";
      for (let d = 0, j = k; j < src.length; j++) {
        if (src[j] === open) d++; else if (src[j] === close && --d === 0) return src.slice(i, j + 1);
      }
    };
    const norm = s => s.replace(/\r\n/g, "\n");
    const a = norm(engineScript(readFileSync(process.env.ECON_111ACDC_INDEX, "utf8")));
    const b = norm(engineScript(readFileSync(DEFAULT_INDEX, "utf8")));
    const names = ["PORTS", "SEA_LANES", "COMMODITIES", "VESSELS", "DIFFICULTIES", "getWindState", "getLivePortPrice",
      "getEffectiveTariff", "getEffectiveLayoverFee", "computeTransit", "buyCargoQty", "sellCargoQty", "waitInPort",
      "sailTo", "advanceTime", "getMutinyRisk", "finishCampaign", "repairHull"];
    source = Object.fromEntries(names.map(n => [n, grab(a, n) === grab(b, n) ? "identical" : "differs"]));
    // finishCampaign's money lines: liquidation and debt.
    const money = s => grab(s, "finishCampaign").split("\n").filter(l => /liquidationTotal|state\.cash|state\.debt|getLivePortPrice|state\.cargo/.test(l)).map(l => l.trim()).join("\n");
    source.finishCampaignMoneyLines = money(a) === money(b) ? "identical" : "differs";
  }
  report.steps.step1 = { pass: diffs.length === 0, differences: diffs, protectedSourceVs111acdc: source };
}

// --- replay helper ----------------------------------------------------------------
function replay(plan, vessel, difficulty) {
  const e = loadEngine().start({ mode: "play", vessel, difficulty, port: "calicut" });
  const rows = [];
  for (const a of plan) {
    e.rng.push(...a.draws);
    if (a.kind === "sell") e.g.sellCargoQty(a.good, a.qty);
    else if (a.kind === "buy") e.g.buyCargoQty(a.good, a.qty);
    else if (a.kind === "repair") e.g.repairHull();
    else if (a.kind === "wait") e.g.waitInPort();
    else if (a.kind === "sail") e.g.sailTo(a.dest);
    const s = e.state;
    rows.push({
      kind: a.kind, dest: a.dest ?? null,
      engine: { cash: s.cash, month: s.monthIndex, port: s.currentPort, debt: s.debt, hull: s.hull, ended: s.ended },
      skeleton: { cash: a.cash, month: a.month, port: a.port, debt: a.debt, hull: a.hull, ended: a.ended },
      drawsLeft: e.rng.remaining
    });
    e.rng.queue.length = 0;
  }
  return { rows, net: e.state.cash - e.state.startEquity, ended: e.state.ended };
}
const same = r => r.engine.cash === r.skeleton.cash && r.engine.month === r.skeleton.month &&
  r.engine.port === r.skeleton.port && r.engine.debt === r.skeleton.debt && r.engine.ended === r.skeleton.ended && r.drawsLeft === 0;

// --- step 2: hazard-free path, exact -----------------------------------------------
{
  const cases = PLANS.rhPlans.map(p => {
    const r = replay(p.actions, p.vessel, p.difficulty);
    const bad = r.rows.map((x, i) => ({ i, ...x })).filter(x => !same(x));
    const arrivals = r.rows.filter(x => x.kind === "sail");
    return {
      vessel: p.vessel, difficulty: p.difficulty, policy: p.policy, cycle: p.cycle, actions: r.rows.length,
      arrivals: arrivals.length, arrivalsEqual: arrivals.filter(same).length, skeletonNet: p.net, engineNet: r.net,
      ended: r.ended, firstMismatch: bad[0] ?? null
    };
  });
  report.steps.step2 = { pass: cases.every(c => c.firstMismatch === null && c.ended && c.skeletonNet === c.engineNet), cases };
}

// --- step 3: forced turn-back ---------------------------------------------------------
{
  const cases = [];
  for (const vessel of ["dhow", "junk"]) {
    const e = loadEngine().start({ mode: "play", vessel, difficulty: "normal", port: "aden" });
    const calc = e.g.computeTransit(e.lane("aden", "calicut"));    // January: a headwind
    e.g.buyCargoQty("ivory", 5);
    const before = { cash: e.state.cash, ivory: e.state.cargo.ivory, month: e.state.monthIndex };
    e.rng.push(0.5, 0.3);                                          // damage; turned back (< 0.35)
    e.g.sailTo("calicut");
    const s = e.state;
    const ok = calc.isHeadwind && e.rng.remaining === 0 && s.currentPort === "aden" && s.cargo.ivory === before.ivory &&
      s.monthIndex === before.month + calc.months && s.cash === before.cash - calc.months * e.VESSELS[vessel].upkeep;
    cases.push({ vessel, headwind: calc.isHeadwind, monthsCharged: s.monthIndex - before.month, transitMonths: calc.months,
      wagesCharged: before.cash - s.cash, cargoKept: s.cargo.ivory === before.ivory, port: s.currentPort, pass: ok });
  }
  report.steps.step3 = { pass: cases.every(c => c.pass), cases };
}

// --- step 4: hull has no cash effect ---------------------------------------------------
{
  const cases = PLANS.hullPlans.map(p => {
    const lo = replay(p.least, p.vessel, p.difficulty), hi = replay(p.most, p.vessel, p.difficulty);
    const n = Math.min(lo.rows.length, hi.rows.length);
    let firstDiff = null;
    for (let i = 0; i < n; i++) if (lo.rows[i].engine.cash !== hi.rows[i].engine.cash) { firstDiff = i; break; }
    const minHull = Math.min(...hi.rows.map(r => r.engine.hull));
    return {
      vessel: p.vessel, difficulty: p.difficulty, cycle: p.cycle, actions: [lo.rows.length, hi.rows.length],
      headwindVoyages: lo.rows.filter(r => r.kind === "sail").length, lowestHullMostDamage: minHull,
      replayMatchesSkeleton: lo.rows.every(same) && hi.rows.every(same),
      cashIdentical: lo.rows.length === hi.rows.length && firstDiff === null, firstDiff, net: [lo.net, hi.net]
    };
  });
  report.steps.step4 = { pass: cases.every(c => c.cashIdentical && c.replayMatchesSkeleton), cases };
}

// --- step 5: expected months, stochastic ---------------------------------------------
function mulberry32(seed) {                      // as tests/03/baseline-harness.js
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
{
  const csv = readFileSync(OUT + "q2-cells-level0.csv", "utf8").trim().split("\n");
  const head = csv[0].split(",");
  const cells = csv.slice(1).map(l => Object.fromEntries(l.split(",").map((x, i) => [head[i], x])))
    .filter(c => c.headwind === "True");
  const N = 2000, SEEDS = Array.from({ length: N }, (_, i) => 100001 + i);
  const e = loadEngine().start({ mode: "play", vessel: "dhow", difficulty: "normal", port: "calicut" });
  e.g.renderAll = () => {};                      // display only, as economySweep does
  const zero = () => ({ teak: 0, porcelain: 0, textiles: 0, pepper: 0, cloves: 0, ivory: 0 });
  const results = [];
  for (const c of cells) {
    const t0 = Number(c.t), nav = c.navigator === "True";
    const xs = [];
    for (const seed of SEEDS) {
      const draw = mulberry32(seed);
      Object.assign(e.state, {
        vesselKey: c.vessel, diffKey: "normal", currentPort: c.from, cash: 1e6, debt: 0, monthIndex: t0, hull: 100,
        crewHealth: 100, ended: false, logs: [], cargo: zero(), costBasis: zero(),
        specialists: { navigator: nav, marines: false, tarpaulins: false }
      });
      e.rng.queue.length = 0;
      while (!e.state.ended && e.state.currentPort !== c.to) {
        while (e.rng.remaining < 16) e.rng.push(draw());   // pre-generated from the same stream
        e.g.sailTo(c.to);
      }
      xs.push(e.state.monthIndex - t0);
    }
    const mean = xs.reduce((a, b) => a + b, 0) / N;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (N - 1));
    const half = 1.96 * sd / Math.sqrt(N), Ecal = Number(c.E_cal);
    results.push({
      from: c.from, to: c.to, vessel: c.vessel, navigator: nav, month: c.month, E_cal: Ecal, mean, sd,
      lo: mean - half, hi: mean + half, inside: Ecal >= mean - half && Ecal <= mean + half,
      min: Math.min(...xs), max: Math.max(...xs), shareRetried: xs.filter(x => x > Number(c.M)).length / N
    });
  }
  const inside = results.filter(r => r.inside).length;
  report.steps.step5 = { pass: inside >= 0.95 * results.length, cells: results.length, inside, share: inside / results.length, N, seeds: "100001-102000", results };
}

report.pass = Object.values(report.steps).every(s => s.pass);
writeFileSync(OUT + "partc.json", JSON.stringify(report, null, 1) + "\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.steps).map(([k, v]) => [k, v.pass])), null, 1));
