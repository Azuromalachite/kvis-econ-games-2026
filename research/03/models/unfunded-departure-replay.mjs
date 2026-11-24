// Exploratory follow-up to the unfunded empty departure recorded by
// unfunded-departure-check.mjs. No frozen prediction scored.
// This compares empty-ship movements, not campaign profit or a full strategy.
// node research/03/models/unfunded-departure-replay.mjs [--source-dir PINNED_ROOT] --output OUT.json
// Asserts the three input hashes against constants and re-derives every decision
// state and advance in counterexample.json's trace before branching. It does not
// re-derive the recorded requiredReserve (it has no copy of the H rule's R-exp).
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const PIN='d2d66a3a5fc6f839890149cce427c42e2f1566a0',HASH='1c901dd1cd6507a6deb9fabed4d91ebd5bd81204b583008eec5f5d4cd163442b';
const PINNED={'projects/03/index.html':HASH,'tests/03/engine/load-engine.mjs':'5b922ce705b29ae5e4e84554c24965b4f59afa711e100649e855238b5903eeb0','tests/03/baseline-harness.js':'3d84e095776f5f1af5dc0c731c5e3f32ccc2e93e4c3de12c9f430e78646eab06'};
const args=process.argv.slice(2),option=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];},repo=fileURLToPath(new URL('../../../',import.meta.url));
const paths=['projects/03/index.html','tests/03/engine/load-engine.mjs','tests/03/baseline-harness.js'];
let source=option('--source-dir');
if(!source){source=mkdtempSync(join(tmpdir(),'mn-unfunded-'));for(const path of paths){const r=spawnSync('git',['show',PIN+':'+path],{cwd:repo,maxBuffer:8*1024*1024});if(r.status)throw Error(r.stderr.toString());const p=join(source,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,r.stdout);}}
const input=new URL('../results/2026-11-24-unfunded-departures/counterexample.json',import.meta.url),observed=JSON.parse(readFileSync(input));
assert.equal(observed.engineCommit,PIN);
const sources=Object.fromEntries(paths.map(p=>[p,createHash('sha256').update(readFileSync(join(source,p))).digest('hex')]));assert.equal(sources[paths[0]],HASH);
for(const path of paths){assert.equal(sources[path],PINNED[path],'pinned input differs: '+path);assert.equal(observed.sources[path].sha256,PINNED[path],'recorded input hash differs: '+path);}
const {loadEngine}=await import(pathToFileURL(join(source,paths[1])).href);
const state=s=>({month:s.month,port:s.port,cash:s.cash,cargo:s.cargo,receivables:s.receipts??s.receivables});
function setup(){
 const e=loadEngine({index:join(source,paths[0]),harness:true}),g=e.g,receipts=[],events=[];
 vm.runInContext('window.renderAll=()=>{};harnessReset("junk","normal","calicut",1);Math.random=()=>.99;',g);
 const snapshot=()=>({month:e.state.monthIndex,port:e.state.currentPort,cash:e.state.cash,cargo:{...e.state.cargo},standing:{...e.state.diaspora},receipts:receipts.map(r=>({...r}))});
 g.__followup={sell(id,q,fn){const before=e.state.cash;fn(id,q);const v=e.state.cash-before;if(v>0){e.state.cash-=v;receipts.push({due:e.state.monthIndex+1,value:v});}},advance(m,fn){
  const before=snapshot();let credit=0;for(let i=receipts.length-1;i>=0;i--)if(receipts[i].due<=e.state.monthIndex+m){credit+=receipts[i].value;receipts.splice(i,1);}e.state.cash+=credit;fn(m);events.push({months:m,beforeCredit:before.cash,before,credit,after:snapshot()});
 }};
 vm.runInContext('{const sell=window.sellCargoQty,advance=window.advanceTime;window.sellCargoQty=(id,q)=>__followup.sell(id,q,sell);window.advanceTime=m=>__followup.advance(m,advance);}',g);
 // Re-derive the recorded trace: every decision state (before buys, before
 // departure) and every advance (state before credit, credit, state after).
 // requiredReserve is not re-derived.
 const trace=observed.trace;let i=0;
 for(;i<trace.length;i++){
  const d=trace[i];assert.equal(d.kind,'decision','record '+i);
  for(const c of e.COMMODITIES)if(e.state.cargo[c.id])g.sellCargoQty(c.id,999);
  assert.deepEqual(state(snapshot()),state(d.beforeBuys),'decision record '+i+' (before buys)');
  if(d.lane.departureMonth===4)break;
  for(const [id,q]of d.buys)g.buyCargoQty(id,q);
  assert.deepEqual(state(snapshot()),state(d.beforeDeparture),'decision record '+i+' (before departure)');
  const n=events.length;g.sailTo(d.lane.to);
  const recorded=trace.slice(i+1).filter(x=>x.kind==='advance'&&x.action.departureMonth===d.lane.departureMonth);
  assert.equal(events.length-n,recorded.length,'advance count after record '+i);
  for(const [j,a]of recorded.entries()){const ev=events[n+j];assert.equal(ev.months,a.months);assert.equal(ev.beforeCredit,a.before.cash,'advance before credit');assert.deepEqual(state(ev.before),state(a.before),'advance record (before)');assert.equal(ev.credit,a.credit,'advance credit');assert.deepEqual(state(ev.after),state(a.after),'advance record (after)');}
  i+=recorded.length;
 }
 assert.equal(i,trace.length-2,'stopped at the recorded final decision');
 assert.equal(e.state.cash,97);assert.equal(e.state.currentPort,'aden');assert.equal(e.state.monthIndex,4);assert.equal(receipts.reduce((s,r)=>s+r.value,0),13605);events.length=0;
 const forecast=()=>e.SEA_LANES.filter(l=>l.from===e.state.currentPort).map(l=>{const c=g.computeTransit(l);return {to:l.to,months:c.months,status:c.alignmentStatus,headwind:c.isHeadwind,upfrontWages:c.months*35};});
 return {e,g,receipts,events,snapshot,forecast};
}
const cases=[];
{
 const x=setup(),start=x.snapshot();assert.deepEqual(state(start),state(observed.trace.at(-2).beforeDeparture));x.g.sailTo('kilwa');assert.equal(x.events[0].beforeCredit,-43);assert.equal(x.e.state.cash,13562);
 {const a=observed.trace.at(-1),ev=x.events[0];assert.equal(a.kind,'advance');assert.deepEqual(state(ev.before),state(a.before));assert.equal(ev.credit,a.credit);assert.deepEqual(state(ev.after),state(a.after));assert.deepEqual(state(observed.negative[0].state),state(a.before));}
 cases.push({id:'original-unfunded-departure',start,events:x.events,end:x.snapshot(),minimumBeforeCredit:Math.min(...x.events.map(e=>e.beforeCredit)),scope:'original unfunded departure (control)'});
}
{
 const x=setup(),start=x.snapshot(),waitCost=x.g.getEffectiveLayoverFee('aden')+35;assert.equal(waitCost,70);assert(start.cash>=waitCost);
 x.g.waitInPort();const afterWait=x.snapshot(),routes=x.forecast();assert.equal(afterWait.cash,13632);assert.equal(afterWait.month,5);
 const calicut=routes.find(r=>r.to==='calicut'),kilwa=routes.find(r=>r.to==='kilwa');assert.equal(calicut.months,1);assert.equal(calicut.headwind,false);assert.equal(kilwa.headwind,true);
 x.g.sailTo('calicut');assert.equal(x.e.state.cash,13597);assert.equal(x.e.state.monthIndex,6);assert.equal(x.e.state.currentPort,'calicut');
 cases.push({id:'one-paid-wait-then-reconsider-route',start,waitCost,afterWait,availableRoutesAfterWait:routes,events:x.events,end:x.snapshot(),minimumBeforeCredit:Math.min(...x.events.map(e=>e.beforeCredit)),scope:'fixed alternative to demonstrate calendar effects, no new cargo purchases'});
}
{
 const x=setup(),start=x.snapshot();let waits=0;x.g.waitInPort();waits++;
 while(x.forecast().find(r=>r.to==='kilwa').headwind){assert(x.e.state.cash>=x.g.getEffectiveLayoverFee('aden')+35);x.g.waitInPort();if(++waits>12)throw Error('wind wait guard');}
 const departure=x.snapshot(),transit=x.forecast().find(r=>r.to==='kilwa');x.g.sailTo('kilwa');
 assert.equal(waits,5);assert.equal(departure.month,9);assert.equal(transit.months,2);assert.equal(x.e.state.currentPort,'kilwa');assert.equal(x.e.state.monthIndex,11);assert.equal(x.e.state.cash,13334);
 cases.push({id:'wait-and-retain-kilwa-destination',start,waitMonths:waits,departure,transit,events:x.events,end:x.snapshot(),minimumBeforeCredit:Math.min(...x.events.map(e=>e.beforeCredit)),scope:'retains destination and avoid-headwind rule, no new cargo purchases'});
}
{
 const x=setup();x.e.state.cash=69;const cost=x.g.getEffectiveLayoverFee('aden')+35,canWait=x.e.state.cash>=cost,canSail=x.forecast().some(r=>!r.headwind&&r.upfrontWages<=x.e.state.cash);
 assert.equal(canWait,false);assert.equal(canSail,false);cases.push({id:'cannot-afford-even-one-wait',synthetic:true,start:x.snapshot(),waitCost:cost,canWait,canFundAnyAllowedDeparture:canSail,actionTaken:'none',interpretation:'liquidity obstruction under the protocol cash >= 0 floor (the engine allows cash down to -250 D); no bankruptcy or rescue assumed'});
}
{
 const x=setup();x.e.state.cash=70;x.receipts.splice(0,x.receipts.length,{due:5,value:1},{due:6,value:13604});const start=x.snapshot();x.g.waitInPort();const cash=x.e.state.cash,cost=x.g.getEffectiveLayoverFee('aden')+35;assert.equal(cash,1);assert.equal(cost,61);assert.equal(cash>=cost,false);
 cases.push({id:'first-receipt-is-too-small',synthetic:true,start,events:x.events,afterFirstWait:x.snapshot(),firstReceipt:1,nextWaitCost:cost,canFundNextWait:false,actionTaken:'one affordable wait only',interpretation:'a receipt date alone does not guarantee a funded sequence'});
}
assert.equal(createHash('sha256').update(readFileSync(join(source,paths[0]))).digest('hex'),HASH);
const result={schema_version:'1.0',status:'exploratory deterministic branches; no frozen predictions scored',recorded:new Date().toISOString(),node:process.version,engineCommit:PIN,sources,counterexampleSHA256:createHash('sha256').update(readFileSync(input)).digest('hex'),conditions:'same starting decision as counterexample.json (unfunded empty departure), junk/normal/hazards off, one-month receipts; no cargo buys after branch point',scope:'three fixed empty-movement branches plus two explicitly synthetic boundary fixtures; no campaign profits or frozen hypotheses scored',branchCounts:{observedStateBranches:3,syntheticFixtures:2,attempted:5,completedBoundedCases:5,excluded:0,fullCampaignsCompleted:0},cases};
const output=option('--output');if(output){mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result,null,2));
