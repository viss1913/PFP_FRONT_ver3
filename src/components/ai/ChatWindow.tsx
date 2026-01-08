import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AiMessage } from '../../types/ai';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
    messages: AiMessage[];
    onSendMessage: (message: string) => void;
    isLoading?: boolean; // When waiting for stream to start
    isTyping?: boolean; // When stream is active
    placeholder?: string;
    embedded?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    onSendMessage,
    isLoading = false,
    isTyping = false,
    placeholder,
    embedded = false
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: embedded ? 'transparent' : '#fff',
            borderRadius: embedded ? '0' : '24px',
            overflow: 'hidden'
        }}>
            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#999',
                        marginTop: 'auto',
                        marginBottom: 'auto'
                    }}>
                        <p>Начните диалог с ассистентом</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}
                    >
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: '16px',
                            background: msg.role === 'user' ? '#D946EF' : '#f0f0f0',
                            color: msg.role === 'user' ? '#fff' : '#333',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                            borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            {/* Use ReactMarkdown only for assistant messages to interpret rich text */}
                            {msg.role === 'assistant' ? (
                                <div className="markdown-content">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                        {/* Optional: Timestamp */}
                        {/* <span style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span> */}
                    </div>
                ))}

                {/* Typing Indicator */}
                {(isLoading || isTyping) && (
                    <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: '#f0f0f0', borderRadius: '16px', borderBottomLeftRadius: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ animation: 'bounce 1s infinite 0s', width: '6px', height: '6px', background: '#999', borderRadius: '50%' }}></span>
                            <span style={{ animation: 'bounce 1s infinite 0.2s', width: '6px', height: '6px', background: '#999', borderRadius: '50%' }}></span>
                            <span style={{ animation: 'bounce 1s infinite 0.4s', width: '6px', height: '6px', background: '#999', borderRadius: '50%' }}></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <MessageInput
                onSend={onSendMessage}
                disabled={isLoading || isTyping}
                placeholder={placeholder}
            />

            {/* Simple CSS for bounce animation if not present globally */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .markdown-content p { margin: 0 0 8px 0; }
                .markdown-content p:last-child { margin: 0; }
                .markdown-content ul, .markdown-content ol { margin: 0 0 8px 0; padding-left: 20px; }
                .markdown-content pre { background: rgba(0,0,0,0.1); padding: 8px; borderRadius: 4px; overflow-x: auto; }
            `}</style>
        </div>
    );
};
