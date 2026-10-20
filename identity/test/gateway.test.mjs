import assert from 'node:assert/strict';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createRuntime } from './helpers/runtime.mjs';

const canonical = 'https://id.jrvx.ru';
const upstream = 'https://id-test.jrvx.ru';
const fixture = fileURLToPath(new URL('helpers/gateway.php', import.meta.url));
const php = process.env.PHP_BIN || 'php';
function batch(...items) {
  const run = spawnSync(php, [fixture], { input: JSON.stringify(items), encoding: 'utf8', timeout: 15000, windowsHide: true });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
  return JSON.parse(run.stdout);
}
function one(item) { return batch(item)[0]; }
const methods = path => one({ op: 'methods', path });
function requestHeaders(headers, ip, secret, cookieFree = false) {
  const lines = one({ op: 'request', headers, ip, secret, cookieFree });
  assert(Array.isArray(lines), 'Gateway rejected request headers');
  const result = new Headers();
  for (const line of lines) {
    const colon = line.indexOf(':');
    result.append(line.slice(0, colon), line.slice(colon + 1).trim());
  }
  return result;
}

test('gateway backup text matches the captured checksums', async () => {
  const manifest = JSON.parse(await readFile(new URL('../gateway/recovered/manifest.json', import.meta.url), 'utf8'));
  for (const [name, digest] of Object.entries(manifest.sha256)) {
    const text = (await readFile(new URL('../gateway/recovered/' + name, import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), digest);
  }
});

test('gateway permits reviewed client routes and rejects unlisted routes and hosts', async () => {
  const client = await readFile(new URL('../src/client/id-next.js', import.meta.url), 'utf8');
  const literals = [...new Set(client.match(/\/api\/[a-z0-9_/-]+/g))];
  const dynamic = new Set(['/api/v2/', '/api/v2/apps/', '/api/v2/admin/users/']);
  for (const path of literals.filter(path => !dynamic.has(path))) assert(methods(path).length, 'Blocked client route: ' + path);
  for (const [path, method] of [
    ['/assets/id-next.js', 'GET'], ['/assets/id-next.css', 'GET'],
    ['/api/v2/avatar', 'POST'], ['/api/v2/profile', 'PATCH'],
    ['/api/v2/apps/planner/connect', 'POST'], ['/api/v2/apps/planner/revoke', 'POST'],
    ['/api/v2/admin/users/00000000-0000-4000-8000-000000000001', 'PATCH'],
    ['/api/v2/admin/users/00000000-0000-4000-8000-000000000001/sessions/revoke', 'POST'],
    ['/api/v2/admin/apps/planner', 'PATCH'], ['/runtime/id-icon-planner', 'GET'],
    ['/oidc/oauth2/token', 'POST'], ['/oauth/token', 'POST'],
  ]) assert(methods(path).includes(method), `${method} ${path}`);
  for (const path of ['/api/v2/security/no-such-action', '/api/cas/state', '/api/tasks', '/.env', '/index.php.bak', '/assets/unknown.js']) assert.deepEqual(methods(path), []);
  assert.deepEqual(one({ op: 'methods', host: 'planner.jrvx.ru', path: '/api/v2/me' }), []);
  assert.equal(one({ op: 'host', value: 'ID.JRVX.RU:443' }), 'id.jrvx.ru');
  assert.equal(one({ op: 'host', value: 'id-reg.jrvx.ru' }), null);
  for (const path of ['/api/auth/login', '/api/v2/profile']) assert(!methods(path).includes('GET'));
});

test('gateway rejects path confusion and cross-origin mutations', () => {
  for (const value of ['//evil.test/a', '/api/%2fhealth', '/api/../health', '/api\\health', '/api/health#x', '/a\r\nb']) assert.equal(one({ op: 'uri', value }), null);
  const uri = '/oidc/oauth2/authorize?redirect_uri=https%3A%2F%2Fplanner.jrvx.ru%2Fcallback&state=x';
  assert.equal(one({ op: 'uri', value: uri }).uri, uri);
  for (const origin of [null, 'https://evil.invalid', 'https://planner.jrvx.ru', 'https://id.jrvx.ru.evil.invalid']) {
    assert.equal(one({ op: 'origin', method: 'POST', path: '/api/auth/login', origin }), false);
  }
  assert.equal(one({ op: 'origin', method: 'PATCH', path: '/api/v2/privacy', origin: canonical }), true);
  assert.equal(one({ op: 'origin', method: 'OPTIONS', path: '/api/v2/privacy', origin: 'https://evil.invalid' }), false);
  for (const path of ['/oidc/oauth2/token', '/oidc/oauth2/revoke', '/oauth/token']) {
    assert.equal(one({ op: 'origin', method: 'POST', path }), true);
    assert.equal(one({ op: 'origin', method: 'POST', path, origin: 'https://evil.invalid' }), false);
  }
});

test('gateway identity uses server-provided IP and strips forged identity headers', () => {
  const secret = randomBytes(48).toString('hex');
  const headers = requestHeaders({
    'CF-Connecting-IP': '198.51.100.1', 'X-Forwarded-For': '198.51.100.2', Forwarded: 'for=evil',
    'X-JRVX-Gateway-Key': 'forged', 'X-JRVX-Client-Key': 'forged',
    Cookie: 'session=synthetic', Authorization: 'Bearer synthetic', 'Content-Type': 'application/json'
  }, '2001:db8:0:0::1', secret);
  assert.equal(headers.get('x-jrvx-gateway-key'), secret);
  assert.equal(headers.get('x-jrvx-client-key'), createHmac('sha256', secret).update('2001:db8::1').digest('hex'));
  for (const name of ['cf-connecting-ip', 'x-forwarded-for', 'forwarded']) assert.equal(headers.get(name), null);
  assert.equal(headers.get('cookie'), 'session=synthetic');
  const other = requestHeaders({}, '192.0.2.2', secret);
  assert.notEqual(headers.get('x-jrvx-client-key'), other.get('x-jrvx-client-key'));
  assert.equal(requestHeaders({ Cookie: 'session=synthetic' }, '192.0.2.1', secret, true).get('cookie'), null);
  assert.equal(one({ op: 'request', headers: {}, ip: 'not-an-ip', secret }).error, 'invalid_gateway_identity');
  assert.equal(one({ op: 'request', headers: { Cookie: 'x\r\ny' }, ip: '192.0.2.1', secret }).error, 'invalid_header');
});

test('gateway preserves cookies, export downloads and build provenance without caching private data', () => {
  const input = [['Set-Cookie', 'a=synthetic; HttpOnly; Secure'], ['Set-Cookie', 'b=synthetic; HttpOnly; Secure'],
    ['Cache-Control', 'public, max-age=600'], ['ETag', 'synthetic'], ['Content-Disposition', 'attachment; filename="jrvx-id-export.json"'],
    ['X-JRVX-Source-Build', '0123456789abcdef0123'], ['Content-Security-Policy', "default-src 'self'"],
    ['Connection', 'X-Internal'], ['X-Internal', 'private'], ['X-JRVX-Gateway-Key', 'must-not-leak']];
  const output = one({ op: 'response', headers: input, upstream, api: true });
  assert.equal(output.filter(([name]) => name.toLowerCase() === 'set-cookie').length, 2);
  const headers = new Headers(output);
  assert.equal(headers.get('cache-control'), 'no-store');
  assert.equal(headers.get('etag'), null);
  assert.equal(headers.get('content-disposition'), 'attachment; filename="jrvx-id-export.json"');
  assert.equal(headers.get('x-jrvx-source-build'), '0123456789abcdef0123');
  assert.equal(headers.get('content-security-policy'), "default-src 'self'");
  assert.equal(headers.get('x-internal'), null);
  assert.equal(headers.get('x-jrvx-gateway-key'), null);
  assert.equal(one({ op: 'response', headers: input, upstream, api: true, cookieFree: true }).some(([name]) => name.toLowerCase() === 'set-cookie'), false);
  assert.equal(one({ op: 'location', upstream, value: upstream + '/#apps' }), canonical + '/#apps');
  assert.equal(one({ op: 'location', upstream, value: 'https://evil.invalid/callback' }), null);
  assert.equal(one({ op: 'location', upstream, value: '//evil.invalid/callback' }), null);
});

test('gateway configuration fails closed and body limits match the Worker contract', async () => {
  const example = await readFile(new URL('../gateway/config.example.php', import.meta.url), 'utf8');
  assert.match(example, /'enabled' => false/);
  const secret = randomBytes(48).toString('hex');
  for (const value of [null, {}, { enabled: true, upstream, secret: '' }, { enabled: true, upstream: 'https://evil.invalid', secret }]) {
    assert(one({ op: 'config', value }).error);
  }
  assert.equal(one({ op: 'config', value: { enabled: true, upstream, secret } }).upstream, upstream);
  assert.equal(one({ op: 'limit', path: '/api/v2/avatar' }), 262144);
  assert.equal(one({ op: 'limit', path: '/api/auth/login' }), 65536);
  const failure = one({ op: 'failure', mutation: true, timeout: true });
  assert.equal(failure.status, 504);
  assert.match(failure.body.message, /Результат операции неизвестен/);
});

test('PHP forwarding contract supports signup, security, avatars and export in the isolated Worker', async t => {
  const secret = randomBytes(48).toString('hex');
  const runtime = await createRuntime({ IDENTITY_ORIGIN: canonical, GATEWAY_ORIGIN: upstream, GATEWAY_SECRET: secret });
  t.after(() => runtime.dispose());
  const cookies = new Map();
  async function request(path, { method = 'GET', body, type = 'application/json' } = {}) {
    assert(methods(path.split('?')[0]).includes(method), `Gateway blocks ${method} ${path}`);
    const incoming = { ...(cookies.size ? { Cookie: [...cookies].map(([k, v]) => k + '=' + v).join('; ') } : {}),
      ...(!['GET', 'HEAD'].includes(method) ? { Origin: canonical, 'Content-Type': type } : {}) };
    const headers = requestHeaders(incoming, '192.0.2.1', secret);
    const response = await runtime.mf.dispatchFetch(upstream + path, {
      method, headers: Object.fromEntries(headers), redirect: 'manual',
      ...(body !== undefined ? { body: body instanceof Uint8Array ? body : JSON.stringify(body) } : {})
    });
    const pairs = [...response.headers].filter(([name]) => name !== 'set-cookie');
    for (const cookie of response.headers.getSetCookie()) pairs.push(['set-cookie', cookie]);
    const forwarded = one({ op: 'response', headers: pairs, upstream, api: /^\/(?:api|oidc|oauth)\//.test(path) });
    assert(Array.isArray(forwarded));
    for (const [name, value] of forwarded) if (name.toLowerCase() === 'set-cookie') {
      const pair = value.split(';')[0], eq = pair.indexOf('=');
      if (/max-age=0(?:;|$)/i.test(value)) cookies.delete(pair.slice(0, eq));
      else cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
    const data = response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text();
    return { status: response.status, headers: new Headers(forwarded), data };
  }
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('x-jrvx-source-build'), /^[a-f0-9]{20}$/);
  assert.equal((await request('/assets/id-next.js')).status, 200);
  assert.equal((await request('/api/v2/me')).status, 401);
  const user = { username: 'gateway_fixture', email: 'gateway_fixture@staging.invalid', password: randomBytes(24).toString('hex'), accept_terms: true };
  assert.equal((await request('/api/auth/register', { method: 'POST', body: { ...user, confirm_password: user.password } })).status, 202);
  const code = await runtime.emailCode(user.email);
  assert.equal((await request('/api/auth/email/verify-code', { method: 'POST', body: { email: user.email, purpose: 'verify', code } })).status, 200);
  assert.equal((await request('/api/v2/me')).status, 200);
  assert.equal((await request('/api/v2/security/status')).status, 200);
  assert.equal((await request('/api/v2/privacy', { method: 'PATCH', body: { profile_visibility: 'private' } })).status, 200);
  assert.equal((await request('/api/v2/security/stepup', { method: 'POST', body: { password: user.password } })).status, 200);
  const exported = await request('/api/v2/export');
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get('cache-control'), 'no-store');
  assert.match(exported.headers.get('content-disposition'), /attachment/);
  // A body larger than the old gateway's 32 KiB bound reaches avatar validation.
  const image = new Uint8Array(40000); image.set([137, 80, 78, 71]);
  assert.equal((await request('/api/v2/avatar', { method: 'POST', type: 'image/png', body: image })).status, 200);
  assert.equal((await request('/api/auth/logout', { method: 'POST', body: {} })).status, 200);
  assert.equal((await request('/api/v2/me')).status, 401);
});

test('Worker rejects missing or forged gateway credentials and mismatched browser origins', async t => {
  const secret = randomBytes(48).toString('hex');
  const runtime = await createRuntime({ IDENTITY_ORIGIN: canonical, GATEWAY_ORIGIN: upstream, GATEWAY_SECRET: secret });
  t.after(() => runtime.dispose());
  for (const headers of [{}, { 'x-jrvx-gateway-key': 'forged', 'x-jrvx-client-key': 'a'.repeat(64) }, { 'x-jrvx-gateway-key': secret }]) {
    const response = await runtime.mf.dispatchFetch(upstream + '/api/health', { headers });
    assert.equal(response.status, 421);
    await response.body?.cancel();
  }
  const response = await runtime.mf.dispatchFetch(upstream + '/api/auth/login', {
    method: 'POST', headers: Object.fromEntries(requestHeaders({ Origin: 'https://evil.invalid', 'Content-Type': 'application/json' }, '192.0.2.1', secret)), body: '{}'
  });
  assert.equal(response.status, 403);
  await response.body?.cancel();
});
