import type { ClientReferralPreviewAgent, ClientReferralPreviewResponse } from '../api/b2cApi';
import type { B2cPlanSessionAgent, B2cPlanSessionContext } from '../types/b2cOrchestrator';

/** Build full name: first+last, else display_name. */
export function formatReferralAgentFullName(
    agent: Pick<ClientReferralPreviewAgent, 'first_name' | 'last_name' | 'display_name'>,
): string {
    const fromParts = [agent.first_name, agent.last_name]
        .map((p) => (p ?? '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    if (fromParts) return fromParts;
    return (agent.display_name ?? '').trim();
}

export function buildSessionAgentFromPreview(
    agent: ClientReferralPreviewAgent | null | undefined,
): B2cPlanSessionAgent | null {
    if (!agent) return null;
    const full_name = formatReferralAgentFullName(agent);
    if (!full_name) return null;
    return {
        id: agent.id,
        first_name: agent.first_name ?? null,
        last_name: agent.last_name ?? null,
        full_name,
        display_name: agent.display_name?.trim() || full_name,
    };
}

/**
 * Session context for orchestrator turns.
 * FIO only from referral preview (trusted API), never from free-form URL parsing.
 */
export function buildB2cPlanSessionContext(options: {
    ref?: string | null;
    preview?: ClientReferralPreviewResponse | null;
}): B2cPlanSessionContext | undefined {
    const ref = options.ref?.trim() || undefined;
    const agent = buildSessionAgentFromPreview(options.preview?.agent);
    if (!ref && !agent) return undefined;
    return {
        ...(ref ? { ref } : {}),
        agent: agent ?? null,
    };
}
