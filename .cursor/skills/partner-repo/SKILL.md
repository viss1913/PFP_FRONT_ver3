---
name: partner-repo
description: Навигация по PFP frontend для внешнего партнёра — lanes, API, project_key, handoff /plan, Cursor agents. Применяй при онбординге партнёра, неясном scope, интеграции своего project_key.
---

# Partner repo navigation

## Когда применять

- Новый партнёр / форк репо
- «Где API?», «Что трогать?», «Как прикрутить project_key?»
- Задача может затронуть не тот lane

## Порядок чтения

1. [`AGENTS.md`](../../AGENTS.md)
2. [`docs/PARTNER_AI_ONBOARDING.md`](../../docs/PARTNER_AI_ONBOARDING.md)
3. [`docs/PARTNER_GIT_ACCESS.md`](../../docs/PARTNER_GIT_ACCESS.md) — clone `partner-handoff`, push запрещён
4. Lane-specific handoff (обычно [`docs/B2C_PLAN_HANDOFF.md`](../../docs/B2C_PLAN_HANDOFF.md))

## Clone

```bash
git clone --branch partner-handoff --single-branch \
  https://github.com/viss1913/PFP_FRONT_ver3.git family-office-partner
```

См. [`README.md`](../../README.md).

## Определи lane

| Задача партнёра | Lane | Agent |
|-----------------|------|-------|
| Guest CJM + отчёты | `/plan` | `b2c` |
| AI-чат на /plan | orchestrator | `b2c` + `B2C_PLAN_ORCHESTRATOR_*` |
| Embed chat на сайт | widgets | `partner-widgets/README` |
| LK для агентов | Agent LK | `agent-lk` |
| Маркетинг / | landing | `landing` |

## project_key

- Выдаёт **backend BankFuture** (+ CORS whitelist домена партнёра)
- Front: **`VITE_PARTNER_PROJECT_KEY`** в `.env` — см. [`.env.partner.example`](../../.env.partner.example)
- Гайд: [`docs/PARTNER_PROJECT_KEY_SETUP.md`](../../docs/PARTNER_PROJECT_KEY_SETUP.md)
- Header: `X-Project-Key` на API **нашего** сервера `pfp-api.bank-future.com`

## Env минимум

```env
VITE_API_BASE_URL=https://…/api
VITE_SITE_URL=https://your-domain.com
```

Копировать из [`.env.partner.example`](../../.env.partner.example). Секреты не в git.

## Запреты

- Не ломать чужие lanes «заодно»
- Guest JWT ≠ agent JWT
- Не пушить в репо BankFuture — только свой git
- Handoff-ветка для clone: **`partner-handoff`**

## Делегирование

Scope неясен → subagent `repo-architecture`  
White-label /plan → skill `b2c-plan-handoff`

## Smoke после кастомизации

`/plan/?ref=TEST&project_key=pk_…` → welcome → CJM → calculate → report (если guest_token)
