# JARVIS — отчёт по изменениям

Существующий проект доработан без новой БД, без переписывания frontend и auth. Полная спецификация действий и эксплуатационные ограничения — в [CHATGPT_INTEGRATION.md](CHATGPT_INTEGRATION.md).

## Новые Планы и Мини-игры

Планы: необязательная дата, описание, completion/active, CRUD, семь стандартных и собственные категории, поиск по названию/описанию и фильтры. Данные сохраняются в текущей D1 с owner, version и idempotency checks. Удаление требует явного подтверждения.

Виселица: локальный словарь 120 слов; шесть тематик и случайная, Ё, подсказки, шесть ошибок, SVG, результат и статистика вкладки.

Pong: canvas, единый RAF, движение по delta time с короткими подшагами, отскоки/ускорение/предел скорости; три ограниченных AI, клавиатура и Pointer Events; 7 очков, пауза, autopause, rematch, полная очистка listeners/RAF/ResizeObserver.

## Backend: новые и изменённые файлы

- `app/api/auth/[action]/route.ts`
- `app/api/confirmations/[id]/route.ts`
- `app/api/entries/route.ts`
- `app/api/v1/actions/[action]/route.ts`
- `app/mcp/route.ts`
- `lib/integration-http.ts`
- `lib/integration-schemas.ts`
- `lib/planner-auth.ts`
- `lib/planner-legacy.ts`
- `lib/planner-mcp.ts`
- `lib/planner-openapi.ts`
- `lib/planner-operations.ts`
- `lib/planner-service.ts`
- `lib/planner.ts`
- `app/api/ai/settings/route.ts`
- `app/api/chat/attachments/[id]/route.ts`
- `app/api/chat/attachments/route.ts`
- `app/api/chat/config/route.ts`
- `app/api/chat/send/route.ts`
- `app/api/chat/threads/[id]/route.ts`
- `app/api/chat/threads/route.ts`
- `app/api/chat/transcribe/route.ts`
- `app/api/plans/categories/route.ts`
- `app/api/plans/route.ts`
- `app/api/reminders/due/route.ts`
- `app/health/route.ts`
- `lib/ai-permissions.ts`
- `lib/ai-resources.ts`
- `lib/api-http-base.ts`
- `lib/chat-config.ts`
- `lib/chat-engine.ts`
- `lib/chat-files.ts`
- `lib/chat-http.ts`
- `lib/chat-store.ts`
- `lib/client-id.ts`
- `lib/date-resolver.ts`
- `lib/games/animation-loop.ts`
- `lib/games/hangman.ts`
- `lib/games/pong-engine.ts`
- `lib/games/pong-renderer.ts`
- `lib/openai-responses.ts`
- `lib/planner-backup.ts`
- `lib/planner-compatible.ts`
- `lib/planner-display.ts`
- `lib/planner-history.ts`
- `lib/planner-identity.ts`
- `lib/planner-import.ts`
- `lib/planner-oauth.ts`
- `lib/planner-occurrences.ts`
- `lib/planner-reminders.ts`
- `lib/plans-schema.ts`
- `lib/plans-service.ts`
- `lib/rate-limit.ts`
- `lib/recurrence.ts`
- `lib/reminder-schema.ts`
- `lib/semantic-search.ts`
- `lib/voice.ts`
- `server/d1-http.ts`
- `server/environment.ts`
- `server/handler.ts`
- `server/main.ts`

## Frontend: новые и изменённые файлы

- `app/account-panel.tsx`
- `app/confirm/[id]/page.tsx`
- `app/globals.css`
- `app/planner.tsx`
- `public/CHATGPT_INTEGRATION.md`
- `app/action-preview.tsx`
- `app/activity/page.tsx`
- `app/ai-settings/page.tsx`
- `app/chat/page.tsx`
- `app/games/hangman/hangman.tsx`
- `app/games/hangman/page.tsx`
- `app/games/page.tsx`
- `app/games/pong/page.tsx`
- `app/games/pong/pong.tsx`
- `app/import/page.tsx`
- `app/notes/page.tsx`
- `app/organizer-shortcuts.tsx`
- `app/plans/page.tsx`
- `app/reminders/page.tsx`
- `app/search/page.tsx`
- `app/section-shell.tsx`
- `app/voice-button.tsx`
- `public/DEPLOY_RENDER.md`
- `public/MCP_TOOLS.json`
- `public/MCP_TOOLS.md`

## Миграции

0000 и 0001 сохранены без изменений. Добавлены:

| Файл | Изменение |
|---|---|
| 0002_good_grim_reaper.sql | identity_links, chat_threads, chat_messages, chat_attachments, chat_runs |
| 0003_nervous_corsair.sql | AI permissions, mutation context, history, embeddings, reminders, receipts; confirmation_id у request keys |
| 0004_planner_audit.sql | Audit triggers для entries/reminders, инвалидация embeddings |
| 0005_dashing_texas_twister.sql | Tags файлов/чатов, extracted_text, инвалидация файлового индекса |
| 0006_panoramic_luckman.sql | OAuth flows/codes/grants/access/refresh |
| 0007_loose_microchip.sql | planner_plans и planner_plan_categories, owner indexes и уникальность категории в аккаунте |

Все миграции добавочные, в одной D1, без удаления пользовательских записей. Games не создают таблиц. `planner_entries` остаётся основным хранилищем events/tasks/notes.

## Контракты

Новые browser routes: `/api/plans` GET/POST/PATCH/DELETE и `/api/plans/categories` GET/POST. Создание плана: title, description, date|null, categoryId, completed, requestId. Изменение: id, version, changes. Удаление: id, version, confirmed:true. Владелец никогда не принимается в JSON.

AI/MCP routes, все 41 actions, OAuth URLs, OpenAI endpoints и названия переменных перечислены в интеграционном документе. Полные параметры/примеры каждого tool — MCP_TOOLS.md/json.

## Проверки и ограничения

61 автоматический тест прошёл: 4 по планам, 6 по игровым правилам/циклу, остальные 51 — регрессия planner, AI, auth и MCP. Тестовые SQL-данные и файлы удаляются. Визуально проверены desktop и 390×844, реальный pointer drag, автопауза и оба результата Виселицы. Детали: [QA.md](QA.md).

Для Plans пока не добавлены MCP actions, общий Undo и backup. Возврат выполненного плана в активный есть. Собственные категории можно создавать и выбирать; переименование/удаление категорий не входило в запрос и отсутствует. Статистика Виселицы сохраняется только в сессии вкладки, незавершённые матчи после выхода не сохраняются.

Production MCP блокируется Sites capability; Render доступ и реквизиты прежней D1 не предоставлены. OpenAI key в Site не настроен. Push/Realtime/полный RRULE/физическое мобильное тестирование остаются ограничениями. Эти ограничения не мешают обычным планам и локальным играм.

## Что рекомендуется далее

Сначала реальный smoke-test на iPhone с Вашим текущим аккаунтом. Для AI — снять блокировку MCP у хостинга и подключить server-side key. Затем провести реальные модельные сценарии и добавить фоновую доставку reminders. Для нового раздела Plans следующим этапом можно расширить единый audit/AI/backup без изменения текущей таблицы задач.
