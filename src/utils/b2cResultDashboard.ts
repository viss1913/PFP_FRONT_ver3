import {
    PORTFOLIO_RISK_PROFILE_ORDER,
    type PortfolioRiskProfileType,
    riskProfileCodeLabel,
    legacyToExtended,
} from '../constants/portfolioRiskProfiles';
import { formatMonthsToDate } from './dateUtils';
import { resolvePortfolioYieldPercent } from './portfolioYield';
import {
    getGoalImage,
    GOAL_GALLERY_ITEMS,
    GOAL_TYPE_FIN_RESERVE,
    GOAL_TYPE_INHERITANCE,
    GOAL_TYPE_INVESTMENT,
    GOAL_TYPE_LIFE,
    GOAL_TYPE_OTHER,
    GOAL_TYPE_PASSIVE_INCOME,
    GOAL_TYPE_PENSION,
    GOAL_TYPE_RENT,
} from './GoalImages';

export type B2cResultAllocationItem = {
    name: string;
    amount: number;
    share: number;
    color: string;
};

export type B2cResultGoalSlot = {
    label: string;
    value: string;
};

export type B2cResultGoalCard = {
    id: number;
    name: string;
    goalTypeId: number;
    image: string;
    progressPercent: number;
    slots: B2cResultGoalSlot[];
};

export type B2cResultDashboardModel = {
    totalCapital: number;
    totalCapitalLabel: string;
    portfolioYieldPercent: number;
    goalsCount: number;
    activeGoalsCount: number;
    riskCode: PortfolioRiskProfileType;
    riskLabel: string;
    riskScore: number | null;
    riskGaugePercent: number;
    freedomYear: number | null;
    allocations: B2cResultAllocationItem[];
    portfolioTotal: number;
    topUpAllocations: B2cResultAllocationItem[];
    topUpTotal: number;
    keyGoals: B2cResultGoalCard[];
    lifeCoverage: number;
    finReserve: number;
    monthlyTopUp: number;
    nextMeetingLabel: string;
    coachMessage: string;
};

const DONUT_COLORS = ['#C9A227', '#22C55E', '#38BDF8', '#A78BFA', '#F97316', '#94A3B8'];
const TOPUP_COLORS = ['#38BDF8', '#C9A227', '#A78BFA', '#22C55E', '#F97316', '#94A3B8'];

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return fallback;
}

export function formatRubCompact(value: number): string {
    const n = Number(value || 0);
    if (Math.abs(n) < 1_000_000) {
        return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n)} ₽`;
    }
    return `${new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(n)} ₽`;
}

export function formatRub(value: number): string {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(value || 0))} ₽`;
}

function clampPercent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveRiskCode(root: Record<string, unknown>): PortfolioRiskProfileType {
    const riskResult = asRecord(root.risk_profile_result);
    const ext =
        (typeof riskResult?.risk_profile_extended === 'string' && riskResult.risk_profile_extended) ||
        (typeof root.risk_profile_extended === 'string' && root.risk_profile_extended) ||
        '';
    if (ext && (PORTFOLIO_RISK_PROFILE_ORDER as readonly string[]).includes(ext)) {
        return ext as PortfolioRiskProfileType;
    }
    const legacy =
        (typeof riskResult?.risk_profile === 'string' && riskResult.risk_profile) ||
        (typeof root.risk_profile === 'string' && root.risk_profile) ||
        'BALANCED';
    return legacyToExtended(legacy);
}

function riskGaugeFromCode(code: PortfolioRiskProfileType, score: number | null): number {
    if (score != null && Number.isFinite(score)) {
        if (score <= 5) return clampPercent(((score - 1) / 4) * 100);
        if (score <= 20) return clampPercent((score / 20) * 100);
        return clampPercent(score);
    }
    const idx = PORTFOLIO_RISK_PROFILE_ORDER.indexOf(code);
    if (idx < 0) return 50;
    return clampPercent(((idx + 0.5) / PORTFOLIO_RISK_PROFILE_ORDER.length) * 100);
}

function goalProgressPercent(summary: Record<string, unknown>, typeId: number): number {
    const initial = asNumber(summary.initial_capital);
    const projected = asNumber(summary.projected_capital_at_end);
    const target =
        asNumber(summary.target_capital_required) ||
        asNumber(summary.target_amount) ||
        asNumber(summary.target_amount_initial) ||
        asNumber(summary.target_coverage) ||
        projected;

    if (typeId === GOAL_TYPE_LIFE) {
        const coverage = asNumber(summary.target_coverage);
        if (coverage > 0 && initial > 0) return clampPercent((initial / coverage) * 100);
        return coverage > 0 ? 35 : 0;
    }

    if (target > 0 && initial >= 0) {
        const byInitial = (initial / target) * 100;
        if (projected > 0 && projected >= initial) {
            const byProjected = (initial / projected) * 100;
            return clampPercent(Math.max(byInitial, byProjected * 0.85));
        }
        return clampPercent(byInitial);
    }

    const months = asNumber(summary.target_months);
    if (months > 0 && initial > 0) return clampPercent(Math.min(75, 20 + months / 4));
    return initial > 0 ? 40 : 15;
}

