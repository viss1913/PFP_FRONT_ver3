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
    employment_type?: string;
    tax_mode?: string;
    external_uuid?: string; // from pfp-api.yaml
    uuid?: string; // write-only alias, but good to have in type for sending

    // Read-only aggregates
    assets_total?: number;
    liabilities_total?: number;
    net_worth?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ClientFilters {
    search?: string;
    page?: number;
    limit?: number;
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
