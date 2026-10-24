const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.JRVX_CASINO_RECOVERY_SOURCE || path.join(__dirname, '../public/assets/js-v328/casino.js'), 'utf8');

function fixture() {
  const nodes = new Map(), records = new Map(), listeners = new Map(), requests = [], animations = [];
  let owner = 'A', currency = 'MS', fail = false, serial = 0, won = true;
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {},
      classList: { contains: () => false, add() {}, remove() {}, toggle() {} },
      querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    return nodes.get(id);
  }
  const modes = ['straight', 'split', 'street', 'corner'].map(mode => ({ dataset: { r22Mode: mode }, textContent: '',
    classList: { toggle(name, value) { this.active = value; } } }));
  const ctx = { console, AbortController, navigator: {}, setTimeout() { return 1; }, clearTimeout() {},
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    sessionStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) },
    document: { readyState: 'loading', getElementById: node, querySelector: () => null,
      querySelectorAll: selector => selector === '#roulette [data-r22-mode]' ? modes : [],
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); } },
    rouletteBusy: false, rouletteHistory: [], rouletteState: {}, rouletteType: 'red', rouletteExact: null, R_ORDER: [0, 1, 2, 3],
    rouletteColor: () => 'red', rouletteRenderHistory() {}, rouletteUpdatePreview() {}, rouletteDraw() {},
    rouletteGeometry: () => ({ rail: 1, ballPocket: 0.5 }), roulettePocketCenterAngle: () => 1,
    rouletteAnimate: (callback, index, current) => animations.push({ callback, index, current }),
    casinoRefresh() {}, rouletteSyncBetChips() {},
    fetch: async (url, options = {}) => {
      if (url === '/api/blackjack/state') return { ok: true, json: async () => ({ ok: true, state: { hands: [], dealer: [], active: false }, version: 1 }) };
      assert.equal(url, '/api/roulette/spin', 'All requests are isolated simulations');
      requests.push(JSON.parse(options.body));
      if (fail) throw Error('connection_lost');
      return { ok: true, json: async () => ({ ok: true, result: { number: 2, balanceAfter: 100, won, profit: won ? 50 : -50 } }) };
    } };
  ctx.window = { crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
    JRVXCASIdentityV300: { state: () => ({ mode: 'production', requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }) },
    JRVXCasEconomy: { get: () => ({ currency }), setCurrency: next => { currency = next; } },
    JRVXCASServerAccount: { apply() {}, refresh: async () => ({}), history: async () => [] } };
  vm.createContext(ctx); vm.runInContext(source, ctx);
  listeners.get('DOMContentLoaded').find(fn => fn.name === 'bindV242Roulette')();
  const api = ctx.window.JRVXCASV220.roulette;
  return { api, requests, records, animations, modes, node, ctx,
    spin: () => api.spin(), setFailure(value) { fail = value; }, setWon(value) { won = value; },
    get currency() { return currency; }, setCurrency(value) { currency = value; },
    identity(value) { owner = value; for (const fn of listeners.get('jrvx-cas-identity') || []) fn(); },
    reveal() { animations.at(-1).callback(); },
    choose(type, amount, numbers = [], label = type) { node('rouletteBetInput').value = String(amount); api.set({ type, numbers, label, mult: { red: 2, black: 2, split: 18, corner: 9 }[type] }); } };
}

test('retry restores the pending stake, field and currency while preserving its exact operation', async () => {
  const f = fixture(); f.setFailure(true); await f.spin(); const original = f.requests[0];
  f.choose('black', 300, [], 'Чёрное'); f.setCurrency('MG'); f.setFailure(false); await f.spin();
  assert.deepEqual(f.requests[1], original, 'Presentation changes cannot create a second wager or alter the retry');
  assert.equal(f.node('rouletteBetInput').value, '50'); assert.equal(f.currency, 'MS');
  assert.equal(f.api.state.selection.type, 'red'); assert.equal(f.api.state.selection.label, 'Красное');
  assert.match(f.node('v220BetSummary').innerHTML, /Красное.*50 MS/);
  assert.match(f.node('rouletteMessage').textContent, /Красное.*50 MS/);
  f.reveal(); assert.match(f.node('rouletteMessage').textContent, /Победа! \+50 MS/);
  assert.equal(f.api.state.last.type, 'red'); assert.equal(f.api.state.last.amount, 50);
});

