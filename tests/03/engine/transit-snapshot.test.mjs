// The R0 transit comparison without a browser. It loads the same
// tests/03/baseline-harness.js that tests/03/baseline-check.html injects, calls the
// same transitTable(), and compares with the same key and JSON equality.
// The browser page stays the reference check named in CONTRIBUTING.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadEngine, plain } from "./load-engine.mjs";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/baseline-transit.json", import.meta.url), "utf8"));
const key = r => `${r.from}>${r.to}|${r.vessel}|${r.navigator}|${r.month}`;

test("computeTransit matches all 480 rows of tests/03/fixtures/baseline-transit.json", () => {
  const e = loadEngine({ harness: true });
  const rows = plain(e.g.transitTable());
  assert.equal(fixture.rows.length, 480);
  assert.equal(rows.length, fixture.rows.length);
  const want = new Map(fixture.rows.map(r => [key(r), JSON.stringify(r)]));
  const changed = rows.filter(r => want.get(key(r)) !== JSON.stringify(r));
  const missing = fixture.rows.length - rows.filter(r => want.has(key(r))).length;
  assert.equal(missing, 0, "rows missing from the recomputed table");
  assert.deepEqual(changed.slice(0, 5), [], `${changed.length} of 480 rows differ from the snapshot at ${fixture.revision.slice(0, 7)}`);
});

test("the README's worked example: Aden → Calicut by dhow is 14 days in July, 53 in January", () => {
  const e = loadEngine().start();
  const lane = e.lane("aden", "calicut");
  assert.equal(e.g.computeTransit(lane, 6).days, 14);
  assert.equal(e.g.computeTransit(lane, 0).days, 53);
});
