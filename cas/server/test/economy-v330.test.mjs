import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createMgEconomy, MG_PACKAGES, DAILY_REWARD_MG, CATALOG_VERSION, utcDayKey } from '../economy-v330.mjs';

// Actual local D1, not an in-memory balance implementation. Provider verification
// is an explicit synthetic adapter; no real payment, identity or network is used.
const localRequire=createRequire(new URL('../package.json',import.meta.url));
const legacyRequire=createRequire(new URL('../../../identity/package.json',import.meta.url));
const require=name=>{let target;try{target=localRequire.resolve(name)}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;target=legacyRequire.resolve(name)}return localRequire(target)};
const { Miniflare, convertV4MiniflareOptions } = require('miniflare');
const mf = new Miniflare(convertV4MiniflareOptions({
  modules: true,
  script: 'export default {fetch(){return new Response("Local CAS economy tests only")}}',
  compatibilityDate: '2026-09-30', compatibilityFlags: ['nodejs_compat'],
  d1Databases: ['DB'],
  outboundService() { throw Error('External requests forbidden in economy tests'); },
}));
let db, serial = 0, providerSerial = 0;
const AT = Date.parse('2026-10-25T12:30:00Z');

// MG-only subset of the existing CAS ledger contract: receipt/ledger rows use the
// same real SQL transaction and optimistic-balance triggers as the Worker.
const schema = [
  `CREATE TABLE cas_users(jrvx_id TEXT PRIMARY KEY,enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN(0,1)))`,
  `CREATE TABLE cas_wallets(jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),currency TEXT NOT NULL CHECK(currency='MG'),
    balance INTEGER NOT NULL CHECK(typeof(balance)='integer' AND balance BETWEEN 0 AND 9007199254740991),
    version INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL,PRIMARY KEY(jrvx_id,currency))`,
  `CREATE TABLE cas_transactions(transaction_id TEXT PRIMARY KEY,jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
    currency TEXT NOT NULL CHECK(currency='MG'),amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,balance_after INTEGER NOT NULL CHECK(balance_after BETWEEN 0 AND 9007199254740991),
    operation_type TEXT NOT NULL,source TEXT NOT NULL,actor_id TEXT,metadata_json TEXT NOT NULL,created_at INTEGER NOT NULL,
    CHECK(balance_after=balance_before+amount))`,
  `CREATE TRIGGER cas_transaction_guard BEFORE INSERT ON cas_transactions BEGIN
    SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_users WHERE jrvx_id=NEW.jrvx_id AND enabled=1)
      THEN RAISE(ABORT,'cas_account_disabled') END;
    SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id
      AND currency=NEW.currency AND balance=NEW.balance_before) THEN RAISE(ABORT,'wallet_balance_mismatch') END;
    END`,
  `CREATE TRIGGER cas_transaction_apply AFTER INSERT ON cas_transactions BEGIN
    UPDATE cas_wallets SET balance=NEW.balance_after,version=version+1,updated_at=NEW.created_at
      WHERE jrvx_id=NEW.jrvx_id AND currency=NEW.currency; END`,
];

before(async () => {
  db = await mf.getD1Database('DB');
  for (const sql of schema) await db.prepare(sql).run();
  const migration = await readFile(new URL('../migrations/002-daily-purchases-v330.sql', import.meta.url), 'utf8');
  await db.batch(migration.split(/^-- statement-breakpoint\r?$/m).map(sql => db.prepare(sql.trim())));
});
after(async () => { await mf.dispose(); });

