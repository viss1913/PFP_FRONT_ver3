/**
 * Сервис для интеграции Figma с фронтендом
 * Адаптировано для TypeScript/React
 */

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

interface FigmaFill {
  type: 'SOLID' | 'IMAGE' | 'GRADIENT';
  color?: FigmaColor;
  imageRef?: string;
}

interface FigmaStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  lineHeightPx?: number;
}

interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: FigmaBoundingBox;
  fills?: FigmaFill[];
  strokes?: FigmaFill[];
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: FigmaStyle;
}

interface FigmaPage extends FigmaNode {
  type: 'CANVAS';
}

interface FigmaFile {
  document: {
    name: string;
    children: FigmaPage[];
  };
}

interface GetImagesOptions {
  scale?: number;
  format?: 'png' | 'jpg' | 'svg' | 'pdf';
}

export class FigmaAPIService {
  private accessToken: string;
  private baseURL = 'https://api.figma.com/v1';
  private headers: Record<string, string>;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error(
        'Figma Access Token is required! Получите токен здесь: https://www.figma.com/settings/account#personal-access-tokens'
      );
    }

    this.accessToken = accessToken;
    this.headers = {
      'X-Figma-Token': accessToken,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Получить информацию о файле Figma
   */
  async getFile(fileKey: string): Promise<FigmaFile> {
    try {
      console.log(`📥 Загрузка файла Figma: ${fileKey}`);

      const response = await fetch(`${this.baseURL}/files/${fileKey}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Figma API Error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Файл загружен:', data.document.name);
      return data;
    } catch (error) {
      console.error('❌ Ошибка при загрузке файла:', error);
      throw error;
    }
  }

  /**
   * Получить информацию о конкретных узлах
   */
  async getNodes(fileKey: string, nodeIds: string | string[]): Promise<any> {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;

    try {
      const response = await fetch(`${this.baseURL}/files/${fileKey}/nodes?ids=${ids}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Figma API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Ошибка при получении узлов:', error);
      throw error;
    }
  }

  /**
   * Получить изображения узлов
   */
  async getImages(
    fileKey: string,
    nodeIds: string[],
    options: GetImagesOptions = {}
  ): Promise<Record<string, string>> {
    const { scale = 2, format = 'png' } = options;
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;

    try {
      const url = `${this.baseURL}/images/${fileKey}?ids=${ids}&scale=${scale}&format=${format}`;
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Figma API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.images; // Объект { nodeId: imageUrl }
    } catch (error) {
      console.error('❌ Ошибка при получении изображений:', error);
      throw error;
    }
  }

  /**
   * Получить все страницы документа
   */
  async getPages(fileKey: string): Promise<FigmaPage[]> {
    const file = await this.getFile(fileKey);
    return file.document.children;
  }

  /**
   * Найти узел по имени (рекурсивный поиск)
   */
  findNodeByName(node: FigmaNode, name: string): FigmaNode | null {
    if (node.name === name) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeByName(child, name);
        if (found) return found;
      }
    }

    return null;
  }
}

/**
 * Преобразует цвет Figma (0-1) в CSS цвет
 */
export function figmaColorToCSS(color: FigmaColor | undefined, opacity = 1): string {
  if (!color) return 'transparent';

  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : opacity;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Преобразует узел Figma в HTML элемент
 */
export function figmaNodeToHTML(node: FigmaNode | null): HTMLElement | null {
  if (!node) return null;

  const element = document.createElement('div');
  element.className = `figma-${node.type.toLowerCase()}`;
  element.setAttribute('data-figma-id', node.id);
  element.setAttribute('data-figma-name', node.name || '');

  // Позиция и размеры
  if (node.absoluteBoundingBox) {
    const { x, y, width, height } = node.absoluteBoundingBox;
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
  }

  // Фон
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0];
    if (fill.type === 'SOLID' && fill.color) {
      element.style.backgroundColor = figmaColorToCSS(fill.color);
    } else if (fill.type === 'IMAGE' && fill.imageRef) {
      element.style.backgroundImage = `url(${fill.imageRef})`;
      element.style.backgroundSize = 'cover';
    }
  }

  // Обводка
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === 'SOLID' && stroke.color) {
      element.style.border = `${node.strokeWeight || 1}px solid ${figmaColorToCSS(stroke.color)}`;
    }
  }

  // Скругление углов
  if (node.cornerRadius) {
    element.style.borderRadius = `${node.cornerRadius}px`;
  }

  // Текст
  if (node.type === 'TEXT' && node.characters) {
    element.textContent = node.characters;
    if (node.style) {
      element.style.fontSize = `${node.style.fontSize}px`;
      element.style.fontFamily = node.style.fontFamily || 'inherit';
      element.style.fontWeight = (node.style.fontWeight || 'normal').toString();
      element.style.lineHeight = node.style.lineHeightPx ? `${node.style.lineHeightPx}px` : 'normal';
      if (node.fills && node.fills[0] && node.fills[0].color) {
        element.style.color = figmaColorToCSS(node.fills[0].color);
      }
    }
  }

  // Рекурсивно обрабатываем дочерние элементы
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      const childElement = figmaNodeToHTML(child);
      if (childElement) {
        element.appendChild(childElement);
      }
    });
  }

  return element;
}

/**
 * Преобразует страницу Figma в HTML контейнер
 */
export function figmaPageToHTML(pageNode: FigmaPage): HTMLElement {
  const container = document.createElement('div');
  container.className = 'figma-page';
  container.setAttribute('data-page-name', pageNode.name);
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.minHeight = '100vh';

  if (pageNode.children) {
    pageNode.children.forEach((child) => {
      const element = figmaNodeToHTML(child);
      if (element) {
        container.appendChild(element);
      }
    });
  }

  return container;
}

/**
 * Загрузить дизайн из Figma и вернуть HTML
 */
export async function loadFigmaDesign(
  fileKey: string,
  pageName: string | null = null,
  accessToken: string
): Promise<{ file: FigmaFile; page: FigmaPage; htmlContainer: HTMLElement }> {
  try {
    if (!accessToken) {
      throw new Error(
        `❌ Figma токен не найден!
        
        Получите токен здесь: https://www.figma.com/settings/account#personal-access-tokens`
      );
    }

    // Создаем сервис
    const figmaService = new FigmaAPIService(accessToken);

    // Получаем файл
    const file = await figmaService.getFile(fileKey);

    // Находим страницу
    let page: FigmaPage | null = null;
    if (pageName) {
      page = file.document.children.find((p) => p.name === pageName) || null;
      if (!page) {
        console.warn(`⚠️ Страница "${pageName}" не найдена. Используется первая страница.`);
        page = file.document.children[0];
      }
    } else {
      page = file.document.children[0];
    }

    if (!page) {
      throw new Error('Не найдено ни одной страницы в файле Figma');
    }

    console.log(`📄 Загружаем страницу: ${page.name}`);

    // Преобразуем в HTML
    const htmlContainer = figmaPageToHTML(page);

    console.log('✅ Дизайн успешно загружен!');

    return {
      file,
      page,
      htmlContainer,
    };
  } catch (error) {
    console.error('❌ Ошибка загрузки дизайна:', error);
    throw error;
  }
}

