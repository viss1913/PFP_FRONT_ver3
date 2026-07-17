# B2C `/plan`: session context агента (ref) и переменные промптов

**Дата:** 2026-07-12  
**Ветка:** `conomy`  
**Связано:** оркестратор `POST /my/ai-b2c/chat/dynamic/stream`, flow `plan`

---

## 1. Зачем

Referral-ссылки агента:

```text
https://family-office.bank-future.com/plan/?ref=ab2def5798ae
```

Фронт уже знает пригласившего (preview API: `first_name`, `last_name`, `display_name`).  
Нужно, чтобы **ИИ-оркестратор** (1-й и 2-й LLM) мог использовать **Имя + Фамилию** агента:

- на стадии `/welcome` (приветствие),
- и **в любом** промпте flow (global / brain / command), без копипасты ФИО в ЛК.

---

## 2. Подход

| Слой | Решение |
|------|---------|
| Источник FIO на front | `GET` client referral preview по `ref` |
| Передача | поле **`session_context`** в **каждом** turn (не `page_data`) |
| Промпты в ЛК | плейсхолдеры `{{agent_full_name}}` и др. |
| Подстановка | **бэк** перед LLM (router + answer + brain) |
| Trust | prod: бэк резолвит agent по `ref`/guest session; front — cache/fallback |

---

## 3. Контракт turn body

Схема: `api_docs/aiB2c.yaml` → `AiB2cOrchestratorTurn.session_context`.

```json
{
  "flow_key": "plan",
  "message": "Хочу составить персональный финансовый план",
  "page": "/welcome",
  "session_context": {
    "ref": "ab2def5798ae",
    "agent": {
      "id": 123,
      "first_name": "Иван",
      "last_name": "Петров",
      "full_name": "Иван Петров",
      "display_name": "Иван Петров"
    }
  }
}
```

Без валидного `ref` / preview: `agent: null` или поле agent не заполнять.

Front (уже): `src/utils/b2cPlanSessionContext.ts`, hook `useB2cPlanOrchestrator` мержит context в каждый stream.

---

## 4. Переменные для подстановки на бэке

| Placeholder | Источник |
|-------------|----------|
| `{{agent_full_name}}` | `session_context.agent.full_name` или server resolve |
| `{{agent_first_name}}` | first_name |
| `{{agent_last_name}}` | last_name |
| `{{agent_display_name}}` | display_name |
| `{{ref}}` | ref slug (опционально) |
| `{{assistant_name}}` | settings flow `display_name` (опционально) |

**Где replace:** `dynamic_context_text`, `command_context_text`, stage `content`, brain `content`.  
Пустые значения → `""`; промпт не должен падать; модель не должна выдумывать ФИО.

---

## 5. Примеры промптов в ЛК (контент)

### Global `dynamic_context_text` (фрагмент)

```text
Клиента пригласил агент {{agent_full_name}}.
Он будет консультантом после сохранения плана.
Если {{agent_full_name}} пустой — не упоминай конкретного агента.
```

### Stage `/welcome` — `content` (2-й ИИ)

```text
Поприветствуй клиента. Если известен {{agent_full_name}} — кратко упомяни, что он пригласил клиента.
Предложи начать персональный финансовый план.
```

**Не** вписывать реальные ФИО в админку — только плейсхолдеры.

---

## 6. `/welcome` vs `/start`

| stage_key | UI |
|-----------|-----|
| `/start` | welcome screen |
| `/welcome` | тот же welcome (alias в `b2cPlanStageRegistry`) |

Default initial stage на front пока `/start`. В seed flow `plan` можно завести `/welcome` — registry покроет оба.

---

## 7. Handoff бэкенду (чеклист)

1. Принять `session_context` в `AiB2cOrchestratorTurn` (unknown fields ignore = ok).
2. **Предпочтительно:** resolve agent server-side по `ref` / guest token; front — fallback.
3. Replace `{{agent_*}}` (и др.) **перед** вызовом 1-го и 2-го LLM.
4. Smoke:
   - turn с agent → ответ/роутер видит ФИО;
   - без agent → нет галлюцинаций имени.

---

## 8. Front files

| Path | Роль |
|------|------|
| `src/types/b2cOrchestrator.ts` | types |
| `src/utils/b2cPlanSessionContext.ts` | build from preview |
| `src/hooks/useB2cPlanOrchestrator.ts` | inject every turn |
| `src/components/b2c/B2cPlanOrchestratorFlow.tsx` | prop sessionContext |
| `src/pages/b2c/B2cGuestPlanPage.tsx` | preview → context |
| `src/config/b2cPlanStageRegistry.ts` | `/welcome` alias |
