const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../public');
const pwaSource=fs.readFileSync(process.env.CAS_PWA_V332_SOURCE||path.join(root,'modules/ui/runtime/pwa-v332.js'),'utf8');
const lifecycleSource=fs.readFileSync(process.env.CAS_LIFECYCLE_V332_SOURCE||path.join(root,'modules/core/runtime/lifecycle-v332.js'),'utf8');
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}}
function classList(){const values=new Set();return{contains:key=>values.has(key),add:key=>values.add(key),remove:key=>values.delete(key),toggle(key,force){const add=force??!values.has(key);if(add)values.add(key);else values.delete(key);return add}}}
function events(){const listeners={document:new Map(),window:new Map(),registration:new Map()};return{listen(surface,type,fn,options={}){if(options.signal?.aborted)return;const list=listeners[surface].get(type)||[];list.push(fn);listeners[surface].set(type,list);options.signal?.addEventListener('abort',()=>listeners[surface].set(type,listeners[surface].get(type).filter(value=>value!==fn)),{once:true})},emit(surface,type,ev={}){for(const fn of [...listeners[surface].get(type)||[]])fn(ev)}}}
function pwaFixture(){
 const bus=events(),nodes=new Map(),timers=new Map(),intervals=new Map();let serial=0,updates=0,updateReply=()=>Promise.resolve(),registrationReply;
 function node(tag='div'){return{tagName:tag.toUpperCase(),id:'',className:'',classList:classList(),children:[],hidden:false,disabled:false,isConnected:true,textContent:'',innerHTML:'',addEventListener(){},appendChild(child){this.children.push(child);if(child.id)nodes.set(child.id,child);return child},insertBefore(child){return this.appendChild(child)},querySelector(){return null},getClientRects(){return[{}]}}}
 const host=node(),body=node('body'),html=node('html');
 const document={readyState:'complete',hidden:false,visibilityState:'visible',documentElement:html,body,createElement:node,querySelector(selector){if(selector==='#v69Home .v103TopRight')return host;return nodes.get(selector.slice(1))||null},addEventListener:(type,fn,options)=>bus.listen('document',type,fn,options)};
 const registration={update(){updates++;return updateReply()},addEventListener:(type,fn,options)=>bus.listen('registration',type,fn,options),installing:null};
 registrationReply=Promise.resolve(registration);
 const navigator={userAgent:'Android',platform:'Linux',maxTouchPoints:1,onLine:true,serviceWorker:{controller:{},register:()=>registrationReply}};
 const window={addEventListener:(type,fn,options)=>bus.listen('window',type,fn,options)};
 vm.runInNewContext(pwaSource,{window,document,navigator,location:{protocol:'https:'},matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{setItem(){}},Date,console,Promise,MutationObserver:class{observe(){}},setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),setInterval(fn,ms){const id=++serial;intervals.set(id,{fn,ms});return id},clearInterval:id=>intervals.delete(id)});
 return{window,document,navigator,registration,html,nodes,intervals,updates:()=>updates,setReply:fn=>{updateReply=fn},emitDocument:(type,ev)=>bus.emit('document',type,ev),emitWindow:(type,ev)=>bus.emit('window',type,ev),interval(){for(const timer of intervals.values())timer.fn()},hide(){document.hidden=true;document.visibilityState='hidden';bus.emit('document','visibilitychange')},show(){document.hidden=false;document.visibilityState='visible';bus.emit('document','visibilitychange')}};
}
function lifecycleFixture(){
 const bus=events(),frames=new Map(),timers=new Map();let serial=0,sends=0;
 const status={textContent:''},auth={mode:'production',requiresAuthentication:true,authenticated:true,user:{id:'JRVX-ABCD12345678'}};
 const net={connected:true,handshakeReady:true,transportConnected:true};
 const body={dataset:{},classList:classList()};
 const games=new Map(['poker','blackjack','roulette'].map(id=>[id,{id,hidden:false,classList:{contains:()=>false,remove(){}}}]));
 const document={readyState:'complete',title:'',hidden:false,visibilityState:'visible',body,getElementById:id=>id==='p59StatusSub'?status:games.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],getElementsByTagName:()=>[],addEventListener:(type,fn,options)=>bus.listen('document',type,fn,options)};
 const navigator={onLine:true};
 const window={arcadeNetState:net,JRVXCASIdentityV300:{state:()=>auth},Poker59:{state:{mode:'online',server:null}},addEventListener:(type,fn,options)=>bus.listen('window',type,fn,options),arcadeNetSend(){sends++;throw Error('No gameplay from lifecycle')},arcadeNetConnect(){sends++;throw Error('No gameplay from lifecycle')}};
 vm.runInNewContext(lifecycleSource,{window,document,navigator,AbortController,performance:{now:()=>0},Date,getComputedStyle:()=>({}),MutationObserver:class{observe(){}disconnect(){}},sessionStorage:{setItem(){}},setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id)});
 return{window,document,navigator,status,auth,net,frames,sends:()=>sends,api:window.JRVXCASV241,emitWindow:(type,ev)=>bus.emit('window',type,ev),emitDocument:(type,ev)=>bus.emit('document',type,ev),flush(){for(const[id,fn]of[...frames]){frames.delete(id);fn()}},hide(){document.hidden=true;document.visibilityState='hidden';bus.emit('document','visibilitychange')},show(){document.hidden=false;document.visibilityState='visible';bus.emit('document','visibilitychange')}};
}

