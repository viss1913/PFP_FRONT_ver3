/** Рекомендации для шага «Финансовый резерв» (основной CJM). */

/** Старое значение из CJMFlow до шага финрезерва — не считаем осознанным выбором пользователя. */
export const LEGACY_CJM_FIN_RESERVE_MONTHLY = 5000;

export function pickFinReserveMonthlyReplenishment(
    stored: number | undefined,
    recommended: number,
): number {
    if (stored === undefined || stored === LEGACY_CJM_FIN_RESERVE_MONTHLY) {
        return recommended;
    }
    return Math.max(0, stored);
}

export function computeRecommendedFinReserveInitial(
    totalLiquidCapital: number,
    avgMonthlyIncome: number,
): number {
    return Math.max(
        0,
        Math.min(
            Math.round(avgMonthlyIncome * 3),
            Math.round(totalLiquidCapital * 0.2),
        ),
    );
}

export function computeRecommendedFinReserveMonthly(
    avgMonthlyIncome: number,
    totalLiquidCapital: number,
): number {
    if (avgMonthlyIncome > 0) {
        return Math.max(
            0,
            Math.min(20_000, Math.round((avgMonthlyIncome * 0.1) / 1000) * 1000),
        );
    }
    return Math.max(
        0,
        Math.min(20_000, Math.round((totalLiquidCapital * 0.002) / 1000) * 1000),
    );
}

/** «200 тыс», «2 тыс», «1,2 млн» — для текста ассистента. */
export function formatCompactRubles(amount: number): string {
    const value = Math.max(0, Math.round(amount || 0));
    if (value >= 1_000_000) {
        const millions = value / 1_000_000;
        const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
        return `${String(rounded).replace('.', ',')} млн`;
    }
    if (value >= 1000) {
        return `${Math.round(value / 1000)} тыс`;
    }
    return new Intl.NumberFormat('ru-RU').format(value);
}
