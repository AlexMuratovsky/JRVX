import assert from 'node:assert/strict';

const base = 'https://jrvx-id-next.gleb-v-markevich.workers.dev';
for (const path of ['/', '/assets/id-next.js', '/assets/id-next.css', '/api/health']) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  assert.equal(response.status, 200, `${path}: unexpected status`);
  if (path === '/api/health') {
    const health = await response.json();
    assert.equal(health.environment, 'staging');
    assert.equal(health.email, 'synthetic-test-sink');
    assert.equal(health.identityOnly, true);
  } else {
    const text = await response.text();
    assert(text.length > 1000, `${path}: incomplete response`);
  }
  console.log(`OK ${path}`);
}
for (const path of ['/api/v2/me', '/api/v2/security/status', '/api/v2/admin/users', '/api/v2/export']) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  assert([401, 403].includes(response.status), `${path}: expected auth guard, got ${response.status}`);
  console.log(`OK ${path}: auth required`);
}
