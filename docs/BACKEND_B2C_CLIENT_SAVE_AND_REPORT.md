# B2C referral — задача для бэкенда: сохранение клиента в CRM агента + HTML-отчёт

**Для:** Immers / backend `finam`  
**API:** `https://pfp-api.bank-future.com/api`  
**Фронт (готово на prod):** `https://family-office.bank-future.com/plan`  
**Спеки:** `api_docs/b2c_lk.yaml`, `api_docs/agent_lk.yaml`, `api_docs/getReport.yaml`, `api_docs/pfpB2C.yaml`

---

## Контекст

Клиент приходит по ссылке агента (`?ref=…&project_key=…`), проходит guest CJM **без логина**, получает расчёт через stateless `POST /client/calculate`, затем регистрируется по email и сохраняет план.

**Ожидание продукта (согласовано с фронтом):**

1. После регистрации клиент **появляется в CRM агента** (`GET /pfp/clients`) — как после агентского `POST /client/first-run`.
2. После `POST /my/plan/first-run` клиент может открыть **HTML-отчёт** (`GET /my/plan/report/html`).
3. Агент в своём ЛК видит того же клиента с планом и может открыть отчёт как обычно (`GET /api/pfp/reports/:clientId/...`).

---

## Почему сейчас нет `client_id` на экране результата (до регистрации)


| Шаг                              | Создаётся клиент в БД?       | `client_id` в ответе?                                |
| -------------------------------- | ---------------------------- | ---------------------------------------------------- |
| `POST /client/calculate` (guest) | **Нет** (stateless)          | **Нет** — это норма                                  |
| `POST /auth/verify-code`         | **Да**                       | `user.clientId` в JWT / `AuthResponse`               |
| `POST /my/plan/first-run`        | План привязывается к клиенту | Желательно `client_id` в корне ответа (как у агента) |


Фронт **не** ждёт `client_id` от guest calculate. Отчёт до регистрации недоступен по дизайну.

---

## Целевой флоу (end-to-end)

```
Агент: GET /pfp/agents/me/client-invite-link
  → клиент: /plan?ref={slug}&project_key={pk}

Guest CJM:
  GET  /client/risk-profile/questionnaire-v2   (x-project-key)
  POST /client/risk-profile/evaluate
  POST /client/calculate                     (только goals + slim client)

Регистрация:
  POST /auth/register-client   { email, name, project_key, ref, utm_* }
  POST /auth/verify-code       { email, code, password }  → JWT (role=client, clientId в токене)

Сохранение плана:
  POST /my/plan/first-run      { goals, client }  (Bearer client JWT)

Отчёт (клиент):
  GET  /my/plan/report/html    (Bearer client JWT)

CRM агента:
  GET  /pfp/clients            (Bearer agent JWT) — клиент в списке
  GET  /pfp/reports/:clientId/html — отчёт агентом
```

---

## Блок 1. Привязка клиента к агенту (CRM)

### Требование

При регистрации по client-invite-link клиент должен сохраняться **у пригласившего агента**, аналогично ручному first-run в агентском ЛК.

### Контракт (уже в спеке — нужна рабочая реализация на prod)

`**POST /auth/register-client`**

- Обязательно принимать `ref` (referral_slug из invite-link).
- Сохранять атрибуцию до верификации (payload верификации / pending registration).

`**POST /auth/verify-code`**

- При создании записи `clients`:
  - `clients.agent_id` = агент из `ref`
  - `clients.referred_by_agent_id` = тот же агент (или по вашей модели)
  - `project_id` из `project_key`
  - email / name из регистрации
- **Не** принимать `agent_id` из `POST /my/plan/first-run` (защита от подмены — уже в спеке).

### Acceptance criteria

- Клиент зарегистрировался по ссылке с `ref` агента A.
- `GET /pfp/clients` под JWT агента A возвращает этого клиента.
- `GET /pfp/clients` под JWT агента B **не** возвращает этого клиента.
- В карточке клиента заполнены: email, имя, `agent_id`, дата создания.
- Битый/пустой `ref` → `400` на register (или явная ошибка; preview уже отдаёт 400).

