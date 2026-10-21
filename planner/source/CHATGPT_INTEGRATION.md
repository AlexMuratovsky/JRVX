# JARVIS — интеграция с ChatGPT и встроенный AI

Состояние реализации: 21 сентября 2026. Код встроен в существующий проект, frontend и D1. Новая параллельная база не создавалась.

## 1. Фактический статус подключения

Сайт: [JARVIS](https://planhelper-alemura.gleb-v-markevich.chatgpt.site).

**Публичное подключение MCP пока заблокировано платформой.** Запрос настроек подключения Sites возвращает `Sites MCP is not enabled for this Site owner`. Внешняя проверка существующего адреса `/mcp` и `/health` вернула HTTP 403 JSON. Поэтому этот адрес пока нельзя выдавать за проверенное подключение ChatGPT. Доступность интерфейса владельцу и доступность MCP для внешнего клиента — разные проверки.

Нативный вариант размещён в backend Sites. Также в этом же репозитории подготовлен переносимый Node backend для Render. Он использует тот же service layer и адаптер к **той же существующей D1**, без переноса пользовательских записей. У текущего окружения нет доступа к Render и прямых реквизитов управляемой D1. Деплой Render не выполнялся. Конкретный порядок: [DEPLOY_RENDER.md](DEPLOY_RENDER.md).

Production-переменные сайта сейчас отсутствуют. `OPENAI_API_KEY` не настроен; реальный встроенный AI, голос и embeddings без него не заработают. Добавление планов и мини-игры не требуют OpenAI.

| Параметр | Sites сейчас | Переносимый backend после развёртывания |
|---|---|---|
| MCP endpoint | `/mcp`, внешний доступ 403 | `JARVIS_MCP_ORIGIN` + `/mcp` |
| Health | `/health`, внешний доступ 403 | `JARVIS_MCP_ORIGIN` + `/health` |
| Authorization URL | Платформа не предоставила | `JARVIS_MCP_ORIGIN` + `/oauth/authorize` |
| Token URL | Платформа не предоставила | `JARVIS_MCP_ORIGIN` + `/oauth/token` |
| Client ID | Не предоставлен для MCP | Задаётся через `JARVIS_OAUTH_CLIENT_ID` |
| Redirect URI | Не предоставлен для MCP | Точный callback из формы ChatGPT, в `JARVIS_OAUTH_REDIRECT_URIS` |
| Scopes | Управляет платформа; не выдуманы | `jarvis:read`, дополнительно `jarvis:write` для изменений |
| OAuth metadata | Не предоставлены | `/.well-known/oauth-authorization-server` |
| Protected resource metadata | Не предоставлены | `/.well-known/oauth-protected-resource` и суффикс `/mcp` |
| OIDC discovery | Не заявляется | Не используется: OAuth, без ID token/openid/profile/email |

Значения `JARVIS_MCP_ORIGIN` в таблице — имена настройки, а не существующий URL. Client ID входа через ChatGPT на сайте нельзя подставлять вместо MCP OAuth client ID.

## 2. Архитектура и добавления

`lib/planner-operations.ts` — реестр 41 операции с JSON Schema. `PlannerService` и модули импорта, повторений, истории, напоминаний и поиска исполняют бизнес-логику. MCP и встроенный Responses function calling используют один реестр. Старый `/api/entries` также вызывает этот слой при записи.

События, задачи и заметки остаются в `planner_entries`. Добавлены подтверждения со снимками, audit/Undo, история диалога, частные вложения в R2 с метаданными D1, права AI, напоминания, индекс embeddings и OAuth-таблицы. Новый раздел «Планы» использует собственную сущность в той же D1 и текущую авторизацию, не меняя формат задач.

## 3. Endpoints

| Маршрут | Назначение |
|---|---|
| `POST /mcp` | MCP Streamable HTTP: initialize, tools/list, tools/call |
| `GET /health` | Проверка backend/DB; `{"status":"ok"}` при успехе |
| `GET /api/v1/openapi.json` | OpenAPI 3.1 действующих browser actions |
| `POST /api/v1/actions/{action}` | Тот же реестр для авторизованного интерфейса |
| `GET/POST /api/confirmations/{id}` | Чтение preview, выдача CSRF, решение человека |
| `/confirm/{id}` | Страница обязательного подтверждения |
| `GET/PUT /api/ai/settings` | Права AI; менять может только пользователь в браузере |
| `GET /api/chat/config` | Доступность AI и разрешённые модели, без secrets |
| `GET/POST /api/chat/threads` | Список и создание своих диалогов |
| `GET/DELETE /api/chat/threads/{id}` | История и удаление своего диалога |
| `POST /api/chat/send` | Потоковый AI-ответ и вызовы общего action layer |
| `POST /api/chat/attachments` | Проверенная загрузка в свой диалог |
| `GET/DELETE /api/chat/attachments/{id}` | Доступ к своему вложению / удаление |
| `POST /api/chat/transcribe` | Аудио → текст для проверки, без исполнения |
| `GET/POST /api/reminders/due` | Напоминания внутри приложения / отметка прочитанного |
| `GET/POST/PATCH/DELETE /api/plans` | Планы, редактирование и выполнение |
| `GET/POST /api/plans/categories` | Стандартные и собственные категории |

Переносимый сервер дополнительно предоставляет OAuth authorize/token/revoke и discovery из таблицы выше. Он не дублирует frontend и не публикует browser API. CORS для server-to-server MCP не включён. `GET /mcp` не является проверкой tools/list: транспорт использует POST, GET/DELETE возвращают 405 после авторизации.

## 4. Все tools и контракты

Полный список, параметры и пример **каждого из 41 tools**: [MCP_TOOLS.md](MCP_TOOLS.md). Полные JSON Schema входов и результатов: [MCP_TOOLS.json](MCP_TOOLS.json). Они сгенерированы из реестра; все примеры проходят его валидацию.

Основные инструменты: `get_schedule`, `get_events`, `get_tasks`, `create_event`, `create_task`, `update_event`, `update_task`, `delete_event`, `delete_task`, `complete_task`, `search_items`, `bulk_import`.

Дополнительные: `resolve_context`, `semantic_search`, `list_files`, `read_file`, `set_resource_tags`, `resolve_date_time`, `update_occurrence`, `create_reminder`, `list_reminders`, `update_reminder`, `delete_reminder`, `get_ai_permissions`, `get_recent_actions`, `undo_action`, `restore_item`, `planner_context`, `set_time_zone`, `list_events`, `list_tasks`, `list_notes`, `create_note`, `get_entry`, `update_entry`, `set_task_completion`, `search_entries`, `request_delete`, `request_bulk_update`, `get_confirmation`, `commit_confirmation`.

MCP успех: `structuredContent.result` плюс текстовое JSON-представление. Ошибка tool: `isError: true`, `content` содержит `{"error":{"code":"not_found","message":"…"}}`. HTTP использует 400/401/403/404/409/429/5xx. Помимо общих кодов есть уточняющие `version_conflict`, `confirmation_required`, `ai_permission_denied`. Stack traces и secrets не возвращаются. OAuth token errors соответствуют OAuth (`error`, `error_description`).

## 5. Авторизация и изоляция

Сохранён вход Sites и существующие аккаунты username/password: scrypt, соль, хешированные случайные session tokens, Secure HttpOnly cookie. `owner_id` выводится только из проверенной identity/session. Строгие tool-схемы не принимают `user_id`. Чужой и отсутствующий ID одинаково дают not_found. Все SQL параметризованы и ограничены владельцем.

Если записи изначально создавались при входе через ChatGPT, добавляйте имя и пароль **из этого же пространства** через Account Panel. Отдельно созданные заполненные пространства автоматически не объединяются. Связать можно только ещё не использованную native identity; планы и категории тоже проверяются, чтобы не потерять данные.

Переносимый OAuth: Authorization Code + PKCE S256, точный allowlist callback, обязательный `resource`, state, `iss` в ответе, одноразовый код на 120 секунд. Access token непрозрачный, хранится только хеш, срок 15 минут. Refresh token — 30 дней, ротация; повторное использование отзывает семейство. Проверяются client, audience, срок и отзыв. Нет регистрации произвольных OAuth-клиентов. Встроены rate limits; парольный login использует текущую таблицу credentials. Вход и согласие на OAuth выполняет пользователь, не модель.

CSRF: Origin/Sec-Fetch + токен для подтверждений. XSS: текст React без исполнения HTML, экранированный OAuth consent, CSP. Серверные токены не возвращаются во frontend. Render игнорирует переданные caller identity headers. Дубликаты создания предотвращаются owner-scoped requestId; изменения используют optimistic version checks.

## 6. Action Preview и Undo

Чтение выполняется сразу. Удаление, изменение серии, массовое изменение, import и Undo требуют подтверждения человека. Для простого создания/редактирования в AI permissions есть `confirmAll`. Фото/файлы и действия после извлечения ненадёжного контекста принудительно используют preview во встроенном AI.

Preview содержит before/after, тип, объект, предупреждения и ссылку. Срок 15 минут. Человек нажимает «Подтвердить и выполнить» в своём JARVIS. Модель не может выдать approval через `commit_confirmation`; tool применяет только уже одобренное действие. Проверки владельца, актуальной версии и прав повторяются перед атомарным применением.

`planner_history` — audit log с owner, actor, action, entity, before/after, source, created_at и группой. Источники: web/mobile/internal_ai/chatgpt_mcp/import. Undo строит обратную группу, проверяет текущие версии и запрашивает подтверждение. Поздние изменения не затираются. Удаление записи вместе с её reminders отменяется группой. Старые изменения до установки audit не реконструируются. Удаление файлов/диалогов и изменения их тегов, а также CRUD отдельного раздела «Планы» пока не входят в Undo.

## 7. Bulk import и резервные копии

`dry_run:true` не пишет в D1, включая счётчики. Возвращает willCreate/willUpdate, duplicates, conflicts, unrecognized, skipped, readyCount. Лимит анализа — 100 элементов. `dry_run:false` только создаёт подтверждение для максимум 20 элементов; запись объектов происходит после нажатия человеком.

`kind`: event/task/note/reminder. Занятия, расписание и встречи — event; домашнее задание и дедлайны — task с category/tags. В `data` используйте нормализованные поля: startsAt/endsAt, dueDate/dueAt, timeZone, description, recurrence. Примеры в каталоге. Похожесть событий: владелец, дата/время и нормализованное название. Задач: название, дата дедлайна, категория/тег. Подозрительные записи и пересечения по умолчанию пропускаются. `create_separate` / `allowConflict` задаются только после выбора пользователя.

Экран `/import` принимает старую JSON-копию JARVIS v1 или массив items, показывает dry run и проходит пакетами по 20. Проверка каждого пакета повторяется перед применением. Повтор после уже завершённого импорта не дублирует данные, но может вернуть новый отчёт с пропущенными дубликатами вместо старого confirmation. Экспорт старого планировщика содержит events/tasks/notes; планы, файлы, чаты и reminders в него пока не включены.

## 8. Даты и повторения

Сначала `planner_context`: timezone аккаунта обязателен; backend не назначает Москву по умолчанию. Локальные поля преобразуются через Temporal. ISO содержит Z/UTC offset и сверяется с IANA zone. Date-only дедлайн не становится полночью UTC. Несуществующее/двусмысленное местное время DST отклоняется с просьбой указать offset.

Resolver понимает сегодня/завтра/послезавтра/в пятницу/через неделю. «Следующая пятница», утром/вечером и «в два» могут потребовать уточнения. «Перед занятием»/«после пары» требуют проверенного события и интервала. Формат возвращает `needsClarification`, не скрывая предположение.

RRULE поддерживает DAILY/WEEKLY, INTERVAL, BYDAY, UNTIL (локальный YYYYMMDD) или COUNT, WKST=MO. Редактирование: occurrence, following, series. Для отдельного экземпляра создаётся исключение и связанная запись; для будущих — разделение серии. Выполнение recurring task требует occurrenceDate. MONTHLY/YEARLY не реализованы. Для переноса серии на другой день недели при BYDAY задайте новое правило явно. `get_events` upcoming проверяет оставшиеся экземпляры. Для точных дат задач задавайте обе границы: без диапазона `get_tasks` возвращает мастера серий, а overdue оценивает их исходный срок.

## 9. Напоминания

Отдельная таблица, привязка к событию/задаче или точному времени; относительный offset следует за переносом события. Напоминания повторяющихся записей вычисляются по экземплярам. Receipts защищают от повторного показа после отметки. Сейчас работает только `in_app`, пока открыт JARVIS (опрос каждые 30 секунд). Архитектура знает web_push/mobile_push, но доставка и фоновый scheduler **не подключены**. При закрытом приложении обещать уведомление нельзя.

## 10. Встроенный AI, фото, файлы, голос

Используются серверные OpenAI endpoints:

- `POST /v1/responses`: потоковый текст, input_image/input_file, function calling общего реестра; `store:false`.
- `POST /v1/audio/transcriptions`: запись → редактируемый текст.
- `POST /v1/embeddings`: семантический индекс.

Не используются Assistants API, удалённое хранение истории Conversations, OpenAI Files upload или Realtime. История лежит в текущей D1. Модель получает ограниченную историю и результаты выбранных tools, а не всю БД. Входящий текст файла/фото/заметки объявляется ненадёжным содержимым, не system instructions. Это защита в совокупности с серверными permissions/ownership/approval, а не обещание абсолютной неуязвимости модели.

В UI есть загрузка фото/PDF/TXT/MD/CSV/JSON/DOCX/PPTX/XLSX, проверка типа и сигнатуры, максимум 8 МБ на файл, 3 файла/16 МБ на сообщение, квота 64 МБ. HEIC пока не поддержан. R2 недоступен публично; чтение только после ownership check. Фото/файл → структурированный bulk_import → preview → подтверждение. Неоднозначные даты сначала уточняются.

Голос: start/stop/cancel, индикатор, до 90 секунд, транскрипция на сервере. Распознанный текст показывается в поле ввода; команда выполняется после отправки пользователем. Ошибочное действие можно отменить через историю. Для полноценного Realtime оставлен отдельный транспортный интерфейс, но Realtime сейчас не работает.

## 11. Семантический поиск, связи и permissions

Основные данные остаются в D1. Embeddings — производный индекс 256 измерений; invalidate при изменении/удалении исходника. Индексируются только разрешённые этому владельцу events/tasks/notes и извлечённый текст файлов. До 100 недостающих фрагментов за запрос; `partial` явно показывает неполное покрытие. Файлы сначала прочитать через read_file. История диалога не индексируется. Обычный текстовый поиск работает без ключа.

Tags связывают записи, файлы и metadata диалогов по предмету. Context Resolver возвращает ограниченный набор; история AI доступна отдельным tool. AI settings отдельно контролируют чтение/создание/изменение events/tasks/notes, файлы, удаление, bulkImport, Undo, reminders, semantic, confirmAll. Модель не может менять свои права. При отзыве прав старая история не отправляется модели как обход запрета.

## 12. Environment variables — только имена

Sites / встроенный AI:

```text
OPENAI_API_KEY
OPENAI_CHAT_MODELS
OPENAI_CHAT_MODEL
OPENAI_CHAT_MAX_OUTPUT_TOKENS
OPENAI_EMBEDDING_MODEL
OPENAI_TRANSCRIPTION_MODEL
```

`DB` и `BUCKET` — привязки платформы, не значения для frontend. Ключ добавляется как secret в настройках окружения Site, затем требуется публикация. Можно подключить OpenAI Developers plugin для безопасной настройки с Вашим подтверждением. Не отправляйте ключ в чат и не добавляйте NEXT_PUBLIC переменную.

Модели чата по умолчанию: gpt-5.6-luna, gpt-5.6-terra, gpt-5.6-sol; список и выбранная модель настраиваются сервером. Доступность зависит от проекта OpenAI. Embeddings: text-embedding-3-small или text-embedding-3-large. Transcription: gpt-transcribe. Реальные вызовы пока не проверены — ключ отсутствует.

Render:

```text
JARVIS_MCP_ORIGIN
JARVIS_SITE_ORIGIN
JARVIS_OAUTH_CLIENT_ID
JARVIS_OAUTH_CLIENT_SECRET
JARVIS_OAUTH_REDIRECT_URIS
CLOUDFLARE_ACCOUNT_ID
JARVIS_D1_DATABASE_ID
CLOUDFLARE_D1_API_TOKEN
NODE_VERSION
PORT
```

Opaque OAuth tokens хранятся хешами: JWT_SIGNING_SECRET и ключ шифрования refresh tokens этому варианту не нужны. Client secret хранится только на сервере и в настройках OAuth клиента ChatGPT.

## 13. Подключение в ChatGPT после снятия блокировки

Эти шаги станут исполнимы только после получения реального работающего HTTPS endpoint. Не вставляйте нынешний 403 endpoint, ожидая рабочего подключения.

1. Откройте ChatGPT в веб-интерфейсе и меню профиля → Settings.
2. Включите Developer mode там, где он доступен Вашему аккаунту. Актуальная документация указывает Security and login; в прежнем интерфейсе — Apps → Advanced settings. Администратор рабочего пространства может ограничить доступ.
3. Если у Вас интерфейс **Settings → Apps → Create**, откройте Create. В обновлённом интерфейсе документация описывает **Plugins → + → добавление по URL**. Отсутствие старой кнопки не означает, что её надо искать на другой случайной странице.
4. Name: `JARVIS` (можно `planhelperAleMura`).
5. MCP endpoint: точный проверенный публичный URL backend, заканчивающийся `/mcp`.
6. Authentication: OAuth, не No authentication.
7. Для Render заполните Client ID и secret из серверной конфигурации. Authorization/Token URLs — из его discovery. Начните с jarvis:read; для записи добавьте jarvis:write.
8. Скопируйте **точный Redirect URI, показанный ChatGPT**, в allowlist backend. Не используйте wildcard. Сервер поддерживает `iss` и PKCE; параметры redirect должны совпасть полностью. Для Sites используйте выданную платформой конфигурацию после включения capability.
9. Выполните Scan Tools, если такая кнопка есть. В интерфейсе с автоматическим сканированием дождитесь списка. Должны обнаружиться 41 tools из каталога, включая все 12 основных. 403/HTML вместо JSON — ошибка подключения, не успешная установка.
10. Авторизуйтесь своим существующим аккаунтом JARVIS на OAuth consent и разрешите выбранные scopes. После callback завершите Create/Install/Connect согласно форме.
11. В новом чате выберите приложение JARVIS; в обновлённом Work-интерфейсе можно упомянуть @JARVIS.
12. Выполните сценарии следующего раздела, используя отдельный тестовый аккаунт. Подтвердите удаление через JARVIS и очистите тестовые записи.

Названия экранов меняются; этот проект не заявляет, что проверил UI подключения именно Вашего аккаунта. Источники: [OpenAI quickstart](https://developers.openai.com/plugins/quickstart), [OpenAI OAuth](https://developers.openai.com/plugins/build/auth).

## 14. Сценарии проверки

Задайте timezone тестового аккаунта. Используйте префикс TEST и новые requestId.

| Команда | Ожидаемая цепочка |
|---|---|
| Что у меня завтра? | planner_context → get_schedule(period=tomorrow) |
| Запиши завтра в 14:00 стоматологию | Уточнение длительности → create_event; проверить в интерфейсе |
| Перенеси стоматологию на 16:00 | search_items/get_entry → update_event с актуальной version |
| Добавь задачу выучить фармакологию до пятницы | resolve_date_time → create_task с due_date |
| Отметь задачу выполненной | get_entry → complete_task |
| Удалить эту задачу | delete_task → preview → человек подтверждает → executed=true |
| Отмени последнее действие | get_recent_actions → undo_action → подтверждение |
| Каждую пятницу в 15:00 патфиз | create_event с weekly BYDAY=FR |
| Напомни за час до события | create_reminder(entityId,offsetMinutes=60) |
| Найди всё про фармакологию | search_items / resolve_context |
| Найди записи про переливание крови | semantic_search с настроенным ключом |
| Импортируй расписание / фото ДЗ / даты из PDF | read_file или multimodal → bulk_import dry_run → выбор дубликатов → preview → подтверждение |

Тесты используют SQLite с теми же миграциями, две синтетические identity, тестовые парольные аккаунты, MCP SDK transport и настоящий HTTP handler. После тестов строки удаляются, in-memory БД закрывается, тестовый bucket очищается. Production-данные не использовались.

| Test | Status | Result |
|---|---|---|
| /health | PASS локально; BLOCKED публично | Node handler JSON ok; нынешний Sites URL 403 |
| initialize / tools/list | PASS локально | SDK принимает протокол, 41 schemas |
| read / schedule / tasks | PASS локально | Даты, фильтры, owner scope |
| create event/task | PASS локально | Общие записи; requestId dedup |
| update | PASS локально | Fresh version, DST, конфликты |
| delete | PASS локально | До человеческого approval изменений нет |
| bulk import | PASS локально | Dry run: ноль SQL writes; дубликаты/ошибки/atomic commit |
| OAuth login / refresh | PASS локально | PKCE, client, audience, single-use, rotation/replay |
| multi-user isolation | PASS локально | События, задачи, notes, files, chat, activity, plans |
| embedded chat / photo / PDF / voice / semantic | PASS с имитацией OpenAI | Проверены запросы, guards, preview и сохранение; качество модели не проверено |
| Настоящее подключение ChatGPT | BLOCKED | Sites capability отключена, Render недоступен |
| Настоящий OpenAI | NOT RUN | В production нет ключа |

Общий регрессионный набор: **61 тест, 61 прошёл**, TypeScript и сборки Worker/Node проверяются перед публикацией. Это не независимый pentest и не доказательство работающего публичного OAuth.

## 15. Планы и мини-игры

`/plans`: создание/изменение/удаление с подтверждением, completion и возврат в активные, необязательная дата, описание, 7 стандартных категорий, до 100 своих, Unicode-поиск и фильтры. Хранение: planner_plans/planner_plan_categories в той же D1. В MCP этот отдельный тип пока не добавлен: create_task не создаёт план. Регистрация новых пользователей не менялась.

`/games`: только две работающие игры. Виселица — 120 русских слов, 6 тематик + случайное, Ё, подсказки, 6 ошибок, сессионная статистика. Pong — до 7, ограниченная AI-реакция и скорость, три сложности, W/S/стрелки/pointer drag, пауза на blur/hidden/pagehide. Canvas + один requestAnimationFrame, при паузе и выходе цикл отменяется. Игры не хранят пользовательские планы в браузере. Статистика Виселицы локальна сессии вкладки.

## 16. Ограничения

- Production MCP и реальные OpenAI-вызовы пока не прошли конечную проверку по указанным причинам.
- На Render для всех optional tools дополнительно потребуются тот же R2 и OpenAI-настройки; текущий переносимый adapter покрывает D1 CRUD, OAuth, reminders и history. read_file без R2 завершится понятной ошибкой, не получит другой bucket.
- Push и Realtime не подключены, offline-синхронизации нет.
- Проверены desktop Chromium и компоновка 390×844; физические iPhone/Android в этой среде недоступны. Авторизованный браузерный E2E заменён HTTP/DB-тестами, потому что preview не имеет пользовательской сессии.
- Ограничения recurrence, экспорта, Undo и количества импортируемых элементов указаны выше. Кросс-пересечения будущих экземпляров разных сложных серий не проверяются полностью; preview остаётся обязательным.
- Plans CRUD и custom categories отдельного нового раздела ещё не включены в AI tools, history и backup. Смена статуса выполнен/активен поддерживается полностью.
- Ошибки модели, OCR и транскрипции возможны; live quality evaluation не выполнен.

## 17. Следующий этап

Сначала включить MCP у владельца Sites **или** предоставить авторизованный deployment-доступ к Render и существующей D1. Затем настроить серверный OpenAI key, провести реальный ChatGPT OAuth/E2E на тестовых аккаунтах и проверить фото/голос на iPhone. После этого — фоновый scheduler/push, подключение новой сущности Plans к audit/backup/AI и расширенные RRULE.
