# Staging release and rollback

The deployable application has two modules: the unchanged, checksum-verified authentication recovery (`legacy.js`), and an adapter built from `src/worker.mjs` with editable `src/client/id-next.js` and `src/client/id-next.css`. Authentication, origin validation, cookies and security headers run before the adapter replaces a public asset. This restores maintainable client development; it does not recover original authentication/server source.

`pnpm check` verifies recovery/schema hashes and builds `.build/app/`. The build ID covers normalized source files, build configuration, lockfile and the recovery manifest. `.build/manifest.json` records SHA-256 for both modules. HTML references the same build ID exposed in `x-jrvx-source-build` and health, so browsers fetch updated assets after a release. Generated files and local paths are not committed.

## Release

1. Run `pnpm check`, `pnpm test`, `pnpm build`, and review the Git diff. Merge only after GitHub CI passes.
2. Record the currently deployed `jrvx-id-next` version UUID and module hashes. The initial recovery version is `002cb76b-6e0e-4c49-8dd9-6d48085ca35e`.
3. Deploy the committed staging package, preserving its existing secret bindings and isolated D1. Use the manual GitHub deployment workflow after configuring its dedicated environment credential, or the authenticated Cloudflare connector. CLI deployment requires normal Wrangler authentication.
4. Run HTTP smoke checks; confirm the build ID, asset contents, anonymous API guards and security headers. Check login/registration/recovery navigation, password controls and narrow screens in the browser.

There is no automatic production release. The GitHub connection can update repository code, but does not grant the Actions runner a Cloudflare deployment credential. Native Workers Builds token inventory is empty; repository autofill was unavailable when checked. Do not claim automatic deployment until a real workflow completes.

## Rollback

Use **Roll back JRVX ID staging** in GitHub with the exact previous version UUID, or:

```sh
pnpm rollback:staging PREVIOUS_VERSION_UUID
pnpm smoke:staging
```

The command validates the version format and restricts its Worker configuration to isolated staging. The Cloudflare deployment API can also deploy the previous version at 100%. Rollback changes code/configuration, not database contents; this release does not apply schema or data migrations. Do not use this as a production data restoration procedure.

## Mail verification, 2026-10-20 (Europe/Moscow)

One login-code email was requested through the existing `https://id.jrvx.ru` service for the owner-approved connected Gmail inbox. Gmail confirmed delivery to **INBOX**, with SPF and DKIM passing for the existing Resend configuration. No code was used to sign in, no password was changed, and no message body or account address is stored here. This verifies one destination and the current legacy sender, not every provider or staging mail integration.

A DMARC TXT policy was added only at `_dmarc.mail.jrvx.ru`: `v=DMARC1; p=none; adkim=r; aspf=r`. This does not enforce rejection and does not change the REG.RU MX/SPF records. No reporting destination is configured. Cloudflare Email Sending endpoints returned HTTP 401 while Workers and DNS access worked; switching providers is unnecessary for the current verified sender.

## Remaining public-release dependencies

- GitHub environment `jrvx-id-staging` needs its dedicated deployment token before Actions can deploy or roll back.
- A physical iPhone/Safari test is still required for system Passkey prompts and network availability. Desktop/narrow-viewport checks do not establish physical-device support.
- Production migration requires a protected snapshot rehearsal, product registry/redirect/issuer/secret continuity and access to the REG.RU gateway configuration. `id-test.jrvx.ru` shares production data and is not an isolated test target.
- Original server modules remain unavailable. The verified recovery is retained as a compatibility module rather than replacing authentication with a new implementation during client changes.

## Rehearsal completed on 2026-10-20

The final client source is Git commit `ce7db61f39f3ec03198f8799b560fcb66ba5e8c2`. Push and pull-request CI both passed all 23 checks, recovery verification and Wrangler dry-run. The updated client is deployed only at `https://jrvx-id-next.gleb-v-markevich.workers.dev`.

| Item | Verified value |
| --- | --- |
| Source build | `d78cbf6b8a1da0517556` |
| Worker version | `dba69433-06ed-4185-ae97-91a72255d09f` |
| Client adapter SHA-256 | `84e68fdb4946824d9a9a388320741e4bf66bd635bb37366a366bdc1c276a762d` |
| Authentication module SHA-256 | `20d696dc14a06e64581edb9f457c3dd8daf1448aa0c76362414acb75c053e82a` |
| Rollback target | `002cb76b-6e0e-4c49-8dd9-6d48085ca35e` |
| Successful rollback deployment | `6a571319-1932-40d6-ba3e-59891bd8e30a` |
| Restored final deployment | `0e0f96ff-37f8-40fa-bde5-afa9f7754304` |

Cloudflare version contents independently match both local module checksums. Existing bindings, including all three runtime secret names, were inherited from the exact recovery version without reading or replacing secret values.

The rollback was exercised against isolated staging, not only documented: the old version served health without the adapter build marker and passed all eight HTTP probes, then the final version was restored and passed all eight probes with `JRVX_EXPECTED_BUILD=d78cbf6b8a1da0517556`. An immediate probe briefly saw the preceding build during deployment propagation; the expected-build assertion detected it. Probes use fresh HTTP connections to avoid the local Node pooled-socket stalls observed during the earlier check.

Desktop browser checks verified login, registration/recovery navigation and the password visibility control. Browser viewport overrides at 390 and 320 pixels confirmed 16px form text, touch buttons of at least 44px and no horizontal overflow on registration/recovery views. The mobile heading line break was corrected after inspection. These were anonymous UI checks; no browser registration, physical device Passkey ceremony or real-user password change was performed. Automated authentication journeys use disposable synthetic local data.
