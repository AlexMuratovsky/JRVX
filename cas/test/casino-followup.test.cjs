const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const walletSource = fs.readFileSync(path.join(__dirname, '../public/modules/legacy/runtime/wallet-v327.js'), 'utf8');
const casinoSource = fs.readFileSync(path.join(__dirname, '../public/assets/js-v327/casino.js'), 'utf8');
const OWNER = 'JRVX-ABCD12345678', OTHER = 'JRVX-EFGH87654321';

// Execute the complete production wallet/navigation module with local DOM and
// timers. No account, wager, network or browser state outside this VM is used.
function walletFixture() {
  const nodes = new Map(), timers = new Map(), listeners = new Map(), joins = [];
  let owner = OWNER, timerId = 0;
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, { id, value: '1', textContent: '', innerHTML: '', dataset: {}, style: {}, options: [],
        classList: { contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name),
          toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); } },
        querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    }
    return nodes.get(id);
  }
  const ctx = { console, document: { body: node('body'), getElementById: node, querySelector: () => null,
      querySelectorAll: () => [], addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); } },
    window: { scrollTo() {}, JRVXCASIdentityV300: { state: () => ({ mode: 'production', requiresAuthentication: true,
      authenticated: !!owner, user: owner ? { id: owner } : null }) } },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    setActiveGameById(id) { for (const game of ['poker', 'blackjack', 'roulette']) node(game).classList.toggle('active', game === id); },
    arcadeNetPokerLeave() {},
    fetch() { assert.fail('Navigation fixtures must not perform HTTP mutations'); } };
  vm.createContext(ctx); vm.runInContext(walletSource, ctx);
  return { node, joins, routes: ctx.window.JVRXRoutes, launch: (...args) => ctx.window.JRVXCASLaunchPoker(...args),
    routeDirect: id => ctx.setActiveGameById(id),
    ready() { ctx.window.Poker59 = { state: {}, join() { joins.push(owner); } }; },
    retry() { for (const [id, timer] of [...timers]) if (timer.ms === 100) { timers.delete(id); timer.fn(); } },
    identity(value) { owner = value; for (const fn of listeners.get('jrvx-cas-identity') || []) fn(); } };
}

test('returning home cancels a delayed poker launch before it can buy into a table', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.routes.returnHome(); f.ready(); f.retry();
  assert.deepEqual(f.joins, [], 'Cancelling navigation must cancel the pending join');
});

test('opening blackjack cancels a delayed poker launch', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.routes.launchSimpleGame('blackjack'); f.ready(); f.retry();
  assert.deepEqual(f.joins, [], 'The old launch cannot join behind another active game');
});

test('a direct legacy game route also cancels the previous delayed poker buy-in', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.routeDirect('roulette'); f.ready(); f.retry();
  assert.deepEqual(f.joins, []);
});

test('an account change cancels the previous owners delayed poker launch', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.identity(OTHER); f.ready(); f.retry();
  assert.deepEqual(f.joins, [], 'A queued choice cannot submit a buy-in under the next account');
});

test('an A-B-A account transition still cancels the original delayed poker launch', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.identity(OTHER); f.identity(OWNER); f.ready(); f.retry();
  assert.deepEqual(f.joins, []);
});

test('returning to table selection cancels the previously queued buy-in', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.routes.openTables(); f.ready(); f.retry();
  assert.deepEqual(f.joins, []);
});

test('an unchanged owner and active poker screen can still complete one delayed launch', () => {
  const f = walletFixture(); f.launch('online', '1-2');
  f.identity(OWNER); f.ready(); f.retry(); f.retry();
  assert.deepEqual(f.joins, [OWNER]);
});

test('a newer explicit poker launch supersedes a queued launch', () => {
  const f = walletFixture(); f.launch('online', '1-2'); f.launch('jarvis', '2-4');
  f.ready(); f.retry();
  assert.deepEqual(f.joins, [OWNER]);
  assert.equal(f.node('p59BuyIn').value, '40');
});

