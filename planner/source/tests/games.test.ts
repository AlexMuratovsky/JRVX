import { test } from "node:test";
import assert from "node:assert/strict";
import { alphabet,dictionary,wordGroups,chooseWord,startRound,guessLetter } from "../lib/games/hangman";
import { PONG,difficulties,newMatch,startMatch,pauseMatch,resumeMatch,advancePong } from "../lib/games/pong-engine";
import { createFrameLoop } from "../lib/games/animation-loop";
test("Hangman dictionary covers categories and all 33 letters; selection excludes previous word",()=>{
  assert.equal(alphabet.length,33);assert.ok(alphabet.includes("Ё"));assert.equal(new Set(alphabet).size,33);assert.equal(dictionary.length,120);
  for(const [category] of Object.entries(wordGroups)){const a=chooseWord(category as any,undefined,()=>0),b=chooseWord(category as any,a.word,()=>0);assert.notEqual(a.word,b.word);if(category!=="random")assert.equal(a.category,category);}
  for(const w of dictionary){assert.ok(w.hint);assert.ok(Array.from(w.word).every(c=>alphabet.includes(c)));assert.ok(!w.hint.toLocaleUpperCase("ru").includes(w.word));}
});
test("Hangman repeated letters, Ё, duplicate guesses, win, loss and reset",()=>{
  let r=startRound({word:"ЧЕЛОВЕК",hint:"Разумный обитатель Земли",category:"science"});r=guessLetter(r,"е");assert.equal(Array.from(r.word.word).filter(c=>r.guessed.includes(c)).length,2);assert.equal(guessLetter(r,"Е"),r);assert.equal(r.mistakes,0);for(const c of "ЧЛОВК")r=guessLetter(r,c);assert.equal(r.status,"won");assert.equal(guessLetter(r,"Я"),r);
  r=startRound({word:"ЁЖ",hint:"Колючий",category:"animals"});r=guessLetter(r,"ё");assert.equal(r.mistakes,0);r=guessLetter(r,"Ж");assert.equal(r.status,"won");r=startRound(dictionary[0]);for(const c of ["Ё","Й","Ъ","Ы","Ь","Э"])r=guessLetter(r,c);assert.equal(r.status,"lost");assert.equal(r.mistakes,6);assert.equal(guessLetter(r,"Я"),r);const next=startRound(chooseWord("random",r.word.word));assert.equal(next.mistakes,0);assert.deepEqual(next.guessed,[]);
});
const input={direction:0,target:null};const rng=()=>.5;
test("Pong wall/paddle collisions, hit angle, acceleration and maximum speed",()=>{
  const s=newMatch();startMatch(s,rng);s.wait=0;s.ball={x:300,y:8,vx:50,vy:-330,speed:334};advancePong(s,.02,input,rng);assert.ok(s.ball.vy>0);assert.ok(s.ball.y>=PONG.radius);
  for(const edge of [0,32]){s.ball={x:60,y:s.playerY+edge,vx:-600,vy:0,speed:600};advancePong(s,.025,input,rng);assert.ok(s.ball.vx>0);assert.ok(s.ball.speed>600);assert.equal(edge===0,s.ball.vy===0);}
  s.ball={x:60,y:s.playerY,vx:-690,vy:0,speed:690};advancePong(s,.03,input,rng);assert.equal(s.ball.speed,690);
  s.ball={x:740,y:s.aiY,vx:600,vy:0,speed:600};advancePong(s,.025,input,rng);assert.ok(s.ball.vx<0);
});
test("Pong scores once, serves after a pause, wins at 7 and resets for a rematch",()=>{
  const s=newMatch();startMatch(s,rng);s.wait=0;s.ball={x:806,y:15,vx:400,vy:0,speed:400};advancePong(s,.02,input,rng);assert.equal(s.playerScore,1);assert.equal(s.aiScore,0);assert.equal(s.ball.x,400);assert.ok(s.wait>0);advancePong(s,.05,input,rng);assert.equal(s.playerScore,1);
  s.playerScore=6;s.wait=0;s.ball={x:806,y:15,vx:400,vy:0,speed:400};advancePong(s,.02,input,rng);assert.equal(s.playerScore,7);assert.equal(s.winner,"player");assert.equal(s.phase,"finished");const frozen=JSON.stringify(s);advancePong(s,10,input,rng);assert.equal(JSON.stringify(s),frozen);
  const again=newMatch("hard");startMatch(again,rng);assert.equal(again.playerScore,0);assert.equal(again.aiScore,0);assert.equal(again.difficulty,"hard");again.wait=0;again.aiScore=6;again.ball={x:-6,y:10,vx:-400,vy:0,speed:400};advancePong(again,.02,input,rng);assert.equal(again.aiScore,7);assert.equal(again.winner,"ai");
});
test("Pong keyboard directions, touch target, difficulty speed limits and paused time",()=>{
  for(const difficulty of Object.keys(difficulties)){const s=newMatch(difficulty as any);startMatch(s,rng);s.wait=0;s.aiTarget=440;s.aiTimer=1;const before=s.aiY;advancePong(s,.04,{direction:-1,target:null},rng);assert.ok(s.playerY<240);assert.ok(s.aiY-before<=difficulties[s.difficulty].speed*.04+.001);assert.ok(s.aiY<440);advancePong(s,.04,{direction:1,target:470},rng);assert.ok(s.playerY<=PONG.height-PONG.paddleHeight/2);pauseMatch(s);const snapshot=JSON.stringify(s);advancePong(s,300,{direction:1,target:0},rng);assert.equal(JSON.stringify(s),snapshot);resumeMatch(s);assert.equal(s.phase,"playing");}
});
test("Pong owns one animation loop and cancels it on pause/exit without accumulated time",()=>{
  let counter=0;const pending=new Map<number,FrameRequestCallback>(),deltas:number[]=[];const scheduler={request:(f:FrameRequestCallback)=>{pending.set(++counter,f);return counter;},cancel:(id:number)=>{pending.delete(id);}};const loop=createFrameLoop(dt=>{deltas.push(dt);return true;},scheduler);loop.start();loop.start();assert.equal(pending.size,1);let [id,callback]=[...pending][0];pending.delete(id);callback(100);assert.equal(deltas[0],0);assert.equal(pending.size,1);loop.stop();assert.equal(pending.size,0);loop.start();[id,callback]=[...pending][0];pending.delete(id);callback(600000);assert.equal(deltas.at(-1),0);loop.stop();assert.equal(pending.size,0);
});
