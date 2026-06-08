export interface CrmCommissionByProductRow {
    product_id?: number | null;
    name: string;
    product_type?: string | null;
    commission_year_1_rub: number;
    commission_total_rub: number;
}

export interface CrmCommissionYearSeriesRow {
    year: number;
    commission_rub: number;
}

export interface CrmCommissionForecastResponse {
    commission_year_1_rub: number;
    commission_total_rub: number;
    commission_by_product: CrmCommissionByProductRow[];
    series: CrmCommissionYearSeriesRow[];
    as_of: string;
}

