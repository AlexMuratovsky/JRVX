-- Execute all marked statements in ONE D1 batch, through migration-v330.mjs.
-- Historical tables are private CAS backups, never active currency sources.
CREATE TABLE IF NOT EXISTS cas_economy_migrations (
  version TEXT PRIMARY KEY, completed_at INTEGER NOT NULL,
  backup_wallets INTEGER NOT NULL, rate INTEGER NOT NULL CHECK(rate=300)
);
-- statement-breakpoint
INSERT INTO cas_economy_migrations(version,completed_at,backup_wallets,rate)
SELECT 'mg-v330',unixepoch()*1000,COUNT(*),300 FROM cas_wallets;
-- statement-breakpoint
CREATE TABLE cas_migration_assert_v330 (ok INTEGER NOT NULL CHECK(ok=1));
-- statement-breakpoint
INSERT INTO cas_migration_assert_v330 VALUES(
 CASE WHEN (SELECT phase FROM cas_economy_control WHERE id=1)='draining'
 AND NOT EXISTS(SELECT 1 FROM cas_blackjack_state WHERE NOT json_valid(state_json) OR COALESCE(json_extract(state_json,'$.active'),0)<>0)
 AND NOT EXISTS(SELECT 1 FROM cas_poker_seats)
 AND NOT EXISTS(SELECT 1 FROM cas_poker_rooms WHERE NOT json_valid(summary_json)
  OR COALESCE(json_extract(summary_json,'$.pot'),0)<>0
  OR COALESCE(json_extract(summary_json,'$.active'),0)<>0
  OR COALESCE(json_array_length(summary_json,'$.players'),0)<>0
  OR COALESCE(json_extract(summary_json,'$.seated'),0)<>0)
 AND NOT EXISTS(SELECT 1 FROM cas_wallets WHERE currency NOT IN ('MS','MG') OR typeof(balance)<>'integer' OR balance<0 OR balance>1000000000000)
 AND NOT EXISTS(SELECT 1 FROM cas_users u WHERE NOT EXISTS(SELECT 1 FROM cas_wallets w WHERE w.jrvx_id=u.jrvx_id AND w.currency='MG'))
 THEN 1 ELSE 0 END);
