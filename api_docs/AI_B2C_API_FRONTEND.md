# API для AI B2C (настройки агента) — спека и базовый URL

**Для фронта ЛК агента:** краткая выжимка по эндпоинтам раздела «AI B2C».

---

## Спека и база

- **Файл со спекой:** `api_docs/agent_lk.yaml`. Схемы тел — `api_docs/aiB2c.yaml` (подключается из `agent_lk.yaml`).
- **Клиентский оркестратор `/plan`:** `api_docs/b2c_plan_orchestrator_frontend.md` (SSE, `POST /my/ai-b2c/chat/dynamic/stream`).
- **Базовый URL API:** `https://<твой-бэк>/api` либо `/api`, если фронт и бэк на одном домене.

---

## Несколько оркестраторов (flow_key)

На проект может быть несколько **site-flow**: `default`, `plan`, …

| Что | Как |
|-----|-----|
| Список flows | `GET /api/pfp/ai-b2c/flows` |
| Создать flow | `POST /api/pfp/ai-b2c/flows` — тело `AiB2cFlowCreate` (`flow_key`, `title`, опц. `clone_from: "default"`) |
| Фильтр в ЛК | query **`flow_key`** на GET brain-contexts, stages, settings (default `default`) |
| Клиент `/plan` | в чате `flow_key: "plan"` → `classifier_command` + стрим `text` |

Пример создания flow для `/plan`:

```json
{
  "flow_key": "plan",
  "title": "Сценарий /plan",
  "clone_from": "default"
}
```

---

## Эндпоинты AI B2C (ЛК агента)

| Метод | Путь | Примечание |
|-------|------|------------|
| GET   | `/api/pfp/ai-b2c/flows` | Список оркестраторов |
| POST  | `/api/pfp/ai-b2c/flows` | Создать flow |
| GET   | `/api/pfp/ai-b2c/brain-contexts` | `?flow_key=` |
| POST  | `/api/pfp/ai-b2c/brain-contexts` | в теле `flow_key` |
| PUT   | `/api/pfp/ai-b2c/brain-contexts/:id` | |
| DELETE| `/api/pfp/ai-b2c/brain-contexts/:id` | |
| GET   | `/api/pfp/ai-b2c/stages` | `?flow_key=` |
| POST  | `/api/pfp/ai-b2c/stages` | `stage_key`, `content`, `command_context_text` |
| PUT   | `/api/pfp/ai-b2c/stages/:id` | |
| DELETE| `/api/pfp/ai-b2c/stages/:id` | |
| GET   | `/api/pfp/ai-b2c/settings` | `?flow_key=` |
| PUT   | `/api/pfp/ai-b2c/settings` | `?flow_key=` |
| POST  | `/api/pfp/ai-b2c/avatar-upload` | multipart |

**chat_AI** (отдельный поток, без `flow_key`) — префикс `/api/pfp/ai-b2c-chat/…`, см. `agent_lk.yaml`.

---

## Заголовки

- **`Authorization: Bearer <JWT>`** — обязательно.
- **`x-project-key`** — ключ проекта (по необходимости).
- **`Content-Type: application/json`** — для POST/PUT с телом.

---

## Стадия: два промпта

| Поле | Кто использует |
|------|----------------|
| `content` | Второй ИИ — текст ответа клиенту |
| `command_context_text` | Первый ИИ (роутер) — команды `/…` для навигации |

Если `command_context_text` пустой — роутер берёт **`dynamic_context_text`** из settings выбранного flow.

---

## Коротко (для чата/тикета)

Спека ЛК — `api_docs/agent_lk.yaml` + `api_docs/aiB2c.yaml`. База `/api`, Bearer JWT. Новое: **flows** (`GET/POST /pfp/ai-b2c/flows`) и **`flow_key`** на brain/stages/settings. Оркестратор клиента — `POST /my/ai-b2c/chat/dynamic/stream`, контракт в `b2c_plan_orchestrator_frontend.md`.