function goalDisplayName(goal: Record<string, unknown>, typeId: number): string {
    const fromApi =
        (typeof goal.goal_name === 'string' && goal.goal_name.trim()) ||
        (typeof goal.name === 'string' && goal.name.trim()) ||
        '';
    if (fromApi) return fromApi;
    return GOAL_GALLERY_ITEMS.find((i) => i.typeId === typeId)?.title || 'Цель';
}

/** Слоты как в агентском ResultPageDesign */
function goalCardSlots(summary: Record<string, unknown>, typeId: number): B2cResultGoalSlot[] {
    const months = asNumber(summary.target_months);
    const termLabel = months > 0 ? formatMonthsToDate(months) : '—';
    const monthly = asNumber(summary.monthly_replenishment);

    switch (typeId) {
        case GOAL_TYPE_PENSION:
        case GOAL_TYPE_PASSIVE_INCOME:
            return [
                {
                    label: 'Желаемый доход',
                    value: `${formatRubCompact(asNumber(summary.target_amount_initial || summary.target_amount))} / мес`,
                },
                { label: 'Первонач. капитал', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Срок', value: termLabel },
            ];
        case GOAL_TYPE_INVESTMENT:
        case GOAL_TYPE_INHERITANCE:
            return [
                { label: 'Итоговый капитал', value: formatRubCompact(asNumber(summary.projected_capital_at_end)) },
                { label: 'Текущий капитал', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Срок', value: termLabel },
            ];
        case GOAL_TYPE_OTHER:
            return [
                {
                    label: 'Стоимость сегодня',
                    value: formatRubCompact(asNumber(summary.target_amount_initial || summary.target_amount)),
                },
                { label: 'Первонач. капитал', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Срок', value: termLabel },
            ];
        case GOAL_TYPE_LIFE: {
            const premium = asNumber(summary.initial_capital || summary.premium);
            return [
                { label: 'Страховая сумма', value: formatRubCompact(asNumber(summary.target_coverage)) },
                { label: 'Взнос / год', value: formatRubCompact(premium) },
                { label: 'Ежем. пополнение', value: formatRubCompact(Math.round(premium / 12)) },
                { label: 'Срок', value: termLabel },
            ];
        }
        case GOAL_TYPE_FIN_RESERVE:
            return [
                { label: 'Итоговый капитал', value: formatRubCompact(asNumber(summary.projected_capital_at_end)) },
                { label: 'Накоплено', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Размер резерва', value: months > 0 ? `${months} мес` : '—' },
            ];
        case GOAL_TYPE_RENT:
            return [
                {
                    label: 'Ежем. доход',
                    value: formatRubCompact(asNumber(summary.projected_monthly_income)),
                },
                { label: 'Капитал', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Срок', value: termLabel },
            ];
        default:
            return [
                {
                    label: 'Цель',
                    value: formatRubCompact(asNumber(summary.target_amount || summary.target_amount_initial)),
                },
                { label: 'Первонач. капитал', value: formatRubCompact(asNumber(summary.initial_capital)) },
                { label: 'Ежем. пополнение', value: formatRubCompact(monthly) },
                { label: 'Срок', value: termLabel },
            ];
    }
}

function mapAllocationList(
    raw: unknown[],
    totalHint: number,
    colors: string[],
): { items: B2cResultAllocationItem[]; total: number } {
    const amounts = raw.map((item) => asNumber(asRecord(item)?.amount));
    const sumAmounts = amounts.reduce((s, n) => s + n, 0);
    const total = totalHint > 0 ? totalHint : sumAmounts;

    const items = raw.map((item, index) => {
        const row = asRecord(item) || {};
        const amount = asNumber(row.amount);
        const share =
            typeof row.share === 'number'
                ? row.share <= 1
                    ? row.share * 100
                    : row.share
                : total > 0
                  ? (amount / total) * 100
                  : 0;
        return {
            name: typeof row.name === 'string' ? row.name : `Позиция ${index + 1}`,
            amount,
            share,
            color: colors[index % colors.length],
        };
    });

    return { items, total: total || sumAmounts };
}

function buildCoachMessage(model: Omit<B2cResultDashboardModel, 'coachMessage'>): string {
    const capital = model.totalCapitalLabel;
    const yieldPart =
        model.portfolioYieldPercent > 0
            ? ` Прогноз доходности портфеля — около ${model.portfolioYieldPercent.toFixed(1)}% годовых.`
            : '';
    const topUpPart =
        model.monthlyTopUp > 0 ? ` Ежемесячное пополнение: ${formatRubCompact(model.monthlyTopUp)}.` : '';
    const goalsPart =
        model.activeGoalsCount > 0
            ? ` В плане ${model.activeGoalsCount} ${pluralGoals(model.activeGoalsCount)}.`
            : '';
    return `Отлично — финансовый план готов. Итоговый капитал по расчёту: ${capital}.${yieldPart}${topUpPart}${goalsPart} Риск-профиль: ${model.riskLabel}. Ниже — структура портфеля и портфель пополнения.`;
}

function pluralGoals(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'активная цель';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'активные цели';
    return 'активных целей';
}

export function mapB2cResultDashboard(calculationData: unknown): B2cResultDashboardModel {
    const root = asRecord(calculationData) || {};
    const summary = asRecord(root.summary) || {};
    const portfolio = asRecord(summary.consolidated_portfolio) || {};
    const goalsRaw = Array.isArray(root.goals) ? root.goals : [];

    const totalCapital = asNumber(summary.total_capital || portfolio.total_initial_capital);
    const monthlyTopUp = asNumber(portfolio.total_monthly_replenishment);
    const portfolioYieldPercent = resolvePortfolioYieldPercent(
        portfolio as {
            yield_percent?: number;
            accumulation_yield_percent?: number;
            assets_allocation?: Array<{ amount?: number; yield?: number; yield_percent?: number }>;
            cash_flow_allocation?: Array<{ amount?: number; yield?: number; yield_percent?: number }>;
        },
        goalsRaw as Array<{
            accumulation_yield_percent?: number;
            summary?: { accumulation_yield_percent?: number; initial_capital?: number; total_capital?: number };
            details?: { accumulation_yield_percent?: number };
        }>,
    );

    const rawAssets = Array.isArray(portfolio.assets_allocation) ? portfolio.assets_allocation : [];
    const mappedAssets = mapAllocationList(
        rawAssets,
        asNumber(portfolio.total_initial_capital),
        DONUT_COLORS,
    );

    const rawCash =
        Array.isArray(portfolio.cash_flow_allocation)
            ? portfolio.cash_flow_allocation
            : Array.isArray(root.cash_flow_allocation)
              ? root.cash_flow_allocation
              : [];
    const mappedTopUp = mapAllocationList(rawCash, monthlyTopUp, TOPUP_COLORS);

    const riskCode = resolveRiskCode(root);
    const riskResult = asRecord(root.risk_profile_result);
    const riskScoreRaw = riskResult?.final_score ?? riskResult?.score;
    const riskScore =
        typeof riskScoreRaw === 'number' && Number.isFinite(riskScoreRaw) ? riskScoreRaw : null;

    const keyGoals: B2cResultGoalCard[] = [];
    let lifeCoverage = 0;
    let finReserve = 0;

    goalsRaw.forEach((goalUnknown: unknown, index: number) => {
        const goal = asRecord(goalUnknown) || {};
        const gSummary = asRecord(goal.summary) || {};
        const typeId = asNumber(goal.goal_type_id);
        const name = goalDisplayName(goal, typeId);
        const percent = goalProgressPercent(gSummary, typeId);

        if (typeId === GOAL_TYPE_LIFE) {
            lifeCoverage = Math.max(lifeCoverage, asNumber(gSummary.target_coverage));
        }
        if (typeId === GOAL_TYPE_FIN_RESERVE) {
            finReserve = Math.max(
                finReserve,
                asNumber(gSummary.projected_capital_at_end || gSummary.initial_capital),
            );
        }

        keyGoals.push({
            id: asNumber(goal.goal_id, index),
            name,
            goalTypeId: typeId,
            image: getGoalImage(name, typeId),
            progressPercent: percent,
            slots: goalCardSlots(gSummary, typeId),
        });
    });

    const activeGoalsCount = keyGoals.filter(
        (g) => g.goalTypeId !== GOAL_TYPE_LIFE && g.goalTypeId !== GOAL_TYPE_FIN_RESERVE,
    ).length;
    const goalsCount = asNumber(summary.goals_count) || keyGoals.length;

    let freedomYear: number | null = null;
    for (const goalUnknown of goalsRaw) {
        const gSummary = asRecord(asRecord(goalUnknown)?.summary) || {};
        const months = asNumber(gSummary.target_months);
        if (months > 0) {
            const y = new Date().getFullYear() + Math.floor(months / 12);
            freedomYear = freedomYear == null ? y : Math.max(freedomYear, y);
        }
    }

    const base: Omit<B2cResultDashboardModel, 'coachMessage'> = {
        totalCapital,
        totalCapitalLabel: formatRubCompact(totalCapital),
        portfolioYieldPercent,
        goalsCount,
        activeGoalsCount: activeGoalsCount || goalsCount,
        riskCode,
        riskLabel: riskProfileCodeLabel(riskCode),
        riskScore,
        riskGaugePercent: riskGaugeFromCode(riskCode, riskScore),
        freedomYear,
        allocations: mappedAssets.items,
        portfolioTotal: mappedAssets.total || totalCapital,
        topUpAllocations: mappedTopUp.items,
        topUpTotal: mappedTopUp.total || monthlyTopUp,
        keyGoals: keyGoals.slice(0, 8),
        lifeCoverage,
        finReserve,
        monthlyTopUp,
        nextMeetingLabel: 'Скоро',
    };

    return {
        ...base,
        coachMessage: buildCoachMessage(base),
    };
}