-- statement-breakpoint
CREATE TABLE cas_legacy_wallets_v330 AS SELECT * FROM cas_wallets;
-- statement-breakpoint
CREATE TABLE cas_legacy_transactions_v330 AS SELECT * FROM cas_transactions;
-- statement-breakpoint
CREATE TABLE cas_legacy_blackjack_state_v330 AS SELECT * FROM cas_blackjack_state;
-- statement-breakpoint
CREATE TABLE cas_legacy_blackjack_actions_v330 AS SELECT * FROM cas_blackjack_actions;
-- statement-breakpoint
CREATE TABLE cas_legacy_game_history_v330 AS SELECT * FROM cas_game_history;
-- statement-breakpoint
CREATE TABLE cas_legacy_poker_rooms_v330 AS SELECT * FROM cas_poker_rooms;
-- statement-breakpoint
CREATE TABLE cas_legacy_poker_seats_v330 AS SELECT * FROM cas_poker_seats;
-- statement-breakpoint
DROP TRIGGER IF EXISTS cas_admin_snapshot_guard_v3017;
-- statement-breakpoint
DROP TRIGGER IF EXISTS cas_economy_drain_debits_v330;
-- statement-breakpoint
DROP TABLE cas_transactions;
-- statement-breakpoint
DROP TABLE cas_wallets;
-- statement-breakpoint
CREATE TABLE cas_wallets (
 jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
 currency TEXT NOT NULL CHECK(currency='MG'),
 balance INTEGER NOT NULL DEFAULT 0 CHECK(typeof(balance)='integer' AND balance BETWEEN 0 AND 9007199254740991),
 updated_at INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(jrvx_id,currency)
);
-- statement-breakpoint
INSERT INTO cas_wallets SELECT jrvx_id,'MG',balance,updated_at,version FROM cas_legacy_wallets_v330 WHERE currency='MG';
-- statement-breakpoint
CREATE TABLE cas_transactions (
 transaction_id TEXT PRIMARY KEY,jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
 currency TEXT NOT NULL CHECK(currency='MG'),
 amount INTEGER NOT NULL CHECK(typeof(amount)='integer' AND
  (amount BETWEEN -1000000000 AND 1000000000 OR (operation_type='currency_migration' AND amount BETWEEN 0 AND 9007199254740991) OR (operation_type='admin_adjustment' AND amount BETWEEN -9007199254740991 AND 9007199254740991))),
 balance_before INTEGER NOT NULL CHECK(typeof(balance_before)='integer' AND balance_before BETWEEN 0 AND 9007199254740991),
 balance_after INTEGER NOT NULL CHECK(typeof(balance_after)='integer' AND balance_after BETWEEN 0 AND 9007199254740991),
 operation_type TEXT NOT NULL,source TEXT NOT NULL,actor_id TEXT,
 metadata_json TEXT NOT NULL DEFAULT '{}',created_at INTEGER NOT NULL,
 CHECK(balance_after=balance_before+amount)
);
-- statement-breakpoint
INSERT INTO cas_transactions SELECT * FROM cas_legacy_transactions_v330 WHERE currency='MG';
-- statement-breakpoint
CREATE INDEX cas_transactions_player_created_v330 ON cas_transactions(jrvx_id,created_at DESC);
-- statement-breakpoint
CREATE TRIGGER cas_transaction_guard BEFORE INSERT ON cas_transactions BEGIN
 SELECT CASE WHEN NEW.operation_type IN ('blackjack_bet','roulette_bet','poker_buyin','poker_rebuy')
 AND NOT EXISTS(SELECT 1 FROM cas_users WHERE jrvx_id=NEW.jrvx_id AND enabled=1)
 THEN RAISE(ABORT,'cas_account_disabled') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id AND currency='MG' AND balance=NEW.balance_before)
 THEN RAISE(ABORT,'wallet_balance_mismatch') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_transaction_apply AFTER INSERT ON cas_transactions BEGIN
 UPDATE cas_wallets SET balance=NEW.balance_after,version=version+1,updated_at=NEW.created_at WHERE jrvx_id=NEW.jrvx_id AND currency='MG';
END;
-- statement-breakpoint
INSERT INTO cas_transactions(transaction_id,jrvx_id,currency,amount,balance_before,balance_after,operation_type,source,actor_id,metadata_json,created_at)
SELECT 'migration:mg-v330:'||w.jrvx_id,w.jrvx_id,'MG',
 (COALESCE(s.balance,0)+299)/300,w.balance,w.balance+(COALESCE(s.balance,0)+299)/300,
 'currency_migration','mg-v330-migration',w.jrvx_id,
 json_object('rate',300,'rounding','ceil','legacyBalance',COALESCE(s.balance,0),'previousMG',w.balance),unixepoch()*1000
