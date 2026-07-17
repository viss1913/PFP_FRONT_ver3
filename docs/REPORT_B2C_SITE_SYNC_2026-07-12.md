# Отчёт: B2C site-оркестратор (админка + `/plan`)

**Дата:** 2026-07-12  
**Ветка:** `conomy`  
**Статус:** код готов, **2 коммита локально** (ещё **не push** / **не deploy**)  
**API (test):** `https://pfp-api.bank-future.com/api`

---

## 1. Цель

Два независимых трека:

| Трек | Что | Для кого |
|------|-----|----------|
| **A** | Админка site-оркестратора в ЛК агента (flows, settings, brain, команды) | **Все** агенты / проекты |
| **B** | Клиентский `/plan` на оркестраторе (`flow_key=plan`, SSE) | **Наш lane** (conomy / family-office) |

Связь: агент в ЛК настраивает flow `plan` → клиент `/plan` читает конфиг через `/my/ai-b2c/*` и мапит `stage_key` на экраны CJM.

---

## 2. Что сделано

### 2.1. Этап 0 — сверка с Yandex Object Storage

- Build из clean HEAD `73a362b` + `npm run audit:bucket`
- **Результат: прод ≠ HEAD** (exit 2)
  - Prod JS: `assets/index-ApRx-GR_.js`
  - HEAD dist: `assets/index-B-fSvQIY.js`
  - ~38 файлов расходятся
- Baseline deploy **осознанно пропущен** (один финальный deploy после A+B)
- Примечание: `aws s3` на машине падает через proxy `socks4://127.0.0.1:10809` — для audit/deploy нужно сбрасывать `HTTP(S)_PROXY`

### 2.2. Трек A — ЛК: «B2C site — оркестратор»

**Коммит:** `47928a3` — `feat(lk): B2C site orchestrator admin (flows, dual prompts)`

| Область | Детали |
|---------|--------|
| API-клиент | `agentLkApi`: flows, `flow_key` на settings/brain/stages, `command_context_text`, `dynamic_context_text` |
| UI Settings | таб «Сайт» / раздел **B2C site — оркестратор** |
| Flows | селектор + создание flow (в т.ч. `plan`) |
| Settings | имя, аватар, tagline, **глобальный роутер** `dynamic_context_text` |
| Brain | CRUD + **превью content** в списке |
| Команды / стадии | badge `stage_key`, превью **content** + **router**, бейдж **«свой» / «глобальный»** роутер |
| Валидация | `content` обязателен при save (бэк 400 без него) |
| Docs | `docs/AI_B2C_SITE_ADMIN_FRONTEND_TASK.md`, обновлены `api_docs/agent_lk.yaml`, `aiB2c.yaml`, шпаргалки |

**Не трогали:** `ai-b2c-chat`, constructor, `/sber`, `/atb_*`.

### 2.3. Трек B — клиент `/plan` + оркестратор

**Коммит:** `d470231` — `feat(b2c): plan orchestrator for conomy /plan lane`

| Область | Файлы / поведение |
|---------|-------------------|
| Feature flag | `VITE_B2C_PLAN_ORCHESTRATOR=1` **или** `?orchestrator=1` / `?orchestrator=0` |
| Flow key | `B2C_PLAN_FLOW_KEY = 'plan'` (`src/constants/b2cPlan.ts`) |
| SSE API | `POST /my/ai-b2c/chat/dynamic/stream` — `classifier_command` → `text` → `done` |
| Hook | `useB2cPlanOrchestrator` — чат, history, settings, abort, UI events |
| UI | shell + chat (имя/аватар/«Печатает…») + welcome / CJM / result |
| Events | `goal_selected`, `page_submit` из CJM |
| Registry | `b2cPlanStageRegistry` — маппинг `stage_key` → экран; merge с `GET …/stages` |
| Edge cases | пустая команда → **не** менять экран; unknown stage → заглушка; 401/ошибки SSE; abort |
| Legacy | без флага — **старый линейный CJM** без стрима |
| Docs | `docs/B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`, `api_docs/b2c_plan_orchestrator_frontend.md` |

**Прод-дефолт оркестратора:** env **не** включаем по умолчанию — тест через `?orchestrator=1` до стабилизации.

---

## 3. Коммиты (локально, branch ahead +2)