### Smoke

```http
POST /api/auth/register-client
x-project-key: pk_...
{
  "email": "test+b2c@example.com",
  "name": "Иван Тестов",
  "project_key": "pk_...",
  "ref": "{referral_slug_агента}"
}
→ 200, код на email

POST /api/auth/verify-code
{ "email": "...", "code": "123456", "password": "secret12" }
→ 201, { token, user: { role: "client", clientId: N, ... } }
```

Проверить в БД: `clients.id = N`, `clients.agent_id = {agent из ref}`.

---

## Блок 2. `POST /my/plan/first-run` — план как у агента

### Требование

После first-run у клиента в БД должно быть **то же по смыслу**, что после агентского `POST /client/first-run`:

- цели (`goals`) сохранены;
- снимок расчёта `goals_summary` заполнен (для CRM, отчётов, `last_rebalance_at`);
- ответы риск-анкеты (`risk_profile_answers`, `risk_questionnaire_version_id`) — если переданы в `client`;
- клиент может пересчитывать цели через `/my/plan/{goalId}/recalculate`.

### Тело запроса (что шлёт фронт сейчас)

Схема `**CalculationRequest`** (`goals` + slim `client`), **не** `FullClientRequest`:

```json
{
  "goals": [
    {
      "goal_type_id": 1,
      "name": "Достойная пенсия",
      "target_amount": 150000,
      "term_months": 240,
      "risk_profile": "BALANCED",
      "risk_profile_extended": "MODERATELY_CONSERVATIVE",
      "desired_monthly_income": 150000,
      "inflation_rate": 10
    }
  ],
  "client": {
    "birth_date": "1985-06-15",
    "sex": "male",
    "fio": "Иван Иванов",
    "avg_monthly_income": 200000,
    "risk_profile_answers": { "q1": "...", "q2": "..." },
    "risk_questionnaire_version_id": 2,
    "family_profile": {
      "marital_status": "married",
      "children": [{ "first_name": "Аня", "birth_date": "2015-03-01" }]
    }
  }
}
```

**Важно:** фронт **не** шлёт на guest calculate / first-run:

- корневые `assets`, `liabilities`, `expenses`;
- `client.first_name` / `last_name` / `gender` / `external_uuid`;
- `client.family_profile.credits`.

Если для полной карточки в CRM нужны активы/кредиты — либо бэк выводит их из goals (`initial_capital`), либо отдельно расширяем контракт (обсудить).

### Ответ first-run (желательно унифицировать с агентом)

Фронт ожидает структуру как после расчёта / агентского first-run:

```json
{
  "client_id": 12345,
  "summary": { "goals_count": 4, "total_capital": 91300000, ... },
  "goals": [ ... ]
}
```

Минимум: `**client_id` в корне** + те же `summary` / `goals`, что отдаёт calculate, чтобы UI результата обновился без второго запроса.

### Acceptance criteria

- `POST /my/plan/first-run` с валидным client JWT → `200`.
- В БД у клиента заполнен `goals_summary` (не null).
- `GET /my/plan` под client JWT возвращает сохранённый план.
- `GET /pfp/clients/{id}` под agent JWT показывает `goals_summary`, `last_rebalance_at`.
- Повторный first-run — задокументированное поведение (update vs 409).

### Smoke

```http
POST /api/my/plan/first-run
Authorization: Bearer {client_token}
x-project-key: pk_...
{ ...payload как выше... }
→ 200, client_id + goals + summary
```

---

## Блок 3. HTML-отчёт для клиента

### Требование

После успешного first-run:

```http
GET /api/my/plan/report/html
Authorization: Bearer {client_token}
x-project-key: pk_...   (если требуется по проекту)
```

→ `200` с телом:

```json
{
  "html": "<!DOCTYPE html>...",
  "pages": ["...", "..."],
  "toc": [...],
  "generated_at": "..."
}
```

Фронт открывает `html` (или склеивает `pages`) в новой вкладке.

### Зависимости

