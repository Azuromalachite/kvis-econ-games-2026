// A bounded C6 counterexample, not the D/L/H prediction sweeps.
// Node >=22; no packages. From a complete Git checkout:
//   node research/03/models/depth-liquidity-gate-check.mjs --output <outside-Git.json>
// Reads the four pinned inputs from Git objects and materializes them in an OS
// temporary directory. It never edits the playable game. --source-dir is for
// an already materialized pinned source tree; every input hash is recorded.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const PIN='d2d66a3a5fc6f839890149cce427c42e2f1566a0',EXPECTED='1c901dd1cd6507a6deb9fabed4d91ebd5bd81204b583008eec5f5d4cd163442b';
const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const root=fileURLToPath(new URL('../../../',import.meta.url));
const paths=['projects/03/index.html','tests/03/engine/load-engine.mjs','tests/03/baseline-harness.js','research/03/models/economy-skeleton-params.json'];
let source=option('--source-dir'),sourceMode='provided pinned source directory';
if(!source){
 source=mkdtempSync(join(tmpdir(),'mn-c6-'));sourceMode='git show '+PIN;
 for(const path of paths){const got=spawnSync('git',['show',PIN+':'+path],{cwd:root,maxBuffer:8*1024*1024});if(got.status!==0)throw Error('Cannot read pinned Git object '+path+': '+got.stderr.toString());const target=join(source,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,got.stdout);}
}
const sources=Object.fromEntries(paths.map(path=>{const bytes=readFileSync(join(source,path));return[path,{sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}];}));
assert.equal(sources[paths[0]].sha256,EXPECTED,'wrong engine revision');
const {loadEngine}=await import(pathToFileURL(join(source,paths[1])).href);
const P=JSON.parse(readFileSync(join(source,paths[3]))),e=loadEngine({index:join(source,paths[0]),harness:true}),g=e.g;
vm.runInContext('window.renderAll=()=>{};harnessReset("junk","normal","calicut",1);Math.random=()=>.99;',g);
const k=1,wage=P.vessels.junk.wages,goods=e.COMMODITIES.map(c=>c.id),receivables=[],trace=[],negative=[];
let active=null,minPostAction=e.state.cash;
const snapshot=()=>({month:e.state.monthIndex,port:e.state.currentPort,cash:e.state.cash,cargo:{...e.state.cargo},receivables:receivables.map(r=>({...r}))});
g.__settlement={
 sell(id,qty,sell){const cash=e.state.cash;sell(id,qty);const value=e.state.cash-cash;if(value>0){e.state.cash-=value;receivables.push({due:e.state.monthIndex+k,value});}},
 advance(m,advance){
  const before=snapshot();if(before.cash<0)negative.push({time:'after charges, before settlement credit',action:active,monthsAdvanced:m,state:before});
  let credit=0;for(let i=receivables.length-1;i>=0;i--)if(receivables[i].due<=e.state.monthIndex+m){credit+=receivables[i].value;receivables.splice(i,1);}
  e.state.cash+=credit;advance(m);trace.push({kind:'advance',action:active,months:m,before,credit,after:snapshot()});
 }
};
vm.runInContext(`{const sell=window.sellCargoQty,advance=window.advanceTime;
 window.sellCargoQty=(id,q)=>__settlement.sell(id,q,sell);
 window.advanceTime=m=>__settlement.advance(m,advance);}`,g);
