const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v328/casino.js'), 'utf8');
const drain = () => new Promise(resolve => setImmediate(resolve));
const OWNER = 'JRVX-ABCD12345678';
const card = r => ({ r, s: '♠' });
const idle = () => ({ hands: [], dealer: [], active: false, hand: 0, hideDealer: true, currency: 'MS' });
const active = () => ({ ...idle(), active: true, roundId: 4,
  hands: [{ cards: [card('8'), card('9')], bet: 50, done: false }], dealer: [card('10'), card('7')] });
const settled = () => ({ state: { ...active(), active: false, hideDealer: false }, version: 8,
  actionVersion: 8, currency: 'MS', roundId: 4, settlement: { profit: 50,
    results: [{ cards: [card('10'), card('9')], bet: 50, outcome: 'win', profit: 50 }], dealer: [card('10'), card('7')] } });

function fixture({ view = idle(), visible = false, currency = 'MG', holdWallet = false, corruptHistory = null } = {}) {
  const nodes = new Map(), records = new Map(), listeners = new Map(), requests = [], walletReads = [];
  let selected = currency, result = settled(), serial = 0, booted = false;
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'blackjack' && visible ? ['active'] : []);
      nodes.set(id, { id, value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {}, style: {},
        classList: { contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name),
          toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); } },
        querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    }
    return nodes.get(id);
  }
  if (corruptHistory !== null) records.set('jrvxCasBlackjackHistoryV220:' + OWNER, corruptHistory);
  const ctx = { console, AbortController, navigator: {}, setTimeout() { return 1; }, clearTimeout() {},
    document: { readyState: 'loading', getElementById: node, querySelector: () => null, querySelectorAll: () => [],
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); } },
    sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    casinoRefresh() {}, muraTokenBalance: () => selected === 'MG' ? 10 : 1000,
    fetch: async (url, options = {}) => {
      requests.push({ url, body: options.body ? JSON.parse(options.body) : null });
      if (url === '/api/blackjack/state') return { ok: true, json: async () => ({ ok: true, state: view, version: 7 }) };
      assert.equal(url, '/api/blackjack/action', 'All account/wager traffic remains simulated');
      return { ok: true, json: async () => ({ ok: true, result }) };
    } };
  ctx.window = { crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
    JRVXCASIdentityV300: { state: () => ({ mode: 'production', requiresAuthentication: true, authenticated: true, user: { id: OWNER } }) },
    JRVXCasEconomy: { get: () => ({ currency: selected }), setCurrency: value => { selected = value; }, balance: value => value === 'MG' ? 10 : 1000 },
    JRVXCASServerAccount: { refresh: () => holdWallet ? new Promise(resolve => walletReads.push(resolve)) : Promise.resolve({ ok: true }) } };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  const api = ctx.window.JRVXCASV220.blackjack;
  return { api, node, records, requests, walletReads,
    get currency() { return selected; },
    boot() { assert.equal(booted, false); booted = true; listeners.get('DOMContentLoaded').find(fn => fn.name === 'bindV242Blackjack')(); },
    identityRefresh() { for (const fn of listeners.get('jrvx-cas-identity') || []) fn(); },
    setResult(value) { result = value; } };
}

test('an idle blackjack snapshot does not change the currency selected for another game', async () => {
  const f = fixture(); f.boot(); await drain();
  assert.equal(f.api.state.serverVersion, 7);
  assert.equal(f.currency, 'MG');
  f.identityRefresh(); await drain();
  assert.equal(f.currency, 'MG', 'The periodic identity refresh cannot switch an MG wager to MS');
});

test('a hidden active blackjack hand keeps its own MS labels without changing another game currency', async () => {
  const f = fixture({ view: active() }); f.boot(); await drain();
  assert.equal(f.currency, 'MG');
  assert.equal(f.node('bjCurrentBet').textContent, '50 MS');
  assert.equal(f.node('blackjackBalance').textContent, '1 000 MS');
  assert.match(f.node('v220BjHands').innerHTML, /50 MS/);
});

