import axios from 'axios';
import { API_BASE_URL } from './config';

const API_BASE = `${API_BASE_URL}/api/pfp`;

/** Ключ проекта для мультитенантности (настройки, продукты, портфели — привязаны к проекту). */
const PROJECT_KEY = 'pk_proj_0e9fdde1e8cd961121906f04507af06e4afec281a58012c4';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'X-Project-Key': PROJECT_KEY,
    };
};

export interface AgentProduct {
    id: number | string;
    name?: string;
    project_id?: number | null;
    type?: string;
    [key: string]: any;
}

export interface PortfolioInstrument {
    id?: number;
    product_id: number;
    bucket_type?: 'INITIAL_CAPITAL' | 'TOP_UP' | null;
    share_percent: number;
    order_index?: number | null;
    portfolio_risk_profile_id?: number;
}

export interface PortfolioRiskProfile {
    id?: number;
    profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
    potential_yield_percent?: number;
    explanation?: string | null;
    instruments: PortfolioInstrument[];
}

export interface AgentPortfolio {
    id: number | string;
    name?: string;
    project_id?: number | null;
    classes?: string[] | number[];
    risk_profiles?: PortfolioRiskProfile[];
    riskProfiles?: PortfolioRiskProfile[];
    currency?: string;
    term_from_months?: number;
    term_to_months?: number;
    amount_from?: number;
    amount_to?: number;
    [key: string]: any;
}

export interface PortfolioCreateUpdatePayload {
    name: string;
    currency?: string;
    term_from_months?: number;
    term_to_months?: number;
    amount_from?: number;
    amount_to?: number;
    classes?: number[];
    risk_profiles?: PortfolioRiskProfile[];
}

export interface PortfolioClass {
    id: number;
    code: string;
    name: string;
    project_id?: number | null;
}

export interface ProductType {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_active?: boolean;
    order_index?: number;
}

export interface ProductLineCreate {
    min_term_months: number;
    max_term_months: number;
    min_amount: number;
    max_amount: number;
    yield_percent: number;
}

export interface ProductCreatePayload {
    name: string;
    product_type: string;
    currency: string;
    lines: ProductLineCreate[];
}

// --- Настройки планов (инфляция, рост расходов, доходность) ---

export interface SystemSetting {
    key: string;
    value?: string | number | object;
    description?: string;
    category?: string;
    updated_at?: string;
}

/** Один диапазон месяцев с годовой ставкой инфляции (%) */
export interface InflationRateRange {
    fromMonth: number;
    toMonthExcl: number;
    rateAnnual: number;
}

export interface InflationRateMatrix {
    ranges: InflationRateRange[];
}

/** Линия доходности для пассивного дохода (срок, сумма, % годовых) */
export interface PassiveIncomeYieldLine {
    min_term_months: number;
    max_term_months: number;
    min_amount: number;
    max_amount: number;
    yield_percent: number;
}

export interface PassiveIncomeYieldSettings {
    lines: PassiveIncomeYieldLine[];
    updated_at?: string;
}

// --- AI B2C (настройки ИИ для B2C) ---

