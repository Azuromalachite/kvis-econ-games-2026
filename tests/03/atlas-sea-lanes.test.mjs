// Every sea lane the Atlas page draws runs over water, checked on the built page itself.
//
// Reads from projects/03/index.html: the land paths (the inlined coastline), the adapter's sea waypoints and
// its lane geometry rule, and the engine's port positions. Each lane is rebuilt as the adapter draws it
// (straight to the first midpoint, then a quadratic through each waypoint), sampled every 0.25 map units,
// and must have no sample on land (even-odd over all land rings) and at least MIN_CLEARANCE units of water
// outside PORT_ZONE units of either port (ports sit on the coast, so the zone around them is exempt).
// The upstream builder has the same check (tests/sea-lanes.test.mjs); this one guards the deployed page.
//
// Run: node --test tests/03/atlas-sea-lanes.test.mjs   (MONSOON_INDEX=<path> checks a copy)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const PAGE = readFileSync(process.env.MONSOON_INDEX || DEFAULT_INDEX, "utf8");
const PORT_ZONE = 9, MIN_CLEARANCE = 1.5;

export function pageGeometry(html) {
  const land = html.match(/<g fill="#243950"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  if (!land) throw new Error("land group not found");
  const rings = [...land.matchAll(/<path d="([^"]+)"/g)].flatMap(m => m[1].split("Z").filter(r => r.trim()).map(r => [...r.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(p => [+p[1], +p[2]])));
  const ports = {};
  for (const m of html.matchAll(/(\w+): \{\s*id: "\w+",\s*name: "[^"]+",\s*region: "[^"]+",\s*x: (\d+), y: (\d+)/g)) ports[m[1]] = [+m[2], +m[3]];
  const wp = html.match(/const seaWaypoints=(\{[\s\S]*?\n  \});/)?.[1];
  if (!wp) throw new Error("seaWaypoints not found in the adapter");
  // The rule the adapter draws with must be the one rebuilt below.
  if (!html.includes("const first=mid(points[0],points[1]);d+=` L ${first[0]},${first[1]}`;")) throw new Error("the adapter's lane geometry changed; update this check");
  return { rings, ports, waypoints: Function(`return ${wp}`)() };
}

const inside = (rings, [x, y]) => { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const segDist = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
const clearance = (rings, p) => { let d = Infinity; for (const r of rings) for (let i = 0; i < r.length; i++) d = Math.min(d, segDist(p, r[i], r[(i + 1) % r.length])); return d; };
function lanePoints(points) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], out = [];
  const line = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 4); for (let k = 0; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); };
  if (points.length === 2) { line(points[0], points[1]); return out; }
  let cur = mid(points[0], points[1]); line(points[0], cur);
  for (let i = 1; i < points.length - 1; i++) {
    const end = i < points.length - 2 ? mid(points[i], points[i + 1]) : points[i + 1], c = points[i];
    for (let k = 0; k <= 400; k++) { const t = k / 400, u = 1 - t; out.push([u * u * cur[0] + 2 * u * t * c[0] + t * t * end[0], u * u * cur[1] + 2 * u * t * c[1] + t * t * end[1]]); }
    cur = end;
  }
  return out;
}
export function laneProblems({ rings, ports, waypoints }) {
  const problems = [];
  for (const [key, mids] of Object.entries(waypoints)) {
    const [a, b] = key.split("-"), pts = [ports[a], ...mids, ports[b]];
    let worst = Infinity, at = null;
    for (const p of lanePoints(pts)) {
      if (Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) < PORT_ZONE || Math.hypot(p[0] - pts.at(-1)[0], p[1] - pts.at(-1)[1]) < PORT_ZONE) continue;
      if (inside(rings, p)) { problems.push({ lane: key, onLand: p.map(v => +v.toFixed(1)) }); break; }
      const c = clearance(rings, p); if (c < worst) { worst = c; at = p.map(v => +v.toFixed(1)); }
    }
    if (worst < MIN_CLEARANCE) problems.push({ lane: key, clearance: +worst.toFixed(2), at });
  }
  return problems;
}

const geometry = pageGeometry(PAGE);
test("every lane on the built page runs over water on its inlined coastline", () => {
  assert.equal(geometry.rings.length >= 50, true, `${geometry.rings.length} land rings`);
  assert.deepEqual(Object.keys(geometry.waypoints).sort(), ["aden-calicut", "calicut-malacca", "kilwa-aden", "kilwa-calicut", "malacca-quanzhou"]);
  assert.deepEqual(laneProblems(geometry), []);
});

test("the check fails with a waypoint moved onto land, including one edited in the page", () => {
  for (const [lane, index, point] of [["calicut-malacca", 3, [420, 210]], ["kilwa-aden", 3, [170, 210]]]) {
    const planted = structuredClone(geometry);
    planted.waypoints[lane][index] = point;
    assert.ok(laneProblems(planted).some(p => p.lane === lane), `${lane} waypoint ${index} → ${point} was not caught`);
  }
  // A waypoint edited in the page itself is read and caught too.
  const edited = PAGE.replace(/'kilwa-aden':\[\[118,318\]/, "'kilwa-aden':[[60,318]");
  assert.notEqual(edited, PAGE, "plant not applied");
  assert.ok(laneProblems(pageGeometry(edited)).some(p => p.lane === "kilwa-aden"));
});
