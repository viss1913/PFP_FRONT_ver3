# Конструктор: медиа к стадиям CJM (картинки / видео)

**Дата:** 2026-06-10  
**Бэкенд:** уже на Immers (`https://pfp-api.bank-future.com/api`)  
**Спека:** `api_docs/agent_lk.yaml` — обновлён (схемы + эндпоинты)

---

## Задача

В админке конструктора (редактирование команды / стадии CJM) добавить блок **«Медиа стадии»**:

- загрузка картинки или видео к команде (`/start`, `/family_office`, …);
- список загруженных файлов с превью;
- удаление файла.

Файлы хранятся в **R2**, в Telegram уходят **при переходе на стадию** (один раз при входе, не на каждое сообщение внутри стадии).

---

## API

Заголовок как везде в конструкторе: **`X-Project-Key`**.

### Список команд

```http
GET /api/pfp/constructor/commands
```

В каждой команде поле `media` — массив (может быть `[]`):

```ts
type ConstructorCommandMediaItem = {
  id: string;              // UUID — для DELETE
  type: 'image' | 'video';
  url: string;             // публичный URL, превью в UI
  key?: string;
  filename?: string | null;
  mime?: string | null;
  caption?: string;        // подпись в Telegram
  sort: number;            // порядок отправки
};
```

### Загрузка

```http
POST /api/pfp/constructor/commands/{commandId}/media
Content-Type: multipart/form-data
```

| Поле | Обязательно | Описание |
|------|-------------|----------|
| `file` | да | jpg, png, webp, gif, mp4, webm, mov |
| `caption` | нет | подпись в Telegram |

Ответ `201`:

```json
{
  "success": true,
  "media": { "id": "...", "type": "image", "url": "https://...", "sort": 0 },
  "all": [ /* полный массив media после добавления */ ]
}
```

Алиас: `POST .../constructor_commands/{id}/media`

### Удаление

```http
DELETE /api/pfp/constructor/commands/{commandId}/media/{mediaId}
```

Ответ `200`: `{ "success": true, "all": [...] }`

Алиас: `DELETE .../constructor_commands/{id}/media/{mediaId}`

### Ошибки

| Код | Когда |
|-----|--------|
| `400` | нет файла, неверный тип, > 5 файлов на команду, > 50 MB |
| `404` | команда или mediaId не найдены |
| `503` | R2 недоступен (`R2_PUBLIC_URL_MISSING`, `R2_PUT_FAILED`) |

---

## UI (минимум)

В форме редактирования команды — под **classifier** и **response**:

1. Список `command.media`: превью картинки / иконка видео + имя + «Удалить».
2. Кнопка **«Добавить файл»** (disabled при `media.length >= 5`).
3. При загрузке — `FormData` с `file` и опционально `caption`.
4. После успеха — обновить стейт из `response.all` или перезапросить `GET /commands`.
5. Подсказка: *«До 5 файлов, макс. 50 MB. Отправляются в бот при переходе на стадию.»*

`PUT /commands/{id}` для медиа **не обязателен** — только upload/delete эндпоинты.

---

## Пример (fetch)

```ts
async function uploadCommandMedia(
  apiBase: string,
  projectKey: string,
  commandId: number,
  file: File,
  caption?: string,
) {
  const fd = new FormData();
  fd.append('file', file);
  if (caption?.trim()) fd.append('caption', caption.trim());

  const res = await fetch(`${apiBase}/pfp/constructor/commands/${commandId}/media`, {
    method: 'POST',
    headers: { 'X-Project-Key': projectKey },
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }
  return res.json() as Promise<{
    success: boolean;
    media: ConstructorCommandMediaItem;
    all: ConstructorCommandMediaItem[];
  }>;
}
```

---

## Приёмка

- [ ] В форме команды видно `media` из `GET /commands`
- [ ] Загрузка картинки на `/start` → в Telegram-боте после `/reset` + `/start` приходит картинка после текста
- [ ] Удаление убирает файл из списка
- [ ] 6-й файл — понятная ошибка пользователю

---

## OpenAPI

Детали в **`api_docs/agent_lk.yaml`**:

- пути: `/pfp/constructor/commands/{id}/media`, `.../media/{mediaId}`
- схема: `ConstructorCommandMediaItem`
- поле `media` в `ConstructorCommand`

Вопросы по контракту — в бэкенд.
