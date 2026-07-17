# Partner AI Onboarding — runbook для партнёров и их ИИ-агентов

**Для кого:** команда партнёра, которая получает этот репозиторий и прикручивает **свой** фронт к **своему** `project_key` на общем PFP API.

**Модель:** код к BankFuture **не обязан** возвращаться. Вы форкаете/клонируете, кастомизируете нужные lanes, деплоите на свой CDN.

**Точка входа для Cursor:** корневой [`AGENTS.md`](../AGENTS.md) — прочитай его **первым**.

**Handoff-ветка:** `partner-handoff` (read-only snapshot). Клон: см. [`README.md`](../README.md). Пуш в наш репо **запрещён** — работайте в своём git.

---

## 1. Что это за репозиторий

Monorepo одного SPA (React + Vite + TypeScript) с **несколькими продуктовыми полосами (lanes)**:

| Lane | Что это | Типичный партнёрский кейс |
|------|---------|---------------------------|
| **B2C `/plan`** | Guest Family Office по ссылке агента | **Главный handoff** — white-label CJM + отчёты |
| **Landing** | Публичный маркетинг `/` | Свой бренд, лиды, CTA в `/plan` или login |
| **Agent LK** | Личный кабинет финансового агента | Если партнёр — сеть агентов с CRM/PFP |
| **Partner widgets** | Embed site-chat (`/npf`, `/rostech`) | Чат на своём сайте без полного `/plan` |
| Sber / ATB | White-label lanes BankFuture | Обычно **не** для внешних партнёров |

**Роутинг:** нет react-router. Public URL обрабатываются в [`src/main.tsx`](../src/main.tsx) через [`src/routing/publicRoutes.ts`](../src/routing/publicRoutes.ts). Всё остальное — state machine в [`src/App.tsx`](../src/App.tsx) (`?page=list`, `?page=settings`, …).

---

## 2. Быстрый старт (15 минут)

```bash
git clone --branch partner-handoff --single-branch \
  https://github.com/viss1913/PFP_FRONT_ver3.git family-office-partner
cd family-office-partner
cp .env.partner.example .env
# VITE_API_BASE_URL=https://pfp-api.bank-future.com/api
# VITE_SITE_URL=https://your-partner-domain.com
# VITE_PARTNER_PROJECT_KEY=pk_…   ← от backend BankFuture
# VITE_PARTNER_PROJECT_ID=42
npm install
npm run dev
npm run build
```

**Модель tenant:** партнёр деплоит фронт у себя, API **всегда наш** — см. [`PARTNER_PROJECT_KEY_SETUP.md`](./PARTNER_PROJECT_KEY_SETUP.md).

**Smoke по lane:**

| Lane | URL локально | Проверка |
|------|--------------|----------|
| `/plan` | `http://localhost:5173/plan/?ref=TEST&project_key=pk_…` | Welcome → CJM → calculate |
| Landing | `http://localhost:5173/` | Hero, CTA |
| Agent LK | login → `/?page=list` | Список клиентов (нужен agent JWT) |

**Cursor:** положи в проект папки `.cursor/agents/`, `.cursor/skills/`, `.cursor/rules/` из репо — они уже настроены под lanes.

---

## 3. `project_key` — мультитенантность (их key → наш API)

Почти каждый API-запрос несёт заголовок **`X-Project-Key`**.  
**Партнёр не поднимает backend** — key выдаём мы, запросы идут на `pfp-api.bank-future.com`.

**Полный гайд:** [`PARTNER_PROJECT_KEY_SETUP.md`](./PARTNER_PROJECT_KEY_SETUP.md)  
**Env-шаблон:** [`.env.partner.example`](../.env.partner.example)

| Способ задать key | Где |
|-------------------|-----|
| **Env (рекомендуется)** | `VITE_PARTNER_PROJECT_KEY` + `VITE_PARTNER_PROJECT_ID` в `.env` |
| Query в ссылке (B2C) | `/plan/?ref=…&project_key=pk_…` → sessionStorage |
| Default в коде | [`src/api/projectKey.ts`](../src/api/projectKey.ts) — fallback Finam |

