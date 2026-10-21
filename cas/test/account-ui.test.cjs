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
