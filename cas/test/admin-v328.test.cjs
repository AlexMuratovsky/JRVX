const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.JRVX_ADMIN_SOURCE || path.join(__dirname, '../public/modules/profile/runtime/admin-v328.js'), 'utf8');
const PLAYER_A = 'JRVX-AAAA12345678', PLAYER_B = 'JRVX-BBBB12345678', PLAYER_C = 'JRVX-CCCC12345678';
const ledgerRow = (accountId, transactionId = 'receipt-' + accountId) => ({ accountId, user: accountId, transactionId, type: 'roulette', currency: 'MS', delta: 5, balanceAfter: 105, createdAt: 1792846800000 });

function fixture() {
  const nodes = new Map(), listeners = new Map(), sent = [], timers = [], toasts = [], ledgerRequests = [];
  let owner = 'JRVX-ROOT11101111', connected = true, accept = true, throwSend = false, role = 'SUPERADMIN', html = '';
  const makeNode = id => ({ id, dataset: {}, value: '', textContent: '', onclick: null,
    addEventListener(type, fn) { this['on' + type] = fn; },
    click() { this.onclick?.({ target: this, preventDefault() {} }); },
    querySelectorAll(selector) {
      const attribute = selector === '[data-v270-tab]' ? 'tab' : selector === '[data-v270-user]' ? 'user' : '';
      if (!attribute) return [];
      return [...html.matchAll(new RegExp('data-v270-' + attribute + '="([^"]+)"', 'g'))].map(match => {
        const item = node(attribute + ':' + match[1]); item.dataset[attribute === 'tab' ? 'v270Tab' : 'v270User'] = match[1]; return item;
      });
    } });
  const root = makeNode('v70AdminRoot');
  Object.defineProperty(root, 'innerHTML', { get: () => html, set(value) { html = value; } });
  nodes.set(root.id, root);
  function node(id) { if (!nodes.has(id)) nodes.set(id, makeNode(id)); return nodes.get(id); }
  const ctx = { console, setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    document: { readyState: 'loading', getElementById: node, addEventListener: (type, fn) => listeners.set(type, fn) },
    confirm: () => true };
  ctx.window = {
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }) },
    JRVXCASServerAccount: { refresh: async () => ({ account: { id: owner, role, enabled: true } }) },
    arcadeNetState: { get connected() { return connected; } },
    arcadeNetSend(message) { sent.push(message); if (message.type === 'admin_get_ledger') ledgerRequests.push(message); if (throwSend) throw Error('not_sent'); return accept; },
    handleArcadeNetMessage() {}, showArcadeToast: (...args) => toasts.push(args)
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); listeners.get('DOMContentLoaded')();
  const receive = message => ctx.window.handleArcadeNetMessage(message);
  receive({ type: 'hello_ack', playerId: owner, admin: true, role });
  receive({ type: 'admin_users', users: [PLAYER_A, PLAYER_B, PLAYER_C].map(id => ({ id, nickname: id, role: 'USER', enabled: true, ms: 100, mg: 0 })) });
  function tab(name) { root.querySelectorAll('[data-v270-tab]').find(node => node.dataset.v270Tab === name).click(); }
  function select(id) { tab('users'); root.querySelectorAll('[data-v270-user]').find(node => node.dataset.v270User === id).click(); }
  function request(id) { select(id); node('v270LedgerUser').click(); }
  return { node, receive, tab, select, request, sent, ledgerRequests, toasts, api: ctx.window.JRVXAdminV270,
    html: () => html, setAccepted(value) { accept = value; }, setThrow(value) { throwSend = value; }, setConnected(value) { connected = value; },
    identity(value) { owner = value; listeners.get('jrvx-cas-identity')(); },
    reconnect() { receive({ type: 'hello_ack', playerId: owner, admin: true, role }); },
    flushRequestTimers() { const due = timers.filter(timer => timer.ms === 80); timers.length = 0; due.forEach(timer => timer.fn()); }
  };
}

