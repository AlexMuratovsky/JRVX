const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/legacy/runtime/wallet-v327.js'),'utf8');
const start=source.indexOf('  function syncCasinoUnits(){'),end=source.indexOf('  window.v90SyncCasinoUnits=',start);
assert(start>=0&&end>start);
function fixture(){
 const rows=[];let renders=0;
 const add=(text,ancestor='',game='blackjack',tagName='SPAN')=>{const n={nodeValue:text,parentElement:{tagName,closest:selector=>selector.split(',').includes(ancestor)&&ancestor?{}:null}};rows.push({n,game});return n};
 const roots=Object.fromEntries(['blackjack','roulette'].map(id=>[id,{id,classList:{contains:n=>n==='active'}}]));
 const round={active:false,currency:'MS'};
 const context={activeCurrency:'MG',window:{JRVXCASV220:{blackjack:{state:round}}},renderEconomy(){renders++},NodeFilter:{SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2},document:{getElementById:id=>roots[id],createTreeWalker(root,what,filter){let i=-1;const all=rows.filter(r=>r.game===root.id).map(r=>r.n).filter(n=>filter.acceptNode(n)===1);return{currentNode:null,nextNode(){this.currentNode=all[++i];return!!this.currentNode}}}}};
 vm.createContext(context);vm.runInContext(source.slice(source.indexOf('  function blackjackCurrency(){'),source.indexOf('  function setBalance('))+source.slice(start,end),context);
 return{add,round,sync:()=>context.syncCasinoUnits(),setCurrency:c=>context.activeCurrency=c,get renders(){return renders}};
}
test('switching the wallet currency never relabels a confirmed result or recorded hand',()=>{
 const f=fixture();
 const results=[f.add('Раздача завершена: +75 MS','#bjMessage'),f.add('Победа +20 MS','#rouletteMessage','roulette'),f.add('Рука1 · 50 MS','.v220BjHandChip'),f.add('Выигрыш 75 MS','#blackjackSessionHistory'),f.add('Ставка50 MS','[data-currency-fixed]')];
 const before=results.map(n=>n.nodeValue);f.sync();assert.deepEqual(results.map(n=>n.nodeValue),before);
 f.setCurrency('MS');f.sync();assert.deepEqual(results.map(n=>n.nodeValue),before);
 assert.equal(f.renders,2);
});
test('current controls follow the selected wallet while mixed currency copy and scripts stay intact',()=>{
 const f=fixture(),current=f.add('Ставка50 MS'),balance=f.add('100 MS','','roulette'),pair=f.add('MS / MG'),script=f.add('MS','','blackjack','SCRIPT'),currency=f.add('MS','.v69GameCurrency');
 f.sync();assert.equal(current.nodeValue,'Ставка50 MG');assert.equal(balance.nodeValue,'100 MG');assert.equal(pair.nodeValue,'MS / MG');assert.equal(script.nodeValue,'MS');assert.equal(currency.nodeValue,'MS');
});
test('an unfinished blackjack hand keeps its own currency without relabelling roulette',()=>{
 const f=fixture();f.round.active=true;f.round.currency='MS';const stake=f.add('Ставка50 MS'),roulette=f.add('100 MS','','roulette');f.sync();assert.equal(stake.nodeValue,'Ставка50 MS');assert.equal(roulette.nodeValue,'100 MG');
 f.round.active=false;f.sync();assert.equal(stake.nodeValue,'Ставка50 MG');
});
test('wallet rendering uses the unfinished hand currency for blackjack and selected currency elsewhere',()=>{
 const nodes=new Map();const ctx={window:{JRVXCASV220:{blackjack:{state:{active:true,currency:'MS'}}}},activeCurrency:'MG',state:{currency:'MG'},eco:{ms:900,mg:3},fmt:String,balance:c=>c==='MS'?900:3,document:{getElementById:id=>{if(!nodes.has(id))nodes.set(id,{textContent:''});return nodes.get(id)}}};
 vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function blackjackCurrency(){'),source.indexOf('  function setBalance('))+source.slice(source.indexOf('  function renderEconomy(){'),source.indexOf('  function renderProfile(){')),ctx);
 ctx.renderEconomy();assert.equal(nodes.get('blackjackBalance').textContent,'900 MS');assert.equal(nodes.get('rouletteBalance').textContent,'3 MG');assert.equal(nodes.get('pokerTokenBalance').textContent,'3 MG');
 ctx.window.JRVXCASV220.blackjack.state.active=false;ctx.renderEconomy();assert.equal(nodes.get('blackjackBalance').textContent,'3 MG');
});
