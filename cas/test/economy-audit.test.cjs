// Client contract checks with simulated API replies. They do not establish the
// absent production backend's ledger atomicity, balance rules or idempotency.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v328/casino.js'), 'utf8');
const A = 'JRVX-ABCD12345678', B = 'JRVX-EFGH87654321';
const drain = () => new Promise(resolve => setImmediate(resolve));
const idle = () => ({ hands: [], dealer: [], active: false, hand: 0, hideDealer: true, currency: 'MS' });
const card = r => ({ r, s: '♠' });
const settled = () => ({ state: { ...idle(), roundId: 1, hands: [{ cards: [card('A'), card('K')], bet: 50, done: true, profit: 75, outcome: 'win' }], dealer: [card('10'), card('7')] },
  version: 8, actionVersion: 8, roundId: 1, currency: 'MS', settlement: { profit: 75, results: [{ cards: [card('A'), card('K')], bet: 50, outcome: 'win', profit: 75 }], dealer: [card('10'), card('7')] } });

function fixture({ result = { state: idle(), version: 8, actionVersion: 8, currency: 'MS' }, holdAction = false, holdWallet = false } = {}) {
  const nodes = new Map(), records = new Map(), requests = [], listeners = new Map();
  let owner = A, currency = 'MS', actionMode = 'ok', serial = 0, walletCalls = 0, refreshes = 0, releaseAction, releaseWallet;
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {}, style: {},
      classList: { add() {}, remove() {}, toggle() {} }, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    return nodes.get(id);
  }
  const ctx = { window: { crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
      JRVXCASIdentityV300: { state: () => ({ mode: 'production', requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }), refresh: async () => { refreshes++; } },
      JRVXCasEconomy: { get: () => ({ currency }), setCurrency: value => { currency = value; } },
      JRVXCASServerAccount: { refresh: () => ++walletCalls === 1 && holdWallet ? new Promise(resolve => { releaseWallet = resolve; }) : Promise.resolve({ ok: true }) } },
    document: { readyState: 'loading', getElementById: node, querySelector: () => null, querySelectorAll: () => [],
      addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); } },
    sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    setTimeout() { return 1; }, clearTimeout() {}, navigator: {}, AbortController, console,
    rouletteBusy: false, rouletteState: {}, rouletteHistory: [], R_ORDER: [0, 1, 2, 3],
    casinoTakeBet() { assert.fail('Production must not debit a simulated local wallet'); },
    casinoReturn() { assert.fail('Production must not credit a simulated local wallet'); }, casinoRefresh() {},
    fetch: async (url, options = {}) => {
      requests.push({ url, body: options.body ? JSON.parse(options.body) : null });
      if (url === '/api/blackjack/state') return { ok: true, json: async () => ({ ok: true, state: idle(), version: 7 }) };
      assert(['/api/blackjack/action', '/api/roulette/spin'].includes(url));
      if (actionMode === 'error') throw Error('connection_lost');
      if (actionMode === 'owner-mismatch') return { ok: false, status: 409, json: async () => ({ ok: false, error: 'intent_owner_mismatch' }) };
      const response = { ok: true, json: async () => ({ ok: true, result }) };
      return holdAction ? new Promise(resolve => { releaseAction = () => resolve(response); }) : response;
    } };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  const api = ctx.window.JRVXCASV220.blackjack;
  Object.assign(api.state, { ...idle(), serverOwner: A, serverVersion: 7 });
  return { api, node, records, requests, spin: () => ctx.window.JRVXCASV220.roulette.spin(), setCurrency(value) { currency = value; }, mode(value) { actionMode = value; }, get refreshes() { return refreshes; },
    identity(value) { owner = value; for (const fn of listeners.get('jrvx-cas-identity') || []) fn(); },
    releaseAction() { releaseAction(); }, releaseWallet() { releaseWallet({ ok: true }); } };
}

