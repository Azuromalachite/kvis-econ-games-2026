// Loan interest and the real finishCampaign() settlement and audit screen.
// tests/03/baseline-harness.js replaces finishCampaign with a stand-in for its
// sweep; these tests call the game's own function.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

const NO_STORY = 0.75;
const waitMonths = (e, n) => { for (let i = 0; i < n; i++) { e.rng.push(NO_STORY); e.g.waitInPort(); } assert.equal(e.rng.remaining, 0); };

test("hard difficulty starts with 800 D cash, a 500 D loan and 300 D equity", () => {
  const e = loadEngine().start({ difficulty: "hard" });
  assert.equal(e.state.cash, 800);
  assert.equal(e.state.debt, 500);
  assert.equal(e.state.startEquity, 300);
});

test("5% interest is added when the month count crosses a multiple of 6, rounded each time", () => {
  const e = loadEngine().start({ difficulty: "hard" });
  waitMonths(e, 5);
  assert.equal(e.state.debt, 500);
  waitMonths(e, 1);                      // month 6
  assert.equal(e.state.debt, 525);
  assert.match(e.logs().at(-1), /accrued 5% biannual interest \(\+25 D; total debt: 525 D\)/);
  waitMonths(e, 6);                      // month 12: round(26.25) = 26
  assert.equal(e.state.debt, 551);
  waitMonths(e, 6);                      // month 18: round(27.55) = 28
  assert.equal(e.state.debt, 579);
});

test("a voyage that crosses a 6-month boundary accrues interest", () => {
  const e = loadEngine().start({ difficulty: "hard" });
  e.state.monthIndex = 5;               // June: Calicut → Malacca is a 1-month SW-monsoon tailwind
  e.rng.push(0.99);                     // piracy draw only
  e.g.sailTo("malacca");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.monthIndex, 6);
  assert.equal(e.state.debt, 525);
});

test("no interest without a loan, and none after it is repaid", () => {
  const e = loadEngine().start();
  waitMonths(e, 6);
  assert.equal(e.state.debt, 0);
  assert.ok(!e.logs().some(l => l.includes("interest")));

  const h = loadEngine().start({ difficulty: "hard" });
  h.g.repayDebt();
  assert.equal(h.state.cash, 300);
  assert.equal(h.state.debt, 0);
  waitMonths(h, 6);
  assert.ok(!h.logs().some(l => l.includes("interest")));
});

test("finishCampaign at month 24: sells cargo at the month-23 price, deducts the loan, fills the audit", () => {
  const e = loadEngine().start({ difficulty: "hard" });   // Calicut, target 1,200
  e.state.monthIndex = 23;
  e.state.cargo.pepper = 5;
  e.rng.push(NO_STORY);
  e.g.waitInPort();                                       // month 24 → campaign ends
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.ended, true);
  assert.equal(e.state.monthIndex, 24);
  // Crossing month 24 accrues interest before settlement: 500 → 525 (observed).
  // Pepper at Calicut: month 23 → seed 211 + 23 ≡ 6, sin(π) = 0, 80 D; month 24 would be 77 D.
  // cash = 800 − 25 fee − 15 wages + 5 × 80 − 525 = 635
  assert.equal(e.state.cash, 635);
  assert.equal(e.state.debt, 0);
  assert.equal(e.state.cargo.pepper, 0);
  const logs = e.logs();
  assert.ok(logs.some(l => l.endsWith("Month 24 Liquidation: Sold 5× Black Pepper at Calicut for 400 D.")));
  assert.ok(logs.some(l => l.endsWith("Final Settlement: Deducted remaining Commenda loan of 525 D.")));
  // Audit screen: net = 635 − 300 equity = 335; ROI round(335 / 300 × 100) = 112%
  assert.equal(e.el("audit-start-cash").textContent, "300 D");
  assert.equal(e.el("audit-final-cash").textContent, "635 D");
  assert.equal(e.el("audit-net-profit").textContent, "+335 D");
  assert.equal(e.el("audit-roi").textContent, "112% (Goal: +1200 D)");
  assert.equal(e.el("audit-outcome-badge").textContent, "PROFITABLE VOYAGE • BELOW TARGET");
  assert.equal(e.el("audit-student-meta").textContent, "Student: Test Student | Student no.: T-0000");
  assert.ok(e.el("phase-sim").classList.contains("hidden"));
  assert.ok(!e.el("phase-audit").classList.contains("hidden"));
  assert.equal(e.el("audit-log-table").innerHTML.split("</div>").length - 1, e.state.logs.length);
});

