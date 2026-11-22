// Record current-model diagnostics for the ecology review. Observed limitations
// are not regression assertions: a future fix need not preserve them.
// Run: node research/02/tools/review_agropastoral.cjs [model-ref]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {load, make, check} = require('../../../tests/02/review_model.cjs');
const root = path.join(__dirname, '..', '..', '..');
const input = fs.readFileSync(path.join(root, 'projects/02/index.html'));
const html = input.toString('utf8'), code = load(html);
const modelRef = process.argv[2] || 'HEAD';
const revision = spawnSync('git', ['-C', root, 'rev-parse', modelRef], {encoding:'utf8'});
const committedModel = spawnSync('git', ['-C', root, 'show', `${modelRef}:projects/02/index.html`]);
if (revision.status !== 0 || committedModel.status !== 0 || !committedModel.stdout.equals(input)) {
  throw new Error('model-ref must resolve to a commit containing exactly the reviewed game file');
}
const baseline = check(html); // retain the existing upstream checks and re-plan policy
let noTubers = null;
for (let seed = 1; seed <= 80; seed++) {
  const g = make(code, seed);
  g.state.phase = 'plan'; g.state.yr = g.rollYear();
  g.state.alloc = {yunga:5, quechua:0, suni:5, puna:2};
  g.state.chuno = 2; g.clampAlloc();
  const r = g.harvest();
  if (r.toStore > 0) {
    noTubers = {seed, alloc:r.alloc, chuno_crews:r.chuno, food_grown:r.H,
      processed_to_store:r.toStore, winter:r.winter};
    break;
  }
}
const g = make(code, 12345), alloc = {yunga:0, quechua:0, suni:0, puna:1};
g.state.phase = 'plan';
const strength = g.crews().strength;
function puna(line, drought) {
  g.state.yr = {line, drought, hazy:false, winter:'normal'};
  return g.grow(strength, alloc, false).zr[3].got;
}
const clear = puna(4, false);
console.log(JSON.stringify({
  reviewed_commit:revision.status === 0 ? revision.stdout.trim() : null,
  model_file:'projects/02/index.html',
  model_file_sha256:crypto.createHash('sha256').update(input).digest('hex'),
  policy:'Default manual plan; Best land first at every required re-plan; equal-weight seeds 1-80',
  scope:'Headless model diagnostics; no UI, autoplay, benchmark-optimality or historical validation',
  baseline:{pinned_exact_rounded:baseline.pinned, means_1_80:baseline.means_1_80_best_land,
    weather_presets:baseline.presets,
    food_effect_directions:baseline.food_falls,
    gdp_effect_directions:baseline.gdp_reads_1_80,
    advance_plan:baseline.advance_plan,
    changing_plan_wins:baseline.changing_wins,
    gdp_note:'Internal direction buckets only; GDP is not student-graded since PR #21.'},
  diagnostics:{no_tuber_processing:noTubers,
    puna_output_ratios:{frost_only:puna(3,false)/clear, frost_and_drought:puna(3,true)/clear},
    note:'Output ratios are not herd mortality. Missing herd/commodity/time mechanisms were also checked directly in the source.'}
}, null, 2));
