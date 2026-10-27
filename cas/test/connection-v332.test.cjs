const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
process.env.JRVX_CONNECTION_SOURCE=path.join(__dirname,'../public/modules/ui/runtime/connection-v332.js');
const {fixture,tick,deferred}=require('./connection-v329.test.cjs');
function gameFixture(game='blackjack'){
 const f=fixture(),calls={reads:0,cancel:0},gate=deferred();
 const gameState={busy:false,pending:true,available:true};
 const controller={recover(){calls.reads++;return gate.promise},cancelRecovery(){calls.cancel++},recoveryState:()=>gameState};
 f.window.JRVXCASV220={[game]:controller};
 f.ids.set(game,{classList:{contains:()=>true}});f.api.open();
 return Object.assign(f,{gameCalls:calls,gate,gameState,controller});
}
test('game recovery is offered inside the existing connection dialog only for casino tables',()=>{
 const lobby=fixture();lobby.api.open();assert.equal(lobby.ids.get('jrvxConnectionGameV332').hidden,true);
 for(const [game,label]of [['blackjack','Блэкджек'],['roulette','Рулетка']]){
  const f=gameFixture(game);assert.equal(f.ids.get('jrvxConnectionGameV332').hidden,false);assert.equal(f.ids.get('jrvxConnectionGameTitleV332').textContent,label);
  assert.equal(f.ids.get('jrvxConnectionGameCheckV332').disabled,false);assert.equal(f.api.state().game.pending,true);
 }
});
test('the separate state button calls only the read-only game API and deduplicates repeated checks',async()=>{
 const f=gameFixture();const a=f.api.checkGame(),b=f.api.checkGame();assert.equal(a,b);await tick();assert.equal(f.gameCalls.reads,1);assert.equal(f.api.state().game.busy,true);
 f.gate.resolve({status:'confirmed',detail:'Действие подтверждено.'});assert.equal(await a,true);assert.equal(await b,true);assert.equal(f.api.state().game.busy,false);
 assert.equal(f.ids.get('jrvxConnectionGameFeedbackV332').textContent,'Действие подтверждено.');assert.equal(f.calls.financial,0);assert.equal(f.calls.identity,0);assert.equal(f.calls.account,0);
});
test('an unknown game result remains distinct from a confirmed connection',async()=>{
 const f=gameFixture('roulette');Object.assign(f.net,{connected:true,handshakeReady:true});const pending=f.api.checkGame();await tick();f.gate.resolve({status:'unknown',detail:'Подтверждение ставки пока не найдено.'});
 assert.equal(await pending,false);assert.equal(f.api.state().confirmed,true);assert.match(f.api.state().game.feedback,/не найдено/);assert.equal(f.calls.financial,0);
});
test('offline or signed-out users cannot invoke the read-only game checker',async()=>{
 const f=gameFixture();f.navigator.onLine=false;assert.equal(await f.api.checkGame(),false);f.navigator.onLine=true;f.auth.authenticated=false;f.auth.user=null;
 assert.equal(await f.api.checkGame(),false);assert.equal(f.gameCalls.reads,0);assert.equal(f.calls.financial,0);
});
test('a missing game controller never creates an alternative network route',async()=>{
 const f=gameFixture();delete f.window.JRVXCASV220.blackjack;f.api.sync();assert.equal(f.ids.get('jrvxConnectionGameCheckV332').disabled,true);assert.equal(await f.api.checkGame(),false);assert.equal(f.calls.financial,0);
});
test('a stalled game read is bounded and explicitly cancelled, then releases its controls',async()=>{
 const f=gameFixture();const pending=f.api.checkGame();await tick();f.runTimer(12000);assert.equal(await pending,false);assert.equal(f.gameCalls.cancel,1);assert.equal(f.api.state().game.busy,false);
 assert.match(f.api.state().game.feedback,/слишком долго/);f.gate.resolve({status:'confirmed',detail:'LATE'});await tick();assert.doesNotMatch(f.api.state().game.feedback,/LATE/);
});
test('A-B-A identity changes erase old feedback and fence the original game read',async()=>{
 const f=gameFixture();const pending=f.api.checkGame();await tick();f.auth.user={id:'B'};f.fireDocument('jrvx-cas-identity');f.auth.user={id:'A'};f.fireDocument('jrvx-cas-identity');
 assert.equal(await pending,false);f.gate.resolve({status:'confirmed',detail:'PREVIOUS OWNER'});await tick();assert.equal(f.api.state().game.feedback,'');assert.equal(f.gameCalls.cancel,1);
});
test('closing, hiding and destroying the dialog cancel a game read without late feedback',async()=>{
 for(const action of ['close','hidden','pagehide','destroy']){
  const f=gameFixture(),pending=f.api.checkGame();await tick();
  if(action==='close')f.opened.at(-1).options.onClose();
  else if(action==='hidden'){f.document.hidden=true;f.document.visibilityState='hidden';f.fireDocument('visibilitychange')}
  else if(action==='pagehide')f.fireWindow('pagehide');else f.api.destroy();
  assert.equal(await pending,false);assert.equal(f.gameCalls.cancel,1);f.gate.resolve({status:'confirmed',detail:'LATE'});await tick();assert.equal(f.api.state().game.feedback,'');assert.equal(f.calls.financial,0);
 }
});
test('returning from the background resumes UI polling without starting a game read',async()=>{
 const f=gameFixture();f.fireWindow('pagehide');f.fireWindow('pageshow');f.fireDocument('visibilitychange');await tick();assert.equal(f.gameCalls.reads,0);assert.equal(f.calls.financial,0);
});
test('an unexpected checker rejection remains retryable and never confirms a game',async()=>{
 const f=gameFixture(),pending=f.api.checkGame();await tick();f.gate.reject(Error('broken'));assert.equal(await pending,false);assert.equal(f.api.state().game.busy,false);assert.match(f.api.state().game.feedback,/Не удалось/);
 f.controller.recover=async()=>({status:'updated',detail:'Раздача обновлена.'});assert.equal(await f.api.checkGame(),true);assert.equal(f.calls.financial,0);
});
test('keyboard focus returns to the state button when its temporary disabled state caused blur',async()=>{
 const f=gameFixture(),button=f.ids.get('jrvxConnectionGameCheckV332');button.focus();const pending=f.api.checkGame();f.document.activeElement=f.document.body;
 await tick();f.gate.resolve({status:'confirmed',detail:'Подтверждено.'});assert.equal(await pending,true);assert.equal(f.document.activeElement,button);
});
test('finishing a game read never steals focus from another dialog control',async()=>{
 const f=gameFixture(),button=f.ids.get('jrvxConnectionGameCheckV332'),close=f.ids.get('jrvxConnectionCloseV329');button.focus();const pending=f.api.checkGame();close.focus();
 await tick();f.gate.resolve({status:'confirmed',detail:'Подтверждено.'});assert.equal(await pending,true);assert.equal(f.document.activeElement,close);
});
