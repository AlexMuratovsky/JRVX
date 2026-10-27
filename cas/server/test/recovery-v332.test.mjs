import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, createHmac, randomUUID, randomBytes } from 'node:crypto';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { beginEconomyDrain, migrateToMg, migrationStatements } from '../migration-v330.mjs';
import { recoveryIntentIdV332, readGameReceiptV332 } from '../recovery-v332.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const local = createRequire(new URL('../package.json', import.meta.url));
const fallback = createRequire(new URL('../../../identity/package.json', import.meta.url));
function require(name) {
  let target;
  try { target = local.resolve(name); }
  catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; target = fallback.resolve(name); }
  return local(target);
}
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('v332 receipt request rejects duplicate, foreign, empty, malformed and unexpected query parameters', () => {
  const id = randomUUID();
  for (const [game, key] of [['blackjack', 'actionId'], ['roulette', 'spinId']]) {
    assert.equal(recoveryIntentIdV332(new URLSearchParams({ [key]: id }), game), id);
    for (const input of ['', `${key}=`, `${key}=invalid`, `${key}=${id}&${key}=${id}`,
      `${key}=${id}&ownerId=JRVX-AAAA12345678`, `${key}=${id}&extra=1`, `${key}=${id}&${key}=`,
      `${key}=${id}x`, `other=${id}`, `${key}=a1234567-1234-1234-1234-12345678901g`]) {
      assert.throws(() => recoveryIntentIdV332(new URLSearchParams(input), game), /invalid_recovery_request/);
    }
  }
});

test('v332 lookup itself only prepares an owner-scoped exact read and never treats missing as rejection', async () => {
  const id = randomUUID(), ownerId = 'JRVX-AAAA12345678', calls = [];
  const db = { prepare(sql) {
    assert.match(sql, /^SELECT /); assert.doesNotMatch(sql, /LIMIT 50|ORDER BY|UNION|INSERT|UPDATE|DELETE/);
    return { bind(...args) { calls.push({ sql, args }); return { first: async () => null }; } };
  } };
  for (const game of ['blackjack', 'roulette']) {
    assert.deepEqual(await readGameReceiptV332(db, ownerId, game, id), { ownerId, intentId: id, status: 'unknown' });
  }
  assert.deepEqual(calls[0].args, [ownerId, id]);
  assert.deepEqual(calls[1].args, [ownerId, `roulette:${ownerId}:${id}`]);
});

