const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/modules/ui/runtime/roulette-picker-v331.js'),'utf8');

function pickerFixture({columns=7,selection={type:'exact',numbers:[17],label:'Число 17',mult:36}}={}){
 const nodes=new Map(),frames=[],observers=[],mutations=[],events=new Map(),sourceClicks=[];
 let renderedColumns=columns,spinCalls=0;
 const document={readyState:'complete',activeElement:null,getElementById:id=>nodes.get(id)||null,
  createElement:tag=>new Node(tag),addEventListener:(name,fn)=>events.set(name,fn)};
 const all=root=>root.children.flatMap(child=>[child,...all(child)]);
 function matches(node,selector){
  if(selector.startsWith('#'))return node.id===selector.slice(1);
  if(selector.startsWith('button')&&node.tagName!=='BUTTON')return false;
  if(selector.includes(':not(:disabled)')&&node.disabled)return false;
  const attr=selector.match(/\[data-([a-z-]+)(?:="([^"]*)")?\]/);
  if(attr){const key=attr[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return key in node.dataset&&(attr[2]===undefined||node.dataset[key]===attr[2])}
  return selector==='button'||selector==='button:not(:disabled)';
 }
 class Node{
  constructor(tag='div',id='',dataset={}){this.tagName=tag.toUpperCase();this.id=id;this.dataset=dataset;this.children=[];this.parentNode=null;this.attributes=new Map();this.listeners=new Map();this.textContent='';this.value='';this.hidden=false;this.isConnected=true;this.tabIndex=this.tagName==='BUTTON'?0:-1;this.classes=new Set();this.classList={contains:name=>this.classes.has(name),add:name=>this.classes.add(name),remove:name=>this.classes.delete(name)};if(id)nodes.set(id,this)}
  set innerHTML(html){this.children=[];for(const match of html.matchAll(/<([a-z]+)\b[^>]*\bid="([^"]+)"[^>]*>/g))this.appendChild(new Node(match[1],match[2]));}
  get innerHTML(){return''}
  appendChild(child){this.children.push(child);child.parentNode=this;if(child.id)nodes.set(child.id,child);return child}
  get disabled(){return this.attributes.has('disabled')}
  set disabled(value){if(value)this.setAttribute('disabled','');else this.removeAttribute('disabled')}
  getAttribute(name){return this.attributes.get(name)??null}
  setAttribute(name,value){this.attributes.set(name,String(value));mutations.push({target:this,attributeName:name});if(name==='tabindex')this.tabIndex=Number(value)}
  removeAttribute(name){if(this.attributes.delete(name))mutations.push({target:this,attributeName:name})}
  contains(node){for(let current=node;current;current=current.parentNode)if(current===this)return true;return false}
  querySelectorAll(selector){return selector.split(',').flatMap(part=>{part=part.trim();const descendant=part.match(/^(#[\w-]+)\s+(.+)$/);if(descendant){const base=all(this).find(n=>matches(n,descendant[1]));return base?base.querySelectorAll(descendant[2]):[]}return all(this).filter(node=>matches(node,part))})}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null}
  closest(selector){for(let current=this;current;current=current.parentNode)if(matches(current,selector))return current;return null}
  addEventListener(name,fn){this.listeners.set(name,fn)}
  focus(){if(this.disabled)return;document.activeElement=this;this.onfocus?.()}
  blur(){if(document.activeElement===this)document.activeElement=document.body}
  click(){if(!this.disabled)this.onclick?.({target:this})}
  getBoundingClientRect(){const index=Number(this.dataset.pickNumber),left=index%renderedColumns*48,top=Math.floor(index/renderedColumns)*40;return{left,right:left+44,top,bottom:top+36}}
 }
 document.body=new Node('body','body');
 document.querySelectorAll=selector=>document.body.querySelectorAll(selector);
 const root=document.body.appendChild(new Node('div','roulette'));root.classes.add('active');
 const selectors=root.appendChild(new Node('div','jrvxRouletteSelectors'));
 const spin=root.appendChild(new Node('button','rouletteSpin'));spin.onclick=()=>spinCalls++;
 root.appendChild(new Node('input','rouletteBetInput')).value='50';
 const numberHost=root.appendChild(new Node('div','rouletteNumbers'));
 const state={mode:'straight',splitAxis:'horizontal',selection};
 const mainNumbers=Array.from({length:37},(_,n)=>{const b=numberHost.appendChild(new Node('button','',{number:String(n)}));b.onclick=()=>{sourceClicks.push(n);state.selection={type:'exact',numbers:[n],label:'Число '+n,mult:36}};return b});
 const ctx={document,window:{JRVXCASV220:{roulette:{state}}},requestAnimationFrame:fn=>frames.push(fn),
  MutationObserver:class{constructor(fn){this.fn=fn}observe(target,options){observers.push({fn:this.fn,target,options})}}};
 vm.runInNewContext(source,ctx);
 function flush(){for(let turn=0;turn<10;turn++){const batch=mutations.splice(0);for(const o of observers)if(batch.some(m=>o.target.contains(m.target)&&o.options.attributeFilter.includes(m.attributeName)))o.fn();if(!frames.length)return;frames.splice(0).forEach(fn=>fn())}throw Error('Mutation loop')}
 flush();
 const pickerNumbers=()=>nodes.get('jrvxPickerNumbers').querySelectorAll('button[data-pick-number]');
 function key(key,options={}){const event={key,target:document.activeElement,prevented:false,stopped:false,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true},...options};nodes.get('jrvxRoulettePicker').listeners.get('keydown')(event);return event}
 function open(){nodes.get('jrvxRoulettePickerOpen').focus();nodes.get('jrvxRoulettePickerOpen').click();flush()}
 return{nodes,root,spin,selectors,state,mainNumbers,document,sourceClicks,key,open,flush,pickerNumbers,
  focusNumber(n){pickerNumbers()[n].focus()},number:n=>pickerNumbers()[n],
  sync(){events.get('jrvx-cas-identity')();flush()},columns(value){renderedColumns=value},get spinCalls(){return spinCalls}};
}

const focusNumber=f=>Number(f.document.activeElement.dataset.pickNumber);
const tabbableNumbers=f=>f.pickerNumbers().filter(b=>b.tabIndex===0);

test('opening focuses the selected number and adds one number to the tab order',()=>{
 const f=pickerFixture();f.open();assert.equal(focusNumber(f),17);assert.deepEqual(tabbableNumbers(f).map(b=>b.dataset.pickNumber),['17']);
 assert.equal(f.number(17).getAttribute('aria-pressed'),'true');assert.equal(f.sourceClicks.length,0);assert.equal(f.spinCalls,0);
});

test('outside selections enter at zero and valid zero selection remains keyboard reachable',()=>{
 for(const selection of [{type:'red',numbers:[],label:'Красное',mult:2},{type:'exact',numbers:[0],label:'Число 0',mult:36}]){
  const f=pickerFixture({selection});f.open();assert.equal(focusNumber(f),0);assert.equal(tabbableNumbers(f).length,1);
 }
});

test('arrows follow the rendered seven-column grid without choosing or spinning',()=>{
 const f=pickerFixture();f.open();
 for(const [key,number]of [['ArrowRight',18],['ArrowDown',25],['ArrowLeft',24],['ArrowUp',17]]){const event=f.key(key);assert.equal(event.prevented,true);assert.equal(event.stopped,true);assert.equal(focusNumber(f),number);assert.equal(tabbableNumbers(f).length,1)}
 assert.deepEqual(f.sourceClicks,[]);assert.deepEqual(f.state.selection.numbers,[17]);assert.equal(f.spinCalls,0);
});

test('responsive landscape navigation reads thirteen columns after resize',()=>{
 const f=pickerFixture();f.open();f.columns(13);f.key('ArrowDown');assert.equal(focusNumber(f),30);f.key('ArrowUp');assert.equal(focusNumber(f),17);assert.equal(f.sourceClicks.length,0);
});

test('row and incomplete-final-row boundaries do not wrap or move diagonally',()=>{
 const f=pickerFixture();f.open();f.focusNumber(6);f.key('ArrowRight');assert.equal(focusNumber(f),6);f.focusNumber(7);f.key('ArrowLeft');assert.equal(focusNumber(f),7);
 f.focusNumber(34);f.key('ArrowDown');assert.equal(focusNumber(f),34);f.focusNumber(0);f.key('ArrowUp');assert.equal(focusNumber(f),0);
});

test('Home and End focus first and last enabled numbers and skip disabled source fields',()=>{
 const f=pickerFixture();f.mainNumbers[0].disabled=true;f.mainNumbers[36].disabled=true;f.sync();f.open();f.key('Home');assert.equal(focusNumber(f),1);f.key('End');assert.equal(focusNumber(f),35);
 f.focusNumber(17);f.mainNumbers[18].disabled=true;f.sync();f.key('ArrowRight');assert.equal(focusNumber(f),19);assert.equal(f.number(18).disabled,true);assert.equal(f.number(18).tabIndex,-1);
});

test('a refreshed disabled focused field transfers focus to the surviving number tab stop',()=>{
 const f=pickerFixture();f.open();f.mainNumbers[17].disabled=true;f.flush();assert.equal(focusNumber(f),0);assert.equal(f.document.activeElement.disabled,false);assert.deepEqual(tabbableNumbers(f).map(b=>b.dataset.pickNumber),['0']);assert.equal(f.sourceClicks.length,0);
});

test('with no enabled number fields the opener focuses Close instead of leaving focus outside the dialog',()=>{
 const f=pickerFixture();f.mainNumbers.forEach(b=>b.disabled=true);f.flush();f.open();assert.equal(tabbableNumbers(f).length,0);assert.equal(f.document.activeElement,f.nodes.get('jrvxPickerClose'));assert.equal(f.key('Tab',{shiftKey:true}).prevented,true);assert.equal(f.document.activeElement,f.nodes.get('jrvxPickerDone'));assert.equal(f.spinCalls,0);
});

test('Enter and Space forward one ordinary field selection, never a wager',()=>{
 const f=pickerFixture();f.open();f.key('ArrowRight');const enter=f.key('Enter');f.flush();assert.equal(enter.prevented,true);assert.equal(enter.stopped,true);assert.deepEqual(f.sourceClicks,[18]);assert.equal(f.state.selection.numbers[0],18);
 f.key('ArrowDown');f.key(' ');f.flush();assert.deepEqual(f.sourceClicks,[18,25]);assert.equal(f.state.selection.numbers[0],25);f.key('Enter',{repeat:true});assert.deepEqual(f.sourceClicks,[18,25]);assert.equal(f.spinCalls,0);
});

test('state refresh preserves current keyboard focus; reopening follows the current selection',()=>{
 const f=pickerFixture();f.open();f.key('ArrowRight');f.state.selection={type:'exact',numbers:[3],label:'Число 3',mult:36};f.sync();assert.equal(focusNumber(f),18);assert.deepEqual(tabbableNumbers(f).map(b=>b.dataset.pickNumber),['18']);
 f.key('Escape');assert.equal(f.document.activeElement,f.nodes.get('jrvxRoulettePickerOpen'));f.open();assert.equal(focusNumber(f),3);
});

test('Escape and Done close the picker and return focus to its opener',()=>{
 const f=pickerFixture();f.open();const event=f.key('Escape');assert.equal(event.prevented,true);assert.equal(event.stopped,true);assert.equal(f.nodes.get('jrvxRoulettePicker').hidden,true);assert.equal(f.document.activeElement,f.nodes.get('jrvxRoulettePickerOpen'));
 f.open();f.nodes.get('jrvxPickerDone').click();assert.equal(f.nodes.get('jrvxRoulettePicker').hidden,true);assert.equal(f.document.activeElement,f.nodes.get('jrvxRoulettePickerOpen'));
});

test('Tab remains inside the dialog with just one number as a tab stop',()=>{
 const f=pickerFixture();f.open();f.nodes.get('jrvxPickerClose').focus();assert.equal(f.key('Tab',{shiftKey:true}).prevented,true);assert.equal(f.document.activeElement,f.nodes.get('jrvxPickerDone'));
 assert.equal(f.key('Tab').prevented,true);assert.equal(f.document.activeElement,f.nodes.get('jrvxPickerClose'));assert.equal(tabbableNumbers(f).length,1);
});

test('busy state closes safely without leaving focus inside a hidden or disabled picker',()=>{
 const f=pickerFixture();f.open();f.spin.disabled=true;f.flush();assert.equal(f.nodes.get('jrvxRoulettePicker').hidden,true);assert.equal(f.document.activeElement,f.root);assert.equal(tabbableNumbers(f).length,0);assert(f.pickerNumbers().every(b=>b.disabled));
 f.spin.disabled=false;f.flush();assert.equal(tabbableNumbers(f).length,1);f.open();assert.equal(focusNumber(f),17);assert.equal(f.spinCalls,0);
});

test('leaving the game closes the picker without focusing its hidden opener',()=>{
 const f=pickerFixture();f.open();f.root.classes.delete('active');f.sync();assert.equal(f.nodes.get('jrvxRoulettePicker').hidden,true);assert.equal(f.document.activeElement,f.document.body);
});
