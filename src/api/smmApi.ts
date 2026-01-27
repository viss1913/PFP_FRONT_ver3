import axios from 'axios';

const rawUrl = import.meta.env.VITE_SMM_API_URL || 'http://backend_ai_smm.railway.internal';
// Очищаем URL от лишних слэшей и гарантируем префикс /api/v1/
const baseDomain = rawUrl.replace(/\/api\/v1\/agent\/?$/, '').replace(/\/$/, '');
const SMM_BASE_URL = `${baseDomain}/api/v1/`;

const api = axios.create({
    baseURL: SMM_BASE_URL,
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

    // DEBUG: Если есть UUID в сторадже, можем попробовать добавить его как запасной заголовок
    const uuid = localStorage.getItem('uuid');
    if (uuid) {
        config.headers['x-agent-id'] = uuid;
    }

    console.log(`SMM: Requesting ${config.baseURL}${config.url}`);
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
    // Проверка связи (Health Check)
    checkHealth: async (): Promise<boolean> => {
        try {
            console.log(`SMM: Checking health at ${baseDomain}/health`);
            await axios.get(`${baseDomain}/health`);
            return true;
        } catch (e) {
            console.error('SMM: Health check failed', e);
            return false;
        }
    },

    // Получение данных текущего агента
    getMe: async (): Promise<SmmAgentProfile> => {
        const response = await api.get('agent/me');
        return response.data;
    },

    // Получение истории публикаций
    getPosts: async (): Promise<SmmPost[]> => {
        const response = await api.get('agent/me/posts');
        return response.data;
    },

    // Ручная отправка поста
    sendManualPost: async (text: string, imageUrl?: string): Promise<{ success: boolean; message: string; sent_post: SmmPost }> => {
        const response = await api.post('agent/me/send-manual-post', {
            text,
            image_url: imageUrl
        });
        return response.data;
    },

    // Статистика (опционально)
    getStats: async (from: string, to: string): Promise<any> => {
        const response = await api.get('agent/me/stats', {
            params: { from, to }
        });
        return response.data;
    }
};
