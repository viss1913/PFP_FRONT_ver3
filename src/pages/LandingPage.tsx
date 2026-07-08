import React, { useCallback, useEffect, useState } from 'react';
import '../styles/landing.css';
import { useLandingPreferences } from '../hooks/useLandingPreferences';
import { useLandingTheme } from '../hooks/useLandingTheme';
import { LandingActionsProvider } from '../context/LandingActionsContext';
import { initLandingAnalytics, getTrackingContext, trackLandingEvent } from '../utils/landingAnalytics';
import type { LeadType } from '../utils/landingLeads';
import LandingHeader from '../components/landing/LandingHeader';
import LandingHero from '../components/landing/LandingHero';
import LandingFamilyOffice from '../components/landing/LandingFamilyOffice';
import LandingStats from '../components/landing/LandingStats';
import LandingServices from '../components/landing/LandingServices';
import LandingHowItWorks from '../components/landing/LandingHowItWorks';
import LandingConsultant from '../components/landing/LandingConsultant';
import LandingJourney from '../components/landing/LandingJourney';
import LandingTools from '../components/landing/LandingTools';
import LandingEducation from '../components/landing/LandingEducation';
import LandingSuccessPath from '../components/landing/LandingSuccessPath';
import LandingTestimonials from '../components/landing/LandingTestimonials';
import LandingFaq from '../components/landing/LandingFaq';
import LandingPartners from '../components/landing/LandingPartners';
import LandingFinalCta from '../components/landing/LandingFinalCta';
import LandingFooter from '../components/landing/LandingFooter';
import CookieConsent from '../components/landing/CookieConsent';
import LandingStickyCta from '../components/landing/LandingStickyCta';
import LandingLeadModal from '../components/landing/LandingLeadModal';
import FamilyOfficeSelfRegisterModal, {
    type FoRegisterOpenSource,
} from '../components/landing/FamilyOfficeSelfRegisterModal';
import {
    captureClientB2cAttributionFromUrl,
    hasClientB2cReferral,
    navigateToB2cPlan,
} from '../utils/clientB2cAttribution';

interface LandingPageProps {
    onLogin: (intent?: 'client' | 'consultant') => void;
    onPrivacy: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onPrivacy }) => {
    const { lang, variant, setLang, copy } = useLandingPreferences();
    const { theme, setTheme } = useLandingTheme();
    const [cookieOpen, setCookieOpen] = useState(() => !localStorage.getItem('cookie_consent'));
    const [leadModal, setLeadModal] = useState<LeadType | null>(null);
    const [foRegisterOpen, setFoRegisterOpen] = useState(false);
    const [foRegisterSource, setFoRegisterSource] = useState<FoRegisterOpenSource>('manual');

    const openFoRegister = useCallback((source: string) => {
        if (hasClientB2cReferral()) {
            const ctx = getTrackingContext(lang, variant);
            trackLandingEvent('cta_click', ctx, { cta: 'open_family_office_b2c', source });
            navigateToB2cPlan();
            return;
        }
        const mapped: FoRegisterOpenSource =
            source === 'hero' || source === 'sticky' || source === 'final'
                ? source
                : 'manual';
        setFoRegisterSource(mapped);
        setFoRegisterOpen(true);
    }, [lang, variant]);

    useEffect(() => {
        captureClientB2cAttributionFromUrl();
    }, []);

    useEffect(() => {
        initLandingAnalytics();
        trackLandingEvent('landing_view', getTrackingContext(lang, variant));
    }, [lang, variant]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('open_fo') === '1' && !hasClientB2cReferral()) {
            setFoRegisterSource('deeplink');
            setFoRegisterOpen(true);
        }
        if (params.get('open_fo') === '1' && hasClientB2cReferral()) {
            navigateToB2cPlan();
        }
    }, []);

    const handleLangChange = useCallback(
        (next: typeof lang) => {
            if (next !== lang) {
                trackLandingEvent('lang_switch', getTrackingContext(next, variant), { from: lang, to: next });
            }
            setLang(next);
        },
        [lang, variant, setLang]
    );

    const handleCookieVisibility = useCallback((visible: boolean) => {
        setCookieOpen(visible);
    }, []);

    return (
        <LandingActionsProvider
            lang={lang}
            variant={variant}
            onLogin={onLogin}
            onOpenLeadForm={setLeadModal}
            onOpenFoRegister={openFoRegister}
        >
            <div
                className={`landing-page landing-page--${theme}${cookieOpen ? ' landing-cookie-open' : ''}`}
            >
                <LandingHeader
                    copy={copy}
                    lang={lang}
                    theme={theme}
                    onThemeChange={setTheme}
                    onLangChange={handleLangChange}
                    onLogin={() => onLogin()}
                />
                <main>
                    <div id="lead-client" className="landing-anchor" aria-hidden />
                    <LandingHero copy={copy} />
                    <LandingFamilyOffice copy={copy} />
                    <LandingStats copy={copy} />
                    <LandingServices copy={copy} />
                    <LandingHowItWorks copy={copy} />
                    <LandingConsultant copy={copy} />
                    <LandingJourney copy={copy} />
                    <LandingTools copy={copy} />
                    <LandingEducation copy={copy} />
                    <LandingSuccessPath copy={copy} />
                    <LandingTestimonials copy={copy} />
                    <LandingFaq copy={copy} />
                    <LandingPartners copy={copy} lang={lang} />
                    <LandingFinalCta copy={copy} />
                </main>
                <LandingFooter copy={copy} onPrivacyClick={onPrivacy} />
                <CookieConsent copy={copy} onLearnMore={onPrivacy} onVisibilityChange={handleCookieVisibility} />
                <LandingStickyCta copy={copy} />
                <LandingLeadModal
                    copy={copy}
                    lang={lang}
                    variant={variant}
                    type={leadModal}
                    onClose={() => setLeadModal(null)}
                />
                <FamilyOfficeSelfRegisterModal
                    isOpen={foRegisterOpen}
                    onClose={() => setFoRegisterOpen(false)}
                    lang={lang}
                    variant={variant}
                    openSource={foRegisterSource}
                />
            </div>
        </LandingActionsProvider>
    );
};

export default LandingPage;