test('private-game friend labels remain text when copied into the new picker', () => {
  const f = walletFixture();
  const nickname = '</select><svg/onload=alert(1)>';
  assert.ok(nickname.length <= 32, 'The server accepts nicknames up to 32 characters');
  f.node('p59Friend').options = [{ value: OTHER, textContent: nickname + ' • ID ' + OTHER }];
  f.routes.privatePlay();
  const html = f.node('v69InfoBody').innerHTML;
  assert.equal(html.includes(nickname), false, 'A nickname must not introduce HTML outside the select');
  assert.ok(html.includes('&lt;/select&gt;&lt;svg/onload=alert(1)&gt;'));
  assert.ok(html.includes('value="' + OTHER + '"'));
});

test('private-game picker safely preserves ampersands, angle brackets and quoted values', () => {
  const f = walletFixture();
  f.node('p59Friend').options = [{ value: 'A&"<>', textContent: 'A & B < C' }];
  f.routes.privatePlay();
  const html = f.node('v69InfoBody').innerHTML;
  assert.ok(html.includes('value="A&amp;&quot;&lt;&gt;"'));
  assert.ok(html.includes('A &amp; B &lt; C'));
});

function rouletteFixture(saved) {
  const nodes = new Map(), listeners = new Map(), records = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '50', textContent: '', innerHTML: '', disabled: false, dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      querySelector: () => null, querySelectorAll: () => [], addEventListener() {} });
    return nodes.get(id);
  }
  records.set('jrvxCasRouletteLastBetV220:' + OWNER, JSON.stringify(saved));
  const numbers = Array.from({ length: 37 }, (_, number) => ({ dataset: { number: String(number) }, classList: { toggle() {} } }));
  const ctx = { window: { JRVXCASIdentityV300: { state: () => ({ mode: 'production', authenticated: true,
      requiresAuthentication: true, user: { id: OWNER } }) }, JRVXCasEconomy: { get: () => ({ currency: 'MS' }) } },
    document: { readyState: 'loading', getElementById: node, querySelector: () => null,
      querySelectorAll: selector => selector === '#roulette .numberBet' ? numbers : [],
      addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); } },
    localStorage: { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) },
    sessionStorage: { getItem: () => null },
    rouletteBusy: false, rouletteType: 'red', rouletteExact: null, rouletteColor: () => 'red',
    setTimeout() { return 1; }, clearTimeout() {}, navigator: {}, console };
  vm.createContext(ctx); vm.runInContext(casinoSource, ctx);
  listeners.get('DOMContentLoaded').find(fn => fn.name === 'bindV242Roulette')();
  return { repeat: () => node('r22Repeat').onclick(), node, state: ctx.window.JRVXCASV220.roulette.state };
}

test('malformed saved roulette numbers cannot break the Repeat control', () => {
  const f = rouletteFixture({ amount: 50, type: 'exact', numbers: 8, label: '8', mult: 36 });
  assert.doesNotThrow(() => f.repeat());
  assert.equal(f.node('rouletteMessage').textContent, 'Нет предыдущей ставки.');
  assert.equal(f.state.selection.type, 'red', 'Corrupt data cannot replace the current valid selection');
});

test('invalid saved roulette amounts are rejected before replacing a valid current stake', () => {
  const f = rouletteFixture({ amount: 'broken', type: 'red', numbers: [], label: 'Красное', mult: 2 });
  f.repeat();
  assert.equal(f.node('rouletteBetInput').value, '50');
  assert.equal(f.node('rouletteMessage').textContent, 'Нет предыдущей ставки.');
});

test('a valid saved roulette split still restores its amount, numbers and direction', () => {
  const f = rouletteFixture({ amount: 120, type: 'split', numbers: [1, 4], label: 'Split 1 / 4', mult: 18, splitAxis: 'vertical' });
  assert.doesNotThrow(() => f.repeat());
  assert.equal(f.node('rouletteBetInput').value, 120);
  assert.deepEqual(Array.from(f.state.selection.numbers), [1, 4]);
  assert.equal(f.state.splitAxis, 'vertical');
  assert.equal(f.node('rouletteMessage').textContent, 'Предыдущая ставка восстановлена.');
});
