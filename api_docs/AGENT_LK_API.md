## Agent LK API (Личный кабинет агента)

Этот документ описывает, чем именно может пользоваться фронтенд ЛК Агента.  
Полная OpenAPI-спека лежит рядом в файле `agent_lk.yaml`.

Базовый URL для всех методов: `/api`

---

### Авторизация

- **JWT** получается через стандартный бекенд-логин: `POST /api/auth/login`.
- Все запросы из ЛК Агента отправляются с заголовком:
  - `Authorization: Bearer <jwt>`
- Из токена важны:
  - `role` ∈ {`agent`, `admin`, `super_admin`}
  - `projectId` — проект агента
  - `agentId` — идентификатор агента

---

### 1. Продукты (`/pfp/products*`)

Используются для настройки витрины продуктов, с которыми агент потом работает в планах.

- **Список продуктов**
  - `GET /api/pfp/products?includeDefaults=true`
  - Возвращает свои продукты + дефолтные системные (если `includeDefaults=true`).

- **Создать продукт**
  - `POST /api/pfp/products`
  - Тело запроса соответствует схеме `ProductCreate` (см. `OPENAPI_SPEC.yaml`).

- **Получить / Обновить / Удалить продукт**
  - `GET /api/pfp/products/{id}`
  - `PUT /api/pfp/products/{id}`
  - `DELETE /api/pfp/products/{id}`
  - Редактировать и удалять можно только **свои** продукты (по project_id). При попытке трогать системные прилетит 403.

- **Клонировать системный продукт**
  - `POST /api/pfp/products/{id}/clone`
  - Берём системный продукт, создаём копию в проекте агента, дальше работаем уже с копией.

Рекомендуемые экраны фронта:
- "Мои продукты": таблица продуктов, форма создания/редактирования, кнопка "Клонировать".

---

### 2. Портфели (`/pfp/portfolios*`)

Аналогично продуктам, но на уровне портфелей / стратегий.

- **Список портфелей**
  - `GET /api/pfp/portfolios?includeDefaults=true`

- **Создать портфель**
  - `POST /api/pfp/portfolios`

- **Получить / Обновить / Удалить портфель**
  - `GET /api/pfp/portfolios/{id}`
  - `PUT /api/pfp/portfolios/{id}`
  - `DELETE /api/pfp/portfolios/{id}`

- **Клонировать дефолтный портфель**
  - `POST /api/pfp/portfolios/{id}/clone`

- **Справочник классов портфелей**
  - `GET /api/pfp/portfolios/classes`
  - Используется для мультиселектов/чипсов в UI.

Рекомендуемые экраны:
- "Мои портфели": таблица, детали портфеля, выбор классов через справочник.

---

### 3. Настройки планов и инфляции (`/pfp/settings*`)

Позволяет агенту (или уполномоченному пользователю проекта) управлять базовыми настройками расчётов, в т.ч. инфляцией.

- **Список настроек проекта**
  - `GET /api/pfp/settings?category=calculation`
  - Возвращает массив настроек (`SystemSetting`), среди них будут ключи типа:
    - `inflation-ru` или `inflation_rate_year` — инфляция по умолчанию
    - другие параметры, влияющие на расчёты

- **Получить конкретную настройку**
  - `GET /api/pfp/settings/{key}`
  - Пример: `GET /api/pfp/settings/inflation-ru`

- **Обновить настройку**
  - `PUT /api/pfp/settings/{key}`
  - Тело:  
    ```json
    {
      "value": 5.0
    }
    ```
  - На проде доступ обычно ограничен по ролям (`admin/super_admin`), но это можно отрегулировать политиками.

Рекомендуемый экран:
- "Настройки планов": поле для редактирования инфляции по умолчанию и (по желанию) других ключевых настроек.

---

### 4. Клиенты B2C и их планы (`/pfp/clients*`)

Это "мост" между B2C ЛК клиента и ЛК Агента. Агенты видят своих клиентов и их финпланы, могут "подхватывать" планы и продолжать работу.

- **Список клиентов агента**
  - `GET /api/pfp/clients?search=...&has_plans=true`
  - Параметры:
    - `search` (опционально) — строка поиска по имени/email/телефону
    - `has_plans` (опционально) — если `true`, фильтруем только клиентов с планами
  - Агент видит только клиентов своего проекта/своего агентского кода.

- **Планы конкретного клиента**
  - `GET /api/pfp/clients/{clientId}/plans`
  - Возвращает краткую информацию по планам клиента (см. `ClientPlanShort` в `OPENAPI_SPEC.yaml`).

- **Подхватить план клиента в ЛК Агента**
  - `POST /api/pfp/clients/{clientId}/plans/{planId}/take-over`
  - Агент "берёт" уже существующий план, созданный клиентом в B2C ЛК, и дальше работает с ним в своём ЛК (настройка целей, продуктов, портфелей).
  - Ответ содержит полный план (`ClientPlan`).

