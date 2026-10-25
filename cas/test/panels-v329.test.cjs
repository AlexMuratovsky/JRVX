const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/ui/runtime/panels-v329.js'),'utf8');
function fixture(){
 const nodes=new Map(),modals=[],window=new EventTarget(),document=new EventTarget();
 function node(id,{parent=null,button=false,modal=false,close=false,hidden=false}={}){
  const classes=new Set(),listeners=new Map(),n={id,tagName:button?'BUTTON':'DIV',parent,children:[],button,modal,close,hidden,disabled:false,isConnected:true,style:{visibility:'visible',display:'block'},attrs:{},
   addEventListener(type,fn,options={}){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);options.signal?.addEventListener('abort',()=>listeners.get(type)?.delete(fn),{once:true})},
   emit(type,event){for(const fn of listeners.get(type)||[])fn(event)},
   classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),contains:key=>classes.has(key)},
   setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]??null},
   getClientRects(){for(let p=this;p;p=p.parent)if(p.hidden||!p.isConnected||p.style.display==='none')return[];return[{width:100,height:40}]},
   contains(value){for(let p=value;p;p=p.parent)if(p===this)return true;return false},
   closest(selector){for(let p=this;p;p=p.parent)if(selector==='[data-jrvx-panel-close]'&&p.close)return p;return null},
   querySelectorAll(selector){const list=[];const walk=p=>{for(const c of p.children){if(c.button&&!c.disabled||c.attrs.tabindex!==undefined&&c.attrs.tabindex!=='-1')list.push(c);walk(c)}};walk(this);return list},
   querySelector(selector){const all=[];const walk=p=>{for(const c of p.children){all.push(c);walk(c)}};walk(this);return all.find(c=>selector==='[data-jrvx-panel-close]'?c.close:selector==='[role="dialog"]'?c.modal:selector==='#'+c.id)||null},
   focus(){if(!this.disabled&&this.getClientRects().length&&this.style.visibility!=='hidden')document.activeElement=this},
   blur(){if(document.activeElement===this)document.activeElement=document.body}
  };if(parent)parent.children.push(n);if(modal){n.setAttribute('aria-modal','true');n.setAttribute('role','dialog');modals.push(n)}nodes.set(id,n);return n;
 }
 document.body=node('body');document.activeElement=document.body;document.getElementById=id=>nodes.get(id)||null;document.querySelectorAll=selector=>selector==='[aria-modal="true"]'?modals:[];
 window.getComputedStyle=n=>n.style;
 const opener=node('opener',{parent:document.body,button:true});
 const makePanel=id=>{const root=node(id,{parent:document.body,hidden:true}),card=node(id+'Card',{parent:root,modal:true}),close=node(id+'Close',{parent:card,button:true,close:true}),last=node(id+'Last',{parent:card,button:true});return{root,card,close,last}};
 const a=makePanel('a'),b=makePanel('b');
 const context=vm.createContext({window,document,AbortController,console});vm.runInContext(source,context);const api=window.JRVXCASPanelsV329;
 const key=(value,shiftKey=false)=>{const event=new Event('keydown',{cancelable:true});Object.defineProperties(event,{key:{value},shiftKey:{value:shiftKey}});window.dispatchEvent(event);return event};
 const click=target=>{const event=new Event('click');Object.defineProperty(event,'target',{value:target});document.dispatchEvent(event)};
 const typeAt=(target,key,legacy)=>{target.focus();const event={target,key,defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true},stopPropagation(){this.stopped=true}};for(let element=target;element;element=element.parent){element.emit('keydown',event);if(event.stopped)break}if(!event.stopped)legacy?.(event);return event};
 return{window,document,nodes,node,opener,a,b,api,key,click,typeAt,reload:()=>vm.runInContext(source,context)};
}
test('opening a panel shows it, locks page scroll and focuses its close control',()=>{
 const f=fixture();f.opener.focus();assert.equal(f.api.open(f.a.root),true);assert.equal(f.a.root.hidden,false);assert.equal(f.a.root.getAttribute('aria-hidden'),'false');assert.equal(f.document.activeElement,f.a.close);assert.equal(f.document.body.classList.contains('jrvxPanelOpenV329'),true);
});
test('Escape closes only the active panel and restores the original opener',()=>{
 const f=fixture();let callbacks=0,otherKeys=0;f.window.addEventListener('keydown',()=>otherKeys++);f.api.open('a',{opener:f.opener,onClose:()=>callbacks++});const event=f.key('Escape');assert.equal(event.defaultPrevented,true);assert.equal(otherKeys,0);assert.equal(callbacks,1);assert.equal(f.api.active(),null);assert.equal(f.document.activeElement,f.opener);assert.equal(f.a.root.hidden,true);
});
test('Tab and Shift+Tab wrap at boundaries while normal internal Tab is left to the browser',()=>{
 const f=fixture();f.api.open(f.a.root);assert.equal(f.key('Tab').defaultPrevented,false);f.a.last.focus();assert.equal(f.key('Tab').defaultPrevented,true);assert.equal(f.document.activeElement,f.a.close);assert.equal(f.key('Tab',true).defaultPrevented,true);assert.equal(f.document.activeElement,f.a.last);
});
test('Tab recovers escaped focus without leaving the active panel',()=>{
 const f=fixture();f.api.open(f.a.root);f.opener.focus();f.key('Tab');assert.equal(f.document.activeElement,f.a.close);f.opener.focus();f.key('Tab',true);assert.equal(f.document.activeElement,f.a.last);
});
test('panel handoff keeps the original outside opener and closes the former panel once',()=>{
 const f=fixture();let closed=0;f.api.open(f.a.root,{opener:f.opener,onClose:()=>closed++});f.a.last.focus();f.api.open(f.b.root,{opener:f.a.last});assert.equal(closed,1);assert.equal(f.a.root.hidden,true);assert.equal(f.b.root.hidden,false);f.api.close(f.b.root);assert.equal(f.document.activeElement,f.opener);
});
test('duplicate opens do not replace the opener or steal focus back from a control',()=>{
 const f=fixture();f.api.open(f.a.root,{opener:f.opener});f.a.last.focus();assert.equal(f.api.open(f.a.root,{opener:f.a.last}),true);assert.equal(f.document.activeElement,f.a.last);f.api.close(f.a.root);assert.equal(f.document.activeElement,f.opener);
});
test('close button and backdrop close the current panel but other interior clicks do not',()=>{
 const f=fixture();f.api.open(f.a.root);f.click(f.a.last);assert.equal(f.api.active(),f.a.root);f.click(f.a.close);assert.equal(f.api.active(),null);f.api.open(f.a.root);f.click(f.a.root);assert.equal(f.api.active(),null);
});
test('a removed opener never leaves focus in the now-hidden panel',()=>{
 const f=fixture();f.api.open(f.a.root,{opener:f.opener});f.opener.isConnected=false;f.api.close(f.a.root);assert.equal(f.document.activeElement,f.document.body);assert.equal(f.document.body.classList.contains('jrvxPanelOpenV329'),false);
});
test('a visible external modal blocks opening over an existing confirmation',()=>{
 const f=fixture(),external=f.node('external',{parent:f.document.body,modal:true});assert.equal(f.api.open(f.a.root),false);assert.equal(f.a.root.hidden,true);external.hidden=true;assert.equal(f.api.open(f.a.root),true);
});
test('visibility-hidden, disabled and aria-disabled focus candidates are skipped',()=>{
 const f=fixture();f.a.close.style.visibility='hidden';f.a.last.disabled=true;const extra=f.node('extra',{parent:f.a.card,button:true});extra.setAttribute('aria-disabled','true');assert.equal(f.api.open(f.a.root,{initialFocus:f.a.close}),true);assert.equal(f.document.activeElement,f.a.card);assert.equal(f.key('Tab').defaultPrevented,true);
});
test('pagehide closes a panel without restoring background focus or reopening it',()=>{
 const f=fixture();f.api.open(f.a.root,{opener:f.opener});f.window.dispatchEvent(new Event('pagehide'));assert.equal(f.api.active(),null);assert.equal(f.a.root.hidden,true);assert.equal(f.document.activeElement,f.document.body);f.window.dispatchEvent(new Event('pageshow'));assert.equal(f.api.active(),null);
});
test('destroy removes owned listeners, is idempotent and permits a fresh controller',()=>{
 const f=fixture();let closed=0;f.api.open(f.a.root,{onClose:()=>closed++});f.api.destroy();f.api.destroy();assert.equal(closed,1);assert.equal(f.api.open(f.b.root),false);assert.equal(f.window.JRVXCASPanelsV329,undefined);f.key('Escape');f.reload();assert.equal(f.window.JRVXCASPanelsV329.open(f.b.root),true);
});
test('panel keyboard isolation blocks the actual retained poker f/c/r handlers without cancelling native keys',()=>{
 const bindLegacy=require('./fixtures/poker-v84-hotkeys.cjs'),f=fixture(),clicks=[];let legacy;
 const poker=f.node('poker');poker.classList.add('active');const ids={poker,p59Fold:{click:()=>clicks.push('fold')},p59Call:{click:()=>clicks.push('call')},p59Raise:{click:()=>clicks.push('raise')}};
 bindLegacy({addEventListener(type,handler,options){assert.equal(type,'keydown');assert.equal(options.passive,true);assert.notEqual(options.capture,true);legacy=handler}},id=>ids[id]);
 for(const key of ['f','c','r'])legacy({key,target:{tagName:'BUTTON'}});assert.deepEqual(clicks,['fold','call','raise']);clicks.length=0;
 f.api.open(f.a.root);for(const key of ['f','c','r','Enter',' ']){const event=f.typeAt(f.a.close,key,legacy);assert.equal(event.stopped,true);assert.equal(event.defaultPrevented,false)}assert.deepEqual(clicks,[]);
});
test('escaped programmatic focus cannot pass a game shortcut through the active panel controller',()=>{
 const f=fixture();let legacy=0;f.api.open(f.a.root);f.opener.focus();f.window.addEventListener('keydown',()=>legacy++);const event=f.key('c');assert.equal(event.defaultPrevented,true);assert.equal(legacy,0);assert.equal(f.document.activeElement,f.a.close);
});
