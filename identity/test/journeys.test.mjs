import assert from 'node:assert/strict';
import { randomBytes, createHmac, createHash, createPublicKey, verify } from 'node:crypto';
import { test } from 'node:test';
import { createRuntime, origin } from './helpers/runtime.mjs';
import { virtualPasskey } from './helpers/passkey.mjs';
import { DatabaseSync } from 'node:sqlite';
import { legacyFixture } from './helpers/legacy.mjs';
import { migrateIdentity } from '../src/migration.mjs';

function account(name) {
  return { username: name, email: `${name}@staging.invalid`, password: randomBytes(24).toString('base64url'), confirm_password: undefined, accept_terms: true };
}
async function register(runtime, browser, user) {
  const result = await browser.request('/api/auth/register', { method: 'POST', body: { ...user, confirm_password: user.password } });
  assert.equal(result.response.status, 202, `Registration failed: ${result.data.error}`);
  const code = await runtime.emailCode(user.email);
  const verified = await browser.request('/api/auth/email/verify-code', { method: 'POST', body: { email: user.email, purpose: 'verify', code } });
  assert.equal(verified.response.status, 200, `Verification failed: ${verified.data.error}`);
  return verified;
}

test('signup requires email confirmation, and verified users can log in and log out', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(); const user = account('journey_one');
  const registration = await browser.request('/api/auth/register', { method: 'POST', body: { ...user, confirm_password: user.password } });
  assert.equal(registration.response.status, 202, `Registration: ${registration.data.error}`);
  const before = await browser.request('/api/v2/me');
  assert.equal(before.response.status, 401);
  const code = await runtime.emailCode(user.email);
  const verified = await browser.request('/api/auth/email/verify-code', { method: 'POST', body: { email: user.email, purpose: 'verify', code } });
  assert.equal(verified.response.status, 200, `Verification: ${verified.data.error}`);
  const me = await browser.request('/api/v2/me');
  assert.equal(me.response.status, 200);
  const logout = await browser.request('/api/auth/logout', { method: 'POST', body: {} });
  assert.equal(logout.response.status, 200);
  assert.equal((await browser.request('/api/v2/me')).response.status, 401);
  const login = await browser.request('/api/auth/login', { method: 'POST', body: { login: user.username, password: user.password } });
  assert.equal(login.response.status, 200, `Login: ${login.data.error}`);
  assert.equal((await browser.request('/api/v2/me')).response.status, 200);
});

test('different users cannot see each other’s profile or export', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const first = runtime.browser(), second = runtime.browser();
  await register(runtime, first, account('journey_first'));
  const secondUser = account('journey_second');
  await register(runtime, second, secondUser);
  const updated = await first.request('/api/v2/profile', { method: 'PATCH', body: { name: 'Private Alice', bio: 'Private account marker' } });
  assert.equal(updated.response.status, 200, `Profile: ${updated.data.error}`);
  const other = await second.request('/api/v2/me');
  assert.equal(other.response.status, 200);
  assert(!JSON.stringify(other.data).includes('Private Alice'));
  assert.equal((await second.request('/api/v2/export')).response.status, 403);
  const stepup = await second.request('/api/v2/security/stepup', { method: 'POST', body: { password: secondUser.password } });
  assert.equal(stepup.response.status, 200, `Step-up: ${stepup.data.error}`);
  const exported = await second.request('/api/v2/export');
  assert.equal(exported.response.status, 200, `Export: ${exported.data.error}`);
  assert(!JSON.stringify(exported.data).includes('Private account marker'));
  assert(!JSON.stringify(exported.data).includes('password_hash'));
  assert.equal((await first.request('/api/v2/admin/users')).response.status, 403);
});

test('a confirmation code is single use', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), user = account('journey_code');
  const r = await browser.request('/api/auth/register', { method: 'POST', body: { ...user, confirm_password: user.password } });
  assert.equal(r.response.status, 202, `Registration: ${r.data.error}`);
  const code = await runtime.emailCode(user.email);
  const body = { email: user.email, purpose: 'verify', code };
  assert.equal((await browser.request('/api/auth/email/verify-code', { method: 'POST', body })).response.status, 200);
  const replay = await browser.request('/api/auth/email/verify-code', { method: 'POST', body });
  assert.equal(replay.response.status, 400);
});