Рекомендуемые экраны:
- "Мои клиенты":
  - таблица с ФИО, контактами, признаками наличия планов, поиском.
- "Карточка клиента":
  - блок с данными клиента,
  - список его планов с кнопкой "Открыть / Подхватить" → использование `take-over` и переход на форму редактирования плана.

---

### 5. Управление AI B2C из ЛК Агента (`/pfp/ai-b2c/*`)

Это агентский "хаб" настроек B2C-ИИ: **оркестраторы (flows)**, контексты (мозг), стейджи (сценарии) и настройки ассистента.
Те же сущности, что и в `/admin/ai-b2c`, но в скоупе проекта агента.

На один проект может быть **несколько site-flow** (`flow_key`: `default`, `plan`, …). Клиентский маршрут `/plan` использует `flow_key=plan` и endpoint `POST /my/ai-b2c/chat/dynamic/stream` (контракт SSE — `b2c_plan_orchestrator_frontend.md`).

Query-параметр **`flow_key`** (default `default`) — для `GET` brain-contexts, stages, settings.

#### Flows (оркестраторы)

- **Список flows**
  - `GET /api/pfp/ai-b2c/flows`
  - Массив `AiB2cFlow`: `flow_key`, `title`, `description`, `is_active`.

- **Создать flow**
  - `POST /api/pfp/ai-b2c/flows`
  - Тело (см. `aiB2c.yaml` → `AiB2cFlowCreate`):
    ```json
    {
      "flow_key": "plan",
      "title": "Сценарий /plan",
      "description": "B2C-оркестратор для маршрута /plan",
      "clone_from": "default"
    }
    ```
  - `clone_from` копирует brain-contexts, stages и settings из указанного flow.

Рекомендуемый экран:
- "ИИ – Оркестраторы":
  - список flows, кнопка «Создать» (с клонированием из `default`), переключатель активности.

#### Brain-contexts

- **Список brain-contexts**
  - `GET /api/pfp/ai-b2c/brain-contexts?flow_key=default`
  - Возвращает массив контекстов для текущего проекта и выбранного flow.

- **Создать brain-context**
  - `POST /api/pfp/ai-b2c/brain-contexts`
  - Тело (ориентир, уточняется по `aiB2c.yaml`):
    ```json
    {
      "flow_key": "plan",
      "title": "Продажи инвестпродуктов",
      "content": "Подробный промпт для ассистента...",
      "is_active": true,
      "priority": 10
    }
    ```

- **Обновить brain-context**
  - `PUT /api/pfp/ai-b2c/brain-contexts/{id}`

- **Удалить brain-context**
  - `DELETE /api/pfp/ai-b2c/brain-contexts/{id}`

Рекомендуемый экран:
- "ИИ – Мозг":
  - селектор flow (`default` / `plan` / …), список контекстов, переключатели активен/не активен, приоритет, формы создания/редактирования.

#### Stages (сценарии/этапы)

- **Список стейджей**
  - `GET /api/pfp/ai-b2c/stages?flow_key=plan`

- **Создать стейдж**
  - `POST /api/pfp/ai-b2c/stages`
  - Тело (ориентир, уточняется по `aiB2c.yaml`):
    ```json
    {
      "flow_key": "plan",
      "stage_key": "/test23_pensia",
      "title": "Пенсия",
      "content": "Промпт второго ИИ — ответ пользователю...",
      "command_context_text": "Правила первого ИИ-роутера на этой стадии...",
      "is_active": true,
      "priority": 100
    }
    ```

- **Обновить стейдж**
  - `PUT /api/pfp/ai-b2c/stages/{id}`

- **Удалить стейдж**
  - `DELETE /api/pfp/ai-b2c/stages/{id}`

Рекомендуемый экран:
- "ИИ – Сценарии":
  - селектор flow, список стейджей, поля `content` и `command_context_text`, включение/отключение сценариев.

#### Settings (бренд и роутер)

- **Получить настройки**
  - `GET /api/pfp/ai-b2c/settings?flow_key=plan`
  - `display_name`, `avatar_url`, `tagline`, **`dynamic_context_text`** — fallback для первого ИИ, если у стадии пустой `command_context_text`.

- **Обновить настройки**
  - `PUT /api/pfp/ai-b2c/settings?flow_key=plan`

- **Аватар**
  - `POST /api/pfp/ai-b2c/avatar-upload` (отдельно от PUT settings)

---

### 6. Где смотреть схемы и детали

- Полная структура запросов/ответов, схемы (`Product`, `Portfolio`, `ClientShort`, `ClientPlan`, `SystemSetting`, AI-сущности и т.д.) описаны в:
  - `agent_lk.yaml` (текущая спека ЛК Агента),
  - `openapi/OPENAPI_SPEC.yaml` (общие схемы домена PFP).

Рекомендуется для разработки фронта:
- поднимать Swagger/Redoc по `agent_lk.yaml` локально,
- использовать типы/интерфейсы, сгенерированные из OpenAPI (если в проекте есть генерация типов).

