import React from 'react';
import ResultPage from './ResultPage';

/**
 * Тестовая страница для просмотра дизайна результатов
 * Использует моковые данные для быстрой проверки
 */
const ResultPageTest: React.FC = () => {
  const demoClient = {
    first_name: 'Алексей',
    last_name: 'Иванов',
    avg_monthly_income: 320000,
    spouse_monthly_income: 180000,
    family_profile: {
      family_obligations: [
        { name: 'Ипотека', amount_monthly: 78000 },
        { name: 'Образование', amount_monthly: 22000 },
      ],
    },
    goals: [
      { id: 1, name: 'Достойная пенсия', goal_type_id: 1, target_amount: 205000 },
      { id: 2, name: 'Квартира', goal_type_id: 4, target_amount: 10800000 },
      { id: 3, name: 'Финансовый резерв', goal_type_id: 7, target_amount: 576759 },
      { id: 4, name: 'Защита семьи', goal_type_id: 5, target_amount: 1500000 },
    ],
  };

  const demoCalculationData = {
    summary: {
      goals_count: 4,
      total_capital: 18420000,
      total_state_benefit: 540000,
      consolidated_portfolio: {
        total_initial_capital: 3600000,
        total_monthly_replenishment: 98900,
        yield_percent: 16.6,
        assets_allocation: [
          { name: 'Core Portfolio', amount: 2280000, share: 60, yield: 16.8 },
          { name: 'Growth Portfolio', amount: 760000, share: 20, yield: 18.4 },
          { name: 'Income Portfolio', amount: 380000, share: 10, yield: 13.2 },
          { name: 'Alternatives', amount: 180000, share: 5, yield: 11.5 },
        ],
        cash_flow_allocation: [
          { name: 'Core Portfolio', amount: 40339, share: 41, yield: 16.8 },
          { name: 'Growth Portfolio', amount: 40339, share: 41, yield: 18.4 },
          { name: 'PDS / НПФ', amount: 8708, share: 9, yield: 13.2 },
          { name: 'Резерв ликвидности', amount: 9500, share: 9, yield: 7.8 },
        ],
      },
      tax_benefits_summary: {
        totals: {
          deduction_2026: 156000,
          cofinancing_2026: 36000,
          total_deductions: 624000,
          total_cofinancing: 144000,
        },
      },
    },
    risk_profile_explanation: {
      title: 'Сбалансированный риск-профиль',
      summary:
        'План опирается на рабочий денежный поток семьи и допускает умеренную долю growth-инструментов без перегруза по ежемесячным обязательствам.',
      key_factors: [
        'Есть базовый стартовый капитал и регулярный monthly cash flow.',
        'Пополнение целей укладывается в комфортный бюджет без перегиба.',
        'Критичные цели разнесены по срокам и не конфликтуют между собой.',
      ],
      recommendations: [
        'Держать резерв отдельно от долгосрочных целей.',
        'Пересматривать портфель после крупных изменений дохода семьи.',
        'Раз в квартал проверять прогресс по долгосрочным целям.',
      ],
      caution:
        'Если ежемесячный поток семьи снизится, первым делом не режь пенсионную цель, а пересобери доли в портфеле и скорость накопления.',
    },
    goals: [
      {
        goal_id: 1,
        goal_type_id: 1,
        goal_name: 'Достойная пенсия',
        goal_type: 'PENSION',
        goal_input: {
          target_amount: 205000,
          term_months: 168,
          initial_capital: 800000,
          monthly_replenishment: 40000,
        },
        summary: {
          target_amount_initial: 205000,
          initial_capital: 800000,
          monthly_replenishment: 40000,
          target_months: 168,
        },
        details: {
          term_months: 168,
          target_amount: 205000,
        },
      },
      {
        goal_id: 2,
        goal_type_id: 4,
        goal_name: 'Квартира',
        goal_type: 'OTHER',
        goal_input: {
          target_amount: 10800000,
          term_months: 84,
          initial_capital: 2296320,
          monthly_replenishment: 30000,
        },
        summary: {
          target_amount_initial: 10800000,
          initial_capital: 2296320,
          monthly_replenishment: 30000,
          target_months: 84,
        },
        details: {
          term_months: 84,
          target_amount: 10800000,
        },
      },
      {
        goal_id: 3,
        goal_type_id: 7,
        goal_name: 'Финансовый резерв',
        goal_type: 'FIN_RESERVE',
        goal_input: {
          target_amount: 576759,
          term_months: 6,
          initial_capital: 450000,
          monthly_replenishment: 20000,
        },
        summary: {
          projected_capital_at_end: 576759,
          initial_capital: 450000,
          monthly_replenishment: 20000,
          target_months: 6,
        },
        details: {
          term_months: 6,
        },
      },
      {
        goal_id: 4,
        goal_type_id: 5,
        goal_name: 'Защита семьи',
        goal_type: 'LIFE',
        goal_input: {
          target_coverage: 1500000,
          term_months: 120,
          initial_capital: 120000,
        },
        summary: {
          target_coverage: 1500000,
          initial_capital: 120000,
          premium: 120000,
          target_months: 120,
        },
        details: {
          term_months: 120,
          target_coverage: 1500000,
        },
      },
    ],
  };

  return (
    <ResultPage
      data={demoCalculationData}
      client={demoClient}
      onRestart={() => {
        window.alert('Это demo-экран. Для возврата просто открой другой page в URL.');
      }}
      onAddGoal={() => {
        window.alert('Demo: добавление цели здесь не подключено.');
      }}
      onDeleteGoal={(goalId) => {
        window.alert(`Demo: удаление цели ${goalId} здесь не подключено.`);
      }}
    />
  );
};

export default ResultPageTest;


