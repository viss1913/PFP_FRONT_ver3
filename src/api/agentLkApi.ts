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

async function assertLooksLikeImageBlob(blob: Blob): Promise<void> {
    if (!blob || blob.size === 0) throw new Error('Пустой ответ (0 байт).');
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
    if (head[0] === 0x7b || head[0] === 0x5b) {
        const t = await blob.text();
        throw new Error(t.slice(0, 400) || 'Сервер вернул JSON вместо картинки.');
    }
    if (head[0] === 0x3c) {
        const t = await blob.text();
        throw new Error(t.slice(0, 200).trim() || 'Похоже на HTML, не картинка.');
    }
    const mime = String(blob.type || '');
    if (mime.startsWith('image/')) return;
    const jpeg = head[0] === 0xff && head[1] === 0xd8;
    const png = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    const gif = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
    const webp = head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46;
    if (jpeg || png || gif || webp) return;
    if (blob.size > 512 && !mime.includes('json') && !mime.includes('html') && !mime.includes('text/')) {
        return;
    }
    throw new Error(`Ответ не похож на изображение (Content-Type: ${mime || 'нет'}).`);
}

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

/** Одна картинка карточки цели в PDF (read-only, не PATCH). См. `PDFsettings.yaml`. */
export interface PdfGoalCardAssetItem {
    goal_type: string;
    filename: string;
    r2_object_key: string;
    repo_relative_path: string;
    /** null — CDN не настроен / seed не залит. */
    public_url?: string | null;
}

/** Манифест иллюстраций целей для превью ЛК; не редактируется агентом. */
export interface PdfGoalCardAssetsManifest {
    version: number;
    editable: false;
    r2_key_prefix: string;
    directory_repo_relative: string;
    hint?: string;
    cards: PdfGoalCardAssetItem[];
}

/** Настройки первой страницы PDF-отчёта (обложка агента). */
export interface PdfCoverSettings {
    cover_background_url?: string | null;
    cover_title?: string | null;
    title_band_color?: string | null;
    /** Только превью для ЛК; на PDF дата ставится на бэке. */
    date_preview?: string | null;
    /**
     * Спека макета Figma/PDF для превью: канвас, градиенты, плашка (350×150 и позиция), типографика, content.
     * read-only с бэка; см. `normalizePdfCoverLayout` на фронте.
     */
    cover_layout?: Record<string, unknown> | null;
    /** Страница «Сводная информация» (брендинг). */
    summary_background_url?: string | null;
    summary_logo_url?: string | null;
    summary_chart_color?: string | null;
    summary_layout?: Record<string, unknown> | null;
    /** Иллюстрации по goal_type — только отображение в ЛК. */
    goal_card_assets?: PdfGoalCardAssetsManifest | null;
}

export type PdfCoverFieldType = 'image' | 'text' | 'color' | 'readonly';

export interface PdfEditorImageUploadSpec {
    method?: string;
    path?: string;
    form_field?: string;
    max_size_mb?: number;
    accept_mime?: string[];
}

export interface PdfEditorReadUrlSpec {
    method?: string;
    path?: string;
}

export interface PdfEditorFieldResetSpec {
    patch_key?: string;
}

export interface PdfCoverEditorField {
    /** Ключ для PATCH / состояния (с бэка: patch_key или id). */
    key: string;
    type: PdfCoverFieldType;
    label?: string;
    hint?: string;
    /** Для readonly: поле в ответе settings (например date_preview). */
    value_key?: string;
    upload?: PdfEditorImageUploadSpec;
    read_url?: PdfEditorReadUrlSpec;
    reset?: PdfEditorFieldResetSpec;
}

export interface PdfCoverEditorSchema {
    template?: string;
    fields?: PdfCoverEditorField[];
    /** Дефолты полей PATCH (подмешивать, если в корне ответа null/пусто). */
    defaults?: Record<string, string | number | boolean | null>;
    [key: string]: unknown;
}

export interface PdfCoverSettingsResponse extends PdfCoverSettings {
    editor_schema: PdfCoverEditorSchema;
}

export interface PdfCoverSettingsPatch {
    cover_title?: string | null;
    title_band_color?: string | null;
    cover_background_url?: string | null;
    summary_background_url?: string | null;
    summary_logo_url?: string | null;
    summary_chart_color?: string | null;
}

export interface PdfCoverBackgroundUploadResponse extends PdfCoverSettingsResponse {
    url: string;
    storage?: 'r2' | 'local_disk' | string;
}

