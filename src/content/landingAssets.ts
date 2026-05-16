export type LandingVariant = 'm' | 'f';

const base = '/landing';

function envImage(key: keyof ImportMetaEnv, fallback: string): string {
    const fromEnv = import.meta.env[key] as string | undefined;
    return fromEnv?.trim() || fallback;
}

/** Визуал лендинга — один набор для всех (без привязки к variant m/f) */
export const landingVisualAssets = {
    heroImage: envImage('VITE_LANDING_HERO_IMAGE', `${base}/hero.webp`),
    heroSrcSet: (import.meta.env.VITE_LANDING_HERO_SRCSET as string | undefined)?.trim() || undefined,
    educationPoster: envImage('VITE_LANDING_EDUCATION_IMAGE', `${base}/education.webp`),
    statsIllustration: envImage('VITE_LANDING_STATS_IMAGE', `${base}/stats-illustration.webp`),
    testimonialAvatars: [
        `${base}/avatar-1.webp`,
        `${base}/avatar-2.webp`,
        `${base}/avatar-3.webp`,
    ] as const,
};

export interface PartnerAsset {
    id: string;
    nameRu: string;
    nameEn: string;
    placeholder: string;
    logo: string;
}

export const landingPartners: PartnerAsset[] = [
    {
        id: 'bankfuture',
        nameRu: 'BankFuture',
        nameEn: 'BankFuture',
        placeholder: 'BankFuture',
        logo: `${base}/partners/bankfuture.svg`,
    },
    {
        id: 'finam',
        nameRu: 'АО «Финам»',
        nameEn: 'JSC Finam',
        placeholder: 'FINAM',
        logo: `${base}/partners/finam.svg`,
    },
    {
        id: 'sber-life',
        nameRu: 'АО «Сбербанк страхование жизни»',
        nameEn: 'JSC Sber Life Insurance',
        placeholder: 'Sber Life',
        logo: `${base}/partners/sber-life.svg`,
    },
    {
        id: 'renaissance',
        nameRu: 'НПФ «Ренессанс Накопления»',
        nameEn: 'Renaissance Savings NPF',
        placeholder: 'Renaissance',
        logo: `${base}/partners/renaissance.svg`,
    },
];

export const landingVideoUrl =
    (import.meta.env.VITE_LANDING_VIDEO_URL as string | undefined)?.trim() || '';

/** @deprecated используй landingVisualAssets.statsIllustration */
export const landingStatsIllustration = landingVisualAssets.statsIllustration;
