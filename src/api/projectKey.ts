import { ATB_MASS_PROJECT_ID, ATB_MASS_PROJECT_KEY, isAtbMassPath } from '../config/atbMass';

/** Дефолтный публичный ключ проекта Finam (test API bank-future). */
export const DEFAULT_PROJECT_KEY = 'pk_7f1ccfe5b2598134a575320d';
export const DEFAULT_PROJECT_ID = 1;

/** Route-level project key: для специальных white-label/public lanes можем подменять ключ по pathname. */
export const PROJECT_KEY = isAtbMassPath() ? ATB_MASS_PROJECT_KEY : DEFAULT_PROJECT_KEY;

export function getRuntimeProjectId(): number {
    return isAtbMassPath() ? ATB_MASS_PROJECT_ID : DEFAULT_PROJECT_ID;
}
