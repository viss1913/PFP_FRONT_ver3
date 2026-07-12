export type B2cPlanFlowKey = 'plan' | 'default' | string;

export interface AiB2cOrchestratorTurn {
    flow_key?: string;
    message?: string;
    event?: string;
    page?: string;
    page_data?: Record<string, unknown>;
    goal_type_id?: number;
    goal_name?: string;
}

export interface AiB2cSseClassifierCommand {
    type: 'classifier_command';
    command?: string | null;
    stage_key?: string | null;
    classifierSkipped: boolean;
}

export interface AiB2cSseText {
    type: 'text';
    text: string;
}

export interface AiB2cSseDone {
    type: 'done';
}

export type AiB2cSseEvent = AiB2cSseClassifierCommand | AiB2cSseText | AiB2cSseDone | Record<string, unknown>;

export interface AiB2cStagePublic {
    id?: number | string;
    stage_key: string;
    title?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
}

export interface AiB2cSettingsPublic {
    display_name?: string;
    avatar_url?: string | null;
    tagline?: string | null;
}

export interface AiB2cHistoryMessage {
    id?: number | string;
    stage_key?: string;
    role: 'user' | 'assistant' | string;
    content: string;
    created_at?: string;
}

export interface B2cPlanChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
}

export interface B2cPlanUiEventPayload {
    event: string;
    page: string;
    page_data?: Record<string, unknown>;
    goal_type_id?: number;
    goal_name?: string;
}

export interface B2cPlanOrchestratorStreamHandlers {
    onClassifierCommand?: (event: AiB2cSseClassifierCommand) => void;
    onText?: (chunk: string) => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
}
