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
    const AUTO_PROMPT = 'Сделай краткий разбор финансового плана клиента: ключевые сильные стороны, риски и 3 ближайших шага.';

    const resolveClientId = () => {
        return client?.id || (client as any)?.client_id || data?.client_id || data?.client?.id || null;
    };

    const resolvedClientId = useMemo(() => {
        const id = resolveClientId();
        return typeof id === 'number' ? id : null;
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
            try {
                const history = await aiService.getAgentClientHistory(resolvedClientId);
                if (cancelled) return;
                setMessages(history);

                const hasAssistantAnswer = history.some(
                    (msg) => msg.role === 'assistant' && Boolean(msg.content?.trim())
                );
                if (!hasAssistantAnswer) {
                    await sendAgentClientMessage(resolvedClientId, AUTO_PROMPT, { appendUserMessage: false });
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to bootstrap AI chat:', error);
                }
            } finally {
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
            <div
                onClick={() => setIsChatOpen(true)}
                style={{
                    margin: '0 auto 16px',
                    maxWidth: '1280px',
                    background: 'linear-gradient(135deg, #fdf4ff, #eff6ff)',
                    borderRadius: '20px',
                    padding: '16px 20px',
                    boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
                    cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>AI ПФП ассистент</div>
                    <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        {isAiLoading || isTyping ? 'Генерирует ответ...' : 'Online'}
                    </div>
                </div>
                <p
                    style={{
                        margin: '8px 0 12px',
                        color: '#374151',
                        fontSize: 14,
                        lineHeight: 1.45,
                        whiteSpace: 'pre-line',
                    }}
                >
                    {previewText}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        readOnly
                        value=""
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsChatOpen(true);
                        }}
                        onFocus={(e) => {
                            e.preventDefault();
                            setIsChatOpen(true);
                        }}
                        placeholder="Написать сообщение AI..."
                        style={{
                            flex: 1,
                            border: '1px solid #d1d5db',
                            borderRadius: 12,
                            padding: '10px 14px',
                            background: '#ffffff',
                            cursor: 'text',
                        }}
                    />
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsChatOpen(true);
                        }}
                        style={{
                            border: 'none',
                            borderRadius: 12,
                            background: '#D946EF',
                            color: '#fff',
                            fontWeight: 600,
                            padding: '0 16px',
                            cursor: 'pointer',
                        }}
                    >
                        Отправить
                    </button>
                </div>
            </div>

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
