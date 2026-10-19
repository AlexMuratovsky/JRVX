# JRVX ID

Recovery and reproducible staging package for JRVX ID, captured on 2026-10-19.

## What is saved

- `recovered/worker.js.gz`: lossless archive of the exact deployed `jrvx-id-next` bundle, SHA-256 of the extracted bytes recorded in `recovered/manifest.json`. `pnpm check` restores the ignored generated `recovered/worker.js`. All bundled license notices are preserved.
- `recovered/cloudflare-settings.json`: non-secret configuration and secret binding **names**, with no secret values.
- `schema/next-20261019.sql`: staging database schema, including indexes and triggers, without rows.
- `schema/production-20261019.sql`: current shared production database schema, without rows, for migration comparison.
- `wrangler.jsonc`: configuration restricted to the existing staging Worker and its isolated D1.
- `test/runtime.test.mjs`: runtime integration checks with a disposable local D1. Nothing connects to the remote database.

The downloaded bundle is a recovery artifact, not the original maintainable source. Original modules, package manifests for the bundled application dependencies, and its source map have not been recovered. The development dependencies here reproduce local execution and upload of the exact bundle. They do not rebuild it from original application source. Complete MFA, Passkey, recovery, and product OIDC flows still require end-to-end tests before production migration.

## Local verification

Use Node.js 24 and pnpm 11.25.0:

```sh
cd identity
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm types
```

`pnpm build` is a Wrangler dry run. The Miniflare version is pinned to the version used by Wrangler; the older stable Miniflare tag does not support this Worker's compatibility date. Only `esbuild` and `workerd` native install scripts are permitted.

For interactive local development, initialize an empty local D1 once with the staging schema using `pnpm exec wrangler d1 execute DB --local --file schema/next-20261019.sql`, and supply freshly generated local secrets in ignored `.dev.vars`. Required names are `SECURITY_SECRET` and `OIDC_SECRET` (each at least 32 characters); real Cloudflare secret values are not needed for local testing. Keep the existing canonical origin/host checks in mind when using localhost. The runtime test suite already handles this through `dispatchFetch`.

Schema snapshots describe a captured database, including triggers. They are **not incremental migrations** and must never be applied to an existing database. Fresh databases also need reviewed seed data for apps and OIDC clients; schemas alone do not restore those records.

## GitHub checks and staging deployment

`.github/workflows/identity-ci.yml` verifies checksums, runtime behavior, and the dry-run upload on pushes and pull requests.

`.github/workflows/identity-staging.yml` is manual and only runs from `main`. Before enabling it:

1. Merge the reviewed recovery PR.
2. Create the GitHub environment `jrvx-id-staging` and set its deployment branch policy to `main`.
3. Add the environment secret `JRVX_ID_STAGING_CLOUDFLARE_API_TOKEN`. Use a dedicated Cloudflare token scoped to this account with the permissions required for deploying the staging Worker and reading its bindings. Do not put a token in repository files or send it in chat.
4. Run **Deploy JRVX ID staging**. It checks and tests first, preserves runtime secret bindings, records the Git commit in the deployment message, and performs HTTP smoke checks.

No scheduled/push deployment is enabled. There are no production routes or production database bindings in the deployment configuration. Runtime secrets already in Cloudflare remain there; the deployment does not generate, read, or rotate them. Existing secret binding names: `OIDC_SECRET`, `SECURITY_SECRET`, `TURNSTILE_SECRET`.

Manual local staging deployment: commit a reviewed change, authenticate Wrangler through the normal Cloudflare login, and run `pnpm deploy:staging`. Do not deploy uncommitted working files.

`pnpm smoke:staging` checks only public pages, health, assets and unauthenticated API access. It performs GET requests and does not log in or send mail. This is not full authentication acceptance testing.

## Current topology and release work

See [the current architecture and rollout plan](docs/ROLLOUT.md). Keep the REG.RU gateway arrangement until its availability purpose, forwarded identity/HMAC handling, cookies and certificate renewals have been verified. Cloudflare settings for proxied hosts do not describe the TLS protection of a DNS-only REG.RU host.

The recovery PR does not switch users or change DNS, TLS, login, mail delivery or remote D1 data. The next release requires original-source recovery/reconstruction, data migration rehearsal, OIDC redirect/client verification, MFA and recovery acceptance tests, and an explicit cutover plan.
