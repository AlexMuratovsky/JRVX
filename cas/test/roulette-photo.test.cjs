'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const photo = require('../runtime/roulette-photo.js');
const artwork = Object.freeze({complete:true,naturalWidth:1254,naturalHeight:1254});
const geometry = Object.freeze({R:320,frame:320*.97,pocketOuter:320*.733,
  pocketInner:320*.50,rail:320*.813,prePocket:320*.755,ballPocket:320*.56});
function canvas({failImage=false}={}) {
  const calls=[]; let depth=0;
  const ctx={
    save(){depth++;calls.push(['save']);},restore(){depth--;calls.push(['restore']);},
    drawImage(...args){calls.push(['drawImage',...args]);if(failImage)throw Error('decode_failed');},
    beginPath(){calls.push(['beginPath']);},closePath(){calls.push(['closePath']);},
    arc(...args){calls.push(['arc',...args]);},ellipse(...args){calls.push(['ellipse',...args]);},
    clip(){calls.push(['clip']);},rotate(angle){calls.push(['rotate',angle]);},
    fill(){calls.push(['fill']);},stroke(){calls.push(['stroke']);},
    createRadialGradient(...args){calls.push(['gradient',...args]);return{addColorStop(){}};},
    fillText(){throw Error('The photograph numbers must not be redrawn');},
    strokeText(){throw Error('The photograph numbers must not be redrawn');}
  };
  return {ctx,calls,get depth(){return depth;}};
}
test('photographic pocket centres agree with all 185 verified server wheel positions',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../public/assets/js-v324/cas-bootstrap.js'),'utf8');
  const start=source.indexOf('function norm('),end=source.indexOf('function rouletteCurrentBet(');
  assert.ok(start>=0&&end>start);
  const legacy={R_TAU:Math.PI*2,R_SEG:Math.PI*2/37,rouletteState:{wheelAngle:0},Math};
  vm.createContext(legacy);vm.runInContext(source.slice(start,end),legacy);
  let checked=0;
  for(let index=0;index<37;index++)for(const angle of [-30,-1,0,1,45]){
    const centre=legacy.roulettePocketCenterAngle(index,angle);
    assert.ok(Math.abs(photo.photoPocketCenter(index,angle)-centre)<1e-12);
    assert.equal(photo.photoPocketIndex(centre,angle),index);
    assert.equal(photo.photoPocketIndex(centre+Math.PI*8,angle),index);
    assert.equal(legacy.roulettePocketIndexAtAngle(centre,angle),index);checked++;
  }
  assert.equal(checked,185);
});
test('photo zero uses the half-pocket rotation needed by the unchanged game geometry',()=>{
  const f=canvas(),state=Object.freeze({wheelAngle:1.7,ballAngle:0});
  assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
  const rotate=f.calls.find(row=>row[0]==='rotate')[1];
  assert.equal(rotate,1.7+Math.PI/37);
  assert.equal(-Math.PI/2+rotate,photo.photoPocketCenter(0,1.7));
});
test('unloaded or broken photographs return fallback without touching the drawing surface',()=>{
  for(const image of [null,{complete:false,naturalWidth:1254,naturalHeight:1254},
      {complete:true,naturalWidth:0,naturalHeight:0}]){
    const f=canvas();assert.equal(photo.draw(f.ctx,geometry,{},image,false),false);
    assert.deepEqual(f.calls,[]);assert.equal(f.depth,0);
  }
});
test('renderer preserves the full photograph and rotates only the inner clipped rotor',()=>{
  const f=canvas(),state=Object.freeze({wheelAngle:.9,ballAngle:1.2,ballRadius:200,phase:'rail'});
  assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
  const images=f.calls.filter(row=>row[0]==='drawImage');assert.equal(images.length,2);
  for(const image of images)assert.deepEqual(image.slice(2),[-320,-320,640,640]);
  const clip=f.calls.findIndex(row=>row[0]==='clip'),rotation=f.calls.findIndex(row=>row[0]==='rotate');
  assert.ok(clip>0&&rotation>clip);
  assert.ok(f.calls.some(row=>row[0]==='arc'&&row[1]===0&&row[2]===0&&row[3]===320*.742));
  assert.equal(f.depth,0);assert.equal(state.ballRadius,200);
});
test('the ivory ball follows the supplied ball angle and radius and has a real shadow',()=>{
  const f=canvas(),state=Object.freeze({wheelAngle:0,ballAngle:Math.PI/2,ballRadius:200});
  assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
  const ball=f.calls.find(row=>row[0]==='arc'&&row[3]===320*.028);
  assert.ok(Math.abs(ball[1])<1e-12);assert.equal(ball[2],200);
  assert.equal(f.calls.filter(row=>row[0]==='ellipse').length,1);
  const onRail=canvas();photo.draw(onRail.ctx,geometry,{ballAngle:0,ballRadius:null},artwork,false);
  assert.equal(onRail.calls.find(row=>row[0]==='arc'&&row[3]===320*.028)[1],geometry.rail);
});
test('a subtle winner ring is centred on the server-confirmed pocket without changing state',()=>{
  const f=canvas(),state=Object.freeze({wheelAngle:.8,ballAngle:2,highlightIndex:17,phase:'settled'});
  assert.equal(photo.draw(f.ctx,geometry,state,artwork,false),true);
  const ring=f.calls.find(row=>row[0]==='arc'&&row[3]===320*.733);
  assert.ok(ring);assert.ok(Math.abs((ring[4]+ring[5])/2-photo.photoPocketCenter(17,.8))<1e-12);
  assert.ok(f.calls.some(row=>row[0]==='arc'&&row[3]===320*.5&&row[6]===true));
  assert.equal(state.highlightIndex,17);
});
test('the light trail appears only while the ball is moving in a busy spin',()=>{
  const idle=canvas(),moving=canvas(),settled=canvas();
  photo.draw(idle.ctx,geometry,{phase:'rail'},artwork,false);
  photo.draw(moving.ctx,geometry,{phase:'rail'},artwork,true);
  photo.draw(settled.ctx,geometry,{phase:'settled'},artwork,true);
  const arcs=f=>f.calls.filter(row=>row[0]==='arc').length;
  assert.equal(arcs(moving),arcs(idle)+4);assert.equal(arcs(settled),arcs(idle));
});
test('decode failure falls back and restores canvas state without game mutations',()=>{
  const f=canvas({failImage:true}),state=Object.freeze({wheelAngle:1,ballAngle:2});
  assert.equal(photo.draw(f.ctx,geometry,state,artwork,true),false);
  assert.equal(f.depth,0);assert.equal(state.wheelAngle,1);
  assert.equal(photo.assetPath,'/assets/art/roulette-no-ball-v323.webp');
});
