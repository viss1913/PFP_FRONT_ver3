import axios, { type AxiosInstance } from 'axios';
import type { GuestCalculatePayload } from '../utils/b2cGuestCalculatePayload';
import {
    getClientB2cToken,
    type ClientB2cAuthResponse,
} from '../utils/clientB2cAuth';
import type { RiskAnswersResponse, RiskQuestionnaire } from './clientApi';
import { API_BASE_WITH_API } from './config';

export interface ClientReferralPreviewAgent {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    display_name: string;
}

export interface ClientReferralPreviewResponse {
    valid: boolean;
    agent?: ClientReferralPreviewAgent;
}

export interface GuestRiskEvaluateBody {
    risk_profile_answers: Record<string, string>;
    goal?: {
        goal_type_id?: number;
        term_months?: number;
    };
    client?: Record<string, unknown>;
}

export interface ClientRegisterInitBody {
    email: string;
    name: string;
    project_key: string;
    ref?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    utm_partner_finam?: string;
}

export interface ClientRegisterInitResponse {
    message?: string;
    email?: string;
    expires_in_minutes?: number;
}

export interface MyPlanReportHtmlResponse {
    html?: string;
    pages?: string[];
}

function createGuestApi(projectKey: string): AxiosInstance {
    return axios.create({
        baseURL: API_BASE_WITH_API,
        headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': projectKey,
        },
    });
}

function createClientAuthApi(projectKey: string, token: string): AxiosInstance {
    return axios.create({
        baseURL: API_BASE_WITH_API,
        headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': projectKey,
            Authorization: `Bearer ${token}`,
        },
    });
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { message?: string; error?: string } | undefined;
        const msg =
            (typeof data?.message === 'string' && data.message) ||
            (typeof data?.error === 'string' && data.error) ||
            undefined;
        if (status === 409) return msg || 'Пользователь с таким email уже зарегистрирован';
        if (status === 400) return msg || 'Проверьте введённые данные';
        if (status === 502) return msg || 'Не удалось отправить код на почту. Попробуйте позже';
        if (msg) return msg;
    }
    return fallback;
}

export function getClientRegisterErrorMessage(error: unknown): string {
    return getApiErrorMessage(error, 'Не удалось отправить код подтверждения');
}

export function getClientVerifyErrorMessage(error: unknown): string {
    return getApiErrorMessage(error, 'Неверный или просроченный код');
}

export function getGuestPlanSaveErrorMessage(error: unknown): string {
    return getApiErrorMessage(error, 'Не удалось сохранить план');
}

export interface GuestPlanSaveResponse {
    client_id: number;
    guest_token: string;
    plan_saved: boolean;
    summary?: unknown;
    goals?: unknown[];
    [key: string]: unknown;
}

export interface GuestCalculateResponse {
    client_id?: number;
    guest_token?: string;
    plan_saved?: boolean;
    summary?: unknown;
    goals?: unknown[];
    [key: string]: unknown;
}

export function parseGuestCalculateLead(
    response: unknown,
    email?: string,
): { guest_token: string; client_id: number; plan_saved: boolean; email?: string } | null {
    if (!response || typeof response !== 'object') return null;
    const data = response as GuestCalculateResponse;
    const guest_token = typeof data.guest_token === 'string' ? data.guest_token.trim() : '';
    const client_id = Number(data.client_id);
    if (!guest_token || !Number.isFinite(client_id) || client_id <= 0) return null;
    return {
        guest_token,
        client_id,
        plan_saved: Boolean(data.plan_saved),
        email: email?.trim() || undefined,
    };
}

export function getGuestCalculateErrorMessage(error: unknown): string {
    return getApiErrorMessage(error, 'Не удалось рассчитать план');
}

function normalizeQuestionnaire(
    raw: RiskQuestionnaire | { questionnaire?: RiskQuestionnaire },
): RiskQuestionnaire {
    const source =
        raw && typeof raw === 'object' && 'questionnaire' in raw && raw.questionnaire
            ? raw.questionnaire
            : (raw as RiskQuestionnaire);
    return {
        ...source,
        questions: Array.isArray(source?.questions) ? source.questions : [],
    };
}

