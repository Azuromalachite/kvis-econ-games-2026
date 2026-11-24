// The pilot's notebook in the Atlas adapter (KVIS #53, upstream #19): fixed text beside the voyage decision.
//
// Like atlas-decisions.test.mjs, this runs the real engine and the real adapter in a Node vm with a minimal DOM
// (atlas-harness.mjs). The notebook is static, so the checks are of two kinds:
//   - the copy keeps its rules: the required text and five dated, located sources; the game-rule box holds no history
//     and the history holds no game numbers; no banned reading (nationality, landmarks for Zhu Yu, a recorded wait);
//     landmarks only under Ibn Mājid; the Mao Kun date marked unresolved and no year for it in the visible text; no
//     per-passage pilot; no character the embedded fonts lack; at most 190 visible words;
//   - every number in the game-rule box is read from the copy and checked against the engine: the storm chance with
//     and without a navigator, the storm roll only in transition months, the speed multiplier on every leg (and at
//     least one leg where it saves no month), the turn-back chance and headwinds unchanged, the price and that the
//     navigator stays for the whole campaign.
// Each check fails on planted defects, and the preview-purity test (engine/preview-purity.test.mjs), which paints the
// notebook in every state, fails on a notebook that reads the game, draws a random number or is not hidden at the end.
//
// Run: node --test tests/03/atlas-notebook.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { load, SITES } from "./atlas-harness.mjs";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");

// A nested node --test must not inherit the parent run's NODE_TEST_CONTEXT, or it reports to the parent instead of as TAP.
const childEnv = index => { const env = { ...process.env, MONSOON_INDEX: index }; delete env.NODE_TEST_CONTEXT; return env; };
const text = html => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const site = line => SITES.find(([re]) => re.test(line))?.[1];

// The notebook's parts, as the adapter writes them.
function parts(page) {
  const { get } = load(page, 1);
  const html = get("atlas-pilot-notebook").innerHTML;
  const aside = html.match(/<aside\b[^>]*>([\s\S]*?)<\/aside>/)?.[1] ?? "";
  const details = html.match(/<details\b[^>]*>([\s\S]*?)<\/details>/)?.[1] ?? "";
  const visible = html.replace(/<details\b[\s\S]*?<\/details>/, "");
  const sources = [...details.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => m[1]);
  return { html, aside, asideText: text(aside), details, visible, visibleText: text(visible), sources, history: text(html.replace(/<aside\b[\s\S]*?<\/aside>/, "")) };
}

