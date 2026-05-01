import React, { useEffect, useMemo, useRef, useState } from 'react';
import ResultPageDesign from './ResultPageDesign';
import { ChatWindow } from './ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiMessage } from '../types/ai';
import ReportPreviewModal from './ReportPreviewModal';
import { agentLkApi, type PlanQuotesRequest, type PublishFromPlanRequest } from '../api/agentLkApi';

interface ResultPageProps {
    data: any;
    client?: any;
    onRestart: () => void;
    onRecalculate?: (payload: any) => void;
    onAddGoal?: (goal: any) => void;
    onDeleteGoal?: (goalId: number) => void;
    isCalculating?: boolean;
}

const RESOLUT_AV_PROJECT_ID = 23;

function resolveNumericId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function readAgentProjectId(): number | null {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        const user = JSON.parse(userStr) as { projectId?: unknown; project_id?: unknown };
        return resolveNumericId(user.projectId ?? user.project_id);
    } catch {
        return null;
    }
}

function formatResolutSkippedLines(items: unknown): string {
    if (!Array.isArray(items) || items.length === 0) return '';
    return items
        .map((item: any) => {
            if (item && typeof item === 'object' && typeof item.reason === 'string') return item.reason;
            try {
                return JSON.stringify(item);
            } catch {
                return String(item);
            }
        })
        .filter(Boolean)
        .join('\n- ');
}

