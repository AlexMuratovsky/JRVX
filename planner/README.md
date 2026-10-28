# JRVX Planner

`source/` contains the complete independent Planner application: UI, server
routes, schema migrations, Arcade assets, tests, build scripts and pinned
dependencies. It is a source mirror, not a patch over the marketing website.
It was copied from the retained Sites application on 20 October 2026 and updated
for JRVX branding, the ecosystem visual style and standalone authentication.

## Hosting

- Public application: https://planner.jrvx.ru/
- Public Arcade: https://planner.jrvx.ru/games
- REG.RU serves the generated static assets and `gateway/index.php` forwards
  dynamic requests to https://planner-full-backend.jrvx.ru/.
- Cloudflare Worker: `jrvx-planner-full`.
- Deployed version: `15e1de84-371b-431a-81c8-9f06d73cab2a`, including generated
  assets.
- The `DB` binding uses the existing `jrvx-production` database.
- `IDENTITY` verifies the existing JRVX ID session through `jrvx-identity`.
- `LEGACY_PLANNER` retains access to the previous `/api/tasks` and `/api/me`
  handlers in `jrvx-planner`.
- https://jrvx.ru/ remains the public ecosystem presentation website.

The original Sites application and database are retained as a recovery copy.
This mirror has no Sites `project_id` or MCP capability in its hosting manifest;
do not publish it over that retained application. `.openai/hosting.json` now
contains only the logical local build binding configuration.

`source/wrangler.jsonc` describes a reproducible direct Cloudflare deployment.
Its module rules include only the generated server JavaScript and entry point;
static HTML, source SQL and package dependencies are not uploaded as unused
Worker modules. Static files belong to the asset directory and REG.RU package.

## Build and verify

Use Node.js 22.13 or newer and the pinned pnpm 11.25.0. From `source/`:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm build
node scripts/prepare-standalone.mjs
pnpm exec wrangler deploy --config wrangler.jsonc --dry-run
```

After reviewing the dry run, the same configuration can be deployed with
`pnpm exec wrangler deploy --config wrangler.jsonc`. Deployment requires an
authorized Cloudflare login or suitably scoped credential; none is stored here.
Upload the generated `dist/client` assets together with the separate `gateway/`
files to the REG.RU website root. `deploy/planner-reg.zip`, when generated, is the
prepared hosting package. Never upload the source checkout or private backups.

Production data migrations are a separate controlled operation. Do not blindly
reapply the copied `drizzle/` SQL to the existing production database.

## Data migration record

The account had reached its ten-database quota, so the migrated Planner tables
were added to the existing production database after checking for name
collisions. Existing identity tables and `planner_items` were not changed.

The original 14 planner entries, four plans, one password credential, preferences,
request keys, session hashes and authentication rate-limit rows were copied with
their existing owners and values. There were no attachment or chat records to
move. Importing the 14 entries generated 14 initial audit-history events through
the application's existing insert trigger. Original snapshots and credentials
are kept in private recovery storage, outside this repository.

The copied password account remains separate from a JRVX ID account until the
authenticated user explicitly links it and confirms the Planner password.
Matching names do not merge accounts. Raw Sites identity headers are rejected
at the standalone boundary.

## Current scope and validation

The user chose to publish without AI chat. Its implementation remains in the
source for later configuration, but the main UI deliberately hides AI-chat and
voice entry points. No new OpenAI API key was created or copied into this
repository. The previous Sites/ChatGPT MCP connection is not authenticated
against this standalone database; portable OAuth code is retained but is not
wired into the production `/mcp` route.

Arcade retains its local-save behavior. Its existing cloud synchronization
service is unavailable; the visual update does not add a replacement backend.

All visible product branding is JRVX. Historical `jarvis-*` event names, local
save keys and compatibility aliases remain stable so existing integrations and
Arcade saves are not renamed accidentally. Copied implementation reports and
deployment notes inside `source/` are historical material; this document
describes the current deployment target.

The release passed all 66 tests, TypeScript, the production build and a direct
Wrangler deployment dry run. The checks include ID-only logout, rejection of
forged Sites credentials and the fresh-account time-zone fix. The public REG.RU
gateway is switched, HTTP redirects to HTTPS with status 308, and authenticated
canary checks passed for task and plan create/read/update/delete operations.
These checks do not cover Arcade cloud synchronization or the retained external
Sites/ChatGPT MCP integration.

The combined REG.RU release is deployed and the Planner health endpoint returns
200.
