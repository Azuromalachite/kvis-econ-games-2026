// Shared harness for the Atlas adapter checks: the real engine and the real adapter in a Node vm with a minimal DOM.
// Every Math.random() call is forced to 0 or 0.999 by a seeded bit stream and tagged with the engine source line
// that made it, so tests can take ground truth from the engine's own draws.
import vm from "node:vm";

export function scripts(html) {
  const engine = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const adapter = html.match(/<script id="atlas-adapter">([\s\S]*?)<\/script>/);
  if (engine.length !== 1 || !adapter) throw new Error("expected one engine <script> and the atlas-adapter script");
  return { engine: engine[0], adapter: adapter[1] };
}

export const SITES = [
  [/\(20 \+ Math\.random\(\) \* 14\)/, "headwind-damage"],
  [/^\s*if \(Math\.random\(\) < 0\.35\) \{/, "turnback"],
  [/state\.cargo\.teak > 0 && Math\.random\(\) < 0\.4/, "jettison"],
  [/const roll = Math\.random\(\)/, "deadzone-roll"],
  [/\(22 \+ Math\.random\(\) \* 16\)/, "cyclone-damage"],
  [/calc\.isDeadZone && Math\.random\(\) < 0\.35/, "mildew"],
  [/Math\.random\(\) < pirateProb/, "piracy"],
  [/Math\.random\(\) < mutinyRisk/, "mutiny"],
];

export function makeDom() {
  const byId = new Map();
  class El {
    constructor(id = "") { this._id = ""; this.id = id; this.className = ""; this.innerHTML = ""; this.textContent = ""; this.value = ""; this.style = { setProperty() {} }; this.dataset = {}; this.attributes = {}; this.disabled = false; this.hidden = false; this.listeners = {}; this.tabIndex = 0; this.open = false; this.href = ""; this.htmlFor = ""; }
    set id(v) { this._id = v; if (v) byId.set(v, this); } get id() { return this._id; }
    get classList() { const e = this; return { add(...v) { e.className = [...new Set([...e.className.split(" "), ...v])].join(" "); }, remove(...v) { e.className = e.className.split(" ").filter(x => !v.includes(x)).join(" "); }, contains(v) { return e.className.split(" ").includes(v); }, toggle(v, f) { (f ?? !this.contains(v)) ? this.add(v) : this.remove(v); } }; }
    get parentElement() { return this._p ??= new El(); } get firstElementChild() { return this._f ??= new El(); } get lastElementChild() { return this._l ??= new El(); }
    get children() { return []; } get nextElementSibling() { return null; }
    querySelector(s) { this._q ??= new Map(); if (!this._q.has(s)) this._q.set(s, new El()); return this._q.get(s); }
    querySelectorAll() { return []; } closest() { return this.parentElement; } matches() { return false; }
    setAttribute(k, v) { this.attributes[k] = String(v); } getAttribute(k) { return this.attributes[k] ?? null; } removeAttribute(k) { delete this.attributes[k]; }
    append() {} prepend() {} after() {} before() {} remove() {} replaceWith() {} insertAdjacentHTML() {} appendChild() {} dispatchEvent() {}
    addEventListener(t, f) { this.listeners[t] = f; } focus() {} scrollIntoView() {} showModal() { this.open = true; } close() { this.open = false; }
    getBoundingClientRect() { return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }; }
  }
  const get = id => { if (!byId.has(id)) new El(id); return byId.get(id); };
  const document = { getElementById: get, querySelector: s => get(s), querySelectorAll: () => [], createElement: () => new El(), createElementNS: () => new El(), addEventListener() {}, body: new El("body"), activeElement: new El(), hidden: false };
  return { document, get };
}

export function load(page, seed, constants = () => ({})) {
  const { engine, adapter } = scripts(page);
  const engineLines = engine.split("\n");
  const { document, get } = makeDom();
  let s = seed >>> 0; const bit = () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 16) & 1; };
  const draws = [];
  const ctx = vm.createContext({ document, console, matchMedia: () => ({ matches: false }), location: { reload() {}, pathname: "/" }, print() {}, setTimeout: () => 0, clearTimeout() {}, Event: class { constructor(t) { this.type = t; } } });
  ctx.window = ctx;
  vm.runInContext(engine, ctx, { filename: "engine.js" });
  ctx.__next = () => (bit() ? 0 : 0.999);
  ctx.__record = (stack, value) => { const m = stack.match(/at (?:Object\.)?(\w+) \(engine\.js:(\d+):/); draws.push({ fn: m?.[1], line: m ? engineLines[Number(m[2]) - 1] : "", value }); };
  vm.runInContext(`Math.random=function(){const v=__next();__record(new Error().stack,v);return v;};globalThis.__api={get state(){return state},PORTS,SEA_LANES,MONTHS,VESSELS,DIFFICULTIES,CAMPAIGN_MONTHS};`, ctx, { filename: "harness.js" });
  vm.runInContext(adapter, ctx, { filename: "adapter.js" });
  return { g: ctx, api: ctx.__api, get, draws, engine, K: constants(engine) };
}

