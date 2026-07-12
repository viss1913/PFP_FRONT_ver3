import axios, { type AxiosInstance } from 'axios';
import { B2C_PLAN_FLOW_KEY } from '../constants/b2cPlan';
import type {
    AiB2cHistoryMessage,
    AiB2cOrchestratorTurn,
    AiB2cSettingsPublic,
    AiB2cSseClassifierCommand,
    AiB2cSseEvent,
    AiB2cStagePublic,
    B2cPlanOrchestratorStreamHandlers,
} from '../types/b2cOrchestrator';
import { getClientB2cToken } from '../utils/clientB2cAuth';
import { API_BASE_WITH_API } from './config';

function createOrchestratorClient(projectKey: string): AxiosInstance {
    const token = getClientB2cToken();
    return axios.create({
        baseURL: API_BASE_WITH_API,
        headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': projectKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

function buildAuthHeaders(projectKey: string): Record<string, string> {
    const token = getClientB2cToken();
    return {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-Project-Key': projectKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

function parseSseBlock(block: string): AiB2cSseEvent | null {
    const raw = block.replace(/^data:\s*/i, '').trim();
    if (!raw || raw === '[DONE]') return null;
    try {
        return JSON.parse(raw) as AiB2cSseEvent;
    } catch {
        return null;
    }
}

async function consumeSseResponse(
    response: Response,
    handlers: B2cPlanOrchestratorStreamHandlers,
): Promise<void> {
    if (!response.body) {
        throw new Error('Пустой ответ стрима');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() ?? '';

            for (const block of blocks) {
                const trimmed = block.trim();
                if (!trimmed) continue;

                const evt = parseSseBlock(trimmed);
                if (!evt || typeof evt !== 'object' || !('type' in evt)) continue;

                if (evt.type === 'classifier_command') {
                    handlers.onClassifierCommand?.(evt as AiB2cSseClassifierCommand);
                } else if (evt.type === 'text' && typeof (evt as { text?: string }).text === 'string') {
                    handlers.onText?.((evt as { text: string }).text);
                } else if (evt.type === 'done') {
                    handlers.onDone?.();
                }
            }
        }

        if (buffer.trim()) {
            const evt = parseSseBlock(buffer.trim());
            if (evt && typeof evt === 'object' && 'type' in evt) {
                if (evt.type === 'classifier_command') {
                    handlers.onClassifierCommand?.(evt as AiB2cSseClassifierCommand);
                } else if (evt.type === 'text' && typeof (evt as { text?: string }).text === 'string') {
                    handlers.onText?.((evt as { text: string }).text);
                } else if (evt.type === 'done') {
                    handlers.onDone?.();
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

function orchestratorErrorMessage(status: number, bodyText: string): string {
    try {
        const data = JSON.parse(bodyText) as { message?: string; error?: string };
        const msg = data.message || data.error;
        if (msg) return msg;
    } catch {
        // ignore
    }
    if (status === 401) return 'Требуется авторизация гостя или клиента';
    if (status === 403) return 'Нет доступа к оркестратору';
    return `Ошибка оркестратора (${status})`;
}

export const b2cOrchestratorApi = {
    async streamPlanOrchestrator(
        projectKey: string,
        turn: AiB2cOrchestratorTurn,
        handlers: B2cPlanOrchestratorStreamHandlers,
        signal?: AbortSignal,
    ): Promise<void> {
        const body: AiB2cOrchestratorTurn = {
            flow_key: turn.flow_key ?? B2C_PLAN_FLOW_KEY,
            ...turn,
        };

        const response = await fetch(`${API_BASE_WITH_API}/my/ai-b2c/chat/dynamic/stream`, {
            method: 'POST',
            headers: buildAuthHeaders(projectKey),
            body: JSON.stringify(body),
            signal,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            const err = new Error(orchestratorErrorMessage(response.status, text));
            handlers.onError?.(err);
            throw err;
        }

        try {
            await consumeSseResponse(response, handlers);
        } catch (e) {
            if (signal?.aborted) return;
            const err = e instanceof Error ? e : new Error('Ошибка чтения SSE');
            handlers.onError?.(err);
            throw err;
        }
    },

    async getPlanStages(projectKey: string, flowKey = B2C_PLAN_FLOW_KEY): Promise<AiB2cStagePublic[]> {
        const api = createOrchestratorClient(projectKey);
        const response = await api.get<AiB2cStagePublic[]>('/my/ai-b2c/stages', {
            params: { flow_key: flowKey },
        });
        return response.data ?? [];
    },

    async getPlanSettings(projectKey: string, flowKey = B2C_PLAN_FLOW_KEY): Promise<AiB2cSettingsPublic | null> {
        try {
            const api = createOrchestratorClient(projectKey);
            const response = await api.get<AiB2cSettingsPublic | null>('/my/ai-b2c/settings', {
                params: { flow_key: flowKey },
            });
            return response.data;
        } catch (e) {
            if (axios.isAxiosError(e) && e.response?.status === 404) return null;
            throw e;
        }
    },

    async getPlanHistory(
        projectKey: string,
        flowKey = B2C_PLAN_FLOW_KEY,
        stage?: string,
    ): Promise<AiB2cHistoryMessage[]> {
        const api = createOrchestratorClient(projectKey);
        const response = await api.get<AiB2cHistoryMessage[]>('/my/ai-b2c/history', {
            params: { flow_key: flowKey, ...(stage ? { stage } : {}) },
        });
        return response.data ?? [];
    },

    async clearPlanHistory(projectKey: string, flowKey = B2C_PLAN_FLOW_KEY, stage?: string): Promise<void> {
        const api = createOrchestratorClient(projectKey);
        await api.delete('/my/ai-b2c/history', {
            params: { flow_key: flowKey, ...(stage ? { stage } : {}) },
        });
    },
};
