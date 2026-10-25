const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/ui/runtime/club-hub-v329.js'),'utf8');
const pure={module:{exports:{}}};vm.runInNewContext(source,pure);const {sanitize,storageOwner,modes}=pure.module.exports;
const prefix='jrvxCasClubHubV329:',storageKey=id=>prefix+encodeURIComponent('account:'+id),production=id=>({requiresAuthentication:true,authenticated:!!id,user:id?{id}:null});
const json=value=>JSON.parse(JSON.stringify(value));
function fixture({identity=production('A'),initial=[],readFails=false,writeFails=false,boot=true,homePresent=true}={}){
 let auth=identity;
 const events={document:new Map(),window:new Map()},records=new Map(initial),reads=[],writes=[],routes=[],frames=new Map(),timers=new Map(),observers=[];
 let frameId=0,timerId=0,unsafeSourceClicks=0,document;
 class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.parentNode=null;this.dataset={};this.attrs={};this.className='';this.id='';this.disabled=false;this._text='';}
  get isConnected(){return this===document?.documentElement||!!this.parentNode?.isConnected}
  get textContent(){return this._text+this.children.map(node=>node.textContent).join('')}
  set textContent(value){this._text=String(value);for(const node of this.children)node.parentNode=null;this.children=[];}
  append(...nodes){for(const node of nodes){node.remove();this.children.push(node);node.parentNode=this;}}
  appendChild(node){this.append(node);return node;}
  insertBefore(node,reference){if(!reference){this.append(node);return node;}node.remove();const at=this.children.indexOf(reference);assert(at>=0);this.children.splice(at,0,node);node.parentNode=this;return node;}
  remove(){if(!this.parentNode)return;const siblings=this.parentNode.children;siblings.splice(siblings.indexOf(this),1);this.parentNode=null;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  getAttribute(name){if(name==='id')return this.id;if(name==='class')return this.className;if(name.startsWith('data-')){const key=name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());if(Object.hasOwn(this.dataset,key))return this.dataset[key];}return this.attrs[name]??null;}
  setAttribute(name,value){this.attrs[name]=String(value);}
  matches(selector){return selector.split(',').some(s=>{s=s.trim();if(s.startsWith('#'))return this.id===s.slice(1);if(s.startsWith('.'))return this.className.split(/\s+/).includes(s.slice(1));const attr=/^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(s);if(attr)return this.getAttribute(attr[1])!==null&&(attr[2]===undefined||this.getAttribute(attr[1])===attr[2]);return this.tagName.toLowerCase()===s;});}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){return this.matches(selector)?this:this.parentNode?.closest(selector)||null;}
  focus(){if(!this.disabled&&this.isConnected)document.activeElement=this;}
  click(){if(!this.disabled)this.onclick?.({target:this});}
 }
 const html=new Node('html'),body=new Node('body');document={readyState:'loading',documentElement:html,body,activeElement:body,createElement:tag=>new Node(tag),getElementById:id=>html.querySelector('#'+id),addEventListener:(name,fn,options)=>listen('document',name,fn,options)};html.append(body);
 function listen(surface,name,fn,options={}){if(!events[surface].has(name))events[surface].set(name,[]);events[surface].get(name).push({fn,signal:options.signal});}
 function fire(surface,name,event={}){for(const item of events[surface].get(name)||[])if(!item.signal?.aborted)item.fn(event);}
 const home=new Node('section');home.id='v69Home';const main=new Node('main');main.className='v69Main';const hero=new Node('article');hero.id='retainedHero';const carousel=new Node('section');carousel.id='v83ModesHub';main.append(hero,carousel);home.append(main);if(homePresent)body.append(home);
 for(const mode of modes){const control=new Node('button');control.id=mode.source;control.onclick=()=>unsafeSourceClicks++;body.append(control);}
 const window={JRVXCASIdentityV300:{state:()=>auth},JRVXCASOpenTableFlow:flow=>routes.push(flow),addEventListener:(name,fn,options)=>listen('window',name,fn,options),arcadeNetSend(){assert.fail('The route catalog must never send a game command');}};
 const context={window,document,AbortController,console,localStorage:{getItem(key){reads.push(key);if(readFails)throw Error('storage_read_denied');return records.get(key)??null},setItem(key,value){if(writeFails)throw Error('storage_write_denied');records.set(key,value);writes.push({key,value});}},setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),MutationObserver:class{constructor(fn){this.fn=fn;this.observations=[];observers.push(this)}observe(target,options){this.disconnected=false;this.observations.push({target,options})}disconnect(){this.disconnected=true;this.observations=[]}},fetch(){assert.fail('The route catalog must not call an API')}};
 vm.runInNewContext(source,context);if(boot)fire('document','DOMContentLoaded');
 const api=window.JRVXCASClubHubV329;
 return{api,window,document,Node,home,main,hero,carousel,records,reads,writes,routes,frames,timers,observers,unsafeSourceClicks:()=>unsafeSourceClicks,node:id=>document.getElementById(id),boot:()=>fire('document','DOMContentLoaded'),fire,
  identity(next,{announce=true}={}){auth=next;if(announce)fire('document','jrvx-cas-identity');},
  buttons:()=>document.getElementById('jrvxClubHubModes')?.querySelectorAll('button')||[],
  button:(mode,role)=>document.getElementById('jrvxClubHubModes')?.querySelectorAll('button').find(node=>node.dataset.clubMode===mode&&node.dataset.clubRole===role),
  drain(){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn())}};
}