function ledgerStatement(database, operation, balance) {
  assert.equal(operation.currency, 'MG');
  assert.equal(Number.isSafeInteger(operation.amount), true);
  assert.equal(Number.isSafeInteger(balance + operation.amount), true);
  return database.prepare(`INSERT INTO cas_transactions(transaction_id,jrvx_id,currency,amount,balance_before,
    balance_after,operation_type,source,actor_id,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(operation.transactionId, operation.jrvxId, operation.currency, operation.amount, balance,
      balance + operation.amount, operation.operationType, operation.source, operation.actorId,
      JSON.stringify(operation.metadata), operation.timestamp);
}
function service(options = {}) {
  return createMgEconomy({ ledgerStatement, now: () => AT, contentionDelay: async () => {}, ...options });
}
async function account(balance = 500, enabled = 1) {
  const id = `JRVX-TEST${String(++serial).padStart(8, '0')}`;
  await db.batch([
    db.prepare('INSERT INTO cas_users(jrvx_id,enabled) VALUES(?,?)').bind(id, enabled),
    db.prepare("INSERT INTO cas_wallets(jrvx_id,currency,balance,updated_at) VALUES(?,'MG',?,?)").bind(id, balance, AT),
  ]);
  return id;
}
async function balance(id) {
  return (await db.prepare("SELECT balance FROM cas_wallets WHERE jrvx_id=? AND currency='MG'").bind(id).first()).balance;
}
async function count(table, id) {
  assert.ok(['cas_transactions', 'cas_daily_claims', 'cas_purchases'].includes(table));
  return (await db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE jrvx_id=?`).bind(id).first()).n;
}
function providerFixture() {
  const proofs = new Map(), checkouts = [], verifications = [], fixtureId = ++providerSerial;
  const adapter = {
    async verifyReceipt(proof) {
      verifications.push(proof);
      if (typeof proof !== 'string' || !proofs.has(proof)) throw Error('provider_signature_invalid');
      return structuredClone(proofs.get(proof));
    },
    async createCheckout(input) { checkouts.push(input); return { checkoutId: input.requestId, url: 'https://payments.invalid/test-only' }; },
  };
  const register = (id, pack = MG_PACKAGES[0], extra = {}) => {
    const proof = `opaque-proof-${proofs.size + 1}`;
    proofs.set(proof, { paymentId: `payment-${fixtureId}-${proofs.size + 1}`, accountId: id, packageId: pack.id,
      catalogVersion: CATALOG_VERSION, status: 'succeeded', currency: 'RUB', amountKopecks: pack.priceKopecks, ...extra });
    return proof;
  };
  const economy = service({ providers: { fixture: adapter } });
  return { proofs, checkouts, verifications, adapter, register, economy,
    fulfill: (receipt, accountId) => economy.fulfillVerifiedPurchase(db, { provider: 'fixture', receipt, accountId }) };
}

test('server catalog preserves every ruble price and multiplies pack credits exactly 1000 times', () => {
  assert.deepEqual(MG_PACKAGES.map(p => [p.id, p.amountMG, p.priceKopecks]), [
    ['pack_1', 100000, 11900], ['pack_2', 500000, 49900], ['pack_3', 1000000, 89900],
    ['pack_4', 2000000, 169900], ['pack_5', 3000000, 249900],
  ]);
  assert.equal(Object.isFrozen(MG_PACKAGES), true);
  assert.ok(MG_PACKAGES.every(Object.isFrozen));
  assert.equal(DAILY_REWARD_MG, 10000);
  assert.equal(service().catalog().paymentsAvailable, false);
  assert.deepEqual(service().catalog().providers, []);
});

test('calendar uses server UTC across midnight and rejects invalid server timestamps', () => {
  assert.equal(utcDayKey(Date.parse('2026-10-25T23:59:59.999Z')), '2026-10-25');
  assert.equal(utcDayKey(Date.parse('2026-10-26T00:00:00.000Z')), '2026-10-26');
  for (const invalid of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => utcDayKey(invalid), /invalid_server_time/);
  }
});

test('daily grants exactly 10000 MG and survives a fresh service instance without multiplying old MG', async () => {
  const id = await account(7654321), economy = service();
  const beforeStatus = await economy.dailyStatus(db, id);
  assert.equal(beforeStatus.available, true); assert.equal(beforeStatus.claimed, false);
  const first = await economy.claimDaily(db, id, { clientDate: '2099-01-01', amount: 9000000 });
  assert.equal(first.duplicate, false); assert.deepEqual(first.reward, { amount: 10000, currency: 'MG' });
  assert.equal(first.wallet.MG, 7664321); assert.equal(first.walletRevision.MG, 1);
  const fresh = service(), again = await fresh.claimDaily(db, id);
  assert.equal(again.duplicate, true); assert.equal(again.wallet.MG, 7664321);
  assert.equal((await fresh.dailyStatus(db, id)).claimed, true);
  assert.equal(await count('cas_transactions', id), 1); assert.equal(await count('cas_daily_claims', id), 1);
});

