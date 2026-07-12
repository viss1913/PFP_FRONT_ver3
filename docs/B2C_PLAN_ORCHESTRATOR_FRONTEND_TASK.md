# Задача фронту: B2C-оркестратор `/plan` + flows в ЛК агента

**Дата:** 2026-07-12  
**Бэк:** ветка `finam`, задеплоено на Immers (`https://pfp-api.bank-future.com/api`)  
**Для кого:** фронт B2C `/plan` + настройки AI B2C в ЛК агента

---

## 1. Суть

На бэке готов **двухшаговый оркестратор** для guest-флоу `/plan`:

1. **Первый ИИ (роутер)** — по сообщению или UI-событию выбирает команду/страницу (`/vybor_celi2`, `/test23_pensia`, …).
2. **Второй ИИ** — генерит ответ в чат (стрим).

Фронт получает **одним запросом**:
- SSE `classifier_command` → переключить экран
- SSE `text` → дописать в чат
- SSE `done` → конец стрима

На проект может быть **несколько site-flow** (`flow_key`: `default`, `plan`, …). Для `/plan` всегда **`flow_key: "plan"`**.

---

## 2. Документация API (в этом репо)

| Файл | Назначение |
|------|------------|
| [`api_docs/b2c_plan_orchestrator_frontend.md`](../api_docs/b2c_plan_orchestrator_frontend.md) | **Главный контракт** для B2C: endpoint, body, SSE, примеры |
| [`api_docs/aiB2c.yaml`](../api_docs/aiB2c.yaml) | Схемы: `AiB2cOrchestratorTurn`, `AiB2cFlow`, SSE events |
| [`api_docs/agent_lk.yaml`](../api_docs/agent_lk.yaml) | ЛК агента: `/pfp/ai-b2c/flows`, brain/stages/settings + `flow_key` |
| [`api_docs/b2c_lk.yaml`](../api_docs/b2c_lk.yaml) | Клиентские `/my/ai-b2c/*` |
| [`api_docs/AI_B2C_API_FRONTEND.md`](../api_docs/AI_B2C_API_FRONTEND.md) | Шпаргалка по ЛК |
| [`api_docs/AGENT_LK_API.md`](../api_docs/AGENT_LK_API.md) | Текстовое ТЗ экранов ЛК |

Test API: `https://pfp-api.bank-future.com/api`  
На Immers для **project_id=2** уже создан flow `plan` (после seed).

---

## 3. Что уже есть во фронт-репо (не пилить с нуля)

Оркестратор **уже заложен в код**, но за feature flag.

### B2C `/plan`

| Файл | Роль |
|------|------|
| `src/api/b2cOrchestratorApi.ts` | `POST /my/ai-b2c/chat/dynamic/stream`, парсинг SSE |
| `src/hooks/useB2cPlanOrchestrator.ts` | стейт чата, навигация по `classifier_command` |
| `src/components/b2c/B2cPlanOrchestratorFlow.tsx` | shell: чат + CJM + welcome + result |
| `src/components/b2c/B2cPlanChat.tsx` | виджет чата |
| `src/config/b2cPlanStageRegistry.ts` | маппинг `stage_key` → экран CJM |
| `src/constants/b2cPlan.ts` | `B2C_PLAN_FLOW_KEY = 'plan'` |
| `src/utils/b2cPlanOrchestratorFlag.ts` | включение режима |
| `src/pages/b2c/B2cGuestPlanPage.tsx` | переключение legacy CJM ↔ orchestrator |

**Включение оркестратора:**
- env: `VITE_B2C_PLAN_ORCHESTRATOR=1`
- или URL: `/plan/?orchestrator=1`

Без флага работает **старый** линейный CJM без dynamic/stream.

### ЛК агента

| Файл | Роль |
|------|------|
| `src/api/agentLkApi.ts` | `getAiB2cFlows`, CRUD с `flow_key` |
| `src/pages/SettingsPage.tsx` | таб «AI B2C site»: селектор flow, создание flow, brain/stages/settings |

---

## 4. Задачи: B2C `/plan`

### 4.1. Подключить и прогнать оркестратор

1. В `.env` (или на Vercel): `VITE_B2C_PLAN_ORCHESTRATOR=1`, `VITE_API_BASE_URL=https://pfp-api.bank-future.com/api`.
2. Открыть `/plan/?orchestrator=1&project_key=pk_…&ref=…`.
3. Проверить цепочку:
   - welcome → стартовое сообщение в чат → `classifier_command` (если не первый turn)
   - ввод текста в чат → стрим `text`
   - выбор цели → `event: goal_selected` + `goal_type_id`, `goal_name`
   - сабмит шага CJM → `event: page_submit` + `page_data`
   - переход на нужный экран по `stage_key` из SSE

### 4.2. Маппинг стадий

- Реестр: `src/config/b2cPlanStageRegistry.ts`.
- При старте подтягиваются стадии: `GET /my/ai-b2c/stages?flow_key=plan`.
- **Синхронизировать** `stage_key` в ЛК агента с ключами в реестре (со слэшем `/vybor_celi2` или без — бэк нормализует, фронт тоже).
- Новые страницы CJM → добавить в реестр + создать стадию в ЛК.

