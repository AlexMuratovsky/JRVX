const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.JRVX_ONLINE_SOURCE || path.join(__dirname, '../public/modules/network/runtime/online-v327.js'), 'utf8');

function fixture() {
  const nodes = new Map(), events = new Map(), sent = [], notices = [];
  let accepted = true, connected = true;
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(), attributes = new Map();
      nodes.set(id, {
        id, textContent: '', innerHTML: '', hidden: false, dataset: {}, offsetParent: null,
        classList: { add(...names) { names.forEach(name => classes.add(name)); }, remove(...names) { names.forEach(name => classes.delete(name)); }, contains: name => classes.has(name) },
        querySelectorAll: () => [], setAttribute: (name, value) => attributes.set(name, value), getAttribute: name => attributes.get(name), addEventListener() {}
      });
    }
    return nodes.get(id);
  }
  const ctx = {
    console, Date, setTimeout: () => 1, setInterval: () => 1, clearInterval() {}, requestAnimationFrame() {},
    fetch() { throw new Error('Spectator UI tests must never make network requests'); },
    document: { readyState: 'loading', getElementById: node, querySelector: () => null, querySelectorAll: () => [], addEventListener: (name, fn) => events.set(name, fn) }
  };
  ctx.window = {
    arcadeNetState: { get connected() { return connected; } },
    arcadeNetSend(command) { sent.push(command); return accepted; }, handleArcadeNetMessage() {},
    JRVXCasEconomy: { get: () => ({ currency: 'MS' }) }, showArcadeToast: (...args) => notices.push(args)
  };
  vm.createContext(ctx); vm.runInContext(source, ctx); events.get('DOMContentLoaded')();
  return {
    api: ctx.window.JRVXCASV250, node, sent, notices,
    receive(roomId, handNo = 1) { ctx.window.handleArcadeNetMessage({ type: 'spectator_state', state: { roomId, tableId: 'table-' + roomId, currency: 'MS', handNo, street: 'flop', community: ['AS', 'KD', '7C'], seats: [] } }); },
    setAccepted(value) { accepted = value; }, setConnected(value) { connected = value; },
    isOpen: () => node('v250Spectator').classList.contains('active')
  };
}

test('an unsolicited spectator snapshot cannot open a table', () => {
  const f = fixture(); f.receive('A');
  assert.equal(f.isOpen(), false); assert.equal(f.node('v250SpectatorTitle').textContent, '');
});

test('an accepted watch renders its room and close unsubscribes that exact room', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A');
  assert.equal(f.isOpen(), true); assert.equal(f.node('v250SpectatorTitle').textContent, 'table-A · MS');
  f.api.closeSpectator();
  assert.equal(f.isOpen(), false); assert.equal(f.node('v250Spectator').getAttribute('aria-hidden'), 'true');
  assert.deepEqual(f.sent.map(command => [command.type, command.roomId]), [['poker_watch', 'A'], ['poker_unwatch', 'A']]);
});

test('a delayed snapshot cannot reopen a closed spectator overlay', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.api.closeSpectator(); f.receive('A', 2);
  assert.equal(f.isOpen(), false); assert.equal(f.node('v250Spectator').getAttribute('aria-hidden'), 'true');
  assert.match(f.node('v250SpectatorMeta').textContent, /#1$/);
});

test('switching rooms rejects old snapshots and close keeps the latest watch intent', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.api.watchRoom('B'); f.receive('A', 2);
  assert.match(f.node('v250SpectatorMeta').textContent, /#1$/);
  f.receive('B', 3); f.receive('A', 4);
  assert.equal(f.node('v250SpectatorTitle').textContent, 'table-B · MS');
  assert.match(f.node('v250SpectatorMeta').textContent, /#3$/);
  f.api.closeSpectator(); assert.equal(f.sent.at(-1).roomId, 'B');
});

test('a rejected first watch leaves the overlay closed and creates no render intent', () => {
  const f = fixture(); f.setAccepted(false); f.api.watchRoom('A'); f.receive('A');
  assert.equal(f.isOpen(), false); assert.equal(f.node('v250SpectatorTitle').textContent, '');
  assert.equal(f.notices.length, 1); f.api.closeSpectator();
  assert.equal(f.sent.filter(command => command.type === 'poker_unwatch').length, 0);
});

test('a rejected room switch preserves the preceding accepted watch', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.setAccepted(false); f.api.watchRoom('B');
  f.receive('B', 5); f.receive('A', 2);
  assert.equal(f.node('v250SpectatorTitle').textContent, 'table-A · MS');
  assert.match(f.node('v250SpectatorMeta').textContent, /#2$/);
  f.api.closeSpectator(); assert.equal(f.sent.at(-1).roomId, 'A');
});

test('a rejected unwatch still closes locally and late snapshots stay ignored', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.setAccepted(false); f.api.closeSpectator(); f.receive('A', 2);
  assert.equal(f.isOpen(), false); assert.equal(f.sent.at(-1).type, 'poker_unwatch');
});

test('closing repeatedly is idempotent and the same room can be watched again', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.api.closeSpectator(); f.api.closeSpectator();
  assert.equal(f.sent.filter(command => command.type === 'poker_unwatch').length, 1);
  f.api.watchRoom('A'); f.receive('A', 2);
  assert.equal(f.isOpen(), true); assert.match(f.node('v250SpectatorMeta').textContent, /#2$/);
  assert.equal(f.sent.filter(command => command.type === 'poker_watch').length, 2);
});

test('a response without a matching room ID cannot overwrite the intended table', () => {
  const f = fixture(); f.api.watchRoom('A'); f.receive('A'); f.receive(undefined, 9); f.receive('B', 9);
  assert.equal(f.node('v250SpectatorTitle').textContent, 'table-A · MS'); assert.match(f.node('v250SpectatorMeta').textContent, /#1$/);
});

test('watching while disconnected does not send or open an overlay', () => {
  const f = fixture(); f.setConnected(false); f.api.watchRoom('A'); f.receive('A');
  assert.equal(f.sent.length, 0); assert.equal(f.isOpen(), false); assert.equal(f.notices.length, 1);
});
