// Packaging check for projects/03/index.html (AGENTS.md rule 4 and "Packaging" in
// projects/03/README.md):
// every reference the page makes must be absolute, an anchor, or a file that sits
// beside it. A relative link to a file that isn't in projects/03/ is a 404 on the site.
//
// Run: node --test tests/03/packaging.test.mjs
// MONSOON_INDEX=<path> checks another copy of the page.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const index = process.env.MONSOON_INDEX || DEFAULT_INDEX;
const page = readFileSync(index, "utf8");

// Static references: HTML attributes (quoted or not), quoted JS property assignments
// (el.href = 'x', including template literals), setAttribute('href'|'src', '...'),
// CSS url() and @import. Not checked: values assembled at run time (${...} templates,
// variables, string concatenation) and references built any other way.
export function pageReferences(html) {
  const refs = [];
  for (const m of html.matchAll(/(?<=[\s<"'])(?:xlink:)?(href|src|srcset|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'`]+))/gi)) refs.push(m[2] ?? m[3] ?? m[4]);
  for (const m of html.matchAll(/\.(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g)) refs.push(m[2] ?? m[3] ?? m[4]);
  for (const m of html.matchAll(/(?<![\w.])url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)) refs.push(m[1] ?? m[2] ?? m[3]);
  for (const m of html.matchAll(/setAttribute\(\s*['"`](?:xlink:)?(?:href|src|srcset|action|poster)['"`]\s*,\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)/g)) refs.push(m[1] ?? m[2] ?? m[3]);
  for (const m of html.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) refs.push(m[1] ?? m[2]);
  return refs;
}

// Local files the deployed page may reference. Each must exist beside it (checked below).
const ALLOWED_LOCAL = ["classic.html", "index.html"];

export function unresolvedReferences(html) {
  return pageReferences(html).filter(ref =>
    !(/^(?:https?:|data:|mailto:|#)/i.test(ref) || ref.startsWith("${") || ALLOWED_LOCAL.includes(ref)));
}

test("every static reference in projects/03/index.html is absolute, an anchor, or classic.html / index.html", () => {
  assert.deepEqual(unresolvedReferences(page), []);
});

test("the allowed local files exist beside the page", { skip: process.env.MONSOON_INDEX ? "a copy elsewhere has no neighbours" : false }, () => {
  for (const name of ALLOWED_LOCAL) {
    if (pageReferences(page).includes(name)) assert.ok(existsSync(join(dirname(index), name)), `${name} is referenced but missing`);
  }
});

test("the check catches each listed way of writing a static relative reference", () => {
  const plants = [
    `<a href="README.md">`, `<a href='README.md'>`, `<a href=./README.md>`, `<a href="docs/prototype.md">`,
    `<img src="harbour.jpg">`, `<style>i{background:url(./Harbor-Atlas.jpg)}</style>`,
    `<script>x.href='notes.html'</script>`, `<link rel=icon href=favicon.ico>`,
    "<script>x.href=`notes.html`</script>", `<script>a.setAttribute('href','notes.html')</script>`,
    `<style>@import url("extra.css");</style>`, `<style>@import 'extra.css';</style>`,
  ];
  for (const plant of plants) {
    const before = unresolvedReferences(page).length;
    assert.equal(unresolvedReferences(page.replace("</body>", plant + "</body>")).length, before + 1, plant);
  }
});
