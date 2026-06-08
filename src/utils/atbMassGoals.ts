import type { ClientGoal } from '../types/client';
import {
    GOAL_TYPE_FIN_RESERVE,
    GOAL_TYPE_INHERITANCE,
    GOAL_TYPE_INVESTMENT,
    GOAL_TYPE_LIFE,
    GOAL_TYPE_PENSION,
} from './GoalImages';

export interface AtbMassGoalPlanInput {
    age: number;
    currentCapital: number;
    desiredMonthlyContribution: number;
    termMonths: number;
}

/** Значения из анкеты ATB — в API для базовой цели уходят как есть. */
export interface AtbMassIntakeValues {
    currentCapital: number;
    desiredMonthlyContribution: number;
    termMonths: number;
}

export interface AtbMassGoalCardMetric {
    label: string;
    value: string;
}

export interface AtbMassGoalPreviewItem {
    key: string;
    title: string;
    badge: string;
    subtitle: string;
    highlight: string;
    metrics: AtbMassGoalCardMetric[];
    goal: ClientGoal;
    isDerived?: boolean;
    editable?: boolean;
    /** Можно убрать из анкеты перед расчётом. */
    removable?: boolean;
}

export interface AtbMassGoalPlan {
    goals: ClientGoal[];
    previewItems: AtbMassGoalPreviewItem[];
    totalAllocatedCapital: number;
    totalAllocatedMonthlyContribution: number;
}

export interface AtbMassGoalOverrides {
    reserveInitialCapital?: number;
    reserveMonthlyReplenishment?: number;
    inheritanceInitialCapital?: number;
    pensionDesiredMonthlyIncome?: number;
    lifeTargetAmount?: number;
}

const TERM_STEP_MONTHS = 6;
const RU_MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number): number {
    if (step <= 0) return Math.round(value);
    return Math.round(value / step) * step;
}

function roundMoney(value: number, step = 10_000): number {
    if (value <= 0) return 0;
    return Math.max(step, roundToStep(value, step));
}

export function normalizeAtbMassTermMonths(termMonths: number): number {
    return clamp(roundToStep(termMonths, TERM_STEP_MONTHS), TERM_STEP_MONTHS, 360);
}

function formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0,
    }).format(Math.max(0, Math.round(value)));
}

function formatMoneyRub(value: number, suffix = '₽'): string {
    return `${formatMoney(value)} ${suffix}`.trim();
}

function formatTermDate(termMonths: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + Math.max(1, Math.round(termMonths || 0)));
    return `${RU_MONTHS[date.getMonth()]} ${date.getFullYear()} г.`;
}

function goalCostMetric(goal: ClientGoal): AtbMassGoalCardMetric | null {
    const cost = goal.target_amount || 0;
    if (cost <= 0) return null;
    return { label: 'Стоимость цели', value: formatMoneyRub(cost) };
}

function capitalMetrics(
    initialCapital: number,
    monthlyReplenishment?: number,
): AtbMassGoalCardMetric[] {
    const metrics: AtbMassGoalCardMetric[] = [];
    if (initialCapital > 0) {
        metrics.push({ label: 'Начальный капитал', value: formatMoneyRub(initialCapital) });
    }
    if (monthlyReplenishment && monthlyReplenishment > 0) {
        metrics.push({ label: 'Ежем. пополнение', value: formatMoneyRub(monthlyReplenishment, '/мес.') });
    }
    return metrics;
}

function fillCardMetrics(metrics: AtbMassGoalCardMetric[]): AtbMassGoalCardMetric[] {
    const filled = [...metrics];
    while (filled.length < 4) {
        filled.push({ label: '\u00a0', value: '—' });
    }
    return filled.slice(0, 4);
}

export function buildGoalCardMetrics(
    item: AtbMassGoalPreviewItem,
    input: AtbMassGoalPlanInput,
): AtbMassGoalCardMetric[] {
    const goal = item.goal;
    const termMonths = goal.term_months || input.termMonths;

    switch (item.key) {
        case 'investment': {
            const metrics: AtbMassGoalCardMetric[] = [];
            const cost = goalCostMetric(goal);
            if (cost) metrics.push(cost);
            metrics.push(...capitalMetrics(input.currentCapital, input.desiredMonthlyContribution));
            metrics.push({ label: 'Срок', value: formatTermDate(termMonths) });
            return fillCardMetrics(metrics);
        }
        case 'fin-reserve': {
            return fillCardMetrics([
                ...capitalMetrics(goal.initial_capital || 0, goal.monthly_replenishment || 0),
                { label: 'Размер резерва', value: '12 мес' },
                { label: 'Срок', value: formatTermDate(goal.term_months || 12) },
            ]);
        }
        case 'inheritance': {
            const metrics: AtbMassGoalCardMetric[] = [];
            const cost = goalCostMetric(goal);
            if (cost) metrics.push(cost);
            const initialCapital = goal.initial_capital || 0;
            if (initialCapital > 0) {
                metrics.push({ label: 'Начальный капитал', value: formatMoneyRub(initialCapital) });
            }
            metrics.push({ label: 'Срок', value: formatTermDate(termMonths) });
            return fillCardMetrics(metrics);
        }
        case 'pension': {
            const monthlyCost = goal.desired_monthly_income || 0;
            const lumpCost = goal.target_amount || 0;
            return [
                {
                    label: 'Стоимость цели',
                    value: monthlyCost > 0
                        ? formatMoneyRub(monthlyCost, '/мес.')
                        : formatMoneyRub(lumpCost),
                },
            ];
        }
        case 'life': {
            return fillCardMetrics([
                { label: 'Лимит', value: formatMoneyRub(goal.target_amount || 0) },
                { label: 'Срок', value: formatTermDate(goal.term_months || 60) },
            ]);
        }
        default:
            return fillCardMetrics(item.metrics.map((metric) => ({ label: metric.label, value: metric.value })));
    }
}