FROM cas_wallets w LEFT JOIN cas_legacy_wallets_v330 s ON s.jrvx_id=w.jrvx_id AND s.currency='MS';
-- statement-breakpoint
DELETE FROM cas_blackjack_actions WHERE json_extract(result_json,'$.currency')='MS';
-- statement-breakpoint
UPDATE cas_blackjack_state SET state_json=json_object('roundId',COALESCE(json_extract(state_json,'$.roundId'),0),'currency','MG','hands',json('[]'),'dealer',json('[]'),'shoe',json('[]'),'active',json('false'),'hand',0,'hideDealer',json('true')),version=version+1,updated_at=unixepoch()*1000
WHERE COALESCE(json_extract(state_json,'$.currency'),'MS')='MS';
-- statement-breakpoint
DELETE FROM cas_game_history WHERE json_extract(data_json,'$.currency')='MS';
-- statement-breakpoint
UPDATE cas_poker_rooms SET closed=1,updated_at=unixepoch()*1000 WHERE json_extract(summary_json,'$.currency')='MS';
-- statement-breakpoint
DROP TABLE cas_poker_seats;
-- statement-breakpoint
CREATE TABLE cas_poker_seats (
 jrvx_id TEXT PRIMARY KEY REFERENCES cas_users(jrvx_id),room_id TEXT NOT NULL,
 currency TEXT NOT NULL CHECK(currency='MG'),joined_at INTEGER NOT NULL
);
-- statement-breakpoint
-- Bound possible future returns as well as the current wallet. Poker escrow is
-- capped at1e9 per table. Blackjack has<=4hands, each<=2baseBet, return<=2bet:
-- 16baseBet covers every payout (dealer-natural insurance cannot exceed that).
-- Prospective bet guards are independent of the actual RNG result. No extra
-- reservation table, client promise or cross-database transaction is required.
CREATE TRIGGER cas_transaction_capacity_guard_v330 BEFORE INSERT ON cas_transactions
BEGIN
 SELECT CASE WHEN NEW.operation_type IN ('blackjack_bet','roulette_bet','poker_buyin','poker_rebuy') AND NEW.amount>=0
 THEN RAISE(ABORT,'invalid_bet_amount') END;
 SELECT CASE WHEN NEW.operation_type='roulette_bet' AND (
   COALESCE(json_type(NEW.metadata_json,'$.bet.multiplier'),'')<>'integer'
   OR COALESCE(json_extract(NEW.metadata_json,'$.bet.multiplier'),0) NOT IN (2,3,9,12,18,36))
 THEN RAISE(ABORT,'invalid_roulette_reservation') END;
 SELECT CASE WHEN NEW.balance_after>9007199254740991
  - CASE WHEN NEW.operation_type='poker_cashout' THEN 0
    WHEN NEW.operation_type IN ('poker_buyin','poker_rebuy') OR EXISTS(SELECT 1 FROM cas_poker_seats WHERE jrvx_id=NEW.jrvx_id)
    THEN 1000000000 ELSE 0 END
  - CASE WHEN NEW.operation_type='blackjack_payout' THEN 0
    WHEN NEW.operation_type='blackjack_bet' AND json_extract(NEW.metadata_json,'$.action')='deal' THEN -NEW.amount*16
    ELSE COALESCE((SELECT CASE WHEN json_extract(state_json,'$.active')=1
      THEN json_extract(state_json,'$.baseBet')*16 ELSE 0 END FROM cas_blackjack_state WHERE jrvx_id=NEW.jrvx_id),0) END
  - CASE WHEN NEW.operation_type='roulette_bet' THEN -NEW.amount*json_extract(NEW.metadata_json,'$.bet.multiplier') ELSE 0 END
 THEN RAISE(ABORT,'balance_limit') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_blackjack_capacity_insert_v330 BEFORE INSERT ON cas_blackjack_state
WHEN COALESCE(json_extract(NEW.state_json,'$.active'),0)<>0
BEGIN
 SELECT CASE WHEN json_extract(NEW.state_json,'$.currency') IS NOT 'MG'
  OR json_type(NEW.state_json,'$.baseBet') IS NOT 'integer'
  OR json_extract(NEW.state_json,'$.baseBet') NOT BETWEEN 2 AND 1000000
 THEN RAISE(ABORT,'invalid_blackjack_reservation') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id AND currency='MG'
  AND balance<=9007199254740991-json_extract(NEW.state_json,'$.baseBet')*16
  - CASE WHEN EXISTS(SELECT 1 FROM cas_poker_seats WHERE jrvx_id=NEW.jrvx_id) THEN 1000000000 ELSE 0 END)
 THEN RAISE(ABORT,'balance_limit') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_blackjack_capacity_update_v330 BEFORE UPDATE OF state_json,jrvx_id ON cas_blackjack_state
