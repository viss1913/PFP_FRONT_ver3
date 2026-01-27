import axios from 'axios';

const rawUrl = import.meta.env.VITE_SMM_API_URL || 'http://backend_ai_smm.railway.internal';
// Добавляем префикс /api/v1/agent если его нет, и гарантируем протокол
const SMM_API_URL = rawUrl.includes('/api/v1/agent')
    ? rawUrl
    : `${rawUrl.replace(/\/$/, '')}/api/v1/agent`;

const api = axios.create({
    baseURL: SMM_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем перехватчик для вставки токена
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface SmmPost {
    id: string;
    payload_text: string;
    payload_image_url?: string;
    sent_at: string;
    kind: 'regular' | 'manual';
    status: 'sent' | string;
}

export interface SmmAgentProfile {
    id: string;
    fio_firstname: string;
    fio_lastname: string;
    email: string;
    telegram_channel_id: string;
    region: string;
    is_active: boolean;
}

export const smmApi = {
    // Получение данных текущего агента
    getMe: async (): Promise<SmmAgentProfile> => {
        const response = await api.get('/me');
        return response.data;
    },

    // Получение истории публикаций
    getPosts: async (): Promise<SmmPost[]> => {
        const response = await api.get('/me/posts');
        return response.data;
    },

    // Ручная отправка поста
    sendManualPost: async (text: string, imageUrl?: string): Promise<{ success: boolean; message: string; sent_post: SmmPost }> => {
        const response = await api.post('/me/send-manual-post', {
            text,
            image_url: imageUrl
        });
        return response.data;
    },

    // Статистика (опционально)
    getStats: async (from: string, to: string): Promise<any> => {
        const response = await api.get('/me/stats', {
            params: { from, to }
        });
        return response.data;
    }
};
