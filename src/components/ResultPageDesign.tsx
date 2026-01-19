import React from 'react';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { getGoalImage, GOAL_GALLERY_ITEMS } from '../utils/GoalImages';
import { PortfolioDistribution } from './PortfolioDistribution';
import { formatMonthsToDate } from '../utils/dateUtils';

interface ResultPageDesignProps {
  calculationData: any;
  onAddGoal?: () => void;
  onGoToReport?: () => void;
  onRecalculate?: (payload: any) => void;
}

interface GoalField {
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  type: 'currency' | 'percent' | 'number' | 'select';
  options?: string[];
}

interface GoalTypeConfig {
  fields: GoalField[];
}

export interface GoalCardSlot {
  label: string;
  value: string;
}

interface GoalResult {
  id: number;
  name: string;
  // Fields for editing (keep existing logic for simple access in edit form)
  targetAmount: number;
  initialCapital: number;
  monthlyPayment: number;
  termMonths: number;

  goalType?: string;
  goalTypeId?: number;

  // New: Standardized display slots
  displaySlots: GoalCardSlot[];

  // Specific fields for specialized cards (legacy or specific use)
  totalPremium?: number; // unified premium
  risks?: any[];
  assets_allocation?: any[];
  originalData?: any; // Full goal result from backend
  targetMonthlyIncome?: number;
}

const GOAL_TYPE_CONFIGS: Record<number, GoalTypeConfig> = {
  1: { // PENSION
    fields: [
      { key: 'target_amount', label: 'Желаемый доход (р/мес)', min: 20000, max: 1000000, step: 5000, type: 'currency' },
      { key: 'initial_capital', label: 'Первоначальный капитал', min: 0, max: 50000000, step: 100000, type: 'currency' },
      { key: 'ops_capital', label: 'Капитал в ОПС (накопительная)', min: 0, max: 5000000, step: 10000, type: 'currency' },
      { key: 'ipk_current', label: 'Текущие баллы ИПК (СФР)', min: 0, max: 300, step: 1, type: 'number' },
      { key: 'inflation_rate', label: 'Инфляция (%)', min: 0, max: 20, step: 0.5, type: 'percent' },
      { key: 'risk_profile', label: 'Риск-профиль', type: 'select', options: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] },
    ]
  },
  2: { // PASSIVE_INCOME
    fields: [
      { key: 'target_amount', label: 'Желаемый доход', min: 10000, max: 2000000, step: 5000, type: 'currency' },
      { key: 'term_months', label: 'Срок накопления (мес)', min: 12, max: 600, step: 12, type: 'number' },
      { key: 'initial_capital', label: 'Стартовый капитал', min: 0, max: 100000000, step: 500000, type: 'currency' },
      { key: 'risk_profile', label: 'Риск-профиль', type: 'select', options: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] },
    ]
  },
  5: { // LIFE
    fields: [
      { key: 'target_amount', label: 'Страховая сумма', min: 500000, max: 100000000, step: 500000, type: 'currency' },
      { key: 'term_months', label: 'Срок программы (мес)', min: 60, max: 480, step: 12, type: 'number' },
    ]
  },
  4: { // OTHER
    fields: [
      { key: 'target_amount', label: 'Стоимость покупки', min: 100000, max: 200000000, step: 500000, type: 'currency' },
      { key: 'term_months', label: 'Срок до покупки (мес)', min: 1, max: 360, step: 1, type: 'number' },
      { key: 'initial_capital', label: 'Стартовый капитал', min: 0, max: 50000000, step: 100000, type: 'currency' },
      { key: 'inflation_rate', label: 'Инфляция объекта (%)', min: 0, max: 30, step: 1, type: 'percent' },
    ]
  },
  3: { // INVESTMENT
    fields: [
      { key: 'term_months', label: 'Срок инвестирования (мес)', min: 12, max: 600, step: 12, type: 'number' },
      { key: 'initial_capital', label: 'Стартовый капитал', min: 0, max: 100000000, step: 1000000, type: 'currency' },
      { key: 'risk_profile', label: 'Риск-профиль', type: 'select', options: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] },
    ]
  }
};

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  format?: (val: number) => string;
}

