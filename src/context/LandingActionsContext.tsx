import React, { createContext, useCallback, useContext, useMemo } from 'react';
import type { LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';
import type { LeadType } from '../utils/landingLeads';
import { getTrackingContext, trackLandingEvent } from '../utils/landingAnalytics';

export type { LeadType };

interface LandingActionsContextValue {
    lang: LandingLang;
    variant: LandingVariant;
    onPrimaryCta: (source: string) => void;
    openLeadForm: (type: LeadType, source?: string) => void;
    onLoginWithIntent: (intent?: 'client' | 'consultant') => void;
}

const LandingActionsContext = createContext<LandingActionsContextValue | null>(null);

interface LandingActionsProviderProps {
    lang: LandingLang;
    variant: LandingVariant;
    onLogin: (intent?: 'client' | 'consultant') => void;
    onOpenLeadForm: (type: LeadType) => void;
    onOpenFoRegister: (source: string) => void;
    children: React.ReactNode;
}

export const LandingActionsProvider: React.FC<LandingActionsProviderProps> = ({
    lang,
    variant,
    onLogin,
    onOpenLeadForm,
    onOpenFoRegister,
    children,
}) => {
    const onPrimaryCta = useCallback(
        (source: string) => {
            const ctx = getTrackingContext(lang, variant);
            trackLandingEvent('cta_click', ctx, { cta: 'open_family_office', source });
            onOpenFoRegister(source);
        },
        [lang, variant, onOpenFoRegister]
    );

    const openLeadForm = useCallback(
        (type: LeadType, source = 'manual') => {
            const ctx = getTrackingContext(lang, variant);
            trackLandingEvent('lead_form_open', ctx, { type, source });
            onOpenLeadForm(type);
        },
        [lang, variant, onOpenLeadForm]
    );

    const onLoginWithIntent = useCallback(
        (intent?: 'client' | 'consultant') => {
            onLogin(intent);
        },
        [onLogin]
    );

    const value = useMemo(
        () => ({
            lang,
            variant,
            onPrimaryCta,
            openLeadForm,
            onLoginWithIntent,
        }),
        [lang, variant, onPrimaryCta, openLeadForm, onLoginWithIntent]
    );

    return <LandingActionsContext.Provider value={value}>{children}</LandingActionsContext.Provider>;
};

export function useLandingActions(): LandingActionsContextValue {
    const ctx = useContext(LandingActionsContext);
    if (!ctx) {
        throw new Error('useLandingActions must be used within LandingActionsProvider');
    }
    return ctx;
}
