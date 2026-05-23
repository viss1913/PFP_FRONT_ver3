import axios from 'axios';
import type { CrmAgentDashboardResponse, CrmBriefingResponse } from '../types/crm';
import { API_BASE_WITH_API } from './config';
import { PROJECT_KEY } from './projectKey';

const api = axios.create({
    baseURL: API_BASE_WITH_API,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    config.headers['X-Project-Key'] = PROJECT_KEY;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const crmApi = {
    getCrmDashboard: async (): Promise<CrmAgentDashboardResponse> => {
        const response = await api.get<CrmAgentDashboardResponse>('/pfp/crm/dashboard');
        return response.data;
    },

    getCrmBriefing: async (): Promise<CrmBriefingResponse> => {
        const response = await api.get<CrmBriefingResponse>('/pfp/crm/briefing');
        return response.data;
    },
};
