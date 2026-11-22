// Sailing: wages, months charged, and each random hazard path, forced by
// scripting Math.random. Draw order inside sailTo is:
//   headwind: damage, turn-back, [jettison if teak aboard]
//   transition month: storm roll, [storm damage if storm]
//   [textiles squall if textiles aboard, no tarpaulins, transition month]
//   [piracy, unless turned back]
//   [mutiny, only if crew health < 50]
// Thresholds are probed just either side, so a changed probability fails.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

const NO_PIRATES = 0.99;

test("tailwind voyage: one month of wages, standing +5, one random draw (piracy)", () => {
  const e = loadEngine().start(); // Calicut, Jan, dhow, normal
  const calc = e.g.computeTransit(e.lane("calicut", "aden"));
  assert.equal(calc.alignmentStatus, "Tailwind (Optimal)");
  assert.equal(calc.days, 14);
  assert.equal(calc.months, 1);
  e.rng.push(NO_PIRATES);
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 15);
  assert.equal(e.state.currentPort, "aden");
  assert.equal(e.state.monthIndex, 1);
  assert.equal(e.state.diaspora.aden, 5);
  assert.ok(e.state.visitedPorts.has("aden"));
  assert.equal(e.state.crewHealth, 92);        // −8 per month at sea
  assert.equal(e.state.stats.goodWinds, 1);
  assert.equal(e.rng.calls, 1);
});

test("wages are months at sea × the vessel's monthly wage", () => {
  // Aden → Calicut in January is the README example: dhow 53 days = 2 months.
  const dhow = loadEngine().start({ port: "aden" });
  assert.equal(dhow.g.computeTransit(dhow.lane("aden", "calicut")).days, 53);
  dhow.rng.push(0.5, 0.99, NO_PIRATES);        // damage, no turn-back, no pirates
  dhow.g.sailTo("calicut");
  assert.equal(dhow.rng.remaining, 0, "scripted draws left unused");
  assert.equal(dhow.state.cash, 1500 - 2 * 15);
  assert.equal(dhow.state.monthIndex, 2);

  // The junk hits the 0.25 speed floor on the same lane: 61 days = 3 months at 35 D.
  const junk = loadEngine().start({ port: "aden", vessel: "junk" });
  assert.equal(junk.g.computeTransit(junk.lane("aden", "calicut")).days, 61);
  junk.rng.push(0.5, 0.99, NO_PIRATES);
  junk.g.sailTo("calicut");
  assert.equal(junk.rng.remaining, 0, "scripted draws left unused");
  assert.equal(junk.state.cash, 1500 - 3 * 35);
  assert.equal(junk.state.monthIndex, 3);
});

test("headwind turn-back below 0.35: wages and months charged, no arrival, no piracy draw", () => {
  const e = loadEngine().start({ port: "aden" });
  e.rng.push(0.5, 0.3499);                     // damage round(20 + 7) = 27; turned back
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.hull, 73);
  assert.equal(e.state.currentPort, "aden");
  assert.equal(e.state.diaspora.calicut, 0);
  assert.ok(!e.state.visitedPorts.has("calicut"));
  assert.equal(e.state.cash, 1500 - 30);
  assert.equal(e.state.monthIndex, 2);
  assert.equal(e.state.crewHealth, 100 - 2 * 8 - 12);
  assert.equal(e.state.stats.badWinds, 1);
  assert.equal(e.rng.calls, 2);
  assert.match(e.logs().at(-1), /Attempted Aden → Calicut \(TURNED BACK\)/);
});

test("headwind at exactly 0.35 does not turn back", () => {
  const e = loadEngine().start({ port: "aden" });
  e.rng.push(0.5, 0.35, NO_PIRATES);
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.currentPort, "calicut");
  assert.equal(e.rng.calls, 3);
});

test("headwind jettisons one teak lot below 0.4, only when teak is aboard", () => {
  const e = loadEngine().start({ port: "aden" });
  e.state.cargo.teak = 3;
  e.rng.push(0.0, 0.35, 0.3999, NO_PIRATES);  // damage 20, stay, jettison
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cargo.teak, 2);
  assert.equal(e.state.hull, 80);

  const f = loadEngine().start({ port: "aden" });
  f.state.cargo.teak = 3;
  f.rng.push(0.0, 0.35, 0.4, NO_PIRATES);
  f.g.sailTo("calicut");
  assert.equal(f.rng.remaining, 0, "scripted draws left unused");
  assert.equal(f.state.cargo.teak, 3);
});

