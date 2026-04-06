import axios from 'axios';
import type { Client, ClientFilters, ClientListResponse, CalculatePayload, GetClientOptions } from '../types/client';
import { API_BASE_WITH_API } from './config';

const API_BASE_URL = API_BASE_WITH_API;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export type ReportPageType = 'SUMMARY' | 'FIN_RESERVE' | 'LIFE' | 'INVESTMENT' | 'OTHER';

export interface ReportPdfQuery {
    includeCover?: 0 | 1;
    includeSummary?: 0 | 1;
    goalTypes?: string[];
    disposition?: 'attachment';
}

export interface ReportTocItem {
    id: string;
    title: string;
    order: number;
    page_start: number;
    page_count: number;
}

export interface MyPlanReportPdfUrlResponse {
    pdf_url: string;
    toc: ReportTocItem[];
    generated_at: string;
}

export interface AgentReportPdfUrlQuery {
    includeCover?: boolean;
    includeSummary?: boolean;
}

// Helper to get project_id from localStorage
const getProjectId = (): number => {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return user.projectId || user.project_id || 1;
        }
    } catch (e) {
        console.error('Error parsing user from localStorage', e);
    }
    return 1; // Default fallback
};

const PROJECT_KEY = 'pk_proj_0e9fdde1e8cd961121906f04507af06e4afec281a58012c4';

// Add request interceptor to inject the token and project key
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('API Request Interceptor:', config.url);

    // Dynamic Multi-tenancy headers
    config.headers['X-Project-Key'] = PROJECT_KEY;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token attached to header:', token.substring(0, 10) + '...');
    } else {
        console.warn('No token found in localStorage!');
    }
    return config;
});

function normalizeClient(raw: Client): Client {
    return {
        ...raw,
        chat_ai_messages: Array.isArray(raw.chat_ai_messages) ? raw.chat_ai_messages : [],
        b2c_site_chat_messages: Array.isArray(raw.b2c_site_chat_messages)
            ? raw.b2c_site_chat_messages
            : [],
        constructor_site_chat_messages: Array.isArray(raw.constructor_site_chat_messages)
            ? raw.constructor_site_chat_messages
            : [],
    };
}

