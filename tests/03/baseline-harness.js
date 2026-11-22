// Baseline harness for Monsoon Navigator (R0).
//
// Runs inside the game page (tests/03/baseline-check.html injects it into an
// iframe of index.html), so it calls the game's own functions and reads its
// own constants. It never edits index.html.
//
// Two outputs:
//   1. transitTable(): every sea lane x month x vessel x navigator, from
//      computeTransit(). Deterministic; compared against
//      tests/03/fixtures/baseline-transit.json to detect any change to the
//      sailing model.
//   2. economySweep(): exploratory strategy runs with a seeded random number
//      generator. These are characterisation numbers for docs/baseline.md,
//      not a test of historical accuracy.
//
// The game's state, Math.random, renderAll and finishCampaign are restored
// after every run.

/* global state, SEA_LANES, VESSELS, COMMODITIES, DIFFICULTIES, MONTHS,
   computeTransit, getLivePortPrice, getEffectiveTariff, sellCargoQty,
   buyCargoQty, repairHull, sailTo, waitInPort */

function harnessSnapshotState() {
  return JSON.parse(JSON.stringify({ ...state, visitedPorts: [...state.visitedPorts] }));
}

function harnessRestoreState(saved) {
  Object.assign(state, saved, { visitedPorts: new Set(saved.visitedPorts) });
}

function harnessMulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function transitTable() {
  const saved = harnessSnapshotState();
  const rows = [];
  try {
    for (const lane of SEA_LANES) {
      for (const vessel of Object.keys(VESSELS)) {
        for (const navigator of [false, true]) {
          state.vesselKey = vessel;
          state.specialists = { navigator, marines: false, tarpaulins: false };
          for (let month = 0; month < 12; month++) {
            const c = computeTransit(lane, month);
            rows.push({
              from: lane.from, to: lane.to, vessel, navigator, month: MONTHS[month],
              days: c.days, months: c.months, effSpeed: c.effSpeed, status: c.alignmentStatus
            });
          }
        }
      }
    }
  } finally {
    harnessRestoreState(saved);
  }
  return rows;
}

// --- Exploratory economy sweep ---------------------------------------------

function harnessReset(vessel, diffKey, port, seed) {
  Math.random = harnessMulberry32(seed);
  const d = DIFFICULTIES[diffKey];
  const zero = () => ({ teak: 0, porcelain: 0, textiles: 0, pepper: 0, cloves: 0, ivory: 0 });
  Object.assign(state, {
    vesselKey: vessel, diffKey, currentPort: port, cash: d.cash, debt: d.debt,
    startEquity: d.cash - d.debt, monthIndex: 0, hull: 100, crewHealth: 100, mutinies: 0,
    ended: false, logs: [], previewMonthOffset: null, windRouteTo: null, hoveredLaneTo: null,
    cargo: zero(), costBasis: zero(),
    diaspora: { kilwa: 0, aden: 0, calicut: 0, malacca: 0, quanzhou: 0 },
    visitedPorts: new Set([port]),
    specialists: { navigator: false, marines: false, tarpaulins: false },
    stats: { goodWinds: 0, badWinds: 0, layoverMonths: 0, bulkTonsShipped: 0, luxuryTonsShipped: 0 }
  });
  state.diaspora[port] = 10; // as startSimulation()
}

// Greedy cargo plan for one lane: fill the hold by sale/cost ratio, keeping
// 60 D back for a repair.
function harnessPlan(lane) {
  const calc = computeTransit(lane);
  const arrival = Math.min(23, state.monthIndex + calc.months);
  const tariff = getEffectiveTariff(state.currentPort);
  const capacity = VESSELS[state.vesselKey].capacity;
  const items = COMMODITIES.map(c => {
    const cost = Math.round(getLivePortPrice(c, state.currentPort, state.monthIndex) * (1 + tariff));
    const sale = getLivePortPrice(c, lane.to, arrival);
    return { c, cost, sale, ratio: sale / cost };
  }).filter(x => x.ratio > 1).sort((a, b) => b.ratio - a.ratio);
  let cash = Math.max(0, state.cash - 60), tons = 0, gross = 0;
  const buys = [];
  for (const x of items) {
    const q = Math.min(Math.floor((capacity - tons) / x.c.weight), Math.floor(cash / x.cost));
    if (q > 0) { buys.push([x.c.id, q]); cash -= q * x.cost; tons += q * x.c.weight; gross += q * (x.sale - x.cost); }
  }
  const wages = calc.months * VESSELS[state.vesselKey].upkeep;
  return { lane, calc, buys, perMonth: (gross - wages) / calc.months };
}

