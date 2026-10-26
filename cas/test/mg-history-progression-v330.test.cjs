const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/profile/runtime/history-v330.js'),'utf8');
const row=(game='poker',currency='MG',profit=50)=>({game,createdAt:1792843200000,data:{currency,profit,number:17,won:profit>0}});
function fixture(initial='A'){
 let owner=initial,ledger=[];
 const events=new Map(),nodes=new Map(),pending=[],calls=[];
 for(const id of ['v300HistoryStatus','v300HistoryList','v300HistoryRefresh','v328HistoryGame','v328HistoryCurrency','v330WalletHistory'])nodes.set(id,{id,value:'',textContent:'',innerHTML:'',disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const pane={},card={},tabs={querySelector:()=>({})};
 const profile={querySelector:s=>s==='.v70ProfileTabs'?tabs:s==='.v69ModalCard'?card:s==='[data-v70-pane="history"]'?pane:null,querySelectorAll:()=>[]};
 nodes.set('v69Profile',profile);
 const document={readyState:'loading',getElementById:id=>nodes.get(id)||null,querySelector:()=>null,addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn)}};
 const window={JRVXCASMoneyV330:require('../public/modules/core/runtime/money-v330.js'),JRVXCASIdentityV300:{state:()=>({authenticated:!!owner,user:owner?{id:owner}:null})},JRVXCASServerAccount:{transactions:()=>Promise.resolve(ledger),history(game){calls.push(game);return new Promise((resolve,reject)=>pending.push({resolve,reject}));}}};
 vm.runInNewContext(source,{window,document,console});
 const fire=(name,event={})=>{for(const fn of events.get(name)||[])fn(event)};
 fire('DOMContentLoaded');
 return{window,nodes,pending,calls,setLedger(value){ledger=value},ledgerHtml:()=>nodes.get('v330WalletHistory').innerHTML,refresh:()=>window.JRVXCASHistoryV300.refresh(),change(id,value){nodes.get(id).value=value;fire('change',{target:nodes.get(id)})},identity(id){owner=id;fire('jrvx-cas-identity')},html:()=>nodes.get('v300HistoryList').innerHTML,status:()=>nodes.get('v300HistoryStatus').textContent};
}
const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};


test('MG history uses compact signed amounts and exact accessible titles',async()=>{
 const f=fixture(),work=f.refresh();f.pending.shift().resolve([row('poker','MG',555555),row('roulette','MG',-1250000)]);await work;
 assert.match(f.html(),/\+555\.5K MG/);assert.match(f.html(),/-1\.25M MG/);assert.match(f.html(),/title="\+555\u00a0555 MG"/);
});
test('legacy history keeps game/date information without relabelling old amounts',async()=>{
 const f=fixture(),work=f.refresh();f.pending.shift().resolve([{...row('blackjack','MS',900000),legacy:true},row('roulette','MS',777777)]);await work;
 assert.match(f.html(),/До обновления экономики/);assert.doesNotMatch(f.html(),/900|777|MS|900K MG/);assert.doesNotMatch(source,/Mura Silver|value="MS"/);
});
test('wallet history shows daily credit, full balance and server operation type only',async()=>{
 const f=fixture();f.setLedger([{id:'daily',currency:'MG',amount:10000,balanceAfter:1250000,operationType:'daily_bonus'}]);const work=f.refresh();f.pending.shift().resolve([]);await work;
 assert.match(f.ledgerHtml(),/Ежедневная награда/);assert.match(f.ledgerHtml(),/\+10K MG/);assert.match(f.ledgerHtml(),/1\.25M MG/);assert.match(f.ledgerHtml(),/1\u00a0250\u00a0000 MG/);
});
test('malformed and retired wallet rows never appear as spendable MG',async()=>{
 const f=fixture();f.setLedger([{currency:'MS',amount:10000,balanceAfter:10000},{currency:'MG',amount:1.5,balanceAfter:1},{currency:'MG',amount:9007199254740992,balanceAfter:10}]);const work=f.refresh();f.pending.shift().resolve([]);await work;assert.match(f.ledgerHtml(),/Операций MG пока нет/);assert.doesNotMatch(f.ledgerHtml(),/10000|1.5|MS/);
});
test('account change fences both game and wallet history from previous owner',async()=>{
 const f=fixture();f.setLedger([{currency:'MG',amount:10000,balanceAfter:10000}]);const work=f.refresh();f.identity('B');f.pending.shift().resolve([row('poker','MG',999)]);await work;assert.equal(f.html(),'');assert.doesNotMatch(f.ledgerHtml(),/10K|999/);
});
test('sign out clears all previous ledger rows',async()=>{
 const f=fixture();f.setLedger([{currency:'MG',amount:10000,balanceAfter:10000}]);const work=f.refresh();f.pending.shift().resolve([]);await work;f.identity('');assert.doesNotMatch(f.ledgerHtml(),/10K/);assert.equal(f.calls.length,1);
});
test('a failed ledger request does not discard a successful game history',async()=>{
 const f=fixture();f.window.JRVXCASServerAccount.transactions=()=>Promise.reject(Error('offline'));const work=f.refresh();f.pending.shift().resolve([row()]);await work;assert.match(f.html(),/Покер/);assert.match(f.ledgerHtml(),/Не удалось обновить/);assert.equal(f.nodes.get('v300HistoryRefresh').disabled,false);
});
test('invalid game filters cannot become server queries',()=>{
 const f=fixture();f.change('v328HistoryGame','constructor');f.change('v328HistoryGame','<script>');assert.equal(f.calls.length,0);
});
test('progression and guides use only MG rewards while preserving nonfinancial counts',()=>{
 const progress=fs.readFileSync(path.join(__dirname,'../public/modules/profile/runtime/progression-v330.js'),'utf8');const guide=fs.readFileSync(path.join(__dirname,'../public/modules/ui/runtime/game-guide-v330.js'),'utf8');assert.doesNotMatch(progress,/rewardMs|\bMS\b/);assert.match(progress,/rewardMg/);assert.match(progress,/p\.hands/);assert.match(progress,/s\.xpCurrent/);assert.doesNotMatch(guide,/MS или|MS \/ MG|v83ModesHub/);
});
