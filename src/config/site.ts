/** Публичный origin прод-сайта (canonical, OG, sitemap). */
export const DEFAULT_SITE_ORIGIN = 'https://family-office.bank-future.com';

export const SITE_NAME = 'BankFuture';
export const SITE_LEGAL_NAME = 'ООО «ЦУПРФ»';

export const DEFAULT_OG_IMAGE_PATH = '/landing/og-image.webp';

export function getSiteOrigin(): string {
    const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return DEFAULT_SITE_ORIGIN;
}

export function absoluteSiteUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${getSiteOrigin()}${normalized}`;
}
