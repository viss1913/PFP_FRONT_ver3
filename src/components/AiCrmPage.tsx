import React, { useMemo, useState } from 'react';
import Header from './Header';
import ClientList from './ClientList';

import type { Client } from '../types/client';
import { ChatWindow } from './ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiMessage, AiAssistant } from '../types/ai';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface AiCrmPageProps {
    onSelectClient: (client: Client) => void;
    onNewClient: () => void;
    onNavigate: (page: NavPage) => void;
}

const AiCrmPage: React.FC<AiCrmPageProps> = ({ onSelectClient, onNewClient, onNavigate }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [activeAssistant, setActiveAssistant] = useState<AiAssistant | null>(null);

    // Fetch assistants on mount
    React.useEffect(() => {
        const loadAssistant = async () => {
            try {
                // Load assistants
                const assistants = await aiService.getAssistants();
                let crmAssistant: AiAssistant | null = null;

                if (assistants.length > 0) {
                    crmAssistant = assistants.find(a => a.slug === 'ai-crm' || a.name.toLowerCase().includes('crm')) || assistants[0];
                    setActiveAssistant(crmAssistant);
                }

                // Load History (which now includes Auto-Briefing from backend)
                if (crmAssistant) {
                    const history = await aiService.getHistory(crmAssistant.id);
                    // Map history to local state if needed, or set directly
                    // Assuming history is [AiMessage, AiMessage...]
                    setMessages(history);
                }

            } catch (error) {
                console.error('Failed to load initial data:', error);

                // No fallback needed if backend guarantees auto-brief, but safe to leave empty or show error
                if (!messages.length) {
                    setMessages([{
                        id: Date.now(),
                        role: 'assistant',
                        content: "Не удалось загрузить историю чата. Попробуйте обновить страницу.",
                        created_at: new Date().toISOString()
                    }]);
                }
            }
        };
        loadAssistant();
    }, []);

    const summaryText = useMemo(() => {
        const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
        const base =
            lastAssistantMessage?.content ||
            'Ваш ИИ‑ассистент готовит сводку по клиентам и подскажет, с кем лучше поработать сегодня.';
        const limit = 220;
        return base.length > limit ? base.slice(0, limit).trimEnd() + '…' : base;
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!activeAssistant) {
            alert('Ассистент еще не загружен или недоступен.');
            return;
        }

        const userMsg: AiMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
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
        await aiService.sendMessageStream(
            {
                assistant_id: activeAssistant.id,
                message: text,
                // context: { type: 'crm_summary', payload: '...' } // Optional context
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
                    m.id === botMsgId ? { ...m, content: accumulatedContent + '\n\n[Ошибка связи с сервером]' } : m
                ));
                setIsTyping(false);
            },
            () => setIsTyping(false)
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="crm" onNavigate={onNavigate} />

            <main
                style={{
                    flex: 1,
                    padding: '24px',
                    maxWidth: '1600px',
                    margin: '0 auto',
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                {/* AI Summary Bar */}
                <div
                    onClick={() => setIsChatOpen(true)}
                    style={{
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '18px 24px',
                        borderRadius: '24px',
                        background: 'linear-gradient(135deg, #fdf4ff, #eff6ff)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                    }}
                >
                    <div
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '18px',
                            flexShrink: 0,
                        }}
                    >
                        AI
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px',
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>AI CRM ассистент</span>
                            <span
                                style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                }}
                            >
                                Online
                            </span>
                        </div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: '14px',
                                color: '#4b5563',
                            }}
                        >
                            {summaryText}
                        </p>
                        <button
                            type="button"
                            style={{
                                marginTop: '8px',
                                padding: '6px 0',
                                background: 'none',
                                border: 'none',
                                color: '#D946EF',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                textDecorationStyle: 'dotted',
                            }}
                        >
                            Открыть чат с ассистентом
                        </button>
                    </div>
                </div>

                {/* Client List */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    }}
                >
                    <ClientList onSelectClient={onSelectClient} onNewClient={onNewClient} embedded={true} />
                </div>
            </main>

            {/* Chat Modal */}
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
                            width: 'min(720px, 100%)',
                            height: 'min(520px, 90vh)',
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontWeight: 600, fontSize: '16px' }}>AI CRM ассистент</span>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        background: '#dcfce7',
                                        color: '#16a34a',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    Online
                                </span>
                            </div>
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
                                placeholder="Спросите AI CRM ассистента…"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiCrmPage;
