import { useEffect } from 'react';
import { applyPageSeo, type PageSeoConfig } from './pageSeo';

export function usePageSeo(config: PageSeoConfig): void {
    useEffect(() => {
        applyPageSeo(config);
    }, [
        config.title,
        config.description,
        config.canonicalPath,
        config.robots,
        config.ogImagePath,
        config.ogType,
    ]);
}
