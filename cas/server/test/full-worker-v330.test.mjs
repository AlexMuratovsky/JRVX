import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash, createHmac, createCipheriv, randomBytes, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {beginEconomyDrain,migrateToMg,migrationStatements} from '../migration-v330.mjs';
import {createMgEconomy,CATALOG_VERSION} from '../economy-v330.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const localRequire=createRequire(new URL('../package.json',import.meta.url));
const legacyRequire=createRequire(new URL('../../../identity/package.json',import.meta.url));
const require=name=>{let target;try{target=localRequire.resolve(name)}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;target=legacyRequire.resolve(name)}return localRequire(target)};
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const miniflareVersion = require('miniflare/package.json').version;
// Preserve the historical v330 default; versioned compatibility runners can
// exercise these same actual Worker/D1/DO scenarios against a newer local source.
const workerPath = path.resolve(process.env.CAS_FULL_WORKER_SOURCE || path.resolve(here, '../worker-v330.mjs'));
const workerBytes = await readFile(workerPath);
const sha = value => createHash('sha256').update(value).digest('hex');
const runPath = await mkdtemp(path.join(tmpdir(), 'cas-v330-full-runtime-'));
const secret = randomBytes(48).toString('hex');
const origin = 'https://cas.jrvx.ru';
const ids = ['JRVX-AAAA12345678', 'JRVX-BBBB87654321'];
const sessions = [];
const identityTokens = new Map();
const identityCalls = [];
const outboundAttempts = [];
const checks = [];
const observed = {};
const schemaText=await readFile(new URL('../schema-v329.sql',import.meta.url),'utf8');
const schemaObjects=migrationStatements(schemaText).map(sql=>{const match=sql.match(/CREATE\s+(?:UNIQUE\s+)?(TABLE|INDEX|TRIGGER)\s+([A-Za-z0-9_]+)/i);return{sql,type:match[1].toLowerCase(),name:match[2]}});
const schemas=[{file:'schema-v329.sql',sha256:sha(schemaText),objects:schemaObjects}];
const tables=schemaObjects.filter(x=>x.type==='table').map(x=>x.name);
const responseJson = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json' }
});
const discovery = {
  issuer: 'https://id.jrvx.ru',
  authorization_endpoint: 'https://id.jrvx.ru/oidc/oauth2/authorize',
  token_endpoint: 'https://id.jrvx.ru/oidc/oauth2/token',
  userinfo_endpoint: 'https://id.jrvx.ru/oidc/oauth2/userinfo',
  jwks_uri: 'https://id.jrvx.ru/oidc/jwks',
  response_types_supported: ['code'], subject_types_supported: ['public'],
  id_token_signing_alg_values_supported: ['ES256'],
  code_challenge_methods_supported: ['S256']
};
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: [{ type: 'ESModule', path: workerPath },{type:'ESModule',path:path.resolve(here,'../economy-v330.mjs')},
    ...(process.env.CAS_FULL_WORKER_RECOVERY === 'v332' ? [{type:'ESModule',path:path.resolve(here,'../recovery-v332.mjs')}] : [])],
  modulesRoot:path.resolve(here,'..'),
  compatibilityDate: '2026-09-30', compatibilityFlags: ['nodejs_compat'],
  resourcePersistencePath: runPath,
  d1Databases: ['DB'],
  durableObjects: {
    CAS_SESSIONS: { className: 'CasSession', useSQLite: true },
    CAS_LOBBY: { className: 'PokerLobby', useSQLite: true },
    CAS_ROOMS: { className: 'PokerRoom', useSQLite: true }
  },
  serviceBindings: {
    IDENTITY: async request => {
      const url = new URL(request.url);
      identityCalls.push({ method: request.method, path: url.pathname });
      assert.equal(url.origin, 'https://id.jrvx.ru', 'Identity service must use its canonical local fixture origin');
      if (url.pathname === '/.well-known/openid-configuration') return responseJson(discovery);
      if (url.pathname === '/oidc/oauth2/userinfo') {
        const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
        const identity = identityTokens.get(token);
        return identity ? responseJson(identity) : responseJson({ error: 'invalid_token' }, 401);
      }
      if (url.pathname === '/oidc/oauth2/revoke' || url.pathname === '/oidc/revoke') {
        return responseJson({ ok: true });
      }
      return responseJson({ error: 'unexpected_local_identity_path' }, 404);
    },
    ASSETS: () => new Response('Local audit has no assets', { status: 404 })
  },
  bindings: {
    JRVX_AUTH_MODE: 'production', JRVX_OIDC_ENABLED: 'true',
    JRVX_SESSION_SECRET: secret, JRVX_BUILD_ID: 'local-full-runtime-audit'
  },
  outboundService(request) {
    outboundAttempts.push({ method: request.method, origin: new URL(request.url).origin, path: new URL(request.url).pathname });
    throw Error('External network disabled for the private CAS audit');
  }
}));

