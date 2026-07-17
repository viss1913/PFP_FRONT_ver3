# Инструкция для партнёра — скачать проект и начать работу

Пошаговый гайд для человека.  
Если работаете через **Cursor / ИИ-агента** — дополнительно откройте [`AGENTS.md`](AGENTS.md).

**Ветка для скачивания:** `partner-handoff`  
**Репозиторий:** https://github.com/viss1913/PFP_FRONT_ver3  
**В наш GitHub пушить запрещено** — работаете только у себя на компе и на своём сервере.

---

## Что вы получаете

- Frontend (сайт) для guest Family Office — страница **`/plan`**
- Свой бренд, тексты, картинки — правите у себя
- **API общий** — `https://pfp-api.bank-future.com/api` (сервер BankFuture)
- Ваши данные отделены через **`project_key`**, который мы вам выдаём

---

## Шаг 0. Что запросить у BankFuture ДО старта

Без этого проект скачается, но **не заработает** с API:

| № | Что нужно | Пример |
|---|-----------|--------|
| 1 | `project_key` | `pk_a1b2c3d4…` |
| 2 | `project_id` | `42` |
| 3 | **CORS** — ваш домен добавлен на наш backend | `https://your-site.com` |
| 4 | Тестовый `ref` агента (код из invite-link) | для проверки `/plan` |

Напишите нам: название компании + домен, на котором будет сайт (prod и staging, если есть).

---

## Шаг 1. Установить Node.js (один раз)

Нужен **Node.js 20+** (вместе с ним идёт `npm`).

1. Откройте https://nodejs.org/
2. Скачайте версию **LTS**
3. Установите с настройками по умолчанию
4. Проверьте в терминале:

**Windows (PowerShell или cmd):**
```powershell
node -v
npm -v
```

**macOS / Linux (Terminal):**
```bash
node -v
npm -v
```

Должны показаться номера версий (например `v20.x.x` и `10.x.x`).

---

## Шаг 2. Скачать проект на компьютер

Выберите **один** способ.

### Способ A — ZIP (проще, без Git)

1. Откройте в браузере:  
   **https://github.com/viss1913/PFP_FRONT_ver3/tree/partner-handoff**
2. Убедитесь, что вверхе выбрана ветка **`partner-handoff`** (не `main`).
3. Нажмите зелёную кнопку **Code** → **Download ZIP**.
4. Распакуйте архив в удобную папку, например:
   - Windows: `C:\Projects\family-office-partner`
   - macOS: `~/Projects/family-office-partner`
5. Запомните путь к папке — дальше все команды из неё.

### Способ B — Git (если уже пользуетесь Git)

```bash
git clone --branch partner-handoff --single-branch \
  https://github.com/viss1913/PFP_FRONT_ver3.git family-office-partner

cd family-office-partner
```

Скачается **только** нужная ветка, без лишнего.

---

## Шаг 3. Открыть проект в редакторе

Рекомендуем **Cursor** или **VS Code**:

1. File → Open Folder
2. Выберите распакованную папку `family-office-partner` (или как назвали)
3. Если используете **Cursor** — ИИ подхватит файлы из `.cursor/` автоматически

---

## Шаг 4. Создать файл настроек `.env`

В корне проекта есть шаблон `.env.partner.example`.  
Нужно сделать из него рабочий `.env` со **своими** значениями.

### Windows (PowerShell)

```powershell
cd C:\Projects\family-office-partner
Copy-Item .env.partner.example .env
notepad .env
```

### macOS / Linux

```bash
cd ~/Projects/family-office-partner
cp .env.partner.example .env
nano .env
```

### Что вписать в `.env`

```env
VITE_SITE_URL=https://your-site.com
VITE_API_BASE_URL=https://pfp-api.bank-future.com/api
VITE_PARTNER_PROJECT_KEY=pk_ВАШ_КЛЮЧ_ОТ_BANKFUTURE
VITE_PARTNER_PROJECT_ID=42
```

| Переменная | Что это |
|------------|---------|
| `VITE_SITE_URL` | **Ваш** будущий адрес сайта (пока можно `http://localhost:5173` для локальной разработки) |
| `VITE_API_BASE_URL` | **Наш** API — не меняйте, если не дали другой staging URL |
| `VITE_PARTNER_PROJECT_KEY` | Ключ tenant — даёт BankFuture |
| `VITE_PARTNER_PROJECT_ID` | Число — даёт BankFuture |

**Сохраните файл.**  
**Не отправляйте `.env` в git и никому в чат** — там секреты.

---

## Шаг 5. Установить зависимости

Откройте терминал **в папке проекта** и выполните:

```bash
npm install
```

Первый раз может занять 2–5 минут. Дождитесь окончания без ошибок.

Если ошибка доступа / сеть — проверьте интернет и повторите `npm install`.