/** Ответ GET *-image для превью в ЛК (direct / signed R2). */
export interface PdfSettingsImageReadMeta {
    url: string;
    access: 'direct' | 'signed' | string;
    expires_in?: number | null;
    expires_at?: string | null;
}

/** Собрать абсолютный URL эндпоинта из `path` в editor_schema (upload / read_url). */
export function resolveAgentPdfApiUrl(path: string): string {
    const p = path.trim();
    if (!p) return `${API_BASE}/pdf-settings`;
    if (/^https?:\/\//i.test(p)) return p;
    if (p.startsWith('/api/pfp/')) return `${API_BASE_URL}${p}`;
    const noLead = p.replace(/^\//, '');
    if (noLead.startsWith('api/pfp/')) return `${API_BASE_URL}/${noLead}`;
    if (noLead.startsWith('pdf-settings/')) return `${API_BASE}/${noLead}`;
    return `${API_BASE}/pdf-settings/${noLead.replace(/^pdf-settings\//, '')}`;
}

// --- Стратегии Comon (автоследование, ЛК агента) ---

export type ComonRiskProfile = 'conservative' | 'balanced' | 'aggressive';

export interface ComonPortfolioItemPayload {
    instrument: string;
    share_percent: number;
}

export interface AgentComonStrategyCard {
    id: number | string;
    agent_id?: number;
    comon_strategy_id?: string;
    comon_url?: string | null;
    comon_profit_api_url?: string | null;
    name?: string;
    min_contribution?: number | null;
    risk_profile?: string;
    description?: string | null;
    portfolio?: ComonPortfolioItemPayload[];
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
}

export interface AgentComonStrategyCreatePayload {
    comon_url: string;
    name: string;
    risk_profile: ComonRiskProfile;
    min_contribution?: number | null;
    description?: string | null;
    portfolio: [ComonPortfolioItemPayload, ComonPortfolioItemPayload];
}

export type AgentComonStrategyPatchPayload = Partial<
    Omit<AgentComonStrategyCreatePayload, 'portfolio'>
> & {
    portfolio?: [ComonPortfolioItemPayload, ComonPortfolioItemPayload];
};

export interface ComonApiTrace {
    method: string;
    url: string;
    requestBody?: unknown;
    status?: number;
    responseBody?: unknown;
    failed?: boolean;
}

const DEFAULT_COMON_RISK_PROFILES: ComonRiskProfile[] = ['conservative', 'balanced', 'aggressive'];

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

    // --- Обложка PDF-отчёта ---
    getPdfCoverSettings: async (): Promise<PdfCoverSettingsResponse> => {
        const response = await axios.get<PdfCoverSettingsResponse>(`${API_BASE}/pdf-settings`, {
            headers: getHeaders(),
        });
        return response.data;
    },

    patchPdfCoverSettings: async (payload: PdfCoverSettingsPatch): Promise<PdfCoverSettingsResponse> => {
        const response = await axios.patch<PdfCoverSettingsResponse>(`${API_BASE}/pdf-settings`, payload, {
            headers: getHeaders(),
        });
        return response.data;
    },

    /** multipart, поле `image` — jpeg/png/webp, до 8 МБ; URL сразу в профиле агента. */
    uploadPdfCoverBackground: async (file: File): Promise<PdfCoverBackgroundUploadResponse> => {
        const formData = new FormData();
        formData.append('image', file);
        const token = localStorage.getItem('token');
        const response = await axios.post<PdfCoverBackgroundUploadResponse>(
            `${API_BASE}/pdf-settings/cover-background`,
            formData,
            {
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'X-Project-Key': PROJECT_KEY,
                },
            }
        );
        return response.data;
    },

    /**
     * Загрузка картинки по пути из editor_schema (upload.path), поле формы из upload.form_field или `image`.
     */
    uploadPdfSettingsImage: async (
        uploadPath: string,
        file: File,
        formField = 'image'
    ): Promise<PdfCoverBackgroundUploadResponse> => {
        const formData = new FormData();
        formData.append(formField, file);
        const token = localStorage.getItem('token');
        const url = resolveAgentPdfApiUrl(uploadPath);
        const response = await axios.post<PdfCoverBackgroundUploadResponse>(url, formData, {
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
            },
        });
        return response.data;
    },

    /**
     * GET read_url из схемы — JSON { url, access, expires_at } для <img> (не сырой R2 URL из настроек).
     * 404 → null (файл ещё не грузили).
     */
    getPdfSettingsImageReadMeta: async (readPath: string): Promise<PdfSettingsImageReadMeta | null> => {
        const token = localStorage.getItem('token');
        const base = resolveAgentPdfApiUrl(readPath);
        const join = base.includes('?') ? '&' : '?';
        const url = `${base}${join}_cb=${Date.now()}`;
        const r = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
            },
        });
        if (r.status === 404) return null;
        if (!r.ok) {
            let msg = r.statusText;
            try {
                msg = (await r.text()).slice(0, 400);
            } catch {
                /* ignore */
            }
            throw new Error(`pdf-settings read_url ${r.status}: ${msg}`);
        }
        const j = (await r.json()) as PdfSettingsImageReadMeta;
        if (typeof j?.url !== 'string' || !j.url) {
            throw new Error('read_url: в JSON нет поля url');
        }
        return j;
    },

    /** HTML-превью страницы «Сводная информация» (Bearer + x-project-key; для iframe — fetch + srcdoc). */
    getPdfSummaryPreviewHtml: async (): Promise<string> => {
        const token = localStorage.getItem('token');
        const url = `${API_BASE}/pdf-settings/summary-preview-html?_cb=${Date.now()}`;
        const r = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
                Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
            },
        });
        if (!r.ok) {
            let msg = r.statusText;
            try {
                msg = (await r.text()).slice(0, 400);
            } catch {
                /* ignore */
            }
            throw new Error(`summary-preview-html ${r.status}: ${msg}`);
        }
        return r.text();
    },

    /**
     * Один запрос к cover-image: либо JSON `{ url }` (signed/direct), либо тело картинки → data URL.
     * Удобно для превью в ЛК.
     */
    getPdfCoverImageForPreview: async (): Promise<string> => {
        const token = localStorage.getItem('token');
        const r = await fetch(`${API_BASE}/pdf-settings/cover-image?_cb=${Date.now()}`, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
            },
        });
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!r.ok) {
            let msg = '';
            try {
                if (ct.includes('json')) msg = JSON.stringify(await r.json());
                else msg = (await r.text()).slice(0, 400);
            } catch {
                msg = r.statusText;
            }
            throw new Error(`cover-image ${r.status}: ${msg}`);
        }
        if (ct.includes('application/json')) {
            const j = (await r.json()) as { url?: string };
            if (typeof j?.url !== 'string' || !j.url) {
                throw new Error('cover-image JSON без поля url');
            }
            return j.url;
        }
        const blob = await r.blob();
        await assertLooksLikeImageBlob(blob);
        return await new Promise<string>((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.onerror = () => reject(fr.error ?? new Error('FileReader'));
            fr.readAsDataURL(blob);
        });
    },

    /**
     * Картинка фона для превью в ЛК (Bearer + x-project-key).
     * Прямой URL из R2 в CSS часто не грузится (403 / политика бакета); бэк отдаёт файл/редирект сюда.
     */
    /** Нативный fetch — иногда стабильнее axios+blob на редиректах. */
    getPdfCoverImageBlobViaFetch: async (): Promise<Blob> => {
        const token = localStorage.getItem('token');
        const bust = `_cb=${Date.now()}`;
        const url = `${API_BASE}/pdf-settings/cover-image?${bust}`;
        const r = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
            },
        });
        const blob = await r.blob();
        if (!r.ok) {
            const t = blob.size < 4096 ? await blob.text() : '';
            throw new Error(`cover-image HTTP ${r.status}: ${t.slice(0, 300)}`);
        }
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('application/json') && blob.size < 8192) {
            const text = await blob.text();
            throw new Error(text || 'cover-image: JSON вместо файла');
        }
        await assertLooksLikeImageBlob(blob);
        return blob;
    },

    getPdfCoverImageBlob: async (): Promise<Blob> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/pdf-settings/cover-image`, {
            params: { _cb: Date.now() },
            responseType: 'blob',
            maxRedirects: 10,
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                'X-Project-Key': PROJECT_KEY,
            },
        });
        const blob: Blob = response.data;
        const ct = String(response.headers['content-type'] || '');
        if (ct.includes('application/json') && blob.size < 8192) {
            const text = await blob.text();
            throw new Error(text || 'cover-image: JSON вместо файла');
        }
        await assertLooksLikeImageBlob(blob);
        return blob;
    },

    /**
     * Скачать картинку по абсолютному URL (например публичный R2) — запасной путь для превью в ЛК.
     */
    fetchImageBlobFromPublicUrl: async (absoluteUrl: string): Promise<Blob> => {
        if (!/^https?:\/\//i.test(absoluteUrl)) {
            throw new Error('Нужен абсолютный http(s) URL');
        }
        const response = await axios.get(absoluteUrl, {
            responseType: 'blob',
            timeout: 30000,
            maxRedirects: 10,
            headers: { Accept: 'image/*,*/*' },
        });
        const blob: Blob = response.data;
        await assertLooksLikeImageBlob(blob);
        return blob;
    },

    /** GET /agent/comon-strategies — список + risk_profiles; trace для отладки UI */
    listComonStrategies: async (): Promise<{
        ok: boolean;
        strategies: AgentComonStrategyCard[];
        riskProfiles: string[];
        trace: ComonApiTrace;
    }> => {
        const url = `${API_BASE}/agent/comon-strategies`;
        const trace: ComonApiTrace = { method: 'GET', url };
        try {
            const res = await axios.get(url, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            const body = res.data as {
                data?: AgentComonStrategyCard[];
                risk_profiles?: string[];
            };
            const strategies = Array.isArray(body.data) ? body.data : [];
            const riskProfiles =
                Array.isArray(body.risk_profiles) && body.risk_profiles.length > 0
                    ? body.risk_profiles
                    : DEFAULT_COMON_RISK_PROFILES;
            return { ok: true, strategies, riskProfiles, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return {
                ok: false,
                strategies: [],
                riskProfiles: DEFAULT_COMON_RISK_PROFILES,
                trace,
            };
        }
    },

    createComonStrategy: async (
        payload: AgentComonStrategyCreatePayload,
    ): Promise<{ ok: true; card: AgentComonStrategyCard; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/agent/comon-strategies`;
        const trace: ComonApiTrace = { method: 'POST', url, requestBody: payload };
        try {
            const res = await axios.post(url, payload, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            const body = res.data as { data?: AgentComonStrategyCard };
            const card = body?.data;
            if (!card) {
                trace.failed = true;
                trace.responseBody = { ...((trace.responseBody as object) || {}), _clientNote: 'нет поля data в ответе' };
                return { ok: false, trace };
            }
            return { ok: true, card, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },

    updateComonStrategy: async (
        id: number | string,
        payload: AgentComonStrategyPatchPayload,
    ): Promise<{ ok: true; card: AgentComonStrategyCard; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/agent/comon-strategies/${encodeURIComponent(String(id))}`;
        const trace: ComonApiTrace = { method: 'PATCH', url, requestBody: payload };
        try {
            const res = await axios.patch(url, payload, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            const body = res.data as { data?: AgentComonStrategyCard };
            const card = body?.data;
            if (!card) {
                trace.failed = true;
                return { ok: false, trace };
            }
            return { ok: true, card, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },

    deleteComonStrategy: async (
        id: number | string,
    ): Promise<{ ok: true; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/agent/comon-strategies/${encodeURIComponent(String(id))}`;
        const trace: ComonApiTrace = { method: 'DELETE', url };
        try {
            const res = await axios.delete(url, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            return { ok: true, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },

    /** POST /comon/strategies/resolve — разбор ссылки до сохранения */
    resolveComonStrategyUrl: async (
        body: { url?: string; link?: string },
    ): Promise<{ ok: true; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/comon/strategies/resolve`;
        const trace: ComonApiTrace = { method: 'POST', url, requestBody: body };
        try {
            const res = await axios.post(url, body, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            return { ok: true, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },

    /** GET …/:id/profit — сырой ответ (часто обёртка success + data от Comon) */
    getComonStrategyProfit: async (
        id: number | string,
    ): Promise<{ ok: true; payload: unknown; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/agent/comon-strategies/${encodeURIComponent(String(id))}/profit`;
        const trace: ComonApiTrace = { method: 'GET', url };
        try {
            const res = await axios.get(url, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            return { ok: true, payload: res.data, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },

    getComonStrategyProfitMetrics: async (
        id: number | string,
    ): Promise<{ ok: true; payload: unknown; trace: ComonApiTrace } | { ok: false; trace: ComonApiTrace }> => {
        const url = `${API_BASE}/agent/comon-strategies/${encodeURIComponent(String(id))}/profit/metrics`;
        const trace: ComonApiTrace = { method: 'GET', url };
        try {
            const res = await axios.get(url, { headers: getHeaders() });
            trace.status = res.status;
            trace.responseBody = res.data;
            return { ok: true, payload: res.data, trace };
        } catch (e: any) {
            trace.failed = true;
            trace.status = e?.response?.status;
            trace.responseBody = e?.response?.data ?? { message: String(e?.message ?? e) };
            return { ok: false, trace };
        }
    },
};