let db;
const query = (sql, args = []) => db.prepare(sql).bind(...args);
async function check(name, test) {
  const started = Date.now();
  try {
    const details = await test();
    checks.push({ name, passed: true, durationMs: Date.now() - started, ...(details ? { details } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, durationMs: Date.now() - started, error: String(error.message).slice(0, 1500) });
    console.log(`FAIL ${name}: ${String(error.message).slice(0, 500)}`);
    throw error;
  }
}
async function request(route, { method = 'GET', body, cookie, originHeader = origin, host = origin, headers = {} } = {}) {
  const response = await mf.dispatchFetch(host + route, {
    method, redirect: 'manual', headers: {
      'user-agent': 'JRVX private full-runtime audit', 'cf-connecting-ip': '192.0.2.17',
      ...(cookie ? { cookie } : {}),
      ...(!['GET', 'HEAD'].includes(method) ? { 'content-type': 'application/json', ...(originHeader == null ? {} : { origin: originHeader }) } : {}),
      ...headers
    }, ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, headers: response.headers, data };
}
const post = (route, session, body, options = {}) => request(route, { method: 'POST', cookie: session?.cookie, body, ...options });
function status(result, expected, error) {
  assert.equal(result.status, expected, `Expected status ${expected}, got ${result.status}: ${JSON.stringify(result.data)}`);
  if (error) assert.equal(result.data.error, error);
}
async function mutations() { return Number((await query('SELECT COUNT(*) AS n FROM audit_mutations').first()).n); }
async function tableSnapshot() {
  const contents = {};
  for (const table of tables) contents[table] = (await query(`SELECT * FROM "${table}" ORDER BY rowid`).all()).results;
  return sha(JSON.stringify(contents));
}
async function unchanged(test) {
  const before = { count: await mutations(), dataHash: await tableSnapshot() };
  const result = await test();
  assert.equal(await mutations(), before.count, 'Rejected/replayed intent executed a D1 row mutation');
  assert.equal(await tableSnapshot(), before.dataHash, 'Rejected/replayed intent changed stored data');
  return result;
}
async function wallet(id) {
  const rows = (await query('SELECT currency,balance,version FROM cas_wallets WHERE jrvx_id=? ORDER BY currency', [id]).all()).results;
  return Object.fromEntries(rows.map(row => [row.currency, { balance: Number(row.balance), version: Number(row.version) }]));
}
async function rows(table, id) { return Number((await query(`SELECT COUNT(*) AS n FROM ${table} WHERE jrvx_id=?`, [id]).first()).n); }
async function progressVersion(id) { return Number((await query('SELECT progress_version FROM cas_users WHERE jrvx_id=?', [id]).first()).progress_version); }
function signCookie(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `jrvx_cas_session=${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`;
}
async function seedAccount(index) {
  const id = ids[index], now = Date.now(), exp = now + 3600000;
  const sid = randomUUID(), sub = `synthetic-audit-sub-${index}`, accessToken = randomBytes(24).toString('base64url');
  const refreshToken = randomBytes(24).toString('base64url');
  const key = createHash('sha256').update(`cas-oidc-token-storage:v1:${secret}`).digest();
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(sid));
  const bytes = Buffer.concat([cipher.update(JSON.stringify({ accessToken, refreshToken })), cipher.final(), cipher.getAuthTag()]);
  const sealed = `${iv.toString('base64url')}.${bytes.toString('base64url')}`;
  await query('INSERT INTO cas_users (jrvx_id,nickname,created_at,updated_at) VALUES (?,?,?,?)', [id, `Synthetic audit ${index}`, now, now]).run();
  for (const [currency, amount] of [['MG',10000]]) {
    await query('INSERT INTO cas_wallets (jrvx_id,currency,balance,updated_at) VALUES (?,?,?,?)', [id, currency, amount, now]).run();
  }
  await query('INSERT INTO cas_identity_subject (sub,jrvx_id,linked_at) VALUES (?,?,?)', [sub, id, now]).run();
  await query('INSERT INTO cas_sessions (sid,jrvx_id,expires_at,created_at) VALUES (?,?,?,?)', [sid, id, exp, now]).run();
  await query('INSERT INTO cas_oidc_credentials (sid,sub,cipher,access_expires_at,expires_at) VALUES (?,?,?,?,?)', [sid, sub, sealed, exp, exp]).run();
  await query('INSERT INTO cas_blackjack_state (jrvx_id,state_json,updated_at) VALUES (?,?,?)', [id, '{}', now]).run();
  identityTokens.set(accessToken, { sub, jrvx_id: id, username: `Synthetic audit ${index}` });
  const payload = { id, sid, exp, oidc: true };
  const session = { id, sid, sub, accessToken, payload, cookie: signCookie(payload) };
  sessions.push(session);
  return session;
}
async function freshCapacityAccount() {
  const index=ids.length;ids.push('JRVX-CAPS'+String(index).padStart(8,'0'));
  return seedAccount(index);
}
async function adminConnection() {
  const session=await freshCapacityAccount();
  await query("UPDATE cas_users SET role='ADMIN' WHERE jrvx_id=?",[session.id]).run();
  const opened=await post('/api/transport/open',session,{connectionId:randomUUID(),openId:randomUUID(),hello:{type:'hello',protocol:'jrvx-cas-online',protocolVersion:'v3.0.17'}});
  status(opened,200);
  return async(target,mg)=>{
    const transport=opened.data;
    const response=await post('/api/transport/command',session,{connectionId:transport.connectionId,generation:transport.generation,after:transport.cursor,requestId:randomUUID(),command:{type:'admin_set_balances',playerId:target.id,mg,opId:randomUUID()}});
    status(response,200);return response;
  };
}
const fixedWinDraws=[{r:'10',s:'♠'},{r:'Q',s:'♥'},{r:'10',s:'♣'},{r:'8',s:'♦'}];
const capacityDeal=(session,bet=1000)=>post('/api/blackjack/action',session,{ownerId:session.id,actionId:randomUUID(),action:'deal',expectedVersion:0,bet,currency:'MG'});
const capacityStand=(session,version=1,actionId=randomUUID())=>post('/api/blackjack/action',session,{ownerId:session.id,actionId,action:'stand',expectedVersion:version});
function shoeWithDraws(draws) {
  const deck = [];
  for (let copy = 0; copy < 6; copy++) for (const suit of ['♠', '♥', '♦', '♣']) for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) deck.push({ r: rank, s: suit });
  for (const draw of draws) {
    const index = deck.findIndex(card => card.r === draw.r && card.s === draw.s);
    assert(index >= 0); deck.splice(index, 1);
  }
  return [...deck, ...draws.slice().reverse()];
}
async function seedShoe(id, draws) {
  const state = { shoe: shoeWithDraws(draws), hands: [], dealer: [], active: false, hand: 0, hideDealer: true,
    insuranceOffered: false, insuranceResolved: false, insuranceBet: 0, baseBet: 0, wagered: 0, roundId: 0, currency: 'MG', lastResults: [] };
  await query('UPDATE cas_blackjack_state SET state_json=?,version=0,updated_at=? WHERE jrvx_id=?', [JSON.stringify(state), Date.now(), id]).run();
}