test("headwind damage scales with the hull multiplier and difficulty", () => {
  const junk = loadEngine().start({ port: "aden", vessel: "junk" });
  junk.rng.push(0.0, 0.99, NO_PIRATES);
  junk.g.sailTo("calicut");
  assert.equal(junk.rng.remaining, 0, "scripted draws left unused");
  assert.equal(junk.state.hull, 90);           // 20 × 0.5

  const survival = loadEngine().start({ port: "aden", difficulty: "survival" });
  survival.rng.push(0.0, 0.99, NO_PIRATES);
  survival.g.sailTo("calicut");
  assert.equal(survival.rng.remaining, 0, "scripted draws left unused");
  assert.equal(survival.state.hull, 60);       // 20 × 2.0

  const easy = loadEngine().start({ port: "aden", difficulty: "easy" });
  easy.rng.push(0.9999, 0.99, NO_PIRATES);
  easy.g.sailTo("calicut");
  assert.equal(easy.rng.remaining, 0, "scripted draws left unused");
  assert.equal(easy.state.hull, 83);           // round((20 + 13.9986) × 0.5) = 17
});

test("transition-month storm below 0.35 damages the hull and the crew", () => {
  const e = loadEngine().start();
  e.state.monthIndex = 3;                      // April
  assert.ok(e.g.computeTransit(e.lane("calicut", "aden")).isDeadZone);
  e.rng.push(0.3499, 0.0, NO_PIRATES);         // storm, damage round(22) = 22
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.hull, 78);
  assert.equal(e.state.crewHealth, 100 - 8 - 12);
  assert.equal(e.state.cash, 1500 - 15);
  assert.equal(e.rng.calls, 3);
});

test("transition month: 0.35 to 0.6 is becalmed (−20 D), 0.6 and above is calm", () => {
  const becalmed = loadEngine().start();
  becalmed.state.monthIndex = 3;
  becalmed.rng.push(0.35, NO_PIRATES);
  becalmed.g.sailTo("aden");
  assert.equal(becalmed.rng.remaining, 0, "scripted draws left unused");
  assert.equal(becalmed.state.cash, 1500 - 15 - 20);
  assert.equal(becalmed.state.hull, 100);

  const edge = loadEngine().start();
  edge.state.monthIndex = 3;
  edge.rng.push(0.5999, NO_PIRATES);
  edge.g.sailTo("aden");
  assert.equal(edge.rng.remaining, 0, "scripted draws left unused");
  assert.equal(edge.state.cash, 1500 - 15 - 20);

  const calm = loadEngine().start();
  calm.state.monthIndex = 3;
  calm.rng.push(0.6, NO_PIRATES);
  calm.g.sailTo("aden");
  assert.equal(calm.rng.remaining, 0, "scripted draws left unused");
  assert.equal(calm.state.cash, 1500 - 15);
});

test("a navigator lowers the storm threshold to 0.18", () => {
  const e = loadEngine().start();
  e.state.monthIndex = 3;
  e.state.specialists.navigator = true;
  e.rng.push(0.18, NO_PIRATES);                // not a storm any more: becalmed
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.hull, 100);
  assert.equal(e.state.cash, 1500 - 15 - 20);
});

test("porcelain loses 20% (at least 1) on a rough voyage when hull is below 70", () => {
  const e = loadEngine().start();
  e.state.monthIndex = 3;
  e.state.hull = 69;
  e.state.cargo.porcelain = 10;
  e.rng.push(0.9, NO_PIRATES);                 // calm transition voyage
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cargo.porcelain, 8);

  const one = loadEngine().start();
  one.state.monthIndex = 3;
  one.state.hull = 69;
  one.state.cargo.porcelain = 3;
  one.rng.push(0.9, NO_PIRATES);
  one.g.sailTo("aden");
  assert.equal(one.rng.remaining, 0, "scripted draws left unused");
  assert.equal(one.state.cargo.porcelain, 2);  // max(1, floor(0.6))

  const sound = loadEngine().start();
  sound.state.monthIndex = 3;
  sound.state.hull = 70;
  sound.state.cargo.porcelain = 10;
  sound.rng.push(0.9, NO_PIRATES);
  sound.g.sailTo("aden");
  assert.equal(sound.rng.remaining, 0, "scripted draws left unused");
  assert.equal(sound.state.cargo.porcelain, 10);
});

