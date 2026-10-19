-- Schema-only recovery snapshot. No user rows or secret values.
-- Captured from Cloudflare D1 on 2026-10-19. Do not apply to an existing database.
CREATE TABLE app_registry (
  app_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','development')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE auth_rate_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, window_started_at INTEGER NOT NULL, blocked_until INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE cas_profiles (
  user_id TEXT PRIMARY KEY,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE cas_state (
  user_id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL DEFAULT '{}',
  state_version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE email_challenges (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL CHECK(purpose IN ('verify','login','reset')),code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,sent_at INTEGER NOT NULL,send_window_start INTEGER NOT NULL,sends_in_window INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(user_id,purpose));
CREATE TABLE game_balances (
  user_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, currency),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE identity_audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  target_user_id TEXT,
  action TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE jrvx_id_aliases (
  alias_jrvx_id TEXT PRIMARY KEY COLLATE NOCASE,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE linked_apps (
  user_id TEXT NOT NULL,
  app_key TEXT NOT NULL,
  linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata_json TEXT,
  PRIMARY KEY (user_id, app_key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE "oidc_access_token" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oidc_client" ("clientId") on delete cascade, "sessionId" text references "oidc_session" ("id") on delete set null, "userId" text references "oidc_user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" text, "requestedUserInfoClaims" text, "refreshId" text references "oidc_refresh_token" ("id") on delete cascade, "expiresAt" date not null, "createdAt" date not null, "revoked" date, "confirmation" text, "scopes" text not null);
CREATE TABLE "oidc_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "oidc_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);
CREATE TABLE "oidc_client" ("id" text not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" integer, "skipConsent" integer, "enableEndSession" integer, "subjectType" text, "scopes" text, "clientCredentialsScopes" text, "userId" text references "oidc_user" ("id") on delete cascade, "createdAt" date, "updatedAt" date, "name" text, "uri" text, "icon" text, "contacts" text, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" text not null, "postLogoutRedirectUris" text, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" integer, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" text, "responseTypes" text, "requirePKCE" integer, "dpopBoundAccessTokens" integer, "referenceId" text, "metadata" text);
CREATE TABLE "oidc_client_assertion" ("id" text not null primary key, "expiresAt" date not null);
CREATE TABLE "oidc_client_resource" ("id" text not null primary key, "clientId" text not null references "oidc_client" ("clientId") on delete cascade, "resourceId" text not null references "oidc_resource" ("identifier") on delete cascade, "metadata" text, "createdAt" date);
CREATE TABLE "oidc_consent" ("id" text not null primary key, "clientId" text not null references "oidc_client" ("clientId") on delete cascade, "userId" text references "oidc_user" ("id") on delete cascade, "referenceId" text, "resources" text, "requestedUserInfoClaims" text, "scopes" text not null, "createdAt" date not null, "updatedAt" date not null);
CREATE TABLE "oidc_jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" date not null, "expiresAt" date, "alg" text, "crv" text);
CREATE TABLE "oidc_rate_limit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);
CREATE TABLE "oidc_refresh_token" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oidc_client" ("clientId") on delete cascade, "sessionId" text references "oidc_session" ("id") on delete set null, "userId" text not null references "oidc_user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" text, "requestedUserInfoClaims" text, "expiresAt" date not null, "createdAt" date not null, "revoked" date, "rotatedAt" date, "rotationReplayResponse" text, "rotationReplayExpiresAt" date, "authTime" date, "confirmation" text, "scopes" text not null);
CREATE TABLE "oidc_resource" ("id" text not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" text, "customClaims" text, "dpopBoundAccessTokensRequired" integer, "disabled" integer, "createdAt" date, "updatedAt" date, "policyVersion" integer, "metadata" text);
CREATE TABLE "oidc_session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "oidc_user" ("id") on delete cascade, "legacySessionId" text not null references sessions(id) on delete cascade);
CREATE TABLE "oidc_user" ("id" text not null primary key references users(id) on delete cascade, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null, "username" text unique, "displayUsername" text, "jrvxId" text not null);
CREATE TABLE "oidc_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);
CREATE TABLE planner_arcade_scores (user_id TEXT NOT NULL, game_key TEXT NOT NULL, best_score INTEGER NOT NULL DEFAULT 0, plays INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id,game_key), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE planner_items (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, notes TEXT, status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','doing','done','archived')), priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high')), due_at TEXT, sort_order INTEGER NOT NULL DEFAULT 0, completed_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE user_capabilities (
  user_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, capability),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  locale TEXT NOT NULL DEFAULT 'ru-RU',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  jrvx_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  email TEXT COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, password_algorithm TEXT NOT NULL DEFAULT 'pbkdf2-sha256', password_iterations INTEGER NOT NULL DEFAULT 20000, email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1)), registration_pending INTEGER NOT NULL DEFAULT 0 CHECK(registration_pending IN (0,1)), terms_version TEXT, terms_accepted_at TEXT);
