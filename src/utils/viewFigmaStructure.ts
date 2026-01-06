/**
 * Утилита для просмотра структуры Figma дизайна в консоли
 * Используйте эту функцию в консоли браузера для анализа дизайна
 */

import { FigmaAPIService } from '../services/figmaService';
import { findTextNodes } from './figmaInspector';

// Токен должен быть в переменной окружения VITE_FIGMA_TOKEN (см. .env файл)
const FIGMA_FILE_KEY = import.meta.env.VITE_FIGMA_FILE_KEY || 'HIc2F0OeTuvafJNSTKMm3E';
const FIGMA_ACCESS_TOKEN = import.meta.env.VITE_FIGMA_TOKEN || '';

/**
 * Вывести структуру дизайна в консоль для анализа
 */
export async function viewFigmaStructure() {
  try {
    console.log('🔍 Анализ структуры Figma дизайна...');
    
    const service = new FigmaAPIService(FIGMA_ACCESS_TOKEN);
    const file = await service.getFile(FIGMA_FILE_KEY);

    console.log('\n📄 Название файла:', file.document.name);
    console.log('\n📑 Страницы:');
    
    file.document.children.forEach((page: any, index: number) => {
      console.log(`\n${index + 1}. Страница: "${page.name}" (ID: ${page.id})`);
      
      if (page.children) {
        console.log(`   Фреймов на странице: ${page.children.length}`);
        
        page.children.forEach((frame: any, frameIndex: number) => {
          console.log(`   - Фрейм ${frameIndex + 1}: "${frame.name}" (тип: ${frame.type})`);
          
          // Находим все текстовые элементы
          const textNodes = findTextNodes(frame, []);
          if (textNodes.length > 0) {
            console.log(`     Текстовые элементы (${textNodes.length}):`);
            textNodes.forEach((textNode: any) => {
              console.log(`       • "${textNode.name}": "${textNode.text}"`);
            });
          }
        });
      }
    });

    // Сохраняем полную структуру для удобства
    (window as any).__FIGMA_STRUCTURE__ = file;
    console.log('\n✅ Полная структура сохранена в window.__FIGMA_STRUCTURE__');
    console.log('   Используйте это для детального анализа в консоли');

    return file;
  } catch (error) {
    console.error('❌ Ошибка при анализе структуры:', error);
    throw error;
  }
}

// Делаем функцию доступной глобально для использования в консоли
if (typeof window !== 'undefined') {
  (window as any).viewFigmaStructure = viewFigmaStructure;
}

