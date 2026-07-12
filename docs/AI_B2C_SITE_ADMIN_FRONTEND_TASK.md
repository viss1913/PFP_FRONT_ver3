# Задача фронту: отдельный раздел «Настройка B2C site» в ЛК агента

**Дата:** 2026-07-12  
**Скоуп:** только **админка / ЛК агента**. B2C-клиент `/plan` — отдельная задача, здесь не трогаем.  
**API (test):** `https://pfp-api.bank-future.com/api`  
**Спеки:** `api_docs/agent_lk.yaml`, `api_docs/aiB2c.yaml`, `api_docs/AI_B2C_API_FRONTEND.md`

---

## 1. Что нужно сделать

В ЛК агента завести **отдельный раздел** (таб/страница) для настройки **B2C site-оркестратора**:

- несколько flows на проект (`default`, `plan`, …);
- настройки ассистента на flow;
- brain-contexts (мозг);
- **команды / стадии** — `stage_key` + два промпта на каждую.

Раздел **не смешивать** с chat_AI (`/pfp/ai-b2c-chat/…`) — это другой поток.

---

## 2. Модель данных (как на бэке)

### Flow (оркестратор)

Один проект → несколько независимых site-сценариев.

| Поле | Смысл |
|------|--------|
| `flow_key` | Slug: `default`, `plan`, … |
| `title` | Название в админке |
| `description` | Опционально |
| `is_active` | Вкл/выкл |

Для маршрута клиента `/plan` используется **`flow_key = plan`**.

### Стадия = команда + два контекста

| Поле | Кто читает | Назначение |
|------|------------|------------|
| `stage_key` | Роутер + фронт `/plan` | Команда / route (`/vybor_celi2`, `/test23_pensia`) |
| `title` | Админка | Человекочитаемое имя |
| `content` | **2-й ИИ** | Промпт ответа клиенту на этой стадии |
| `command_context_text` | **1-й ИИ (роутер)** | Правила: когда выбрать эту команду, куда вести дальше |
| `is_active`, `priority` | Бэк | Whitelist роутера, порядок |

Если у стадии **пустой** `command_context_text` → роутер берёт **`dynamic_context_text`** из settings выбранного flow.

### Brain-context

Доп. контексты для 2-го ИИ (не путать со стадией). Поля: `title`, `content`, `is_active`, `priority`, привязка к `flow_key`.

### Settings flow

`display_name`, `avatar_url`, `tagline`, **`dynamic_context_text`** (глобальный fallback роутера).

---

## 3. API — методы и как вызывать

Все запросы: **`Authorization: Bearer <JWT агента>`**, при необходимости **`x-project-key`**.

Базовый префикс: **`/api/pfp/ai-b2c/…`**

### 3.1. Flows

| Метод | Путь | Назначение |
|-------|------|------------|
| GET | `/pfp/ai-b2c/flows` | Список оркестраторов проекта |
| POST | `/pfp/ai-b2c/flows` | Создать flow |

**POST body** (`AiB2cFlowCreate`):
```json
{
  "flow_key": "plan",
  "title": "Сценарий /plan",
  "description": "Оркестратор guest /plan",
  "clone_from": "default"
}
```

`clone_from` — опционально копирует brain, stages, settings из указанного flow.

**UI:** селектор flow в шапке раздела. При смене — перезагрузка всех списков с новым `flow_key`.

---

### 3.2. Settings (на выбранный flow)

| Метод | Путь | Query |
|-------|------|-------|
| GET | `/pfp/ai-b2c/settings` | `?flow_key=plan` |
| PUT | `/pfp/ai-b2c/settings` | `?flow_key=plan` |

**PUT body:**
```json
{
  "display_name": "Виктория",
  "avatar_url": "https://…",
  "tagline": "Ваш финансовый ассистент",
  "dynamic_context_text": "Список команд и правил роутера…"
}
```

**Аватар отдельно:** `POST /pfp/ai-b2c/avatar-upload` (multipart), URL потом в PUT settings.

---

### 3.3. Brain-contexts

| Метод | Путь | Query / body |
|-------|------|----------------|
| GET | `/pfp/ai-b2c/brain-contexts` | `?flow_key=plan` |
| POST | `/pfp/ai-b2c/brain-contexts` | в теле `flow_key` |
| PUT | `/pfp/ai-b2c/brain-contexts/{id}` | |
| DELETE | `/pfp/ai-b2c/brain-contexts/{id}` | |

**POST body:**
```json
{
  "flow_key": "plan",
  "title": "Общий тон общения",
  "content": "Промпт…",
  "is_active": true,
  "priority": 10
}
```

---

