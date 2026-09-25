# Recovered JRVX API contract

This is a compatibility map recovered from the deployed production client. It is documentation for reconstruction; it is not permission to change production behavior.

## Authentication

- `GET /api/auth/session`
  - observed UI fields: `signedIn`, `username`, `hasPassword`, `mode`
- `POST /api/auth/login`
  - body: `{ username, password }`
- `POST /api/auth/register`
  - body: `{ username, password, linkExisting }`
- `POST /api/auth/change-password`
  - body: `{ currentPassword, newPassword }`
- `POST /api/auth/logout`
- `POST /api/auth/link-chatgpt`
  - body: `{ password, confirmed: true }`
- `GET /auth/chatgpt`
  - browser/top-level ChatGPT authentication flow

## Planner entries

- `GET /api/entries`
  - response observed as `{ entries: [...] }`
  - `401` is treated by the current UI as `AUTH_REQUIRED`
- `POST /api/entries`
  - create task/event
- `PUT /api/entries`
  - update task/event
- `DELETE /api/entries`
  - observed delete body: `{ id, version, confirmed: true }`

Observed entry concepts include:

- `id`
- `version`
- `kind: "task" | "event"`
- `title`
- `category`
- `date`
- `start` / `end`
- `startsAt` / `endsAt`
- `timeZone`
- `location`
- `priority`
- `done`
- `note`
- `tags`
- recurrence fields such as `repeat`, `rrule`, `until`

## Planner action layer

- `POST /api/v1/actions/planner_context`
  - empty JSON body in current UI
  - response includes `timeZone`
- `POST /api/v1/actions/set_time_zone`
  - body: `{ timeZone }`
- `POST /api/v1/actions/set_task_completion`
  - observed recurring-task body:
    `{ id, version, completed, occurrenceDate }`
- generic action route exists:
  - `/api/v1/actions/:action`

## Reminders

- `GET /api/reminders/due`
  - response: `{ items: [...] }`
  - observed item fields: `receiptId`, `title`, `remindAt`
- `POST /api/reminders/due`
  - acknowledge body: `{ receiptId }`

## Plans

Production route manifest exposes:

- `/api/plans`
- `/api/plans/categories`

The reconstructed client keeps plan writes disabled until request/response shapes are verified in full.

## JRVX AI / chat

Production route manifest exposes:

- `/api/chat/config`
- `/api/chat/send`
- `/api/chat/threads`
- `/api/chat/threads/:id`
- `/api/chat/attachments`
- `/api/chat/attachments/:id`
- `/api/chat/transcribe`
- `/api/ai/settings`

## Action confirmation / Undo

- `/api/confirmations/:id`
- `/activity`

The current production client retrieves a pending confirmation and POSTs approval/rejection with a CSRF token before announcing that application data changed.

The reconstructed source uses the new internal browser event `jrvx-changed`. Any deployed compatibility bridge for an older event name must live outside public application code and be removed after migration.

## Integration surfaces

- `/api/v1/openapi.json`
- `/mcp`
- `/health`
- `/integration`
- `/import`

## Reconstruction safety

The reconstructed application defaults to **read-only** API behavior.

To enable mutation calls explicitly:

```text
VITE_JRVX_ENABLE_WRITES=true
```

Do not enable writes against production until auth cookies, CSRF/confirmation behavior, version conflict handling, and all write schemas have regression tests.
