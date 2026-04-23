import React, { useEffect, useMemo, useRef, useState } from 'react';
import ResultPageDesign from './ResultPageDesign';
import { ChatWindow } from './ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiMessage } from '../types/ai';
import ReportPreviewModal from './ReportPreviewModal';

interface ResultPageProps {
    data: any;
    client?: any;
    onRestart: () => void;
    onRecalculate?: (payload: any) => void;
    onAddGoal?: (goal: any) => void;
    onDeleteGoal?: (goalId: number) => void;
    isCalculating?: boolean;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, client, onRestart, onRecalculate, onAddGoal, onDeleteGoal, isCalculating }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
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