try {
  db = await mf.getD1Database('DB');
  const typeRank = { table: 0, index: 1, trigger: 2, view: 3 };
  for (const object of schemaObjects.slice().sort((a, b) => typeRank[a.type] - typeRank[b.type])) await query(object.sql).run();
  await beginEconomyDrain(db);
  await migrateToMg(db,{sql:await readFile(new URL('../migrations/001-mg-only-v330.sql',import.meta.url),'utf8'),inspectAllRooms:async()=>({complete:true,objectCount:0,rooms:[]})});
  await db.batch(migrationStatements(await readFile(new URL('../migrations/002-daily-purchases-v330.sql',import.meta.url),'utf8')).map(sql=>query(sql)));
  // Extra local-only instrumentation: AFTER triggers prove even no-op UPDATEs do not execute.
  // No production table or existing production trigger is modified.
  await query('CREATE TABLE audit_mutations (sequence INTEGER PRIMARY KEY AUTOINCREMENT,table_name TEXT NOT NULL,action TEXT NOT NULL)').run();
  for (const table of tables) for (const action of ['INSERT', 'UPDATE', 'DELETE']) {
    await query(`CREATE TRIGGER "audit_${table}_${action}" AFTER ${action} ON "${table}" BEGIN INSERT INTO audit_mutations(table_name,action) VALUES ('${table}','${action}'); END`).run();
  }
  const a = await seedAccount(0), b = await seedAccount(1);

  await check('actual Worker health, configuration, recovered schemas and security headers', async () => {
    const health = await request('/health'); status(health, 200); assert.equal(health.data.ok, true);
    assert.equal(health.data.build, 'local-full-runtime-audit');
    const config = await request('/auth/config'); status(config, 200); assert.equal(config.data.requiresAuthentication, true);
    assert.equal(config.headers.get('cache-control'), 'no-store');
    assert.equal(config.headers.get('x-content-type-options'), 'nosniff');
    return { tables: tables.length, originalTriggers: schemaObjects.filter(x => x.type === 'trigger').length, localMutationTriggers: tables.length * 3 };
  });
  await check('canonical host, missing session, corrupt HMAC, expired and logged-out cookies', async () => {
    await unchanged(async () => {
      status(await request('/api/me', { host: 'https://invalid.example' }), 421, 'invalid_host');
      status(await request('/api/me'), 401, 'unauthorized');
      status(await request('/api/me', { cookie: a.cookie + 'broken' }), 401, 'unauthorized');
      status(await request('/api/me', { cookie: signCookie({ ...a.payload, exp: Date.now() - 1 }) }), 401, 'unauthorized');
      status(await request('/api/me', { cookie: a.cookie + '; jrvx_cas_logged_out=1' }), 401, 'unauthorized');
    });
  });
  await check('authentic modern HMAC cookie + AES-GCM credential + Identity UserInfo verification', async () => {
    await unchanged(async () => {
      for (const session of [a, b]) {
        const result = await request('/api/me', { cookie: session.cookie }); status(result, 200);
        assert.equal(result.data.account.id, session.id); assert.equal(result.data.wallet.MG, 10000); assert.deepEqual(Object.keys(result.data.wallet),['MG']);assert.equal(result.data.economy.version,'mg-v330');
      }
    });
    assert(identityCalls.some(call => call.path === '/.well-known/openid-configuration'));
    assert(identityCalls.some(call => call.path === '/oidc/oauth2/userinfo'));
  });
  await check('revoked, disabled, changed OIDC subject and subject mapping all fail closed', async () => {
    await query('UPDATE cas_sessions SET revoked=1 WHERE sid=?', [a.sid]).run();
    await unchanged(async () => status(await request('/api/me', { cookie: a.cookie }), 401, 'unauthorized'));
    await query('UPDATE cas_sessions SET revoked=0 WHERE sid=?', [a.sid]).run();
    await query('UPDATE cas_users SET enabled=0 WHERE jrvx_id=?', [a.id]).run();
    await unchanged(async () => status(await request('/api/me', { cookie: a.cookie }), 401, 'unauthorized'));
    await query('UPDATE cas_users SET enabled=1 WHERE jrvx_id=?', [a.id]).run();
    const identity = identityTokens.get(a.accessToken);
    identityTokens.set(a.accessToken, { ...identity, sub: b.sub });
    await unchanged(async () => status(await request('/api/me', { cookie: a.cookie }), 401, 'unauthorized'));
    identityTokens.set(a.accessToken, identity);
    await query('UPDATE cas_oidc_credentials SET sub=? WHERE sid=?', [b.sub, a.sid]).run();
    identityTokens.set(a.accessToken, { ...identity, sub: b.sub });
    await unchanged(async () => status(await request('/api/me', { cookie: a.cookie }), 401, 'unauthorized'));
    await query('UPDATE cas_oidc_credentials SET sub=? WHERE sid=?', [a.sub, a.sid]).run();
    identityTokens.set(a.accessToken, identity);
  });
  const routes = [
    ['/api/wallet/daily', { operationId: 'audit-owner-daily' }],
    ['/api/roulette/spin', { spinId: 'audit-owner-spin', currency: 'MG', amount: 10, bet: { type: 'red', numbers: [] } }],
    ['/api/blackjack/action', { actionId: randomUUID(), action: 'deal', expectedVersion: 0, bet: 50, currency: 'MG' }]
  ];
  await check('all three mutation routes reject missing/foreign Origin before DB mutation', async () => {
    await unchanged(async () => {
      for (const [route, body] of routes) for (const originHeader of [null, 'https://foreign.example']) {
        status(await post(route, a, { ...body, ownerId: a.id }, { originHeader }), 403, 'invalid_origin');
      }
    });
  });
  await check('all three owner mismatch guards execute zero D1 row writes, including no-op updates', async () => {
    await unchanged(async () => {
      for (const [route, body] of routes) for (const ownerId of [b.id, '', null, 123, {}, []]) {
        status(await post(route, a, { ...body, ownerId }), 409, 'intent_owner_mismatch');
      }
    });
    return { rejectedIntents: routes.length * 6, allNineRecoveredTablesUnchanged: true, mutationTriggersUnchanged: true };
  });
  await check('actual daily REST grants exactly10000MG once under concurrent requests and after account refresh',async()=>{
    const before=(await wallet(a.id)).MG.balance;
    const replies=await Promise.all(Array.from({length:12},()=>post('/api/wallet/daily',a,{ownerId:a.id,operationId:randomUUID(),amount:999999999})));
    replies.forEach(r=>status(r,200));assert.equal((await wallet(a.id)).MG.balance,before+10000);
    assert.equal(replies.filter(r=>r.data.duplicate===false).length,1);
    const me=await request('/api/me',{cookie:a.cookie});status(me,200);assert.equal(me.data.dailyBonus.claimed,true);assert.equal(me.data.dailyBonus.amount,10000);
    assert.equal((await query("SELECT COUNT(*) AS n FROM cas_daily_claims WHERE jrvx_id=?",[a.id]).first()).n,1);
  });
  await check('actual catalog has five server-owned enlarged packs and disabled real checkout',async()=>{
    const catalog=await request('/api/shop/catalog',{cookie:a.cookie});status(catalog,200);
    assert.deepEqual(catalog.data.packages.map(p=>p.amountMG),[100000,500000,1000000,2000000,3000000]);
    assert.deepEqual(catalog.data.packages.map(p=>p.priceKopecks),[11900,49900,89900,169900,249900]);
    assert.equal(catalog.data.paymentsAvailable,false);
    await unchanged(async()=>status(await post('/api/shop/checkout',a,{ownerId:a.id,packageId:'pack_1',amount:999999999,requestId:randomUUID()}),503,'payment_unavailable'));
  });
  await check('retired currency cannot be wagered, exchanged or minted',async()=>{
    await unchanged(async()=>{
      status(await post('/api/roulette/spin',a,{ownerId:a.id,currency:'MS',amount:10,spinId:randomUUID(),bet:{type:'red',numbers:[]}}),409,'currency_retired');
      status(await post('/api/blackjack/action',a,{ownerId:a.id,currency:'MS',action:'deal',bet:50,expectedVersion:0,actionId:randomUUID()}),409,'currency_retired');
      status(await post('/api/wallet/exchange',a,{ownerId:a.id,quantity:1,operationId:randomUUID()}),410,'currency_retired');
    });
  });
  await check('real server RNG roulette settlement, exact replay, altered replay conflict and owner isolation', async () => {
    const before = await wallet(a.id), versionBefore = await progressVersion(a.id), historyBefore = await rows('cas_game_history', a.id);
    const body = { ownerId: a.id, jrvxId: b.id, spinId: randomUUID(), currency: 'MG', amount: 10, bet: { type: 'red', numbers: [] } };
    const response = await post('/api/roulette/spin', a, body); status(response, 200);
    const result = response.data.result;
    assert(Number.isInteger(result.number) && result.number >= 0 && result.number <= 36);
    assert.equal(result.payout, result.won ? 20 : 0); assert.equal(result.profit, result.payout - 10);
    assert.equal((await wallet(a.id)).MG.balance, before.MG.balance + result.profit);
    assert.equal(await progressVersion(a.id), versionBefore + 1); assert.equal(await rows('cas_game_history', a.id), historyBefore + 1);
    await unchanged(async () => {
      const replay = await post('/api/roulette/spin', a, body); status(replay, 200);
      assert.equal(replay.data.result.duplicate, true); assert.equal(replay.data.result.number, result.number);
      assert.equal(replay.data.result.profit, result.profit);
      const conflict = await post('/api/roulette/spin', a, { ...body, amount: 20 }); status(conflict, 409); assert.match(conflict.data.error, /id_conflict/);
      status(await post('/api/roulette/spin', a, { ...body, spinId: randomUUID(), amount: 1.5 }), 400, 'invalid_amount');
    });
    assert.equal((await wallet(b.id)).MG.balance, 10000);
    observed.roulette = { number: result.number, won: result.won, payout: result.payout, profit: result.profit };
  });
  await check('real blackjack deal→hit→stand, hidden cards, version guards, receipts and once-only settlement', async () => {
    await seedShoe(a.id, [{ r: '9', s: '♠' }, { r: '7', s: '♥' }, { r: '6', s: '♦' }, { r: '10', s: '♣' }, { r: '2', s: '♠' }, { r: '3', s: '♠' }]);
    const before = await wallet(a.id), progressBefore = await progressVersion(a.id), historyBefore = await rows('cas_game_history', a.id), actionsBefore = await rows('cas_blackjack_actions', a.id);
    const dealBody = { ownerId: a.id, jrvxId: b.id, actionId: randomUUID(), action: 'deal', expectedVersion: 0, bet: 50, currency: 'MG' };
    const dealt = await post('/api/blackjack/action', a, dealBody); status(dealt, 200);
    assert.equal(dealt.data.result.version, 1); assert.equal(dealt.data.result.state.active, true);
    assert.equal(dealt.data.result.state.shoe, undefined); assert.equal(dealt.data.result.state.shoeCount, 308);
    assert.equal(dealt.data.result.state.dealer[1].r, '?'); assert.equal((await wallet(a.id)).MG.balance, before.MG.balance - 50);
    await unchanged(async () => {
      const replay = await post('/api/blackjack/action', a, dealBody); status(replay, 200); assert.equal(replay.data.result.duplicate, true);
      status(await post('/api/blackjack/action', a, { ...dealBody, bet: 100 }), 409, 'action_id_conflict');
      status(await post('/api/blackjack/action', a, { ownerId: a.id, actionId: randomUUID(), action: 'hit', expectedVersion: 0 }), 409, 'stale_state');
    });
    const hitBody = { ownerId: a.id, actionId: randomUUID(), action: 'hit', expectedVersion: 1 };
    const hit = await post('/api/blackjack/action', a, hitBody); status(hit, 200);
    assert.equal(hit.data.result.version, 2); assert.equal(hit.data.result.state.hands[0].cards.length, 3);
    await unchanged(async () => { const replay = await post('/api/blackjack/action', a, hitBody); status(replay, 200); assert.equal(replay.data.result.duplicate, true); });
    const standBody = { ownerId: a.id, actionId: randomUUID(), action: 'stand', expectedVersion: 2 };
    const stand = await post('/api/blackjack/action', a, standBody); status(stand, 200);
    assert.equal(stand.data.result.version, 3); assert.equal(stand.data.result.state.active, false);
    assert.equal(stand.data.result.settlement.profit, -50); assert.equal(stand.data.result.settlement.results[0].value, 18);
    assert.equal(stand.data.result.settlement.dealer.reduce((n, card) => n + Number(card.r), 0), 19);
    assert.equal((await wallet(a.id)).MG.balance, before.MG.balance - 50);
    assert.equal(await rows('cas_blackjack_actions', a.id), actionsBefore + 3);
    assert.equal(await rows('cas_game_history', a.id), historyBefore + 1); assert.equal(await progressVersion(a.id), progressBefore + 1);
    await unchanged(async () => {
      for (const body of [dealBody, hitBody, standBody]) {
        const replay = await post('/api/blackjack/action', a, body); status(replay, 200); assert.equal(replay.data.result.duplicate, true);
        assert.equal(replay.data.result.version, 3);
      }
      status(await post('/api/blackjack/action', a, { ownerId: a.id, actionId: randomUUID(), action: 'deal', expectedVersion: 3, bet: 51, currency: 'MG' }), 400, 'invalid_bet');
    });
    const publicState = await request('/api/blackjack/state', { cookie: a.cookie }); status(publicState, 200);
    assert.equal(JSON.stringify(publicState.data).includes('"shoe":'), false);
    assert.equal((await wallet(b.id)).MG.balance, 10000);
    observed.blackjackLoss = { actions: 3, finalVersion: 3, profit: -50, oneHistoryAndProgress: true };
  });
  await check('real blackjack natural payout 3:2, once-only wallet/history/progression', async () => {
    await seedShoe(b.id, [{ r: 'A', s: '♠' }, { r: 'K', s: '♥' }, { r: '10', s: '♦' }, { r: '7', s: '♣' }]);
    const before = await wallet(b.id), progressBefore = await progressVersion(b.id);
    const body = { ownerId: b.id, actionId: randomUUID(), action: 'deal', expectedVersion: 0, bet: 50, currency: 'MG' };
    const natural = await post('/api/blackjack/action', b, body); status(natural, 200);
    assert.equal(natural.data.result.state.active, false); assert.equal(natural.data.result.settlement.payout, 125);
    assert.equal(natural.data.result.settlement.profit, 75); assert.equal(natural.data.result.settlement.results[0].natural, true);
    assert.equal((await wallet(b.id)).MG.balance, before.MG.balance + 75); assert.equal(await progressVersion(b.id), progressBefore + 1);
    assert.equal(await rows('cas_game_history', b.id), 1);
    await unchanged(async () => { const replay = await post('/api/blackjack/action', b, body); status(replay, 200); assert.equal(replay.data.result.duplicate, true); });
    observed.blackjackNatural = { stake: 50, payout: 125, profit: 75, oneHistoryAndProgress: true };
  });
  await check('actual Durable Object rate RPC and modern OIDC start redirect', async () => {
    const login = await request('/auth/jrvx/start'); status(login, 302);
    const target = new URL(login.headers.get('location'));
    assert.equal(target.origin, 'https://id.jrvx.ru'); assert.equal(target.pathname, '/oidc/oauth2/authorize');
    assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
    assert(login.headers.get('set-cookie')?.includes('jrvx_oidc_flow='));
    const unauthTransport = await post('/api/transport/open', null, {}); status(unauthTransport, 401, 'unauthorized');
  });

  await check('concurrent actual REST roulette and blackjack retries settle only once', async () => {
    ids.push('JRVX-CCCC10293847');const c=await seedAccount(2);
    let before=await wallet(c.id),tx=await rows('cas_transactions',c.id);
    before=await wallet(c.id);const history=await rows('cas_game_history',c.id),progress=await progressVersion(c.id);
    const spin={ownerId:c.id,spinId:randomUUID(),currency:'MG',amount:10,bet:{type:'red',numbers:[]}};
    const spun=await Promise.all([post('/api/roulette/spin',c,spin),post('/api/roulette/spin',c,spin)]);spun.forEach(r=>status(r,200));
    assert.equal(spun[0].data.result.number,spun[1].data.result.number);assert.equal((await wallet(c.id)).MG.balance,before.MG.balance+spun[0].data.result.profit);
    assert.equal(await rows('cas_game_history',c.id),history+1);assert.equal(await progressVersion(c.id),progress+1);
    await seedShoe(c.id,[{r:'8',s:'\u2660'},{r:'6',s:'\u2665'},{r:'10',s:'\u2663'},{r:'7',s:'\u2666'}]);
    before=await wallet(c.id);const historyBJ=await rows('cas_game_history',c.id),progressBJ=await progressVersion(c.id);
    const deal={ownerId:c.id,actionId:randomUUID(),action:'deal',expectedVersion:0,bet:50,currency:'MG'};
    const dealt=await Promise.all([post('/api/blackjack/action',c,deal),post('/api/blackjack/action',c,deal)]);dealt.forEach(r=>status(r,200));
    assert.equal((await wallet(c.id)).MG.balance,before.MG.balance-50);assert.equal(dealt[0].data.result.version,1);assert.equal(dealt[1].data.result.version,1);
    const stand={ownerId:c.id,actionId:randomUUID(),action:'stand',expectedVersion:1};
    const settled=await Promise.all([post('/api/blackjack/action',c,stand),post('/api/blackjack/action',c,stand)]);settled.forEach(r=>status(r,200));
    assert.equal(settled[0].data.result.settlement.profit,-50);assert.equal((await wallet(c.id)).MG.balance,before.MG.balance-50);
    assert.equal(await rows('cas_game_history',c.id),historyBJ+1);assert.equal(await progressVersion(c.id),progressBJ+1);
    return{rouletteOutcomes:1,blackjackDeals:1,blackjackSettlements:1};
  });
  await check('actual PokerRoom serializes duplicate buy-in, all-in replay, disconnect and cashout', async () => {
    const ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),roomId='audit-deep-allin',room=ns.get(ns.idFromName(roomId));
    const before=[await wallet(a.id),await wallet(b.id)],op=randomUUID();
    await room.configure(roomId,{mode:'online',currency:'MG',tableId:'1-2'});
    const duplicated=await Promise.all([room.join({id:a.id,nickname:'A'},100,op),room.join({id:a.id,nickname:'A'},100,op)]);
    assert.equal(duplicated[0].you.stack,100);assert.equal(duplicated[1].you.stack,100);
    let view=await room.join({id:b.id,nickname:'B'},100,randomUUID());
    assert.equal((await wallet(a.id)).MG.balance,before[0].MG.balance-100);
    assert.equal((await wallet(b.id)).MG.balance,before[1].MG.balance-100);
    view=await room.start(a.id,randomUUID(),view.revision);
    const actor=view.seats[view.turnSeat].id,other=actor===a.id?b.id:a.id;
    const action={action:'allin',actionId:randomUUID(),handNo:view.handNo,revision:view.revision};
    const moved=await room.action(actor,action);assert.equal(moved.you.stack,0);
    await room.disconnect(actor);let disconnected=(await room.transportSnapshot(other)).state;
    assert.equal(disconnected.seats.find(p=>p?.id===actor).connected,false);
    const resumed=await room.reconnect(actor);assert.equal(resumed.you.stack,0);
    const mutationsBefore=await mutations();const replay=await room.action(actor,action);
    assert.equal(replay.revision,resumed.revision);assert.equal(await mutations(),mutationsBefore);
    const otherView=(await room.transportSnapshot(other)).state;
    assert(otherView.you.toCall>0);
    const result=await room.action(other,{action:'call',actionId:randomUUID(),handNo:otherView.handNo,revision:otherView.revision});
    assert.equal(result.active,false);assert.equal(result.community.length,5);
    assert.equal(result.seats.reduce((n,p)=>n+(p?.stack||0),0)+result.pot,200);
    assert.equal(new Set(result.community).size,5);
    const leaveA=randomUUID(),leaveB=randomUUID();
    await Promise.all([room.leave(a.id,leaveA),room.leave(b.id,leaveB)]);
    const paid=[await wallet(a.id),await wallet(b.id)];
    assert.equal(paid[0].MG.balance+paid[1].MG.balance,before[0].MG.balance+before[1].MG.balance);
    const after=await mutations();await room.leave(a.id,leaveA);await room.leave(b.id,leaveB);assert.equal(await mutations(),after);
    assert.equal((await query('SELECT COUNT(*) AS n FROM cas_poker_seats').first()).n,0);
    return{duplicateBuyInChargedOnce:true,allInSurvivesReconnect:true,replayNoD1Writes:true,cashoutConserved:200};
  });
  await check('actual PokerRoom admits exactly one of two same-revision competing actions', async () => {
    const ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),id='audit-deep-concurrent',room=ns.get(ns.idFromName(id));
    await room.configure(id,{mode:'online',currency:'MG',tableId:'1-2'});
    await room.join({id:a.id,nickname:'A'},100,randomUUID());let view=await room.join({id:b.id,nickname:'B'},100,randomUUID());
    view=await room.start(a.id,randomUUID(),view.revision);const actor=view.seats[view.turnSeat].id,other=actor===a.id?b.id:a.id;
    const common={handNo:view.handNo,revision:view.revision};
    const transport=async(session)=>{const opened=await post('/api/transport/open',session,{connectionId:randomUUID(),openId:randomUUID(),hello:{type:'hello',protocol:'jrvx-cas-online',protocolVersion:'v3.0.17'}});status(opened,200);return opened.data};
    const ta=await transport(a),tb=await transport(b);
    const send=(id,command)=>{const session=id===a.id?a:b,t=id===a.id?ta:tb;return post('/api/transport/command',session,{connectionId:t.connectionId,generation:t.generation,after:t.cursor,requestId:randomUUID(),command:{type:'poker_action',...command}})};
    const results=await Promise.all([send(actor,{...common,action:'call',actionId:randomUUID()}),send(other,{...common,action:'check',actionId:randomUUID()})]);
    results.forEach(r=>status(r,200));
    assert.equal(results.filter(r=>r.data.receipt.status==='complete').length,1);
    const rejected=results.filter(r=>r.data.receipt.status==='failed');assert.equal(rejected.length,1);
    assert(rejected[0].data.messages.some(x=>x.message.type==='poker_error'&&/stale_state|out_of_turn/.test(x.message.message)));
    const final=(await room.transportSnapshot(actor)).state;
    assert.equal(final.seats.reduce((n,p)=>n+(p?.stack||0),0)+final.pot,200);
    await room.leave(a.id,randomUUID());await room.leave(b.id,randomUUID());
  });
  await check('actual PokerRoom action deadline settles without client input and conserves escrow', async () => {
    const ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),id='audit-deep-deadline',room=ns.get(ns.idFromName(id));
    await room.configure(id,{mode:'online',currency:'MG',tableId:'1-2'});
    await room.join({id:a.id,nickname:'A'},100,randomUUID());let view=await room.join({id:b.id,nickname:'B'},100,randomUUID());
    view=await room.start(a.id,randomUUID(),view.revision);
    const wait=view.turnDeadline-Date.now()+150;assert(wait>0&&wait<16000);
    await new Promise(resolve=>setTimeout(resolve,wait));
    const expired=(await room.transportSnapshot(a.id)).state;
    assert.equal(expired.active,false);assert.equal(expired.lastResult.type,'fold');
    assert.equal(expired.seats.reduce((n,p)=>n+(p?.stack||0),0)+expired.pot,200);
    await room.leave(a.id,randomUUID());await room.leave(b.id,randomUUID());
    return{realAlarmWaitMs:wait,timeoutSettled:true};
  });
  await check('actual HTTP transport replaces old tab generation and enforces server admin authorization', async () => {
    const opening={connectionId:randomUUID(),openId:randomUUID(),hello:{type:'hello',protocol:'jrvx-cas-online',protocolVersion:'v3.0.17'}};
    const first=await post('/api/transport/open',a,opening);status(first,200);
    const duplicate=await post('/api/transport/open',a,opening);status(duplicate,200);assert.equal(duplicate.data.generation,first.data.generation);
    const next=await post('/api/transport/open',a,{...opening,connectionId:randomUUID(),openId:randomUUID()});status(next,200);assert(next.data.generation>first.data.generation);
    const old=await request('/api/transport/poll?'+new URLSearchParams({connectionId:first.data.connectionId,generation:String(first.data.generation),after:String(first.data.cursor)}),{cookie:a.cookie});status(old,409,'session_replaced');
    const command={connectionId:next.data.connectionId,generation:next.data.generation,after:next.data.cursor,requestId:randomUUID(),command:{type:'admin_set_balances',id:b.id,ms:999999,mg:999999,opId:randomUUID()}};
    const before=await wallet(b.id),tx=await rows('cas_transactions',b.id);
    const denied=await post('/api/transport/command',a,command);status(denied,200);
    assert(denied.data.messages.some(x=>x.message.type==='admin_error'&&x.message.message==='admin_forbidden'));
    assert.deepEqual(await wallet(b.id),before);assert.equal(await rows('cas_transactions',b.id),tx);
    const replay=await post('/api/transport/command',a,command);status(replay,200);assert.deepEqual(await wallet(b.id),before);
    const conflict=await post('/api/transport/command',a,{...command,command:{...command.command,ms:1}});status(conflict,409,'request_id_conflict');
    return{oldGenerationRejected:true,adminRequestRejectedByServer:true,mutationReplayConflict:true};
  });
  await check('wallet ceiling rejects a spin before outcome-dependent settlement or daily credit',async()=>{
    const before=(await wallet(b.id)).MG.balance;
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=? AND currency='MG'",[Number.MAX_SAFE_INTEGER,b.id]).run();
    await unchanged(async()=>{
      status(await post('/api/roulette/spin',b,{ownerId:b.id,spinId:randomUUID(),currency:'MG',amount:1,bet:{type:'red',numbers:[]}}),409,'balance_limit');
      status(await post('/api/wallet/daily',b,{ownerId:b.id,operationId:randomUUID()}),409,'balance_limit');
    });
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=? AND currency='MG'",[before,b.id]).run();
  });
  await check('financial statistics retain exact integer totals past the JavaScript Number boundary',async()=>{
    const row=await query('SELECT stats_json FROM cas_users WHERE jrvx_id=?',[b.id]).first();
    const stats=JSON.parse(row.stats_json);stats.economyVersion='mg-v330';stats.global.wagered=Number.MAX_SAFE_INTEGER;stats.roulette.wagered=Number.MAX_SAFE_INTEGER;
    await query('UPDATE cas_users SET stats_json=? WHERE jrvx_id=?',[JSON.stringify(stats),b.id]).run();
    const spin=await post('/api/roulette/spin',b,{ownerId:b.id,spinId:randomUUID(),currency:'MG',amount:10,bet:{type:'red',numbers:[]}});status(spin,200);
    const current=JSON.parse((await query('SELECT stats_json FROM cas_users WHERE jrvx_id=?',[b.id]).first()).stats_json);
    assert.equal(current.global.wagered,'9007199254741001');assert.equal(current.roulette.wagered,'9007199254741001');
  });
  await check('old financial game records remain identifiable without reinterpreting their unit',async()=>{
    await query("INSERT INTO cas_legacy_game_history_v330(event_id,jrvx_id,game,event_type,data_json,created_at) VALUES(?,?,'roulette','spin',?,?)",['legacy-finance-test',a.id,JSON.stringify({currency:'MS',profit:999999,number:17}),Date.now()]).run();
    const history=await request('/api/history?game=roulette',{cookie:a.cookie});status(history,200);
    const row=history.data.history.find(r=>r.eventId==='legacy-finance-test');assert.equal(row.legacy,true);assert.equal(row.data.archived,true);assert.equal(row.data.number,17);assert.equal(row.data.currency,undefined);assert.equal(row.data.profit,undefined);
    const ledger=await request('/api/wallet/transactions?playerId='+b.id,{cookie:a.cookie});status(ledger,200);assert(ledger.data.transactions.every(row=>row.currency==='MG'));assert(ledger.data.transactions.every(row=>Number.isSafeInteger(row.amount)&&Number.isSafeInteger(row.balanceAfter)));
  });
  await check('Blackjack admission near the integer ceiling is independent of winning or deferred card outcomes',async()=>{
    const session=await freshCapacityAccount();
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[Number.MAX_SAFE_INTEGER,session.id]).run();
    for(const draws of [[{r:'A',s:'♠'},{r:'K',s:'♥'},{r:'9',s:'♣'},{r:'7',s:'♦'}],fixedWinDraws]){
      await seedShoe(session.id,draws);
      await unchanged(async()=>status(await capacityDeal(session,50),409,'balance_limit'));
      assert.equal((await request('/api/blackjack/state',{cookie:session.cookie})).data.version,0);
    }
    assert.equal(await rows('cas_blackjack_actions',session.id),0);
  });
  await check('near-ceiling natural still pays the exact original3:2 and duplicate delivery cannot pay twice',async()=>{
    const session=await freshCapacityAccount(),initial=Number.MAX_SAFE_INTEGER-30;
    await seedShoe(session.id,[{r:'A',s:'♠'},{r:'K',s:'♥'},{r:'9',s:'♣'},{r:'7',s:'♦'}]);
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    const intent={ownerId:session.id,actionId:randomUUID(),action:'deal',expectedVersion:0,bet:2,currency:'MG'};
    const result=await post('/api/blackjack/action',session,intent);status(result,200);
    assert.equal(result.data.result.settlement.payout,5);assert.equal(result.data.result.settlement.profit,3);
    assert.equal((await wallet(session.id)).MG.balance,initial+3);
    await unchanged(async()=>{const replay=await post('/api/blackjack/action',session,intent);status(replay,200);assert.equal(replay.data.result.duplicate,true)});
  });
  await check('daily, administrative and roulette credits cannot consume an active Blackjack payout reserve',async()=>{
    const session=await freshCapacityAccount(),adminSet=await adminConnection(),initial=Number.MAX_SAFE_INTEGER-15000;
    await seedShoe(session.id,fixedWinDraws);
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    const deal=await capacityDeal(session);status(deal,200);assert.equal(deal.data.result.state.active,true);
    const held=(await wallet(session.id)).MG.balance;assert.equal(held,Number.MAX_SAFE_INTEGER-16000);
    await unchanged(async()=>{
      status(await post('/api/wallet/daily',session,{ownerId:session.id}),409,'balance_limit');
      status(await post('/api/roulette/spin',session,{ownerId:session.id,spinId:randomUUID(),currency:'MG',amount:1,bet:{type:'red',numbers:[]}}),409,'balance_limit');
    });
    const tx=await rows('cas_transactions',session.id),adjustment=await adminSet(session,Number.MAX_SAFE_INTEGER-1);
    assert(adjustment.data.messages.some(row=>row.message.type==='admin_error'&&row.message.message==='balance_limit'));
    assert.equal((await wallet(session.id)).MG.balance,held);assert.equal(await rows('cas_transactions',session.id),tx);
    const actionId=randomUUID(),stand=await capacityStand(session,1,actionId);status(stand,200);
    assert.equal(stand.data.result.settlement.payout,2000);assert.equal((await wallet(session.id)).MG.balance,Number.MAX_SAFE_INTEGER-14000);
    await unchanged(async()=>status(await capacityStand(session,1,actionId),200));
    status(await post('/api/wallet/daily',session,{ownerId:session.id}),200);
    assert.equal((await wallet(session.id)).MG.balance,Number.MAX_SAFE_INTEGER-4000);
  });
  await check('verified purchase credit also respects an active Blackjack commitment in the real migrated D1',async()=>{
    const session=await freshCapacityAccount(),initial=Number.MAX_SAFE_INTEGER-1500000;
    await seedShoe(session.id,fixedWinDraws);await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    status(await capacityDeal(session,100000),200);
    const held=(await wallet(session.id)).MG.balance;
    const ledger=(database,operation,before)=>database.prepare("INSERT INTO cas_transactions(transaction_id,jrvx_id,currency,amount,balance_before,balance_after,operation_type,source,actor_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(operation.transactionId,operation.jrvxId,operation.currency,operation.amount,before,before+operation.amount,operation.operationType,operation.source,operation.actorId,JSON.stringify(operation.metadata),operation.timestamp);
    const economy=createMgEconomy({ledgerStatement:ledger,providers:{fixture:{verifyReceipt:async()=>({paymentId:randomUUID(),accountId:session.id,packageId:'pack_1',catalogVersion:CATALOG_VERSION,status:'succeeded',currency:'RUB',amountKopecks:11900})}}});
    const before=await rows('cas_transactions',session.id);
    await assert.rejects(economy.fulfillVerifiedPurchase(db,{provider:'fixture',receipt:'explicit-local-verifier',accountId:session.id}),/balance_limit/);
    assert.equal((await wallet(session.id)).MG.balance,held);assert.equal(await rows('cas_transactions',session.id),before);
    assert.equal(await rows('cas_purchases',session.id),0);
    status(await capacityStand(session),200);
  });
  await check('poker escrow keeps capacity for its cashout while daily and admin credits are rejected',async()=>{
    const session=await freshCapacityAccount(),adminSet=await adminConnection(),initial=Number.MAX_SAFE_INTEGER-1000000000+100;
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    const ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),room=ns.get(ns.idFromName('capacity-cashout'));
    await room.configure('capacity-cashout',{mode:'online',currency:'MG',tableId:'1-2'});
    await room.join({id:session.id,nickname:'Capacity'},100,randomUUID());
    const held=(await wallet(session.id)).MG.balance;assert.equal(held,Number.MAX_SAFE_INTEGER-1000000000);
    await unchanged(async()=>status(await post('/api/wallet/daily',session,{ownerId:session.id}),409,'balance_limit'));
    const adjusted=await adminSet(session,Number.MAX_SAFE_INTEGER-1);
    assert(adjusted.data.messages.some(row=>row.message.type==='admin_error'&&row.message.message==='balance_limit'));
    assert.equal((await wallet(session.id)).MG.balance,held);
    const leave=randomUUID();await room.leave(session.id,leave);assert.equal((await wallet(session.id)).MG.balance,initial);
    const after=await rows('cas_transactions',session.id);await room.leave(session.id,leave);assert.equal(await rows('cas_transactions',session.id),after);
    assert.equal(await query('SELECT jrvx_id FROM cas_poker_seats WHERE jrvx_id=?',[session.id]).first(),null);
    status(await post('/api/wallet/daily',session,{ownerId:session.id}),200);
    assert.equal((await wallet(session.id)).MG.balance,initial+10000);
  });
  await check('combined Poker and Blackjack commitments are added rather than checked separately',async()=>{
    const session=await freshCapacityAccount(),initial=Number.MAX_SAFE_INTEGER-1000000000-15000;
    await seedShoe(session.id,fixedWinDraws);await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    status(await capacityDeal(session),200);
    const ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),room=ns.get(ns.idFromName('capacity-combined'));
    await room.configure('capacity-combined',{mode:'online',currency:'MG',tableId:'1-2'});
    await room.join({id:session.id,nickname:'Both games'},100,randomUUID());
    assert.equal((await wallet(session.id)).MG.balance,Number.MAX_SAFE_INTEGER-1000000000-16100);
    await unchanged(async()=>{
      status(await post('/api/wallet/daily',session,{ownerId:session.id}),409,'balance_limit');
      status(await post('/api/roulette/spin',session,{ownerId:session.id,spinId:randomUUID(),currency:'MG',amount:3,bet:{type:'exact',numbers:[17]}}),409,'balance_limit');
    });
    status(await capacityStand(session),200);await room.leave(session.id,randomUUID());
    assert.equal((await wallet(session.id)).MG.balance,initial+1000);
  });
  await check('a rejected capacity buy-in clears only its uncommitted plan and the room can be used again',async()=>{
    const session=await freshCapacityAccount(),ns=await mf.getDurableObjectNamespace('CAS_ROOMS'),roomId='r-'+randomUUID(),room=ns.get(ns.idFromName(roomId));
    await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[Number.MAX_SAFE_INTEGER-10,session.id]).run();
    await room.configure(roomId,{mode:'friend',currency:'MG',tableId:'1-2',allowedIds:[session.id]});
    // Negative RPC delivery in this Miniflare version loses the exception type;
    // exercise the real HTTP transport that catches the actual DO exception.
    const opened=await post('/api/transport/open',session,{connectionId:randomUUID(),openId:randomUUID(),hello:{type:'hello',protocol:'jrvx-cas-online',protocolVersion:'v3.0.17'}});status(opened,200);
    const transport=opened.data,rejected=await post('/api/transport/command',session,{connectionId:transport.connectionId,generation:transport.generation,after:transport.cursor,requestId:randomUUID(),command:{type:'poker_accept_invite',roomId,buyIn:20,opId:randomUUID()}});
    status(rejected,200);assert.equal(rejected.data.receipt.status,'failed');assert(rejected.data.messages.some(row=>row.message.type==='poker_error'&&row.message.message==='balance_limit'));
    assert.equal(await rows('cas_transactions',session.id),0);assert.equal(await query('SELECT jrvx_id FROM cas_poker_seats WHERE jrvx_id=?',[session.id]).first(),null);
    await query("UPDATE cas_wallets SET balance=10000 WHERE jrvx_id=?",[session.id]).run();
    const joined=await room.join({id:session.id,nickname:'Recovery'},100,randomUUID());assert.equal(joined.you.stack,100);
    await room.leave(session.id,randomUUID());assert.equal((await wallet(session.id)).MG.balance,10000);
  });
  await check('atomic guards catch an unchanged wallet value after a concurrent commitment appears',async()=>{
    const session=await freshCapacityAccount(),adminSet=await adminConnection(),initial=Number.MAX_SAFE_INTEGER-16000;
    await seedShoe(session.id,fixedWinDraws);await query("UPDATE cas_wallets SET balance=? WHERE jrvx_id=?",[initial,session.id]).run();
    // A stale preflight saw this wallet before the game started. Deal then a
    // legitimate top-up restore the same wallet number but create a new hold.
    status(await capacityDeal(session),200);
    const adjusted=await adminSet(session,initial);
    assert(adjusted.data.messages.some(row=>row.message.type==='admin_result'));
    assert.equal((await wallet(session.id)).MG.balance,initial);
    const tx=await rows('cas_transactions',session.id);
    await assert.rejects(query("INSERT INTO cas_transactions VALUES(?,?,'MG',-1,?,?,'roulette_bet','roulette-server',?,?,?)",[randomUUID(),session.id,initial,initial-1,session.id,JSON.stringify({bet:{type:'red',multiplier:2}}),Date.now()]).run(),/balance_limit/);
    assert.equal((await wallet(session.id)).MG.balance,initial);assert.equal(await rows('cas_transactions',session.id),tx);
    status(await capacityStand(session),200);
    const purchases=await request('/api/shop/purchases',{cookie:session.cookie});status(purchases,200);assert(Array.isArray(purchases.data.purchases));
  });
  await check('actual logout invokes Durable Object closeAll, revokes session and invalidates old cookie', async () => {
    const result = await post('/auth/logout', b, {}); status(result, 200); assert.equal(result.data.ok, true);
    assert.equal((await query('SELECT revoked FROM cas_sessions WHERE sid=?', [b.sid]).first()).revoked, 1);
    assert.equal(await query('SELECT sid FROM cas_oidc_credentials WHERE sid=?', [b.sid]).first(), null);
    assert(result.headers.get('set-cookie')?.includes('jrvx_cas_logged_out=1'));
    await unchanged(async () => status(await request('/api/me', { cookie: b.cookie }), 401, 'unauthorized'));
  });
  await check('no external network calls escaped the private local runtime', async () => assert.equal(outboundAttempts.length, 0));
} catch (error) {
  if (!checks.some(check => !check.passed)) checks.push({ name: 'runtime setup/teardown', passed: false, error: String(error.stack).slice(0, 2500) });
  process.exitCode = 1;
} finally {
  await mf.dispose();
  const result = {
    generatedAt: new Date().toISOString(), candidate: { path: workerPath, bytes: workerBytes.length, sha256: sha(workerBytes) },
    runtime: { miniflareVersion, adapter: 'convertV4MiniflareOptions', compatibilityDate: '2026-09-30', compatibilityFlags: ['nodejs_compat'], runPath, actualWorkerCandidate: true,
      actualD1: true, actualDurableObjectBindings: ['CasSession', 'PokerLobby', 'PokerRoom'], externalNetworkBlocked: true },
    schema: schemas.map(({ file, sha256, objects }) => ({ file, sha256, objects: objects.length })),
    instrumentation: { recoveredTables: tables, extraLocalMutationLogTriggers: tables.length * 3, noProductionCalls: true, secretsPersisted: false },
    passed: checks.filter(x => x.passed).length, failed: checks.filter(x => !x.passed).length, checks, observed,
    localIdentityCalls: identityCalls, blockedOutboundAttempts: outboundAttempts,
    limits: ['OIDC provider metadata/UserInfo/revocation are local fixtures; no real provider, token exchange, JWKS or refresh tested.',
      'Actual PokerRoom buy-in/all-in/concurrent action/reconnect/cashout/deadline and HTTP tab replacement/admin rejection are exercised; no real deployed clients or infrastructure crash injection.',
      'Roulette uses real crypto RNG for one valid spin; separate extracted-engine audit covers exhaustive pocket/bet rules.',
      'D1 uses the real MG migration and daily/purchase schema plus local mutation instrumentation; no production data is used.',
      'Blackjack draw order is seeded only in local synthetic state; game actions, accounting and history use the actual v330 candidate Worker.']
  };
  const resultPath = path.join(process.env.CAS_EVIDENCE_DIR||tmpdir(),process.env.CAS_FULL_WORKER_RESULT_NAME||'full-worker-v330-result.json');
  await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ resultPath, passed: result.passed, failed: result.failed, outboundAttempts: outboundAttempts.length, candidateSHA256: result.candidate.sha256 }));
}
