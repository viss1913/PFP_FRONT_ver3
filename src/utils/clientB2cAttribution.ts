import { PROJECT_KEY } from '../api/projectKey';

const STORAGE_KEY = 'pfp_client_b2c_attribution';

export interface ClientB2cAttribution {
    project_key: string;
    ref?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    utm_partner_finam?: string;
}

const UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'utm_partner_finam',
] as const;

function readParam(params: URLSearchParams, key: string): string | undefined {
    const value = params.get(key)?.trim();
    return value || undefined;
}

/** Захватить ref / project_key / UTM из invite-link клиента. */
export function captureClientB2cAttributionFromUrl(
    search = window.location.search,
): ClientB2cAttribution {
    const params = new URLSearchParams(search);
    const stored = loadClientB2cAttribution();

    const next: ClientB2cAttribution = {
        project_key:
            readParam(params, 'project_key') ?? stored?.project_key ?? PROJECT_KEY,
        ref: readParam(params, 'ref') ?? stored?.ref,
    };

    for (const key of UTM_KEYS) {
        const value = readParam(params, key) ?? stored?.[key];
        if (value) next[key] = value;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function loadClientB2cAttribution(): ClientB2cAttribution | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ClientB2cAttribution;
        if (!parsed?.project_key) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function getClientB2cAttribution(): ClientB2cAttribution {
    return (
        loadClientB2cAttribution() ?? {
            project_key: PROJECT_KEY,
        }
    );
}

export function hasClientB2cReferral(): boolean {
    return Boolean(getClientB2cAttribution().ref?.trim());
}

/** Query string для перехода на /plan с сохранённой атрибуцией. */
export function buildB2cPlanSearchParams(attribution = getClientB2cAttribution()): string {
    const params = new URLSearchParams();
    if (attribution.ref) params.set('ref', attribution.ref);
    if (attribution.project_key) params.set('project_key', attribution.project_key);
    for (const key of UTM_KEYS) {
        const value = attribution[key];
        if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

/** Путь guest CJM. Важно: /plan/ (со слэшем), иначе CDN редирект съедает query. */
export function buildB2cPlanPath(attribution = getClientB2cAttribution()): string {
    const qs = buildB2cPlanSearchParams(attribution);
    return qs ? `/plan/${qs}` : '/plan/';
}

export function navigateToB2cPlan(): void {
    window.location.assign(buildB2cPlanPath());
}

/**
 * Бэк отдаёт url вида …/plan?ref=… — для CDN нужен /plan/ (со слэшем).
 * Query не трогаем: project_key / UTM не дописываем от себя.
 */
export function normalizeClientInviteUrl(url: string): string {
    try {
        const parsed = new URL(url, window.location.origin);
        const ref = parsed.searchParams.get('ref')?.trim();
        if (!ref) return url;

        const qs = parsed.searchParams.toString();
        return `${parsed.origin}/plan/${qs ? `?${qs}` : ''}`;
    } catch {
        return url;
    }
}

/** Если открыли корень с ref (ссылка агента) — сразу на guest CJM, даже если залогинен агент. */
export function redirectRootClientReferralToPlan(): void {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.get('ref')?.trim()) return;
    captureClientB2cAttributionFromUrl();
    window.location.replace(buildB2cPlanPath());
}
