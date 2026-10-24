const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../public/modules/network/runtime/online-v327.js'), 'utf8');
const snapshot = (revision, extra = {}) => ({
  authoritative: true, roomId: 'room-A', tableId: '1-2', currency: 'MS', mode: 'jarvis',
  handNo: 4, revision, you: { id: 'owner-A' }, seats: [], canStart: false, ...extra
});

function fixture() {
  const nodes = new Map(), listeners = new Map(), frames = [], sent = [], routes = [], notices = [];
  let accepted = true, throwing = false, owner = 'owner-A';
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === 'poker' ? ['active'] : []);
      nodes.set(id, { id, textContent: '', innerHTML: '', hidden: false, offsetParent: null,
        classList: { add(...names) { names.forEach(name => classes.add(name)); },
          remove(...names) { names.forEach(name => classes.delete(name)); }, contains(name) { return classes.has(name); } },
        setAttribute() {}, addEventListener() {}, querySelectorAll() { return []; } });
    }
    return nodes.get(id);
  }
  const first = snapshot(1), state = { server: first, game: null, mode: 'jarvis', tableId: '1-2', ignoreServer: true };
  const ctx = { console, setTimeout() { return 1; }, setInterval() { return 1; }, clearInterval() {},
    requestAnimationFrame(fn) { frames.push(fn); },
    document: { readyState: 'loading', getElementById(id) { return id === 'v250OnlinePanel' ? nodes.get(id) || null : node(id); },
      querySelector(selector) { return selector === '#poker59App .p59LobbyCard' ? { appendChild(el) { nodes.set(el.id, el); } } : null; },
      createElement() { return { id: '', className: '', innerHTML: '' }; }, querySelectorAll() { return []; },
      addEventListener(type, fn) { listeners.set(type, fn); } } };
  ctx.window = {
    arcadeNetState: { connected: true, poker: first }, Poker59: { state },
    JRVXCASIdentityV300: { state: () => ({ requiresAuthentication: true, authenticated: !!owner, user: owner ? { id: owner } : null }) },
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }), setCurrency() {} },
    setActiveGameById(...args) { routes.push(args); }, showArcadeToast(...args) { notices.push(args); },
    arcadeNetSend(command) { sent.push(command); if (throwing) throw new Error('transport rejected'); return accepted; },
    handleArcadeNetMessage(message) {
      if (message.type === 'poker_state') {
        ctx.window.arcadeNetState.poker = message.state; state.server = message.state;
        // The installed legacy poker renderer updates this class synchronously.
        node('poker59App').classList.remove('can-start');
        if (message.state?.mode === 'jarvis' && message.state?.canStart) node('poker59App').classList.add('can-start');
      }
      return true;
    }
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); listeners.get('DOMContentLoaded')();
  return { node, state, sent, routes, notices, net: ctx.window.arcadeNetState,
    receive: message => ctx.window.handleArcadeNetMessage(message), send: message => ctx.window.arcadeNetSend(message),
    accept() { return node('v250InviteAccept').onclick(); }, setAccepted(value) { accepted = value; }, setThrow(value) { throwing = value; },
    flushFrames() { while (frames.length) frames.shift()(); },
    setOwner(value) { owner = value; listeners.get('jrvx-cas-identity')(); } };
}

const invitation = () => ({ type: 'poker_invite', roomId: 'private-B', tableId: '2-4', buyIn: 40, currency: 'MG', fromNickname: 'Friend' });

test('a rejected invite send retains the invitation and the current table UI for a retry', () => {
  const f = fixture(); f.receive(invitation()); f.setAccepted(false); f.accept();
  assert.equal(f.node('v250Invite').hidden, false);
  assert.equal(f.state.mode, 'jarvis'); assert.equal(f.state.tableId, '1-2'); assert.equal(f.state.ignoreServer, true);
  assert.equal(f.routes.length, 0);
  const id = f.sent.at(-1).opId; f.setAccepted(true); f.accept();
  assert.equal(f.sent.at(-1).opId, id); assert.equal(f.sent.at(-1).roomId, 'private-B');
  assert.equal(f.node('v250Invite').hidden, true); assert.equal(f.state.mode, 'friend'); assert.equal(f.state.tableId, '2-4');
});

test('a throwing invite transport does not lose the invitation or escape its click handler', () => {
  const f = fixture(); f.receive(invitation()); f.setThrow(true);
  assert.doesNotThrow(() => f.accept()); assert.equal(f.node('v250Invite').hidden, false);
  assert.equal(f.state.mode, 'jarvis'); assert.equal(f.routes.length, 0);
});

test('an accepted invite changes the UI once and sends the original private-table parameters', () => {
  const f = fixture(); f.receive(invitation()); f.accept(); f.accept();
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].type, 'poker_accept_invite');
  assert.equal(f.sent[0].buyIn, 40); assert.equal(f.sent[0].currency, 'MG');
  assert.equal(f.state.mode, 'friend'); assert.equal(f.state.ignoreServer, false); assert.equal(f.routes.length, 1);
});

test('a queued older poker frame cannot re-enable Start after a newer active-hand render', () => {
  const f = fixture();
  f.receive({ type: 'poker_state', state: snapshot(2, { canStart: true, seats: [{ nickname: 'Old', connected: false }] }) });
  f.receive({ type: 'poker_state', state: snapshot(3, { active: true }) });
  f.flushFrames();
  assert.equal(f.node('poker59App').classList.contains('can-start'), false);
  assert.doesNotMatch(f.node('p59StatusSub').textContent, /Old|переподключается/);
});

test('a queued poker frame cannot restore Start or reconnect status after leaving the table', () => {
  const f = fixture();
  f.receive({ type: 'poker_state', state: snapshot(2, { canStart: true, seats: [{ nickname: 'Old', connected: false }] }) });
  f.send({ type: 'poker_leave' }); f.node('poker59App').classList.remove('can-start');
  f.node('p59StatusSub').textContent = 'Лобби'; f.flushFrames();
  assert.equal(f.net.poker, null); assert.equal(f.node('poker59App').classList.contains('can-start'), false);
  assert.equal(f.node('p59StatusSub').textContent, 'Лобби');
});

test('same-owner A to B to A reset cannot revive a queued frame from the previous login', () => {
  const f = fixture(); f.receive({ type: 'poker_state', state: snapshot(2, { canStart: true }) });
  f.setOwner('owner-B'); f.setOwner('owner-A'); f.node('p59StatusSub').textContent = 'Новый вход'; f.flushFrames();
  assert.equal(f.node('poker59App').classList.contains('can-start'), false);
  assert.equal(f.node('p59StatusSub').textContent, 'Новый вход');
});

test('the current poker frame still renders Start and reconnect status', () => {
  const f = fixture(); f.receive({ type: 'poker_state', state: snapshot(2, { canStart: true, seats: [{ nickname: 'Opponent', connected: false }] }) });
  f.flushFrames(); assert.equal(f.node('poker59App').classList.contains('can-start'), true);
  assert.match(f.node('p59StatusSub').textContent, /Opponent.*переподключается/);
});
