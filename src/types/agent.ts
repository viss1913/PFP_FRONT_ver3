export interface AgentBotConfig {
    id?: number;
    name: string;
    link: string;
    token: string;
    bot_type: 'telegram' | 'max';
    webhook_secret?: string;
    communication_style: string;
    base_brain_context: string;
}

export interface AgentClient {
    id: number;
    nickname: string;
    user_id: string;
    last_message_at: string;
    last_message?: string;
    bot_id?: number;
    bot_type?: 'telegram' | 'max';
    bot_name?: string;
    current_stage?: string;
}

export interface AgentMessage {
    id: number;
    user_message: string;
    assistant_message?: string;
    created_at: string;
    photo?: string;
    video?: string;
    voice?: string;
    audio?: string;
    document?: string;
}
