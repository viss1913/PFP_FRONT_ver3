# API для AI B2C (настройки агента) — спека и базовый URL

**Для фронта:** краткая выжимка по эндпоинтам раздела «AI B2C» в ЛК агента.

---

## Спека и база

- **Файл со спекой:** `docs/api/agent_lk.yaml` (на бэке) / в этом репозитории: `api_docs/agent_lk.yaml`. Схемы тел запросов для brain-contexts и stages вынесены в `api_docs/aiB2c.yaml` (подключается из `agent_lk.yaml`).
- **Базовый URL API:** `https://<твой-бэк>/api` либо просто `/api`, если фронт и бэк на одном домене.

---

## Эндпоинты AI B2C

| Метод | Путь |
|-------|------|
| GET   | `/api/pfp/ai-b2c/brain-contexts` |
| POST  | `/api/pfp/ai-b2c/brain-contexts` |
| PUT   | `/api/pfp/ai-b2c/brain-contexts/:id` |
| DELETE| `/api/pfp/ai-b2c/brain-contexts/:id` |
| GET   | `/api/pfp/ai-b2c/stages` |
| POST  | `/api/pfp/ai-b2c/stages` |
| PUT   | `/api/pfp/ai-b2c/stages/:id` |
| DELETE| `/api/pfp/ai-b2c/stages/:id` |

---

## Заголовки

- **`Authorization: Bearer <JWT>`** — обязательно.
- **`x-project-key`** — ключ проекта (по необходимости, для контекста проекта).
- **`Content-Type: application/json`** — для запросов с телом (POST/PUT).

---

## Коротко (для чата/тикета)

Спека по AI B2C для агента — в `docs/api/agent_lk.yaml` (у нас в репе: `api_docs/agent_lk.yaml`). Базовый URL — `/api`, авторизация Bearer JWT, при необходимости заголовок `x-project-key`. Эндпоинты вида `/api/pfp/ai-b2c/brain-contexts` и `/api/pfp/ai-b2c/stages` — в файле расписаны.
