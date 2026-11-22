// Buying and selling: prices, tariffs, capacity and cash limits, cost basis.
// Expected numbers are worked by hand from docs/baseline.md §2, not read back
// from the engine, so a changed price, tariff or rounding rule fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

// Calicut, month 0 (Jan). Price = base × (1 + 0.08·sin((month + seed)·π/6)), rounded.
//   pepper: base 80, seed 'c'+'p' = 211 ≡ 7 (mod 12), sin(7π/6) = −0.5 → 80 × 0.96 = 76.8 → 77
//   cloves: base 340, seed 'c'+'c' = 198 ≡ 6, sin(π) = 0           → 340
//   teak:   base 40, seed 'c'+'t' = 215 ≡ 11, sin(11π/6) = −0.5    → 38.4 → 38
test("live price follows the documented seasonal formula", () => {
  const e = loadEngine().start();
  const byId = id => e.COMMODITIES.find(c => c.id === id);
  assert.equal(e.g.getLivePortPrice(byId("pepper"), "calicut", 0), 77);
  assert.equal(e.g.getLivePortPrice(byId("cloves"), "calicut", 0), 340);
  assert.equal(e.g.getLivePortPrice(byId("teak"), "calicut", 0), 38);
  // Same month a year later gives the same price (period 12).
  assert.equal(e.g.getLivePortPrice(byId("pepper"), "calicut", 12), 77);
});

test("buying adds the port tariff to the unit cost; selling does not", () => {
  const e = loadEngine().start(); // normal: 1,500 D at Calicut, tariff 4%
  e.g.buyCargoQty("pepper", 5);
  // unit cost = round(77 × 1.04) = round(80.08) = 80; 5 lots = 400 D
  assert.equal(e.state.cash, 1100);
  assert.equal(e.state.cargo.pepper, 5);
  assert.equal(e.state.costBasis.pepper, 80);
  assert.match(e.logs().at(-1), /Bought 5× Black Pepper .* for 400 D \(80 D\/unit incl\. 4% tariff\)/);

  e.g.sellCargoQty("pepper", 5);
  // revenue = 5 × 77 = 385, no tariff; the round trip costs exactly the tariff
  assert.equal(e.state.cash, 1485);
  assert.equal(e.state.cargo.pepper, 0);
  assert.equal(e.state.costBasis.pepper, 0);
  assert.match(e.logs().at(-1), /Sold 5× Black Pepper at Calicut for 385 D \(Net margin: -15 D\)/);
});

test("standing of 50 takes one point off the tariff", () => {
  const e = loadEngine().start();
  assert.equal(e.g.getEffectiveTariff("calicut"), 0.04);
  e.state.diaspora.calicut = 49;
  assert.equal(e.g.getEffectiveTariff("calicut"), 0.04);
  e.state.diaspora.calicut = 50;
  assert.equal(e.g.getEffectiveTariff("calicut"), 0.03);
  e.g.buyCargoQty("pepper", 1);
  // round(77 × 1.03) = round(79.31) = 79
  assert.equal(e.state.cash, 1500 - 79);
});

test("every port's base tariff is as pinned", () => {
  const e = loadEngine().start();
  const tariffs = Object.fromEntries(Object.keys(e.PORTS).map(p => [p, e.g.getEffectiveTariff(p)]));
  assert.deepEqual({ ...tariffs }, { kilwa: 0.05, aden: 0.08, calicut: 0.04, malacca: 0.03, quanzhou: 0.06 });
});

test("a purchase is capped by hold space and by cash, never overdrawn", () => {
  const e = loadEngine().start(); // dhow, 120 t
  e.g.buyCargoQty("teak", 999);
  // teak is 10 t a lot: 12 lots fill the hold. unit = round(38 × 1.04) = round(39.52) = 40
  assert.equal(e.state.cargo.teak, 12);
  assert.equal(e.state.cash, 1500 - 12 * 40);
  e.g.buyCargoQty("cloves", 1); // hold full: nothing happens
  assert.equal(e.state.cargo.cloves, 0);

  const f = loadEngine().start({ vessel: "junk" }); // 300 t, so cash binds first
  f.g.buyCargoQty("cloves", 999);
  // unit = round(340 × 1.04) = round(353.6) = 354; floor(1500 / 354) = 4
  assert.equal(f.state.cargo.cloves, 4);
  assert.equal(f.state.cash, 1500 - 4 * 354);
  assert.ok(f.state.cash >= 0);
});

test("cost basis is the rounded weighted average of purchases", () => {
  const e = loadEngine().start();
  e.g.buyCargoQty("pepper", 1);           // month 0: unit 80
  e.state.monthIndex = 3;                 // pepper 74 D (seed 214 ≡ 10): unit round(76.96) = 77
  e.g.buyCargoQty("pepper", 1);
  // average 78.5 → 79; differs from the first price (80) and the last (77)
  assert.equal(e.state.costBasis.pepper, 79);
  e.g.sellCargoQty("pepper", 1);          // partial sale keeps the basis
  assert.equal(e.state.costBasis.pepper, 79);
  assert.equal(e.state.cargo.pepper, 1);
});

test("selling more than is held sells what is held; selling nothing is a no-op", () => {
  const e = loadEngine().start();
  e.g.buyCargoQty("pepper", 3);
  const logsBefore = e.state.logs.length;
  e.g.sellCargoQty("cloves", 5);
  assert.equal(e.state.logs.length, logsBefore);
  e.g.sellCargoQty("pepper", 99);
  assert.equal(e.state.cargo.pepper, 0);
  assert.equal(e.state.cash, 1500 - 3 * 80 + 3 * 77);
});

test("trading draws no random numbers and does not advance time", () => {
  const e = loadEngine().start();
  e.g.buyCargoQty("pepper", 3);
  e.g.sellCargoQty("pepper", 3);
  assert.equal(e.rng.calls, 0);
  assert.equal(e.state.monthIndex, 0);
});
