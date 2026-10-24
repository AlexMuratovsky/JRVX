const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_ONLINE_SOURCE || path.join(__dirname, '../public/modules/network/runtime/online-v327.js'), 'utf8');
const join = () => ({ type: 'poker_join', mode: 'online', tableId: '2-4', buyIn: 40 });
const tableState = (revision = 5, roomId = 'room-current') => ({
  authoritative: true, roomId, tableId: '1-2', currency: 'MS', mode: 'online', handNo: 3, revision,
  you: { id: 'player-A' }, seats: []
});

function fixture({ accepted = true, throwSend = false } = {}) {
  const nodes = new Map(), listeners = new Map(), sent = [], delivered = [];
  let clock = 100000, sendAccepted = accepted, sendThrows = throwSend, owner = 'player-A';
  function node(id) {
    if (!nodes.has(id)) { const classes=new Set(id==='poker'?['active']:[]); nodes.set(id, {
      id, textContent: '', innerHTML: '', hidden: false, dataset: {}, offsetParent: null,
      classList: { add(...names) {names.forEach(name=>classes.add(name));}, remove(...names) {names.forEach(name=>classes.delete(name));}, contains(name) {return classes.has(name);} },
      querySelectorAll() { return []; }, setAttribute() {}, addEventListener() {}
    }); }
    return nodes.get(id);
  }
  const current = tableState(4), state = { server: current, game: null };
  const ctx = {
    console, Date: class extends Date { static now() { return clock; } },
    setTimeout() { return 1; }, setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame() {},
    fetch() { throw new Error('Online recovery tests must never make network requests'); },
    document: {
      readyState: 'loading', getElementById: node, querySelector() { return null; }, querySelectorAll() { return []; },
      addEventListener(type, fn) { listeners.set(type, fn); }
    }
  };
  ctx.window = {
    arcadeNetState: { connected: true, poker: current }, Poker59: { state },
    JRVXCASIdentityV300: { state: () => ({requiresAuthentication:true,authenticated:!!owner,user:owner?{id:owner}:null}) },
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }), setCurrency() {} },
    arcadeNetSend(command) {
      sent.push(command); if (sendThrows) throw new Error('mock transport rejected'); return sendAccepted;
    },
    handleArcadeNetMessage(message) {
      delivered.push(message);
      if (message.type === 'poker_state') { ctx.window.arcadeNetState.poker = message.state; state.server = message.state; }
      return 'delivered';
    }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); listeners.get('DOMContentLoaded')();
  return {
    send: command => ctx.window.arcadeNetSend(command), receive: message => ctx.window.handleArcadeNetMessage(message),
    api: ctx.window.JRVXCASV250, state, sent, delivered,
    setOwner(value) { owner=value; listeners.get('jrvx-cas-identity')?.({type:'jrvx-cas-identity'}); },
    setAccepted(value) { sendAccepted = value; }, setThrow(value) { sendThrows=value; },
    node, net: ctx.window.arcadeNetState, advance(ms) { clock += ms; }
  };
}




// These exercise the active wrapper and realistic transport/server messages.
// They never send network requests, mutate real wallets, or simulate game rules.

test('acknowledging a join retires only that exact completed intent', () => {
 const f=fixture();f.send(join());const id=f.sent.at(-1).opId;
 assert.equal(f.api.diagnostics().pendingOps.length,1);
 f.receive({type:'poker_state',requestId:id,state:tableState(5,'room-one')});
 assert.equal(f.api.diagnostics().pendingOps.length,0);
 assert.equal(f.api.diagnostics().pendingJoin,null);
});

test('completed join, leave and same-table join starts a fresh seating operation', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.receive({type:'poker_state',requestId:first,state:tableState(5,'room-one')});
 f.send({type:'poker_leave'});const leave=f.sent.at(-1).opId;
 f.receive({type:'poker_state',requestId:leave,state:null});
 f.advance(1000);f.send(join());
 assert.notEqual(f.sent.at(-1).opId,first,'new seating must not replay the completed backend buy-in receipt');
});

test('an explicit leave ends even an unacknowledged join lifecycle', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.send({type:'poker_leave'});f.advance(1000);f.send(join());
 assert.notEqual(f.sent.at(-1).opId,first);
});

test('retries of a join with an uncertain outcome preserve its operation ID', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.advance(1000);f.receive({type:'poker_error',requestId:first,message:'server_error'});f.send(join());
 assert.equal(f.sent.at(-1).opId,first);assert.equal(f.api.diagnostics().pendingJoin.opId,first);
});

test('a definitive join rejection allows a fresh retry, including legacy errors without correlation', () => {
 for(const correlated of [true,false]){
  const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
  f.receive({type:'poker_error',message:'table_full',...(correlated?{requestId:first}:{})});
  assert.equal(f.api.diagnostics().pendingJoin,null);f.advance(1000);f.send(join());
  assert.notEqual(f.sent.at(-1).opId,first);
 }
});

