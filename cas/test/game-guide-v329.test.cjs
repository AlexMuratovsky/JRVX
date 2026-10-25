const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const filename=path.join(__dirname,'../public/modules/ui/runtime/game-guide-v329.js');
const source=fs.readFileSync(filename,'utf8');
const {guides,safeMode}=require(filename);
function fixture({manager=true,lateHosts=false}={}){
 const documentEvents=new Map(),windowEvents=new Map(),hosts=new Map(),opens=[],closes=[],mutations=[];
 let document;
 const listen=(events,type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn)};
 class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.children=[];this.events=new Map();this.parentNode=null;this.hidden=false;this.disabled=false;this.tabIndex=0;this.scrollTop=0;this.ownText=''}
  set className(value){this.attrs.class=value}get className(){return this.attrs.class||''}
  set textContent(value){this.ownText=String(value);this.children=[]}get textContent(){return this.ownText+this.children.map(node=>node.textContent).join('')}
  get id(){return this.attrs.id||''}
  get isConnected(){return this===document?.body||!!this.parentNode?.isConnected}
  setAttribute(name,value){this.attrs[name]=String(value)}getAttribute(name){return this.attrs[name]??null}
  appendChild(node){node.parentNode=this;this.children.push(node);return node}
  descendants(){return this.children.flatMap(child=>[child,...child.descendants()])}
  contains(node){return node===this||this.children.some(child=>child.contains(node))}
  matches(selector){const id=selector.match(/#([\w-]+)/)?.[1];if(id&&this.id!==id)return false;for(const item of selector.matchAll(/\.([\w-]+)/g))if(!this.className.split(/\s+/).includes(item[1]))return false;for(const item of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)){const value=this.getAttribute(item[1]);if(value===null||item[2]!==undefined&&value!==item[2])return false}return true}
  closest(selector){return this.matches(selector)?this:this.parentNode?.closest(selector)||null}
  querySelectorAll(selector){return this.descendants().filter(node=>node.matches(selector))}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  addEventListener(type,fn){listen(this.events,type,fn)}
  focus(){if(this.isConnected&&!this.hidden&&!this.disabled)document.activeElement=this}
 }
 document={readyState:'loading',body:new Node('body'),createElement:tag=>new Node(tag),activeElement:null,
  getElementById:id=>document.body.descendants().find(node=>node.id===id)||null,
  querySelector:selector=>hosts.get(selector)||document.body.querySelector(selector),
  addEventListener:(type,fn)=>listen(documentEvents,type,fn)};
 document.activeElement=document.body;
 function mountHosts(){for(const key of ['poker','blackjack','roulette']){if(hosts.has('#'+key+' .gamehead .actions'))continue;const host=new Node();document.body.appendChild(host);hosts.set('#'+key+' .gamehead .actions',host);const old=new Node('button');old.setAttribute('id',key+'Info');host.appendChild(old)}if(!hosts.has('#p59Game .p59GameBtns')){const host=new Node();document.body.appendChild(host);hosts.set('#p59Game .p59GameBtns',host);const old=new Node('button');old.setAttribute('id','seatedPokerTool');host.appendChild(old)}if(!document.getElementById('v83ModesHub')){const hub=new Node('section'),header=new Node();hub.setAttribute('id','v83ModesHub');header.className='v83Header';hub.appendChild(header);document.body.appendChild(hub)}}
 if(!lateHosts)mountHosts();
 const window={addEventListener:(type,fn)=>listen(windowEvents,type,fn),arcadeNetSend:()=>{mutations.push('send');throw Error('Help cannot perform game actions')},fetch:()=>{mutations.push('fetch');throw Error('Help cannot request an account')}};
 if(manager)window.JRVXCASPanelsV329={open(panel,options){const alreadyOpen=!panel.hidden;opens.push({panel,options});panel.hidden=false;if(!alreadyOpen)options.initialFocus?.focus();return true},close(panel){closes.push(panel);panel.hidden=true},active:()=>opens.at(-1)?.panel||null};
 const context={document,window,console,fetch:window.fetch,setTimeout:()=>{throw Error('Help must not require timers')},MutationObserver:class{constructor(){throw Error('Help must not observe the body')}}};
 vm.runInNewContext(source,context);
 const fire=(events,type,event={})=>{for(const fn of events.get(type)||[])fn(event)};
 fire(documentEvents,'DOMContentLoaded');
 const event=(type,target,extra={})=>({type,target,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...extra});
 function dispatch(type,target,extra={}){const e=event(type,target,extra);for(let node=target;node;node=node.parentNode){for(const fn of node.events.get(type)||[])fn(e);if(e.stopped)return e}fire(documentEvents,type,e);return e}
 return{document,window,hosts,opens,closes,mutations,documentEvents,api:window.JRVXCASGuideV329,mountHosts,
  click:target=>dispatch('click',target),key:(target,key)=>dispatch('keydown',target,{key}),identity:()=>fire(documentEvents,'jrvx-cas-identity'),pageshow:()=>fire(windowEvents,'pageshow'),
  q:selector=>document.querySelector(selector),id:id=>document.getElementById(id)};
}

