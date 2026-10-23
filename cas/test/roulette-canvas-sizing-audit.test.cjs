'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../public/assets/js-v326/cas-bootstrap.js'),'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b)}
const geometry=section('function rouletteGeometry(','function rouletteDrawCircularBrand(');
const drawing=section('function rouletteDraw(){','function rouletteRenderHistory(');
const surface=section('(function installRouletteSurface(){','function rouletteColor(');
function target(){const events=new Map();return {events,addEventListener(name,fn){if(!events.has(name))events.set(name,new Set());events.get(name).add(fn)},removeEventListener(name,fn){events.get(name)?.delete(fn)},fire(name,event={}){for(const fn of [...events.get(name)||[]])fn(event)}}}
function fixture({width=400,height=400,dpr=2}={}){
 const bounds={width,height,left:10,top:20},canvas=target(),window=target(),document=target(),frames=new Map(),observers=[],queries=[],styles=new Map(),calls=[],warnings=[],backingWrites=[];
 let serial=0,clock=0,transform=[1,0,0,1,0,0];const stack=[];
 const context={setTransform(...values){transform=values;calls.push(['setTransform',...values])},clearRect(...values){calls.push(['clearRect',...values])},save(){stack.push([...transform])},restore(){transform=stack.pop()},translate(x,y){transform[4]+=transform[0]*x+transform[2]*y;transform[5]+=transform[1]*x+transform[3]*y}};
 Object.assign(canvas,{width:640,height:640,parentElement:{getBoundingClientRect:()=>({...bounds})},style:{getPropertyValue:name=>styles.get(name)?.value||'',getPropertyPriority:name=>styles.get(name)?.priority||'',setProperty(name,value,priority){styles.set(name,{value,priority})}}});
 for(const name of ['width','height']){let value=canvas[name];Object.defineProperty(canvas,name,{get:()=>value,set:next=>{value=next;backingWrites.push([name,next])}})}
 const states={wheelAngle:0,ballAngle:0,ballRadius:320*.813,phase:'idle'},message={textContent:''};
 Object.assign(document,{readyState:'loading',visibilityState:'visible',getElementById:id=>id==='rouletteMessage'?message:{classList:{contains:name=>name==='active'}}});
 Object.assign(window,{devicePixelRatio:dpr,matchMedia(query){const media=target();media.query=query;queries.push(media);return media},JRVXRoulettePhoto:{draw(ctx,g){calls.push(['origin',transform[4],transform[5],g.cx,g.cy]);return true}}});
 const math=Object.create(Math);math.random=()=>.5;
 const ctx={window,document,rouletteCanvasEl:canvas,rouletteCtx:context,rouletteState:states,rouletteBusy:false,rouletteSpinDuration:7600,Math:math,performance:{now:()=>clock},console:{warn:(...args)=>warnings.push(args)},
  requestAnimationFrame(fn){const id=++serial;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),
  ResizeObserver:class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this)}observe(node){this.node=node}disconnect(){this.disconnected=true}}};
 vm.createContext(ctx);vm.runInContext(geometry+drawing+surface,ctx);
 function tick(now=clock){clock=now;const batch=[...frames];frames.clear();for(const [,fn]of batch)fn(now)}
 return {ctx,window,document,canvas,bounds,states,frames,observers,queries,calls,styles,warnings,backingWrites,tick,surface:window.JRVXRouletteSurface};
}
test('wheel geometry remains in the same logical world after legacy backing writes or DPR changes',()=>{
 const ctx={rouletteCanvasEl:{width:640,height:640}};vm.createContext(ctx);vm.runInContext(geometry,ctx);
 const initial=JSON.stringify(ctx.rouletteGeometry());
 for(const [width,height]of [[480,480],[800,800],[1200,1200],[900,450]]){Object.assign(ctx.rouletteCanvasEl,{width,height});assert.equal(JSON.stringify(ctx.rouletteGeometry()),initial)}
 assert.equal(ctx.rouletteGeometry().R,320);assert.equal(ctx.rouletteGeometry().cx,320);assert.equal(ctx.rouletteGeometry().cy,320);
});
test('square CSS and DPR backing map the fixed canvas centre to the wrapper centre at nine wheel angles',()=>{
 for(const dpr of [1,1.25,2,3])for(const [width,height]of [[280,280],[400.25,350.5],[910,540]]){
  const f=fixture({width,height,dpr}),side=Math.min(width,height),pixels=Math.round(side*dpr);
  for(const degrees of [0,30,45,90,135,180,225,270,315]){
   f.states.wheelAngle=degrees*Math.PI/180;f.ctx.rouletteDraw();
   assert.equal(f.canvas.width,pixels);assert.equal(f.canvas.height,pixels);
   assert.equal(f.styles.get('width').value,side+'px');assert.equal(f.styles.get('height').value,side+'px');
   const origin=f.calls.filter(call=>call[0]==='origin').at(-1);
   const cssX=f.bounds.left+(width-side)/2+origin[1]/pixels*side,cssY=f.bounds.top+(height-side)/2+origin[2]/pixels*side;
   assert(Math.abs(cssX-(f.bounds.left+width/2))<=1);assert(Math.abs(cssY-(f.bounds.top+height/2))<=1);
   assert.deepEqual(f.calls.filter(call=>call[0]==='clearRect').at(-1),['clearRect',0,0,640,640]);
  }
 }
});
test('an external 480px low-power write is corrected before drawing without moving the logical ball',()=>{
 const f=fixture({width:350,height:400,dpr:3});f.ctx.rouletteDraw();const before=JSON.stringify(f.states);
 f.canvas.width=480;f.canvas.height=480;f.ctx.rouletteDraw();
 assert.equal(f.canvas.width,1050);assert.equal(f.canvas.height,1050);assert.equal(JSON.stringify(f.states),before);
 assert.equal(f.ctx.rouletteGeometry().rail,320*.813);
});
test('repeated draws at the same dimensions never reset the canvas backing',()=>{
 const f=fixture();f.ctx.rouletteDraw();const writes=f.backingWrites.length;assert.equal(writes,2);
 for(let i=0;i<20;i++)f.ctx.rouletteDraw();assert.equal(f.backingWrites.length,writes);
});
test('surface redraw faults warn once and leave game coordinates unchanged',()=>{
 const f=fixture(),draw=f.ctx.rouletteDraw,before=JSON.stringify(f.states);f.ctx.rouletteDraw=()=>{throw Error('context_lost')};
 f.document.fire('DOMContentLoaded');f.tick();f.window.fire('resize');f.tick();assert.equal(f.warnings.length,1);assert.match(f.warnings[0][0],/roulette surface redraw failed/);assert.equal(JSON.stringify(f.states),before);
 f.ctx.rouletteDraw=draw;f.window.fire('resize');f.tick();assert.equal(f.warnings.length,1);assert.equal(f.frames.size,0);
});
test('resize and DPR listeners coalesce, release on pagehide and reattach once on pageshow',()=>{
 const f=fixture();f.document.fire('DOMContentLoaded');assert.equal(f.observers.length,1);assert.equal(f.frames.size,1);
 f.observers[0].fn();f.window.fire('resize');f.canvas.fire('contextrestored');assert.equal(f.frames.size,1);f.tick();assert.equal(f.frames.size,0);
 f.window.devicePixelRatio=3;const oldMedia=f.queries.at(-1);oldMedia.fire('change');assert.equal(oldMedia.events.get('change').size,0);assert.match(f.queries.at(-1).query,/3dppx/);f.tick();assert.equal(f.canvas.width,1200);
 f.window.fire('resize');assert.equal(f.frames.size,1);f.window.fire('pagehide');assert.equal(f.frames.size,0);assert(f.observers[0].disconnected);assert.equal(f.window.events.get('resize').size,0);assert.equal(f.canvas.events.get('contextrestored').size,0);assert.equal(f.queries.at(-1).events.get('change').size,0);
 f.window.fire('pageshow');f.window.fire('pageshow');assert.equal(f.observers.length,2);assert.equal(f.window.events.get('resize').size,1);assert.equal(f.frames.size,1);
});
test('a hidden surface keeps valid backing and game coordinates without creating a resize loop',()=>{
 const f=fixture({width:0,height:0});const before=JSON.stringify(f.states);assert.equal(f.surface.sync(),false);assert.equal(f.canvas.width,640);assert.equal(f.styles.size,0);assert.equal(JSON.stringify(f.states),before);
 f.document.fire('DOMContentLoaded');f.tick();assert.equal(f.frames.size,0);
});
function loadSpin(f){
 const constants=section('const R_RED=','let rouletteBet=');
 const angles=section('function norm(','function rouletteCurrentBet(');
 const plans=section('function rouletteWheelEase(','function rouletteSpin(){');
 vm.runInContext(constants+angles+plans,f.ctx);
}
test('resizing and changing DPR during a spin preserve its radial path and verified final pocket',()=>{
 const f=fixture();loadSpin(f);let actual=null;f.ctx.rouletteAnimate(index=>{actual=index},17,()=>true);f.tick(3800);
 const state=JSON.stringify(f.states),before=JSON.stringify(f.states.spinPlan.g);
 f.bounds.width=307.25;f.bounds.height=620;f.window.devicePixelRatio=3;f.ctx.rouletteDraw();
 assert.equal(JSON.stringify(f.states),state);assert.equal(JSON.stringify(f.ctx.rouletteGeometry()),before);assert.equal(f.canvas.width,922);
 f.tick(7600);assert.equal(actual,17);assert.equal(f.states.phase,'settled');assert.equal(f.frames.size,0);
});
test('roulette elapsed-time animation finishes at the same verified pocket at 30, 60 and 120 FPS',()=>{
 for(const fps of [30,60,120]){
  const f=fixture();loadSpin(f);let actual=null,finishes=0;f.ctx.rouletteAnimate(index=>{actual=index;finishes++},36,()=>true);
  for(let t=1000/fps;t<7600;t+=1000/fps)f.tick(t);f.tick(7600);
  assert.equal(actual,36);assert.equal(finishes,1);assert.equal(f.frames.size,0);assert.equal(f.states.highlightIndex,36);
 }
});
