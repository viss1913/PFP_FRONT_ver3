export interface AgentBotConfig {
    name: string;
    link: string;
    token: string;
    communication_style: string;
    base_brain_context: string;
}

export interface AgentClient {
    id: number;
    name: string;
    username?: string;
    last_message_at: string;
    last_message_text?: string;
}

export interface AgentMessage {
    id: number;
    sender_type: 'user' | 'bot' | 'agent';
    text: string;
    created_at: string;
    photo?: string;
    video?: string;
    voice?: string;
    audio?: string;
    document?: string;
}
