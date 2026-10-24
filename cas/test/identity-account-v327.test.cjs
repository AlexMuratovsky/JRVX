const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/assets/js-v327/identity-account.js'), 'utf8');
const boundary = source.indexOf('/* source: modules/network/runtime/server-account-v300.js */');
assert(boundary > 0);
const A = 'JRVX-ABCD12345678', B = 'JRVX-EFGH87654321';
const drain = () => new Promise(resolve => setImmediate(resolve));
const reply = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

function identityFixture() {
  const requests = [], timers = new Map(), handlers = new Map(), documentEvents = new Map(), windowEvents = new Map();
  let timerId = 0, serverOwner = A, clock = 10000, channel;
  const listen = (events, type, fn) => { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); };
  const document = { readyState: 'loading', visibilityState: 'visible',
    getElementById: () => null, querySelector: () => null,
    addEventListener: (type, fn) => listen(documentEvents, type, fn),
    dispatchEvent: event => { for (const fn of documentEvents.get(event.type) || []) fn(event); } };
  const window = { addEventListener: (type, fn) => listen(windowEvents, type, fn) };
  const context = { document, window, URL, AbortController, Event, Promise, Date: { now: () => clock },
    clearInterval() {}, setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    BroadcastChannel: class { constructor() { channel = this; } postMessage() {} },
    fetch: async (url, options = {}) => {
      const request = { url, options }; requests.push(request);
      if (handlers.has(url)) return handlers.get(url)(request);
      if (url === '/auth/config') return reply({ mode: 'production', requiresAuthentication: true,
        remoteVerifierConfigured: true, loginUrl: 'https://cas.jrvx.ru/auth/jrvx/start' });
      if (url === '/auth/me') return reply({ authenticated: !!serverOwner, user: serverOwner ? { id: serverOwner } : null }, serverOwner ? 200 : 401);
      if (url === '/auth/login' || url === '/auth/logout') return reply({ ok: true });
      throw Error('Unexpected auth endpoint: ' + url);
    } };
  vm.runInNewContext(source.slice(0, boundary), context);
  return { api: window.JRVXCASIdentityV300, requests,
    handle: (url, fn) => handlers.set(url, fn), owner: value => { serverOwner = value; },
    boot() { document.dispatchEvent(new Event('DOMContentLoaded')); },
    focus() { clock += 4000; for (const fn of windowEvents.get('focus') || []) fn(); },
    broadcast(type) { assert(channel); channel.onmessage({ data: { type } }); },
    expire() { for (const [id, timer] of [...timers]) if (timer.ms === 8000) { timers.delete(id); timer.fn(); } },
    count: url => requests.filter(request => request.url === url).length };
}

test('a pending and acknowledged logout fences session checks even while the old cookie still verifies', async () => {
  const f = identityFixture(); await f.api.refresh();
  const response = deferred(); f.handle('/auth/logout', () => response.promise);
  const work = f.api.logout(); await drain();
  assert.equal(f.api.state().authenticated, false);
  const count = f.requests.length;
  assert.equal((await f.api.refresh()).authenticated, false);
  assert.equal(f.requests.length, count, 'Session refresh must not race the cookie-clearing POST');
  response.resolve(reply({ ok: true })); assert.equal((await work).ok, true);
  assert.equal(f.api.state().authenticated, false);
  await f.api.refresh(); assert.equal(f.requests.length, count, 'A stale cookie must not silently undo logout');
});

test('a failed logout stays locally signed out and remains explicitly retryable', async () => {
  const f = identityFixture(); await f.api.refresh();
  f.handle('/auth/logout', () => reply({ ok: false }, 503));
  assert.equal((await f.api.logout()).ok, false);
  const count = f.requests.length; await f.api.refresh();
  assert.equal(f.requests.length, count); assert.equal(f.api.state().authenticated, false);
  f.handle('/auth/logout', () => reply({ ok: true }));
  assert.equal((await f.api.logout()).ok, true); assert.equal(f.count('/auth/logout'), 2);
});

test('overlapping logout calls share one request and the same acknowledgement', async () => {
  const f = identityFixture(), response = deferred();
  f.handle('/auth/logout', () => response.promise);
  const first = f.api.logout(), second = f.api.logout();
  assert.equal(first, second); await drain(); assert.equal(f.count('/auth/logout'), 1);
  response.resolve(reply({ ok: true }));
  assert.equal((await first).ok, true); assert.equal((await second).ok, true);
});

test('an auth request deadline releases logout even when fetch ignores its aborted signal', async () => {
  const f = identityFixture(); f.handle('/auth/logout', () => new Promise(() => {}));
  const work = f.api.logout(); await drain(); f.expire();
  assert.equal((await work).ok, false);
  assert.equal(f.requests.at(-1).options.signal.aborted, true);
  f.handle('/auth/logout', () => reply({ ok: true }));
  assert.equal((await f.api.logout()).ok, true); assert.equal(f.count('/auth/logout'), 2);
});

test('the same auth deadline bounds a stalled response body', async () => {
  const f = identityFixture();
  f.handle('/auth/logout', () => ({ ok: true, json: () => new Promise(() => {}) }));
  const work = f.api.logout(); await drain(); f.expire();
  assert.equal((await work).ok, false); assert.equal(f.api.state().authenticated, false);
});

test('only a successful explicit login lifts the logout fence', async () => {
  const f = identityFixture(); await f.api.logout();
  f.handle('/auth/login', () => reply({ error: 'invalid_token' }, 401));
  await assert.rejects(f.api.login('invalid'), /invalid_token/);
  const count = f.requests.length; await f.api.refresh(); assert.equal(f.requests.length, count);
  f.handle('/auth/login', () => reply({ ok: true })); f.owner(B);
  await f.api.login('valid-local-test-token');
  assert.equal(f.api.state().authenticated, true); assert.equal(f.api.state().user.id, B);
});