function fee(port,standing){let mult=1;for(const [limit,factor]of P.standing.feeTiers)if(standing>=limit){mult=factor;break;}return Math.round(P.ports[port].fee*mult);}
function required(plan,cargo,cash){
 const st=e.state,arrival=st.monthIndex+plan.calc.months,first=Math.min(arrival+k,...receivables.filter(r=>r.due>st.monthIndex).map(r=>r.due));
 let outlay=plan.calc.months*wage;
 if(plan.calc.isDeadZone)outlay+=.25*20;
 if(!cargo.cloves&&!cargo.ivory)outlay+=P.ports[plan.lane.to].piracy*.6*Math.min(Math.max(0,cash),75);
 for(let t=arrival;t<arrival+k&&t<first;t++)outlay+=wage+fee(plan.lane.to,Math.min(100,(st.diaspora[plan.lane.to]||0)+5));
 return outlay;
}
for(let guard=0;!e.state.ended&&guard<200;guard++){
 for(const good of goods)if(e.state.cargo[good])g.sellCargoQty(good,999);
 if(e.state.hull<60&&e.state.cash>200)g.repairHull();
 const plans=e.SEA_LANES.filter(l=>l.from===e.state.currentPort).map(l=>g.harnessPlan(l)).filter(p=>!p.calc.isHeadwind).sort((a,b)=>b.perMonth-a.perMonth);
 if(!plans.length){active={kind:'wait',month:e.state.monthIndex,port:e.state.currentPort};g.waitInPort();minPostAction=Math.min(minPostAction,e.state.cash);continue;}
 const plan=plans[0],st=e.state,tariff=g.getEffectiveTariff(st.currentPort),items=e.COMMODITIES.map(c=>{const cost=Math.round(g.getLivePortPrice(c,st.currentPort,st.monthIndex)*(1+tariff)),sale=g.getLivePortPrice(c,plan.lane.to,Math.min(23,st.monthIndex+plan.calc.months));return {c,cost,sale};}).filter(x=>x.sale>x.cost).sort((a,b)=>b.sale/b.cost-a.sale/a.cost);
 const cargo={...st.cargo};let cash=st.cash,tons=goods.reduce((s,id)=>s+cargo[id]*P.goods[id].weight,0);const buys=[];
 for(const item of items){let q=0;while(tons+item.c.weight<=P.vessels.junk.capacity&&cash>=item.cost){cargo[item.c.id]++;cash-=item.cost;if(cash<required(plan,cargo,cash)){cargo[item.c.id]--;cash+=item.cost;break;}q++;tons+=item.c.weight;}if(q)buys.push([item.c.id,q]);}
 const beforeBuys=snapshot();for(const [id,q]of buys)g.buyCargoQty(id,q);
 active={kind:'sail',from:st.currentPort,to:plan.lane.to,departureMonth:st.monthIndex,months:plan.calc.months};
 trace.push({kind:'decision',lane:active,buys,beforeBuys,beforeDeparture:snapshot(),requiredReserve:required(plan,st.cargo,st.cash)});
 g.sailTo(plan.lane.to);minPostAction=Math.min(minPostAction,st.cash);if(negative.length)break;
}
assert.equal(negative.length,1);assert.equal(negative[0].state.cash,-43);assert.equal(negative[0].action.from,'aden');assert.equal(negative[0].action.to,'kilwa');assert.equal(negative[0].action.months,4);
assert.equal(e.state.cash,13562);assert.equal(e.state.ended,false);assert(minPostAction>=0);
assert.equal(createHash('sha256').update(readFileSync(join(source,paths[0]))).digest('hex'),EXPECTED);
const result={schema_version:'1.0',experiment:'2026-11-23-depth-liquidity',kind:'C6 validation counterexample; no predictions scored',recorded:new Date().toISOString(),node:process.version,engineCommit:PIN,sourceMode,sources,conditions:{vessel:'junk',difficulty:'normal',policy:'avoidHeadwind',k:1,reserve:'R-exp',hazards:'off: every draw0.99'},C6:{pass:false,minimumBeforeCredit:-43,postActionMinimum:minPostAction,legacyPostActionObservationWouldMiss:true,notCampaignRuin:true},predictionSweeps:{D:'not run',L:'not run',H:'not run',B1:'not run'},stopped:'first counterexample, intentionally unfinished campaign',negative,trace};
const output=option('--output');if(output){mkdirSync(dirname(resolve(output)),{recursive:true});writeFileSync(output,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({C6:result.C6,gameSHA256:EXPECTED,output:output||null},null,2));