WHEN COALESCE(json_extract(NEW.state_json,'$.active'),0)<>0
BEGIN
 SELECT CASE WHEN json_extract(NEW.state_json,'$.currency') IS NOT 'MG'
  OR json_type(NEW.state_json,'$.baseBet') IS NOT 'integer'
  OR json_extract(NEW.state_json,'$.baseBet') NOT BETWEEN 2 AND 1000000
 THEN RAISE(ABORT,'invalid_blackjack_reservation') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id AND currency='MG'
  AND balance<=9007199254740991-json_extract(NEW.state_json,'$.baseBet')*16
  - CASE WHEN EXISTS(SELECT 1 FROM cas_poker_seats WHERE jrvx_id=NEW.jrvx_id) THEN 1000000000 ELSE 0 END)
 THEN RAISE(ABORT,'balance_limit') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_poker_capacity_insert_v330 BEFORE INSERT ON cas_poker_seats
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id AND currency='MG'
  AND balance<=9007199254740991-1000000000
  - COALESCE((SELECT CASE WHEN json_extract(state_json,'$.active')=1 THEN json_extract(state_json,'$.baseBet')*16 ELSE 0 END
    FROM cas_blackjack_state WHERE jrvx_id=NEW.jrvx_id),0))
 THEN RAISE(ABORT,'balance_limit') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_poker_capacity_update_v330 BEFORE UPDATE ON cas_poker_seats
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM cas_wallets WHERE jrvx_id=NEW.jrvx_id AND currency='MG'
  AND balance<=9007199254740991-1000000000
  - COALESCE((SELECT CASE WHEN json_extract(state_json,'$.active')=1 THEN json_extract(state_json,'$.baseBet')*16 ELSE 0 END
    FROM cas_blackjack_state WHERE jrvx_id=NEW.jrvx_id),0))
 THEN RAISE(ABORT,'balance_limit') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_admin_snapshot_guard_v330 BEFORE INSERT ON cas_audit_log
WHEN NEW.action LIKE 'admin_%' AND json_type(NEW.details_json,'$.expected')='object'
BEGIN
 SELECT CASE WHEN json_type(NEW.details_json,'$.expected.profileJson') IS NOT NULL
 AND json_extract(NEW.details_json,'$.expected.profileJson') IS NOT (SELECT profile_json FROM cas_users WHERE jrvx_id=NEW.target_id)
 THEN RAISE(ABORT,'admin_snapshot_mismatch') END;
 SELECT CASE WHEN json_type(NEW.details_json,'$.expected.mgVersion') IS NOT NULL
 AND json_extract(NEW.details_json,'$.expected.mgVersion') IS NOT (SELECT version FROM cas_wallets WHERE jrvx_id=NEW.target_id AND currency='MG')
 THEN RAISE(ABORT,'admin_snapshot_mismatch') END;
END;
-- statement-breakpoint
INSERT INTO cas_migration_assert_v330 VALUES(CASE WHEN
 NOT EXISTS(SELECT 1 FROM cas_wallets w LEFT JOIN cas_legacy_wallets_v330 g ON g.jrvx_id=w.jrvx_id AND g.currency='MG'
 LEFT JOIN cas_legacy_wallets_v330 s ON s.jrvx_id=w.jrvx_id AND s.currency='MS'
 WHERE w.balance<>g.balance+(COALESCE(s.balance,0)+299)/300)
 AND (SELECT COUNT(*) FROM cas_wallets)=(SELECT COUNT(*) FROM cas_users)
 THEN 1 ELSE 0 END);
-- statement-breakpoint
UPDATE cas_economy_control SET phase='mg-only',updated_at=unixepoch()*1000 WHERE id=1;
-- statement-breakpoint
DROP TABLE cas_migration_assert_v330;
