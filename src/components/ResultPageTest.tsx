import React from 'react';
import ResultPageDesign from './ResultPageDesign';

/**
 * Тестовая страница для просмотра дизайна результатов
 * Использует моковые данные для быстрой проверки
 */
const ResultPageTest: React.FC = () => {
  // Моковые данные для тестирования (точно как в запросе, плюс налоговое планирование для теста)
  const mockData = {
    "client_id": 25,
    "calculation": {
      "summary": {
        "goals_count": 1,
        "total_capital": 112683585,
        "total_state_benefit": 0,
        "consolidated_portfolio": {
          "total_initial_capital": 60000,
          "total_monthly_replenishment": 429516,
          "assets_allocation": [
            {
              "name": "Первый портфель",
              "amount": 60000,
              "share": 100,
              "yield": 12
            }
          ],
          "cash_flow_allocation": [
            {
              "name": "Первый портфель",
              "amount": 429516,
              "share": 100,
              "yield": 12
            }
          ]
        }
      },
      "goals": [
        {
          "goal_id": 2,
          "goal_name": "Пассивный доход",
          "goal_type": "PASSIVE_INCOME",
          "summary": {
            "goal_type": "PASSIVE_INCOME",
            "status": "GAP",
            "initial_capital": 60000,
            "monthly_replenishment": 429516,
            "monthly_replenishment_without_pds": 429516,
            "total_capital_at_end": 112683585,
            "projected_value": 1126836,
            "state_benefit": 0
          },
          "details": {
            "term_months": 120,
            "target_amount_initial": 434444,
            "target_capital_required": 112683585,
            "yield_percent": 12,
            "portfolio": {
              "id": 1,
              "name": "Первый портфель",
              "instruments": [
                {
                  "name": "Первый портфель",
                  "share": 100,
                  "yield": 12
                }
              ]
            }
          }
        }
      ]
    },
    // Добавим фейковое налоговое планирование для проверки UI
    "tax_planning": {
      "total_deductions": 14400,
      "monthly_payments": 0
    }
  };

  return (
    <ResultPageDesign
      calculationData={mockData}
      onAddGoal={() => {
        alert('Добавить цель');
      }}
      onGoToReport={() => {
        alert('Перейти в отчет');
      }}
    />
  );
};

export default ResultPageTest;


