import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clientApi } from '../api/clientApi';
import type { ChatAiMessage } from '../types/client';
import ClientB2cChatAiThread from './ClientB2cChatAiThread';

type ClientChatsPayload = {
    chat_ai_messages: ChatAiMessage[];
    b2c_site_chat_messages: ChatAiMessage[];
    constructor_site_chat_messages: ChatAiMessage[];
};

const emptyChats = (): ClientChatsPayload => ({
    chat_ai_messages: [],
    b2c_site_chat_messages: [],
    constructor_site_chat_messages: [],
});

function ChannelSection({ title, messages }: { title: string; messages: ChatAiMessage[] }) {
    if (messages.length === 0) return null;
    return (
        <div style={{ marginBottom: '22px' }}>
            <div
                style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                }}
            >
                {title}
            </div>
            <ClientB2cChatAiThread messages={messages} renderEmptyPlaceholder={false} />
        </div>
    );
}

interface ClientB2cChatAiModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: number | null;
    /** Подпись в шапке: ФИО */
    clientTitle: string;
}

const CHAT_AI_LIMIT = 500;

const ClientB2cChatAiModal: React.FC<ClientB2cChatAiModalProps> = ({
    isOpen,
    onClose,
    clientId,
    clientTitle,
}) => {
    const [chats, setChats] = useState<ClientChatsPayload>(emptyChats);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || clientId == null) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setChats(emptyChats());

        clientApi
            .getClient(clientId, { include_chat_ai: true, chat_ai_limit: CHAT_AI_LIMIT })
            .then((c) => {
                if (!cancelled) {
                    setChats({
                        chat_ai_messages: c.chat_ai_messages ?? [],
                        b2c_site_chat_messages: c.b2c_site_chat_messages ?? [],
                        constructor_site_chat_messages: c.constructor_site_chat_messages ?? [],
                    });
                }
            })
            .catch(() => {
                if (!cancelled) setError('Не удалось загрузить переписку. Попробуйте позже.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, clientId]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const totalChats =
        chats.chat_ai_messages.length +
        chats.b2c_site_chat_messages.length +
        chats.constructor_site_chat_messages.length;

    return (
        <AnimatePresence>
            {isOpen && clientId != null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        onClick={(e) => e.stopPropagation()}
                        className="premium-card"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px',
                            paddingTop: '20px',
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Закрыть"
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                zIndex: 1,
                            }}
                        >
                            <X size={22} />
                        </button>

                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', paddingRight: '36px' }}>
                            Чаты клиента (B2C)
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            {clientTitle.trim() || 'Клиент'} · ID: {clientId}
                        </p>

                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                minHeight: '200px',
                                marginBottom: '12px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.15)',
                                padding: '12px',
                            }}
                        >
                            {loading && (
                                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Загрузка…
                                </div>
                            )}
                            {!loading && error && (
                                <div style={{ padding: '24px', textAlign: 'center' }}>
                                    <p style={{ color: '#f87171', marginBottom: '16px' }}>{error}</p>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            )}
                            {!loading && !error && totalChats === 0 && (
                                <div
                                    style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)',
                                        fontSize: '15px',
                                    }}
                                >
                                    Сообщений ни в одном канале пока нет (chat_AI, B2C site, конструктор).
                                </div>
                            )}
                            {!loading && !error && totalChats > 0 && (
                                <>
                                    <ChannelSection title="Chat AI" messages={chats.chat_ai_messages} />
                                    <ChannelSection title="B2C site-чат" messages={chats.b2c_site_chat_messages} />
                                    <ChannelSection
                                        title="Конструктор (лендинг)"
                                        messages={chats.constructor_site_chat_messages}
                                    />
                                </>
                            )}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                            Только просмотр · chat_AI, B2C site, конструктор
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ClientB2cChatAiModal;