test('production blackjack retains the complete original intent across uncertain retries and UI changes', async () => {
  const f = fixture(); f.mode('error'); await f.api.deal();
  const first = f.requests.find(row => row.body).body;
  f.node('bjBetInput').value = '300'; f.setCurrency('MG'); f.mode('ok'); await f.api.hit();
  const actions = f.requests.filter(row => row.url === '/api/blackjack/action');
  assert.equal(actions.length, 2); assert.deepEqual(actions[1].body, first);
  assert.equal(first.action, 'deal'); assert.equal(first.bet, 50); assert.equal(first.currency, 'MS');
  assert.equal(first.ownerId, A); assert.equal(first.expectedVersion, 7);
});

test('production blackjack sends no mutation without a confirmed identity', async () => {
  const f = fixture(); f.identity(null); await f.api.deal();
  assert.equal(f.requests.filter(row => row.url === '/api/blackjack/action').length, 0);
  assert.match(f.node('bjMessage').textContent, /Войдите через JRVX ID/);
});

test('an accepted blackjack settlement remains confirmed if optional local history is corrupt', async () => {
  const f = fixture({ result: settled() });
  f.records.set('jrvxCasBlackjackHistoryV220:' + A, '[null]');
  await f.api.deal();
  assert.equal(f.records.has('jrvxBlackjackPendingV302:' + A), false);
  assert.equal(f.api.state.active, false); assert.equal(f.api.state.serverVersion, 8);
  assert.match(f.node('bjMessage').textContent, /Раздача завершена: \+75 MS/);
  assert.doesNotMatch(f.node('bjMessage').textContent, /не подтвердил|тот же запрос/);
  const first = f.requests.find(row => row.body).body.actionId;
  await f.api.deal();
  const actions = f.requests.filter(row => row.url === '/api/blackjack/action');
  assert.notEqual(actions[1].body.actionId, first, 'A subsequent explicit Deal is a new acknowledged action');
});

test('an accepted settlement is recorded before an optional wallet refresh and cannot replay after another login', async () => {
  const f = fixture({ result: settled(), holdWallet: true });
  const work = f.api.deal(); await drain();
  assert.equal(f.api.state.serverVersion, 8); assert.equal(f.records.has('jrvxBlackjackPendingV302:' + A), false);
  const confirmedHistory = f.records.get('jrvxCasBlackjackHistoryV220:' + A);
  assert.equal(JSON.parse(confirmedHistory).length, 1);
  f.identity(B); f.identity(A); await drain(); f.releaseWallet(); await work;
  assert.equal(f.records.get('jrvxCasBlackjackHistoryV220:' + A), confirmedHistory);
  assert.equal(f.records.has('jrvxCasBlackjackHistoryV220:' + B), false);
  assert.equal(f.api.state.serverVersion, 7, 'The current login keeps its freshly loaded state');
});

test('a blackjack reply from an earlier owner cannot credit, render or clear the current owner intent', async () => {
  const f = fixture({ result: settled(), holdAction: true });
  const work = f.api.deal(); await drain();
  const oldIntent = f.records.get('jrvxBlackjackPendingV302:' + A);
  f.identity(B); await drain();
  const otherIntent = JSON.stringify({ ownerId: B, actionId: 'other-intent', action: 'deal', expectedVersion: 7 });
  f.records.set('jrvxBlackjackPendingV302:' + B, otherIntent);
  f.releaseAction(); await work;
  assert.equal(f.records.get('jrvxBlackjackPendingV302:' + A), oldIntent);
  assert.equal(f.records.get('jrvxBlackjackPendingV302:' + B), otherIntent);
  assert.equal(f.api.state.serverOwner, B); assert.equal(f.api.state.active, false);
  assert.equal(f.records.has('jrvxCasBlackjackHistoryV220:' + B), false);
});

