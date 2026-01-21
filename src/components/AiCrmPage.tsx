import React from 'react';
import Header from './Header';
import ClientList from './ClientList';

import type { Client } from '../types/client';
import { ChatWidget } from './ai/ChatWidget';
import { aiService } from '../services/aiService';
import type { AiMessage, AiAssistant } from '../types/ai';
import { useState } from 'react';

interface AiCrmPageProps {
    onSelectClient: (client: Client) => void;
    onNewClient: () => void;
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products') => void;
}

const AiCrmPage: React.FC<AiCrmPageProps> = ({ onSelectClient, onNewClient, onNavigate }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const [activeAssistant, setActiveAssistant] = useState<AiAssistant | null>(null);

    // Fetch assistants on mount
    React.useEffect(() => {
        const loadAssistant = async () => {
            try {
                // Load assistants
                const assistants = await aiService.getAssistants();
                let crmAssistant: AiAssistant | null = null;

                if (assistants.length > 0) {
                    crmAssistant = assistants.find(a => a.slug === 'ai-crm' || a.name.toLowerCase().includes('crm')) || assistants[0];
                    setActiveAssistant(crmAssistant);
                }

                // NEW: Load History (which now includes Auto-Briefing from backend)
                if (crmAssistant) {
                    const history = await aiService.getHistory(crmAssistant.id);
                    // Map history to local state if needed, or set directly
                    // Assuming history is [AiMessage, AiMessage...]
                    setMessages(history);
                }

            } catch (error) {
                console.error('Failed to load initial data:', error);

                // No fallback needed if backend guarantees auto-brief, but safe to leave empty or show error
                if (!messages.length) {
                    setMessages([{
                        id: Date.now(),
                        role: 'assistant',
                        content: "Не удалось загрузить историю чата. Попробуйте обновить страницу.",
                        created_at: new Date().toISOString()
                    }]);
                }
            }
        };
        loadAssistant();
    }, []);

    const handleSendMessage = async (text: string) => {
        if (!activeAssistant) {
            alert('Ассистент еще не загружен или недоступен.');
            return;
        }

        const userMsg: AiMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

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
                assistant_id: 1, // Forced ID as requested
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
                    m.id === botMsgId ? { ...m, content: accumulatedContent + '\n\n[Ошибка связи с сервером]' } : m
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
