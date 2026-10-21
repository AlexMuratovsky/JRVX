# JRVX ecosystem website

[jrvx.ru](https://jrvx.ru/) is the marketing website for the JRVX ecosystem.
`static/` is its complete buildless implementation: homepage, six project-detail
pages, local assets, navigation and project filters. `app/`, `components/` and
`lib/` retain the corresponding React presentation for review and recovery.
The complete Planner application is now in [`../planner/source/`](../planner/source/).

## Public structure

- `jrvx.ru`: ecosystem information and project catalogue only.
- `id.jrvx.ru`: account and connected applications.
- `planner.jrvx.ru`: tasks, schedule, plans, notes and JRVX Arcade.
- `cas.jrvx.ru`: virtual-unit games, 18+.

MineCore and CORE are absent. The former-planner FAQ and footer link have been
removed from every marketing page. `.htaccess` redirects legacy application
routes to `planner.jrvx.ru` rather than a Sites URL. Further marketing cleanup
and RIFT removal are being finalized; their final public checks are pending.

Planner and Arcade use the same paper, green and lime visual palette as this
website. JRVX ID receives its matching presentation through
`identity/gateway/runtime/ecosystem-ui.css` and `ecosystem-ui.js`; the production
legacy-gateway adapter is `identity/gateway/ecosystem-legacy-index.php`.
Connected CAS and Planner launchers use verified application state. These
presentation changes do not replace the separate next identity candidate.

## Deployment

REG.RU serves the marketing files directly from `/www/jrvx.ru`. The public root
and `www` DNS records point to that host; `www` redirects to the canonical HTTPS
root. Native Sites publishing does not update this website, and GitHub commits
alone do not publish it.

Build the deployment ZIP from the repository root:

```sh
python ecosystem/package-static.py
```

`reg-site.zip` contains only `static/` contents, with files 0644 and directories
0755, including hidden hosting configuration. Upload and extract only this
package into the marketing website root; preserve and verify those modes. For
local preview, serve `static/` with an ordinary static HTTP server. There are no
external scripts, fonts, images or runtime API dependencies.

The migrated application uses the `jrvx-planner-full` Cloudflare Worker behind
the REG.RU Planner gateway and `planner-full-backend.jrvx.ru`. The current
deployed Worker version is `15e1de84-371b-431a-81c8-9f06d73cab2a`, with generated
assets. The public domain is switched and HTTP requests receive an HTTPS 308
redirect. Authenticated canary task and plan CRUD checks passed. The source
passed 66 tests, TypeScript, the production build and the Wrangler dry run.
AI-chat entry points are deliberately hidden by `ai-disabled` at the owner's
request; no new API key is required for this release. See
[`../planner/README.md`](../planner/README.md) for the application, data migration
and external MCP limitations.

## Retained recovery version

The original complete Sites application remains in project
`appgprj_6aafd5f13ddc819197f9aeb91c609a6b`, saved version 5, source commit
`3875c65dc5ce7db110bc7fb3522656b440d3fd3c`. It is a recovery copy, not the main
marketing site's publishing target. Private database snapshots and credentials
are kept outside this repository.

Public checks verified the old-planner link removal and successful JRVX ID page,
stylesheet and script responses. Planner and ID styling are published. CAS search
and ecosystem links are also published; gameplay was not tested. Arcade retains
local saves, and its existing cloud synchronization is unavailable. Final checks
for the ongoing marketing cleanup and RIFT removal remain pending.
