# API Specifications: Financial Goals JSON Response

Этот документ описывает структуру JSON-ответов для финансовых целей после унификации бэкенда.
Используется единый формат для отображения результатов расчета.

## Общая структура (Root output)

Для всех целей возвращается объект с полями:
```typescript
interface GoalCalculationResult {
  goal_id: number;
  goal_type_id: number; // 1, 2, 3, 4, 5, 7, 8
  goal_type: string; // 'PENSION', 'PASSIVE_INCOME', etc.
  summary: GoalSummary; // Основные цифры для карточки
  details: any; // Специфичные детали для модального окна
}
```

---

## 1. PENSION (Пенсия)
**ID:** `1`
**Логика:** Накопление + Госпенсия (ОПС + Страховая).

### Summary
```json
"summary": {
    "status": "OK" | "GAP",
    "target_amount_initial": 100000,
    "target_amount_future": 324000,
    "inflation_rate": 5.0,
    
    "initial_capital": 2000000, // Личные средства
    "initial_capital_ops": 500000, // ОПС (display only)
    
    "monthly_replenishment": 15000,
    "pension_gap_future": 200000,
    "target_months": 240, // Срок до пенсии
    
    "projected_capital_at_retirement": 25000000,
    "required_capital_at_retirement": 30000000,
    
    "total_tax_benefit": 450000,
    "total_cofinancing": 360000,
    
    "accumulation_yield_percent": 12.0,
    "payout_yield_percent": 10.0,
    
    "state_pension_monthly_future": 35000,
    "state_pension_monthly_today": 18000
}
```

### Details
```json
"details": {
    "state_pension": {
        "ipk_total": 206.58,
        "ipk_current": 50,
        "ipk_forecast": 156.58,
        "point_cost_today": 133.05,
        "point_cost_future": 429.1,
        "fixed_payment_today": 8134.88,
        "fixed_payment_future": 26235.8,
        "retirement_age": 65,
        "years_to_pension": 24
    },
    "portfolio_structure": { ... }
}
```

---

## 2. PASSIVE_INCOME (Пассивный доход / Рантье)
**ID:** `2`
**Логика:** Накопление капитала для получения ренты. Без Госпенсии.

### Summary
```json
"summary": {
    "status": "OK" | "GAP",
    "target_amount_initial": 50000, // Желаемый доход сейчас
    "target_amount_future": 85000, // Желаемый доход потом
    "projected_amount_future": 85000, // Сколько реально будет
    "inflation_rate": 5.0,
    
    "initial_capital": 5000000,
    "monthly_replenishment": 0,
    "target_months": 120, // Срок накопления
    
    "required_capital_at_end": 15000000, // Целевой капитал
    
    "total_tax_benefit": 0,
    "total_cofinancing": 0,
    
    "accumulation_yield_percent": 10.0,
    "payout_yield_percent": 10.0
}
```

---

## 3. INVESTMENT (Инвестиции / Капитал)
**ID:** `3`
**Логика:** Простое накопление ("Сколько будет?"). Нет фиксированной цели.

### Summary
```json
"summary": {
    "status": "OK", // Всегда OK
    "initial_capital": 100000,
    "monthly_replenishment": 10000,
    "target_months": 60,
    
    "projected_capital_at_end": 850000, // Результат накопления
    
    "total_tax_benefit": 52000,
    "total_cofinancing": 0,
    
    "accumulation_yield_percent": 12.0
}
```

---

## 4. OTHER (Крупная покупка / Образование)
**ID:** `4`
**Логика:** Накопление к конкретной сумме.

### Summary
```json
"summary": {
    "status": "OK" | "GAP",
    "target_amount_initial": 5000000,
    "target_amount_future": 6500000, // С инфляцией
    "inflation_rate": 5.0,
    
    "initial_capital": 1000000,
    "monthly_replenishment": 50000,
    "target_months": 60,
    
    "projected_capital_at_end": 6400000,
    
    "total_tax_benefit": 0,
    "total_cofinancing": 0,
    
    "accumulation_yield_percent": 11.0
}
```

---

## 5. LIFE (Страхование жизни)
**ID:** `5`
**Логика:** НСЖ/ИСЖ. Премии и Покрытие.

### Summary
```json
"summary": {
    "status": "OK",
    "target_coverage": 5000000, // Страховая сумма
    
    "initial_capital": 50000, // Первая премия
    "premium_frequency": "annual" | "monthly" | "once",
    
    "target_months": 120, // Срок полиса
    
    "expected_cash_value": 4800000, // Выкупная сумма (если есть)
    
    "investment_yield_percent": 5.0,
    "total_tax_benefit": 78000
}
```

### Details (Risks)
```json
"details": {
    "program_name": "Allianz Premium",
    "risks": [
        { "risk_name": "Уход из жизни", "limit_amount": 5000000 },
        { "risk_name": "Травма", "limit_amount": 2500000 }
    ]
}
```

---

## 7. FIN_RESERVE (Финансовый резерв)
**ID:** `7`
**Логика:** Накопление подушки безопасности (в месяцах).

### Summary
```json
"summary": {
    "status": "OK",
    "initial_capital": 300000,
    "monthly_replenishment": 10000,
    "target_months": 6, // На сколько месяцев резерв
    
    "projected_capital_at_end": 360000,
    
    "accumulation_yield_percent": 8.0, 
    "total_tax_benefit": 0
}
```

---

## 8. RENT (Рента / Рантье "здесь и сейчас")
**ID:** `8`
**Логика:** Вложил капитал -> Сразу получаешь доход. Без фазы накопления.

### Summary
```json
"summary": {
    "status": "OK",
    "initial_capital": 10000000,
    
    "projected_monthly_income": 100000, // Рента в месяц
    
    "payout_yield_percent": 12.0,
    "total_tax_benefit": 0
}
```