const ResultPage: React.FC<ResultPageProps> = ({ data, client, onRestart, onRecalculate, onAddGoal, onDeleteGoal, isCalculating }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isResolutPublishing, setIsResolutPublishing] = useState(false);
    /** Опции plan-publish-preview / publish-from-plan (см. PlanQuotesRequest). */
    const [resolutIncludeMonthlyFlow, setResolutIncludeMonthlyFlow] = useState(false);
    const [resolutTermMonths, setResolutTermMonths] = useState('');
    const lastBootstrappedClientIdRef = useRef<number | null>(null);
    const AUTO_PROMPT = 'Клиент сделал первый план. Дай краткий разбор: что получилось хорошо, где риски и какие 3 шага сделать дальше.';

    const resolveClientId = () => {
        return client?.id || (client as any)?.client_id || data?.client_id || data?.client?.id || null;
    };

    const resolvedClientId = useMemo(() => {
        const id = resolveClientId();
        if (typeof id === 'number' && Number.isFinite(id)) return id;
        if (typeof id === 'string' && id.trim()) {
            const parsedId = Number(id);
            return Number.isFinite(parsedId) ? parsedId : null;
        }
        return null;
    }, [client, data]);

    const sendAgentClientMessage = async (
        clientId: number,
        text: string,
        options?: { appendUserMessage?: boolean }
    ) => {
        const shouldAppendUserMessage = options?.appendUserMessage !== false;
        if (shouldAppendUserMessage) {
            const userMsg: AiMessage = {
                id: Date.now(),
                role: 'user',
                content: text,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, userMsg]);
        }
        setIsTyping(true);

        const botMsgId = Date.now() + 1;
        const botMsg: AiMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);

        let accumulatedContent = '';
        await aiService.sendAgentClientMessageStream(
            {
                client_id: clientId,
                message: text,
            },
            (chunk) => {
                accumulatedContent += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === botMsgId ? { ...m, content: accumulatedContent } : m
                ));
            },
            (error) => {
                console.error('Stream error:', error);
                setMessages(prev => prev.map(m =>
                    m.id === botMsgId
                        ? { ...m, content: accumulatedContent || 'Не удалось получить ответ AI. Попробуйте еще раз.' }
                        : m
                ));
                setIsTyping(false);
            },
            () => setIsTyping(false)
        );
    };

    const handleSendMessage = async (text: string) => {
        if (!resolvedClientId) {
            return;
        }
        await sendAgentClientMessage(resolvedClientId, text);
    };

    useEffect(() => {
        if (!resolvedClientId || lastBootstrappedClientIdRef.current === resolvedClientId) {
            return;
        }

        lastBootstrappedClientIdRef.current = resolvedClientId;
        let cancelled = false;

        const bootstrapAiChat = async () => {
            setIsAiLoading(true);
            let shouldTriggerAutoPrompt = false;
            try {
                const history = await aiService.getAgentClientHistory(resolvedClientId);
                if (cancelled) return;
                setMessages(history);

                const hasAssistantAnswer = history.some(
                    (msg) => msg.role === 'assistant' && Boolean(msg.content?.trim())
                );
                if (!hasAssistantAnswer) {
                    shouldTriggerAutoPrompt = true;
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to bootstrap AI chat:', error);
                }
                // If history endpoint is temporarily unavailable, still try to seed first AI response.
                shouldTriggerAutoPrompt = true;
            } finally {
                if (!cancelled && shouldTriggerAutoPrompt) {
                    await sendAgentClientMessage(resolvedClientId, AUTO_PROMPT, { appendUserMessage: false });
                }
                if (!cancelled) {
                    setIsAiLoading(false);
                }
            }
        };

        bootstrapAiChat();
        return () => {
            cancelled = true;
        };
    }, [resolvedClientId]);

    const previewText = useMemo(() => {
        const lastAssistantMessage = [...messages]
            .reverse()
            .find((m) => m.role === 'assistant' && Boolean(m.content?.trim()));

        if (!lastAssistantMessage?.content) {
            return 'AI анализирует финансовый план клиента. Нажмите, чтобы открыть чат.';
        }

        const lines = lastAssistantMessage.content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        return lines.slice(0, 5).join('\n');
    }, [messages]);

    const isResolutAvProject = useMemo(() => {
        const fromClient = resolveNumericId(client?.project_id ?? data?.project_id ?? data?.summary?.project_id);
        const fromAgent = readAgentProjectId();
        return (fromClient ?? fromAgent) === RESOLUT_AV_PROJECT_ID;
    }, [client, data]);

    /** Дозаполнение клиента Resolut при RESOLUT_CLIENT_INCOMPLETE (контракт ResolutClientPayload). */
    const requestResolutClientFromUser = (): NonNullable<PublishFromPlanRequest['resolut_client']> | null => {
        const source = (client || {}) as Record<string, unknown>;
        const lastName = window.prompt('Фамилия (Resolut)', String(source.last_name || source.lastName || ''));
        if (lastName == null) return null;
        const firstName = window.prompt('Имя (Resolut)', String(source.first_name || source.firstName || ''));
        if (firstName == null) return null;
        const middleNameRaw = window.prompt(
            'Отчество (необязательно, Enter — пропустить)',
            String(source.middle_name || source.middleName || ''),
        );
        if (middleNameRaw == null) return null;
        const dob = window.prompt('Дата рождения ДД.ММ.ГГГГ', String(source.dob || ''));
        if (dob == null) return null;
        const sexRaw = window.prompt('Пол: male или female', String(source.sex || 'male'));
        if (sexRaw == null) return null;
        const sex = sexRaw.trim().toLowerCase() === 'female' ? 'female' : 'male';
        const phone = window.prompt('Телефон', String(source.phone || ''));
        if (phone == null) return null;
        const email = window.prompt('Email', String(source.email || ''));
        if (email == null) return null;

        const middleTrim = middleNameRaw.trim();
        return {
            lastName: lastName.trim(),
            firstName: firstName.trim(),
            ...(middleTrim ? { middleName: middleTrim } : { middleName: null }),
            dob: dob.trim(),
            sex,
            phone: phone.trim(),
            email: email.trim(),
        };
    };

    const normalizeErrorCode = (error: unknown): string | null => {
        const e = error as any;
        return (
            e?.response?.data?.error?.code ||
            e?.response?.data?.code ||
            e?.response?.data?.err?.code ||
            null
        );
    };

    const normalizeErrorMessage = (error: unknown): string => {
        const e = error as any;
        return (
            e?.response?.data?.error?.message ||
            e?.response?.data?.message ||
            e?.message ||
            'Не удалось опубликовать портфель в Resolut'
        );
    };

    const handlePublishToResolut = async () => {
        if (!isResolutAvProject) {
            window.alert('Публикация в Resolut доступна только для проекта AV.');
            return;
        }
        if (!resolvedClientId) {
            window.alert('Не найден client_id. Обнови страницу и попробуй снова.');
            return;
        }

        setIsResolutPublishing(true);
        try {
            const planBody: PlanQuotesRequest = {
                client_id: resolvedClientId,
                ...(resolutIncludeMonthlyFlow ? { include_monthly_flow: true } : {}),
            };
            const termTrim = resolutTermMonths.trim();
            if (termTrim !== '') {
                const termParsed = parseInt(termTrim, 10);
                if (Number.isFinite(termParsed) && termParsed >= 1) {
                    planBody.term_months = termParsed;
                }
            }

            const preview = await agentLkApi.planResolutPublishPreview(planBody);
            if (!preview?.success) {
                const errBody = preview as { error?: { message?: string; code?: string } };
                window.alert(
                    errBody?.error?.message ||
                        'Превью публикации из плана не удалось. Убедись, что у клиента сохранён пересчёт (goals_summary).',
                );
                return;
            }

            const d = preview.data ?? {};
            const eligible = Array.isArray(d.eligible) ? d.eligible : [];
            const skipped = Array.isArray(d.skipped) ? d.skipped : [];
            const planSkipped = d.plan_skipped;

            if (!eligible.length) {
                const detailLines = [
                    formatResolutSkippedLines(skipped),
                    formatResolutSkippedLines(planSkipped),
                ]
                    .filter(Boolean)
                    .join('\n- ');
                window.alert(
                    `Нет строк для публикации из сохранённого расчёта (goals_summary). Пересчитай план и сохрани клиента.${
                        detailLines ? `\n\nПодробности:\n- ${detailLines}` : ''
                    }`,
                );
                return;
            }

            const planSkipCount = Array.isArray(planSkipped) ? planSkipped.length : 0;
            if (skipped.length > 0 || planSkipCount > 0) {
                const detailMsg = [
                    formatResolutSkippedLines(skipped),
                    formatResolutSkippedLines(planSkipped),
                ]
                    .filter(Boolean)
                    .join('\n');
                const head = `Часть данных пропущена (skipped: ${skipped.length}, plan_skipped: ${planSkipCount}). Продолжить публикацию?`;
                const continueSubmit = window.confirm(
                    detailMsg ? `${head}\n\n${detailMsg}`.slice(0, 3500) : head,
                );
                if (!continueSubmit) return;
            }

            const publishErrorCode = (body: unknown) =>
                (body as { error?: { code?: string } })?.error?.code || null;

            let publishResponse;
            try {
                publishResponse = await agentLkApi.publishResolutFromPlan(planBody);
            } catch (error) {
                if (normalizeErrorCode(error) === 'RESOLUT_CLIENT_INCOMPLETE') {
                    const resolutClient = requestResolutClientFromUser();
                    if (!resolutClient) return;
                    publishResponse = await agentLkApi.publishResolutFromPlan({
                        ...planBody,
                        resolut_client: resolutClient,
                    });
                } else {
                    throw error;
                }
            }

            if (
                publishResponse &&
                !publishResponse.success &&
                publishErrorCode(publishResponse) === 'RESOLUT_CLIENT_INCOMPLETE'
            ) {
                const resolutClient = requestResolutClientFromUser();
                if (!resolutClient) return;
                publishResponse = await agentLkApi.publishResolutFromPlan({
                    ...planBody,
                    resolut_client: resolutClient,
                });
            }

            if (!publishResponse?.success) {
                const msg =
                    (publishResponse as { error?: { message?: string } })?.error?.message ||
                    'Публикация из плана завершилась без success=true';
                throw new Error(msg);
            }

            const linkResponse = await agentLkApi.getResolutLink();
            const url = linkResponse?.data?.url || linkResponse?.data?.link;
            if (!url) {
                window.alert('Публикация успешна, но ссылка Resolut не получена (TTL короткий). Повтори клик.');
                return;
            }
            window.alert('Портфель отправлен, открываем Resolut…');
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (error) {
            const e = error as any;
            const status = e?.response?.status;
            const code = normalizeErrorCode(error);
            if (status === 401) {
                window.alert('Сессия Resolut истекла (401). Перелогинься и повтори.');
                return;
            }
            if (status === 403) {
                window.alert('Доступ к публикации закрыт (403). Проверь, что это AV-проект.');
                return;
            }
            if (code === 'RESOLUT_CLIENT_INCOMPLETE') {
                window.alert('Для публикации не хватает данных клиента в Resolut.');
                return;
            }
            window.alert(normalizeErrorMessage(error));
            console.error('Resolut publish failed:', error);
        } finally {
            setIsResolutPublishing(false);
        }
    };

    return (
        <>
            <ResultPageDesign
                calculationData={data}
                client={client}
                onAddGoal={onAddGoal}
                onDeleteGoal={onDeleteGoal}
                onRestart={onRestart}
                onGoToReport={() => {
                    const clientId = resolveClientId();
                    if (!clientId) {
                        console.error('Report Error: Could not resolve Client ID', { client, data });
                        alert('Ошибка: Не удалось определить ID клиента (ID пуст). Обновите страницу.');
                        return;
                    }
                    setIsReportPreviewOpen(true);
                }}
                onRecalculate={onRecalculate}
                isCalculating={isCalculating}
                aiPreviewText={previewText}
                aiStatusText={isAiLoading || isTyping ? 'Генерирует ответ...' : 'Задать вопрос'}
                onOpenAiChat={() => setIsChatOpen(true)}
                isResolutAvProject={isResolutAvProject}
                isResolutPublishing={isResolutPublishing}
                onPublishToResolut={() => {
                    void handlePublishToResolut();
                }}
                resolutIncludeMonthlyFlow={resolutIncludeMonthlyFlow}
                onResolutIncludeMonthlyFlowChange={setResolutIncludeMonthlyFlow}
                resolutTermMonths={resolutTermMonths}
                onResolutTermMonthsChange={setResolutTermMonths}
            />
            <ReportPreviewModal
                isOpen={isReportPreviewOpen}
                clientId={resolveClientId()}
                onClose={() => setIsReportPreviewOpen(false)}
            />
            {isChatOpen && (
                <div
                    onClick={() => setIsChatOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15,23,42,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1200,
                        padding: '16px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 'min(760px, 100%)',
                            height: 'min(560px, 90vh)',
                            background: '#fff',
                            borderRadius: '24px',
                            boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: '16px' }}>AI ПФП ассистент</span>
                            <button
                                type="button"
                                onClick={() => setIsChatOpen(false)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    lineHeight: 1,
                                    color: '#6b7280',
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <ChatWindow
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isTyping={isTyping}
                                embedded={true}
                                placeholder="Спросите AI по финансовому плану клиента..."
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResultPage;
