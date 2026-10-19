import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { before, after, test } from 'node:test';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const root = new URL('../', import.meta.url);
const origin = 'https://jrvx-id-next.gleb-v-markevich.workers.dev';
let mf;
before(async () => {
  mf = new Miniflare(convertV4MiniflareOptions({
    modules: true,
    scriptPath: fileURLToPath(new URL('recovered/worker.js', root)),
    compatibilityDate: '2026-10-18',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: ['DB'],
    bindings: {
      IDENTITY_ORIGIN: origin,
      ENVIRONMENT: 'staging',
      CAPTURE_TEST_MAIL: 'true',
      BUILD_ID: '20d696dc14a06e64',
      OWNER_USER_ID: '00000000-0000-4000-8000-000000000001',
      SECURITY_SECRET: randomBytes(48).toString('hex'),
      OIDC_SECRET: randomBytes(48).toString('hex')
    }
  }));
  const db = await mf.getD1Database('DB');
  const sql = await readFile(new URL('schema/next-20261019.sql', root), 'utf8');
  // D1.exec() splits on newlines; keep complete SQL statements, including triggers.
  const { DatabaseSync } = await import('node:sqlite');
  const local = new DatabaseSync(':memory:');
  local.exec(sql);
  const objects = local.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END,name").all();
  for (const { sql: statement } of objects) await db.prepare(statement).run();
  local.close();
});
after(async () => { await mf?.dispose(); });

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