const SliderField: React.FC<SliderFieldProps> = ({ label, value, min, max, step, onChange, format }: SliderFieldProps) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <label style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>{label}</label>
        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary)' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${(value - min) / (max - min) * 100}%, #eee ${(value - min) / (max - min) * 100}%, #eee 100%)`,
          borderRadius: '3px',
          appearance: 'none',
          outline: 'none',
          cursor: 'pointer'
        }}
        className="custom-slider"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#999' }}>
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
      <style>{`
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: #fff;
          border: 3px solid var(--primary);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.1s;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

interface EditFormState {
  name: string;
  target_amount: number;
  term_months: number;
  initial_capital: number;
  ops_capital?: number;
  ipk_current?: number;
  risk_profile?: string;
  inflation_rate?: number;
  [key: string]: any;
}

const ResultPageDesign: React.FC<ResultPageDesignProps> = ({
  calculationData,
  onAddGoal,
  onGoToReport,
  onRecalculate,
}: ResultPageDesignProps) => {
  const [editingGoal, setEditingGoal] = React.useState<GoalResult | null>(null);
  const [editForm, setEditForm] = React.useState<EditFormState>({
    name: '',
    target_amount: 0,
    term_months: 0,
    initial_capital: 0
  });

  const handleEditGoal = (goal: GoalResult) => {
    setEditingGoal(goal);

    // Initialize form with existing values
    const initialForm: EditFormState = {
      name: goal.name,
      target_amount: goal.targetAmount,
      term_months: goal.termMonths,
      initial_capital: goal.initialCapital,
    };

    // Pull other fields from originalData if available
    const details = goal.originalData?.details || {};
    const summary = goal.originalData?.summary || {};

    initialForm.ops_capital = details.ops_capital || 0;
    initialForm.ipk_current = details.ipk_current || 0;
    initialForm.risk_profile = details.risk_profile || summary.risk_profile || 'BALANCED';
    initialForm.inflation_rate = details.inflation_rate || 0;

    setEditForm(initialForm);
  };

  const onSubmitEdit = () => {
    if (!onRecalculate || !editingGoal) return;

    const updatedGoals = calculatedGoals.map((g: any) => {
      if (g.goal_id === editingGoal.id) {
        return {
          ...g,
          ...editForm,
          // Map snake_case to whatever backend expect if different, 
          // but FRONTEND_GOAL_CONFIG.md suggests these exact names.
          goal_type_id: g.goal_type_id, // Ensure we keep the ID
        };
      }
      return g;
    });

    onRecalculate({ goals: updatedGoals });
    setEditingGoal(null);
  };

  // Access data from the nested 'calculation' object if it exists, otherwise fallback to top-level or empty
  const calcRoot = calculationData?.calculation || calculationData || {};
  const calculatedGoals = calcRoot.goals || [];

  // Extract Allocations
  // New structure: calculationData.summary.consolidated_portfolio
  const consolidatedPortfolio = calculationData?.summary?.consolidated_portfolio || calcRoot?.summary?.consolidated_portfolio;

  const assetsAllocation = consolidatedPortfolio?.assets_allocation || calculationData?.assets_allocation || calcRoot?.assets_allocation || [];

  // Normalization for Cash Flow: convert annual to monthly
  const rawCashFlow = consolidatedPortfolio?.cash_flow_allocation || calculationData?.cash_flow_allocation || calcRoot?.cash_flow_allocation || [];
  const cashFlowAllocation = rawCashFlow.map((item: { payment_frequency?: string; amount: number; name: string }) => {
    if (item.payment_frequency === 'annual') {
      return {
        ...item,
        amount: Math.round(item.amount / 12),
        name: `${item.name} (общ. ${new Intl.NumberFormat('ru-RU', { compactDisplay: 'short', notation: 'compact' }).format(item.amount)})`
      };
    }
    return item;
  });

  // Tax Benefits Summary (New logic)
  const taxBenefitsSummary = (calculationData?.summary?.tax_benefits_summary || calcRoot?.summary?.tax_benefits_summary) as {
    totals?: {
      deduction_2026?: number;
      cofinancing_2026?: number;
      total_deductions?: number;
      total_cofinancing?: number;
    }
  } | undefined;
  // Fallback to legacy structure if needed, but prioritize new summary
  const taxPlanningLegacy = (calculationData?.tax_planning || calcRoot.tax_planning) as {
    total_deductions?: number;
    monthly_payments?: number;
  } | undefined;

  // "totals": { "deduction_2026": ..., "cofinancing_2026": ..., "total_deductions": ..., "total_cofinancing": ... }
  const taxDeduction2026 = taxBenefitsSummary?.totals?.deduction_2026 || 0;
  const taxCofinancing2026 = taxBenefitsSummary?.totals?.cofinancing_2026 || 0;
  const taxTotalDeduction = taxBenefitsSummary?.totals?.total_deductions || taxPlanningLegacy?.total_deductions || 0;
  const taxTotalCofinancing = taxBenefitsSummary?.totals?.total_cofinancing || 0;
  const taxMonthlyPayment = taxPlanningLegacy?.monthly_payments || 0;


  // Форматирование чисел
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + '₽';
  };

  // Мапим результаты расчетов на карточки
  const goalCards: GoalResult[] = (calculatedGoals as any[]).map((goalResult: any) => {
    const summary = goalResult?.summary || {};
    const details = goalResult?.details || {};
    const typeId = goalResult?.goal_type_id || 0;

    // Helper formatter
    const fmt = (val: number | undefined) => val !== undefined ? formatCurrency(val) : '0₽';
    const fmtDate = (months: number | undefined) => months ? formatMonthsToDate(months) : '-';

    // Standardized Slots Mapping
    let displaySlots: GoalCardSlot[] = [];

    switch (typeId) {
      case 1: // PENSION
      case 2: // PASSIVE_INCOME
        displaySlots = [
          { label: 'Желаемый доход', value: fmt(summary.target_amount_initial) },
          { label: 'Первонач. капитал', value: fmt(summary.initial_capital) },
          { label: 'Ежем. пополнение', value: fmt(summary.monthly_replenishment) },
          { label: 'Срок', value: fmtDate(summary.target_months) },
        ];
        break;
      case 3: // INVESTMENT
        displaySlots = [
          { label: 'Итоговый капитал', value: fmt(summary.projected_capital_at_end) },
          { label: 'Текущий капитал', value: fmt(summary.initial_capital) },
          { label: 'Ежем. пополнение', value: fmt(summary.monthly_replenishment) },
          { label: 'Срок', value: fmtDate(summary.target_months) },
        ];
        break;
      case 4: // OTHER
        displaySlots = [
          { label: 'Стоимость сегодня', value: fmt(summary.target_amount_initial) },
          { label: 'Первонач. капитал', value: fmt(summary.initial_capital) },
          { label: 'Ежем. пополнение', value: fmt(summary.monthly_replenishment) },
          { label: 'Срок', value: fmtDate(summary.target_months) },
        ];
        break;
      case 5: // LIFE
        displaySlots = [
          { label: 'Страховая сумма', value: fmt(summary.target_coverage) },
          { label: 'Взнос', value: fmt(summary.initial_capital) }, // Assuming premium is in initial_capital as per mapping, or fallback to summary.premium
          { label: 'Срок', value: fmtDate(summary.target_months) },
        ];
        break;
      case 7: // FIN_RESERVE
        displaySlots = [
          { label: 'Итоговый капитал', value: fmt(summary.projected_capital_at_end) },
          { label: 'Накоплено (Сейчас)', value: fmt(summary.initial_capital) },
          { label: 'Ежем. пополнение', value: fmt(summary.monthly_replenishment) },
          { label: 'Размер резерва', value: (summary.target_months || 0) + ' мес' }, // Specific case: Size of reserve
        ];
        break;
      case 8: // RENT
        displaySlots = [
          { label: 'Ежем. доход', value: fmt(summary.projected_monthly_income) },
          { label: 'Капитал', value: fmt(summary.initial_capital) },
        ];
        break;
      default:
        // Fallback for unknown types
        displaySlots = [
          { label: 'Цель', value: fmt(summary.target_amount || summary.target_amount_initial) },
          { label: 'Срок', value: fmtDate(summary.target_months) },
        ];
    }

    // Legacy/Edit fields population (best effort)
    const cost = details.target_capital_required !== undefined
      ? details.target_capital_required
      : (details.target_amount || summary.target_amount || summary.target_amount_initial || 0);

    // Determine name: use goal_name from API, or fallback to default title from Gallery items based on typeId
    const defaultTitle = GOAL_GALLERY_ITEMS.find(i => i.typeId === typeId)?.title;
    const displayName = goalResult.goal_name || defaultTitle || 'Цель';

    return {
      id: goalResult?.goal_id || 0,
      name: displayName,
      targetAmount: cost,
      initialCapital: summary?.initial_capital || 0,
      monthlyPayment: summary?.monthly_replenishment !== undefined ? summary.monthly_replenishment : (summary.monthly_payment || 0),
      termMonths: details?.term_months || summary?.term_months || 0,
      goalType: goalResult?.goal_type,
      goalTypeId: typeId,

      displaySlots, // <--- THE KEY

      risks: details?.risks || [],
      assets_allocation: summary?.assets_allocation || details?.portfolio?.instruments || [],
      originalData: goalResult
    };
  });





  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
      {/* Кнопка "Назад" */}
      <div style={{ padding: '24px 32px 0' }}>
        <button
          onClick={onAddGoal} // Using onAddGoal as a proxy for "restart/back" if not dedicated onBack, but let's check ResultPage props
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '8px 0',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#333')}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.color = '#666')}
        >
          <ArrowLeft size={20} />
          Назад к списку клиентов
        </button>
      </div>


      {/* Основной контент */}
      <div style={{ display: 'flex', maxWidth: '1440px', margin: '0 auto', padding: '40px', gap: '40px' }}>

        {/* Левая боковая панель */}
        {/* ... (existing sidebar code) ... */}
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
                      flex: i === 4 ? '1 1 100%' : '1 1 auto',
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

          {/* Portfolio Distribution Charts */}
          <PortfolioDistribution
            assetsAllocation={assetsAllocation}
            cashFlowAllocation={cashFlowAllocation}
          />

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

              const imageSrc = getGoalImage(goal.name, goal.goalTypeId || 0);

              return (
                <div
                  key={goal.id}
                  onClick={() => handleEditGoal(goal)}
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
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{goal.name}</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', position: 'relative', zIndex: 1 }}>
                    {goal.displaySlots.map((slot, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>{slot.label}</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{slot.value}</div>
                      </div>
                    ))}
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
                      {taxCofinancing2026 > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.9 }}>Софинансирование в 2026:</div>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxCofinancing2026)}</div>
                        </div>
                      )}

                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '8px 0' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>Итого вычетов:</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxTotalDeduction)}</div>
                      </div>
                      {taxTotalCofinancing > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '14px', opacity: 0.9 }}>Всего софинансирования:</div>
                          <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(taxTotalCofinancing)}</div>
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

      {/* Editing Modal */}
      {editingGoal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '32px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            color: '#1a1a1a',
            overflow: 'hidden'
          }}>
            {/* Modal Header with Background Image */}
            <div style={{
              position: 'relative',
              height: '240px',
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url(${getGoalImage(editingGoal.name, editingGoal.goalTypeId || 0)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '40px',
              color: '#fff'
            }}>
              <button
                onClick={() => setEditingGoal(null)}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '24px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '50%',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  zIndex: 2
                }}
              >
                <X size={24} />
              </button>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '42px',
                    fontWeight: '800',
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    outline: 'none',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}
                  autoFocus={false}
                />
                <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px', fontWeight: '500' }}>
                  Настройте параметры цели для пересчета плана
                </p>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
              {/* Left Column: Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Dynamic Fields from Config */}
                {(GOAL_TYPE_CONFIGS[editingGoal.goalTypeId || 0]?.fields || [
                  { key: 'target_amount', label: 'Целевая сумма', min: 100000, max: 100000000, step: 100000, type: 'currency' },
                  { key: 'term_months', label: 'Срок (мес)', min: 1, max: 600, step: 1, type: 'number' },
                  { key: 'initial_capital', label: 'Стартовый капитал', min: 0, max: 50000000, step: 100000, type: 'currency' },
                ]).map((field: GoalField) => {
                  if (field.type === 'select') {
                    return (
                      <div key={field.key} style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#666' }}>
                          {field.label}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(field.options || []).map((opt: string) => (
                            <button
                              key={opt}
                              onClick={() => setEditForm({ ...editForm, [field.key]: opt })}
                              style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '2px solid',
                                borderColor: editForm[field.key] === opt ? 'var(--primary)' : '#eee',
                                background: editForm[field.key] === opt ? 'var(--primary-light)' : '#fff',
                                color: editForm[field.key] === opt ? 'var(--primary)' : '#666',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '13px'
                              }}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <SliderField
                      key={field.key}
                      label={field.label}
                      value={editForm[field.key] || 0}
                      min={field.min || 0}
                      max={field.max || 10000000}
                      step={field.step || 1}
                      onChange={(val: number) => setEditForm({ ...editForm, [field.key]: val })}
                      format={field.type === 'currency' ? formatCurrency : (field.type === 'percent' ? (val: number) => `${val}%` : undefined)}
                    />
                  );
                })}
              </div>

              {/* Right Column: Visualization & Risks */}
              <div>
                {/* Result Summary Card (Added) */}
                <div style={{
                  background: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
                  borderRadius: '24px',
                  padding: '24px',
                  color: '#fff',
                  marginBottom: '32px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Текущий расчет
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{formatCurrency(editingGoal.monthlyPayment)}</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>/ мес</div>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ opacity: 0.7 }}>Стартовый капитал</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(editingGoal.initialCapital)}</span>
                  </div>
                </div>

                {/* Goal Portfolio Distribution */}
                {(editingGoal.assets_allocation && editingGoal.assets_allocation.length > 0) ? (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                      Портфель цели
                    </h3>
                    <div style={{ background: '#F9FAFB', borderRadius: '24px', padding: '24px', border: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(editingGoal.assets_allocation || []).map((item: { name: string; share: number }, idx: number) => (
                          <div key={idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '14px' }}>
                              <span style={{ fontWeight: '500', color: '#374151' }}>{item.name}</span>
                              <span style={{ fontWeight: '700', color: '#111827' }}>{item.share}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${item.share}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '20px', padding: '12px', background: '#fff', borderRadius: '12px', fontSize: '13px', color: '#6B7280', textAlign: 'center', border: '1px solid #F3F4F6' }}>
                        Фактический капитал: <span style={{ color: '#111827', fontWeight: '600' }}>{formatCurrency(editingGoal.initialCapital)}</span>
                      </div>
                    </div>
                  </div>
                ) : editingGoal.goalTypeId !== 5 && (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px', textAlign: 'center', padding: '40px', background: '#F9FAFB', borderRadius: '32px' }}>
                    <div style={{ opacity: 0.5 }}>
                      <Plus size={48} style={{ marginBottom: '16px', margin: '0 auto' }} />
                      <p>Распределение портфеля будет<br />доступно после расчета</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #eee', background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button
                onClick={() => setEditingGoal(null)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '100px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#666',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
              <button
                onClick={onSubmitEdit}
                style={{
                  padding: '12px 48px',
                  borderRadius: '100px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(194, 24, 91, 0.3)'
                }}
              >
                Сохранить и пересчитать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPageDesign;
