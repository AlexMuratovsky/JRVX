const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v327/identity-account.js'), 'utf8');
const boundary = source.indexOf('/* source: modules/network/runtime/server-account-v300.js */');
const owner = 'JRVX-ABCD12345678';
const drain = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const reply = data => ({ ok: true, status: 200, json: async () => data });

function snapshotFixture() {
  const requests = [], timers = new Map(), balances = { ms: 0, mg: 0, currency: 'MS' }, restored = [];
  let serial = 0;
  const window = {
    JRVXCASIdentityV300: { state: () => ({ authenticated: true, user: { id: owner } }) },
    JRVXCasEconomy: { set: patch => Object.assign(balances, patch), get: () => balances, balance: currency => balances[currency.toLowerCase()] },
    JRVXCASV220: { roulette: { restoreHistory: data => restored.push(data) } },
    arcadeNetState: {}
  };
  vm.runInNewContext(source.slice(boundary), { window, document: { addEventListener() {} }, AbortController,
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch(url, options) { const response = deferred(); requests.push({ url, options, response }); return response.promise; }
  });
  return { api: window.JRVXCASServerAccount, requests, balances, restored,
    expire() { for (const [id, timer] of [...timers]) if (timer.ms === 10000) { timers.delete(id); timer.fn(); } },
    snapshot: { ok: true, account: { id: owner }, wallet: { MS: 999, MG: 3 }, walletRevision: { MS: 8, MG: 8 } }
  };
}

for (const [name, invoke] of [['wallet', api => api.refresh()], ['history', api => api.history('roulette')]]) {
  test(`${name} read finishes at its deadline when fetch ignores AbortSignal`, async () => {
    const f = snapshotFixture(); let completed = false, value;
    const work = invoke(f.api).then(result => { value = result; completed = true; });
    await drain(); f.expire(); await drain();
    assert.equal(f.requests[0].options.signal.aborted, true);
    assert.equal(completed, true, 'A local request deadline must settle the read independently of fetch abort');
    assert.equal(value, null); await work;
  });
  test(`${name} read ignores a body that arrives after its deadline`, async () => {
    const f = snapshotFixture(), body = deferred(); let completed = false, value;
    const work = invoke(f.api).then(result => { value = result; completed = true; });
    f.requests[0].response.resolve({ ok: true, status: 200, json: () => body.promise });
    await drain(); f.expire(); await drain();
    assert.equal(completed, true, 'A stalled JSON body must share the request deadline');
    assert.equal(value, null);
    body.resolve(name === 'wallet' ? f.snapshot : { ok: true, history: [{ number: 9 }] });
    await drain(); await work;
    assert.equal(f.balances.ms, 0, 'A timed-out snapshot must not mutate the account later');
    assert.equal(f.restored.length, 0, 'A timed-out history must not mutate roulette later');
  });
}

function panelFixture() {
  const nodes = new Map(), documentEvents = new Map(), windowEvents = new Map(), navigation = [];
  const listen = (events, type, fn) => { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); };
  function node(id = '') {
    const result = { id, hidden: false, disabled: false, textContent: '', isConnected: true,
      classList: { add() {} }, setAttribute() {}, addEventListener() {}, focus() {},
      appendChild(child) { nodes.set(child.id, child); }, querySelectorAll: () => [] };
    Object.defineProperty(result, 'innerHTML', { set(html) {
      for (const match of html.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], node(match[1]));
    } });
    return result;
  }
  const host = node(), document = { readyState: 'loading', body: node(),
    getElementById: id => nodes.get(id) || null, createElement: () => node(), querySelector: () => host,
    addEventListener: (type, fn) => listen(documentEvents, type, fn) };
  const window = { addEventListener: (type, fn) => listen(windowEvents, type, fn), JRVXCASIdentityV300: {
    state: () => ({ authenticated: false, mode: 'production' }), refresh: async () => ({ authenticated: false, mode: 'production' })
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../runtime/account-ui.js'), 'utf8'), {
    document, window, URL, AbortController, Promise, setTimeout, clearTimeout, queueMicrotask,
    location: { origin: 'https://cas.jrvx.ru', assign: path => navigation.push(path) },
    fetch: async () => reply({ mode: 'production', remoteVerifierConfigured: true, loginUrl: '/auth/jrvx/start' }),
    MutationObserver: class { observe() {} }
  });
  for (const fn of documentEvents.get('DOMContentLoaded') || []) fn();
  return { nodes, navigation, show(persisted) { for (const fn of windowEvents.get('pageshow') || []) fn({ persisted }); } };
}

test('returning from OIDC with browser Back restores usable account controls from bfcache', async () => {
  const f = panelFixture(), login = f.nodes.get('jrvxCasAccountLogin');
  await login.onclick(); assert.deepEqual(f.navigation, ['/auth/jrvx/start']);
  assert.equal(login.disabled, true, 'Navigation keeps the action protected before leaving');
  f.show(true);
  assert.equal(login.disabled, false, 'A restored document must not retain its old navigation busy state');
  assert.equal(f.nodes.get('jrvxCasAccountRefresh').disabled, false);
  assert.equal(f.nodes.get('jrvxCasAccountStatus').textContent, '');
  await login.onclick(); assert.equal(f.navigation.length, 2, 'The user can retry OIDC after returning');
});

test('an ordinary pageshow does not unlock an OIDC navigation already in progress', async () => {
  const f = panelFixture(), login = f.nodes.get('jrvxCasAccountLogin');
  await login.onclick(); f.show(false);
  assert.equal(login.disabled, true);
  assert.equal(f.navigation.length, 1);
});
