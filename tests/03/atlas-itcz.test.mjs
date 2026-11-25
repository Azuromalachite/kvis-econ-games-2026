// The ITCZ panel in the Atlas adapter (KVIS #52, upstream #18): a closed <details> under the month planner, outside
// the game map. Rebuilt after a pre-PR review: Schneider et al. (2014) Fig. 2b averages 65–95° E by latitude and
// month, so the ITCZ is shown only as a latitude marker beside each map, never as a band on it, and nothing in the
// panel comes from the game's wind (getWindState); the game's wind stays on the main map.
//
// Like atlas-notebook.test.mjs, this runs the real engine and the real adapter in a Node vm with a minimal DOM
// (atlas-harness.mjs), opens the panel through its own toggle listener and reads what it wrote. It checks:
//   - no getWindState call while the panel is built or painted, and nothing wind-like in its HTML (bearings, knots,
//     "from the …" directions, arrowheads);
//   - each figure's map holds one rectangle (the 800 × 450 ground) and no pattern, mask or other filled shape, and the
//     ITCZ appears only as one marker beside it;
//   - the markers sit at 20° N (June–August) and 8° S (December–February), as cited, on the game map's own projection
//     (the builder's fit, injected), and say so in text; the meridians sit at 65° and 95° E;
//   - the copy: the required phrases (the sector-average label and citation, "two seasonal positions, not a path",
//     "warming", the pointer to the main map's arrows), and no coastal-approach labels;
//   - the panel's colours are on the allow-list, and text and marks meet 4.5:1 and 3:1;
//   - opening the panel never touches #ocean-svg.
// Each check fails on planted defects; the preview-purity test paints with the panel closed and open and fails on a
// panel that draws, reads the game or changes the game map.
//
// Run: node --test tests/03/atlas-itcz.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { load } from "./atlas-harness.mjs";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
const childEnv = index => { const env = { ...process.env, MONSOON_INDEX: index }; delete env.NODE_TEST_CONTEXT; return env; };
const text = html => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));

// The game map's projection, as upstream scripts/coastline.mjs fitted it (prototype/coastline.json, "projection").
const COASTLINE_FIT = { x: [8.063653, -228.8374], y: [-7.455333, 269.2335] };
const X = lon => COASTLINE_FIT.x[0] * lon + COASTLINE_FIT.x[1], Y = lat => COASTLINE_FIT.y[0] * lat + COASTLINE_FIT.y[1];
// Schneider et al. (2014), p. 45: "average latitudes of 20° N in boreal summer and 8° S in boreal winter (Fig. 2b)".
const CITED = { summer: 20, winter: -8 };

// Fake coastline paths, so the test can require the panel's land to be exactly the game map's land.
const LAND = ["M10,10L40,10L40,40Z", "M500,100L520,120L500,140Z", "M700,300L760,300L730,340Z"];
// Ids on the game map whose content and attributes must not change when the panel opens.
const MAP_IDS = ["ocean-svg", "svg-wind-field", "svg-route-preview", "svg-sea-lanes", "svg-ports", "svg-clock-months", "atlas-hazards", "atlas-land"];

