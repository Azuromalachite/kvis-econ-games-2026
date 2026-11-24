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

function opened(page) {
  const h = load(page, 1);
  h.get("input-start-port").value = "calicut";
  h.g.selectVessel("dhow"); h.g.selectDifficulty("normal"); h.g.startSimulation();
  const ocean = h.get("ocean-svg"), touched = [];
  for (const fn of ["append", "appendChild", "insertAdjacentHTML", "prepend"]) { const was = ocean[fn]; ocean[fn] = (...a) => { touched.push(fn); return was?.apply(ocean, a); }; }
  const oceanBefore = ocean.innerHTML;
  // Count the game's wind function while the panel is built and the page repaints.
  const wind = h.g.getWindState; let windCalls = 0;
  h.g.getWindState = (...a) => { windCalls++; return wind(...a); };
  const panel = h.get("atlas-itcz");
  panel.open = true; panel.listeners.toggle?.();
  const body = h.get("atlas-itcz-body").innerHTML;
  h.g.getWindState = wind;
  return { ...h, panel, body, windCalls, touched, oceanChanged: ocean.innerHTML !== oceanBefore };
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

export function problems(page) {
  const out = { wind: [], band: [], marker: [], copy: [], map: [], colour: [] };
  const h = opened(page), figs = figures(h.body);
  if (figs.length !== 2) out.band.push(`${figs.length} figures`);
  // Nothing from the game's wind.
  if (h.windCalls) out.wind.push(`getWindState called ${h.windCalls} times while the panel was built`);
  if (/data-bearing|data-knots|\b\d+ kt\b|from the (north|south)?(east|west)?\b(?<!from the )|marker-end|<marker\b|atlas-itcz-arrow/i.test(h.body.slice(h.body.indexOf('<div class="atlas-itcz-frame">'), h.body.indexOf("<p><strong>The game uses")))) out.wind.push("wind-like content in the figures");
  if (/data-bearing|data-knots|marker-end|<marker\b|atlas-itcz-arrow/i.test(h.body)) out.wind.push("arrow or bearing markup in the panel");
  for (const f of figs) {
    // No band on the map: one rectangle (the ground), no pattern, mask or other filled shape.
    const rects = [...f.svg.matchAll(/<rect\b[^>]*>/g)].map(m => attrs(m[0]));
    if (rects.length !== 1 || rects[0].width !== "800" || rects[0].height !== "450") out.band.push(`${f.season}: rectangles ${JSON.stringify(rects)}`);
    if (/<(pattern|mask|polygon|ellipse|circle|polyline)\b/.test(f.svg) || /itcz-band|fill="url/.test(f.svg)) out.band.push(`${f.season}: a filled shape on the map`);
    if (/ITCZ/.test(f.svgText.join(" "))) out.band.push(`${f.season}: the ITCZ is labelled on the map itself`);
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
    "mid-May", "earlier than the game’s June start", "October to December", "does not say where along that latitude the rain falls"])
    if (!all.includes(s)) out.copy.push(`missing "${s}"`);
  if (/warmer hemisphere/i.test(all)) out.copy.push("“warmer hemisphere”, not the paper's “warming”");
  if (/approach (open|closed)|harbou?r (open|closed)|port (open|closed)|approach season/i.test(all)) out.copy.push("a coastal-approach label");
  // The game map.
  if (h.touched.length || h.oceanChanged) out.map.push(`opening the panel touched #ocean-svg: ${h.touched.join(", ") || "innerHTML"}`);
  if (/itcz/i.test(h.get("ocean-svg").innerHTML)) out.map.push("#ocean-svg mentions the ITCZ");
  // Colours, from the panel's CSS rules.
  // Only the adapter's own stylesheet, split into rules (a regex over the whole page backtracks through the font data).
  const style = page.match(/<style id="atlas-style">([\s\S]*?)<\/style>/)?.[1] ?? "";
  const css = style.split("}").map(r => r.split("{")).filter(([sel, body]) => body !== undefined && /itcz/.test(sel)).map(([, body]) => body).join(";");
  const used = new Set((css.match(/#[0-9a-f]{3,6}\b/gi) || []).map(c => c.toLowerCase()));
  const allowed = new Set(["#111c35", "#34435c", "#e9e7d9", "#c4cedd", "#53677c"]);
  for (const c of used) if (!allowed.has(c)) out.colour.push(`colour ${c} not on the allow-list`);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), mix = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  const L = c => { const f = v => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const merid = style.match(/\.atlas-itcz-meridians line\{[^}]*/)?.[0] ?? "";
  const mColour = merid.match(/stroke:(#[0-9a-f]{6})/i)?.[1], mOpacity = Number(merid.match(/stroke-opacity:([\d.]+)/)?.[1] ?? 1);
  const ground = rgb("#111c35"), land = rgb("#34435c");
  const contrast = mColour ? { meridianOnGround: ratio(mix(rgb(mColour), ground, mOpacity), ground), meridianOnLand: ratio(mix(rgb(mColour), land, mOpacity), land), text: ratio(rgb("#e9e7d9"), ground), note: ratio(rgb("#c4cedd"), ground) } : null;
  if (!contrast || contrast.meridianOnGround < 3 || contrast.meridianOnLand < 3 || contrast.text < 4.5 || contrast.note < 4.5) out.colour.push(`contrast ${JSON.stringify(contrast)}`);
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
    ["meridians too faint", plant("faint", "stroke-opacity:.85;stroke-width:3;stroke-dasharray:12 9}", "stroke-opacity:.2;stroke-width:3;stroke-dasharray:12 9}"), "colour"],
  ]) {
    const failed = failing(problems(page));
    assert.ok(failed.includes(which), `${name}: expected the ${which} check to fail, failed: ${failed.join(", ") || "none"}`);
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
