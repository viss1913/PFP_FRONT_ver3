import React from 'react';
import Header from './Header';
import ClientList from './ClientList';
import type { Client } from '../types/client';
import { ChatWidget } from './ai/ChatWidget';
import { aiService } from '../services/aiService';
import type { AiMessage } from '../types/ai';
import { useState } from 'react';

interface AiCrmPageProps {
    onSelectClient: (client: Client) => void;
    onNewClient: () => void;
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products') => void;
}

const AiCrmPage: React.FC<AiCrmPageProps> = ({ onSelectClient, onNewClient, onNavigate }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    // Hardcoded logic for demo: Select implicit "AI CRM" assistant or just use generic chat
    // For now, we'll just handle local state for the widget. 
    // Ideally we'd fetch the specific 'crm' assistant.

    const handleSendMessage = async (text: string) => {
        const userMsg: AiMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Placeholder ID for "AI CRM" - in real app, fetch by slug 'crm'
        const crmAssistantId = 1;

        const botMsgId = Date.now() + 1;
        const botMsg: AiMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);

        let accumulatedContent = '';
        await aiService.sendMessageStream(
            {
                assistant_id: crmAssistantId,
                message: text,
                // context: { type: 'crm_summary', payload: '...' } // Optional context
            },
            (chunk) => {
                accumulatedContent += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === botMsgId ? { ...m, content: accumulatedContent } : m
                ));
            },
            (error) => {
                console.error('Stream error:', error);
                setMessages(prev => prev.map(m =>
                    m.id === botMsgId ? { ...m, content: accumulatedContent + '\n[Ошибка]' } : m
                ));
                setIsTyping(false);
            },
            () => setIsTyping(false)
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="crm" onNavigate={onNavigate} />

            <main style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 400px) 1fr',
                gap: '24px',
                padding: '24px',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Left Column: AI Chat Placeholder */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    // padding: '24px', // ChatWidget has its own padding/layout
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    height: 'calc(100vh - 112px)',
                    position: 'sticky',
                    top: '88px',
                    overflow: 'hidden' // Ensure rounded corners clip content
                }}>
                    <div style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #eee',
                        fontWeight: 'bold',
                        fontSize: '18px'
                    }}>
                        AI CRM Ассистент
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <ChatWidget
                            messages={messages}
                            onSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            embedded={true}
                        />
                    </div>
                </div>

                {/* Right Column: Client List */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                    <ClientList
                        onSelectClient={onSelectClient}
                        onNewClient={onNewClient}
                        embedded={true}
                    />
                </div>
            </main>
        </div>
    );
};

export default AiCrmPage;
