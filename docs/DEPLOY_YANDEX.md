# Деплой и проверка безопасности (Yandex Object Storage)

## Переменные в `.env`

Перед `npm run build` / `deploy:yandex` (вшиваются в бандл):

```env
VITE_API_BASE_URL=https://pfp-api.bank-future.com/api
VITE_SITE_URL=https://family-office.bank-future.com
```

Дефолтный `project_key` Finam задаётся в коде: `src/api/projectKey.ts` (`pk_7f1ccfe5b2598134a575320d`).
Для route-level lane `atb_mass` там же есть отдельный override:

- `project_id = 3`
- `project_key = pk_e0d2b45ac658fd23726398f5`

Только для CLI (не `VITE_*`):

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BUCKET_NAME=family-office.bank-future.com
# YC_S3_ENDPOINT=https://storage.yandexcloud.net
# YC_S3_PREFIX=

# Обязательно для /rostech и /npf (constructor site-chat, не /plan)
ROSTECH_PROJECT_KEY=pk_...
RENESSANS_PROJECT_KEY=pk_...
# ROSTECH_API_BASE_URL=https://pfp-api.bank-future.com
# RENESSANS_API_BASE_URL=https://pfp-api.bank-future.com
```

Файл `.env` — UTF-8. Секреты не коммитить.

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run build` | Сборка SPA + SEO + **partner-widgets** (`dist/rostech`, `dist/npf`) |
| `npm run deploy:yandex` | build + заливка + **smoke `/rostech` `/npf`** |
| `npm run upload:yandex` | Только заливка (требует `dist/rostech` + `dist/npf`, иначе exit 1) |
| `npm run upload:partner-widgets` | Только виджеты (если SPA уже залит, а чаты 404) |
| `npm run smoke:partner-widgets` | Проверка живых URL виджетов |
| `npm run test:yandex-s3` | Проверка доступа к бакету |
| `npm run audit` | `npm audit` (уровень high+) |
| `npm run audit:dist` | Список файлов + паттерны в JS |
| `npm run audit:bucket` | Сверка `dist/` с бакетом (dry-run) |
| `npm run security:check` | audit → build → audit:dist → audit:bucket |

Прод: **https://family-office.bank-future.com**

SEO (Вебмастер, Метрика, чеклист): [`docs/SEO_WEBMASTER.md`](SEO_WEBMASTER.md)

Служебный URL бакета: `http://family-office.bank-future.com.website.yandexcloud.net`

## Partner widgets: `/rostech` и `/npf` (нельзя сносить)

Отдельные static HTML + `widget.js` (constructor `site-chat/stream`). **Не** React SPA, **не** AI B2C / `/plan`.

| URL | Env key |
|-----|---------|
| https://family-office.bank-future.com/rostech | `ROSTECH_PROJECT_KEY` |
| https://family-office.bank-future.com/npf | `RENESSANS_PROJECT_KEY` |

**Почему раньше пропадали:** `aws s3 sync dist/ s3://bucket/ --delete` удаляет в бакете всё, чего нет в локальном `dist/`. На ветке без `partner-widgets` и без `--exclude rostech/* npf/*` полный деплой SPA **сносил** чаты. Website hosting при 404 отдаёт корневой `index.html` → кажется, что «всё ушло в ЛК».

**Защита в `upload-to-yandex-bucket.mjs`:**
1. Main sync: `--exclude rostech/*` и `--exclude npf/*`
2. Отдельный sync `dist/rostech` → `rostech/`, `dist/npf` → `npf/`
3. Если нет `dist/*/index.html` — **hard fail**, upload не идёт
4. `deploy:yandex` после заливки гоняет `smoke:partner-widgets`

Экстренно без полного SPA: `npm run upload:partner-widgets`.

## Чеклист перед релизом

1. `npm run security:check` — без ошибок (bucket warn = нужен деплой).
2. `npm run deploy:yandex` — если бакет отставал от `dist/` (внутри уже smoke виджетов).
3. Вручную: [VirusTotal URL](https://www.virustotal.com/) → `https://family-office.bank-future.com`
4. [Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/search) — домен.
5. DevTools → Network: нет запросов на неизвестные домены.
6. Открыть `/rostech/` и `/npf/` — чат, не лендинг BankFuture.

## Права бакета (консоль Yandex)

- **Чтение объектов** — для всех (публичная статика).
- **Запись** — только сервисный аккаунт (ключи в `.env`).
- Website hosting: главная и ошибка = `index.html` (SPA).
- Для вложенных path (`/sber`, `/invite/activate`, `/register`, `/atb_mass`, `/atb_bank`) после `npm run build` скрипт `scripts/copy-spa-fallbacks.mjs` кладёт `index.html` в соответствующие папки в `dist/` — иначе CDN может отдавать 404 без загрузки React.

## Отчёт проверки (2026-05-19)

### npm audit

- До `npm audit fix`: 10 уязвимостей (6 high, 4 moderate) — axios, vite, rollup и др.
- После `npm audit fix`: **0 vulnerabilities** (dev и `npm audit --omit=dev`).

### dist/

- 47 файлов, без `.exe` / `.php` и т.п.
- В бандле `atob`, `fromCharCode` — типично для библиотек (не флаг само по себе).

### Бакет

- Dry-run показал отличие: новый хэш JS (`index-CtNyO0zP.js`) vs старый в облаке — нужен `npm run deploy:yandex` после обновления зависимостей.

### Живой сайт

- HTTPS открывается, контент лендинга BankFuture.
- В `index.html`: скрипт с того же origin, шрифты Google Fonts.

### Внешние сканеры

Выполняются вручную (см. чеклист выше).

## DNS / HTTPS (напоминание)

- Сертификат: Certificate Manager → `_acme-challenge` CNAME в **dns.he.net**.
- Сайт: Cloud CDN → CNAME `family-office` на endpoint CDN.
- NS домена `bank-future.com` — he.net, записи в Яндекс DNS без смены NS не работают.

## Защитник Windows

По желанию: полное сканирование папки проекта (после `npm ci` / скачивания архивов).
