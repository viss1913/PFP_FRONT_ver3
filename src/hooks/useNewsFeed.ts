import { useCallback, useEffect, useRef, useState } from 'react';
import { newsApi, type NewsFeedResponse } from '../api/newsApi';

const POLL_INTERVAL_MS = 20 * 60 * 1000;
const MIN_REFETCH_MS = 5 * 60 * 1000;

function getErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) return 'Сессия истекла. Войдите снова.';
    }
    if (err instanceof Error && err.message) return err.message;
    return 'Не удалось загрузить ленту. Попробуйте позже.';
}

export function useNewsFeed() {
    const [data, setData] = useState<NewsFeedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const lastFetchedAt = useRef(0);
    const mountedRef = useRef(true);

    const fetchFeed = useCallback(async (options?: { silent?: boolean }) => {
        if (!options?.silent) setLoading(true);
        setError(null);
        try {
            const response = await newsApi.getFeed({ limit: 7, hours: 48 });
            if (!mountedRef.current) return;
            lastFetchedAt.current = Date.now();
            setData(response);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(getErrorMessage(err));
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    const refetchIfStale = useCallback(() => {
        if (Date.now() - lastFetchedAt.current >= MIN_REFETCH_MS) {
            void fetchFeed({ silent: true });
        }
    }, [fetchFeed]);

    useEffect(() => {
        mountedRef.current = true;
        void fetchFeed();

        const pollId = window.setInterval(() => {
            void fetchFeed({ silent: true });
        }, POLL_INTERVAL_MS);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                refetchIfStale();
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            mountedRef.current = false;
            window.clearInterval(pollId);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [fetchFeed, refetchIfStale]);

    return {
        data,
        loading,
        error,
        refetch: () => fetchFeed({ silent: true }),
    };
}
