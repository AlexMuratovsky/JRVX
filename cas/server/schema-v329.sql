-- CAS-only schema baseline. Schema objects only; no account rows or credentials.
CREATE TABLE cas_audit_log (
  audit_id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  status TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_blackjack_actions (
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  action_id TEXT NOT NULL,
  expected_version INTEGER NOT NULL,
  expected_progress_version INTEGER,
  result_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(jrvx_id,action_id)
);
-- statement-breakpoint
CREATE TABLE cas_blackjack_state (
  jrvx_id TEXT PRIMARY KEY REFERENCES cas_users(jrvx_id),
  state_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_connections (
 jrvx_id TEXT PRIMARY KEY REFERENCES cas_users(jrvx_id),sid TEXT NOT NULL,
 room_id TEXT NOT NULL DEFAULT '',spectating TEXT NOT NULL DEFAULT '',nickname TEXT NOT NULL,
 last_seen INTEGER NOT NULL,connected_at INTEGER NOT NULL,online INTEGER NOT NULL DEFAULT 0
);
-- statement-breakpoint
CREATE TABLE cas_game_history (
  event_id TEXT PRIMARY KEY,
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  game TEXT NOT NULL CHECK(game IN ('poker','blackjack','roulette')),
  event_type TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_identity_subject (
  sub TEXT PRIMARY KEY,
  jrvx_id TEXT NOT NULL UNIQUE REFERENCES cas_users(jrvx_id),
  linked_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_oidc_credentials (
  sid TEXT PRIMARY KEY REFERENCES cas_sessions(sid) ON DELETE CASCADE,
  sub TEXT NOT NULL REFERENCES cas_identity_subject(sub),
  cipher TEXT NOT NULL,
  access_expires_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  refresh_lock TEXT,
  refresh_lock_until INTEGER NOT NULL DEFAULT 0
);
-- statement-breakpoint
CREATE TABLE cas_poker_rooms (
 room_id TEXT PRIMARY KEY,summary_json TEXT NOT NULL,closed INTEGER NOT NULL DEFAULT 0,updated_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_poker_seats (
 jrvx_id TEXT PRIMARY KEY REFERENCES cas_users(jrvx_id),room_id TEXT NOT NULL,
 currency TEXT NOT NULL CHECK(currency IN ('MS','MG')),joined_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_sessions (
 sid TEXT PRIMARY KEY,jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
 expires_at INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL
);
-- statement-breakpoint
CREATE TABLE cas_transactions (
  transaction_id TEXT PRIMARY KEY,
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  currency TEXT NOT NULL CHECK(currency IN ('MS','MG')),
  amount INTEGER NOT NULL CHECK(amount BETWEEN -1000000000 AND 1000000000),
  balance_before INTEGER NOT NULL CHECK(balance_before >= 0),
  balance_after INTEGER NOT NULL CHECK(balance_after >= 0 AND balance_after <= 1000000000000),
  operation_type TEXT NOT NULL,
  source TEXT NOT NULL,
  actor_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  CHECK(balance_after = balance_before + amount)
);
-- statement-breakpoint
CREATE TABLE cas_users (
  jrvx_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT 'Игрок',
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
  role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER','ADMIN','SUPERADMIN')),
  profile_json TEXT NOT NULL DEFAULT '{}',
  progression_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
, stats_json TEXT NOT NULL DEFAULT '{}', friends_json TEXT NOT NULL DEFAULT '[]', previous_ids_json TEXT NOT NULL DEFAULT '[]', progress_version INTEGER NOT NULL DEFAULT 0);
-- statement-breakpoint
CREATE TABLE cas_wallets (
  jrvx_id TEXT NOT NULL REFERENCES cas_users(jrvx_id),
  currency TEXT NOT NULL CHECK(currency IN ('MS','MG')),
  balance INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0 AND balance <= 1000000000000),
  updated_at INTEGER NOT NULL, version INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(jrvx_id,currency)
);
-- statement-breakpoint
CREATE INDEX cas_audit_time ON cas_audit_log(created_at DESC);
-- statement-breakpoint
CREATE INDEX cas_history_user_time
  ON cas_game_history(jrvx_id,created_at DESC);
-- statement-breakpoint
CREATE INDEX cas_oidc_expiry ON cas_oidc_credentials(expires_at);
-- statement-breakpoint
CREATE INDEX cas_transactions_user_time
  ON cas_transactions(jrvx_id,created_at DESC);
-- statement-breakpoint
CREATE TRIGGER cas_admin_audit_guard BEFORE INSERT ON cas_audit_log
WHEN NEW.action LIKE 'admin_%'
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM cas_users WHERE jrvx_id=NEW.actor_id AND enabled=1
  AND (jrvx_id='JRVX-JRVX11101111' OR role IN ('ADMIN','SUPERADMIN'))
 ) THEN RAISE(ABORT,'admin_permission_changed') END;
 SELECT CASE WHEN NEW.actor_id<>'JRVX-JRVX11101111'
 AND (SELECT role FROM cas_users WHERE jrvx_id=NEW.actor_id)='ADMIN'
 AND (SELECT role FROM cas_users WHERE jrvx_id=NEW.target_id)<>'USER'
 THEN RAISE(ABORT,'admin_target_forbidden') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_admin_role_guard_v3017 BEFORE INSERT ON cas_audit_log
WHEN NEW.action LIKE 'admin_%' AND json_type(NEW.details_json,'$.input.role') IS NOT NULL
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM cas_users WHERE jrvx_id=NEW.actor_id AND enabled=1
  AND (jrvx_id='JRVX-JRVX11101111' OR role='SUPERADMIN')
 ) THEN RAISE(ABORT,'admin_role_forbidden') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_admin_snapshot_guard_v3017 BEFORE INSERT ON cas_audit_log
WHEN NEW.action LIKE 'admin_%' AND json_type(NEW.details_json,'$.expected')='object'
BEGIN
 SELECT CASE WHEN json_type(NEW.details_json,'$.expected.profileJson') IS NOT NULL
 AND json_extract(NEW.details_json,'$.expected.profileJson') IS NOT (
  SELECT profile_json FROM cas_users WHERE jrvx_id=NEW.target_id
 ) THEN RAISE(ABORT,'admin_snapshot_mismatch') END;
 SELECT CASE WHEN json_type(NEW.details_json,'$.expected.msVersion') IS NOT NULL
 AND json_extract(NEW.details_json,'$.expected.msVersion') IS NOT (
  SELECT version FROM cas_wallets WHERE jrvx_id=NEW.target_id AND currency='MS'
 ) THEN RAISE(ABORT,'admin_snapshot_mismatch') END;
 SELECT CASE WHEN json_type(NEW.details_json,'$.expected.mgVersion') IS NOT NULL
 AND json_extract(NEW.details_json,'$.expected.mgVersion') IS NOT (
  SELECT version FROM cas_wallets WHERE jrvx_id=NEW.target_id AND currency='MG'
 ) THEN RAISE(ABORT,'admin_snapshot_mismatch') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_blackjack_action_guard BEFORE INSERT ON cas_blackjack_actions
BEGIN
  SELECT CASE WHEN NEW.expected_version IS NOT (
    SELECT version FROM cas_blackjack_state WHERE jrvx_id=NEW.jrvx_id
  ) THEN RAISE(ABORT,'blackjack_version_mismatch') END;
  SELECT CASE WHEN NEW.expected_progress_version IS NOT NULL AND NEW.expected_progress_version IS NOT (
    SELECT progress_version FROM cas_users WHERE jrvx_id=NEW.jrvx_id
  ) THEN RAISE(ABORT,'progress_version_mismatch') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_poker_progress_guard BEFORE INSERT ON cas_game_history
WHEN NEW.game='poker' AND NEW.event_type IN ('hand','login','daily_reward')
BEGIN
 SELECT CASE WHEN NEW.event_type IN ('login','daily_reward') AND NOT EXISTS (
  SELECT 1 FROM cas_users WHERE jrvx_id=NEW.jrvx_id AND enabled=1
 ) THEN RAISE(ABORT,'cas_account_disabled') END;
 SELECT CASE WHEN json_extract(NEW.data_json,'$.progressVersion') IS NOT (
  SELECT progress_version FROM cas_users WHERE jrvx_id=NEW.jrvx_id
 ) THEN RAISE(ABORT,'progress_version_mismatch') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_roulette_progress_guard BEFORE INSERT ON cas_game_history
WHEN NEW.game='roulette' AND NEW.event_type='spin'
BEGIN
 SELECT CASE WHEN json_extract(NEW.data_json,'$.progressVersion') IS NOT (
  SELECT progress_version FROM cas_users WHERE jrvx_id=NEW.jrvx_id
 ) THEN RAISE(ABORT,'progress_version_mismatch') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_transaction_apply AFTER INSERT ON cas_transactions
BEGIN
  UPDATE cas_wallets SET balance=NEW.balance_after,version=version+1,updated_at=NEW.created_at
  WHERE jrvx_id=NEW.jrvx_id AND currency=NEW.currency;
END;
-- statement-breakpoint
CREATE TRIGGER cas_transaction_enabled_guard_v3017 BEFORE INSERT ON cas_transactions
WHEN NEW.operation_type IN ('blackjack_bet','roulette_bet','poker_buyin','poker_rebuy','wallet_exchange_debit')
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM cas_users WHERE jrvx_id=NEW.jrvx_id AND enabled=1
 ) THEN RAISE(ABORT,'cas_account_disabled') END;
END;
-- statement-breakpoint
CREATE TRIGGER cas_transaction_guard BEFORE INSERT ON cas_transactions
BEGIN
  SELECT CASE WHEN NEW.operation_type IN ('blackjack_bet','roulette_bet','poker_buyin','poker_rebuy') AND NOT EXISTS (
    SELECT 1 FROM cas_users WHERE jrvx_id=NEW.jrvx_id AND enabled=1
  ) THEN RAISE(ABORT,'cas_account_disabled') END;
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM cas_wallets
    WHERE jrvx_id=NEW.jrvx_id AND currency=NEW.currency AND balance=NEW.balance_before
  ) THEN RAISE(ABORT,'wallet_balance_mismatch') END;
END;