// --- The copy -----------------------------------------------------------------------------------------------------
const YEARS = [/1119/, /1103/, /1130s/, /1490/, /1621/];
const LOCATORS = [/oldid=353955/, /T-S 12\.392/, /T-S 12\.416/, /pp\. 19–20/, /juan 240/];
// The characters the page's embedded body font covers, read from the cmap tables of its "Atkinson Atlas" faces (regular
// and bold). Any other character outside the Chinese spans would fall back glyph by glyph to a system font.
function cmap(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), cps = new Set();
  const n = v.getUint16(4); let c = -1;
  for (let i = 0; i < n; i++) if (String.fromCharCode(...bytes.subarray(12 + 16 * i, 16 + 16 * i)) === "cmap") c = v.getUint32(12 + 16 * i + 8);
  if (c < 0) throw new Error("font without a cmap table");
  for (let i = 0, subs = v.getUint16(c + 2); i < subs; i++) {
    const t = c + v.getUint32(c + 8 + 8 * i), format = v.getUint16(t);
    if (format === 4) {
      const seg = v.getUint16(t + 6) / 2, ends = t + 14, starts = ends + 2 * seg + 2, deltas = starts + 2 * seg, ranges = deltas + 2 * seg;
      for (let k = 0; k < seg; k++) {
        const a = v.getUint16(starts + 2 * k), b = v.getUint16(ends + 2 * k), d = v.getInt16(deltas + 2 * k), r = v.getUint16(ranges + 2 * k);
        for (let cp = a; cp <= b && cp !== 0xffff; cp++) {
          let gl = r ? v.getUint16(ranges + 2 * k + r + 2 * (cp - a)) : cp;
          if (r && gl) gl += d; else if (!r) gl += d;
          if (gl & 0xffff) cps.add(cp);
        }
      }
    } else if (format === 12) {
      for (let k = 0, groups = v.getUint32(t + 12); k < groups; k++) { const a = v.getUint32(t + 16 + 12 * k), b = v.getUint32(t + 20 + 12 * k); for (let cp = a; cp <= b; cp++) cps.add(cp); }
    }
  }
  return cps;
}
function bodyGlyphs(page) {
  const faces = [...page.matchAll(/@font-face\{font-family:"Atkinson Atlas";src:url\(data:font\/ttf;base64,([A-Za-z0-9+/=]+)\)/g)].map(m => cmap(Buffer.from(m[1], "base64")));
  if (faces.length < 2) throw new Error(`expected the regular and bold Atkinson Atlas faces, found ${faces.length}`);
  return cp => faces.every(f => f.has(cp));
}

export function copyProblems(page) {
  const p = parts(page), out = { required: [], sources: [], separation: [], banned: [], length: [], glyphs: [] };
  if (!p.html) { out.required.push("no #atlas-pilot-notebook"); return out; }
  for (const s of [/^<h3 id="atlas-pilot-notebook-heading">Pilot’s notebook<\/h3>/, /<h4>Keeping a heading<\/h4>/, /<h4>Checking position<\/h4>/, /<h4>Choosing a safe window<\/h4>/, /<h4>Later comparisons<\/h4>/, /<h4 id="atlas-pilot-rule-heading">Game rule<\/h4>/, /<span lang="zh-Hant">陰晦觀指南針<\/span>/, /“at the beginning of the season”/, /<summary>Sources \(5\)<\/summary>/, /<aside class="atlas-pilot-rule" aria-labelledby="atlas-pilot-rule-heading">/])
    if (!s.test(p.html)) out.required.push(`missing ${s}`);
  // Reading order: the four sub-heads, then the box, then Sources.
  const order = ["Keeping a heading", "Checking position", "Choosing a safe window", "Later comparisons", "atlas-pilot-rule-heading", "<details"].map(s => p.html.indexOf(s));
  if (order.some((x, i) => x < 0 || (i && x < order[i - 1]))) out.required.push(`reading order ${order}`);

  if (p.sources.length !== 5) out.sources.push(`${p.sources.length} sources`);
  p.sources.forEach((s, i) => {
    if (!YEARS[i]?.test(s)) out.sources.push(`source ${i + 1}: no year ${YEARS[i]}`);
    if (!LOCATORS[i]?.test(s)) out.sources.push(`source ${i + 1}: no locator ${LOCATORS[i]}`);
    if (i < 3 && !s.includes("Read 2026-11-24")) out.sources.push(`source ${i + 1}: no reading date`);
  });
  // Mao Kun: the Oxford page dates the treatise "about 1621"; the printing date stays unconfirmed. The visible text says
  // "c. 1621" and nothing firmer.
  if (!/compiled about 1621/.test(p.sources[4] ?? "") || !/printing date[^.]*unconfirmed/.test(p.sources[4] ?? "")) out.sources.push("the Mao Kun source does not give the Oxford date and the unconfirmed printing date");
  if (!/Mao Kun chart, from a treatise of c\. 1621/.test(p.visibleText) || /printed|1628|(?<!c\. )\b16\d\d\b/.test(p.visibleText)) out.sources.push("the visible text dates the Mao Kun chart more firmly than c. 1621");

  if (!/game rule/i.test(p.asideText)) out.separation.push("the box is not labelled Game rule");
  if (/historical|history|\b1\d{3}\b|Guangzhou|Aden|Ibn/i.test(p.asideText)) out.separation.push(`history in the game-rule box: ${p.asideText}`);
  if (/\b180 D\b|15%|18%/.test(p.history)) out.separation.push("game numbers outside the game-rule box");

  // Banned readings, sentence by sentence in the visible text and source by source (so "landmarks … Zhu Yu" means one
  // claim, not Ibn Mājid's landmarks followed by Zhu Yu's source further down).
  const visibleChunks = p.visible.split(/<\/(?:h3|h4|p)>/).flatMap(block => text(block).split(/(?<=[.!?”])\s+(?=[A-Z])/));
  for (const chunk of [...visibleChunks, ...p.sources.map(text)]) {
    if (/Chinese pilots|landmarks? .*Zhu Yu|Zhu Yu.*landmarks?|waited|recorded wait|voyage of 1103/i.test(chunk)) out.banned.push(`a banned reading: ${chunk}`);
    // The 1103 wish is not a completed act, and PGP 5417's ship was bound for the islands, not for Aden.
    if (/stopped (the|his) ship|ship (was )?stopped|halted|held (the|his) ship|delayed (the|his) (ship|departure)|\bsailed\b|(to|for|bound for) Aden/i.test(chunk)) out.banned.push(`a banned reading: ${chunk}`);
    // Landmarks only under Ibn Mājid: every chunk that mentions them names him.
    if (/landmark/i.test(chunk) && !/Ibn Mājid/.test(chunk)) out.banned.push(`landmarks without Ibn Mājid: ${chunk}`);
  }
  if (/per-passage|one passage at a time|for one passage/i.test(text(p.html))) out.banned.push("the per-passage pilot, which has not shipped");
  if (!/set out for the islands “at the beginning of the season”/.test(p.visibleText)) out.banned.push("PGP 5417's destination (the islands) is missing");

  const words = p.visibleText.split(/\s+/).filter(Boolean).length;
  if (words > 190) out.length.push(`${words} visible words`);
  const covered = bodyGlyphs(page);
  const lacking = [...new Set(text(p.html.replace(/<span lang="zh-Hant">[^<]*<\/span>/g, "")))].filter(ch => !covered(ch.codePointAt(0)));
  if (lacking.length) out.glyphs.push(`characters the embedded Atkinson faces lack: ${lacking.join(" ")}`);
  return out;
}

// --- The game rules against the engine ----------------------------------------------------------------------------
function started(page, port = "calicut", seed = 1) {
  const h = load(page, seed);
  h.get("input-start-port").value = port;
  h.g.selectVessel("dhow"); h.g.selectDifficulty("normal"); h.g.startSimulation();
  return h;
}
const number = (re, s, what) => { const m = s.match(re); if (!m) throw new Error(`the game-rule box gives no ${what}`); return m.slice(1).map(Number); };

export function engineProblems(page) {
  const out = { storm: [], transition: [], speed: [], turnback: [], price: [] };
  const rule = parts(page).asideText;
  const h = started(page), { g, api, engine } = h, st = api.state;
  const withNav = (nav, f) => { const was = st.specialists.navigator; st.specialists.navigator = nav; try { return f(); } finally { st.specialists.navigator = was; } };

  // Storm: 35% → 18% in a transition month (April).
  const [off, on] = number(/storm chance falls from (\d+)% to (\d+)%/, rule, "storm chance");
  const april = api.SEA_LANES.find(l => g.computeTransit(l, 3).isDeadZone);
  const pOff = withNav(false, () => g.computeTransit(april, 3).stormProbability), pOn = withNav(true, () => g.computeTransit(april, 3).stormProbability);
  if (Math.round(pOff * 100) !== off || Math.round(pOn * 100) !== on) out.storm.push(`engine ${pOff} → ${pOn}, copy ${off}% → ${on}%`);
  if (!/^In transition months/m.test(rule.split(/(?<=\.)\s+/).find(s => /storm/.test(s)) ?? "")) out.storm.push("the storm sentence does not limit itself to transition months");

  // The storm roll exists only in transition months: sail every lane in every month and look for the engine's roll.
  for (const lane of api.SEA_LANES) for (let m = 0; m < 12; m++) {
    const v = started(page, lane.from, 7 + m);
    Object.assign(v.api.state, { monthIndex: m, cash: 100000 });
    v.api.state.specialists.navigator = true;
    const dead = v.g.computeTransit(lane, m).isDeadZone, from = v.draws.length;
    v.g.sailTo(lane.to);
    const rolled = v.draws.slice(from).some(d => site(d.line) === "deadzone-roll");
    if (rolled !== dead) out.transition.push(`${lane.from}→${lane.to} month ${m}: storm roll ${rolled}, transition ${dead}`);
  }

  // Speed: every leg, every month, both ships; the multiplier is the copy's percentage.
  const [pct] = number(/Every leg is (\d+)% faster/, rule, "speed bonus");
  const mult = (100 + pct) / 100;
  let same = 0, saved = 0;
  for (const vessel of Object.keys(api.VESSELS)) {
    const was = st.vesselKey; st.vesselKey = vessel;
    const V = api.VESSELS[vessel];
    for (const lane of api.SEA_LANES) for (let m = 0; m < 12; m++) {
      const wind = g.getWindState(m);
      let f = Math.max(0.25, Math.cos(((lane.bearing - wind.bearing) * Math.PI) / 180) * V.agility + 0.5);
      if (wind.isDeadZone) f *= 0.65;
      const a = withNav(false, () => g.computeTransit(lane, m)), b = withNav(true, () => g.computeTransit(lane, m));
      if (a.days !== Math.round(lane.dist / (V.speed * f))) out.speed.push(`${vessel} ${lane.from}→${lane.to} ${m}: model differs from the engine without a navigator`);
      if (b.days !== Math.round(lane.dist / (V.speed * f * mult))) out.speed.push(`${vessel} ${lane.from}→${lane.to} ${m}: ${b.days} days with a navigator, ×${mult} gives ${Math.round(lane.dist / (V.speed * f * mult))}`);
      if (a.months === b.months) same++; else saved++;
      // Headwinds do not depend on the navigator.
      if (a.isHeadwind !== b.isHeadwind) out.turnback.push(`${vessel} ${lane.from}→${lane.to} ${m}: headwind changes with the navigator`);
    }
    st.vesselKey = was;
  }
  if (!same || !saved) out.speed.push(`${same} legs save no month, ${saved} save one or more: "some legs save no month" needs both`);

  // Turn-back: the engine's chance on a headwind, read from its source.
  const tb = engine.match(/if \(calc\.isHeadwind\) \{[\s\S]*?if \(Math\.random\(\) < ([\d.]+)\) \{\s*turnedBack = true;/);
  const [copyTb] = number(/(\d+)% turn-back chance are unchanged/, rule, "turn-back chance");
  if (!tb || Math.round(Number(tb[1]) * 100) !== copyTb) out.turnback.push(`engine ${tb?.[1]}, copy ${copyTb}%`);

  // Price, once, and for the whole campaign.
  // Price, once, and for the whole campaign: the same seed, port and 23 waits with and without a navigator, cash never
  // reset, must end exactly the price apart (a recurring charge fails), with the navigator still aboard.
  const [price] = number(/A navigator costs (\d+) D once/, rule, "price");
  const runs = [false, true].map(hire => {
    const p = started(page, "aden", 3), ps = p.api.state;
    ps.cash = 5000;
    if (hire) { p.g.hireSpecialist("navigator"); if (!ps.specialists.navigator || ps.cash !== 5000 - price) out.price.push(`hiring with 5000 D left ${ps.cash} D (navigator ${ps.specialists.navigator})`); }
    for (let k = 0; k < 23; k++) p.g.waitInPort();
    return { cash: ps.cash, month: ps.monthIndex, ended: ps.ended, navigator: ps.specialists.navigator };
  });
  if (runs.some(r => r.month !== 23 || r.ended)) out.price.push(`after 23 waits: ${JSON.stringify(runs)}`);
  if (!runs[1].navigator) out.price.push("the navigator left before the campaign ended");
  if (runs[0].cash - runs[1].cash !== price) out.price.push(`23 waits with a navigator cost ${runs[0].cash - runs[1].cash} D more than without one, not ${price}`);
  if (!/stays all campaign/.test(rule)) out.price.push("the box does not say the navigator stays all campaign");
  return out;
}

const failing = out => Object.entries(out).filter(([, v]) => v.length).map(([k]) => k);

test("the pilot's notebook copy keeps its rules", () => {
  const out = copyProblems(PAGE);
  for (const [k, v] of Object.entries(out)) assert.deepEqual(v, [], k);
});

test("every number in the game-rule box matches the engine", () => {
  const out = engineProblems(PAGE);
  for (const [k, v] of Object.entries(out)) assert.deepEqual(v.slice(0, 5), [], k);
});

const plant = (name, find, repl) => {
  const n = PAGE.split(find).length - 1;
  assert.equal(n, 1, `${name}: target found ${n} times`);
  return PAGE.replace(find, repl);
};

test("the copy check fails on planted defects", () => {
  for (const [name, page, which] of [
    ["Game rule relabelled Historical rule", plant("relabel", '<h4 id="atlas-pilot-rule-heading">Game rule</h4>', '<h4 id="atlas-pilot-rule-heading">Historical rule</h4>'), "separation"],
    ["a date in the game-rule box", plant("date in box", "Stars, needles and soundings are not modelled.", "Stars, needles and soundings (used from 1100) are not modelled."), "separation"],
    ["the price outside the box", plant("price outside", "neither records a voyage.", "neither records a voyage. A pilot cost 180 D."), "separation"],
    ["a nationality for Zhu Yu's pilots", plant("nationality", "ships’ pilots at Guangzhou", "Chinese pilots at Guangzhou"), "banned"],
    ["landmarks given to Zhu Yu", plant("landmarks", "watched the stars at night", "watched landmarks and the stars at night"), "banned"],
    ["the wish read as a wait", plant("wait", "wished he could stop the ship", "waited for the ship"), "banned"],
    ["the per-passage pilot announced", plant("per passage", "A navigator costs 180 D once and stays all campaign.", "A navigator costs 180 D once and stays all campaign. Soon a pilot is hired for one passage at a time."), "banned"],
    ["the Mao Kun date made firmer", plant("mao kun", "The Mao Kun chart, from a treatise of c. 1621,", "The Mao Kun chart, printed in 1621,"), "sources"],
    ["a source loses its locator", plant("locator", "T-S 12.392", "T-S 12.3"), "sources"],
    ["a font-missing ḍ restored", plant("glyph", "Madmun b. Hasan", "Maḍmūn b. Ḥasan"), "glyphs"],
    ["a font-missing ʿ and ṣ", plant("glyph 2", "Ibn Mājid (b. c. 1420", "Ibn Mājid of al-ʿAṣr (b. c. 1420"), "glyphs"],
    ["the 1103 wish read as done", plant("stopped", "wished he could stop the ship until the sea calmed", "stopped the ship until the sea calmed"), "banned"],
    ["PGP 5417 bound for Aden", plant("aden", "set out for the islands “at the beginning of the season”", "set out for Aden “at the beginning of the season”"), "banned"],
    ["the visible text grows past 190 words", plant("length", "neither records a voyage.", "neither records a voyage." + " The monsoon decided the calendar of every port.".repeat(3)), "length"],
  ]) {
    const failed = failing(copyProblems(page));
    assert.ok(failed.includes(which), `${name}: expected the ${which} check to fail, failed: ${failed.join(", ") || "none"}`);
  }
});

test("the engine check fails, on exactly one assertion, for each planted engine change", () => {
  for (const [name, page, which] of [
    ["storm 0.18 → 0.2", plant("storm", "navigator ? 0.18 : 0.35", "navigator ? 0.2 : 0.35"), "storm"],
    ["speed 1.15 → 1.2", plant("speed", "if (state.specialists.navigator) effFactor *= 1.15;", "if (state.specialists.navigator) effFactor *= 1.2;"), "speed"],
    ["price 180 → 200", plant("price", "navigator: 180,", "navigator: 200,"), "price"],
    ["storm roll in every month", PAGE.replace(/if \(calc\.isDeadZone\) \{(\s*const roll = Math\.random\(\);)/, "if (true) {$1"), "transition"],
    ["a navigator charge on every wait", plant("recurring", "const totalExpense = layoverFee + vessel.upkeep;", "const totalExpense = layoverFee + vessel.upkeep + (state.specialists.navigator ? 5 : 0);"), "price"],
    ["turn-back 0.35 → 0.4", plant("turnback", "if (Math.random() < 0.35) {\n          turnedBack = true;", "if (Math.random() < 0.4) {\n          turnedBack = true;"), "turnback"],
  ]) {
    assert.notEqual(page, PAGE, `${name}: plant not applied`);
    assert.deepEqual(failing(engineProblems(page)), [which], name);
  }
});

test("the preview-purity test fails on a notebook that reads the game, draws, or is shown at the wrong time", () => {
  const dir = mkdtempSync(join(tmpdir(), "monsoon-notebook-"));
  try {
    for (const [name, page] of [
      ["notebook repainted from the game state", plant("reads", "const paintNotebook=()=>{notebook.hidden=!!state.ended;};", "const paintNotebook=()=>{notebook.hidden=!!state.ended;notebook.innerHTML=notebook.innerHTML.split('<!--')[0]+'<!--'+state.specialists.navigator+'-->';};")],
      ["notebook draws a random number", plant("draws", "const paintNotebook=()=>{", "const paintNotebook=()=>{Math.random();")],
      ["notebook shown after the campaign", plant("shown", "notebook.hidden=!!state.ended;", "notebook.hidden=false;")],
      ["notebook not hidden on the real end path", plant("end path", "const r=notebookFinishOriginal.apply(this,args);paintNotebook();return r;", "const r=notebookFinishOriginal.apply(this,args);return r;")],
      ["notebook hidden during the voyage", plant("hidden", "notebook.hidden=!!state.ended;", "notebook.hidden=true;")],
    ]) {
      const path = join(dir, "index.html");
      writeFileSync(path, page);
      const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "tests/03/engine/preview-purity.test.mjs"], { cwd: REPO, env: childEnv(path), encoding: "utf8" });
      const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1]);
      assert.ok(failed.some(n => /pilot's notebook/.test(n)), `${name}: the purity test should fail (failed: ${failed.join("; ") || "none"}; ${r.stdout.slice(0, 200)} ${r.stderr.slice(0, 300)})`);
      assert.ok(Number(/^# pass (\d+)/m.exec(r.stdout)?.[1]) > 0, `${name}: the planted copy did not load`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
