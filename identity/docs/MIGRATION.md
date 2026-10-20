# Offline identity migration candidate

This tool prepares a **new local SQLite candidate** from an existing SQLite backup matching the captured legacy schema. It has no Cloudflare API client, remote D1 commands, cutover, or production deployment capability. Tests use synthetic identities only.

## Commands

Node.js 24.19 or later is required. Store real backups and generated candidates outside Git, for example in the ignored `identity/backups/` directory. SQLite candidates contain private user data and OIDC key material, so keep them in protected local storage.

```sh
pnpm migration:inspect backups/legacy.sqlite
pnpm migration:candidate backups/legacy.sqlite backups/identity-candidate.sqlite
```

The source opens read-only. The destination must not exist; the CLI creates it exclusively. A nonempty database is also rejected by the underlying migration function. Errors roll back the destination transaction, and an empty destination file may remain after a failed operation. The CLI reports aggregate counts and blocker names, never row values or credentials.

## Candidate policy

| Data | Treatment |
| --- | --- |
| Users, UUIDs, public IDs, usernames, email state and password parameters | Preserve all columns byte for byte. Login of a synthetic migrated account with the legacy 20,000-iteration hash is tested; the Worker upgrades it to 100,000 iterations after successful login. |
| Profiles, ID aliases, linked apps, legacy capabilities and audit | Preserve. Current and historical IDs become reserved; UUID mutation and audit edits/deletes are prohibited by the target schema. |
| Legacy `user` / `admin` roles | Preserve in the new role table. No automatic promotion to `super_admin`. The separately configured owner UUID still requires review. |
| OIDC users, accounts, clients, resources, client resources, consent and JWKS | Preserve. The same `OIDC_SECRET`, issuer and redirect policy are required to interpret existing encrypted key material and client configuration. |
| Browser sessions, pending email codes, OIDC sessions/access tokens/refresh tokens/verifications/client assertions and rate limits | Start empty in this candidate. **All users must sign in again.** This is a documented cutover candidate policy, not an action against the current production database. |
| Privacy, security records and app configuration | Create private defaults and empty factors. The tool blocks sources that already contain the new identity/security tables, so it cannot silently remove enrolled MFA from a newer database. New `identity_apps` and grants need reviewed seeding before product login. |
| CAS, planner and game data | Leave in the source; do not copy those tables into the identity database. |

The preflight blocks unexpected columns in retained/transient legacy tables, missing required tables, malformed identity IDs, conflicting aliases, unsupported password parameters and broken foreign keys. The copy runs inside a consistent read transaction, validates destination counts, foreign keys and SQLite integrity, and commits only after these checks succeed.

## Verified on 2026-10-20

The live production schema checksum still matches the saved schema. Aggregate read-only checks found zero invalid public ID formats, unsupported password parameters, cross-user alias conflicts or foreign-key violations. No user rows or private keys were downloaded, and no live records were modified. Those checks are partial preflight evidence; they do not replace running the complete offline inspector against a protected, consistent backup at cutover time.

Local tests cover preservation, credential compatibility, product isolation, alias/UUID/audit invariants, failure on schema drift, destination rollback, and refusal to overwrite files.

## Still needed before cutover

1. Review the forced-relogin policy and rollback procedure, retain a protected backup, and rehearse against an authorized consistent snapshot.
2. Seed and verify the product registry, redirect URIs, trusted status, consent and scopes. Check the configured owner, issuer, gateway HMAC, canonical host and runtime secret continuity.
3. Verify actual browser and iPhone/Safari behavior, email provider delivery and CAPTCHA on the supported domains. Virtual Passkey tests validate the server protocol and signatures; they do not exercise device prompts or key synchronization.
4. Restore maintainable server modules, then rerun the complete checks. Current tests execute the source-built client adapter with the archived authentication module; the original server implementation has not been reconstructed.

This candidate is not an automatic migration or a release approval. DNS, the REG.RU gateway, production databases and the current login service remain separate controlled steps.