test('pure content export contains three immutable game guides without a DOM',()=>{
 assert.deepEqual(Object.keys(guides),['poker','blackjack','roulette']);assert.equal(Object.isFrozen(guides),true);for(const guide of Object.values(guides)){assert.equal(Object.isFrozen(guide),true);assert.equal(guide.sections.length,3);for(const section of guide.sections)assert.equal(Object.isFrozen(section.items),true)}
});
test('unknown mode names safely choose poker without prototype lookups',()=>{
 for(const key of ['unknown','constructor','__proto__',undefined])assert.equal(safeMode(key),'poker');assert.equal(safeMode('roulette'),'roulette');
});
test('content describes actual controls and pending confirmation without a winning promise',()=>{
 const text=guide=>guide.sections.flatMap(section=>section.items).join(' ');
 assert.match(text(guides.poker),/Фолд.*Чек.*Рейз/);assert.match(text(guides.poker),/Отмена.*без отправки/);
 assert.match(text(guides.blackjack),/Double.*Split.*Insurance/);assert.match(text(guides.blackjack),/подтверждения сервера/);
 assert.match(text(guides.roulette),/0.*не красный.*нечётное/);assert.match(text(guides.roulette),/выбор.*не запускает|Выбор.*не запускает/);assert.match(text(guides.roulette),/прежней ставке/);
 assert.doesNotMatch(JSON.stringify(guides),/гарантирован|без риска|стратегия побед|повысить шансы|AI|джекпот/i);
});
test('boot adds compact help to game headers and leaves the mode carousel untouched',()=>{
 const f=fixture();for(const mode of ['poker','blackjack','roulette']){const host=f.hosts.get('#'+mode+' .gamehead .actions'),button=host.querySelector('[data-jrvx-guide-open="'+mode+'"]');assert.equal(button.textContent,'?');assert.match(button.getAttribute('aria-label'),/Как играть/);assert.equal(host.children.length,2,'Legacy INFO remains intact')}
 const hub=f.id('v83ModesHub');assert.equal(hub.querySelector('.v83Header').children.length,0);assert.equal(hub.querySelector('[data-jrvx-guide-lobby]'),null);assert.equal(f.id('jrvxGameGuideV329'),null,'Guide content is lazy until opened');
});
test('repeated refresh, identity and pageshow do not duplicate help controls',()=>{
 const f=fixture();f.api.refresh();f.identity();f.pageshow();for(const host of f.hosts.values())assert.equal(host.children.length,2);assert.equal(f.id('v83ModesHub').querySelector('.v83Header').children.length,0);
});
test('seated poker retains its own help control when the legacy game header is hidden',()=>{
 const f=fixture();f.hosts.get('#poker .gamehead .actions').hidden=true;
 const host=f.hosts.get('#p59Game .p59GameBtns'),button=host.querySelector('[data-jrvx-guide-open="poker"]');
 assert.ok(button,'Seated controls must contain help independently of the gamehead');assert.equal(button.textContent,'?');assert.equal(button.getAttribute('aria-label'),'Как играть: Покер');
 f.click(button);assert.equal(f.opens.at(-1).options.opener,button);assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-poker');assert.equal(f.id('jrvxGuideContentV329-poker').hidden,false);
 f.api.refresh();f.pageshow();assert.equal(host.children.length,2,'Repeated route enhancement does not duplicate the seated control');assert.equal(f.mutations.length,0);
});
test('late rendered hosts can be enhanced through refresh and pageshow without observers or timers',()=>{
 const f=fixture({lateHosts:true});assert.equal(f.hosts.size,0);f.mountHosts();f.pageshow();assert.equal(f.hosts.get('#poker .gamehead .actions').children.length,2);f.api.refresh();assert.equal(f.hosts.get('#poker .gamehead .actions').children.length,2);
});
test('each contextual button opens the matching tab through the shared manager with its opener',()=>{
 const f=fixture();for(const mode of ['poker','blackjack','roulette']){const button=f.hosts.get('#'+mode+' .gamehead .actions').querySelector('[data-jrvx-guide-open="'+mode+'"]');assert.equal(f.click(button).prevented,true);const call=f.opens.at(-1);assert.equal(call.options.opener,button);assert.equal(call.options.initialFocus,f.id('jrvxGuideTabV329-'+mode));assert.equal(f.document.activeElement,call.options.initialFocus);assert.equal(f.id('jrvxGuideContentV329-'+mode).hidden,false)}assert.equal(f.mutations.length,0);
});
test('guide dialog has a labelled description and a close control for the shared manager',()=>{
 const f=fixture();f.api.open('blackjack');const panel=f.id('jrvxGameGuideV329'),dialog=panel.querySelector('[role="dialog"]');assert.equal(dialog.getAttribute('aria-modal'),'true');assert.equal(dialog.getAttribute('aria-labelledby'),'jrvxGuideTitleV329');assert.equal(dialog.getAttribute('aria-describedby'),'jrvxGuideDescriptionV329');assert.equal(panel.querySelector('[data-jrvx-panel-close]').getAttribute('aria-label'),'Закрыть справку');assert.equal(panel.hidden,false);
});
test('clicking a mode tab selects exactly one tabpanel and one tab stop',()=>{
 const f=fixture();f.api.open('poker');f.click(f.id('jrvxGuideTabV329-roulette'));
 for(const mode of ['poker','blackjack','roulette']){const selected=mode==='roulette';assert.equal(f.id('jrvxGuideTabV329-'+mode).getAttribute('aria-selected'),String(selected));assert.equal(f.id('jrvxGuideTabV329-'+mode).tabIndex,selected?0:-1);assert.equal(f.id('jrvxGuideContentV329-'+mode).hidden,!selected)}assert.equal(f.opens.length,1,'Tab changes do not open nested dialogs');
});
test('ArrowLeft and ArrowRight wrap tabs while Home and End select their edges',()=>{
 const f=fixture();f.api.open('poker');const press=key=>{const e=f.key(f.document.activeElement,key);assert.equal(e.prevented,true);assert.equal(e.stopped,true)};
 press('ArrowLeft');assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-roulette');press('ArrowRight');assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-poker');press('End');assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-roulette');press('Home');assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-poker');press('ArrowRight');assert.equal(f.document.activeElement.id,'jrvxGuideTabV329-blackjack');
});
test('tab changes reset the content scroll position and preserve the dialog instance',()=>{
 const f=fixture();f.api.open('poker');const panel=f.id('jrvxGameGuideV329'),body=panel.querySelector('.jrvxGuideBodyV329');body.scrollTop=700;f.click(f.id('jrvxGuideTabV329-blackjack'));assert.equal(body.scrollTop,0);f.api.open('roulette');assert.equal(f.id('jrvxGameGuideV329'),panel);assert.equal(f.document.body.descendants().filter(node=>node.id==='jrvxGameGuideV329').length,1);
});
test('help does not install a global key handler or consume Escape and Tab intended for shared panels',()=>{
 const f=fixture();f.api.open('poker');for(const key of ['Escape','Tab','Enter'])assert.equal(f.key(f.document.activeElement,key).prevented,false);assert.equal(f.documentEvents.has('keydown'),false);assert.equal(f.mutations.length,0);
});
test('close delegates to the shared panel manager and does not alter game state',()=>{
 const f=fixture();f.api.open('roulette');const panel=f.id('jrvxGameGuideV329');f.api.close();assert.deepEqual(f.closes,[panel]);assert.equal(panel.hidden,true);assert.equal(f.mutations.length,0);
});
test('missing shared manager leaves no inaccessible open overlay',()=>{
 const f=fixture({manager:false});assert.equal(f.api.open('roulette'),false);assert.equal(f.id('jrvxGameGuideV329'),null);assert.doesNotThrow(()=>f.api.close());assert.equal(f.mutations.length,0);
});