test('24 simultaneous daily requests commit one ledger effect and one claim in actual D1', async () => {
  const id = await account(0), economy = service();
  const replies = await Promise.all(Array.from({ length: 24 }, () => economy.claimDaily(db, id)));
  assert.equal(replies.filter(row => !row.duplicate).length, 1);
  assert.equal(await balance(id), 10000); assert.equal(await count('cas_transactions', id), 1);
  assert.equal(await count('cas_daily_claims', id), 1);
});

test('only a new server UTC date allows a second daily bonus', async () => {
  let serverNow = Date.parse('2026-10-25T23:59:59.999Z');
  const id = await account(5), economy = service({ now: () => serverNow });
  await economy.claimDaily(db, id); assert.equal((await economy.claimDaily(db, id)).duplicate, true);
  serverNow++;
  assert.equal((await economy.dailyStatus(db, id)).claimed, false);
  assert.equal((await economy.claimDaily(db, id)).duplicate, false);
  assert.equal(await balance(id), 20005); assert.equal(await count('cas_daily_claims', id), 2);
});

test('daily status exposes next UTC reset and independent account eligibility', async () => {
  const a = await account(), b = await account(), economy = service();
  await economy.claimDaily(db, a);
  assert.equal((await economy.dailyStatus(db, a)).available, false);
  const status = await economy.dailyStatus(db, b);
  assert.equal(status.available, true); assert.equal(status.timeZone, 'UTC');
  assert.equal(status.nextClaimAt, Date.parse('2026-10-26T00:00:00Z'));
  assert.equal(status.serverTime, AT); assert.equal(await balance(b), 500);
});

test('failure at daily receipt insertion rolls back the preceding real ledger/wallet update', async () => {
  const id = await account(70), economy = service();
  await db.prepare(`CREATE TRIGGER fail_daily_${serial} BEFORE INSERT ON cas_daily_claims
    WHEN NEW.jrvx_id='${id}' BEGIN SELECT RAISE(ABORT,'injected_receipt_failure'); END`).run();
  await assert.rejects(economy.claimDaily(db, id), /injected_receipt_failure/);
  assert.equal(await balance(id), 70); assert.equal(await count('cas_transactions', id), 0);
  assert.equal(await count('cas_daily_claims', id), 0);
});

test('daily rejects disabled, missing and invalid accounts without an economic write', async () => {
  const id = await account(25, 0), economy = service();
  assert.equal((await economy.dailyStatus(db, id)).available, false);
  await assert.rejects(economy.claimDaily(db, id), /cas_account_disabled/);
  await assert.rejects(economy.claimDaily(db, 'JRVX-NONE00000000'), /cas_user_not_found/);
  await assert.rejects(economy.claimDaily(db, '__proto__'), /invalid_jrvx_id/);
  assert.equal(await balance(id), 25); assert.equal(await count('cas_transactions', id), 0);
});

test('daily checks safe-integer overflow before writing any ledger or claim', async () => {
  const id = await account(Number.MAX_SAFE_INTEGER - 9999);
  await assert.rejects(service().claimDaily(db, id), /balance_limit/);
  assert.equal(await balance(id), Number.MAX_SAFE_INTEGER - 9999);
  assert.equal(await count('cas_transactions', id), 0); assert.equal(await count('cas_daily_claims', id), 0);
});