const walletSource = fs.readFileSync(path.join(__dirname, '../public/modules/legacy/runtime/wallet-v327.js'), 'utf8');
function walletFixture({ storageFails = '', reply = 'ok', applyFails = false, refreshFails = false } = {}) {
  const nodes = new Map();
  const records = new Map(), requests = [], notices = [], listeners = [], timers = new Map(), applied = [];
  let owner = A, serial = 0, timerId = 0, responseMode = reply, refreshes = 0, release, signal;
  function node(id) {
    if (!nodes.has(id)) {
      const value = { id, value: id === 'v69ExchangeQty' ? '1' : '', disabled: false, dataset: {}, style: {}, innerHTML: '', textContent: '',
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, addEventListener() {},
        querySelector: () => null, querySelectorAll: () => [] };
      if (id === 'v69ToastText') {
        let text = ''; Object.defineProperty(value, 'textContent', { get: () => text,
          set(next) { text = next; notices.push([node('v69ToastTitle').textContent, next]); } });
      }
      nodes.set(id, value);
    }
    return nodes.get(id);
  }
  const response = () => ({ ok: true, json: async () => ({ ok: true, exchange: { costMS: 300, receivedMG: 1 } }) });
  const ctx = { window: { JRVXCASIdentityV300: { state: () => ({ authenticated: !!owner, requiresAuthentication: true, user: owner ? { id: owner } : null }), refresh: async () => { refreshes++; } },
      JRVXCASServerAccount: { apply: data => { if (applyFails) throw Error('wallet_render_failed'); applied.push(data); },
        refresh: () => refreshFails ? Promise.reject(Error('offline')) : Promise.resolve({ ok: true }) } },
    document: { body: node('body'), getElementById: node, querySelectorAll: () => [], querySelector: () => null,
      addEventListener: (type, fn) => { if (type === 'jrvx-cas-identity') listeners.push(fn); } },
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
    sessionStorage: { getItem(key) { if (storageFails === 'read') throw Error('SecurityError'); return records.get(key) ?? null; },
      setItem(key, value) { if (storageFails === 'write') throw Error('QuotaExceededError'); if (storageFails !== 'silent') records.set(key, value); },
      removeItem: key => records.delete(key) },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
    AbortController, console,
    fetch: async (url, options) => {
      assert.equal(url, '/api/wallet/exchange'); requests.push(JSON.parse(options.body)); signal = options.signal;
      if (responseMode === 'error') throw Error('connection_lost');
      if (responseMode === 'owner-mismatch') return { ok: false, status: 409, json: async () => ({ ok: false, error: 'intent_owner_mismatch' }) };
      if (responseMode === 'hang') return new Promise(() => {});
      if (responseMode === 'hold') return new Promise(resolve => { release = () => resolve(response()); });
      return response();
    } };
  ctx.window.scrollTo = () => {};
  vm.createContext(ctx); vm.runInContext(walletSource, ctx);
  assert.equal(typeof node('v69ExchangeBtn').onclick, 'function', 'The full replacement module binds the live exchange button');
  return { nodes, records, requests, notices, applied, exchange: () => node('v69ExchangeBtn').onclick(), mode(value) { responseMode = value; },
    identity(value) { owner = value; for (const fn of listeners) fn(); }, release() { release(); },
    timeout() { for (const [id, timer] of [...timers]) if (timer.ms === 12000) { timers.delete(id); timer.fn(); } }, get signal() { return signal; }, get refreshes() { return refreshes; } };
}

test('wallet exchange sends no mutation when storage reads, writes or verified persistence fail', async t => {
  for (const storageFails of ['read', 'write', 'silent']) await t.test(storageFails, async () => {
    const f = walletFixture({ storageFails }); await f.exchange();
    assert.equal(f.requests.length, 0); assert.match(f.notices.at(-1)[1], /не смог сохранить запрос обмена/);
    assert.equal(f.nodes.get('v69ExchangeBtn').disabled, false);
  });
});

test('wallet exchange preserves the complete operation after uncertain failure and changed quantity', async () => {
  const f = walletFixture({ reply: 'error' }); await f.exchange();
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), true);
  f.nodes.get('v69ExchangeQty').value = '30'; f.mode('ok'); await f.exchange();
  assert.deepEqual(f.requests[1], f.requests[0]); assert.equal(f.requests[1].quantity, 1);
  assert.equal(f.requests[1].ownerId, A, 'The server can reject an intent submitted under a later session owner');
  assert.equal(f.nodes.get('v69ExchangeQty').value, '1');
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), false);
});