---

## Шаг 6. Запустить локально (разработка)

```bash
npm run dev
```

В терминале появится адрес, обычно:

```
http://localhost:5173
```

Откройте в браузере:

```
http://localhost:5173/plan/?ref=ВАШ_ТЕСТОВЫЙ_REF
```

Если `VITE_PARTNER_PROJECT_KEY` уже в `.env` — `project_key` в URL **не обязателен**.

### Что должно произойти

1. Открывается welcome-экран (Виктория)
2. Можно пройти шаги CJM (семья → цели → …)
3. В DevTools → **Network** запросы идут на `pfp-api.bank-future.com`
4. В заголовках запроса есть `X-Project-Key: pk_…`

Остановить сервер: **Ctrl+C** в терминале.

---

## Шаг 7. Собрать версию для своего сервера (production)

Когда локально всё ок:

```bash
npm run build
```

Появится папка **`dist/`** — это готовый сайт.  
Её содержимое заливаете на **свой** хостинг / CDN / S3.

**Важно для `/plan`:** на CDN URL должен быть **`/plan/` со слэшем в конце**, иначе могут потеряться параметры `ref` и `project_key` в ссылке.

Подробнее про деплой: [`docs/DEPLOY_YANDEX.md`](docs/DEPLOY_YANDEX.md) (логика та же для любого CDN).

---

## Шаг 8. Свой Git (рекомендуется)

Чтобы хранить **свои** правки, заведите **свой** репозиторий (GitHub / GitLab / Bitbucket).

Если скачивали через Git:

```bash
git remote remove origin
git remote add origin https://github.com/ВАША-ОРГ/ваш-репо.git
git push -u origin partner-handoff
```

Если скачивали ZIP — инициализируйте git у себя:

```bash
git init
git add .
git commit -m "Initial partner handoff"
git remote add origin https://github.com/ВАША-ОРГ/ваш-репо.git
git push -u origin main
```

**В репозиторий BankFuture (`viss1913/PFP_FRONT_ver3`) ничего не пушите.**

---

## Что править под свой бренд (white-label)

Сначала меняйте **только** эти места (не лезьте в API без нужды):

| Что | Где |
|-----|-----|
| Тексты welcome / CJM | `src/content/b2c*.ts` |
| Картинки, лого | `src/content/b2cAssets.ts`, `src/assets/b2c/` |
| Цвета, вёрстка | `src/styles/b2c-guest-plan.css` |
| SEO | `src/seo/pageSeo.ts` |

Полный список: [`docs/B2C_PLAN_HANDOFF.md`](docs/B2C_PLAN_HANDOFF.md)

---

## Частые проблемы

| Проблема | Решение |
|----------|---------|
| `npm: command not found` | Не установлен Node.js — см. Шаг 1 |
| CORS error в браузере | Напишите нам — добавим ваш домен на backend |
| 401 / 403 на API | Проверьте `VITE_PARTNER_PROJECT_KEY` в `.env`, пересоберите (`npm run dev` заново) |
| Пустая страница после деплоя | Проверьте, что CDN отдаёт `index.html` для SPA |
| Потерялся `ref` | URL должен быть `/plan/` **со слэшем** |
| Отчёт PDF/HTML не открывается | На шаге 1 CJM нужен email + валидный `ref` |

---

## Куда смотреть дальше

| Документ | Зачем |
|----------|--------|
| [`README.md`](README.md) | Краткий обзор проекта |
| [`AGENTS.md`](AGENTS.md) | Для Cursor / ИИ-агента |
| [`docs/PARTNER_PROJECT_KEY_SETUP.md`](docs/PARTNER_PROJECT_KEY_SETUP.md) | project_key и наш API |
| [`docs/PARTNER_AI_ONBOARDING.md`](docs/PARTNER_AI_ONBOARDING.md) | Полный runbook |
| [`docs/B2C_PLAN_HANDOFF.md`](docs/B2C_PLAN_HANDOFF.md) | Кастомизация `/plan` |

---

## Контакты

| Вопрос | Куда |
|--------|------|
| `project_key`, CORS, API | Backend / менеджер BankFuture |
| Обновление версии handoff | Команда frontend BankFuture |
| Баг после ваших правок | Сначала ваш разработчик, потом мы |

---

## Чеклист «я готов работать»

- [ ] Node.js установлен (`node -v` работает)
- [ ] Проект скачан (ZIP или git clone `partner-handoff`)
- [ ] Файл `.env` создан из `.env.partner.example`
- [ ] В `.env` прописаны key и id от BankFuture
- [ ] `npm install` прошёл без ошибок
- [ ] `npm run dev` → `/plan/` открывается локально
- [ ] Запросы в Network идут на `pfp-api.bank-future.com`
- [ ] Свой git / свой сервер для деплоя — не наш GitHub
