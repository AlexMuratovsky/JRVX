const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(process.env.JRVX_CONNECTION_SOURCE||path.join(__dirname,'../public/modules/ui/runtime/connection-v329.js'),'utf8');
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return{promise,resolve,reject}};
function fixture({loading=false,seated=false}={}){
 const ids=new Map(),timers=new Map(),events={document:new Map(),window:new Map()},calls={identity:0,account:0,financial:0},opened=[];
 let timerId=0;
 function listen(surface,name,fn,options={}){if(options.signal?.aborted)return;if(!events[surface].has(name))events[surface].set(name,[]);const record={fn,once:options.once};events[surface].get(name).push(record);options.signal?.addEventListener('abort',()=>{const list=events[surface].get(name)||[];events[surface].set(name,list.filter(item=>item!==record))},{once:true})}
 function fire(surface,name,event={}){for(const record of [...events[surface].get(name)||[]]){record.fn(event);if(record.once)events[surface].set(name,events[surface].get(name).filter(item=>item!==record))}}
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.children=[];this.parent=null;this._id='';this._html='';this.hidden=false;this.disabled=false;this.textContent='';this.className='';this.type='';this.isConnected=false}
  set id(value){if(this._id)ids.delete(this._id);this._id=value;if(value)ids.set(value,this)}get id(){return this._id}
  setAttribute(name,value){this.attrs[name]=String(value)}getAttribute(name){return this.attrs[name]??null}
  appendChild(node){node.parent=this;node.isConnected=true;this.children.push(node);return node}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.isConnected=false;if(this.id)ids.delete(this.id);for(const child of this.children)child.remove()}
  set innerHTML(value){this._html=value;for(const match of value.matchAll(/<(\w+)\b([^>]*)>/g)){const id=match[2].match(/\bid="([^"]+)"/);if(!id)continue;const node=new Element(match[1]);node.id=id[1];for(const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g))node.setAttribute(attr[1],attr[2]);this.appendChild(node)}}get innerHTML(){return this._html}
  querySelector(selector){if(selector==='[data-jrvx-connection-open]')return this.children.find(child=>Object.hasOwn(child.attrs,'data-jrvx-connection-open'))||null;return null}
  closest(selector){if(selector==='[data-jrvx-connection-open]'&&Object.hasOwn(this.attrs,'data-jrvx-connection-open'))return this;if(selector==='#jrvxConnectionRetryV329'&&this.id==='jrvxConnectionRetryV329')return this;return this.parent?.closest(selector)||null}
  focus(){document.activeElement=this}
 }
 const lobby=new Element(),pokerControls=new Element(),games=seated?[]:[new Element(),new Element(),new Element()],body=new Element('body');body.isConnected=true;
 const document={readyState:loading?'loading':'complete',hidden:false,visibilityState:'visible',body,activeElement:body,
  createElement:tag=>new Element(tag),getElementById:id=>ids.get(id)||null,querySelector:selector=>selector==='#v69Home .v103TopRight'?lobby:selector==='#p59Game .p59GameBtns'?pokerControls:null,querySelectorAll:selector=>selector==='.gamehead .actions'?games:[],addEventListener:(name,fn,options)=>listen('document',name,fn,options)};
 const navigator={onLine:true};
 const auth={ready:true,mode:'production',requiresAuthentication:true,authenticated:true,user:{id:'A'},networkVerified:true,networkError:''};
 const net={connected:false,transportConnected:false,handshakeReady:false};
 const window={JRVXCASIdentityV300:{state:()=>({...auth}),refresh:async()=>{calls.identity++;return{...auth}}},
  JRVXCASServerAccount:{refresh:async()=>{calls.account++;return{ok:true}}},arcadeNetState:net,
  arcadeNetConnect(){calls.financial++;throw Error('Connection UI must not call connect directly')},arcadeNetSend(){calls.financial++;throw Error('Connection UI must not send gameplay commands')},
  JRVXCASPanelsV329:{open(root,options){root.hidden=false;opened.push({root,options});options.initialFocus?.focus()},close(root){root.hidden=true}},addEventListener:(name,fn,options)=>listen('window',name,fn,options)};
 const context=vm.createContext({window,document,navigator,console,AbortController,Date,Promise,Error,
  setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout:id=>timers.delete(id),fetch(){calls.financial++;throw Error('Direct network access is forbidden')}});
 vm.runInContext(source,context);
 return{window,document,navigator,auth,net,calls,timers,events,ids,opened,lobby,games,pokerControls,api:window.JRVXCASConnectionV329,
  fireDocument:(name,event)=>fire('document',name,event),fireWindow:(name,event)=>fire('window',name,event),
  click(node){fire('document','click',{target:node,preventDefault(){}})},
  runTimer(ms){const item=[...timers].find(([,timer])=>timer.ms===ms);assert.ok(item,'Expected '+ms+'ms timer');timers.delete(item[0]);item[1].fn()}
 };
}

