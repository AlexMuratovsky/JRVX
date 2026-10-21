# JRVX

JRVX is an ecosystem of account, planning and game projects.
[jrvx.ru](https://jrvx.ru/) is its marketing website: an introduction to the
ecosystem and a catalogue of projects. Applications run on their own subdomains.

## Public projects

- [JRVX ID](https://id.jrvx.ru/): account and connected services.
- [JRVX Planner](https://planner.jrvx.ru/): tasks and the embedded Arcade module.
- [JRVX CAS](https://cas.jrvx.ru/): virtual-unit table games, 18+.
- JRVX AI and RIFT are experimental directions, not separate public launches.

MineCore and CORE have been retired. See [the retirement record](docs/retirement-2026-10-20.md).

## Source and deployment

- `ecosystem/static/`: the complete buildless marketing website for REG.RU.
- `ecosystem/app/` and `ecosystem/components/`: its React presentation mirror.
- `planner/source/`: the complete migrated Planner application and Arcade.
- `planner/gateway/`: the REG.RU transport for the standalone Planner Worker.
- `identity/gateway/runtime/ecosystem-ui.*`: JRVX ID presentation and verified
  connected-application launchers for CAS and Planner.
- `identity/gateway/ecosystem-legacy-index.php`: the production legacy-gateway
  adapter that serves those presentation assets; the next identity candidate
  remains a separate implementation.
- `reconstructed/`: the earlier planner reconstruction, retained as a reference.
- `production-snapshot/`: historical recovery evidence.

The main marketing package removes the former-planner FAQ and footer link from
all pages. Legacy application routes redirect to `planner.jrvx.ru`.

The complete Planner copy runs in the separately deployed Cloudflare Worker
`jrvx-planner-full`, with REG.RU serving assets and forwarding dynamic requests to
`planner-full-backend.jrvx.ru`. The original Sites project
`appgprj_6aafd5f13ddc819197f9aeb91c609a6b` is retained for recovery. It no longer
publishes the marketing website. GitHub commits do not automatically publish
these hosting targets.

The new Planner Worker is built and deployed; its REG.RU public-domain switch
and final browser verification are pending. AI chat is deliberately disabled at
the owner's request. See [marketing deployment notes](ecosystem/README.md) and
[Planner deployment and data notes](planner/README.md).

## Branding and secrets

Canonical brand: **JRVX**. Account service: **JRVX ID**.
Use `jrvx` for new internal identifiers. Preserve legacy identifiers only when
needed for compatibility. Never commit runtime secrets or user data.
