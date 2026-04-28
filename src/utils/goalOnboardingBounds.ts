import type { CJMData } from '../components/CJMFlow';

type SliderRange = { min: number; max: number; step: number };

export interface GoalModalBounds {
    targetAmount: SliderRange;
    termYears: SliderRange;
    desiredIncome: SliderRange;
    initialCapital: SliderRange;
}

export interface GoalModalDefaults {
    targetAmount: number;
    termMonths: number;
    desiredIncome: number;
    initialCapital: number;
}

export interface GoalModalConfig {
    defaults: GoalModalDefaults;
    bounds: GoalModalBounds;
    netMonthlyCapacity: number;
}

const roundToStep = (value: number, step: number): number => {
    if (step <= 0) return Math.round(value);
    return Math.round(value / step) * step;
};

const clamp = (value: number, min: number, max: number): number => {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
};

export const getFamilyMonthlyIncome = (data: CJMData): number => {
    const clientIncome = data.avgMonthlyIncome || 0;
    const spouseIncome = Number(data.familyProfile?.spouse?.monthly_income || 0);
    return Math.max(clientIncome + spouseIncome, 0);
};

export const getFamilyMonthlyExpenses = (data: CJMData): number =>
    (data.familyProfile?.family_obligations || []).reduce((sum, item) => sum + (item.amount_monthly || 0), 0);

export const getNetMonthlyCapacity = (data: CJMData): number =>
    Math.max(getFamilyMonthlyIncome(data) - getFamilyMonthlyExpenses(data), 0);

export const getGoalModalConfig = (params: {
    data: CJMData;
    goalTypeId: number;
    totalAssetsSum: number;
    termMonths?: number;
    isEducationGoal?: boolean;
    goalId?: string;
}): GoalModalConfig => {
    const { data, goalTypeId, totalAssetsSum, termMonths, isEducationGoal = false, goalId } = params;
    const net = getNetMonthlyCapacity(data);

    const reserveInitialMax = Math.max(totalAssetsSum || 0, 10_000_000);
    const reserveInitialStep = Math.max(1_000, Math.floor(reserveInitialMax / 100));

    const baseTargetRange: SliderRange = { min: 100_000, max: 50_000_000, step: 100_000 };
    const targetRangeByGoal: Record<string, SliderRange> = {
        travel: { min: 100_000, max: 5_000_000, step: 50_000 },
        auto: { min: 300_000, max: 8_000_000, step: 100_000 },
        apartment: { min: 2_000_000, max: 40_000_000, step: 200_000 },
        house: { min: 4_000_000, max: 60_000_000, step: 200_000 },
        mortgage: { min: 500_000, max: 20_000_000, step: 100_000 },
        move: { min: 300_000, max: 8_000_000, step: 100_000 },
        business: { min: 1_000_000, max: 30_000_000, step: 100_000 },
        other: { min: 100_000, max: 20_000_000, step: 100_000 },
    };

    const targetAmountRange = isEducationGoal
        ? { min: 500_000, max: 10_000_000, step: 100_000 }
        : (goalId ? targetRangeByGoal[goalId] : undefined) || baseTargetRange;

    const termRangeByGoal: Record<string, SliderRange> = {
        travel: { min: 1, max: 10, step: 1 },
        auto: { min: 1, max: 10, step: 1 },
        apartment: { min: 2, max: 20, step: 1 },
        house: { min: 3, max: 25, step: 1 },
        mortgage: { min: 1, max: 15, step: 1 },
        move: { min: 1, max: 10, step: 1 },
        business: { min: 1, max: 20, step: 1 },
        other: { min: 1, max: 20, step: 1 },
    };

    const termYearsRange = (goalTypeId === 2
        ? { min: 1, max: 30, step: 1 }
        : (goalId ? termRangeByGoal[goalId] : undefined)) || { min: 1, max: 50, step: 1 };

    const bounds: GoalModalBounds = {
        targetAmount: targetAmountRange,
        termYears: termYearsRange,
        desiredIncome: {
            min: goalTypeId === 1 || goalTypeId === 2 ? 10_000 : 0,
            max: goalTypeId === 7 ? 200_000 : goalTypeId === 3 ? 500_000 : 1_000_000,
            step: 5_000,
        },
        initialCapital: {
            min: 0,
            max: goalTypeId === 8 ? 100_000_000 : goalTypeId === 7 ? reserveInitialMax : 10_000_000,
            step: goalTypeId === 8 ? 500_000 : goalTypeId === 7 ? reserveInitialStep : 100_000,
        },
    };

    const standardTargetByGoalId: Record<string, number> = {
        travel: Math.max(net * 10, 800_000),
        auto: Math.max(net * 16, 1_500_000),
        apartment: Math.max(net * 36, 6_000_000),
        house: Math.max(net * 48, 9_000_000),
        mortgage: Math.max(net * 18, 2_000_000),
        move: Math.max(net * 12, 1_000_000),
        business: Math.max(net * 24, 3_000_000),
        other: Math.max(net * 18, 2_000_000),
    };

    const computedStandardTarget = isEducationGoal
        ? Math.max(net * 24, 2_500_000)
        : (goalId ? standardTargetByGoalId[goalId] : undefined) ?? Math.max(net * 60, 3_000_000);

    const defaults: GoalModalDefaults = {
        targetAmount: clamp(roundToStep(computedStandardTarget, bounds.targetAmount.step), bounds.targetAmount.min, bounds.targetAmount.max),
        termMonths: (termMonths && termMonths > 0 ? termMonths : 5 * 12),
        desiredIncome: clamp(
            roundToStep(
                goalTypeId === 7 ? Math.max(net * 0.1, 10_000) : Math.max(net * 0.6, 100_000),
                bounds.desiredIncome.step
            ),
            bounds.desiredIncome.min,
            bounds.desiredIncome.max
        ),
        initialCapital: clamp(
            roundToStep(
                goalTypeId === 7 ? Math.max(net * 3, 0) : goalTypeId === 8 ? Math.max(net * 120, 5_000_000) : Math.max(net * 24, 5_000_000),
                bounds.initialCapital.step
            ),
            bounds.initialCapital.min,
            bounds.initialCapital.max
        ),
    };

    return {
        defaults,
        bounds,
        netMonthlyCapacity: net,
    };
};

export const clampGoalValue = (value: number, range: SliderRange): number =>
    clamp(roundToStep(value, range.step), range.min, range.max);