test('a delayed daily existence read still returns a duplicate when the first claim fills the balance cap', async () => {
  const id = await account(40000), economy = service({ maxBalance: 50000 }); let delayed = false;
  const interleaved = {
    prepare(sql) { const stmt = db.prepare(sql); return { bind(...args) {
      const bound = stmt.bind(...args);
      if (!sql.startsWith('SELECT transaction_id,amount_mg')) return bound;
      return { async first() { const row = await bound.first(); if (!delayed) { delayed = true; await economy.claimDaily(db, id); } return row; } };
    } }; },
    batch: statements => db.batch(statements),
  };
  const result = await economy.claimDaily(interleaved, id);
  assert.equal(result.duplicate, true); assert.equal(await balance(id), 50000);
  assert.equal(await count('cas_transactions', id), 1);
});

test('claim receipt SQL guard refuses a claim without a matching MG ledger record', async () => {
  const id = await account();
  await assert.rejects(db.prepare('INSERT INTO cas_daily_claims VALUES(?,?,?,?,?)')
    .bind(id, '2026-10-25', 10000, 'missing-ledger', AT).run(), /daily_receipt_ledger_mismatch/);
  assert.equal(await balance(id), 500); assert.equal(await count('cas_daily_claims', id), 0);
});

test('all five verified packs credit their server catalog quantities, with original MG preserved', async () => {
  const id = await account(77), f = providerFixture();
  for (const pack of MG_PACKAGES) {
    const reply = await f.fulfill(f.register(id, pack), id);
    assert.equal(reply.amountMG, pack.amountMG); assert.equal(reply.duplicate, false);
  }
  assert.equal(await balance(id), 6600077);
  assert.equal(await count('cas_purchases', id), 5); assert.equal(await count('cas_transactions', id), 5);
});

test('untrusted verified flags or credit amounts cannot bypass the configured provider verifier', async () => {
  const id = await account(1), f = providerFixture();
  await assert.rejects(f.fulfill({ verified: true, accountId: id, packageId: 'pack_5', amountMG: 999999999 }), /provider_signature_invalid/);
  const proof = f.register(id);
  const result = await f.economy.fulfillVerifiedPurchase(db, { provider: 'fixture', receipt: proof, accountId: id, amountMG: 999999999 });
  assert.equal(result.amountMG, 100000); assert.equal(await balance(id), 100001);
});

test('unavailable providers cannot create checkout or fulfill receipts', async () => {
  const id = await account(), economy = service();
  await assert.rejects(economy.createCheckout(db, id, 'pack_1', { provider: 'missing', requestId: 'request-0001' }), /payment_unavailable/);
  await assert.rejects(economy.fulfillVerifiedPurchase(db, { provider: 'missing', receipt: 'forged' }), /payment_unavailable/);
  assert.equal(await count('cas_transactions', id), 0);
});

test('unsettled, old-catalog, altered-price and malformed verified replies cannot credit', async () => {
  const id = await account(9), f = providerFixture();
  for (const [change, expected] of [
    [{ status: 'pending' }, /payment_not_settled/],
    [{ catalogVersion: 'old-catalog' }, /payment_catalog_mismatch/],
    [{ currency: 'USD' }, /payment_amount_mismatch/],
    [{ amountKopecks: 1 }, /payment_amount_mismatch/],
    [{ amountKopecks: '11900' }, /payment_amount_mismatch/],
    [{ packageId: '__proto__' }, /invalid_package/],
    [{ paymentId: '' }, /invalid_payment_id/],
    [{ accountId: 'unknown' }, /invalid_jrvx_id/],
  ]) await assert.rejects(f.fulfill(f.register(id, MG_PACKAGES[0], change)), expected);
  assert.equal(await balance(id), 9); assert.equal(await count('cas_purchases', id), 0);
  assert.equal(await count('cas_transactions', id), 0);
});

test('24 concurrent valid receipts for one payment award only one purchase', async () => {
  const id = await account(3), f = providerFixture(), proof = f.register(id, MG_PACKAGES[4]);
  const replies = await Promise.all(Array.from({ length: 24 }, () => f.fulfill(proof, id)));
  assert.equal(replies.filter(row => !row.duplicate).length, 1);
  assert.equal(await balance(id), 3000003); assert.equal(await count('cas_purchases', id), 1);
  assert.equal(await count('cas_transactions', id), 1);
});

