const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/service-worker.js'), 'utf8');
const origin = 'https://cas.jrvx.ru';
const oldCache = 'jrvx-cas-http-previous-shell';
const cacheName = /CACHE='([^']+)'/.exec(source)[1];
const key = req => new URL(typeof req === 'string' ? req : req.url, origin).pathname;
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function fixture() {
  const listeners = new Map(), stores = new Map(), deleted = [], events = [], timers = new Map();
  const network = [], writes = [], precache = [];
  let nextTimer = 0;
  const context = { URL, Response, AbortController, location: { origin },
    Request: class { constructor(url, options = {}) { this.url = new URL(url, origin).href; Object.assign(this, options); } },
    setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
    self: { addEventListener: (name, fn) => listeners.set(name, fn),
      skipWaiting: async () => { events.push('skip'); }, clients: { claim: async () => { events.push('claim'); } } },
    caches: { async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      return { async put(req, res) { writes.push({ cache: name, path: key(req) }); stores.get(name).set(key(req), res); },
        async addAll(requests) { precache.push(...requests); if (context.installGate) await context.installGate; } };
    }, async keys() { return [...stores.keys()]; }, async delete(name) { deleted.push(name); return stores.delete(name); },
    async match(req) { for (const store of stores.values()) if (store.has(key(req))) return store.get(key(req)).clone(); } },
    fetch: async (req, options) => { network.push({ req, options }); return context.reply(req, options); },
    reply: async () => new Response('online') };
  vm.runInNewContext(source, context);
  const dispatch = name => { let result; listeners.get(name)({ waitUntil: promise => { result = promise; } }); return result; };
  const request = (url, overrides = {}) => {
    let result; listeners.get('fetch')({ request: { url: new URL(url, origin).href, method: 'GET', mode: 'cors', ...overrides }, respondWith: promise => { result = promise; } }); return result;
  };
  return { context, listeners, stores, deleted, events, timers, network, writes, precache, dispatch, request };
}

test('service worker installs all versioned assets before replacing the active shell', async () => {
  const f = fixture(), gate = deferred(); f.context.installGate = gate.promise;
  const installation = f.dispatch('install'); await new Promise(setImmediate);
  assert.deepEqual(f.events, []);
  assert.ok(f.precache.length > 150);
  const names = f.precache.map(key);
  for (const asset of ['/assets/js-v327/casino.js', '/assets/js-v327/identity-account.js', '/modules/network/runtime/online-v327.js', '/modules/legacy/runtime/wallet-v327.js', '/modules/ui/styles/gameplay-v327.css']) assert.ok(names.includes(asset));
  assert.ok(f.precache.every(req => req.cache === 'reload'));
  gate.resolve(); await installation;
  assert.deepEqual(f.events, ['skip']); assert.equal(f.timers.size, 0);
});

test('failed precache leaves the previous shell active and its files intact', async () => {
  const f = fixture(), gate = deferred(); f.context.installGate = gate.promise;
  f.stores.set(oldCache, new Map([['/index.html', new Response('previous shell')]]));
  const installation = f.dispatch('install'); gate.reject(Error('missing versioned asset'));
  await assert.rejects(installation, /missing versioned asset/);
  assert.deepEqual(f.events, []); assert.deepEqual(f.deleted, []);
  assert.equal(await f.stores.get(oldCache).get('/index.html').text(), 'previous shell');
});

test('activation removes only obsolete CAS caches and retains unrelated applications', async () => {
  const f = fixture();
  for (const name of [cacheName, oldCache, 'planner-shell-v9']) f.stores.set(name, new Map());
  await f.dispatch('activate');
  assert.deepEqual(f.deleted, [oldCache]); assert.ok(f.stores.has(cacheName)); assert.ok(f.stores.has('planner-shell-v9'));
  assert.deepEqual(f.events, ['claim']);
});

test('authenticated APIs, callbacks, sockets, cross-origin and mutation requests bypass the cache', () => {
  const f = fixture();
  for (const url of ['/api/me', '/api/history', '/api/wallet/command', '/auth/jrvx/callback?code=private', '/auth/me', '/ws', '/server/state', '/cloudflare/status', '/health', 'https://id.jrvx.ru/auth/me']) {
    assert.equal(f.request(url, { mode: 'navigate' }), undefined, url);
  }
  assert.equal(f.request('/index.html', { method: 'POST' }), undefined);
  assert.equal(f.request('/unlisted-asset.js'), undefined);
  assert.equal(f.network.length, 0); assert.equal(f.writes.length, 0);
});

test('successful online navigation refreshes the shell; HTTP rejection is never cached', async () => {
  const f = fixture(); f.context.reply = async () => new Response('new shell');
  assert.equal(await (await f.request('/', { mode: 'navigate' })).text(), 'new shell');
  assert.equal(f.network[0].options.cache, 'no-store');
  assert.deepEqual(f.writes, [{ cache: cacheName, path: '/index.html' }]);
  f.context.reply = async () => new Response('unavailable', { status: 503 });
  assert.equal((await f.request('/', { mode: 'navigate' })).status, 503);
  assert.equal(f.writes.length, 1); assert.equal(f.timers.size, 0);
});

test('offline navigation falls back to the installed shell, then to the offline document', async () => {
  const f = fixture(); f.context.reply = async () => { throw Error('offline'); };
  f.stores.set(cacheName, new Map([['/index.html', new Response('installed')], ['/offline.html', new Response('offline page')]]));
  assert.equal(await (await f.request('/', { mode: 'navigate' })).text(), 'installed');
  f.stores.get(cacheName).delete('/index.html');
  assert.equal(await (await f.request('/', { mode: 'navigate' })).text(), 'offline page');
  f.stores.get(cacheName).clear(); assert.equal((await f.request('/', { mode: 'navigate' })).type, 'error');
  assert.equal(f.timers.size, 0);
});

test('navigation deadline aborts a stalled fetch and restores the cached shell', async () => {
  const f = fixture();
  f.stores.set(cacheName, new Map([['/index.html', new Response('saved shell')]]));
  f.context.reply = (_, options) => new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('aborted'))));
  const navigation = f.request('/', { mode: 'navigate' });
  for (const run of [...f.timers.values()]) run();
  assert.equal(await (await navigation).text(), 'saved shell');
  assert.equal(f.network[0].options.signal.aborted, true); assert.equal(f.timers.size, 0);
});

test('static shell files use cached content and do not store rejected or opaque responses', async () => {
  const f = fixture(); f.stores.set(cacheName, new Map([['/assets/js-v327/casino.js', new Response('cached')]]));
  assert.equal(await (await f.request('/assets/js-v327/casino.js?cachebust=1')).text(), 'cached');
  assert.equal(f.network.length, 0);
  f.context.reply = async () => ({ ok: true, type: 'opaque' }); await f.request('/offline.html');
  f.context.reply = async () => new Response('404', { status: 404 }); await f.request('/offline.html');
  assert.equal(f.writes.length, 0);
  f.context.reply = async () => ({ ok: true, type: 'basic', clone: () => new Response('fresh') }); await f.request('/offline.html');
  assert.equal(f.writes.length, 1); assert.equal(f.writes[0].path, '/offline.html');
});

test('previous client versioned game bundles remain present for rollback', () => {
  const f = fixture();
  for (const asset of ['assets/js-v326/casino.js', 'modules/network/runtime/online-v326.js', 'modules/legacy/runtime/wallet-v326.js']) {
    assert.ok(fs.existsSync(path.join(__dirname, '../public', asset)), asset);
  }
  assert.equal(f.stores.size, 0); // Merely loading the candidate cannot delete installed files.
});
