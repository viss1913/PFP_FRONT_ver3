import { useCallback, useRef } from 'react';
import { crmApi } from '../api/crmApi';
import type { CrmCommissionForecastResponse } from '../types/commission';

/**
 * Простой in-memory кэш прогнозов комиссий.
 * Используется для ленивой подгрузки по строкам CRM и повторного открытия модалки.
 */
export function useCommissionForecastCache() {
    const cacheRef = useRef<Map<number, CrmCommissionForecastResponse>>(new Map());
    const pendingRef = useRef<Map<number, Promise<CrmCommissionForecastResponse>>>(new Map());

    const getCommissionForecast = useCallback(async (clientId: number) => {
        const id = Number(clientId);
        if (!Number.isFinite(id) || id <= 0) {
            throw new Error(`Invalid clientId: ${clientId}`);
        }

        const cached = cacheRef.current.get(id);
        if (cached) return cached;

        const pending = pendingRef.current.get(id);
        if (pending) return pending;

        const promise = crmApi
            .getCommissionForecast(id)
            .then((res) => {
                cacheRef.current.set(id, res);
                pendingRef.current.delete(id);
                return res;
            })
            .catch((err) => {
                pendingRef.current.delete(id);
                throw err;
            });

        pendingRef.current.set(id, promise);
        return promise;
    }, []);

    return {
        getCommissionForecast,
    };
}

