import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { before, after, test } from 'node:test';
import { createRuntime, origin } from './helpers/runtime.mjs';

let mf, runtime;
before(async () => {
  runtime = await createRuntime();
  mf = runtime.mf;
});
after(async () => { await runtime?.dispose(); });

test('recovered Worker serves the complete account page and its assets', async () => {
  const page = await mf.dispatchFetch(origin + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /JRVX ID/);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  for (const [path, type] of [['/assets/id-next.js', 'javascript'], ['/assets/id-next.css', 'text/css']]) {
    const response = await mf.dispatchFetch(origin + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), new RegExp(type));
    assert((await response.text()).length > 1000);
  }
});

test('health uses the local D1 and reports isolated synthetic mail', async () => {
  const response = await mf.dispatchFetch(origin + '/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).email, 'synthetic-test-sink');
});

test('unauthenticated callers cannot read profile, security, or admin data', async () => {
  for (const path of ['/api/v2/me', '/api/v2/profile', '/api/v2/security/status', '/api/v2/security/sessions', '/api/v2/admin/users', '/api/v2/admin/audit', '/api/v2/export']) {
    const response = await mf.dispatchFetch(origin + path);
    assert([401, 403, 405].includes(response.status), `${path}: ${response.status}`);
    assert.doesNotMatch(response.headers.get('cache-control') ?? '', /public/);
  }
});

test('untrusted host and cross-origin writes are rejected', async () => {
  const host = await mf.dispatchFetch('https://attacker.invalid/api/health');
  assert.equal(host.status, 421);
  const response = await mf.dispatchFetch(origin + '/api/auth/login', {
    method: 'POST', headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' }, body: '{}'
  });
  assert.equal(response.status, 403);
});

test('credential request body limits apply before authentication', async () => {
  const response = await mf.dispatchFetch(origin + '/api/auth/login', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: 'x'.repeat(65537)
  });
  assert.equal(response.status, 413);
});

test('test registration cannot send mail to real addresses', async () => {
  const response = await mf.dispatchFetch(origin + '/api/auth/register', {
    method: 'POST', headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'local_test', password: randomBytes(32).toString('base64'), email: 'test@example.org' })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'synthetic_email_required');
});
