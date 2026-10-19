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
CREATE TABLE email_challenges (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,purpose TEXT NOT NULL CHECK(purpose IN ('verify','login','reset')),code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,sent_at INTEGER NOT NULL,send_window_start INTEGER NOT NULL,sends_in_window INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(user_id,purpose));
CREATE TABLE identity_app_grants (
 user_id TEXT NOT NULL REFERENCES users(id),app_key TEXT NOT NULL REFERENCES identity_apps(app_key),permissions_json TEXT NOT NULL,
 connected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,revoked_at TEXT,PRIMARY KEY(user_id,app_key)
);
CREATE TABLE identity_apps (
 app_key TEXT PRIMARY KEY REFERENCES app_registry(app_key),name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',icon TEXT NOT NULL DEFAULT '',
 url TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('available','development','maintenance','unavailable','disabled')),
 client_id TEXT NOT NULL UNIQUE,redirect_uris TEXT NOT NULL,scopes TEXT NOT NULL DEFAULT '["openid","profile","jrvx_id"]',
 trusted INTEGER NOT NULL DEFAULT 1 CHECK(trusted IN (0,1)),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
CREATE TABLE identity_avatars (
 user_id TEXT PRIMARY KEY REFERENCES users(id),mime TEXT NOT NULL CHECK(mime IN ('image/png','image/jpeg','image/webp')),data BLOB NOT NULL,
 etag TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE identity_deletion_requests (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL UNIQUE REFERENCES users(id),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','cancelled','completed')),
 requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,earliest_completion_at TEXT NOT NULL
);
CREATE TABLE identity_id_reservations (
 jrvx_id TEXT PRIMARY KEY COLLATE NOCASE,user_id TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,retired_at TEXT
);
CREATE TABLE identity_mail_outbox (
 id TEXT PRIMARY KEY,cipher TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at INTEGER NOT NULL,
 delivered_at TEXT,last_error TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE identity_operation_metrics (
 day TEXT NOT NULL,kind TEXT NOT NULL,requests INTEGER NOT NULL DEFAULT 0,failures INTEGER NOT NULL DEFAULT 0,
 total_duration_ms INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,kind)
);
CREATE TABLE identity_privacy (
 user_id TEXT PRIMARY KEY REFERENCES users(id),profile_visibility TEXT NOT NULL DEFAULT 'private' CHECK(profile_visibility IN ('private','public','apps')),
 email_notifications INTEGER NOT NULL DEFAULT 0 CHECK(email_notifications IN (0,1)),security_notifications INTEGER NOT NULL DEFAULT 1 CHECK(security_notifications IN (0,1)),
 location_history INTEGER NOT NULL DEFAULT 0 CHECK(location_history IN (0,1)),avatar_privacy TEXT NOT NULL DEFAULT 'apps' CHECK(avatar_privacy IN ('private','public','apps')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE identity_schema_versions(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE identity_test_outbox (
 id TEXT PRIMARY KEY,recipient TEXT NOT NULL,cipher TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE identity_user_roles (
 user_id TEXT PRIMARY KEY REFERENCES users(id),role TEXT NOT NULL CHECK(role IN ('user','moderator','admin','super_admin')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_by TEXT
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
CREATE TABLE security_backup (
 code_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 used_at INTEGER,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE security_challenge (
 id_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL,session_id TEXT,payload TEXT NOT NULL,
 expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,consumed_at INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE security_device_info (
 session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,browser TEXT NOT NULL,os TEXT NOT NULL,device TEXT NOT NULL,
 country TEXT,city TEXT
);
CREATE TABLE security_event (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,session_id TEXT,kind TEXT NOT NULL,
 user_agent TEXT,ip_hash TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE security_factor_dates (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,totp_enabled_at TEXT,passkey_first_at TEXT
);
CREATE TABLE security_passkey (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 public_key TEXT NOT NULL, counter INTEGER NOT NULL, name TEXT NOT NULL,
 transports TEXT NOT NULL DEFAULT '[]', device_type TEXT NOT NULL, backed_up INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_used_at TEXT
);
CREATE TABLE security_rate (
 action TEXT NOT NULL,key_hash TEXT NOT NULL,window_start INTEGER NOT NULL,attempts INTEGER NOT NULL,
 PRIMARY KEY(action,key_hash)
);
CREATE TABLE security_session (
 session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 factor_version INTEGER NOT NULL,assurance TEXT NOT NULL CHECK(assurance IN('password','mfa','passkey')),
 stepup_until INTEGER NOT NULL DEFAULT 0,reauthenticated_at TEXT
);
CREATE TABLE security_user (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 totp_cipher TEXT, totp_enabled INTEGER NOT NULL DEFAULT 0 CHECK(totp_enabled IN(0,1)),
 totp_last_step INTEGER NOT NULL DEFAULT -1, factor_version INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX identity_grants_user_idx ON identity_app_grants(user_id,revoked_at);
CREATE INDEX identity_roles_role_idx ON identity_user_roles(role,user_id);
CREATE INDEX identity_users_created_idx ON users(created_at,id);
CREATE INDEX identity_users_status_created_idx ON users(status,created_at,id);
CREATE INDEX idx_aliases_user ON jrvx_id_aliases(user_id);
CREATE INDEX idx_auth_rate_limits_updated ON auth_rate_limits(updated_at);
CREATE INDEX idx_capabilities_user ON user_capabilities(user_id);
CREATE INDEX idx_email_challenges_expiry ON email_challenges(expires_at);
CREATE INDEX idx_identity_audit_actor ON identity_audit_log(actor_user_id, created_at);
CREATE INDEX idx_identity_audit_target ON identity_audit_log(target_user_id, created_at);
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
CREATE INDEX security_challenge_expiry ON security_challenge(expires_at);
CREATE INDEX security_challenge_user ON security_challenge(user_id,purpose);
CREATE INDEX security_event_user ON security_event(user_id,created_at);
CREATE INDEX security_passkey_user ON security_passkey(user_id);
CREATE TRIGGER identity_audit_immutable_delete BEFORE DELETE ON identity_audit_log
BEGIN SELECT RAISE(ABORT,'audit_is_append_only'); END;
CREATE TRIGGER identity_audit_immutable_update BEFORE UPDATE ON identity_audit_log
BEGIN SELECT RAISE(ABORT,'audit_is_append_only'); END;
CREATE TRIGGER identity_reserve_after_insert AFTER INSERT ON users
BEGIN INSERT OR IGNORE INTO identity_id_reservations(jrvx_id,user_id) VALUES(NEW.jrvx_id,NEW.id); END;
CREATE TRIGGER identity_reserve_after_update AFTER UPDATE OF jrvx_id ON users WHEN NEW.jrvx_id<>OLD.jrvx_id
BEGIN
 INSERT OR IGNORE INTO identity_id_reservations(jrvx_id,user_id) VALUES(NEW.jrvx_id,NEW.id);
 UPDATE identity_id_reservations SET retired_at=CURRENT_TIMESTAMP WHERE jrvx_id=OLD.jrvx_id AND user_id=OLD.id;
 INSERT OR IGNORE INTO jrvx_id_aliases(alias_jrvx_id,user_id,reason) VALUES(OLD.jrvx_id,OLD.id,'public_id_changed');
END;
CREATE TRIGGER identity_reserve_before_insert BEFORE INSERT ON users
WHEN EXISTS(SELECT 1 FROM identity_id_reservations WHERE jrvx_id=NEW.jrvx_id AND (user_id IS NOT NEW.id OR retired_at IS NOT NULL))
BEGIN SELECT RAISE(ABORT,'jrvx_id_reserved'); END;
CREATE TRIGGER identity_reserve_before_update BEFORE UPDATE OF jrvx_id ON users
WHEN NEW.jrvx_id<>OLD.jrvx_id AND EXISTS(SELECT 1 FROM identity_id_reservations WHERE jrvx_id=NEW.jrvx_id)
BEGIN SELECT RAISE(ABORT,'jrvx_id_reserved'); END;
CREATE TRIGGER identity_uuid_immutable BEFORE UPDATE OF id ON users WHEN NEW.id<>OLD.id
BEGIN SELECT RAISE(ABORT,'identity_uuid_immutable'); END;
CREATE TRIGGER trg_users_jrvx_id_insert BEFORE INSERT ON users FOR EACH ROW WHEN length(NEW.jrvx_id) <> 17 OR substr(NEW.jrvx_id,1,5) <> 'JRVX-' OR substr(NEW.jrvx_id,6,4) GLOB '*[^A-Z]*' OR substr(NEW.jrvx_id,10,8) GLOB '*[^0-9]*' BEGIN SELECT RAISE(ABORT,'invalid_jrvx_id'); END;
CREATE TRIGGER trg_users_jrvx_id_update BEFORE UPDATE OF jrvx_id ON users FOR EACH ROW WHEN length(NEW.jrvx_id) <> 17 OR substr(NEW.jrvx_id,1,5) <> 'JRVX-' OR substr(NEW.jrvx_id,6,4) GLOB '*[^A-Z]*' OR substr(NEW.jrvx_id,10,8) GLOB '*[^0-9]*' BEGIN SELECT RAISE(ABORT,'invalid_jrvx_id'); END;
