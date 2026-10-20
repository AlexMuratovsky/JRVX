# JRVX ID: observed architecture and rollout

Topology observed 2026-10-19 through the connected Cloudflare and GitHub APIs and public HTTP. Verification and offline rehearsal updated 2026-10-20. This is not a full security audit.

| Component | Current role |
| --- | --- |
| `jrvx.ru` | Existing main application; the GitHub default branch documents its ChatGPT Sites recovery. |
| `id.jrvx.ru` | DNS-only A record to REG.RU. Inspected PHP gateway in `~/www/id.jrvx.ru` forwards to `id-test.jrvx.ru`; the old allowlist cannot serve the new assets/API. [Recovery and candidate](GATEWAY.md). |
| `id-test.jrvx.ru` | Cloudflare custom domain attached to the legacy `jrvx-identity` Worker. The name does not imply isolated data: it shares the production D1 binding. |
| `jrvx-identity` | Legacy ID Worker, bound to `jrvx-production`. No native Git build triggers or cron were configured when inspected. |
| `jrvx-production` | Shared database with identity, OIDC, planner and CAS/game tables. |
| `jrvx-id-next` | New staging Worker at `https://jrvx-id-next.gleb-v-markevich.workers.dev`, bound to its own D1; synthetic email mode, hourly maintenance and logs enabled. |
| `jrvx-id-next-20261018` | Separate staging database with identity, privacy, security, app grant and OIDC tables. |
| GitHub `AlexMuratovsky/JRVX` | Existing main planner recovery and APK build branches. New ID recovery is placed in `identity/`. No native ID build triggers were found. |

## Release order

1. **Recovery and repeatable verification**: preserve the exact deployed staging bundle, non-secret configuration, both schemas and hashes. Add checks and a manual staging deployment workflow. This recovery does not replace maintainable source.
2. **Source and CI connection**: locate the original source workspace or rebuild application modules against this reference. Add a dedicated staging deployment credential through GitHub's secret store; start from manual deployments with commit provenance.
3. **Browser and integration acceptance**: local synthetic tests now cover signup/email confirmation, login/logout, password reset/change, session revocation, TOTP backup codes, virtual Passkeys, deletion requests, export authorization, user isolation and product OIDC/PKCE. Exercise actual device prompts, email delivery, CAPTCHA, complete deletion maintenance and admin MFA on an isolated test service before release.
4. **Migration rehearsal**: the [offline candidate](MIGRATION.md) retains user UUIDs, public ID reservations/aliases, password parameters and OIDC configuration in a new local database. Its policy expires all sessions and requires reviewed app seeding. Rehearse on a protected consistent snapshot, verify issuer, redirects, signing keys and consent compatibility, and prove restoration before cutover. Existing databases must not receive the full schema snapshots as incremental migrations.
5. **Routing**: the new Worker enforces its canonical `IDENTITY_ORIGIN`, and Turnstile validates hostname/action. Any new test domain or REG.RU gateway requires coordinated origin, CAPTCHA, cookie, product redirect and gateway HMAC changes. Merely attaching a domain is insufficient.
6. **Controlled production cutover**: establish rollback conditions, backups and product smoke checks. Preserve the REG.RU availability arrangement until its replacement is verified from supported client networks, including iPhone/Safari. `id-test.jrvx.ru` currently reaches production data and must not be used for destructive testing.

## Checks completed by this package

- Exact staging bundle SHA-256, syntax and configuration validation.
- Full schema creation in a new disposable local D1.
- Account HTML, CSS/JS, health, unauthenticated API guards, canonical-host and cross-origin rejection, request size bounds, synthetic-mail registration guard.
- Synthetic account journeys, user data isolation, export/deletion authorization, password and email recovery, session invalidation, TOTP backup-code replay rejection, and signed virtual Passkey login with origin/challenge rejection.
- Product OIDC authorization-code flow, PKCE, signed ID token/JWKS verification, redirect allowlisting, code replay rejection and token invalidation on logout.
- Offline identity migration preservation, private defaults, immutable IDs/audit, product isolation, schema-drift rejection, rollback and file overwrite protection. A migrated legacy account can sign in and upgrades its password hash.
- Aggregate read-only production schema and migration checks; no live user rows were downloaded or modified.
- Wrangler dry-run upload and generated environment types.
- Editable client/adapter build, versioned asset URLs and retained authentication module; see [release and rollback](RELEASE.md).
- REG.RU gateway source recovery, explicit new-route candidate and PHP-to-Worker contract checks, including forged identity headers, cookies and avatar/export flows. Candidate is not installed on hosting.
- Admin APIs require MFA even after password reauthentication. One real production-sender email reached the approved Gmail inbox with passing SPF/DKIM.

There are 31 automated checks. They execute the source-built adapter and archived authentication module with synthetic local data, including the candidate PHP gateway contract; virtual authenticator and encrypted test mail are protocol fixtures. Physical mobile/Passkey experience, new-version sender integration, deletion operator workflow, original server-source recovery, actual REG.RU canary transport, production data migration, identity DNS/TLS routing, GitHub deployment credential setup and production cutover remain release work. The package does not establish production readiness on its own.
