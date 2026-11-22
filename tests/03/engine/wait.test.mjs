// Waiting a month in port: port fees, wages, standing, crew recovery, stories.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

const NO_STORY = 0.75; // the story roll is Math.random() < 0.75, so 0.75 means no story

test("one month in port costs the port fee plus wages and raises standing by 15", () => {
  const e = loadEngine().start(); // normal, dhow, Calicut, home standing 10
  e.rng.push(NO_STORY);
  e.g.waitInPort();
  // fee = round(25 × 1.0 × 1.0) = 25 (standing 10 < 20); wages 15
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 25 - 15);
  assert.equal(e.state.diaspora.calicut, 25);
  assert.equal(e.state.monthIndex, 1);
  assert.equal(e.state.stats.layoverMonths, 1);
  assert.equal(e.rng.calls, 1);
  assert.match(e.logs().at(-1), /Wintered 1 month in Calicut \(Layover: 25 D \+ Crew: 15 D; Standing: 25;/);
});

test("four waits in a row: standing 10, 25, 40, 55 pay fees of 25, 19, 19, 13", () => {
  const e = loadEngine().start();
  const cash = [e.state.cash];
  for (let i = 0; i < 4; i++) { e.rng.push(NO_STORY); e.g.waitInPort(); cash.push(e.state.cash); }
  assert.equal(e.rng.remaining, 0);
  const spent = cash.slice(1).map((c, i) => cash[i] - c);
  // standing before each wait: 10, 25, 40, 55
  // fees: 25, round(18.75) = 19, 19, round(12.5) = 13; plus 15 wages each
  assert.deepEqual(spent, [40, 34, 34, 28]);
  assert.equal(e.state.diaspora.calicut, 70);
});

test("port fee thresholds, checked on both sides: 19 and 20, 49 and 50", () => {
  const e = loadEngine().start();
  const fee = s => e.g.getEffectiveLayoverFee("calicut", s);
  assert.deepEqual([fee(19), fee(20), fee(49), fee(50)], [25, 19, 19, 13]);
  // The same thresholds through a real wait: what is charged is the fee at the standing before the wait.
  for (const [standing, fee] of [[19, 25], [20, 19], [49, 19], [50, 13]]) {
    const w = loadEngine().start();
    w.state.diaspora.calicut = standing;
    w.rng.push(NO_STORY);
    w.g.waitInPort();
    assert.equal(w.state.cash, 1500 - fee - 15, `standing ${standing}`);
  }
});

test("difficulty scales the port fee", () => {
  const easy = loadEngine().start({ difficulty: "easy" });
  assert.equal(easy.g.getEffectiveLayoverFee("calicut"), 15);    // 25 × 0.6
  const survival = loadEngine().start({ difficulty: "survival" });
  assert.equal(survival.g.getEffectiveLayoverFee("calicut"), 28); // round(27.5)
  assert.equal(survival.g.getEffectiveLayoverFee("aden"), 39);    // round(38.5)
});

test("crew health recovers 20 a month, capped at 100", () => {
  const e = loadEngine().start();
  e.state.crewHealth = 70;
  e.rng.push(NO_STORY);
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.crewHealth, 90);
  e.rng.push(NO_STORY);
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.crewHealth, 100);
});

test("port stories: Calicut's first story repairs 8% hull, its second pays 15 D", () => {
  const e = loadEngine().start();
  e.state.hull = 50;
  e.rng.push(0.7499, 0.0);          // story happens, picks vignettes[0]
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.hull, 58);
  assert.equal(e.state.cash, 1500 - 40);

  e.rng.push(0.0, 0.99);            // vignettes[1]: "+15 D"
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 40 - 34 + 15);
  assert.equal(e.rng.calls, 4);
});

test("port stories: Aden pays 25 D or 20 D", () => {
  const e = loadEngine().start({ port: "aden" }); // fee 35, home standing 10
  e.rng.push(0.0, 0.0);
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 35 - 15 + 25);
  e.rng.push(0.0, 0.99);
  e.g.waitInPort();
  // standing 25: fee round(26.25) = 26
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, 1500 - 35 - 15 + 25 - 26 - 15 + 20);
});

test("waiting after the campaign has ended does nothing", () => {
  const e = loadEngine().start();
  e.state.ended = true;
  const cash = e.state.cash;
  e.g.waitInPort();
  assert.equal(e.rng.remaining, 0, "scripted draws left unused");
  assert.equal(e.state.cash, cash);
  assert.equal(e.state.monthIndex, 0);
  assert.equal(e.rng.calls, 0);
});
