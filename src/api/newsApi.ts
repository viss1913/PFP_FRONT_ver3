import axios from 'axios';
import { API_BASE_URL } from './config';
import { PROJECT_KEY } from './projectKey';

const API_BASE = `${API_BASE_URL}/api/pfp/news`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'X-Project-Key': PROJECT_KEY,
    };
};

export type NewsEventType =
    | 'RATE_CHANGE'
    | 'INFLATION'
    | 'SANCTIONS'
    | 'TAX_CHANGE'
    | 'OIL'
    | 'BANKING'
    | 'STOCK_MARKET'
    | 'CURRENCY'
    | 'OTHER';

export interface NewsSource {
    slug: string;
    name: string;
}

export interface NewsFeedItem {
    id: number;
    title: string;
    description: string | null;
    url: string;
    source: NewsSource;
    publishedAt: string;
    eventType: NewsEventType;
    score: number;
    tags: string[];
    agentTakeaway: string | null;
    alsoReportedBy: string[];
    read: boolean;
}

export interface NewsFeedResponse {
    success: boolean;
    generatedAt: string;
    quiet: boolean;
    message: string | null;
    filters?: {
        limit: number;
        hours: number;
        minScore?: number;
        eventType: string | null;
    };
    items: NewsFeedItem[];
}

export interface NewsMarkReadResponse {
    success: boolean;
    articleId: number;
}

export interface NewsFeedParams {
    limit?: number;
    hours?: number;
    eventType?: NewsEventType;
}

export const newsApi = {
    getFeed: async (params: NewsFeedParams = {}): Promise<NewsFeedResponse> => {
        const { limit = 7, hours = 48, eventType } = params;
        const query: Record<string, string | number> = { limit, hours };
        if (eventType) query.event_type = eventType;

        const response = await axios.get<NewsFeedResponse>(`${API_BASE}/feed`, {
            headers: getHeaders(),
            params: query,
        });
        if (!response.data.success) throw new Error('News feed request failed');
        return {
            ...response.data,
            items: response.data.items ?? [],
        };
    },

    markRead: async (id: number): Promise<NewsMarkReadResponse> => {
        const response = await axios.post<NewsMarkReadResponse>(
            `${API_BASE}/${id}/read`,
            {},
            { headers: getHeaders() },
        );
        return response.data;
    },
};
