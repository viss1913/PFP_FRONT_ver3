import React from 'react';
import ResultPageDesign from './ResultPageDesign';
import { ChatWidget } from './ai/ChatWidget';
import { aiService } from '../services/aiService';
import type { AiMessage } from '../types/ai';
import { useState } from 'react';
import ReportPreviewModal from './ReportPreviewModal';

interface ResultPageProps {
    data: any;
    client?: any;
    onRestart: () => void;
    onRecalculate?: (payload: any) => void;
    onAddGoal?: (goal: any) => void;
    onDeleteGoal?: (goalId: number) => void;
    isCalculating?: boolean;
}

const ResultPage: React.FC<ResultPageProps> = ({ data, client, onRestart, onRecalculate, onAddGoal, onDeleteGoal, isCalculating }) => {
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);

    const resolveClientId = () => {
        return client?.id || (client as any)?.client_id || data?.client_id || data?.client?.id || null;
    };

    const handleSendMessage = async (text: string) => {
        const userMsg: AiMessage = {
            id: Date.now(),
            role: 'user',
            content: text,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Assistant "ai-pfp" (e.g. ID 2)
        const pfpAssistantId = 2; // Hardcoded for demo
        const botMsgId = Date.now() + 1;
        const botMsg: AiMessage = {
            id: botMsgId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMsg]);

        // Create context from data
        // We accept that data is 'any' for now, but in reality we should stringify it carefully
        const contextPayload = JSON.stringify(data).substring(0, 10000); // Limit size just in case

        let accumulatedContent = '';
        await aiService.sendMessageStream(
            {
                assistant_id: pfpAssistantId,
                message: text,
                context: { type: 'financial_plan', payload: contextPayload }
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
        <>
            <ResultPageDesign
                calculationData={data}
                client={client}
                onAddGoal={onAddGoal}
                onDeleteGoal={onDeleteGoal}
                onRestart={onRestart}
                onGoToReport={() => {
                    const clientId = resolveClientId();
                    if (!clientId) {
                        console.error('Report Error: Could not resolve Client ID', { client, data });
                        alert('Ошибка: Не удалось определить ID клиента (ID пуст). Обновите страницу.');
                        return;
                    }
                    setIsReportPreviewOpen(true);
                }}
                onRecalculate={onRecalculate}
                isCalculating={isCalculating}
            />
            <ReportPreviewModal
                isOpen={isReportPreviewOpen}
                clientId={resolveClientId()}
                onClose={() => setIsReportPreviewOpen(false)}
            />
            <ChatWidget
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                title="AI ПФП Помощник"
                isOpen={isChatOpen}
                onToggle={() => setIsChatOpen(!isChatOpen)}
            />
        </>
    );
};

export default ResultPage;
