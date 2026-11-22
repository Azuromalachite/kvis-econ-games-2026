// Shows that the Week 1 checks can fail. Each mutation is made in a temporary copy of
// projects/01/index.html (outside the repository); the named test must fail on it while
// other tests in the same file still pass, so a copy that fails to load doesn't count.
//
// Run: node tests/01/planted-defects.mjs
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const INDEX = fileURLToPath(new URL("../../projects/01/index.html", import.meta.url));
const PAGE = fileURLToPath(new URL("./page.test.mjs", import.meta.url));
const SCENARIOS = fileURLToPath(new URL("./scenarios.test.mjs", import.meta.url));
const original = readFileSync(INDEX, "utf8");
const hashBefore = createHash("sha256").update(original).digest("hex");

const sub = (from, to) => html => {
  if (!html.includes(from)) throw new Error(`mutation target not found: ${from.slice(0, 60)}`);
  return html.replace(from, () => to);
};
const MUTATIONS = [
  [PAGE, "every class the page uses has a rule", "a utility rule renamed", sub(".text-amber-300{", ".text-amber-301{")],
  [PAGE, "nothing remote except Google Fonts", "a CDN script added", sub("<title>", '<script src="https://cdn.tailwindcss.com"></script><title>')],
  [PAGE, "nothing remote except Google Fonts", "the shared theme unlinked", sub('  <link rel="stylesheet" href="../../assets/theme.css">\n', "")],
  [PAGE, "jsPDF and html2canvas are the released builds", "one byte of jsPDF changed", sub("Version 2.5.1 Built on", "Version 2.5.2 Built on")],
  [PAGE, "the page is LF only", "CRLF line endings", html => html.replace(/\n/g, "\r\n")],
  [PAGE, "no hard-coded colours", "a colour hard-coded", sub(".bg-slate-900{background-color:var(--surface)}", ".bg-slate-900{background-color:#151c30}")],
  [SCENARIOS, "scenario A", "Rome silk sells at 1399", sub("silk: { buy: 1500, sell: 1400,", "silk: { buy: 1500, sell: 1399,")],
  [SCENARIOS, "scenario D", "exchange fee 4% instead of 5%", sub("const feeMultiplier = 0.95;", "const feeMultiplier = 0.96;")],
  [SCENARIOS, "local currency is converted", "no conversion on arrival", sub("      convertCarriedCurrency(departedNode, newWayPoint);\n", "")],
  [SCENARIOS, "difficulty and the ROI baseline", "difficulty unlocked after launch", sub("      if (state.isStarted) return;\n      const mode", "      const mode")],
  [SCENARIOS, "after the report", "market open after the report", sub("if (!state.isStarted || state.isFinished) return;", "if (!state.isStarted) return;")],
  [SCENARIOS, "a stranded caravan", "stranding never detected", sub("if (isStranded()) {", "if (false) {")],
];

const dir = mkdtempSync(join(tmpdir(), "week1-planted-"));
let failures = 0;
try {
  for (const [file, target, label, mutate] of MUTATIONS) {
    const copy = join(dir, "index.html");
    writeFileSync(copy, mutate(original));
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", file], { env: { ...process.env, WEEK1_INDEX: copy }, encoding: "utf8" });
    const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map(m => m[1]);
    const passed = [...r.stdout.matchAll(/^ok \d+ - (.*)$/gm)].map(m => m[1]);
    const caught = r.status !== 0 && failed.some(t => t.includes(target)) && passed.length > 0;
    if (!caught) failures++;
    console.log(`${caught ? "caught " : "MISSED "} ${label} -> ${failed.join("; ") || "(no failing test)"}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const hashAfter = createHash("sha256").update(readFileSync(INDEX, "utf8")).digest("hex");
if (hashAfter !== hashBefore) { console.log("projects/01/index.html changed during the run"); failures++; }
console.log(failures ? `${failures} planted defect(s) not caught` : `all ${MUTATIONS.length} planted defects caught; index.html unchanged`);
process.exit(failures ? 1 : 0);
