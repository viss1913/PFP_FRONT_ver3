import { useCallback, useEffect, useRef, useState } from 'react';
import { b2cOrchestratorApi } from '../api/b2cOrchestratorApi';
import { B2C_PLAN_FLOW_KEY } from '../constants/b2cPlan';
import { resolveStageFromCommand } from '../config/b2cPlanStageRegistry';
import type {
    AiB2cSettingsPublic,
    B2cPlanChatMessage,
    B2cPlanSessionContext,
    B2cPlanUiEventPayload,
} from '../types/b2cOrchestrator';

let messageSeq = 0;
function nextMessageId(): string {
    messageSeq += 1;
    return `b2c-plan-msg-${messageSeq}`;
}

export interface UseB2cPlanOrchestratorOptions {
    projectKey: string;
    flowKey?: string;
    initialStageKey?: string;
    /** Referral agent etc. — merged into every stream turn. */
    sessionContext?: B2cPlanSessionContext | null;
    onNavigate?: (stageKey: string) => void;
}

export function useB2cPlanOrchestrator({
    projectKey,
    flowKey = B2C_PLAN_FLOW_KEY,
    initialStageKey = '/start',
    sessionContext = null,
    onNavigate,
}: UseB2cPlanOrchestratorOptions) {
    const [messages, setMessages] = useState<B2cPlanChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentStageKey, setCurrentStageKey] = useState(initialStageKey);
    const [error, setError] = useState<string | null>(null);
    const [assistantSettings, setAssistantSettings] = useState<AiB2cSettingsPublic | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const assistantDraftIdRef = useRef<string | null>(null);
    const sessionContextRef = useRef<B2cPlanSessionContext | null | undefined>(sessionContext);
    sessionContextRef.current = sessionContext;

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const [settings, history] = await Promise.all([
                    b2cOrchestratorApi.getPlanSettings(projectKey, flowKey),
                    b2cOrchestratorApi.getPlanHistory(projectKey, flowKey).catch(() => []),
                ]);
                if (cancelled) return;
                setAssistantSettings(settings);
                if (history.length > 0) {
                    setMessages(
                        history.map((m) => ({
                            id: nextMessageId(),
                            role: m.role === 'assistant' ? 'assistant' : 'user',
                            content: m.content,
                        })),
                    );
                }
            } catch (e) {
                if (!cancelled) {
                    console.warn('[useB2cPlanOrchestrator] init', e);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [projectKey, flowKey]);

    const navigateToStage = useCallback(
        (stageKey: string) => {
            setCurrentStageKey(stageKey);
            onNavigate?.(stageKey);
        },
        [onNavigate],
    );

    const runStream = useCallback(
        async (turn: Parameters<typeof b2cOrchestratorApi.streamPlanOrchestrator>[1]) => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            setIsStreaming(true);
            setError(null);

            const assistantId = nextMessageId();
            assistantDraftIdRef.current = assistantId;
            setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

            try {
                const sc = sessionContextRef.current;
                await b2cOrchestratorApi.streamPlanOrchestrator(
                    projectKey,
                    {
                        flow_key: flowKey,
                        ...turn,
                        ...(sc ? { session_context: sc } : {}),
                    },
                    {
                        onClassifierCommand: (evt) => {
                            // Prefer stage_key; empty command = chat-only (no navigation).
                            const next = resolveStageFromCommand(evt.command, evt.stage_key);
                            if (next) navigateToStage(next);
                        },
                        onText: (chunk) => {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId ? { ...m, content: m.content + chunk } : m,
                                ),
                            );
                        },
                        onDone: () => {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId ? { ...m, streaming: false } : m,
                                ),
                            );
                            assistantDraftIdRef.current = null;
                        },
                        onError: (err) => {
                            setError(err.message);
                        },
                    },
                    controller.signal,
                );
            } catch (e) {
                if (!controller.signal.aborted) {
                    const msg = e instanceof Error ? e.message : 'Ошибка оркестратора';
                    setError(msg);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, content: m.content || msg, streaming: false }
                                : m,
                        ),
                    );
                }
            } finally {
                setIsStreaming(false);
                assistantDraftIdRef.current = null;
            }
        },
        [flowKey, navigateToStage, projectKey],
    );

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isStreaming) return;
            setMessages((prev) => [...prev, { id: nextMessageId(), role: 'user', content: trimmed }]);
            await runStream({ message: trimmed, page: currentStageKey });
        },
        [currentStageKey, isStreaming, runStream],
    );

    const sendUiEvent = useCallback(
        async (payload: B2cPlanUiEventPayload) => {
            if (isStreaming) return;
            await runStream({
                event: payload.event,
                page: payload.page,
                page_data: payload.page_data,
                goal_type_id: payload.goal_type_id,
                goal_name: payload.goal_name,
            });
        },
        [isStreaming, runStream],
    );

    const abort = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsStreaming(false);
        const draftId = assistantDraftIdRef.current;
        if (draftId) {
            setMessages((prev) =>
                prev.map((m) => (m.id === draftId ? { ...m, streaming: false } : m)),
            );
            assistantDraftIdRef.current = null;
        }
    }, []);

    useEffect(() => () => abort(), [abort]);

    return {
        messages,
        isStreaming,
        currentStageKey,
        setStageKey: navigateToStage,
        error,
        assistantSettings,
        sendMessage,
        sendUiEvent,
        abort,
        clearError: () => setError(null),
    };
}
