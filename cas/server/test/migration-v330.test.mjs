import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { beginEconomyDrain, migrateToMg, migrationStatements } from '../migration-v330.mjs';
const localRequire=createRequire(new URL('../package.json',import.meta.url));
const legacyRequire=createRequire(new URL('../../../identity/package.json',import.meta.url));
const require=name=>{let target;try{target=localRequire.resolve(name)}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;target=legacyRequire.resolve(name)}return localRequire(target)};
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const schema = await readFile(new URL('../schema-v329.sql', import.meta.url), 'utf8');
const sql = await readFile(new URL('../migrations/001-mg-only-v330.sql', import.meta.url), 'utf8');
const id = n => 'JRVX-AAAA' + String(n).padStart(8,'0');
const emptyAudit = async () => ({ complete:true, objectCount:0, rooms:[] });
async function fixture(t, balances=[[301,50]]) {
  const mf = new Miniflare(convertV4MiniflareOptions({
    script:'export default {fetch(){return new Response("migration test")}}', modules:true,
    compatibilityDate:'2026-09-30', compatibilityFlags:['nodejs_compat'], d1Databases:['DB'],
  }));
  t.after(()=>mf.dispose());
  const db = await mf.getD1Database('DB');
  await db.batch(migrationStatements(schema).map(s=>db.prepare(s)));
  for (let i=0;i<balances.length;i++) {
    await db.prepare('INSERT INTO cas_users(jrvx_id,nickname,enabled,role,created_at,updated_at) VALUES(?,?,1,\'USER\',1,1)').bind(id(i), 'Synthetic').run();
    for (const [index,currency] of ['MS','MG'].entries()) await db.prepare('INSERT INTO cas_wallets(jrvx_id,currency,balance,updated_at) VALUES(?,?,?,1)').bind(id(i), currency, balances[i][index]).run();
    await db.prepare('INSERT INTO cas_blackjack_state(jrvx_id,state_json,version,updated_at) VALUES(?,\'{}\',0,1)').bind(id(i)).run();
  }
  await beginEconomyDrain(db);
  return { db, migrate:options=>migrateToMg(db,{sql,inspectAllRooms:emptyAudit,...options}) };
}
const rows = async (db,sql) => (await db.prepare(sql).all()).results;

