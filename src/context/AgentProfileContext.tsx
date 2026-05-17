import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    authApi,
    getPartnerWizardErrorMessage,
    type AgentMeProfileFields,
    type AuthMeResponse,
} from '../api/authApi';
import { agentLkApi } from '../api/agentLkApi';

export type FinamModalStep = 'pitch' | 'paste-link';

const DISMISS_KEY_PREFIX = 'pfp_finam_onboarding_dismissed_';

function isDismissed(agentId: number | undefined): boolean {
    if (!agentId) return false;
    return localStorage.getItem(`${DISMISS_KEY_PREFIX}${agentId}`) === '1';
}

function setDismissed(agentId: number): void {
    localStorage.setItem(`${DISMISS_KEY_PREFIX}${agentId}`, '1');
}

function looksLikeUrl(value: string): boolean {
    const v = value.trim();
    return v.startsWith('http://') || v.startsWith('https://') || v.includes('finam');
}

export interface AgentProfileContextValue {
    profile: AuthMeResponse | null;
    loading: boolean;
    isLimitedAccess: boolean;
    shouldShowFinamOnboarding: boolean;
    finamModalStep: FinamModalStep | null;
    manualWizardOpen: boolean;
    refreshProfile: () => Promise<AuthMeResponse | null>;
    applyProfileFromAuth: (data: Partial<AuthMeResponse> & { token?: string }) => void;
    goToFinamRegistration: () => void;
    skipFinamOnboarding: () => Promise<void>;
    submitPartnerId: (rawValue: string) => Promise<void>;
    openPasteLinkWizard: () => void;
    closeManualWizard: () => void;
}

const AgentProfileContext = createContext<AgentProfileContextValue | null>(null);

function mergeProfileFields(
    prev: AuthMeResponse | null,
    fields: Partial<AgentMeProfileFields>,
): AuthMeResponse | null {
    if (!prev) return null;
    return { ...prev, ...fields };
}

export const AgentProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<AuthMeResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [finamModalStep, setFinamModalStep] = useState<FinamModalStep | null>(null);
    const [manualWizardOpen, setManualWizardOpen] = useState(false);

    const isLimitedAccess = profile != null && profile.has_partner_full_access === false;

    const shouldShowFinamOnboarding = useMemo(() => {
        if (!profile || profile.has_partner_full_access !== false) return false;
        if (manualWizardOpen) return true;
        if (isDismissed(profile.agentId)) return false;
        return true;
    }, [profile, manualWizardOpen]);

    useEffect(() => {
        if (shouldShowFinamOnboarding && finamModalStep === null && !manualWizardOpen) {
            setFinamModalStep('pitch');
        }
        if (!shouldShowFinamOnboarding && !manualWizardOpen) {
            setFinamModalStep(null);
        }
    }, [shouldShowFinamOnboarding, finamModalStep, manualWizardOpen]);

    const applyProfileFromAuth = useCallback(
        (data: Partial<AuthMeResponse> & {
            token?: string;
            user?: { id: number; email: string; role: string; agentId: number; projectId: number };
        }) => {
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            const u = data.user;
            const { token: _token, user: _user, ...profileFields } = data;
            setProfile((prev) => ({
                id: profileFields.id ?? u?.id ?? prev?.id ?? 0,
                email: profileFields.email ?? u?.email ?? prev?.email ?? '',
                role: profileFields.role ?? u?.role ?? prev?.role ?? 'agent',
                agentId: profileFields.agentId ?? u?.agentId ?? prev?.agentId ?? 0,
                projectId: profileFields.projectId ?? u?.projectId ?? prev?.projectId ?? 0,
                ...prev,
                ...profileFields,
            }));
        },
        [],
    );

    const applyWizardResponse = useCallback((res: AgentMeProfileFields) => {
        setProfile((prev) => (prev ? mergeProfileFields(prev, res) : prev));
    }, []);

    const refreshProfile = useCallback(async (): Promise<AuthMeResponse | null> => {
        const token = localStorage.getItem('token');
        if (!token) {
            setProfile(null);
            return null;
        }
        setLoading(true);
        try {
            const me = await authApi.getMe(token);
            setProfile(me);
            return me;
        } catch {
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            void refreshProfile();
        }
    }, [refreshProfile]);

    const goToFinamRegistration = useCallback(() => {
        const url = profile?.finam_agent_registration_url;
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        setFinamModalStep('paste-link');
    }, [profile?.finam_agent_registration_url]);

    const skipFinamOnboarding = useCallback(async () => {
        if (!profile) return;

        if (profile.parent_agent_id != null) {
            setLoading(true);
            try {
                const res = await agentLkApi.submitPartnerIdWizard({ action: 'skip' });
                applyWizardResponse(res);
                setManualWizardOpen(false);
                if (res.has_partner_full_access) {
                    setFinamModalStep(null);
                }
            } catch (err) {
                throw new Error(getPartnerWizardErrorMessage(err));
            } finally {
                setLoading(false);
            }
            return;
        }

        setDismissed(profile.agentId);
        setFinamModalStep(null);
        setManualWizardOpen(false);
    }, [profile, applyWizardResponse]);

    const submitPartnerId = useCallback(
        async (rawValue: string) => {
            const trimmed = rawValue.trim();
            if (!trimmed) {
                throw new Error('Введите Finam ID или ссылку');
            }

            setLoading(true);
            try {
                const body = looksLikeUrl(trimmed)
                    ? { action: 'set' as const, partner_ref_url: trimmed }
                    : { action: 'set' as const, partner_agent_id: trimmed };

                const res = await agentLkApi.submitPartnerIdWizard(body);
                applyWizardResponse(res);
                setManualWizardOpen(false);
                if (res.has_partner_full_access) {
                    setFinamModalStep(null);
                }
            } catch (err) {
                throw new Error(getPartnerWizardErrorMessage(err));
            } finally {
                setLoading(false);
            }
        },
        [applyWizardResponse],
    );

    const openPasteLinkWizard = useCallback(() => {
        setManualWizardOpen(true);
        setFinamModalStep('paste-link');
    }, []);

    const closeManualWizard = useCallback(() => {
        setManualWizardOpen(false);
        if (profile?.has_partner_full_access !== false && isDismissed(profile?.agentId)) {
            setFinamModalStep(null);
        }
    }, [profile]);

    const value = useMemo<AgentProfileContextValue>(
        () => ({
            profile,
            loading,
            isLimitedAccess,
            shouldShowFinamOnboarding,
            finamModalStep,
            manualWizardOpen,
            refreshProfile,
            applyProfileFromAuth,
            goToFinamRegistration,
            skipFinamOnboarding,
            submitPartnerId,
            openPasteLinkWizard,
            closeManualWizard,
        }),
        [
            profile,
            loading,
            isLimitedAccess,
            shouldShowFinamOnboarding,
            finamModalStep,
            manualWizardOpen,
            refreshProfile,
            applyProfileFromAuth,
            goToFinamRegistration,
            skipFinamOnboarding,
            submitPartnerId,
            openPasteLinkWizard,
            closeManualWizard,
        ],
    );

    return (
        <AgentProfileContext.Provider value={value}>{children}</AgentProfileContext.Provider>
    );
};

export function useAgentProfile(): AgentProfileContextValue {
    const ctx = useContext(AgentProfileContext);
    if (!ctx) {
        throw new Error('useAgentProfile must be used within AgentProfileProvider');
    }
    return ctx;
}

export function useAgentProfileOptional(): AgentProfileContextValue | null {
    return useContext(AgentProfileContext);
}

export function isFinamOnboardingDismissed(agentId: number | undefined): boolean {
    return isDismissed(agentId);
}
