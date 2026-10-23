const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/modules/core/runtime/lifecycle-v325.js'), 'utf8');
const A = 'JRVX-ABCD12345678', B = 'JRVX-EFGH87654321';
const start = source.indexOf('function syncNetwork('), end = source.indexOf('\nfunction syncAll(', start);
assert(start >= 0 && end > start);
function fixture() {
  const status = { textContent: 'SERVER LINK ONLINE • серверное состояние' };
  const ctx = { $: () => status, navigator: { onLine: true }, window: {
    Poker59: { state: { mode: 'jarvis', server: null } }, arcadeNetState: { connected: false, transportConnected: false, handshakeReady: false },
    JRVXCASIdentityV300: { state: () => ctx.auth } },
    auth: { mode: 'production', requiresAuthentication: true, authenticated: true, user: { id: A } } };
  vm.createContext(ctx); vm.runInContext(source.slice(start, end), ctx);
  return { ctx, status, sync: () => ctx.syncNetwork() };
}

test('production JRVX poker reports offline and reconnecting instead of a stale online or local status', () => {
  const f = fixture(); f.ctx.navigator.onLine = false; f.sync();
  assert.match(f.status.textContent, /Соединение потеряно/);
  f.ctx.navigator.onLine = true; f.sync();
  assert.match(f.status.textContent, /Нет связи с сервером/);
  assert.doesNotMatch(f.status.textContent, /ONLINE|Локальный/);
});

test('production online status requires a completed handshake and an authenticated account', () => {
  const f = fixture(), net = f.ctx.window.arcadeNetState;
  Object.assign(net, { transportConnected: true, connected: true, handshakeReady: false }); f.sync();
  assert.match(f.status.textContent, /подтверждение сессии/); assert.doesNotMatch(f.status.textContent, /ONLINE/);
  net.handshakeReady = true; f.sync(); assert.match(f.status.textContent, /ONLINE.*соединение подтверждено/);
  f.ctx.auth.authenticated = false; f.ctx.auth.user = null; f.sync();
  assert.match(f.status.textContent, /Войдите через JRVX ID/); assert.doesNotMatch(f.status.textContent, /ONLINE|Локальный/);
});

test('server-state status belongs only to the current confirmed account', () => {
  const f = fixture(); Object.assign(f.ctx.window.arcadeNetState, { connected: true, handshakeReady: true });
  f.ctx.window.Poker59.state.server = { authoritative: true, you: { id: A } }; f.sync();
  assert.match(f.status.textContent, /ONLINE.*серверное состояние/);
  f.ctx.window.Poker59.state.server.you.id = B; f.sync();
  assert.match(f.status.textContent, /ONLINE.*соединение подтверждено/);
  assert.doesNotMatch(f.status.textContent, /серверное состояние/);
});

test('local development poker remains ready without network or authentication', () => {
  const f = fixture(); f.ctx.auth = { mode: 'development', requiresAuthentication: false, authenticated: false };
  f.ctx.navigator.onLine = false; f.sync(); assert.equal(f.status.textContent, 'Локальный режим готов');
});
