const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Money=require('../public/modules/core/runtime/money-v330.js');
const sourcePath=path.join(__dirname,'../public/assets/js-v332/casino.js');
const OWNER='JRVX-AAAA12345678',OTHER='JRVX-BBBB87654321';
const ID='12345678-1234-4123-8123-123456789012',NEWID='12345678-1234-4123-8123-123456789013';
const clone=value=>JSON.parse(JSON.stringify(value));
const drain=()=>new Promise(resolve=>setImmediate(resolve));
const card=r=>({r,s:'♠'});
const idle=()=>({currency:'MG',hands:[],dealer:[],active:false,hand:0,hideDealer:true,roundId:0});
const active=()=>({...idle(),roundId:1,active:true,baseBet:50,insuranceOffered:false,insuranceResolved:true,hands:[{cards:[card('8'),card('9')],bet:50,done:false,doubled:false}],dealer:[card('10'),card('7')]});
const key=(game,owner=OWNER)=>(game==='roulette'?'jrvxRoulettePendingV302:':'jrvxBlackjackPendingV302:')+owner;
const intent=game=>game==='roulette'?{ownerId:OWNER,spinId:ID,currency:'MG',amount:50,bet:{type:'red',numbers:[]}}:{ownerId:OWNER,actionId:ID,action:'deal',currency:'MG',expectedVersion:7,bet:50};
function envelope(game,pending=intent(game)){
 const result=game==='roulette'?{eventId:`roulette:${OWNER}:${pending.spinId}`,jrvxId:OWNER,currency:'MG',amount:pending.amount,bet:{...clone(pending.bet),multiplier:2},number:2,won:false,payout:0,profit:-pending.amount,balanceAfter:900000,timestamp:123456}
  :{actionId:pending.actionId,action:pending.action,expectedVersion:pending.expectedVersion,requestBet:pending.action==='deal'?pending.bet:null,requestCurrency:pending.action==='deal'?'MG':null,currency:'MG',version:8,actionVersion:8,roundId:1,state:active()};
 return{ok:true,economy:{version:'mg-v330',currency:'MG'},ownerId:OWNER,intentId:pending.spinId||pending.actionId,status:'confirmed',result,...game==='blackjack'?{snapshot:{state:active(),version:8}}:{}};
}
function fixture({game='roulette',pending=true}={}){
 const nodes=new Map(),records=new Map(),events={document:new Map(),window:new Map()},timers=new Map(),requests=[],applied=[],currencyChanges=[],accountReads=[];
 let owner=OWNER,timer=0,serial=0,lookupData=envelope(game),lookupStatus=200,lookupError=null,hold=false,resolveHeld=null,storageFailure='',stateView=idle(),stateVersion=7;
 function listen(surface,name,fn,options={}){if(options.signal?.aborted)return;const entries=events[surface].get(name)||[];entries.push(fn);events[surface].set(name,entries);options.signal?.addEventListener('abort',()=>events[surface].set(name,(events[surface].get(name)||[]).filter(item=>item!==fn)),{once:true})}
 function fire(surface,name,event={}){for(const fn of [...events[surface].get(name)||[]])fn(event)}
 function node(id){
  if(!nodes.has(id)){const classes=new Set(id===game?['active']:[]);nodes.set(id,{id,value:'50',textContent:'',innerHTML:'',title:'',disabled:false,dataset:{},style:{},attrs:{},
   classList:{contains:name=>classes.has(name),add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),toggle(name,on){if(on===undefined)on=!classes.has(name);on?classes.add(name):classes.delete(name)}},
   querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},setAttribute(name,value){this.attrs[name]=String(value)}})}
  return nodes.get(id);
 }
 const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>clone(data)});
 const account=()=>({ok:true,account:{id:owner},wallet:{MG:1000000},walletRevision:{MG:2},economy:{version:'mg-v330',currency:'MG',retiredCurrencies:['MS']}});
 const document={readyState:'loading',hidden:false,visibilityState:'visible',getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],
  addEventListener:(name,fn,options)=>listen('document',name,fn,options),dispatchEvent:event=>{fire('document',event.type,event);return true}};
 const storage={getItem(name){if(storageFailure==='read')throw Error('storage unavailable');return records.get(name)??null},setItem(name,value){if(storageFailure==='write')throw Error('storage unavailable');records.set(name,value)},removeItem(name){if(storageFailure==='remove')throw Error('storage unavailable');records.delete(name)}};
 const ctx={console,AbortController,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail}},navigator:{onLine:true},document,
  setTimeout(fn,ms){const id=++timer;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),sessionStorage:storage,localStorage:storage,
  rouletteBusy:false,rouletteState:{},rouletteHistory:[],rouletteType:'red',rouletteExact:null,R_ORDER:Array.from({length:37},(_,i)=>i),R_RED:new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]),
  roulettePocketCenterAngle:index=>index+.25,rouletteGeometry:()=>({ballPocket:42}),
  rouletteColor:()=>'red',rouletteSyncBetChips(){},rouletteAnimate(reveal){reveal()},rouletteUpdatePreview(){},rouletteRenderHistory(){},rouletteDraw(){},casinoRefresh(){},
  muraTokenBalance:()=>1000000,casinoTakeBet(){assert.fail('Recovery cannot debit local funds')},casinoReturn(){assert.fail('Recovery cannot credit local funds')},
  fetch:async(url,options={})=>{
   requests.push({url:String(url),method:options.method||'GET',body:options.body,signal:options.signal});
   assert.equal(options.method||'GET','GET','State recovery must never submit a financial command');
   if(String(url)==='/api/blackjack/state')return response(200,{ok:true,economy:{version:'mg-v330',currency:'MG'},ownerId:owner,state:stateView,version:stateVersion});
   if(String(url)==='/api/me')return response(200,account());
   assert.match(String(url),/^\/api\/(roulette|blackjack)\/recovery\?(spinId|actionId)=/);
   if(lookupError)throw Error(lookupError);
   if(hold)return new Promise(resolve=>{resolveHeld=resolve});
   return response(lookupStatus,lookupData);
  }};
 ctx.window={crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`},JRVXCASMoneyV330:Money,
  JRVXCASIdentityV300:{state:()=>({mode:'production',requiresAuthentication:true,ready:true,authenticated:!!owner,user:owner?{id:owner}:null})},
  JRVXCasEconomy:{get:()=>({currency:'MG',mg:1000000}),balance:()=>1000000,setCurrency:value=>currencyChanges.push(value),set(snapshot){assert.fail('Read-only recovery cannot set the wallet from an old game result: '+JSON.stringify(snapshot))}},
  JRVXCASServerAccount:{refresh:async()=>{accountReads.push(owner);return account()},apply:data=>applied.push(data),history:async()=>[]},
  addEventListener:(name,fn,options)=>listen('window',name,fn,options),dispatchEvent:event=>{fire('window',event.type,event);return true}};
 if(pending)records.set(key(game),JSON.stringify(intent(game)));
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(sourcePath,'utf8'),ctx);
 return{api:ctx.window.JRVXCASV220[game],all:ctx.window.JRVXCASV220,ctx,node,records,requests,applied,currencyChanges,accountReads,
  pending:(id=OWNER)=>records.get(key(game,id)),put(value,id=OWNER){records.set(key(game,id),JSON.stringify(value))},setData(value,status=200){lookupData=value;lookupStatus=status},network(error='connection_lost'){lookupError=error},
  hold(){hold=true},release(data=lookupData,status=lookupStatus){assert.ok(resolveHeld,'Expected a held read');resolveHeld(response(status,data))},failStorage(mode){storageFailure=mode},
  owner(id){owner=id;fire('document','jrvx-cas-identity')},
  hide(){document.hidden=true;document.visibilityState='hidden';fire('document','visibilitychange')},show(){document.hidden=false;document.visibilityState='visible';fire('document','visibilitychange')},
  pagehide:()=>fire('window','pagehide'),pageshow:()=>fire('window','pageshow'),
  expire(){const timer=[...timers.values()].find(value=>value.ms===12000);assert.ok(timer,'Expected a 12000ms request deadline');timer.fn()},
  setView(view,version=7){stateView=view;stateVersion=version},lookups:()=>requests.filter(request=>request.url.includes('/recovery?'))
 };
}

for(const game of ['roulette','blackjack']){
 test(`${game}: manual state recovery confirms the exact saved request through GET only`,async()=>{
  const f=fixture({game});assert.equal(f.api.recoveryState().busy,false);assert.ok(f.api.recoveryState().pending);assert.equal(f.api.recoveryState().available,true);
  const result=await f.api.recover();assert.equal(result.status,'confirmed');assert.equal(f.pending(),undefined);assert.equal(f.lookups().length,1);
  assert.equal(f.lookups()[0].url,`/api/${game}/recovery?${game==='roulette'?'spinId':'actionId'}=${ID}`);assert.equal(f.api.recoveryState().busy,false);
  assert.ok(f.requests.every(request=>request.method==='GET'));assert.equal(f.applied.length,0,'Historical receipts must not overwrite the current account balance');
 });
 test(`${game}: repeated checks share one in-flight read and lock normal game actions`,async()=>{
  const f=fixture({game});f.hold();const first=f.api.recover(),second=f.api.recover();await drain();assert.equal(f.lookups().length,1);assert.equal(f.api.recoveryState().busy,true);
  await f.api[game==='roulette'?'spin':'deal']();assert.ok(f.requests.every(request=>request.method==='GET'));
  f.release();const results=await Promise.all([first,second]);assert.equal(results[0].status,'confirmed');assert.equal(results[1].status,'confirmed');assert.equal(f.api.recoveryState().busy,false);
 });
 test(`${game}: missing server receipt preserves the original pending request`,async()=>{
  const f=fixture({game}),before=f.pending(),data=envelope(game);data.status='unknown';delete data.result;f.setData(data);
  assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);assert.equal(f.api.recoveryState().busy,false);
 });
 test(`${game}: owner, request, economy and fingerprint mismatches cannot settle pending`,async()=>{
  const mutations=[data=>data.ownerId=OTHER,data=>data.intentId=NEWID,data=>data.economy.currency='MS',data=>data.economy.version='old',data=>data.result.currency='MS'];
  if(game==='roulette')mutations.push(data=>data.result.eventId=`roulette:${OWNER}:${NEWID}`,data=>data.result.jrvxId=OTHER,data=>data.result.amount=51,data=>data.result.bet.type='black',data=>data.result.bet.numbers=[2]);
  else mutations.push(data=>data.result.actionId=NEWID,data=>data.result.action='stand',data=>data.result.expectedVersion=6,data=>data.result.requestBet=100,data=>data.result.requestCurrency='MS');
  for(const mutate of mutations){const f=fixture({game}),before=f.pending(),data=envelope(game);mutate(data);f.setData(data);assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);assert.equal(f.applied.length,0)}
 });
 test(`${game}: invalid numerical results cannot be presented as confirmation`,async()=>{
  const mutations=game==='roulette'?[data=>data.result.number=37,data=>data.result.balanceAfter=Number.MAX_SAFE_INTEGER+1,data=>data.result.payout=-1,data=>data.result.profit=0.5]
   :[data=>data.result.version=-1,data=>data.result.actionVersion=0.5,data=>data.snapshot.version=-1,data=>data.snapshot.state.currency='MS'];
  for(const [index,mutate] of mutations.entries()){const f=fixture({game}),before=f.pending(),data=envelope(game);mutate(data);f.setData(data);assert.equal((await f.api.recover()).status,'unknown','Invalid receipt variant '+index);assert.equal(f.pending(),before)}
 });
 test(`${game}: unknown HTTP and network failures retain the saved operation`,async()=>{
  for(const status of [401,409,429,503]){const f=fixture({game}),before=f.pending();f.setData({ok:false,error:'server_error'},status);assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);assert.equal(f.api.recoveryState().busy,false)}
  const f=fixture({game}),before=f.pending();f.network();assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);
 });
 test(`${game}: replacing pending while the GET is running protects the newer request`,async()=>{
  const f=fixture({game});f.hold();const pending=f.api.recover();await drain();const next=intent(game);next[game==='roulette'?'spinId':'actionId']=NEWID;f.put(next);const before=f.pending();f.release();await pending;
  assert.equal(f.pending(),before);assert.equal(f.applied.length,0);
 });
 test(`${game}: an A-B-A identity round trip fences the original response`,async()=>{
  const f=fixture({game}),before=f.pending();f.hold();const pending=f.api.recover();await drain();f.owner(OTHER);f.owner(OWNER);f.release();const result=await pending;assert.notEqual(result.status,'confirmed');assert.equal(f.pending(),before);assert.equal(f.applied.length,0);
 });
 test(`${game}: cancellation and lifecycle changes retain pending and ignore a late result`,async()=>{
  for(const action of ['cancel','hidden','pagehide']){
   const f=fixture({game}),before=f.pending();f.hold();const pending=f.api.recover();await drain();
   if(action==='cancel')f.api.cancelRecovery();else if(action==='hidden')f.hide();else f.pagehide();
   f.release();const result=await pending;assert.notEqual(result.status,'confirmed');assert.equal(f.pending(),before);assert.equal(f.api.recoveryState().busy,false);assert.equal(f.applied.length,0);
   const count=f.lookups().length;f.show();f.pageshow();await drain();assert.equal(f.lookups().length,count,'Returning to the page must not submit a recovery read automatically');
  }
 });
 test(`${game}: a deadline aborts the lookup and a late success cannot clear pending`,async()=>{
  const f=fixture({game}),before=f.pending();f.hold();const pending=f.api.recover();await drain();f.expire();assert.equal((await pending).status,'unknown');assert.equal(f.lookups()[0].signal.aborted,true);assert.equal(f.pending(),before);f.release();await drain();assert.equal(f.pending(),before);assert.equal(f.api.recoveryState().busy,false);
 });
 test(`${game}: offline, signed-out and unreadable storage never start the lookup`,async()=>{
  const offline=fixture({game});offline.ctx.navigator.onLine=false;assert.equal((await offline.api.recover()).status,'offline');assert.equal(offline.lookups().length,0);
  const auth=fixture({game});auth.owner(null);await drain();assert.equal((await auth.api.recover()).status,'auth');assert.equal(auth.lookups().length,0);
  const broken=fixture({game}),before=broken.pending();broken.failStorage('read');assert.ok(['unavailable','unknown'].includes((await broken.api.recover()).status));assert.equal(broken.lookups().length,0);broken.failStorage('');assert.equal(broken.pending(),before);
 });
 test(`${game}: failure to remove durable pending retains the same operation and exposes pending state`,async()=>{
  const f=fixture({game}),before=f.pending();f.failStorage('remove');await f.api.recover();assert.equal(f.pending(),before);assert.ok(f.api.recoveryState().pending);
 });
 test(`${game}: cancellation releases the read promptly even when fetch ignores abort`,async()=>{
  const f=fixture({game}),before=f.pending();f.hold();const pending=f.api.recover();let settled=null;pending.then(result=>{settled=result});await drain();f.api.cancelRecovery();await drain();
  assert.ok(settled,'Cancellation should settle without a response from fetch');assert.equal(settled.status,'cancelled');assert.equal(f.lookups()[0].signal.aborted,true);assert.equal(f.pending(),before);f.release();await drain();assert.equal(f.pending(),before);
 });
 test(`${game}: a hidden page declines a manual check without initiating network work`,async()=>{
  const f=fixture({game}),before=f.pending();f.hide();assert.equal((await f.api.recover()).status,'cancelled');assert.equal(f.lookups().length,0);assert.equal(f.pending(),before);
 });
}

test('blackjack without a saved action refreshes the current hand through the existing state GET',async()=>{
 const f=fixture({game:'blackjack',pending:false});f.setView(active(),8);assert.equal((await f.api.recover()).status,'updated');assert.equal(f.lookups().length,0);assert.equal(f.requests.filter(request=>request.url==='/api/blackjack/state').length,1);assert.equal(f.api.state.active,true);assert.equal(f.api.state.serverVersion,8);
});
test('roulette with no saved spin reports idle without creating an operation or contacting the server',async()=>{
 const f=fixture({game:'roulette',pending:false});assert.equal((await f.api.recover()).status,'idle');assert.equal(f.requests.length,0);assert.equal(f.pending(),undefined);
});
test('a blackjack snapshot can update the table while the exact action outcome remains unknown',async()=>{
 const f=fixture({game:'blackjack'}),before=f.pending(),data=envelope('blackjack');data.status='unknown';delete data.result;f.setData(data);assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);assert.equal(f.api.state.active,true);assert.equal(f.api.state.serverVersion,8);
});
test('an old blackjack recovery snapshot never rolls back a newer confirmed table view',async()=>{
 const f=fixture({game:'blackjack',pending:false});f.setView(active(),20);await f.api.recover();f.put(intent('blackjack'));f.setData(envelope('blackjack'));await f.api.recover();assert.equal(f.api.state.serverVersion,20);assert.equal(f.api.state.active,true);
});
test('roulette confirmed receipt renders the original outcome but only fresh account reads update balance',async()=>{
 const f=fixture({game:'roulette'}),data=envelope('roulette');data.result.balanceAfter=1234;f.setData(data);assert.equal((await f.api.recover()).status,'confirmed');assert.equal(f.ctx.rouletteState.lastNumber,2);assert.equal(f.ctx.rouletteState.phase,'settled');assert.equal(f.ctx.rouletteState.ballAngle,2.25);assert.equal(f.ctx.rouletteState.ballRadius,42);assert.match(f.node('rouletteMessage').textContent,/2/);assert.equal(f.applied.length,0);assert.ok(f.accountReads.length>=1);
});

test('roulette rejects an internally contradictory win even when payout arithmetic is valid',async()=>{
 const f=fixture({game:'roulette'}),before=f.pending(),data=envelope('roulette');
 data.result.won=true;data.result.payout=100;data.result.profit=50;f.setData(data);
 assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);
});
test('blackjack never confirms a receipt with a snapshot older than that action',async()=>{
 const f=fixture({game:'blackjack'}),before=f.pending(),data=envelope('blackjack');data.snapshot.version=7;f.setData(data);
 assert.equal((await f.api.recover()).status,'unknown');assert.equal(f.pending(),before);
});
