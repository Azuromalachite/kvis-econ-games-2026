// Packaging check for projects/01/index.html. Plain Node, no dependencies:
//
//   node tools/01/check-page.mjs [path/to/index.html]
//
// Fails (exit 1) if the page:
//   - has a carriage return anywhere (the repo is LF);
//   - loads anything remote: any element with a src attribute, a <link> to a stylesheet
//     or script, or a CSS @import or url(http…);
//   - embeds jsPDF or html2canvas bytes other than the released cdnjs builds;
//   - uses a class name that has no rule in <style id="week1-utilities">, apart from the
//     page's own classes defined in its other <style> element;
//   - has an inline script that does not parse.
//
// To update a library: replace the contents of <script id="vendor-…"> with the new
// release byte for byte and change its hash below.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const page = process.argv[2] ?? fileURLToPath(new URL('../../projects/01/index.html', import.meta.url));
const html = readFileSync(page, 'utf8');
const failures = [];
const fail = msg => failures.push(msg);

const VENDOR = {
  // https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
  'vendor-jspdf': '98ccf17aa10c20bb1301762618fcc9b6ab3a4e7f26b6071d64d0b41154df3875',
  // https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
  'vendor-html2canvas': 'e87e550794322e574a1fda0c1549a3c70dae5a93d9113417a429016838eab8cb',
};
const OWN_CLASSES = new Set(['custom-scrollbar', 'pulse-node']);

if (html.includes('\r')) fail('page contains carriage returns; it must be LF only');

// Library bytes.
let rest = html;
for (const [id, want] of Object.entries(VENDOR)) {
  const m = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)</script>`));
  if (!m) { fail(`<script id="${id}"> not found`); continue; }
  const got = createHash('sha256').update(m[1], 'utf8').digest('hex');
  if (got !== want) fail(`${id}: SHA-256 ${got}, expected ${want}`);
  rest = rest.replace(m[0], '');
}

// Utility sheet.
const sheetMatch = rest.match(/<style id="week1-utilities">([\s\S]*?)<\/style>/);
if (!sheetMatch) fail('<style id="week1-utilities"> not found');
const sheet = sheetMatch ? sheetMatch[1] : '';
rest = rest.replace(sheetMatch ? sheetMatch[0] : '', '');

// Remote loads (checked on the page without the library bodies).
for (const m of rest.matchAll(/<(\w+)\b[^>]*\ssrc\s*=/gi)) fail(`remote-capable <${m[1]} src=…> found`);
for (const m of rest.matchAll(/<link\b[^>]*>/gi)) {
  if (/rel\s*=\s*["']?(stylesheet|preload|modulepreload|import)/i.test(m[0])) fail(`<link> loads a resource: ${m[0]}`);
}
for (const css of [sheet, ...[...rest.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1])]) {
  if (/@import/i.test(css)) fail('CSS @import found');
  if (/url\(\s*["']?(https?:)?\/\//i.test(css)) fail('CSS url() to a remote resource found');
}

// Every class name used has a rule.
const tokens = new Set();
for (const m of rest.matchAll(/\bclass(?:Name)?\s*=\s*(["'`])([^"'`]*)\1/g)) {
  m[2].split(/\s+/).filter(Boolean).forEach(t => tokens.add(t));
}
for (const m of rest.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g)) {
  for (const q of m[1].matchAll(/(["'])([^"']+)\1/g)) tokens.add(q[2]);
}
const escape = t => t.replace(/[^a-zA-Z0-9_-]/g, c => '\\' + c);
const missing = [...tokens].filter(t => !OWN_CLASSES.has(t))
  .filter(t => !new RegExp('\\.' + escape(escape(t)) + '(?![a-zA-Z0-9_-])').test(sheet));
if (missing.length) fail(`classes with no utility rule: ${missing.join(' ')}`);

// Inline scripts parse.
for (const m of rest.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  try { new vm.Script(m[1]); } catch (e) { fail(`inline script does not parse: ${e.message}`); }
}

if (failures.length) {
  console.error(`FAIL ${page}\n- ` + failures.join('\n- '));
  process.exit(1);
}
console.log(`PASS ${page}: no remote loads, libraries match, ${tokens.size} class names covered, scripts parse`);