test("finishCampaign outcome badge: target met, and deficit", () => {
  const met = loadEngine().start({ target: 100 });
  met.state.cash = 1600;
  met.g.finishCampaign();
  assert.equal(met.el("audit-net-profit").textContent, "+100 D");
  assert.equal(met.el("audit-outcome-badge").textContent, "TARGET ACHIEVED • EXEMPLARY ARBITRAGE");

  const deficit = loadEngine().start();
  deficit.g.finishCampaign();                 // net exactly 0
  assert.equal(deficit.el("audit-outcome-badge").textContent, "VENTURE DEFICIT");
});

test("cash below −250 D ends the campaign early: −250 continues, −251 ends", () => {
  const e = loadEngine().start();
  e.state.cash = -210;
  e.rng.push(NO_STORY);
  e.g.waitInPort();                           // −250 exactly: continues
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.ended, false);
  e.rng.push(NO_STORY);
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.ended, true);
  assert.equal(e.state.monthIndex, 2);

  // The other side of the threshold: one wait (40 D) from −211 lands on −251 and ends.
  const f = loadEngine().start();
  f.state.cash = -211;
  f.rng.push(NO_STORY);
  f.g.waitInPort();
  assert.equal(f.state.cash, -251);
  assert.equal(f.state.ended, true);
  assert.equal(f.state.monthIndex, 1);
});

test("after the campaign ends, no action changes the result", () => {
  const e = loadEngine().start();
  e.g.finishCampaign();
  const cash = e.state.cash;
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  e.g.sailTo("aden");
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, cash);
  assert.equal(e.state.currentPort, "calicut");
  assert.equal(e.rng.calls, 0);
});

test("finishCampaign audit tallies: crew, winds, freight, layovers, ports, standing", () => {
  const e = loadEngine().start();               // Calicut, January, dhow, normal
  e.state.cargo.teak = 2;                       // 20 t bulk
  e.state.cargo.pepper = 5;                     // 10 t, tallied as luxury (D02)
  e.rng.push(NO_STORY);
  e.g.waitInPort();                             // Feb; Calicut standing 25
  e.rng.push(0.99);
  e.g.sailTo("aden");                           // Feb, NE monsoon: tailwind, 1 month
  e.rng.push(0.9, 0.99);
  e.g.sailTo("calicut");                        // Mar, transition: calm, 81 days = 3 months
  e.rng.push(0.99);
  e.g.sailTo("malacca");                        // Jun, SW monsoon: tailwind, 1 month
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.monthIndex, 6);
  e.g.finishCampaign();
  // crew: 100 → 92 → 68 → 60, no mutiny draw (health never below 50)
  assert.equal(e.el("audit-crew").textContent, "Final crew health: 60% • Mutinies: 0");
  assert.equal(e.el("audit-wind-ratio").textContent, "2 Tailwind / 1 Adverse or Dead-Zone");
  // three voyages × (20 t bulk, 10 t pepper), counted at departure (D02, D03)
  assert.equal(e.el("audit-cargo-mix").textContent, "60T Bulk / 30T Luxury Shipped");
  assert.equal(e.el("audit-layovers").textContent, "1 months wintered in ports");
  assert.equal(e.el("audit-ports-visited").textContent, "3 / 5 Emporia Visited");
  // standing: Calicut 10 + 15 + 5 = 30, Aden 5, Malacca 5
  assert.equal(e.el("audit-diaspora-score").textContent, "Basin Diaspora Standing: 40 pts");
});
