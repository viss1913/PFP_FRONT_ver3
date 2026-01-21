export interface Client {
    id: number;
    first_name: string;
    last_name: string; // Required in API, but might be empty if we only have FIO string
    middle_name?: string;
    birth_date?: string;
    sex?: 'male' | 'female';
    phone?: string;
    email?: string;
    avg_monthly_income?: number;
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
    goals_summary?: any; // Contains the full calculation result
    created_at?: string;
    updated_at?: string;
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
    limit?: number;
}

export type ClientStatus = 'THINKING' | 'BOUGHT' | 'REFUSED' | 'RENEWAL';

export interface ClientCrmUpdatePayload {
    client_id: number;
    crm_status: ClientStatus;
    notes?: string;
}

export interface ClientListResponse {
    data: Client[];
    meta: {
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
    sex?: string;
    avg_monthly_income?: number;
    total_liquid_capital?: number;
    // Add other fields from ClientData schema if needed
}

export interface CalculatePayload {
    goals: CalculationGoal[];
    client: CalculationClientData;
}
