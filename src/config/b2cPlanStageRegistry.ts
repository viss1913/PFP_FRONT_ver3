/**
 * Maps orchestrator stage_key (from classifier_command / agent LK) to client `/plan` screens.
 * Keys align with api_docs examples; normalize with/without leading slash.
 */

export type B2cPlanStageKind = 'welcome' | 'cjm' | 'result' | 'unknown';

export interface B2cPlanStageDefinition {
    /** Canonical page route sent in UI events (`page` field). */
    page: string;
    kind: B2cPlanStageKind;
    /** CJMFlow step number when kind === 'cjm' (guest mode). */
    cjmStep?: number;
    title?: string;
}

/** Default registry — extend when backend adds stages (GET /my/ai-b2c/stages?flow_key=plan). */
export const B2C_PLAN_STAGE_REGISTRY: Record<string, B2cPlanStageDefinition> = {
    '/start': { page: '/start', kind: 'welcome', title: 'Старт' },
    start: { page: '/start', kind: 'welcome', title: 'Старт' },
    '/lichnye_dannye': { page: '/lichnye_dannye', kind: 'cjm', cjmStep: 1, title: 'Личные данные' },
    lichnye_dannye: { page: '/lichnye_dannye', kind: 'cjm', cjmStep: 1, title: 'Личные данные' },
    '/vybor_celi2': { page: '/vybor_celi2', kind: 'cjm', cjmStep: 3, title: 'Выбор цели' },
    vybor_celi2: { page: '/vybor_celi2', kind: 'cjm', cjmStep: 3, title: 'Выбор цели' },
    '/aktivy': { page: '/aktivy', kind: 'cjm', cjmStep: 4, title: 'Активы' },
    aktivy: { page: '/aktivy', kind: 'cjm', cjmStep: 4, title: 'Активы' },
    '/finrezerv': { page: '/finrezerv', kind: 'cjm', cjmStep: 5, title: 'Финрезерв' },
    finrezerv: { page: '/finrezerv', kind: 'cjm', cjmStep: 5, title: 'Финрезерв' },
    '/zhizn': { page: '/zhizn', kind: 'cjm', cjmStep: 6, title: 'Защита жизни' },
    zhizn: { page: '/zhizn', kind: 'cjm', cjmStep: 6, title: 'Защита жизни' },
    '/risk': { page: '/risk', kind: 'cjm', cjmStep: 7, title: 'Риск-профиль' },
    risk: { page: '/risk', kind: 'cjm', cjmStep: 7, title: 'Риск-профиль' },
    '/test23_pensia': { page: '/test23_pensia', kind: 'cjm', cjmStep: 3, title: 'Пенсия' },
    test23_pensia: { page: '/test23_pensia', kind: 'cjm', cjmStep: 3, title: 'Пенсия' },
    '/result': { page: '/result', kind: 'result', title: 'Результат' },
    result: { page: '/result', kind: 'result', title: 'Результат' },
};

export const B2C_PLAN_DEFAULT_STAGE_KEY = '/start';

export function normalizeStageKey(raw: string | null | undefined): string {
    const trimmed = (raw ?? '').trim();
    if (!trimmed) return B2C_PLAN_DEFAULT_STAGE_KEY;
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Resolve navigation target from SSE classifier_command.
 * Empty command/stage_key → null (do not change screen; chat-only turn).
 * Prefer stage_key over command when both present.
 */
export function resolveStageFromCommand(
    command?: string | null,
    stageKey?: string | null,
): string | null {
    const key = (stageKey ?? command ?? '').trim();
    if (!key) return null;
    return normalizeStageKey(key);
}

export function getStageDefinition(stageKey: string | null | undefined): B2cPlanStageDefinition {
    const normalized = normalizeStageKey(stageKey);
    return (
        B2C_PLAN_STAGE_REGISTRY[normalized] ??
        B2C_PLAN_STAGE_REGISTRY[normalized.replace(/^\//, '')] ?? {
            page: normalized,
            kind: 'unknown',
            title: normalized,
        }
    );
}

export function getPageForStageKey(stageKey: string | null | undefined): string {
    return getStageDefinition(stageKey).page;
}

/**
 * Merge agent LK stages into the live client registry (mutates B2C_PLAN_STAGE_REGISTRY).
 * Known keys keep kind/cjmStep; new keys land as kind=unknown until mapped in code.
 */
export function mergeStagesFromApi(
    apiStages: Array<{ stage_key?: string; title?: string }>,
): Record<string, B2cPlanStageDefinition> {
    for (const stage of apiStages) {
        const key = stage.stage_key?.trim();
        if (!key) continue;
        const normalized = normalizeStageKey(key);
        const existing = getStageDefinition(normalized);
        const next: B2cPlanStageDefinition = {
            ...existing,
            page: existing.kind === 'unknown' ? normalized : existing.page,
            title: stage.title ?? existing.title ?? normalized,
        };
        B2C_PLAN_STAGE_REGISTRY[normalized] = next;
        B2C_PLAN_STAGE_REGISTRY[normalized.replace(/^\//, '')] = next;
    }
    return { ...B2C_PLAN_STAGE_REGISTRY };
}