// policy: "sailAlways" | "avoidHeadwind" | "avoidHeadwindAndTransition"
function harnessPlay(policy) {
  let guard = 0;
  while (!state.ended && guard++ < 200) {
    for (const c of COMMODITIES) if (state.cargo[c.id] > 0) sellCargoQty(c.id, 999);
    if (state.hull < 60 && state.cash > 200) repairHull();
    let plans = SEA_LANES.filter(l => l.from === state.currentPort).map(harnessPlan);
    if (policy !== "sailAlways") plans = plans.filter(p => !p.calc.isHeadwind);
    if (policy === "avoidHeadwindAndTransition") plans = plans.filter(p => !p.calc.isDeadZone);
    plans.sort((a, b) => b.perMonth - a.perMonth);
    if (!plans.length) { waitInPort(); continue; }
    for (const [id, q] of plans[0].buys) buyCargoQty(id, q);
    sailTo(plans[0].lane.to);
  }
  return harnessResult;
}

let harnessResult = null;

function economySweep(seeds = 300, startPort = "calicut") {
  const saved = harnessSnapshotState();
  const originals = { random: Math.random, renderAll: window.renderAll, finishCampaign: window.finishCampaign };
  // Same money logic as finishCampaign(), without touching the page.
  window.renderAll = () => {};
  window.finishCampaign = function () {
    state.ended = true;
    let liquidation = 0;
    COMMODITIES.forEach(c => {
      if (state.cargo[c.id] > 0) {
        liquidation += state.cargo[c.id] * getLivePortPrice(c, state.currentPort, Math.min(23, state.monthIndex));
        state.cargo[c.id] = 0;
      }
    });
    state.cash += liquidation - state.debt;
    state.debt = 0;
    harnessResult = { net: state.cash - state.startEquity, start: state.startEquity };
  };
  const quantile = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };
  const policies = ["sailAlways", "avoidHeadwind", "avoidHeadwindAndTransition"];
  // sameSeed: dhow vs junk run on the same seed under the same policy. This is
  // NOT common random numbers: the two ships make different voyages and so
  // consume the random stream differently, so the hazards they meet differ.
  const out = {
    seeds, startPort, target: 1200, cells: [], sameSeed: {},
    sameSeedNote: "Same seed, not common random numbers; the ships meet different hazards."
  };
  try {
    for (const diffKey of ["normal", "hard", "survival"]) {
      const netsBy = {};
      for (const vessel of Object.keys(VESSELS)) {
        for (const policy of policies) {
          const nets = [];
          for (let s = 1; s <= seeds; s++) {
            harnessResult = null;
            harnessReset(vessel, diffKey, startPort, s);
            nets.push(harnessPlay(policy).net);
          }
          netsBy[`${vessel}/${policy}`] = nets;
          out.cells.push({
            difficulty: diffKey, vessel, policy, startEquity: DIFFICULTIES[diffKey].cash - DIFFICULTIES[diffKey].debt,
            min: Math.min(...nets), p10: quantile(nets, 0.1), median: quantile(nets, 0.5), p90: quantile(nets, 0.9),
            shareMeetingTarget: nets.filter(n => n >= out.target).length / seeds
          });
        }
      }
      for (const policy of policies) {
        const d = netsBy[`dhow/${policy}`], j = netsBy[`junk/${policy}`];
        out.sameSeed[policy] = out.sameSeed[policy] || {};
        out.sameSeed[policy][diffKey] = {
          dhowBeatsJunk: d.filter((x, i) => x > j[i]).length,
          ties: d.filter((x, i) => x === j[i]).length,
          of: seeds
        };
      }
    }
  } finally {
    Math.random = originals.random;
    window.renderAll = originals.renderAll;
    window.finishCampaign = originals.finishCampaign;
    harnessRestoreState(saved);
  }
  return out;
}
