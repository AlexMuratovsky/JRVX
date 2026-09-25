# JRVX production architecture snapshot

This document describes the recoverable structure of the currently deployed JRVX frontend captured from ChatGPT Sites.

## Status

- Canonical brand: **JRVX**
- Primary domain: https://jrvx.ru
- Fallback Sites URL: https://planhelper-alemura.gleb-v-markevich.chatgpt.site
- Captured frontend lives in `production-snapshot/`
- The snapshot is generated automatically by `.github/workflows/capture-production.yml`
- Public legacy branding is rejected by CI after the JRVX rebrand pass

## Captured routes

The current production bundle exposes at least these route payloads:

- `/`
- `/activity`
- `/chat`
- `/games`
- `/notes`
- `/plans`
- `/reminders`
- `/search`

These files are production outputs, not maintainable source modules.

## PWA metadata

`production-snapshot/manifest.webmanifest` currently identifies the application as:

- name: `JRVX — личный планировщик`
- short name: `JRVX`
- language: `ru`
- standalone display mode
- scope/start URL: `/`

## Main recovered frontend bundles

Notable compiled chunks include:

- `planner-DMDI4zkt.js` — main planner/application logic
- `planner-yvHZfzlB.js` — planner support code
- `index-BtDbsgHI.js` — application/runtime code
- `integration-time-FwKVE5e3.js` — integration/runtime support
- `action-preview-CmJ_qW5y.js` — action preview UI
- `alert-dialog-DPDsqwj9.js` — dialog primitives
- `framework-D_rUT4EX.js` — framework runtime
- `index.Bcdwy52g.css` — compiled application styles

Small Lucide/icon chunks are also present.

## Reconstruction rule

The `production-snapshot/` directory is a recovery reference and compatibility target.

Do not treat minified hashed bundles as the final development architecture.

The maintainable JRVX source should be reconstructed separately while preserving:

- current visual behavior;
- responsive/mobile behavior;
- routes;
- authentication contracts;
- backend/API behavior;
- database/user isolation;
- existing persisted data;
- event/task/plan/note semantics;
- AI integration;
- PWA behavior.

## Branding rule

All new maintainable source must use:

- `JRVX`
- `JRVX AI`
- `JRVX Arcade`
- `JRVX Poker`
- `JRVX Racing`

Legacy internal identifiers may only survive behind compatibility aliases when removing them would break stored data or deployed integrations.

## Next reconstruction layout

Target source layout:

```text
src/
  app/
  components/
  features/
    planner/
    tasks/
    events/
    plans/
    notes/
    reminders/
    search/
    activity/
    games/
    ai/
  lib/
    api/
    auth/
    storage/
    compatibility/
  styles/
public/
```

The recovery snapshot must remain committed until the reconstructed source reaches parity and has regression coverage.
