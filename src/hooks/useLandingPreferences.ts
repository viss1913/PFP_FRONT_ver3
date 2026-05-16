import { useCallback, useEffect, useMemo, useState } from 'react';
import { landingCopy, type LandingLang } from '../content/landingCopy';
import type { LandingVariant } from '../content/landingAssets';

const LANG_KEY = 'landing_lang';
const VARIANT_KEY = 'landing_variant';
const UTM_KEY = 'landing_utm';

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

function parseLang(value: string | null): LandingLang | null {
    if (value === 'ru' || value === 'en') return value;
    return null;
}

function parseVariant(value: string | null): LandingVariant | null {
    const v = value?.toLowerCase();
    if (v === 'm' || v === 'male' || v === 'man') return 'm';
    if (v === 'f' || v === 'female' || v === 'woman') return 'f';
    return null;
}

function variantFromUtmContent(content: string | null): LandingVariant | null {
    if (!content) return null;
    const c = content.toLowerCase();
    if (c.includes('female') || c.includes('woman') || c === 'f') return 'f';
    if (c.includes('male') || c.includes('man') || c === 'm') return 'm';
    return null;
}

function readInitialLang(): LandingLang {
    const params = new URLSearchParams(window.location.search);
    return parseLang(params.get('lang')) ?? parseLang(localStorage.getItem(LANG_KEY)) ?? 'ru';
}

function readInitialVariant(): LandingVariant {
    const params = new URLSearchParams(window.location.search);
    return (
        parseVariant(params.get('variant')) ??
        variantFromUtmContent(params.get('utm_content')) ??
        parseVariant(localStorage.getItem(VARIANT_KEY)) ??
        'm'
    );
}

function persistUtmOnce() {
    if (sessionStorage.getItem(UTM_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
        const val = params.get(key);
        if (val) utm[key] = val;
    }
    if (Object.keys(utm).length > 0) {
        sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
}

export function useLandingPreferences() {
    const [lang, setLangState] = useState<LandingLang>(readInitialLang);
    const [variant, setVariantState] = useState<LandingVariant>(readInitialVariant);

    useEffect(() => {
        persistUtmOnce();
    }, []);

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const setLang = useCallback((next: LandingLang) => {
        setLangState(next);
        localStorage.setItem(LANG_KEY, next);
    }, []);

    const setVariant = useCallback((next: LandingVariant) => {
        setVariantState(next);
        localStorage.setItem(VARIANT_KEY, next);
    }, []);

    const copy = useMemo(() => landingCopy[lang], [lang]);

    return { lang, variant, setLang, setVariant, copy };
}
