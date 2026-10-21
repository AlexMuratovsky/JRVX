# JRVX ID ecosystem presentation

These two progressive assets target the current production legacy ID template on
`https://id.jrvx.ru/`, `/index.html` and `/email`. They do not replace the newer
`src/client/id-next.*` staging client and must not be injected into unrelated pages.

## Injection

After the existing inline styles, before `</head>`:

```html
<link rel="stylesheet" href="/runtime/ecosystem-ui.css?v=20261020">
```

After the existing `/runtime/email-ui` and `/runtime/admin-search` scripts,
before `</body>`:

```html
<script src="/runtime/ecosystem-ui.js?v=20261020" defer></script>
```

Serve these exact same-origin GET paths as `text/css; charset=utf-8` and
`application/javascript; charset=utf-8`, with `X-Content-Type-Options: nosniff`.
They need only the existing `script-src 'self'` and `style-src 'self'` CSP; no
external font, script, image, API, inline event handler or new CSP exception is
needed. If the hosting rewrite sends all paths to PHP, explicitly map these two
paths to fixed local asset files before the existing route allowlist. Do not let
the request choose an arbitrary file or upstream. Keep authenticated HTML and
API responses private/no-store. The two non-personal assets can use normal
versioned asset caching.

## Verified production contracts

- Root DOM: `main.card`, `.brand`, `#auth`, `#account`, `#apps`, `.foot`,
  `#gatewayStatus`, `#gatewayStatusDot`, login/register input and button IDs.
- `#account.active` is set by the existing code only after a successful
  `/api/identity/me` response; this enhancement observes that state.
- `GET /api/identity/apps` requires the existing same-origin cookie session and
  returns `{ok:true, apps:[...] /* catalog */, linked:[...] /* this user */}`.
  The implementation was verified in the recovered production Worker functions
  `handleIdentityApps` and `linkedAppsForUser`. Anonymous requests return 401.
- A connected badge requires a matching `app_key` in `linked`, with `status`
  `active`, and an active matching catalog row. Catalog membership alone is
  never interpreted as a user connection. Malformed/failed responses retain
  the original authenticated list and show a retry option.
- Only the pinned launch destinations `https://planner.jrvx.ru/` and
  `https://cas.jrvx.ru/` are used. API-provided URLs are never used. Other linked
  project names are rendered as text only. CAS retains its 18+ label.
- No POST, linking, permissions, cookies, local storage, credential handling,
  admin actions or auth callbacks are added or changed.
- Existing email verification/reset UI and admin search remain installed. Their
  pale inline message colors are translated to readable success/error colors
  without changing text or behavior.

## Checks and handoff

Run JavaScript syntax and CSS parsing checks, then visually check the root page
signed out and signed in, both tabs, `/email?mode=verify`, login/reset code flows,
admin search if the current user has access, and the two pinned project links.
Test at narrow widths as well as desktop. This asset-only source preparation
does not by itself prove deployment or browser QA.