export interface AiB2cSettings {
    id?: number;
    project_id?: number | null;
    display_name: string;
    avatar_url?: string | null;
    tagline?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface AiB2cSettingsPayload {
    display_name: string;
    avatar_url?: string | null;
    tagline?: string | null;
}

export interface AiB2cUploadImageResponse {
    success?: boolean;
    url: string;
}

export interface AiB2cBrainContext {
    id: number | string;
    title?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
    project_id?: number | null;
    [key: string]: unknown;
}

export interface AiB2cBrainContextCreate {
    title: string;
    content: string;
    is_active?: boolean;
    priority?: number;
}

export interface AiB2cBrainContextUpdate {
    title?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
}

export interface AiB2cStage {
    id: number | string;
    stage_key?: string;
    title?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
    project_id?: number | null;
    [key: string]: unknown;
}

export interface AiB2cStageCreate {
    stage_key: string;
    title: string;
    content: string;
    is_active?: boolean;
    priority?: number;
}

export interface AiB2cStageUpdate {
    stage_key?: string;
    title?: string;
    content?: string;
    is_active?: boolean;
    priority?: number;
}

export const agentLkApi = {
    getProducts: async (includeDefaults = true): Promise<AgentProduct[]> => {
        const response = await axios.get(`${API_BASE}/products`, {
            params: { includeDefaults },
            headers: getHeaders(),
        });
        return response.data;
    },

    getProduct: async (id: number | string): Promise<AgentProduct> => {
        const response = await axios.get(`${API_BASE}/products/${id}`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    updateProduct: async (id: number | string, payload: ProductCreatePayload): Promise<AgentProduct> => {
        const response = await axios.put(`${API_BASE}/products/${id}`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    getPortfolios: async (includeDefaults = true): Promise<AgentPortfolio[]> => {
        const response = await axios.get(`${API_BASE}/portfolios`, {
            params: { includeDefaults },
            headers: getHeaders(),
        });
        return response.data;
    },

    getPortfolio: async (id: number | string): Promise<AgentPortfolio> => {
        const response = await axios.get(`${API_BASE}/portfolios/${id}`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    createPortfolio: async (payload: PortfolioCreateUpdatePayload): Promise<AgentPortfolio> => {
        const response = await axios.post(`${API_BASE}/portfolios`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    updatePortfolio: async (id: number | string, payload: PortfolioCreateUpdatePayload): Promise<AgentPortfolio> => {
        const response = await axios.put(`${API_BASE}/portfolios/${id}`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    deletePortfolio: async (id: number | string): Promise<void> => {
        await axios.delete(`${API_BASE}/portfolios/${id}`, {
            headers: getHeaders(),
        });
    },

    clonePortfolio: async (id: number | string): Promise<AgentPortfolio> => {
        const response = await axios.post(`${API_BASE}/portfolios/${id}/clone`, {}, {
            headers: getHeaders(),
        });
        return response.data;
    },

    getPortfolioClasses: async (): Promise<PortfolioClass[]> => {
        const response = await axios.get(`${API_BASE}/portfolios/classes`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    getProductTypes: async (): Promise<ProductType[]> => {
        const response = await axios.get(`${API_BASE}/product-types`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    createProduct: async (payload: ProductCreatePayload): Promise<AgentProduct> => {
        const response = await axios.post(`${API_BASE}/products`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    cloneProduct: async (id: number | string): Promise<AgentProduct> => {
        const response = await axios.post(
            `${API_BASE}/products/${id}/clone`,
            {},
            {
                headers: getHeaders(),
            },
        );
        return response.data;
    },

    // --- AI B2C: настройки ассистента ---
    getAiB2cSettings: async (): Promise<AiB2cSettings | null> => {
        try {
            const response = await axios.get<AiB2cSettings | null>(`${API_BASE}/ai-b2c/settings`, {
                headers: getHeaders(),
            });
            return response.data;
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    },

    putAiB2cSettings: async (payload: AiB2cSettingsPayload): Promise<AiB2cSettings> => {
        const response = await axios.put<AiB2cSettings>(`${API_BASE}/ai-b2c/settings`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    uploadAiB2cAvatar: async (file: File): Promise<AiB2cUploadImageResponse> => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post<AiB2cUploadImageResponse>(`${API_BASE}/ai-b2c/avatar-upload`, formData, {
            headers: {
                ...getHeaders(),
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // --- AI B2C: brain-contexts ---

    getBrainContexts: async (): Promise<AiB2cBrainContext[]> => {
        const response = await axios.get(`${API_BASE}/ai-b2c/brain-contexts`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    createBrainContext: async (payload: AiB2cBrainContextCreate): Promise<AiB2cBrainContext> => {
        const response = await axios.post(`${API_BASE}/ai-b2c/brain-contexts`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    updateBrainContext: async (
        id: number | string,
        payload: AiB2cBrainContextUpdate,
    ): Promise<AiB2cBrainContext> => {
        const response = await axios.put(`${API_BASE}/ai-b2c/brain-contexts/${id}`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    deleteBrainContext: async (id: number | string): Promise<void> => {
        await axios.delete(`${API_BASE}/ai-b2c/brain-contexts/${id}`, {
            headers: getHeaders(),
        });
    },

    // --- AI B2C: stages ---
    getStages: async (): Promise<AiB2cStage[]> => {
        const response = await axios.get(`${API_BASE}/ai-b2c/stages`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    createStage: async (payload: AiB2cStageCreate): Promise<AiB2cStage> => {
        const response = await axios.post(`${API_BASE}/ai-b2c/stages`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    updateStage: async (id: number | string, payload: AiB2cStageUpdate): Promise<AiB2cStage> => {
        const response = await axios.put(`${API_BASE}/ai-b2c/stages/${id}`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    deleteStage: async (id: number | string): Promise<void> => {
        await axios.delete(`${API_BASE}/ai-b2c/stages/${id}`, {
            headers: getHeaders(),
        });
    },

    // --- Настройки планов (инфляция, рост расходов, доходность пассивного дохода) ---

    /** Список настроек по категории (calculation, pension и т.д.) */
    getSettings: async (category?: string): Promise<SystemSetting[]> => {
        const params = category ? { category } : {};
        const response = await axios.get<SystemSetting[]>(`${API_BASE}/settings`, {
            params,
            headers: getHeaders(),
        });
        return response.data;
    },

    /** Одна настройка по ключу (inflation_rate_matrix, inflation_rate_year, investment_expense_growth_annual и т.д.) */
    getSetting: async (key: string): Promise<SystemSetting | null> => {
        try {
            const response = await axios.get<SystemSetting>(`${API_BASE}/settings/${encodeURIComponent(key)}`, {
                headers: getHeaders(),
            });
            return response.data;
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    },

    /** Обновить настройку по ключу. value — число, строка или объект (для inflation_rate_matrix — { ranges: [...] }) */
    putSetting: async (key: string, value: number | string | object): Promise<SystemSetting> => {
        const response = await axios.put<SystemSetting>(
            `${API_BASE}/settings/${encodeURIComponent(key)}`,
            { value },
            { headers: getHeaders() }
        );
        return response.data;
    },

    /** Матрица инфляции (линии по срокам). GET возвращает { ranges } или null */
    getInflationMatrix: async (): Promise<InflationRateMatrix | null> => {
        try {
            const res = await axios.get<SystemSetting>(`${API_BASE}/settings/inflation_rate_matrix`, {
                headers: getHeaders(),
            });
            const raw = res.data?.value;
            if (raw == null) return null;
            const value = typeof raw === 'object' && raw !== null && 'ranges' in (raw as object)
                ? (raw as { ranges: InflationRateRange[] })
                : { ranges: [] };
            return { ranges: (value.ranges || []).slice() };
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    },

    putInflationMatrix: async (matrix: InflationRateMatrix): Promise<void> => {
        await axios.put(
            `${API_BASE}/settings/inflation_rate_matrix`,
            { value: matrix },
            { headers: getHeaders() }
        );
    },

    /** Одна годовая инфляция % (fallback, если матрица не задана) */
    getInflationYear: async (): Promise<number | null> => {
        try {
            const res = await axios.get<SystemSetting>(`${API_BASE}/settings/inflation_rate_year`, {
                headers: getHeaders(),
            });
            const v = res.data?.value;
            if (v == null) return null;
            return typeof v === 'number' ? v : Number(v);
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    },

    putInflationYear: async (value: number): Promise<void> => {
        await axios.put(`${API_BASE}/settings/inflation_rate_year`, { value }, { headers: getHeaders() });
    },

    /** Рост расходов на инвестиции: годовая % и месячная % (fallback) */
    getInvestmentExpenseGrowth: async (): Promise<{ annual: number | null; monthly: number | null }> => {
        const [annualRes, monthlyRes] = await Promise.all([
            axios.get<SystemSetting>(`${API_BASE}/settings/investment_expense_growth_annual`, { headers: getHeaders() }).catch(() => ({ data: null })),
            axios.get<SystemSetting>(`${API_BASE}/settings/investment_expense_growth_monthly`, { headers: getHeaders() }).catch(() => ({ data: null })),
        ]);
        return {
            annual: annualRes.data?.value != null ? Number(annualRes.data.value) : null,
            monthly: monthlyRes.data?.value != null ? Number(monthlyRes.data.value) : null,
        };
    },

    putInvestmentExpenseGrowthAnnual: async (value: number): Promise<void> => {
        await axios.put(`${API_BASE}/settings/investment_expense_growth_annual`, { value }, { headers: getHeaders() });
    },

    putInvestmentExpenseGrowthMonthly: async (value: number): Promise<void> => {
        await axios.put(`${API_BASE}/settings/investment_expense_growth_monthly`, { value }, { headers: getHeaders() });
    },

    /** Доходность для пассивного дохода — линии (срок, сумма, %). */
    getPassiveIncomeYield: async (): Promise<PassiveIncomeYieldSettings | null> => {
        try {
            const response = await axios.get<PassiveIncomeYieldSettings>(`${API_BASE}/settings/passive-income/yield`, {
                headers: getHeaders(),
            });
            return response.data;
        } catch (e: any) {
            if (e?.response?.status === 404) return null;
            throw e;
        }
    },

    putPassiveIncomeYield: async (lines: PassiveIncomeYieldLine[]): Promise<void> => {
        await axios.put(
            `${API_BASE}/settings/passive-income/yield`,
            { lines },
            { headers: getHeaders() }
        );
    },
};

