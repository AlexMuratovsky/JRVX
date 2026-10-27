# JRVX MedHelper · MVP 0.1

Independent student-facing learning app in the JRVX ecosystem. Public branding is **JRVX MedHelper**, icon **mh**. This directory can be added alongside the existing `identity/` and `planner/` directories without editing either service.

## What works today

- Responsive interface for desktop, tablet, and iPhone in the existing JRVX paper / green / lime palette.
- Subject creation and deletion. Optional lecture topics and academic deadlines.
- Local PDF, DOCX, TXT, RTF, MD and JSON material storage in the browser (IndexedDB), with download and deletion. Maximum 15 MB per file.
- Manual discipline import from a Planner JSON export; the user selects which detected subjects to add. The parser recognises common schedule fields. **This is not account synchronisation.**
- The five learning workflows: practice paper, essay, video lesson search, multiple-choice tests, slide presentation outline. For each, choose a topic and one format/complexity option.
- Country of preferred medical literature: Russia by default, override globally, by subject or by generation. Source-precedence and bibliography instructions appear in generated AI prompts.
- Prepared prompts can be copied, downloaded as TXT and reviewed in local history.
- A store interface for future purchase packs; it does not accept payments.

**Important:** The client is currently a labelled, offline **prototype**. Prepared prompts are not AI-generated medical papers. It does not contact OpenAI, verify clinical sources, create PPTX files, authenticate a user, or process payments. Locally stored PDFs/DOCX are **not yet parsed or sent to AI**. No real medical patient data should be stored in the prototype.

The separate `backend/` folder includes a starting point for a production Cloudflare Worker, D1 SQL schema, cryptographic RS256 access-token verification, server-side daily quota (3 free requests per Moscow calendar day), purchased balance reservation, idempotent generation requests, and server-only AI adapter. These backend features require the JRVX ID/OIDC contract, an isolated D1 instance, a configured provider and production integration testing. They are **not connected to the front-end** in 0.1.

## Run the local demo

The simplest way: open the separate `JRVX-MedHelper-PREVIEW.html` file supplied with the download in a browser; it is self-contained.

From this source tree:

```sh
npm run preview
# open http://localhost:8080/
```

No third-party runtime dependencies are needed for the client.

## Tests and static build

```sh
npm test
npm run build
```

The build places the static site in `dist/`.

## Cloudflare deployment pathway — not activated

1. Confirm with JRVX ID maintainer that access tokens are RS256 JWTs and that the verified OIDC issuer, JWKS endpoint and `jrvx-medhelper` audience are available. If identity uses opaque tokens, replace the JWT adapter with a trusted service-binding verification flow; do not invent an auth endpoint or trust browser user IDs.
2. Create a **new, isolated D1 database** for MedHelper. Never reuse the Identity or Planner databases. Apply `backend/migrations/0001_init.sql` only to that new database.
3. Copy `wrangler.jsonc.example` to `wrangler.jsonc`, fill real D1 id, verified JRVX ID metadata and an available model. The example JWKS path is intentionally a placeholder, not a claimed existing endpoint.
4. Add `OPENAI_API_KEY` as a Cloudflare Worker secret; never bundle a secret in client code. Configure the JRVX ID OIDC client and secure login/PKCE in the browser; it is not included yet.
5. Add R2 with per-user access checks, text extraction from supported PDFs/DOCX, sourced retrieval and citation verification before allowing uploaded files to influence AI. Clinical citations should not be considered verified merely because a model generated them.
6. Add a payment provider, signed verified webhooks and an idempotent credit-ledger transaction. Prices are deliberately unset.
7. Implement genuine PPTX export and verified video-resource discovery with usable metadata.
8. Only then deploy a new Worker / subdomain (suggested `med.jrvx.ru`) and perform staging, security and release checks.

## Data protection and accounting

- Do not send identifiable patient information to the model without a vetted legal and security basis.
- Store attachments in R2 (later), store metadata/ownership/quotas in MedHelper D1. Scope every read and write by the authenticated JRVX ID `sub`.
- Quotas reset by configured server time zone (default `Europe/Moscow`); 3 complimentary requests per user and day. Purchased credits are a separate ledger/balance and do not expire when free quota resets.
- Never debit a user for a draft prompt. The backend reserves credits only for a real AI request; on caught provider errors it refunds. Production needs reconciliation for interrupted in-flight jobs and a robust outbox/ledger before real payments.
- Treat medical references as unverified until independently checked against the selected country's reputable sources. Under no condition fabricate citations.

## Architecture

```text
medhelper/
  index.html             # SPA entry point
  assets/mh.svg          # editable vector brand symbol
  src/app.js             # mobile/desktop UI and local workflows
  src/core.js            # pure domain logic and country/source rules
  src/styles.css         # JRVX visual system
  backend/auth.mjs       # strict JWT signature validation boundary
  backend/worker.mjs     # experimental Worker API and daily quota
  backend/migrations/    # isolated D1 SQL schema
  scripts/build.mjs      # static assets
  tests/*.test.mjs       # JS tests
  wrangler.jsonc.example # no secret keys or real database IDs
```

Status: functional client MVP and backend integration scaffold, no live production deployment.
