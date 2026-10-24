const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exact installed profile baseline: 7,979 bytes, SHA-256
// 9d5fce39648c2b2db4e24f159b950586a2a9807be080bf8dc2688571d164561d.
const source = fs.readFileSync(path.join(__dirname, '../public/modules/profile/runtime/profile-v328.js'), 'utf8');
const A = 'JRVX-AAAA11111111', B = 'JRVX-BBBB22222222';
const production = (id = B, nickname = 'Current B') => ({
  mode: 'production', requiresAuthentication: true, authenticated: true, user: { id, nickname }
});

function fixture({ auth = production(), progress = null, legacyRemote = { id: A, nickname: 'Former A' }, fetchImpl = () => { throw Error('Unexpected fetch'); } } = {}) {
  let identity = auth;
  const events = new Map(), timers = [], nodes = new Map();
  for (const id of ['v109ProfileName', 'v109ProfileId', 'v109PokerWins', 'v109PokerHands',
    'v109TopName', 'v109TopAvatar', 'v109ProfileAvatar', 'v109OnlineState', 'v109ActiveCurrency',
    'v70Nick', 'v70PlayerId', 'v70SaveProfile', 'v109IdentityNote', 'v109IdentityBadge']) {
    nodes.set(id, { textContent: '', value: '', readOnly: false, disabled: false, style: {},
      attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } });
  }
  const document = { readyState: 'loading', title: 'JRVX CAS', documentElement: { dataset: {} }, querySelector: () => null, querySelectorAll: () => [],
    getElementById: id => nodes.get(id) || null,
    addEventListener(type, fn) { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); } };
  const messages = [];
  const window = {
    JRVXIdentity: legacyRemote,
    playerProfile: { nickname: 'Former A', pokerWins: 77, pokerHands: 99 },
    JRVXCASIdentityV300: { state: () => identity },
    JRVXProgress: { state: progress },
    JVRXCasEconomy: { get: () => ({ ms: 0, mg: 0, currency: 'MS' }) },
    arcadeNetState: { connected: false },
    handleArcadeNetMessage(message) { messages.push(message); return 'base-result'; }, addEventListener() {}
  };
  if (auth === null) delete window.JRVXCASIdentityV300;
  const context = vm.createContext({ window, document, localStorage: { getItem: () => null, removeItem() {} }, location: {},
    setTimeout(fn, delay) { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {}, fetch: fetchImpl, AbortController });
  vm.runInContext(source, context);
  const fire = type => { for (const fn of events.get(type) || []) fn(); };
  return { nodes, window, messages, events, sync: () => window.__jrvxProfileSync(), fire, load: code => vm.runInContext(code, context),
    setIdentity(value) { identity = value; fire('jrvx-cas-identity'); },
    drainImmediate() {
      for (let iterations = 0; iterations < 20; iterations++) {
        const index = timers.findIndex(timer => timer.delay === 0);
        if (index < 0) return;
        timers.splice(index, 1)[0].fn();
      }
      throw Error('Unexpected recurring profile timer');
    } };
}

test('a newly verified production owner cannot inherit the former owner local poker totals', () => {
  const f = fixture(); f.sync();
  assert.equal(f.nodes.get('v109ProfileId').textContent, B);
  assert.equal(f.nodes.get('v109ProfileName').textContent, 'Current B');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 0);
  assert.equal(f.window.playerProfile.pokerWins, 77, 'The UI fix must not mutate legacy data');
});

test('verified production identity and server progression override stale legacy globals', () => {
  const f = fixture({ progress: { stats: { poker: { wins: 3, hands: 12 } } } }); f.sync();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Current B');
  assert.equal(f.nodes.get('v70PlayerId').value, B);
  assert.equal(f.nodes.get('v70Nick').value, 'Current B');
  assert.equal(f.nodes.get('v70Nick').readOnly, true);
  assert.equal(f.nodes.get('v70SaveProfile').disabled, true);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 3);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 12);
});

test('sign-out clears visible former-owner name, inputs and totals despite stale globals', () => {
  const f = fixture({ progress: { stats: { poker: { wins: 3, hands: 12 } } } }); f.sync();
  f.setIdentity({ mode: 'production', requiresAuthentication: true, authenticated: false, user: null });
  f.drainImmediate();
  for (const id of ['v109TopName', 'v109ProfileName']) assert.equal(f.nodes.get(id).textContent, 'Игрок');
  assert.equal(f.nodes.get('v109ProfileId').textContent, '—');
  assert.equal(f.nodes.get('v70PlayerId').value, '—');
  assert.equal(f.nodes.get('v70Nick').value, 'Игрок');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 0);
  assert.match(f.nodes.get('v70SaveProfile').textContent, /Войдите/);
  assert.equal(f.nodes.get('v109IdentityBadge').textContent, 'GAME PROFILE');
});

test('a verified account without a name never falls back to the former local nickname', () => {
  const f = fixture({ auth: production(B, '') }); f.sync();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Игрок');
  assert.equal(f.nodes.get('v109ProfileId').textContent, B);
});

test('before identity initialization the profile does not expose an unverified cached owner', () => {
  const f = fixture({ auth: null }); f.sync();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Игрок');
  assert.equal(f.nodes.get('v109ProfileId').textContent, '—');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
});

