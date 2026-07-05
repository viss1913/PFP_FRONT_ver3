# Матрица доходности фазы выплат (`passive_income_yield`)

Обновление для админки НПФ / настроек проекта (Ростех и др.).

## API

| Метод | Путь |
|-------|------|
| GET | `/api/pfp/settings/passive-income/yield` |
| PUT | `/api/pfp/settings/passive-income/yield` (admin) |

Спека: `agent_lk.yaml`, схема `PassiveIncomeYieldLine` в `OPENAPI_SPEC.yaml`.

## Что изменилось

Раньше матрица была только **срок × капитал**. Теперь одна таблица на всё:

| Поле | Смысл |
|------|--------|
| `min_term_months` / `max_term_months` | Срок до пенсии (мес.) |
| `min_amount` / `max_amount` | Капитал (₽) |
| `gender` | `male` / `female` / `null` — опционально |
| `age` | Возраст **на момент наступления цели** (лет) — опционально |
| `yield_percent` | Годовая доходность % для фазы выплат |

Строки **без** `gender` и `age` — универсальные (цель «Пассивный доход», fallback для пенсии).

## UI админки

На экране «Доходность пассивного дохода» добавить **две колонки** в таблицу линий:

- **Пол** — select: пусто / male / female
- **Возраст на цели** — число (обычно 60, 65 и промежуточные для справочника НПФ)

PUT по-прежнему шлёт **весь** массив `lines` (полная замена).

Пример строки:

```json
{
  "min_term_months": 0,
  "max_term_months": 360,
  "min_amount": 0,
  "max_amount": 10000000,
  "gender": "female",
  "age": 60,
  "yield_percent": 3.4
}
```

## Как бэкенд выбирает строку для PENSION

Клиенту **не нужно** передавать возраст для lookup — бэкенд считает сам:

1. Текущий возраст клиента (`birth_date`)
2. + лет до пенсии (`years_to_pension`)
3. = **`age_at_goal`**

Для госпенсии срок до цели = до выхода на пенсию: **мужчина 65**, **женщина 60**.

Пример: женщина 45 лет, до пенсии 15 лет → lookup по `gender=female`, `age=60`.

## Поля в ответе расчёта цели PENSION

В `goals[].summary`:

| Поле | Описание |
|------|----------|
| `payout_yield_percent` | % по матрице на момент выплат (капитал после симуляции) |
| `payout_yield_percent_planning` | % на этапе планирования (начальный капитал) |
| `payout_age_at_goal` | Возраст, по которому искали строку |
| `payout_coefficient_gender` | Пол из выбранной строки |
| `payout_coefficient_age` | Возраст из выбранной строки |
| `payout_coefficient_value` | `yield_percent` выбранной строки |

В `details.state_pension`: `age_at_goal`, `retirement_age`, `years_to_pension`.

## Деплой

Бэкенд: `https://pfp-api.bank-future.com/api` (Immers, ветка `finam`).
