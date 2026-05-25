import React from 'react';
import ReactMarkdown from 'react-markdown';
import { extendedToLegacy, legacyToExtended } from '../constants/portfolioRiskProfiles';
import { X, Plus, ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import avatarImage from '../assets/avatar_full.png';
import { clientApi } from '../api/clientApi';
import { getGoalImage, GOAL_GALLERY_ITEMS } from '../utils/GoalImages';
import { PortfolioDistribution } from './PortfolioDistribution';
import { formatMonthsToDate } from '../utils/dateUtils';
import AddGoalModal from './AddGoalModal';
import { wrapReportHtmlForMobile } from '../utils/reportHtmlSrcdoc';

// Specialized Recalculate Forms
import PensionForm from './recalculate-forms/PensionForm';
import PassiveIncomeForm from './recalculate-forms/PassiveIncomeForm';
import InvestmentForm from './recalculate-forms/InvestmentForm';
import PurchaseForm from './recalculate-forms/PurchaseForm';
import LifeInsuranceForm from './recalculate-forms/LifeInsuranceForm';
import FinReserveForm from './recalculate-forms/FinReserveForm';
import RentForm from './recalculate-forms/RentForm';
import type { BaseFormProps } from './recalculate-forms/SharedFields';

/** Если где-то есть непустой `risk_profile_extended` — он главный; иначе тройка `risk_profile` как раньше. */
function resolveGoalRiskFields(
    root: any,
    input: any,
    summary: any,
    details: any,
): { risk_profile: string; risk_profile_extended: string } {
    const extCandidates = [
        root?.risk_profile_extended,
        summary?.risk_profile_extended,
        details?.risk_profile_extended,
        input?.risk_profile_extended,
    ];
    for (const c of extCandidates) {
        if (typeof c === 'string' && c.trim() !== '') {
            const ext = c.trim();
            return { risk_profile: extendedToLegacy(ext), risk_profile_extended: ext };
        }
    }
    const rp = String(
        input?.risk_profile ?? details?.risk_profile ?? summary?.risk_profile ?? root?.risk_profile ?? 'BALANCED',
    );
    return { risk_profile: rp, risk_profile_extended: legacyToExtended(rp) };
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
  portfolio_structure?: any;
  originalData?: any; // Full goal result from backend
  targetMonthlyIncome?: number;
  yieldPercent?: number;
  initialInstruments?: any[];
  monthlyInstruments?: any[];
}

interface ResultPageDesignProps {
  calculationData: any;
  client?: any;
  onAddGoal?: (goal: any) => void;
  onDeleteGoal?: (goalId: number) => void;
  onGoToReport?: () => void;
  onRecalculate?: (payload: any) => void;
  onRestart?: () => void;
  isCalculating?: boolean;
  aiPreviewText?: string;
  onOpenAiChat?: () => void;
  isResolutAvProject?: boolean;
  isResolutPublishing?: boolean;
  onPublishToResolut?: () => void;
  resolutIncludeMonthlyFlow?: boolean;
  onResolutIncludeMonthlyFlowChange?: (value: boolean) => void;
  resolutTermMonths?: string;
  onResolutTermMonthsChange?: (value: string) => void;
  onOpenFinancialProducts?: () => void;
}

interface EditFormState {
  name: string;
  target_amount: number;
  term_months: number;
  initial_capital: number;
  ops_capital?: number;
  ipk_current?: number;
  desired_monthly_income?: number;
  risk_profile?: string;
  risk_profile_extended?: string;
  inflation_rate?: number;
  monthly_replenishment?: number;
  [key: string]: any;
}

function coerceFormNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const ResultPageDesign: React.FC<ResultPageDesignProps> = ({
  calculationData,
  client,
  onAddGoal,
  onDeleteGoal,
  onGoToReport,
  onRecalculate,
  onRestart,
  isCalculating,
  aiPreviewText,
  onOpenAiChat,
  isResolutAvProject,
  isResolutPublishing,
  onPublishToResolut,
  resolutIncludeMonthlyFlow,
  onResolutIncludeMonthlyFlowChange,
  resolutTermMonths,
  onResolutTermMonthsChange,
  onOpenFinancialProducts,
}: ResultPageDesignProps) => {
  const [editingGoal, setEditingGoal] = React.useState<GoalResult | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState<EditFormState>({
    name: '',
    target_amount: 0,
    term_months: 0,
    initial_capital: 0
  });
  const [snapshotForm, setSnapshotForm] = React.useState<EditFormState | null>(null);
  const [htmlReportOpening, setHtmlReportOpening] = React.useState(false);
  const [htmlReportModalOpen, setHtmlReportModalOpen] = React.useState(false);
  const [htmlReportSrcDoc, setHtmlReportSrcDoc] = React.useState<string | null>(null);
  const [isRiskProfileModalOpen, setIsRiskProfileModalOpen] = React.useState(false);

  const handleEditGoal = (goal: GoalResult) => {
    setEditingGoal(goal);

    // CRITICAL: Pull fields from goal_input (user inputs) FIRST, fallback to results
    const root = goal.originalData || {};
    const input = root.goal_input || {};
    const summary = root.summary || {};
    const details = root.details || {};
    const { risk_profile: riskProfileResolved, risk_profile_extended: riskExtResolved } = resolveGoalRiskFields(
        root,
        input,
        summary,
        details,
    );

    const statePension = details.state_pension;
    const initialForm: EditFormState = {
      name: goal.name,
      // Priority: User Input -> Calculated Result -> Legacy Field -> Default
      target_amount: coerceFormNumber(
        input.target_amount ?? details.target_amount ?? summary.target_amount ?? goal.targetAmount,
      ),
      desired_monthly_income: coerceFormNumber(input.desired_monthly_income ?? details.target_amount ?? summary.target_amount),
      term_months: coerceFormNumber(input.term_months ?? details.term_months ?? summary.target_months ?? goal.termMonths),
      initial_capital: coerceFormNumber(input.initial_capital ?? summary.initial_capital ?? goal.initialCapital),
      monthly_replenishment: coerceFormNumber(input.monthly_replenishment ?? summary.monthly_replenishment),

      ops_capital: coerceFormNumber(input.ops_capital ?? details.ops_capital ?? root.ops_capital),
      ipk_current: coerceFormNumber(
        input.ipk_current ?? statePension?.ipk_current ?? details.ipk_current ?? root.ipk_current,
      ),
      risk_profile: riskProfileResolved,
      risk_profile_extended: riskExtResolved,
      inflation_rate: coerceFormNumber(input.inflation_rate ?? details.inflation_rate ?? root.inflation_rate),
    };

    setEditForm(initialForm);
    setSnapshotForm(initialForm);
  };

  const onSubmitEdit = () => {
    console.log('onSubmitEdit (v2) called', { onRecalculate, editingGoal });
    if (!onRecalculate || !editingGoal) return;

    // 2. Build payload with ONLY changed fields
    const goalPayload: any = {
      goal_id: editingGoal.id
    };

    let hasChanges = false;
    Object.keys(editForm).forEach(key => {
      const val = (editForm as any)[key];
      const snapVal = snapshotForm ? (snapshotForm as any)[key] : undefined;

      // Robust comparison (ignore small differences in floats, compare as strings/numbers)
      const isChanged = typeof val === 'number' && typeof snapVal === 'number'
        ? Math.abs(val - snapVal) > 0.01
        : String(val) !== String(snapVal);

      if (isChanged) {
        goalPayload[key] = val;
        hasChanges = true;
      }
    });

    // Патч риска: бэк ждёт согласованную пару (тройка + extended для Финама и т.д.)
    if (goalPayload.risk_profile !== undefined || goalPayload.risk_profile_extended !== undefined) {
      const extRaw = editForm.risk_profile_extended;
      const ext =
        typeof extRaw === 'string' && extRaw.trim() !== ''
          ? extRaw.trim()
          : legacyToExtended(String(editForm.risk_profile ?? 'BALANCED'));
      goalPayload.risk_profile_extended = ext;
      goalPayload.risk_profile = extendedToLegacy(ext);
    }

    if (!hasChanges) {
      console.log('No changes detected compared to snapshot');
      setEditingGoal(null);
      return;
    }

    // Special logic for monthly_replenishment (if it was calculated but now user touched it)
    const summary = editingGoal.originalData?.summary || {};
    const originalCalculatedReplenishment = summary.monthly_replenishment || 0;

    // If user set monthly_replenishment to something other than what was calculated
    if (goalPayload.monthly_replenishment !== undefined && goalPayload.monthly_replenishment === originalCalculatedReplenishment) {
      // If it matches exactly what was calculated, maybe user didn't mean to "fix" it?
      // But in v2, the backend expects ONLY what needs to be updated.
    }

    // Important: send flat payload without { goals: [...] } wrapper per requirement
    onRecalculate(goalPayload);
    // REMOVED: setEditingGoal(null); // Don't close the window
  };

  const closeHtmlReportModal = React.useCallback(() => {
    setHtmlReportModalOpen(false);
    setHtmlReportSrcDoc(null);
    setHtmlReportOpening(false);
  }, []);

  React.useEffect(() => {
    if (!htmlReportModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHtmlReportModal();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [htmlReportModalOpen, closeHtmlReportModal]);

  const handleOpenHtmlReport = async () => {
    const calcRoot = calculationData || {};
    const clientId = calcRoot.client_id ?? calcRoot.id ?? client?.id;
    if (clientId == null || Number.isNaN(Number(clientId))) {
      window.alert('Не найден клиент для отчёта (client_id).');
      return;
    }
    setHtmlReportModalOpen(true);
    setHtmlReportSrcDoc(null);
    setHtmlReportOpening(true);
    try {
      const html = await clientApi.buildClientFullReportHtmlDocument(Number(clientId));
      setHtmlReportSrcDoc(html);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string'
          ? (e as { message: string }).message
          : 'Не удалось открыть HTML-отчёт';
      window.alert(msg);
      setHtmlReportModalOpen(false);
      setHtmlReportSrcDoc(null);
    } finally {
      setHtmlReportOpening(false);
    }
  };

  // Access data directly from the root structure: { client_id, summary, goals }
  const calcRoot = calculationData || {};
  const calculatedGoals = calcRoot.goals || [];

  // Extract Allocations
  // New structure: calculationData.summary.consolidated_portfolio
  const consolidatedPortfolio = calcRoot?.summary?.consolidated_portfolio;

  const assetsAllocation = consolidatedPortfolio?.assets_allocation || [];

  // Normalization for Cash Flow: convert annual to monthly
  const rawCashFlow = consolidatedPortfolio?.cash_flow_allocation || calcRoot?.cash_flow_allocation || [];
  let cashFlowAllocation = rawCashFlow.map((item: { payment_frequency?: string; amount: number; name: string }) => {
    if (item.payment_frequency === 'annual') {
      return {
        ...item,
        amount: Math.round(item.amount / 12),
        name: `${item.name} (общ. ${new Intl.NumberFormat('ru-RU', { compactDisplay: 'short', notation: 'compact' }).format(item.amount)})`
      };
    }
    return item;
  });

  // Если с бэка не пришло распределение по пополнению,
  // по умолчанию считаем его таким же, как по первоначальному капиталу.
  if ((!cashFlowAllocation || cashFlowAllocation.length === 0) && assetsAllocation.length > 0) {
    const totalInitial = consolidatedPortfolio?.total_initial_capital || assetsAllocation.reduce(
      (sum: number, item: { amount: number }) => sum + (item.amount || 0),
      0
    );
    const totalMonthly = consolidatedPortfolio?.total_monthly_replenishment || 0;

    if (totalInitial > 0 && totalMonthly > 0) {
      cashFlowAllocation = assetsAllocation.map((item: { name: string; amount: number; share?: number }) => {
        const share = typeof item.share === 'number'
          ? item.share / 100
          : (item.amount || 0) / totalInitial;

        const monthlyAmount = Math.round(totalMonthly * share);

        return {
          name: item.name,
          amount: monthlyAmount,
          share: typeof item.share === 'number' ? item.share : share * 100
        };
      });
    }
  }

  // Tax Benefits Summary (New logic)
  const taxBenefitsSummary = calcRoot?.summary?.tax_benefits_summary as {
    totals?: {
      deduction_2026?: number;
      cofinancing_2026?: number;
      total_deductions?: number;
      total_cofinancing?: number;
    }
  } | undefined;
  // Fallback to legacy structure if needed, but prioritize new summary
  const taxPlanningLegacy = calcRoot.tax_planning as {
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

  const formatCompactCurrency = (value: number) => {
    const normalized = Number(value || 0);
    if (Math.abs(normalized) < 1_000_000) {
      return formatCurrency(normalized);
    }

    return `${new Intl.NumberFormat('ru-RU', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(normalized)} ₽`;
  };

  const clientAvgIncome = Number(client?.avg_monthly_income || 0);
  const spouseAvgIncome = Number(
    client?.spouse_avg_monthly_income
    ?? client?.spouse_monthly_income
    ?? client?.family_profile?.spouse?.monthly_income
    ?? 0
  );
  const familyIncomeTotal = clientAvgIncome + spouseAvgIncome;
  const monthlyObligations = (client?.family_profile?.family_obligations || []).reduce(
    (sum: number, item: { amount_monthly?: number }) => sum + Number(item?.amount_monthly || 0),
    0
  );
  const monthlyGoalsReplenishment = Number(consolidatedPortfolio?.total_monthly_replenishment || 0);
  const freeMoney = familyIncomeTotal - monthlyObligations - monthlyGoalsReplenishment;
  const portfolioYieldPercent = Number(
    consolidatedPortfolio?.yield_percent
    ?? consolidatedPortfolio?.accumulation_yield_percent
    ?? 0
  );

  const budgetBars = [
    { key: 'income', label: 'Доходы семьи', value: familyIncomeTotal, color: '#0f766e' },
    { key: 'obligations', label: 'Обязательные расходы', value: monthlyObligations, color: '#475569' },
    { key: 'goals', label: 'Пополнение целей', value: monthlyGoalsReplenishment, color: '#7c3aed' },
  ];
  const budgetMax = Math.max(1, ...budgetBars.map((b) => b.value), Math.abs(freeMoney));
  const riskProfileExplanation = calcRoot?.risk_profile_explanation || null;
  const keyFactors = Array.isArray(riskProfileExplanation?.key_factors) ? riskProfileExplanation.key_factors : [];
  const recommendations = Array.isArray(riskProfileExplanation?.recommendations) ? riskProfileExplanation.recommendations : [];
  const totalCapital = Number(calcRoot?.summary?.total_capital || 0);
  const totalGoalsCount = Number(calcRoot?.summary?.goals_count || calculatedGoals.length || 0);
  const totalInitialCapital = Number(consolidatedPortfolio?.total_initial_capital || 0);
  const totalStateBenefit = Number(calcRoot?.summary?.total_state_benefit || 0);
  const totalVisibleBenefits = totalStateBenefit + taxTotalDeduction + taxTotalCofinancing;
  const riskSummaryText =
    riskProfileExplanation?.summary ||
    'Пояснение по риск-профилю пока не пришло, но экран уже готов показать рекомендации из расчёта.';
  const overviewCards = [
    {
      key: 'capital',
      label: 'Итоговый капитал',
      value: formatCompactCurrency(totalCapital),
      caption: 'по текущему расчёту',
    },
    {
      key: 'goals',
      label: 'Целей в плане',
      value: new Intl.NumberFormat('ru-RU').format(totalGoalsCount),
      caption: 'активных сценариев',
    },
    {
      key: 'initial',
      label: 'Стартовый капитал',
      value: formatCompactCurrency(totalInitialCapital),
      caption: 'первичный взнос',
    },
    {
      key: 'monthly',
      label: 'Пополнение в месяц',
      value: formatCurrency(monthlyGoalsReplenishment),
      caption: 'по всем целям',
    },
    {
      key: 'yield',
      label: 'Доходность портфеля',
      value: portfolioYieldPercent > 0 ? `${portfolioYieldPercent.toFixed(1)}%` : '—',
      caption: 'прогноз годовых',
    },
    {
      key: 'benefits',
      label: 'Льготы и господдержка',
      value: totalVisibleBenefits > 0 ? formatCompactCurrency(totalVisibleBenefits) : '—',
      caption: 'вычеты и benefits',
    },
  ];

  // Мапим результаты расчетов на карточки
  const goalCards: GoalResult[] = (calculatedGoals as any[]).map((goalResult: any, _index: number) => {
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
      case 11: // INHERITANCE
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
        const premium = summary.initial_capital || summary.premium || 0;
        displaySlots = [
          { label: 'Страховая сумма', value: fmt(summary.target_coverage) },
          { label: 'Взнос (год)', value: fmt(premium) },
          { label: 'Ежем. пополнение', value: fmt(Math.round(premium / 12)) },
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

    // Verify goal name from client input list matching by ID
    let mappedGoal = client?.goals?.find((g: any) => g.id === goalResult.goal_id);

    // Fallback: match by index if ID based lookup failed
    if (!mappedGoal && client?.goals && client.goals[_index]) {
      mappedGoal = client.goals[_index];
    }

    // Fallback: match by closest properties if index failed (e.g. filtered list)
    if (!mappedGoal && client?.goals) {
      // Try finding a goal with same type and similar target amount
      mappedGoal = client.goals.find((g: any) => g.goal_type_id === typeId &&
        Math.abs((g.target_amount || 0) - (summary.target_amount_initial || 0)) < 1000
      );
    }

    const mappedName = mappedGoal?.name;
    // Prio: 1. Name from Client (User input) 2. Name from Calculation Result (goal_name is now first in API) 3. Default Title by Type 4. Fallback
    const displayName = mappedName || goalResult.goal_name || goalResult.name || defaultTitle || 'Цель';

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
      portfolio_structure: goalResult?.portfolio_structure || summary?.portfolio_structure,
      yieldPercent: goalResult.accumulation_yield_percent || details?.accumulation_yield_percent || 0,
      initialInstruments: details?.initial_instruments || [],
      monthlyInstruments: details?.monthly_instruments || [],
      originalData: goalResult
    };
  });

  // Sync editingGoal with calculationData when it updates
  React.useEffect(() => {
    if (editingGoal) {
      const updatedGoal = goalCards.find(g => g.id === editingGoal.id);
      if (updatedGoal) {
        console.log('Syncing editingGoal with new calculationData', updatedGoal);
        setEditingGoal(updatedGoal);

        // Update snapshot to the newest stable state from backend
        const root = updatedGoal.originalData || {};
        const input = root.goal_input || {};
        const summary = root.summary || {};
        const details = root.details || {};
        const { risk_profile: riskProfileResolved, risk_profile_extended: riskExtResolved } = resolveGoalRiskFields(
            root,
            input,
            summary,
            details,
        );

        const statePension = details.state_pension;
        const newSnapshot: EditFormState = {
          name: updatedGoal.name,
          target_amount: coerceFormNumber(
            input.target_amount ?? details.target_amount ?? summary.target_amount ?? updatedGoal.targetAmount,
          ),
          desired_monthly_income: coerceFormNumber(input.desired_monthly_income ?? details.target_amount ?? summary.target_amount),
          term_months: coerceFormNumber(input.term_months ?? details.term_months ?? summary.target_months ?? updatedGoal.termMonths),
          initial_capital: coerceFormNumber(input.initial_capital ?? summary.initial_capital ?? updatedGoal.initialCapital),
          monthly_replenishment: coerceFormNumber(input.monthly_replenishment ?? summary.monthly_replenishment),
          ops_capital: coerceFormNumber(input.ops_capital ?? details.ops_capital ?? root.ops_capital),
          ipk_current: coerceFormNumber(
            input.ipk_current ?? statePension?.ipk_current ?? details.ipk_current ?? root.ipk_current,
          ),
          risk_profile: riskProfileResolved,
          risk_profile_extended: riskExtResolved,
          inflation_rate: coerceFormNumber(input.inflation_rate ?? details.inflation_rate ?? root.inflation_rate),
        };

        setSnapshotForm(newSnapshot);

        // Sync calculated fields (like monthly_replenishment) INTO the form
        // so if the user hasn't touched them, they stay updated with server results
        setEditForm((prev) => ({
          ...prev,
          monthly_replenishment: newSnapshot.monthly_replenishment,
          risk_profile: newSnapshot.risk_profile,
          risk_profile_extended: newSnapshot.risk_profile_extended,
        }));
      }
    }
  }, [calculationData]);

  // Debounced Auto-Recalculate
  React.useEffect(() => {
    if (!editingGoal || !onRecalculate || isCalculating) return;

    // Check if there are changes before setting timer
    let hasChanges = false;
    Object.keys(editForm).forEach(key => {
      const val = (editForm as any)[key];
      const snapVal = snapshotForm ? (snapshotForm as any)[key] : undefined;

      // Handle null/undefined values by using default 0/"" for comparison
      const normalizedVal = val ?? (typeof snapVal === 'number' ? 0 : '');
      const normalizedSnap = snapVal ?? (typeof val === 'number' ? 0 : '');

      // Increased threshold to avoid jitter in financial calculations (e.g. 11920.37 vs 11920)
      const isChanged = typeof normalizedVal === 'number' && typeof normalizedSnap === 'number'
        ? Math.abs(normalizedVal - normalizedSnap) > 1
        : String(normalizedVal) !== String(normalizedSnap);

      if (isChanged) {
        console.warn(`[AutoRecalc] DEVIATION in field "${key}":`, { from: snapVal, to: val });
        hasChanges = true;
      }
    });

    if (!hasChanges) return;

    const timer = setTimeout(() => {
      console.log('Debounce completed! Auto-recalculating field changes...');
      onSubmitEdit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [editForm, snapshotForm, onRecalculate, isCalculating]);





  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}>
      {/* Кнопка "Назад" */}
      <div className="pfp-result-back">
        <button
          onClick={onRestart}
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
      <div className="pfp-result-shell">
        {/* Сетка целей */}
        <main>
          <section className="pfp-overview">
            <div className="pfp-overview__layout">
              <div className="pfp-overview__hero">
                <button
                  type="button"
                  className="pfp-overview__assistant-card"
                  onClick={() => onOpenAiChat?.()}
                >
                  <div className="pfp-ai-preview-row">
                    <div style={{ flexShrink: 0 }}>
                      <div className="pfp-overview__assistant-avatar">
                        <img src={avatarImage} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>
                    <div className="pfp-ai-preview-bubble pfp-ai-preview-bubble--compact">
                      <div className="pfp-overview__assistant-preview">
                        <div className="pfp-overview__assistant-markdown">
                          <ReactMarkdown>
                            {aiPreviewText || 'AI анализирует финансовый план клиента. Нажмите, чтобы открыть чат.'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pfp-overview__click-hint">
                    Нажмите, чтобы открыть весь AI-разбор
                  </div>
                </button>
              </div>

              <div className="pfp-overview__metrics">
                {overviewCards.map((card) => (
                  <article
                    key={card.key}
                    className={`pfp-kpi-card${card.key === 'capital' ? ' pfp-kpi-card--accent' : ''}`}
                  >
                    <div className="pfp-kpi-card__label">{card.label}</div>
                    <div className="pfp-kpi-card__value">{card.value}</div>
                    <div className="pfp-kpi-card__caption">{card.caption}</div>
                  </article>
                ))}
              </div>
            </div>

            <div className="pfp-overview__panels">
              <div className="pfp-overview__panel">
                <div className="pfp-overview__panel-title">Бюджет семьи в месяц</div>
                <div className="pfp-overview__panel-text">
                  Показываем, сколько денег уходит в обязательные расходы и сколько комфортно направляется в цели.
                </div>

                <div style={{ display: 'grid', gap: '10px', marginBottom: '10px' }}>
                  {budgetBars.map((bar) => {
                    const widthPercent = Math.max(3, Math.round((bar.value / budgetMax) * 100));
                    return (
                      <div key={bar.key} className="pfp-family-budget-row">
                        <div className="pfp-family-budget-row__label">{bar.label}</div>
                        <div className="pfp-family-budget-row__bar">
                          <div
                            style={{
                              width: `${widthPercent}%`,
                              minWidth: '10px',
                              height: '100%',
                              background: bar.color,
                              borderRadius: '999px',
                              opacity: 0.95
                            }}
                          />
                        </div>
                        <div className="pfp-family-budget-row__amount">{formatCurrency(bar.value)}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="pfp-overview__panel-foot">
                  <span>Свободные деньги</span>
                  <b className={freeMoney < 0 ? 'pfp-overview__panel-value pfp-overview__panel-value--negative' : 'pfp-overview__panel-value pfp-overview__panel-value--positive'}>
                    {formatCurrency(freeMoney)}
                  </b>
                </div>
              </div>

              <button
                type="button"
                className="pfp-overview__panel pfp-overview__panel-button"
                onClick={() => setIsRiskProfileModalOpen(true)}
              >
                <div className="pfp-overview__panel-title">
                  {riskProfileExplanation?.title || 'Риск-профиль клиента'}
                </div>
                <div className="pfp-overview__panel-preview">
                  <div className="pfp-overview__panel-text">{riskSummaryText}</div>

                  {keyFactors.length > 0 && (
                    <div className="pfp-overview__list-block">
                      <div className="pfp-overview__list-title">Ключевые факторы</div>
                      <ul className="pfp-overview__list">
                        {keyFactors.map((factor: string, idx: number) => (
                          <li key={`factor_${idx}`}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendations.length > 0 && (
                    <div className="pfp-overview__list-block">
                      <div className="pfp-overview__list-title">Рекомендации</div>
                      <ul className="pfp-overview__list">
                        {recommendations.map((rec: string, idx: number) => (
                          <li key={`rec_${idx}`}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {riskProfileExplanation?.caution && (
                    <div className="pfp-overview__caution">{riskProfileExplanation.caution}</div>
                  )}
                </div>
                <div className="pfp-overview__click-hint">
                  Нажмите, чтобы открыть весь риск-разбор
                </div>
              </button>
            </div>
          </section>

          {isResolutAvProject && (
            <div
              style={{
                width: '100%',
                maxWidth: '640px',
                margin: '0 auto 16px',
                padding: '14px 18px',
                background: 'linear-gradient(135deg, #ecfeff 0%, #f0fdfa 100%)',
                border: '1px solid #99f6e4',
                borderRadius: '16px',
                fontSize: '13px',
                color: '#134e4a',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '10px', color: '#0f766e' }}>Resolut — перед оформлением</div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '12px',
                  cursor: isResolutPublishing || isCalculating ? 'not-allowed' : 'pointer',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!resolutIncludeMonthlyFlow}
                  disabled={!!isResolutPublishing || !!isCalculating}
                  onChange={(e) => onResolutIncludeMonthlyFlowChange?.(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  Включать ежемесячные потоки (<code style={{ fontSize: '12px' }}>cash_flow_allocation</code>) в
                  котировки. По умолчанию бэк держит их в skipped с подсказкой.
                </span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Срок (мес.)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Авто: макс. из целей или 120"
                  value={resolutTermMonths ?? ''}
                  disabled={!!isResolutPublishing || !!isCalculating}
                  onChange={(e) => onResolutTermMonthsChange?.(e.target.value)}
                  style={{
                    flex: '1 1 180px',
                    minWidth: '160px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #94a3b8',
                    fontSize: '14px',
                    background: '#fff',
                  }}
                />
              </div>
            </div>
          )}

          <div className="pfp-action-bar">
            {isResolutAvProject && (
              <button
                type="button"
                onClick={() => onPublishToResolut?.()}
                disabled={!!isResolutPublishing || !!isCalculating}
                className="pfp-action-btn pfp-action-btn--success"
              >
                {isResolutPublishing ? 'Оформляем…' : 'Оформить в Resolut'}
              </button>
            )}
            <button
              onClick={onGoToReport}
              className="pfp-action-btn pfp-action-btn--primary"
            >
              Перейти в отчет
            </button>
            <button
              type="button"
              onClick={() => void handleOpenHtmlReport()}
              disabled={htmlReportOpening || !!isCalculating}
              className="pfp-action-btn pfp-action-btn--secondary"
            >
              {htmlReportOpening ? 'Открываем…' : 'HTML-отчет'}
            </button>
            {onOpenFinancialProducts && (
              <button
                type="button"
                onClick={() => onOpenFinancialProducts?.()}
                className="pfp-action-btn pfp-action-btn--soft"
              >
                Финансовые продукты
              </button>
            )}
          </div>

          {/* Portfolio Distribution Charts */}
          <PortfolioDistribution
            assetsAllocation={assetsAllocation}
            cashFlowAllocation={cashFlowAllocation}
            totalYieldPercent={portfolioYieldPercent}
          />

          <div className="pfp-goals-grid" style={{ marginBottom: '40px' }}>
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
                    {onDeleteGoal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGoal(goal.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0',
                          right: '0',
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,0,0,0.4)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="pfp-goal-card-inner-grid" style={{ position: 'relative', zIndex: 1 }}>
                    {goal.displaySlots.map((slot: GoalCardSlot, idx: number) => (
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
                  background: 'linear-gradient(135deg, #312e81 0%, #5b21b6 100%)',
                  borderRadius: '24px',
                  padding: '24px',
                  color: '#fff',
                  position: 'relative',
                  minHeight: '260px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
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
              onClick={() => setIsAddModalOpen(true)}
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
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.background = '#F5F3FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.background = '#F9FAFB';
              }}
            >
              <Plus size={32} color="#7C3AED" />
              <span style={{ color: '#7C3AED', fontSize: '16px', fontWeight: '500' }}>+ Добавить цель</span>
            </button>
          </div>

        </main>
      </div>

      <AddGoalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(goal) => {
          if (onAddGoal) onAddGoal(goal);
          setIsAddModalOpen(false);
        }}
      />

      {isRiskProfileModalOpen && (
        <div className="pfp-text-modal-overlay" onClick={() => setIsRiskProfileModalOpen(false)}>
          <div
            className="pfp-text-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pfp-risk-profile-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pfp-text-modal__header">
              <div>
                <div className="pfp-text-modal__eyebrow">Риск-профилирование</div>
                <h2 id="pfp-risk-profile-modal-title" className="pfp-text-modal__title">
                  {riskProfileExplanation?.title || 'Риск-профиль клиента'}
                </h2>
              </div>
              <button
                type="button"
                className="pfp-text-modal__close"
                onClick={() => setIsRiskProfileModalOpen(false)}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className="pfp-text-modal__body">
              <div className="pfp-text-modal__section">
                <p className="pfp-text-modal__paragraph">{riskSummaryText}</p>
              </div>

              {keyFactors.length > 0 && (
                <div className="pfp-text-modal__section">
                  <div className="pfp-text-modal__section-title">Ключевые факторы</div>
                  <ul className="pfp-overview__list">
                    {keyFactors.map((factor: string, idx: number) => (
                      <li key={`risk_modal_factor_${idx}`}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="pfp-text-modal__section">
                  <div className="pfp-text-modal__section-title">Рекомендации</div>
                  <ul className="pfp-overview__list">
                    {recommendations.map((rec: string, idx: number) => (
                      <li key={`risk_modal_rec_${idx}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {riskProfileExplanation?.caution && (
                <div className="pfp-overview__caution">{riskProfileExplanation.caution}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {editingGoal && (
        <div className="goal-edit-modal-overlay">
          <div className="goal-edit-modal">
            {/* Modal Header with Background Image */}
            <div
              className="goal-edit-modal__hero"
              style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url(${getGoalImage(editingGoal.name, editingGoal.goalTypeId || 0)})`,
            }}
            >
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
                  className="goal-edit-modal__title"
                  autoFocus={false}
                />
                <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px', fontWeight: '500' }}>
                  Настройте параметры цели для пересчета плана
                </p>
              </div>
            </div>

            <div className="goal-edit-modal__body">
              {/* Left Column: Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {/* Goal Selection Specific Form Component */}
                {(() => {
                  const props: BaseFormProps = { editForm, setEditForm, formatCurrency };
                  const typeId = editingGoal.goalTypeId || 0;

                  switch (typeId) {
                    case 1: return <PensionForm {...props} />;
                    case 2: return <PassiveIncomeForm {...props} />;
                    case 3:
                    case 11: return <InvestmentForm {...props} />;
                    case 4: return <PurchaseForm {...props} />;
                    case 5: return <LifeInsuranceForm {...props} />;
                    case 7: return <FinReserveForm {...props} />;
                    case 8: return <RentForm {...props} />;
                    default: return (
                      <div style={{ color: '#666', fontStyle: 'italic' }}>
                        Форма редактирования для данного типа цели будет добавлена в ближайшее время.
                      </div>
                    );
                  }
                })()}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ opacity: 0.7 }}>Стартовый капитал</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(editForm.initial_capital ?? editingGoal.initialCapital)}</span>
                  </div>
                  {editingGoal.yieldPercent !== undefined && editingGoal.yieldPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ opacity: 0.7 }}>Ожидаемая доходность</span>
                      <span style={{ fontWeight: '600', color: '#34D399' }}>{editingGoal.yieldPercent}% год.</span>
                    </div>
                  )}
                </div>

                {/* Goal Portfolio Distribution (New Detailed View) */}
                {(editingGoal.initialInstruments?.length || 0) > 0 || (editingGoal.monthlyInstruments?.length || 0) > 0 ? (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                      Предлагаемый портфель
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Initial Portfolio */}
                      {(editingGoal.initialInstruments?.length || 0) > 0 && (
                        <div style={{ background: '#F9FAFB', borderRadius: '20px', padding: '20px', border: '1px solid #F3F4F6' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            Стартовый портфель
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {editingGoal.initialInstruments?.map((item: any, idx: number) => (
                              <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{item.name}</div>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{item.share}%</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{formatCurrency(item.amount)}</div>
                                  {item.yield && <div style={{ fontSize: '11px', color: '#059669' }}>+{item.yield}%</div>}
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${item.share}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monthly Portfolio */}
                      {(editingGoal.monthlyInstruments?.length || 0) > 0 && (
                        <div style={{ background: '#F9FAFB', borderRadius: '20px', padding: '20px', border: '1px solid #F3F4F6' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                            Ежемесячный портфель
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {editingGoal.monthlyInstruments?.map((item: any, idx: number) => (
                              <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{item.name}</div>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{item.share}%</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{formatCurrency(item.amount)} / мес</div>
                                  {item.yield && <div style={{ fontSize: '11px', color: '#059669' }}>+{item.yield}%</div>}
                                </div>
                                <div style={{ width: '100%', height: '4px', background: '#E5E7EB', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${item.share}%`, height: '100%', background: 'var(--secondary)', borderRadius: '2px' }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
            <div className="goal-edit-modal__footer" style={{ background: '#F9FAFB' }}>
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
                Сохранение...
              </button>
            </div>
          </div>
        </div>
      )}

      {htmlReportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-busy={htmlReportOpening}
          aria-label="HTML-отчёт"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)',
          }}
        >
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              minHeight: '48px',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ color: '#e2e8f0', fontSize: '15px', fontWeight: 600, letterSpacing: '0.02em' }}>
              HTML-отчёт
            </span>
            <button
              type="button"
              onClick={closeHtmlReportModal}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '100px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Закрыть
            </button>
          </div>
          <div className="html-report-viewer">
            {htmlReportOpening && !htmlReportSrcDoc && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(194, 24, 91, 0.12) 0%, transparent 65%)',
                }}
              >
                <div
                  style={{
                    width: '88px',
                    height: '88px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <Loader2
                    size={40}
                    strokeWidth={2}
                    color="#f472b6"
                    className="animate-spin"
                    aria-hidden
                  />
                </div>
                <div style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 600, textAlign: 'center' }}>
                  Готовим отчёт
                </div>
              </div>
            )}
            {htmlReportSrcDoc != null && (
              <iframe
                title="HTML-отчёт"
                className="report-preview-iframe"
                srcDoc={wrapReportHtmlForMobile(htmlReportSrcDoc)}
                style={{
                  flex: 1,
                  width: '100%',
                  minHeight: 0,
                  border: 'none',
                  background: '#fff',
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPageDesign;
