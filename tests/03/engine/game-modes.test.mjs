// Play Only and Student Mode (added on main in 8267088 and 29f2354).
// Setup, validation and the audit's student fields; the trading and sailing
// engine is the same in both modes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEngine } from "./load-engine.mjs";

test("play mode is the default and starts with no student details", () => {
  const e = loadEngine();
  assert.equal(e.state.mode, "play");
  e.g.selectVessel("dhow");
  e.g.selectDifficulty("normal");
  e.g.document.getElementById("input-start-port").value = "calicut";
  e.g.startSimulation();                        // name, ID, target, hypothesis all empty
  assert.equal(e.state.cash, 1500);
  assert.equal(e.state.studentName, "");
  assert.equal(e.state.studentId, "");
  assert.equal(e.state.hypothesis, "");
  assert.equal(e.state.targetProfit, 1200);     // the default target
  assert.ok(e.logs().some(l => l.includes("Charter signed at Calicut")));
  assert.ok(e.el("setup-error").classList.contains("hidden"));
});

test("play mode ignores the student form, including a typed target", () => {
  const e = loadEngine();
  const set = (id, v) => { e.g.document.getElementById(id).value = v; };
  set("input-name", "Test Student");
  set("input-id", "T-0000");
  set("input-target-profit", "5000");
  set("input-hypothesis", "Sail the junk with the NE monsoon.");
  set("input-start-port", "aden");
  e.g.startSimulation();
  assert.equal(e.state.currentPort, "aden");
  assert.equal(e.state.studentName, "");
  assert.equal(e.state.targetProfit, 1200);
});

test("student mode refuses to start without the student details", () => {
  const e = loadEngine();
  e.g.selectGameMode("student");
  e.g.document.getElementById("input-start-port").value = "aden";
  e.g.startSimulation();
  assert.ok(!e.el("setup-error").classList.contains("hidden"));
  assert.match(e.el("setup-error").textContent, /name, student number, a profit target of at least 100 D/);
  assert.equal(e.state.currentPort, "calicut");  // not started: still the initial state
  assert.equal(e.state.logs.length, 0);

  const low = loadEngine().start({ mode: "student", target: 150 });
  assert.equal(low.state.targetProfit, 150);
  const f = loadEngine();
  f.g.selectGameMode("student");
  for (const [id, v] of [["input-name", "Test Student"], ["input-id", "T-0000"], ["input-target-profit", "99"],
    ["input-hypothesis", "Sail the dhow with the SW monsoon."], ["input-start-port", "calicut"]]) f.g.document.getElementById(id).value = v;
  f.g.startSimulation();                        // target below 100
  assert.equal(f.state.logs.length, 0);
});

test("finishCampaign: student mode shows the student line; play mode leaves it blank and marks the audit play-only", () => {
  const s = loadEngine().start({ mode: "student" });
  s.g.finishCampaign();
  assert.equal(s.el("audit-student-meta").textContent, "Student: Test Student | Student no.: T-0000");
  assert.ok(!s.el("phase-audit").classList.contains("play-only"));

  const p = loadEngine().start({ mode: "play" });
  p.g.finishCampaign();
  assert.equal(p.el("audit-student-meta").textContent, "");
  assert.ok(p.el("phase-audit").classList.contains("play-only"));
  // The settlement itself is the same in both modes.
  assert.equal(p.el("audit-net-profit").textContent, "+0 D");
  assert.equal(p.el("audit-roi").textContent, "0% (Goal: +1200 D)");
});

test("audit export needs student mode, an ended campaign and a reflection of at least 15 characters", () => {
  const s = loadEngine().start({ mode: "student" });
  const reflect = text => { s.g.document.getElementById("input-reflection").value = text; s.g.syncReflection(); };
  reflect("Waited for June.");                    // 16 characters, but the campaign has not ended
  assert.equal(s.g.canExportStudentAudit(), false);
  s.g.finishCampaign();
  reflect("Too short.");                          // 10 characters
  assert.equal(s.g.canExportStudentAudit(), false);
  assert.equal(s.el("btn-export-pdf").disabled, true);
  reflect("123456789012345");                     // exactly 15
  assert.equal(s.g.canExportStudentAudit(), true);
  assert.equal(s.el("btn-export-pdf").disabled, false);
  assert.equal(s.el("btn-print-audit").disabled, false);

  const p = loadEngine().start({ mode: "play" });
  p.g.finishCampaign();
  p.g.document.getElementById("input-reflection").value = "A long enough reflection on the voyage.";
  p.g.syncReflection();
  assert.equal(p.g.canExportStudentAudit(), false);
  assert.equal(p.el("btn-export-pdf").disabled, true);
});

test("the engine is the same in both modes: one tailwind voyage", () => {
  for (const mode of ["play", "student"]) {
    const e = loadEngine().start({ mode });
    e.rng.push(0.99);
    e.g.sailTo("aden");
    assert.equal(e.rng.remaining, 0, "scripted draws left unused");
    assert.equal(e.state.cash, 1485, mode);
    assert.equal(e.state.monthIndex, 1, mode);
  }
});
