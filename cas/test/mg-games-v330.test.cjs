const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_MG_ONLINE_SOURCE || path.join(__dirname, '../public/modules/network/runtime/online-v330.js'), 'utf8');
const join = () => ({ type: 'poker_join', mode: 'online', tableId: '2-4', buyIn: 40 });
const tableState = (revision = 5, roomId = 'room-current') => ({
  authoritative: true, roomId, tableId: '1-2', currency: 'MG', mode: 'online', handNo: 3, revision,
  you: { id: 'player-A' }, seats: []
});

function fixture({ accepted = true, throwSend = false } = {}) {
  const nodes = new Map(), listeners = new Map(), sent = [], delivered = [];
  let clock = 100000, sendAccepted = accepted, sendThrows = throwSend, owner = 'player-A';
  function node(id) {
    if (!nodes.has(id)) { const classes=new Set(id==='poker'?['active']:[]); nodes.set(id, {
      id, textContent: '', innerHTML: '', hidden: false, dataset: {}, offsetParent: null,
      classList: { add(...names) {names.forEach(name=>classes.add(name));}, remove(...names) {names.forEach(name=>classes.delete(name));}, contains(name) {return classes.has(name);} },
      querySelectorAll() { return []; }, setAttribute() {}, addEventListener() {}
    }); }
    return nodes.get(id);
  }
  const current = tableState(4), state = { server: current, game: null };
  const ctx = {
    console, Date: class extends Date { static now() { return clock; } },
    setTimeout() { return 1; }, setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame() {},
    fetch() { throw new Error('Online recovery tests must never make network requests'); },
    document: {
      readyState: 'loading', getElementById: node, querySelector() { return null; }, querySelectorAll() { return []; },
      addEventListener(type, fn) { listeners.set(type, fn); }
    }
  };
  ctx.window = {
    JRVXCASMoneyV330: require('../public/modules/core/runtime/money-v330.js'),
    arcadeNetState: { connected: true, poker: current }, Poker59: { state },
    JRVXCASIdentityV300: { state: () => ({requiresAuthentication:true,authenticated:!!owner,user:owner?{id:owner}:null}) },
    JRVXCasEconomy: { get: () => ({ currency: 'MG' }), setCurrency() {} },
    arcadeNetSend(command) {
      sent.push(command); if (sendThrows) throw new Error('mock transport rejected'); return sendAccepted;
    },
    handleArcadeNetMessage(message) {
      delivered.push(message);
      if (message.type === 'poker_state') { ctx.window.arcadeNetState.poker = message.state; state.server = message.state; }
      return 'delivered';
    }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); listeners.get('DOMContentLoaded')();
  return {
    send: command => ctx.window.arcadeNetSend(command), receive: message => ctx.window.handleArcadeNetMessage(message),
    api: ctx.window.JRVXCASV250, state, sent, delivered,
    setOwner(value) { owner=value; listeners.get('jrvx-cas-identity')?.({type:'jrvx-cas-identity'}); },
    setAccepted(value) { sendAccepted = value; }, setThrow(value) { sendThrows=value; },
    node, net: ctx.window.arcadeNetState, advance(ms) { clock += ms; }
  };
}




// These exercise the active wrapper and realistic transport/server messages.
// They never send network requests, mutate real wallets, or simulate game rules.

test('acknowledging a join retires only that exact completed intent', () => {
 const f=fixture();f.send(join());const id=f.sent.at(-1).opId;
 assert.equal(f.api.diagnostics().pendingOps.length,1);
 f.receive({type:'poker_state',requestId:id,state:tableState(5,'room-one')});
 assert.equal(f.api.diagnostics().pendingOps.length,0);
 assert.equal(f.api.diagnostics().pendingJoin,null);
});

