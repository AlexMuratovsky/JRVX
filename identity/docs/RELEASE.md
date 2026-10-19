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
