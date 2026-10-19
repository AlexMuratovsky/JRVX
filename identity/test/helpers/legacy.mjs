import { randomBytes, randomUUID, pbkdf2Sync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function legacyFixture() {
  const source = new DatabaseSync(':memory:');
  source.exec(readFileSync(new URL('../../schema/production-20261019.sql', import.meta.url), 'utf8'));
  const id = randomUUID(), password = randomBytes(24).toString('base64url'), salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, 20000, 32, 'sha256').toString('base64url');
  source.prepare('INSERT INTO users(id,jrvx_id,username,email,password_hash,password_salt,email_verified) VALUES(?,?,?,?,?,?,1)').run(id, 'JRVX-TEST12345678', 'fixture_user', 'fixture@staging.invalid', hash, salt.toString('base64url'));
  source.prepare('INSERT INTO user_profiles(user_id,display_name,bio) VALUES(?,?,?)').run(id, 'Fixture User', 'Private synthetic biography');
  source.prepare('INSERT INTO jrvx_id_aliases(alias_jrvx_id,user_id) VALUES(?,?)').run('JRVX-OLDD12345678', id);
  source.prepare('INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(randomUUID(), id, randomBytes(32).toString('hex'), '2099-01-01T00:00:00Z');
  source.prepare('INSERT INTO game_balances(user_id,currency,balance) VALUES(?,?,?)').run(id, 'fixture-coins', 777);
  source.prepare('INSERT INTO planner_items(id,user_id,title) VALUES(?,?,?)').run(randomUUID(), id, 'Must stay in planner');
  return { source, id, password };
}
