const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_ONLINE_SOURCE || path.join(__dirname, '../public/modules/network/runtime/online-v325.js'), 'utf8');
const join = () => ({ type: 'poker_join', mode: 'online', tableId: '2-4', buyIn: 40 });
const tableState = (revision = 5, roomId = 'room-current') => ({
  authoritative: true, roomId, tableId: '1-2', currency: 'MS', mode: 'online', handNo: 3, revision,
  you: { id: 'player-A' }, seats: []
});

function fixture({ accepted = true, throwSend = false } = {}) {
  const nodes = new Map(), listeners = new Map(), sent = [], delivered = [];
  let clock = 100000, sendAccepted = accepted;
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      id, textContent: '', innerHTML: '', hidden: false, dataset: {}, offsetParent: null,
      classList: { add() {}, remove() {}, contains() { return true; } },
      querySelectorAll() { return []; }, setAttribute() {}, addEventListener() {}
    });
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
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }), setCurrency() {} },
    arcadeNetSend(command) {
      sent.push(command); if (throwSend) throw new Error('mock transport rejected'); return sendAccepted;
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
    setAccepted(value) { sendAccepted = value; }, advance(ms) { clock += ms; }
  };
}

test('a rejected join send does not block current-table updates or reconnect resume', () => {
  const f = fixture({ accepted: false });
  assert.equal(f.send(join()), false); assert.equal(f.api.diagnostics().pendingJoin, null);
  f.receive({ type: 'hello_ack', rooms: [] });
  assert.equal(f.receive({ type: 'poker_state', state: tableState(5) }), 'delivered');
  assert.equal(f.state.server.revision, 5);
  assert.equal(f.delivered.filter(message => message.type === 'poker_state').length, 1);
});

test('a send that throws cannot leave behind a join correlation fence', () => {
  const f = fixture({ throwSend: true });
  assert.throws(() => f.send(join()), /mock transport rejected/);
  assert.equal(f.api.diagnostics().pendingJoin, null);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 5);
});

test('a terminal join error restores uncorrelated authoritative updates immediately', async t => {
  for (const correlated of [true, false]) await t.test(correlated ? 'matching request ID' : 'legacy error without request ID', () => {
    const f = fixture(); assert.equal(f.send(join()), true);
    const pending = f.api.diagnostics().pendingJoin;
    assert.equal(pending.opId, f.sent[0].opId);
    f.receive({ type: 'poker_error', message: 'table_full', ...(correlated ? { requestId: pending.opId } : {}) });
    assert.equal(f.api.diagnostics().pendingJoin, null);
    assert.equal(f.delivered.at(-1).type, 'poker_error', 'The UI still receives the server error');
    f.receive({ type: 'hello_ack', rooms: [] });
    f.receive({ type: 'poker_state', state: tableState(5) });
    assert.equal(f.state.server.revision, 5);
  });
});

test('an accepted join still ignores unrelated snapshots until its correlated response', () => {
  const f = fixture(); f.send(join()); const pending = f.api.diagnostics().pendingJoin;
  assert.ok(pending); f.receive({ type: 'poker_state', state: tableState(5) });
  assert.equal(f.state.server.revision, 4); assert.equal(f.delivered.length, 0);
  f.receive({ type: 'poker_state', requestId: pending.opId, state: tableState(1, 'room-new') });
  assert.equal(f.api.diagnostics().pendingJoin, null); assert.equal(f.state.server.roomId, 'room-new');
});

test('an error for another request does not release the active join fence', () => {
  const f = fixture(); f.send(join()); const pending = f.api.diagnostics().pendingJoin;
  f.receive({ type: 'poker_error', requestId: 'different-request', message: 'invalid_action' });
  assert.equal(f.api.diagnostics().pendingJoin.opId, pending.opId);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 4);
});

test('a rejected second join preserves the first accepted operation and its response filter', () => {
  const f = fixture(); f.send(join()); const first = f.api.diagnostics().pendingJoin;
  f.setAccepted(false); f.advance(100); f.send({ ...join(), tableId: '5-10', buyIn: 100 });
  assert.equal(f.api.diagnostics().pendingJoin.opId, first.opId); assert.equal(f.api.diagnostics().pendingJoin.at, first.at);
  f.receive({ type: 'poker_state', requestId: first.opId, state: tableState(1, 'room-joined') });
  assert.equal(f.state.server.roomId, 'room-joined'); assert.equal(f.api.diagnostics().pendingJoin, null);
});

test('the existing 12-second fence expiry and room revision ordering remain intact', () => {
  const f = fixture(); f.send(join()); f.advance(12001);
  f.receive({ type: 'poker_state', state: tableState(6) });
  assert.equal(f.api.diagnostics().pendingJoin, null); assert.equal(f.state.server.revision, 6);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 6);
});
