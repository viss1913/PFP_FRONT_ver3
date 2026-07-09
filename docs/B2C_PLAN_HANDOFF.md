# B2C `/plan` — пакет передачи (handoff kit)

**Для кого:** команда/агент, который поднимает guest Family Office **у себя** (свой репо, свой деплой, свой `project_key`).  
**Модель:** код к нам **не возвращают**. Мы даём карту файлов + чеклист кастомизации + Cursor skill.

**Связанные доки**

- API / referral MVP: [`FRONT_B2C_REFERRAL_MVP.md`](./FRONT_B2C_REFERRAL_MVP.md)
- OpenAPI: [`api_docs/b2c_lk.yaml`](../api_docs/b2c_lk.yaml)
- Деплой (Yandex / CDN): [`DEPLOY_YANDEX.md`](./DEPLOY_YANDEX.md)
- Cursor skill: [`.cursor/skills/b2c-plan-handoff/SKILL.md`](../.cursor/skills/b2c-plan-handoff/SKILL.md)

**Референс-прод (наш):** `https://family-office.bank-future.com/plan/`  
**API (наш):** `https://pfp-api.bank-future.com/api`

---

## 1. Что вы получаете

Guest-флоу клиента по ссылке агента:

```
/plan/?ref=…&project_key=…
  → welcome (Виктория + hero)
  → guest CJM (семья → цели → активы → финрезерв → жизнь → риск)
  → POST /client/calculate
  → result (desktop: B2cResultDashboard; mobile: ResultPage guestMode)
  → HTML/PDF отчёты по guest_token
```

Реалистичный старт: **весь репозиторий как база**, но вы **запускаете и кастомизируете только lane `/plan`**.  
Sber / ATB / agent LK / partner-widgets **не трогаете**, если они вам не нужны.  
Полный выпил `App.tsx` / `ResultPage` agent-хвостов — отдельный этап (дорого из‑за импортов).

---

## 2. Быстрый старт у себя

1. Скопировать репо (или архив ветки) к себе.
2. Скопировать `.env.example` → `.env`, выставить:
   - `VITE_API_BASE_URL` — ваш API (`…/api`)
   - `VITE_SITE_URL` — ваш публичный origin (без trailing slash)
3. Default `project_key`: [`src/api/projectKey.ts`](../src/api/projectKey.ts) **или** всегда передавать `?project_key=pk_…` в ссылке.
4. `npm install` → `npm run build` → поднять `dist/` на своём CDN/хостинге.
5. Обязательно: URL **`/plan/` со слэшем** (иначе CDN может съесть query `ref` / `project_key`). См. `scripts/plan-query-redirect.html` + `scripts/copy-spa-fallbacks.mjs`.
6. Smoke: открыть `/plan/?ref=TEST&project_key=pk_…` → welcome → пройти CJM → расчёт → кнопки отчёта (если бэк отдал `guest_token`).

Cursor: положить skill [`.cursor/skills/b2c-plan-handoff/`](../.cursor/skills/b2c-plan-handoff/) в свой `.cursor/skills/` (или клонировать вместе с репо).

---

## 3. Что взять (core lane `/plan`)

### Entry / routing

| Файл | Зачем |
|------|--------|
| `src/main.tsx` | public route `b2c-plan`, SEO, redirect `/?ref=` → `/plan/` |
| `src/routing/publicRoutes.ts` | `/plan` → `b2c-plan` |
| `index.html` | SPA shell |
| `vite.config.ts`, `package.json`, `tsconfig*.json` | сборка |

### Page + orchestration

| Файл |
|------|
| `src/pages/b2c/B2cGuestPlanPage.tsx` |
| `src/components/CJMFlow.tsx` (`mode="guest"`) |
| `src/styles/b2c-guest-plan.css` |

### UI B2C (`src/components/b2c/`)

```
B2cClientWelcome.tsx
B2cCjmShell.tsx
B2cCjmSidebar.tsx
B2cStepFamilyForm.tsx
B2cFamilyAccordion.tsx
B2cStepGoalSelection.tsx
B2cStepAssets.tsx
B2cStepFinReserve.tsx
B2cStepLifeInsurance.tsx
B2cStepRiskProfile.tsx
B2cResultDashboard.tsx
B2cClientPlanSaveModal.tsx
```

### Step wrappers (guest идёт через них)