function buildInvestmentGoal(input: AtbMassGoalPlanInput, allocatedCapital: number, _allocatedMonthly: number): ClientGoal {
    const initialCapital = roundMoney(Math.max(input.currentCapital - allocatedCapital, 0));
    const monthlyReplenishment = roundMoney(input.desiredMonthlyContribution, 1_000);

    return {
        goal_type_id: GOAL_TYPE_INVESTMENT,
        name: 'Сохранить и преумножить',
        initial_capital: initialCapital,
        monthly_replenishment: monthlyReplenishment,
        target_amount: 0,
        term_months: normalizeAtbMassTermMonths(input.termMonths),
        inflation_rate: 5.6,
        risk_profile: 'BALANCED',
    };
}

function buildReserveGoal(input: AtbMassGoalPlanInput, overrides?: AtbMassGoalOverrides): ClientGoal {
    const reserveCapitalBase = Math.max(input.currentCapital * 0.18, input.desiredMonthlyContribution * 6);
    const reserveCapitalCap = Math.max(Math.min(input.currentCapital * 0.35, 2_000_000), 100_000);
    const reserveCapitalDefault = input.currentCapital > 0
        ? roundMoney(clamp(reserveCapitalBase, Math.min(input.currentCapital, 100_000), Math.max(Math.min(input.currentCapital, reserveCapitalCap), 100_000)))
        : 0;
    const reserveMonthlyDefault = roundMoney(input.desiredMonthlyContribution * 0.2, 1_000);
    const reserveCapital = clamp(
        roundMoney(overrides?.reserveInitialCapital ?? reserveCapitalDefault),
        0,
        input.currentCapital,
    );
    const reserveMonthly = clamp(
        roundMoney(overrides?.reserveMonthlyReplenishment ?? reserveMonthlyDefault, 1_000),
        0,
        input.desiredMonthlyContribution,
    );

    return {
        goal_type_id: GOAL_TYPE_FIN_RESERVE,
        name: 'Финансовый резерв',
        initial_capital: reserveCapital,
        monthly_replenishment: reserveMonthly,
        target_amount: reserveCapital,
        term_months: 12,
        inflation_rate: 5.6,
        risk_profile: 'CONSERVATIVE',
    };
}

function buildPensionGoal(input: AtbMassGoalPlanInput, overrides?: AtbMassGoalOverrides): ClientGoal {
    const desiredMonthlyIncomeDefault = clamp(
        roundMoney(Math.max(input.desiredMonthlyContribution * 1.7, 30_000), 5_000),
        30_000,
        300_000,
    );
    const desiredMonthlyIncome = clamp(
        roundMoney(overrides?.pensionDesiredMonthlyIncome ?? desiredMonthlyIncomeDefault, 5_000),
        30_000,
        300_000,
    );

    return {
        goal_type_id: GOAL_TYPE_PENSION,
        name: 'Пенсия',
        desired_monthly_income: desiredMonthlyIncome,
        target_amount: desiredMonthlyIncome,
        term_months: Math.max(normalizeAtbMassTermMonths(input.termMonths), 60),
        inflation_rate: 4.8,
        risk_profile: 'BALANCED',
    };
}

function buildLifeGoal(input: AtbMassGoalPlanInput, overrides?: AtbMassGoalOverrides): ClientGoal {
    const targetAmountDefault = clamp(
        roundMoney(Math.max(input.currentCapital * 0.5, input.desiredMonthlyContribution * 24, 1_000_000), 100_000),
        1_000_000,
        20_000_000,
    );
    const targetAmount = clamp(
        roundMoney(overrides?.lifeTargetAmount ?? targetAmountDefault, 100_000),
        300_000,
        20_000_000,
    );

    return {
        goal_type_id: GOAL_TYPE_LIFE,
        name: 'Защита Жизни',
        target_amount: targetAmount,
        term_months: 60,
        inflation_rate: 5.6,
        risk_profile: 'CONSERVATIVE',
    };
}

