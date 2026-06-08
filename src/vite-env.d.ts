/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_LANDING_STATS_IMAGE?: string;
    readonly VITE_LANDING_HERO_IMAGE?: string;
    readonly VITE_LANDING_HERO_SRCSET?: string;
    readonly VITE_LANDING_EDUCATION_IMAGE?: string;
    readonly VITE_LANDING_VIDEO_URL?: string;
    readonly VITE_LANDING_LEAD_WEBHOOK?: string;
    readonly VITE_YM_COUNTER_ID?: string;
    readonly VITE_GA_MEASUREMENT_ID?: string;
    /** Canonical origin для SEO (OG, sitemap, robots при build). */
    readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
