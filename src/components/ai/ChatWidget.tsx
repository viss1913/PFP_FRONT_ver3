import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import type { AiMessage } from '../../types/ai';

interface ChatWidgetProps {
    messages: AiMessage[];
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
    isTyping?: boolean;
    title?: string;
    isOpen?: boolean; // If controlled externally
    onToggle?: () => void; // If controlled externally
    embedded?: boolean; // If true, renders inline without floating button
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
    messages,
    onSendMessage,
    isLoading = false,
    isTyping = false,
    title = "AI Помощник",
    isOpen: propsIsOpen,
    onToggle: propsOnToggle,
    embedded = false
}) => {
    const [localIsOpen, setLocalIsOpen] = useState(false);

    const isControlled = typeof propsIsOpen !== 'undefined';
    const isOpen = isControlled ? propsIsOpen : localIsOpen;
    const toggle = () => {
        if (propsOnToggle) {
            propsOnToggle();
        } else {
            setLocalIsOpen(!isOpen);
        }
    };

    if (embedded) {
        return (
            <ChatWindow
                messages={messages}
                onSendMessage={onSendMessage}
                isLoading={isLoading}
                isTyping={isTyping}
                embedded={true}
                placeholder="Напишите сообщение..."
            />
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '16px'
        }}>
            {isOpen && (
                <div style={{
                    width: '380px',
                    height: '600px',
                    maxHeight: 'calc(100vh - 120px)',
                    background: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #eee'
                }}>
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fff'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
                        <button
                            onClick={toggle}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <ChatWindow
                            messages={messages}
                            onSendMessage={onSendMessage}
                            isLoading={isLoading}
                            isTyping={isTyping}
                            embedded={true}
                            placeholder="Задайте вопрос по плану..."
                        />
                    </div>
                </div>
            )}

            <button
                onClick={toggle}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#D946EF',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(217, 70, 239, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'scale(0)' : 'scale(1)'
                }}
            >
                <MessageCircle size={32} />
            </button>
        </div>
    );
};