test('a late ledger for A cannot appear under selected player B', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B);
  assert.deepEqual(f.ledgerRequests.map(request => request.playerId), [PLAYER_A], 'B waits until the untagged A response drains');
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'late-A')] });
  assert.doesNotMatch(f.html(), /late-A/); assert.match(f.html(), new RegExp(PLAYER_B));
  assert.deepEqual(f.ledgerRequests.map(request => request.playerId), [PLAYER_A, PLAYER_B]);
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_B, 'current-B')] });
  assert.match(f.html(), /current-B/); assert.doesNotMatch(f.html(), /late-A/);
});

test('an empty A ledger drains A and does not report B as empty', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B);
  f.receive({ type: 'admin_ledger', entries: [] });
  assert.deepEqual(f.ledgerRequests.map(request => request.playerId), [PLAYER_A, PLAYER_B]);
  assert.match(f.html(), /Загрузка операций/); assert.doesNotMatch(f.html(), /Транзакций нет/);
  f.receive({ type: 'admin_ledger', entries: [] });
  assert.match(f.html(), /Транзакций нет/); assert.doesNotMatch(f.html(), /Загрузка операций/);
});

test('A to B to C queues only the latest ledger without losing the accepted A request', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B); f.request(PLAYER_C);
  f.receive({ type: 'admin_ledger', entries: [] });
  assert.deepEqual(f.ledgerRequests.map(request => request.playerId), [PLAYER_A, PLAYER_C]);
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_C, 'latest-C')] });
  assert.match(f.html(), /latest-C/);
});

test('changing selected player immediately hides the previous ledger rows', () => {
  const f = fixture(); f.request(PLAYER_A); f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'confirmed-A')] });
  assert.match(f.html(), /confirmed-A/);
  f.select(PLAYER_B); f.tab('ledger');
  assert.doesNotMatch(f.html(), /confirmed-A/);
});

test('explicit foreign ledger rows do not consume the selected player request', () => {
  const f = fixture(); f.request(PLAYER_B);
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'unsolicited-A')] });
  assert.doesNotMatch(f.html(), /unsolicited-A/);
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_B, 'confirmed-B')] });
  assert.match(f.html(), /confirmed-B/);
});

test('mixed-account and contradictory ledger owners are never presented as one player history', () => {
  const f = fixture(); f.request(PLAYER_A);
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'mixed-own'), ledgerRow(PLAYER_B, 'mixed-other')] });
  assert.doesNotMatch(f.html(), /mixed-own|mixed-other/);
  f.receive({ type: 'admin_ledger', entries: [{ ...ledgerRow(PLAYER_A, 'contradiction'), user: PLAYER_B }] });
  assert.doesNotMatch(f.html(), /contradiction/);
  f.receive({ type: 'admin_ledger', entries: [{ ...ledgerRow(PLAYER_A, 'account-only'), user: undefined }] });
  assert.match(f.html(), /account-only/);
});

test('an unsolicited empty ledger does not erase a confirmed selected ledger', () => {
  const f = fixture(); f.request(PLAYER_A); f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'retained-A')] });
  f.receive({ type: 'admin_ledger', entries: [] });
  assert.match(f.html(), /retained-A/);
});

test('failed A ledger releases the lane for B and a failed B result stays visible', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B);
  f.receive({ type: 'admin_error', message: 'server_error' });
  assert.deepEqual(f.ledgerRequests.map(request => request.playerId), [PLAYER_A, PLAYER_B]);
  assert.match(f.html(), /Загрузка операций/);
  f.receive({ type: 'admin_error', message: 'admin_forbidden' });
  assert.match(f.html(), /admin_forbidden/); assert.doesNotMatch(f.html(), /Транзакций нет/);
  f.node('v270LedgerRefresh').click();
  assert.equal(f.ledgerRequests.at(-1).playerId, PLAYER_B);
  f.receive({ type: 'admin_ledger', entries: [] }); assert.match(f.html(), /Транзакций нет/);
});

