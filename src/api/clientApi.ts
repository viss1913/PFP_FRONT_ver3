import axios from 'axios';
import type { Client, ClientFilters, ClientListResponse, CalculatePayload } from '../types/client';

const API_BASE_URL = 'https://pfpbackend-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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
    }
};