test("textiles lose one bale below 0.35 in a transition month without tarpaulins", () => {
  const e = loadEngine().start();
  e.state.monthIndex = 3;
  e.state.cargo.textiles = 3;
  e.rng.push(0.9, 0.3499, NO_PIRATES);
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cargo.textiles, 2);

  const tarped = loadEngine().start();
  tarped.state.monthIndex = 3;
  tarped.state.cargo.textiles = 3;
  tarped.state.specialists.tarpaulins = true;
  tarped.rng.push(0.9, NO_PIRATES);           // no squall draw at all
  tarped.g.sailTo("aden");
  assert.equal(tarped.rng.remaining, 0, "scripted draws left unused");
  assert.equal(tarped.state.cargo.textiles, 3);
  assert.equal(tarped.rng.calls, 2);
});

test("piracy takes a crate of cloves first (risk × 1.5 with luxuries aboard)", () => {
  // Aden piracy 0.15 × 1.5 = 0.225
  const e = loadEngine().start();
  e.state.cargo.cloves = 2;
  e.state.cargo.ivory = 2;
  e.rng.push(0.2249);
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cargo.cloves, 1);
  assert.equal(e.state.cargo.ivory, 2);

  const missed = loadEngine().start();
  missed.state.cargo.cloves = 2;
  missed.rng.push(0.2251);
  missed.g.sailTo("aden");
  assert.equal(missed.rng.remaining, 0, "scripted draws left unused");
  assert.equal(missed.state.cargo.cloves, 2);
});

test("piracy takes ivory when there are no cloves", () => {
  const e = loadEngine().start();
  e.state.cargo.ivory = 2;
  e.rng.push(0.0);
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cargo.ivory, 1);
});

test("piracy without luxuries: risk × 0.6, tribute of min(cash, 75)", () => {
  const e = loadEngine().start();
  e.rng.push(0.0899);                           // 0.15 × 0.6 = 0.09
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 15 - 75);

  const poor = loadEngine().start();
  poor.state.cash = 65;
  poor.rng.push(0.0);
  poor.g.sailTo("aden");
  assert.equal(poor.rng.remaining, 0, "scripted draws left unused");
  assert.equal(poor.state.cash, 0);            // 65 − 15 wages − 50 tribute

  const missed = loadEngine().start();
  missed.rng.push(0.0901);
  missed.g.sailTo("aden");
  assert.equal(missed.rng.remaining, 0, "scripted draws left unused");
  assert.equal(missed.state.cash, 1500 - 15);
});

// One voyage Calicut → Aden in January (tailwind, 1 month) unless told otherwise.
function voyage({ start = {}, setup = () => {}, draws, to = "aden" }) {
  const e = loadEngine().start(start);
  setup(e.state);
  e.rng.push(...draws);
  e.g.sailTo(to);
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  return e;
}

test("marines multiply piracy risk by 0.2 (checked just below and just above 0.045)", () => {
  // Cloves aboard: 0.15 × 1.5 × 0.2 = 0.045
  const marines = s => { s.cargo.cloves = 1; s.specialists.marines = true; };
  assert.equal(voyage({ setup: marines, draws: [0.0449] }).state.cargo.cloves, 0);
  assert.equal(voyage({ setup: marines, draws: [0.0451] }).state.cargo.cloves, 1);
});

test("destination standing of 50 halves piracy risk; 49 does not (checked on both sides)", () => {
  const at = standing => s => { s.cargo.cloves = 1; s.diaspora.aden = standing; };
  // standing 50: 0.225 × 0.5 = 0.1125
  assert.equal(voyage({ setup: at(50), draws: [0.1124] }).state.cargo.cloves, 0);
  assert.equal(voyage({ setup: at(50), draws: [0.1126] }).state.cargo.cloves, 1);
  // standing 49: no discount, still 0.225
  assert.equal(voyage({ setup: at(49), draws: [0.2249] }).state.cargo.cloves, 0);
});

