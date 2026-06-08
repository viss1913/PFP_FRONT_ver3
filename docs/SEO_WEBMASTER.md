# SEO: Вебмастер, Метрика и ежемесячный отчёт

Прод-сайт: **https://family-office.bank-future.com**

## Яндекс.Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → добавить сайт `https://family-office.bank-future.com`.
2. Подтвердить права (HTML-файл / meta / DNS — как удобнее в хостинге CDN).
3. **Индексирование → Файлы Sitemap** → указать:
   ```
   https://family-office.bank-future.com/sitemap.xml
   ```
4. **Настройки индексирования** → регион: Россия.
5. После каждого деплоя с SEO/лендингом: **Переобход страниц** → главная и `/sber`.

## Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → ресурс с префиксом URL `https://family-office.bank-future.com/`.
2. Sitemap: тот же `sitemap.xml`.
3. Проверить, что `robots.txt` доступен: `https://family-office.bank-future.com/robots.txt`.

## Яндекс.Метрика (счётчик 109614082)

Цели для сегмента **«Органический трафик»** (отчёт → источники → поисковые системы):

| Цель | Событие `reachGoal` |
|------|---------------------|
| Просмотр лендинга | `landing_view` |
| Клик по CTA | `cta_click` |
| Открытие формы | `lead_form_open` |
| Отправка заявки | `lead_submit` |

Для B2B смотреть воронку: органика → `landing_view` → `lead_form_open` (источник `consultant-block`) → `lead_submit`.

## Ежемесячный чеклист (15 мин)

| Что | Где |
|-----|-----|
| Показы и клики по целевым запросам | Вебмастер → «Поисковые запросы» |
| Страницы в выдаче | Вебмастер → «Страницы в поиске» |
| Ошибки обхода / 404 | Вебмастер → «Диагностика» |
| Лиды с органики | Метрика → цели + сегмент «Поисковые системы» |
| Новые запросы с показами без кликов | Добавить ответ в FAQ на лендинге ([`src/content/landingCopy.ts`](../src/content/landingCopy.ts)) |

### Целевые запросы (B2B-приоритет)

- платформа для финансовых консультантов
- crm для финансового консультанта
- family office для консультантов / семейный офис для консультантов
- программа / софт для финансового планирования
- запустить family office
- BankFuture

### Канал Сбер

- family office сбер / семейный офис сбер → страница `/sber`

## Домен bankfuture.ru

Если домен активен — настроить **301 редирект** на `https://family-office.bank-future.com/`, чтобы не дробить вес и canonical.

## Деплой после правок SEO

```bash
npm run deploy:yandex
```

Скрипт сборки перегенерирует `dist/robots.txt` и `dist/sitemap.xml` из `VITE_SITE_URL` в `.env`.
