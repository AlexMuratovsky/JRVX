const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_ONLINE_SOURCE || path.join(__dirname, '../public/modules/network/runtime/online-v331.js'), 'utf8');
const join = (tableId = '2-4', buyIn = 40) => ({ type: 'poker_join', mode: 'online', tableId, buyIn });
const tableState = (revision = 5, roomId = 'room-current') => ({
  authoritative: true, roomId, tableId: '1-2', currency: 'MG', mode: 'online', handNo: 3, revision,
  you: { id: 'player-A' }, seats: []
});

// Exercise the shipped wrapper and its transport boundary. No game/ledger is
// simulated: outgoing operations are captured, while real server messages feed
// its correlation/reconnect handlers. All network access is forbidden.
function fixture({ accepted = true, throwSend = false } = {}) {
  const nodes = new Map(), listeners = new Map(), sent = [], delivered = [];
  let clock = 100000, sendAccepted = accepted, sendThrows = throwSend, owner = 'player-A';
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'poker' ? ['active'] : []);
      nodes.set(id, {
        id, textContent: '', innerHTML: '', hidden: false, dataset: {}, offsetParent: null,
        classList: { add(...names) { names.forEach(name => classes.add(name)); }, remove(...names) { names.forEach(name => classes.delete(name)); }, contains(name) { return classes.has(name); } },
        querySelectorAll() { return []; }, setAttribute() {}, addEventListener() {}
      });
    }
    return nodes.get(id);
  }
  const current = tableState(4), state = { server: current, game: null };
  const ctx = {
    console, Date: class extends Date { static now() { return clock; } },
    setTimeout() { return 1; }, setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame() {},
    fetch() { throw new Error('Poker recovery tests must never make network requests'); },
    document: {
      readyState: 'loading', getElementById: node, querySelector() { return null; }, querySelectorAll() { return []; },
      addEventListener(type, fn) { listeners.set(type, fn); }
    }
  };
  ctx.window = {
    JRVXCASMoneyV330: require('../public/modules/core/runtime/money-v330.js'),
    arcadeNetState: { connected: true, poker: current }, Poker59: { state },
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }) },
    JRVXCasEconomy: { get: () => ({ currency: 'MG' }), setCurrency() {} },
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
    setOwner(value) { owner = value; listeners.get('jrvx-cas-identity')?.({ type: 'jrvx-cas-identity' }); },
    setAccepted(value) { sendAccepted = value; }, setThrow(value) { sendThrows = value; },
    net: ctx.window.arcadeNetState, advance(ms) { clock += ms; }
  };
}

for (const code of ['balance_limit', 'economy_draining']) {
  for (const correlated of [true, false]) {
    test(`${code}: ${correlated ? 'correlated' : 'legacy uncorrelated'} refusal releases only the rejected join and accepts immediate server resume`, () => {
      const f = fixture(); f.send(join()); const operationId = f.sent.at(-1).opId;
      f.receive({ type: 'poker_error', message: code, ...(correlated ? { requestId: operationId } : {}) });
      assert.equal(f.api.diagnostics().pendingJoin, null);
      assert.equal(f.api.diagnostics().pendingOps.length, 0);
      assert.equal(f.delivered.at(-1).message, code, 'The ordinary UI still receives the server refusal');
      assert.equal(f.receive({ type: 'poker_state', state: tableState(5) }), 'delivered');
      assert.equal(f.state.server.revision, 5, 'An explicit refusal must not leave the old table frozen for 12 seconds');
      f.advance(1000); f.send(join());
      assert.notEqual(f.sent.at(-1).opId, operationId, 'The next user-requested seating attempt is a fresh operation');
    });
  }

  test(`${code}: an error for another request preserves the current join and its retry identity`, () => {
    const f = fixture(); f.send(join()); const operationId = f.sent.at(-1).opId;
    f.receive({ type: 'poker_error', message: code, requestId: 'unrelated-operation' });
    assert.equal(f.api.diagnostics().pendingJoin.opId, operationId);
    assert.equal(f.api.diagnostics().pendingOps.length, 1);
    f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 4);
    f.advance(1000); f.send(join()); assert.equal(f.sent.at(-1).opId, operationId);
    f.receive({ type: 'poker_state', requestId: operationId, state: tableState(1, 'room-joined') });
    assert.equal(f.state.server.roomId, 'room-joined'); assert.equal(f.api.diagnostics().pendingJoin, null);
  });
}

