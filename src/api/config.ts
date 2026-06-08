/**
 * Базовый URL бэкенда PFP.
 * - VITE_API_BASE_URL — полный префикс с /api (как на Vercel preview)
 * - VITE_API_URL — хост без /api (legacy)
 * Иначе — test API bank-future.
 */
function resolveApiBaseWithApi(): string {
    const rawBase = import.meta.env.VITE_API_BASE_URL?.trim();
    if (rawBase) return rawBase.replace(/\/$/, '');

    const rawUrl = import.meta.env.VITE_API_URL?.trim();
    if (rawUrl) {
        const host = rawUrl.replace(/\/$/, '').replace(/\/api$/, '');
        return `${host}/api`;
    }

    return 'https://pfp-api.bank-future.com/api';
}

export const API_BASE_WITH_API = resolveApiBaseWithApi();

/** Хост без суффикса /api — для ${API_BASE_URL}/api/auth и т.п. */
export const API_BASE_URL = API_BASE_WITH_API.replace(/\/api$/, '');
