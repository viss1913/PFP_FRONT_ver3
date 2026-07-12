# Сообщение фронту (копипаст) — админка B2C site

---

Привет!

Нужен **отдельный раздел в ЛК агента** — настройка **B2C site-оркестратора** (не chat_AI, не constructor).

**ТЗ:** `docs/AI_B2C_SITE_ADMIN_FRONTEND_TASK.md`  
**Спеки:** `api_docs/agent_lk.yaml`, `api_docs/aiB2c.yaml`

### Суть

На проект несколько **flows** (`default`, `plan`). Для `/plan` — flow **`plan`**.

В разделе:
1. **Селектор flow** + создание (`GET/POST /api/pfp/ai-b2c/flows`)
2. **Settings** flow: имя, аватар, `dynamic_context_text` (`GET/PUT /api/pfp/ai-b2c/settings?flow_key=`)
3. **Brain-contexts** (`/api/pfp/ai-b2c/brain-contexts?flow_key=`)
4. **Команды / stages** — главное:
   - `stage_key` = route/команда (`/vybor_celi2`)
   - `content` = промпт **2-го ИИ** (ответ клиенту) — **обязателен**
   - `command_context_text` = промпт **1-го ИИ** (роутер); пусто → из `dynamic_context_text`

В списке команд показывать: **stage_key**, превью обоих промптов, есть ли свой роутер или глобальный.

Все GET/POST stages и settings — с **`flow_key`** в query или body.

Test API: `https://pfp-api.bank-future.com/api`

Клиентский `/plan` и SSE — **не в этом таске**, только админка.

---
