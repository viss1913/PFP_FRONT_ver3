/**
 * Feature flag: orchestrator mode on `/plan`.
 * - VITE_B2C_PLAN_ORCHESTRATOR=1
 * - or URL ?orchestrator=1
 */
export function isB2cPlanOrchestratorEnabled(): boolean {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('orchestrator') === '1') return true;
        if (params.get('orchestrator') === '0') return false;
    }
    const env = import.meta.env.VITE_B2C_PLAN_ORCHESTRATOR;
    return env === '1' || env === 'true';
}