test('explicit development mode retains the existing local profile and poker totals', () => {
  const f = fixture({ auth: { mode: 'development', requiresAuthentication: false, authenticated: false }, legacyRemote: null }); f.sync();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Former A');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 77);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 99);
});

test('development mode retains the existing remote display-name and owner badge contract', () => {
  const f = fixture({ auth: { mode: 'development', requiresAuthentication: false },
    legacyRemote: { id: 'JRVX-JRVX11101111', profile: { display_name: 'Development owner' } } }); f.sync();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Development owner');
  assert.equal(f.nodes.get('v109IdentityBadge').textContent, 'OWNER • SUPERADMIN');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 77);
});

test('identity-change rendering waits until later account listeners reset progression', () => {
  const f = fixture({ auth: production(A, 'Current A'), progress: { stats: { poker: { wins: 8, hands: 20 } } } });
  f.sync();
  f.events.get('jrvx-cas-identity').push(() => { f.window.JRVXProgress.state = null; });
  f.setIdentity(production()); f.drainImmediate();
  assert.equal(f.nodes.get('v109ProfileName').textContent, 'Current B');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 0);
});

test('a same-owner identity refresh keeps its confirmed progression', () => {
  const f = fixture({ progress: { stats: { poker: { wins: 3, hands: 12 } } } }); f.sync();
  f.setIdentity(production(B, 'Updated name')); f.drainImmediate();
  assert.equal(f.nodes.get('v109TopName').textContent, 'Updated name');
  assert.equal(f.nodes.get('v109PokerWins').textContent, 3);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 12);
});

test('existing account-wallet message delegation and profile rendering remain intact', () => {
  const f = fixture({ progress: { stats: { poker: { wins: 3, hands: 12 } } } });
  assert.equal(f.window.handleArcadeNetMessage({ type: 'account_wallet' }), 'base-result');
  f.drainImmediate();
  assert.equal(f.messages.length, 1);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 3);
});

const progressionSource = fs.readFileSync(path.join(__dirname, '../public/modules/profile/runtime/progression-v322.js'), 'utf8');
const accountSource = fs.readFileSync(path.join(__dirname, '../public/assets/js-v327/identity-account.js'), 'utf8')
  .split('/* source: modules/network/runtime/server-account-v300.js */')[1];
function snapshot(id, version, wins, hands) {
  return { ok: true, account: { id }, progressVersion: version,
    progress: { level: 1, achievements: [], stats: { poker: { wins, hands } } } };
}
function combinedFixture(auth = production()) {
  const pending = [];
  const f = fixture({ auth, fetchImpl: pathname => {
    if (pathname.startsWith('/api/history')) return Promise.resolve({ ok: true, json: async () => ({ ok: true, history: [] }) });
    assert.equal(pathname, '/api/me');
    return new Promise(resolve => pending.push(data => resolve({ ok: true, json: async () => data })));
  } });
  // Real installation order: profile loads first, server account then progression.
  f.load(accountSource); f.load(progressionSource); f.fire('DOMContentLoaded');
  return { ...f, pending };
}

test('a delayed real ServerAccount snapshot refreshes visible confirmed profile totals', async () => {
  const f = combinedFixture();
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
  const request = f.window.JRVXCASServerAccount.refresh();
  assert.equal(f.nodes.get('v109PokerHands').textContent, 0, 'Pending reads must not invent server totals');
  f.pending.shift()(snapshot(B, 1, 3, 12)); await request;
  assert.equal(f.window.JRVXProgress.state.stats.poker.wins, 3);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 3);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 12);
});

test('an accepted production progress_state frame refreshes the profile without a wallet message', () => {
  const f = combinedFixture();
  f.window.handleArcadeNetMessage({ type: 'progress_state', ...snapshot(B, 1, 4, 15) });
  assert.equal(f.window.JRVXProgress.state.stats.poker.wins, 4);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 4);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 15);
});

test('a stale server progress version cannot roll the newly synchronized profile back', () => {
  const f = combinedFixture();
  f.window.handleArcadeNetMessage({ type: 'progress_state', ...snapshot(B, 2, 4, 15) });
  f.window.handleArcadeNetMessage({ type: 'progress_state', ...snapshot(B, 1, 1, 5) });
  assert.equal(f.window.JRVXProgress.state.stats.poker.wins, 4);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 4);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 15);
});

test('a delayed old-owner snapshot stays rejected while the new owner confirmed totals appear', async () => {
  const f = combinedFixture(production(A, 'Current A'));
  f.window.JRVXCASServerAccount.apply(snapshot(A, 1, 8, 20)); f.sync();
  const previous = f.window.JRVXCASServerAccount.refresh();
  f.setIdentity(production()); f.drainImmediate();
  assert.equal(f.nodes.get('v109ProfileId').textContent, B);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0);
  f.pending.shift()(snapshot(A, 99, 77, 99)); await previous;
  assert.equal(f.nodes.get('v109PokerWins').textContent, 0, 'Former owner response must stay fenced');
  f.pending.shift()(snapshot(B, 1, 3, 12));
  // Identity listener performs this refresh in the background.
  for (let i = 0; i < 10; i++) await Promise.resolve();
  assert.equal(f.window.JRVXProgress.state.stats.poker.wins, 3);
  assert.equal(f.nodes.get('v109PokerWins').textContent, 3);
  assert.equal(f.nodes.get('v109PokerHands').textContent, 12);
});
