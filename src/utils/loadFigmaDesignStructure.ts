/**
 * Загружает структуру дизайна из Figma и готовит данные для верстки
 */
import { FigmaAPIService } from '../services/figmaService';

// Токен должен быть в переменной окружения VITE_FIGMA_TOKEN (см. .env файл)
const FIGMA_FILE_KEY = 'HIc2F0OeTuvafJNSTKMm3E';
const FIGMA_ACCESS_TOKEN = import.meta.env.VITE_FIGMA_TOKEN || '';

export interface DesignElement {
  id: string;
  name: string;
  type: string;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
    borderRadius?: number;
    width?: number;
    height?: number;
  };
  text?: string;
  children?: DesignElement[];
}

/**
 * Загрузить полную структуру дизайна для верстки
 */
export async function loadDesignStructure(): Promise<{
  pages: any[];
  mainFrame: any;
  textNodes: any[];
  colors: Map<string, string>;
  fonts: Set<string>;
}> {
  try {
    const service = new FigmaAPIService(FIGMA_ACCESS_TOKEN);
    const file = await service.getFile(FIGMA_FILE_KEY);

    // Находим первую страницу (обычно это страница с дизайном результатов)
    const page = file.document.children[0];
    
    // Находим основной фрейм (обычно самый большой или с определенным именем)
    const mainFrame = page.children?.[0] || null;

    // Собираем все текстовые элементы
    const textNodes: any[] = [];
    const colors = new Map<string, string>();
    const fonts = new Set<string>();

    function traverse(node: any) {
      if (node.type === 'TEXT' && node.characters) {
        textNodes.push({
          id: node.id,
          name: node.name,
          text: node.characters,
          style: node.style,
          fills: node.fills,
        });

        if (node.style) {
          if (node.style.fontFamily) fonts.add(node.style.fontFamily);
        }

        if (node.fills && node.fills.length > 0) {
          const fill = node.fills[0];
          if (fill.type === 'SOLID' && fill.color) {
            const color = `rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`;
            colors.set(node.name || node.id, color);
          }
        }
      }

      if (node.children) {
        node.children.forEach(traverse);
      }

      // Собираем фоновые цвета
      if (node.fills && node.fills.length > 0) {
        const fill = node.fills[0];
        if (fill.type === 'SOLID' && fill.color) {
          const color = `rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a || 1})`;
          colors.set(`bg-${node.name || node.id}`, color);
        }
      }
    }

    if (mainFrame) {
      traverse(mainFrame);
    }

    console.log('📊 Загружена структура дизайна:');
    console.log('- Страница:', page.name);
    console.log('- Основной фрейм:', mainFrame?.name);
    console.log('- Текстовых элементов:', textNodes.length);
    console.log('- Уникальных цветов:', colors.size);
    console.log('- Шрифтов:', Array.from(fonts));

    return {
      pages: file.document.children,
      mainFrame,
      textNodes,
      colors,
      fonts,
    };
  } catch (error) {
    console.error('❌ Ошибка загрузки структуры:', error);
    throw error;
  }
}

