import axios from 'axios';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/api/pfp/macro`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
    };
};

export interface MacroLatestItem {
    slug: string;
    name: string;
    unit: string;
    value: number;
    date: string;
}

export interface MacroHistoryPoint {
    id?: number;
    value: number;
    date: string;
    [key: string]: unknown;
}

/** Ответ бэка: value может прийти как string */
export interface MacroLatestResponse {
    success: boolean;
    data: Array<Omit<MacroLatestItem, 'value'> & { value?: number | string }>;
}

/** Ответ бэка: value может прийти как string */
export interface MacroHistoryResponse {
    success: boolean;
    data: Array<Omit<MacroHistoryPoint, 'value'> & { value?: number | string }>;
}

function toNum(v: unknown): number {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
}

export const macroApi = {
    /** Текущие значения по всем активным индикаторам (для карточек/дашборда) */
    getLatest: async (): Promise<MacroLatestItem[]> => {
        const response = await axios.get<MacroLatestResponse>(`${API_BASE}/latest`, {
            headers: getHeaders(),
        });
        if (!response.data.success) throw new Error('Macro latest request failed');
        return (response.data.data || []).map((item) => ({
            ...item,
            value: toNum(item.value),
        }));
    },

    /** История по одному показателю (для графика). from/to — YYYY-MM-DD */
    getHistory: async (
        slug: string,
        from?: string,
        to?: string
    ): Promise<MacroHistoryPoint[]> => {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to) params.to = to;
        const response = await axios.get<MacroHistoryResponse>(
            `${API_BASE}/history/${encodeURIComponent(slug)}`,
            { headers: getHeaders(), params }
        );
        if (!response.data.success) throw new Error('Macro history request failed');
        return (response.data.data || []).map((p) => ({
            ...p,
            value: toNum(p.value),
        }));
    },
};
