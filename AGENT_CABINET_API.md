# API Спецификация: Личный кабинет агента (SMM AI)

Этот документ содержит описание эндпоинтов для разработки фронтенда личного кабинета агента.

## 1. Авторизация (SSO)
Бэкенд SMM AI доверяет токенам, выпущенным основным бэкендом (PFP), при условии использования общего `JWT_SECRET`.

*   **Тип**: Bearer Token
*   **Заголовок**: `Authorization: Bearer <JWT_TOKEN>`
*   **Формат полезной нагрузки (Payload) токена**:
    ```json
    {
      "id": "uuid-агента-из-пфп",
      "role": "agent"
    }
    ```

---

## 2. Эндпоинты

Все пути начинаются с: `https://your-smm-api-url.com/api/v1/agent`

### 2.1. Данные текущего агента
Получение информации о профиле.
*   **Метод**: `GET`
*   **Путь**: `/me`
*   **Результат (200 OK)**:
    ```json
    {
      "id": "internal-db-uuid",
      "fio_firstname": "Иван",
      "fio_lastname": "Иванов",
      "email": "agent@example.com",
      "telegram_channel_id": "@my_channel",
      "region": "Москва",
      "is_active": true,
      "bot_status": "active" // "active", "no_access", "restricted"
    }
    ```

### 2.2. История публикаций
Список постов, отправленных ботом или агентом вручную.
*   **Метод**: `GET`
*   **Путь**: `/me/posts`
*   **Результат (200 OK)**:
    ```json
    [
      {
        "id": "post-uuid",
        "payload_text": "Текст вашего последнего поста...",
        "payload_image_url": "https://storage.com/image.jpg",
        "sent_at": "2026-01-27T10:00:00Z",
        "kind": "regular", // "regular" (авто) или "manual" (ручной)
        "status": "sent"
      }
    ]
    ```

### 2.3. Загрузка изображения
Загрузка файла перед отправкой поста.
*   **Метод**: `POST`
*   **Путь**: `/upload`
*   **Тело запроса**: `multipart/form-data` (поле `image`)
*   **Результат (200 OK)**:
    ```json
    {
      "success": true,
      "url": "https://your-api.com/uploads/image-123.jpg"
    }
    ```

### 2.4. Ручная отправка поста
Позволяет агенту отправить сообщение в свой Telegram-канал прямо из кабинета.
*   **Метод**: `POST`
*   **Путь**: `/me/send-manual-post`
*   **Тело запроса (JSON)**:
    ```json
    {
      "text": "Текст сообщения для канала (обязательно)",
      "image_url": "https://image-link.com/photo.jpg" (опционально)
    }
    ```
*   **Результат (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Manual post sent successfully",
      "sent_post": { ... }
    }
    ```

---

## 3. Статистика (Опционально)
Графики активности агента.
*   **Метод**: `GET`
*   **Путь**: `/me/stats`
*   **Параметры**: `?from=YYYY-MM-DD&to=YYYY-MM-DD`
*   **Результат**: Массив данных по дням (сообщения, показы и т.д.).

---

## Коды ответов
*   `200 OK`: Успешный запрос.
*   `401 Unauthorized`: Токен отсутствует или невалиден.
*   `404 Not Found`: Агент с таким UUID не найден.
*   `403 Forbidden`: (Опционально) Бот не является админом (проверяйте `bot_status` в `/me`).
*   `500 Error`: Ошибка на стороне бэкенда.
