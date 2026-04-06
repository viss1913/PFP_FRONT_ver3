import React, { useMemo } from 'react';
import type { ChatAiMessage } from '../types/client';

interface ClientB2cChatAiThreadProps {
    messages: ChatAiMessage[];
    /** Если false и массив пуст — ничего не рендерим (секции в общей модалке) */
    renderEmptyPlaceholder?: boolean;
    /** Текст при пустом массиве, если renderEmptyPlaceholder !== false */
    emptyLabel?: string;
}

const ClientB2cChatAiThread: React.FC<ClientB2cChatAiThreadProps> = ({
    messages,
    renderEmptyPlaceholder = true,
    emptyLabel = 'Нет сообщений.',
}) => {
    const sorted = useMemo(
        () =>
            [...messages].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
        [messages]
    );

    const formatTime = (iso: string) => {
        try {
            return new Date(iso).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    if (sorted.length === 0) {
        if (!renderEmptyPlaceholder) return null;
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>
                {emptyLabel}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '8px 4px',
            }}
        >
            {sorted.map((m) => {
                const isUser = m.role === 'user';
                return (
                    <div
                        key={m.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '100%',
                        }}
                    >
                        <div
                            style={{
                                maxWidth: '88%',
                                padding: '10px 14px',
                                borderRadius: '14px',
                                background: isUser ? 'rgba(255, 199, 80, 0.18)' : 'rgba(255,255,255,0.08)',
                                color: '#fff',
                                fontSize: '14px',
                                lineHeight: 1.45,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                            }}
                        >
                            {m.content}
                        </div>
                        <div
                            style={{
                                marginTop: '4px',
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                                width: '100%',
                                paddingLeft: isUser ? 0 : '4px',
                                paddingRight: isUser ? '4px' : 0,
                            }}
                        >
                            <span>{isUser ? 'Клиент' : 'AI'}</span>
                            <span>{formatTime(m.created_at)}</span>
                            {m.stage_key ? (
                                <span
                                    style={{
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.06)',
                                        fontSize: '10px',
                                    }}
                                >
                                    {m.stage_key}
                                </span>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ClientB2cChatAiThread;
