# Проверка JARVIS — 21 сентября 2026

## Автоматические проверки

`pnpm test`: 61 test, 61 pass, 0 fail. Временная SQLite загружает все те же D1 миграции; тестовые пользователи/rows/bucket очищаются после проверки. Production-данные не изменялись.

| Область | Результат |
|---|---|
| Планы | CRUD, необязательная дата, completed→active, fresh service/read после изменения, категории, дубль категории, русский поиск с Ё/Е, фильтры, pagination, версии и requestId |
| Безопасность планов | Нет анонимного доступа; чужие ID/категории закрыты; user_id/owner_id запрещены; Origin проверяется; delete требует confirmed=true; link не оставляет старые планы |
| Виселица | 120 слов, 6 тематик + random, 33 буквы/Ё, повтор буквы, все вхождения, win/loss/6 ошибок, выбор следующего слова без немедленного повтора |
| Pong | Стены/две ракетки, угол, рост/лимит скорости, одно очко на гол, reset/pause подачи, победа обоих игроков при 7, rematch, keyboard-direction/touch-target, три уровня с ограниченной скоростью AI |
| Цикл Pong | Одна RAF-цепочка; отмена при паузе/выходе; возобновление без накопленного времени |
| Регрессия планировщика | Events/tasks/notes CRUD, TZ/DST, recurrence, старый UI, поиск, подтверждения, audit/Undo, reminders, backup adapter |
| MCP/OAuth | Initialize/tools/list/CRUD, 41 input/output schemas, PKCE, audience/client, code replay, refresh rotation, scopes, isolation |
| Встроенный AI | HTTP streaming, история после reload, idempotency, uploads/isolation, provider failures, permissions, photo/PDF preview, mock embeddings/transcription |

TypeScript, production Worker build и Node MCP build проверяются перед публикацией. 41 пример MCP в каталоге валидируется действующими schemas.

## Проверка интерфейса

В управляемом Chromium:

- Навигация главного JARVIS → каталог; присутствуют ровно две игры.
- Виселица: начало, смена категории следующего слова, подсказка, победа (0 ошибок), поражение (6 ошибок), корректные победы/поражения/сброс серии; блокировка использованных букв.
- Pong: выбор «Легко», старт, pointer drag, ручная пауза/продолжение; при переходе фокуса в другой iframe автоматически появилась пауза.
- Экраны plans/hangman/pong в iframe 390×844: меню, русская клавиатура, формы и поле без видимого горизонтального переполнения. Форма плана включает необязательную дату; после ошибки отсутствия авторизации ввод остаётся в форме.
- Исправлена генерация client request UUID в HTTP preview; используется криптографический getRandomValues fallback. Production HTTPS сохраняет native randomUUID.
- Временный файл мобильного QA удалён перед сборкой.

## Границы проверки

- Физические iPhone/Android и реальный touch hardware недоступны. Проверены узкая компоновка, общий Pointer Events обработчик и модель сенсорного ввода; это не измерение FPS на устройстве.
- Preview не авторизован в личном аккаунте. Plans CRUD и сохранение проверены через настоящий route/service/SQL слой на тестовых identity, не через вошедший production-браузер.
- OpenAI ответы, OCR, semantic и transcription тестируются с имитацией провайдера: production key отсутствует. Реальное качество не заявляется проверенным.
- Публичные MCP/health существующего Site дали 403, native connector сообщает отключённый Sites MCP владельца. Live ChatGPT OAuth/E2E не прошёл. Render backend собран и локально протестирован; deployment доступ отсутствует.
