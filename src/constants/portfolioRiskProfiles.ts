/** Порядок срезов портфеля / значений risk_profile_extended (как в API). */
export const PORTFOLIO_RISK_PROFILE_ORDER = [
    'CONSERVATIVE',
    'MODERATELY_CONSERVATIVE',
    'BALANCED',
    'MODERATELY_AGGRESSIVE',
    'AGGRESSIVE',
] as const;

export type PortfolioRiskProfileType = (typeof PORTFOLIO_RISK_PROFILE_ORDER)[number];

export type LegacyRiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export const RISK_PROFILE_LABELS_RU: Record<PortfolioRiskProfileType, string> = {
    CONSERVATIVE: 'Консервативный',
    MODERATELY_CONSERVATIVE: 'Умеренно консервативный',
    BALANCED: 'Сбалансированный',
    MODERATELY_AGGRESSIVE: 'Умеренно агрессивный',
    AGGRESSIVE: 'Агрессивный',
};

/** Для селектов пересчёта целей (value = код API, label = по-русски). */
export const RISK_PROFILE_SELECT_OPTIONS: { value: PortfolioRiskProfileType; label: string }[] =
    PORTFOLIO_RISK_PROFILE_ORDER.map((value) => ({ value, label: RISK_PROFILE_LABELS_RU[value] }));

/** Подпись по коду (в т.ч. для legacy-тройки в отчётах). */
export function riskProfileCodeLabel(code: string | null | undefined): string {
    if (code == null || code === '') return '—';
    const extended = RISK_PROFILE_LABELS_RU[code as PortfolioRiskProfileType];
    if (extended) return extended;
    if (code === 'CONSERVATIVE' || code === 'BALANCED' || code === 'AGGRESSIVE') {
        return RISK_PROFILE_LABELS_RU[code as LegacyRiskProfile];
    }
    return code;
}

/** Совместимость целей/API: пять уровней → три уровня. */
export function extendedToLegacy(
    ext: PortfolioRiskProfileType | string | null | undefined,
): LegacyRiskProfile {
    if (ext === 'MODERATELY_CONSERVATIVE') return 'CONSERVATIVE';
    if (ext === 'MODERATELY_AGGRESSIVE') return 'AGGRESSIVE';
    if (ext === 'CONSERVATIVE' || ext === 'BALANCED' || ext === 'AGGRESSIVE') return ext;
    return 'BALANCED';
}

/** Если с бэка только тройка — маппим в «базовый» пятиуровневый код. */
export function legacyToExtended(legacy: string | null | undefined): PortfolioRiskProfileType {
    if (legacy === 'CONSERVATIVE') return 'CONSERVATIVE';
    if (legacy === 'AGGRESSIVE') return 'AGGRESSIVE';
    return 'BALANCED';
}
