import React from 'react';

import { X, Plus } from 'lucide-react';
import { getGoalImage } from '../utils/GoalImages';

interface ResultPageDesignProps {
  calculationData: any;
  onAddGoal?: () => void;
  onGoToReport?: () => void;
}

interface GoalResult {
  id: number;
  name: string;
  targetAmount: number;
  initialCapital: number;
  monthlyPayment: number;
  termMonths: number;
  goalType?: string;
  // Specific fields for specialized cards
  annualPremium?: number;
  risks?: string[];
}

/**
 * Компонент страницы результатов точно по дизайну из Figma
 * Дизайн: https://www.figma.com/design/HIc2F0OeTuvafJNSTKMm3E/Фронт
 */
const ResultPageDesign: React.FC<ResultPageDesignProps> = ({
  calculationData,
  onAddGoal,
  onGoToReport,
}) => {
  // Access data from the nested 'calculation' object if it exists, otherwise fallback to top-level or empty
  const calcRoot = calculationData?.calculation || calculationData || {};
  const calculatedGoals = calcRoot.goals || [];

  // Tax Benefits Summary (New logic)
  const taxBenefitsSummary = calculationData?.summary?.tax_benefits_summary || calcRoot?.summary?.tax_benefits_summary;
  // Fallback to legacy structure if needed, but prioritize new summary
  const taxPlanningLegacy = calculationData?.tax_planning || calcRoot.tax_planning;

  // Helper to get total deduction
  const taxTotalDeduction = taxBenefitsSummary?.totals?.total_deductions || taxPlanningLegacy?.total_deductions || 0;
  const taxMonthlyPayment = taxPlanningLegacy?.monthly_payments || 0; // Legacy or calculated elsewhere?
  // User request: "Вычеты в 2027", "Софинансирование в 2027", "Всего вычета", "Всего софинансирование".
  // Let's use 2026 as per Example JSON, or dynamic next year.
  // "totals": { "deduction_2026": ... }
  // "pds_benefits": { "total_cofinancing": ... }
  const taxDeduction2026 = taxBenefitsSummary?.totals?.deduction_2026 || 0;
  const totalCofinancing = taxBenefitsSummary?.pds_benefits?.total_cofinancing || 0;
  // Note: "Софинансирование в 2027" - API returns total cofinancing. Let's show Total or Annual?
  // JSON: "deduction_2026": 0, "total_deductions": 0, "total_cofinancing": 0 for PDS
  // User Prompt: 
  // "Вычеты в 2027 - сумма" -> deduction_2026 (assuming +1 year)
  // "Софинаиснрование в 2027 - сумма" -> Maybe cofinancing_2026? But API only shows total_cofinancing in summary PDS. 
  // Let's use total for now or whatever is available.


  // Мапим результаты расчетов на карточки
  const goalCards: GoalResult[] = calculatedGoals.map((goalResult: any) => {
    const summary = goalResult?.summary || {};
    const details = goalResult?.details || {};

    // Determine Cost (Target Amount) logic
    // For Passive Income, cost is usually the capital required.
    // For others, it's the target amount.
    // Logic: If 'target_capital_required' exists (Passive Income), use it. Else use 'target_amount'.
    const cost = details.target_capital_required !== undefined
      ? details.target_capital_required
      : (details.target_amount || summary.target_amount || 0);

    return {
      id: goalResult?.goal_id || 0,
      name: goalResult?.goal_name || 'Цель',
      targetAmount: cost,
      initialCapital: summary?.initial_capital || 0,
      monthlyPayment: summary?.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0),
      termMonths: details?.term_months || summary?.term_months || 0,
      goalType: goalResult?.goal_type,
      // Life Goal Specifics
      annualPremium: details?.annual_premium || details?.annualPremium || summary?.annual_premium || summary?.annualPremium || 0,
      risks: details?.risks || [], // Assuming risks might be in details
    };
  });

  // Форматирование чисел
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + '₽';
  };

  const formatMonths = (months: number) => {
    return `${months} мес.`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
      {/* Верхняя навигация */}
      {/* Верхняя навигация - REMOVED (using global Header in App.tsx) */}


      {/* Основной контент */}
      <div style={{ display: 'flex', maxWidth: '1440px', margin: '0 auto', padding: '40px', gap: '40px' }}>

        {/* Левая боковая панель */}
        <aside style={{ width: '300px', flexShrink: 0 }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.05), 0px 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <div style={{ marginTop: '2px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#E5E7EB'
                }}>
                  {/* Placeholder for Avatar */}
                  <img src="https://ui-avatars.com/api/?name=AI&background=random" alt="AI" style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '14px', lineHeight: '20px', color: '#374151', margin: 0 }}>
                  Это ваш финансовый план.<br />
                  Если что-то не понятно,<br />
                  то спрашивайте — я вам помогу.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '500', color: '#9CA3AF', marginBottom: '12px', textTransform: 'uppercase' }}>
                Часто задаваемые вопросы
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Какие риски?', 'Какие риски?', 'Какие риски?', 'Какие риски?', 'Какие риски?'].map((q, i) => (
                  <button
                    key={i}
                    style={{
                      padding: '8px 16px',
                      background: '#F3F4F6',
                      border: 'none',
                      borderRadius: '100px',
                      color: '#4B5563',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      flex: i === 4 ? '1 1 100%' : '1 1 auto', // Make the last button span full width if needed or just fit
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#C2185B',
                color: '#fff',
                border: 'none',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Задать вопрос
            </button>
          </div>
        </aside>

        {/* Сетка целей */}
        <main style={{ flex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}>
            {/* Карточки целей */}
            {goalCards.map((goal: GoalResult, _index: number) => {

              // Get image for the goal
              // We need goal_type_id. Let's try to get it from the result if available, or fallback.
              // The API response for calculation might strictly not have goal_type_id at the top level of goal result?
              // Let's assume goalResult has it or we infer it.
              // Taking a safe bet: if goalType is a string name, we might not match IDs well.
              // But getGoalImage can also take a Name.

              const imageSrc = getGoalImage(goal.name, 0); // Passing 0 as ID if unknown, relies on Name match first.

              return (
                <div
                  key={goal.id}
                  style={{
                    // Use image as background with a dark gradient overlay for text readability
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url(${imageSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '24px',
                    padding: '32px',
                    color: '#fff',
                    position: 'relative',
                    minHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden'
                  }}
                >
                  {/* Decorative circle/image placeholder - REMOVED as we have real image now */}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{goal.name}</h3>
                    <button
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        flexShrink: 0,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', position: 'relative', zIndex: 1 }}>
                    {goal.id === 5 ? (
                      // Custom layout for Life Insurance (ID 5)
                      <>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Лимит (Сумма по риску)</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatCurrency(goal.targetAmount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Годовая премия</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {goal.annualPremium ? formatCurrency(goal.annualPremium) : '-'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Срок</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{Math.round(goal.termMonths / 12)} лет</div>
                        </div>
                        {/* Risks? */}
                      </>
                    ) : (
                      // Standard Layout
                      <>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Стоимость цели</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatCurrency(goal.targetAmount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Первоначальный капитал</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatCurrency(goal.initialCapital)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Ежемесячное пополнение</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatCurrency(goal.monthlyPayment)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Срок достижения</div>
                          <div style={{ fontSize: '18px', fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{formatMonths(goal.termMonths)}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );

            })}

            {/* Карточка Налоговое планирование. Show if data exists OR if there are goals (placeholder mode) */}
            {(taxBenefitsSummary || taxPlanningLegacy || calculatedGoals.length > 0) && (
              <div
                style={{
                  background: 'linear-gradient(108.52deg, #C2185B 0%, #E91E63 100%)',
                  borderRadius: '24px',
                  padding: '32px',
                  color: '#fff',
                  position: 'relative',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0, lineHeight: '1.2' }}>Налоговое<br />планирование</h3>
                  <button
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                  {(taxBenefitsSummary) ? (
                    // New Tax Summary Layout
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Вычеты в 2026:</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxDeduction2026)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Итого вычетов:</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxTotalDeduction)}</div>
                      </div>
                      {totalCofinancing > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.9 }}>Всего софинансирования:</div>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(totalCofinancing)}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Legacy Layout
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Всего вычетов:</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxTotalDeduction)}</div>
                      </div>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9, maxWidth: '150px' }}>Всего выплат в месяц за детей</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxMonthlyPayment)}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Placeholder для добавления цели */}
            <button
              onClick={onAddGoal}
              style={{
                borderRadius: '24px',
                border: '2px dashed #E5E7EB',
                background: '#F9FAFB',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C2185B';
                e.currentTarget.style.background = '#FFF0F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = '#F9FAFB';
              }}
            >
              <Plus size={32} color="#C2185B" />
              <span style={{ color: '#C2185B', fontSize: '16px', fontWeight: '500' }}>+ Добавить цель</span>
            </button>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onGoToReport}
              style={{
                background: '#C2185B',
                color: '#fff',
                border: 'none',
                borderRadius: '100px',
                padding: '16px 48px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0px 4px 6px -1px rgba(194, 24, 91, 0.4)',
                transition: 'transform 0.1s',
                maxWidth: '300px',
                width: '100%'
              }}
            >
              Перейти в отчет
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResultPageDesign;
