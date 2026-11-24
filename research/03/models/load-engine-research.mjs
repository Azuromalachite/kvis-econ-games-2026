// RESEARCH COPY of tests/03/engine/load-engine.mjs (at d83fd9f) for the
// depth-and-liquidity study (research/03/pre-registrations/2026-11-23-depth-liquidity.md).
// Differences from the test loader, and nothing else:
//   1. The engine script is evaluated with lineOffset 1588, so stack-trace line
//      numbers equal the line numbers of projects/03/index.html at d2d66a3, the
//      revision whose lines the protocol cites (check C4 (iv)). The engine
//      script is byte-identical at d83fd9f; see the protocol's section 9.
//   2. The extracted engine script must hash to ENGINE_SHA256, or loading fails.
//   3. LabelledRandom: a RandomScript that records, for every draw, the
//      index.html line of the Math.random() call that made it.
//   4. loadEngine accepts an rng to use in place of a fresh RandomScript.
//   5. Paths are relative to research/03/models/.
//
// Runs the game's own engine outside a browser, for the R5 regression tests.
//
// It reads index.html, takes the one inline <script> (the engine and UI code),
// and evaluates it unchanged in a fresh Node `vm` context with a small DOM
// stand-in. Nothing in index.html is edited or re-implemented: the tests call
// the real buyCargoQty, sailTo, finishCampaign and so on.
//
// Each loadEngine() call is a separate context, so tests never share state.
//
// Math.random in the context throws unless a test scripts it. A test that
// forgets to control randomness fails instead of passing by luck, and a
// function that should not draw (a preview) fails if it starts to.
//
// MONSOON_INDEX=<path> loads a different copy of index.html. It exists only so
// tests/03/engine/planted-defects.mjs can show that each test fails on a changed
// engine without touching the real file.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const DEFAULT_INDEX = fileURLToPath(new URL("../../../projects/03/index.html", import.meta.url));
const HARNESS = fileURLToPath(new URL("../../../tests/03/baseline-harness.js", import.meta.url));

export const ENGINE_SHA256 = "6fba1ee750cc251beaebeb12d1d9e76da9779f5c42b44a183189f084652eee5c";
export const LINE_OFFSET = 1588;
export const ENGINE_FILENAME = "monsoon-engine.js";
export const sha256 = x => createHash("sha256").update(x).digest("hex");

export function engineScript(html) {
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (inline.length !== 1) throw new Error(`expected exactly one inline <script> in index.html, found ${inline.length}`);
  return inline[0];
}

// --- DOM stand-in -----------------------------------------------------------
// Every element the code asks for exists and accepts writes. Elements are kept
// by id, so a test can read what finishCampaign wrote into the audit screen.

function makeElement(id) {
  const classes = new Set(["hidden"]);
  const el = {
    id, textContent: "", innerHTML: "", className: "", value: "", disabled: false, hidden: false,
    src: "", alt: "", href: "", style: {}, attributes: {},
    classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      // DOMTokenList.toggle(token, force): force true adds, false removes, absent flips.
      toggle: (c, force) => {
        const on = force === undefined ? !classes.has(c) : Boolean(force);
        if (on) classes.add(c); else classes.delete(c);
        return on;
      },
      contains: c => classes.has(c)
    },
    setAttribute(name, v) { el.attributes[name] = String(v); },
    getAttribute(name) { return el.attributes[name] ?? null; },
    querySelector: () => makeElement(null),
    querySelectorAll: () => [],
    appendChild: () => {},
    addEventListener: () => {},
    focus: () => {},
    scrollIntoView: () => {}
  };
  return el;
}

function makeDocument() {
  const byId = new Map();
  const getElementById = id => {
    if (!byId.has(id)) byId.set(id, makeElement(id));
    return byId.get(id);
  };
  return {
    byId,
    document: {
      getElementById,
      querySelector: () => makeElement(null),
      querySelectorAll: () => [],
      createElement: () => makeElement(null),
      addEventListener: () => {},
      body: makeElement("body")
    }
  };
}

// --- Controlled randomness ---------------------------------------------------

export class RandomScript {
  constructor() { this.queue = []; this.calls = 0; }
  // Values the next Math.random() calls return, in order.
  push(...values) { this.queue.push(...values); return this; }
  next() {
    this.calls += 1;
    if (this.queue.length === 0) throw new Error(`unscripted Math.random() call #${this.calls}`);
    return this.queue.shift();
  }
  get remaining() { return this.queue.length; }
}

