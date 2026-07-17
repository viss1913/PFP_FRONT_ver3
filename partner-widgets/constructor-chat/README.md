# Constructor site-chat (Ростех / НПФ)

Статический виджет чата для партнёров. API: `POST /api/pfp/constructor/site-chat/stream`.

**Не путать** с AI B2C (админка) и с `/plan` (B2C guest flow).

| Lane | URL | Demo | Env key |
|------|-----|------|---------|
| НПФ Рени | `/npf` | `src/demo-npf.html` | `RENESSANS_PROJECT_KEY` |
| Ростех | `/rostech` | `src/demo-rostech.html` | `ROSTECH_PROJECT_KEY` |

Сборка: `npm run build:partner-widgets` (также в общем `npm run build`).
Источник: репо `frontRostech`, ветка `AI_NPF_Rostech`.
