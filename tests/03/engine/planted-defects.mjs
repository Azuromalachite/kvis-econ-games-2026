// Shows that the engine tests can fail.
//
//   node tests/03/engine/planted-defects.mjs
//
// For each entry below it copies index.html to a temporary folder, makes one
// small change, runs the whole engine suite against the copy (MONSOON_INDEX),
// and checks that the named test fails. index.html itself is never written.
// A change that leaves the expected test passing is a hole in the suite, and
// this script exits non-zero.
//
// The D01/D07/D08 entries are rough stand-ins for a fix, not fixes: they show
// that a pinned defect cannot change without its test noticing.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { DEFAULT_INDEX } from "./load-engine.mjs";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

// [kind, change, find, replace, test-name pattern that must fail]
// `find` is a string or a /g regex (index.html has used both CRLF and LF line endings,
// so a change spanning lines uses \s* rather than a literal newline).
const PLANTS = [
  ["trade", "Calicut tariff 4% → 5%", "tariff: 0.04,", "tariff: 0.05,", /buying adds the port tariff/],
  ["trade", "sales lose 1%", "const totalRev = actualQty * livePrice;", "const totalRev = Math.round(actualQty * livePrice * 0.99);", /selling does not/],
  ["trade", "price wave ±8% → ±9%", "const mult = 1 + wave * 0.08;", "const mult = 1 + wave * 0.09;", /seasonal formula/],
  ["wait", "standing-20 discount ×0.75 → ×0.8", "else if (standing >= 20) diasporaMult = 0.75;", "else if (standing >= 20) diasporaMult = 0.8;", /four waits in a row|port fee thresholds/],
  ["wait", "standing +15 → +10 per month", "(state.diaspora[state.currentPort] || 0) + 15)", "(state.diaspora[state.currentPort] || 0) + 10)", /raises standing by 15/],
  ["wait", "story chance 0.75 → 0.8", "if (Math.random() < 0.75) {", "if (Math.random() < 0.8) {", /one month in port costs/],
  ["sail", "wages +1 D per voyage", "const crewCost = vessel.upkeep * calc.months;", "const crewCost = vessel.upkeep * calc.months + 1;", /wages are months at sea/],
  ["sail", "turn-back 0.35 → 0.36", "if (Math.random() < 0.35) {", "if (Math.random() < 0.36) {", /exactly 0.35 does not turn back/],
  ["sail", "turned-back ships still face pirates", /(\/\/ 4\. Piracy Check[^\r\n]*\s*)if \(!turnedBack\) \{/g, "$1if (true) {", /turn-back below 0.35/],
  ["sail", "jettison 0.4 → 0.45", "state.cargo.teak > 0 && Math.random() < 0.4", "state.cargo.teak > 0 && Math.random() < 0.45", /jettisons one teak lot/],
  ["sail", "becalmed band 0.25 → 0.2", "roll < stormThreshold + 0.25", "roll < stormThreshold + 0.2", /becalmed/],
  ["sail", "porcelain loss 20% → 30%", "Math.floor(state.cargo.porcelain * 0.2)", "Math.floor(state.cargo.porcelain * 0.3)", /porcelain loses 20%/],
  ["sail", "textile squall 0.35 → 0.3", "calc.isDeadZone && Math.random() < 0.35", "calc.isDeadZone && Math.random() < 0.3", /textiles lose one bale/],
  ["sail", "luxury piracy ×1.5 → ×1.4", "(hasHighValue ? 1.5 : 0.6)", "(hasHighValue ? 1.4 : 0.6)", /takes a crate of cloves first/],
  ["sail", "marines ×0.2 → ×0.25", "pirateProb *= 0.2;", "pirateProb *= 0.25;", /marines multiply/],
  ["sail", "mutiny costs 3 months' wages", "const settlement = 2 * vessel.upkeep;", "const settlement = 3 * vessel.upkeep;", /mutiny: probability/],
  ["debt", "interest 5% → 6%", "Math.round(state.debt * 0.05)", "Math.round(state.debt * 0.06)", /5% interest is added/],
  ["settlement", "liquidate at the current month, not month 23", "getLivePortPrice(c, state.currentPort, Math.min(23, state.monthIndex))", "getLivePortPrice(c, state.currentPort, state.monthIndex)", /finishCampaign at month 24/],
  ["settlement", "loan not deducted at the end", /state\.cash -= state\.debt;(\s*state\.debt = 0;)/g, "$1", /finishCampaign at month 24/],
  ["settlement", "target badge needs more than the target", "if (netProfit >= state.targetProfit) {", "if (netProfit > state.targetProfit) {", /outcome badge/],
  // Every test fails here, by design: the throwing Math.random fires wherever a transit is computed.
  ["preview", "computeTransit draws a random number", "const activeIdx = monthIdxOverride", "Math.random(); const activeIdx = monthIdxOverride", /leave state unchanged and draw no random/, { allFail: true }],
  ["preview", "getWaitingCosts changes standing", "const { currentPort } = state;", "const { currentPort } = state; state.diaspora[currentPort] = (state.diaspora[currentPort] || 0) + 1;", /leave state unchanged and draw no random/],
  ["transit", "dhow α 0.85 → 0.86", "agility: 0.85,", "agility: 0.86,", /matches all 480 rows/],
  // Added after the review of 3f70946, which found these survived the first suite.
  ["sail", "storm damage ignores ship and difficulty", "const dmg = Math.round((22 + Math.random() * 16) * vessel.stormResist * diff.stormMult);", "const dmg = Math.round(22 + Math.random() * 16);", /storm damage is/],
  ["sail", "storm damage range 16 → 10", "(22 + Math.random() * 16)", "(22 + Math.random() * 10)", /storm damage is/],
  ["trade", "cost basis keeps the first price", "state.costBasis[id] = Math.round((prevTotalBasis + totalCost) / state.cargo[id]);", "state.costBasis[id] = prevUnits > 0 ? state.costBasis[id] : unitCost;", /cost basis/],
  ["sail", "marines ×0.2 → ×0.1", "pirateProb *= 0.2;", "pirateProb *= 0.1;", /marines multiply/],
  ["sail", "piracy standing threshold 50 → 40", "if (destStanding >= 50) pirateProb *= 0.5;", "if (destStanding >= 40) pirateProb *= 0.5;", /standing of 50 halves/],
  ["sail", "survival piracy ×1.8 → ×2.5", "(state.diffKey === \"survival\" ? 1.8 : 1.0)", "(state.diffKey === \"survival\" ? 2.5 : 1.0)", /survival multiplies/],
  ["wait", "port-fee threshold 20 → 25", "else if (standing >= 20) diasporaMult = 0.75;", "else if (standing >= 25) diasporaMult = 0.75;", /port fee thresholds/],
  ["wait", "port-fee threshold 50 → 55", "if (standing >= 50) diasporaMult = 0.5;", "if (standing >= 55) diasporaMult = 0.5;", /port fee thresholds/],
  ["sail", "mutiny costs a flat 30 D", "const settlement = 2 * vessel.upkeep;", "const settlement = 30;", /mutiny: probability/],
  ["sail", "arrival standing capped at 50", "state.diaspora[destId] = Math.min(100, (state.diaspora[destId] || 0) + 5);", "state.diaspora[destId] = Math.min(50, (state.diaspora[destId] || 0) + 5);", /arrival raises/],
  ["settlement", "audit wind ratio swapped", "`${state.stats.goodWinds} Tailwind / ${state.stats.badWinds} Adverse", "`${state.stats.badWinds} Tailwind / ${state.stats.goodWinds} Adverse", /audit tallies/],
  ["settlement", "freight tally drops luxury tonnage", "state.stats.luxuryTonsShipped += luxury;", "state.stats.luxuryTonsShipped += 0;", /audit tallies/],
  // Added after the re-verification of 7e67126.
  ["settlement", "bankruptcy threshold −250 → −260", "state.cash < -250", "state.cash < -260", /−250 continues, −251 ends/],
  ["sail", "headwind hull floor 5 → 0", /Math\.max\(5, state\.hull - dmg\);(\s*eventNotes\.push\(`Fought)/g, "Math.max(0, state.hull - dmg);$1", /floors: hull never drops below 5/],
  ["sail", "storm hull floor 5 → 0", /Math\.max\(5, state\.hull - dmg\);(\s*eventNotes\.push\(`Struck)/g, "Math.max(0, state.hull - dmg);$1", /floors: hull never drops below 5/],
  ["sail", "crew health not floored at 0", "state.crewHealth = Math.max(0, state.crewHealth - crewHealthLoss);", "state.crewHealth = state.crewHealth - crewHealthLoss;", /floors: hull never drops below 5/],
  // Game modes (main 8267088, 29f2354).
  ["modes", "play mode keeps a typed target", ": state.targetProfit;", ": parseInt(document.getElementById(\"input-target-profit\").value, 10) || state.targetProfit;", /play mode ignores the student form/],
  ["modes", "student mode skips validation", "if (student && (!name", "if (false && (!name", /student mode refuses to start/],
  ["modes", "export reflection minimum 15 → 10", "state.reflection.length >= 15", "state.reflection.length >= 10", /audit export needs student mode/],
  ["defect pin", "D02 stand-in: count semi-bulk as bulk", "if (c.category === \"Bulk\") bulk += tons;", "if (c.category !== \"Luxury\") bulk += tons;", /DEFECT D02/],
  ["defect pin", "D03 stand-in: skip the tally on headwind voyages", "state.stats.bulkTonsShipped += bulk;", "state.stats.bulkTonsShipped += calc.isHeadwind ? 0 : bulk;", /DEFECT D03/],
  ["defect pin", "D01 stand-in: clamp time at month 24", "state.monthIndex += months;", "state.monthIndex = Math.min(CAMPAIGN_MONTHS, state.monthIndex + months);", /DEFECT D01/],
  ["defect pin", "D07 stand-in: label early ends", "addLog(`Month 24 Liquidation:", "addLog(`${state.monthIndex >= CAMPAIGN_MONTHS ? \"Month 24\" : \"Early\"} Liquidation:", /DEFECT D07/],
  ["defect pin", "D08 stand-in: log voyages at the arrival month", "addLog(`${routeLabel} (", "state.monthIndex += calc.months; addLog(`${routeLabel} (", /DEFECT D08/]
];

const sha256 = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const hashBefore = sha256(DEFAULT_INDEX);
const original = readFileSync(DEFAULT_INDEX, "utf8");
const dir = mkdtempSync(join(tmpdir(), "monsoon-plant-"));
let holes = 0;

function runSuite(index) {
  const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "tests/03/engine/*.test.mjs"], {
    cwd: repoRoot, env: { ...process.env, MONSOON_INDEX: index }, encoding: "utf8"
  });
  const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1]);
  const passed = Number(/^# pass (\d+)/m.exec(r.stdout)?.[1] ?? NaN);
  return { failed, passed, status: r.status };
}

