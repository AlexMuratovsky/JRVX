/**
 * CAS-only MG catalog, daily bonus and provider-verified purchase fulfillment.
 *
 * The caller injects the existing CAS ledgerStatement(db, operation, balance).
 * It must preserve the ledger's unique IDs and balance compare-and-swap triggers.
 * No operation accepts a client-selected credit or a client `verified` flag.
 *
 * A server-configured provider implements:
 *   createCheckout({ accountId, packageId, catalogVersion, amountKopecks,
 *                    paymentCurrency, amountMG, requestId })
 *   verifyReceipt(opaqueReceipt) -> { paymentId, accountId, packageId,
 *     catalogVersion:'mg-v330', status:'succeeded', currency:'RUB', amountKopecks }
 * Verification must authenticate the provider response/signature, not echo JSON.
 * Existing provider payment/order metadata must bind the account and package.
 * Unknown/old catalog versions fail closed rather than retroactively issuing
 * the enlarged pack. An empty provider configuration disables payments.
 */

export const CATALOG_VERSION = 'mg-v330';
export const DAILY_REWARD_MG = 10_000;
export const MG_PACKAGES = Object.freeze([
  Object.freeze({ id: 'pack_1', amountMG: 100_000, priceKopecks: 11_900 }),
  Object.freeze({ id: 'pack_2', amountMG: 500_000, priceKopecks: 49_900 }),
  Object.freeze({ id: 'pack_3', amountMG: 1_000_000, priceKopecks: 89_900 }),
  Object.freeze({ id: 'pack_4', amountMG: 2_000_000, priceKopecks: 169_900 }),
  Object.freeze({ id: 'pack_5', amountMG: 3_000_000, priceKopecks: 249_900 }),
]);

const ACCOUNT = /^JRVX-[A-Z]{4}\d{8}$/;
const PROVIDER = /^[a-z0-9][a-z0-9_-]{0,47}$/;
const PAYMENT_ID = /^[A-Za-z0-9:._-]{1,180}$/;
const REQUEST_ID = /^[A-Za-z0-9:._-]{8,100}$/;
const DAY_MS = 86_400_000;

function validAccount(id) {
  if (typeof id !== 'string' || !ACCOUNT.test(id)) throw Error('invalid_jrvx_id');
  return id;
}

function packageById(id) {
  const pack = MG_PACKAGES.find(item => item.id === id);
  if (!pack) throw Error('invalid_package');
  return pack;
}

function timestamp(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 8_640_000_000_000_000) {
    throw Error('invalid_server_time');
  }
  return value;
}

export function utcDayKey(serverTimestamp = Date.now()) {
  return new Date(timestamp(serverTimestamp)).toISOString().slice(0, 10);
}

function retryable(error) {
  return /wallet_balance_mismatch|UNIQUE constraint failed: cas_(?:daily_claims|purchases|transactions)/.test(String(error));
}

