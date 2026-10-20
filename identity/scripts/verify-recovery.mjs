import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('recovered/manifest.json', root), 'utf8'));
const archive = await readFile(new URL('recovered/worker.js.gz', root));
const bundle = gunzipSync(archive, { maxOutputLength: 3 * 1024 * 1024 });
assert.equal(bundle.byteLength, manifest.bytes, 'Recovered bundle byte length changed');
assert.equal(createHash('sha256').update(bundle).digest('hex'), manifest.sha256, 'Recovered bundle checksum changed');
// Restore the verified deployment artifact; this generated file is ignored by Git.
await writeFile(new URL('recovered/worker.js', root), bundle);
const config = JSON.parse(await readFile(new URL('wrangler.jsonc', root), 'utf8'));
assert.equal(config.name, 'jrvx-id-next');
assert.equal(config.main, '.build/app/worker.js');
assert.equal(config.no_bundle, true);
assert.equal(config.base_dir, '.build/app');
assert.equal(config.vars.ENVIRONMENT, 'staging');
assert.equal(config.vars.CAPTURE_TEST_MAIL, 'true');
assert.equal(config.vars.IDENTITY_ORIGIN, 'https://jrvx-id-next.gleb-v-markevich.workers.dev');
assert.equal(config.d1_databases.length, 1);
assert.equal(config.d1_databases[0].database_id, 'c4da6cd3-6bc5-4313-9569-ffe5f0166465');
assert.equal(config.routes, undefined, 'Recovery deployment must not change public routes');
assert.equal(config.env, undefined, 'Production environments require a reviewed migration');
for (const key of ['OIDC_SECRET', 'SECURITY_SECRET', 'TURNSTILE_SECRET', 'RESEND_API_KEY']) {
  assert.equal(config.vars[key], undefined, `${key} must remain a secret binding`);
}
for (const file of manifest.schemaFiles) {
  const sql = await readFile(new URL(file, root), 'utf8');
  // DML inside CREATE TRIGGER is part of the schema. Check the captured DDL checksum.
  assert.equal(createHash('sha256').update(sql).digest('hex'), manifest.schemaSha256[file], `Schema snapshot changed: ${file}`);
}
// Report only a type and file path when detecting credentials, never the value.
const patterns = [
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['OpenAI key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}\b/],
  ['Resend key', /\bre_[A-Za-z0-9_]{24,}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/]
];
const text = bundle.toString('utf8');
for (const [kind, pattern] of patterns) assert(!pattern.test(text), `${kind} found in recovered bundle; review before publishing`);
console.log(`Verified ${fileURLToPath(new URL('recovered/worker.js', root))} (${manifest.bytes} bytes, SHA-256 ${manifest.sha256})`);
