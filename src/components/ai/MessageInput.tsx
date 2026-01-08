import React, { useState, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    disabled = false,
    placeholder = "Введите сообщение..."
}) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            background: '#fff',
            borderTop: '1px solid #eee',
            padding: '16px'
        }}>
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    outline: 'none',
                    background: disabled ? '#f5f5f5' : '#fff'
                }}
            />
            <button
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                style={{
                    background: message.trim() && !disabled ? '#D946EF' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: message.trim() && !disabled ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s'
                }}
            >
                <Send size={20} />
            </button>
        </div>
    );
};
