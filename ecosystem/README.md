# JRVX ecosystem website

This directory mirrors the public presentation layer deployed on 20 October 2026.
It is an overlay for review and recovery, not an independent runnable application.
The complete application, including the retained planner backend, is in the
existing Sites source repository.

## Deployed state

- Public domain: https://jrvx.ru/
- Sites fallback: https://planhelper-alemura.nezhnnno.chatgpt.site/
- Sites project: `appgprj_6aafd5f13ddc819197f9aeb91c609a6b`
- Source commit: `3875c65dc5ce7db110bc7fb3522656b440d3fd3c`
- Saved version: 5
- Saved version ID: `appgprj_6aafd5f13ddc819197f9aeb91c609a6b~appgver_e66e526360688191b8c071fe5ab8875a`
- Deployment: `appgdep_6ad753a018188191a605c5d044721e8a` (succeeded)
- Archive SHA-256: `4bfb7b436951c6941be06e02279b1be30d2a0295bd9f90f8bbd6545953d2c516`

## Behavior

The homepage introduces JRVX and groups six verified projects/directions into
apps, games and laboratory work. Each has a detail page. Only the public ID,
Planner and CAS services have external launch links; Arcade opens Planner.
AI remains an experimental direction. The public catalogue lists supported applications.

The Sites implementation also preserves the previous planner at `/workspace`,
redirects known old `/?view=` links, updates legacy return links and the ChatGPT
sign-in destination, and keeps the existing D1/R2/MCP bindings. No database
migration or planner-data deletion was performed for this redesign.

## Validation

- Full production Vinext build passed.
- Existing integration suite: 61 checks passed.
- TypeScript validation passed.
- Home and all six project pages returned 200; an unknown slug returned 404.
- Robots and sitemap endpoints returned 200.
- Mobile menu and project filtering checked in a real browser.
- Layout checked at widths 320 and 390, with no horizontal overflow.
- Old planner links and authentication return destinations checked.

Deploy updates through the existing Sites project with its current audience and
bindings. Open its source with the official source helper, edit, validate, push
that source, save its matching archive and deploy the saved version. GitHub is a
source mirror; commits here alone do not publish production.

## REG.RU static edition

`static/` is the complete buildless public presentation website. `reg-site.zip`
is its deployment package, with files placed directly in the website root.
It has no external scripts, fonts, images, API calls or runtime dependencies.
Its menu and filters use `ecosystem.js`; project pages are ordinary HTML.

This edition was prepared because the Sites/Cloudflare route returned 403 or
closed connections from the owner's network. REG.RU already hosts the other
public JRVX entry points. The root and www certificates were issued by Let's
Encrypt on 20 October 2026, valid through 18 January 2027.

The previous complete Sites application is retained separately. The static
edition links its previous planner at the Sites fallback URL; `.htaccess` also
redirects old routes there. It does not duplicate or move planner user data.

Local preview: serve `static/` with an ordinary static HTTP server. Repackage
only that directory for hosting; do not upload this repository or credentials.

## Production rollout verified

The public `jrvx.ru` and `www.jrvx.ru` A/AAAA records now point directly to the
existing REG.RU host. The temporary root-domain attachment in Sites was removed.
`www` redirects to the canonical HTTPS root. Main, project pages and assets
returned 200; an unknown page returned 404. ID, Planner and CAS stayed available.
The root certificate chain was checked without disabling certificate validation.

The complete production presentation is `ecosystem/static/`. The separate Sites
source retains the complete prior planner application. Native Sites publishing
alone no longer updates the REG.RU website.

Build the deployment ZIP with `python ecosystem/package-static.py`. It stores
Unix modes 0644 for files and 0755 for directories, including hidden hosting
configuration. Preserve those modes when extracting on REG.RU. Verify them in
the file manager afterward. Upload only this package to `/www/jrvx.ru`.