test('logout waits for an earlier cookie-changing login and suppresses its stale refresh', async () => {
  const f = identityFixture(), loginResponse = deferred(), logoutResponse = deferred();
  f.handle('/auth/login', () => loginResponse.promise); f.handle('/auth/logout', () => logoutResponse.promise);
  const login = assert.rejects(f.api.login('local-test-token'), /auth_operation_superseded/);
  await drain(); assert.equal(f.count('/auth/login'), 1);
  const logout = f.api.logout(); await drain();
  assert.equal(f.count('/auth/logout'), 0, 'Cookie setters must be dispatched in order');
  loginResponse.resolve(reply({ ok: true })); await login; await drain();
  assert.equal(f.count('/auth/logout'), 1); assert.equal(f.count('/auth/me'), 0);
  logoutResponse.resolve(reply({ ok: true })); assert.equal((await logout).ok, true);
  assert.equal(f.api.state().authenticated, false);
});

test('an explicit new login waits for pending logout before setting a new cookie', async () => {
  const f = identityFixture(), response = deferred(); f.handle('/auth/logout', () => response.promise);
  const logout = f.api.logout(); await drain(); const login = f.api.login('local-test-token');
  await drain(); assert.equal(f.count('/auth/login'), 0);
  f.owner(B); response.resolve(reply({ ok: true })); await logout; await login;
  assert.equal(f.count('/auth/login'), 1); assert.equal(f.api.state().user.id, B);
});

test('a later logout supersedes a login queued behind an earlier logout', async () => {
  const f = identityFixture(), response = deferred(); let calls = 0;
  f.handle('/auth/logout', () => ++calls === 1 ? response.promise : reply({ ok: true }));
  const first = f.api.logout(); await drain();
  const login = assert.rejects(f.api.login('local-test-token'), /auth_operation_superseded/);
  const last = f.api.logout(); response.resolve(reply({ ok: true }));
  await first; await login; assert.equal((await last).ok, true);
  assert.equal(f.count('/auth/login'), 0); assert.equal(f.count('/auth/logout'), 2);
  assert.equal(f.api.state().authenticated, false);
});

test('focus cannot undo a cross-tab logout, while a subsequent cross-tab login rechecks the server', async () => {
  const f = identityFixture(); f.boot(); await drain();
  assert.equal(f.api.state().authenticated, true);
  f.broadcast('logout'); const count = f.requests.length; f.focus(); await drain();
  assert.equal(f.api.state().authenticated, false); assert.equal(f.requests.length, count);
  f.owner(B); f.broadcast('login'); await drain();
  assert.equal(f.api.state().user.id, B); assert(f.requests.length > count);
});

function accountFixture() {
  let active = A;
  const requests = [], handlers = [], progress = [], balances = { ms: 0, mg: 0, currency: 'MS' };
  const document = { addEventListener(type, fn) { if (type === 'jrvx-cas-identity') handlers.push(fn); } };
  const window = { JRVXCASIdentityV300: { state: () => ({ authenticated: !!active, user: active ? { id: active } : null }) },
    JRVXCasEconomy: { set: patch => Object.assign(balances, patch), get: () => balances, balance: currency => balances[currency.toLowerCase()] },
    JRVXProgress: { apply: data => progress.push(data), reset() {} }, arcadeNetState: {} };
  vm.runInNewContext(source.slice(boundary), { document, window, AbortController, setTimeout: () => 1, clearTimeout() {},
    fetch: url => { const response = deferred(); requests.push({ url, response }); return response.promise; } });
  const snapshot = (id, value = 900, version = 9) => ({ ok: true, account: { id },
    wallet: { MS: value, MG: 3 }, walletRevision: { MS: version, MG: 3 }, progressVersion: version, progress: { xp: value } });
  return { api: window.JRVXCASServerAccount, requests, balances, progress, snapshot,
    identity(id) { active = id; for (const fn of handlers) fn(); },
    resolve(request, data) { request.response.resolve(reply(data)); } };
}

test('a wallet and progression snapshot from a former A session cannot enter a new A session after A-B-A', async () => {
  const f = accountFixture(); f.api.apply(f.snapshot(A));
  const work = f.api.refresh(), old = f.requests.at(-1);
  f.identity(B); f.identity(A);
  assert.equal(f.balances.ms, 0); const applied = f.progress.length;
  f.resolve(old, f.snapshot(A)); assert.equal(await work, null);
  assert.equal(f.balances.ms, 0); assert.equal(f.progress.length, applied);
  const current = f.requests.filter(request => request.url === '/api/me').at(-1);
  f.resolve(current, f.snapshot(A, 1200, 10)); await drain();
  assert.equal(f.balances.ms, 1200); assert.equal(f.progress.at(-1).xp, 1200);
});

test('an explicit account reset invalidates its outstanding wallet snapshot', async () => {
  const f = accountFixture(), work = f.api.refresh(), old = f.requests.at(-1);
  f.api.reset(); f.resolve(old, f.snapshot(A));
  assert.equal(await work, null); assert.equal(f.balances.ms, 0); assert.equal(f.progress.length, 0);
});

test('same-owner identity checks keep current requests valid and newer wallet revisions win parallel replies', async () => {
  const f = accountFixture(); f.api.apply(f.snapshot(A));
  const first = f.api.refresh(), old = f.requests.at(-1); f.identity(A);
  const current = f.requests.at(-1); f.resolve(current, f.snapshot(A, 1200, 10)); await drain();
  f.resolve(old, f.snapshot(A)); assert.equal((await first).account.id, A);
  assert.equal(f.balances.ms, 1200); assert.equal(f.progress.at(-1).xp, 1200);
});