test('v332 exact lookup runs in the actual local Worker/D1 without game or wallet mutations', async t => {
  const runPath = await mkdtemp(path.join(tmpdir(), 'cas-readonly-v332-'));
  const secret = randomBytes(48).toString('hex'), origin = 'https://cas.jrvx.ru';
  const identities = new Map(), outbound = [], checks = [];
  const workerPath = path.resolve(here, '../worker-v332.mjs');
  const mf = new Miniflare(convertV4MiniflareOptions({
    modules: ['worker-v332.mjs', 'recovery-v332.mjs', 'economy-v330.mjs'].map(name => ({ type: 'ESModule', path: path.resolve(here, '..', name) })),
    modulesRoot: path.resolve(here, '..'), compatibilityDate: '2026-09-30', compatibilityFlags: ['nodejs_compat'],
    resourcePersistencePath: runPath, d1Databases: ['DB'],
    durableObjects: { CAS_SESSIONS: { className: 'CasSession', useSQLite: true },
      CAS_ROOMS: { className: 'PokerRoom', useSQLite: true }, CAS_LOBBY: { className: 'PokerLobby', useSQLite: true } },
    serviceBindings: {
      IDENTITY: request => {
        const url = new URL(request.url);
        assert.equal(url.origin, 'https://id.jrvx.ru');
        assert.equal(url.pathname, '/api/integrations/verify'); assert.equal(url.search, '?app=cas');
        const token = request.headers.get('cookie')?.replace(/^jrvx_session=/, '');
        const identity = identities.get(token);
        return new Response(JSON.stringify(identity || { ok: false }), { status: identity ? 200 : 401, headers: { 'content-type': 'application/json' } });
      },
      ASSETS: () => new Response('No public assets in the local receipt audit', { status: 404 })
    },
    bindings: { JRVX_AUTH_MODE: 'production', JRVX_SESSION_SECRET: secret, JRVX_BUILD_ID: 'local-readonly-v332' },
    outboundService(request) { outbound.push(request.url); throw Error('External network disabled'); }
  }));
  let db, tableNames, triggerCount = 0;
  const query = (sql, args = []) => db.prepare(sql).bind(...args);
  const cookie = payload => {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `jrvx_cas_session=${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
  };
  async function seed(id) {
    const now = Date.now(), exp = now + 3600000, sid = randomUUID(), token = randomBytes(18).toString('hex');
    await query('INSERT INTO cas_users(jrvx_id,nickname,created_at,updated_at) VALUES(?,?,?,?)', [id, 'Local synthetic recovery', now, now]).run();
    await query("INSERT INTO cas_wallets(jrvx_id,currency,balance,updated_at) VALUES(?,'MG',10000,?)", [id, now]).run();
    await query('INSERT INTO cas_sessions(sid,jrvx_id,expires_at,created_at) VALUES(?,?,?,?)', [sid, id, exp, now]).run();
    await query('INSERT INTO cas_blackjack_state(jrvx_id,state_json,version,updated_at) VALUES(?,\'{}\',0,?)', [id, now]).run();
    identities.set(token, { ok: true, app: { app_key: 'cas' }, user: { jrvx_id: id, status: 'active', username: 'Synthetic' }, session: { expiresAt: exp } });
    return { id, sid, cookie: `${cookie({ id, sid, exp })}; jrvx_session=${token}` };
  }
  async function request(route, session, { method = 'GET', body } = {}) {
    const response = await mf.dispatchFetch(origin + route, { method, redirect: 'manual', headers: {
      'cf-connecting-ip': '192.0.2.38', ...(session ? { cookie: session.cookie } : {}),
      ...(method === 'POST' ? { origin, 'content-type': 'application/json' } : {})
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, headers: response.headers, data: await response.json() };
  }
  async function snapshot() {
    const all = {};
    for (const name of tableNames) all[name] = (await query(`SELECT * FROM "${name}" ORDER BY rowid`).all()).results;
    return sha(JSON.stringify(all));
  }
  async function unchanged(fn) {
    const before = await snapshot();
    const beforeCount = (await query('SELECT COUNT(*) AS n FROM audit_recovery_mutations').first()).n;
    const value = await fn();
    assert.equal(await snapshot(), before, 'A read-only recovery changed D1 rows');
    assert.equal((await query('SELECT COUNT(*) AS n FROM audit_recovery_mutations').first()).n, beforeCount, 'A read-only recovery executed an otherwise invisible UPDATE');
    return value;
  }
  async function check(name, fn) {
    await t.test(name, async () => { await fn(); checks.push(name); });
  }
  try {
    db = await mf.getD1Database('DB');
    const baseline = migrationStatements(await readFile(new URL('../schema-v329.sql', import.meta.url), 'utf8'));
    const rank = sql => /CREATE\s+TABLE/i.test(sql) ? 0 : /CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(sql) ? 1 : 2;
    for (const sql of baseline.sort((a, b) => rank(a) - rank(b))) await query(sql).run();
    await beginEconomyDrain(db);
    await migrateToMg(db, { sql: await readFile(new URL('../migrations/001-mg-only-v330.sql', import.meta.url), 'utf8'), inspectAllRooms: async () => ({ complete: true, objectCount: 0, rooms: [] }) });
    await db.batch(migrationStatements(await readFile(new URL('../migrations/002-daily-purchases-v330.sql', import.meta.url), 'utf8')).map(sql => query(sql)));
    tableNames = (await query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cas_%' ORDER BY name").all()).results.map(row => row.name);
    await query('CREATE TABLE audit_recovery_mutations(sequence INTEGER PRIMARY KEY AUTOINCREMENT,table_name TEXT NOT NULL,action TEXT NOT NULL)').run();
    for (const name of tableNames) for (const action of ['INSERT', 'UPDATE', 'DELETE']) {
      await query(`CREATE TRIGGER "audit_recovery_${name}_${action}" AFTER ${action} ON "${name}" BEGIN INSERT INTO audit_recovery_mutations(table_name,action) VALUES ('${name}','${action}'); END`).run();
      triggerCount++;
    }
    const a = await seed('JRVX-AAAA12345678'), b = await seed('JRVX-BBBB87654321');
    const unknown = randomUUID();
    await check('missing receipts remain unknown and give only the authenticated player public snapshot', async () => {
      await unchanged(async () => {
        for (const [game, key] of [['blackjack', 'actionId'], ['roulette', 'spinId']]) {
          const response = await request(`/api/${game}/recovery?${key}=${unknown}`, a);
          assert.equal(response.status, 200); assert.equal(response.data.ok, true); assert.equal(response.data.status, 'unknown');
          assert.equal(response.data.ownerId, a.id); assert.equal(response.data.intentId, unknown); assert.equal(response.data.economy.currency, 'MG');
          assert.equal('result' in response.data, false); assert.equal('rejected' in response.data, false);
          assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
          assert.equal(response.headers.get('access-control-allow-origin'), null);
          if (game === 'blackjack') { assert.equal(response.data.snapshot.version, 0); assert.equal(response.data.snapshot.state.active, false); assert.equal('shoe' in response.data.snapshot.state, false); }
          else assert.equal('snapshot' in response.data, false);
        }
      });
    });
    await check('unauthenticated, revoked and malformed-cookie requests disclose no receipt', async () => {
      await unchanged(async () => {
        for (const session of [undefined, { cookie: 'jrvx_cas_session=invalid; jrvx_session=invalid' }]) {
          const response = await request(`/api/roulette/recovery?spinId=${unknown}`, session);
          assert.equal(response.status, 401); assert.equal(response.data.error, 'unauthorized'); assert.equal('result' in response.data, false);
        }
      });
      await query('UPDATE cas_sessions SET revoked=1 WHERE sid=?', [b.sid]).run();
      await unchanged(async () => assert.equal((await request(`/api/blackjack/recovery?actionId=${unknown}`, b)).status, 401));
      await query('UPDATE cas_sessions SET revoked=0 WHERE sid=?', [b.sid]).run();
    });
    await check('HTTP validation rejects duplicate/foreign/extra query fields and POST without mutating a game', async () => {
      await unchanged(async () => {
        for (const [game, key] of [['blackjack', 'actionId'], ['roulette', 'spinId']]) {
          for (const search of ['', `${key}=bad`, `${key}=${unknown}&${key}=${unknown}`, `${key}=${unknown}&ownerId=${b.id}`, `${key}=${unknown}&extra=1`]) {
            const response = await request(`/api/${game}/recovery?${search}`, a);
            assert.equal(response.status, 400); assert.equal(response.data.error, 'invalid_recovery_request');
          }
          const response = await request(`/api/${game}/recovery?${key}=${unknown}`, a, { method: 'POST', body: {} });
          assert.equal(response.status, 405); assert.equal(response.headers.get('allow'), 'GET');
        }
      });
    });
    let spinId, spinResult;
    await check('a confirmed roulette receipt is the exact original result and lookup does not repeat the wager', async () => {
      spinId = randomUUID();
      const response = await request('/api/roulette/spin', a, { method: 'POST', body: { ownerId: a.id, spinId, currency: 'MG', amount: 50, bet: { type: 'red', numbers: [] } } });
      assert.equal(response.status, 200); spinResult = JSON.parse((await query('SELECT data_json FROM cas_game_history WHERE event_id=?', [`roulette:${a.id}:${spinId}`]).first()).data_json);
      await unchanged(async () => {
        const response = await request(`/api/roulette/recovery?spinId=${spinId}`, a);
        assert.equal(response.status, 200); assert.equal(response.data.status, 'confirmed'); assert.deepEqual(response.data.result, spinResult);
        assert.equal(response.data.result.jrvxId, a.id); assert.equal(response.data.result.eventId, `roulette:${a.id}:${spinId}`);
      });
    });
    await check('other players cannot retrieve a known roulette ID and original receipt remains available beyond recent history', async () => {
      await unchanged(async () => {
        const response = await request(`/api/roulette/recovery?spinId=${spinId}`, b);
        assert.equal(response.status, 200); assert.equal(response.data.status, 'unknown'); assert.equal('result' in response.data, false); assert.equal(response.data.ownerId, b.id);
      });
      // Old receipts do not expire from this exact lookup merely because a list is bounded to 50 rows.
      await query('UPDATE cas_game_history SET created_at=1 WHERE event_id=?', [`roulette:${a.id}:${spinId}`]).run();
      await unchanged(async () => assert.equal((await request(`/api/roulette/recovery?spinId=${spinId}`, a)).data.status, 'confirmed'));
    });
    let actionId, originalReceipt;
    await check('blackjack receipt and current state are separate so a previous deal cannot roll back a newer hand view', async () => {
      // Seed a standard complete shoe whose final draws create a non-natural 20 against 18.
      const shoe = [];
      for (let copy = 0; copy < 6; copy++) for (const s of ['♠', '♥', '♦', '♣']) for (const r of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) shoe.push({ r, s });
      const draws = [{ r: '10', s: '♠' }, { r: 'Q', s: '♥' }, { r: '10', s: '♣' }, { r: '8', s: '♦' }];
      for (const draw of draws) shoe.splice(shoe.findIndex(card => card.r === draw.r && card.s === draw.s), 1);
      shoe.push(...draws.slice().reverse());
      await query('UPDATE cas_blackjack_state SET state_json=? WHERE jrvx_id=?', [JSON.stringify({ shoe, hands: [], dealer: [], active: false, hand: 0, hideDealer: true, insuranceOffered: false, insuranceResolved: false, insuranceBet: 0, baseBet: 0, wagered: 0, roundId: 0, currency: 'MG', lastResults: [] }), a.id]).run();
      actionId = randomUUID();
      const deal = await request('/api/blackjack/action', a, { method: 'POST', body: { ownerId: a.id, actionId, action: 'deal', expectedVersion: 0, bet: 50, currency: 'MG' } });
      assert.equal(deal.status, 200); assert.equal(deal.data.result.state.active, true);
      originalReceipt = JSON.parse((await query('SELECT result_json FROM cas_blackjack_actions WHERE jrvx_id=? AND action_id=?', [a.id, actionId]).first()).result_json);
      await unchanged(async () => {
        const response = await request(`/api/blackjack/recovery?actionId=${actionId}`, a);
        assert.equal(response.status, 200); assert.deepEqual(response.data.result, originalReceipt); assert.equal(response.data.snapshot.version, 1);
        assert.equal(response.data.snapshot.state.dealer[1].r, '?'); assert.equal('shoe' in response.data.snapshot.state, false);
      });
      const stand = await request('/api/blackjack/action', a, { method: 'POST', body: { ownerId: a.id, actionId: randomUUID(), action: 'stand', expectedVersion: 1 } });
      assert.equal(stand.status, 200);
      await unchanged(async () => {
        const response = await request(`/api/blackjack/recovery?actionId=${actionId}`, a);
        assert.equal(response.data.status, 'confirmed'); assert.deepEqual(response.data.result, originalReceipt);
        assert.equal(response.data.result.state.active, true); assert.equal(response.data.snapshot.state.active, false); assert.equal(response.data.snapshot.version, 2);
      });
    });
    await check('blackjack action IDs are scoped to the session owner even when the attacker knows the complete ID', async () => {
      await unchanged(async () => {
        const response = await request(`/api/blackjack/recovery?actionId=${actionId}`, b);
        assert.equal(response.data.status, 'unknown'); assert.equal('result' in response.data, false); assert.equal(response.data.snapshot.version, 0);
      });
    });
    await check('parallel read checks around one real spin never execute an additional financial command', async () => {
      const id = randomUUID(), route = `/api/roulette/recovery?spinId=${id}`;
      const before = (await query('SELECT COUNT(*) AS n FROM cas_transactions WHERE jrvx_id=?', [a.id]).first()).n;
      await unchanged(async () => assert.equal((await request(route, a)).data.status, 'unknown'));
      const [spin, ...lookups] = await Promise.all([
        request('/api/roulette/spin', a, { method: 'POST', body: { ownerId: a.id, spinId: id, currency: 'MG', amount: 50, bet: { type: 'black', numbers: [] } } }),
        request(route, a), request(route, a), request(route, a)
      ]);
      assert.equal(spin.status, 200);
      for (const response of lookups) { assert.equal(response.status, 200); assert(['unknown', 'confirmed'].includes(response.data.status)); }
      assert.equal((await query('SELECT COUNT(*) AS n FROM cas_game_history WHERE event_id=?', [`roulette:${a.id}:${id}`]).first()).n, 1);
      assert.equal((await query('SELECT COUNT(*) AS n FROM cas_transactions WHERE jrvx_id=?', [a.id]).first()).n - before, spin.data.result.payout ? 2 : 1);
      await unchanged(async () => assert.equal((await request(route, a)).data.status, 'confirmed'));
    });
    await check('corrupt or foreign receipt JSON fails closed without exposing data or clearing anything', async () => {
      const changed = { ...spinResult, jrvxId: b.id };
      await query('UPDATE cas_game_history SET data_json=? WHERE event_id=?', [JSON.stringify(changed), spinResult.eventId]).run();
      await unchanged(async () => {
        const response = await request(`/api/roulette/recovery?spinId=${spinId}`, a);
        assert.equal(response.status, 500); assert.equal(response.data.error, 'server_error'); assert.equal('result' in response.data, false);
      });
      await query('UPDATE cas_game_history SET data_json=? WHERE event_id=?', [JSON.stringify(spinResult), spinResult.eventId]).run();
    });
    await check('v330 server bytes, existing DO exports and all non-recovery routes are retained', async () => {
      const original = await readFile(new URL('../worker-v330.mjs', import.meta.url));
      assert.equal(sha(original), '9b5466bd6c59e85be569ab48603a219d9a0fa50b4956817e46ab09b3e0cd2d0e');
      const actual = await readFile(workerPath, 'utf8');
      assert.match(actual, /Bs as CasSession/); assert.match(actual, /Us as PokerLobby/); assert.match(actual, /Ws as PokerRoom/);
      let retained = actual.replace(/\r\n/g, '\n').replace('// CAS v332: local read-only recovery extension of the verified v330 candidate; no publication.', '// CAS v330: based on the verified deployed v326 module; session/provider secrets remain environment bindings.')
        .replace("import { recoveryIntentIdV332, readGameReceiptV332 } from './recovery-v332.mjs';\n", '');
      const start = retained.indexOf('    if (n === "/api/blackjack/recovery" || n === "/api/roulette/recovery") {');
      const end = retained.indexOf('    if (n === "/api/roulette/spin" && e.method === "POST") {', start);
      assert(start > 0 && end > start);
      retained = retained.slice(0, start) + retained.slice(end);
      assert.equal(retained, original.toString('utf8').replace(/\r\n/g, '\n'), 'Existing Worker routing/engines must remain byte-identical apart from the added import/routes/comment');
      assert.equal(outbound.length, 0);
    });
  } finally {
    await mf.dispose();
    const result = { generatedAt: new Date().toISOString(), workerPath, candidateSHA256: sha(await readFile(workerPath)),
      passedScenarioGroups: checks.length, checks, actualWorker: true, actualD1: true, actualDurableObjects: true,
      ownerIsolation: true, auditMutationTriggers: triggerCount, outboundAttempts: outbound.length,
      miniflareVersion: require('miniflare/package.json').version, runPath,
      noProductionCalls: true, noPublication: true, limits: ['Synthetic local identity verifier; real OIDC/provider is unchanged and not retested here.', 'Read-only APIs share existing authenticated/rate-limited routing; rate-limit DO metadata can change, but D1 game, wallet and all account rows remain unchanged during GET tests.'] };
    const resultPath = path.join(process.env.CAS_EVIDENCE_DIR || tmpdir(), 'recovery-v332-server-result.json');
    await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ resultPath, passedScenarioGroups: checks.length, outboundAttempts: outbound.length }));
  }
});
