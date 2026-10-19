# JRVX ID: observed architecture and rollout

Observed 2026-10-19 through the connected Cloudflare and GitHub APIs and public HTTP. This is not a full security audit.

| Component | Current role |
| --- | --- |
| `jrvx.ru` | Existing main application; the GitHub default branch documents its ChatGPT Sites recovery. |
| `id.jrvx.ru` | DNS-only A record to REG.RU. Public HTTP returns nginx. DNS comments describe a gateway to the existing Worker; REG.RU server configuration itself was not inspected. |
| `id-test.jrvx.ru` | Cloudflare custom domain attached to the legacy `jrvx-identity` Worker. The name does not imply isolated data: it shares the production D1 binding. |
| `jrvx-identity` | Legacy ID Worker, bound to `jrvx-production`. No native Git build triggers or cron were configured when inspected. |
| `jrvx-production` | Shared database with identity, OIDC, planner and CAS/game tables. |
| `jrvx-id-next` | New staging Worker at `https://jrvx-id-next.gleb-v-markevich.workers.dev`, bound to its own D1; synthetic email mode, hourly maintenance and logs enabled. |
| `jrvx-id-next-20261018` | Separate staging database with identity, privacy, security, app grant and OIDC tables. |
| GitHub `AlexMuratovsky/JRVX` | Existing main planner recovery and APK build branches. New ID recovery is placed in `identity/`. No native ID build triggers were found. |

## Release order

1. **Recovery and repeatable verification**: preserve the exact deployed staging bundle, non-secret configuration, both schemas and hashes. Add checks and a manual staging deployment workflow. This recovery does not replace maintainable source.
2. **Source and CI connection**: locate the original source workspace or rebuild application modules against this reference. Add a dedicated staging deployment credential through GitHub's secret store; start from manual deployments with commit provenance.
3. **Isolated end-to-end rehearsal**: create synthetic test identities and product OIDC clients in staging. Verify signup and email confirmation, login/logout, password reset, session revocation, TOTP, backup codes, Passkeys, account deletion/export and admin MFA. API route presence alone does not prove complete operation.
4. **Migration rehearsal**: prepare versioned, additive migrations and an identity-only export/import plan. Retain user UUIDs, public ID reservations/aliases and password parameters. Decide which sessions must expire; verify OIDC clients, redirect URIs, signing keys and consent compatibility. Rehearse on isolated copies, compare counts and invariants, and prove restoration before cutover.
5. **Routing**: the new Worker enforces its canonical `IDENTITY_ORIGIN`, and Turnstile validates hostname/action. Any new test domain or REG.RU gateway requires coordinated origin, CAPTCHA, cookie, product redirect and gateway HMAC changes. Merely attaching a domain is insufficient.
6. **Controlled production cutover**: establish rollback conditions, backups and product smoke checks. Preserve the REG.RU availability arrangement until its replacement is verified from supported client networks, including iPhone/Safari. `id-test.jrvx.ru` currently reaches production data and must not be used for destructive testing.

## Checks completed by this package

- Exact staging bundle SHA-256, syntax and configuration validation.
- Full schema creation in a new disposable local D1.
- Account HTML, CSS/JS, health, unauthenticated API guards, canonical-host and cross-origin rejection, request size bounds, synthetic-mail registration guard.
- Wrangler dry-run upload and generated environment types.

Full user flows, original-source rebuild, REG.RU server configuration, production data migration, DNS/TLS changes, GitHub deployment credential setup and production cutover are outside this completed recovery package. No production-ready claim is made for the new staging functionality.