test('simultaneous different purchases and daily bonus preserve every credit through ledger contention', async () => {
  const id = await account(0), f = providerFixture();
  await Promise.all([
    ...MG_PACKAGES.map(pack => f.fulfill(f.register(id, pack), id)),
    f.economy.claimDaily(db, id),
  ]);
  assert.equal(await balance(id), 6610000); assert.equal(await count('cas_transactions', id), 6);
  assert.equal(await count('cas_purchases', id), 5); assert.equal(await count('cas_daily_claims', id), 1);
});

test('one provider payment cannot be replayed for a different package', async () => {
  const id = await account(0), f = providerFixture(), proof = f.register(id);
  const verified = f.proofs.get(proof); await f.fulfill(proof);
  const changed = f.register(id, MG_PACKAGES[1], { paymentId: verified.paymentId });
  await assert.rejects(f.fulfill(changed), /purchase_receipt_conflict/);
  assert.equal(await balance(id), 100000); assert.equal(await count('cas_transactions', id), 1);
});

test('one provider payment cannot be reassigned to another account; restore is owner-scoped', async () => {
  const a = await account(0), b = await account(0), f = providerFixture(), proof = f.register(a);
  await assert.rejects(f.fulfill(proof, b), /purchase_owner_mismatch/);
  await f.fulfill(proof, a);
  const changed = f.register(b, MG_PACKAGES[0], { paymentId: f.proofs.get(proof).paymentId });
  await assert.rejects(f.fulfill(changed, b), /purchase_receipt_conflict/);
  assert.equal(await balance(a), 100000); assert.equal(await balance(b), 0);
  assert.equal(await count('cas_transactions', b), 0);
});

test('purchase receipt insertion failure rolls back its real D1 credit and ledger', async () => {
  const id = await account(12), f = providerFixture(), proof = f.register(id);
  await db.prepare(`CREATE TRIGGER fail_purchase_${serial} BEFORE INSERT ON cas_purchases
    WHEN NEW.jrvx_id='${id}' BEGIN SELECT RAISE(ABORT,'injected_purchase_failure'); END`).run();
  await assert.rejects(f.fulfill(proof), /injected_purchase_failure/);
  assert.equal(await balance(id), 12); assert.equal(await count('cas_purchases', id), 0);
  assert.equal(await count('cas_transactions', id), 0);
});

test('ledger failure cannot leave a successful purchase receipt', async () => {
  const id = await account(12), f = providerFixture(), proof = f.register(id);
  await db.prepare(`CREATE TRIGGER fail_ledger_${serial} BEFORE INSERT ON cas_transactions
    WHEN NEW.jrvx_id='${id}' BEGIN SELECT RAISE(ABORT,'injected_ledger_failure'); END`).run();
  await assert.rejects(f.fulfill(proof), /injected_ledger_failure/);
  assert.equal(await balance(id), 12); assert.equal(await count('cas_purchases', id), 0);
  assert.equal(await count('cas_transactions', id), 0);
});

test('purchase overflow and disabled accounts fail before any receipt or ledger write', async () => {
  const overflow = await account(Number.MAX_SAFE_INTEGER - 99999), disabled = await account(4, 0), f = providerFixture();
  await assert.rejects(f.fulfill(f.register(overflow)), /balance_limit/);
  await assert.rejects(f.fulfill(f.register(disabled)), /cas_account_disabled/);
  for (const id of [overflow, disabled]) {
    assert.equal(await count('cas_transactions', id), 0); assert.equal(await count('cas_purchases', id), 0);
  }
});

test('restoring an earlier receipt returns current MG and does not credit it again', async () => {
  const id = await account(23), f = providerFixture(), proof = f.register(id);
  await f.fulfill(proof); await f.economy.claimDaily(db, id);
  const newService = service({ providers: { fixture: f.adapter } });
  const restored = await newService.fulfillVerifiedPurchase(db, { provider: 'fixture', receipt: proof, accountId: id });
  assert.equal(restored.duplicate, true); assert.equal(restored.wallet.MG, 110023);
  assert.equal(await count('cas_purchases', id), 1); assert.equal(await count('cas_transactions', id), 2);
});