test('PWA BFCache return silently recomputes offline state when native network events were missed',async()=>{
 const f=pwaFixture();await tick();assert.equal(f.html.classList.contains('v290-offline'),false);
 f.navigator.onLine=false;f.emitWindow('pageshow',{persisted:true});await tick();assert.equal(f.html.classList.contains('v290-offline'),true);
 f.navigator.onLine=true;f.emitWindow('pageshow',{persisted:true});await tick();assert.equal(f.html.classList.contains('v290-offline'),false);
 assert.equal(f.nodes.has('v290PwaToast'),false,'A resume sync must not invent a new network event toast');
});
test('PWA foreground return reconciles connectivity after sleeping offline',async()=>{
 const f=pwaFixture();await tick();f.hide();f.navigator.onLine=false;f.show();await tick();assert.equal(f.html.classList.contains('v290-offline'),true);
});
test('PWA periodic checks pause while hidden or offline and resume when visible online',async()=>{
 const f=pwaFixture();await tick();const before=f.updates();f.hide();f.interval();await tick();assert.equal(f.updates(),before);
 f.navigator.onLine=false;f.show();f.interval();await tick();assert.equal(f.updates(),before);
 f.navigator.onLine=true;f.show();await tick();assert.equal(f.updates(),before+1);
});
test('simultaneous PWA resume, pageshow and periodic checks share one in-flight update',async()=>{
 const f=pwaFixture();await tick();const gate=deferred();f.setReply(()=>gate.promise);const before=f.updates();
 f.show();f.emitWindow('pageshow',{persisted:true});f.interval();f.show();await tick();assert.equal(f.updates(),before+1);
 gate.resolve();await tick();f.interval();await tick();assert.equal(f.updates(),before+2,'A completed update must release its single-flight guard');
});
test('a failed PWA update releases its guard and remains retryable after reconnect',async()=>{
 const f=pwaFixture();await tick();f.setReply(()=>Promise.reject(Error('offline during update')));const before=f.updates();f.show();await tick();
 assert.equal(f.updates(),before+1);f.setReply(()=>Promise.resolve());f.interval();await tick();assert.equal(f.updates(),before+2);
});
test('PWA exposes the same guarded update path to manual callers',async()=>{
 const f=pwaFixture();await tick();const gate=deferred();f.setReply(()=>gate.promise);const before=f.updates();
 const one=f.window.JRVXPWA.update(),two=f.window.JRVXPWA.update();await tick();assert.equal(f.updates(),before+1);gate.resolve();await Promise.all([one,two]);
 f.navigator.onLine=false;await f.window.JRVXPWA.update();assert.equal(f.updates(),before+1);
});
test('PWA cancels a queued update when hidden or offline before its microtask starts',async()=>{
 for(const pause of ['hidden','offline']){
  const f=pwaFixture();await tick();const before=f.updates(),checking=f.window.JRVXPWA.update();
  if(pause==='hidden')f.hide();else f.navigator.onLine=false;
  assert.equal(await checking,false);assert.equal(f.updates(),before,'No network update may start after '+pause);
  f.navigator.onLine=true;f.show();await tick();assert.equal(f.updates(),before+1,'A skipped update must release its guard');
 }
});
test('poker subtitle drops stale ONLINE when returning from BFCache without internet',()=>{
 const f=lifecycleFixture();assert.match(f.status.textContent,/ONLINE/);f.navigator.onLine=false;f.emitWindow('pageshow',{persisted:true});f.flush();assert.match(f.status.textContent,/Соединение потеряно/);assert.doesNotMatch(f.status.textContent,/ONLINE/);assert.equal(f.sends(),0);f.api.destroy();
});
test('poker foreground return reflects current identity instead of the pre-sleep account',()=>{
 const f=lifecycleFixture();f.hide();f.auth.authenticated=false;f.auth.user=null;f.show();f.flush();assert.match(f.status.textContent,/Войдите через JRVX ID/);assert.doesNotMatch(f.status.textContent,/ONLINE/);assert.equal(f.sends(),0);f.api.destroy();
});
test('poker foreground return reports a lost handshake while preserving a coalesced render',()=>{
 const f=lifecycleFixture();f.hide();f.net.connected=false;f.net.handshakeReady=false;f.net.transportConnected=false;
 for(let i=0;i<8;i++)f.show();assert.equal(f.frames.size,1);f.flush();assert.match(f.status.textContent,/Нет связи с сервером/);assert.equal(f.sends(),0);f.api.destroy();
});
test('a destroyed mobile lifecycle cannot mutate status on a later restore',()=>{
 const f=lifecycleFixture();const original=f.status.textContent;f.api.destroy();f.navigator.onLine=false;f.emitWindow('pageshow',{persisted:true});f.show();f.flush();assert.equal(f.status.textContent,original);assert.equal(f.frames.size,0);assert.equal(f.sends(),0);
});
