import {
    DEFAULT_OG_IMAGE_PATH,
    DEFAULT_SITE_ORIGIN,
    SITE_NAME,
    absoluteSiteUrl,
} from '../config/site';
import { buildHomeJsonLd, buildSberWebPageJsonLd } from './jsonLd';

export interface PageSeoConfig {
    title: string;
    description: string;
    /** Путь для canonical: `/`, `/sber`, `/?page=privacy` */
    canonicalPath?: string;
    robots?: string;
    ogType?: 'website' | 'article';
    ogImagePath?: string;
    /** Заменить JSON-LD в head (публичные страницы). */
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
    const selector =
        attr === 'name'
            ? `meta[name="${key}"]`
            : `meta[property="${key}"]`;
    let el = document.head.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.content = content;
}

function upsertLink(rel: string, href: string): void {
    let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
    }
    el.href = href;
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]): void {
    const id = 'seo-jsonld';
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
        el = document.createElement('script');
        el.id = id;
        el.type = 'application/ld+json';
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
}

export const SEO = {
    home: {
        title: 'BankFuture — платформа family office для финансовых консультантов и агентов',
        description:
            'CRM, расчёт финансового плана, отчёты и продукты партнёров. Запустите практику family office без Excel. Оператор — ООО «ЦУПРФ».',
        canonicalPath: '/',
        robots: 'index, follow',
        ogImagePath: DEFAULT_OG_IMAGE_PATH,
        jsonLd: buildHomeJsonLd(DEFAULT_SITE_ORIGIN),
    },
    privacy: {
        title: 'Политика конфиденциальности — BankFuture',
        description:
            'Политика обработки персональных данных сайта BankFuture. Оператор персональных данных — ООО «ЦУПРФ».',
        canonicalPath: '/?page=privacy',
        robots: 'index, follow',
        ogImagePath: DEFAULT_OG_IMAGE_PATH,
    },
    login: {
        title: 'Вход — BankFuture',
        description: 'Вход в личный кабинет BankFuture для клиентов и консультантов.',
        canonicalPath: '/?page=login',
        robots: 'noindex, nofollow',
    },
    lk: {
        title: 'Личный кабинет — BankFuture',
        description: 'Рабочая область BankFuture: клиенты, ПФП, CRM и отчёты.',
        robots: 'noindex, nofollow',
    },
    preview: {
        title: 'Предпросмотр — BankFuture',
        description: 'Предпросмотр отчёта BankFuture.',
        robots: 'noindex, nofollow',
    },
    sber: {
        title: 'Family Office в Сбере — платформа BankFuture для семьи и консультанта',
        description:
            'Семейный офис и финансовый план в экосистеме Сбера: управление семейным капиталом, цели, защита и накопления. Партнёрский канал BankFuture.',
        canonicalPath: '/sber',
        robots: 'index, follow',
        ogImagePath: '/sber/hero-cover.png',
        jsonLd: buildSberWebPageJsonLd(DEFAULT_SITE_ORIGIN),
    },
    authFlow: {
        title: 'Регистрация — BankFuture',
        description: 'Активация приглашения и регистрация в BankFuture.',
        robots: 'noindex, nofollow',
    },
    atbMass: {
        title: 'Персональный финансовый план — BankFuture',
        description: 'Короткий сценарий персонального финансового планирования BankFuture.',
        robots: 'noindex, nofollow',
    },
} as const satisfies Record<string, PageSeoConfig>;

export function applyPageSeo(config: PageSeoConfig): void {
    if (typeof document === 'undefined') return;

    document.title = config.title;

    upsertMeta('name', 'description', config.description);
    upsertMeta('name', 'robots', config.robots ?? 'index, follow');

    const canonicalPath = config.canonicalPath ?? window.location.pathname + window.location.search;
    const canonicalUrl = absoluteSiteUrl(canonicalPath);
    upsertLink('canonical', canonicalUrl);

    const ogImage = absoluteSiteUrl(config.ogImagePath ?? DEFAULT_OG_IMAGE_PATH);
    const ogType = config.ogType ?? 'website';

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', config.title);
    upsertMeta('property', 'og:description', config.description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:locale', 'ru_RU');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', config.title);
    upsertMeta('name', 'twitter:description', config.description);
    upsertMeta('name', 'twitter:image', ogImage);

    if (config.jsonLd) {
        upsertJsonLd(config.jsonLd);
    }
}

/** Сброс неиспользуемых meta (при смене страницы не обязателен — всегда перезаписываем). */
export function getAppPageSeo(page: string): PageSeoConfig {
    switch (page) {
        case 'landing':
            return SEO.home;
        case 'privacy':
            return SEO.privacy;
        case 'login':
            return SEO.login;
        case 'report-preview':
        case 'html-report-preview':
            return SEO.preview;
        case 'list':
        case 'cjm':
        case 'edit':
        case 'result':
        case 'test':
        case 'ai-assistant':
        case 'ai-agent':
        case 'news':
        case 'macro':
        case 'settings':
        case 'client-card':
            return SEO.lk;
        default:
            return SEO.lk;
    }
}
