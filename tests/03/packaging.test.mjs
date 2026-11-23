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
  for (const css of others) assertNoFoundationOverrides(css);
}

// Every CSS rule outside the foundation block, read one by one (innermost rules, so @media bodies count too):
//   1. no rule switches the focus ring off, for any selector: outline or outline-width 0 in any unit (0, 0px, 0em, 0.0),
//      outline or outline-style none or hidden, or an outline colour of transparent;
//   2. no :focus-visible selector is unqualified: somewhere in it there must be a class, an id, or an attribute selector
//      on an attribute that is not global. Global attributes ([class], [id], [lang], [dir], [style], [title], [role],
//      [tabindex], [hidden] and the like, with or without a value) can sit on any element, so "[class] :focus-visible"
//      and "html[lang] :focus-visible" count as global, as do "html :focus-visible" and ":where(button):focus-visible"
//      (:where(), :is() and :not() are ignored);
//   3. no [hidden] rule, in any attribute form, sets a display other than none.
// Property names, pseudo-classes and attribute names are matched case-insensitively, as browsers do in HTML.
// Limits: selectors built at run time, styles set from script, an outline colour equal to the background or written as
// a zero-alpha rgba()/hsla()/#RRGGBB00, and an outline-offset that hides the ring are not seen.
const GLOBAL_ATTRIBUTE = /\[\s*(?:class|id|lang|xml:lang|dir|style|title|role|tabindex|hidden|translate|inert|accesskey|autofocus|contenteditable|draggable|spellcheck|enterkeyhint|inputmode|nonce|popover)\s*(?:[~|^$*]?=[^\]]*)?\]/gi;
export function assertNoFoundationOverrides(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, selectorText, body] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const where = selectorText.trim();
    for (const declaration of body.split(";")) {
      const [name, ...rest] = declaration.split(":"), prop = name.trim().toLowerCase(), value = rest.join(":").replace(/!\s*important/i, "").trim().toLowerCase();
      if (!/^outline(?:-width|-style|-color)?$/.test(prop)) continue;
      const off = /(?:^|\s)(?:[+-]?0*\.?0+(?:[a-z%]+)?|none|hidden|transparent)(?=\s|$)/.test(value);
      assert.ok(!off, `"${where}" switches the focus ring off (${prop}: ${value})`);
    }
    for (const selector of where.split(",").map(x => x.trim()).filter(Boolean)) {
      if (/:focus-visible/i.test(selector)) {
        const bare = selector.replace(/:(?:where|is|not)\([^()]*\)/gi, "").replace(GLOBAL_ATTRIBUTE, "");
        assert.match(bare, /[.#[]/, `"${selector}" restates the global focus ring`);
      }
      if (/\[\s*hidden\s*(?:[~|^$*]?=[^\]]*)?(?:\s[is])?\s*\]/i.test(selector)) assert.doesNotMatch(body, /display\s*:\s*(?!none\b)/i, `"${selector}" overrides [hidden]`);
    }
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
    // Appended at the end of the Atlas styles, so each trips the rule it names (not the :root checks above).
    ...[
      ["global focus rule restated", "button:focus-visible{outline:3px solid red}"],
      ["[hidden] overridden", "[hidden]{display:block!important}"],
      ["focus rule hidden in a selector list", ".x,button:focus-visible{outline:2px solid red}"],
      ["focus rule behind a descendant combinator", "html :focus-visible{outline:2px solid red}"],
      ["focus rule inside :where()", ":where(button):focus-visible{outline:2px solid red}"],
      ["[hidden] overridden in attribute form", '[hidden=""]{display:block!important}'],
      ["scoped focus ring switched off", ".atlas-months button:focus-visible{outline:none}"],
      ["outline width zeroed", "button{outline-width:0!important}"],
      ["focus ring zeroed with a unit", ".atlas-months button:focus-visible{outline:0px}"],
      ["focus ring made transparent", ".x button:focus-visible{outline-color:transparent}"],
      ["focus rule behind [class]", "[class] :focus-visible{outline:2px solid red}"],
      ["focus rule behind html[lang]", "html[lang] :focus-visible{outline:2px solid red}"],
      ["[HIDDEN] overridden in capitals", "[HIDDEN]{display:block!important}"],
    ].map(([name, rule]) => [name, page.replace(/(<style id="atlas-style">[\s\S]*?)<\/style>/, `$1${rule}</style>`)]),
    ["extra unmarked style removes the focus ring", page.replace("</head>", "<style>:focus-visible{outline:0}</style></head>")],
    ["font alias moved from :root to body", page.replace(atlasRoot, atlasRoot.replace(/--kvis-font-display:[^;]*;/, "") + "body{--kvis-font-display:serif}")],
  ];
  for (const [name, broken] of mutations) {
    assert.notEqual(broken, page, `${name}: plant not applied`);
    assert.throws(() => assertSharedFoundations(broken, sharedTheme), undefined, name);
  }
  // Each override plant fails the override rule itself, not an earlier check.
  for (const rule of [":focus-visible{outline:0}", "button:focus-visible{outline:3px solid red}", "[hidden]{display:block!important}", ".atlas-months button:focus-visible{outline:none}", "button{outline-width:0!important}", '[hidden=""]{display:block!important}', ":where(button):focus-visible{color:red}", "html :focus-visible{color:red}"]) {
    assert.throws(() => assertNoFoundationOverrides(rule), undefined, rule);
  }
  for (const rule of [".atlas-months button:focus-visible{outline:0px}", ".x button:focus-visible{outline-color:transparent}", "[class] :focus-visible{color:red}", "html[lang] :focus-visible{color:red}", "[HIDDEN]{display:block!important}",
    ".x:FOCUS-VISIBLE{outline:0.0em}", "a{OUTLINE-STYLE:None}", "a{outline:1px hidden red}", "[role=button]:focus-visible{color:red}", "[hidden i]{display:flex}"]) {
    assert.throws(() => assertNoFoundationOverrides(rule), undefined, rule);
  }
  // Scoped focus styles that keep the ring stay allowed.
  for (const rule of ["#svg-ports>g[role=button]:focus-visible circle:last-of-type{stroke:#fff}", ".diff-btn:focus-visible{outline:3px dashed var(--accent);outline-offset:4px}", "[data-port]:focus-visible{outline-width:3px}", "a{outline-offset:0}"]) {
    assert.doesNotThrow(() => assertNoFoundationOverrides(rule), rule);
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

// No tracked file under projects/03/ or tests/03/ may keep a merge-conflict marker. A marker line starts with
// "<<<<<<< " or ">>>>>>> ", or is exactly "=======" (a Markdown setext underline is never exactly seven "=" and
// nothing else in these files, and "=======" inside text is not a whole line). Conflict markers once sat in
// tests/03/README.md through two merges (review of #32, B1).
export function conflictMarkers(text) {
  return text.split(/\r?\n/).map((line, i) => [i + 1, line]).filter(([, line]) => /^(<<<<<<< |>>>>>>> )/.test(line) || line === "=======");
}
test("no tracked file under projects/03/ or tests/03/ contains a merge-conflict marker", t => {
  const files = spawnSync("git", ["-C", REPO, "ls-files", "-z", "projects/03", "tests/03"], { encoding: "utf8" });
  if (files.status !== 0) return t.skip("needs Git");
  const found = [];
  for (const file of files.stdout.split("\0").filter(Boolean)) {
    const buf = readFileSync(join(REPO, file));
    if (buf.includes(0)) continue;   // binary (fonts, images)
    for (const [line, text] of conflictMarkers(buf.toString("utf8"))) found.push(`${file}:${line}: ${text}`);
  }
  assert.deepEqual(found, []);
});
test("the conflict-marker check fails on the block that sat in tests/03/README.md, and passes once it is resolved", () => {
  const planted = "```\nnode --test tests/03/atlas-events.test.mjs\n<<<<<<< ours\nnode --test tests/03/atlas-hazards.test.mjs\n=======\nnode --test tests/03/atlas-sea-lanes.test.mjs\n>>>>>>> theirs\n```\n";
  assert.deepEqual(conflictMarkers(planted).map(([line]) => line), [3, 5, 7]);
  const resolved = "```\nnode --test tests/03/atlas-events.test.mjs\nnode --test tests/03/atlas-sea-lanes.test.mjs\nnode --test tests/03/atlas-hazards.test.mjs\n```\n";
  assert.deepEqual(conflictMarkers(resolved), []);
  // Markdown setext headings and rules are not markers.
  assert.deepEqual(conflictMarkers("Title\n=====\nOther\n========\n---\n"), []);
});
