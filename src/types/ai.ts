export interface AiAssistant {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
}

export interface AiMessage {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export interface ChatContext {
    type: 'financial_plan' | 'crm_summary';
    payload: string; // JSON string or text summary
}

export interface AiChatRequest {
    assistant_id: number;
    message: string;
    context?: ChatContext;
}