test('conversion rounds each remaining MS balance upward and never multiplies existing MG',async t=>{
  const balances=[[0,0],[1,5],[299,100],[300,1000],[301,1234],[1000000000000,1000000000000]];
  const f=await fixture(t,balances);assert.equal((await f.migrate()).duplicate,false);
  const wallets=await rows(f.db,'SELECT * FROM cas_wallets ORDER BY jrvx_id');
  assert.equal(wallets.length,balances.length);
  for(let i=0;i<balances.length;i++) {assert.equal(wallets[i].currency,'MG');assert.equal(wallets[i].balance,balances[i][1]+Math.ceil(balances[i][0]/300));}
  assert.equal((await rows(f.db,'SELECT * FROM cas_legacy_wallets_v330')).length,balances.length*2);
  const receipts=await rows(f.db,"SELECT * FROM cas_transactions WHERE operation_type='currency_migration'");
  assert.equal(receipts.length,balances.length);assert.equal(receipts.at(-1).amount,3333333334);
});
test('second migration and concurrent migration requests are idempotent',async t=>{
  const f=await fixture(t);const results=await Promise.all([f.migrate(),f.migrate(),f.migrate()]);
  assert.equal(results.filter(r=>!r.duplicate).length,1);assert.equal((await f.migrate()).duplicate,true);
  assert.equal((await f.db.prepare("SELECT balance FROM cas_wallets WHERE currency='MG'").first()).balance,52);
  assert.equal((await rows(f.db,'SELECT * FROM cas_transactions')).length,1);
});
test('no migration occurs without an exhaustive Durable Object audit',async t=>{
  const f=await fixture(t);
  for(const audit of [null,{complete:false,objectCount:0,rooms:[]},{complete:true,objectCount:1,rooms:[]}]) await assert.rejects(f.migrate({inspectAllRooms:async()=>audit}),/complete_room_audit_required/);
  assert.equal((await rows(f.db,'SELECT * FROM cas_wallets')).length,2);
});
test('pending DO financial plans and escrow prevent conversion',async t=>{
  const f=await fixture(t);
  const room={objectId:'opaque-cas-object',pendingPlan:false,active:false,seated:0,pot:0,escrow:0};
  for(const patch of [{pendingPlan:true},{active:true},{seated:1},{pot:1},{escrow:1}]) await assert.rejects(f.migrate({inspectAllRooms:async()=>({complete:true,objectCount:1,rooms:[{...room,...patch}]})}),/economy_games_not_drained/);
});
test('active blackjack aborts the entire batch before backups or wallet replacement',async t=>{
  const f=await fixture(t);await f.db.prepare('UPDATE cas_blackjack_state SET state_json=?').bind(JSON.stringify({currency:'MS',active:true,hands:[{bet:20}]})).run();
  await assert.rejects(f.migrate());
  assert.equal((await rows(f.db,'SELECT * FROM cas_wallets')).length,2);
  assert.equal(await f.db.prepare("SELECT name FROM sqlite_master WHERE name='cas_legacy_wallets_v330'").first(),null);
  assert.equal(await f.db.prepare("SELECT name FROM sqlite_master WHERE name='cas_economy_migrations'").first(),null);
});
test('poker seats or nonzero room pots reject migration even with a stale empty DO report',async t=>{
  const f=await fixture(t);await f.db.prepare("INSERT INTO cas_poker_seats VALUES(?,'room','MS',1)").bind(id(0)).run();
  await assert.rejects(f.migrate());await f.db.prepare('DELETE FROM cas_poker_seats').run();
  await f.db.prepare("INSERT INTO cas_poker_rooms VALUES('room',?,0,1)").bind(JSON.stringify({players:[],pot:10})).run();
  await assert.rejects(f.migrate());assert.equal((await rows(f.db,'SELECT * FROM cas_wallets')).length,2);
});
test('a failure after replacing tables rolls back schema, balances and migration marker',async t=>{
  const f=await fixture(t);const broken=sql.replace('DROP TABLE cas_migration_assert_v330;','INSERT INTO cas_migration_assert_v330 VALUES(0);');
  await assert.rejects(migrateToMg(f.db,{sql:broken,inspectAllRooms:emptyAudit}));
  assert.equal((await rows(f.db,'SELECT * FROM cas_wallets')).length,2);
  assert.equal(await f.db.prepare("SELECT name FROM sqlite_master WHERE name='cas_legacy_wallets_v330'").first(),null);
  assert.equal((await f.migrate()).duplicate,false);
});
test('draining blocks new debits but permits old settled cashouts',async t=>{
  const f=await fixture(t);
  const statement=f.db.prepare("INSERT INTO cas_transactions VALUES(?,?,'MS',?,301,? ,?,'test',?,'{}',1)");
  await assert.rejects(statement.bind('blocked',id(0),-1,300,'roulette_bet',id(0)).run(),/economy_draining/);
  await statement.bind('cashout',id(0),20,321,'poker_cashout',id(0)).run();
  await f.migrate();assert.equal((await f.db.prepare("SELECT balance FROM cas_wallets WHERE currency='MG'").first()).balance,52);
});
test('MG transaction history and progress survive while old MS history is archived exactly',async t=>{
  const f=await fixture(t);await f.db.prepare('UPDATE cas_users SET progression_json=?,stats_json=?').bind('{"xp":1234}','{"poker":{"hands":9}}').run();
  for(const currency of ['MS','MG']) await f.db.prepare("INSERT INTO cas_game_history VALUES(?,?,'roulette','spin',?,1)").bind('old-'+currency,id(0),JSON.stringify({currency,amount:50,profit:-50,progressVersion:0})).run();
  await f.db.prepare("INSERT INTO cas_transactions VALUES('old-mg-ledger',?,'MG',5,50,55,'poker_cashout','poker-room',?,'{\"roomId\":\"old\"}',1)").bind(id(0),id(0)).run();
  const originalLedger=await f.db.prepare("SELECT * FROM cas_transactions WHERE transaction_id='old-mg-ledger'").first();
  await f.migrate();assert.deepEqual((await rows(f.db,'SELECT event_id FROM cas_game_history')).map(x=>x.event_id),['old-MG']);
  assert.equal((await rows(f.db,'SELECT * FROM cas_legacy_game_history_v330')).length,2);
  const user=await f.db.prepare('SELECT progression_json,stats_json FROM cas_users').first();assert.equal(user.progression_json,'{"xp":1234}');assert.equal(user.stats_json,'{"poker":{"hands":9}}');
  assert.deepEqual(await f.db.prepare("SELECT * FROM cas_transactions WHERE transaction_id='old-mg-ledger'").first(),originalLedger);
  assert.equal((await f.db.prepare("SELECT balance FROM cas_wallets WHERE currency='MG'").first()).balance,57);
});
test('new schema rejects retired currency and fractional balances, preserving disabled users funds',async t=>{
  const f=await fixture(t);await f.db.prepare('UPDATE cas_users SET enabled=0').run();await f.migrate();
  assert.equal((await f.db.prepare('SELECT balance FROM cas_wallets').first()).balance,52);
  await assert.rejects(f.db.prepare("UPDATE cas_wallets SET currency='MS'").run());
  await assert.rejects(f.db.prepare('UPDATE cas_wallets SET balance=1.5').run());
  await assert.rejects(f.db.prepare('UPDATE cas_wallets SET balance=9007199254740992').run());
});
test('corrupt or string-valued active blackjack cannot be mistaken for a drained game',async t=>{
  const f=await fixture(t);
  for(const state of ['{"currency":"MS","active":"true"}','{"currency":"MS","active":"0"}','{broken']) {
    await f.db.prepare('UPDATE cas_blackjack_state SET state_json=?').bind(state).run();
    await assert.rejects(f.migrate());
    assert.equal((await rows(f.db,'SELECT * FROM cas_wallets')).length,2);
    assert.equal(await f.db.prepare("SELECT name FROM sqlite_master WHERE name='cas_legacy_wallets_v330'").first(),null);
  }
});
test('drain preserves Double, Split and Insurance charges only for an existing active blackjack round',async t=>{
  const f=await fixture(t);
  await f.db.prepare('UPDATE cas_blackjack_state SET state_json=?').bind(JSON.stringify({currency:'MS',active:true,hands:[{bet:20}]})).run();
  let current=301;
  for(const action of ['double','split','insurance']) {
    const next=current-10;
    await f.db.prepare("INSERT INTO cas_transactions VALUES(?,?,'MS',-10,?,?,'blackjack_bet','blackjack-server',?,?,1)")
      .bind('existing-'+action,id(0),current,next,id(0),JSON.stringify({action,roundId:1})).run();
    current=next;
  }
  for(const action of ['deal','unknown',null]) await assert.rejects(f.db.prepare("INSERT INTO cas_transactions VALUES(?,?,'MS',-10,?,?,'blackjack_bet','blackjack-server',?,?,1)")
    .bind('blocked-'+action,id(0),current,current-10,id(0),JSON.stringify({action,roundId:2})).run(),/economy_draining/);
  await f.db.prepare('UPDATE cas_blackjack_state SET state_json=?').bind(JSON.stringify({currency:'MS',active:false})).run();
  await assert.rejects(f.db.prepare("INSERT INTO cas_transactions VALUES('no-active',?,'MS',-10,?,?,'blackjack_bet','blackjack-server',?,'{\"action\":\"double\"}',1)")
    .bind(id(0),current,current-10,id(0)).run(),/economy_draining/);
  assert.equal((await f.db.prepare("SELECT balance FROM cas_wallets WHERE currency='MS'").first()).balance,current);
});
