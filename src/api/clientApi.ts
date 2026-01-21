import axios from 'axios';
import type { Client, ClientFilters, ClientListResponse, CalculatePayload } from '../types/client';

const API_BASE_URL = 'https://pfpbackend-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to inject the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('API Request Interceptor:', config.url);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token attached to header:', token.substring(0, 10) + '...');
    } else {
        console.warn('No token found in localStorage!');
    }
    return config;
});

export const clientApi = {
    // Get list of clients for the dashboard
    getAgentClients: async (filters: ClientFilters = {}): Promise<ClientListResponse> => {
        const params: any = {};
        if (filters.search) params.search = filters.search;
        if (filters.page) params.page = filters.page;
        if (filters.limit) params.limit = filters.limit;

        // Note: Using /client/agent-clients per pfp-api.yaml
        const response = await api.get('/client/agent-clients', { params });
        return response.data;
    },

    // Get a specific client by ID
    getClient: async (id: number): Promise<Client> => {
        const response = await api.get(`/client/${id}`);
        return response.data;
    },

    // Update client profile
    updateClient: async (id: number, data: Partial<Client>): Promise<Client> => {
        const response = await api.put(`/client/${id}`, { client: data });
        return response.data;
    },

    // Existing calculation logic refactored
    calculate: async (payload: CalculatePayload): Promise<any> => {
        const response = await api.post('/client/calculate', payload);
        return response.data;
    },

    // Create/Update First Run (create new client with full plan)
    firstRun: async (payload: any): Promise<any> => {
        const response = await api.post('/client/first-run', payload);
        return response.data;
    },

    // Recalculate plan with updated parameters
    recalculate: async (id: number, payload: any): Promise<any> => {
        const response = await api.post(`/client/${id}/recalculate`, payload);
        return response.data;
    },

    // CRM: Morning Briefing
    getBriefing: async (): Promise<{ briefing: string }> => {
        const response = await api.get('/pfp/crm/briefing');
        return response.data;
    },

    // CRM: Update Status
    updateClientStatus: async (payload: { client_id: number; crm_status: string; notes?: string }): Promise<void> => {
        await api.post('/pfp/crm/status', payload);
    }
};
