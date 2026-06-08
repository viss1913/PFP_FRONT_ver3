import type { CrmCommissionByProductRow } from './commission';

export interface CrmCapitalByProductRow {
    product_id?: number | null;
    name: string;
    product_type?: string | null;
    amount_rub: number;
}

export interface CrmDashboardClientRow {
    id: number;
    created_at?: string | null;
    last_rebalance_at?: string | null;
    has_plan?: boolean;
    first_name?: string | null;
    last_name?: string | null;
}

export interface CrmAgentDashboardResponse {
    clients_total: number;
    clients_new_this_month: number;
    clients_rebalanced_this_month: number;
    capital_by_product: CrmCapitalByProductRow[];
    insurance_premiums_rub: number;
    commission_year_1_rub: number;
    commission_total_rub: number;
    commission_by_product: CrmCommissionByProductRow[];
    trends_pct?: Record<string, number> | null;
    as_of: string;
    clients?: CrmDashboardClientRow[];
}

export interface CrmBriefingResponse {
    briefing: string;
    clients_attention_count: number;
    critical_events_count: number;
}
