import { landingCopy } from '../content/landingCopy';
import { DEFAULT_SITE_ORIGIN, SITE_LEGAL_NAME, SITE_NAME, getSiteOrigin } from '../config/site';

export function buildOrganizationJsonLd(origin: string = getSiteOrigin()) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: SITE_LEGAL_NAME,
        url: `${origin}/`,
        logo: `${origin}/landing/favicon.svg`,
        description:
            'Платформа family office для финансовых консультантов и агентов: CRM, расчёт финансового плана, отчёты и продукты партнёров.',
    };
}

export function buildWebSiteJsonLd(origin: string = getSiteOrigin()) {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${origin}/`,
        inLanguage: ['ru-RU', 'en'],
        publisher: {
            '@type': 'Organization',
            name: SITE_LEGAL_NAME,
        },
    };
}

export function buildSoftwareApplicationJsonLd(origin: string = getSiteOrigin()) {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${origin}/`,
        description:
            'Платформа family office для финансовых консультантов и агентов: CRM, расчёт финансового плана, отчёты и продукты партнёров.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'RUB',
            description: 'Заявка на подключение — условия по запросу',
        },
        audience: {
            '@type': 'Audience',
            audienceType: 'Financial advisors and insurance agents',
        },
        provider: {
            '@type': 'Organization',
            name: SITE_LEGAL_NAME,
        },
    };
}

export function buildFaqPageJsonLd(
    items: { q: string; a: string }[],
    origin: string = getSiteOrigin(),
) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
            },
        })),
        url: `${origin}/`,
    };
}

export function buildHomeJsonLd(origin: string = DEFAULT_SITE_ORIGIN) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            buildOrganizationJsonLd(origin),
            buildWebSiteJsonLd(origin),
            buildSoftwareApplicationJsonLd(origin),
            buildFaqPageJsonLd(landingCopy.ru.faq.items, origin),
        ],
    };
}

export function buildSberWebPageJsonLd(origin: string = DEFAULT_SITE_ORIGIN) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                name: 'Family Office в Сбере — BankFuture',
                description:
                    'Семейный офис и финансовый план в экосистеме Сбера: цели, защита, накопления для семьи и консультанта.',
                url: `${origin}/sber`,
                isPartOf: buildWebSiteJsonLd(origin),
                about: buildOrganizationJsonLd(origin),
            },
            buildOrganizationJsonLd(origin),
        ],
    };
}
