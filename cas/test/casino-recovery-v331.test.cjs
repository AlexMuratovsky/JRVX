const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Money=require('../public/modules/core/runtime/money-v330.js');
const source=fs.readFileSync(process.env.CAS_RECOVERY_V331_SOURCE||path.join(__dirname,'../public/assets/js-v331/casino.js'),'utf8');
const OWNER='JRVX-AAAA12345678',OTHER='JRVX-BBBB87654321';
const drain=()=>new Promise(resolve=>setImmediate(resolve));
const card=r=>({r,s:'♠'});
const idle=()=>({currency:'MG',hands:[],dealer:[],active:false,hand:0,hideDealer:true});
const active=(cards=['8','9'])=>({...idle(),roundId:1,active:true,baseBet:50,insuranceOffered:false,insuranceResolved:true,hands:[{cards:cards.map(card),bet:50,done:false,doubled:false}],dealer:[card('10'),card('7')]});

function fixture(){
 const nodes=new Map(),records=new Map(),listeners=new Map(),timers=new Map(),requests=[],applied=[],walletSnapshots=[];
 let owner=OWNER,serial=0,timer=0,behavior=null,heldResolve,view=idle(),stateFails=false;
 const balance=1000000;
 function node(id){
  if(!nodes.has(id))nodes.set(id,{id,value:'50',textContent:'',innerHTML:'',title:'',disabled:false,dataset:{},style:{},attrs:{},
   classList:{contains:()=>false,add(){},remove(){},toggle(){}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},
   setAttribute(name,value){this.attrs[name]=value}});
  return nodes.get(id);
 }
 const account=()=>({ok:true,account:{id:owner},wallet:{MG:balance},walletRevision:{MG:2},economy:{version:'mg-v330',currency:'MG',retiredCurrencies:['MS']}});
 const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
 const ctx={console,AbortController,navigator:{},
  setTimeout(fn,ms){const id=++timer;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
  document:{readyState:'loading',getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)}},
  sessionStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)},
  localStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)},
  rouletteBusy:false,rouletteState:{},rouletteHistory:[],rouletteType:'red',rouletteExact:null,R_ORDER:Array.from({length:37},(_,i)=>i),
  rouletteColor:()=>'red',rouletteSyncBetChips(){},
  rouletteAnimate(reveal){reveal()},rouletteUpdatePreview(){},rouletteRenderHistory(){},rouletteDraw(){},casinoRefresh(){},
  muraTokenBalance:()=>balance,casinoTakeBet(){assert.fail('Production cannot debit a local wallet')},casinoReturn(){assert.fail('Production cannot credit a local wallet')},
  fetch:async(url,options={})=>{
   const body=options.body?JSON.parse(options.body):null;requests.push({url,body,signal:options.signal});
   if(url==='/api/blackjack/state')return response(stateFails?503:200,stateFails?{ok:false,error:'server_error'}:{ok:true,state:view,version:7});
   if(url==='/api/me')return response(200,account());
   if(!['/api/blackjack/action','/api/roulette/spin'].includes(url))assert.fail('Unexpected network route '+url);
   if(behavior?.kind==='http')return response(behavior.status,{ok:false,error:behavior.code});
   if(behavior?.kind==='network')throw Error(behavior.code);
   if(behavior?.kind==='hold')return new Promise(resolve=>{heldResolve=resolve});
   if(url==='/api/blackjack/action')return response(200,{ok:true,result:{currency:'MG',state:{...active(),hands:[{...active().hands[0],bet:body.bet||50}]},version:8,actionVersion:8,roundId:1}});
   return response(200,{ok:true,result:{currency:'MG',number:2,balanceAfter:balance,won:false,profit:-body.amount}});
  }};
 ctx.window={JRVXCASMoneyV330:Money,crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`},
  JRVXCASIdentityV300:{state:()=>({mode:'production',requiresAuthentication:true,authenticated:!!owner,user:owner?{id:owner}:null})},
  JRVXCasEconomy:{get:()=>({currency:'MG',mg:balance}),balance:()=>balance,setCurrency(){},set(snapshot){walletSnapshots.push(snapshot);assert.deepEqual(snapshot,{mg:balance})}},
  JRVXCASServerAccount:{refresh:async()=>account(),apply:data=>applied.push(data),history:async()=>[]}};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 const api=ctx.window.JRVXCASV220;
 return{api,shared:ctx.window.JRVXCASV220Shared,node,records,requests,applied,walletSnapshots,
  http(status,code){behavior={kind:'http',status,code}},network(code='connection_lost'){behavior={kind:'network',code}},hold(){behavior={kind:'hold'}},success(){behavior=null},
  expire(){const timer=[...timers.values()].find(t=>t.ms===12000);assert.ok(timer);timer.fn()},
  release(status,code){heldResolve(response(status,{ok:false,error:code}))},
  identity(id){owner=id;for(const fn of listeners.get('jrvx-cas-identity')||[])fn()},
  setView(value){view=value},failState(value){stateFails=value},
  boot(){listeners.get('DOMContentLoaded').find(fn=>fn.name==='bindV242Blackjack')()},
  mutations:()=>requests.filter(r=>r.body),
  pending(game,id=OWNER){return records.get((game==='roulette'?'jrvxRoulettePendingV302:':'jrvxBlackjackPendingV302:')+id)}
 };
}

for(const game of ['roulette','blackjack']){
 const idField=game==='roulette'?'spinId':'actionId',input=game==='roulette'?'rouletteBetInput':'bjBetInput',message=game==='roulette'?'rouletteMessage':'bjMessage';
 const invoke=f=>f.api[game][game==='roulette'?'spin':'deal']();
 test(`${game}: explicit capacity refusal releases only the rejected intent and accepts a changed fresh stake`,async()=>{
  const f=fixture();f.node(input).value='500';f.http(409,'balance_limit');await invoke(f);
  const first=f.mutations()[0].body;assert.equal(f.pending(game),undefined);assert.match(f.node(message).textContent,/отклонено.*предел баланса MG/);assert.doesNotMatch(f.node(message).textContent,/не подтвердил|Повторная попытка/);
  assert.equal(f.node(game==='roulette'?'rouletteSpin':'bjDeal').disabled,false);assert.equal(f.node(input).disabled,false);
  f.node(input).value='100';f.success();await invoke(f);const next=f.mutations()[1].body;
  assert.notEqual(next[idField],first[idField]);assert.equal(next[game==='roulette'?'amount':'bet'],100);assert.equal(f.pending(game),undefined);assert.equal(first.currency,'MG');
 });
 test(`${game}: explicit maintenance refusal remains definitive even when the old server sends HTTP500`,async()=>{
  const f=fixture();f.http(500,'economy_draining');await invoke(f);assert.equal(f.pending(game),undefined);assert.match(f.node(message).textContent,/новые ставки временно недоступны/);assert.doesNotMatch(f.node(message).textContent,/не подтвердил|Повторная попытка/);
 });
 test(`${game}: unknown409, unauthorized replay and generic5xx preserve the original intent`,async()=>{
  for(const [status,code]of [[409,'command_outcome_unknown'],[409,'new_unrecognized_error'],[401,'unauthorized'],[429,'rate_limited'],[503,'server_error']]){
   const f=fixture();f.node(input).value='500';f.http(status,code);await invoke(f);const first=f.mutations()[0].body;
   assert.ok(f.pending(game),`${status} ${code}`);assert.match(f.node(message).textContent,/не подтвердил/);
   f.node(input).value='100';f.success();await invoke(f);assert.deepEqual(f.mutations()[1].body,first);assert.equal(f.pending(game),undefined);
  }
 });
 test(`${game}: actual request deadline aborts transport but keeps the original operation for reconciliation`,async()=>{
  const f=fixture();f.node(input).value='500';f.hold();const work=invoke(f);await drain();assert.equal(f.mutations().length,1);const first=f.mutations()[0].body;
  if(game==='blackjack'){assert.equal(f.node('bjDeal').disabled,true);assert.equal(f.node('bjDeal').title,'Ожидаем ответ сервера.')}
  f.expire();await work;assert.equal(f.mutations()[0].signal.aborted,true);assert.ok(f.pending(game));assert.match(f.node(message).textContent,/не подтвердил/);
  assert.equal(f.node(game==='roulette'?'rouletteSpin':'bjDeal').disabled,false);
  f.node(input).value='100';f.success();await invoke(f);assert.deepEqual(f.mutations()[1].body,first);assert.equal(f.pending(game),undefined);
  f.release(409,'balance_limit');await drain();assert.equal(f.pending(game),undefined,'late timed-out response cannot reopen or settle a newer intent');
 });
 test(`${game}: a network exception with a refusal-like message is still uncertain`,async()=>{
  for(const code of ['balance_limit','economy_draining','insufficient_balance','currency_retired','stale_state']){
   const f=fixture();f.network(code);await invoke(f);assert.ok(f.pending(game),code);assert.match(f.node(message).textContent,/не подтвердил/);assert.doesNotMatch(f.node(message).textContent,/безопасный предел|Обновление экономики/);
  }
 });
 test(`${game}: a late rejected response cannot clear an old-owner intent or overwrite the new account UI`,async()=>{
  const f=fixture();f.hold();const work=invoke(f);await drain();assert.ok(f.pending(game));f.identity(OTHER);await drain();const before=f.node(message).textContent;
  f.release(409,'balance_limit');await work;assert.ok(f.pending(game,OWNER));assert.equal(f.pending(game,OTHER),undefined);assert.equal(f.node(message).textContent,before);
  f.success();await invoke(f);assert.equal(f.mutations().at(-1).body.ownerId,OTHER);assert.ok(f.pending(game,OWNER));
 });
}

test('known HTTP400 parameter refusals permit correction while unknown HTTP400 keeps the prior operation',async()=>{
 for(const code of ['invalid_bet','unexpected_bet_fields']){const f=fixture();f.http(400,code);await f.api.roulette.spin();assert.equal(f.pending('roulette'),undefined);assert.match(f.node('rouletteMessage').textContent,/отклонил запрос/)}
 const f=fixture();f.http(400,'new_unrecognized_error');await f.api.blackjack.deal();assert.ok(f.pending('blackjack'));assert.match(f.node('bjMessage').textContent,/не подтвердил/);
});

test('a contradictory successful HTTP response does not prove a capacity refusal',async()=>{
 const f=fixture();f.http(200,'balance_limit');await f.api.roulette.spin();assert.ok(f.pending('roulette'));assert.match(f.node('rouletteMessage').textContent,/не подтвердил/);
});

test('blackjack stale-state refusal refreshes the visible hand without automatically submitting a new action',async()=>{
 const f=fixture();f.http(409,'stale_state');await f.api.blackjack.deal();assert.equal(f.mutations().length,1);assert.equal(f.pending('blackjack'),undefined);
 assert.equal(f.requests.filter(r=>r.url==='/api/blackjack/state').length,2);assert.match(f.node('bjMessage').textContent,/Состояние раздачи обновилось/);
});

test('blackjack does not claim synchronization succeeded when a stale-state refresh fails',async()=>{
 const f=fixture();f.boot();await drain();f.http(409,'stale_state');f.failState(true);await f.api.blackjack.deal();assert.equal(f.pending('blackjack'),undefined);assert.match(f.node('bjMessage').textContent,/обновить раздачу не удалось/);assert.doesNotMatch(f.node('bjMessage').textContent,/раздачи обновилось/);
});

test('blackjack disabled controls explain the exact current rule without changing their availability',async()=>{
 const f=fixture();f.boot();await drain();assert.equal(f.node('bjHit').disabled,true);assert.equal(f.node('bjHit').title,'Сначала начните раздачу.');
 f.setView(active(['8','9']));f.identity(OWNER);await drain();assert.equal(f.node('bjSplit').disabled,true);assert.match(f.node('bjSplit').title,/пара одинаковых рангов/);assert.equal(f.node('bjDouble').disabled,false);assert.match(f.node('bjDouble').title,/Удвоить ставку/);
 assert.equal(f.node('bjDeal').disabled,true);assert.match(f.node('bjDeal').title,/завершите текущую раздачу/);
 assert.equal(f.node('bjInsurance').disabled,true);assert.match(f.node('bjInsurance').title,/когда у дилера туз/);
 const doubled=active(['8','8']);doubled.hands[0].doubled=true;f.setView(doubled);f.identity(OWNER);await drain();assert.equal(f.node('bjSplit').disabled,false);assert.equal(f.node('bjDouble').disabled,true);assert.match(f.node('bjDouble').title,/уже удвоена/);assert.equal(f.node('bjDouble').attrs['aria-description'],f.node('bjDouble').title);
});

test('blackjack split-cap and insurance-offer explanations match their existing native disabled states',async()=>{
 const f=fixture(),four=active(['8','8']);four.hands=Array.from({length:4},()=>({...active(['8','8']).hands[0]}));four.insuranceOffered=true;four.insuranceResolved=false;f.setView(four);f.boot();await drain();
 assert.equal(f.node('bjSplit').disabled,true);assert.match(f.node('bjSplit').title,/предел: четыре руки/);assert.equal(f.node('bjInsurance').disabled,false);assert.match(f.node('bjInsurance').title,/Сделать ставку/);
 four.insuranceResolved=true;f.setView(four);f.identity(OWNER);await drain();assert.equal(f.node('bjInsurance').disabled,true);assert.match(f.node('bjInsurance').title,/выбор страховки|Выбор страховки/);
});
