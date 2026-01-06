import React from 'react';
import { figmaColorToCSS } from '../services/figmaService';

interface FigmaDesignRendererProps {
  frame: any;
  calculationData: any;
  colors: Map<string, string>;
  depth?: number;
}

/**
 * Компонент, который рендерит элементы из Figma с сохранением структуры и стилей
 */
export const FigmaDesignRenderer: React.FC<FigmaDesignRendererProps> = ({
  frame,
  calculationData,
  colors,
  depth = 0,
}) => {
  if (!frame) return null;

  // Извлекаем стили из Figma узла
  const getStyles = (node: any): React.CSSProperties => {
    const styles: React.CSSProperties = {};

    // Размеры и позиция
    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      if (width) styles.width = `${width}px`;
      if (height) styles.height = `${height}px`;
    }

    // Фон
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.backgroundColor = figmaColorToCSS(fill.color);
      }
    }

    // Скругление углов
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }

    // Обводка
    if (node.strokes && node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        styles.border = `${node.strokeWeight || 1}px solid ${figmaColorToCSS(stroke.color)}`;
      }
    }

    // Layout свойства
    if (node.layoutMode === 'HORIZONTAL') {
      styles.display = 'flex';
      styles.flexDirection = 'row';
    } else if (node.layoutMode === 'VERTICAL') {
      styles.display = 'flex';
      styles.flexDirection = 'column';
    }

    if (node.paddingLeft) styles.paddingLeft = `${node.paddingLeft}px`;
    if (node.paddingRight) styles.paddingRight = `${node.paddingRight}px`;
    if (node.paddingTop) styles.paddingTop = `${node.paddingTop}px`;
    if (node.paddingBottom) styles.paddingBottom = `${node.paddingBottom}px`;

    if (node.gap) {
      styles.gap = `${node.gap}px`;
    }

    return styles;
  };

  // Обрабатываем текстовый узел
  if (frame.type === 'TEXT' && frame.characters) {
    const textStyles: React.CSSProperties = {
      ...getStyles(frame),
      position: 'relative',
    };

    // Стили текста
    if (frame.style) {
      if (frame.style.fontSize) textStyles.fontSize = `${frame.style.fontSize}px`;
      if (frame.style.fontFamily) textStyles.fontFamily = frame.style.fontFamily;
      if (frame.style.fontWeight) textStyles.fontWeight = frame.style.fontWeight.toString();
      if (frame.style.lineHeightPx) textStyles.lineHeight = `${frame.style.lineHeightPx}px`;
    }

    // Подстановка данных из calculationData
    let text = frame.characters;
    
    // Заменяем плейсхолдеры в формате {{путь.к.данным}}
    text = text.replace(/\{\{([^}]+)\}\}/g, (match: string, path: string) => {
      const keys = path.trim().split('.');
      let value: any = calculationData;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else if (Array.isArray(value)) {
          const index = parseInt(key);
          if (!isNaN(index) && value[index]) {
            value = value[index];
          } else {
            return match;
          }
        } else {
          return match;
        }
      }

      // Форматирование
      if (typeof value === 'number') {
        if (path.toLowerCase().includes('percent') || path.toLowerCase().includes('rate')) {
          return `${value.toFixed(1)}%`;
        }
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0,
        }).format(value);
      }

      return String(value || '—');
    });

    return (
      <div style={textStyles} data-figma-id={frame.id} data-figma-name={frame.name}>
        {text}
      </div>
    );
  }

  // Обрабатываем контейнер/фрейм
  const containerStyles: React.CSSProperties = {
    ...getStyles(frame),
    position: 'relative',
  };

  // Рендерим дочерние элементы
  const children = frame.children?.map((child: any, index: number) => (
    <FigmaDesignRenderer
      key={child.id || index}
      frame={child}
      calculationData={calculationData}
      colors={colors}
      depth={depth + 1}
    />
  ));

  // Определяем тег по типу
  const Tag = frame.type === 'FRAME' || frame.type === 'GROUP' ? 'div' : 'div';

  return (
    <Tag style={containerStyles} data-figma-id={frame.id} data-figma-name={frame.name}>
      {children}
    </Tag>
  );
};

