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
}): GoalModalConfig => {
    const { data, goalTypeId, totalAssetsSum, termMonths, isEducationGoal = false } = params;
    const net = getNetMonthlyCapacity(data);

    const reserveInitialMax = Math.max(totalAssetsSum || 0, 10_000_000);
    const reserveInitialStep = Math.max(1_000, Math.floor(reserveInitialMax / 100));

    const bounds: GoalModalBounds = {
        targetAmount: { min: 100_000, max: isEducationGoal ? 10_000_000 : 50_000_000, step: 100_000 },
        termYears: {
            min: 1,
            max: goalTypeId === 2 ? 30 : 50,
            step: 1,
        },
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

    const defaults: GoalModalDefaults = {
        targetAmount: clamp(roundToStep(Math.max(net * 60, 3_000_000), bounds.targetAmount.step), bounds.targetAmount.min, bounds.targetAmount.max),
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
