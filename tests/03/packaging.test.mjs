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
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const DEFAULT_INDEX = fileURLToPath(new URL("../../projects/03/index.html", import.meta.url));
const index = process.env.MONSOON_INDEX || DEFAULT_INDEX;
const page = readFileSync(index, "utf8");
const sharedTheme = readFileSync(new URL("../../assets/theme.css", import.meta.url), "utf8");
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const foundationBlocks = css => [...css.matchAll(/\/\* KVIS foundations:begin \*\/\n([\s\S]*?)\/\* KVIS foundations:end \*\//g)].map(m => m[1]);

// The recorded source revision must be a real commit whose assets/theme.css holds exactly the embedded block.
// Returns null when Git or the repository history is unavailable, so the caller can skip with a notice.
export function revisionBlock(revision) {
  const git = spawnSync("git", ["-C", REPO, "rev-parse", "--git-dir"], { encoding: "utf8" });
  if (git.error || git.status !== 0) return null;
  const exists = spawnSync("git", ["-C", REPO, "cat-file", "-e", `${revision}^{commit}`]);
  if (exists.status !== 0) return { exists: false, blocks: [] };
  const show = spawnSync("git", ["-C", REPO, "show", `${revision}:assets/theme.css`], { encoding: "utf8" });
  return { exists: true, blocks: show.status === 0 ? foundationBlocks(show.stdout) : [] };
}

// The builder consumes only the marked foundations, never the shared palette or
// components. A change to this contract requires an explicit Atlas rebuild.
export function assertSharedFoundations(html, theme) {
  const inputs = [...theme.matchAll(/\/\* KVIS foundations:begin \*\/\n([\s\S]*?)\/\* KVIS foundations:end \*\//g)];
  assert.equal(inputs.length, 1, "exactly one foundation source block");
  const embedded = [...html.matchAll(/<style id="atlas-foundations" data-source-revision="([a-f0-9]{40})" data-foundations-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/g)];
  assert.equal(embedded.length, 1, "exactly one inline foundation block with provenance");
  const expected = inputs[0][1];
  assert.equal(embedded[0][3], expected, "rebuild Atlas when shared foundations change");
  assert.equal(embedded[0][2], createHash("sha256").update(expected).digest("hex"));
  assert.ok(html.indexOf(embedded[0][0]) < html.indexOf('<style id="atlas-utilities">'), "foundations precede Atlas utilities and overrides");
  const atlas = html.match(/<style id="atlas-style">([\s\S]*?)<\/style>/)?.[1];
  assert.ok(atlas, "Atlas-specific styles remain present");
  assert.doesNotMatch(atlas, /--f-(?:display|body|mono)\s*:/, "Atlas must use the shared font roles instead of shadowing them");
  for (const role of ["display", "body", "mono"]) assert.ok(atlas.includes(`--kvis-font-${role}:`), `Atlas's embedded ${role} font alias is preserved`);
  assert.ok(atlas.includes("min-height:var(--kvis-control-min-size)"));
  for (const space of [2, 4, 6]) assert.ok(atlas.includes(`var(--kvis-space-${space})`));
  // Atlas keeps its own aliases and focus offset on :root, where the shared roles read them.
  const root = atlas.match(/^:root\{([^}]*)\}/)?.[1] ?? "";
  assert.match(root, /--kvis-focus-offset:3px;/, "Atlas's 3 px focus offset stays on :root");
  for (const role of ["display", "body", "mono"]) assert.match(root, new RegExp(`--kvis-font-${role}:`), `Atlas's ${role} font alias stays on :root`);
  // Outside the foundation block, no style may restate the global focus ring or un-hide [hidden].
  const others = [...html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].filter(m => !/id="atlas-foundations"/.test(m[1])).map(m => m[2]);
  for (const css of others) {
    assert.doesNotMatch(css, /(?:^|[{}])\s*(?:\*|button|a|input|select|textarea|summary|\[tabindex\])?:focus-visible\s*[{,]/, "the global focus ring comes only from the shared foundations");
    assert.doesNotMatch(css, /\[hidden\][^{}]*\{[^}]*display\s*:\s*(?!none)/, "nothing may override the shared [hidden] rule");
  }
}

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
const ALLOWED_LOCAL = ["index.html"];

export function unresolvedReferences(html) {
  return pageReferences(html).filter(ref =>
    !(/^(?:https?:|data:|mailto:|#)/i.test(ref) || ref.startsWith("${") || ALLOWED_LOCAL.includes(ref)));
}

test("every static reference in projects/03/index.html is absolute, an anchor, or index.html", () => {
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

test("Atlas inlines the current shared foundations while retaining its own theme", () => {
  assertSharedFoundations(page, sharedTheme);
});

test("the recorded foundation revision is a real commit whose theme holds the embedded block", t => {
  const [, revision, , block] = page.match(/<style id="atlas-foundations" data-source-revision="([a-f0-9]{40})" data-foundations-sha256="([a-f0-9]{64})">([\s\S]*?)<\/style>/);
  const found = revisionBlock(revision);
  if (!found) { t.skip("Git or the repository history is unavailable; the revision was only format-checked"); return; }
  assert.ok(found.exists, `${revision} is not a commit in this repository`);
  assert.deepEqual(found.blocks, [block], `${revision}:assets/theme.css does not hold exactly the embedded foundation block`);
});

// A text merge of two builds (for example #22 with another Atlas change) can produce a page no builder made.
// projects/03/README.md pins the generated page's SHA-256; this fails on any page that is not that build.
test("projects/03/index.html is the exact build the README pins", { skip: process.env.MONSOON_INDEX ? "a copy elsewhere is not the pinned build" : false }, () => {
  const readme = readFileSync(new URL("../../projects/03/README.md", import.meta.url), "utf8");
  const pinned = readme.match(/Generated page SHA-256: `([a-f0-9]{64})`/)?.[1];
  assert.ok(pinned, "projects/03/README.md must state the generated page's SHA-256");
  assert.equal(createHash("sha256").update(readFileSync(index)).digest("hex"), pinned, "rebuild the page from the pinned builder; never merge it by hand");
});

test("the foundation check rejects missing, stale, duplicated or shadowed foundations", () => {
  assert.doesNotThrow(() => assertSharedFoundations(page, sharedTheme), "the real page passes before any mutation");
  const atlasRoot = page.match(/<style id="atlas-style">(:root\{[^}]*\})/)[1];
  const mutations = [
    ["foundation block missing", page.replace('id="atlas-foundations"', 'id="missing-foundations"')],
    ["stale control size", page.replace("--kvis-control-min-size:44px", "--kvis-control-min-size:40px")],
    ["shadowed font role", page.replace('<style id="atlas-style">', '<style id="atlas-style">:root{--f-body:serif}')],
    ["Atlas focus offset removed", page.replace(":root{--kvis-focus-offset:3px;", ":root{")],
    ["global focus rule restated", page.replace('<style id="atlas-style">', '<style id="atlas-style">button:focus-visible{outline:3px solid red}')],
    ["[hidden] overridden", page.replace('<style id="atlas-style">', '<style id="atlas-style">[hidden]{display:block!important}')],
    ["extra unmarked style removes the focus ring", page.replace("</head>", "<style>:focus-visible{outline:0}</style></head>")],
    ["font alias moved from :root to body", page.replace(atlasRoot, atlasRoot.replace(/--kvis-font-display:[^;]*;/, "") + "body{--kvis-font-display:serif}")],
  ];
  for (const [name, broken] of mutations) {
    assert.notEqual(broken, page, `${name}: plant not applied`);
    assert.throws(() => assertSharedFoundations(broken, sharedTheme), undefined, name);
  }
  // A recorded revision must be a real commit holding the block (needs Git; skipped without it).
  if (revisionBlock("0".repeat(40)) !== null) {
    assert.equal(revisionBlock("0".repeat(40)).exists, false, "a zero revision is rejected");
    const main = spawnSync("git", ["-C", REPO, "rev-parse", "f475726"], { encoding: "utf8" });
    if (main.status === 0) assert.deepEqual(revisionBlock(main.stdout.trim()).blocks, [], "f475726 has no foundation block, so it cannot be the source");
  }
  assert.throws(() => assertSharedFoundations(page, sharedTheme.replace("--kvis-space-2:8px", "--kvis-space-2:9px")));
  assert.throws(() => assertSharedFoundations(page, sharedTheme + sharedTheme));
});
