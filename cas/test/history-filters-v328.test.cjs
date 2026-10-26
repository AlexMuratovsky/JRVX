const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/profile/runtime/history-v328.js'),'utf8');
const row=(game='poker',currency='MS',profit=50)=>({game,createdAt:1792843200000,data:{currency,profit,number:17,won:profit>0}});
function fixture(initial='A'){
 let owner=initial;
 const events=new Map(),nodes=new Map(),pending=[],calls=[];
 for(const id of ['v300HistoryStatus','v300HistoryList','v300HistoryRefresh','v328HistoryGame','v328HistoryCurrency'])nodes.set(id,{id,value:'',textContent:'',innerHTML:'',disabled:false,attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const pane={},card={},tabs={querySelector:()=>({})};
 const profile={querySelector:s=>s==='.v70ProfileTabs'?tabs:s==='.v69ModalCard'?card:s==='[data-v70-pane="history"]'?pane:null,querySelectorAll:()=>[]};
 nodes.set('v69Profile',profile);
 const document={readyState:'loading',getElementById:id=>nodes.get(id)||null,querySelector:()=>null,addEventListener(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn)}};
 const window={JRVXCASIdentityV300:{state:()=>({authenticated:!!owner,user:owner?{id:owner}:null})},JRVXCASServerAccount:{history(game){calls.push(game);return new Promise((resolve,reject)=>pending.push({resolve,reject}));}}};
 vm.runInNewContext(source,{window,document,console});
 const fire=(name,event={})=>{for(const fn of events.get(name)||[])fn(event)};
 fire('DOMContentLoaded');
 return{window,nodes,pending,calls,refresh:()=>window.JRVXCASHistoryV300.refresh(),change(id,value){nodes.get(id).value=value;fire('change',{target:nodes.get(id)})},identity(id){owner=id;fire('jrvx-cas-identity')},html:()=>nodes.get('v300HistoryList').innerHTML,status:()=>nodes.get('v300HistoryStatus').textContent};
}
const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};