test('completed join, leave and same-table join starts a fresh seating operation', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.receive({type:'poker_state',requestId:first,state:tableState(5,'room-one')});
 f.send({type:'poker_leave'});const leave=f.sent.at(-1).opId;
 f.receive({type:'poker_state',requestId:leave,state:null});
 f.advance(1000);f.send(join());
 assert.notEqual(f.sent.at(-1).opId,first,'new seating must not replay the completed backend buy-in receipt');
});

test('an explicit leave ends even an unacknowledged join lifecycle', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.send({type:'poker_leave'});f.advance(1000);f.send(join());
 assert.notEqual(f.sent.at(-1).opId,first);
});

test('retries of a join with an uncertain outcome preserve its operation ID', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.advance(1000);f.receive({type:'poker_error',requestId:first,message:'server_error'});f.send(join());
 assert.equal(f.sent.at(-1).opId,first);assert.equal(f.api.diagnostics().pendingJoin.opId,first);
});

test('a definitive join rejection allows a fresh retry, including legacy errors without correlation', () => {
 for(const correlated of [true,false]){
  const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
  f.receive({type:'poker_error',message:'table_full',...(correlated?{requestId:first}:{})});
  assert.equal(f.api.diagnostics().pendingJoin,null);f.advance(1000);f.send(join());
  assert.notEqual(f.sent.at(-1).opId,first);
 }
});

test('an error for another request preserves the accepted join and its retry ID', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.receive({type:'poker_error',requestId:'another-operation',message:'invalid_action'});f.send(join());
 assert.equal(f.sent.at(-1).opId,first);assert.equal(f.api.diagnostics().pendingJoin.opId,first);
});

test('rejected and throwing leave sends cannot hide the current seated state or fence its updates', () => {
 for(const throwing of [false,true]){
  const f=fixture({accepted:!throwing});f.setAccepted(false);f.setThrow(throwing);
  if(throwing)assert.throws(()=>f.send({type:'poker_leave'}),/mock transport rejected/);
  else assert.equal(f.send({type:'poker_leave'}),false);
  assert.equal(f.net.poker.roomId,'room-current');
  f.receive({type:'poker_state',state:tableState(5)});assert.equal(f.state.server.revision,5);
 }
});

test('a rejected join cannot cancel an earlier accepted leave fence', () => {
 const f=fixture();f.send({type:'poker_leave'});f.setAccepted(false);f.send(join());
 f.receive({type:'poker_state',state:tableState(5)});
 assert.equal(f.net.poker,null);assert.equal(f.delivered.length,0);
});

test('a same-owner identity refresh retains the pending join and accepted leave fence', () => {
 const joiner=fixture();joiner.send(join());const id=joiner.sent.at(-1).opId;joiner.setOwner('player-A');joiner.send(join());
 assert.equal(joiner.sent.at(-1).opId,id);
 const leaver=fixture();leaver.send({type:'poker_leave'});leaver.setOwner('player-A');leaver.receive({type:'poker_state',state:tableState(5)});
 assert.equal(leaver.net.poker,null);assert.equal(leaver.delivered.length,0);
});

test('an account change clears the old leave fence and resumes the new account seat', () => {
 const f=fixture();f.send({type:'poker_leave'});f.receive({type:'poker_state',state:null});f.setOwner('player-B');
 f.receive({type:'poker_state',state:{...tableState(6),you:{id:'player-B'}}});
 assert.equal(f.state.server.you.id,'player-B');
});

test('old-account seated snapshots are ignored before any revision or UI mutation', () => {
 const f=fixture();f.setOwner('player-B');
 f.receive({type:'poker_state',state:{...tableState(6),you:{id:'player-B'}}});
 const count=f.delivered.length;const revisions=JSON.stringify(f.api.diagnostics().lastRevision);
 assert.equal(f.receive({type:'poker_state',state:tableState(999)}),false);
 assert.equal(f.state.server.you.id,'player-B');assert.equal(f.delivered.length,count);
 assert.equal(JSON.stringify(f.api.diagnostics().lastRevision),revisions);
});