test('resuming a visible active blackjack hand restores its actual server currency', async () => {
  const f = fixture({ view: active(), visible: true }); f.boot(); await drain();
  assert.equal(f.currency, 'MS');
  assert.equal(f.node('bjCurrentBet').textContent, '50 MS');
});

test('a visible finished hand keeps its historical currency while the next stake uses the selected currency', async () => {
  const f = fixture({ view: settled().state, visible: true }); f.boot(); await drain();
  assert.equal(f.currency, 'MG');
  assert.equal(f.node('bjCurrentBet').textContent, '50 MG');
  assert.equal(f.node('blackjackBalance').textContent, '10 MG');
  assert.match(f.node('v220BjHands').innerHTML, /50 MS/);
});

test('a confirmed blackjack settlement displays and unlocks controls before the optional wallet read completes', async () => {
  const f = fixture({ holdWallet: true, currency: 'MS' }); f.boot(); await drain();
  let completed = false;
  const action = f.api.deal().then(() => { completed = true; }); await drain();
  assert.equal(completed, true, 'A confirmed action completes while its optional wallet read is unresolved');
  await action;
  assert.equal(f.api.state.serverVersion, 8);
  assert.equal(f.node('bjDeal').disabled, false);
  assert.match(f.node('bjMessage').textContent, /Раздача завершена: \+50 MS/);
  assert.equal(f.records.has('jrvxBlackjackPendingV302:' + OWNER), false);
  assert.equal(JSON.parse(f.records.get('jrvxCasBlackjackHistoryV220:' + OWNER)).length, 1);
  assert.ok(f.walletReads.length > 0, 'Account reads are still requested in the background');
  for (const resolve of f.walletReads) resolve({ ok: true });
  await drain();
});

test('the first action can proceed after its state loads while the account read is still pending', async () => {
  const f = fixture({ holdWallet: true, currency: 'MS' });
  const action = f.api.deal(); await drain();
  assert.equal(f.requests.filter(row => row.url === '/api/blackjack/action').length, 1);
  await action;
  assert.equal(f.api.state.serverVersion, 8);
  assert.equal(f.node('bjDeal').disabled, false);
  for (const resolve of f.walletReads) resolve({ ok: true });
  await drain();
});

test('a late failed wallet read cannot replace a newer blackjack action message', async () => {
  const f = fixture({ holdWallet: true, currency: 'MS' });
  await f.api.deal();
  const oldActionRead = f.walletReads.at(-1);
  f.setResult({ state: active(), version: 9, actionVersion: 9, currency: 'MS' });
  await f.api.deal();
  assert.equal(f.node('bjMessage').textContent, 'Рука 1. Ваш ход.');
  oldActionRead(null); await drain();
  assert.equal(f.node('bjMessage').textContent, 'Рука 1. Ваш ход.');
  for (const resolve of f.walletReads) resolve({ ok: true });
  await drain();
});

test('a failed optional wallet read still reports an accepted action as confirmed', async () => {
  const f = fixture({ holdWallet: true, currency: 'MS' });
  await f.api.deal();
  f.walletReads.at(-1)(null); await drain();
  assert.match(f.node('bjMessage').textContent, /Действие подтверждено.*баланс/);
  assert.equal(f.node('bjDeal').disabled, false);
  assert.equal(f.records.has('jrvxBlackjackPendingV302:' + OWNER), false);
  for (const resolve of f.walletReads) resolve({ ok: true });
});

test('malformed saved blackjack history cannot prevent startup, state recovery or the next deal', async () => {
  const f = fixture({ currency: 'MS', corruptHistory: '[null,{},false,{"results":[null,false]},{"roundId":2,"results":[{"outcome":"win","profit":3}]}]' });
  assert.doesNotThrow(() => f.boot()); await drain();
  assert.equal(f.api.state.serverVersion, 7);
  assert.equal(f.node('blackjackSessionStats').textContent, '1W / 0L / 0P');
  await f.api.deal();
  assert.equal(f.node('bjDeal').disabled, false);
  assert.match(f.node('bjMessage').textContent, /Раздача завершена/);
  assert.equal(f.api.history().length, 3);
});
