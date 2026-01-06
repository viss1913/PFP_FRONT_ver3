import React, { useEffect, useRef, useState } from 'react';
import { loadFigmaDesign, FigmaAPIService } from '../services/figmaService';

interface FigmaResultDesignProps {
  fileKey: string;
  accessToken: string;
  pageName?: string;
  calculationData?: any;
}

/**
 * Компонент для отображения Figma дизайна с подстановкой данных расчета
 */
const FigmaResultDesign: React.FC<FigmaResultDesignProps> = ({
  fileKey,
  accessToken,
  pageName = null,
  calculationData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDesign = async () => {
      if (!containerRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Загружаем дизайн из Figma
        const { htmlContainer } = await loadFigmaDesign(fileKey, pageName, accessToken);

        // Вставляем HTML в контейнер
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(htmlContainer);

        // Подставляем данные из расчета
        if (calculationData) {
          replacePlaceholders(containerRef.current, calculationData);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Ошибка загрузки Figma дизайна:', err);
        setError(err.message || 'Ошибка загрузки дизайна');
        setLoading(false);
      }
    };

    loadDesign();
  }, [fileKey, pageName, accessToken, calculationData]);

  /**
   * Заменяет плейсхолдеры в тексте на данные из расчета
   */
  const replacePlaceholders = (element: HTMLElement, data: any) => {
    // Функция для форматирования чисел
    const formatNumber = (num: number | undefined): string => {
      if (num === undefined || num === null) return '—';
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    // Функция для форматирования процентов
    const formatPercent = (num: number | undefined): string => {
      if (num === undefined || num === null) return '—';
      return `${num.toFixed(1)}%`;
    };

    // Рекурсивно обходим все элементы
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || '';
        const originalText = text;

        // Заменяем плейсхолдеры в формате {{путь.к.данным}}
        text = text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
          const keys = path.trim().split('.');
          let value: any = data;

          for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
              value = value[key];
            } else {
              return match; // Не найдено - возвращаем оригинал
            }
          }

          // Форматирование в зависимости от типа данных
          if (typeof value === 'number') {
            // Проверяем, нужно ли форматировать как валюту или процент
            if (path.toLowerCase().includes('percent') || path.toLowerCase().includes('rate')) {
              return formatPercent(value);
            } else if (
              path.toLowerCase().includes('amount') ||
              path.toLowerCase().includes('income') ||
              path.toLowerCase().includes('capital') ||
              path.toLowerCase().includes('sum') ||
              path.toLowerCase().includes('value') ||
              path.toLowerCase().includes('target')
            ) {
              return formatNumber(value);
            }
            return value.toLocaleString('ru-RU');
          }

          if (typeof value === 'string') {
            return value;
          }

          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }

          return String(value || '—');
        });

        if (text !== originalText) {
          node.textContent = text;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        // Обрабатываем атрибуты data-*
        Array.from(element.attributes).forEach((attr) => {
          if (attr.name.startsWith('data-')) {
            let value = attr.value;
            value = value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
              const keys = path.trim().split('.');
              let dataValue: any = data;

              for (const key of keys) {
                if (dataValue && typeof dataValue === 'object' && key in dataValue) {
                  dataValue = dataValue[key];
                } else {
                  return match;
                }
              }

              return String(dataValue || '—');
            });
            element.setAttribute(attr.name, value);
          }
        });

        // Рекурсивно обрабатываем дочерние элементы
        Array.from(node.childNodes).forEach(walk);
      }
    };

    walk(element);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          color: 'var(--text-muted)',
        }}
      >
        Загрузка дизайна из Figma...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          color: '#ef4444',
        }}
      >
        <strong>Ошибка загрузки дизайна:</strong> {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '400px',
      }}
    />
  );
};

export default FigmaResultDesign;

