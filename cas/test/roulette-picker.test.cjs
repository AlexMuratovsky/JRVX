const test=require('node:test');const assert=require('node:assert/strict');const{covered}=require('../runtime/roulette-picker.js');
const fs=require('node:fs'),vm=require('node:vm');
function pickerFixture(){
 const nodes=new Map(),observers=[],frames=[],events=new Map(),mutations=[];
 const notify=(target,attributeName)=>mutations.push({type:'attributes',target,attributeName});
 class Node{
  constructor(id='',data={}){this.id=id;this.dataset=data;this.parentNode=null;this.attributes=new Map();this.textContent='';this.value='';this.hidden=false;this.isConnected=true;this.classList={contains:name=>name==='active'};if(id)nodes.set(id,this);}
  get disabled(){return this.attributes.has('disabled')}
  set disabled(value){if(value)this.setAttribute('disabled','');else this.removeAttribute('disabled')}
  getAttribute(name){return this.attributes.get(name)??null}
  setAttribute(name,value){this.attributes.set(name,String(value));notify(this,name)}
  removeAttribute(name){if(this.attributes.delete(name))notify(this,name)}
  appendChild(child){child.parentNode=this;if(child.id)nodes.set(child.id,child)}
  querySelectorAll(){return []}
  querySelector(){return null}
  addEventListener(){}
  focus(){document.activeElement=this}
 }
 const root=new Node('roulette'),spin=new Node('rouletteSpin'),selectors=new Node('jrvxRouletteSelectors'),panel=new Node('jrvxRoulettePicker');
 root.appendChild(spin);root.appendChild(selectors);panel.hidden=true;
 new Node('rouletteBetInput').value='50';new Node('jrvxPickerSummary');
 const numbers=[new Node('',{pickNumber:'17'})],mainNumbers=[new Node('',{number:'17'})],modes=[new Node('',{pickMode:'split'})],groups=[new Node('',{pickOutside:'red'})];
 mainNumbers.forEach(node=>root.appendChild(node));
 root.querySelectorAll=selector=>selector.includes('#rouletteNumbers')?mainNumbers:[];
 const document={readyState:'complete',activeElement:null,getElementById:id=>nodes.get(id)||null,createElement:()=>new Node(),
  querySelectorAll:selector=>selector.includes('[data-pick-number]')?numbers:selector.includes('#jrvxPickerModes')?modes:selector.includes('#jrvxPickerOutside')?groups:[],
  addEventListener:(name,fn)=>events.set(name,fn)};
 const state={mode:'straight',splitAxis:'horizontal',selection:{type:'exact',numbers:[17],label:'Число 17',mult:36}};
 const ctx={document,window:{JRVXCASV220:{roulette:{state}}},requestAnimationFrame:fn=>frames.push(fn),MutationObserver:class{constructor(fn){this.fn=fn}observe(target,options){this.target=target;this.options=options;observers.push(this)}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../runtime/roulette-picker.js'),'utf8'),ctx);
 function flush(limit=8){
  for(let turn=0;turn<limit;turn++){
   const batch=mutations.splice(0);
   for(const observer of observers){const records=batch.filter(m=>{let current=m.target;while(current&&current!==observer.target)current=current.parentNode;return current&&observer.options.attributeFilter.includes(m.attributeName)});if(records.length)observer.fn(records)}
   if(!frames.length)return turn;
   const callbacks=frames.splice(0);callbacks.forEach(fn=>fn());
  }
  throw Error('Roulette picker keeps scheduling unchanged busy state');
 }
 flush();return {nodes,spin,selectors,panel,numbers,mainNumbers,modes,groups,state,events,flush,document};
}
test('roulette selection coverage matches outside bets and excludes zero',()=>{for(const type of ['red','black','even','odd','low','high']){const nums=covered({type});assert.equal(nums.length,18);assert(!nums.includes(0));assert.equal(new Set(nums).size,18)}assert(covered({type:'red'}).includes(32));assert(!covered({type:'black'}).includes(32));});
test('roulette picker highlights server selection numbers, dozens and columns',()=>{assert.deepEqual(covered({type:'exact',numbers:[0]}),[0]);assert.deepEqual(covered({type:'corner',numbers:[1,2,4,5]}),[1,2,4,5]);assert.deepEqual(covered({type:'dozen2'}),Array.from({length:12},(_,i)=>i+13));assert.deepEqual(covered({type:'col3'}),Array.from({length:12},(_,i)=>(i+1)*3));assert.deepEqual(covered({type:'none'}),[]);});
test('roulette busy state settles after locking the picker instead of running a frame feedback loop',()=>{
 const f=pickerFixture();f.spin.disabled=true;f.flush();
 assert.equal(f.nodes.get('jrvxRoulettePickerOpen').disabled,true);assert(f.numbers.every(button=>button.disabled));
 f.spin.disabled=false;f.flush();assert.equal(f.nodes.get('jrvxRoulettePickerOpen').disabled,false);assert(f.numbers.every(button=>!button.disabled));
});
