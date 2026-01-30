import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { agentConstructorApi } from '../api/agentConstructorApi';
import type { AgentBotConfig, AgentClient, AgentMessage } from '../types/agent';
import { Settings, Users, MessageSquare, Send, Bot, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AiAgentPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products' | 'smm') => void;
}

const AiAgentPage: React.FC<AiAgentPageProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<'settings' | 'dialogs'>('settings');
    const [botConfig, setBotConfig] = useState<AgentBotConfig>({
        name: '',
        link: '',
        token: '',
        communication_style: '',
        base_brain_context: ''
    });
    const [clients, setClients] = useState<AgentClient[]>([]);
    const [selectedClient, setSelectedClient] = useState<AgentClient | null>(null);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'dialogs') {
            loadClients();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedClient) {
            loadHistory(selectedClient.id);
        }
    }, [selectedClient]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const config = await agentConstructorApi.getBotConfig();
            setBotConfig(config);
        } catch (error) {
            console.error('Failed to load bot config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadClients = async () => {
        try {
            const data = await agentConstructorApi.getClients();
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    };

    const loadHistory = async (clientId: number) => {
        try {
            const history = await agentConstructorApi.getHistory(clientId);
            setMessages(history);
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await agentConstructorApi.saveBotConfig(botConfig);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to save config:', error);
            alert('Ошибка при сохранении настроек');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !messageText.trim()) return;

        try {
            await agentConstructorApi.sendMessage({
                clientId: selectedClient.id,
                text: messageText
            });
            setMessageText('');
            loadHistory(selectedClient.id);
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Ошибка при отправке сообщения');
        }
    };

    const renderSettings = () => (
        <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bot color="#D946EF" /> Настройка персонального ассистента
            </h2>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-field">
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Название бота</label>
                        <input
                            type="text"
                            value={botConfig.name}
                            onChange={e => setBotConfig({ ...botConfig, name: e.target.value })}
                            placeholder="Напр. Мой помощник Денис"
                            style={inputStyle}
                        />
                    </div>
                    <div className="input-field">
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Ссылка на бота (TLG)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={botConfig.link}
                                onChange={e => setBotConfig({ ...botConfig, link: e.target.value })}
                                placeholder="https://t.me/your_bot"
                                style={inputStyle}
                            />
                            {botConfig.link && (
                                <a href={botConfig.link} target="_blank" rel="noopener noreferrer" style={{
                                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#D946EF'
                                }}>
                                    <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                <div className="input-field">
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Telegram Token (из @BotFather)</label>
                    <input
                        type="password"
                        value={botConfig.token}
                        onChange={e => setBotConfig({ ...botConfig, token: e.target.value })}
                        placeholder="7123456789:ABCDEF..."
                        style={inputStyle}
                    />
                </div>

                <div className="input-field">
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Стилистика общения</label>
                    <textarea
                        value={botConfig.communication_style}
                        onChange={e => setBotConfig({ ...botConfig, communication_style: e.target.value })}
                        placeholder="Напр. Общайся вежливо, используй профессиональную финансовую лексику..."
                        style={{ ...inputStyle, height: '100px', resize: 'none' }}
                    />
                </div>

                <div className="input-field">
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Базовый контекст знаний</label>
                    <textarea
                        value={botConfig.base_brain_context}
                        onChange={e => setBotConfig({ ...botConfig, base_brain_context: e.target.value })}
                        placeholder="Ваша компания, услуги, ключевые преимущества..."
                        style={{ ...inputStyle, height: '150px', resize: 'none' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                        padding: '16px',
                        background: showSuccess ? '#10b981' : 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isSaving ? (
                        <RefreshCw className="animate-spin" size={20} />
                    ) : showSuccess ? (
                        <><CheckCircle2 size={20} /> Настройки сохранены!</>
                    ) : (
                        'Сохранить конфигурацию'
                    )}
                </button>
            </form>
        </div>
    );

    const renderDialogs = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '350px 1fr',
            gap: '24px',
            height: 'calc(100vh - 200px)',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Sidebar: Clients */}
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Список клиентов</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {clients.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Клиентов пока нет</div>
                    ) : (
                        clients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    background: selectedClient?.id === client.id ? '#fdf4ff' : 'transparent',
                                    transition: 'all 0.2s',
                                    marginBottom: '8px'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{client.name}</div>
                                <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {client.last_message_text || 'Нет сообщений'}
                                </div>
                                <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>
                                    {client.last_message_at ? new Date(client.last_message_at).toLocaleString() : ''}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div style={{
                background: '#fff',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                overflow: 'hidden'
            }}>
                {selectedClient ? (
                    <>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={20} color="#666" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600 }}>{selectedClient.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>@{selectedClient.username || 'unknown'}</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#fcfcfc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    style={{
                                        maxWidth: '70%',
                                        alignSelf: msg.sender_type === 'user' ? 'flex-start' : 'flex-end',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        background: msg.sender_type === 'user' ? '#fff' : 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                        color: msg.sender_type === 'user' ? '#333' : '#fff',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                        border: msg.sender_type === 'user' ? '1px solid #f0f0f0' : 'none'
                                    }}
                                >
                                    <div>{msg.text}</div>
                                    <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.7, textAlign: 'right' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                value={messageText}
                                onChange={e => setMessageText(e.target.value)}
                                placeholder="Напишите сообщение..."
                                style={{ ...inputStyle, flex: 1 }}
                            />
                            <button
                                type="submit"
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', flexDirection: 'column', gap: '16px' }}>
                        <MessageSquare size={48} opacity={0.3} />
                        Выберите чат из списка слева
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="ai-agent" onNavigate={onNavigate} />

            <main style={{ flex: 1, padding: '32px' }}>
                {/* Tab Switcher */}
                <div style={{
                    display: 'flex',
                    background: '#fff',
                    padding: '6px',
                    borderRadius: '16px',
                    gap: '6px',
                    width: 'fit-content',
                    margin: '0 auto 32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            background: activeTab === 'settings' ? '#fdf4ff' : 'transparent',
                            color: activeTab === 'settings' ? '#D946EF' : '#666'
                        }}
                    >
                        <Settings size={18} /> Настройки
                    </button>
                    <button
                        onClick={() => setActiveTab('dialogs')}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                            background: activeTab === 'dialogs' ? '#fdf4ff' : 'transparent',
                            color: activeTab === 'dialogs' ? '#D946EF' : '#666'
                        }}
                    >
                        <Users size={18} /> Клиенты и Диалоги
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
                        <RefreshCw className="animate-spin" size={48} color="#D946EF" />
                    </div>
                ) : (
                    activeTab === 'settings' ? renderSettings() : renderDialogs()
                )}
            </main>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #eee',
    background: '#fcfcfc',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
};

export default AiAgentPage;