test('revoking other sessions ends the other login and keeps the current login', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const current = runtime.browser(), other = runtime.browser(), user = account('journey_sessions');
  await register(runtime, current, user);
  const login = await other.request('/api/auth/login', { method: 'POST', body: { login: user.email, password: user.password } });
  assert.equal(login.response.status, 200);
  assert.equal((await current.request('/api/v2/security/sessions/revoke', { method: 'POST', body: { session_id: 'others' } })).response.status, 403);
  assert.equal((await current.request('/api/v2/security/stepup', { method: 'POST', body: { password: user.password } })).response.status, 200);
  assert.equal((await current.request('/api/v2/security/sessions/revoke', { method: 'POST', body: { session_id: 'others' } })).response.status, 200);
  assert.equal((await other.request('/api/v2/me')).response.status, 401);
  assert.equal((await current.request('/api/v2/me')).response.status, 200);
});

test('changing a password revokes all sessions and rejects the old password', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), other = runtime.browser(), user = account('journey_password');
  await register(runtime, browser, user);
  assert.equal((await other.request('/api/auth/login', { method: 'POST', body: { login: user.username, password: user.password } })).response.status, 200);
  assert.equal((await browser.request('/api/v2/security/stepup', { method: 'POST', body: { password: user.password } })).response.status, 200);
  const password = randomBytes(24).toString('base64url');
  const changed = await browser.request('/api/v2/security/password', { method: 'POST', body: { current_password: user.password, password, confirm_password: password } });
  assert.equal(changed.response.status, 200, `Password change: ${changed.data.error}`);
  assert.equal((await browser.request('/api/v2/me')).response.status, 401);
  assert.equal((await other.request('/api/v2/me')).response.status, 401);
  assert.equal((await browser.request('/api/auth/login', { method: 'POST', body: { login: user.username, password: user.password } })).response.status, 401);
  assert.equal((await browser.request('/api/auth/login', { method: 'POST', body: { login: user.username, password } })).response.status, 200);
});

test('email recovery resets the password and invalidates previous sessions', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), recovery = runtime.browser(), user = account('journey_reset');
  await register(runtime, browser, user);
  const send = await recovery.request('/api/auth/email/send-code', { method: 'POST', body: { email: user.email, purpose: 'reset' } });
  assert.equal(send.response.status, 200, `Recovery send: ${send.data.error}`);
  const code = await runtime.emailCode(user.email), password = randomBytes(24).toString('base64url');
  const reset = await recovery.request('/api/auth/email/verify-code', { method: 'POST', body: { email: user.email, purpose: 'reset', code, password, confirm_password: password } });
  assert.equal(reset.response.status, 200, `Recovery: ${reset.data.error}`);
  assert.equal((await browser.request('/api/v2/me')).response.status, 401);
  assert.equal((await recovery.request('/api/auth/login', { method: 'POST', body: { login: user.username, password } })).response.status, 200);
});

function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret.replace(/=+$/, '').toUpperCase()].map(c => {
    const n = alphabet.indexOf(c); assert(n >= 0); return n.toString(2).padStart(5, '0');
  }).join('');
  const key = Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', key).update(counter).digest();
  return String((digest.readUInt32BE(digest[19] & 15) & 0x7fffffff) % 1000000).padStart(6, '0');
}

test('TOTP enrollment enforces a second factor and backup codes are single use', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), login = runtime.browser(), user = account('journey_mfa');
  await register(runtime, browser, user);
  const setup = await browser.request('/api/v2/security/totp/setup', { method: 'POST', body: { password: user.password } });
  assert.equal(setup.response.status, 200, `TOTP setup: ${setup.data.error}`);
  const confirmed = await browser.request('/api/v2/security/totp/confirm', { method: 'POST', body: { challenge_id: setup.data.challenge_id, code: totp(setup.data.secret) } });
  assert.equal(confirmed.response.status, 200, `TOTP confirm: ${confirmed.data.error}`);
  assert(Array.isArray(confirmed.data.backup_codes) && confirmed.data.backup_codes.length >= 2);
  const result = await login.request('/api/auth/login', { method: 'POST', body: { login: user.username, password: user.password } });
  assert.equal(result.data.mfa_required, true);
  assert.equal((await login.request('/api/v2/me')).response.status, 401);
  const factor = await login.request('/api/v2/security/mfa/verify', { method: 'POST', body: { challenge_id: result.data.challenge_id, method: 'backup', code: confirmed.data.backup_codes[0] } });
  assert.equal(factor.response.status, 200, `MFA: ${factor.data.error}`);
  assert.equal((await login.request('/api/v2/me')).response.status, 200);
  await login.request('/api/auth/logout', { method: 'POST', body: {} });
  const next = await login.request('/api/auth/login', { method: 'POST', body: { login: user.username, password: user.password } });
  const replay = await login.request('/api/v2/security/mfa/verify', { method: 'POST', body: { challenge_id: next.data.challenge_id, method: 'backup', code: confirmed.data.backup_codes[0] } });
  assert.equal(replay.response.status, 400);
  assert.equal((await login.request('/api/v2/me')).response.status, 401);
});