```
src/components/steps/StepFamilyProfile.tsx   # variant="b2c"
src/components/steps/StepGoalSelection.tsx   # guestMode
src/components/steps/StepAssets.tsx
src/components/steps/StepFinReserve.tsx
src/components/steps/StepLifeInsurance.tsx
src/components/steps/StepRiskProfile.tsx
```

### Result

| Файл | Когда |
|------|--------|
| `src/components/b2c/B2cResultDashboard.tsx` | desktop ≥1024px |
| `src/components/ResultPage.tsx` (+ цепочка Design) | mobile; в guestMode UI урезан, но импорты agent LK остаются в бандле |

### API / session / payload

```
src/api/b2cApi.ts
src/api/config.ts
src/api/projectKey.ts
src/utils/clientB2cAttribution.ts
src/utils/clientB2cAuth.ts
src/utils/b2cPlanDraft.ts
src/utils/b2cGuestCalculatePayload.ts
src/utils/b2cResultDashboard.ts
```

### Content (тексты / ассеты)

```
src/content/b2cAssets.ts
src/content/b2cWelcomeCopy.ts
src/content/b2cCjmCoachCopy.ts
src/content/b2cGoalSelectionCopy.ts
src/content/b2cAssetsStepCopy.ts
src/content/b2cFinReserveStepCopy.ts
src/content/b2cLifeInsuranceStepCopy.ts
src/content/b2cRiskProfileStepCopy.ts
```

### Картинки

```
src/assets/b2c/family-office-logo.svg
src/assets/b2c/victoria-avatar.png
src/assets/goals/*.webp          # цели + welcome-doors-hero + step heroes
src/utils/GoalImages.ts
```

### SEO / деплой `/plan`

```
src/seo/pageSeo.ts                 # SEO.b2cPlan
src/config/site.ts
scripts/copy-spa-fallbacks.mjs     # dist/plan/index.html + OG meta
scripts/plan-query-redirect.html   # /plan → /plan/ с query
scripts/upload-to-yandex-bucket.mjs  # или ваш аналог sync
```

### Utils, которые дергает lane

```
src/utils/rangeInputStyle.ts
src/utils/finReserveRecommendations.ts
src/utils/reportHtmlSrcdoc.ts
src/utils/dateUtils.ts
src/utils/portfolioYield.ts
src/utils/goalOnboardingBounds.ts
src/constants/portfolioRiskProfiles.ts
src/types/client.ts
```

---

## 4. Что не трогать / не деплоить (если не нужно)

| Lane / зона | Пути |
|-------------|------|
| Agent LK | `src/App.tsx`, страницы ЛК, CRM |
| Sber | `src/pages/sber/`, `/sber` |
| ATB | `src/pages/atb/`, `/atb_mass`, `/atb_bank` |
| Invite / register агента | `src/pages/invite/`, `src/pages/register/` |
| Partner widgets | `partner-widgets/`, `scripts/build-partner-widgets.mjs`, `/rostech`, `/npf` |
| Лендинг | `src/components/landing/`, `src/styles/landing.css` |

Их можно оставить в репо «как есть» — просто не кастомизировать и не обещать в своём продукте.

---

## 5. Env

| Переменная | Обязательно | Назначение |
|------------|-------------|------------|
| `VITE_API_BASE_URL` | да | Base API с `/api` |
| `VITE_SITE_URL` | да для prod | canonical, OG, sitemap scripts |
| `VITE_API_URL` | нет | legacy host без `/api` |

`project_key` **не** из env: URL `?project_key=` → sessionStorage (`clientB2cAttribution.ts`) или default в `projectKey.ts`.

Секреты деплоя (`AWS_*`, `BUCKET_NAME`) — только для вашего upload-скрипта, **не** в git.

---

## 6. Кастомизация (white-label) — сначала сюда

**Правило:** меняйте **content + assets + CSS**, не лезьте в `CJMFlow` / API без нужды.