### 3.4. Stages (команды) — главное для админки

| Метод | Путь | Query / body |
|-------|------|----------------|
| GET | `/pfp/ai-b2c/stages` | `?flow_key=plan` |
| POST | `/pfp/ai-b2c/stages` | в теле `flow_key` |
| PUT | `/pfp/ai-b2c/stages/{id}` | |
| DELETE | `/pfp/ai-b2c/stages/{id}` | |

**POST / PUT body** (обязательны `stage_key`, `title`, `content`):
```json
{
  "flow_key": "plan",
  "stage_key": "/test23_pensia",
  "title": "Пенсия",
  "content": "Промпт 2-го ИИ — как отвечать клиенту…",
  "command_context_text": "Если пользователь говорит о пенсии — команда /test23_pensia…",
  "is_active": true,
  "priority": 100
}
```

**Важно при сохранении:**
- `stage_key` — route/команда, лучше с ведущим `/` (`/vybor_celi2`);
- `content` — **обязателен** на бэке (400 без него);
- `command_context_text` — можно `null`/пусто → тогда роутер из `dynamic_context_text`;
- `flow_key` в POST обязателен для привязки к нужному оркестратору;
- GET stages всегда с `?flow_key=` текущего селектора.

---

## 4. Как отрисовать в админке

Рекомендуемая структура экрана **«B2C site — оркестратор»**:

```
[ Селектор flow ▼ ]  [ + Создать flow ]

── Настройки flow ──
  имя, аватар, tagline
  textarea: dynamic_context_text (глобальный роутер)
  [ Сохранить ]

── Мозг (brain-contexts) ──
  список: title | приоритет | активен | превью content
  [ + ] [ Изменить ] [ Удалить ]

── Команды / стадии ──
  для каждой записи показать:
    • stage_key (как code/badge) — это команда для /plan
    • title
    • бейдж: роутер «свой» / «глобальный» (есть ли command_context_text)
    • превью command_context_text (1–2 строки)
    • превью content (1–2 строки)
    • priority, is_active
  [ + Команда ] [ Изменить ] [ Удалить ]
```

### Форма создания/редактирования команды

| Поле в UI | API поле | Подпись для агента |
|-----------|----------|-------------------|
| Команда / route | `stage_key` | То, что уйдёт в `classifier_command` на клиент |
| Название | `title` | Для админки |
| Ответ клиенту | `content` | 2-й ИИ |
| Правила роутера | `command_context_text` | 1-й ИИ; пусто = из settings |
| Активна | `is_active` | |
| Приоритет | `priority` | |

---

## 5. Пример набора команд для flow `plan`

| stage_key | title | Зачем |
|-----------|-------|-------|
| `/start` | Старт | Welcome |
| `/lichnye_dannye` | Семья | CJM шаг 1 |
| `/vybor_celi2` | Выбор цели | Витрина целей |
| `/test23_pensia` | Пенсия | Уточнение пенсии |
| `/aktivy` | Активы | |
| `/finrezerv` | Финрезерв | |
| `/zhizn` | Защита жизни | |
| `/risk` | Риск-профиль | |
| `/result` | Результат | |

Конкретные промпты заполняет агент/контент — бэк только хранит и отдаёт в оркестратор.

---

## 6. Чего не делать в этом разделе

- Не трогать **chat_AI** (`/pfp/ai-b2c-chat/…`) — отдельный таб.
- Не путать с **constructor** (`/pfp/constructor/…`).
- Не встраивать клиентский `POST /my/ai-b2c/chat/dynamic/stream` в ЛК — это B2C-виджет, не админка.

Клиентский контракт SSE (для справки): `api_docs/b2c_plan_orchestrator_frontend.md`.

---

## 7. Smoke после реализации

1. `GET /pfp/ai-b2c/flows` — видны `default` и `plan`.
2. Селектор `plan` → `GET stages?flow_key=plan` — свой список команд.
3. Создать команду `/test23_pensia` с `content` + `command_context_text` → `PUT` → повторный `GET` возвращает те же поля.
4. Пустой `command_context_text` сохраняется как `null` — в UI бейдж «глобальный роутер».
5. `PUT settings?flow_key=plan` с `dynamic_context_text` — сохраняется и читается обратно.

---

## 8. Ссылки

- Схемы OpenAPI: `api_docs/aiB2c.yaml` → `AiB2cFlow`, `AiB2cStageCreate`, `flowKeyQuery`
- Пути ЛК: `api_docs/agent_lk.yaml` → тег «AI B2C (настройки Агента)»
- Краткая шпаргалка: `api_docs/AI_B2C_API_FRONTEND.md`
