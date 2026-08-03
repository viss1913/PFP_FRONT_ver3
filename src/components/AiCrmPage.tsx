import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Header from './Header';
import ClientList from './ClientList';
import CrmClientsDashboard from './CrmClientsDashboard';
import CrmViewSwitcher, { type CrmViewMode } from './CrmViewSwitcher';
import SubagentNetworkView from './SubagentNetworkView';
import { agentLkApi, isSubagentNetworkDisabledError, type SubagentDashboardResponse } from '../api/agentLkApi';
import { crmApi } from '../api/crmApi';
import type { CrmBriefingResponse } from '../types/crm';
import avatarImage from '../assets/avatar_full.png';
import { useAgentProfileOptional } from '../context/AgentProfileContext';
import { formatAgentDisplayName } from '../utils/agentDisplayName';

import type { Client } from '../types/client';
import { ChatWindow } from './ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiMessage, AiAssistant } from '../types/ai';
import type { NavPage } from './lk/lkNavigation';
import ContentFactoryCrmTeaser from './contentFactory/ContentFactoryCrmTeaser';
import '../styles/content-factory.css';

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
    onEditClient?: (client: Client) => void;
    onNewClient: () => void;
    onNavigate: (page: NavPage) => void;
    /** Без оболочки Header — когда CRM встроен в ATB Bank shell. */
    contentOnly?: boolean;
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

const AiCrmPage: React.FC<AiCrmPageProps> = ({
    onSelectClient,
    onEditClient,
    onNewClient,
    onNavigate,
    contentOnly = false,
}) => {
    const agentProfile = useAgentProfileOptional();
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeAssistant, setActiveAssistant] = useState<AiAssistant | null>(null);
    const [crmBriefing, setCrmBriefing] = useState<CrmBriefingResponse | null>(null);
    const [crmViewMode, setCrmViewMode] = useState<CrmViewMode>('clients');
    const [subagentsDashboard, setSubagentsDashboard] = useState<SubagentDashboardResponse | null>(null);
    const [subagentsLoading, setSubagentsLoading] = useState(false);
    const [subagentsError, setSubagentsError] = useState<string | null>(null);
    const [subagentsNetworkEnabled, setSubagentsNetworkEnabled] = useState<boolean | null>(null);

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

    const loadSubagentsDashboard = useCallback(async () => {
        setSubagentsLoading(true);
        setSubagentsError(null);
        try {
            const dashboard = await agentLkApi.getSubagentsDashboard();
            setSubagentsDashboard(dashboard);
            setSubagentsNetworkEnabled(true);
        } catch (error) {
            if (isSubagentNetworkDisabledError(error)) {
                setSubagentsNetworkEnabled(false);
                setSubagentsDashboard(null);
                setCrmViewMode('clients');
            } else {
                setSubagentsNetworkEnabled(true);
                setSubagentsError('Не удалось загрузить сеть субагентов. Попробуйте обновить страницу.');
            }
        } finally {
            setSubagentsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (contentOnly) return;
        let cancelled = false;
        agentLkApi
            .getSubagentsDashboard()
            .then((dashboard) => {
                if (!cancelled) {
                    setSubagentsDashboard(dashboard);
                    setSubagentsNetworkEnabled(true);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setSubagentsNetworkEnabled(!isSubagentNetworkDisabledError(error));
                }
            });
        return () => {
            cancelled = true;
        };
    }, [contentOnly]);

    useEffect(() => {
        if (contentOnly || crmViewMode !== 'subagents') return;
        if (subagentsDashboard) return;
        void loadSubagentsDashboard();
    }, [contentOnly, crmViewMode, subagentsDashboard, loadSubagentsDashboard]);

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

    const pageBody = (
        <>
            <main className="lk-page-main">
                <div
                    className="crm-ai-banner"
                    onClick={() => setIsChatOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setIsChatOpen(true);
                    }}
                >
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

                {!contentOnly ? <ContentFactoryCrmTeaser onNavigate={onNavigate} /> : null}

                {!contentOnly && subagentsNetworkEnabled !== false ? (
                    <CrmViewSwitcher
                        mode={crmViewMode}
                        onChange={(mode) => {
                            setCrmViewMode(mode);
                            if (mode === 'subagents' && !subagentsDashboard) {
                                void loadSubagentsDashboard();
                            }
                        }}
                    />
                ) : null}

                {crmViewMode === 'subagents' && !contentOnly ? (
                    <>
                        {subagentsError ? (
                            <div
                                className="lk-card"
                                style={{ marginBottom: 24, color: '#b91c1c', fontSize: 14 }}
                            >
                                {subagentsError}
                            </div>
                        ) : null}
                        {subagentsDashboard ? (
                            <SubagentNetworkView dashboard={subagentsDashboard} loading={subagentsLoading} />
                        ) : subagentsLoading ? (
                            <div className="lk-card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                                Загружаем сеть субагентов…
                            </div>
                        ) : null}
                    </>
                ) : (
                    <>
                        <CrmClientsDashboard />

                        <div className="lk-card">
                            <ClientList
                                onSelectClient={onSelectClient}
                                {...(onEditClient ? { onEditClient } : {})}
                                onNewClient={onNewClient}
                                embedded
                                lightSearch
                            />
                        </div>
                    </>
                )}
            </main>

            {isChatOpen ? (
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
            ) : null}
        </>
    );

    if (contentOnly) {
        return pageBody;
    }

    return (
        <Header activePage="crm" onNavigate={onNavigate}>
            {pageBody}
        </Header>
    );
};

export default AiCrmPage;
