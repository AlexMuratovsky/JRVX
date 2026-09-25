# JRVX

Recovery/migration repository for the existing **JRVX — личный планировщик**.

## Production

Primary public domain:
- https://jrvx.ru

Fallback ChatGPT Sites URL:
- https://planhelper-alemura.gleb-v-markevich.chatgpt.site

ChatGPT Site project:
- slug: `planhelper-alemura`
- project id: `appgprj_6aafd5f13ddc819197f9aeb91c609a6b`
- source version observed: `3`

## Migration rule

This repository is for migrating and evolving the **existing JRVX**, not replacing it with a different app.

Preserve:
- frontend and mobile UX;
- existing users/authentication;
- existing backend/API behavior;
- existing database and user isolation;
- schedules, events, tasks, notes and plans;
- Plans;
- Mini-games;
- JRVX AI / OpenAI integration;
- future ChatGPT custom-app / MCP integration.

## Branding

Canonical product brand: **JRVX**.

Use these public names consistently:
- JRVX
- JRVX AI
- JRVX Arcade
- JRVX Poker
- JRVX Racing

Do not reintroduce the previous product name in user-facing UI, documentation, artifact names, workflow names, or new public API aliases.

Legacy internal identifiers may remain only when changing them would break stored data, compatibility, deployed integrations, or migrations. New identifiers should use `jrvx`.

## Secrets

Secrets such as `OPENAI_API_KEY` must never be committed.

## Recovery status

The original ChatGPT Site remains preserved as a fallback. A GitHub Actions workflow captures the publicly delivered production bundle so the real client can be inspected and archived before reconstruction or migration work.

The workflow prefers `https://jrvx.ru/` and automatically falls back to the ChatGPT Sites URL if the custom domain is temporarily unavailable.
