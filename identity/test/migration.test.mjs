import assert from 'node:assert/strict';
import { randomUUID, pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { inspectSource, migrateIdentity, preservedTables } from '../src/migration.mjs';
import { legacyFixture as fixture } from './helpers/legacy.mjs';

test('migration preserves identity and password bytes, isolates products, expires sessions, and leaves source unchanged', t => {
  const { source, id, password } = fixture(), target = new DatabaseSync(':memory:');
  t.after(() => { source.close(); target.close(); });
  const sourceBefore = source.serialize();
  const report = migrateIdentity(source, target);
  assert.equal(report.ready, true); assert.equal(report.requiresRelogin, true);
  const before = source.prepare('SELECT * FROM users WHERE id=?').get(id), after = target.prepare('SELECT * FROM users WHERE id=?').get(id);
  assert.deepEqual(after, before);
  assert.equal(pbkdf2Sync(password, Buffer.from(after.password_salt, 'base64url'), after.password_iterations, 32, 'sha256').toString('base64url'), after.password_hash);
  assert.equal(target.prepare('SELECT count(*) n FROM sessions').get().n, 0);
  assert.equal(target.prepare('SELECT count(*) n FROM sqlite_master WHERE name IN (\'planner_items\',\'game_balances\',\'cas_state\')').get().n, 0);
  assert.equal(source.prepare('SELECT balance FROM game_balances').get().balance, 777);
  assert.equal(target.prepare('SELECT profile_visibility FROM identity_privacy WHERE user_id=?').get(id).profile_visibility, 'private');
  assert.deepEqual(source.serialize(), sourceBefore);
  for (const table of preservedTables) assert.equal(target.prepare(`SELECT count(*) n FROM "${table}"`).get().n, source.prepare(`SELECT count(*) n FROM "${table}"`).get().n);
});

test('retired public IDs cannot be reassigned and UUIDs and audit events remain immutable', t => {
  const { source, id } = fixture(), target = new DatabaseSync(':memory:');
  t.after(() => { source.close(); target.close(); });
  migrateIdentity(source, target);
  assert.throws(() => target.prepare('UPDATE users SET id=? WHERE id=?').run(randomUUID(), id), /identity_uuid_immutable/);
  assert.throws(() => target.prepare('UPDATE users SET jrvx_id=? WHERE id=?').run('JRVX-OLDD12345678', id), /jrvx_id_reserved/);
  target.prepare('INSERT INTO identity_audit_log(id,actor_user_id,action) VALUES(?,?,?)').run('fixture-audit', id, 'migration.test');
  assert.throws(() => target.prepare('DELETE FROM identity_audit_log WHERE id=?').run('fixture-audit'), /audit_is_append_only/);
});

test('schema drift and cross-user alias conflicts block the candidate without partial writes', t => {
  const { source, id } = fixture(), target = new DatabaseSync(':memory:');
  t.after(() => { source.close(); target.close(); });
  const second = randomUUID();
  source.prepare('INSERT INTO users(id,jrvx_id,username,password_hash,password_salt) VALUES(?,?,?,?,?)').run(second, 'JRVX-OTHR12345678', 'fixture_other', 'fixture-hash', 'fixture-salt');
  source.prepare('INSERT INTO jrvx_id_aliases(alias_jrvx_id,user_id) VALUES(?,?)').run('JRVX-OTHR12345678', id);
  assert.equal(inspectSource(source).blockers.alias_owner_conflicts, 1);
  assert.throws(() => migrateIdentity(source, target), /preflight blocked/);
  assert.equal(target.prepare('SELECT count(*) n FROM sqlite_master').get().n, 0);
  source.exec('ALTER TABLE users ADD COLUMN future_identity_field TEXT');
  assert.equal(inspectSource(source).blockers['schema_changed:users'], 1);
});

test('a nonempty destination is rejected without changing either database', t => {
  const { source } = fixture(), target = new DatabaseSync(':memory:');
  t.after(() => { source.close(); target.close(); });
  target.exec('CREATE TABLE existing(value TEXT); INSERT INTO existing VALUES(\'keep\')');
  assert.throws(() => migrateIdentity(source, target), /Destination must be empty/);
  assert.equal(target.prepare('SELECT value FROM existing').get().value, 'keep');
});

test('the offline CLI creates a new candidate and refuses to overwrite an existing file', t => {
  const directory = mkdtempSync(join(tmpdir(), 'jrvx-id-migration-'));
  const sourceFile = join(directory, 'source.sqlite'), targetFile = join(directory, 'candidate.sqlite');
  t.after(() => { for (const path of [sourceFile, targetFile]) { try { unlinkSync(path); } catch (e) { if (e.code !== 'ENOENT') throw e; } } rmdirSync(directory); });
  const { source } = fixture();
  writeFileSync(sourceFile, source.serialize()); source.close();
  const original = readFileSync(sourceFile), script = fileURLToPath(new URL('../scripts/migration.mjs', import.meta.url));
  const first = spawnSync(process.execPath, [script, 'candidate', sourceFile, targetFile], { encoding: 'utf8' });
  assert.equal(first.status, 0, 'CLI candidate failed');
  assert.equal(JSON.parse(first.stdout).requiresRelogin, true);
  const candidate = readFileSync(targetFile);
  const again = spawnSync(process.execPath, [script, 'candidate', sourceFile, targetFile], { encoding: 'utf8' });
  assert.notEqual(again.status, 0);
  assert.deepEqual(readFileSync(targetFile), candidate);
  assert.deepEqual(readFileSync(sourceFile), original);
});
