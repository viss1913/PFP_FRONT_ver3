import axios from 'axios';
import type { AgentBotConfig, AgentClient, AgentMessage } from '../types/agent';

const API_BASE = '/api/pfp/constructor';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const agentConstructorApi = {
    // Настройки бота
    getBotConfig: async (): Promise<AgentBotConfig> => {
        const response = await axios.get(`${API_BASE}/bot`, { headers: getHeaders() });
        return response.data;
    },

    saveBotConfig: async (config: AgentBotConfig): Promise<void> => {
        await axios.post(`${API_BASE}/bot`, config, { headers: getHeaders() });
    },

    // Клиенты
    getClients: async (page = 1, limit = 50): Promise<{
        data: AgentClient[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> => {
        const response = await axios.get(`${API_BASE}/clients`, {
            params: { page, limit },
            headers: getHeaders()
        });
        return response.data;
    },

    // Сообщения
    getHistory: async (clientId: number): Promise<AgentMessage[]> => {
        const response = await axios.get(`${API_BASE}/messages/${clientId}`, { headers: getHeaders() });
        return response.data;
    },

    sendMessage: async (payload: {
        clientId: number;
        text: string;
        photo?: string;
        video?: string;
        voice?: string;
        audio?: string;
        document?: string;
    }): Promise<void> => {
        await axios.post(`${API_BASE}/send-message`, payload, { headers: getHeaders() });
    },

    broadcast: async (payload: {
        text: string;
        photo?: string;
        video?: string;
        voice?: string;
        audio?: string;
        document?: string;
    }): Promise<any> => {
        const response = await axios.post(`${API_BASE}/broadcast`, payload, { headers: getHeaders() });
        return response.data;
    }
};