test('an error for another request preserves the accepted join and its retry ID', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;
 f.receive({type:'poker_error',requestId:'another-operation',message:'invalid_action'});f.send(join());
 assert.equal(f.sent.at(-1).opId,first);assert.equal(f.api.diagnostics().pendingJoin.opId,first);
});

test('rejected and throwing leave sends cannot hide the current seated state or fence its updates', () => {
 for(const throwing of [false,true]){
  const f=fixture({accepted:!throwing});f.setAccepted(false);f.setThrow(throwing);
  if(throwing)assert.throws(()=>f.send({type:'poker_leave'}),/mock transport rejected/);
  else assert.equal(f.send({type:'poker_leave'}),false);
  assert.equal(f.net.poker.roomId,'room-current');
  f.receive({type:'poker_state',state:tableState(5)});assert.equal(f.state.server.revision,5);
 }
});

test('a rejected join cannot cancel an earlier accepted leave fence', () => {
 const f=fixture();f.send({type:'poker_leave'});f.setAccepted(false);f.send(join());
 f.receive({type:'poker_state',state:tableState(5)});
 assert.equal(f.net.poker,null);assert.equal(f.delivered.length,0);
});

test('a same-owner identity refresh retains the pending join and accepted leave fence', () => {
 const joiner=fixture();joiner.send(join());const id=joiner.sent.at(-1).opId;joiner.setOwner('player-A');joiner.send(join());
 assert.equal(joiner.sent.at(-1).opId,id);
 const leaver=fixture();leaver.send({type:'poker_leave'});leaver.setOwner('player-A');leaver.receive({type:'poker_state',state:tableState(5)});
 assert.equal(leaver.net.poker,null);assert.equal(leaver.delivered.length,0);
});

test('an account change clears the old leave fence and resumes the new account seat', () => {
 const f=fixture();f.send({type:'poker_leave'});f.receive({type:'poker_state',state:null});f.setOwner('player-B');
 f.receive({type:'poker_state',state:{...tableState(6),you:{id:'player-B'}}});
 assert.equal(f.state.server.you.id,'player-B');
});

test('old-account seated snapshots are ignored before any revision or UI mutation', () => {
 const f=fixture();f.setOwner('player-B');
 f.receive({type:'poker_state',state:{...tableState(6),you:{id:'player-B'}}});
 const count=f.delivered.length;const revisions=JSON.stringify(f.api.diagnostics().lastRevision);
 assert.equal(f.receive({type:'poker_state',state:tableState(999)}),false);
 assert.equal(f.state.server.you.id,'player-B');assert.equal(f.delivered.length,count);
 assert.equal(JSON.stringify(f.api.diagnostics().lastRevision),revisions);
});

test('an account change removes old pending joins and does not send them as the new account', () => {
 const f=fixture();f.send(join());const first=f.sent.at(-1).opId;const count=f.sent.length;
 f.setOwner('player-B');assert.equal(f.api.diagnostics().pendingJoin,null);assert.equal(f.api.diagnostics().pendingOps.length,0);
 assert.equal(f.sent.length,count);f.send(join());assert.notEqual(f.sent.at(-1).opId,first);
 f.setOwner('player-A');f.send(join());assert.notEqual(f.sent.at(-1).opId,first);
});

test('an equal-revision room broadcast cannot settle an unacknowledged action', () => {
 const f=fixture();f.send({type:'poker_action',action:'call'});const id=f.sent.at(-1).actionId;
 f.receive({type:'poker_state',state:tableState(4)});f.send({type:'poker_action',action:'call'});
 assert.equal(f.sent.at(-1).actionId,id);
 f.receive({type:'poker_state',requestId:id,state:tableState(5)});
 assert.equal(f.api.diagnostics().pendingOps.length,0);
});

test('an advancing authoritative revision settles preceding actions in that exact room', () => {
 const f=fixture();f.send({type:'poker_action',action:'call'});
 f.receive({type:'poker_state',state:tableState(5)});assert.equal(f.api.diagnostics().pendingOps.length,0);
});


test('changing owner closes old spectator and invite UI without sending an old-owner unwatch', () => {
 const f=fixture();f.api.watchRoom('room-one');
 f.receive({type:'spectator_state',state:{...tableState(5,'room-one'),you:null}});
 f.receive({type:'poker_invite',fromNickname:'A friend',roomId:'room-invited',tableId:'1-2',currency:'MS'});
 assert.equal(f.node('v250Spectator').classList.contains('active'),true);assert.equal(f.node('v250Invite').hidden,false);
 const count=f.sent.length;f.setOwner('player-B');
 assert.equal(f.node('v250Spectator').classList.contains('active'),false);assert.equal(f.node('v250Invite').hidden,true);
 assert.equal(f.sent.length,count,'identity reset must not run an unsubscribe against the new owner session');
 f.receive({type:'spectator_state',state:{...tableState(999,'room-one'),you:null}});
 assert.equal(f.node('v250Spectator').classList.contains('active'),false);
});
