import React, { useCallback, useEffect } from 'react';
import { SBER_FO_PROJECT_KEY } from '../../config/sberFamilyOffice';
import SberHeader from '../../components/sber/SberHeader';
import SberHero from '../../components/sber/SberHero';
import SberFamilyAdvantages from '../../components/sber/SberFamilyAdvantages';
import SberBenefits from '../../components/sber/SberBenefits';
import SberEcosystem from '../../components/sber/SberEcosystem';
import SberSteps from '../../components/sber/SberSteps';
import SberFooter from '../../components/sber/SberFooter';
import { useSberLandingTheme } from '../../hooks/useSberLandingTheme';
import { captureFamilyOfficeSelfRegisterAttributionFromUrl } from '../../utils/familyOfficeSelfRegisterAttribution';
import { initSberLandingAnalytics, trackSberCta } from '../../utils/sberLandingAnalytics';
import { buildSberRootUrl } from '../../utils/sberLandingNavigation';
import '../../styles/sber-landing.css';

const SberLandingPage: React.FC = () => {
    const { theme, setTheme } = useSberLandingTheme();

    useEffect(() => {
        captureFamilyOfficeSelfRegisterAttributionFromUrl(window.location.search, SBER_FO_PROJECT_KEY);
        initSberLandingAnalytics();
    }, []);

    const goToOpenFo = useCallback(() => {
        trackSberCta('open_fo');
        window.location.href = buildSberRootUrl({
            open_fo: '1',
            project_key: SBER_FO_PROJECT_KEY,
        });
    }, []);

    const goToLogin = useCallback(() => {
        trackSberCta('login');
        window.location.href = buildSberRootUrl({ page: 'login' });
    }, []);

    return (
        <div className={`sber-landing sber-landing--${theme}`}>
            <SberHeader theme={theme} onThemeChange={setTheme} onLogin={goToLogin} />
            <main>
                <SberHero onOpenFo={goToOpenFo} />
                <SberFamilyAdvantages />
                <SberBenefits />
                <SberEcosystem />
                <SberSteps onOpenFo={goToOpenFo} />
            </main>
            <SberFooter />
        </div>
    );
};

export default SberLandingPage;
