/**
 * Скрипт для получения структуры дизайна из Figma
 * Запуск: node scripts/get-figma-structure.js
 */

const FIGMA_FILE_KEY = 'HIc2F0OeTuvafJNSTKMm3E';
const FIGMA_TOKEN = process.env.VITE_FIGMA_TOKEN || '';

async function getFigmaStructure() {
  if (!FIGMA_TOKEN) {
    console.error('❌ Токен не найден! Установите переменную окружения VITE_FIGMA_TOKEN');
    process.exit(1);
  }

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n📄 Файл:', data.document.name);
    console.log('\n📑 Страницы:');
    
    data.document.children.forEach((page, index) => {
      console.log(`\n${index + 1}. ${page.name}`);
      if (page.children) {
        console.log(`   Фреймов: ${page.children.length}`);
        page.children.forEach((frame, frameIndex) => {
          console.log(`   - ${frame.name} (${frame.type})`);
        });
      }
    });

    // Сохраняем структуру в файл
    const fs = require('fs');
    fs.writeFileSync(
      'figma-structure.json',
      JSON.stringify(data, null, 2)
    );
    
    console.log('\n✅ Структура сохранена в figma-structure.json');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

getFigmaStructure();

