# Git: ветка `partner-handoff` (read-only для партнёров)

**Аудитория:** команда BankFuture (настройка доступа).  
**Партнёрам отдавать:** [`README.md`](../README.md) + clone-команда ниже.

---

## Модель

| Ветка | Кто | Push |
|-------|-----|------|
| `main`, `finam`, `conomy`, … | BankFuture | Да |
| **`partner-handoff`** | Snapshot для партнёров | **Только BankFuture** |

Партнёр:
1. Клонирует **только** `partner-handoff` (`--single-branch`)
2. Удаляет `origin` или пушит в **свой** git
3. **Не имеет** write-доступа к нашему репо

---

## Что отдать партнёру (copy-paste)

```bash
git clone --branch partner-handoff --single-branch \
  https://github.com/viss1913/PFP_FRONT_ver3.git family-office-partner
```

ZIP: https://github.com/viss1913/PFP_FRONT_ver3/tree/partner-handoff → **Code → Download ZIP**

Дальше — [`README.md`](../README.md), [`.env.partner.example`](../.env.partner.example).

---

## Настройка GitHub (один раз)

### 1. Private repo + read-only для партнёра

**Вариант A — не добавлять в collaborators (проще всего)**

- Партнёру даёте **Personal Access Token (classic)** с scope **`repo` read-only**  
  или публичный mirror / архив ZIP.
- Без write-токена и без Collaborator push **физически невозможен**.

**Вариант B — Collaborator с Read (Organizations / Teams)**

GitHub → Repo → **Settings → Collaborators and teams**  
→ Add people → роль **Read** (не Write, не Maintain).

**Вариант C — отдельный mirror-репозиторий**

- `PFP_FRONT_partner_mirror` — только ветка `partner-handoff`
- CI sync из основного репо (см. §4)
- Партнёрам даёте доступ только к mirror (Read)

### 2. Branch protection (наш репо)

**Settings → Branches → Add rule**

| Branch | Protection |
|--------|------------|
| `main`, `finam`, `conomy` | Require PR, no force push |
| `partner-handoff` | Restrict who can push — **только ваша команда** |

Даже если партнёра ошибочно добавят с Write — rule на `partner-handoff` не даст пушить посторонним (Organization + team bypass).

### 3. Чего НЕ делать

- Не давать партнёрам **Write / Maintain / Admin**
- Не давать **Deploy key with write**
- Не просить пушить в `conomy` — устаревшая модель

---

## Как создать / обновить ветку `partner-handoff`

Выполняет **только BankFuture**, локально:

```bash
cd PFP_FRONT_ver3
git fetch origin

# База — актуальный conomy (или main, если договорились)
git checkout conomy
git pull origin conomy

# Создать или сбросить partner-handoff на текущий snapshot
git checkout -B partner-handoff

# Убедиться: README, AGENTS.md, docs/PARTNER_*, .env.partner.example на месте
git status

git push -u origin partner-handoff --force-with-lease
```

`--force-with-lease` — когда ветка уже существует и вы **перезаписываете** snapshot новой версией handoff.  
Партнёры подтягивают через `git fetch upstream` (см. README).

### Что должно быть в snapshot

- [ ] `README.md`, `AGENTS.md`
- [ ] `docs/PARTNER_AI_ONBOARDING.md`, `PARTNER_PROJECT_KEY_SETUP.md`, `B2C_PLAN_HANDOFF.md`
- [ ] `.env.partner.example`
- [ ] `.cursor/agents/`, `.cursor/skills/partner-repo/`, `.cursor/rules/repo-architecture.mdc`
- [ ] Рабочий `/plan` lane + `npm run build` проходит

### Чего нет в handoff (можно не включать)

- Внутренние `.cursor/plans/`, `REPORT_*` для teamlead
- Секреты, `.env`, deploy credentials

---

## CI sync (опционально)

Пример: при push в `conomy` обновлять `partner-handoff` автоматически.

```yaml
# .github/workflows/sync-partner-handoff.yml
name: Sync partner-handoff
on:
  workflow_dispatch:
  push:
    branches: [conomy]
    paths:
      - 'src/**'
      - 'docs/PARTNER_*'
      - 'docs/B2C_PLAN_HANDOFF.md'
      - 'AGENTS.md'
      - 'README.md'
      - '.env.partner.example'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git checkout -B partner-handoff
          git push origin partner-handoff --force-with-lease
```

Ручной `workflow_dispatch` безопаснее для первых разов.

---

## Чеклист перед выдачей партнёру

- [ ] Ветка `partner-handoff` запушена на GitHub
- [ ] Партнёру выдан `project_key`, `project_id`
- [ ] Backend добавил **CORS** для домена партнёра
- [ ] Партнёр **не** в collaborators с Write (или только Read)
- [ ] Отправлен clone + [`PARTNER_PROJECT_KEY_SETUP.md`](./PARTNER_PROJECT_KEY_SETUP.md)

---

## FAQ

**Партнёр просит push access?**  
Нет. Свой fork / свой gitlab. Обновления — pull из `partner-handoff` или ZIP.

**Партнёр форкнул весь репо?**  
Ок, но `--single-branch` при clone уменьшает шум. Fork даёт им push только в **свой** fork.

**Как отозвать доступ?**  
Remove collaborator / revoke PAT. Snapshot у них локально остаётся — это нормально.

**conomy vs partner-handoff?**  
`conomy` — наша рабочая ветка. `partner-handoff` — стабильный read-only снимок для внешних.
