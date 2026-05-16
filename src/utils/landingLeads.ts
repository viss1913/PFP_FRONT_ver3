import type { LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';
import { getStoredUtm } from './landingAnalytics';

export type LeadType = 'general' | 'client' | 'consultant';

export interface LandingLeadPayload {
    type: LeadType;
    name: string;
    phone: string;
    email?: string;
    consent: boolean;
    lang: LandingLang;
    variant: LandingVariant;
    utm: Record<string, string>;
    createdAt: string;
}

const LEADS_QUEUE_KEY = 'landing_leads_queue';

export async function submitLandingLead(
    data: Omit<LandingLeadPayload, 'createdAt' | 'utm'>
): Promise<{ ok: boolean; error?: string }> {
    const payload: LandingLeadPayload = {
        ...data,
        utm: getStoredUtm(),
        createdAt: new Date().toISOString(),
    };

    const queue = readLeadsQueue();
    queue.push(payload);
    localStorage.setItem(LEADS_QUEUE_KEY, JSON.stringify(queue));

    const webhook = import.meta.env.VITE_LANDING_LEAD_WEBHOOK;
    if (webhook) {
        try {
            const res = await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                return { ok: false, error: `Webhook ${res.status}` };
            }
        } catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
        }
    }

    return { ok: true };
}

function readLeadsQueue(): LandingLeadPayload[] {
    try {
        const raw = localStorage.getItem(LEADS_QUEUE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as LandingLeadPayload[];
    } catch {
        return [];
    }
}
