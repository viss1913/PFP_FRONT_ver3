# Статус для тимлида: B2C site-оркестратор + session context агента

**Дата:** 2026-07-12  
**Ветка:** `conomy` (локально, **push/deploy не делали**)  
**API test:** `https://pfp-api.bank-future.com/api`

---

## 1. Задача (зачем)

### 1.1. Site-оркестратор (уже в работе)

- В ЛК агента — настройка **B2C site** (flows `default` / `plan`, settings, brain, команды с двумя промптами).
- На guest `/plan` — **двухшаговый оркестратор** (router + ответ в чат) за feature flag, `flow_key=plan`.

### 1.2. Referral + имя агента (новый кусок)

Ссылки агента:

```text
https://family-office.bank-future.com/plan/?ref=ab2def5798ae
```

- UI уже знает пригласившего (preview API).
- Нужно, чтобы **ИИ** (не только шапка «Вас пригласил…») использовал **Имя + Фамилию** агента:
  - на `/welcome`,
  - и **универсально** по всему flow через переменные в промптах (`{{agent_full_name}}`), без копипасты ФИО в админке.

---

## 2. Что сделано

### 2.1. Коммиты (локально на `conomy`)

| Коммит | Суть |
|--------|------|
| `47928a3` | **feat(lk):** админка B2C site — flows, dual prompts, preview/badge, валидация `content` |
| `d470231` | **feat(b2c):** orchestrator `/plan` (SSE, flag, registry, UI events) |
| *(новый, session context)* | **feat(b2c):** `session_context` (agent FIO) на каждый turn + alias `/welcome` + docs |

Подробный отчёт по A/B: [`docs/REPORT_B2C_SITE_SYNC_2026-07-12.md`](./REPORT_B2C_SITE_SYNC_2026-07-12.md)

### 2.2. Session context (текущий инкремент)

| Что | Детали |
|-----|--------|
| Контракт | `session_context: { ref, agent: { id, first_name, last_name, full_name, … } }` в body `dynamic/stream` |
| Front | FIO только из referral preview; шлётся на **каждый** turn (чат + UI events) |
| Registry | `/welcome` = тот же welcome UI, что `/start` |
| Docs | [`docs/B2C_PLAN_SESSION_CONTEXT.md`](./B2C_PLAN_SESSION_CONTEXT.md) — vars + примеры промптов + **handoff бэку** |
| Flag | оркестратор **off** по умолчанию; тест: `?orchestrator=1` |

### 2.3. Проверки

- `tsc -b` — зелёный (после session context — перепроверить).
- Полный browser smoke / deploy — **ещё нет**.

### 2.4. Прод Yandex

- Бакет **≠** git HEAD (разные hash бандла). Baseline deploy не делали; следующий deploy перезапишет.

---

## 3. Что нужно от бэка / решение

1. Принять `session_context` в turn (можно ignore unknown fields).
2. **Желательно:** resolve agent **server-side** по `ref` / guest session (front — fallback).
3. **Обязательно для эффекта в чате:** replace плейсхолдеров **перед LLM**:
   - `{{agent_full_name}}`, `{{agent_first_name}}`, `{{agent_last_name}}`, …
   - в `dynamic_context_text`, `command_context_text`, stage `content`, brain.
4. Smoke: с ref → имя в ответе; без ref → без выдуманного ФИО.

Без п.3 фронт шлёт context, но **2-й ИИ имени не увидит**.

---

## 4. Риски

| Риск | Комментарий |
|------|-------------|
| Бэк без vars | LLM не использует агента, UI header — да |
| `/start` vs `/welcome` в seed ЛК | Front alias оба → welcome; согласовать seed |
| Client-supplied FIO | Только preview; trust в prod = бэк по `ref` |
| Прод-бакет drift | Deploy осознанно, после smoke |

---

## 5. Next steps

1. Smoke: `/plan/?orchestrator=1&ref=…` → в Network body есть `session_context.agent.full_name`.
2. Бэк: vars + (опц.) server resolve.
3. Контент в ЛК: шаблоны с `{{agent_*}}` в global + `/welcome`.
4. `git push origin conomy` → review.
5. `deploy:yandex` (отдельным решением; proxy env на машине dev сбрасывать).

---

## 6. TL;DR (1 абзац)

Сделали админку site-оркестратора и client `/plan` orchestrator (flag). Дальше: **прокидываем агента из `?ref=` в `session_context` на каждый turn** и alias `/welcome`; чтобы ИИ реально говорил ФИО, **бэку нужна подстановка `{{agent_*}}` в промптах** (идеально + resolve по ref). Push/deploy не делали. Доки: `REPORT_B2C_SITE_SYNC_2026-07-12.md`, `B2C_PLAN_SESSION_CONTEXT.md`.

---

## 7. Ссылки в репо

- Админка ТЗ: `docs/AI_B2C_SITE_ADMIN_FRONTEND_TASK.md`
- Orchestrator ТЗ: `docs/B2C_PLAN_ORCHESTRATOR_FRONTEND_TASK.md`
- Session context: `docs/B2C_PLAN_SESSION_CONTEXT.md`
- Контракт SSE: `api_docs/b2c_plan_orchestrator_frontend.md`
