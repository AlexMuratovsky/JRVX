# JARVIS

Существующий личный органайзер на Vinext / React / TypeScript, Cloudflare Workers, D1 и R2. Сайт сохранён в том же проекте и использует прежнюю авторизацию; новая БД не создавалась.

Доступны расписание, задачи, заметки, отдельные планы с собственными категориями, каталог «Виселица» / Pong, AI-чат, preview/Undo, activity, reminders, import и search. AI-функции требуют server-side OpenAI key. Native Sites MCP сейчас заблокирован capability владельца; публичное подключение не заявляется работающим.

- [Интеграция и ограничения](CHATGPT_INTEGRATION.md)
- [Все 41 MCP tools и примеры](MCP_TOOLS.md)
- [Полные JSON Schema](MCP_TOOLS.json)
- [Развёртывание того же backend на Render](DEPLOY_RENDER.md)
- [Изменения, миграции и результаты](JARVIS_IMPLEMENTATION_REPORT.md)
- [Проверки](QA.md)

## Разработка

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm test
pnpm build:mcp
```

Для Sites используйте штатный preview/build/publish workflow. `pnpm db:generate` создаёт только добавочную Drizzle миграцию. Не изменяйте применённые миграции, не сохраняйте реальные планы в исходниках или тестах. `node scripts/export-mcp-catalog.mjs` обновляет контракт из действующих Zod schemas, проверяя примеры.

Новые разделы: `/plans`, `/games`, `/games/hangman`, `/games/pong`. Игры модульные: UI отдельно от словаря/правил и Pong engine/renderer/animation loop. Продуктовые данные plans находятся в D1; browser sessionStorage используется только для локального счёта Виселицы.
