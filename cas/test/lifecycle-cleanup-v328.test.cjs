const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(process.env.JRVX_LIFECYCLE_SOURCE || path.join(__dirname, '../public/modules/core/runtime/lifecycle-v328.js'), 'utf8');

function fixture(readyState = 'complete') {
  const timers = new Map(), frames = new Map(), documentEvents = new Map(), windowEvents = new Map(), observers = [], classes = new Set();
  let serial = 0, mutations = 0, validations = 0;
  function listen(events, type, callback, options) {
    if (!events.has(type)) events.set(type, new Set());
    const list = events.get(type); if (options?.signal?.aborted) return;
    list.add(callback); options?.signal?.addEventListener('abort', () => list.delete(callback));
  }
  const game = id => ({ id, hidden: false, classList: { contains: () => false, remove() {} } });
  const games = new Map(['poker', 'blackjack', 'roulette'].map(id => [id, game(id)]));
  const ctx = { AbortController, performance: { now: () => 0 }, navigator: { onLine: true }, Date, getComputedStyle: () => ({}),
    document: { readyState, title: '', hidden: false, body: { dataset: {}, classList: { toggle(name, value) { mutations++; if (value) classes.add(name); else classes.delete(name); } } },
      getElementById: id => games.get(id) || null, querySelector: () => null, querySelectorAll: () => [], getElementsByTagName: () => [],
      addEventListener: (...args) => listen(documentEvents, ...args) },
    window: { addEventListener: (...args) => listen(windowEvents, ...args), JRVXCASV200: { validate() { validations++; } } },
    setTimeout(fn, ms) { const id = ++serial; timers.set(id, { fn, ms }); return id; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame(fn) { const id = ++serial; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { constructor(callback) { this.callback = callback; this.observed = []; this.disconnected = false; observers.push(this); } observe(node) { this.observed.push(node); } disconnect() { this.disconnected = true; } },
    sessionStorage: { setItem() {} } };
  vm.runInNewContext(source, ctx);
  return { api: ctx.window.JRVXCASV241, ctx, timers, frames, observers,
    emitWindow(type, event = {}) { for (const fn of windowEvents.get(type) || []) fn(event); },
    boot() { for (const fn of documentEvents.get('DOMContentLoaded') || []) fn(); },
    counts: () => ({ mutations, validations }) };
}

test('lifecycle destroy cancels every delayed boot and releases its observer reference', () => {
  const f = fixture(); assert.equal(f.timers.size, 5); assert.equal(f.observers.length, 1);
  f.observers[0].callback(); assert.equal(f.frames.size, 1);
  f.api.destroy();
  assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0); assert.equal(f.observers[0].disconnected, true);
  assert.equal(f.ctx.window.__JRVXV241LifecycleObserver, null);
});

test('destroy before DOMContentLoaded cannot install a late lifecycle', () => {
  const f = fixture('loading'); f.api.destroy(); f.boot();
  assert.equal(f.observers.length, 0); assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0);
  assert.deepEqual(f.counts(), { mutations: 0, validations: 0 });
});

test('queued callbacks and manual sync cannot revive a destroyed lifecycle', () => {
  const f = fixture(); const queuedBoot = [...f.timers.values()][0].fn;
  f.observers[0].callback(); const queuedFrame = [...f.frames.values()][0];
  f.api.destroy(); const before = f.counts(); queuedBoot(); queuedFrame(); f.api.sync();
  assert.equal(f.observers.length, 1); assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0);
  assert.deepEqual(f.counts(), before);
});

test('destroy cancels delayed runtime validation and does not retain event listeners', () => {
  const f = fixture(); f.emitWindow('error', { message: 'synthetic failure' });
  assert.equal(f.timers.size, 6); f.api.destroy(); const before = f.counts();
  f.emitWindow('error', { message: 'after destroy' }); f.emitWindow('online');
  assert.equal(f.timers.size, 0); assert.equal(f.frames.size, 0); assert.deepEqual(f.counts(), before);
});

test('active lifecycle still coalesces route mutations and keeps one observer', () => {
  const f = fixture(); for (let i = 0; i < 50; i++) f.observers[0].callback();
  assert.equal(f.frames.size, 1);
  for (const timer of [...f.timers.values()]) timer.fn();
  assert.equal(f.observers.length, 1); assert.equal(f.frames.size, 1); f.api.destroy(); f.api.destroy();
});
