---
name: pdf-report-settings-lk
description: Настройки PDF-отчёта в личном кабинете агента — обложка, сводная информация, страницы целей report_fin_reserve report_life report_investment report_other, pageType FIN_RESERVE LIFE INVESTMENT OTHER SUMMARY, editor_schema, report_cover, report_summary_overview, shared summary_* PATCH, summary-preview-html, pages preview-html, iframe srcdoc, agentLkApi, SettingsPage, goal_card_assets.
---

# PDF-настройки отчёта (ЛК агента)

## Когда применять

Задачи про экран настроек PDF в ЛК агента: обложка, «Сводная информация», вкладки целей (финрезерв, жизнь, инвестиции, прочая цель), превью HTML, загрузка фона/лого, цвета, затемнение фона, `summary_text_color` / `summary_line_color`, типы шаблонов из `editor_schema` и фолбэки ЛК.

**Не смешивать** с клиентским отчётом и отдельными лэйаутами клиента — здесь домен **`/api/pfp/pdf-settings`** и UI настроек агента.

## Источники правды

1. OpenAPI: `api_docs/PDFsettings.yaml`
2. Контракт сводной (превью, поля, assets): `docs/report_page2_sum_front_contract.md`
3. Реализация: `src/api/agentLkApi.ts`, `src/pages/SettingsPage.tsx`

## Доменные правила

### Шаблоны и форма

- Список секций и полей брать из **`editor_schema.templates[]`**: для каждого шаблона — `id`, `title`, `description`, поля из `fields[]`.
- Рендер контролов по **`type`** (`image`, `text`, `color`, `readonly`).
- При сохранении использовать **`field.patch_key`** в теле **`PATCH /api/pfp/pdf-settings`** (не выдумывать ключи в обход схемы).

Имена шаблонов, которые часто фигурируют: `report_cover`, `report_summary_overview`, а также `report_fin_reserve`, `report_life`, `report_investment`, `report_other`. У части из них **`patch_key` общие** (`summary_*`) — это ожидаемо для текущего API.

### Превью сводной (ЛК, без clientId)

- Endpoint: **`GET /api/pfp/pdf-settings/summary-preview-html`**, ответ **`text/html`** (полная страница A4).
- На фронте: **`fetch` с `Authorization`**, прочитать body как текст, вставить в **`iframe` через `srcdoc`**. Прямой **`iframe.src`** с JWT обычно не подходит.
- Если картинки не видны: проверить пришедший HTML (пустые `src`, CSP, `sandbox` у iframe). Пустые `src` у элементов, которые бэк должен заполнить URL — **часто баг или дыра на бэке**, а не «фронт обрезал HTML».

### Картинки

- Загрузка и метаданные для превью в ЛК — по контракту в `agentLkApi` / yaml (upload, read URL / signed URL по ситуации).
- **`goal_card_assets.cards[]`**: маппинг по **`goal_type`**, использовать **`public_url`** как `src` при самостоятельной отрисовке; не по индексу массива.

### Обложка и сводная (типичные patch-ключи)

- Обложка: `cover_background_url`, `cover_title`, `title_band_color` (и др. по схеме).
- Сводная и родственные страницы: `summary_background_url`, `summary_logo_url`, `summary_chart_color`, `summary_background_darkness_percent`, `summary_text_color`, `summary_line_color` — уточнять в актуальном `editor_schema` и yaml.

## Чеклист при изменениях

1. Сверить поля с **`GET /api/pfp/pdf-settings`** / `editor_schema`, а не с устаревшим списком в чате.
2. Превью сводной — только **`summary-preview-html` + srcdoc** (если контракт не меняли).
3. После стабилизации бэка/превью: убрать временный debug (`console.log`, ослабленный `sandbox` на iframe), если они остались в коде намеренно для диагностики.
4. При новых эндпоинтах — обновить **`agentLkApi.ts`** и при необходимости **`PDFsettings.yaml`** и **`docs/report_page2_sum_front_contract.md`**.

## Связанное Cursor rule

Файл `.cursor/rules/pdf-report-settings-lk.mdc` подключается при работе с globs на эти же пути — держи rule и skill согласованными.