test('retry restores a pending vertical split and its displayed mode before confirmation', async () => {
  const f = fixture(); f.choose('split', 120, [4, 7], 'Split 4 / 7');
  f.api.state.mode = 'split'; f.api.state.splitAxis = 'vertical'; f.setFailure(true); await f.spin();
  f.choose('corner', 200, [1, 2, 4, 5], 'Corner 1 / 2 / 4 / 5'); f.api.state.mode = 'corner'; f.api.state.splitAxis = 'horizontal';
  f.setFailure(false); await f.spin();
  assert.deepEqual(f.requests[1], f.requests[0]); assert.deepEqual(Array.from(f.api.state.selection.numbers), [4, 7]);
  assert.equal(f.api.state.mode, 'split'); assert.equal(f.api.state.splitAxis, 'vertical');
  const button = f.modes.find(button => button.dataset.r22Mode === 'split');
  assert.equal(button.classList.active, true); assert.match(button.textContent, /↕/);
  assert.equal(f.node('rouletteBetInput').value, '120');
});

test('a second failed retry keeps the durable operation and the restored visible selection', async () => {
  const f = fixture(); f.setFailure(true); await f.spin();
  f.choose('black', 300, [], 'Чёрное'); f.setCurrency('MG'); await f.spin();
  assert.deepEqual(f.requests[1], f.requests[0]); assert.equal(f.currency, 'MS');
  assert.equal(f.node('rouletteBetInput').value, '50'); assert.equal(f.api.state.selection.type, 'red');
  assert.equal(JSON.parse(f.records.get('jrvxRoulettePendingV302:A')).spinId, f.requests[0].spinId);
  assert.equal(f.ctx.rouletteBusy, false); assert.equal(f.node('rouletteSpin').disabled, false);
});

test('a new acknowledged spin can use a newly selected stake and a fresh operation', async () => {
  const f = fixture(); await f.spin(); f.reveal();
  f.choose('black', 300, [], 'Чёрное'); f.setCurrency('MG'); await f.spin();
  assert.equal(f.requests[1].amount, 300); assert.equal(f.requests[1].currency, 'MG'); assert.equal(f.requests[1].bet.type, 'black');
  assert.notEqual(f.requests[1].spinId, f.requests[0].spinId);
  assert.equal(f.node('rouletteBetInput').value, '300'); assert.equal(f.api.state.selection.type, 'black');
});

test('changing owner clears a completed roulette result while same-owner refresh keeps it', async t => {
  for (const won of [true, false]) await t.test(won ? 'win' : 'loss', async () => {
    const f = fixture(); f.setWon(won); await f.spin(); f.reveal(); const message = f.node('rouletteMessage').textContent;
    assert.match(message, /выпало|Выпало/);
    f.identity('A'); assert.equal(f.node('rouletteMessage').textContent, message);
    f.identity('B'); f.api.restoreHistory([]);
    assert.equal(f.api.state.last, null); assert.equal(f.ctx.rouletteState.lastNumber, null);
    assert.equal(f.node('rouletteMessage').textContent, 'Выберите ставку.');
    assert.equal(f.ctx.rouletteBusy, false);
  });
});

test('logout and a later login cannot redisplay the former completed result', async () => {
  const f = fixture(); await f.spin(); f.reveal();
  f.identity(''); assert.match(f.node('rouletteMessage').textContent, /Войдите через JRVX ID/);
  f.identity('A'); assert.equal(f.node('rouletteMessage').textContent, 'Выберите ставку.');
});

test('same-owner refresh preserves uncertain retry feedback even before any acknowledged spin', async () => {
  const f = fixture(); f.setFailure(true); await f.spin(); const message = f.node('rouletteMessage').textContent;
  f.identity('A'); assert.equal(f.node('rouletteMessage').textContent, message);
  assert.equal(JSON.parse(f.records.get('jrvxRoulettePendingV302:A')).spinId, f.requests[0].spinId);
});

test('an old-owner animation cannot replace cleared result text after A to B to A', async () => {
  const f = fixture(); await f.spin(); const old = f.animations[0];
  f.identity('B'); f.identity('A'); const message = f.node('rouletteMessage').textContent;
  assert.equal(old.current(), false); old.callback();
  assert.equal(f.node('rouletteMessage').textContent, message); assert.equal(f.ctx.rouletteHistory.length, 0);
});