CREATE INDEX idx_aliases_user ON jrvx_id_aliases(user_id);
CREATE INDEX idx_auth_rate_limits_updated ON auth_rate_limits(updated_at);
CREATE INDEX idx_capabilities_user ON user_capabilities(user_id);
CREATE INDEX idx_email_challenges_expiry ON email_challenges(expires_at);
CREATE INDEX idx_identity_audit_actor ON identity_audit_log(actor_user_id, created_at);
CREATE INDEX idx_identity_audit_target ON identity_audit_log(target_user_id, created_at);
CREATE INDEX idx_planner_items_user_status_due ON planner_items(user_id,status,due_at);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE UNIQUE INDEX idx_users_jrvx_id_nocase ON users(jrvx_id COLLATE NOCASE);
CREATE INDEX "oidc_access_token_authorizationCodeId_idx" on "oidc_access_token" ("authorizationCodeId");
CREATE INDEX "oidc_access_token_clientId_idx" on "oidc_access_token" ("clientId");
CREATE INDEX "oidc_access_token_refreshId_idx" on "oidc_access_token" ("refreshId");
CREATE INDEX "oidc_access_token_sessionId_idx" on "oidc_access_token" ("sessionId");
CREATE INDEX "oidc_access_token_userId_idx" on "oidc_access_token" ("userId");
CREATE INDEX "oidc_account_userId_idx" on "oidc_account" ("userId");
CREATE INDEX "oidc_client_resource_clientId_idx" on "oidc_client_resource" ("clientId");
CREATE UNIQUE INDEX "oidc_client_resource_clientId_resourceId_uidx" on "oidc_client_resource" ("clientId", "resourceId");
CREATE INDEX "oidc_client_resource_resourceId_idx" on "oidc_client_resource" ("resourceId");
CREATE INDEX "oidc_client_userId_idx" on "oidc_client" ("userId");
CREATE INDEX "oidc_consent_clientId_idx" on "oidc_consent" ("clientId");
CREATE INDEX "oidc_consent_userId_idx" on "oidc_consent" ("userId");
CREATE INDEX "oidc_refresh_token_authorizationCodeId_idx" on "oidc_refresh_token" ("authorizationCodeId");
CREATE INDEX "oidc_refresh_token_clientId_idx" on "oidc_refresh_token" ("clientId");
CREATE INDEX "oidc_refresh_token_sessionId_idx" on "oidc_refresh_token" ("sessionId");
CREATE INDEX "oidc_refresh_token_userId_idx" on "oidc_refresh_token" ("userId");
CREATE INDEX oidc_session_legacy_idx ON oidc_session(legacySessionId);
CREATE INDEX "oidc_session_userId_idx" on "oidc_session" ("userId");
CREATE UNIQUE INDEX oidc_user_public_id_uq ON oidc_user(jrvxId);
CREATE INDEX "oidc_verification_identifier_idx" on "oidc_verification" ("identifier");
CREATE TRIGGER trg_users_jrvx_id_insert BEFORE INSERT ON users FOR EACH ROW WHEN length(NEW.jrvx_id) <> 17 OR substr(NEW.jrvx_id,1,5) <> 'JRVX-' OR substr(NEW.jrvx_id,6,4) GLOB '*[^A-Z]*' OR substr(NEW.jrvx_id,10,8) GLOB '*[^0-9]*' BEGIN SELECT RAISE(ABORT,'invalid_jrvx_id'); END;
CREATE TRIGGER trg_users_jrvx_id_update BEFORE UPDATE OF jrvx_id ON users FOR EACH ROW WHEN length(NEW.jrvx_id) <> 17 OR substr(NEW.jrvx_id,1,5) <> 'JRVX-' OR substr(NEW.jrvx_id,6,4) GLOB '*[^A-Z]*' OR substr(NEW.jrvx_id,10,8) GLOB '*[^0-9]*' BEGIN SELECT RAISE(ABORT,'invalid_jrvx_id'); END;
