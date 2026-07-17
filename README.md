# Family Office PFP — Frontend (partner handoff)

React + TypeScript + Vite SPA для guest Family Office (`/plan`) и связанных lanes.

**Это read-only snapshot для партнёров.**  
Работаете **у себя** (свой git, свой CDN). В наш репозиторий **ничего не пушите**.

| | |
|---|---|
| **API** | `https://pfp-api.bank-future.com/api` (общий сервер BankFuture) |
| **Ваш tenant** | `VITE_PARTNER_PROJECT_KEY` — выдаёт BankFuture |
| **Handoff-ветка** | `partner-handoff` |

---

## Быстрый старт

### 1. Скачать только handoff-ветку

```bash
git clone --branch partner-handoff --single-branch \
  https://github.com/viss1913/PFP_FRONT_ver3.git family-office-partner

cd family-office-partner
```

Без git — на GitHub: **Code → Download ZIP** (ветка `partner-handoff`).

### 2. Свой git (рекомендуется)

```bash
cd family-office-partner
git remote remove origin
git remote add origin https://github.com/YOUR-ORG/your-family-office.git
git push -u origin partner-handoff
```

Дальше все коммиты — **только в ваш репозиторий**.

### 3. Env

```bash
cp .env.partner.example .env
```

```env
VITE_SITE_URL=https://your-domain.com
VITE_API_BASE_URL=https://pfp-api.bank-future.com/api
VITE_PARTNER_PROJECT_KEY=pk_…          # от BankFuture
VITE_PARTNER_PROJECT_ID=42             # от BankFuture
```

### 4. Сборка и деплой

```bash
npm install
npm run build
# dist/ → ваш CDN / S3 / хостинг
```

Smoke: `https://your-domain.com/plan/?ref=TEST` (если key в env — `project_key` в URL не нужен).

---

## Документация для ИИ (Cursor)

| Документ | Зачем |
|----------|--------|
| [`AGENTS.md`](AGENTS.md) | **Старт для Cursor** — lanes, API, agents |
| [`docs/PARTNER_AI_ONBOARDING.md`](docs/PARTNER_AI_ONBOARDING.md) | Runbook партнёра |
| [`docs/PARTNER_PROJECT_KEY_SETUP.md`](docs/PARTNER_PROJECT_KEY_SETUP.md) | Свой `project_key` → наш API, CORS |
| [`docs/B2C_PLAN_HANDOFF.md`](docs/B2C_PLAN_HANDOFF.md) | White-label `/plan` — файлы, чеклист |
| [`.env.partner.example`](.env.partner.example) | Шаблон env |

Cursor подхватит `.cursor/agents/`, `.cursor/skills/`, `.cursor/rules/` автоматически.

---

## Архитектура (коротко)

```
your-domain.com/plan/     →  ваш CDN (этот фронт)
         │
         ▼  X-Project-Key: pk_yours
pfp-api.bank-future.com   →  наш API (общий)
```

| Lane | URL | Обычно нужен партнёру? |
|------|-----|-------------------------|
| B2C guest | `/plan` | **Да** |
| Landing | `/` | Опционально |
| Agent LK | после login | Если своя сеть агентов |
| Sber / ATB | `/sber`, `/atb_*` | Нет (внутренние lanes BankFuture) |

---

## Что запросить у BankFuture

1. `project_key` + `project_id`
2. **CORS whitelist** вашего домена (`https://your-domain.com`)
3. Агенты в вашем tenant (для `ref` в ссылках)
4. [Опционально] AI B2C flows для orchestrator на `/plan`

---

## Запреты

- **Не пушить** в `github.com/viss1913/PFP_FRONT_ver3` — доступ только на чтение
- **Не коммитить** `.env` с ключами
- Guest JWT (`client_token`) ≠ agent JWT — не затирать

---

## Обновления от BankFuture

Когда выходит новая версия handoff:

```bash
git remote add upstream https://github.com/viss1913/PFP_FRONT_ver3.git
git fetch upstream partner-handoff
git merge upstream/partner-handoff
# или cherry-pick нужных коммитов в свой репо
```

Либо снова `--single-branch` clone в чистую папку и перенос своих `content/` / CSS.

---

## Связь

| Вопрос | Куда |
|--------|------|
| Tenant, CORS, API | Backend BankFuture |
| Баг handoff / обновление ветки | Команда BankFuture frontend |

Внутренняя инструкция по ветке (для BankFuture): [`docs/PARTNER_GIT_ACCESS.md`](docs/PARTNER_GIT_ACCESS.md)
