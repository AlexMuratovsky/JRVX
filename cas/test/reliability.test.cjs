const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const casino=fs.readFileSync(path.join(root,'public/assets/js-v326/casino.js'),'utf8');
const progress=fs.readFileSync(path.join(root,'public/modules/profile/runtime/progression-v322.js'),'utf8');
const drain=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({storageFails=false,fetchMode='ok'}={}){
 const records=new Map(),nodes=new Map(),listeners=new Map(),timers=new Map(),requests=[],animations=[];
 let serial=0,timerId=0;
 const makeNode=()=>({value:'50',textContent:'',innerHTML:'',disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}});
 const ctx={console,Number,JSON,Error,Map,Set,Promise,AbortController,owner:'A',rouletteType:'red',rouletteExact:null,rouletteBusy:false,rouletteHistory:[],rouletteState:{},R_ORDER:[0,1,2,3],
  sessionStorage:{getItem:k=>{if(storageFails)throw Error('SecurityError');return records.get(k)??null},setItem:(k,v)=>{if(storageFails)throw Error('QuotaExceededError');records.set(k,v)},removeItem:k=>records.delete(k)},
  localStorage:{getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)},
  setTimeout:(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
  document:{readyState:'loading',getElementById:id=>{if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id)},querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)}},
  rouletteColor:()=> 'red',rouletteAnimate:(fn,index,current)=>animations.push({fn,index,current}),rouletteRenderHistory(){},rouletteUpdatePreview(){},rouletteDraw(){},casinoRefresh(){},
  fetch:async(url,options={})=>{requests.push({url,body:options.body?JSON.parse(options.body):null,signal:options.signal});
   if(url==='/api/blackjack/state')return {ok:true,json:async()=>({ok:true,state:{hands:[],dealer:[],active:false,hand:0},version:1})};
   if(ctx.fetchMode==='hang')return new Promise(()=>{});
   if(ctx.fetchMode==='error')throw Error('connection_lost');
   if(ctx.fetchMode==='400')return {ok:false,status:400,json:async()=>({ok:false,error:'insufficient_balance'})};
   return {ok:true,json:async()=>url.includes('roulette')?({ok:true,result:{number:2,balanceAfter:100,won:true,profit:50}}):({ok:true,result:{state:{hands:[],dealer:[],active:false,hand:0},version:2,actionVersion:2,currency:'MS'}})};
  },fetchMode};
 ctx.window={crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`},JRVXCASIdentityV300:{state:()=>({authenticated:!!ctx.owner,requiresAuthentication:true,mode:'production',user:ctx.owner?{id:ctx.owner}:null})},JRVXCASServerAccount:{apply:()=>true,refresh:async()=>({ok:true}),history:async()=>[]}};
 vm.createContext(ctx);vm.runInContext(casino,ctx);
 Object.assign(ctx.window.JRVXCASV220.blackjack.state,{serverOwner:'A',serverVersion:1});
 return {ctx,records,nodes,requests,animations,timers,bindRoulette(){listeners.get('DOMContentLoaded').find(fn=>fn.name==='bindV242Roulette')()},spin:()=>ctx.window.JRVXCASV220.roulette.spin(),deal:()=>ctx.window.JRVXCASV220.blackjack.deal(),identity(owner){ctx.owner=owner;for(const fn of listeners.get('jrvx-cas-identity')||[])fn()},async timeout(){for(const [id,t] of [...timers])if(t.ms===12000){timers.delete(id);t.fn()}await drain()}};
}

test('roulette repeat restores vertical splits, including bets saved before orientation was persisted',async()=>{
 const f=fixture();f.bindRoulette();const api=f.ctx.window.JRVXCASV220.roulette;
 api.state.mode='split';api.state.splitAxis='vertical';api.set({type:'split',numbers:[4,7],label:'Split 4 / 7',mult:18});
 await f.spin();f.animations[0].fn();
 assert.equal(JSON.parse(f.records.get('jrvxCasRouletteLastBetV220:A')).splitAxis,'vertical');
 api.state.mode='straight';api.state.splitAxis='horizontal';f.nodes.get('r22Repeat').onclick();
 assert.equal(api.state.mode,'split');assert.equal(api.state.splitAxis,'vertical');
 assert.deepEqual([...api.numbersFor('split',4)],[4,7],'The next number uses the direction shown for the restored bet');
 f.records.set('jrvxCasRouletteLastBetV220:A',JSON.stringify({amount:50,type:'split',numbers:[10,13],label:'Split 10 / 13',mult:18}));
 api.state.last=null;api.state.splitAxis='horizontal';f.nodes.get('r22Repeat').onclick();
 assert.equal(api.state.splitAxis,'vertical','Existing saved pairs recover their direction from the two numbers');
});

test('confirmed roulette spins still display when optional account sync throws or rejects',async()=>{
 const f=fixture();f.ctx.window.JRVXCASServerAccount.apply=()=>{throw Error('wallet_render_failed')};
 f.ctx.window.JRVXCASServerAccount.refresh=()=>Promise.reject(Error('offline'));
 await f.spin();assert.equal(f.animations.length,1,'Wallet presentation must not turn a confirmed result into a failed wager');
 f.animations[0].fn();await drain();
 assert.match(f.nodes.get('rouletteMessage').textContent,/Победа!/);
 assert.equal(f.records.has('jrvxRoulettePendingV302:A'),false);assert.equal(f.ctx.rouletteBusy,false);
 assert.equal(f.requests.length,1);
});

test('a failed roulette renderer releases the controls and keeps the confirmed outcome',async()=>{
 const f=fixture();f.ctx.rouletteAnimate=()=>{throw Error('canvas_unavailable')};
 f.ctx.rouletteDraw=()=>{throw Error('canvas_unavailable')};
 await f.spin();
 assert.match(f.nodes.get('rouletteMessage').textContent,/Победа!/);
 assert.deepEqual([...f.ctx.rouletteHistory],[2]);assert.equal(f.ctx.rouletteState.lastNumber,2);
 assert.equal(f.ctx.rouletteBusy,false);assert.equal(f.nodes.get('rouletteSpin').disabled,false);
 assert.equal(f.records.has('jrvxRoulettePendingV302:A'),false);assert.equal(f.requests.length,1);
});
test('roulette retains one operation ID and the original selection after uncertain network failure',async()=>{
 const f=fixture({fetchMode:'error'});await f.spin();const first=f.requests[0].body;
 f.nodes.get('rouletteBetInput').value='300';await f.spin();
 assert.equal(f.requests.length,2);assert.equal(f.requests[1].body.spinId,first.spinId);assert.equal(f.requests[1].body.amount,50);assert.equal(f.ctx.rouletteBusy,false);
});
test('roulette sends no mutation when pending action cannot be stored',async()=>{
 const f=fixture({storageFails:true});await f.spin();await f.spin();assert.equal(f.requests.length,0);assert.match(f.nodes.get('rouletteMessage').textContent,/сохранить запрос/);assert.equal(f.ctx.rouletteBusy,false);
});
test('roulette timeout aborts the request, releases controls and preserves the operation',async()=>{
 const f=fixture({fetchMode:'hang'}),work=f.spin();await drain();assert.equal(f.ctx.rouletteBusy,true);await f.timeout();await work;
 assert.equal(f.requests[0].signal.aborted,true);assert.equal(f.ctx.rouletteBusy,false);assert.equal(f.nodes.get('rouletteSpin').disabled,false);assert.ok(f.records.has('jrvxRoulettePendingV302:A'));
});
test('roulette does not wait for an unrelated account refresh before showing confirmed animation',async()=>{
 const f=fixture();f.ctx.window.JRVXCASServerAccount.refresh=()=>new Promise(()=>{});await f.spin();assert.equal(f.animations.length,1);assert.equal(f.animations[0].index,2);f.animations[0].fn();assert.deepEqual([...f.ctx.rouletteHistory],[2]);
});
test('old roulette result and animation cannot enter another account or a later login',async()=>{
 const f=fixture();await f.spin();const old=f.animations[0];f.identity('B');await drain();assert.equal(old.current(),false);old.fn();assert.deepEqual([...f.ctx.rouletteHistory],[]);assert.equal(f.ctx.rouletteBusy,false);
 f.identity('A');await drain();assert.equal(old.current(),false);old.fn();assert.deepEqual([...f.ctx.rouletteHistory],[]);
});
test('blackjack clears rejected pending actions so a corrected action can be submitted',async()=>{
 const f=fixture({fetchMode:'400'});await f.deal();assert.equal(f.records.has('jrvxBlackjackPendingV302:A'),false);
 const first=f.requests.find(r=>r.url==='/api/blackjack/action').body.actionId;f.ctx.fetchMode='ok';await f.deal();const actions=f.requests.filter(r=>r.url==='/api/blackjack/action');assert.equal(actions.length,2);assert.notEqual(actions[1].body.actionId,first);
});
test('blackjack preserves an uncertain action ID and blocks non-durable new mutations',async()=>{
 const f=fixture({fetchMode:'error'});await f.deal();await f.deal();assert.equal(f.requests[0].body.actionId,f.requests[1].body.actionId);
 const blocked=fixture({storageFails:true});await blocked.deal();assert.equal(blocked.requests.length,0);assert.match(blocked.nodes.get('bjMessage').textContent,/сохранить запрос/);
});
test('blackjack request timeout re-enables controls and keeps the same retry action',async()=>{
 const f=fixture({fetchMode:'hang'}),work=f.deal();await drain();await f.timeout();await work;assert.equal(f.nodes.get('bjDeal').disabled,false);assert.ok(f.records.has('jrvxBlackjackPendingV302:A'));
});
test('blackjack tells the player when an accepted action could not refresh their balance',async()=>{
 const f=fixture();f.ctx.window.JRVXCASServerAccount.refresh=async()=>null;await f.deal();assert.match(f.nodes.get('bjMessage').textContent,/Действие подтверждено.*баланс/);
});
function progressFixture(){
 const records=new Map(),timers=[],sent=[];let accepted=false,owner='A',connected=true;
 const ctx={window:{arcadeNetState:{get connected(){return connected}},arcadeNetSend:event=>{sent.push(event);return accepted},JRVXCASIdentityV300:{state:()=>({requiresAuthentication:true,authenticated:true,user:{id:owner}})}},document:{readyState:'loading',addEventListener(){}},localStorage:{getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)},setTimeout:fn=>{timers.push(fn);return timers.length},clearTimeout(){},Date,Math,JSON,Set,String,Number};
 vm.createContext(ctx);vm.runInContext(progress,ctx);
 return {ctx,records,timers,sent,setAccepted(value){accepted=value},setOwner(value){owner=value},setConnected(value){connected=value}};
}
test('queued progression survives a rejected send and is removed only after acceptance',()=>{
 const f=progressFixture(),key='jrvxCasProgressQueueV301:A';f.ctx.window.JRVXProgress.event('blackjack_hand',{});const queued=JSON.parse(f.records.get(key));assert.equal(queued.length,1);
 f.setAccepted(true);f.timers.shift()();assert.equal(JSON.parse(f.records.get(key)).length,0);assert.equal(f.sent.at(-1).eventId,queued[0].eventId);
});
test('progress queue does not send another owner\'s saved event after account change',()=>{
 const f=progressFixture();f.ctx.window.JRVXProgress.event('blackjack_hand',{});const before=f.sent.length;f.setOwner('B');f.setAccepted(true);f.timers.shift()();assert.equal(f.sent.length,before);assert.equal(JSON.parse(f.records.get('jrvxCasProgressQueueV301:A')).length,1);
});
test('roulette renderer stops before touching a stale account\'s animation frame',()=>{
 const source=fs.readFileSync(path.join(root,'public/assets/js-v326/cas-bootstrap.js'),'utf8');
 const start=source.indexOf('function rouletteAnimate('),end=source.indexOf('\nfunction rouletteSpin(',start);assert.ok(start>=0&&end>start);
 const frames=[],ctx={window:{},rouletteBuildSpinPlan:()=>({duration:1}),rouletteState:{},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn)};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 let active=true,done=false;ctx.rouletteAnimate(()=>{done=true},2,()=>active);active=false;frames.shift()(200);assert.equal(done,false);assert.equal(frames.length,0);assert.equal(ctx.rouletteState.wheelAngle,undefined);
});
test('disabling animations shortens the wheel transition while preserving the verified pocket',()=>{
 const source=fs.readFileSync(path.join(root,'public/assets/js-v326/cas-bootstrap.js'),'utf8');
 const start=source.indexOf('function rouletteAnimate('),end=source.indexOf('\nfunction rouletteSpin(',start),frames=[],message={textContent:''};let sampled=0,target=null,result=null;
 const ctx={window:{JRVXExperience:{settings:{animations:false}}},rouletteBuildSpinPlan:chosen=>{target=chosen;return {duration:13.2}},rouletteSampleSpinPlan:(plan,p)=>{sampled=p;return {wheelAngle:0,ballAngle:2,ballRadius:1,phase:'settled',highlightIndex:2}},roulettePocketIndexAtAngle:()=>2,rouletteState:{},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn),document:{visibilityState:'visible',getElementById:id=>id==='rouletteMessage'?message:{classList:{contains:()=>true}}},rouletteDraw(){}};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.rouletteAnimate(pocket=>{result=pocket},2,()=>true);frames.shift()(250);assert.equal(sampled,1);assert.equal(target,2);assert.equal(result,2);assert.equal(frames.length,0);
});
test('a roulette canvas frame failure cannot interrupt the verified timeline or lock the action',()=>{
 const source=fs.readFileSync(path.join(root,'public/assets/js-v326/cas-bootstrap.js'),'utf8');
 const start=source.indexOf('function rouletteAnimate('),end=source.indexOf('\nfunction rouletteSpin(',start),frames=[],completed=[],samples=[],message={textContent:''};let drawings=0;
 const ctx={window:{},rouletteBuildSpinPlan:()=>({duration:1}),rouletteSampleSpinPlan:(plan,p)=>{samples.push(p);return {wheelAngle:0,ballAngle:2,ballRadius:1,phase:p<1?'rail':'settled',highlightIndex:p<1?-1:2}},roulettePocketIndexAtAngle:()=>2,rouletteState:{},performance:{now:()=>0},requestAnimationFrame:fn=>frames.push(fn),document:{visibilityState:'visible',getElementById:id=>id==='rouletteMessage'?message:{classList:{contains:()=>true}}},rouletteDraw(){drawings++;throw Error('canvas_context_lost')}};
 vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.rouletteAnimate(pocket=>completed.push(pocket),2,()=>true);
 assert.doesNotThrow(()=>frames.shift()(250));assert.equal(frames.length,1,'A failed draw still schedules the next verified sample');
 assert.doesNotThrow(()=>frames.shift()(1000));
 assert.deepEqual(samples,[.25,1]);assert.deepEqual(completed,[2]);assert.equal(drawings,2);assert.equal(frames.length,0);
 assert.equal(ctx.rouletteState.highlightIndex,2);
});
test('every roulette animation lands in its verified server pocket across different starting angles',()=>{
 const source=fs.readFileSync(path.join(root,'public/assets/js-v326/cas-bootstrap.js'),'utf8');
 const constants=source.slice(source.indexOf('const R_RED='),source.indexOf('let rouletteBet='));
 const angles=source.slice(source.indexOf('function norm('),source.indexOf('function rouletteCurrentBet('));
 const geometry=source.slice(source.indexOf('function rouletteGeometry('),source.indexOf('function rouletteDrawCircularBrand('));
 const plans=source.slice(source.indexOf('function rouletteWheelEase('),source.indexOf('function rouletteAnimate('));
 const ctx={Math,Number,rouletteSpinDuration:7600,rouletteCanvasEl:{width:640,height:640},rouletteState:{wheelAngle:0,ballAngle:0}};vm.createContext(ctx);vm.runInContext(constants+angles+geometry+plans,ctx);
 for(let pocket=0;pocket<37;pocket++)for(const angle of [-30,-1,0,1,45]){ctx.rouletteState.wheelAngle=angle;ctx.rouletteState.ballAngle=angle+.63;const plan=ctx.rouletteBuildSpinPlan(pocket),sample=ctx.rouletteSampleSpinPlan(plan,1);assert.equal(ctx.roulettePocketIndexAtAngle(sample.ballAngle,sample.wheelAngle),pocket);assert.ok(Number.isFinite(sample.ballRadius));assert.equal(sample.highlightIndex,pocket);}
});
test('blackjack card redraws keep existing cards still and animate only a new card or dealer reveal',()=>{
 const source=fs.readFileSync(path.join(root,'public/modules/ui/runtime/experience-v322.js'),'utf8'),start=source.indexOf('function animateCards('),end=source.indexOf('function routeName()',start);
 const makeCard=(face,back=false)=>{const classes=new Set(back?['back']:[]);return{textContent:face,dataset:{},style:{setProperty(){}},classList:{contains:x=>classes.has(x),add:x=>classes.add(x),remove:(...xs)=>xs.forEach(x=>classes.delete(x))}}};
 const game={classList:{contains:x=>x==='active'}},surfaces=[{id:'playerCards',cards:[makeCard('A♠'),makeCard('5♥')]},{id:'dealerCards',cards:[makeCard('8♣'),makeCard('hidden',true)]}];
 for(const surface of surfaces)surface.closest=()=>game;
 let sounds=0;const ctx={document:{hidden:false},window:{JRVXCASV220:{blackjack:{state:{roundId:1,hand:0}}}},settings:{animations:true},cardMemory:new Map(),qa:(selector,r)=>r?.cards||surfaces,$:()=>null,setTimeout(){},play:()=>sounds++};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 ctx.animateCards();assert.equal(sounds,4);
 surfaces[0].cards=[makeCard('A♠'),makeCard('5♥')];surfaces[1].cards=[makeCard('8♣'),makeCard('hidden',true)];ctx.animateCards();assert.equal(sounds,4);assert.equal(surfaces[0].cards.some(c=>c.classList.contains('v280CardIn')),false);
 surfaces[0].cards.push(makeCard('4♥'));ctx.animateCards();assert.equal(sounds,5);assert.equal(surfaces[0].cards[2].classList.contains('v280CardIn'),true);
 surfaces[1].cards=[makeCard('8♣'),makeCard('K♥')];ctx.animateCards();assert.equal(sounds,6);assert.equal(surfaces[1].cards[1].classList.contains('jrvxCardReveal'),true);assert.equal(surfaces[0].cards[2].classList.contains('v280CardIn'),true,'An existing animation is not interrupted by another surface');
 ctx.settings.animations=false;ctx.animateCards();assert.equal(surfaces[0].cards[2].classList.contains('v280CardIn'),false);
});
test('poker keeps unchanged cards still but deals again for a new hand even with the same card values',()=>{
 const source=fs.readFileSync(path.join(root,'public/modules/ui/runtime/experience-v322.js'),'utf8'),start=source.indexOf('function animateCards('),end=source.indexOf('function routeName()',start),game={classList:{contains:x=>x==='active'}};
 const card=()=>({textContent:'A♠',dataset:{},style:{setProperty(){}},classList:{contains:()=>false,add(){},remove(){}}}),surface={id:'p59HeroCards',cards:[card(),card()],closest:selector=>selector==='#blackjack'?null:game};let sounds=0;
 const ctx={document:{hidden:false},window:{Poker59:{state:{server:{handNo:5}}}},settings:{animations:true},cardMemory:new Map(),qa:(selector,r)=>r?.cards||[surface],$:()=>null,setTimeout(){},play:()=>sounds++};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
 ctx.animateCards();assert.equal(sounds,2);surface.cards=[card(),card()];ctx.animateCards();assert.equal(sounds,2);ctx.window.Poker59.state.server.handNo=6;ctx.animateCards();assert.equal(sounds,4);
});