test('an error for the preceding dashboard request cannot be mistaken for the pending ledger', () => {
  const f = fixture(); f.api.refresh(); f.request(PLAYER_B);
  assert.equal(f.sent.at(-1).type, 'admin_get_dashboard'); assert.equal(f.ledgerRequests.length, 0);
  f.receive({ type: 'admin_error', message: 'dashboard_unavailable' });
  assert.equal(f.sent.at(-1).type, 'admin_list_users');
  f.receive({ type: 'admin_users', users: [PLAYER_A, PLAYER_B].map(id => ({ id, enabled: true, role: 'USER' })) });
  f.receive({ type: 'admin_sessions', sessions: [], rooms: [] });
  f.receive({ type: 'admin_audit', entries: [] });
  assert.equal(f.ledgerRequests.at(-1).playerId, PLAYER_B);
  f.receive({ type: 'admin_ledger', entries: [] });
  assert.match(f.html(), /Транзакций нет/); assert.doesNotMatch(f.html(), /dashboard_unavailable/);
});

test('rejected, throwing and disconnected ledger sends display errors and remain retryable', async t => {
  for (const failure of ['reject', 'throw', 'offline']) await t.test(failure, () => {
    const f = fixture();
    if (failure === 'reject') f.setAccepted(false); if (failure === 'throw') f.setThrow(true); if (failure === 'offline') f.setConnected(false);
    assert.doesNotThrow(() => f.request(PLAYER_A));
    assert.match(f.html(), /Запрос не отправлен|Нет связи/); assert.doesNotMatch(f.html(), /Загрузка операций/);
    f.setAccepted(true); f.setThrow(false); f.setConnected(true); f.node('v270LedgerRefresh').click();
    f.receive({ type: 'admin_ledger', entries: [] }); assert.match(f.html(), /Транзакций нет/);
  });
});

test('disconnect and reconnect reset the command lane before fresh admin requests', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B); f.reconnect();
  f.flushRequestTimers();
  assert.equal(f.sent.at(-1).type, 'admin_get_dashboard');
  f.receive({ type: 'admin_dashboard', dashboard: {} });
  assert.equal(f.sent.at(-1).type, 'admin_list_users');
});

test('logout hides privileged rows and drops pending targets before accepting another owner', () => {
  const f = fixture(); f.request(PLAYER_A); f.request(PLAYER_B); f.identity('');
  f.receive({ type: 'admin_ledger', entries: [ledgerRow(PLAYER_A, 'old-private-ledger')] });
  assert.match(f.html(), /Доступ определяется/); assert.doesNotMatch(f.html(), /old-private-ledger/);
});

function saveEditedUser(f) {
  f.select(PLAYER_A);
  for (const [id, value] of [['v270Nick', 'Edited name'], ['v270MS', '100'], ['v270MG', '0'], ['v270Enabled', '1'], ['v270Role', 'USER']]) f.node(id).value = value;
  f.node('v270Save').click();
}

test('rejected, throwing and disconnected user saves never claim that changes were sent', async t => {
  for (const failure of ['reject', 'throw', 'offline']) await t.test(failure, () => {
    const f = fixture();
    if (failure === 'reject') f.setAccepted(false); if (failure === 'throw') f.setThrow(true); if (failure === 'offline') f.setConnected(false);
    assert.doesNotThrow(() => saveEditedUser(f));
    assert.match(f.toasts.at(-1)?.[1] || '', /Не удалось отправить изменения/);
    assert.equal(f.toasts.at(-1)?.[2], '!');
    assert.equal(f.toasts.some(toast => /Изменения отправлены/.test(toast[1])), false);
  });
});

test('an accepted user save waits for server confirmation and queued send failure is visible', () => {
  const f = fixture(); f.request(PLAYER_A); saveEditedUser(f);
  assert.equal(f.sent.some(command => command.type === 'admin_update_user'), false, 'The ledger request still owns the command lane');
  assert.match(f.toasts.at(-1)?.[1] || '', /очередь|подтверждения/);
  f.setAccepted(false); f.receive({ type: 'admin_ledger', entries: [] });
  assert.equal(f.sent.at(-1).type, 'admin_update_user');
  assert.match(f.toasts.at(-1)?.[1] || '', /Не удалось отправить изменения/);
  assert.equal(f.toasts.at(-1)?.[2], '!');
});