```
d470231 feat(b2c): plan orchestrator for conomy /plan lane   (+2795 / −255, 21 files)
47928a3 feat(lk): B2C site orchestrator admin (flows, dual prompts)  (+1249 / −130, 8 files)
73a362b docs(b2c): point handoff to conomy branch URL   ← предыдущий origin
```

**Push / deploy не выполнялись.**

---

## 4. Проверки

| Проверка | Статус |
|----------|--------|
| `tsc -b` | ✅ ok |
| Smoke UI A (ЛК flows/stages/settings) | ⏳ нужна ручная прогонка на test API |
| Smoke UI B (`/plan?orchestrator=1` + fallback) | ⏳ нужна ручная прогонка |
| `deploy:yandex` | ❌ не запускали |
| `git push origin conomy` | ❌ не запускали |

### Рекомендуемый smoke

**A — ЛК агента (test API):**
1. Settings → Сайт → flows `default` + `plan`
2. CRUD команды: `content` + `command_context_text` → бейдж «свой»
3. Пустой `command_context_text` → бейдж «глобальный»
4. PUT settings `?flow_key=plan` с `dynamic_context_text`

**B — guest `/plan`:**
1. `/plan/?orchestrator=1&project_key=…&ref=…` — стрим, переключение по `stage_key`
2. `/plan/` без флага — старый CJM
3. Регресс: calculate / result / guest_token

---

## 5. Риски / блокеры

1. **Прод-фронт ≠ git HEAD** — на бакете другой bundle; следующий deploy перезапишет.
2. **Prod backend** — нужны endpoints `/pfp/ai-b2c/flows` + `flow_key` на stages/settings; иначе админка A на проде упадёт, даже если фронт выкатим.
3. **`stage_key` в ЛК vs registry** — новые команды без маппинга в `b2cPlanStageRegistry` покажут unknown-заглушку (чат продолжит работать).
4. **Оркестратор off by default** — на prod `/plan` поведение не меняется, пока нет env/`?orchestrator=1`.

---

## 6. Что осталось / next steps

1. Ручной smoke A + B на test API (Immers / project с flow `plan`).
2. `git push origin conomy` (после ревью).
3. `npm run security:check` → `deploy:yandex` (без proxy / с очищенными env proxy).
4. Post-deploy: `family-office.bank-future.com` — `/` и `/plan`.
5. После стабилизации — решение: включать `VITE_B2C_PLAN_ORCHESTRATOR=1` на prod или оставить только URL-flag.

---

## 7. Ключевые пути в репо

**Трек A**
- `src/pages/SettingsPage.tsx`
- `src/api/agentLkApi.ts`
- `docs/AI_B2C_SITE_ADMIN_FRONTEND_TASK.md`

**Трек B**
- `src/pages/b2c/B2cGuestPlanPage.tsx`
- `src/api/b2cOrchestratorApi.ts`
- `src/hooks/useB2cPlanOrchestrator.ts`
- `src/components/b2c/B2cPlanOrchestratorFlow.tsx`
- `src/config/b2cPlanStageRegistry.ts`
- `src/utils/b2cPlanOrchestratorFlag.ts`
- `docs/B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`
- `api_docs/b2c_plan_orchestrator_frontend.md`

**План работы:** `.cursor/plans/b2c_site_sync_deploy.plan.md`

---

## 8. TL;DR для тимлида

Сделали **универсальную админку site-оркестратора** в ЛК (flows + два промпта на команду) и **оркестратор на guest `/plan`** за feature flag. Два чистых коммита на `conomy`, typecheck зелёный. **Push и deploy не делали.** Прод-бакет сейчас не совпадает с HEAD — при выкате будет полный overwrite. Рекомендуется smoke на test → push → deploy, оркестратор на prod держать **выключенным** до стабилизации.

---

## 9. Follow-up: session context агента (ref)

**Сводка для тимлида (копипаст):** [`docs/REPORT_B2C_FOR_TEAMLEAD.md`](./REPORT_B2C_FOR_TEAMLEAD.md)  
**Контракт + handoff бэку:** [`docs/B2C_PLAN_SESSION_CONTEXT.md`](./B2C_PLAN_SESSION_CONTEXT.md)

- Front шлёт `session_context.agent` (FIO из referral preview) на каждый orchestrator turn.
- Alias `/welcome` → welcome UI.
- Чтобы ИИ использовал имя — **бэк: replace `{{agent_*}}` в промптах** (и желательно resolve agent по `ref`).
