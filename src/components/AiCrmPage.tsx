import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './Header';
import ClientList from './ClientList';
import CrmViewSwitcher, { type CrmViewMode } from './CrmViewSwitcher';
import SubagentNetworkView from './SubagentNetworkView';
import avatarImage from '../assets/avatar_full.png';

import type { Client } from '../types/client';
import { ChatWindow } from './ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiMessage, AiAssistant } from '../types/ai';
import {
    agentLkApi,
    isSubagentNetworkDisabledError,
    type SubagentDashboardResponse,
} from '../api/agentLkApi';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

const CRM_VIEW_MODE_KEY = 'pfp_crm_view_mode';

function readStoredViewMode(): CrmViewMode {
    const stored = localStorage.getItem(CRM_VIEW_MODE_KEY);
    return stored === 'subagents' ? 'subagents' : 'clients';
}

const avatarBoxStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '16px',
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid rgba(217, 70, 239, 0.25)',
};

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

    const [networkAvailable, setNetworkAvailable] = useState(false);
    const [networkProbeDone, setNetworkProbeDone] = useState(false);
    const [viewMode, setViewMode] = useState<CrmViewMode>(() => readStoredViewMode());
    const [dashboard, setDashboard] = useState<SubagentDashboardResponse | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);

    const loadDashboard = useCallback(async () => {
        setDashboardLoading(true);
        try {
            const data = await agentLkApi.getSubagentsDashboard();
            if (data.enabled !== false) {
                setDashboard(data);
                setNetworkAvailable(true);
            } else {
                setNetworkAvailable(false);
                setDashboard(null);
            }
            return data;
        } catch (error) {
            if (isSubagentNetworkDisabledError(error)) {
                setNetworkAvailable(false);
                setDashboard(null);
                setViewMode('clients');
                localStorage.setItem(CRM_VIEW_MODE_KEY, 'clients');
                return null;
            }
            console.error('Failed to load subagents dashboard:', error);
            throw error;
        } finally {
            setDashboardLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await loadDashboard();
            } catch {
                /* probe failed — network tab hidden */
            } finally {
                if (!cancelled) setNetworkProbeDone(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loadDashboard]);

    useEffect(() => {
        if (!networkAvailable && viewMode === 'subagents') {
            setViewMode('clients');
            localStorage.setItem(CRM_VIEW_MODE_KEY, 'clients');
        }
    }, [networkAvailable, viewMode]);

    useEffect(() => {
        if (viewMode === 'subagents' && networkAvailable && !dashboard && !dashboardLoading) {
            loadDashboard().catch(() => undefined);
        }
    }, [viewMode, networkAvailable, dashboard, dashboardLoading, loadDashboard]);

    useEffect(() => {
        const loadAssistant = async () => {
            try {
                const assistants = await aiService.getAssistants();
                let crmAssistant: AiAssistant | null = null;

                if (assistants.length > 0) {
                    crmAssistant =
                        assistants.find((a) => a.slug === 'ai-crm' || a.name.toLowerCase().includes('crm')) ||
                        assistants[0];
                    setActiveAssistant(crmAssistant);
                }

                if (crmAssistant) {
                    const history = await aiService.getHistory(crmAssistant.id);
                    setMessages(history);
                }
            } catch (error) {
                console.error('Failed to load initial data:', error);
                setMessages((prev) =>
                    prev.length
                        ? prev
                        : [
                              {
                                  id: Date.now(),
                                  role: 'assistant',
                                  content: 'Не удалось загрузить историю чата. Попробуйте обновить страницу.',
                                  created_at: new Date().toISOString(),
                              },
                          ],
                );
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
        return base.length > limit ? `${base.slice(0, limit).trimEnd()}…` : base;
    }, [messages]);

    const handleViewModeChange = (mode: CrmViewMode) => {
        setViewMode(mode);
        localStorage.setItem(CRM_VIEW_MODE_KEY, mode);
        if (mode === 'subagents' && networkAvailable) {
            loadDashboard().catch(() => undefined);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!activeAssistant) {
            alert('Ассистент еще не загружен или недоступен.');
            return;
        }

        const userMsg: AiMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setIsTyping(true);

        const botMsgId = Date.now() + 1;
        const botMsg: AiMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);

        let accumulatedContent = '';
        await aiService.sendMessageStream(
            {
                assistant_id: activeAssistant.id,
                message: text,
            },
            (chunk) => {
                accumulatedContent += chunk;
                setMessages((prev) =>
                    prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulatedContent } : m)),
                );
            },
            (error) => {
                console.error('Stream error:', error);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === botMsgId
                            ? { ...m, content: `${accumulatedContent}\n\n[Ошибка связи с сервером]` }
                            : m,
                    ),
                );
                setIsTyping(false);
            },
            () => setIsTyping(false),
        );
    };

    const assistantAvatar = (
        <div style={avatarBoxStyle}>
            <img
                src={avatarImage}
                alt="AI CRM ассистент"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="crm" onNavigate={onNavigate} />

                <main className="lk-page-main">
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
                        {assistantAvatar}
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '4px',
                                }}
                            >
                                <span style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>
                                    AI CRM ассистент
                                </span>
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
                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>{summaryText}</p>
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

                    <div className="lk-card">
                        {networkProbeDone && networkAvailable && (
                            <CrmViewSwitcher mode={viewMode} onChange={handleViewModeChange} />
                        )}

                        {viewMode === 'clients' || !networkAvailable ? (
                            <ClientList
                                onSelectClient={onSelectClient}
                                onNewClient={onNewClient}
                                embedded
                            />
                        ) : dashboard ? (
                            <SubagentNetworkView dashboard={dashboard} loading={dashboardLoading} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                {dashboardLoading ? 'Загрузка дашборда…' : 'Не удалось загрузить дашборд сети'}
                            </div>
                        )}
                    </div>
                </main>

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
                                    {assistantAvatar}
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
                                    embedded
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
