import { ATB_MASS_PROJECT_ID, ATB_MASS_PROJECT_KEY, isAtbMassPath } from '../config/atbMass';

/** Дефолтный публичный ключ проекта Finam (test API bank-future). */
export const DEFAULT_PROJECT_KEY = 'pk_7f1ccfe5b2598134a575320d';
export const DEFAULT_PROJECT_ID = 1;

function resolvePartnerProjectKey(): string | undefined {
    const value = import.meta.env.VITE_PARTNER_PROJECT_KEY?.trim();
    return value || undefined;
}

function resolvePartnerProjectId(): number | undefined {
    const raw = import.meta.env.VITE_PARTNER_PROJECT_ID?.trim();
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
}

/** Route-level project key: ATB override → partner env → Finam default. */
export const PROJECT_KEY = isAtbMassPath()
    ? ATB_MASS_PROJECT_KEY
    : (resolvePartnerProjectKey() ?? DEFAULT_PROJECT_KEY);

export function getRuntimeProjectId(): number {
    if (isAtbMassPath()) return ATB_MASS_PROJECT_ID;
    return resolvePartnerProjectId() ?? DEFAULT_PROJECT_ID;
}