**Запросить у BankFuture:** `project_key`, `project_id`, **CORS whitelist** вашего домена.

---

## 4. Карта API → файлы фронта

```
VITE_API_BASE_URL  →  src/api/config.ts
        │
        ├── agentLkApi.ts    → /api/pfp/*     (Agent LK: клиенты, PDF, AI admin, CRM)
        ├── clientApi.ts     → /api/*         (расчёт, risk profile — из LK)
        ├── b2cApi.ts        → /api/*         (guest B2C: calculate, reports)
        ├── b2cOrchestratorApi.ts → SSE AI chat на /plan
        ├── authApi.ts       → /api/auth/*    (login, register, invite)
        └── crmApi.ts        → /api/pfp/crm/*
```

**OpenAPI:** папка [`api_docs/`](../api_docs/). Для каждой задачи — свой yaml + md brief (см. [`AGENTS.md`](../AGENTS.md)).

---

## 5. Сценарии интеграции (выбери свой)

### A. Guest `/plan` white-label (самый частый)

**Док:** [`B2C_PLAN_HANDOFF.md`](./B2C_PLAN_HANDOFF.md)  
**Cursor:** agent `b2c`, skill `b2c-plan-handoff`

```
/plan/?ref=AGENT_CODE&project_key=pk_…
  → welcome (Виктория)
  → guest CJM (семья → цели → активы → … → риск)
  → POST /client/calculate
  → result + HTML/PDF (guest_token)
```

Кастомизация **без** правки core: `src/content/b2c*`, `src/assets/b2c/`, `src/styles/b2c-guest-plan.css`.

**CDN:** URL **`/plan/` со слэшем** — иначе query `ref`/`project_key` может потеряться. См. `scripts/plan-query-redirect.html`, `scripts/copy-spa-fallbacks.mjs`.

### B. AI orchestrator на `/plan`

**Док:** [`B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`](./B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md), [`api_docs/b2c_plan_orchestrator_frontend.md`](../api_docs/b2c_plan_orchestrator_frontend.md)

Включение:
- env `VITE_B2C_PLAN_ORCHESTRATOR=1`, или
- query `?orchestrator=1`

Ключевые файлы: `useB2cPlanOrchestrator.ts`, `B2cPlanOrchestratorFlow.tsx`, `b2cPlanStageRegistry.ts`, `b2cOrchestratorApi.ts`.

Flows настраиваются в **Agent LK** (Track A) → клиенты видят на `/plan` (Track B). См. [`.cursor/plans/b2c_site_sync_deploy.plan.md`](../.cursor/plans/b2c_site_sync_deploy.plan.md).

### C. Agent LK (сеть агентов)

**Док:** [`api_docs/AGENT_LK_API.md`](../api_docs/AGENT_LK_API.md), [`api_docs/agent_lk.yaml`](../api_docs/agent_lk.yaml)  
**Cursor:** agent `agent-lk`

Entry: `App.tsx` после login. JWT: `localStorage.token`.  
Onboarding агентов: agent `onboarding-agent`, docs `FRONT_FAMILY_OFFICE_INVITE.md`.

### D. Embed site-chat (constructor widget)

**Док:** [`partner-widgets/constructor-chat/README.md`](../partner-widgets/constructor-chat/README.md)

Это **не** `/plan` и **не** AI B2C orchestrator. Отдельный виджет с env project keys. Build: `npm run build:partner-widgets`.

### E. Свой landing

**Cursor:** agent `landing`  
Файлы: `src/pages/LandingPage.tsx`, `src/components/landing/`, `src/content/`, env `VITE_LANDING_*` в `.env.example`.

---

## 6. Три «AI» — не перепутай

| # | Продукт | URL / UI | Док |
|---|---------|----------|-----|
| 1 | AI B2C site orchestrator | `/plan` + SSE | `B2C_PLAN_ORCHESTRATOR_*` |
| 2 | AI B2C admin (flows в LK) | Settings → AI B2C | `AI_B2C_SITE_ADMIN_FRONTEND_TASK.md` |
| 3 | Constructor site-chat | embed / `/npf` | `partner-widgets/README` |
| 4 | Constructor Telegram bot | LK → Ai Agent | `AiAgentPage.tsx`, agent_lk.yaml |

