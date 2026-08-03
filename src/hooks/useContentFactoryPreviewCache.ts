import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { agentLkApi } from '../api/agentLkApi';

export function useContentFactoryPreviewCache(offerIds: number[]) {
    const [cache, setCache] = useState<Record<number, string>>({});
    const [loadingIds, setLoadingIds] = useState<Record<number, boolean>>({});
    const [failedIds, setFailedIds] = useState<Record<number, boolean>>({});
    const cacheRef = useRef(cache);
    const failedRef = useRef(failedIds);
    const inFlightRef = useRef<Set<number>>(new Set());
    cacheRef.current = cache;
    failedRef.current = failedIds;

    const idsKey = useMemo(() => offerIds.join(','), [offerIds]);

    const loadPreview = useCallback(async (offerId: number) => {
        if (
            cacheRef.current[offerId] ||
            failedRef.current[offerId] ||
            inFlightRef.current.has(offerId)
        ) {
            return;
        }
        inFlightRef.current.add(offerId);
        setLoadingIds((prev) => ({ ...prev, [offerId]: true }));
        try {
            const detail = await agentLkApi.getContentFactoryOffer(offerId);
            if (detail.preview_html) {
                setCache((prev) => ({ ...prev, [offerId]: detail.preview_html! }));
            } else {
                setFailedIds((prev) => ({ ...prev, [offerId]: true }));
            }
        } catch {
            setFailedIds((prev) => ({ ...prev, [offerId]: true }));
        } finally {
            inFlightRef.current.delete(offerId);
            setLoadingIds((prev) => {
                const next = { ...prev };
                delete next[offerId];
                return next;
            });
        }
    }, []);

    useEffect(() => {
        for (const id of offerIds) {
            void loadPreview(id);
        }
    }, [idsKey, loadPreview, offerIds]);

    return {
        cache,
        loadingIds,
        failedIds,
        loadPreview,
    };
}
