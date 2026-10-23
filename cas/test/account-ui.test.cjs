const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { approvedLoginPath, bounded } = require('../runtime/account-ui.js');
const origin = 'https://cas.jrvx.ru';

test('CAS login starts its own OIDC handshake in the same origin', () => {
  assert.equal(approvedLoginPath('/auth/jrvx/start', origin), '/auth/jrvx/start');
  assert.equal(approvedLoginPath(origin + '/auth/jrvx/start', origin), '/auth/jrvx/start');
});
test('CAS login rejects legacy account links, foreign redirects and decorated start URLs', () => {
  for (const url of ['https://id.jrvx.ru/', 'https://id.jrvx.ru/?next=https%3A%2F%2Fcas.jrvx.ru%2F',
    '//evil.example/auth/jrvx/start', 'https://cas.jrvx.ru.evil.example/auth/jrvx/start',
    'https://user:secret@cas.jrvx.ru/auth/jrvx/start', '/auth/jrvx/start#x', '/auth/jrvx/start?next=//evil.example',
    '/auth/jrvx/start\n', '\\evil.example\\auth\\jrvx\\start', 'javascript:alert(1)', null]) {
    assert.equal(approvedLoginPath(url, origin), null, String(url));
  }
});
test('account request timeout releases a stalled operation and invokes abort', async () => {
  let aborted = false;
  await assert.rejects(bounded(() => new Promise(() => {}), 10, () => { aborted = true; }), /account_timeout/);
  assert.equal(aborted, true);
  assert.equal(await bounded(async () => 42, 100), 42);
});
test('account entry intercepts legacy login before document capture and uses refresh without empty-token POST', () => {
  const source = fs.readFileSync(path.join(__dirname, '../runtime/account-ui.js'), 'utf8');
  const listeners = [];
  const document = { readyState: 'loading', addEventListener() {}, getElementById: () => null };
  const window = { addEventListener: (...args) => listeners.push(args) };
  vm.runInNewContext(source, { document, window, URL, AbortController, Promise, setTimeout, clearTimeout });
  const click = listeners.find(([type]) => type === 'click');
  assert.equal(click[2], true);
  assert.match(source, /window\.JRVXCASIdentityV300\.refresh\(\)/);
  assert.doesNotMatch(source, /\/auth\/login|\.login\(''\)/);
  assert.match(source, /location\.assign\(path\)/);
});

function accountFixture() {
  const nodes = new Map(), events = new Map(); let authenticated = true, logoutOK = false, calls = 0;
  function node(id = '') {
    const value = { id, hidden: false, disabled: false, textContent: '', isConnected: true,
      classList: { add() {} }, setAttribute() {}, addEventListener() {}, focus() {},
      appendChild(child) { nodes.set(child.id, child); }, querySelectorAll: () => [] };
    Object.defineProperty(value, 'innerHTML', { set(html) {
      for (const match of html.matchAll(/id="([^"]+)"/g)) nodes.set(match[1], node(match[1]));
    }});
    return value;
  }
  const host = node(), document = { readyState: 'loading', body: node(),
    getElementById: id => nodes.get(id) || null, createElement: () => node(), querySelector: () => host,
    addEventListener(type, fn) { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); } };
  const window = { addEventListener() {}, JRVXCASIdentityV300: {
    state: () => ({ mode: 'production', authenticated, user: authenticated ? { id: 'JRVX-ABCD12345678' } : null }),
    logout: async () => { calls++; authenticated = false; for (const fn of events.get('jrvx-cas-identity') || []) fn(); return { ok: logoutOK }; }
  }};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../runtime/account-ui.js'), 'utf8'), {
    document, window, URL, AbortController, Promise, setTimeout, clearTimeout, queueMicrotask,
    MutationObserver: class { observe() {} }
  });
  for (const fn of events.get('DOMContentLoaded') || []) fn();
  return { nodes, confirmLogout() { logoutOK = true; }, get calls() { return calls; } };
}

test('an unconfirmed server logout keeps an explicit retry even after local identity is cleared', async () => {
  const f = accountFixture(), button = f.nodes.get('jrvxCasAccountLogout');
  await button.onclick();
  assert.equal(button.hidden, false, 'A failed server logout must remain retryable');
  assert.equal(button.disabled, false);
  assert.match(button.textContent, /Повторить выход/);
  assert.match(f.nodes.get('jrvxCasAccountStatus').textContent, /не подтвердил выход/);
  f.confirmLogout(); await button.onclick();
  assert.equal(f.calls, 2);
  assert.equal(button.hidden, true);
  assert.equal(f.nodes.get('jrvxCasAccountLogin').hidden, false);
  assert.equal(f.nodes.get('jrvxCasAccountStatus').textContent, 'Вы вышли из CAS.');
});
