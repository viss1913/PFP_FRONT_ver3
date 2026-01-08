import React from 'react';
import type { AiAssistant } from '../../types/ai';

interface AssistantListProps {
    assistants: AiAssistant[];
    activeAssistantId?: number;
    onSelect: (assistant: AiAssistant) => void;
}

export const AssistantList: React.FC<AssistantListProps> = ({ assistants, activeAssistantId, onSelect }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>Ассистенты</h3>
            {assistants.map((assistant) => {
                const isActive = assistant.id === activeAssistantId;
                return (
                    <div
                        key={assistant.id}
                        onClick={() => onSelect(assistant)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            background: isActive ? '#fdf2fa' : '#fff',
                            border: isActive ? '1px solid #D946EF' : '1px solid transparent',
                            transition: 'all 0.2s',
                            boxShadow: isActive ? '0 2px 8px rgba(217, 70, 239, 0.15)' : 'none'
                        }}
                    >
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: isActive ? '#D946EF' : '#eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isActive ? '#fff' : '#666',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            overflow: 'hidden',
                            flexShrink: 0
                        }}>
                            {assistant.image_url ? (
                                <img src={assistant.image_url} alt={assistant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                assistant.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{
                                fontWeight: isActive ? 600 : 500,
                                color: '#333',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {assistant.name}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: '#666',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {assistant.description || 'AI Assistant'}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