test('a refusal in the protocol error field is classified like a message field', () => {
  const f = fixture(); f.send(join()); const requestId = f.sent.at(-1).opId;
  f.receive({ type: 'poker_error', error: 'balance_limit', requestId });
  assert.equal(f.api.diagnostics().pendingJoin, null);
  assert.equal(f.api.diagnostics().pendingOps.length, 0);
});

test('legacy refusal without an ID clears the active join but preserves unrelated uncertain actions', () => {
  const f = fixture(); f.send({ type: 'poker_rebuy', amount: 100 }); const rebuyId = f.sent.at(-1).opId;
  f.send(join()); const joinId = f.sent.at(-1).opId;
  f.receive({ type: 'poker_error', message: 'balance_limit' });
  assert.equal(f.api.diagnostics().pendingJoin, null);
  assert.deepEqual(Array.from(f.api.diagnostics().pendingOps, record => record.opId), [rebuyId]);
  assert.notEqual(rebuyId, joinId);
});

test('a correlated older join refusal cannot release a newer accepted join', () => {
  const f = fixture(); f.send(join()); const olderId = f.sent.at(-1).opId;
  f.advance(100); f.send(join('5-10', 100)); const newerId = f.sent.at(-1).opId;
  f.receive({ type: 'poker_error', message: 'economy_draining', requestId: olderId });
  assert.equal(f.api.diagnostics().pendingJoin.opId, newerId);
  assert.deepEqual(Array.from(f.api.diagnostics().pendingOps, record => record.opId), [newerId]);
});

for (const code of ['server_error', 'request_timeout', 'command_outcome_unknown', 'receipt_capacity']) {
  test(`${code}: an uncertain outcome keeps the same operation across reconnect and retry`, () => {
    const f = fixture(); f.send(join()); const operationId = f.sent.at(-1).opId;
    f.receive({ type: 'poker_error', message: code, requestId: operationId });
    f.net.connected = false; f.receive({ type: 'connection_closed' });
    f.net.connected = true; f.receive({ type: 'hello_ack', rooms: [] });
    assert.equal(f.api.diagnostics().pendingJoin.opId, operationId);
    f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 4);
    f.advance(1000); f.send(join()); assert.equal(f.sent.at(-1).opId, operationId);
    f.receive({ type: 'poker_state', requestId: operationId, state: tableState(1, 'room-restored') });
    assert.equal(f.state.server.roomId, 'room-restored'); assert.equal(f.api.diagnostics().pendingOps.length, 0);
  });
}

test('a rejected send cannot create a join fence or suppress the current authoritative table', () => {
  const f = fixture({ accepted: false }); assert.equal(f.send(join()), false);
  assert.equal(f.api.diagnostics().pendingJoin, null);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 5);
});

test('a throwing send cannot create a join fence or suppress resume', () => {
  const f = fixture({ throwSend: true }); assert.throws(() => f.send(join()), /mock transport rejected/);
  assert.equal(f.api.diagnostics().pendingJoin, null);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 5);
});

test('a rejected second send preserves the first accepted join fence', () => {
  const f = fixture(); f.send(join()); const operationId = f.sent.at(-1).opId;
  f.setAccepted(false); f.advance(100); assert.equal(f.send(join('5-10', 100)), false);
  assert.equal(f.api.diagnostics().pendingJoin.opId, operationId);
  f.receive({ type: 'poker_state', requestId: operationId, state: tableState(1, 'room-first') });
  assert.equal(f.state.server.roomId, 'room-first');
});

test('the existing bounded resume fence and revision ordering survive unknown outcomes', () => {
  const f = fixture(); f.send(join()); f.receive({ type: 'poker_error', message: 'server_error' }); f.advance(12001);
  f.receive({ type: 'poker_state', state: tableState(6) });
  assert.equal(f.api.diagnostics().pendingJoin, null); assert.equal(f.state.server.revision, 6);
  f.receive({ type: 'poker_state', state: tableState(5) }); assert.equal(f.state.server.revision, 6);
});

test('account changes retire only the previous owner intents before a late refusal', () => {
  const f = fixture(); f.send(join()); const operationId = f.sent.at(-1).opId;
  f.setOwner('player-B');
  assert.equal(f.api.diagnostics().pendingJoin, null); assert.equal(f.api.diagnostics().pendingOps.length, 0);
  f.receive({ type: 'poker_error', message: 'balance_limit', requestId: operationId });
  assert.equal(f.api.diagnostics().pendingJoin, null); assert.equal(f.api.diagnostics().pendingOps.length, 0);
});