test('an account change removes old pending joins and does not send them as the new account', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;const count=f.sent.length;
 f.setOwner('player-B');assert.equal(f.api.diagnostics().pendingJoin,null);assert.equal(f.api.diagnostics().pendingOps.length,0);
 assert.equal(f.sent.length,count);f.send(join());assert.notEqual(f.sent.at(-1).opId,first);
 f.setOwner('player-A');f.send(join());assert.notEqual(f.sent.at(-1).opId,first);
});

test('an equal-revision room broadcast cannot settle an unacknowledged action', () => {
 const f=fixture();f.send({type:'poker_action',action:'call'});const id=f.sent.at(-1).actionId;
 f.receive({type:'poker_state',state:tableState(4)});f.send({type:'poker_action',action:'call'});
 assert.equal(f.sent.at(-1).actionId,id);
 f.receive({type:'poker_state',requestId:id,state:tableState(5)});
 assert.equal(f.api.diagnostics().pendingOps.length,0);
});

test('an advancing authoritative revision settles preceding actions in that exact room', () => {
 const f=fixture();f.send({type:'poker_action',action:'call'});
 f.receive({type:'poker_state',state:tableState(5)});assert.equal(f.api.diagnostics().pendingOps.length,0);
});


test('changing owner closes old spectator and invite UI without sending an old-owner unwatch', () => {
 const f=fixture();f.api.watchRoom('room-one');
 f.receive({type:'spectator_state',state:{...tableState(5,'room-one'),you:null}});
 f.receive({type:'poker_invite',fromNickname:'A friend',roomId:'room-invited',tableId:'1-2',currency:'MG'});
 assert.equal(f.node('v250Spectator').classList.contains('active'),true);assert.equal(f.node('v250Invite').hidden,false);
 const count=f.sent.length;f.setOwner('player-B');
 assert.equal(f.node('v250Spectator').classList.contains('active'),false);assert.equal(f.node('v250Invite').hidden,true);
 assert.equal(f.sent.length,count,'identity reset must not run an unsubscribe against the new owner session');
 f.receive({type:'spectator_state',state:{...tableState(999,'room-one'),you:null}});
 assert.equal(f.node('v250Spectator').classList.contains('active'),false);
});

