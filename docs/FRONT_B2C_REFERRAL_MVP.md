# Family Office B2C — handoff для фронта (referral MVP)

**Бэкенд:** Immers, ветка `finam`  
**Base URL API:** `https://pfp-api.bank-future.com/api`  
**Prod:** `https://family-office.bank-future.com/plan`

Спеки: [`api_docs/b2c_lk.yaml`](../api_docs/b2c_lk.yaml)

**Передача агентам (свой контур, кастомизация `/plan`):** ветка [`conomy`](https://github.com/viss1913/PFP_FRONT_ver3/tree/conomy) — см. [`B2C_PLAN_HANDOFF.md`](./B2C_PLAN_HANDOFF.md) и Cursor skill [`.cursor/skills/b2c-plan-handoff/SKILL.md`](../.cursor/skills/b2c-plan-handoff/SKILL.md). Пуш обратно в `conomy` ок.

---

## Целевой флоу

```
Агент: client-invite-link → /plan?ref=&project_key=

Guest CJM → POST /client/calculate
  тело: ref + goals + client (email, assets / total_liquid_capital, …)
  ответ: расчёт + client_id + guest_token + plan_saved (если email + ref)

Отчёты (guest JWT, 30 дней):
  Authorization: Bearer {guest_token}
  GET /my/plan/report/html
  GET /my/plan/report/pdf
  GET /my/plan/report/pdf-url

Опционально: register-client → verify-code (claim лида по email)
```

`POST /client/plan/save` — дубль calculate, на фронте не используем.

---

## Payload calculate (guest)

```json
{
  "ref": "ab2def5798ae",
  "goals": [ ... ],
  "client": {
    "email": "client@mail.ru",
    "name": "Иван",
    "birth_date": "1985-06-15",
    "sex": "male",
    "avg_monthly_income": 150000,
    "total_liquid_capital": 500000,
    "assets": [
      { "type": "CASH", "current_value": 500000, "unlock_month": 0 }
    ]
  },
  "assets": [
    { "type": "CASH", "current_value": 500000, "unlock_month": 0 }
  ]
}
```

Без `client.assets` / `total_liquid_capital` пул = 0, смарт-аллокация не работает.

---

## Фронт — чеклист

- [x] `ref` из sessionStorage в calculate
- [x] `client.assets` + `client.total_liquid_capital` в calculate
- [x] `guest_token` + `client_id` из ответа → localStorage
- [x] Отчёт HTML через guest JWT
- [x] Email в анкете (шаг 1, обязателен)
- [x] Отчёт HTML + PDF через guest JWT
- [ ] register-client → verify-code (опционально)

---

## Файлы

| Что | Путь |
|-----|------|
| Сборка payload | `src/utils/b2cGuestCalculatePayload.ts` |
| CJM calculate | `src/components/CJMFlow.tsx` |
| Страница | `src/pages/b2c/B2cGuestPlanPage.tsx` |
| Email save | `src/components/b2c/B2cClientPlanSaveModal.tsx` |