---

## 7. Структура `src/` (шпаргалка)

```
src/
├── main.tsx              # public routes mount
├── App.tsx               # agent LK + landing state machine
├── routing/publicRoutes.ts
├── pages/
│   ├── b2c/              # /plan
│   ├── sber/               # /sber
│   ├── atb/                # ATB
│   ├── invite/, register/  # agent onboarding
│   └── LandingPage.tsx     # /
├── components/
│   ├── b2c/              # guest CJM UI
│   ├── steps/            # shared CJM steps
│   ├── landing/
│   └── …
├── api/                  # HTTP clients (см. §4)
├── config/               # stage registry, ATB, Sber keys
├── content/              # copy + asset refs (white-label)
├── styles/               # b2c-guest-plan.css, lk-responsive.css
├── utils/                # auth, attribution, payloads
├── hooks/                # orchestrator, etc.
└── seo/pageSeo.ts        # meta per route
```

---

## 8. JWT и auth

| Роль | Token storage | Не путать с |
|------|---------------|-------------|
| Agent | `localStorage.token` | guest/client |
| B2C guest | `localStorage.client_token` | agent token |
| B2C client (после reg) | `client_token` | agent token |

Утилиты: [`clientB2cAuth.ts`](../src/utils/clientB2cAuth.ts), [`clientB2cAttribution.ts`](../src/utils/clientB2cAttribution.ts).

---

## 9. Деплой партнёра

1. `npm run build` → `dist/`
2. Залить на S3/CDN/хостинг
3. SPA fallback для `/plan/` (см. `scripts/copy-spa-fallbacks.mjs`)
4. Env на build-time: `VITE_API_BASE_URL`, `VITE_SITE_URL`

Референс: [`DEPLOY_YANDEX.md`](./DEPLOY_YANDEX.md) (Yandex Object Storage — адаптируй под свой bucket).

**Prod BankFuture:** `family-office.bank-future.com` (landing + `/plan` + sber)  
**Staging LK:** `pfp-front-ver3.vercel.app`

---

## 10. Чеклист handoff (для ИИ-агента партнёра)

- [ ] Прочитан [`AGENTS.md`](../AGENTS.md)
- [ ] Определён **один primary lane** (обычно `/plan`)
- [ ] Получен `project_key` от backend
- [ ] `.env` из `.env.example`, секреты не в git
- [ ] Default key или query `?project_key=` работает
- [ ] Smoke `/plan/` со **слэшем**
- [ ] Guest JWT ≠ agent JWT — не затираем `localStorage.token`
- [ ] Не трогаем Sber/ATB/LK без явной задачи
- [ ] Cursor agents/skills/rules на месте
- [ ] Клон с `--single-branch partner-handoff` или свой fork
- [ ] **Не** пушим в репо BankFuture

---

## 11. Куда писать / что ещё спросить у BankFuture

| Вопрос | К кому |
|--------|--------|
| Новый `project_key`, tenant | Backend |
| AI flows / orchestrator stages | Backend + `AI_B2C_*` docs |
| PDF report templates | Backend + `PDFsettings.yaml` |
| Finam ID / agent invite URLs | Backend env + `onboarding-agent` doc |
| CDN / домен prod | DevOps / BankFuture |

---

## Связанные документы

| Документ | Тема |
|----------|------|
| [`AGENTS.md`](../AGENTS.md) | Индекс для Cursor |
| [`B2C_PLAN_HANDOFF.md`](./B2C_PLAN_HANDOFF.md) | Детальный `/plan` kit |
| [`FRONT_B2C_REFERRAL_MVP.md`](./FRONT_B2C_REFERRAL_MVP.md) | Referral API |
| [`B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`](./B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md) | AI orchestrator |
| [`AI_B2C_SITE_ADMIN_FRONTEND_TASK.md`](./AI_B2C_SITE_ADMIN_FRONTEND_TASK.md) | LK admin flows |
| [`DEPLOY_YANDEX.md`](./DEPLOY_YANDEX.md) | Деплой |
