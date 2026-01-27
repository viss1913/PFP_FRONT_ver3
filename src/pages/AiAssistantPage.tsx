import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { AssistantList } from '../components/ai/AssistantList';
import { ChatWindow } from '../components/ai/ChatWindow';
import { aiService } from '../services/aiService';
import type { AiAssistant, AiMessage } from '../types/ai';

interface AiAssistantPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'products' | 'smm') => void;
}

const AiAssistantPage: React.FC<AiAssistantPageProps> = ({ onNavigate }) => {
    const [assistants, setAssistants] = useState<AiAssistant[]>([]);
    const [activeAssistant, setActiveAssistant] = useState<AiAssistant | null>(null);
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isLoadingAssistants, setIsLoadingAssistants] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // AI is generating response

    // Fetch assistants on mount
    useEffect(() => {
        const loadAssistants = async () => {
            try {
                const data = await aiService.getAssistants();
                setAssistants(data);
                if (data.length > 0) {
                    // Automatically select first one or restore from local storage if needed
                    setActiveAssistant(data[0]);
                }
            } catch (error) {
                console.error('Failed to load assistants:', error);
            } finally {
                setIsLoadingAssistants(false);
            }
        };
        loadAssistants();
    }, []);

    // Fetch history when active assistant changes
    useEffect(() => {
        if (!activeAssistant) return;

        const loadHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const history = await aiService.getHistory(activeAssistant.id);
                setMessages(history);
            } catch (error) {
                console.error('Failed to load history:', error);
                setMessages([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
    }, [activeAssistant]);

    const handleSendMessage = async (text: string) => {
        if (!activeAssistant) return;

        // 1. Optimistically add user message
        const userMsg: AiMessage = {
            id: Date.now(), // Temporary ID
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // 2. Prepare for streaming response
        // Create a placeholder message for the assistant that we will update
        const botMsgId = Date.now() + 1;
        const botMsg: AiMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);

        // 3. Start streaming
        let accumulatedContent = '';

        await aiService.sendMessageStream(
            {
                assistant_id: activeAssistant.id,
                message: text
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
            () => {
                // Formatting or final updates
                setIsTyping(false);
            }
        );
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="ai-assistant" onNavigate={onNavigate} />

            <main style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                gap: '24px',
                padding: '24px',
                maxWidth: '1600px',
                margin: '0 auto',
                width: '100%',
                boxSizing: 'border-box',
                height: 'calc(100vh - 64px)' // Full height minus header
            }}>
                {/* Sidebar: Assistants */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    overflowY: 'auto'
                }}>
                    {isLoadingAssistants ? (
                        <div style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>Загрузка...</div>
                    ) : (
                        <AssistantList
                            assistants={assistants}
                            activeAssistantId={activeAssistant?.id}
                            onSelect={setActiveAssistant}
                        />
                    )}
                </div>

                {/* Main: Chat */}
                <div style={{
                    background: '#fff',
                    borderRadius: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {activeAssistant ? (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '16px 24px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                    {activeAssistant.name}
                                </div>
                                <span style={{
                                    padding: '4px 8px',
                                    background: '#f0f0f0',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    {activeAssistant.slug}
                                </span>
                            </div>

                            {/* Chat Window */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <ChatWindow
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    isLoading={isLoadingHistory}
                                    isTyping={isTyping}
                                    placeholder={`Сообщение для ${activeAssistant.name}...`}
                                />
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                            Выберите ассистента из списка
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AiAssistantPage;
