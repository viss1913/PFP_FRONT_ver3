import axios from 'axios';
import { API_BASE_URL } from './config';
import { PROJECT_KEY } from './projectKey';

const AUTH_BASE = `${API_BASE_URL}/api/auth`;

export interface AgentInvitePreviewResponse {
    valid: boolean;
    expired: boolean;
    used: boolean;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
}

export interface AgentAuthUser {
    id: number;
    email: string;
    name?: string;
    role: string;
    agentId: number;
    projectId: number;
}

export interface AgentAuthResponse {
    token: string;
    user: AgentAuthUser;
}

/** Поля профиля агента из /auth/me, verify, partner-id-wizard */
export interface AgentMeProfileFields {
    first_name?: string | null;
    last_name?: string | null;
    partner_agent_id?: string | null;
    effective_partner_agent_id?: string | null;
    partner_agent_id_mode?: 'own' | 'parent_inherited' | null;
    inherit_parent_partner_agent_id?: boolean;
    partner_agent_id_label?: string;
    partner_agent_id_required?: boolean;
    has_partner_full_access?: boolean;
    parent_agent_id?: number | null;
    finam_agent_registration_url?: string | null;
    finam_agent_referral_url?: string | null;
}

export interface AuthMeResponse extends AgentMeProfileFields {
    id: number;
    uuid?: string;
    email: string;
    role: string;
    agentId: number;
    projectId: number;
    clientId?: number;
    middle_name?: string | null;
    phone?: string | null;
    birth_date?: string | null;
    gender?: 'male' | 'female' | null;
}

export type AgentRegisterVerifyResponse = AgentAuthResponse & AgentMeProfileFields;

export interface ParsePartnerAgentRequest {
    project_key: string;
    partner_agent_id?: string;
    partner_ref_url?: string;
}

export interface ParsePartnerAgentResponse {
    partner_agent_id: string;
    label?: string;
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

export function getPartnerWizardErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string } | undefined;
        const msg = typeof data?.message === 'string' ? data.message : undefined;
        if (status === 409) return msg || 'Такой Finam ID уже занят в проекте';
        if (status === 400) {
            if (msg?.toLowerCase().includes('приглаш')) {
                return 'Регистрация не по приглашению — укажите свой Finam ID';
            }
            if (msg?.toLowerCase().includes('куратор')) {
                return 'У куратора нет Finam ID — введите свой';
            }
            return msg || 'Не удалось выполнить действие';
        }
        if (msg) return msg;
    }
    return 'Не удалось сохранить Finam ID';
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

    verifyAgentRegistration: async (
        email: string,
        code: string,
        password: string,
    ): Promise<AgentRegisterVerifyResponse> => {
        const response = await axios.post<AgentRegisterVerifyResponse>(
            `${AUTH_BASE}/verify-agent-registration`,
            { email, code, password },
        );
        return response.data;
    },

    parsePartnerAgent: async (
        body: Omit<ParsePartnerAgentRequest, 'project_key'> & { project_key?: string },
    ): Promise<ParsePartnerAgentResponse> => {
        const response = await axios.post<ParsePartnerAgentResponse>(
            `${AUTH_BASE}/parse-partner-agent`,
            { ...body, project_key: body.project_key ?? PROJECT_KEY },
        );
        return response.data;
    },

    getMe: async (jwt?: string): Promise<AuthMeResponse> => {
        const token = jwt ?? localStorage.getItem('token') ?? '';
        const response = await axios.get<AuthMeResponse>(`${AUTH_BASE}/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};
