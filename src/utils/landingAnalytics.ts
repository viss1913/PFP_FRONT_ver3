import type { LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';
import { YM_COUNTER_ID } from '../config/analytics';

const UTM_KEY = 'landing_utm';

export type LandingAnalyticsEvent =
    | 'landing_view'
    | 'cta_click'
    | 'lang_switch'
    | 'lead_submit'
    | 'lead_form_open';

export interface LandingTrackingContext {
    lang: LandingLang;
    variant: LandingVariant;
    utm: Record<string, string>;
}

export function getStoredUtm(): Record<string, string> {
    try {
        const raw = sessionStorage.getItem(UTM_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, string>;
    } catch {
        return {};
    }
}

export function getTrackingContext(lang: LandingLang, variant: LandingVariant): LandingTrackingContext {
    return { lang, variant, utm: getStoredUtm() };
}

declare global {
    interface Window {
        ym?: (id: number, method: string, ...args: unknown[]) => void;
        gtag?: (...args: unknown[]) => void;
        dataLayer?: unknown[];
    }
}

let analyticsInitialized = false;

function resolveYmCounterId(): number {
    const fromEnv = Number(import.meta.env.VITE_YM_COUNTER_ID);
    if (!Number.isNaN(fromEnv) && fromEnv > 0) return fromEnv;
    return YM_COUNTER_ID;
}

function isYmScriptPresent(): boolean {
    return Array.from(document.scripts).some((s) => s.src.includes('mc.yandex.ru/metrika'));
}

export function initLandingAnalytics(): void {
    if (analyticsInitialized || typeof window === 'undefined') return;
    analyticsInitialized = true;

    const ymId = resolveYmCounterId();
    if (!isYmScriptPresent()) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://mc.yandex.ru/metrika/tag.js?id=${ymId}`;
        script.onload = () => {
            window.ym?.(ymId, 'init', {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true,
            });
        };
        document.head.appendChild(script);
    }

    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag(...args: unknown[]) {
            window.dataLayer?.push(args);
        };
        window.gtag('js', new Date());
        window.gtag('config', gaId);
    }
}

export function trackLandingEvent(
    event: LandingAnalyticsEvent,
    ctx: LandingTrackingContext,
    extra?: Record<string, string | number | boolean>
): void {
    const payload: Record<string, unknown> = {
        event,
        lang: ctx.lang,
        variant: ctx.variant,
        ...ctx.utm,
        ...extra,
    };

    if (import.meta.env.DEV) {
        console.debug('[landing analytics]', payload);
    }

    const ymId = resolveYmCounterId();
    if (window.ym) {
        window.ym(ymId, 'reachGoal', event, payload);
    }

    if (window.gtag) {
        window.gtag('event', event, payload);
    }
}
