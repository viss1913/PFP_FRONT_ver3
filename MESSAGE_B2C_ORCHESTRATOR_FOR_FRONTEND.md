# Сообщение для фронта (копипаст)

---

Привет!

На бэке готов **B2C-оркестратор для `/plan`** — выкатили на test API.

**API:** `https://pfp-api.bank-future.com/api`  
**Доки в репе:** папка `api_docs/` (обновлены `agent_lk.yaml`, `aiB2c.yaml`, `b2c_plan_orchestrator_frontend.md`)  
**Полное ТЗ:** `docs/B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`

## Что сделать

### 1) B2C `/plan`

Оркестратор **уже в коде**, включается флагом:
- `VITE_B2C_PLAN_ORCHESTRATOR=1` в env, **или**
- `/plan/?orchestrator=1`

Endpoint:
```
POST /api/my/ai-b2c/chat/dynamic/stream
{ "flow_key": "plan", "message": "…" }
```

SSE: `classifier_command` (навигация по `stage_key`) → `text` (чат) → `done`.

UI-события слать в тот же endpoint:
- выбор цели → `event: "goal_selected"` + `goal_type_id`, `goal_name`, `page`
- сабмит формы → `event: "page_submit"` + `page`, `page_data`

Ключевые файлы: `src/api/b2cOrchestratorApi.ts`, `useB2cPlanOrchestrator.ts`, `B2cPlanOrchestratorFlow.tsx`, `b2cPlanStageRegistry.ts`.

**Задача:** включить на test, прогнать smoke, синхронизировать `stage_key` в реестре с тем, что заведём в ЛК.

### 2) ЛК агента (Settings → AI B2C site)

Новое на бэке:
- `GET/POST /api/pfp/ai-b2c/flows` — несколько оркестраторов на проект
- query **`flow_key`** на brain-contexts, stages, settings

Для `/plan` нужен flow **`plan`** (на test project 2 уже есть). В стадиях:
- `content` — ответ второго ИИ
- `command_context_text` — роутер (команды `/vybor_celi2`, `/test23_pensia`, …)

В `SettingsPage` селектор flow уже есть — проверить на prod API и допилить стадии под CJM.

## Smoke

1. `/plan/?orchestrator=1` — чат стримит, команды переключают экраны  
2. ЛК: flows `default` + `plan`, стадии редактируются с `flow_key=plan`  
3. Выбор цели / сабмит шага — уходит `event`, бэк отвечает

Контракт SSE и примеры body: **`api_docs/b2c_plan_orchestrator_frontend.md`**.

Вопросы — в тред, разберём на конкретных запросах.

---