test('catalog preference schema discards unknown, duplicated and oversized lists',()=>{
 const result=sanitize({version:1,favorites:['poker','poker','__proto__','roulette',null,'online'],recent:['online','roulette','poker','blackjack','online'],extra:'untrusted'});
 assert.deepEqual(json(result),{version:1,favorites:['poker','roulette','online'],recent:['online','roulette','poker']});
 for(const raw of [null,[],true,{version:'1',favorites:['poker']},{favorites:['poker']}])assert.deepEqual(json(sanitize(raw)),{version:1,favorites:[],recent:[]});
});
test('storage ownership accepts only canonical verified IDs or explicit development mode',()=>{
 assert.equal(storageOwner(production('A')),'account:A');assert.equal(storageOwner({requiresAuthentication:false}),'development');
 for(const raw of [null,{},production(''),{authenticated:false,user:{id:'A'}},{authenticated:true,user:{id:{}}},production('A\nB'),production('A'.repeat(129))])assert.equal(storageOwner(raw),'');
});
test('hub is inserted beside the existing carousel while retaining the original hero and controls',()=>{
 const f=fixture(),hub=f.node('jrvxClubHub');assert(hub);assert.equal(f.main.children.indexOf(hub)+1,f.main.children.indexOf(f.carousel));assert.equal(f.hero.parentNode,f.main);assert.equal(f.buttons().length,10);
 for(const button of f.buttons())assert.equal(button.type,'button');assert.equal(hub.getAttribute('aria-labelledby'),'jrvxClubHubTitle');
});
test('each route calls only the explicit selection-flow API once and never the old auto-join click',()=>{
 const f=fixture();for(const mode of modes){assert.equal(f.api.choose(mode.key),true);assert.equal(f.routes.at(-1),mode.flow);}assert.deepEqual(f.routes,json(modes.map(mode=>mode.flow)));assert.equal(f.unsafeSourceClicks(),0);
});
test('missing, disabled and aria-disabled navigation controls cannot be invoked or enter recent choices',()=>{
 const f=fixture();f.node('v71Roulette').remove();f.node('v71Blackjack').disabled=true;f.node('v76PeoplePlay').setAttribute('aria-disabled','true');f.api.sync();
 for(const key of ['roulette','blackjack','online']){assert.equal(f.api.choose(key),false);assert.equal(f.button(key,'open').disabled,true);}assert.deepEqual(f.routes,[]);assert.deepEqual(json(f.api.diagnostics().recent),[]);assert.equal(f.api.choose('__proto__'),false);
});
test('signed-out production never reads a former account preference key and renders disabled controls',()=>{
 const f=fixture({identity:production(''),initial:[[storageKey('A'),JSON.stringify({version:1,favorites:['poker'],recent:['roulette']})]]});assert.equal(f.reads.length,0);assert(f.buttons().every(button=>button.disabled));assert.match(f.node('jrvxClubHubStatus').textContent,/Войдите/);assert.equal(f.api.toggleFavorite('poker'),false);assert.equal(f.api.choose('poker'),false);
});
test('favorites persist in the verified account key and are restored by a fresh runtime',()=>{
 const f=fixture();assert.equal(f.api.toggleFavorite('poker'),true);assert.equal(f.button('poker','favorite').getAttribute('aria-pressed'),'true');assert.match(f.button('poker','favorite').getAttribute('aria-label'),/Убрать/);assert.equal(f.writes[0].key,storageKey('A'));
 const restored=fixture({initial:[...f.records]});assert.deepEqual(json(restored.api.diagnostics().favorites),['poker']);assert.equal(restored.api.toggleFavorite('poker'),true);assert.deepEqual(json(restored.api.diagnostics().favorites),[]);
});
test('recent choices remain unique, newest first and bounded to three modes',()=>{
 const f=fixture();for(const mode of ['poker','roulette','blackjack','online','roulette'])f.api.choose(mode);assert.deepEqual(json(f.api.diagnostics().recent),['roulette','online','blackjack']);f.api.selectFilter('recent');assert.deepEqual(f.buttons().filter(node=>node.dataset.clubRole==='open').map(node=>node.dataset.clubMode),['roulette','online','blackjack']);
});
test('account change resets the visible filter and loads only the next account preferences',()=>{
 const f=fixture({initial:[[storageKey('B'),JSON.stringify({version:1,favorites:['blackjack'],recent:[]})]]});f.api.toggleFavorite('poker');f.api.choose('roulette');f.api.selectFilter('favorites');f.identity(production('B'));assert.deepEqual(json(f.api.diagnostics()),{ownerScoped:true,favorites:['blackjack'],recent:[],filter:'all',storageAvailable:true});assert.equal(JSON.parse(f.records.get(storageKey('A'))).favorites[0],'poker');
 f.identity(production(''));assert.deepEqual(json(f.api.diagnostics().favorites),[]);assert.deepEqual(json(f.api.diagnostics().recent),[]);
});
test('same-owner identity refresh retains in-memory preferences and the current filter',()=>{
 const f=fixture();f.api.toggleFavorite('private');f.api.selectFilter('favorites');const readCount=f.reads.length;f.identity({...production('A'),user:{id:'A',nickname:'Renamed'}});assert.equal(f.reads.length,readCount);assert.equal(f.api.diagnostics().filter,'favorites');assert.deepEqual(json(f.api.diagnostics().favorites),['private']);
});
test('a stale rendered favorite click across account replacement cannot modify the next owner',()=>{
 const f=fixture(),stale=f.button('poker','favorite');f.identity(production('B'),{announce:false});stale.click();assert.equal(f.writes.length,0);assert.deepEqual(json(f.api.diagnostics().favorites),[]);assert.equal(f.api.diagnostics().ownerScoped,true);
});
test('a route callback that changes identity cannot write recent choices into either account',()=>{
 const f=fixture();f.window.JRVXCASOpenTableFlow=()=>f.identity(production('B'));assert.equal(f.api.choose('poker'),false);assert.equal(f.writes.length,0);assert.deepEqual(json(f.api.diagnostics().recent),[]);
});
test('blocked storage keeps bounded choices in memory and gives a truthful persistence notice',()=>{
 const f=fixture({writeFails:true});assert.equal(f.api.toggleFavorite('roulette'),true);assert.deepEqual(json(f.api.diagnostics().favorites),['roulette']);assert.equal(f.api.diagnostics().storageAvailable,false);assert.match(f.node('jrvxClubHubStatus').textContent,/до закрытия страницы/);assert.equal(f.api.choose('poker'),true);assert.deepEqual(f.routes,['jarvis']);
});
test('denied or malformed storage cannot expose another owner or prevent catalog rendering',()=>{
 for(const options of [{readFails:true},{initial:[[storageKey('A'),'{bad json']]}]){const f=fixture(options);assert.deepEqual(json(f.api.diagnostics().favorites),[]);assert.match(f.node('jrvxClubHubStatus').textContent,/Сохранение/);assert.equal(f.buttons().length,10);}
});
test('cross-tab updates affect only the active owner key and a storage clear removes saved choices',()=>{
 const f=fixture();f.fire('window','storage',{key:storageKey('B'),newValue:JSON.stringify({version:1,favorites:['poker'],recent:[]})});assert.deepEqual(json(f.api.diagnostics().favorites),[]);
 f.fire('window','storage',{key:storageKey('A'),newValue:JSON.stringify({version:1,favorites:['roulette'],recent:['poker']})});assert.deepEqual(json(f.api.diagnostics().favorites),['roulette']);f.fire('window','storage',{key:null,newValue:null});assert.deepEqual(json(f.api.diagnostics().favorites),[]);
});
test('empty categories provide guidance and filter controls expose their pressed state',()=>{
 const f=fixture();assert.equal(f.api.selectFilter('favorites'),true);assert.equal(f.buttons().length,0);assert.match(f.node('jrvxClubHubStatus').textContent,/Избранное пока пусто/);const button=f.node('jrvxClubHub').querySelector('[data-club-filter="favorites"]');assert.equal(button.getAttribute('aria-pressed'),'true');assert.equal(f.api.selectFilter('<script>'),false);f.api.selectFilter('recent');assert.match(f.node('jrvxClubHubStatus').textContent,/Недавних/);
});
test('removing the focused last favorite returns keyboard focus to the active category control',()=>{
 const f=fixture();f.api.toggleFavorite('poker');f.api.selectFilter('favorites');const favorite=f.button('poker','favorite');favorite.focus();favorite.click();assert.equal(f.document.activeElement,f.node('jrvxClubHub').querySelector('[data-club-filter="favorites"]'));assert.equal(f.buttons().length,0);
});
test('observer notifications coalesce and the hub does not schedule itself into a mutation loop',()=>{
 const f=fixture(),route=f.observers[1],tree=f.observers[0];for(let i=0;i<100;i++)route.fn([{type:'attributes',target:f.node('v71Roulette')}]);assert.equal(f.frames.size,1);f.drain();assert.equal(f.frames.size,0);tree.fn([{type:'childList',target:f.node('jrvxClubHubStatus'),addedNodes:[],removedNodes:[]}]);assert.equal(f.frames.size,0);
});
test('late lobby construction and recreated hub repopulate the catalog without duplicated sections',()=>{
 const f=fixture({homePresent:false});assert.equal(f.node('jrvxClubHub'),null);f.document.body.append(f.home);f.observers[2].fn([{type:'childList',target:f.document.body,addedNodes:[f.home],removedNodes:[]}]);f.drain();assert.equal(f.buttons().length,10);f.node('jrvxClubHub').remove();f.api.sync();assert.equal(f.buttons().length,10);assert.equal(f.main.querySelectorAll('#jrvxClubHub').length,1);
});
test('destroy cancels pending frames and prevents reinitialization before or after DOM ready',()=>{
 const early=fixture({boot:false});early.api.destroy();early.boot();assert.equal(early.node('jrvxClubHub'),null);
 const f=fixture();f.observers[1].fn([{type:'attributes',target:f.node('v71Roulette')}]);f.api.destroy();assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert(f.observers.every(observer=>observer.disconnected));assert.equal(f.api.choose('poker'),false);assert.equal(f.api.toggleFavorite('poker'),false);f.identity(production('B'));assert.deepEqual(f.routes,[]);
});
test('absence of the explicit selection flow fails closed even if a legacy auto-join button exists',()=>{
 const f=fixture();delete f.window.JRVXCASOpenTableFlow;f.api.sync();assert(f.buttons().every(button=>button.disabled));assert.equal(f.api.choose('poker'),false);assert.equal(f.unsafeSourceClicks(),0);assert.deepEqual(f.routes,[]);
});
test('observers do not subscribe to body/game subtree attribute changes or card class bursts',()=>{
 const f=fixture(),all=f.observers.flatMap(observer=>observer.observations);assert(all.length>0);assert(all.filter(item=>item.options.attributes).every(item=>!item.options.subtree));assert(all.filter(item=>item.target===f.document.body).every(item=>item.options.childList&&!item.options.subtree&&!item.options.attributes));assert.equal(f.timers.size,4);
});
