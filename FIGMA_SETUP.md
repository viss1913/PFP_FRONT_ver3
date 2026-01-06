# Настройка Figma интеграции

## Что нужно для работы:

1. **Access Token** - получите здесь: https://www.figma.com/settings/account#personal-access-tokens

2. **File Key** - уже настроен: `HIc2F0OeTuvafJNSTKMm3E` (из URL: https://www.figma.com/design/HIc2F0OeTuvafJNSTKMm3E/Фронт)

## Создайте файл .env в корне проекта:

```env
VITE_FIGMA_TOKEN=ваш_токен_здесь
VITE_FIGMA_FILE_KEY=HIc2F0OeTuvafJNSTKMm3E
```

⚠️ **Важно**: Не коммитьте файл `.env` в git! Он уже добавлен в `.gitignore`.

## Важно:

- Убедитесь, что файл доступен ("Anyone can view" или у вас есть доступ через токен)
- После создания .env файла перезапустите dev сервер (`npm run dev`)

