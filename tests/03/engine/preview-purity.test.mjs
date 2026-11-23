// Previews and forecasts must not change the game or consume randomness.
// Math.random throws if called unscripted, so any draw fails these tests, and
// the full state is compared before and after.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine, plain, DEFAULT_INDEX } from "./load-engine.mjs";

const NO_STORY = 0.75;

// A few varied positions: start, mid-campaign with standing and specialists,
// a pending clock preview, the last month.
function positions() {
  const a = loadEngine().start();
  const b = loadEngine().start({ vessel: "junk", difficulty: "hard", port: "malacca" });
  b.state.monthIndex = 9;
  b.state.diaspora.malacca = 55;
  b.state.specialists = { navigator: true, marines: true, tarpaulins: false };
  b.state.cargo.cloves = 3;
  b.state.crewHealth = 40;
  const c = loadEngine().start({ port: "aden" });
  c.state.monthIndex = 4;
  c.state.previewMonthOffset = 7;
  const d = loadEngine().start({ port: "quanzhou" });
  d.state.monthIndex = 23;
  return [a, b, c, d];
}

test("forecast and preview functions leave state unchanged and draw no random numbers", () => {
  for (const e of positions()) {
    const outbound = e.SEA_LANES.filter(l => l.from === e.state.currentPort);
    e.state.windRouteTo = outbound[0].to;      // renderWindComparison selects this lane anyway
    const before = plain(e.state);
    for (const lane of outbound) for (let m = 0; m < 24; m++) e.g.computeTransit(lane, m);
    for (const lane of outbound) e.g.computeTransit(lane);
    e.g.getForecastMonthIndex();
    for (let w = 0; w < 12; w++) e.g.getWaitingCosts(w);
    for (const c of e.COMMODITIES) for (const p of Object.keys(e.PORTS)) {
      e.g.getLivePortPrice(c, p, e.state.monthIndex);
      e.g.getEffectiveTariff(p);
      e.g.getEffectiveLayoverFee(p);
    }
    e.g.getMutinyRisk(e.state.crewHealth);
    e.g.renderWindComparison();
    e.g.renderAll();
    assert.deepEqual(plain(e.state), before);
    assert.equal(e.rng.calls, 0);
  }
});

test("the 480-row transit table restores state and draws no random numbers", () => {
  const e = loadEngine({ harness: true }).start({ vessel: "junk" });
  e.state.specialists.navigator = true;
  const before = plain(e.state);
  e.g.transitTable();
  assert.deepEqual(plain(e.state), before);
  assert.equal(e.rng.calls, 0);
});

test("the forecast month is the next change of wind regime, or the previewed month", () => {
  const e = loadEngine().start();                // Jan: NE monsoon until Feb
  assert.equal(e.g.getForecastMonthIndex(), 2);  // Mar, transition
  e.state.previewMonthOffset = 6;
  assert.equal(e.g.getForecastMonthIndex(), 6);
  e.state.monthIndex = 23;
  assert.equal(e.g.getForecastMonthIndex(), null); // last month: nothing to forecast
});

test("forecast waiting costs equal what waiting actually charges", () => {
  const e = loadEngine().start();
  const forecast = e.g.getWaitingCosts(3);
  // standing 10, 25, 40: fees 25 + 19 + 19; wages 3 × 15
  assert.deepEqual(plain(forecast), { portFees: 63, crewWages: 45 });
  const cash = e.state.cash;
  for (let i = 0; i < 3; i++) { e.rng.push(NO_STORY); e.g.waitInPort(); }
  assert.equal(cash - e.state.cash, forecast.portFees + forecast.crewWages);
});

test("the transit forecast for a later month matches the voyage made in that month", () => {
  const e = loadEngine().start();
  const lane = e.lane("calicut", "malacca");
  const forecast = plain(e.g.computeTransit(lane, 5));   // June
  e.state.monthIndex = 5;
  assert.deepEqual(plain(e.g.computeTransit(lane)), forecast);
  const cash = e.state.cash;
  e.rng.push(0.99);
  e.g.sailTo("malacca");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(cash - e.state.cash, forecast.months * e.VESSELS.dhow.upkeep);
  assert.equal(e.state.monthIndex, 5 + forecast.months);
});

// The Atlas adapter's read-only displays: the pirate warning, the sail-or-wait card and the route calendar
// (tests/03/atlas-decisions.test.mjs checks their numbers). Painted for every outbound route from every port, with
// and without guards and valuable cargo, they must leave the game state as it was and draw no random number.
test("the Atlas pirate warning, sail-or-wait card and calendar leave state unchanged and draw no random numbers", async () => {
  const { load } = await import("../atlas-harness.mjs");
  const { readFileSync } = await import("node:fs");
  const page = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
  const { g, api, get, draws } = load(page, 1);
  get("input-start-port").value = "calicut";
  g.selectVessel("junk"); g.selectDifficulty("survival"); g.startSimulation();
  const snapshot = () => JSON.stringify({ ...api.state, visitedPorts: [...api.state.visitedPorts] });
  let painted = 0;
  for (const port of Object.keys(api.PORTS)) for (const marines of [false, true]) for (const cloves of [0, 2]) {
    Object.assign(api.state, { currentPort: port, monthIndex: 9 });
    api.state.specialists.marines = marines; api.state.cargo.cloves = cloves;
    for (const lane of api.SEA_LANES.filter(l => l.from === port)) {
      api.state.windRouteTo = lane.to;
      const before = snapshot(), drawn = draws.length;
      g.renderAll(); g.renderWindComparison(); g.setHoveredLane(lane.to); g.setHoveredLane(null);
      api.state.hoveredLaneTo = null;
      assert.equal(draws.length, drawn, `${port}→${lane.to}: a display drew a random number`);
      assert.equal(snapshot(), before, `${port}→${lane.to}: a display changed the state`);
      assert.equal(get("atlas-pirate-warning").hidden, false, `${port}→${lane.to}: no pirate warning`);
      painted++;
    }
  }
  assert.ok(painted >= 40, `${painted} routes painted`);
});
