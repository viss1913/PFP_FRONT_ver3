import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Header from './Header';
import ClientList from './ClientList';
import CrmClientsDashboard from './CrmClientsDashboard';
import CrmViewSwitcher, { type CrmViewMode } from './CrmViewSwitcher';
import SubagentNetworkView from './SubagentNetworkView';
import { crmApi } from '../api/crmApi';
import type { CrmBriefingResponse } from '../types/crm';
import avatarImage from '../assets/avatar_full.png';
import { useAgentProfileOptional } from '../context/AgentProfileContext';
import { formatAgentDisplayName } from '../utils/agentDisplayName';

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

function getGreetingName(displayName: string): string {
    const first = displayName.trim().split(/\s+/)[0];
    return first || 'коллега';
}

function getTimeGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Доброе утро';
    if (h >= 12 && h < 18) return 'Добрый день';
    return 'Добрый вечер';
}

const AiCrmPage: React.FC<AiCrmPageProps> = ({ onSelectClient, onNewClient, onNavigate }) => {
    const agentProfile = useAgentProfileOptional();
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeAssistant, setActiveAssistant] = useState<AiAssistant | null>(null);

    const [networkAvailable, setNetworkAvailable] = useState(false);
    const [networkProbeDone, setNetworkProbeDone] = useState(false);
    const [viewMode, setViewMode] = useState<CrmViewMode>(() => readStoredViewMode());
    const [dashboard, setDashboard] = useState<SubagentDashboardResponse | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [crmBriefing, setCrmBriefing] = useState<CrmBriefingResponse | null>(null);

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
        let cancelled = false;
        crmApi
            .getCrmBriefing()
            .then((data) => {
                if (!cancelled) setCrmBriefing(data);
            })
            .catch((error) => {
                console.error('Failed to load CRM briefing:', error);
            });
        return () => {
            cancelled = true;
        };
    }, []);

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

    const agentFirstName = useMemo(() => {
        const displayName = formatAgentDisplayName(agentProfile?.profile ?? null);
        return getGreetingName(displayName);
    }, [agentProfile?.profile]);

    const bannerText = useMemo(() => {
        const greeting = `${getTimeGreeting()}, ${agentFirstName}!`;
        if (crmBriefing?.briefing?.trim()) {
            const attention = crmBriefing.clients_attention_count ?? 0;
            const briefing = crmBriefing.briefing.trim();
            const limit = 280;
            const snippet = briefing.length > limit ? `${briefing.slice(0, limit).trimEnd()}…` : briefing;
            if (attention > 0 && !/требуют внимания|клиент/i.test(briefing)) {
                const nLabel =
                    attention === 1
                        ? '1 клиент требует внимания.'
                        : `${attention} клиента требуют внимания.`;
                return `${greeting} ${nLabel} ${snippet}`;
            }
            return `${greeting} ${snippet}`;
        }
        const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
        const fallback =
            'На сегодня нет критических событий. Рекомендую проверить обновления финансовых планов и предстоящие продления полисов.';
        const base = lastAssistantMessage?.content?.trim() || fallback;
        const limit = 220;
        const snippet = base.length > limit ? `${base.slice(0, limit).trimEnd()}…` : base;
        return `${greeting} ${snippet}`;
    }, [messages, agentFirstName, crmBriefing]);

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
                    <div className="crm-ai-banner" onClick={() => setIsChatOpen(true)} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsChatOpen(true); }}>
                        <div className="crm-ai-banner__avatar-wrap">
                            {assistantAvatar}
                            <span className="crm-ai-banner__online">Online</span>
                        </div>
                        <div className="crm-ai-banner__body">
                            <p className="crm-ai-banner__text">{bannerText}</p>
                        </div>
                        <button
                            type="button"
                            className="crm-ai-banner__cta"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsChatOpen(true);
                            }}
                        >
                            <MessageCircle size={18} />
                            Написать ассистенту
                        </button>
                    </div>

                    {(viewMode === 'clients' || !networkAvailable) && <CrmClientsDashboard />}

                    <div className="lk-card">
                        {networkProbeDone && networkAvailable && (
                            <CrmViewSwitcher mode={viewMode} onChange={handleViewModeChange} />
                        )}

                        {viewMode === 'clients' || !networkAvailable ? (
                            <ClientList
                                onSelectClient={onSelectClient}
                                onNewClient={onNewClient}
                                embedded
                                lightSearch
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