test('wallet exchange timeout aborts, releases controls and keeps the same durable retry', async () => {
  const f = walletFixture({ reply: 'hang' }), work = f.exchange(); await drain();
  assert.equal(f.nodes.get('v69ExchangeBtn').disabled, true); f.timeout(); await work;
  assert.equal(f.signal.aborted, true); assert.equal(f.nodes.get('v69ExchangeBtn').disabled, false);
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), true);
  f.mode('ok'); await f.exchange(); assert.deepEqual(f.requests[1], f.requests[0]);
});

test('wallet exchange fails closed without a session and never replaces malformed saved intent', async () => {
  const guest = walletFixture(); guest.identity(null); await guest.exchange();
  assert.equal(guest.requests.length, 0); assert.match(guest.notices.at(-1)[1], /Войдите через JRVX ID/);
  const invalid = walletFixture(); invalid.records.set('jrvxWalletExchangePendingV302:' + A, JSON.stringify({ ownerId: A, quantity: 1 }));
  await invalid.exchange(); assert.equal(invalid.requests.length, 0);
  assert.match(invalid.notices.at(-1)[1], /не смог сохранить запрос обмена/);
});

test('optional wallet apply and refresh failures cannot turn an accepted exchange into a retry', async () => {
  const f = walletFixture({ applyFails: true, refreshFails: true }); await f.exchange(); await drain();
  assert.equal(f.requests.length, 1); assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), false);
  assert.equal(f.notices.at(-1)[0], 'Обмен выполнен'); assert.match(f.notices.at(-1)[1], /300 MS.*1 MG/);
  assert.equal(f.nodes.get('v69ExchangeBtn').disabled, false);
});

test('wallet exchange rejects overlapping clicks and late results after an A-B-A account transition', async () => {
  const f = walletFixture({ reply: 'hold' }), work = f.exchange(); await drain();
  await f.exchange(); assert.equal(f.requests.length, 1);
  f.identity(B); f.identity(A); f.release(); await work;
  assert.equal(f.applied.length, 0); assert.equal(f.notices.length, 0);
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), true, 'An earlier login cannot settle the new login UI');
  assert.equal(f.nodes.get('v69ExchangeBtn').disabled, false);
});

test('a same-owner identity refresh keeps the current wallet exchange valid', async () => {
  const f = walletFixture({ reply: 'hold' }), work = f.exchange(); await drain();
  f.identity(A); f.release(); await work;
  assert.equal(f.applied.length, 1); assert.equal(f.notices.at(-1)[0], 'Обмен выполнен');
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), false);
});

test('a server owner mismatch preserves the original blackjack intent and refreshes identity', async () => {
  const f = fixture(); f.mode('owner-mismatch'); await f.api.deal();
  assert.equal(f.records.has('jrvxBlackjackPendingV302:' + A), true);
  assert.match(f.node('bjMessage').textContent, /Аккаунт изменился/); assert.equal(f.refreshes, 1);
  assert.equal(f.node('bjDeal').disabled, false);
});

test('a server owner mismatch preserves the original roulette intent and refreshes identity', async () => {
  const f = fixture(); f.mode('owner-mismatch'); await f.spin();
  assert.equal(f.records.has('jrvxRoulettePendingV302:' + A), true);
  assert.match(f.node('rouletteMessage').textContent, /Аккаунт изменился/); assert.equal(f.refreshes, 1);
  assert.equal(f.node('rouletteSpin').disabled, false);
});

test('a server owner mismatch preserves the original wallet intent and refreshes identity', async () => {
  const f = walletFixture({ reply: 'owner-mismatch' }); await f.exchange();
  assert.equal(f.records.has('jrvxWalletExchangePendingV302:' + A), true);
  assert.equal(f.notices.at(-1)[0], 'Аккаунт изменился'); assert.equal(f.refreshes, 1);
  assert.equal(f.nodes.get('v69ExchangeBtn').disabled, false);
});