// Records the caller's line for every draw. The first stack frame in the engine
// file is the Math.random() call site inside the engine function.
const FRAME = /monsoon-engine\.js:(\d+):\d+/;   // ENGINE_FILENAME
export class LabelledRandom extends RandomScript {
  constructor() { super(); this.lines = []; this.served = []; }
  next() {
    const m = FRAME.exec(new Error().stack);
    this.lines.push(m ? Number(m[1]) : null);
    const v = super.next();
    this.served.push(v);
    return v;
  }
}

// --- Loader ------------------------------------------------------------------

export function loadEngine({ index = process.env.MONSOON_INDEX || DEFAULT_INDEX, harness = false, rng = new LabelledRandom() } = {}) {
  const source = engineScript(readFileSync(index, "utf8"));
  if (sha256(source) !== ENGINE_SHA256) throw new Error(`engine script SHA-256 ${sha256(source)} is not the pinned ${ENGINE_SHA256}`);
  const { document, byId } = makeDocument();
  const context = vm.createContext({
    document,
    console,
    print: () => {},
    alert: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    requestAnimationFrame: () => 0
  });
  context.window = context;
  vm.runInContext(source, context, { filename: ENGINE_FILENAME, lineOffset: LINE_OFFSET });
  if (harness) vm.runInContext(readFileSync(HARNESS, "utf8"), context, { filename: HARNESS });
  // Top-level const/let bindings (state, PORTS, ...) are not properties of the
  // global object; a second script in the same context can still see them.
  vm.runInContext(
    `globalThis.__engine = {
      get state() { return state; },
      PORTS, SEA_LANES, COMMODITIES, VESSELS, DIFFICULTIES, MONTHS, CAMPAIGN_MONTHS
    };
    Math.random = () => globalThis.__rng.next();`,
    Object.assign(context, { __rng: rng })
  );
  const api = context.__engine;
  return {
    g: context,
    source,                        // the engine script actually evaluated                    // the game's global functions: g.sailTo(...), g.finishCampaign()
    get state() { return api.state; },
    PORTS: api.PORTS, SEA_LANES: api.SEA_LANES, COMMODITIES: api.COMMODITIES,
    VESSELS: api.VESSELS, DIFFICULTIES: api.DIFFICULTIES, MONTHS: api.MONTHS,
    CAMPAIGN_MONTHS: api.CAMPAIGN_MONTHS,
    rng,
    el: id => byId.get(id) ?? null, // what the page wrote into an element, or null if never touched
    lane(from, to) { return api.SEA_LANES.find(l => l.from === from && l.to === to); },
    // Logs oldest first (the game keeps them newest first).
    logs() { return [...api.state.logs].reverse(); },
    // The game's real setup path: selectGameMode, selectVessel, selectDifficulty,
    // startSimulation. Student mode (the default here) fills the student form,
    // with fictional details as CONTRIBUTING.md requires; play mode fills only
    // the starting port, as the page does.
    start({ mode = "student", vessel = "dhow", difficulty = "normal", port = "calicut", target = 1200 } = {}) {
      const set = (id, value) => { document.getElementById(id).value = value; };
      context.selectGameMode(mode);
      if (mode === "student") {
        set("input-name", "Test Student");
        set("input-id", "T-0000");
        set("input-target-profit", String(target));
        set("input-hypothesis", "Sail the dhow with the SW monsoon carrying pepper.");
      }
      set("input-start-port", port);
      context.selectVessel(vessel);
      context.selectDifficulty(difficulty);
      context.startSimulation();
      // A rejected setup leaves month 0 at Calicut too, so check what only a successful start writes.
      const name = mode === "student" ? "Test Student" : "";
      const started = api.state.mode === mode && api.state.studentName === name &&
        api.state.logs.some(l => l.includes("Charter signed"));
      if (!started || api.state.monthIndex !== 0 || api.state.currentPort !== port) throw new Error("startSimulation did not start the campaign");
      return this;
    }
  };
}

// Values created inside the vm context have that context's prototypes, which
// assert.deepStrictEqual treats as different. structuredClone makes host
// copies and, unlike a JSON round trip, keeps undefined, NaN and Sets.
export const plain = x => structuredClone(x);

