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
        // Adjust endpoint if needed based on pfp-api.yaml
        // YAML says: /ai/assistants (under paths)
        // Note: The YAML in the previous turn showed paths like /ai/assistants
        // But usually there is a prefix like /api/pfp based on the task description.
        // Task description says: GET /api/pfp/ai/assistants
        const response = await axios.get<AiAssistant[]>(`${API_URL}/pfp/ai/assistants`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // 2. Get Chat History
    getHistory: async (assistantId: number): Promise<AiMessage[]> => {
        const token = getToken();
        // Task description: GET /api/pfp/ai/history/{assistant_id}
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
            const response = await fetch(`${API_URL}/pfp/ai/chat/stream`, {
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                onChunk(chunk);
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
