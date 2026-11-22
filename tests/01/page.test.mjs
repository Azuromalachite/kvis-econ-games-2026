// Packaging check for projects/01/index.html (AGENTS.md rules 3 and 4).
//
// Run: node --test tests/01/page.test.mjs
// WEEK1_INDEX=<path> checks another copy of the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/01/index.html", import.meta.url));
const index = process.env.WEEK1_INDEX || DEFAULT_INDEX;
const html = readFileSync(index, "utf8");

// The released cdnjs builds, embedded byte for byte.
const VENDOR = {
  // https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
  "vendor-jspdf": "98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875",
  // https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
  "vendor-html2canvas": "e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb",
};
// What rule 3 allows a hand-written page to load, plus the shared theme (rule 4).
const ALLOWED_LINKS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  /^<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*">$/,
  '<link rel="stylesheet" href="../../assets/theme.css">',
];
// Classes defined by the page's own rules rather than as utilities.
const OWN_CLASSES = new Set(["custom-scrollbar", "pulse-node"]);
// CSS named colours (CSS Color Module Level 4), so `color:red` counts as hard-coded.
const NAMED_COLOURS = ("aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
  "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan " +
  "darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen " +
  "darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey " +
  "darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite " +
  "forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink " +
  "indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral " +
  "lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
  "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta " +
  "maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue " +
  "mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite " +
  "navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise " +
  "palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown " +
  "royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray " +
  "slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke " +
  "yellow yellowgreen").split(" ");

const vendorBlock = id => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`));
// The page without the library bodies, so their text can't hide or fake a match.
const rest = Object.keys(VENDOR).reduce((s, id) => (vendorBlock(id) ? s.replace(vendorBlock(id)[0], "") : s), html);
const styleMatch = rest.match(/<style id="week1-style">([\s\S]*?)<\/style>/);
const style = styleMatch ? styleMatch[1] : "";
const markup = styleMatch ? rest.replace(styleMatch[0], "") : rest;

test("the page is LF only", () => {
  assert.ok(!html.includes("\r"), "carriage return found");
});

test("jsPDF and html2canvas are the released builds, unmodified", () => {
  for (const [id, want] of Object.entries(VENDOR)) {
    const m = vendorBlock(id);
    assert.ok(m, `<script id="${id}"> not found`);
    assert.equal(createHash("sha256").update(m[1], "utf8").digest("hex"), want, `${id} bytes changed`);
  }
});

test("nothing remote except Google Fonts; the shared theme is linked first", () => {
  assert.deepEqual([...markup.matchAll(/<(\w+)\b[^>]*\ssrc\s*=/gi)].map(m => m[0]), [], "an element with src= found");
  const links = [...markup.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  for (const link of links) {
    assert.ok(ALLOWED_LINKS.some(a => (typeof a === "string" ? a === link : a.test(link))), `unexpected ${link}`);
  }
  assert.ok(links.includes('<link rel="stylesheet" href="../../assets/theme.css">'), "assets/theme.css is not linked");
  assert.ok(rest.indexOf("assets/theme.css") < rest.indexOf('<style id="week1-style">'), "theme.css must come before the page's style");
  for (const css of [style, ...[...markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1])]) {
    assert.ok(!/@import/i.test(css), "CSS @import found");
    assert.ok(!/url\(/i.test(css), "CSS url() found");
  }
});

test("the page has one style element, with no hard-coded colours", () => {
  assert.ok(styleMatch, '<style id="week1-style"> not found');
  assert.equal([...markup.matchAll(/<style\b/gi)].length, 0, "another <style> element found");
  // Attribute selectors may name the fixed colours the game script writes (the route map).
  const css = style.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\[[^\]]*\]/g, "");
  // Custom properties (--gold) are names, not colours: drop them before matching words.
  const words = css.replace(/--[\w-]+/g, "");
  const found = [
    ...(css.match(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi) ?? []),
    ...(words.match(new RegExp(`(?<![\\w-])(?:${NAMED_COLOURS.join("|")})(?![\\w-])`, "gi")) ?? []),
  ];
  assert.deepEqual(found, [], `hard-coded colour: ${found}`);
});

test("every class the page uses has a rule", () => {
  const tokens = new Set();
  for (const m of markup.matchAll(/\bclass(?:Name)?\s*=\s*(["'`])([^"'`]*)\1/g)) m[2].split(/\s+/).filter(Boolean).forEach(t => tokens.add(t));
  for (const m of markup.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g)) for (const q of m[1].matchAll(/(["'])([^"']+)\1/g)) tokens.add(q[2]);
  const esc = t => t.replace(/[^a-zA-Z0-9_-]/g, c => "\\" + c);
  const missing = [...tokens].filter(t => !OWN_CLASSES.has(t) && !new RegExp("\\." + esc(esc(t)) + "(?![a-zA-Z0-9_-])").test(style));
  assert.deepEqual(missing, [], "classes with no rule");
  assert.ok(tokens.size > 100, `only ${tokens.size} class names found; is the scan broken?`);
});

test("the inline scripts parse", () => {
  const scripts = [...markup.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1, "expected one game script");
  for (const m of scripts) new vm.Script(m[1]);
});