test('deletion requires reauthentication and preserves data pending operator review', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), user = account('journey_delete');
  await register(runtime, browser, user);
  const request = { method: 'POST', body: { confirm_username: user.username } };
  assert.equal((await browser.request('/api/v2/deletion-request', request)).response.status, 403);
  assert.equal((await browser.request('/api/v2/security/stepup', { method: 'POST', body: { password: user.password } })).response.status, 200);
  const result = await browser.request('/api/v2/deletion-request', request);
  assert.equal(result.response.status, 200, `Deletion request: ${result.data.error}`);
  assert.equal(result.data.status, 'pending');
  assert.equal((await browser.request('/api/v2/me')).response.status, 200);
});

test('Passkey enrollment and login verify signatures, origin and single-use challenges', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), user = account('journey_passkey'), key = virtualPasskey(origin);
  await register(runtime, browser, user);
  assert.equal((await browser.request('/api/v2/security/stepup', { method: 'POST', body: { password: user.password } })).response.status, 200);
  const options = await browser.request('/api/v2/security/passkeys/register/options', { method: 'POST', body: { name: 'Local virtual key' } });
  assert.equal(options.response.status, 200, `Passkey options: ${options.data.error}`);
  const enrollment = await browser.request('/api/v2/security/passkeys/register/verify', { method: 'POST', body: { challenge_id: options.data.challenge_id, response: key.register(options.data.options.challenge) } });
  assert.equal(enrollment.response.status, 200, `Passkey enrollment: ${enrollment.data.error}`);
  const login = runtime.browser();
  const rejectedOptions = await login.request('/api/v2/security/passkeys/auth/options', { method: 'POST', body: { login: user.username } });
  assert.equal(rejectedOptions.response.status, 200);
  const wrongOrigin = await login.request('/api/v2/security/passkeys/auth/verify', { method: 'POST', body: { challenge_id: rejectedOptions.data.challenge_id, response: key.authenticate(rejectedOptions.data.options.challenge, 'https://attacker.invalid') } });
  assert.equal(wrongOrigin.response.status, 400);
  assert.equal((await login.request('/api/v2/me')).response.status, 401);
  const start = await login.request('/api/v2/security/passkeys/auth/options', { method: 'POST', body: { login: user.username } });
  const body = { challenge_id: start.data.challenge_id, response: key.authenticate(start.data.options.challenge) };
  const verified = await login.request('/api/v2/security/passkeys/auth/verify', { method: 'POST', body });
  assert.equal(verified.response.status, 200, `Passkey login: ${verified.data.error}`);
  assert.equal((await login.request('/api/v2/me')).response.status, 200);
  const replay = await login.request('/api/v2/security/passkeys/auth/verify', { method: 'POST', body });
  assert.equal(replay.response.status, 400);
});

