import assert from 'node:assert/strict';

const base = 'https://jrvx-id-next.gleb-v-markevich.workers.dev';
const expectedBuild = process.env.JRVX_EXPECTED_BUILD;
if (expectedBuild !== undefined) assert.match(expectedBuild, /^[a-f0-9]{20}$/);
// Each deployment probe uses a fresh connection, independent of pooled socket state.
const options = () => ({ signal: AbortSignal.timeout(20000), redirect: 'error', headers: { connection: 'close' } });
for (const path of ['/', '/assets/id-next.js', '/assets/id-next.css', '/api/health']) {
  const response = await fetch(base + path, options());
  assert.equal(response.status, 200, `${path}: unexpected status`);
  if (expectedBuild) assert.equal(response.headers.get('x-jrvx-source-build'), expectedBuild, `${path}: wrong deployed build`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  if (path === '/api/health') {
    const health = await response.json();
    assert.equal(health.environment, 'staging');
    assert.equal(health.email, 'synthetic-test-sink');
    assert.equal(health.identityOnly, true);
    if (expectedBuild) assert.equal(health.sourceBuild, expectedBuild);
  } else {
    const text = await response.text();
    assert(text.length > 1000, `${path}: incomplete response`);
  }
  console.log(`OK ${path}`);
}
for (const path of ['/api/v2/me', '/api/v2/security/status', '/api/v2/admin/users', '/api/v2/export']) {
  const response = await fetch(base + path, options());
  assert([401, 403].includes(response.status), `${path}: expected auth guard, got ${response.status}`);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  await response.body?.cancel();
  console.log(`OK ${path}: auth required`);
}