Отчёт **не сгенерируется**, если:

- нет `clientId` в JWT (`400`);
- клиент не прошёл first-run / пустой `goals_summary` (`404` или `500` — лучше явный `404` «план не найден»);
- не задеплоен эндпоинт на prod (сейчас возможен 404 на уровне роутера).

### Acceptance criteria

- После first-run `GET /my/plan/report/html` → `200`, непустой `html` или `pages`.
- До first-run → `404` с понятным message.
- Тот же отчёт доступен агенту: `GET /pfp/reports/{clientId}/html` (или агрегация через toc — как в агентском ЛК).

### Опционально (nice to have)

- Query-параметры `includeCover`, `includeSummary`, `goalTypes` — как в `getReport.yaml`.
- `GET /my/plan/report` (JSON для графиков) — если нужен rich preview на фронте позже.

---

## Блок 4. JWT и роли

### `POST /auth/verify-code` → `AuthResponse`

```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "email": "client@example.com",
    "name": "Иван Иванов",
    "role": "client",
    "clientId": 12345,
    "projectId": 1
  }
}
```

### Требования к JWT

- `role === "client"`.
- В payload есть `clientId` (или `client_id` — **зафиксировать одно имя** в спеке и JWT).
- Токен валиден для `/my/plan/`*, `/my/risk-profile/`*, `/my/plan/report/html`.
- Токен **не** даёт доступ к `/pfp/clients` (агентские ручки).

Фронт хранит client JWT отдельно: `localStorage.client_token` (не перетирает agent `token`).

---

## Блок 5. Расхождения guest calculate vs agent first-run (на будущее)


| Поле                    | Agent `POST /client/first-run` | B2C guest + `my/plan/first-run` |
| ----------------------- | ------------------------------ | ------------------------------- |
| `assets[]`              | Да                             | **Нет** (фронт не шлёт)         |
| `liabilities` / credits | Да                             | **Нет**                         |
| `goals[]`               | Да                             | Да                              |
| slim `client`           | Да                             | Да                              |
| Создание клиента        | В first-run                    | В verify-code                   |
| Привязка к агенту       | `agent_id` из JWT агента       | `agent_id` из `ref` при verify  |


**Рекомендация бэку:** `my/plan/first-run` внутри вызывает тот же сервис расчёта/сохранения, что агентский first-run, но client уже существует и `agent_id` уже проставлен.

---

## Чеклист приёмки (prod)

1. [ ] Guest calculate без JWT → `200`, без `client_id`.
2. [ ] Register + verify с `ref` → клиент в CRM агента.
3. [ ] First-run → `goals_summary` заполнен.
4. [ ] Client: `GET /my/plan/report/html` → HTML.
5. [ ] Agent: клиент в `GET /pfp/clients`, отчёт по `clientId` открывается.
6. [ ] Регистрация **без** `ref` (если разрешена) — поведение задокументировано (orphan client / default agent).

---

## Контакты / если контракт меняется

Фронт: репозиторий `PFP_FRONT_ver3`, ветка `finam`, файлы:

- `src/api/b2cApi.ts` — register, verify, first-run, report/html
- `src/utils/b2cGuestCalculatePayload.ts` — payload calculate/first-run
- `src/components/b2c/B2cClientRegisterModal.tsx` — UI регистрации

При изменении схемы — обновить `api_docs/b2c_lk.yaml` и кинуть пример request/response в чат фронта.

---

## Приоритет задач (для спринта)


| P      | Задача                                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| **P0** | `verify-code` + `ref` → `clients.agent_id`                                           |
| **P0** | `my/plan/first-run` сохраняет goals + `goals_summary`                                |
| **P0** | `GET /my/plan/report/html` на prod после first-run                                   |
| **P1** | `first-run` response с `client_id` в корне                                           |
| **P1** | Агентский отчёт `/pfp/reports/:id` для B2C-клиента                                   |
| **P2** | Email агенту «клиент зарегистрировался»                                              |
| **P2** | Расширить first-run телом `assets`/`credits` если нужна 1:1 карточка с агентским CJM |


