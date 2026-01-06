/**
 * Пример интеграции Figma с фронтендом
 * 
 * ИНСТРУКЦИЯ:
 * 1. Получите Figma Personal Access Token: https://www.figma.com/settings/account#personal-access-tokens
 * 2. Получите File Key из URL вашего Figma файла
 * 3. Создайте файл .env в корне проекта с токеном
 * 4. Используйте этот сервис для получения данных из Figma
 */

// ============================================
// КОНФИГУРАЦИЯ - ЗАПОЛНИТЕ ЭТИ ЗНАЧЕНИЯ
// ============================================

// Вариант 1: Использовать переменные окружения (рекомендуется)
// В .env файле:
// FIGMA_ACCESS_TOKEN=figd_ваш_токен
// FIGMA_FILE_KEY=ваш_file_key

// Вариант 2: Для быстрого теста (только для разработки!)
const CONFIG = {
  // ⚠️ НЕ ИСПОЛЬЗУЙТЕ В ПРОДАКШЕНЕ! Токен будет виден всем
  accessToken: import.meta.env?.VITE_FIGMA_TOKEN || process.env?.REACT_APP_FIGMA_TOKEN || '',
  fileKey: import.meta.env?.VITE_FIGMA_FILE_KEY || process.env?.REACT_APP_FIGMA_FILE_KEY || ''
};

// ============================================
// FIGMA API SERVICE
// ============================================

class FigmaAPIService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error('Figma Access Token is required! Получите токен здесь: https://www.figma.com/settings/account#personal-access-tokens');
    }
    
    this.accessToken = accessToken;
    this.baseURL = 'https://api.figma.com/v1';
    this.headers = {
      'X-Figma-Token': accessToken,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить информацию о файле Figma
   * @param {string} fileKey - Ключ файла из URL
   * @returns {Promise<Object>} Информация о файле
   */
  async getFile(fileKey) {
    try {
      console.log(`📥 Загрузка файла Figma: ${fileKey}`);
      
      const response = await fetch(`${this.baseURL}/files/${fileKey}`, {
        method: 'GET',
        headers: this.headers
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
   * @param {string} fileKey - Ключ файла
   * @param {string|Array<string>} nodeIds - ID узла или массив ID
   * @returns {Promise<Object>}
   */
  async getNodes(fileKey, nodeIds) {
    const ids = Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds;
    
    try {
      const response = await fetch(
        `${this.baseURL}/files/${fileKey}/nodes?ids=${ids}`,
        { headers: this.headers }
      );

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
   * @param {string} fileKey - Ключ файла
   * @param {Array<string>} nodeIds - Массив ID узлов
   * @param {Object} options - Опции: { scale: 1-4, format: 'png'|'jpg'|'svg'|'pdf' }
   * @returns {Promise<Object>} Объект с URL изображений
   */
  async getImages(fileKey, nodeIds, options = {}) {
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
   * @param {string} fileKey - Ключ файла
   * @returns {Promise<Array>} Массив страниц
   */
  async getPages(fileKey) {
    const file = await this.getFile(fileKey);
    return file.document.children;
  }

  /**
   * Найти узел по имени (рекурсивный поиск)
   * @param {Object} node - Узел для поиска
   * @param {string} name - Имя для поиска
   * @returns {Object|null}
   */
  findNodeByName(node, name) {
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

// ============================================
// УТИЛИТЫ ДЛЯ ПРЕОБРАЗОВАНИЯ FIGMA → HTML/CSS
// ============================================

/**
 * Преобразует цвет Figma (0-1) в CSS цвет
 */
function figmaColorToCSS(color, opacity = 1) {
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
function figmaNodeToHTML(node) {
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
    if (fill.type === 'SOLID') {
      element.style.backgroundColor = figmaColorToCSS(fill.color);
    } else if (fill.type === 'IMAGE' && fill.imageRef) {
      // Для изображений нужно получить URL через getImages
      element.style.backgroundImage = `url(${fill.imageRef})`;
      element.style.backgroundSize = 'cover';
    }
  }

  // Обводка
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0];
    if (stroke.type === 'SOLID') {
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
      element.style.fontFamily = node.style.fontFamily;
      element.style.fontWeight = node.style.fontWeight || 'normal';
      element.style.lineHeight = node.style.lineHeightPx ? `${node.style.lineHeightPx}px` : 'normal';
      if (node.fills && node.fills[0]) {
        element.style.color = figmaColorToCSS(node.fills[0].color);
      }
    }
  }

  // Рекурсивно обрабатываем дочерние элементы
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => {
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
function figmaPageToHTML(pageNode) {
  const container = document.createElement('div');
  container.className = 'figma-page';
  container.setAttribute('data-page-name', pageNode.name);
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.minHeight = '100vh';

  if (pageNode.children) {
    pageNode.children.forEach(child => {
      const element = figmaNodeToHTML(child);
      if (element) {
        container.appendChild(element);
      }
    });
  }

  return container;
}

// ============================================
// ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================

/**
 * Пример: Загрузить дизайн из Figma и отобразить на странице
 */
async function loadFigmaDesign(fileKey, pageName = null, containerId = 'figma-container') {
  try {
    // Проверяем токен
    if (!CONFIG.accessToken) {
      throw new Error(`
        ❌ Figma токен не найден!
        
        Получите токен здесь: https://www.figma.com/settings/account#personal-access-tokens
        
        Затем создайте файл .env в корне проекта:
        VITE_FIGMA_TOKEN=figd_ваш_токен
        VITE_FIGMA_FILE_KEY=ваш_file_key
      `);
    }

    // Создаем сервис
    const figmaService = new FigmaAPIService(CONFIG.accessToken);

    // Получаем файл
    const file = await figmaService.getFile(fileKey || CONFIG.fileKey);
    
    // Находим страницу
    let page = null;
    if (pageName) {
      page = file.document.children.find(p => p.name === pageName);
      if (!page) {
        console.warn(`⚠️ Страница "${pageName}" не найдена. Используется первая страница.`);
        page = file.document.children[0];
      }
    } else {
      page = file.document.children[0];
    }

    console.log(`📄 Загружаем страницу: ${page.name}`);

    // Преобразуем в HTML
    const htmlContainer = figmaPageToHTML(page);

    // Вставляем в DOM
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Контейнер с id="${containerId}" не найден!`);
    }

    container.innerHTML = '';
    container.appendChild(htmlContainer);

    console.log('✅ Дизайн успешно загружен!');

    return {
      file,
      page,
      htmlContainer
    };

  } catch (error) {
    console.error('❌ Ошибка загрузки дизайна:', error);
    throw error;
  }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FigmaAPIService,
    figmaNodeToHTML,
    figmaPageToHTML,
    figmaColorToCSS,
    loadFigmaDesign,
    CONFIG
  };
}

// Для использования в браузере
if (typeof window !== 'undefined') {
  window.FigmaIntegration = {
    FigmaAPIService,
    figmaNodeToHTML,
    figmaPageToHTML,
    figmaColorToCSS,
    loadFigmaDesign,
    CONFIG
  };
}

