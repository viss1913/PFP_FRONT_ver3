export const ATB_MASS_ROUTE_PATH = '/atb_mass';
/** Алиас того же lane (ATB Bank). */
export const ATB_BANK_ROUTE_PATH = '/atb_bank';
export const ATB_LANE_ROUTE_PATHS = [ATB_MASS_ROUTE_PATH, ATB_BANK_ROUTE_PATH] as const;

export const ATB_MASS_PROJECT_ID = 3;
export const ATB_MASS_PROJECT_KEY = 'pk_e0d2b45ac658fd23726398f5';

function normalizePathname(pathname: string): string {
    return pathname.replace(/\/+$/, '') || '/';
}

export function isAtbMassPath(pathname: string = window.location.pathname): boolean {
    const path = normalizePathname(pathname);
    return ATB_LANE_ROUTE_PATHS.includes(path as (typeof ATB_LANE_ROUTE_PATHS)[number]);
}

export function isAtbBankPath(pathname: string = window.location.pathname): boolean {
    return normalizePathname(pathname) === ATB_BANK_ROUTE_PATH;
}
