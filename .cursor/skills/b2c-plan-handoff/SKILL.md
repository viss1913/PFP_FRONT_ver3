---
name: b2c-plan-handoff
description: Кастомизация guest B2C /plan — welcome, CJM, result, white-label copy/assets/CSS, handoff агентам, project_key, SEO Telegram, без правок Sber/ATB/agent LK.
---

# B2C `/plan` — handoff / white-label

## Когда применять

Задачи про guest Family Office на `/plan`: welcome Виктории, guest CJM, calculate, result/reports, кастомизация бренда/текстов/ассетов, поднятие lane у внешнего агента в **своём** репо.

**Не смешивать** с agent LK (`App.tsx`), `/sber`, `/atb_*`, partner-widgets, invite/register — если задача не про них явно.

## Источники правды

1. Handoff kit: `docs/B2C_PLAN_HANDOFF.md` — **прочитай первым**
2. API / referral: `docs/FRONT_B2C_REFERRAL_MVP.md`
3. OpenAPI: `api_docs/b2c_lk.yaml`
4. Agent brief: `.cursor/agents/b2c.md`

## Модель передачи

- Snapshot для партнёров: ветка **`partner-handoff`** (read-only clone, см. [`README.md`](../../README.md))
- Партнёр работает в **своём** git — push в репо BankFuture **запрещён**
- BankFuture обновляет `partner-handoff` из `conomy` / `main` по мере готовности
- Реалистичный старт: весь репо как база, кастомизируют и деплоят **только `/plan`**
- Сначала **content + assets + CSS vars**, не `CJMFlow` / API без нужды.

## Whitelist правок (кастомизация)

| Что | Куда |
|-----|------|
| Welcome текст / CTA | `src/content/b2cWelcomeCopy.ts` |
| Реплики Виктории по шагам | `src/content/b2cCjmCoachCopy.ts` |
| Тексты шагов | `src/content/b2c*StepCopy.ts`, `b2cGoalSelectionCopy.ts` |
| Лого / аватары / heroes | `src/content/b2cAssets.ts` + `src/assets/b2c/`, `src/assets/goals/` |
| Цвета / layout | `src/styles/b2c-guest-plan.css` |
| SEO / Telegram | `src/seo/pageSeo.ts` (`SEO.b2cPlan`) + `scripts/copy-spa-fallbacks.mjs` + `scripts/plan-query-redirect.html` |
| API / site | `.env` (`VITE_API_BASE_URL`, `VITE_SITE_URL`) |
| Default project_key | `src/api/projectKey.ts` |

Core entry (трогать только если нужно для изоляции/багов):

- `src/pages/b2c/B2cGuestPlanPage.tsx`
- `src/components/b2c/*`
- `src/api/b2cApi.ts`, attribution/auth/draft utils

## Запреты

- Не ломать `/sber`, `/atb_*`, agent LK, partner-widgets «заодно».
- Не коммитить `.env`, ключи CDN, секреты.
- Не обещать полный выпил `ResultPage` / `App` без отдельного этапа.
- Guest JWT ≠ agent JWT; не затирать `localStorage.token` агента.

## Welcome (актуально)

- Слева чат, справа hero (`welcome-doors-hero.webp` / `b2cVisualAssets.welcomeDoorsHero`).
- Мобилка: **сначала чат**, ниже hero.
- Одно bubble: `buildB2cWelcomeChatMessage()` — не три отдельных сообщения.
- CTA → `setView('cjm')` в `B2cGuestPlanPage`.

## Workflow

1. Прочитать `docs/B2C_PLAN_HANDOFF.md`.
2. Править только whitelist выше.
3. `npm run build`.
4. Smoke `/plan/` (со слэшем): `?ref=` → welcome → CJM → calculate → HTML/PDF при `guest_token`.
5. Деплой на **свой** bucket/домен; CDN: URL `/plan/` со слэшем.
6. Коммиты — в **свой** репозиторий (не в BankFuture).

## Связанное Cursor rule

`.cursor/rules/b2c-plan-handoff.mdc` — globs на b2c components/content/CSS; держи rule и skill согласованными.
