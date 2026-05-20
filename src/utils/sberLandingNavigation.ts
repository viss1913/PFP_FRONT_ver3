const SBER_UTM = {
    utm_source: 'sber',
    utm_medium: 'partner_landing',
    utm_campaign: 'family_office_sber',
} as const;

export function buildSberRootUrl(extra: Record<string, string>): string {
    const url = new URL('/', window.location.origin);
    url.searchParams.set('lang', 'ru');
    url.searchParams.set('variant', 'm');
    for (const [key, value] of Object.entries(SBER_UTM)) {
        url.searchParams.set(key, value);
    }
    for (const [key, value] of Object.entries(extra)) {
        url.searchParams.set(key, value);
    }
    return url.toString();
}

export function scrollToHowItWorks(): void {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