function opened(page) {
  // Timers run (setTimeout, requestAnimationFrame), so work deferred by the panel is counted too.
  const timers = [];
  const h = load(page, 1, () => ({}), { setTimeout: f => { timers.push(f); return timers.length; }, requestAnimationFrame: f => { timers.push(f); return timers.length; }, cancelAnimationFrame() {} });
  h.get("input-start-port").value = "calicut";
  h.g.selectVessel("dhow"); h.g.selectDifficulty("normal"); h.g.startSimulation();
  timers.length = 0;
  h.get("atlas-land").querySelectorAll = () => LAND.map(d => ({ getAttribute: k => (k === "d" ? d : null) }));
  const ocean = h.get("ocean-svg"), touched = [];
  for (const fn of ["append", "appendChild", "insertAdjacentHTML", "prepend", "replaceChildren"]) { const was = ocean[fn]; ocean[fn] = (...a) => { touched.push(fn); return was?.apply(ocean, a); }; }
  // A deep serialisation of the game map: content, attributes, dataset, class and style of every map element.
  const mapState = () => JSON.stringify(MAP_IDS.map(id => { const e = h.get(id); return [id, e.innerHTML, e.attributes, e.dataset, e.className, e.style, e.hidden]; }));
  const mapBefore = mapState(), stateBefore = JSON.stringify({ ...h.api.state, visitedPorts: [...h.api.state.visitedPorts] }), drawn = h.draws.length;
  // Count the game's wind function while the panel is built, while deferred work runs, and on the next repaints.
  const wind = h.g.getWindState; let windCalls = 0;
  const panel = h.get("atlas-itcz");
  h.g.getWindState = (...a) => { windCalls++; return wind(...a); };
  try {
    panel.open = true; panel.listeners.toggle?.();
    for (let i = 0; i < 50 && timers.length; i++) timers.shift()(0);
  } finally { h.g.getWindState = wind; }
  const body = h.get("atlas-itcz-body").innerHTML;
  const after = { draws: h.draws.length - drawn, state: JSON.stringify({ ...h.api.state, visitedPorts: [...h.api.state.visitedPorts] }) !== stateBefore, map: mapState() !== mapBefore };
  return { ...h, panel, body, windCalls, touched, after };
}
function figures(body) {
  return [...body.matchAll(/<figure class="atlas-itcz-figure" data-season="(\w+)">([\s\S]*?)<\/figure>/g)].map(([, season, html]) => {
    const svg = html.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? "";
    return { season, html, svg, caption: text(html.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/)?.[1] ?? ""),
      markers: [...html.matchAll(/<p class="atlas-itcz-marker"[^>]*>([\s\S]*?)<\/p>/g)].map(m => ({ ...attrs(m[0].match(/<p\b[^>]*>/)[0]), text: text(m[1]) })),
      meridians: [...svg.matchAll(/<line\b[^>]*data-lon="[^"]*"[^>]*>/g)].map(m => attrs(m[0])),
      alt: text(html.match(/<p class="atlas-sr"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ""),
      svgText: [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(m => m[1]) };
  });
}
const latWord = lat => `${Math.abs(lat)}° ${lat < 0 ? "S" : "N"}`;

// The exact inventory of one figure's SVG: every tag in order, the attributes each may carry, and every text.
// Anything else (a band as a rect, path or thick line; an arrow as a line, chevron path or glyph; inline paint) fails.
function inventory(svg) {
  const problems = [];
  const tags = [...svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)].filter(m => !m[1]).map(m => ({ name: m[2], a: attrs(m[3]), selfClosing: !!m[4] || /\/$/.test(m[3]) }));
  const names = tags.map(t => t.name).join(" ");
  const want = ["svg", "rect", "g", ...LAND.map(() => "path"), "line", "text", "g", "line", "line", "text", "text", "text"].join(" ");
  if (names !== want) problems.push(`elements "${names}", expected "${want}"`);
  const allowed = { svg: ["viewBox", "role", "aria-labelledby", "aria-describedby", "class"], rect: ["width", "height", "class"], g: ["class"], path: ["d"],
    line: ["x1", "y1", "x2", "y2", "class", "data-lon"], text: ["x", "y", "class", "text-anchor"] };
  for (const t of tags) for (const k of Object.keys(t.a)) if (!(allowed[t.name] || []).includes(k)) problems.push(`<${t.name}> carries ${k}="${t.a[k]}"`);
  const rect = tags.find(t => t.name === "rect");
  if (!rect || rect.a.width !== "800" || rect.a.height !== "450" || rect.a.class !== "atlas-itcz-ground") problems.push(`ground ${JSON.stringify(rect?.a)}`);
  const land = svg.match(/<g class="atlas-itcz-land">([\s\S]*?)<\/g>/)?.[1] ?? "";
  if (land !== LAND.map(d => `<path d="${d}"/>`).join("")) problems.push("the land is not exactly the game map's land paths");
  const lines = tags.filter(t => t.name === "line").map(t => t.a);
  const eqY = Y(0).toFixed(2);
  if (!(lines[0]?.class === "atlas-itcz-equator" && lines[0].x1 === "0" && lines[0].x2 === "800" && Math.abs(lines[0].y1 - eqY) <= 0.01 && lines[0].y1 === lines[0].y2)) problems.push(`equator ${JSON.stringify(lines[0])}`);
  for (const l of lines.slice(1)) if (!(l.x1 === l.x2 && l.y1 === "0" && l.y2 === "450" && l["data-lon"])) problems.push(`meridian ${JSON.stringify(l)}`);
  const texts = [...svg.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
  if (texts.join("|") !== "Equator|65° E|95° E|Schematic") problems.push(`texts ${JSON.stringify(texts)}`);
  return problems;
}

export function problems(page) {
  const out = { wind: [], band: [], marker: [], copy: [], map: [], colour: [], purity: [] };
  const h = opened(page), figs = figures(h.body);
  if (figs.length !== 2) out.band.push(`${figs.length} figures`);
  // Nothing from the game's wind.
  if (h.windCalls) out.wind.push(`getWindState called ${h.windCalls} times while the panel was built`);
  if (/data-bearing|data-knots|marker-end|<marker\b|atlas-itcz-arrow/i.test(h.body)) out.wind.push("arrow or bearing markup in the panel");
  // Opening the panel draws nothing and changes no state.
  if (h.after.draws) out.purity.push(`${h.after.draws} random draws while opening`);
  if (h.after.state) out.purity.push("opening the panel changed the game state");
  for (const f of figs) {
    // The exact inventory: one ground rectangle, the game map's land, three lines, four texts.
    for (const p of inventory(f.svg)) out.band.push(`${f.season}: ${p}`);
    // The marker, beside the map, at the cited latitude.
    const lat = CITED[f.season];
    if (f.markers.length !== 1) { out.marker.push(`${f.season}: ${f.markers.length} markers`); continue; }
    const m = f.markers[0], top = Number(m.style?.match(/top:([\d.]+)%/)?.[1]);
    if (Number(m["data-lat"]) !== lat) out.marker.push(`${f.season}: marker at ${m["data-lat"]}, cited ${lat}`);
    if (!(Math.abs(top - Y(lat) / 450 * 100) <= 0.01)) out.marker.push(`${f.season}: marker top ${top}%, ${lat}° is ${(Y(lat) / 450 * 100).toFixed(2)}%`);
    if (m.text !== `ITCZ ${latWord(lat)}`) out.marker.push(`${f.season}: marker text "${m.text}"`);
    if (!f.caption.includes(`near ${latWord(lat)}`) || !f.alt.includes(`about ${latWord(lat)}`)) out.marker.push(`${f.season}: caption or text equivalent lacks ${latWord(lat)}`);
    const lons = f.meridians.map(l => [Number(l["data-lon"]), Number(l.x1)]);
    if (lons.length !== 2 || lons.some(([lon, x]) => Math.abs(x - X(lon)) > 0.01) || lons.map(([lon]) => lon).join() !== "65,95") out.marker.push(`${f.season}: meridians ${JSON.stringify(lons)}`);
    if (!f.svgText.includes("Schematic")) out.copy.push(`${f.season}: no "Schematic" in the figure`);
  }
  const proj = JSON.parse(page.match(/const PROJECTION=(\{[^;]*\});/)?.[1] ?? "null");
  if (JSON.stringify(proj) !== JSON.stringify(COASTLINE_FIT)) out.marker.push(`projection ${JSON.stringify(proj)} is not the coastline fit`);
  // Copy.
  const all = text(h.body), summary = text(h.panel.innerHTML.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "");
  if (!summary.includes("real atmosphere, simplified; not used by the game") || !/^Show ITCZ/.test(summary)) out.copy.push(`summary "${summary}"`);
  for (const s of ["Real atmosphere, simplified · not used by the game", "ITCZ marker: sector average, 65–95° E (Schneider et al. 2014, Fig. 2b).", "two seasonal positions, not a path",
    "The game uses one wind for the whole basin each month; see the arrows on the main map.", "toward the hemisphere that is warming", "shifts abruptly", "no coastal-approach state",
    "mid-May", "earlier than the game’s June start", "On average, significant rain begins one to four weeks before the winds settle", "does not say where along that latitude the rain falls",
    "The marker gives a latitude only, not a place"])
    if (!all.includes(s)) out.copy.push(`missing "${s}"`);
  if (/warmer hemisphere/i.test(all)) out.copy.push("“warmer hemisphere”, not the paper's “warming”");
  // Claims from Moron et al. beyond the abstract, which could not be read, and timing the NWS page does not give.
  if (/completely out of step|October to December|late spring/i.test(all)) out.copy.push("an unverified claim");
  if (/approach (open|closed)|harbou?r (open|closed)|port (open|closed)|approach season/i.test(all)) out.copy.push("a coastal-approach label");
  // The game map.
  if (h.touched.length || h.after.map) out.map.push(`opening the panel touched the game map: ${h.touched.join(", ") || "content or attributes"}`);
  if (/itcz/i.test(h.get("ocean-svg").innerHTML)) out.map.push("#ocean-svg mentions the ITCZ");
  // Colours, from the panel's CSS rules.
  // Only the adapter's own stylesheet, split into rules (a regex over the whole page backtracks through the font data).
  const style = page.match(/<style id="atlas-style">([\s\S]*?)<\/style>/)?.[1] ?? "";
  const css = style.split("}").map(r => r.split("{")).filter(([sel, body]) => body !== undefined && /itcz/.test(sel)).map(([, body]) => body).join(";");
  const used = new Set((css.match(/#[0-9a-f]{3,6}\b/gi) || []).map(c => c.toLowerCase()));
  const allowed = new Set(["#111c35", "#5b6b86", "#e9e7d9", "#c4cedd", "#53677c"]);
  for (const c of used) if (!allowed.has(c)) out.colour.push(`colour ${c} not on the allow-list`);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), mix = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  const L = c => { const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const merid = style.match(/\.atlas-itcz-meridians line\{[^}]*/)?.[0] ?? "";
  const mColour = merid.match(/stroke:(#[0-9a-f]{6})/i)?.[1], mOpacity = Number(merid.match(/stroke-opacity:([\d.]+)/)?.[1] ?? 1);
  const landColour = style.match(/\.atlas-itcz-land path\{fill:(#[0-9a-f]{6})/i)?.[1] ?? "#000000";
  const ground = rgb("#111c35"), land = rgb(landColour);
  const halo = /\.atlas-itcz-note\{[^}]*paint-order:stroke;stroke:#111c35/.test(style);
  if (!halo) out.colour.push("the map's text has no ground-coloured halo, so its contrast over land is not 4.5:1");
  const contrast = mColour ? { landOnGround: ratio(land, ground), meridianOnGround: ratio(mix(rgb(mColour), ground, mOpacity), ground), meridianOnLand: ratio(mix(rgb(mColour), land, mOpacity), land), text: ratio(rgb("#e9e7d9"), ground), note: ratio(rgb("#c4cedd"), ground) } : null;
  if (!contrast || contrast.landOnGround < 3 || contrast.meridianOnGround < 3 || contrast.meridianOnLand < 3 || contrast.text < 4.5 || contrast.note < 4.5) out.colour.push(`contrast ${JSON.stringify(contrast)}`);
  return out;
}

const failing = out => Object.entries(out).filter(([, v]) => v.length).map(([k]) => k);
const plant = (name, find, repl, page = PAGE) => {
  const n = page.split(find).length - 1;
  assert.equal(n, 1, `${name}: target found ${n} times`);
  return page.replace(find, repl);
};
const LAND_G = "<g class=\"atlas-itcz-land\">${landPaths}</g>";

test("the ITCZ panel: no game wind, no band on the map, the cited markers, its copy and colours, the game map untouched", () => {
  for (const [k, v] of Object.entries(problems(PAGE))) assert.deepEqual(v.slice(0, 5), [], k);
});

test("the checks fail on planted defects", () => {
  for (const [name, page, which] of [
    ["a band reintroduced", plant("band", LAND_G, LAND_G + "<rect x=\"295\" y=\"83\" width=\"242\" height=\"74\" rx=\"37\" class=\"atlas-itcz-band-fill\"/>"), "band"],
    ["a hatched band reintroduced", plant("hatch", LAND_G, LAND_G + "<path d=\"M295,83H537V157H295Z\" fill=\"url(#hatch)\"/>"), "band"],
    ["the ITCZ labelled on the map", plant("label", "<text x=\"16\" y=\"44\" class=\"atlas-itcz-note\">Schematic</text>", "<text x=\"16\" y=\"44\" class=\"atlas-itcz-note\">Schematic</text><text x=\"560\" y=\"130\">ITCZ</text>"), "band"],
    ["arrows reintroduced", plant("arrows", "const figure=(s,landPaths)=>{", "const figure=(s,landPaths)=>{const gw=getWindState(5);landPaths+=`<line x1=\"200\" y1=\"260\" x2=\"264\" y2=\"196\" data-bearing=\"${gw.bearing}\" marker-end=\"url(#head)\"/>`;"), "wind"],
    ["latitudes swapped", plant("swap", "summer:20,winter:-8}", "summer:-8,winter:20}"), "marker"],
    ["summer marker at 25° N", plant("25N", "summer:20,winter:-8}", "summer:25,winter:-8}"), "marker"],
    ["marker placed off its latitude", plant("top", "top=r2(py(s.lat)/450*100)", "top=r2(py(s.lat)/450*100+3)"), "marker"],
    ["sector from 60° E", plant("60E", "ITCZ={west:65,", "ITCZ={west:60,"), "marker"],
    ["“warmer hemisphere” restored", plant("warmer", "toward the hemisphere that is warming", "toward the warmer hemisphere"), "copy"],
    ["a coastal-approach label", plant("approach", "so this panel labels no harbour seasons.", "so this panel labels no harbour seasons. Calicut: approach closed in July."), "copy"],
    ["the panel drawn on the game map", plant("ocean", "if(itczBuilt)return;itczBuilt=true;", "if(itczBuilt)return;itczBuilt=true;$('ocean-svg').append?.(itcz);"), "map"],
    ["meridians in a season green", plant("hue", ".atlas-itcz-meridians line{stroke:#e9e7d9;", ".atlas-itcz-meridians line{stroke:#48b8a0;"), "colour"],
    ["meridians too faint", plant("faint", "stroke-opacity:.95;stroke-width:3;stroke-dasharray:12 9}", "stroke-opacity:.2;stroke-width:3;stroke-dasharray:12 9}"), "colour"],
    ["land back at 1.7:1", plant("land", ".atlas-itcz-land path{fill:#5b6b86;", ".atlas-itcz-land path{fill:#34435c;"), "colour"],
    ["the text halo removed", plant("halo", ".atlas-itcz-note{fill:#c4cedd;paint-order:stroke;stroke:#111c35;", ".atlas-itcz-note{fill:#c4cedd;"), "colour"],
    ["an unverified Moron claim restored", plant("moron", "before the winds settle [3].</li>", "before the winds settle. In some years the two are completely out of step [3, §4.1].</li>"), "copy"],
    ["the key's latitude-only line dropped", plant("latonly", " The marker gives a latitude only, not a place: it sits beside the map’s edge, outside the sector.", ""), "copy"],
  ]) {
    const failed = failing(problems(page));
    assert.ok(failed.includes(which), `${name}: expected the ${which} check to fail, failed: ${failed.join(", ") || "none"}`);
  }
});

// The independent review of 0afe587 found these passed both this test and preview-purity; each must now fail here.
test("the review's plants fail (bands, arrows and map touches the earlier blacklist missed)", () => {
  const AFTER_LAND = LAND_G, BEFORE_SCHEMATIC = "<text x=\"16\" y=\"44\" class=\"atlas-itcz-note\">Schematic</text>";
  const BUILD = "if(itczBuilt)return;itczBuilt=true;";
  for (const [name, find, repl] of [
    ["arrowChevron", AFTER_LAND, AFTER_LAND + '<path d="M600 200l-40 40m0 0h18m-18 0v-18" stroke="#e9e7d9" stroke-width="4" fill="none"/>'],
    ["arrowGlyph", BEFORE_SCHEMATIC, BEFORE_SCHEMATIC + "<text x=\"600\" y=\"220\" class=\"atlas-itcz-note\">${k==='summer'?'↗':'↙'}</text>"],
    ["arrowMarker", AFTER_LAND, AFTER_LAND + '<path d="M600 200l-40 40" marker-end="url(#a)"/>'],
    ["bandAcrossMap", AFTER_LAND, AFTER_LAND + '<path d="M0 ${r2(py(s.lat)-25)}H800V${r2(py(s.lat)+25)}H0Z" fill="#34435c"/>'],
    ["bandPath", AFTER_LAND, AFTER_LAND + '<path d="M${x0} ${r2(py(s.lat)-25)}H${x1}V${r2(py(s.lat)+25)}H${x0}Z" fill="#c4cedd" opacity=".35"/>'],
    ["bandRect", AFTER_LAND, AFTER_LAND + '<rect x="${x0}" y="${r2(py(s.lat)-25)}" width="${r2(x1-x0)}" height="50" fill="#c4cedd" opacity=".35"/>'],
    ["bandThickLine", AFTER_LAND, AFTER_LAND + '<line x1="${x0}" y1="${r2(py(s.lat))}" x2="${x1}" y2="${r2(py(s.lat))}" stroke="#c4cedd" stroke-opacity=".35" stroke-width="50"/>'],
    ["latSwap", "summer:20,winter:-8}", "summer:-8,winter:20}"],
    ["meridian60", "x0=r2(px(ITCZ.west))", "x0=r2(px(60))"],
    ["oceanTouch", BUILD, BUILD + "document.getElementById('svg-route-preview')?.setAttribute('data-itcz','1');"],
    ["off5", "top=r2(py(s.lat)/450*100)", "top=r2(py(s.lat)/450*100+5)"],
    ["off5both", "summer:20,winter:-8}", "summer:25,winter:-8}"],
    ["statePoke", BUILD, BUILD + "state.cash+=0.0001;"],
    ["windCall", BUILD, BUILD + "const _w=getWindState(0);"],
    ["windCallLater", "itcz.addEventListener('toggle',()=>{", "itcz.addEventListener('toggle',()=>{if(itcz.open)setTimeout(()=>getWindState(state.monthIndex),0);"],
  ]) {
    const failed = failing(problems(plant(name, find, repl)));
    assert.ok(failed.length, `${name}: no check failed`);
  }
});

test("the preview-purity test fails on a panel that draws, reads the game or changes the game map", () => {
  const dir = mkdtempSync(join(tmpdir(), "monsoon-itcz-"));
  const hook = body => plant("hook", "  itcz.addEventListener('toggle',", `  {const r=renderAll;renderAll=function(){r();if(itczBuilt){${body}}};}\n  itcz.addEventListener('toggle',`);
  try {
    for (const [name, page] of [
      ["panel draws a random number when built", plant("draws", "if(itczBuilt)return;itczBuilt=true;", "if(itczBuilt)return;itczBuilt=true;Math.random();")],
      ["panel repainted from the port", hook("$('atlas-itcz-body').innerHTML=$('atlas-itcz-body').innerHTML.split('<!--')[0]+'<!--'+state.currentPort+'-->';")],
      ["panel adds to the game map", hook("$('ocean-svg').innerHTML+='<g class=\"atlas-itcz-band\"/>';")],
    ]) {
      const path = join(dir, "index.html");
      writeFileSync(path, page);
      const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "tests/03/engine/preview-purity.test.mjs"], { cwd: REPO, env: childEnv(path), encoding: "utf8" });
      const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1]);
      assert.ok(failed.some(n => /ITCZ/.test(n)), `${name}: the purity test should fail (failed: ${failed.join("; ") || "none"})`);
      assert.ok(Number(/^# pass (\d+)/m.exec(r.stdout)?.[1]) > 0, `${name}: the planted copy did not load`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