test('product OIDC enforces PKCE, signed identity and logout-linked access tokens', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const browser = runtime.browser(), user = account('journey_oidc');
  await register(runtime, browser, user);
  const client = 'local-fixture-client', callback = 'https://product.staging.invalid/callback';
  const scopes = ['openid', 'profile', 'jrvx_id', 'offline_access'];
  await runtime.db.prepare('INSERT INTO app_registry(app_key,name) VALUES(?,?)').bind('fixture', 'Local fixture').run();
  await runtime.db.prepare('INSERT INTO identity_apps(app_key,name,url,status,client_id,redirect_uris,scopes,trusted) VALUES(?,?,?,?,?,?,?,1)').bind('fixture', 'Local fixture', 'https://product.staging.invalid', 'available', client, JSON.stringify([callback]), JSON.stringify(scopes)).run();
  await runtime.db.prepare('INSERT INTO oidc_client(id,clientId,name,redirectUris,scopes,tokenEndpointAuthMethod,grantTypes,responseTypes,requirePKCE,skipConsent,disabled) VALUES(?,?,?,?,?,?,?,?,1,1,0)').bind('fixture-client', client, 'Local fixture', JSON.stringify([callback]), JSON.stringify(scopes), 'none', JSON.stringify(['authorization_code', 'refresh_token']), JSON.stringify(['code'])).run();
  const verifier = randomBytes(48).toString('base64url'), nonce = randomBytes(24).toString('base64url'), state = randomBytes(24).toString('base64url');
  const params = new URLSearchParams({ client_id: client, redirect_uri: callback, response_type: 'code', scope: scopes.join(' '), state, nonce, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  const invalid = new URLSearchParams(params); invalid.set('redirect_uri', 'https://attacker.invalid/callback');
  assert.equal((await browser.request('/oidc/oauth2/authorize?' + invalid)).response.status, 400);
  const authorized = await browser.request('/oidc/oauth2/authorize?' + params);
  assert.equal(authorized.response.status, 302, `OIDC authorization: ${authorized.data.error}`);
  const redirect = new URL(authorized.response.headers.get('location'));
  assert.equal(redirect.origin + redirect.pathname, callback);
  assert.equal(redirect.searchParams.get('state'), state);
  assert(redirect.searchParams.has('code'), 'Expected an authorization code');
  const exchangeBody = new URLSearchParams({ grant_type: 'authorization_code', client_id: client, redirect_uri: callback, code: redirect.searchParams.get('code'), code_verifier: verifier });
  const incorrect = new URLSearchParams(exchangeBody); incorrect.set('code_verifier', randomBytes(48).toString('base64url'));
  const rejected = await runtime.mf.dispatchFetch(origin + '/oidc/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: incorrect.toString() });
  assert([400, 401].includes(rejected.status));
  const denial = await rejected.json();
  assert.equal(typeof denial.error, 'string');
  assert.equal(denial.access_token, undefined); assert.equal(denial.id_token, undefined);
  // Failed exchanges may consume a code; obtain a new authorization for the valid flow.
  const again = await browser.request('/oidc/oauth2/authorize?' + params);
  assert.equal(again.response.status, 302);
  exchangeBody.set('code', new URL(again.response.headers.get('location')).searchParams.get('code'));
  const response = await runtime.mf.dispatchFetch(origin + '/oidc/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: exchangeBody.toString() });
  const tokens = await response.json();
  assert.equal(response.status, 200, `OIDC token: ${tokens.error}`);
  const parts = tokens.id_token.split('.'), header = JSON.parse(Buffer.from(parts[0], 'base64url')), claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
  const jwks = await browser.request('/oidc/jwks');
  const jwk = jwks.data.keys.find(key => key.kid === header.kid);
  assert(jwk, 'Token signing key must be published');
  assert(verify('sha256', Buffer.from(parts[0] + '.' + parts[1]), { key: createPublicKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' }, Buffer.from(parts[2], 'base64url')));
  assert.equal(claims.iss, origin); assert.equal(claims.nonce, nonce);
  assert([claims.aud].flat().includes(client)); assert(claims.exp > Date.now() / 1000);
  assert.equal(claims.sub, (await runtime.db.prepare('SELECT id FROM users WHERE username=?').bind(user.username).first()).id);
  const info = await browser.request('/oidc/oauth2/userinfo', { headers: { authorization: `Bearer ${tokens.access_token}` } });
  assert.equal(info.response.status, 200, `OIDC userinfo: ${info.data.error}`);
  assert.equal(info.data.sub, claims.sub);
  const replay = await runtime.mf.dispatchFetch(origin + '/oidc/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: exchangeBody.toString() });
  assert.equal(replay.status, 400);
  assert.equal((await browser.request('/api/auth/logout', { method: 'POST', body: {} })).response.status, 200);
  assert.equal((await browser.request('/oidc/oauth2/userinfo', { headers: { authorization: `Bearer ${tokens.access_token}` } })).response.status, 401);
});

test('migrated legacy credentials log in and upgrade hashing while retaining the same identity', async t => {
  const runtime = await createRuntime(); t.after(() => runtime.dispose());
  const { source, id, password } = legacyFixture(), candidate = new DatabaseSync(':memory:');
  t.after(() => { source.close(); candidate.close(); });
  migrateIdentity(source, candidate);
  const user = candidate.prepare('SELECT * FROM users WHERE id=?').get(id);
  const columns = Object.keys(user);
  await runtime.db.prepare(`INSERT INTO users(${columns.map(c => '"' + c + '"').join(',')}) VALUES(${columns.map(() => '?').join(',')})`).bind(...columns.map(c => user[c])).run();
  const browser = runtime.browser();
  const login = await browser.request('/api/auth/login', { method: 'POST', body: { login: user.username, password } });
  assert.equal(login.response.status, 200, `Migrated login: ${login.data.error}`);
  const after = await runtime.db.prepare('SELECT id,jrvx_id,password_iterations FROM users WHERE id=?').bind(id).first();
  assert.equal(after.id, id); assert.equal(after.jrvx_id, user.jrvx_id); assert.equal(after.password_iterations, 100000);
  assert.equal((await browser.request('/api/v2/me')).response.status, 200);
});