### 4.3. Обработка edge cases

| Ситуация | Ожидание |
|----------|----------|
| `classifierSkipped: true` | Первое сообщение в истории flow — роутер не дергался, навигация по команде не обязательна |
| Пустой `command` | Только текст в чат, экран не менять |
| `stage_key` не в реестре | Fallback `kind: 'unknown'` — показать заглушку или лог, не падать |
| 401 на stream | Guest token / client JWT — см. `clientB2cAuth.ts` |
| Обрыв SSE | Показать ошибку, разблокировать ввод |

### 4.4. UI/UX (если ещё не доделано)

- [ ] Индикатор «печатает…» на время `isStreaming`
- [ ] История чата при возврате (`GET /my/ai-b2c/history?flow_key=plan`)
- [ ] Имя/аватар ассистента из `GET /my/ai-b2c/settings?flow_key=plan`
- [ ] Desktop result: оркестратор отключается на wide result (уже в `B2cGuestPlanPage` — проверить)
- [ ] После smoke — решить: включать оркестратор **по умолчанию** или оставить flag до стабилизации

---

## 5. Задачи: ЛК агента (Settings → AI B2C site)

### 5.1. Flows

- [ ] `GET /api/pfp/ai-b2c/flows` — список в селекторе (уже есть в `SettingsPage`, проверить на prod API)
- [ ] `POST /api/pfp/ai-b2c/flows` — создать `plan` с `clone_from: "default"` если ещё нет
- [ ] При смене flow — перезагрузка brain-contexts, stages, settings с `?flow_key=`

### 5.2. Стадии под CJM `/plan`

Для flow `plan` завести стадии с `stage_key` = route страницы:

| stage_key (пример) | Назначение |
|--------------------|------------|
| `/start` | Welcome |
| `/lichnye_dannye` | Семья |
| `/vybor_celi2` | Выбор цели |
| `/test23_pensia` | Уточнение пенсии (если роутер выбрал) |
| `/aktivy`, `/finrezerv`, `/zhizn`, `/risk` | Шаги CJM |
| `/result` | Результат |

У каждой стадии:
- **`content`** — промпт второго ИИ (ответ клиенту)
- **`command_context_text`** — промпт роутера (команды `/…`); если пусто — берётся `dynamic_context_text` из settings flow

### 5.3. Settings flow `plan`

- `GET/PUT /api/pfp/ai-b2c/settings?flow_key=plan`
- Поле **`dynamic_context_text`** — глобальные правила роутера

---

## 6. Endpoint (шпаргалка)

### Клиент `/plan`

```
POST /api/my/ai-b2c/chat/dynamic/stream
Authorization: Bearer <guest_token | client_jwt>
X-Project-Key: pk_…
Content-Type: application/json

{ "flow_key": "plan", "message": "…" }
```

UI-событие:
```json
{
  "flow_key": "plan",
  "event": "goal_selected",
  "goal_type_id": 1,
  "goal_name": "Достойная пенсия",
  "page": "/vybor_celi2"
}
```

### ЛК агента

```
GET  /api/pfp/ai-b2c/flows
POST /api/pfp/ai-b2c/flows
GET  /api/pfp/ai-b2c/stages?flow_key=plan
GET  /api/pfp/ai-b2c/settings?flow_key=plan
```

---

## 7. Smoke-чеклист (перед мержем)

**B2C**
1. `/plan/?orchestrator=1` — чат + Виктория, стрим ответа
2. Текст «хочу пенсию» → `classifier_command` + текст (если стадии настроены)
3. Выбор цели на витрине → событие уходит, экран/ответ ок
4. Пройти CJM до calculate → result
5. Повторный визит — история чата подтягивается

**ЛК агента**
1. Settings → AI B2C site → flows в селекторе (`default`, `plan`)
2. Смена flow → другой список stages
3. Создание/редактирование стадии с `command_context_text`
4. Сохранение `dynamic_context_text` для `plan`

---

## 8. Не путать с другими чатами

| Endpoint | Когда |
|----------|--------|
| `POST /my/ai-b2c/chat/dynamic/stream` | **/plan**, оркестратор |
| `POST /my/ai-b2c/chat/stream` | Фиксированный stage с фронта |
| `POST /my/ai-b2c/chat_AI/stream` | Виджет chat_AI, без classifier на навигацию |
| `POST /pfp/constructor/site-chat/stream` | Конструктор, другая БД |

---

## 9. Вопросы / блокеры

- Нет flow `plan` на проекте → `POST /pfp/ai-b2c/flows` или попросить бэк seed.
- Роутер отдаёт команду, а экран не меняется → проверить `b2cPlanStageRegistry.ts` и `stage_key` в БД.
- Пустой ответ ИИ → `OPENROUTER_API_KEY` на бэке, brain-contexts flow `plan`.

Контакт по API: `api_docs/b2c_plan_orchestrator_frontend.md`.
