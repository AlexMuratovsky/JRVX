# Развёртывание существующего JARVIS MCP на Render

Это инструкция для подготовленного backend **этого же репозитория**: `server/main.ts`, `server/handler.ts`, `server/d1-http.ts`, `render.yaml`. Frontend остаётся в Sites. Production Render пока не создан: у текущего окружения нет доступа к аккаунту Render и прямого доступа к управляемой D1.

## Обязательные условия

1. Получите у владельца/оператора хостинга разрешённый HTTP-доступ **к существующей D1 JARVIS**: account ID, database ID, Cloudflare API token с минимально необходимым D1-доступом. Sites connector не предоставляет эти реквизиты. Если платформа не разрешает прямой доступ, этот вариант остановится на данном шаге — требуется включение Sites MCP либо поддерживаемый платформой gateway. Новую БД создавать или подменять нельзя.
2. Получите авторизованный доступ Render к текущему исходному репозиторию. Закрытый Sites Git использует краткоживущие credentials; не сохраняйте их как постоянный deploy token. При необходимости владелец может предоставить поддерживаемое Render зеркало **того же** репозитория. Это не переписывание приложения и не создание отдельного planner datastore.
3. Убедитесь, что опубликованы добавочные миграции существующего проекта. Все `drizzle/0000…0007` входят в историю; ранее применённые файлы не запускать повторно и не редактировать. Публикация Sites применяет новые миграции к той же D1. Backend сам таблицы не создаёт.
4. В нужном существующем аккаунте JARVIS должен быть username/password. Если использовался только вход ChatGPT, добавьте пароль из этого аккаунта. Не создавайте новое пустое пространство вместо текущих данных.

## Создание сервиса

1. В Render откройте New → Blueprint, подключите разрешённый репозиторий и выберите `render.yaml`. Blueprint создаёт только Web Service `jarvis-mcp`; базы данных в нём нет.
2. Runtime Node, Node 22.22.0, build `corepack enable && pnpm install --frozen-lockfile && pnpm build:mcp`, start `node dist-mcp/server.mjs`, health `/health`. Выбран платный starter, чтобы не рассчитывать на остановку бесплатного сервиса. Стоимость/тариф подтвердите в своём Render.
3. Получите фактический HTTPS URL созданного сервиса из Render. Не выводите его из желаемого имени: имя может оказаться занятым. Render предоставляет TLS для своего домена. `JARVIS_MCP_ORIGIN` установите ровно в этот origin без завершающего слеша.
4. `JARVIS_SITE_ORIGIN` — текущий HTTPS origin JARVIS. Он используется для ссылки на человеческое подтверждение; импорт/удаление подтверждаются в существующем интерфейсе.
5. `JARVIS_OAUTH_CLIENT_ID` — выберите постоянный идентификатор Вашего единственного preregistered клиента. Это не Sites sign-in client ID. Client secret автоматически генерируется Blueprint; его значение введите только в защищённую настройку OAuth ChatGPT.
6. `JARVIS_OAUTH_REDIRECT_URIS` — точный callback из ChatGPT, несколько — через запятую. Backend поддерживает `iss`; текущая OpenAI документация для этого режима указывает `https://chatgpt.com/connector_platform_oauth_redirect`. Всё равно сверяйте с callback в реальной форме. Никаких wildcard, localhost и произвольного redirect из пользователя.
7. Заполните Cloudflare переменные разрешёнными реквизитами **существующей** D1. Все secrets — в Render Environment, не в Git и не в клиенте. `PORT` предоставляет Render.
8. Deploy. При запуске backend проверяет нужные существующие таблицы и атомарный rollback D1 batch. Проверочная техническая строка удаляется; пользовательские records не меняются. Если нет атомарности/таблиц/доступа, процесс завершается до открытия порта.
9. Сохраните реальный URL deployment после успешного запуска. Здесь он намеренно не выдуман.

[Render Blueprint reference](https://render.com/docs/blueprint-spec), [Node web service](https://render.com/docs/deploy-node-express-app).

## Имена переменных

```text
NODE_VERSION
PORT
JARVIS_MCP_ORIGIN
JARVIS_SITE_ORIGIN
JARVIS_OAUTH_CLIENT_ID
JARVIS_OAUTH_CLIENT_SECRET
JARVIS_OAUTH_REDIRECT_URIS
CLOUDFLARE_ACCOUNT_ID
JARVIS_D1_DATABASE_ID
CLOUDFLARE_D1_API_TOKEN
```

Для дополнительных semantic tools можно настроить `OPENAI_API_KEY`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_CHAT_MODELS`, `OPENAI_CHAT_MODEL`, `OPENAI_CHAT_MAX_OUTPUT_TOKENS`. Чтение файлов через переносимый backend также требует разрешённого адаптера к **существующему** R2, которого в текущем Node варианте нет. Основные 12 MCP tools не требуют OpenAI key на сервере: их вызывает модель в обычном ChatGPT. Не создавайте другой bucket с копиями пользовательских файлов.

## Контроль после deploy

С фактическим origin проверьте из внешней сети:

```sh
curl --fail --silent --show-error "$JARVIS_MCP_ORIGIN/health"
curl --fail --silent --show-error "$JARVIS_MCP_ORIGIN/.well-known/oauth-authorization-server"
curl --fail --silent --show-error "$JARVIS_MCP_ORIGIN/.well-known/oauth-protected-resource"
```

Ожидаются JSON, валидный TLS, status ok, issuer/resource с точным origin. POST `/mcp` без токена должен вернуть **401**, `WWW-Authenticate` с resource_metadata, а не HTML и не 200.

Далее подключите приложение в ChatGPT по разделу 13 `CHATGPT_INTEGRATION.md`. Вход выполните тестовым аккаунтом A. Проверьте initialize и tools/list через MCP client, затем get_schedule/get_tasks/create_task/create_event/update_event/complete_task/search_items/delete_task/bulk_import. Delete и real import должны ждать JARVIS confirmation. Проверьте обновление после истечения access token, а также отзыв подключения.

Создайте второй тестовый аккаунт B. Убедитесь, что токен A не может прочитать/изменить/удалить ID объектов B. Подмена user_id отклоняется. Используйте только TEST-записи; после сценария удалите их в тестовых аккаунтах и отзовите grants. Не отправляйте bearer/refresh/client secret в логи или чат.

Локально `pnpm test` уже проверяет полный OAuth authorization-code/PKCE/refresh flow и MCP handler на двух изолированных аккаунтах. Эта проверка не заменяет живое подключение к конкретному Render URL.

## Эксплуатация

- Логи содержат request ID, path без query, method, status, duration. Не логируются пароли, аргументы tools, tokens, файлы и тексты записей.
- HTTPS терминируется Render. Node слушает только назначенный PORT, CORS не включён.
- Rate limiting хранится в D1. IP определяется консервативно по socket, не по произвольному X-Forwarded-For; за общим reverse proxy это может объединять лимиты. Перед многопользовательским запуском настройте проверенный механизм реального IP с конкретной доверенной proxy-цепочкой, не доверяйте заголовку без проверки.
- Автопубликация отключена. Перед обновлением запускайте проверки, затем deploy того же репозитория.
- Автоматическая очистка истёкших OAuth/лимитных записей и мониторинг ошибок ещё требуют операционной настройки. Это не заменяет настройку backups существующей D1.