function buildInheritanceGoal(
    input: AtbMassGoalPlanInput,
    reserveCapital: number,
    overrides?: AtbMassGoalOverrides,
): ClientGoal {
    const availableCapital = Math.max(input.currentCapital - reserveCapital, 0);
    const initialCapitalDefault = availableCapital > 0
        ? roundMoney(clamp(availableCapital * 0.35, Math.min(availableCapital, 150_000), Math.max(Math.min(availableCapital, 8_000_000), 150_000)))
        : 0;
    const initialCapital = clamp(
        roundMoney(overrides?.inheritanceInitialCapital ?? initialCapitalDefault),
        0,
        availableCapital,
    );

    return {
        goal_type_id: GOAL_TYPE_INHERITANCE,
        name: 'Наследство',
        initial_capital: initialCapital,
        target_amount: 0,
        term_months: normalizeAtbMassTermMonths(input.termMonths),
        inflation_rate: 5.6,
        risk_profile: 'BALANCED',
    };
}

export function buildAtbMassGoalPlan(
    input: AtbMassGoalPlanInput,
    overrides: AtbMassGoalOverrides = {},
    excludedGoalKeys: readonly string[] = [],
): AtbMassGoalPlan {
    const excluded = new Set(excludedGoalKeys);
    const normalizedInput: AtbMassGoalPlanInput = {
        age: Math.max(18, Math.round(input.age || 0)),
        currentCapital: Math.max(0, input.currentCapital || 0),
        desiredMonthlyContribution: Math.max(0, input.desiredMonthlyContribution || 0),
        termMonths: normalizeAtbMassTermMonths(input.termMonths || 60),
    };

    const reserveGoal = excluded.has('fin-reserve') ? null : buildReserveGoal(normalizedInput, overrides);
    const reserveCapital = reserveGoal?.initial_capital || 0;
    const reserveMonthly = reserveGoal?.monthly_replenishment || 0;

    let inheritanceGoal: ClientGoal | null = null;
    if (normalizedInput.age >= 55 && !excluded.has('inheritance')) {
        inheritanceGoal = buildInheritanceGoal(normalizedInput, reserveCapital, overrides);
    }

    const totalAllocatedCapital = reserveCapital + (inheritanceGoal?.initial_capital || 0);
    const totalAllocatedMonthlyContribution = reserveMonthly;
    const investmentGoal = buildInvestmentGoal(normalizedInput, totalAllocatedCapital, totalAllocatedMonthlyContribution);

    const goals: ClientGoal[] = [];
    const previewItems: AtbMassGoalPreviewItem[] = [];

    if (!excluded.has('investment')) {
        goals.push(investmentGoal);
        previewItems.push({
            key: 'investment',
            title: investmentGoal.name,
            badge: 'Базовая',
            subtitle: '',
            highlight: '',
            metrics: [],
            goal: investmentGoal,
            isDerived: true,
            editable: false,
            removable: true,
        });
    }

    if (reserveGoal) {
        goals.push(reserveGoal);
        previewItems.push({
            key: 'fin-reserve',
            title: reserveGoal.name,
            badge: 'Защита',
            subtitle: '',
            highlight: '',
            metrics: [],
            goal: reserveGoal,
            editable: true,
            removable: true,
        });
    }

    if (inheritanceGoal) {
        goals.push(inheritanceGoal);
        previewItems.push({
            key: 'inheritance',
            title: inheritanceGoal.name,
            badge: 'Наследие',
            subtitle: '',
            highlight: '',
            metrics: [],
            goal: inheritanceGoal,
            editable: true,
            removable: true,
        });
    } else if (normalizedInput.age < 55) {
        if (!excluded.has('pension')) {
            const pensionGoal = buildPensionGoal(normalizedInput, overrides);
            goals.push(pensionGoal);
            previewItems.push({
                key: 'pension',
                title: pensionGoal.name,
                badge: 'Будущее',
                subtitle: '',
                highlight: '',
                metrics: [],
                goal: pensionGoal,
                editable: true,
                removable: true,
            });
        }
        if (!excluded.has('life')) {
            const lifeGoal = buildLifeGoal(normalizedInput, overrides);
            goals.push(lifeGoal);
            previewItems.push({
                key: 'life',
                title: lifeGoal.name,
                badge: 'Защита семьи',
                subtitle: '',
                highlight: '',
                metrics: [],
                goal: lifeGoal,
                editable: true,
                removable: true,
            });
        }
    }

    previewItems.forEach((item) => {
        item.metrics = buildGoalCardMetrics(item, normalizedInput);
    });

    return {
        goals,
        previewItems,
        totalAllocatedCapital,
        totalAllocatedMonthlyContribution,
    };
}