export const b2cApi = {
    getClientReferralPreview: async (
        ref: string,
        projectKey: string,
    ): Promise<ClientReferralPreviewResponse> => {
        const api = createGuestApi(projectKey);
        const response = await api.get<ClientReferralPreviewResponse>(
            '/auth/client-referral/preview',
            { params: { ref, project_key: projectKey } },
        );
        return response.data;
    },

    getGuestRiskQuestionnaire: async (projectKey: string): Promise<RiskQuestionnaire> => {
        const api = createGuestApi(projectKey);
        const response = await api.get<RiskQuestionnaire | { questionnaire: RiskQuestionnaire }>(
            '/client/risk-profile/questionnaire-v2',
        );
        return normalizeQuestionnaire(response.data);
    },

    evaluateGuestRisk: async (
        projectKey: string,
        body: GuestRiskEvaluateBody,
    ): Promise<RiskAnswersResponse> => {
        const api = createGuestApi(projectKey);
        const response = await api.post<RiskAnswersResponse>('/client/risk-profile/evaluate', body);
        return response.data;
    },

    guestCalculate: async (
        projectKey: string,
        payload: GuestCalculatePayload,
    ): Promise<GuestCalculateResponse> => {
        const api = createGuestApi(projectKey);
        const response = await api.post<GuestCalculateResponse>('/client/calculate', payload);
        return response.data;
    },

    guestPlanSave: async (
        projectKey: string,
        ref: string,
        payload: GuestCalculatePayload & { client: Record<string, unknown> & { email: string } },
    ): Promise<GuestPlanSaveResponse> => {
        const api = createGuestApi(projectKey);
        const response = await api.post<GuestPlanSaveResponse>('/client/plan/save', {
            ref,
            goals: payload.goals,
            client: payload.client,
        });
        return response.data;
    },

    registerClient: async (
        projectKey: string,
        body: ClientRegisterInitBody,
    ): Promise<ClientRegisterInitResponse> => {
        const api = createGuestApi(projectKey);
        const response = await api.post<ClientRegisterInitResponse>('/auth/register-client', body);
        return response.data;
    },

    verifyClientCode: async (
        email: string,
        code: string,
        password: string,
    ): Promise<ClientB2cAuthResponse> => {
        const response = await axios.post<ClientB2cAuthResponse>(
            `${API_BASE_WITH_API}/auth/verify-code`,
            { email, code, password },
            { headers: { 'Content-Type': 'application/json' } },
        );
        return response.data;
    },

    getMyPlanReportHtml: async (
        projectKey: string,
        token = getClientB2cToken(),
    ): Promise<string> => {
        if (!token) throw new Error('Нет сессии клиента');
        const api = createClientAuthApi(projectKey, token);
        const response = await api.get<MyPlanReportHtmlResponse>('/my/plan/report/html');
        const data = response.data;
        if (typeof data?.html === 'string' && data.html.trim()) {
            return data.html;
        }
        if (Array.isArray(data?.pages) && data.pages.length > 0) {
            return data.pages.join('\n');
        }
        throw new Error('Пустой ответ отчёта');
    },

    getMyPlanReportPdfUrl: async (
        projectKey: string,
        token = getClientB2cToken(),
    ): Promise<string> => {
        if (!token) throw new Error('Нет сессии клиента');
        const api = createClientAuthApi(projectKey, token);
        try {
            const urlResponse = await api.get<{ pdf_url?: string; url?: string }>(
                '/my/plan/report/pdf-url',
            );
            const signedUrl = urlResponse.data?.pdf_url || urlResponse.data?.url;
            if (signedUrl) return signedUrl;
        } catch {
            // fallback: прямой PDF
        }
        const pdfResponse = await api.get<Blob>('/my/plan/report/pdf', {
            responseType: 'blob',
        });
        return URL.createObjectURL(pdfResponse.data);
    },
};
