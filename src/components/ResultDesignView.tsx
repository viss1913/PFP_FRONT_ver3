import React, { useEffect, useState } from 'react';
import { loadDesignStructure } from '../utils/loadFigmaDesignStructure';
import { FigmaDesignRenderer } from './FigmaDesignRenderer';
import '../utils/viewFigmaStructure'; // Импортируем для доступа к функции в консоли

interface ResultDesignViewProps {
  calculationData: any;
  fileKey: string;
  accessToken: string;
}

/**
 * Компонент для отображения результатов расчета по дизайну из Figma
 * Вместо загрузки через API, здесь делается верстка React компонентами
 */
const ResultDesignView: React.FC<ResultDesignViewProps> = ({
  calculationData,
  fileKey,
  accessToken,
}) => {
  const [loading, setLoading] = useState(true);
  const [designStructure, setDesignStructure] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStructure = async () => {
      try {
        setLoading(true);
        // Загружаем полную структуру дизайна из Figma
        const designData = await loadDesignStructure();
        setDesignStructure(designData);
        setLoading(false);
      } catch (err: any) {
        console.error('Ошибка загрузки структуры дизайна:', err);
        setError(err.message || 'Ошибка загрузки дизайна');
        setLoading(false);
      }
    };

    if (fileKey && accessToken) {
      loadStructure();
    }
  }, [fileKey, accessToken]);

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
        Загрузка структуры дизайна...
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
        <strong>Ошибка:</strong> {error}
      </div>
    );
  }

  // Рендерим дизайн из Figma
  return (
    <div style={{ width: '100%' }}>
      {/* Показываем информацию для отладки (можно скрыть позже) */}
      {designStructure && (
        <details style={{ marginBottom: '24px' }}>
          <summary
            style={{
              cursor: 'pointer',
              padding: '12px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            🔍 Показать информацию о дизайне (для отладки)
          </summary>
          <div
            style={{
              marginTop: '12px',
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Текстовых элементов: {designStructure.textNodes?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Основной фрейм: {designStructure.mainFrame?.name || 'не найден'}
            </div>
          </div>
        </details>
      )}

      {/* Рендерим дизайн из Figma */}
      {designStructure?.mainFrame ? (
        <div style={{ width: '100%', overflow: 'auto' }}>
          <FigmaDesignRenderer
            frame={designStructure.mainFrame}
            calculationData={calculationData}
            colors={designStructure.colors || new Map()}
          />
        </div>
      ) : (
        // Fallback: используем шаблон, если дизайн не загружен
        <ResultDesignTemplate calculationData={calculationData} designStructure={designStructure} />
      )}
    </div>
  );
};

/**
 * Компонент для отображения результатов расчета по дизайну из Figma
 * Использует структуру дизайна для точной верстки
 */
const ResultDesignTemplate: React.FC<{ 
  calculationData: any;
  designStructure: any;
}> = ({ calculationData, designStructure }) => {
  // Извлекаем данные для отображения
  const client = calculationData?.client || {};
  const goals = calculationData?.goals || [];
  const plans = calculationData?.plans || [];
  const financialPlan = calculationData?.financial_plan || calculationData;

  // Используем структуру дизайна для извлечения стилей и макета
  const textNodes = designStructure?.textNodes || [];
  const colors = designStructure?.colors || new Map();
  const mainFrame = designStructure?.mainFrame;

  // Показываем информацию о дизайне для отладки
  console.log('🎨 Структура дизайна загружена:', {
    textNodes: textNodes.length,
    colors: colors.size,
    mainFrame: mainFrame?.name,
  });

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '40px',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'var(--text-main)',
            marginBottom: '12px',
          }}
        >
          Персональный финансовый план
        </h1>
        {client.first_name && (
          <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>
            {client.first_name} {client.last_name}
          </p>
        )}
      </div>

      {/* Цели */}
      {goals.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '24px',
              color: 'var(--text-main)',
            }}
          >
            Ваши цели
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {goals.map((goal: any, index: number) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                  {goal.name}
                </div>
                {goal.target_amount && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Целевая сумма: {goal.target_amount.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Планы */}
      {plans.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '24px',
              color: 'var(--text-main)',
            }}
          >
            Рекомендации
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {plans.map((plan: any, index: number) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: 'rgba(255, 199, 80, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 199, 80, 0.3)',
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>
                  {plan.goal_name || `План ${index + 1}`}
                </div>
                {plan.monthly_payment && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    Ежемесячный платеж: {plan.monthly_payment.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDesignView;

