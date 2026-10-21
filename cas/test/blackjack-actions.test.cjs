const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v322/casino.js'), 'utf8');
const drain = () => new Promise(resolve => setImmediate(resolve));
const ids = { deal: 'bjDeal', hit: 'bjHit', stand: 'bjStand', double: 'bjDouble', split: 'bjSplit', insurance: 'bjInsurance' };
const card = (r, s = '♠') => ({ r, s });
const hand = (cards = [card('8'), card('8', '♥')], extra = {}) => ({ cards, bet: 50, done: false, doubled: false, fromSplit: false, ...extra });
const idle = () => ({ hands: [], dealer: [], active: false, hand: 0, hideDealer: true, insuranceOffered: false, insuranceResolved: true, currency: 'MS' });
const active = (extra = {}) => ({ ...idle(), hands: [hand()], dealer: [card('A'), card('9', '♥')], active: true, ...extra });

async function fixture(view, { holdAction = false } = {}) {
  const nodes = new Map(), listeners = new Map(), records = new Map(), requests = [], timers = new Map();
  let timerId = 0, operationId = 0, releaseAction;
  function node(id) {
    if (!nodes.has(id)) {
      const item = { id, value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {}, style: {},
        classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
        querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
      item.click = () => item.disabled ? undefined : item.onclick?.();
      nodes.set(id, item);
    }
    return nodes.get(id);
  }
  const currencies = [node('currencyMS'), node('currencyMG')];
  const chips = [10, 50, 100].map(amount => { const button = node('chip' + amount); button.dataset.bjBet = String(amount); return button; });
  const owner = 'JRVX-ABCD12345678';
  const response = state => ({ ok: true, json: async () => ({ ok: true, result: { state, version: 8, actionVersion: 8, currency: 'MS' } }) });
  const ctx = {
    console, Number, String, JSON, Error, Map, Set, Promise, AbortController, navigator: {},
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    document: {
      readyState: 'loading', getElementById: node, querySelector: () => null,
      querySelectorAll: selector => selector === '#blackjack .v69GameCurrency button' ? currencies : selector === '[data-bj-bet]' ? chips : [],
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); }
    },
    fetch: async (url, options = {}) => {
      requests.push({ url, method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null });
      if (url === '/api/blackjack/state') return { ok: true, json: async () => ({ ok: true, state: view, version: 7 }) };
      assert.equal(url, '/api/blackjack/action', 'No real request or unexpected endpoint');
      if (holdAction) return new Promise(resolve => { releaseAction = state => resolve(response(state)); });
      return response(view);
    },
    casinoRefresh() {}
  };
  ctx.window = {
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++operationId).padStart(12, '0')}` },
    JRVXCASIdentityV300: { state: () => ({ authenticated: true, requiresAuthentication: true, mode: 'production', user: { id: owner } }) },
    JRVXCASServerAccount: { refresh: async () => ({ ok: true }) },
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }), setCurrency() {} }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  const boot = listeners.get('DOMContentLoaded').find(fn => fn.name === 'bindV242Blackjack');
  assert.ok(boot, 'The production blackjack binder is installed'); boot(); await drain();
  return { nodes, node, requests, currencies, chips, owner, api: ctx.window.JRVXCASV220.blackjack,
    release(state = view) { assert.equal(typeof releaseAction, 'function'); releaseAction(state); } };
}

test('each blackjack button reaches its matching server action with a durable operation ID', async t => {
  for (const [action, id] of Object.entries(ids)) {
    await t.test(action, async () => {
      const f = await fixture(action === 'deal' ? idle() : active({ insuranceOffered: true, insuranceResolved: false }));
      const button = f.node(id); assert.equal(button.disabled, false); assert.equal(typeof button.onclick, 'function');
      await button.click();
      const calls = f.requests.filter(request => request.url === '/api/blackjack/action');
      assert.equal(calls.length, 1); assert.equal(calls[0].method, 'POST');
      const intent = calls[0].body;
      assert.equal(intent.action, action); assert.equal(intent.ownerId, f.owner); assert.equal(intent.expectedVersion, 7);
      assert.match(intent.actionId, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
      if (action === 'deal') { assert.equal(intent.bet, 50); assert.equal(intent.currency, 'MS'); }
      else { assert.equal(intent.bet, undefined); assert.equal(intent.currency, undefined); }
    });
  }
});

function assertEnabled(f, expected, label) {
  const actual = Object.entries(ids).filter(([, id]) => !f.node(id).disabled).map(([action]) => action);
  assert.deepEqual(actual, expected, label);
}
test('blackjack controls reflect the server hand, insurance offer and split limit', async () => {
  assertEnabled(await fixture(idle()), ['deal'], 'Before dealing');
  assertEnabled(await fixture(active()), ['hit', 'stand', 'double', 'split'], 'Pair before the first action');
  assertEnabled(await fixture(active({ hands: [hand([card('8'), card('7', '♥')])] })), ['hit', 'stand', 'double'], 'Non-pair');
  assertEnabled(await fixture(active({ hands: [hand([card('8'), card('7', '♥'), card('2')])] })), ['hit', 'stand'], 'Third card');
  assertEnabled(await fixture(active({ hands: [hand(undefined, { done: true })] })), [], 'Completed current hand');
  assertEnabled(await fixture(active({ hands: [hand(), hand(), hand(), hand()] })), ['hit', 'stand', 'double'], 'Four-hand split limit');
  assertEnabled(await fixture(active({ insuranceOffered: true, insuranceResolved: false })), ['hit', 'stand', 'double', 'split', 'insurance'], 'Open insurance offer');
  assertEnabled(await fixture(active({ insuranceOffered: true, insuranceResolved: true })), ['hit', 'stand', 'double', 'split'], 'Resolved insurance offer');
  assertEnabled(await fixture(active({ active: false })), ['deal'], 'Round settled');
});

test('all six blackjack actions lock during a request and restore from the confirmed hand', async () => {
  const f = await fixture(active({ insuranceOffered: true, insuranceResolved: false }), { holdAction: true });
  const work = f.node('bjHit').click(); await drain();
  assertEnabled(f, [], 'Every action is disabled while the server confirms');
  assert.equal(f.currencies.every(button => button.disabled), true);
  for (const id of Object.values(ids)) f.node(id).click();
  assert.equal(f.requests.filter(request => request.url === '/api/blackjack/action').length, 1, 'Disabled controls cannot create parallel actions');
  f.release(active({ hands: [hand([card('8'), card('8', '♥'), card('2')])] })); await work;
  assertEnabled(f, ['hit', 'stand'], 'Confirmed three-card hand restores only legal actions');
});

test('blackjack amount and quick chips freeze while Deal is pending, then unlock for the next round', async () => {
  const f = await fixture(idle(), { holdAction: true });
  assert.equal(f.node('bjBetInput').disabled, false); assert.equal(f.chips.every(button => !button.disabled), true);
  const work = f.node('bjDeal').click(); await drain();
  assert.equal(f.node('bjBetInput').disabled, true); assert.equal(f.chips.every(button => button.disabled), true);
  for (const chip of f.chips) chip.click();
  assert.equal(f.node('bjBetInput').value, '50', 'A pending Deal retains its displayed amount');
  f.release(idle()); await work;
  assert.equal(f.node('bjBetInput').disabled, false); assert.equal(f.chips.every(button => !button.disabled), true);
  const playing = await fixture(active());
  assert.equal(playing.node('bjBetInput').disabled, true); assert.equal(playing.chips.every(button => button.disabled), true);
});

test('blackjack rejects fractional, odd and out-of-range amounts before sending a Deal', async () => {
  for (const value of ['50.5', '51', '0', '2.5', '1000002', 'NaN', '']) {
    const f = await fixture(idle()); f.node('bjBetInput').value = value; await f.node('bjDeal').click();
    assert.equal(f.requests.filter(request => request.url === '/api/blackjack/action').length, 0, value);
    assert.match(f.node('bjMessage').textContent, /чётную целую ставку/);
    assert.equal(f.node('bjBetInput').disabled, false);
  }
  for (const value of ['2', '1000000']) {
    const f = await fixture(idle()); f.node('bjBetInput').value = value; await f.node('bjDeal').click();
    assert.equal(f.requests.find(request => request.url === '/api/blackjack/action').body.bet, Number(value));
  }
});
