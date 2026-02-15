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
    const [botConfigs, setBotConfigs] = useState<AgentBotConfig[]>([]);
    const [selectedBotType, setSelectedBotType] = useState<'telegram' | 'max'>('telegram');
    const [botConfig, setBotConfig] = useState<AgentBotConfig>({
        name: '',
        link: '',
        token: '',
        bot_type: 'telegram',
        communication_style: '',
        base_brain_context: ''
    });
    const [clients, setClients] = useState<AgentClient[]>([]);
    const [selectedClient, setSelectedClient] = useState<AgentClient | null>(null);
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'dialogs') {
            setSelectedClient(null); // Сбрасываем при переключении мессенджера
            loadClients();
        }
    }, [activeTab, selectedBotType]);

    useEffect(() => {
        if (selectedClient) {
            loadHistory(selectedClient.id);
        }
    }, [selectedClient]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const configs = await agentConstructorApi.getBotConfigs();
            setBotConfigs(configs);

            // Найти бота выбранного типа
            const currentBot = configs.find(b => b.bot_type === selectedBotType);
            if (currentBot) {
                setBotConfig(currentBot);
            } else {
                // Если бота нет, создаем "пустой" шаблон для формы
                setBotConfig({
                    name: '',
                    link: '',
                    token: '',
                    bot_type: selectedBotType,
                    communication_style: '',
                    base_brain_context: '',
                    webhook_secret: ''
                });
            }
        } catch (error) {
            console.error('Failed to load bot configs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // При смене типа бота подгружаем его настройки из уже скачанного списка
    useEffect(() => {
        const currentBot = botConfigs.find(b => b.bot_type === selectedBotType);
        if (currentBot) {
            setBotConfig(currentBot);
        } else {
            setBotConfig({
                name: '',
                link: '',
                token: '',
                bot_type: selectedBotType,
                communication_style: '',
                base_brain_context: '',
                webhook_secret: ''
            });
        }
    }, [selectedBotType, botConfigs]);

    const loadClients = async (page = 1) => {
        if (page === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        try {
            const activeBotId = botConfigs.find(b => b.bot_type === selectedBotType)?.id;
            const result = await agentConstructorApi.getClients(page, 50, activeBotId);
            console.log('AiAgent: API result:', result);

            let newClients: AgentClient[] = [];
            let totalPages = 1;
            let currentPage = page;

            if (Array.isArray(result)) {
                newClients = result;
            } else if (result && typeof result === 'object') {
                const res = result as any;
                newClients = res.data || res.clients || [];
                const paginationAttr = res.pagination || res.meta;
                totalPages = paginationAttr?.totalPages || 1;
                currentPage = paginationAttr?.page || page;
            }

            setPagination({ page: currentPage, totalPages });

            if (newClients.length === 0 && page === 1) {
                setClients([]);
                return;
            }

            setClients(prev => {
                const base = page === 1 ? [] : prev;
                const combined = [...base];
                newClients.forEach(nc => {
                    if (nc && nc.id && !combined.find(c => c.id === nc.id)) {
                        combined.push(nc);
                    }
                });

                return combined.sort((a, b) => {
                    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
                });
            });

            if (page === 1 && newClients.length > 0 && !selectedClient) {
                setSelectedClient(newClients[0]);
            }
        } catch (error) {
            console.error('AiAgent: Failed to load clients:', error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    const formatToMSK = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        // Добавляем 3 часа для МСК (если дата приходит в UTC)
        // Если дата уже в МСК или содержит Z, JS Date поймет смещение.
        // Чтобы гарантировать +3 от UTC:
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const mskDate = new Date(utc + (3600000 * 3));

        return mskDate.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            // Обновить все конфиги после сохранения
            const updatedConfigs = await agentConstructorApi.getBotConfigs();
            setBotConfigs(updatedConfigs);

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
            {/* Messenger Switcher */}
            <div style={{
                display: 'flex',
                background: '#f8f9fa',
                padding: '4px',
                borderRadius: '12px',
                gap: '4px',
                marginBottom: '32px'
            }}>
                <button
                    onClick={() => setSelectedBotType('telegram')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedBotType === 'telegram' ? '#fff' : 'transparent',
                        color: selectedBotType === 'telegram' ? '#0088cc' : '#666',
                        boxShadow: selectedBotType === 'telegram' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Send size={18} /> Telegram
                </button>
                <button
                    onClick={() => setSelectedBotType('max')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedBotType === 'max' ? '#fff' : 'transparent',
                        color: selectedBotType === 'max' ? '#8B5CF6' : '#666',
                        boxShadow: selectedBotType === 'max' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <MessageSquare size={18} /> MAX Messenger
                </button>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bot color="#D946EF" /> Настройка {selectedBotType === 'telegram' ? 'Telegram' : 'MAX'} ассистента
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
                        <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>
                            {selectedBotType === 'telegram' ? 'Ссылка на бота (TLG)' : 'Домен/ID в MAX'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={botConfig.link}
                                onChange={e => setBotConfig({ ...botConfig, link: e.target.value })}
                                placeholder={selectedBotType === 'telegram' ? "https://t.me/your_bot" : "ID вашего бота"}
                                style={inputStyle}
                            />
                            {botConfig.link && selectedBotType === 'telegram' && (
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
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>
                        {selectedBotType === 'telegram' ? 'Telegram Token (из @BotFather)' : 'MAX API Token'}
                    </label>
                    <input
                        type="password"
                        value={botConfig.token}
                        onChange={e => setBotConfig({ ...botConfig, token: e.target.value })}
                        placeholder={selectedBotType === 'telegram' ? "7123456789:ABCDEF..." : "Ваш API ключ из MAX Partner"}
                        style={inputStyle}
                    />
                </div>

                {selectedBotType === 'max' && (
                    <>
                        <div className="input-field">
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Webhook Secret (для защиты)</label>
                            <input
                                type="text"
                                value={botConfig.webhook_secret || ''}
                                onChange={e => setBotConfig({ ...botConfig, webhook_secret: e.target.value })}
                                placeholder="Введите любую строку для защиты вебхука"
                                style={inputStyle}
                            />
                        </div>
                        {botConfig.id && (
                            <div className="input-field">
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#666' }}>Webhook URL (прописать в MAX)</label>
                                <div style={{
                                    ...inputStyle,
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {`https://${window.location.host}/api/pfp/constructor/webhook/max/${botConfig.id}`}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`https://${window.location.host}/api/pfp/constructor/webhook/max/${botConfig.id}`);
                                            alert('URL скопирован');
                                        }}
                                        style={{ border: 'none', background: 'none', color: '#8B5CF6', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                    >
                                        Копировать
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

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
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>Список клиентов</h3>
                    <div style={{
                        display: 'flex',
                        background: '#f8f9fa',
                        padding: '3px',
                        borderRadius: '10px',
                        gap: '3px'
                    }}>
                        <button
                            onClick={() => setSelectedBotType('telegram')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: selectedBotType === 'telegram' ? '#fff' : 'transparent',
                                color: selectedBotType === 'telegram' ? '#0088cc' : '#666',
                                boxShadow: selectedBotType === 'telegram' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Telegram
                        </button>
                        <button
                            onClick={() => setSelectedBotType('max')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: selectedBotType === 'max' ? '#fff' : 'transparent',
                                color: selectedBotType === 'max' ? '#8B5CF6' : '#666',
                                boxShadow: selectedBotType === 'max' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            MAX
                        </button>
                    </div>
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
                                    border: selectedClient?.id === client.id ? '1px solid #D946EF' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    marginBottom: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {client.bot_type === 'max' ? (
                                            <MessageSquare size={14} color="#8B5CF6" />
                                        ) : (
                                            <Send size={14} color="#0088cc" />
                                        )}
                                        <span style={{ fontWeight: 600, color: '#333' }}>
                                            {client.nickname ? `@${client.nickname}` : `ID: ${client.user_id}`}
                                        </span>
                                    </div>
                                    {client.bot_name && (
                                        <span style={{ fontSize: '10px', color: '#999', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>
                                            {client.bot_name}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {client.last_message || 'Нет сообщений'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', display: 'flex', justifyContent: 'flex-end' }}>
                                    {client.last_message_at ? formatToMSK(client.last_message_at) : ''}
                                </div>
                            </div>
                        ))
                    )}

                    {pagination.page < pagination.totalPages && (
                        <button
                            onClick={() => loadClients(pagination.page + 1)}
                            disabled={isLoadingMore}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: 'transparent',
                                border: '1px dashed #ddd',
                                borderRadius: '12px',
                                color: '#666',
                                fontSize: '13px',
                                cursor: 'pointer',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {isLoadingMore ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                            Показать еще
                        </button>
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
                        <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {selectedClient.bot_type === 'max' ? <MessageSquare color="#8B5CF6" size={20} /> : <Send color="#0088cc" size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {selectedClient.nickname ? `@${selectedClient.nickname}` : `User ID: ${selectedClient.user_id}`}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        {selectedClient.bot_name || (selectedClient.bot_type === 'max' ? 'MAX' : 'Telegram')}
                                    </div>
                                </div>
                            </div>
                            {selectedClient.bot_type === 'telegram' && selectedClient.nickname && (
                                <a
                                    href={`https://t.me/${selectedClient.nickname}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#0088cc', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                >
                                    Открыть в TG <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#fcfcfc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map(msg => (
                                <React.Fragment key={msg.id}>
                                    {/* User Message */}
                                    <div
                                        style={{
                                            maxWidth: '70%',
                                            alignSelf: 'flex-start',
                                            padding: '12px 16px',
                                            borderRadius: '16px',
                                            fontSize: '14px',
                                            lineHeight: 1.5,
                                            background: '#fff',
                                            color: '#333',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                            border: '1px solid #f0f0f0'
                                        }}
                                    >
                                        <div>{msg.user_message}</div>
                                        <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.7, textAlign: 'right' }}>
                                            {formatToMSK(msg.created_at).split(' ')[1]}
                                        </div>
                                    </div>

                                    {/* Assistant Message */}
                                    {msg.assistant_message && (
                                        <div
                                            style={{
                                                maxWidth: '70%',
                                                alignSelf: 'flex-end',
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                fontSize: '14px',
                                                lineHeight: 1.5,
                                                background: '#e0f2fe',
                                                color: '#333',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                                border: '1px solid #bae6fd'
                                            }}
                                        >
                                            <div style={{ marginBottom: '4px' }}>
                                                <a
                                                    href={botConfig.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#0ea5e9', fontWeight: 600, fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    {botConfig.name || 'Bot'} <ExternalLink size={10} />
                                                </a>
                                            </div>
                                            <div>{msg.assistant_message}</div>
                                            <div style={{ fontSize: '10px', marginTop: '6px', opacity: 0.7, textAlign: 'right' }}>
                                                {formatToMSK(msg.created_at).split(' ')[1]}
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
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
