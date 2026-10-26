const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const money=require('../public/modules/core/runtime/money-v330.js');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/legacy/runtime/wallet-v330.js'),'utf8');
const A='JRVX-AAAA12345678',B='JRVX-BBBB87654321';
const drain=()=>new Promise(resolve=>setImmediate(resolve));
function fixture({claimed=false,checkoutAvailable=false,storageFailure=false}={}){
 const nodes=new Map(),records=new Map([['jarvisCasEconomyV69',JSON.stringify({ms:900000,mg:123})],['jarvisCasActiveCurrencyV69','MS']]),events=new Map(),timers=new Map(),requests=[],applied=[],channels=[];
 let owner=A,serial=0,timerId=0,dailyClaimed=claimed,mode='ok',release;
 const classList=()=>({add(){},remove(){},toggle(){},contains(){return false}});
 function node(id){if(!nodes.has(id)){const item={id,value:'',textContent:'',innerHTML:'',disabled:false,hidden:false,dataset:{},style:{},children:[],classList:classList(),attrs:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},removeAttribute(k){delete this.attrs[k]},querySelector:selector=>id==='v69Shop'&&selector==='.v69ShopGrid'?node('shopGrid'):null,querySelectorAll:()=>[],addEventListener(){},appendChild(child){this.children.push(child);return child},after(){},cloneNode(){return this},replaceWith(){}};nodes.set(id,item)}return nodes.get(id)}
 const document={body:node('body'),getElementById:node,querySelectorAll:()=>[],querySelector:()=>null,createElement:tag=>({tagName:tag,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=v},appendChild(n){this.children.push(n)}}),addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn)}};
 const snapshot=()=>({ok:true,account:{id:owner},wallet:{MG:500},walletRevision:{MG:1},dailyBonus:{amount:10000,day:'2026-10-25',claimed:dailyClaimed,nextClaimAt:1792972800000}});
 const response=data=>({ok:true,status:200,json:async()=>data});
 const context={window:{JRVXCASMoneyV330:money,JRVXCASIdentityV300:{state:()=>({authenticated:!!owner,requiresAuthentication:true,mode:'production',user:owner?{id:owner}:null})},addEventListener(type,fn){const key='window:'+type;if(!events.has(key))events.set(key,[]);events.get(key).push(fn)},scrollTo(){}},document,console,AbortController,URL,
  localStorage:{getItem:k=>records.get(k)||null,setItem:(k,v)=>records.set(k,v),removeItem:k=>records.delete(k)},sessionStorage:{getItem:k=>records.get(k)||null,setItem(k,v){if(storageFailure)throw Error('quota');records.set(k,v)},removeItem:k=>records.delete(k)},crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`},
  BroadcastChannel:class{constructor(){channels.push(this)}postMessage(data){this.message=data}close(){}},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),
  fetch:async(url,options={})=>{const request={url,method:options.method||'GET',body:options.body?JSON.parse(options.body):null,signal:options.signal};requests.push(request);
   if(url==='/api/me'){const data=snapshot();if(mode==='hold-me')return new Promise(resolve=>{release=()=>resolve(response(data))});return response(data)}
   if(url==='/api/wallet/daily'){if(mode==='hold-daily')return new Promise(resolve=>{release=()=>{dailyClaimed=true;resolve(response(snapshot()))}});if(mode==='error')throw Error('offline');dailyClaimed=true;return response(snapshot())}
   if(url==='/api/shop/catalog')return response({ok:true,packages:[{id:'pack_1',amountMG:100000,priceKopecks:11900},{id:'pack_2',amountMG:500000,priceKopecks:49900}],paymentsAvailable:checkoutAvailable,providers:checkoutAvailable?['fixture_provider']:[]});
   if(url==='/api/shop/checkout')return response({ok:true,checkoutUrl:'https://payments.example.test/checkout/fixture'});
   throw Error('Unexpected request '+url)
  }};
 context.window.JRVXCASServerAccount={apply(data){applied.push(data.account?.id);if(data.wallet)context.window.JRVXCasEconomy?.set({mg:data.wallet.MG})},refresh:async()=>snapshot()};
 vm.runInNewContext(source,context);
 return{context,nodes,node,records,timers,requests,applied,channels,fireWindow(type,event){for(const fn of events.get('window:'+type)||[])fn(event)},api:context.window.JRVXCASWalletV330,economy:context.window.JRVXCasEconomy,snapshot,mode(value){mode=value},release:()=>release(),identity(next){owner=next;for(const fn of events.get('jrvx-cas-identity')||[])fn()},owner:()=>owner};
}

test('MG wallet aliases expose only one currency and never relabel old local funds',async()=>{const f=fixture();assert.equal(f.economy,f.context.window.JVRXCasEconomy);assert.deepEqual(JSON.parse(JSON.stringify(f.economy.get())),{mg:0,currency:'MG'});assert.equal(f.records.get('jarvisCasEconomyV69'),JSON.stringify({ms:900000,mg:123}));assert.equal(f.economy.setCurrency('MS'),'MG');await drain();assert.equal(f.economy.balance(),500);assert.equal(f.economy.get().ms,undefined)});

test('safe integer wallet updates preserve exact MG and reject negative fractional or unsafe amounts',async()=>{const f=fixture();await drain();for(const value of [-1,0.5,Number.MAX_SAFE_INTEGER+1,Infinity,NaN,'1000']){f.economy.set({mg:value});assert.equal(f.economy.balance(),500)}f.economy.set({mg:Number.MAX_SAFE_INTEGER});assert.equal(f.economy.balance(),Number.MAX_SAFE_INTEGER);f.economy.set({ms:99999});assert.equal(f.economy.balance(),Number.MAX_SAFE_INTEGER)});

test('legacy setter cannot forge a production balance while confirmed server snapshots still apply',async()=>{const f=fixture();await drain();assert.equal(f.context.window.setMuraTokenBalance(999999),500);assert.equal(f.economy.balance(),500);f.economy.set({mg:1250000});assert.equal(f.context.window.setMuraTokenBalance(0),1250000);assert.equal(f.node('v69MgHero').textContent,'1.25M MG');f.context.window.JRVXCASIdentityV300.state=()=>({mode:'development'});assert.equal(f.context.window.setMuraTokenBalance(123),123)});

test('compact balances have exact titles and formatting never changes the balance',async()=>{const f=fixture();await drain();f.economy.set({mg:1250000});assert.equal(f.node('v69MgHero').textContent,'1.25M MG');assert.equal(f.node('blackjackBalance').textContent,'1.25M MG');assert.equal(f.node('v69MgHero').title,money.formatExact(1250000));assert.equal(f.economy.balance(),1250000)});

test('daily state comes from the server and a stale unclaimed response cannot undo a confirmed day',async()=>{const f=fixture();await drain();assert.equal(f.node('v69DailyClaim').disabled,false);f.api.applySnapshot({...f.snapshot(),dailyBonus:{amount:10000,day:'2026-10-25',claimed:true}});f.api.applySnapshot({...f.snapshot(),dailyBonus:{amount:10000,day:'2026-10-25',claimed:false}});assert.equal(f.api.diagnostics().daily.claimed,true);assert.equal(f.node('v69DailyClaim').disabled,true);f.api.applySnapshot({...f.snapshot(),dailyBonus:{amount:10000,day:'2026-10-26',claimed:false}});assert.equal(f.api.diagnostics().daily.claimed,false)});

test('daily requires authenticated matching-owner server status and exactly ten thousand amount',async()=>{const f=fixture();await drain();f.api.applySnapshot({...f.snapshot(),account:{id:B},dailyBonus:{amount:10000,day:'2026-10-27',claimed:true}});assert.equal(f.api.diagnostics().daily.day,'2026-10-25');f.api.applySnapshot({...f.snapshot(),dailyBonus:{amount:99999,day:'2026-10-27',claimed:true}});assert.equal(f.api.diagnostics().daily.day,'2026-10-25');f.identity(null);assert.equal(await f.api.claimDaily(),false);assert.equal(f.requests.filter(x=>x.url==='/api/wallet/daily').length,0)});

test('simultaneous daily clicks send one request and refresh the same account without a local credit',async()=>{const f=fixture();await drain();f.mode('hold-daily');const first=f.api.claimDaily(),second=f.api.claimDaily();assert.equal(f.requests.filter(x=>x.url==='/api/wallet/daily').length,1);const request=f.requests.at(-1);assert.deepEqual(Object.keys(request.body).sort(),['operationId','ownerId']);assert.equal(request.body.ownerId,A);assert.equal(f.economy.balance(),500);f.release();await Promise.all([first,second]);assert.equal(f.api.diagnostics().daily.claimed,true);assert.equal(f.economy.balance(),500);assert.equal(f.channels[0].message.ownerId,A)});

test('an uncertain daily retry preserves the operation identity',async()=>{const f=fixture();await drain();f.mode('error');assert.equal(await f.api.claimDaily(),false);const first=f.requests.at(-1).body;f.mode('ok');assert.equal(await f.api.claimDaily(),true);const second=f.requests.at(-1).body;assert.deepEqual(second,first);assert.equal(f.records.has('jrvxCASMGV330:daily:'+A),false)});

test('unwritable durable storage prevents a daily mutation',async()=>{const f=fixture({storageFailure:true});await drain();assert.equal(await f.api.claimDaily(),false);assert.equal(f.requests.filter(x=>x.url==='/api/wallet/daily').length,0)});

test('a hung daily request times out and preserves its identity for safe reconciliation',async()=>{const f=fixture();await drain();f.mode('hold-daily');const work=f.api.claimDaily();const deadline=[...f.timers.values()].find(x=>x.ms===12000);assert.ok(deadline);deadline.fn();assert.equal(await work,false);assert.equal(f.requests.at(-1).signal.aborted,true);assert.equal(f.api.diagnostics().dailyBusy,false);assert.equal(f.records.has('jrvxCASMGV330:daily:'+A),true);f.release();await drain();assert.equal(f.api.diagnostics().daily.claimed,false)});

test('late daily response from the previous account cannot render its balance or status',async()=>{const f=fixture();await drain();f.mode('hold-daily');const work=f.api.claimDaily();f.identity(B);await drain();f.release();await work;assert.equal(f.api.diagnostics().owner,B);assert.equal(f.api.diagnostics().daily.claimed,false);assert.equal(f.records.has('jrvxCASMGV330:daily:'+A),true)});

test('catalog quantities and prices come from the server, with unavailable checkout explicitly disabled',async()=>{const f=fixture();await drain();await f.api.loadCatalog();const html=f.node('shopGrid').innerHTML;assert.match(html,/100K MG/);assert.match(html,/500K MG/);assert.match(html,/119 ₽/);assert.match(html,/Оплата недоступна/);assert.match(html,/disabled/);assert.equal(await f.api.checkout('pack_1'),false);assert.equal(f.requests.filter(x=>x.url==='/api/shop/checkout').length,0);assert.match(f.node('v330ShopStatus').textContent,/не подключён/)});

test('checkout submits the package identity and stable request identity without client-controlled credit or price',async()=>{const f=fixture({checkoutAvailable:true});await drain();await f.api.loadCatalog();assert.equal(await f.api.checkout('pack_1'),true);const body=f.requests.find(x=>x.url==='/api/shop/checkout').body;assert.equal(body.packageId,'pack_1');assert.equal(body.ownerId,A);assert.equal(body.requestId,body.operationId);assert.equal(body.provider,'fixture_provider');for(const key of ['amount','amountMG','mg','price','priceKopecks','balance'])assert.equal(key in body,false);assert.equal(f.economy.balance(),500);assert.equal(f.node('v330ShopStatus').children.at(-1).href,'https://payments.example.test/checkout/fixture')});

test('unknown packages never reach checkout and MG table selection skips the retired currency step',async()=>{const f=fixture({checkoutAvailable:true});await drain();await f.api.loadCatalog();assert.equal(await f.api.checkout('tampered'),false);f.context.window.JRVXCASOpenTables();assert.equal(f.node('v69CurrencyStep').hidden,true);assert.equal(f.node('v69TableStep').hidden,false);assert.equal(f.node('v69ActiveCurrencyLabel').textContent,'MG');assert.equal(f.requests.filter(x=>x.url==='/api/shop/checkout').length,0)});

test('cross-tab notifications contain no trusted balance and trigger fresh server reads',async()=>{const f=fixture();await drain();const before=f.requests.length;f.channels[0].onmessage({data:{type:'refresh',ownerId:A,balance:999999999}});await drain();assert.ok(f.requests.length>before);assert.equal(f.economy.balance(),500)});
test('repeated checkout preparation reuses the same pending request until payment reconciliation',async()=>{const f=fixture({checkoutAvailable:true});await drain();await f.api.loadCatalog();await f.api.checkout('pack_1');await f.api.checkout('pack_1');const requests=f.requests.filter(x=>x.url==='/api/shop/checkout');assert.equal(requests.length,2);assert.deepEqual(requests[1].body,requests[0].body);assert.equal(f.economy.balance(),500)});

test('a late failed status read cannot erase a newer confirmed daily snapshot',async()=>{const f=fixture();await drain();f.mode('hold-me');const old=f.api.refreshDaily();const oldTimer=[...f.timers.values()].find(x=>x.ms===12000);f.mode('ok');await f.api.refreshDaily();oldTimer.fn();await old;assert.equal(f.api.diagnostics().daily.day,'2026-10-25');assert.equal(f.node('v69DailyClaim').disabled,false)});

test('next-day availability schedules a server read from the server interval without granting a local reward',async()=>{const f=fixture();await drain();const before=f.requests.length;f.api.applySnapshot({...f.snapshot(),dailyBonus:{amount:10000,day:'2026-10-25',claimed:true,nextClaimAt:120000,serverTime:100000}});const timer=[...f.timers.values()].find(x=>x.ms===20100);assert.ok(timer);assert.equal(f.api.diagnostics().daily.claimed,true);assert.equal(f.economy.balance(),500);timer.fn();await drain();assert.ok(f.requests.length>before);assert.equal(f.requests.filter(x=>x.url==='/api/wallet/daily').length,0)});

const legacyManifest=require('../mg-legacy-v330-manifest.json');
const legacySource=name=>fs.readFileSync(path.join(__dirname,'../public',legacyManifest.entries.find(entry=>entry.oldPath.includes(name)).newPath),'utf8');
function exactFunction(source,name,context){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),line=source.match(new RegExp('^[ \\t]*function '+escaped+'\\([^\\n]*$','m'))?.[0];assert.ok(line,name+' must be an actual generated function');return vm.runInNewContext(line+';'+name,context)}

test('generated sources match their manifest, retire active currency selectors, and exclude the carousel',()=>{const crypto=require('node:crypto');assert.equal(legacyManifest.entries.length,22);for(const entry of legacyManifest.entries){assert.doesNotMatch(entry.oldPath,/29-v108-mode-carousel/);const bytes=fs.readFileSync(path.join(__dirname,'../public',entry.newPath));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);assert.doesNotMatch(bytes.toString('utf8'),/\bMS\b|Mura Silver|\/api\/wallet\/exchange|\.ms\b/)} });

test('legacy table balance uses the full canonical MG amount instead of parsing K/M DOM text',()=>{const fn=exactFunction(legacySource('06-v71'),'eco',{window:{JRVXCasEconomy:{balance:()=>1250000}},document:{getElementById(){assert.fail('Never parse a formatted balance')}}});assert.equal(fn().mg,1250000)});

test('legacy mode flow goes directly to MG tables without entering or wagering',()=>{const nodes=new Map(['v69CurrencyStep','v69TableStep','v71TournamentSoon'].map(id=>[id,{hidden:false,classList:{remove(){}}}]));const root={hidden:true,style:{}},calls=[];const fn=exactFunction(legacySource('06-v71'),'openFlow',{flow:'',nativeTables:null,tableBtn:null,ROOT:root,$:id=>nodes.get(id),document:{querySelectorAll:()=>[]},setFlowCopy(){calls.push('copy')},afterCurrency(){calls.push('table choices')},window:{JRVXCasEconomy:{setCurrency:c=>calls.push(c)},scrollTo(){}}});fn('private');assert.equal(nodes.get('v69CurrencyStep').hidden,true);assert.equal(nodes.get('v69TableStep').hidden,false);assert.deepEqual(calls,['MG','copy','table choices'])});

test('old local recovery currency is retained as data but cannot become MG at one to one',()=>{const data={currency:'MS',stack:300000,at:1000},records=new Map([['recovery',JSON.stringify(data)]]);const fn=exactFunction(legacySource('42-v122'),'readLocalRecovery',{LOCAL_RECOVERY:'recovery',Date:{now:()=>1100},sessionStorage:{getItem:key=>records.get(key)},localStorage:{getItem:key=>records.get(key)}});assert.equal(fn(),null);assert.equal(JSON.parse(records.get('recovery')).stack,300000);records.set('recovery',JSON.stringify({...data,currency:'MG'}));assert.equal(fn().stack,300000)});

test('poker wallet uses only canonical safe MG and never a legacy local profile',()=>{for(const name of ['02-v59','11-v84']){const fn=exactFunction(legacySource(name),'wallet',{window:{JRVXCasEconomy:{balance:()=>NaN},arcadeNetState:{pokerTokens:999999}},playerProfile:{pokerTokens:999999}});assert.equal(fn(),0)}});

test('poker raises preserve invalid fractional input for authoritative rejection rather than flooring it',()=>{const code=legacySource('02-v59');assert.match(code,/amount:Number\(\$\('p59Bet'\)\.value\)/);assert.doesNotMatch(code,/amount:Math\.floor\(Number\(\$\('p59Bet'/);assert.match(code,/Number\.isSafeInteger\(buy\)/)});

test('poker wallet displays compact MG with exact accessible fallback',()=>{const node={textContent:'',title:''};const fn=exactFunction(legacySource('02-v59'),'refreshWallet',{$:()=>node,wallet:()=>1250000,window:{JRVXCASMoneyV330:money}});fn();assert.equal(node.textContent,'1.25M MG');assert.equal(node.title,money.formatExact(1250000))});


test('mobile header reveals MG only after a matching authoritative economy snapshot and clears on account switch',async()=>{
 const f=fixture();await drain();f.economy.set({mg:1250000});const button=f.node('jrvxCasAccountButton');assert.equal(button.attrs['data-mg-balance'],undefined);
 f.api.applySnapshot({...f.snapshot(),account:{id:B},economy:{version:'mg-v330'},wallet:{MG:1250000}});assert.equal(button.attrs['data-mg-balance'],undefined);
 f.api.applySnapshot({...f.snapshot(),economy:{version:'mg-v330'},wallet:{MG:1250000}});assert.equal(button.attrs['data-mg-balance'],'1.25M MG');assert.equal(button.attrs['data-mg-exact'],money.formatExact(1250000));
 f.mode('hold-me');f.identity(B);assert.equal(button.attrs['data-mg-balance'],undefined);assert.equal(button.attrs['data-mg-exact'],undefined);
});
test('versioned shop entry bypasses an obsolete global opener and loads the authoritative server catalog',async()=>{
 const f=fixture();await drain();let oldCalls=0;f.context.window.openShop=()=>{oldCalls++};f.api.openShop();await drain();assert.equal(oldCalls,0);assert.equal(f.requests.filter(r=>r.url==='/api/shop/catalog').length,1);assert.match(f.node('shopGrid').innerHTML,/100K MG/);
 assert.match(legacySource('09-v76'),/window\.JRVXCASWalletV330\.openShop\(\)/);
});

test('captured legacy mobile shop click loads the server catalog even when an older dock handler owns the modal',async()=>{
 const f=fixture();await drain();f.fireWindow('click',{target:{closest:selector=>selector==='#v76Dock [data-a="shop"]'?{}:null}});await drain();assert.equal(f.requests.filter(row=>row.url==='/api/shop/catalog').length,1);assert.match(f.node('shopGrid').innerHTML,/100K MG/);assert.match(f.node('shopGrid').innerHTML,/Оплата недоступна/);
});