test('purchase history is exact, bounded and isolated to the requested authenticated account', async () => {
  const a = await account(0), b = await account(0), f = providerFixture();
  await f.fulfill(f.register(a, MG_PACKAGES[1])); await f.fulfill(f.register(b, MG_PACKAGES[2]));
  const history = await f.economy.listPurchases(db, a);
  assert.equal(history.purchases.length, 1); assert.equal(history.purchases[0].amountMG, 500000);
  assert.equal(history.purchases[0].priceKopecks, 49900); assert.equal(history.purchases[0].paymentCurrency, 'RUB');
  await assert.rejects(f.economy.listPurchases(db, a, 101), /invalid_limit/);
});

test('checkout passes only authoritative server package prices, amounts and account metadata', async () => {
  const id = await account(0), f = providerFixture();
  for (const pack of MG_PACKAGES) {
    await f.economy.createCheckout(db, id, pack.id, { provider: 'fixture', requestId: 'checkout-' + pack.id,
      amountMG: 999999999, amountKopecks: 1, accountId: 'forged' });
    assert.deepEqual(f.checkouts.at(-1), { accountId: id, packageId: pack.id, catalogVersion: CATALOG_VERSION,
      amountKopecks: pack.priceKopecks, paymentCurrency: 'RUB', amountMG: pack.amountMG, requestId: 'checkout-' + pack.id });
  }
  assert.equal(await balance(id), 0); assert.equal(await count('cas_transactions', id), 0);
});

test('checkout rejects unknown packages, disabled accounts and invalid idempotency keys', async () => {
  const id = await account(0), disabled = await account(0, 0), f = providerFixture();
  await assert.rejects(f.economy.createCheckout(db, id, 'pack_6', { provider: 'fixture', requestId: 'request-001' }), /invalid_package/);
  await assert.rejects(f.economy.createCheckout(db, disabled, 'pack_1', { provider: 'fixture', requestId: 'request-001' }), /cas_account_disabled/);
  await assert.rejects(f.economy.createCheckout(db, id, 'pack_1', { provider: 'fixture', requestId: '' }), /invalid_checkout_request_id/);
  assert.equal(f.checkouts.length, 0);
});

test('database rejects a purchase receipt with a mismatched ledger owner even for a valid pack', async () => {
  const a = await account(0), b = await account(0), tx = `test-ledger-owner-${serial}`;
  const operation = { transactionId: tx, jrvxId: a, currency: 'MG', amount: 100000, operationType: 'purchase_credit',
    source: 'test', actorId: a, metadata: {}, timestamp: AT };
  await assert.rejects(db.batch([
    ledgerStatement(db, operation, 0),
    db.prepare('INSERT INTO cas_purchases VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind('fixture', 'wrong-owner-' + serial, b, 'pack_1', CATALOG_VERSION, 100000, 11900, 'RUB', tx, AT),
  ]), /purchase_receipt_ledger_mismatch/);
  assert.equal(await balance(a), 0); assert.equal(await count('cas_transactions', a), 0);
  assert.equal(await count('cas_purchases', b), 0);
});

test('database enforces the configured package quantity and price inside the transaction', async () => {
  const id = await account(0), tx = `test-ledger-pack-${serial}`;
  const operation = { transactionId: tx, jrvxId: id, currency: 'MG', amount: 100000, operationType: 'purchase_credit',
    source: 'test', actorId: id, metadata: {}, timestamp: AT };
  await assert.rejects(db.batch([
    ledgerStatement(db, operation, 0),
    db.prepare('INSERT INTO cas_purchases VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind('fixture', 'wrong-price-' + serial, id, 'pack_1', CATALOG_VERSION, 100000, 1, 'RUB', tx, AT),
  ]), /CHECK constraint failed/);
  assert.equal(await balance(id), 0); assert.equal(await count('cas_transactions', id), 0);
});

test('configuration rejects unsafe limits and missing ledger injection', () => {
  assert.throws(() => createMgEconomy(), /ledger_statement_required/);
  for (const maxBalance of [NaN, Infinity, 9999, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => service({ maxBalance }), /invalid_balance_limit/);
  }
});
