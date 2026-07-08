import type { GuestCalculatePayload } from './b2cGuestCalculatePayload';

const DRAFT_KEY = 'pfp_b2c_plan_draft_v1';

export interface B2cPlanDraft {
    firstRunPayload: GuestCalculatePayload;
    calculationResult: unknown;
    savedAt: string;
    email?: string;
    guestToken?: string;
    clientId?: number;
    planSaved?: boolean;
}

export function saveB2cPlanDraft(draft: B2cPlanDraft): void {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
        console.error('Failed to save B2C plan draft', e);
    }
}

export function loadB2cPlanDraft(): B2cPlanDraft | null {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as B2cPlanDraft;
        if (!parsed?.firstRunPayload) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearB2cPlanDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
}