test("survival multiplies piracy risk by 1.8 (checked just below and just above 0.162)", () => {
  // No luxuries: 0.15 × 0.6 × 1.8 = 0.162
  const start = { difficulty: "survival" };
  assert.equal(voyage({ start, draws: [0.1619] }).state.cash, 600 - 15 - 75);
  assert.equal(voyage({ start, draws: [0.1621] }).state.cash, 600 - 15);
});

test("storm damage is (22 to 38) × hull multiplier × difficulty multiplier", () => {
  const april = s => { s.monthIndex = 3; };
  // draw 0.5: 22 + 8 = 30
  assert.equal(voyage({ setup: april, draws: [0.0, 0.5, NO_PIRATES] }).state.hull, 70);                               // dhow, ×1 ×1
  assert.equal(voyage({ start: { vessel: "junk" }, setup: april, draws: [0.0, 0.5, NO_PIRATES] }).state.hull, 85);   // junk, ×0.5
  assert.equal(voyage({ start: { difficulty: "survival" }, setup: april, draws: [0.0, 0.5, NO_PIRATES] }).state.hull, 40); // survival, ×2
  assert.equal(voyage({ start: { difficulty: "easy" }, setup: april, draws: [0.0, 0.9999, NO_PIRATES] }).state.hull, 81);  // easy ×0.5: round(37.998 × 0.5) = 19
});

test("arrival raises destination standing by 5, capped at 100", () => {
  assert.equal(voyage({ setup: s => { s.diaspora.aden = 60; }, draws: [NO_PIRATES] }).state.diaspora.aden, 65);
  assert.equal(voyage({ setup: s => { s.diaspora.aden = 98; }, draws: [NO_PIRATES] }).state.diaspora.aden, 100);
});

test("mutiny: probability (50 − health)/100 after the voyage, costs two months' wages (dhow 30 D, junk 70 D)", () => {
  const junk = voyage({ start: { vessel: "junk" }, setup: s => { s.crewHealth = 30; }, draws: [NO_PIRATES, 0.0] });
  assert.equal(junk.state.mutinies, 1);
  assert.equal(junk.state.cash, 1500 - 35 - 70);

  const e = loadEngine().start();
  e.state.crewHealth = 30;                      // 22 after one month at sea: risk 0.28
  e.rng.push(NO_PIRATES, 0.2799);
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.mutinies, 1);
  assert.equal(e.state.cash, 1500 - 15 - 30);

  const held = loadEngine().start();
  held.state.crewHealth = 30;
  held.rng.push(NO_PIRATES, 0.2801);
  held.g.sailTo("aden");
  assert.equal(held.rng.remaining, 0, "scripted draws left unused");
  assert.equal(held.state.mutinies, 0);
  assert.equal(held.state.cash, 1500 - 15);
});

test("no voyage on a lane that does not exist, and none after the campaign ends", () => {
  const e = loadEngine().start();
  e.g.sailTo("quanzhou");                       // no Calicut → Quanzhou lane
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.monthIndex, 0);
  e.state.ended = true;
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.currentPort, "calicut");
  assert.equal(e.rng.calls, 0);
});

test("floors: hull never drops below 5, crew health never below 0", () => {
  // Headwind, Aden → Calicut in January: damage 20, no turn-back, no pirates, no mutiny.
  const head = voyage({ start: { port: "aden" }, to: "calicut",
    setup: s => { s.hull = 10; s.crewHealth = 5; }, draws: [0.0, 0.99, NO_PIRATES, 0.99] });
  assert.equal(head.state.hull, 5);
  assert.equal(head.state.crewHealth, 0);         // 5 − 2 × 8 − 12 → 0, and mutiny risk 0.5 is drawn

  // Transition storm, Calicut → Aden in April: damage 22.
  const storm = voyage({ setup: s => { s.monthIndex = 3; s.hull = 10; s.crewHealth = 5; }, draws: [0.0, 0.0, NO_PIRATES, 0.99] });
  assert.equal(storm.state.hull, 5);
  assert.equal(storm.state.crewHealth, 0);
});
