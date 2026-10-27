-- JRVX MedHelper: independent database. Never run on Identity or Planner databases.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT NOT NULL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  color TEXT NOT NULL DEFAULT 'sage',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_subject_owner ON subjects(owner_id);
CREATE TABLE IF NOT EXISTS study_topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS deadlines (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  r2_key TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS daily_usage (
  owner_id TEXT NOT NULL,
  quota_day TEXT NOT NULL,
  free_used INTEGER NOT NULL DEFAULT 0 CHECK(free_used >= 0 AND free_used <= 3),
  PRIMARY KEY(owner_id, quota_day)
);
CREATE TABLE IF NOT EXISTS paid_balances (
  owner_id TEXT PRIMARY KEY,
  paid_credits INTEGER NOT NULL DEFAULT 0 CHECK(paid_credits >= 0)
);
CREATE TABLE IF NOT EXISTS generations (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  topic TEXT NOT NULL,
  country TEXT NOT NULL,
  quota_day TEXT NOT NULL,
  credit_source TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','running','completed','failed')),
  prompt TEXT NOT NULL,
  result_text TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_generation_owner ON generations(owner_id,created_at DESC);
-- For future payment fulfilment, write purchased credits ONLY after server-side verified provider webhook.
CREATE TABLE IF NOT EXISTS purchase_ledger (
  transaction_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  purchased_credits INTEGER NOT NULL CHECK(purchased_credits > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
