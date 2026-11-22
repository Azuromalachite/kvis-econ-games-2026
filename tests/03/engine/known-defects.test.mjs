// Known defects, pinned as OBSERVED CURRENT BEHAVIOUR (docs/baseline.md §4).
//
// These tests assert what the game does today, not what it should do. They
// exist so a defect cannot change silently. A bug-fix PR for one of these
// defects is expected to make its test fail: replace the test with one for the
// corrected behaviour and update the defect's row in docs/baseline.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

const pin = id => `${id} pin: if a bug-fix PR changed this on purpose, replace this test with one for the corrected behaviour`;

test("DEFECT D01 (current behaviour): a voyage arriving after month 24 is credited, and the ledger shows month 24", () => {
  // Junk, Aden → Calicut in November (month 22): 61 days at the speed floor, 3 months.
  const e = loadEngine().start({ vessel: "junk", port: "aden" });
  e.state.monthIndex = 22;
  e.state.cargo.ivory = 2;
  e.rng.push(0.0, 0.99, 0.99);                 // damage, no turn-back, no pirates
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  const fixed = pin("D01");
  assert.equal(e.state.ended, true);
  assert.equal(e.state.monthIndex, 25, fixed);          // past the 24-month campaign
  assert.equal(e.state.currentPort, "calicut", fixed);  // the late arrival still counts
  const liquidation = e.logs().find(l => l.includes("Liquidation"));
  assert.ok(liquidation.startsWith("[M24 • "), `${fixed}: ledger month should read M24 (${liquidation})`);
  assert.match(liquidation, /Sold 2× E\. African Ivory at Calicut/, `${fixed}: cargo sold at the arrival port`);
  // Separate from the defect itself: the month name is month 26's, and the
  // price is month 23's. Ivory at Calicut, month 23: seed 'c'+'i' = 204,
  // 227 ≡ 11, sin(11π/6) = −0.5 → 540 × 0.96 = 518.4 → 518; 2 lots = 1036.
  assert.equal(liquidation, "[M24 • Feb] Month 24 Liquidation: Sold 2× E. African Ivory at Calicut for 1036 D.");
});

test("DEFECT D07 (current behaviour): a campaign ended by debt is logged as \"Month 24 Liquidation\"", () => {
  const e = loadEngine().start();
  e.state.monthIndex = 2;
  e.state.cash = -240;
  e.state.cargo.pepper = 1;
  e.rng.push(0.75);
  e.g.waitInPort();                             // −280 D < −250: campaign ends in month 4
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.ended, true);
  assert.equal(e.state.monthIndex, 3);
  // Pepper at Calicut, month 3: 214 ≡ 10, sin(5π/3) = −0.866 → 80 × 0.9307 = 74.46 → 74
  const liquidation = e.logs().find(l => l.includes("Liquidation"));
  assert.equal(liquidation, "[M4 • Apr] Month 24 Liquidation: Sold 1× Black Pepper at Calicut for 74 D.", pin("D07"));
  // Nothing in the audit says the campaign ended early.
  assert.ok(!e.logs().some(l => /early|bankrupt|insolv/i.test(l)));
  assert.equal(e.el("audit-outcome-badge").textContent, "VENTURE DEFICIT");
});

test("DEFECT D08 (current behaviour): arrival log entries carry the departure month", () => {
  const e = loadEngine().start({ port: "aden" });
  e.rng.push(0.5, 0.99, 0.99);                 // Aden → Calicut in January: 2 months
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.monthIndex, 2);          // arrives in March (M3)
  const voyage = e.logs().find(l => l.includes("Sailed Aden → Calicut"));
  assert.ok(voyage.startsWith("[M1 • Jan] Sailed Aden → Calicut (53d / 2mo"), `${pin("D08")}: ${voyage}`);
});

test("DEFECT D02 (current behaviour): pepper is labelled Semi-Bulk in the market but counted as luxury in the audit", () => {
  const e = loadEngine().start();               // Calicut, January
  e.g.buyCargoQty("pepper", 5);                 // 5 lots × 2 t = 10 t
  const market = e.el("market-tbody").innerHTML;
  const pepperRow = market.slice(market.indexOf("Black Pepper"), market.indexOf("Moluccan Cloves"));
  assert.match(pepperRow, />Semi-Bulk</);       // what the student sees
  e.rng.push(0.99);                             // tailwind to Aden: piracy draw only
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.stats.bulkTonsShipped, 0, pin("D02"));
  assert.equal(e.state.stats.luxuryTonsShipped, 10, pin("D02"));
  e.g.finishCampaign();
  assert.equal(e.el("audit-cargo-mix").textContent, "0T Bulk / 10T Luxury Shipped");
});

test("DEFECT D03 (current behaviour): the freight tally counts cargo loaded, even on a voyage that turns back", () => {
  const e = loadEngine().start({ port: "aden" });
  e.state.cargo.teak = 3;                       // 30 t of bulk
  e.rng.push(0.5, 0.3499);                      // headwind damage, turned back
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.currentPort, "aden");    // nothing was delivered
  assert.equal(e.state.stats.bulkTonsShipped, 30, pin("D03"));
  e.g.finishCampaign();
  assert.equal(e.el("audit-cargo-mix").textContent, "30T Bulk / 0T Luxury Shipped");
});

test("DEFECT D03 (current behaviour): cargo lost at sea still counts as shipped", () => {
  const e = loadEngine().start({ port: "aden" });
  e.state.cargo.teak = 3;                       // 30 t bulk
  e.state.cargo.cloves = 2;                     // 2 t luxury
  e.rng.push(0.0, 0.35, 0.0, 0.0);              // damage, no turn-back, jettison 1 teak, pirates take 1 clove
  e.g.sailTo("calicut");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.currentPort, "calicut");
  assert.equal(e.state.cargo.teak, 2);          // 20 t arrived
  assert.equal(e.state.cargo.cloves, 1);        // 1 t arrived
  assert.equal(e.state.stats.bulkTonsShipped, 30, pin("D03"));
  assert.equal(e.state.stats.luxuryTonsShipped, 2, pin("D03"));
});
