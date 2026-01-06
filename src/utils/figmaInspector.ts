/**
 * Утилита для анализа структуры дизайна из Figma
 * Помогает понять структуру и создать правильную верстку
 */
import { FigmaAPIService } from '../services/figmaService';

export interface DesignStructure {
  pages: Array<{
    name: string;
    id: string;
    frames: Array<{
      name: string;
      id: string;
      type: string;
      children?: any[];
    }>;
  }>;
}

/**
 * Получить структуру дизайна для анализа
 */
export async function inspectFigmaDesign(
  fileKey: string,
  accessToken: string
): Promise<{ structure: any; file: any }> {
  const service = new FigmaAPIService(accessToken);
  const file = await service.getFile(fileKey);

  // Извлекаем структуру страниц и фреймов
  const structure = {
    documentName: file.document.name,
    pages: file.document.children.map((page: any) => ({
      name: page.name,
      id: page.id,
      frames: page.children || [],
    })),
  };

  console.log('📊 Структура дизайна Figma:', JSON.stringify(structure, null, 2));

  return { structure, file };
}

/**
 * Найти все текстовые элементы в дизайне для понимания, какие данные нужно подставлять
 */
export function findTextNodes(node: any, result: any[] = []): any[] {
  if (node.type === 'TEXT' && node.characters) {
    result.push({
      name: node.name,
      id: node.id,
      text: node.characters,
      style: node.style,
    });
  }

  if (node.children) {
    node.children.forEach((child: any) => findTextNodes(child, result));
  }

  return result;
}

