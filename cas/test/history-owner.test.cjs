const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/modules/poker/runtime/poker-stability-v325.js'), 'utf8');
const A = 'JRVX-ABCD12345678', B = 'JRVX-EFGH87654321';

function hand(id = A, handNo = 1) {
  return { authoritative: true, roomId: 'room-a', tableId: '1-2', currency: 'MS', handNo, street: 'showdown',
    you: { id, hole: ['AS', 'AH'] }, community: ['2S', '3S', '4S', '5S', '6S'],
    lastResult: { winners: [id], pot: 50, text: 'Result for ' + id } };
}
function fixture(initial = { mode: 'production', requiresAuthentication: true, authenticated: true, user: { id: A } }) {
  let identity = initial;
  const records = new Map(), listeners = new Map();
  const ctx = { window: { JRVXCASIdentityV300: { state: () => identity }, JRVXCasEconomy: { get: () => ({ currency: 'MS' }) }, Poker59: { state: {} } },
    document: { readyState: 'loading', getElementById: () => null,
      addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); } },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    console, Date, Math, JSON };
  vm.createContext(ctx);
  // Exercise the real private recorder without installing a fake game engine.
  vm.runInContext(source.replace('window.JRVXCASV210={', 'window.__record=recordHand;window.JRVXCASV210={'), ctx);
  return { records, record: state => ctx.window.__record(state), history: () => ctx.window.JRVXCASV210.history(),
    identity(value) { identity = value; for (const fn of listeners.get('jrvx-cas-identity') || []) fn(); } };
}

test('a former account poker frame cannot enter the new account history or consume its dedupe key', () => {
  const f = fixture(); f.record(hand(A));
  assert.equal(f.history().length, 1);
  f.identity({ mode: 'production', requiresAuthentication: true, authenticated: true, user: { id: B } });
  f.record(hand(A));
  assert.equal(f.records.has('jrvxCasPokerHistoryV210:' + B), false, 'Foreign hole cards must not be persisted for the new owner');
  const current = hand(B); current.lastResult.text = hand(A).lastResult.text;
  f.record(current);
  assert.equal(f.history().length, 1, 'Rejecting a stale frame must leave the current hand recordable');
  assert.equal(f.history()[0].outcome, 'win');
  assert.equal(JSON.parse(f.records.get('jrvxCasPokerHistoryV210:' + A)).length, 1);
});

test('matching production hands are recorded once across repeated frames and identity refreshes', () => {
  const f = fixture(), state = hand(A); f.record(state); f.record(state);
  f.identity({ mode: 'production', requiresAuthentication: true, authenticated: true, user: { id: A } });
  f.record(state);
  assert.equal(f.history().length, 1);
  assert.equal(f.history()[0].result, state.lastResult.text);
});

test('signed-out production frames cannot write card history', () => {
  const f = fixture({ mode: 'production', requiresAuthentication: true, authenticated: false, user: null });
  f.record(hand(A));
  assert.equal(f.history().length, 0);
  assert.equal(f.records.size, 0);
});

test('offline development poker keeps its existing unscoped local history contract', () => {
  const f = fixture({ mode: 'development', requiresAuthentication: false, authenticated: false, user: null });
  f.record(hand('local-player'));
  assert.equal(f.history().length, 1);
  assert.equal(f.records.has('jrvxCasPokerHistoryV210'), true);
  assert.equal(f.history()[0].outcome, 'win');
});