| Что | Куда |
|-----|------|
| Welcome: одно сообщение Виктории, headline, CTA, features | `src/content/b2cWelcomeCopy.ts` |
| Реплики Виктории по шагам CJM | `src/content/b2cCjmCoachCopy.ts` |
| Тексты шагов (активы, резерв, жизнь, риск, цели) | `src/content/b2c*StepCopy.ts` |
| Лого, аватар Виктории, hero дверей / step heroes | `src/content/b2cAssets.ts` + `src/assets/b2c/`, `src/assets/goals/` |
| Галерея целей | `src/utils/GoalImages.ts` + `src/assets/goals/` |
| Цвета, отступы, ultrawide, welcome/CJM layout | `src/styles/b2c-guest-plan.css` |
| Title / description / Telegram preview | `src/seo/pageSeo.ts` → `SEO.b2cPlan` **и** `scripts/copy-spa-fallbacks.mjs` (`ROUTE_META.plan`) + `scripts/plan-query-redirect.html` |
| Бренд в шапке | `B2cGuestPlanPage.tsx` («Family Office») + logo asset |
| Desktop result бренд | `B2cResultDashboard.tsx` |
| API / origin | `.env` |
| Default project_key | `src/api/projectKey.ts` |

### Welcome (актуально после редизайна)

- Layout: слева чат Виктории, справа hero с дверями (`welcome-doors-hero.webp`).
- На мобилке: **сначала чат**, ниже hero.
- Одно bubble-сообщение: `buildB2cWelcomeChatMessage()` в `b2cWelcomeCopy.ts` (не три отдельных).
- CTA сразу активен → `setView('cjm')` в `B2cGuestPlanPage`.

---

## 7. API surface (guest)

Публично (`x-project-key`):

| Method | Path |
|--------|------|
| `GET` | `/auth/client-referral/preview?ref=&project_key=` |
| `GET` | `/client/risk-profile/questionnaire-v2` |
| `POST` | `/client/risk-profile/evaluate` |
| `POST` | `/client/calculate` |

С `Authorization: Bearer {guest_token}`:

| Method | Path |
|--------|------|
| `GET` | `/my/plan/report/html` |
| `GET` | `/my/plan/report/pdf` |
| `GET` | `/my/plan/report/pdf-url` |

`POST /client/plan/save` на фронте **не используем** (save modal бьёт в `guestCalculate`).

Guest JWT ≠ agent JWT. Storage: `client_token` / guest session — см. `clientB2cAuth.ts`. Не затирать agent `localStorage.token`.

---

## 8. Smoke-чеклист

1. `/plan/` открывается (тёмный welcome).
2. `/?ref=…` редиректит на `/plan/?ref=…`.
3. Query `ref` + `project_key` сохраняются в sessionStorage.
4. Welcome: одно сообщение стримится; CTA «Открыть свой Family Office» ведёт в CJM.
5. Мобилка: Виктория сверху, hero снизу.
6. Шаги CJM проходятся; на риске — анкета; calculate с email + ref.
7. Desktop result: дашборд; есть структура портфеля / портфель пополнения / риск.
8. При `guest_token` — HTML/PDF отчёты.
9. Ultrawide (~21:9): контент CJM тянется к краям, не узкая колонка по центру.
10. Чужие lanes (`/sber`, agent LK) не ломались, если вы их не трогали.

---

## 9. Ограничения (честно)

- `CJMFlow.tsx` общий с agent-lane — толстый файл.
- Mobile result тянет `ResultPage` → часть agent LK в бандле (UI в guest скрыт).
- `AgentProfileProvider` в `main.tsx` оборачивает и `/plan` — для изоляции позже можно вынести `plan-main.tsx` (не в этом пакете).
- Метрика в `index.html` может быть зашита — замените на свою или уберите.

---

## 10. Как забрать код и пушить обратно

**Ветка:** `conomy` в репо `https://github.com/viss1913/PFP_FRONT_ver3`  
(база guest `/plan` + этот handoff kit).

### Доступ

1. Владелец репо добавляет вас **Collaborator** (Write) на GitHub → Settings → Collaborators.
2. Клонируете репо и переключаетесь на ветку:

```bash
git clone https://github.com/viss1913/PFP_FRONT_ver3.git
cd PFP_FRONT_ver3
git checkout conomy
git pull origin conomy
```

3. Кастомизируете whitelist (§6), свой `.env`, деплоите на **свой** домен/bucket.
4. Пушите **только в `conomy`** (не в `main` / `b2c_ref` / `finam`):

```bash
git add -A
git commit -m "feat(conomy): …"
git push origin conomy
```

PR в `main` не обязателен — достаточно пуша в `conomy`.  
Не коммитьте `.env`, ключи CDN и секреты.

### Cursor

Skill уже в репо: `.cursor/skills/b2c-plan-handoff/SKILL.md` — после клона подхватится сам.

### Вопросы по API

См. `FRONT_B2C_REFERRAL_MVP.md` / `api_docs/b2c_lk.yaml`.
