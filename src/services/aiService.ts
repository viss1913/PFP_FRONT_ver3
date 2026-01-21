import axios from 'axios';
import type { AiAssistant, AiMessage, AiChatRequest } from '../types/ai';

// Base URL for API
const API_URL = '/api';

// Helper to get token (assuming it's stored in localStorage like in most apps, 
// or you might use a context. For a simple service file, we'll try to get it directly)
const getToken = () => localStorage.getItem('token');

export const aiService = {
    // 1. Get List of Assistants
    getAssistants: async (): Promise<AiAssistant[]> => {
        const token = getToken();
        // Correct endpoint per pfp-api-v1.2.yaml: /pfp/ai/assistants
        const response = await axios.get<AiAssistant[]>(`${API_URL}/pfp/ai/assistants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // 2. Get Chat History
    getHistory: async (assistantId: number): Promise<AiMessage[]> => {
        const token = getToken();
        // Correct endpoint per pfp-api-v1.2.yaml: /pfp/ai/history/{assistant_id}
        const response = await axios.get<AiMessage[]>(`${API_URL}/pfp/ai/history/${assistantId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // 3. Send Message (Streaming)
    // We use fetch here because axios doesn't support streaming response body easily in browser
    sendMessageStream: async (
        request: AiChatRequest,
        onChunk: (chunk: string) => void,
        onError?: (err: any) => void,
        onComplete?: () => void
    ) => {
        const token = getToken();
        try {
            const response = await fetch(`${API_URL}/pfp/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep the incomplete line in buffer

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            const content = data.choices?.[0]?.delta?.content;
                            if (content) {
                                onChunk(content);
                            }
                        } catch (e) {
                            console.warn('Failed to parse SSE line:', line, e);
                        }
                    }
                }
            }

            if (onComplete) {
                onComplete();
            }

        } catch (error) {
            console.error('Streaming error:', error);
            if (onError) onError(error);
        }
    }
};
