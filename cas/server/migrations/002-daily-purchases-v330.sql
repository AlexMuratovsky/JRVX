-- CAS only. Apply after the MG-only wallet/ledger migration.
-- Ledger rows and these receipts must be inserted in the same D1 batch.
CREATE TABLE IF NOT EXISTS cas_daily_claims (
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  day TEXT NOT NULL CHECK(length(day)=10 AND day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  amount_mg INTEGER NOT NULL CHECK(amount_mg=10000),
  transaction_id TEXT NOT NULL UNIQUE REFERENCES cas_transactions(transaction_id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(jrvx_id,day)
);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS cas_purchases (
  provider TEXT NOT NULL CHECK(length(provider) BETWEEN 1 AND 48),
  payment_id TEXT NOT NULL CHECK(length(payment_id) BETWEEN 1 AND 180),
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  package_id TEXT NOT NULL CHECK(package_id IN ('pack_1','pack_2','pack_3','pack_4','pack_5')),
  catalog_version TEXT NOT NULL CHECK(catalog_version='mg-v330'),
  amount_mg INTEGER NOT NULL CHECK(amount_mg=CASE package_id
    WHEN 'pack_1' THEN 100000 WHEN 'pack_2' THEN 500000 WHEN 'pack_3' THEN 1000000
    WHEN 'pack_4' THEN 2000000 WHEN 'pack_5' THEN 3000000 END),
  amount_kopecks INTEGER NOT NULL CHECK(amount_kopecks=CASE package_id
    WHEN 'pack_1' THEN 11900 WHEN 'pack_2' THEN 49900 WHEN 'pack_3' THEN 89900
    WHEN 'pack_4' THEN 169900 WHEN 'pack_5' THEN 249900 END),
  payment_currency TEXT NOT NULL CHECK(payment_currency='RUB'),
  transaction_id TEXT NOT NULL UNIQUE REFERENCES cas_transactions(transaction_id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(provider,payment_id)
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS cas_purchases_user_time
  ON cas_purchases(jrvx_id,created_at DESC);

-- statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cas_daily_claim_ledger_guard_v330 BEFORE INSERT ON cas_daily_claims
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM cas_transactions WHERE transaction_id=NEW.transaction_id
      AND jrvx_id=NEW.jrvx_id AND currency='MG' AND amount=10000 AND operation_type='daily_bonus'
  ) THEN RAISE(ABORT,'daily_receipt_ledger_mismatch') END;
END;

-- statement-breakpoint
CREATE TRIGGER IF NOT EXISTS cas_purchase_ledger_guard_v330 BEFORE INSERT ON cas_purchases
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM cas_transactions WHERE transaction_id=NEW.transaction_id
      AND jrvx_id=NEW.jrvx_id AND currency='MG' AND amount=NEW.amount_mg AND operation_type='purchase_credit'
  ) THEN RAISE(ABORT,'purchase_receipt_ledger_mismatch') END;
END;