test('offline state takes priority over stale confirmed network flags',()=>{
 const f=fixture();Object.assign(f.net,{connected:true,handshakeReady:true});f.navigator.onLine=false;
 assert.equal(f.api.state().kind,'offline');assert.equal(f.api.state().confirmed,false);
});
test('a confirmed state requires ready authenticated identity plus both connection flags',()=>{
 const f=fixture();for(const [connected,handshakeReady]of[[false,false],[true,false],[false,true]]){Object.assign(f.net,{connected,handshakeReady});assert.equal(f.api.state().confirmed,false)}
 Object.assign(f.net,{connected:true,handshakeReady:true});assert.equal(f.api.state().confirmed,true);
 f.auth.ready=false;assert.equal(f.api.state().kind,'checking');assert.equal(f.api.state().confirmed,false);
 f.auth.ready=true;f.auth.authenticated=false;f.auth.user=null;assert.equal(f.api.state().kind,'auth');assert.equal(f.api.state().confirmed,false);
});
test('an explicitly unverified or rejected identity cannot reuse old green connection flags',()=>{
 const f=fixture();Object.assign(f.net,{connected:true,handshakeReady:true});f.auth.networkVerified=false;assert.equal(f.api.state().kind,'connecting');assert.equal(f.api.state().confirmed,false);
 f.auth.networkVerified=true;f.auth.networkError='stale session';assert.equal(f.api.state().confirmed,false);
 delete f.auth.networkVerified;f.auth.networkError='';assert.equal(f.api.state().confirmed,true,'Older APIs may omit the optional verification field');
});
test('connecting, disconnected and explicit local mode remain distinguishable',()=>{
 const f=fixture();assert.equal(f.api.state().kind,'disconnected');f.net.transportConnected=true;assert.equal(f.api.state().kind,'connecting');
 f.auth.requiresAuthentication=false;f.auth.authenticated=false;f.auth.user=null;f.net.transportConnected=false;assert.equal(f.api.state().kind,'local');
});
test('one compact launcher is inserted into each existing host without a second topbar or duplicate button',()=>{
 const f=fixture();f.api.sync();f.api.sync();assert.equal(f.lobby.children.length,1);assert.deepEqual(f.games.map(host=>host.children.length),[1,1,1]);
 for(const host of f.games)assert.match(host.children[0].className,/jrvxGameUtilityV329/);
 const button=f.lobby.children[0];assert.equal(button.getAttribute('aria-haspopup'),'dialog');assert.equal(button.getAttribute('aria-controls'),'jrvxConnectionPanelV329');assert.match(button.getAttribute('aria-label'),/Нет связи/);
 Object.assign(f.net,{connected:true,handshakeReady:true});f.api.sync();assert.equal(button.getAttribute('data-connection'),'confirmed');assert.equal(f.timers.size,1);
});
test('opening the connection center delegates focus and dismissal to the shared panel manager',()=>{
 const f=fixture(),trigger=f.games[1].children[0];f.click(trigger);assert.equal(f.opened.length,1);const {root,options}=f.opened[0];
 assert.equal(root.id,'jrvxConnectionPanelV329');assert.equal(root.hidden,false);assert.equal(options.opener,trigger);assert.equal(options.initialFocus.id,'jrvxConnectionCloseV329');assert.equal(f.document.activeElement,options.initialFocus);
 assert.equal(f.events.document.has('keydown'),false);assert.equal(f.events.window.has('keydown'),false);
 assert.match(root.innerHTML,/Проверка связи не подтверждает результат незавершённой игры/);
});
test('seated poker retains a compact connection launcher in the visible table controls without game headers',()=>{
 const f=fixture({seated:true});f.api.sync();f.api.sync();assert.equal(f.games.length,0);assert.equal(f.pokerControls.children.length,1);
 const button=f.pokerControls.children[0];assert.match(button.className,/jrvxGameUtilityV329/);assert.equal(button.disabled,false);f.click(button);assert.equal(f.opened.length,1);assert.equal(f.opened[0].options.opener,button);
});
test('the open API reports shared-manager rejection without claiming a panel was opened',()=>{
 const f=fixture();f.window.JRVXCASPanelsV329.open=()=>false;assert.equal(f.api.open(),false);assert.equal(f.ids.get('jrvxConnectionPanelV329').hidden,true);assert.equal(f.opened.length,0);
});
test('recovery is deduplicated, reads identity then account, and never sends a financial or direct network command',async()=>{
 const f=fixture(),identity=deferred();f.window.JRVXCASIdentityV300.refresh=()=>{f.calls.identity++;return identity.promise};
 const first=f.api.recover(),second=f.api.recover();assert.equal(first,second);assert.equal(f.api.state().busy,true);await tick();assert.equal(f.calls.identity,1);assert.equal(f.calls.account,0);
 Object.assign(f.net,{connected:true,handshakeReady:true});identity.resolve();assert.equal(await first,true);assert.equal(f.calls.account,1);assert.equal(f.calls.financial,0);assert.equal(f.api.state().busy,false);assert.match(f.api.state().feedback,/Соединение подтверждено/);assert.ok(f.api.state().checkedAt>0);
});
test('a read-only refresh cannot claim connection or uncertain game settlement without the actual handshake',async()=>{
 const f=fixture();assert.equal(await f.api.recover(),false);assert.equal(f.calls.identity,1);assert.equal(f.calls.account,1);assert.equal(f.api.state().confirmed,false);assert.doesNotMatch(f.api.state().feedback,/ставка подтверждена|игра завершена|Соединение подтверждено/);
});
test('a successful recovery loses its success feedback and green tone immediately on an offline event',async()=>{
 const f=fixture();Object.assign(f.net,{connected:true,handshakeReady:true});f.api.open();assert.equal(await f.api.recover(),true);
 const output=f.ids.get('jrvxConnectionFeedbackV329');assert.equal(output.textContent,'Соединение подтверждено.');assert.equal(output.getAttribute('data-tone'),'ok');
 f.navigator.onLine=false;f.fireWindow('offline');assert.equal(f.api.state().kind,'offline');assert.equal(f.api.state().confirmed,false);assert.equal(f.api.state().feedback,'');assert.equal(output.textContent,'');assert.equal(output.getAttribute('data-tone'),'');assert.equal(f.ids.get('jrvxConnectionStateV329').textContent,'Нет интернета');
});
test('same-owner handshake loss cannot retain successful recovery text or a green feedback tone',async()=>{
 const f=fixture();Object.assign(f.net,{connected:true,handshakeReady:true,transportConnected:true});f.api.open();assert.equal(await f.api.recover(),true);const checkedAt=f.api.state().checkedAt;
 f.net.handshakeReady=false;assert.equal(f.api.state().feedback,'','The read-only state API must already reflect the current connection');f.api.sync();
 assert.equal(f.auth.user.id,'A');assert.equal(f.api.state().kind,'connecting');assert.equal(f.api.state().confirmed,false);assert.equal(f.api.state().checkedAt,checkedAt);assert.equal(f.ids.get('jrvxConnectionFeedbackV329').textContent,'');assert.equal(f.ids.get('jrvxConnectionFeedbackV329').getAttribute('data-tone'),'');assert.equal(f.ids.get('jrvxConnectionStateV329').textContent,'Подключаемся');
});
test('offline, hidden or missing identity APIs perform no recovery request',async()=>{
 const f=fixture();f.navigator.onLine=false;assert.equal(await f.api.recover(),false);f.navigator.onLine=true;f.document.hidden=true;assert.equal(await f.api.recover(),false);f.document.hidden=false;delete f.window.JRVXCASIdentityV300.refresh;assert.equal(await f.api.recover(),false);assert.equal(f.calls.identity,0);assert.equal(f.calls.account,0);
});
test('signed-out recovery reads identity but does not request another account snapshot',async()=>{
 const f=fixture();f.auth.authenticated=false;f.auth.user=null;assert.equal(await f.api.recover(),false);assert.equal(f.calls.identity,1);assert.equal(f.calls.account,0);assert.match(f.api.state().feedback,/нужен вход/);
});
test('a stalled identity refresh times out and its late response cannot start a second request',async()=>{
 const f=fixture(),pending=deferred();f.window.JRVXCASIdentityV300.refresh=()=>{f.calls.identity++;return pending.promise};const promise=f.api.recover();await tick();f.runTimer(12000);
 assert.equal(await promise,false);assert.equal(f.api.state().busy,false);assert.match(f.api.state().feedback,/слишком долго/);pending.resolve();await tick();assert.equal(f.calls.account,0);assert.equal([...f.timers.values()].filter(timer=>timer.ms===12000).length,0);
});
test('identity changes invalidate a pending recovery without displaying the former owner result',async()=>{
 const f=fixture(),pending=deferred();f.window.JRVXCASIdentityV300.refresh=()=>{f.calls.identity++;return pending.promise};const promise=f.api.recover();await tick();f.auth.user={id:'B'};f.fireDocument('jrvx-cas-identity');assert.equal(await promise,false);pending.resolve();await tick();assert.equal(f.calls.account,0);assert.equal(f.api.state().feedback,'');assert.equal(f.api.state().checkedAt,0);
});
test('hiding the page stops the visible-only poll and fences the remaining recovery chain',async()=>{
 const f=fixture(),pending=deferred();f.window.JRVXCASIdentityV300.refresh=()=>pending.promise;const promise=f.api.recover();await tick();f.document.hidden=true;f.document.visibilityState='hidden';f.fireDocument('visibilitychange');assert.equal(await promise,false);assert.equal(f.timers.size,0);pending.resolve();await tick();assert.equal(f.calls.account,0);
 f.document.hidden=false;f.document.visibilityState='visible';f.fireDocument('visibilitychange');assert.equal(f.timers.size,1);f.runTimer(2500);assert.equal(f.timers.size,1);
});
test('pagehide suppresses polling even before document.hidden changes and pageshow resumes it once',()=>{
 const f=fixture();f.fireWindow('pagehide');assert.equal(f.timers.size,0);f.api.sync();assert.equal(f.timers.size,0);f.fireWindow('pageshow');assert.equal(f.timers.size,1);f.fireWindow('pageshow');assert.equal(f.timers.size,1);
});
test('refresh rejection is recoverable, releases the button and leaves no deadline timer',async()=>{
 const f=fixture();f.window.JRVXCASIdentityV300.refresh=async()=>{throw Error('offline')};assert.equal(await f.api.recover(),false);assert.match(f.api.state().feedback,/Не удалось/);assert.equal(f.api.state().busy,false);assert.equal([...f.timers.values()].some(timer=>timer.ms===12000),false);
 f.window.JRVXCASIdentityV300.refresh=async()=>{};assert.equal(await f.api.recover(),false);assert.equal(f.calls.account,1);
});
test('destroy is idempotent, removes owned UI, listeners and timers, and prevents late reads',async()=>{
 const f=fixture(),pending=deferred();f.api.open();f.window.JRVXCASIdentityV300.refresh=()=>pending.promise;const promise=f.api.recover();await tick();f.api.destroy();f.api.destroy();assert.equal(await promise,false);pending.resolve();await tick();assert.equal(f.calls.account,0);assert.equal(f.timers.size,0);assert.equal(f.lobby.children.length,0);assert.deepEqual(f.games.map(host=>host.children.length),[0,0,0]);assert.equal(f.pokerControls.children.length,0);assert.equal(f.ids.has('jrvxConnectionPanelV329'),false);for(const surface of Object.values(f.events))for(const records of surface.values())assert.equal(records.length,0);assert.equal(f.api.open(),false);assert.equal(await f.api.recover(),false);
});
test('destroy before DOMContentLoaded cannot initialize buttons or polling later',()=>{
 const f=fixture({loading:true});f.api.destroy();f.fireDocument('DOMContentLoaded');assert.equal(f.lobby.children.length,0);assert.equal(f.timers.size,0);
});
module.exports={fixture,tick,deferred};
