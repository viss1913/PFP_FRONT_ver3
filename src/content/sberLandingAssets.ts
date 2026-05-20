/** Переключить на 'full' после юридического согласования бренда Сбера */
export const SBER_BRAND_MODE: 'full' | 'neutral' = 'neutral';

const base = '/sber';

export const sberLandingAssets = {
    logo: `${base}/logo-mark.svg`,
    heroCover: `${base}/hero-cover.png`,
    icons: {
        goals: `${base}/icon-goals.svg`,
        growth: `${base}/icon-growth.svg`,
        control: `${base}/icon-control.svg`,
        laptop: `${base}/icon-laptop.svg`,
    },
    partners: {
        bank: `${base}/partner-bank.svg`,
        npf: `${base}/partner-npf.svg`,
        life: `${base}/partner-life.svg`,
        pervaya: `${base}/partner-pervaya.svg`,
        invest: `${base}/partner-invest.svg`,
    },
} as const;

export function getSberBrandLabel(): string {
    return SBER_BRAND_MODE === 'full' ? 'Сбер' : 'Family Office';
}

export function getSberCopyright(): string | null {
    return SBER_BRAND_MODE === 'full' ? '© 2025 ПАО «Сбербанк»' : null;
}
