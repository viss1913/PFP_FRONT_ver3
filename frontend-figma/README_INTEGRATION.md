# 📦 Интеграция Figma в ваш фронтенд-проект

## Файлы для копирования

Скопируйте эти файлы в ваш фронтенд-проект:

1. **`figma-integration-example.js`** - основной файл с сервисом (обязательно)
2. **`figma-integration-example.html`** - пример для тестирования (опционально)

## Быстрая интеграция

### Шаг 1: Скопируйте файл

Скопируйте `figma-integration-example.js` в папку вашего проекта, например:
```
ваш-фронтенд-проект/
├── src/
│   ├── services/
│   │   └── figma-integration-example.js  ← скопируйте сюда
│   └── ...
```

### Шаг 2: Подключите в проект

#### Для обычного HTML/JS:
```html
<script type="module" src="./src/services/figma-integration-example.js"></script>
<script type="module">
  // Используйте window.FigmaIntegration
  const { FigmaAPIService } = window.FigmaIntegration;
</script>
```

#### Для Vite/React/Vue:
```javascript
import { FigmaAPIService, figmaPageToHTML, loadFigmaDesign } from './services/figma-integration-example.js';
```

### Шаг 3: Используйте токен

#### Вариант A: Через переменные окружения (рекомендуется)

Создайте файл `.env` в корне проекта:
```env
VITE_FIGMA_TOKEN=figd_ваш_токен_здесь
VITE_FIGMA_FILE_KEY=ваш_file_key_здесь
```

Использование:
```javascript
const token = import.meta.env.VITE_FIGMA_TOKEN;
const fileKey = import.meta.env.VITE_FIGMA_FILE_KEY;
```

#### Вариант B: Прямо в коде (для быстрого теста)

```javascript
const token = 'figd_ваш_токен_здесь';
const fileKey = 'ваш_file_key_здесь';
```

⚠️ **Внимание**: Не коммитьте токен в git! Используйте `.env` файл.

### Шаг 4: Пример использования

```javascript
import { FigmaAPIService, figmaPageToHTML } from './services/figma-integration-example.js';

// 1. Создайте сервис
const token = 'figd_ваш_токен'; // или из .env
const figmaService = new FigmaAPIService(token);

// 2. Получите файл
const file = await figmaService.getFile('ваш_file_key');

// 3. Получите страницу (первая страница или по имени)
const page = file.document.children[0]; // или find(p => p.name === 'Page 1')

// 4. Преобразуйте в HTML
const htmlContainer = figmaPageToHTML(page);

// 5. Вставьте в DOM
document.getElementById('container').appendChild(htmlContainer);
```

## Простой пример для React

```jsx
import React, { useEffect, useState } from 'react';
import { FigmaAPIService, figmaPageToHTML } from './services/figma-integration-example.js';

function FigmaDesign({ fileKey, pageName }) {
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDesign() {
      try {
        const token = import.meta.env.VITE_FIGMA_TOKEN;
        const figmaService = new FigmaAPIService(token);
        const file = await figmaService.getFile(fileKey);
        
        const page = pageName 
          ? file.document.children.find(p => p.name === pageName)
          : file.document.children[0];
        
        const container = figmaPageToHTML(page);
        setHtmlContent(container.innerHTML);
      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDesign();
  }, [fileKey, pageName]);

  if (loading) return <div>Загрузка...</div>;

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}

export default FigmaDesign;
```

## Простой пример для Vue

```vue
<template>
  <div v-if="loading">Загрузка...</div>
  <div v-else v-html="htmlContent"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FigmaAPIService, figmaPageToHTML } from './services/figma-integration-example.js';

const props = defineProps({
  fileKey: String,
  pageName: String
});

const htmlContent = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    const token = import.meta.env.VITE_FIGMA_TOKEN;
    const figmaService = new FigmaAPIService(token);
    const file = await figmaService.getFile(props.fileKey);
    
    const page = props.pageName 
      ? file.document.children.find(p => p.name === props.pageName)
      : file.document.children[0];
    
    const container = figmaPageToHTML(page);
    htmlContent.value = container.innerHTML;
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  } finally {
    loading.value = false;
  }
});
</script>
```

## API методы

### FigmaAPIService

```javascript
const figmaService = new FigmaAPIService(token);

// Получить файл
const file = await figmaService.getFile(fileKey);

// Получить узлы
const nodes = await figmaService.getNodes(fileKey, ['nodeId1', 'nodeId2']);

// Получить изображения узлов
const images = await figmaService.getImages(fileKey, ['nodeId1'], {
  scale: 2,      // 1-4
  format: 'png'  // 'png' | 'jpg' | 'svg' | 'pdf'
});

// Получить все страницы
const pages = await figmaService.getPages(fileKey);

// Найти узел по имени
const node = figmaService.findNodeByName(file.document, 'ComponentName');
```

## Утилиты

```javascript
import { figmaPageToHTML, figmaNodeToHTML, figmaColorToCSS } from './services/figma-integration-example.js';

// Преобразовать страницу в HTML
const htmlContainer = figmaPageToHTML(pageNode);

// Преобразовать узел в HTML
const htmlElement = figmaNodeToHTML(node);

// Преобразовать цвет Figma в CSS
const cssColor = figmaColorToCSS({ r: 1, g: 0, b: 0, a: 1 }); // rgba(255, 0, 0, 1)
```

## Безопасность

1. ✅ Используйте `.env` файл для токена
2. ✅ Добавьте `.env` в `.gitignore`
3. ❌ Не коммитьте токен в код
4. ❌ Не используйте токен напрямую во фронтенде в продакшене (лучше через Backend API)

## Проблемы?

- **Ошибка токена**: Проверьте, что токен правильный и не истек
- **Ошибка доступа**: Убедитесь, что у вас есть доступ к файлу Figma
- **CORS ошибка**: Используйте Backend API или настройте прокси
- **Пустой результат**: Проверьте File Key в URL Figma файла

## Дополнительная информация

См. `FIGMA_FRONTEND_SETUP.md` для подробной документации.