export const clientApi = {
    /**
     * GET /api/pfp/clients. `include_chat_ai` управляет **всеми тремя** массивами чатов сразу; отдельных флагов нет.
     * См. `api_docs/agent_lk.yaml` (лимит `chat_ai_limit`, конструктор через ceil(limit/2) ходов).
     */
    getAgentClients: async (filters: ClientFilters = {}): Promise<ClientListResponse> => {
        const params: Record<string, string | number> = {};
        if (filters.search) params.search = filters.search;
        if (filters.page != null) params.page = filters.page;
        if (filters.limit !== undefined) {
            params.limit = filters.limit === 'all' ? 'all' : filters.limit;
        }
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;
        if (filters.include_chat_ai !== undefined) {
            params.include_chat_ai = filters.include_chat_ai ? 'true' : 'false';
        }
        if (filters.chat_ai_limit != null) {
            params.chat_ai_limit = Math.min(500, Math.max(1, filters.chat_ai_limit));
        }
        const response = await api.get<ClientListResponse>('/pfp/clients', { params });
        const data = response.data;
        // Нормализуем под единый формат: pagination (бэк может отдавать meta)
        if (data.data && !data.pagination && (data as any).meta) {
            const meta = (data as any).meta;
            (data as ClientListResponse).pagination = {
                total: meta.total,
                page: meta.page,
                limit: meta.limit,
                totalPages: Math.ceil(meta.total / (meta.limit || 50)) || 1,
            };
        }
        if (data.data?.length) {
            data.data = data.data.map((row) => normalizeClient(row as Client));
        }
        return data;
    },

    // Get a specific client by ID
    getClient: async (id: number, options?: GetClientOptions): Promise<Client> => {
        const params: Record<string, string | number> = {};
        if (options?.include_chat_ai !== undefined) {
            params.include_chat_ai = options.include_chat_ai ? 'true' : 'false';
        }
        if (options?.chat_ai_limit != null) {
            params.chat_ai_limit = Math.min(2000, Math.max(1, options.chat_ai_limit));
        }
        const response = await api.get<Client>(`/client/${id}`, {
            params: Object.keys(params).length ? params : undefined,
        });
        return normalizeClient(response.data);
    },

    // Update client profile
    updateClient: async (id: number, data: Partial<Client>): Promise<Client> => {
        const response = await api.put(`/client/${id}`, { client: data });
        return response.data;
    },

    // Existing calculation logic refactored
    calculate: async (payload: CalculatePayload): Promise<any> => {
        const enrichedPayload = {
            ...payload,
            client: {
                ...payload.client,
                project_id: payload.client?.project_id || getProjectId()
            }
        };
        const response = await api.post('/client/calculate', enrichedPayload);
        return response.data;
    },

    // Create/Update First Run (create new client with full plan)
    firstRun: async (payload: any): Promise<any> => {
        const enrichedPayload = {
            ...payload,
            client: {
                ...payload.client,
                project_id: payload.client?.project_id || getProjectId()
            }
        };
        const response = await api.post('/client/first-run', enrichedPayload);
        return response.data;
    },

    // Recalculate plan with updated parameters
    recalculate: async (id: number, payload: any): Promise<any> => {
        const enrichedPayload = {
            ...payload,
            client_id: payload.client_id || id,
            project_id: payload.project_id || getProjectId()
        };
        const response = await api.post(`/client/${id}/recalculate`, enrichedPayload);
        return response.data;
    },

    // Add Goal
    addGoal: async (clientId: number, goal: any): Promise<any> => {
        const response = await api.post(`/client/${clientId}/goals`, goal);
        return response.data;
    },

    // Delete Goal
    deleteGoal: async (clientId: number, goalId: number): Promise<any> => {
        const response = await api.delete(`/client/${clientId}/goals/${goalId}`);
        return response.data;
    },



    // CRM: Update Status
    updateClientStatus: async (payload: { client_id: number; crm_status: string; notes?: string }): Promise<void> => {
        await api.post('/pfp/crm/status', payload);
    },

    // Report: Get PDF Report Data
    getReport: async (clientId: number): Promise<any> => {
        const response = await api.get(`/pfp/reports/${clientId}`);
        return response.data;
    },

    getReportPageHtml: async (clientId: number, pageType: ReportPageType): Promise<string> => {
        const response = await api.get(`/pfp/reports/${clientId}/pages/${pageType}/html`, {
            responseType: 'text',
            headers: {
                Accept: 'text/html',
            },
        });
        return response.data;
    },

    getReportPdfBlob: async (clientId: number, query: ReportPdfQuery = {}): Promise<Blob> => {
        const params: Record<string, string> = {};
        if (query.includeCover !== undefined) params.includeCover = String(query.includeCover);
        if (query.includeSummary !== undefined) params.includeSummary = String(query.includeSummary);
        if (query.goalTypes?.length) params.goalTypes = query.goalTypes.join(',');
        if (query.disposition) params.disposition = query.disposition;

        const response = await api.get(`/pfp/reports/${clientId}/pdf`, {
            params,
            responseType: 'blob',
            timeout: 120000,
            headers: {
                Accept: 'application/pdf',
            },
        });
        return response.data;
    },

    getAgentReportPdfUrl: async (
        clientId: number,
        query: AgentReportPdfUrlQuery = { includeCover: true, includeSummary: true }
    ): Promise<MyPlanReportPdfUrlResponse> => {
        const response = await api.get<MyPlanReportPdfUrlResponse>(`/pfp/reports/${clientId}/pdf-url`, {
            params: {
                includeCover: String(query.includeCover ?? true),
                includeSummary: String(query.includeSummary ?? true),
            },
            timeout: 120000,
        });
        return response.data;
    }
};
