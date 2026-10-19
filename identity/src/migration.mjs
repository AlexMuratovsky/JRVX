import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export const migrationVersion = 'legacy-to-isolated-identity-candidate-20261020';
// The order respects foreign keys. Product tables and transient login state are excluded.
export const preservedTables = Object.freeze([
  'users', 'user_profiles', 'jrvx_id_aliases', 'linked_apps', 'user_capabilities',
  'identity_audit_log', 'app_registry', 'oidc_user', 'oidc_account', 'oidc_client',
  'oidc_resource', 'oidc_jwks', 'oidc_client_resource', 'oidc_consent'
]);
export const expiredTables = Object.freeze([
  'sessions', 'email_challenges', 'auth_rate_limits', 'oidc_access_token',
  'oidc_refresh_token', 'oidc_session', 'oidc_rate_limit', 'oidc_verification', 'oidc_client_assertion'
]);
const nextSchema = readFileSync(new URL('../schema/next-20261019.sql', import.meta.url), 'utf8');
const oldSchema = readFileSync(new URL('../schema/production-20261019.sql', import.meta.url), 'utf8');
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const columns = (db, table) => db.prepare(`PRAGMA table_info(${quote(table)})`).all();
const count = (db, table) => Number(db.prepare(`SELECT count(*) AS n FROM ${quote(table)}`).get().n);

export function inspectSource(source) {
  const tables = new Set(source.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name));
  const blockers = {};
  const expected = new DatabaseSync(':memory:');
  try {
    expected.exec(oldSchema);
    for (const name of [...preservedTables, ...expiredTables]) {
      if (!tables.has(name)) { blockers[`missing_table:${name}`] = 1; continue; }
      const describe = db => columns(db, name).map(c => [c.name, c.type, c.notnull, c.dflt_value, c.pk]);
      if (JSON.stringify(describe(source)) !== JSON.stringify(describe(expected))) blockers[`schema_changed:${name}`] = 1;
    }
  } finally { expected.close(); }
  for (const name of tables) {
    if (name.startsWith('security_') || (name.startsWith('identity_') && name !== 'identity_audit_log')) blockers.source_already_has_new_identity_state = 1;
  }
  if (Object.keys(blockers).length) return { ready: false, blockers, counts: {} };
  let invalidIds = 0, invalidCredentials = 0;
  for (const user of source.prepare('SELECT id,jrvx_id,password_hash,password_salt,password_algorithm,password_iterations FROM users').iterate()) {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(user.id) || !/^JRVX-[A-Z]{4}[0-9]{8}$/.test(user.jrvx_id)) invalidIds++;
    if (user.password_algorithm !== 'pbkdf2-sha256' || ![20000, 100000].includes(user.password_iterations) || !user.password_hash || !user.password_salt) invalidCredentials++;
  }
  const queries = {
    duplicate_public_ids: 'SELECT count(*) n FROM (SELECT lower(jrvx_id) FROM users GROUP BY lower(jrvx_id) HAVING count(*)>1)',
    alias_owner_conflicts: 'SELECT count(*) n FROM jrvx_id_aliases a JOIN users u ON u.jrvx_id=a.alias_jrvx_id COLLATE NOCASE WHERE u.id<>a.user_id'
  };
  if (invalidIds) blockers.invalid_identity_ids = invalidIds;
  if (invalidCredentials) blockers.unsupported_password_parameters = invalidCredentials;
  for (const [name, sql] of Object.entries(queries)) { const n = Number(source.prepare(sql).get().n); if (n) blockers[name] = n; }
  const foreignKeys = source.prepare('PRAGMA foreign_key_check').all().length;
  if (foreignKeys) blockers.foreign_key_violations = foreignKeys;
  return {
    ready: Object.keys(blockers).length === 0, blockers,
    counts: Object.fromEntries(preservedTables.map(name => [name, count(source, name)])),
    expired: Object.fromEntries(expiredTables.map(name => [name, count(source, name)])),
    unverifiedUsers: Number(source.prepare('SELECT count(*) n FROM users WHERE email_verified<>1 OR registration_pending<>0').get().n)
  };
}

export function migrateIdentity(source, target) {
  assert(source !== target, 'Source and destination must be different databases');
  assert.equal(target.prepare("SELECT count(*) n FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").get().n, 0, 'Destination must be empty');
  source.exec('BEGIN');
  let targetTransaction = false;
  try {
    const report = inspectSource(source);
    if (!report.ready) throw Error(`Migration preflight blocked: ${Object.keys(report.blockers).join(', ')}`);
    target.exec('PRAGMA foreign_keys=ON; BEGIN'); targetTransaction = true;
    target.exec(nextSchema);
    for (const name of preservedTables) {
      const fields = columns(source, name).map(c => c.name);
      const insert = target.prepare(`INSERT INTO ${quote(name)} (${fields.map(quote).join(',')}) VALUES (${fields.map(() => '?').join(',')})`);
      for (const row of source.prepare(`SELECT * FROM ${quote(name)}`).iterate()) insert.run(...fields.map(field => row[field]));
      assert.equal(count(target, name), report.counts[name], `Row count mismatch: ${name}`);
    }
    target.exec(`
      INSERT INTO identity_id_reservations(jrvx_id,user_id,created_at,retired_at)
        SELECT a.alias_jrvx_id,a.user_id,a.created_at,a.created_at FROM jrvx_id_aliases a
        WHERE NOT EXISTS(SELECT 1 FROM users u WHERE u.jrvx_id=a.alias_jrvx_id COLLATE NOCASE AND u.id=a.user_id);
      INSERT INTO identity_privacy(user_id) SELECT id FROM users;
      INSERT INTO identity_user_roles(user_id,role) SELECT id,role FROM users;
      INSERT INTO security_user(user_id) SELECT id FROM users;
    `);
    target.prepare('INSERT INTO identity_schema_versions(version) VALUES(?)').run(migrationVersion);
    assert.equal(target.prepare('PRAGMA foreign_key_check').all().length, 0, 'Foreign key check failed');
    assert.equal(target.prepare('PRAGMA integrity_check').get().integrity_check, 'ok', 'Integrity check failed');
    for (const name of expiredTables) assert.equal(count(target, name), 0, `Transient state was copied: ${name}`);
    target.exec('COMMIT'); targetTransaction = false;
    return { version: migrationVersion, ...report, requiresRelogin: true, candidateOnly: true };
  } catch (error) {
    if (targetTransaction) target.exec('ROLLBACK');
    throw error;
  } finally { source.exec('ROLLBACK'); }
}