async function purchaseTransactionId(provider, paymentId) {
  const bytes = new TextEncoder().encode(JSON.stringify([provider, paymentId]));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return 'purchase:v330:' + Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Create one service for the server module; all mutable state remains in D1. */
export function createMgEconomy({
  ledgerStatement,
  now = () => Date.now(),
  maxBalance = Number.MAX_SAFE_INTEGER,
  providers = {},
  contentionDelay = attempt => new Promise(resolve => setTimeout(resolve, Math.min(80, 4 * (attempt + 1)))),
  retries = 24,
} = {}) {
  if (typeof ledgerStatement !== 'function') throw Error('ledger_statement_required');
  if (!Number.isSafeInteger(maxBalance) || maxBalance < DAILY_REWARD_MG) throw Error('invalid_balance_limit');
  if (!Number.isInteger(retries) || retries < 1 || retries > 64) throw Error('invalid_retry_limit');
  if (typeof now !== 'function' || typeof contentionDelay !== 'function') throw Error('invalid_economy_configuration');
  const adapters = new Map(Object.entries(providers).map(([id, adapter]) => {
    if (!PROVIDER.test(id) || !adapter || typeof adapter.verifyReceipt !== 'function') {
      throw Error('invalid_payment_provider');
    }
    return [id, adapter];
  }));

  function providerById(id) {
    if (typeof id !== 'string' || !PROVIDER.test(id) || !adapters.has(id)) throw Error('payment_unavailable');
    return adapters.get(id);
  }

  async function wallet(db, id, requireEnabled = false) {
    validAccount(id);
    const row = await db.prepare(`SELECT u.enabled,w.balance,w.version
      FROM cas_users u LEFT JOIN cas_wallets w ON w.jrvx_id=u.jrvx_id AND w.currency='MG'
      WHERE u.jrvx_id=?`).bind(id).first();
    if (!row) throw Error('cas_user_not_found');
    if (requireEnabled && row.enabled !== 1) throw Error('cas_account_disabled');
    if (row.balance === null || row.balance === undefined || !Number.isSafeInteger(row.balance)
      || row.balance < 0 || row.balance > maxBalance) throw Error('invalid_stored_wallet');
    if (!Number.isSafeInteger(row.version) || row.version < 0) throw Error('invalid_wallet_version');
    return { balance: row.balance, version: row.version, enabled: row.enabled === 1 };
  }

  function balanceAfter(balance, amount) {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('invalid_credit');
    const after = balance + amount;
    if (!Number.isSafeInteger(after) || after > maxBalance) throw Error('balance_limit');
    return after;
  }

  async function snapshot(db, id) {
    const current = await wallet(db, id);
    return { wallet: { MG: current.balance }, walletRevision: { MG: current.version } };
  }

  function catalog() {
    return {
      version: CATALOG_VERSION,
      currency: 'MG',
      paymentCurrency: 'RUB',
      packages: MG_PACKAGES,
      paymentsAvailable: [...adapters.values()].some(adapter => typeof adapter.createCheckout === 'function'),
      providers: [...adapters].filter(([, adapter]) => typeof adapter.createCheckout === 'function').map(([id]) => id),
    };
  }

  async function dailyStatus(db, id) {
    validAccount(id);
    const at = timestamp(now()), day = utcDayKey(at);
    const [current, receipt] = await Promise.all([
      wallet(db, id),
      db.prepare('SELECT transaction_id,created_at FROM cas_daily_claims WHERE jrvx_id=? AND day=?').bind(id, day).first(),
    ]);
    return {
      currency: 'MG', amount: DAILY_REWARD_MG, day, timeZone: 'UTC',
      claimed: !!receipt, available: current.enabled && !receipt,
      claimedAt: receipt?.created_at ?? null,
      nextClaimAt: (Math.floor(at / DAY_MS) + 1) * DAY_MS,
      serverTime: at,
    };
  }

  async function claimDaily(db, id) {
    validAccount(id);
    const at = timestamp(now()), day = utcDayKey(at);
    const transactionId = `daily_bonus:v330:${id}:${day}`;
    const existing = () => db.prepare('SELECT transaction_id,amount_mg FROM cas_daily_claims WHERE jrvx_id=? AND day=?').bind(id, day).first();
    const response = async duplicate => ({
      ok: true, duplicate, claimDay: day, transactionId,
      reward: { amount: DAILY_REWARD_MG, currency: 'MG' },
      ...await snapshot(db, id), daily: await dailyStatus(db, id),
    });
    const readExisting = async () => {
      const receipt = await existing();
      if (!receipt) return false;
      if (receipt.transaction_id !== transactionId || receipt.amount_mg !== DAILY_REWARD_MG) throw Error('daily_receipt_conflict');
      return true;
    };
    if (await readExisting()) return response(true);
    for (let attempt = 0; attempt < retries; attempt++) {
      const operation = {
        transactionId, jrvxId: id, currency: 'MG', amount: DAILY_REWARD_MG,
        operationType: 'daily_bonus', source: 'daily-server-v330', actorId: id,
        metadata: { day, timeZone: 'UTC', amountMG: DAILY_REWARD_MG }, timestamp: at,
      };
      try {
        const current = await wallet(db, id, true);
        balanceAfter(current.balance, DAILY_REWARD_MG);
        await db.batch([
          ledgerStatement(db, operation, current.balance),
          db.prepare('INSERT INTO cas_daily_claims(jrvx_id,day,amount_mg,transaction_id,created_at) VALUES(?,?,?,?,?)')
            .bind(id, day, DAILY_REWARD_MG, transactionId, at),
        ]);
        return response(false);
      } catch (error) {
        if (await readExisting()) return response(true);
        if (!retryable(error) || attempt === retries - 1) throw error;
        await contentionDelay(attempt);
      }
    }
    throw Error('daily_retry_exhausted');
  }

  async function createCheckout(db, id, packageId, { provider, requestId } = {}) {
    validAccount(id);
    const pack = packageById(packageId), adapter = providerById(provider);
    if (typeof adapter.createCheckout !== 'function') throw Error('payment_unavailable');
    if (typeof requestId !== 'string' || !REQUEST_ID.test(requestId)) throw Error('invalid_checkout_request_id');
    await wallet(db, id, true);
    // The configured adapter owns authenticated provider API calls and durable
    // order/request idempotency. No charge or credit occurs in this module here.
    return adapter.createCheckout({
      accountId: id, packageId: pack.id, catalogVersion: CATALOG_VERSION,
      amountKopecks: pack.priceKopecks, paymentCurrency: 'RUB', amountMG: pack.amountMG, requestId,
    });
  }

  async function fulfillVerifiedPurchase(db, { provider, receipt, accountId } = {}) {
    const adapter = providerById(provider);
    if (accountId !== undefined) validAccount(accountId);
    // `receipt` is opaque proof. Only the configured server verifier can produce
    // the authoritative fields below. An untrusted `verified:true` is useless.
    const verified = await adapter.verifyReceipt(receipt);
    if (!verified || typeof verified !== 'object' || Array.isArray(verified)) throw Error('invalid_payment_verification');
    if (verified.status !== 'succeeded') throw Error('payment_not_settled');
    const id = validAccount(verified.accountId), pack = packageById(verified.packageId);
    if (accountId !== undefined && accountId !== id) throw Error('purchase_owner_mismatch');
    if (verified.catalogVersion !== CATALOG_VERSION) throw Error('payment_catalog_mismatch');
    if (typeof verified.paymentId !== 'string' || !PAYMENT_ID.test(verified.paymentId)) throw Error('invalid_payment_id');
    if (verified.currency !== 'RUB' || verified.amountKopecks !== pack.priceKopecks) throw Error('payment_amount_mismatch');
    const paymentId = verified.paymentId, at = timestamp(now());
    const transactionId = await purchaseTransactionId(provider, paymentId);
    const existing = () => db.prepare('SELECT * FROM cas_purchases WHERE provider=? AND payment_id=?').bind(provider, paymentId).first();
    const response = async duplicate => ({
      ok: true, duplicate, provider, paymentId, packageId: pack.id, transactionId,
      amountMG: pack.amountMG, currency: 'MG', ...await snapshot(db, id),
    });
    const readExisting = async () => {
      const row = await existing();
      if (!row) return false;
      if (row.jrvx_id !== id || row.package_id !== pack.id || row.catalog_version !== CATALOG_VERSION
        || row.amount_mg !== pack.amountMG || row.amount_kopecks !== pack.priceKopecks
        || row.payment_currency !== 'RUB' || row.transaction_id !== transactionId) throw Error('purchase_receipt_conflict');
      return true;
    };
    if (await readExisting()) return response(true);
    for (let attempt = 0; attempt < retries; attempt++) {
      const operation = {
        transactionId, jrvxId: id, currency: 'MG', amount: pack.amountMG,
        operationType: 'purchase_credit', source: 'purchase-server-v330', actorId: id,
        metadata: { provider, paymentId, packageId: pack.id, catalogVersion: CATALOG_VERSION,
          amountKopecks: pack.priceKopecks, paymentCurrency: 'RUB', amountMG: pack.amountMG }, timestamp: at,
      };
      try {
        const current = await wallet(db, id, true);
        balanceAfter(current.balance, pack.amountMG);
        await db.batch([
          ledgerStatement(db, operation, current.balance),
          db.prepare(`INSERT INTO cas_purchases(provider,payment_id,jrvx_id,package_id,catalog_version,
            amount_mg,amount_kopecks,payment_currency,transaction_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
            .bind(provider, paymentId, id, pack.id, CATALOG_VERSION, pack.amountMG, pack.priceKopecks, 'RUB', transactionId, at),
        ]);
        return response(false);
      } catch (error) {
        if (await readExisting()) return response(true);
        if (!retryable(error) || attempt === retries - 1) throw error;
        await contentionDelay(attempt);
      }
    }
    throw Error('purchase_retry_exhausted');
  }

  async function listPurchases(db, id, limit = 50) {
    validAccount(id);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw Error('invalid_limit');
    await wallet(db, id);
    const rows = await db.prepare(`SELECT provider,payment_id,package_id,amount_mg,amount_kopecks,
      payment_currency,transaction_id,created_at FROM cas_purchases WHERE jrvx_id=?
      ORDER BY created_at DESC,provider,payment_id LIMIT ?`).bind(id, limit).all();
    return { ok: true, purchases: (rows.results || []).map(row => ({
      provider: row.provider, paymentId: row.payment_id, packageId: row.package_id,
      amountMG: row.amount_mg, priceKopecks: row.amount_kopecks, paymentCurrency: row.payment_currency,
      transactionId: row.transaction_id, createdAt: row.created_at,
    })) };
  }

  return Object.freeze({ catalog, dailyStatus, claimDaily, createCheckout, fulfillVerifiedPurchase, listPurchases });
}
