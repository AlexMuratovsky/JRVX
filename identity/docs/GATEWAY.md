# REG.RU gateway recovery and next-version candidate

## Observed on 2026-10-20

The authenticated REG.RU hosting panel and ispmanager were inspected. The ID site uses PHP FastCGI (Apache) 8.3.31, SSL with a certificate covering `id.jrvx.ru` and `id-reg.jrvx.ru`, and HSTS. The panel's HTTP-to-HTTPS redirect and file-cache options are unchecked. The PHP entry point independently rejects non-HTTPS requests. No hosting, DNS, certificate or production-file setting was changed during this inspection.

The public directory is `~/www/id.jrvx.ru`. It contains `index.php`, `.htaccess`, an older static `index.html`, `email-ui.js`, `admin-search.js`, and `.well-known/`. Apache routes most requests through PHP. Two fixed legacy JavaScript files and existing ACME challenges are exceptions; PHP also serves `/runtime/email-ui` and `/runtime/admin-search` to avoid the provider's static-file interstitials.

The active PHP proxy sends ID requests to `https://id-test.jrvx.ru`. That domain reaches the legacy Worker and shared production D1. Its `test` name does not make it a disposable environment. The observed gateway also contains Planner routing, but the candidate in this package is **ID-only** and must never replace the Planner site's entry point.

`gateway/recovered/` preserves the complete editor text of the two routing files as UTF-8/LF, with SHA-256 in its manifest. The checked files contain no credentials or user records. This is a source-text recovery, not a raw hosting snapshot, certificate backup, private-config backup or database backup. Other static files were listed but not copied. A separate local recovery copy was retained outside the Git checkout.

The hosting card showed **paid through 2026-10-24**. Renewal requires the owner's billing action; no payment or renewal setting was changed.

## Why the current proxy cannot serve the new application

| Contract | Observed active proxy | Candidate |
| --- | --- | --- |
| Routes | Legacy API, fixed old assets | Explicit new assets, security, profile, privacy, app grants, admin, export and OIDC routes |
| Upstream identity | Original host sent by cURL; no gateway credentials | Server-held gateway credential plus a per-client HMAC derived from hosting `REMOTE_ADDR` |
| Browser mutations | Several ecosystem origins accepted | Canonical `https://id.jrvx.ru` only; token/revoke server calls may omit Origin |
| Body bounds | 32 KiB | 64 KiB normally; 256 KiB for avatar upload, matching the Worker |
| Response headers | Build provenance and export filename dropped | Retains source build, release, download filename, security headers and separate cookies |
| Private responses | No-store | No-store retained for API/OIDC/OAuth and cookie-bearing responses |

The recovered Worker requires the shared gateway credential on its alternate ingress origin, then uses `x-jrvx-client-key` as the pseudonymous client identity for rate limiting. This is a shared gateway credential and HMAC client identifier, not a signature over the HTTP request. Incoming caller gateway keys, IP and forwarding headers are discarded by PHP. The candidate never disables upstream TLS verification, follows redirects or retries mutations.

## Candidate configuration

`gateway/index.php` and `gateway/.htaccess` are **not installed on REG.RU**. The PHP candidate fails closed without a separately enabled private configuration. The disabled example belongs at `~/jrvx-id-gateway.php`, outside `www/`, with owner-only permissions; never place the live file or its contents in Git, logs, screenshots or chat. The two allowed upstream origins are the observed legacy ingress and the isolated staging Worker. No request parameter or header can select a destination.

At cutover, the upstream origin must equal the new Worker's `GATEWAY_ORIGIN`; its `IDENTITY_ORIGIN` and `OIDC_ISSUER` must remain `https://id.jrvx.ru`. Both ends must receive the same newly generated `GATEWAY_SECRET`. Preserve `OIDC_SECRET`, reviewed owner identity, Resend configuration and the migrated OIDC signing data. Reusing the old proxy alone, or pointing this candidate at the unchanged legacy Worker, does not establish that configuration.

The candidate permits redirects to the canonical ID origin, the configured upstream (rewritten to the canonical origin), Planner and CAS. Compare this explicit list against the reviewed production client registry before release; any other legitimate client origin needs a tested allowlist change. Unknown destinations remain blocked. The `id-reg` alias remains rejected as an application host, as it was by the recovered PHP proxy.

## Verification and release sequence

1. Install PHP 8.3 or later for local checks. Set `PHP_BIN` to its executable path when it is absent from PATH. `pnpm test` runs the PHP contract fixtures alongside the existing Worker and migration checks. CI fails if PHP is unavailable or too old.
2. Rehearse migration on a protected consistent identity snapshot and validate product registry, redirects, issuer, signing keys and rollback. Retain the active legacy Worker version, its bindings and the gateway source recovery. Code rollback alone cannot undo post-cutover writes.
3. Prepare a separate canary through the real hosting transport, with isolated data and the correct origin/gateway/Turnstile configuration. Verify actual PHP/cURL TLS behavior, encoded queries, all response cookies, asset MIME types and cache rules. Exercise sign-in, recovery, avatar, export and product OIDC. Do not run mutation tests against `id-test.jrvx.ru` while it reaches production.
4. Confirm physical iPhone/Safari reachability and Passkey prompts. Keep ACME challenge routing working and inspect certificate renewal. Existing desktop tests do not prove these device/network properties.
5. Only after acceptance, coordinate the production Worker/data/ingress and the ID gateway replacement. Keep the exact preceding files outside the public directory. Read back installed files, run public and product probes, and use the defined rollback conditions.

Local checks currently cover route compatibility with the editable client, host/path/origin rejection, forged identity headers, stable IP HMACs, cookie isolation on OAuth token routes, cache/security/download headers, configuration rejection and Worker gateway authentication. A synthetic signup-to-logout flow uses the actual PHP header/route functions and local Miniflare Worker, including a 40 KiB avatar and authenticated export. No external networking or real email is used. These are contract tests; they do not launch the REG.RU web server or exercise its cURL transport.

The local runtime was the official Windows PHP 8.3.31 NTS archive from [PHP's Windows archives](https://downloads.php.net/~windows/releases/archives/), matching the hosting's PHP version. No global PATH or hosting PHP version was changed.
