import type { LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';
import { getStoredUtm } from './landingAnalytics';

export function scrollToAnchor(anchorId: string): void {
    const el = document.getElementById(anchorId);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    window.location.hash = anchorId;
}

export function appendLandingParams(
    baseUrl: string,
    lang: LandingLang,
    variant: LandingVariant,
    extra?: Record<string, string>
): string {
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('lang', lang);
    url.searchParams.set('variant', variant);

    const utm = getStoredUtm();
    for (const [key, value] of Object.entries(utm)) {
        url.searchParams.set(key, value);
    }

    if (extra) {
        for (const [key, value] of Object.entries(extra)) {
            url.searchParams.set(key, value);
        }
    }

    return `${url.pathname}${url.search}${url.hash}`;
}

export function buildLoginPath(intent: 'client' | 'consultant', lang: LandingLang, variant: LandingVariant): string {
    return appendLandingParams(window.location.pathname, lang, variant, {
        page: 'login',
        intent,
    });
}
