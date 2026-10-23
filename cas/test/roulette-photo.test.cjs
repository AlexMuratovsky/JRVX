'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const photo=require('../runtime/roulette-photo.js');
const source=fs.readFileSync(require.resolve('../runtime/roulette-photo.js'),'utf8');
const bootstrap=fs.readFileSync(require.resolve('../public/assets/js-v326/cas-bootstrap.js'),'utf8');
const artwork=Object.freeze({complete:true,naturalWidth:1254,naturalHeight:1254});
const geometry=Object.freeze({R:320,frame:320*.97,pocketOuter:320*.733,pocketInner:320*.50,rail:320*.813,prePocket:320*.755,ballPocket:320*.56});
const angles=[0,30,45,90,135,180,225,270,315];
const properties=['globalAlpha','globalCompositeOperation','imageSmoothingEnabled','imageSmoothingQuality','fillStyle','strokeStyle','lineWidth','shadowColor','shadowBlur','font','textAlign','textBaseline'];
function canvas({failImage=false,failGradientRadius=null,matrix=[1,0,0,1,0,0]}={}){
 const calls=[],stack=[];let transform=[...matrix];
 const point=(x,y)=>[transform[0]*x+transform[2]*y+transform[4],transform[1]*x+transform[3]*y+transform[5]];
 function record(op,args=[]){const row={op,args,matrix:[...transform],origin:point(0,0),fillStyle:ctx.fillStyle};if(op==='arc'||op==='ellipse')row.center=point(args[0],args[1]);calls.push(row);return row}
 const ctx={globalAlpha:.71,globalCompositeOperation:'source-over',imageSmoothingEnabled:false,imageSmoothingQuality:'low',fillStyle:'#123456',strokeStyle:'#654321',lineWidth:2,shadowColor:'#060606',shadowBlur:4,font:'10px serif',textAlign:'left',textBaseline:'alphabetic',
  save(){stack.push({matrix:[...transform],state:Object.fromEntries(properties.map(key=>[key,ctx[key]]))});record('save')},
  restore(){assert(stack.length>0,'unbalanced restore');const saved=stack.pop();transform=saved.matrix;Object.assign(ctx,saved.state);record('restore')},
  setTransform(...values){transform=values;record('setTransform',values)},getTransform(){const[a,b,c,d,e,f]=transform;return{a,b,c,d,e,f}},
  translate(x,y){transform[4]+=transform[0]*x+transform[2]*y;transform[5]+=transform[1]*x+transform[3]*y;record('translate',[x,y])},
  rotate(angle){const[a,b,c,d,e,f]=transform,co=Math.cos(angle),si=Math.sin(angle);transform=[a*co+c*si,b*co+d*si,c*co-a*si,d*co-b*si,e,f];record('rotate',[angle])},
  drawImage(...args){record('drawImage',args);if(failImage)throw Error('decode_failed')},
  beginPath(){record('beginPath')},closePath(){record('closePath')},arc(...args){record('arc',args)},ellipse(...args){record('ellipse',args)},
  clip(){record('clip')},fill(){record('fill')},stroke(){record('stroke')},moveTo(...args){record('moveTo',args)},lineTo(...args){record('lineTo',args)},fillText(...args){record('fillText',args)},
  createRadialGradient(...args){record('gradient',args);if(failGradientRadius!==null&&Math.abs(args[5]-failGradientRadius)<1e-9)throw Error('gradient_failed');return{addColorStop(){}}}
 };
 return{ctx,calls,get depth(){return stack.length},snapshot(){return{matrix:[...transform],...Object.fromEntries(properties.map(key=>[key,ctx[key]]))}}};
}
function cachedAPI(){
 const surfaces=[];
 class OffscreenCanvas{
  constructor(width,height){this.width=width;this.height=height;this.trace=canvas();surfaces.push(this)}
  getContext(){return this.trace.ctx}
 }
 const context={module:{exports:{}},OffscreenCanvas};vm.runInNewContext(source,context);
 return{api:context.module.exports,surfaces};
}
test('all 185 logical pocket centres agree with verified server wheel positions',()=>{
 const start=bootstrap.indexOf('function norm('),end=bootstrap.indexOf('function rouletteCurrentBet('),legacy={R_TAU:Math.PI*2,R_SEG:Math.PI*2/37,rouletteState:{wheelAngle:0},Math};
 assert(start>=0&&end>start);vm.createContext(legacy);vm.runInContext(bootstrap.slice(start,end),legacy);
 let checked=0;for(let index=0;index<37;index++)for(const angle of [-30,-1,0,1,45]){
  const centre=legacy.roulettePocketCenterAngle(index,angle);assert(Math.abs(photo.photoPocketCenter(index,angle)-centre)<1e-12);assert.equal(photo.photoPocketIndex(centre,angle),index);assert.equal(photo.photoPocketIndex(centre+Math.PI*8,angle),index);assert.equal(legacy.roulettePocketIndexAtAngle(centre,angle),index);checked++;
 }assert.equal(checked,185);
});
test('the rotor prints exactly the 37 unique European numbers in the authoritative bootstrap order',()=>{
 const order=JSON.parse(bootstrap.match(/const R_ORDER=(\[[^;]+\])/)[1]);
 assert.deepEqual([...photo.pocketOrder],order);assert.equal(new Set(photo.pocketOrder).size,37);assert(Object.isFrozen(photo.pocketOrder));
 const f=canvas();photo.drawRotor(f.ctx,320);assert.deepEqual(f.calls.filter(row=>row.op==='fillText').map(row=>Number(row.args[0])),order);assert.equal(f.depth,0);
});
test('drawn ring edges and central spindle stay on the same origin at every requested angle',()=>{
 for(const degrees of angles){
  const scale=1.25,centre=[321.125,270.875],f=canvas({matrix:[scale,0,0,scale,...centre]});f.ctx.rotate(degrees*Math.PI/180);photo.drawRotor(f.ctx,320);
  const edges=f.calls.filter(row=>row.op==='arc'&&row.args[2]>=320*.077);
  assert(edges.length>=80,'trace must include the numbered ring and central spindle');
  assert(edges.some(row=>Math.abs(row.args[2]-320*.733)<1e-9));assert(edges.some(row=>Math.abs(row.args[2]-320*.077)<1e-9));
  for(const edge of edges){assert(Math.abs(edge.center[0]-centre[0])/scale<=1);assert(Math.abs(edge.center[1]-centre[1])/scale<=1)}
  assert.equal(f.depth,0);
 }
});
test('zero label centre aligns with the verified half-pocket convention without a photographic offset',()=>{
 const f=canvas(),wheelAngle=1.7;assert.equal(photo.draw(f.ctx,geometry,{wheelAngle},artwork,false),true);
 const firstRotation=f.calls.find(row=>row.op==='rotate');assert.equal(firstRotation.args[0],wheelAngle);
 const zero=f.calls.find(row=>row.op==='fillText'&&row.args[0]==='0'),m=zero.matrix,x=zero.args[1],y=zero.args[2];
 const actual=Math.atan2(m[1]*x+m[3]*y,m[0]*x+m[2]*y),expected=photo.photoPocketCenter(0,wheelAngle);
 assert(Math.abs(Math.atan2(Math.sin(actual-expected),Math.cos(actual-expected)))<1e-12);
});
test('the approved wood photograph is stationary and the invalid printed ring is covered by the rotor',()=>{
 const f=canvas(),state=Object.freeze({wheelAngle:.9,ballAngle:1.2,ballRadius:200,phase:'rail'}),before=f.snapshot();assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
 const images=f.calls.filter(row=>row.op==='drawImage');assert.equal(images.length,1);assert.equal(images[0].args[0],artwork);assert.deepEqual(images[0].args.slice(1),[-320,-320,640,640]);assert.deepEqual(images[0].matrix,[1,0,0,1,0,0]);
 assert(f.calls.some(row=>row.op==='arc'&&Math.abs(row.args[2]-320*.77)<1e-9));assert.equal(f.depth,0);assert.deepEqual(f.snapshot(),before);assert.equal(state.ballRadius,200);
});
test('the cached rotor builds once across all nine poses and a complete rotation sweep',()=>{
 for(const scale of [1,2,3]){
  const{api,surfaces}=cachedAPI();for(const degrees of [...angles,...Array.from({length:361},(_,i)=>i)]){const f=canvas({matrix:[scale,0,0,scale,0,0]});assert.equal(api.draw(f.ctx,geometry,{wheelAngle:degrees*Math.PI/180},artwork,false),true)}
  assert.equal(surfaces.length,1,'rotation alone must not rebuild the cache');assert.equal(surfaces[0].trace.calls.filter(row=>row.op==='fillText').length,37);
 }
});
test('rotor cache quality follows backing scale and remains bounded from 640 through 2048 pixels',()=>{
 const{api,surfaces}=cachedAPI();for(const[scale,side]of [[.2,640],[1.3,896],[2.9,1920],[4,2048],[100,2048]]){
  const f=canvas({matrix:[scale,0,0,scale,0,0]});assert.equal(api.draw(f.ctx,geometry,{},artwork,false),true);const retained=surfaces.at(-1);assert.equal(retained.width,side);assert.equal(retained.height,side);
  assert.equal(f.calls.filter(row=>row.op==='fillText').length,0,'cached frames should not lay out 37 labels again');assert.equal(f.calls.filter(row=>row.op==='drawImage').length,2);
 }assert.equal(surfaces.length,4,'the same maximum quality bucket should reuse the retained surface');
});
test('cached and direct drawing both restore the caller transform, styles and save depth',()=>{
 for(const api of [photo,cachedAPI().api]){
  const f=canvas({matrix:[2,0,0,2,640,640]}),before=f.snapshot();assert.equal(api.draw(f.ctx,geometry,{wheelAngle:1.1,highlightIndex:17,ballAngle:2,phase:'settled'},artwork,true),true);assert.equal(f.depth,0);assert.deepEqual(f.snapshot(),before);
 }
});
test('unloaded or broken photographs return fallback without touching the drawing surface',()=>{
 for(const image of [null,{complete:false,naturalWidth:1254,naturalHeight:1254},{complete:true,naturalWidth:0,naturalHeight:0}]){const f=canvas();assert.equal(photo.draw(f.ctx,geometry,{},image,false),false);assert.deepEqual(f.calls,[]);assert.equal(f.depth,0)}
});
test('the ivory ball follows the supplied ball angle and radius and has a real shadow',()=>{
 const f=canvas(),state=Object.freeze({wheelAngle:0,ballAngle:Math.PI/2,ballRadius:200});assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
 const ball=f.calls.find(row=>row.op==='arc'&&row.args[2]===320*.028);assert(Math.abs(ball.args[0])<1e-12);assert.equal(ball.args[1],200);
 assert(f.calls.some(row=>row.op==='ellipse'&&Math.abs(row.args[0]-320*.011)<1e-9&&Math.abs(row.args[1]-200-320*.015)<1e-9));
 const rail=canvas();photo.draw(rail.ctx,geometry,{ballAngle:0,ballRadius:null},artwork,false);assert.equal(rail.calls.find(row=>row.op==='arc'&&row.args[2]===320*.028).args[0],geometry.rail);
});
test('the winner highlight centres on the confirmed pocket while keeping game state untouched',()=>{
 const f=canvas(),state=Object.freeze({wheelAngle:.8,ballAngle:2,highlightIndex:17,phase:'settled'});assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
 const ring=f.calls.find(row=>row.op==='arc'&&row.args[2]===320*.733&&Math.abs((row.args[3]+row.args[4])/2-photo.photoPocketCenter(17,.8))<1e-9);assert(ring);assert.equal(state.highlightIndex,17);
});
test('the light trail appears only while the ball is moving in a busy spin',()=>{
 const idle=canvas(),moving=canvas(),settled=canvas();photo.draw(idle.ctx,geometry,{phase:'rail'},artwork,false);photo.draw(moving.ctx,geometry,{phase:'rail'},artwork,true);photo.draw(settled.ctx,geometry,{phase:'settled'},artwork,true);
 const arcs=f=>f.calls.filter(row=>row.op==='arc').length;assert.equal(arcs(moving),arcs(idle)+4);assert.equal(arcs(settled),arcs(idle));
});
test('decode failure and a spindle drawing fault return fallback and restore the entire canvas state',()=>{
 for(const options of [{failImage:true},{failGradientRadius:320*.031}]){
  const f=canvas(options),before=f.snapshot(),state=Object.freeze({wheelAngle:1,ballAngle:2});assert.equal(photo.draw(f.ctx,geometry,state,artwork,true),false);assert.equal(f.depth,0);assert.deepEqual(f.snapshot(),before);assert.equal(state.wheelAngle,1);
 }assert.equal(photo.assetPath,'/assets/art/roulette-no-ball-v323.webp');
});
