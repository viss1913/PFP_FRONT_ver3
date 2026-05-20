import { initLandingAnalytics, trackLandingEvent, getTrackingContext } from './landingAnalytics';
import type { LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';

const SBER_UTM = {
    utm_source: 'sber',
    utm_medium: 'partner_landing',
    utm_campaign: 'family_office_sber',
} as const;

const UTM_KEY = 'landing_utm';

export function persistSberUtm(): void {
    sessionStorage.setItem(UTM_KEY, JSON.stringify({ ...SBER_UTM }));
}

export function initSberLandingAnalytics(lang: LandingLang = 'ru', variant: LandingVariant = 'm'): void {
    persistSberUtm();
    initLandingAnalytics();
    trackLandingEvent('landing_view', getTrackingContext(lang, variant), {
        channel: 'sber',
        page: '/sber',
    });
}

export function trackSberCta(
    action: 'open_fo' | 'login' | 'main_site' | 'how_it_works',
    lang: LandingLang = 'ru',
    variant: LandingVariant = 'm',
): void {
    trackLandingEvent('cta_click', getTrackingContext(lang, variant), {
        channel: 'sber',
        sber_action: action,
    });
}