try {
  const clean = runSuite(DEFAULT_INDEX);
  console.log(`unchanged engine: ${clean.passed} passed, ${clean.failed.length} failed`);
  if (clean.failed.length || !(clean.passed > 0)) throw new Error("the suite must pass on the unchanged engine first");

  for (const [kind, label, find, replace, expect, { allFail = false } = {}] of PLANTS) {
    const count = typeof find === "string" ? original.split(find).length - 1 : (original.match(find) || []).length;
    if (count !== 1) { console.log(`HOLE   [${kind}] ${label}: target text found ${count} times, expected once`); holes++; continue; }
    // When the "fix" for D08 bumps the month for the log line, undo it before advancing time.
    let planted = original.replace(find, replace);
    if (label.startsWith("D08")) {
      const undo = "advanceTime(calc.months);";
      if (planted.split(undo).length !== 2) throw new Error("D08 stand-in: advanceTime(calc.months) not found exactly once");
      planted = planted.replace(undo, "state.monthIndex -= calc.months; advanceTime(calc.months);");
    }
    const path = join(dir, "index.html");
    writeFileSync(path, planted);
    const { failed, passed } = runSuite(path);
    // A copy that breaks loading fails every test and would look "caught";
    // require some tests to still pass unless every test failing is the point.
    const loaded = allFail || passed > 0;
    const caught = loaded && failed.some(name => expect.test(name));
    if (!caught) holes++;
    const why = !loaded ? " (no test passed: the planted copy probably failed to load)" : caught ? "" : ` (expected one matching ${expect})`;
    console.log(`${caught ? "caught" : "HOLE  "} [${kind}] ${label}: ${failed.length} failed, ${passed} passed${why}`);
    for (const name of failed) console.log(`         - ${name}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const hashAfter = sha256(DEFAULT_INDEX);
console.log(`\nindex.html ${hashAfter === hashBefore ? "unchanged" : "CHANGED"}: sha256 ${hashBefore.slice(0, 12)} before, ${hashAfter.slice(0, 12)} after`);
console.log(holes ? `${holes} planted change(s) not caught.` : `All ${PLANTS.length} planted changes caught.`);
process.exit(holes || hashAfter !== hashBefore ? 1 : 0);
