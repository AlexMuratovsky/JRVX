# JARVIS

Recovery/migration repository for the existing **JARVIS — личный планировщик**.

Current production Site:
- https://planhelper-alemura.gleb-v-markevich.chatgpt.site

ChatGPT Site project:
- slug: `planhelper-alemura`
- project id: `appgprj_6aafd5f13ddc819197f9aeb91c609a6b`
- source version observed: `3`

## Migration rule

This repository is for migrating the **existing JARVIS**, not replacing it with a different app.

Preserve:
- frontend and mobile UX;
- existing users/authentication;
- existing backend/API behavior;
- existing database and user isolation;
- schedules, events, tasks, notes and plans;
- Plans;
- Mini-games: Hangman and Pong;
- AI chat / OpenAI integration;
- future ChatGPT custom-app / MCP integration.

Secrets such as `OPENAI_API_KEY` must never be committed.

## Recovery status

The original ChatGPT Site is preserved. A GitHub Actions workflow captures the publicly delivered production bundle so the real client can be inspected and archived before any reconstruction work.
