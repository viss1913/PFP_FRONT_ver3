import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { b2cVisualAssets } from '../../content/b2cAssets';
import type { AiB2cSettingsPublic, B2cPlanChatMessage } from '../../types/b2cOrchestrator';

interface B2cPlanChatProps {
    messages: B2cPlanChatMessage[];
    isStreaming: boolean;
    error: string | null;
    assistantSettings: AiB2cSettingsPublic | null;
    onSend: (text: string) => void;
    onClearError?: () => void;
    placeholder?: string;
    compact?: boolean;
}

const B2cPlanChat: React.FC<B2cPlanChatProps> = ({
    messages,
    isStreaming,
    error,
    assistantSettings,
    onSend,
    onClearError,
    placeholder = 'Напишите сообщение…',
    compact = false,
}) => {
    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const displayName = assistantSettings?.display_name?.trim() || 'Виктория';
    const avatarUrl = assistantSettings?.avatar_url?.trim() || b2cVisualAssets.victoriaAvatar;
    const tagline = assistantSettings?.tagline?.trim() || 'AI-консультант';

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages, isStreaming]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text || isStreaming) return;
        setDraft('');
        onSend(text);
    };

    return (
        <aside
            className={`b2c-plan-chat${compact ? ' b2c-plan-chat--compact' : ''}`}
            aria-label="Чат с ассистентом"
        >
            <div className="b2c-plan-chat__profile">
                <img src={avatarUrl} alt={displayName} className="b2c-plan-chat__avatar" />
                <div className="b2c-plan-chat__profile-text">
                    <div className="b2c-plan-chat__name">{displayName}</div>
                    <div className="b2c-plan-chat__role">{tagline}</div>
                </div>
                <span className="b2c-plan-chat__online">{isStreaming ? 'Печатает…' : 'Online'}</span>
            </div>

            <div className="b2c-plan-chat__messages" aria-live="polite">
                {messages.length === 0 ? (
                    <p className="b2c-plan-chat__empty">Задайте вопрос или опишите цель — я подскажу следующий шаг.</p>
                ) : (
                    messages.map((m) => (
                        <div
                            key={m.id}
                            className={`b2c-plan-chat__row b2c-plan-chat__row--${m.role}`}
                        >
                            <div className="b2c-plan-chat__bubble">
                                <p className="b2c-plan-chat__bubble-text">
                                    {m.content}
                                    {m.streaming ? <span className="b2c-plan-chat__caret" aria-hidden /> : null}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {error ? (
                <div className="b2c-plan-chat__error" role="alert">
                    <span>{error}</span>
                    {onClearError ? (
                        <button type="button" className="b2c-plan-chat__error-dismiss" onClick={onClearError}>
                            ×
                        </button>
                    ) : null}
                </div>
            ) : null}

            <form className="b2c-plan-chat__composer" onSubmit={handleSubmit}>
                <input
                    type="text"
                    className="b2c-plan-chat__input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={placeholder}
                    disabled={isStreaming}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    className="b2c-plan-chat__send"
                    disabled={isStreaming || !draft.trim()}
                    aria-label="Отправить"
                >
                    <Send size={18} strokeWidth={2} />
                </button>
            </form>
        </aside>
    );
};

export default B2cPlanChat;
