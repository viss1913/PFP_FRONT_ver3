# Деплой и проверка безопасности (Yandex Object Storage)

## Переменные в `.env`

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
