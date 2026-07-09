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
```

Файл `.env` — UTF-8. Секреты не коммитить.

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run build` | Сборка в `dist/` |
| `npm run deploy:yandex` | build + заливка в бакет |
| `npm run upload:yandex` | Только заливка |
| `npm run test:yandex-s3` | Проверка доступа к бакету |
| `npm run audit` | `npm audit` (уровень high+) |
| `npm run audit:dist` | Список файлов + паттерны в JS |
| `npm run audit:bucket` | Сверка `dist/` с бакетом (dry-run) |
| `npm run security:check` | audit → build → audit:dist → audit:bucket |

Прод: **https://family-office.bank-future.com**

SEO (Вебмастер, Метрика, чеклист): [`docs/SEO_WEBMASTER.md`](SEO_WEBMASTER.md)

Служебный URL бакета: `http://family-office.bank-future.com.website.yandexcloud.net`

## Чеклист перед релизом

1. `npm run security:check` — без ошибок (bucket warn = нужен деплой).
2. `npm run deploy:yandex` — если бакет отставал от `dist/`.
3. Вручную: [VirusTotal URL](https://www.virustotal.com/) → `https://family-office.bank-future.com`
4. [Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/search) — домен.
5. DevTools → Network: нет запросов на неизвестные домены.

## Права бакета (консоль Yandex)

- **Чтение объектов** — для всех (публичная статика).
- **Запись** — только сервисный аккаунт (ключи в `.env`).
- Website hosting: главная и ошибка = `index.html` (SPA).
- Для вложенных path (`/sber`, `/invite/activate`, `/register`, `/atb_mass`, `/atb_bank`, `/plan`) после `npm run build` скрипт `scripts/copy-spa-fallbacks.mjs` кладёт `index.html` в соответствующие папки в `dist/` — иначе CDN может отдавать 404 без загрузки React.

### Partner widgets: `/rostech` и `/npf`

Отдельные static HTML + `widget.js` (constructor `site-chat/stream`), **не** React SPA и **не** AI B2C / `/plan`.

- Исходники: `partner-widgets/constructor-chat/` (из `frontRostech` ветка `AI_NPF_Rostech`)
- Сборка: `scripts/build-partner-widgets.mjs` → `dist/rostech/`, `dist/npf/`
- В `.env`: `ROSTECH_PROJECT_KEY`, `RENESSANS_PROJECT_KEY` (+ опционально `*_API_BASE_URL`)
- Upload: main `s3 sync --delete` **не трогает** `rostech/*` и `npf/*` (exclude); после sync заливает эти префиксы отдельно из `dist/`

Прод: https://family-office.bank-future.com/rostech · https://family-office.bank-future.com/npf

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