test('signed-out history clears results and does not request an account snapshot',async()=>{
 const f=fixture('');await f.refresh();assert.equal(f.calls.length,0);assert.equal(f.html(),'');assert.match(f.status(),/Войдите/);assert.equal(f.nodes.get('v300HistoryRefresh').disabled,true);
});
test('all-games history renders confirmed results and the loaded result count',async()=>{
 const f=fixture(),request=f.refresh();assert.equal(f.nodes.get('v300HistoryList').attrs['aria-busy'],'true');
 f.pending.shift().resolve([row(),row('blackjack','MG',-4),row('roulette')]);await request;
 assert.deepEqual(f.calls,['']);assert.match(f.html(),/Покер/);assert.match(f.html(),/Блэкджек/);assert.match(f.html(),/Рулетка/);assert.match(f.status(),/3 из 3/);assert.equal(f.nodes.get('v300HistoryList').attrs['aria-busy'],'false');assert.equal(f.nodes.get('v300HistoryRefresh').disabled,false);
});
test('game filtering asks the server for the selected game and clears the old list while loading',async()=>{
 const f=fixture(),request=f.refresh();f.pending.shift().resolve([row()]);await request;
 f.change('v328HistoryGame','roulette');assert.deepEqual(f.calls,['','roulette']);assert.equal(f.html(),'');assert.match(f.status(),/Загрузка/);
 f.pending.shift().resolve([row('roulette'),row('poker')]);await settle();assert.match(f.html(),/Рулетка/);assert.doesNotMatch(f.html(),/Покер/);
});
test('currency filtering is local and preserves the selected game query',async()=>{
 const f=fixture();f.change('v328HistoryGame','blackjack');f.pending.shift().resolve([row('blackjack','MS'),row('blackjack','MG',-4)]);await settle();
 f.change('v328HistoryCurrency','MG');assert.deepEqual(f.calls,['blackjack']);assert.equal((f.html().match(/<li>/g)||[]).length,1);assert.match(f.html(),/-4 MG/);assert.doesNotMatch(f.html(),/50 MS/);assert.match(f.status(),/1 из 2/);assert.equal(f.nodes.get('v328HistoryGame').value,'blackjack');
});
test('an empty filtered list explicitly limits its claim to the loaded results',async()=>{
 const f=fixture(),request=f.refresh();f.pending.shift().resolve([row()]);await request;f.change('v328HistoryCurrency','MG');assert.equal(f.html(),'');assert.match(f.status(),/нет результатов среди последних 1 загруженных/);
});
test('history is bounded to fifty loaded server results',async()=>{
 const f=fixture(),request=f.refresh();f.pending.shift().resolve(Array.from({length:55},()=>row()));await request;assert.equal((f.html().match(/<li>/g)||[]).length,50);assert.match(f.status(),/50 из 50/);
});
test('an older game-filter response cannot replace a later selected game',async()=>{
 const f=fixture();f.change('v328HistoryGame','poker');const previous=f.pending.shift();f.change('v328HistoryGame','roulette');const current=f.pending.shift();
 current.resolve([row('roulette')]);await settle();previous.resolve([row('poker')]);await settle();assert.match(f.html(),/Рулетка/);assert.doesNotMatch(f.html(),/Покер/);assert.equal(f.nodes.get('v328HistoryGame').value,'roulette');assert.doesNotMatch(f.status(),/Загрузка/);
});
test('owner changes invalidate in-flight history, filters and all previous rows',async()=>{
 const f=fixture();f.change('v328HistoryGame','poker');f.change('v328HistoryCurrency','MG');const old=f.pending.shift();f.identity('B');assert.equal(f.nodes.get('v328HistoryGame').value,'');assert.equal(f.nodes.get('v328HistoryCurrency').value,'');assert.equal(f.html(),'');
 const request=f.refresh();f.pending.shift().resolve([row('roulette')]);await request;old.resolve([row('poker','MG')]);await settle();assert.match(f.html(),/Рулетка/);assert.doesNotMatch(f.html(),/Покер/);
});
test('logout clears loaded results and leaves history refresh disabled',async()=>{
 const f=fixture(),request=f.refresh();f.pending.shift().resolve([row()]);await request;f.identity('');assert.equal(f.html(),'');assert.match(f.status(),/Войдите/);assert.equal(f.nodes.get('v300HistoryRefresh').disabled,true);
});
test('a failed refresh retains clearly labelled prior results and can be retried',async()=>{
 const f=fixture(),first=f.refresh();f.pending.shift().resolve([row()]);await first;
 const broken=f.refresh();f.pending.shift().reject(Error('offline'));await broken;assert.match(f.status(),/ранее загруженные/);assert.match(f.html(),/Покер/);assert.equal(f.nodes.get('v300HistoryRefresh').disabled,false);
 const retry=f.refresh();f.pending.shift().resolve([row('roulette')]);await retry;assert.doesNotMatch(f.status(),/Не удалось/);assert.match(f.html(),/Рулетка/);
});
test('malformed or missing history reports a recoverable error instead of leaving loading active',async()=>{
 for(const value of [null,{history:[]},'invalid']){const f=fixture(),request=f.refresh();f.pending.shift().resolve(value);await request;assert.match(f.status(),/Не удалось/);assert.equal(f.nodes.get('v300HistoryList').attrs['aria-busy'],'false');assert.equal(f.nodes.get('v300HistoryRefresh').disabled,false);}
});
test('unrecognized filter values cannot create arbitrary server queries',()=>{
 const f=fixture();f.change('v328HistoryGame','__proto__');f.change('v328HistoryGame','<script>');f.change('v328HistoryCurrency','BTC');assert.equal(f.calls.length,0);
});
test('same-owner identity refresh retains current filters and confirmed results',async()=>{
 const f=fixture();f.change('v328HistoryGame','poker');f.pending.shift().resolve([row('poker','MG')]);await settle();f.change('v328HistoryCurrency','MG');f.identity('A');assert.equal(f.calls.length,1);assert.equal(f.nodes.get('v328HistoryGame').value,'poker');assert.equal(f.nodes.get('v328HistoryCurrency').value,'MG');assert.match(f.html(),/MG/);
});
test('invalid history rows and out-of-range timestamps do not crash rendering or display Invalid Date',async()=>{
 const f=fixture(),request=f.refresh();f.pending.shift().resolve([null,[],false,{...row(),createdAt:1e99},row()]);await request;assert.equal((f.html().match(/<li>/g)||[]).length,2);assert.doesNotMatch(f.html(),/Invalid Date|undefined|NaN/);
});
