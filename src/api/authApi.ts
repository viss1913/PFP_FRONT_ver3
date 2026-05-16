import axios from 'axios';
import { API_BASE_URL } from './config';

const AUTH_BASE = `${API_BASE_URL}/api/auth`;

export interface AgentInvitePreviewResponse {
    valid: boolean;
    expired: boolean;
    used: boolean;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
}

export interface AgentAuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        name?: string;
        role: string;
        agentId: number;
        projectId: number;
    };
}

export interface AuthMeResponse {
    id: number;
    email: string;
    role: string;
    agentId: number;
    projectId: number;
    first_name?: string | null;
    last_name?: string | null;
    partner_agent_id?: string | null;
    partner_agent_id_required?: boolean;
    partner_agent_id_label?: string;
}

export function getActivateInviteErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string } | undefined;
        const msg = typeof data?.message === 'string' ? data.message : undefined;
        if (status === 400) return msg || 'Ссылка недействительна или уже использована';
        if (msg) return msg;
    }
    return 'Не удалось активировать приглашение';
}

export const authApi = {
    getAgentInvitePreview: async (token: string): Promise<AgentInvitePreviewResponse> => {
        const response = await axios.get<AgentInvitePreviewResponse>(
            `${AUTH_BASE}/agent-invite/preview`,
            { params: { token } },
        );
        return response.data;
    },

    activateAgentInvite: async (token: string, password: string): Promise<AgentAuthResponse> => {
        const response = await axios.post<AgentAuthResponse>(
            `${AUTH_BASE}/activate-agent-invite`,
            { token, password },
        );
        return response.data;
    },

    getMe: async (jwt: string): Promise<AuthMeResponse> => {
        const response = await axios.get<AuthMeResponse>(`${AUTH_BASE}/me`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        return response.data;
    },
};