const Money = require('../public/modules/core/runtime/money-v330.js');
const Core = require('../public/modules/poker/runtime/poker-core-v330.js');
const casinoSource = fs.readFileSync(process.env.JRVX_MG_CASINO_SOURCE || path.join(__dirname, '../public/assets/js-v330/casino.js'), 'utf8');
const OWNER = 'JRVX-ABCD12345678';
const idleMG = () => ({ hands: [], dealer: [], active: false, hand: 0, hideDealer: true, currency: 'MG' });
const cardMG = r => ({ r, s: '♠' });
function casinoFixture({balance=1000000,retired=true}={}) {
 const nodes=new Map(),records=new Map(),listeners=new Map(),requests=[],applied=[],histories=[];
 let serial=0,fail=false,currency='MG',result={state:{...idleMG(),active:true,hands:[{cards:[cardMG('8'),cardMG('9')],bet:50,done:false}],dealer:[cardMG('10'),cardMG('7')]},version:8,actionVersion:8,currency:'MG',roundId:1};
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'50',textContent:'',innerHTML:'',title:'',disabled:false,dataset:{},style:{},classList:{contains:()=>false,add(){},remove(){},toggle(){}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},setAttribute(name,value){this[name]=value}});return nodes.get(id)}
 const account=()=>({ok:true,account:{id:OWNER},wallet:{MG:balance},walletRevision:{MG:2},...(retired?{economy:{version:'mg-v330',currency:'MG',retiredCurrencies:['MS']}}:{})});
 const ctx={console,AbortController,navigator:{},setTimeout(){return 1},clearTimeout(){},
  document:{readyState:'loading',getElementById:node,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn)}},
  sessionStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)},
  localStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)},
  rouletteBusy:false,rouletteState:{},rouletteHistory:[],R_ORDER:Array.from({length:37},(_,i)=>i),
  rouletteAnimate(reveal){reveal()},rouletteUpdatePreview(){},rouletteRenderHistory(){},rouletteDraw(){},casinoRefresh(){},
  muraTokenBalance:()=>balance,casinoTakeBet(){assert.fail('Production cannot mutate a local wallet')},casinoReturn(){assert.fail('Production cannot credit a local wallet')},
  fetch:async(url,options={})=>{
   const body=options.body?JSON.parse(options.body):null;requests.push({url,body});
   if(url==='/api/blackjack/state')return{ok:true,json:async()=>({ok:true,state:idleMG(),version:7})};
   if(url==='/api/me')return{ok:true,json:async()=>account()};
   if(fail)throw Error('connection_lost');
   if(url==='/api/blackjack/action')return{ok:true,json:async()=>({ok:true,result})};
   if(url==='/api/roulette/spin')return{ok:true,json:async()=>({ok:true,result:{currency:'MG',number:1,balanceAfter:balance,won:false,profit:-body.amount}})};
   assert.fail('Unexpected request '+url);
  }};
 ctx.window={JRVXCASMoneyV330:Money,crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`},
  JRVXCASIdentityV300:{state:()=>({mode:'production',requiresAuthentication:true,authenticated:true,user:{id:OWNER}})},
  JRVXCasEconomy:{get:()=>({currency,mg:balance}),balance:()=>balance,setCurrency(value){currency=value}},
  JRVXCASServerAccount:{refresh:async()=>account(),apply:data=>applied.push(data),history:async game=>{histories.push(game);return[]}}};
 vm.createContext(ctx);vm.runInContext(casinoSource,ctx);
 return {api:ctx.window.JRVXCASV220,shared:ctx.window.JRVXCASV220Shared,node,records,requests,applied,histories,
  setResult(value){result=value},fail(value){fail=value},mutations:()=>requests.filter(r=>r.body),boot(){for(const fn of listeners.get('DOMContentLoaded')||[])if(fn.name==='bindV242Blackjack')fn()}};
}

test('v330 blackjack sends the exact integer amount in MG despite compact display',async()=>{
 const f=casinoFixture();f.node('bjBetInput').value='500000';await f.api.blackjack.deal();
 assert.equal(f.mutations().length,1);assert.equal(f.mutations()[0].body.currency,'MG');assert.equal(f.mutations()[0].body.bet,500000);
 assert.equal(f.node('blackjackBalance').textContent,'1M MG');assert.equal(f.node('blackjackBalance').title,'1\u00a0000\u00a0000 MG');
});

test('v330 blackjack rejects fractional, unsafe, over-limit and unaffordable bets before POST',async()=>{
 for(const value of ['2.5','9007199254740993','1000002','-2','NaN']){
  const f=casinoFixture();f.node('bjBetInput').value=value;await f.api.blackjack.deal();assert.equal(f.mutations().length,0,value);
 }
 const f=casinoFixture({balance:20});f.node('bjBetInput').value='50';await f.api.blackjack.deal();assert.equal(f.mutations().length,0);assert.match(f.node('bjMessage').textContent,/Недостаточно MG/);
});

test('legacy blackjack pending requests are retired through confirmed read-only migration metadata',async()=>{
 for(const currency of ['MS',undefined]){
  const f=casinoFixture(),key='jrvxBlackjackPendingV302:'+OWNER;
  const pending={ownerId:OWNER,actionId:'legacy-operation',action:'deal',expectedVersion:7,bet:300,...(currency?{currency}:{})};
  f.records.set(key,JSON.stringify(pending));await f.api.blackjack.deal();
  assert.equal(f.mutations().length,0);assert.ok(f.requests.some(r=>r.url==='/api/me'));assert.equal(f.records.has(key),false);
  assert.deepEqual(f.histories,['blackjack']);assert.match(f.node('bjMessage').textContent,/Прежний запрос закрыт/);
 }
});

test('missing migration confirmation preserves the old pending operation without relabelling its amount',async()=>{
 const f=casinoFixture({retired:false}),key='jrvxBlackjackPendingV302:'+OWNER;
 const pending=JSON.stringify({ownerId:OWNER,actionId:'old-ms',action:'deal',currency:'MS',expectedVersion:7,bet:300});f.records.set(key,pending);
 await f.api.blackjack.deal();assert.equal(f.records.get(key),pending);assert.equal(f.mutations().length,0);assert.match(f.node('bjMessage').textContent,/Синхронизируем прежний запрос/);
});

test('an uncertain MG blackjack retry preserves its complete original request',async()=>{
 const f=casinoFixture();f.fail(true);f.node('bjBetInput').value='50000';await f.api.blackjack.deal();
 const first=f.mutations()[0].body;f.node('bjBetInput').value='300';f.fail(false);await f.api.blackjack.hit();
 assert.equal(f.mutations().length,2);assert.deepEqual(f.mutations()[1].body,first);assert.equal(first.currency,'MG');assert.equal(first.bet,50000);
});

test('an old-currency blackjack result is never accepted as an MG settlement',async()=>{
 const f=casinoFixture();f.setResult({state:{...idleMG(),currency:'MS'},version:8,currency:'MS'});await f.api.blackjack.deal();
 assert.equal(f.records.has('jrvxBlackjackPendingV302:'+OWNER),true);assert.equal(f.api.blackjack.state.serverVersion,7);
 assert.doesNotMatch(f.node('bjMessage').textContent,/завершена:.*MG/);
});

test('legacy local blackjack history remains stored but is not displayed as equal MG',()=>{
 const f=casinoFixture(),key='jrvxCasBlackjackHistoryV220:'+OWNER;
 const old=JSON.stringify([{roundId:1,unit:'MS',results:[{profit:300,outcome:'win'}]}]);f.records.set(key,old);f.boot();
 assert.equal(f.records.get(key),old);assert.doesNotMatch(f.node('blackjackSessionHistory').innerHTML,/300|MG|MS/);
});

test('roulette retires a legacy pending MS spin without issuing an altered wager',async()=>{
 const f=casinoFixture(),key='jrvxRoulettePendingV302:'+OWNER;
 const pending={ownerId:OWNER,spinId:'old-spin',currency:'MS',amount:300,bet:{type:'red',numbers:[]}};
 f.records.set(key,JSON.stringify(pending));await f.api.roulette.spin();
 assert.equal(f.mutations().length,0);assert.equal(f.records.has(key),false);assert.deepEqual(f.histories,['roulette']);
});

test('roulette sends exact MG amounts, enforces affordability and isolates last bet from old currency',async()=>{
 const f=casinoFixture();f.node('rouletteBetInput').value='500000';f.records.set('jrvxCasRouletteLastBetV220:'+OWNER,JSON.stringify({amount:900,type:'red',numbers:[],mult:2,label:'Красное'}));
 await f.api.roulette.spin();assert.equal(f.mutations().length,1);assert.equal(f.mutations()[0].body.currency,'MG');assert.equal(f.mutations()[0].body.amount,500000);
 const keys=[...f.records.keys()];assert.ok(keys.some(k=>k.startsWith('jrvxCasRouletteLastBetV330')));assert.equal(f.records.has('jrvxCasRouletteLastBetV220:'+OWNER),true);
 const poor=casinoFixture({balance:20});poor.node('rouletteBetInput').value='50';await poor.api.roulette.spin();assert.equal(poor.mutations().length,0);
});

test('online monetary commands reject retired currency and unsafe amounts rather than coercing them',()=>{
 const f=fixture();
 for(const command of [{...join(),currency:'MS'},{...join(),buyIn:1.5},{...join(),buyIn:Number.MAX_SAFE_INTEGER},{type:'poker_action',action:'bet',amount:Infinity},{type:'poker_rebuy',amount:-1}])assert.equal(f.send(command),false);
 assert.equal(f.sent.length,0);assert.equal(f.send(join()),true);assert.equal(f.sent.at(-1).currency,'MG');assert.equal(f.sent.at(-1).buyIn,40);
});

test('online rejects an old-currency or unsafe table snapshot and never reinterprets its pot',()=>{
 const f=fixture();
 for(const state of [{...tableState(),currency:'MS',pot:300},{...tableState(),pot:Number.MAX_SAFE_INTEGER+1},{...tableState(),seats:[{stack:1.5,bet:0}]}])assert.equal(f.receive({type:'poker_state',state}),false);
 assert.equal(f.delivered.length,0);assert.equal(f.state.server.revision,4);
 f.receive({type:'poker_state',state:{...tableState(),pot:1250000}});assert.equal(f.state.server.pot,1250000);
});

test('new local poker preserves large integer chips and rejects invalid buy-ins',()=>{
 for(const buyIn of [1.5,-1,Number.MAX_SAFE_INTEGER+1,1000000001])assert.throws(()=>new Core.HeadsUpGame({buyIn}),/Invalid MG buy-in/);
 const g=new Core.HeadsUpGame({buyIn:1000000000,random:()=>0.5});g.startHand();
 const total=()=>Object.values(g.players).reduce((n,p)=>n+p.stack,0)+g.pot;
 assert.equal(total(),2000000000);const before=JSON.stringify(g.state());
 assert.equal(g.act(g.turnSeat,'raise',2.5).ok,false);assert.equal(JSON.stringify(g.state()),before);
 g.act(g.turnSeat,'fold');assert.equal(total(),2000000000);assert.equal(g.state().lastResult.pot,3);
});

test('new local poker keeps deck and hand evaluation rules unchanged',()=>{
 assert.equal(new Set(Core.makeDeck(()=>0.5)).size,52);
 assert.deepEqual(Core.score5(['AS','KS','QS','JS','TS']),[8,14]);
 assert.ok(Core.compareScore(Core.score5(['AS','AH','AD','AC','2S']),Core.score5(['KS','KH','KD','2S','2H']))>0);
});

test('server account accepts only monotone MG revisions and ignores legacy wallet amounts',()=>{
 const full=fs.readFileSync(path.join(__dirname,'../public/assets/js-v330/identity-account.js'),'utf8');
 const accountSource=full.slice(full.indexOf('/* source: modules/network/runtime/server-account-v300.js */'));
 const patches=[],snapshots=[],listeners={};let value=0;
 const window={JRVXCASIdentityV300:{state:()=>({authenticated:true,user:{id:OWNER}})},JRVXCasEconomy:{set(p){patches.push(p);if(p.mg!==undefined)value=p.mg},balance:()=>value},JRVXCASWalletV330:{applySnapshot:data=>snapshots.push(data)},arcadeNetState:{}};
 vm.runInNewContext(accountSource,{window,document:{addEventListener:(name,fn)=>{listeners[name]=fn}},console,AbortController,setTimeout(){return 1},clearTimeout(){}});
 const api=window.JRVXCASServerAccount;
 api.apply({account:{id:OWNER},wallet:{MS:999999,MG:1250000},walletRevision:{MS:999,MG:8}});
 assert.equal(value,1250000);assert.ok(patches.every(p=>!Object.hasOwn(p,'ms')));assert.equal(snapshots.length,1);
 api.apply({account:{id:OWNER},wallet:{MG:5},walletRevision:{MG:7}});assert.equal(value,1250000);
 api.apply({account:{id:'other'},wallet:{MG:9000000},walletRevision:{MG:9}});assert.equal(value,1250000);
 api.apply({account:{id:OWNER},wallet:{MG:Number.MAX_SAFE_INTEGER+1},walletRevision:{MG:9}});assert.equal(value,1250000);
});

test('account ledger reads are bounded, MG-only and fenced against late owner changes',async()=>{
 const full=fs.readFileSync(path.join(__dirname,'../public/assets/js-v330/identity-account.js'),'utf8');
 const accountSource=full.slice(full.indexOf('/* source: modules/network/runtime/server-account-v300.js */'));
 const requests=[],pending=[];let owner=OWNER;
 const window={JRVXCASIdentityV300:{state:()=>({authenticated:!!owner,user:owner?{id:owner}:null})}};
 vm.runInNewContext(accountSource,{window,document:{addEventListener(){}},AbortController,console,setTimeout(){return 1},clearTimeout(){},
  fetch:(url,options)=>{requests.push({url,options});return new Promise(resolve=>pending.push(()=>resolve({ok:true,json:async()=>({ok:true,transactions:[{id:'new',currency:'MG',amount:10000},{id:'old',currency:'MS',amount:300}]})})))}});
 const api=window.JRVXCASServerAccount,first=api.transactions();pending.shift()();
 const rows=await first;assert.equal(rows.length,1);assert.equal(rows[0].currency,'MG');
 assert.equal(requests[0].url,'/api/wallet/transactions');assert.equal(requests[0].options.cache,'no-store');assert.ok(requests[0].options.signal);
 const late=api.transactions();owner='another-owner';pending.shift()();assert.equal(await late,null);
 const before=requests.length;owner='';assert.equal(await api.transactions(),null);assert.equal(requests.length,before);
});

function pokerProFixture({session=null,game=null}={}){
 const records=new Map(),sets=[];if(session)records.set('jrvxCasPokerSessionV230',JSON.stringify(session));
 const node=()=>({classList:{contains:()=>false,toggle(){},remove(){}},textContent:'',style:{}});
 const window={JRVXCASMoneyV330:Money,Poker59Core:Core,Poker59:{state:{game,server:null},render(){}},
  JRVXCASIdentityV300:{state:()=>({mode:'development',requiresAuthentication:false})},
  JRVXCasEconomy:{get:()=>({mg:1250000,currency:'MG'}),balance:()=>1250000,set:value=>sets.push(value),setCurrency(){}},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/modules/poker/runtime/poker-pro-v330.js'),'utf8'),{
  window,document:{readyState:'loading',getElementById:node,querySelectorAll:()=>[],addEventListener(){}},console,navigator:{},setTimeout(){return 1},clearTimeout(){},
  localStorage:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value),removeItem:key=>records.delete(key)}});
 return{api:window.JRVXCASV230,records,sets};
}

test('poker recovery never converts a saved MS session into an equal MG stack',()=>{
 const session={currency:'MS',ts:0,buyIn:300000,players:{0:{stack:300000}}};
 const f=pokerProFixture({session}),old=f.records.get('jrvxCasPokerSessionV230');
 assert.equal(f.api.loadSession(),null);f.api.restoreSession();assert.equal(f.records.get('jrvxCasPokerSessionV230'),old);assert.equal(f.sets.length,0);
 assert.equal(f.api.diagnostics().unit,'MG');assert.equal(f.api.diagnostics().wallet,1250000);
});

test('new poker recovery stores the exact MG stack without compact-string persistence',()=>{
 const game=new Core.HeadsUpGame({buyIn:1250000});const f=pokerProFixture({game});
 assert.equal(f.api.saveSession(true),true);const stored=JSON.parse(f.records.get('jrvxCasPokerSessionV230'));
 assert.equal(stored.currency,'MG');assert.equal(stored.buyIn,1250000);assert.equal(stored.players[0].stack,1250000);
 assert.equal(f.sets.length,0);
});
