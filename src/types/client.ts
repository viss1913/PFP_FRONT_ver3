/**
 * Одна строка во всех трёх массивах чатов ЛК: `id`, `stage_key`, `role`, `content`, `created_at`.
 * У chat_AI и B2C site `stage_key` из БД (стадия B2C); у конструктора всегда присутствует и равен `"constructor"`.
 */
export interface ChatAiMessage {
    id: number;
    stage_key: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'civil_union';
export type FamilyEmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'other';
export type FamilyObligation =
    | 'loans'
    | 'mortgage'
    | 'rent'
    | 'alimony'
    | 'education'
    | 'elder_support'
    | 'other';
export type FamilyRealEstateStatus = 'owned' | 'mortgage';
export type RiskProfileAnswers = Partial<Record<'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9' | 'q10', number>>;

export interface FamilyChild {
    first_name: string;
    birth_date: string;
}

export interface FamilyContact {
    name: string;
    relation: string;
    phone?: string;
    email?: string;
}

export interface FamilySpouse {
    employment_status?: FamilyEmploymentStatus;
    monthly_income?: number | null;
}

export interface FamilyRealEstateItem {
    name?: string;
    estimated_value: number;
    status: FamilyRealEstateStatus;
}

export interface FamilyConfidentiality {
    allow_spouse_access: boolean;
    allow_family_contact: boolean;
    notes?: string;
}

export interface FamilyProfile {
    marital_status?: MaritalStatus;
    children?: FamilyChild[];
    contacts?: FamilyContact[];
    spouse?: FamilySpouse;
    family_obligations?: Array<{ type: FamilyObligation; amount_monthly: number }>;
    real_estate?: FamilyRealEstateItem[];
    confidentiality?: FamilyConfidentiality;
}

export interface Client {
    id: number;
    first_name: string;
    last_name: string; // Required in API, but might be empty if we only have FIO string
    middle_name?: string;
    birth_date?: string;
    gender?: 'male' | 'female';
    phone?: string;
    email?: string;
    avg_monthly_income?: number;
    spouse_monthly_income?: number | null;
    employment_type?: string;
    tax_mode?: string;
    external_uuid?: string;
    uuid?: string;

    // CRM
    crm_status?: ClientStatus;

    // New fields for v3
    assets?: Asset[];
    goals?: ClientGoal[];

    // Read-only aggregates
    assets_total?: number;
    liabilities_total?: number;
    net_worth?: number;
    /** ликвидный капитал (для отображения как «Капитал») */
    total_liquid_capital?: number;
    /** пополнение в месяц по всем целям */
    total_monthly_replenishment?: number;
    goals_summary?: any; // Contains the full calculation result
    created_at?: string;
    updated_at?: string;
    /** дата последнего ПФП (расчёта) */
    last_pfp_at?: string;

    /** если в проекте «все агенты видят всех»: "B2C" или email/ФИО агента */
    owner_label?: string;

    /** История chat_AI (`POST .../ai-b2c/chat_AI/stream`); не путать с site-chat и B2C site */
    chat_ai_messages?: ChatAiMessage[];
    /** Обычный B2C site-чат (не chat_AI) */
    b2c_site_chat_messages?: ChatAiMessage[];
    /**
     * Чат с лендинга конструктора (`POST /api/pfp/constructor/site-chat/stream`, `constructor_logs`).
     * Не путать с `ai-b2c/chat/stream`. При первом сообщении бэк может создать CRM-клиента — запись в списке возможна до ПФП.
     */
    constructor_site_chat_messages?: ChatAiMessage[];
    family_profile?: FamilyProfile;
    risk_profile_answers?: RiskProfileAnswers;
}

export type AssetType = 'DEPOSIT' | 'CASH' | 'BROKERAGE' | 'IIS' | 'PDS' | 'NSJ' | 'REAL_ESTATE' | 'CRYPTO' | 'OTHER';

export interface Asset {
    id?: number;
    type: AssetType;
    name: string;
    current_value: number;
    currency?: string; // Default RUB
    yield_percent?: number;
    start_date?: string;
    end_date?: string;
    risk_level?: 'conservative' | 'moderate' | 'aggressive';
}

export interface ClientGoal {
    id?: number;
    goal_type_id: number;
    /** код типа цели с бэка (PENSION, PASSIVE_INCOME, …) для отображения */
    goal_type?: string;
    name: string;
    target_amount?: number; // Desired amount
    desired_monthly_income?: number; // For Passive Income
    term_months?: number;
    risk_profile?: string;
    initial_capital?: number; // Initial capital for the goal
    monthly_replenishment?: number; // Monthly replenishment amount
    inflation_rate?: number;
    // Life Insurance specific
    insurance_limit?: number; // Map to target_amount in UI?
}

export interface ClientFilters {
    search?: string;
    page?: number;
    /** размер страницы; 0 или 'all' = вернуть всех без пагинации */
    limit?: number | 'all';
    sort?: string;
    order?: 'asc' | 'desc';
    /**
     * Историческое имя: включает/выключает загрузку **всех трёх** чатов (`chat_ai_messages`, `b2c_site_chat_messages`,
     * `constructor_site_chat_messages`). `false` — все три `[]` (см. agent_lk.yaml).
     */
    include_chat_ai?: boolean;
    /**
     * Лимит на канал для chat_AI и B2C site (1…500 в списке); конструктор — `ceil(limit/2)` ходов, до `2 * maxTurns` сообщений.
     */
    chat_ai_limit?: number;
}

/** Query для GET /client/:id — те же правила, что у списка клиентов (кроме дефолтов лимита). */
export interface GetClientOptions {
    /** Все три массива чатов разом; см. `ClientFilters.include_chat_ai` */
    include_chat_ai?: boolean;
    /** 1…2000 для карточки; см. `ClientFilters.chat_ai_limit` */
    chat_ai_limit?: number;
}

export type ClientStatus = 'THINKING' | 'BOUGHT' | 'REFUSED' | 'RENEWAL';

export interface ClientCrmUpdatePayload {
    client_id: number;
    crm_status: ClientStatus;
    notes?: string;
}

/** Ответ GET /api/pfp/clients */
export interface ClientListResponse {
    data: Client[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    /** для обратной совместимости, если бэк отдаёт meta */
    meta?: {
        total: number;
        page: number;
        limit: number;
    };
}

export interface CalculationGoal {
    goal_type_id: number;
    name: string;
    target_amount: number;
    term_months: number;
    risk_profile: string;
    initial_capital?: number;
    avg_monthly_income?: number;
    monthly_replenishment?: number;
    // Add other fields from CalculationGoal schema if needed
}

export interface CalculationClientData {
    birth_date?: string;
    gender?: string;
    avg_monthly_income?: number;
    total_liquid_capital?: number;
    project_id?: number;
    family_profile?: FamilyProfile;
    risk_profile_answers?: RiskProfileAnswers;
    // Add other fields from ClientData schema if needed
}

export interface CalculatePayload {
    goals: CalculationGoal[];
    client: CalculationClientData;
}
