import { PROJECT_KEY } from '../api/projectKey';

const STORAGE_KEY = 'pfp_agent_register_attribution';

export interface AgentRegisterAttribution {
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

/** Считать query из invite-link и сохранить в sessionStorage. */
export function captureAgentRegisterAttributionFromUrl(
    search = window.location.search,
): AgentRegisterAttribution {
    const params = new URLSearchParams(search);
    const stored = loadAgentRegisterAttribution();

    const next: AgentRegisterAttribution = {
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

export function loadAgentRegisterAttribution(): AgentRegisterAttribution | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as AgentRegisterAttribution;
        if (!parsed?.project_key) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function getAgentRegisterAttribution(): AgentRegisterAttribution {
    return (
        loadAgentRegisterAttribution() ?? {
            project_key: PROJECT_KEY,
        }
    );
}
