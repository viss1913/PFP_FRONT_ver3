const STORAGE_KEY = 'pfp_fo_self_register_attribution';

export interface FamilyOfficeSelfRegisterAttribution {
    project_key: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
}

const UTM_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
] as const;

const DEFAULT_LANDING_UTM: Pick<
    FamilyOfficeSelfRegisterAttribution,
    'utm_medium' | 'utm_campaign' | 'utm_source'
> = {
    utm_medium: 'family_office_self_register',
    utm_campaign: 'open_family_office',
    utm_source: 'landing',
};

const DEFAULT_SBER_UTM: Pick<
    FamilyOfficeSelfRegisterAttribution,
    'utm_medium' | 'utm_campaign' | 'utm_source'
> = {
    utm_source: 'sber',
    utm_medium: 'partner_landing',
    utm_campaign: 'family_office_sber',
};

function getDefaultUtm(): Pick<
    FamilyOfficeSelfRegisterAttribution,
    'utm_medium' | 'utm_campaign' | 'utm_source'
> {
    if (typeof window === 'undefined') return DEFAULT_LANDING_UTM;
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path === '/sber') return DEFAULT_SBER_UTM;
    return DEFAULT_LANDING_UTM;
}

function readParam(params: URLSearchParams, key: string): string | undefined {
    const value = params.get(key)?.trim();
    return value || undefined;
}

export function captureFamilyOfficeSelfRegisterAttributionFromUrl(
    search = window.location.search,
    projectKey: string,
): FamilyOfficeSelfRegisterAttribution {
    const params = new URLSearchParams(search);
    const stored = loadFamilyOfficeSelfRegisterAttribution();

    const defaults = getDefaultUtm();
    const next: FamilyOfficeSelfRegisterAttribution = {
        project_key: readParam(params, 'project_key') ?? stored?.project_key ?? projectKey,
        utm_source: readParam(params, 'utm_source') ?? stored?.utm_source ?? defaults.utm_source,
        utm_medium: readParam(params, 'utm_medium') ?? stored?.utm_medium ?? defaults.utm_medium,
        utm_campaign:
            readParam(params, 'utm_campaign') ?? stored?.utm_campaign ?? defaults.utm_campaign,
    };

    for (const key of UTM_KEYS) {
        if (key === 'utm_source' || key === 'utm_medium' || key === 'utm_campaign') continue;
        const value = readParam(params, key) ?? stored?.[key];
        if (value) next[key] = value;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function loadFamilyOfficeSelfRegisterAttribution(): FamilyOfficeSelfRegisterAttribution | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as FamilyOfficeSelfRegisterAttribution;
        if (!parsed?.project_key) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function getFamilyOfficeSelfRegisterAttribution(
    projectKey: string,
): FamilyOfficeSelfRegisterAttribution {
    return (
        loadFamilyOfficeSelfRegisterAttribution() ?? {
            project_key: projectKey,
            ...getDefaultUtm(),
        }
    );
}
