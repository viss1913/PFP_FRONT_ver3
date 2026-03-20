import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API_BASE_URL } from '../api/config';
import {
    agentLkApi,
    type AgentProduct,
    type AgentPortfolio,
    type PortfolioClass,
    type ProductType,
    type ProductCreatePayload,
    type PortfolioRiskProfile,
    type PortfolioInstrument,
    type PortfolioCreateUpdatePayload,
    type AiB2cBrainContext,
    type AiB2cBrainContextCreate,
    type AiB2cStage,
    type AiB2cStageCreate,
    type InflationRateRange,
    type PassiveIncomeYieldLine,
    type PdfCoverSettingsResponse,
    type PdfCoverEditorField,
} from '../api/agentLkApi';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface SettingsPageProps {
    onNavigate: (page: NavPage) => void;
}

type SettingsTab = 'products' | 'portfolios' | 'plans' | 'ai-b2c' | 'report' | 'legacy';

/** Подстраницы раздела «Отчёт» — сюда потом добавятся новые пункты. */
const REPORT_SUBPAGE_ITEMS = [{ id: 'cover' as const, label: 'Обложка PDF' }];
type ReportSubPage = (typeof REPORT_SUBPAGE_ITEMS)[number]['id'];

function resolveAgentLkAssetUrl(url: string | null | undefined): string | null {
    if (url == null || String(url).trim() === '') return null;
    const u = String(url).trim();
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `${API_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Байты → data URL для стабильного показа в img (в отличие от background + blob URL). */
function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(fr.error ?? new Error('FileReader'));
        fr.readAsDataURL(blob);
    });
}

const DEFAULT_PDF_FORM_FIELDS: PdfCoverEditorField[] = [
    { key: 'cover_background_url', type: 'image', label: 'Фон обложки' },
    { key: 'cover_title', type: 'text', label: 'Текст плашки' },
    { key: 'title_band_color', type: 'color', label: 'Цвет плашки' },
    { key: 'date_preview', type: 'readonly', label: 'Дата на обложке' },
];

function pdfFormFieldsFromSchema(schema: unknown): PdfCoverEditorField[] {
    if (!schema || typeof schema !== 'object') return DEFAULT_PDF_FORM_FIELDS;
    const s = schema as { fields?: unknown; templates?: unknown };
    let raw: unknown[] | null = null;
    if (Array.isArray(s.templates)) {
        for (const t of s.templates) {
            if (t && typeof t === 'object' && Array.isArray((t as { fields?: unknown }).fields)) {
                raw = (t as { fields: unknown[] }).fields;
                break;
            }
        }
    }
    if (!raw && Array.isArray(s.fields)) raw = s.fields as unknown[];
    if (!raw) return DEFAULT_PDF_FORM_FIELDS;

    const out: PdfCoverEditorField[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const obj = item as Record<string, unknown>;
        const type = obj.type;
        const patchKey = typeof obj.patch_key === 'string' ? obj.patch_key : null;
        const id = typeof obj.id === 'string' ? obj.id : null;
        const legacyKey = typeof obj.key === 'string' ? obj.key : null;
        const key = patchKey || legacyKey || id;
        if (!key || typeof type !== 'string') continue;
        if (!['image', 'text', 'color', 'readonly'].includes(type)) continue;
        const value_key = typeof obj.value_key === 'string' ? obj.value_key : undefined;
        out.push({
            key,
            type: type as PdfCoverEditorField['type'],
            label: typeof obj.label === 'string' ? obj.label : undefined,
            hint: typeof obj.hint === 'string' ? obj.hint : undefined,
            value_key,
        });
    }
    return out.length ? out : DEFAULT_PDF_FORM_FIELDS;
}

const RISK_PROFILE_TYPES: Array<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'> = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
const RISK_PROFILE_LABELS: Record<string, string> = {
    CONSERVATIVE: 'Консервативный',
    BALANCED: 'Сбалансированный',
    AGGRESSIVE: 'Агрессивный',
};

const PORTFOLIO_SHARE_STEP = 5;

/** Доли по бакету, в сумме ровно 100%, кратные step (кроме возможной коррекции на последнем). */
function splitSharesEqually(count: number, step: number): number[] {
    if (count <= 0) return [];
    if (count === 1) return [100];
    const arr: number[] = [];
    let remaining = 100;
    for (let i = 0; i < count - 1; i++) {
        const target = remaining / (count - i);
        const v = Math.max(0, Math.min(100, Math.round(target / step) * step));
        arr.push(v);
        remaining -= v;
    }
    arr.push(Math.max(0, Math.min(100, remaining)));
    const sum = arr.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
        arr[arr.length - 1] += 100 - sum;
    }
    return arr;
}

/** Строка линии доходности в модалке «Новый продукт» (значения в инпутах — строки). */
function getDefaultProductCreateLine(): {
    min_term_months: string;
    max_term_months: string;
    min_amount: string;
    max_amount: string;
    yield_percent: string;
} {
    return {
        min_term_months: '0',
        max_term_months: '0',
        min_amount: '0',
        max_amount: '1000000000000',
        yield_percent: '10',
    };
}

function rebalanceBucketShares(
    instruments: Array<{ product_id: number; bucket_type: 'INITIAL_CAPITAL' | 'TOP_UP'; share_percent: number }>,
    bucket: 'INITIAL_CAPITAL' | 'TOP_UP'
): Array<{ product_id: number; bucket_type: 'INITIAL_CAPITAL' | 'TOP_UP'; share_percent: number }> {
    const idxInBucket: number[] = [];
    instruments.forEach((inv, idx) => {
        if (inv.bucket_type === bucket) idxInBucket.push(idx);
    });
    if (idxInBucket.length === 0) return instruments;
    const splits = splitSharesEqually(idxInBucket.length, PORTFOLIO_SHARE_STEP);
    const next = instruments.map((inv) => ({ ...inv }));
    idxInBucket.forEach((idx, j) => {
        next[idx] = { ...next[idx], share_percent: splits[j] };
    });
    return next;
}

function getEmptyPortfolioForm(): {
    name: string;
    currency: string;
    term_from_months: string;
    term_to_months: string;
    amount_from: string;
    amount_to: string;
    class_ids: number[];
    risk_profiles: Array<{
        profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
        explanation: string;
        potential_yield_percent: string;
        instruments: Array<{ product_id: number; bucket_type: 'INITIAL_CAPITAL' | 'TOP_UP'; share_percent: number }>;
    }>;
} {
    return {
        name: '',
        currency: 'RUB',
        term_from_months: '12',
        term_to_months: '60',
        amount_from: '',
        amount_to: '',
        class_ids: [],
        risk_profiles: RISK_PROFILE_TYPES.map((profile_type) => ({
            profile_type,
            explanation: '',
            potential_yield_percent: '',
            instruments: [],
        })),
    };
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('products');
    const [products, setProducts] = useState<AgentProduct[] | null>(null);
    const [portfolios, setPortfolios] = useState<AgentPortfolio[] | null>(null);
    const [portfolioClasses, setPortfolioClasses] = useState<PortfolioClass[] | null>(null);
    const [productTypes, setProductTypes] = useState<ProductType[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Планы и инфляция: матрица инфляции, рост расходов на инвестиции, доходность пассивного дохода
    const [inflationRanges, setInflationRanges] = useState<InflationRateRange[]>([]);
    const [inflationYearFallback, setInflationYearFallback] = useState<string>('');
    const [investmentGrowthAnnual, setInvestmentGrowthAnnual] = useState<string>('');
    const [passiveYieldLines, setPassiveYieldLines] = useState<PassiveIncomeYieldLine[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansSaving, setPlansSaving] = useState<string | null>(null);

    const [reportSubPage, setReportSubPage] = useState<ReportSubPage>('cover');
    const [pdfSettings, setPdfSettings] = useState<PdfCoverSettingsResponse | null>(null);
    const [pdfDraft, setPdfDraft] = useState({
        cover_title: '',
        title_band_color: '',
        cover_background_url: '',
    });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfSaving, setPdfSaving] = useState(false);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    /** Превью фона: data:… (скачали и встроили) или в конце прямой https для img. */
    const [pdfCoverPreviewUrl, setPdfCoverPreviewUrl] = useState<string | null>(null);

    const renderTabLabel = (tab: SettingsTab) => {
        switch (tab) {
            case 'products':
                return 'Продукты';
            case 'portfolios':
                return 'Портфели';
            case 'plans':
                return 'Планы и инфляция';
            case 'ai-b2c':
                return 'AI B2C';
            case 'report':
                return 'Отчёт';
            case 'legacy':
                return 'Прочие настройки';
            default:
                return tab;
        }
    };

    const tabs: SettingsTab[] = ['products', 'portfolios', 'plans', 'ai-b2c', 'report', 'legacy'];

    useEffect(() => {
        const load = async () => {
            try {
                setError(null);
                setIsLoading(true);
                if (activeTab === 'products') {
                    if (products === null) {
                        const data = await agentLkApi.getProducts(true);
                        setProducts(data);
                    }
                    if (productTypes === null) {
                        const types = await agentLkApi.getProductTypes();
                        setProductTypes(types.filter((t) => t.is_active !== false));
                    }
                } else if (activeTab === 'portfolios') {
                    if (portfolios === null) {
                        const data = await agentLkApi.getPortfolios(true);
                        setPortfolios(data);
                    }
                    if (portfolioClasses === null) {
                        const cls = await agentLkApi.getPortfolioClasses();
                        setPortfolioClasses(cls);
                    }
                    if (products === null) {
                        const prods = await agentLkApi.getProducts(true);
                        setProducts(prods);
                    }
                }
            } catch (e) {
                console.error('Failed to load Agent LK settings:', e);
                setError('Не удалось загрузить данные. Проверьте авторизацию или API.');
            } finally {
                setIsLoading(false);
            }
        };

        if (activeTab === 'products' || activeTab === 'portfolios') {
            void load();
        }
    }, [activeTab, products, portfolios, portfolioClasses, productTypes]);

    useEffect(() => {
        if (activeTab !== 'ai-b2c') return;
        const load = async () => {
            try {
                setAiB2cLoading(true);
                setError(null);
                const [settings, ctx, st] = await Promise.all([
                    agentLkApi.getAiB2cSettings(),
                    agentLkApi.getBrainContexts(),
                    agentLkApi.getStages(),
                ]);
                if (settings) {
                    setAiB2cDisplayName(settings.display_name ?? '');
                    setAiB2cAvatarUrl(settings.avatar_url ?? '');
                    setAiB2cTagline(settings.tagline ?? '');
                } else {
                    setAiB2cDisplayName('AI-ассистент');
                    setAiB2cAvatarUrl('');
                    setAiB2cTagline('');
                }
                setBrainContexts(ctx);
                setStages(st);
            } catch (e) {
                console.error('Failed to load AI B2C:', e);
                setError('Не удалось загрузить настройки ИИ. Проверьте API.');
            } finally {
                setAiB2cLoading(false);
            }
        };
        void load();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'plans') return;
        const load = async () => {
            try {
                setPlansLoading(true);
                setError(null);
                const [matrix, yearVal, growth, passive] = await Promise.all([
                    agentLkApi.getInflationMatrix(),
                    agentLkApi.getInflationYear(),
                    agentLkApi.getInvestmentExpenseGrowth(),
                    agentLkApi.getPassiveIncomeYield(),
                ]);
                setInflationRanges(matrix?.ranges ?? []);
                setInflationYearFallback(yearVal != null ? String(yearVal) : '');
                setInvestmentGrowthAnnual(growth.annual != null ? String(growth.annual) : '');
                setPassiveYieldLines(passive?.lines ?? []);
            } catch (e) {
                console.error('Failed to load plans settings:', e);
                setError('Не удалось загрузить настройки планов. Проверьте API.');
            } finally {
                setPlansLoading(false);
            }
        };
        void load();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'report' || reportSubPage !== 'cover') return;
        const load = async () => {
            try {
                setPdfLoading(true);
                setPdfError(null);
                const res = await agentLkApi.getPdfCoverSettings();
                setPdfSettings(res);
                setPdfDraft({
                    cover_title: res.cover_title ?? '',
                    title_band_color: res.title_band_color ?? '',
                    cover_background_url: res.cover_background_url ?? '',
                });
            } catch (e) {
                console.error('Failed to load PDF cover settings:', e);
                setPdfError('Не удалось загрузить настройки обложки PDF. Нужен JWT с agent_id и доступ к API.');
                setPdfSettings(null);
            } finally {
                setPdfLoading(false);
            }
        };
        void load();
    }, [activeTab, reportSubPage]);

    useEffect(() => {
        if (activeTab !== 'report' || reportSubPage !== 'cover') {
            setPdfCoverPreviewUrl(null);
            return;
        }
        if (!pdfSettings || pdfLoading) {
            return;
        }

        let cancelled = false;
        const direct = resolveAgentLkAssetUrl(pdfSettings.cover_background_url);

        (async () => {
            let dataUrl: string | null = null;
            try {
                const blob = await agentLkApi.getPdfCoverImageBlob();
                if (cancelled) return;
                dataUrl = await blobToDataUrl(blob);
            } catch (e) {
                console.warn('[pdf-cover preview] GET cover-image →', e);
            }
            if (!dataUrl && direct) {
                try {
                    const blob = await agentLkApi.fetchImageBlobFromPublicUrl(direct);
                    if (cancelled) return;
                    dataUrl = await blobToDataUrl(blob);
                } catch (e) {
                    console.warn('[pdf-cover preview] прямой URL →', e);
                }
            }
            if (cancelled) return;
            if (dataUrl) {
                setPdfCoverPreviewUrl(dataUrl);
                return;
            }
            if (direct) {
                setPdfCoverPreviewUrl(direct);
                return;
            }
            setPdfCoverPreviewUrl(null);
        })();

        return () => {
            cancelled = true;
        };
    }, [activeTab, reportSubPage, pdfLoading, pdfSettings?.cover_background_url]);

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productForm, setProductForm] = useState<{
        name: string;
        product_type: string;
        currency: string;
    }>({
        name: '',
        product_type: '',
        currency: 'RUB',
    });
    const [productCreateLines, setProductCreateLines] = useState(() => [getDefaultProductCreateLine()]);
    const [isSavingProduct, setIsSavingProduct] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<AgentProduct | null>(null);
    const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
    const [isLoadingProductDetails, setIsLoadingProductDetails] = useState(false);
    const [isEditingProduct, setIsEditingProduct] = useState(false);
    const [editableLines, setEditableLines] = useState<{
        min_term_months: number | '';
        max_term_months: number | '';
        min_amount: number | '';
        max_amount: number | '';
        yield_percent: number | '';
    }[]>([]);

    // Портфели: модалка создания/редактирования и удаление
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
    const [editingPortfolioId, setEditingPortfolioId] = useState<number | string | null>(null);
    const [portfolioForm, setPortfolioForm] = useState<{
        name: string;
        currency: string;
        term_from_months: string;
        term_to_months: string;
        amount_from: string;
        amount_to: string;
        class_ids: number[];
        risk_profiles: Array<{
            profile_type: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
            explanation: string;
            potential_yield_percent: string;
            instruments: Array<{ product_id: number; bucket_type: 'INITIAL_CAPITAL' | 'TOP_UP'; share_percent: number }>;
        }>;
    }>(getEmptyPortfolioForm());
    const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
    const [portfolioToDelete, setPortfolioToDelete] = useState<AgentPortfolio | null>(null);
    const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);
    /** Для каждого риск-профиля: какой таб активен — Первоначальный капитал или Пополнение */
    const [activeBucketTabByProfile, setActiveBucketTabByProfile] = useState<Array<'INITIAL_CAPITAL' | 'TOP_UP'>>(['INITIAL_CAPITAL', 'INITIAL_CAPITAL', 'INITIAL_CAPITAL']);

    // AI B2C: внешний вид + мозг и сценарии
    const [aiB2cDisplayName, setAiB2cDisplayName] = useState<string>('');
    const [aiB2cAvatarUrl, setAiB2cAvatarUrl] = useState<string>('');
    const [aiB2cTagline, setAiB2cTagline] = useState<string>('');
    const [savingAiB2cSettings, setSavingAiB2cSettings] = useState(false);
    const [uploadingAiB2cAvatar, setUploadingAiB2cAvatar] = useState(false);
    const [brainContexts, setBrainContexts] = useState<AiB2cBrainContext[] | null>(null);
    const [stages, setStages] = useState<AiB2cStage[] | null>(null);
    const [aiB2cLoading, setAiB2cLoading] = useState(false);
    const [brainModalOpen, setBrainModalOpen] = useState(false);
    const [editingBrainId, setEditingBrainId] = useState<number | string | null>(null);
    const [brainForm, setBrainForm] = useState<{ title: string; content: string; is_active: boolean; priority: string }>({
        title: '',
        content: '',
        is_active: true,
        priority: '10',
    });
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [editingStageId, setEditingStageId] = useState<number | string | null>(null);
    const [stageForm, setStageForm] = useState<{
        stage_key: string;
        title: string;
        content: string;
        is_active: boolean;
        priority: string;
    }>({
        stage_key: '',
        title: '',
        content: '',
        is_active: true,
        priority: '100',
    });
    const [savingAiB2c, setSavingAiB2c] = useState(false);
    const [deletingAiB2cId, setDeletingAiB2cId] = useState<string | null>(null);

    const saveAiB2cSettings = async () => {
        if (!aiB2cDisplayName.trim()) {
            setError('Введите имя ассистента для B2C.');
            return;
        }
        try {
            setSavingAiB2cSettings(true);
            setError(null);
            const payload = {
                display_name: aiB2cDisplayName.trim(),
                avatar_url: aiB2cAvatarUrl.trim() || null,
                tagline: aiB2cTagline.trim() || null,
            };
            await agentLkApi.putAiB2cSettings(payload);
        } catch (e) {
            console.error('Failed to save AI B2C settings:', e);
            setError('Не удалось сохранить настройки ассистента B2C.');
        } finally {
            setSavingAiB2cSettings(false);
        }
    };

    const handleAiB2cAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingAiB2cAvatar(true);
            setError(null);
            const result = await agentLkApi.uploadAiB2cAvatar(file);
            const finalUrl = (result as any)?.url ?? (result as any)?.avatar_url ?? '';
            if (!finalUrl) {
                setError('Бэкенд не вернул URL аватара.');
                return;
            }
            setAiB2cAvatarUrl(finalUrl);
        } catch (e) {
            console.error('Failed to upload AI B2C avatar:', e);
            setError('Не удалось загрузить аватар. Проверьте формат файла и попробуйте ещё раз.');
        } finally {
            setUploadingAiB2cAvatar(false);
            // очищаем value, чтобы можно было выбрать тот же файл ещё раз
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            product_type: '',
            currency: 'RUB',
        });
        setProductCreateLines([getDefaultProductCreateLine()]);
    };

    const openCreatePortfolio = () => {
        setEditingPortfolioId(null);
        setPortfolioForm(getEmptyPortfolioForm());
        setActiveBucketTabByProfile(['INITIAL_CAPITAL', 'INITIAL_CAPITAL', 'INITIAL_CAPITAL']);
        setIsPortfolioModalOpen(true);
    };

    const openEditPortfolio = async (p: AgentPortfolio) => {
        try {
            setError(null);
            const full = await agentLkApi.getPortfolio(p.id);
            const riskProfiles = (full.risk_profiles ?? full.riskProfiles ?? []) as PortfolioRiskProfile[];
            const profiles = RISK_PROFILE_TYPES.map((profile_type) => {
                const existing = riskProfiles.find((r: PortfolioRiskProfile) => (r.profile_type || (r as any).profile_type) === profile_type);
                const instruments = (existing?.instruments ?? []).map((inv: PortfolioInstrument) => ({
                    product_id: inv.product_id,
                    bucket_type: (inv.bucket_type as 'INITIAL_CAPITAL' | 'TOP_UP') || 'INITIAL_CAPITAL',
                    share_percent: inv.share_percent ?? 0,
                }));
                return {
                    profile_type,
                    explanation: existing?.explanation ?? '',
                    potential_yield_percent: existing?.potential_yield_percent != null ? String(existing.potential_yield_percent) : '',
                    instruments,
                };
            });
            setPortfolioForm({
                name: (full as any).name ?? (full as any).portfolio_name ?? '',
                currency: (full as any).currency ?? 'RUB',
                term_from_months: (full as any).term_from_months != null ? String((full as any).term_from_months) : '',
                term_to_months: (full as any).term_to_months != null ? String((full as any).term_to_months) : '',
                amount_from: (full as any).amount_from != null ? String((full as any).amount_from) : '',
                amount_to: (full as any).amount_to != null ? String((full as any).amount_to) : '',
                class_ids: Array.isArray((full as any).classes) ? (full as any).classes.map((c: any) => typeof c === 'number' ? c : c?.id).filter((id: unknown) => id != null && !Number.isNaN(Number(id))) : [],
                risk_profiles: profiles,
            });
            setEditingPortfolioId(p.id);
            setActiveBucketTabByProfile(['INITIAL_CAPITAL', 'INITIAL_CAPITAL', 'INITIAL_CAPITAL']);
            setIsPortfolioModalOpen(true);
        } catch (e) {
            console.error('Failed to load portfolio:', e);
            setError('Не удалось загрузить портфель.');
        }
    };

    const setBucketTab = (profileIndex: number, bucket: 'INITIAL_CAPITAL' | 'TOP_UP') => {
        if (bucket === 'TOP_UP') {
            const rp = portfolioForm.risk_profiles[profileIndex];
            const initialInstr = rp.instruments.filter((i) => i.bucket_type === 'INITIAL_CAPITAL');
            const topUpInstr = rp.instruments.filter((i) => i.bucket_type === 'TOP_UP');
            if (topUpInstr.length === 0 && initialInstr.length > 0) {
                setPortfolioForm((prev) => {
                    const next = { ...prev };
                    const prof = { ...next.risk_profiles[profileIndex] };
                    prof.instruments = [
                        ...prof.instruments,
                        ...initialInstr.map((i) => ({
                            product_id: i.product_id,
                            bucket_type: 'TOP_UP' as const,
                            share_percent: i.share_percent,
                        })),
                    ];
                    next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
                    return next;
                });
            }
        }
        setActiveBucketTabByProfile((prev) => prev.map((v, i) => (i === profileIndex ? bucket : v)));
    };

    const buildPortfolioPayload = (): PortfolioCreateUpdatePayload => {
        const classIds = portfolioForm.class_ids;
        const risk_profiles: PortfolioRiskProfile[] = portfolioForm.risk_profiles.map((rp) => {
            let instruments = rp.instruments.map((inv) => ({
                product_id: inv.product_id,
                bucket_type: inv.bucket_type,
                share_percent: inv.share_percent,
            }));
            const initial = instruments.filter((i) => i.bucket_type === 'INITIAL_CAPITAL');
            const topUp = instruments.filter((i) => i.bucket_type === 'TOP_UP');
            if (initial.length > 0 && topUp.length === 0) {
                instruments = [
                    ...instruments,
                    ...initial.map((i) => ({
                        product_id: i.product_id,
                        bucket_type: 'TOP_UP' as const,
                        share_percent: i.share_percent,
                    })),
                ];
            }
            return {
                profile_type: rp.profile_type,
                explanation: rp.explanation.trim() || undefined,
                potential_yield_percent: rp.potential_yield_percent ? Number(rp.potential_yield_percent) : undefined,
                instruments,
            };
        });
        return {
            name: portfolioForm.name.trim(),
            currency: portfolioForm.currency.trim() || 'RUB',
            term_from_months: portfolioForm.term_from_months ? Number(portfolioForm.term_from_months) : undefined,
            term_to_months: portfolioForm.term_to_months ? Number(portfolioForm.term_to_months) : undefined,
            amount_from: portfolioForm.amount_from ? Number(portfolioForm.amount_from) : undefined,
            amount_to: portfolioForm.amount_to ? Number(portfolioForm.amount_to) : undefined,
            classes: classIds.length > 0 ? classIds : undefined,
            risk_profiles,
        };
    };

    const validatePortfolioShares = (): string | null => {
        for (const rp of portfolioForm.risk_profiles) {
            const label = RISK_PROFILE_LABELS[rp.profile_type] ?? rp.profile_type;
            let initial = rp.instruments.filter((i) => i.bucket_type === 'INITIAL_CAPITAL');
            let topUp = rp.instruments.filter((i) => i.bucket_type === 'TOP_UP');
            if (initial.length > 0 && topUp.length === 0) {
                topUp = initial.map((i) => ({ ...i, bucket_type: 'TOP_UP' as const }));
            }
            if (initial.length > 0) {
                const s = initial.reduce((acc, i) => acc + i.share_percent, 0);
                if (Math.abs(s - 100) > 0.5) {
                    return `${label}: сумма долей по первоначальному капиталу = ${s}%, нужно ровно 100%.`;
                }
            }
            if (topUp.length > 0) {
                const s = topUp.reduce((acc, i) => acc + i.share_percent, 0);
                if (Math.abs(s - 100) > 0.5) {
                    return `${label}: сумма долей по пополнению = ${s}%, нужно ровно 100%.`;
                }
            }
        }
        return null;
    };

    const savePortfolio = async () => {
        if (!portfolioForm.name.trim()) {
            setError('Введите название портфеля.');
            return;
        }
        const shareErr = validatePortfolioShares();
        if (shareErr) {
            setError(shareErr);
            return;
        }
        if (!portfolioForm.class_ids || portfolioForm.class_ids.length === 0) {
            setError('Выберите хотя бы один класс портфеля.');
            return;
        }
        const emptyInstrumentsProfiles = portfolioForm.risk_profiles.filter((rp) => !rp.instruments || rp.instruments.length === 0);
        if (emptyInstrumentsProfiles.length > 0) {
            const rp = emptyInstrumentsProfiles[0];
            const label = RISK_PROFILE_LABELS[rp.profile_type] ?? rp.profile_type;
            setError(`Для профиля "${label}" добавьте инструменты (product_id) в риск-профиль.`);
            return;
        }
        try {
            setIsSavingPortfolio(true);
            setError(null);
            const payload = buildPortfolioPayload();
            if (editingPortfolioId != null) {
                const updated = await agentLkApi.updatePortfolio(editingPortfolioId, payload);
                setPortfolios((prev) => (prev ? prev.map((p) => (p.id === editingPortfolioId ? updated : p)) : [updated]));
            } else {
                const created = await agentLkApi.createPortfolio(payload);
                setPortfolios((prev) => (prev ? [created, ...prev] : [created]));
            }
            setIsPortfolioModalOpen(false);
            setEditingPortfolioId(null);
        } catch (e) {
            console.error('Failed to save portfolio:', e);
            setError('Не удалось сохранить портфель. Проверьте данные и права доступа.');
        } finally {
            setIsSavingPortfolio(false);
        }
    };

    const addInstrument = (profileIndex: number, bucketType: 'INITIAL_CAPITAL' | 'TOP_UP') => {
        const firstProductId = products && products[0] ? Number(products[0].id) : 0;
        setPortfolioForm((prev) => {
            const next = { ...prev };
            const prof = { ...next.risk_profiles[profileIndex] };
            const initialList = prof.instruments.filter((i) => i.bucket_type === 'INITIAL_CAPITAL');
            const topUpList = prof.instruments.filter((i) => i.bucket_type === 'TOP_UP');

            if (bucketType === 'TOP_UP' && topUpList.length === 0 && initialList.length > 0) {
                prof.instruments = [
                    ...prof.instruments,
                    ...initialList.map((i) => ({
                        product_id: i.product_id,
                        bucket_type: 'TOP_UP' as const,
                        share_percent: i.share_percent,
                    })),
                ];
                next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
                return next;
            }

            prof.instruments = [
                ...prof.instruments,
                { product_id: firstProductId, bucket_type: bucketType, share_percent: 0 },
            ];
            prof.instruments = rebalanceBucketShares(prof.instruments, bucketType);
            next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
            return next;
        });
    };

    const updateInstrument = (profileIndex: number, instIndex: number, field: 'product_id' | 'bucket_type' | 'share_percent', value: number | string) => {
        setPortfolioForm((prev) => {
            const next = { ...prev };
            const prof = { ...next.risk_profiles[profileIndex] };
            prof.instruments = prof.instruments.map((inv, i) =>
                i === instIndex ? { ...inv, [field]: value } : inv
            );
            next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
            return next;
        });
    };

    /** Меняет долю одного инструмента и распределяет остаток пропорционально между остальными — все ползунки двигаются синхронно, без прыжков. */
    const updateInstrumentShareWithAutoBalance = (profileIndex: number, originalIndex: number, newValRaw: number) => {
        const newVal = Math.max(0, Math.min(100, Math.round(newValRaw / PORTFOLIO_SHARE_STEP) * PORTFOLIO_SHARE_STEP));
        setPortfolioForm((prev) => {
            const next = { ...prev };
            const prof = { ...next.risk_profiles[profileIndex] };
            const bucket = activeBucketTabByProfile[profileIndex] ?? 'INITIAL_CAPITAL';
            const bucketEntries = prof.instruments
                .map((inv, idx) => ({ inv, idx }))
                .filter(({ inv }) => inv.bucket_type === bucket)
                .sort((a, b) => a.idx - b.idx);
            if (bucketEntries.length === 0) return next;
            const firstIdx = bucketEntries[0].idx;
            if (bucketEntries.length === 1) {
                prof.instruments[firstIdx] = { ...prof.instruments[firstIdx], share_percent: newVal };
                next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
                return next;
            }
            // Выставляем изменённый инструмент
            prof.instruments[originalIndex] = { ...prof.instruments[originalIndex], share_percent: newVal };
            const others = bucketEntries.filter((e) => e.idx !== originalIndex);
            const targetForOthers = 100 - newVal;
            const sumOthersOld = others.reduce((s, { inv }) => s + inv.share_percent, 0);
            if (sumOthersOld > 0) {
                // Распределяем targetForOthers пропорционально текущим долям остальных — плавно и синхронно
                others.forEach(({ idx }) => {
                    const oldShare = prof.instruments[idx].share_percent;
                    const proportional = (oldShare / sumOthersOld) * targetForOthers;
                    prof.instruments[idx] = {
                        ...prof.instruments[idx],
                        share_percent: Math.round(proportional / PORTFOLIO_SHARE_STEP) * PORTFOLIO_SHARE_STEP,
                    };
                });
                const actualOthersSum = others.reduce((s, { idx }) => s + prof.instruments[idx].share_percent, 0);
                const diff = targetForOthers - actualOthersSum;
                // Ошибку округления компенсируем на первом в бакете (или на первом среди others)
                const fixIdx = others[0]?.idx ?? firstIdx;
                prof.instruments[fixIdx] = {
                    ...prof.instruments[fixIdx],
                    share_percent: Math.max(0, Math.min(100, prof.instruments[fixIdx].share_percent + diff)),
                };
            } else {
                // Остальные были нули — отдаём всё первому в бакете
                prof.instruments[firstIdx] = { ...prof.instruments[firstIdx], share_percent: Math.max(0, Math.min(100, targetForOthers)) };
            }
            next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
            return next;
        });
    };

    const removeInstrument = (profileIndex: number, instIndex: number) => {
        setPortfolioForm((prev) => {
            const next = { ...prev };
            const prof = { ...next.risk_profiles[profileIndex] };
            const removed = prof.instruments[instIndex];
            if (!removed) return next;
            const bucket = removed.bucket_type;
            prof.instruments = prof.instruments.filter((_, i) => i !== instIndex);
            prof.instruments = rebalanceBucketShares(prof.instruments, bucket);
            next.risk_profiles = next.risk_profiles.map((r, i) => (i === profileIndex ? prof : r));
            return next;
        });
    };

    const confirmDeletePortfolio = (p: AgentPortfolio) => setPortfolioToDelete(p);
    const cancelDeletePortfolio = () => setPortfolioToDelete(null);
    const doDeletePortfolio = async () => {
        if (!portfolioToDelete) return;
        try {
            setIsDeletingPortfolio(true);
            setError(null);
            await agentLkApi.deletePortfolio(portfolioToDelete.id);
            setPortfolios((prev) => (prev ? prev.filter((x) => x.id !== portfolioToDelete.id) : []));
            setPortfolioToDelete(null);
        } catch (e) {
            console.error('Failed to delete portfolio:', e);
            setError('Не удалось удалить портфель. Возможно, это системный портфель.');
        } finally {
            setIsDeletingPortfolio(false);
        }
    };

    const handleClonePortfolio = async (p: AgentPortfolio) => {
        try {
            setError(null);
            const cloned = await agentLkApi.clonePortfolio(p.id);
            setPortfolios((prev) => (prev ? [cloned, ...prev] : [cloned]));
        } catch (e) {
            console.error('Failed to clone portfolio:', e);
            setError('Не удалось клонировать портфель.');
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.name.trim() || !productForm.product_type.trim()) return;

        const payload: ProductCreatePayload = {
            name: productForm.name.trim(),
            product_type: productForm.product_type.trim(),
            currency: productForm.currency.trim() || 'RUB',
            lines: productCreateLines.map((line) => ({
                min_term_months: Number(line.min_term_months) || 0,
                max_term_months: Number(line.max_term_months) || 0,
                min_amount: Number(line.min_amount) || 0,
                max_amount: Number(line.max_amount) || 0,
                yield_percent: Number(line.yield_percent) || 0,
            })),
        };

        try {
            setIsSavingProduct(true);
            const created = await agentLkApi.createProduct(payload);
            setProducts((prev) => (prev ? [created, ...prev] : [created]));
            setIsProductModalOpen(false);
            resetProductForm();
        } catch (e) {
            console.error('Failed to create product:', e);
            setError('Не удалось создать продукт. Проверьте данные и авторизацию.');
        } finally {
            setIsSavingProduct(false);
        }
    };

    const renderProducts = () => {
        if (isLoading && products === null) {
            return <p style={{ color: '#6b7280' }}>Загружаем продукты агента…</p>;
        }
        if (error && products === null) {
            return <p style={{ color: '#b91c1c' }}>{error}</p>;
        }
        if (!products || products.length === 0) {
            return <p style={{ color: '#6b7280' }}>Пока нет ни одного продукта. Создайте первый продукт с помощью кнопки «Новый продукт».</p>;
        }

        const getProductName = (p: AgentProduct): string => {
            const anyP = p as any;
            return (
                (anyP.name as string | undefined) ||
                (anyP.title as string | undefined) ||
                (anyP.product_name as string | undefined) ||
                (anyP.display_name as string | undefined) ||
                `Продукт ${p.id}`
            );
        };

        const getProductType = (p: AgentProduct): string => {
            const anyP = p as any;
            return (
                (anyP.type as string | undefined) ||
                (anyP.product_type as string | undefined) ||
                (anyP.kind as string | undefined) ||
                '—'
            );
        };

        const openDetails = async (p: AgentProduct) => {
            setIsProductDetailsOpen(true);
            setSelectedProduct(p);
            setIsEditingProduct(false);
            try {
                setIsLoadingProductDetails(true);
                const full = await agentLkApi.getProduct(p.id);
                setSelectedProduct(full);
            } catch (e) {
                console.error('Failed to load product details:', e);
            } finally {
                setIsLoadingProductDetails(false);
            }
        };

        return (
            <div style={{ marginTop: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Название</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Тип</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Источник</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => {
                            const isSystem = !p.project_id;
                            return (
                                <tr
                                    key={String(p.id)}
                                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                    onClick={() => openDetails(p)}
                                >
                                    <td style={{ padding: '8px 4px', color: '#111827' }}>
                                        {getProductName(p)}
                                    </td>
                                    <td style={{ padding: '8px 4px', color: '#4b5563' }}>{getProductType(p)}</td>
                                    <td style={{ padding: '8px 4px' }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: isSystem ? '#eff6ff' : '#ecfdf3',
                                                color: isSystem ? '#1d4ed8' : '#166534',
                                            }}
                                        >
                                            {isSystem ? 'Системный' : 'Мой'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Небольшая отладочная вставка: первый продукт целиком (только локально, чтобы понять схему) */}
                <details style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <summary>Показать сырой JSON первого продукта (для отладки схемы)</summary>
                    <pre
                        style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            maxHeight: '260px',
                            overflow: 'auto',
                        }}
                    >
                        {JSON.stringify(products[0], null, 2)}
                    </pre>
                </details>
            </div>
        );
    };

    const renderPortfolios = () => {
        if (isLoading && portfolios === null) {
            return <p style={{ color: '#6b7280' }}>Загружаем портфели агента…</p>;
        }
        if (error && portfolios === null) {
            return <p style={{ color: '#b91c1c' }}>{error}</p>;
        }
        if (!portfolios || portfolios.length === 0) {
            return (
                <div style={{ marginTop: '12px' }}>
                    <p style={{ color: '#6b7280', marginBottom: '12px' }}>Пока нет ни одного портфеля. Создайте первый.</p>
                    <button
                        type="button"
                        onClick={openCreatePortfolio}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Новый портфель
                    </button>
                </div>
            );
        }

        const getClasses = (p: AgentPortfolio): string[] => {
            const anyP = p as any;
            const raw = anyP.classes ?? anyP.portfolio_classes ?? anyP.class_codes ?? [];
            // Если пришёл массив строк-кодов
            if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
                const codes = raw as string[];
                if (!portfolioClasses) return codes;
                return portfolioClasses
                    .filter((c) => codes.includes(c.code))
                    .map((c) => c.name);
            }
            // Если это массив объектов с name
            if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
                return raw.map((c: any) => (c.name as string | undefined) || (c.code as string | undefined) || '').filter(Boolean);
            }
            return [];
        };

        const getPortfolioName = (p: AgentPortfolio): string => {
            const anyP = p as any;
            return (
                (anyP.name as string | undefined) ||
                (anyP.title as string | undefined) ||
                (anyP.portfolio_name as string | undefined) ||
                `Портфель ${p.id}`
            );
        };

        const formatTerm = (value?: number | null): string => {
            if (!value || Number.isNaN(value)) return '—';
            // Если это месяцы, пробуем красиво отобразить в годах
            if (value >= 12 && value % 12 === 0) {
                const years = value / 12;
                return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
            }
            return `${value}`;
        };

        const getTermFrom = (p: AgentPortfolio): string => {
            const anyP = p as any;
            const raw =
                (anyP.min_term_months as number | undefined) ??
                (anyP.term_from_months as number | undefined) ??
                (anyP.term_from as number | undefined);
            return formatTerm(raw);
        };

        const getTermTo = (p: AgentPortfolio): string => {
            const anyP = p as any;
            const raw =
                (anyP.max_term_months as number | undefined) ??
                (anyP.term_to_months as number | undefined) ??
                (anyP.term_to as number | undefined);
            return formatTerm(raw);
        };

        return (
            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button
                        type="button"
                        onClick={openCreatePortfolio}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Новый портфель
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Название</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Классы</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Срок от</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Срок до</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Источник</th>
                            <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolios.map((p) => {
                            const isSystem = !p.project_id;
                            const classes = getClasses(p);
                            return (
                                <tr key={String(p.id)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '8px 4px', color: '#111827' }}>
                                        {getPortfolioName(p)}
                                    </td>
                                    <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                                        {classes.length > 0 ? classes.join(', ') : '—'}
                                    </td>
                                    <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                                        {getTermFrom(p)}
                                    </td>
                                    <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                                        {getTermTo(p)}
                                    </td>
                                    <td style={{ padding: '8px 4px' }}>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: isSystem ? '#eff6ff' : '#ecfdf3',
                                                color: isSystem ? '#1d4ed8' : '#166534',
                                            }}
                                        >
                                            {isSystem ? 'Системный' : 'Мой'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px 4px' }}>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => openEditPortfolio(p)}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e5e7eb',
                                                    background: '#f9fafb',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    color: '#374151',
                                                }}
                                            >
                                                Изменить
                                            </button>
                                            {isSystem ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClonePortfolio(p)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #c4b5fd',
                                                        background: '#f5f3ff',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        color: '#6d28d9',
                                                    }}
                                                >
                                                    Клонировать
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDeletePortfolio(p)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #fecaca',
                                                        background: '#fef2f2',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        color: '#b91c1c',
                                                    }}
                                                >
                                                    Удалить
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

            </div>
        );
    };

    const getProductNameById = (productId: number): string => {
        const p = (products ?? []).find((x) => Number(x.id) === productId);
        return (p as any)?.name ?? (p as any)?.product_name ?? `Продукт #${productId}`;
    };

    // --- AI B2C: мозг и сценарии ---
    const openBrainCreate = () => {
        setEditingBrainId(null);
        setBrainForm({ title: '', content: '', is_active: true, priority: '10' });
        setBrainModalOpen(true);
    };
    const openBrainEdit = (c: AiB2cBrainContext) => {
        setEditingBrainId(c.id);
        setBrainForm({
            title: (c.title ?? '').toString(),
            content: (c.content ?? '').toString(),
            is_active: c.is_active !== false,
            priority: String(c.priority ?? 10),
        });
        setBrainModalOpen(true);
    };
    const saveBrainContext = async () => {
        if (!brainForm.title.trim()) {
            setError('Введите название контекста.');
            return;
        }
        try {
            setSavingAiB2c(true);
            setError(null);
            const payload: AiB2cBrainContextCreate = {
                title: brainForm.title.trim(),
                content: brainForm.content.trim(),
                is_active: brainForm.is_active,
                priority: Number(brainForm.priority) || 0,
            };
            if (editingBrainId != null) {
                const updated = await agentLkApi.updateBrainContext(editingBrainId, payload);
                setBrainContexts((prev) =>
                    prev ? prev.map((x) => (String(x.id) === String(editingBrainId) ? updated : x)) : [updated],
                );
            } else {
                const created = await agentLkApi.createBrainContext(payload);
                setBrainContexts((prev) => (prev ? [created, ...prev] : [created]));
            }
            setBrainModalOpen(false);
        } catch (e) {
            console.error('Failed to save brain context:', e);
            setError('Не удалось сохранить контекст. Проверьте API.');
        } finally {
            setSavingAiB2c(false);
        }
    };
    const deleteBrainContext = async (id: number | string) => {
        try {
            setDeletingAiB2cId(String(id));
            await agentLkApi.deleteBrainContext(id);
            setBrainContexts((prev) => (prev ? prev.filter((x) => String(x.id) !== String(id)) : []));
        } catch (e) {
            console.error('Failed to delete brain context:', e);
            setError('Не удалось удалить контекст.');
        } finally {
            setDeletingAiB2cId(null);
        }
    };

    const openStageCreate = () => {
        setEditingStageId(null);
        setStageForm({ stage_key: '', title: '', content: '', is_active: true, priority: '100' });
        setStageModalOpen(true);
    };
    const openStageEdit = (s: AiB2cStage) => {
        setEditingStageId(s.id);
        setStageForm({
            stage_key: (s.stage_key ?? '').toString(),
            title: (s.title ?? '').toString(),
            content: (s.content ?? '').toString(),
            is_active: s.is_active !== false,
            priority: String(s.priority ?? 100),
        });
        setStageModalOpen(true);
    };
    const saveStage = async () => {
        if (!stageForm.stage_key.trim() || !stageForm.title.trim()) {
            setError('Введите ключ и название сценария.');
            return;
        }
        try {
            setSavingAiB2c(true);
            setError(null);
            const payload: AiB2cStageCreate = {
                stage_key: stageForm.stage_key.trim(),
                title: stageForm.title.trim(),
                content: stageForm.content.trim(),
                is_active: stageForm.is_active,
                priority: Number(stageForm.priority) || 0,
            };
            if (editingStageId != null) {
                const updated = await agentLkApi.updateStage(editingStageId, payload);
                setStages((prev) =>
                    prev ? prev.map((x) => (String(x.id) === String(editingStageId) ? updated : x)) : [updated],
                );
            } else {
                const created = await agentLkApi.createStage(payload);
                setStages((prev) => (prev ? [created, ...prev] : [created]));
            }
            setStageModalOpen(false);
        } catch (e) {
            console.error('Failed to save stage:', e);
            setError('Не удалось сохранить сценарий. Проверьте API.');
        } finally {
            setSavingAiB2c(false);
        }
    };
    const deleteStage = async (id: number | string) => {
        try {
            setDeletingAiB2cId(String(id));
            await agentLkApi.deleteStage(id);
            setStages((prev) => (prev ? prev.filter((x) => String(x.id) !== String(id)) : []));
        } catch (e) {
            console.error('Failed to delete stage:', e);
            setError('Не удалось удалить сценарий.');
        } finally {
            setDeletingAiB2cId(null);
        }
    };

    const applyPdfSettingsResponse = (res: PdfCoverSettingsResponse) => {
        setPdfSettings(res);
        setPdfDraft({
            cover_title: res.cover_title ?? '',
            title_band_color: res.title_band_color ?? '',
            cover_background_url: res.cover_background_url ?? '',
        });
    };

    const savePdfCoverDraft = async () => {
        setPdfSaving(true);
        try {
            const res = await agentLkApi.patchPdfCoverSettings({
                cover_title: pdfDraft.cover_title,
                title_band_color: pdfDraft.title_band_color.trim() || '',
                cover_background_url: pdfDraft.cover_background_url,
            });
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (e) {
            console.error(e);
            setPdfError('Не удалось сохранить настройки обложки.');
        } finally {
            setPdfSaving(false);
        }
    };

    const resetPdfCoverBackground = async () => {
        setPdfSaving(true);
        try {
            const res = await agentLkApi.patchPdfCoverSettings({ cover_background_url: '' });
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (e) {
            console.error(e);
            setPdfError('Не удалось сбросить фон к значению по умолчанию.');
        } finally {
            setPdfSaving(false);
        }
    };

    const handlePdfCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setPdfUploading(true);
        try {
            const res = await agentLkApi.uploadPdfCoverBackground(file);
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (err) {
            console.error(err);
            setPdfError('Не удалось загрузить фон. Нужен jpeg/png/webp, не больше 8 МБ.');
        } finally {
            setPdfUploading(false);
        }
    };

    const pdfCoverBandColor = pdfDraft.title_band_color.trim() || '#722257';

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="settings" onNavigate={onNavigate} />

            <main
                style={{
                    flex: 1,
                    padding: '32px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    width: '100%',
                    boxSizing: 'border-box',
                }}
            >
                {/* Tabs */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '8px',
                        display: 'inline-flex',
                        gap: '6px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        marginBottom: '24px',
                    }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '14px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: activeTab === tab ? '#fdf4ff' : 'transparent',
                                color: activeTab === tab ? '#D946EF' : '#6b7280',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {renderTabLabel(tab)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        border: '1px solid #f3f4f6',
                    }}
                >
                    {activeTab === 'products' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>
                                    {renderTabLabel(activeTab)}
                                </h1>
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetProductForm();
                                        setIsProductModalOpen(true);
                                    }}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '999px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Новый продукт
                                </button>
                            </div>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                                Список продуктов, уже заведённых в проекте агента. Позже здесь появятся создание,
                                редактирование и клонирование.
                            </p>
                            {renderProducts()}
                        </>
                    )}

                    {activeTab === 'portfolios' && (
                        <>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                                {renderTabLabel(activeTab)}
                            </h1>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                                Портфели и стратегии, доступные агенту. Здесь же позже сделаем настройку классов и
                                клонов.
                            </p>
                            {renderPortfolios()}
                        </>
                    )}

                    {activeTab === 'ai-b2c' && (
                        <>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>
                                Настройка ИИ (B2C)
                            </h1>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                                Контексты «мозга» и сценарии для B2C-ассистента в вашем проекте.
                            </p>
                            {error && (
                                <div style={{ padding: '12px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', marginBottom: '16px', fontSize: '14px' }}>
                                    {error}
                                </div>
                            )}
                            {aiB2cLoading ? (
                                <p style={{ color: '#6b7280' }}>Загрузка…</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {/* Внешний вид ассистента */}
                                    <section
                                        style={{
                                            padding: '16px 18px',
                                            borderRadius: '16px',
                                            border: '1px solid #e5e7eb',
                                            background: '#f9fafb',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                            <div>
                                                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '4px' }}>
                                                    Внешний вид ассистента
                                                </h2>
                                                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                                    Имя, аватар и зелёная подпись, которые увидит клиент в B2C-виджете.
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div
                                                    style={{
                                                        width: '52px',
                                                        height: '52px',
                                                        borderRadius: '999px',
                                                        overflow: 'hidden',
                                                        background: '#e5e7eb',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '20px',
                                                        fontWeight: 600,
                                                        color: '#4b5563',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {aiB2cAvatarUrl ? (
                                                        // eslint-disable-next-line jsx-a11y/alt-text
                                                        <img
                                                            src={aiB2cAvatarUrl}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        (aiB2cDisplayName.trim()[0] ?? 'A').toUpperCase()
                                                    )}
                                                </div>
                                                <label
                                                    style={{
                                                        fontSize: '12px',
                                                        color: '#4b5563',
                                                        cursor: 'pointer',
                                                        padding: '6px 10px',
                                                        borderRadius: '999px',
                                                        border: '1px solid #d1d5db',
                                                        background: '#fff',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                >
                                                    {uploadingAiB2cAvatar ? 'Загрузка…' : 'Загрузить с компьютера'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleAiB2cAvatarFileChange}
                                                        style={{ display: 'none' }}
                                                        disabled={uploadingAiB2cAvatar}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                                                    Имя ассистента
                                                </label>
                                                <input
                                                    type="text"
                                                    value={aiB2cDisplayName}
                                                    onChange={(e) => setAiB2cDisplayName(e.target.value)}
                                                    placeholder="Например, Виктория"
                                                    style={{
                                                        padding: '8px 10px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #d1d5db',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                                                    URL аватара
                                                </label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input
                                                        type="text"
                                                        value={aiB2cAvatarUrl}
                                                        onChange={(e) => setAiB2cAvatarUrl(e.target.value)}
                                                        placeholder="https://example.com/avatar.png"
                                                        style={{
                                                            flex: 1,
                                                            padding: '8px 10px',
                                                            borderRadius: '10px',
                                                            border: '1px solid #d1d5db',
                                                            fontSize: '14px',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setAiB2cAvatarUrl('')}
                                                        style={{
                                                            padding: '8px 10px',
                                                            borderRadius: '10px',
                                                            border: '1px solid #fecaca',
                                                            background: '#fef2f2',
                                                            fontSize: '12px',
                                                            color: '#b91c1c',
                                                            cursor: aiB2cAvatarUrl ? 'pointer' : 'default',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        disabled={!aiB2cAvatarUrl}
                                                    >
                                                        Удалить аватар
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                                                    Загрузите картинку в ваше хранилище и вставьте сюда прямой URL.
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                                                    Описание (зелёная подпись)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={aiB2cTagline}
                                                    onChange={(e) => setAiB2cTagline(e.target.value)}
                                                    placeholder="Короткое описание роли ассистента"
                                                    style={{
                                                        padding: '8px 10px',
                                                        borderRadius: '10px',
                                                        border: '1px solid #d1d5db',
                                                        fontSize: '14px',
                                                        outline: 'none',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                            <button
                                                type="button"
                                                onClick={saveAiB2cSettings}
                                                disabled={savingAiB2cSettings}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    background: savingAiB2cSettings
                                                        ? '#9ca3af'
                                                        : 'linear-gradient(135deg, #10B981, #059669)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: savingAiB2cSettings ? 'wait' : 'pointer',
                                                }}
                                            >
                                                {savingAiB2cSettings ? 'Сохранение…' : 'Сохранить внешний вид'}
                                            </button>
                                        </div>
                                    </section>

                                    {/* Мозг — brain-contexts */}
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', margin: 0 }}>
                                                ИИ — Мозг (контексты)
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={openBrainCreate}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                + Контекст
                                            </button>
                                        </div>
                                        {(brainContexts ?? []).length === 0 ? (
                                            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Нет контекстов. Добавьте первый.</p>
                                        ) : (
                                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(brainContexts ?? []).map((c) => (
                                                    <li
                                                        key={String(c.id)}
                                                        style={{
                                                            padding: '14px 16px',
                                                            background: '#f9fafb',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e5e7eb',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexWrap: 'wrap',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        <div>
                                                            <span style={{ fontWeight: 600, color: '#111' }}>{c.title ?? 'Без названия'}</span>
                                                            {c.priority != null && (
                                                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>приоритет {c.priority}</span>
                                                            )}
                                                            {c.is_active === false && (
                                                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>неактивен</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openBrainEdit(c)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #d1d5db',
                                                                    background: '#fff',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    color: '#374151',
                                                                }}
                                                            >
                                                                Изменить
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteBrainContext(c.id)}
                                                                disabled={deletingAiB2cId === String(c.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #fecaca',
                                                                    background: '#fef2f2',
                                                                    fontSize: '12px',
                                                                    cursor: deletingAiB2cId === String(c.id) ? 'wait' : 'pointer',
                                                                    color: '#b91c1c',
                                                                }}
                                                            >
                                                                {deletingAiB2cId === String(c.id) ? '…' : 'Удалить'}
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>

                                    {/* Сценарии — stages */}
                                    <section>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151', margin: 0 }}>
                                                ИИ — Сценарии (этапы)
                                            </h2>
                                            <button
                                                type="button"
                                                onClick={openStageCreate}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                + Сценарий
                                            </button>
                                        </div>
                                        {(stages ?? []).length === 0 ? (
                                            <p style={{ fontSize: '14px', color: '#9ca3af' }}>Нет сценариев. Добавьте первый.</p>
                                        ) : (
                                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(stages ?? []).map((s) => (
                                                    <li
                                                        key={String(s.id)}
                                                        style={{
                                                            padding: '14px 16px',
                                                            background: '#f9fafb',
                                                            borderRadius: '12px',
                                                            border: '1px solid #e5e7eb',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexWrap: 'wrap',
                                                            gap: '8px',
                                                        }}
                                                    >
                                                        <div>
                                                            <span style={{ fontWeight: 600, color: '#111' }}>{s.title ?? 'Без названия'}</span>
                                                            {s.stage_key && (
                                                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>({s.stage_key})</span>
                                                            )}
                                                            {s.priority != null && (
                                                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>приоритет {s.priority}</span>
                                                            )}
                                                            {s.is_active === false && (
                                                                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>неактивен</span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openStageEdit(s)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #d1d5db',
                                                                    background: '#fff',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    color: '#374151',
                                                                }}
                                                            >
                                                                Изменить
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteStage(s.id)}
                                                                disabled={deletingAiB2cId === String(s.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #fecaca',
                                                                    background: '#fef2f2',
                                                                    fontSize: '12px',
                                                                    cursor: deletingAiB2cId === String(s.id) ? 'wait' : 'pointer',
                                                                    color: '#b91c1c',
                                                                }}
                                                            >
                                                                {deletingAiB2cId === String(s.id) ? '…' : 'Удалить'}
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'plans' && (
                        <>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '20px', color: '#111' }}>
                                {renderTabLabel(activeTab)}
                            </h1>
                            {plansLoading ? (
                                <p style={{ color: '#6b7280' }}>Загрузка…</p>
                            ) : (
                                <>
                                    {/* 1. Инфляция — линии по срокам (матрица) */}
                                    <section style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                                            Инфляция по срокам (линии)
                                        </h2>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                                            Задай диапазоны месяцев и годовую инфляцию (%) для каждого. Для месяцев вне диапазонов используется ставка последней линии.
                                        </p>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 360 }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>С месяца</th>
                                                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>По месяц (не вкл.)</th>
                                                        <th style={{ textAlign: 'left', padding: '10px', fontSize: '12px', color: '#6b7280' }}>Инфляция % годовых</th>
                                                        <th style={{ width: 48 }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {inflationRanges.map((r, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                            <td style={{ padding: '10px' }}>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={r.fromMonth}
                                                                    onChange={(e) => {
                                                                        const next = inflationRanges.slice();
                                                                        next[i] = { ...next[i], fromMonth: Number(e.target.value) || 0 };
                                                                        setInflationRanges(next);
                                                                    }}
                                                                    style={{ width: 72, padding: '6px 8px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '10px' }}>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    value={r.toMonthExcl}
                                                                    onChange={(e) => {
                                                                        const next = inflationRanges.slice();
                                                                        next[i] = { ...next[i], toMonthExcl: Number(e.target.value) || 0 };
                                                                        setInflationRanges(next);
                                                                    }}
                                                                    style={{ width: 72, padding: '6px 8px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '10px' }}>
                                                                <input
                                                                    type="number"
                                                                    step={0.1}
                                                                    min={0}
                                                                    value={r.rateAnnual}
                                                                    onChange={(e) => {
                                                                        const next = inflationRanges.slice();
                                                                        next[i] = { ...next[i], rateAnnual: Number(e.target.value) || 0 };
                                                                        setInflationRanges(next);
                                                                    }}
                                                                    style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '10px' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setInflationRanges(inflationRanges.filter((_, j) => j !== i))}
                                                                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 12 }}
                                                                >
                                                                    Удалить
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '12px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => setInflationRanges([...inflationRanges, { fromMonth: inflationRanges.length ? inflationRanges[inflationRanges.length - 1].toMonthExcl : 0, toMonthExcl: (inflationRanges.length ? inflationRanges[inflationRanges.length - 1].toMonthExcl : 0) + 12, rateAnnual: 6 }])}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #D946EF', color: '#D946EF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                + Добавить линию
                                            </button>
                                            <button
                                                type="button"
                                                disabled={plansSaving === 'inflation'}
                                                onClick={async () => {
                                                    setPlansSaving('inflation');
                                                    try {
                                                        await agentLkApi.putInflationMatrix({ ranges: inflationRanges });
                                                        setError(null);
                                                    } catch (e) {
                                                        setError('Не удалось сохранить матрицу инфляции.');
                                                    } finally {
                                                        setPlansSaving(null);
                                                    }
                                                }}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#D946EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: plansSaving === 'inflation' ? 'wait' : 'pointer' }}
                                            >
                                                {plansSaving === 'inflation' ? 'Сохранение…' : 'Сохранить матрицу инфляции'}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                            Fallback: одна годовая инфляция % (если матрица пуста)
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                                            <input
                                                type="number"
                                                step={0.1}
                                                min={0}
                                                placeholder="например 6"
                                                value={inflationYearFallback}
                                                onChange={(e) => setInflationYearFallback(e.target.value)}
                                                style={{ width: 100, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                            />
                                            <span style={{ fontSize: 13, color: '#6b7280' }}>% годовых</span>
                                            <button
                                                type="button"
                                                disabled={plansSaving === 'inflationYear'}
                                                onClick={async () => {
                                                    const v = Number(inflationYearFallback);
                                                    if (Number.isNaN(v)) return;
                                                    setPlansSaving('inflationYear');
                                                    try {
                                                        await agentLkApi.putInflationYear(v);
                                                        setError(null);
                                                    } catch (e) {
                                                        setError('Не удалось сохранить годовую инфляцию.');
                                                    } finally {
                                                        setPlansSaving(null);
                                                    }
                                                }}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#8B5CF6', color: '#fff', fontSize: 13, fontWeight: 600, cursor: plansSaving === 'inflationYear' ? 'wait' : 'pointer' }}
                                            >
                                                {plansSaving === 'inflationYear' ? '…' : 'Сохранить'}
                                            </button>
                                        </div>
                                    </section>

                                    {/* 2. Рост расходов на инвестиции (годовая %). */}
                                    <section style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                                            Рост расходов на инвестиции
                                        </h2>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                                            Годовая ставка роста расходов на инвестиции (%).
                                        </p>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 13, color: '#374151' }}>Годовая %:</span>
                                                <input
                                                    type="number"
                                                    step={0.1}
                                                    placeholder="—"
                                                    value={investmentGrowthAnnual}
                                                    onChange={(e) => setInvestmentGrowthAnnual(e.target.value)}
                                                    style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                disabled={plansSaving === 'investmentGrowth'}
                                                onClick={async () => {
                                                    setPlansSaving('investmentGrowth');
                                                    try {
                                                        if (investmentGrowthAnnual !== '' && !Number.isNaN(Number(investmentGrowthAnnual))) {
                                                            await agentLkApi.putInvestmentExpenseGrowthAnnual(Number(investmentGrowthAnnual));
                                                        }
                                                        setError(null);
                                                    } catch (e) {
                                                        setError('Не удалось сохранить рост расходов.');
                                                    } finally {
                                                        setPlansSaving(null);
                                                    }
                                                }}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#D946EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: plansSaving === 'investmentGrowth' ? 'wait' : 'pointer' }}
                                            >
                                                {plansSaving === 'investmentGrowth' ? 'Сохранение…' : 'Сохранить'}
                                            </button>
                                        </div>
                                    </section>

                                    {/* 3. Доходность для пассивного дохода */}
                                    <section>
                                        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                                            Доходность пассивного дохода
                                        </h2>
                                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                                            Линии по срокам и суммам: минимальный/максимальный срок (мес.), мин/макс сумма (₽), доходность % годовых.
                                        </p>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Срок от (мес.)</th>
                                                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Срок до (мес.)</th>
                                                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Сумма от (₽)</th>
                                                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Сумма до (₽)</th>
                                                        <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Доходность %</th>
                                                        <th style={{ width: 48 }} />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {passiveYieldLines.map((line, i) => (
                                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                            <td style={{ padding: '8px' }}><input type="number" min={0} value={line.min_term_months} onChange={(e) => { const n = passiveYieldLines.slice(); n[i] = { ...n[i], min_term_months: Number(e.target.value) || 0 }; setPassiveYieldLines(n); }} style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} /></td>
                                                            <td style={{ padding: '8px' }}><input type="number" min={0} value={line.max_term_months} onChange={(e) => { const n = passiveYieldLines.slice(); n[i] = { ...n[i], max_term_months: Number(e.target.value) || 0 }; setPassiveYieldLines(n); }} style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} /></td>
                                                            <td style={{ padding: '8px' }}><input type="number" min={0} value={line.min_amount} onChange={(e) => { const n = passiveYieldLines.slice(); n[i] = { ...n[i], min_amount: Number(e.target.value) || 0 }; setPassiveYieldLines(n); }} style={{ width: 100, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} /></td>
                                                            <td style={{ padding: '8px' }}><input type="number" min={0} value={line.max_amount} onChange={(e) => { const n = passiveYieldLines.slice(); n[i] = { ...n[i], max_amount: Number(e.target.value) || 0 }; setPassiveYieldLines(n); }} style={{ width: 100, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} /></td>
                                                            <td style={{ padding: '8px' }}><input type="number" step={0.1} min={0} value={line.yield_percent} onChange={(e) => { const n = passiveYieldLines.slice(); n[i] = { ...n[i], yield_percent: Number(e.target.value) || 0 }; setPassiveYieldLines(n); }} style={{ width: 72, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }} /></td>
                                                            <td style={{ padding: '8px' }}><button type="button" onClick={() => setPassiveYieldLines(passiveYieldLines.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: 12 }}>Удалить</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div style={{ marginTop: '12px', display: 'flex', gap: 8 }}>
                                            <button
                                                type="button"
                                                onClick={() => setPassiveYieldLines([...passiveYieldLines, { min_term_months: 0, max_term_months: 60, min_amount: 0, max_amount: 1e12, yield_percent: 10 }])}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #D946EF', color: '#D946EF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                + Добавить линию
                                            </button>
                                            <button
                                                type="button"
                                                disabled={plansSaving === 'passiveYield' || passiveYieldLines.length === 0}
                                                onClick={async () => {
                                                    setPlansSaving('passiveYield');
                                                    try {
                                                        await agentLkApi.putPassiveIncomeYield(passiveYieldLines);
                                                        setError(null);
                                                    } catch (e) {
                                                        setError('Не удалось сохранить доходность пассивного дохода.');
                                                    } finally {
                                                        setPlansSaving(null);
                                                    }
                                                }}
                                                style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#D946EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: plansSaving === 'passiveYield' ? 'wait' : 'pointer' }}
                                            >
                                                {plansSaving === 'passiveYield' ? 'Сохранение…' : 'Сохранить доходность'}
                                            </button>
                                        </div>
                                    </section>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'report' && (
                        <>
                            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#111' }}>
                                {renderTabLabel(activeTab)}
                            </h1>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                                Настройки PDF-отчёта для клиентов. Слева — разделы; позже сюда добавятся другие страницы
                                отчёта, не только обложка.
                            </p>
                            {pdfError && (
                                <div
                                    style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: '#fef2f2',
                                        color: '#b91c1c',
                                        marginBottom: '16px',
                                        fontSize: '14px',
                                    }}
                                >
                                    {pdfError}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                <nav
                                    style={{
                                        flexShrink: 0,
                                        minWidth: '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                    }}
                                    aria-label="Разделы отчёта"
                                >
                                    {REPORT_SUBPAGE_ITEMS.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setReportSubPage(item.id)}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                textAlign: 'left',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                background: reportSubPage === item.id ? '#fdf4ff' : 'transparent',
                                                color: reportSubPage === item.id ? '#D946EF' : '#6b7280',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>
                                <div style={{ flex: 1, minWidth: 'min(100%, 320px)' }}>
                                    {reportSubPage === 'cover' && (
                                        <>
                                            {pdfLoading ? (
                                                <p style={{ color: '#6b7280' }}>Загрузка…</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: '24px',
                                                            flexWrap: 'wrap',
                                                            alignItems: 'flex-start',
                                                        }}
                                                    >
                                                        <div>
                                                            <p
                                                                style={{
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    color: '#6b7280',
                                                                    margin: '0 0 8px 0',
                                                                }}
                                                            >
                                                                Превью (примерно как на PDF)
                                                            </p>
                                                            <div
                                                                style={{
                                                                    width: 'min(100%, 260px)',
                                                                    aspectRatio: '210 / 297',
                                                                    borderRadius: '14px',
                                                                    overflow: 'hidden',
                                                                    border: '1px solid #e5e7eb',
                                                                    background: '#e5e7eb',
                                                                    position: 'relative',
                                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                                                }}
                                                            >
                                                                {pdfCoverPreviewUrl ? (
                                                                    // eslint-disable-next-line jsx-a11y/alt-text -- декоративное превью макета
                                                                    <img
                                                                        src={pdfCoverPreviewUrl}
                                                                        alt=""
                                                                        style={{
                                                                            position: 'absolute',
                                                                            inset: 0,
                                                                            zIndex: 0,
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                            display: 'block',
                                                                            pointerEvents: 'none',
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left: 0,
                                                                        right: 0,
                                                                        bottom: '16%',
                                                                        zIndex: 1,
                                                                        background: pdfCoverBandColor,
                                                                        padding: '14px 12px',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            color: '#fff',
                                                                            fontSize: '11px',
                                                                            fontWeight: 700,
                                                                            textAlign: 'center',
                                                                            lineHeight: 1.35,
                                                                        }}
                                                                    >
                                                                        {pdfDraft.cover_title.trim() ||
                                                                            'Текст плашки'}
                                                                    </div>
                                                                </div>
                                                                {pdfSettings?.date_preview ? (
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            bottom: '10px',
                                                                            right: '12px',
                                                                            zIndex: 2,
                                                                            fontSize: '9px',
                                                                            color: '#fff',
                                                                            textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                                                                        }}
                                                                    >
                                                                        {pdfSettings.date_preview}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: '240px', maxWidth: '480px' }}>
                                                            <h2
                                                                style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: 600,
                                                                    color: '#111827',
                                                                    margin: '0 0 12px 0',
                                                                }}
                                                            >
                                                                Обложка
                                                            </h2>
                                                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                                                                Картинку меняем загрузкой файла — бэк сам положит в хранилище и
                                                                пропишет URL. Превью слева тянем через{' '}
                                                                <code style={{ fontSize: '12px' }}>/api/pfp/pdf-settings/cover-image</code>
                                                                с твоим JWT: прямой линк на R2 в браузере часто не рисуется
                                                                (доступ/реферер). Пустая строка при сохранении — дефолт по API.
                                                            </p>
                                                            {pdfFormFieldsFromSchema(pdfSettings?.editor_schema).map(
                                                                (field) => {
                                                                    if (field.type === 'image') {
                                                                        return (
                                                                            <div
                                                                                key={field.key}
                                                                                style={{
                                                                                    marginBottom: '16px',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '8px',
                                                                                }}
                                                                            >
                                                                                <label
                                                                                    style={{
                                                                                        fontSize: '13px',
                                                                                        fontWeight: 500,
                                                                                        color: '#374151',
                                                                                    }}
                                                                                >
                                                                                    {field.label ?? 'Фон'}
                                                                                </label>
                                                                                {field.hint ? (
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: '12px',
                                                                                            color: '#9ca3af',
                                                                                        }}
                                                                                    >
                                                                                        {field.hint}
                                                                                    </span>
                                                                                ) : null}
                                                                                <div
                                                                                    style={{
                                                                                        display: 'flex',
                                                                                        flexWrap: 'wrap',
                                                                                        gap: '10px',
                                                                                        alignItems: 'center',
                                                                                    }}
                                                                                >
                                                                                    <label
                                                                                        style={{
                                                                                            fontSize: '12px',
                                                                                            color: '#4b5563',
                                                                                            cursor: pdfUploading
                                                                                                ? 'wait'
                                                                                                : 'pointer',
                                                                                            padding: '8px 14px',
                                                                                            borderRadius: '999px',
                                                                                            border: '1px solid #d1d5db',
                                                                                            background: '#fff',
                                                                                        }}
                                                                                    >
                                                                                        {pdfUploading
                                                                                            ? 'Загрузка…'
                                                                                            : 'Загрузить картинку'}
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/jpeg,image/png,image/webp"
                                                                                            onChange={handlePdfCoverImageChange}
                                                                                            style={{ display: 'none' }}
                                                                                            disabled={pdfUploading}
                                                                                        />
                                                                                    </label>
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={pdfSaving || pdfUploading}
                                                                                        onClick={() => void resetPdfCoverBackground()}
                                                                                        style={{
                                                                                            padding: '8px 14px',
                                                                                            borderRadius: '999px',
                                                                                            border: '1px solid #fecaca',
                                                                                            background: '#fef2f2',
                                                                                            fontSize: '12px',
                                                                                            cursor:
                                                                                                pdfSaving || pdfUploading
                                                                                                    ? 'wait'
                                                                                                    : 'pointer',
                                                                                            color: '#b91c1c',
                                                                                        }}
                                                                                    >
                                                                                        Сбросить фон
                                                                                    </button>
                                                                                </div>
                                                                                <label
                                                                                    style={{
                                                                                        fontSize: '12px',
                                                                                        color: '#6b7280',
                                                                                    }}
                                                                                >
                                                                                    URL фона (можно править вручную)
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={pdfDraft.cover_background_url}
                                                                                    onChange={(e) =>
                                                                                        setPdfDraft((d) => ({
                                                                                            ...d,
                                                                                            cover_background_url:
                                                                                                e.target.value,
                                                                                        }))
                                                                                    }
                                                                                    placeholder="https://… или путь с сервера"
                                                                                    style={{
                                                                                        padding: '8px 10px',
                                                                                        borderRadius: '10px',
                                                                                        border: '1px solid #d1d5db',
                                                                                        fontSize: '13px',
                                                                                        outline: 'none',
                                                                                        width: '100%',
                                                                                        boxSizing: 'border-box',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }
                                                                    if (field.type === 'text' && field.key === 'cover_title') {
                                                                        return (
                                                                            <div
                                                                                key={field.key}
                                                                                style={{
                                                                                    marginBottom: '16px',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '4px',
                                                                                }}
                                                                            >
                                                                                <label
                                                                                    style={{
                                                                                        fontSize: '13px',
                                                                                        fontWeight: 500,
                                                                                        color: '#374151',
                                                                                    }}
                                                                                >
                                                                                    {field.label ?? 'Текст плашки'}
                                                                                </label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={pdfDraft.cover_title}
                                                                                    onChange={(e) =>
                                                                                        setPdfDraft((d) => ({
                                                                                            ...d,
                                                                                            cover_title: e.target.value,
                                                                                        }))
                                                                                    }
                                                                                    style={{
                                                                                        padding: '8px 10px',
                                                                                        borderRadius: '10px',
                                                                                        border: '1px solid #d1d5db',
                                                                                        fontSize: '14px',
                                                                                        outline: 'none',
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        );
                                                                    }
                                                                    if (field.type === 'color' && field.key === 'title_band_color') {
                                                                        return (
                                                                            <div
                                                                                key={field.key}
                                                                                style={{
                                                                                    marginBottom: '16px',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '8px',
                                                                                }}
                                                                            >
                                                                                <label
                                                                                    style={{
                                                                                        fontSize: '13px',
                                                                                        fontWeight: 500,
                                                                                        color: '#374151',
                                                                                    }}
                                                                                >
                                                                                    {field.label ?? 'Цвет плашки'}
                                                                                </label>
                                                                                <div
                                                                                    style={{
                                                                                        display: 'flex',
                                                                                        gap: '10px',
                                                                                        alignItems: 'center',
                                                                                        flexWrap: 'wrap',
                                                                                    }}
                                                                                >
                                                                                    <input
                                                                                        type="color"
                                                                                        value={
                                                                                            /^#[0-9A-Fa-f]{6}$/.test(
                                                                                                pdfDraft.title_band_color.trim()
                                                                                            )
                                                                                                ? pdfDraft.title_band_color.trim()
                                                                                                : '#722257'
                                                                                        }
                                                                                        onChange={(e) =>
                                                                                            setPdfDraft((d) => ({
                                                                                                ...d,
                                                                                                title_band_color:
                                                                                                    e.target.value,
                                                                                            }))
                                                                                        }
                                                                                        style={{
                                                                                            width: 44,
                                                                                            height: 36,
                                                                                            padding: 0,
                                                                                            border: '1px solid #d1d5db',
                                                                                            borderRadius: 8,
                                                                                            cursor: 'pointer',
                                                                                        }}
                                                                                    />
                                                                                    <input
                                                                                        type="text"
                                                                                        value={pdfDraft.title_band_color}
                                                                                        onChange={(e) =>
                                                                                            setPdfDraft((d) => ({
                                                                                                ...d,
                                                                                                title_band_color:
                                                                                                    e.target.value,
                                                                                            }))
                                                                                        }
                                                                                        placeholder="#RRGGBB"
                                                                                        style={{
                                                                                            flex: 1,
                                                                                            minWidth: '120px',
                                                                                            padding: '8px 10px',
                                                                                            borderRadius: '10px',
                                                                                            border: '1px solid #d1d5db',
                                                                                            fontSize: '13px',
                                                                                            fontFamily: 'monospace',
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    if (field.type === 'readonly') {
                                                                        const vk = field.value_key || field.key;
                                                                        const data = pdfSettings as Record<string, unknown> | null | undefined;
                                                                        const raw =
                                                                            vk === 'date_preview'
                                                                                ? pdfSettings?.date_preview
                                                                                : data?.[vk];
                                                                        const display =
                                                                            raw != null && raw !== '' ? String(raw) : '—';
                                                                        return (
                                                                            <div
                                                                                key={field.key}
                                                                                style={{
                                                                                    marginBottom: '16px',
                                                                                    padding: '12px 14px',
                                                                                    borderRadius: '12px',
                                                                                    background: '#f9fafb',
                                                                                    border: '1px solid #e5e7eb',
                                                                                }}
                                                                            >
                                                                                <div
                                                                                    style={{
                                                                                        fontSize: '12px',
                                                                                        fontWeight: 600,
                                                                                        color: '#6b7280',
                                                                                        marginBottom: '4px',
                                                                                    }}
                                                                                >
                                                                                    {field.label ?? 'Дата'}
                                                                                </div>
                                                                                <div style={{ fontSize: '14px', color: '#111827' }}>
                                                                                    {display}
                                                                                </div>
                                                                                <p
                                                                                    style={{
                                                                                        fontSize: '11px',
                                                                                        color: '#9ca3af',
                                                                                        margin: '8px 0 0 0',
                                                                                    }}
                                                                                >
                                                                                    Реальную дату на PDF подставляет бэкенд;
                                                                                    здесь только подсказка для ЛК.
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => void savePdfCoverDraft()}
                                                                disabled={pdfSaving || pdfUploading}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    borderRadius: '999px',
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                                                    color: '#fff',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    cursor:
                                                                        pdfSaving || pdfUploading ? 'wait' : 'pointer',
                                                                    marginTop: '4px',
                                                                }}
                                                            >
                                                                {pdfSaving ? 'Сохранение…' : 'Сохранить текст и URL фона'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'legacy' && (
                        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                            Для вкладки «{renderTabLabel(activeTab)}» пока только каркас. Когда подключим
                            соответствующие эндпоинты, здесь появится полноценный UI.
                        </p>
                    )}
                </div>

                {/* Модалка создания продукта */}
                {activeTab === 'products' && isProductModalOpen && (
                    <div
                        onClick={() => !isSavingProduct && setIsProductModalOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1200px, 100%)',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Новый продукт</h2>
                                <button
                                    type="button"
                                    onClick={() => !isSavingProduct && setIsProductModalOpen(false)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '20px',
                                        lineHeight: 1,
                                        color: '#6b7280',
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleCreateProduct} style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                        Название продукта
                                    </label>
                                    <input
                                        type="text"
                                        value={productForm.name}
                                        onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '13px',
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                            Тип продукта
                                        </label>
                                        <select
                                            value={productForm.product_type}
                                            onChange={(e) =>
                                                setProductForm((prev) => ({ ...prev, product_type: e.target.value }))
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '13px',
                                                background: '#fff',
                                            }}
                                            required
                                        >
                                            <option value="">Выберите тип…</option>
                                            {(productTypes || []).map((t) => (
                                                <option key={t.id} value={t.code}>
                                                    {t.name} ({t.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                            Валюта
                                        </label>
                                        <input
                                            type="text"
                                            value={productForm.currency}
                                            onChange={(e) =>
                                                setProductForm((prev) => ({ ...prev, currency: e.target.value }))
                                            }
                                            style={{
                                                width: '100%',
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '13px',
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        marginTop: '8px',
                                        padding: '10px 12px',
                                        borderRadius: '12px',
                                        background: '#f9fafb',
                                        border: '1px dashed #e5e7eb',
                                    }}
                                >
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                                        Линии доходности (можно несколько строк)
                                    </div>
                                    <table
                                        style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            fontSize: '12px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '4px 6px 6px 0', color: '#6b7280', fontWeight: 500 }}>
                                                    Срок от (мес)
                                                </th>
                                                <th style={{ padding: '4px 6px 6px 0', color: '#6b7280', fontWeight: 500 }}>
                                                    Срок до (мес)
                                                </th>
                                                <th style={{ padding: '4px 6px 6px 0', color: '#6b7280', fontWeight: 500 }}>
                                                    Сумма от
                                                </th>
                                                <th style={{ padding: '4px 6px 6px 0', color: '#6b7280', fontWeight: 500 }}>
                                                    Сумма до
                                                </th>
                                                <th style={{ padding: '4px 6px 6px 0', color: '#6b7280', fontWeight: 500 }}>
                                                    % годовых
                                                </th>
                                                <th style={{ width: 36 }} />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productCreateLines.map((line, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={line.min_term_months}
                                                            onChange={(e) =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.map((l, i) =>
                                                                        i === idx ? { ...l, min_term_months: e.target.value } : l,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: '100%',
                                                                minWidth: 0,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                fontSize: '12px',
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={line.max_term_months}
                                                            onChange={(e) =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.map((l, i) =>
                                                                        i === idx ? { ...l, max_term_months: e.target.value } : l,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: '100%',
                                                                minWidth: 0,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                fontSize: '12px',
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={line.min_amount}
                                                            onChange={(e) =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.map((l, i) =>
                                                                        i === idx ? { ...l, min_amount: e.target.value } : l,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: '100%',
                                                                minWidth: 0,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                fontSize: '12px',
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={line.max_amount}
                                                            onChange={(e) =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.map((l, i) =>
                                                                        i === idx ? { ...l, max_amount: e.target.value } : l,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: '100%',
                                                                minWidth: 0,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                fontSize: '12px',
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'middle' }}>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="0.1"
                                                            value={line.yield_percent}
                                                            onChange={(e) =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.map((l, i) =>
                                                                        i === idx ? { ...l, yield_percent: e.target.value } : l,
                                                                    ),
                                                                )
                                                            }
                                                            style={{
                                                                width: '100%',
                                                                minWidth: 0,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                fontSize: '12px',
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '6px 0', textAlign: 'center', verticalAlign: 'middle' }}>
                                                        <button
                                                            type="button"
                                                            disabled={productCreateLines.length <= 1 || isSavingProduct}
                                                            title={
                                                                productCreateLines.length <= 1
                                                                    ? 'Нужна хотя бы одна линия'
                                                                    : 'Удалить строку'
                                                            }
                                                            onClick={() =>
                                                                setProductCreateLines((prev) =>
                                                                    prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
                                                                )
                                                            }
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                color:
                                                                    productCreateLines.length <= 1 ? '#d1d5db' : '#ef4444',
                                                                cursor:
                                                                    productCreateLines.length <= 1 || isSavingProduct
                                                                        ? 'not-allowed'
                                                                        : 'pointer',
                                                                fontSize: '16px',
                                                                lineHeight: 1,
                                                                padding: '2px 4px',
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        type="button"
                                        disabled={isSavingProduct}
                                        onClick={() =>
                                            setProductCreateLines((prev) => [...prev, getDefaultProductCreateLine()])
                                        }
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '999px',
                                            border: '1px dashed #e5e7eb',
                                            background: '#fff',
                                            fontSize: '12px',
                                            cursor: isSavingProduct ? 'wait' : 'pointer',
                                            color: '#374151',
                                        }}
                                    >
                                        + Добавить линию
                                    </button>
                                </div>

                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => !isSavingProduct && setIsProductModalOpen(false)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: '999px',
                                            border: '1px solid #e5e7eb',
                                            background: '#fff',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingProduct}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '999px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            opacity: isSavingProduct ? 0.7 : 1,
                                        }}
                                    >
                                        {isSavingProduct ? 'Сохраняем…' : 'Создать продукт'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Модалка просмотра продукта */}
                {activeTab === 'products' && isProductDetailsOpen && selectedProduct && (
                    <div
                        onClick={() => !isLoadingProductDetails && setIsProductDetailsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1290,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1200px, 100%)',
                                maxHeight: '90vh',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px',
                                }}
                            >
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Детали продукта</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {!isEditingProduct && !isLoadingProductDetails && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const src: any[] =
                                                    ((selectedProduct as any).lines as any[]) ||
                                                    ((selectedProduct as any).yields as any[]) ||
                                                    [];
                                                setEditableLines(
                                                    src.map((line) => ({
                                                        min_term_months:
                                                            typeof line.min_term_months === 'number'
                                                                ? line.min_term_months
                                                                : typeof line.term_from_months === 'number'
                                                                ? line.term_from_months
                                                                : '',
                                                        max_term_months:
                                                            typeof line.max_term_months === 'number'
                                                                ? line.max_term_months
                                                                : typeof line.term_to_months === 'number'
                                                                ? line.term_to_months
                                                                : '',
                                                        min_amount:
                                                            typeof line.min_amount === 'number'
                                                                ? line.min_amount
                                                                : typeof line.amount_from === 'number'
                                                                ? line.amount_from
                                                                : '',
                                                        max_amount:
                                                            typeof line.max_amount === 'number'
                                                                ? line.max_amount
                                                                : typeof line.amount_to === 'number'
                                                                ? line.amount_to
                                                                : '',
                                                        yield_percent:
                                                            typeof line.yield_percent === 'number'
                                                                ? line.yield_percent
                                                                : '',
                                                    })),
                                                );
                                                if (src.length === 0) {
                                                    setEditableLines([
                                                        {
                                                            min_term_months: '',
                                                            max_term_months: '',
                                                            min_amount: '',
                                                            max_amount: '',
                                                            yield_percent: '',
                                                        },
                                                    ]);
                                                }
                                                setIsEditingProduct(true);
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '999px',
                                                border: '1px solid #e5e7eb',
                                                background: '#f9fafb',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                color: '#111827',
                                            }}
                                        >
                                            Редактировать
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => !isLoadingProductDetails && setIsProductDetailsOpen(false)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '20px',
                                            lineHeight: 1,
                                            color: '#6b7280',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {isLoadingProductDetails ? (
                                <p style={{ color: '#6b7280', fontSize: '14px' }}>Загружаем данные продукта…</p>
                            ) : (
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: '#111827',
                                        overflowY: 'auto',
                                        paddingRight: '4px',
                                    }}
                                >
                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{ color: '#6b7280', marginBottom: '2px' }}>Название</div>
                                        <div style={{ fontWeight: 600 }}>{(selectedProduct as any).name}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <div style={{ color: '#6b7280', marginBottom: '2px' }}>Тип</div>
                                            <div>{(selectedProduct as any).product_type || (selectedProduct as any).type}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#6b7280', marginBottom: '2px' }}>Валюта</div>
                                            <div>{(selectedProduct as any).currency || 'RUB'}</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: '12px',
                                            paddingTop: '8px',
                                            borderTop: '1px solid #e5e7eb',
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Линии доходности</div>
                                        {!isEditingProduct && (
                                            <table
                                                style={{
                                                    width: '100%',
                                                    borderCollapse: 'collapse',
                                                    fontSize: '12px',
                                                }}
                                            >
                                                <thead>
                                                    <tr
                                                        style={{
                                                            textAlign: 'left',
                                                            borderBottom: '1px solid #e5e7eb',
                                                        }}
                                                    >
                                                        <th style={{ padding: '4px 2px', color: '#6b7280' }}>Срок от</th>
                                                        <th style={{ padding: '4px 2px', color: '#6b7280' }}>Срок до</th>
                                                        <th style={{ padding: '4px 2px', color: '#6b7280' }}>
                                                            Сумма от
                                                        </th>
                                                        <th style={{ padding: '4px 2px', color: '#6b7280' }}>
                                                            Сумма до
                                                        </th>
                                                        <th style={{ padding: '4px 2px', color: '#6b7280' }}>
                                                            % годовых
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(((selectedProduct as any).lines as any[]) ||
                                                        ((selectedProduct as any).yields as any[]) ||
                                                        [])?.map((line, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                            <td style={{ padding: '4px 2px' }}>
                                                                {line.min_term_months ?? line.term_from_months ?? '—'}
                                                            </td>
                                                            <td style={{ padding: '4px 2px' }}>
                                                                {line.max_term_months ?? line.term_to_months ?? '—'}
                                                            </td>
                                                            <td style={{ padding: '4px 2px' }}>
                                                                {line.min_amount ?? line.amount_from ?? '—'}
                                                            </td>
                                                            <td style={{ padding: '4px 2px' }}>
                                                                {line.max_amount ?? line.amount_to ?? '—'}
                                                            </td>
                                                            <td style={{ padding: '4px 2px' }}>
                                                                {line.yield_percent ?? '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}

                                        {isEditingProduct && (
                                            <div>
                                                <table
                                                    style={{
                                                        width: '100%',
                                                        borderCollapse: 'collapse',
                                                        fontSize: '12px',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    <thead>
                                                        <tr
                                                            style={{
                                                                textAlign: 'left',
                                                                borderBottom: '1px solid #e5e7eb',
                                                            }}
                                                        >
                                                            <th
                                                                style={{ padding: '4px 2px', color: '#6b7280' }}
                                                            >
                                                                Срок от
                                                            </th>
                                                            <th
                                                                style={{ padding: '4px 2px', color: '#6b7280' }}
                                                            >
                                                                Срок до
                                                            </th>
                                                            <th
                                                                style={{ padding: '4px 2px', color: '#6b7280' }}
                                                            >
                                                                Сумма от
                                                            </th>
                                                            <th
                                                                style={{ padding: '4px 2px', color: '#6b7280' }}
                                                            >
                                                                Сумма до
                                                            </th>
                                                            <th
                                                                style={{ padding: '4px 2px', color: '#6b7280' }}
                                                            >
                                                                % годовых
                                                            </th>
                                                            <th style={{ width: '40px' }} />
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {editableLines.map((line, idx) => (
                                                            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                                {(['min_term_months', 'max_term_months', 'min_amount', 'max_amount', 'yield_percent'] as const).map(
                                                                    (field) => (
                                                                        <td key={field} style={{ padding: '4px 2px' }}>
                                                                            <input
                                                                                type="number"
                                                                                value={
                                                                                    line[field] === ''
                                                                                        ? ''
                                                                                        : (line[field] as number)
                                                                                }
                                                                                onChange={(e) => {
                                                                                    const value =
                                                                                        e.target.value === ''
                                                                                            ? ''
                                                                                            : Number(
                                                                                                  e.target.value,
                                                                                              );
                                                                                    setEditableLines((prev) =>
                                                                                        prev.map((l, i) =>
                                                                                            i === idx
                                                                                                ? {
                                                                                                      ...l,
                                                                                                      [field]: value,
                                                                                                  }
                                                                                                : l,
                                                                                        ),
                                                                                    );
                                                                                }}
                                                                                style={{
                                                                                    width: '100%',
                                                                                    padding: '4px 6px',
                                                                                    borderRadius: '6px',
                                                                                    border: '1px solid #e5e7eb',
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    ),
                                                                )}
                                                                <td style={{ padding: '4px 2px', textAlign: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditableLines((prev) =>
                                                                                prev.filter((_, i) => i !== idx),
                                                                            )
                                                                        }
                                                                        style={{
                                                                            border: 'none',
                                                                            background: 'transparent',
                                                                            color: '#ef4444',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                        }}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setEditableLines((prev) => [
                                                            ...prev,
                                                            {
                                                                min_term_months: '',
                                                                max_term_months: '',
                                                                min_amount: '',
                                                                max_amount: '',
                                                                yield_percent: '',
                                                            },
                                                        ])
                                                    }
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '999px',
                                                        border: '1px dashed #e5e7eb',
                                                        background: '#f9fafb',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    Добавить линию
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <details style={{ marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
                                        <summary>Показать полный JSON продукта</summary>
                                        <pre
                                            style={{
                                                marginTop: '6px',
                                                padding: '8px',
                                                background: '#f9fafb',
                                                borderRadius: '8px',
                                                maxHeight: '260px',
                                                overflow: 'auto',
                                            }}
                                        >
                                            {JSON.stringify(selectedProduct, null, 2)}
                                        </pre>
                                    </details>

                                    {isEditingProduct && (
                                        <div
                                            style={{
                                                marginTop: '12px',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: '8px',
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingProduct(false)}
                                                style={{
                                                    padding: '8px 14px',
                                                    borderRadius: '999px',
                                                    border: '1px solid #e5e7eb',
                                                    background: '#fff',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!selectedProduct) return;
                                                    const base: any = selectedProduct as any;
                                                    const payload: ProductCreatePayload = {
                                                        name: base.name,
                                                        product_type: base.product_type || base.type,
                                                        currency: base.currency || 'RUB',
                                                        lines: editableLines
                                                            .filter(
                                                                (l) =>
                                                                    l.min_term_months !== '' &&
                                                                    l.max_term_months !== '' &&
                                                                    l.yield_percent !== '',
                                                            )
                                                            .map((l) => ({
                                                                min_term_months:
                                                                    typeof l.min_term_months === 'number'
                                                                        ? l.min_term_months
                                                                        : 0,
                                                                max_term_months:
                                                                    typeof l.max_term_months === 'number'
                                                                        ? l.max_term_months
                                                                        : 0,
                                                                min_amount:
                                                                    typeof l.min_amount === 'number'
                                                                        ? l.min_amount
                                                                        : 0,
                                                                max_amount:
                                                                    typeof l.max_amount === 'number'
                                                                        ? l.max_amount
                                                                        : 0,
                                                                yield_percent:
                                                                    typeof l.yield_percent === 'number'
                                                                        ? l.yield_percent
                                                                        : 0,
                                                            })),
                                                    };

                                                    try {
                                                        setIsLoadingProductDetails(true);
                                                        const updated = await agentLkApi.updateProduct(
                                                            selectedProduct.id,
                                                            payload,
                                                        );
                                                        setSelectedProduct(updated);
                                                        setProducts((prev) =>
                                                            prev
                                                                ? prev.map((p) =>
                                                                      p.id === selectedProduct.id ? updated : p,
                                                                  )
                                                                : prev,
                                                        );
                                                        setIsEditingProduct(false);
                                                    } catch (e) {
                                                        console.error('Failed to update product:', e);
                                                        setError(
                                                            'Не удалось сохранить продукт. Возможно, это системный продукт и его нельзя менять.',
                                                        );
                                                    } finally {
                                                        setIsLoadingProductDetails(false);
                                                    }
                                                }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '999px',
                                                    border: 'none',
                                                    background:
                                                        'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                                    color: '#fff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Сохранить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Модалка удаления портфеля */}
                {portfolioToDelete && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1310,
                            padding: '16px',
                        }}
                        onClick={cancelDeletePortfolio}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff',
                                borderRadius: '20px',
                                padding: '24px',
                                maxWidth: '400px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.25)',
                            }}
                        >
                            <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#374151' }}>
                                Удалить портфель «{(portfolioToDelete as any).name ?? (portfolioToDelete as any).portfolio_name ?? portfolioToDelete.id}»?
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={cancelDeletePortfolio} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                                    Отмена
                                </button>
                                <button type="button" onClick={doDeletePortfolio} disabled={isDeletingPortfolio} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>
                                    {isDeletingPortfolio ? 'Удаляем…' : 'Удалить'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модалка создания/редактирования портфеля */}
                {isPortfolioModalOpen && (
                    <div
                        onClick={() => !isSavingPortfolio && setIsPortfolioModalOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1200px, 95vw)',
                                maxHeight: '90vh',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                    {editingPortfolioId != null ? 'Редактирование портфеля' : 'Новый портфель'}
                                </h2>
                                <button type="button" onClick={() => !isSavingPortfolio && setIsPortfolioModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', lineHeight: 1, color: '#6b7280' }}>×</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Название</label>
                                        <input
                                            type="text"
                                            value={portfolioForm.name}
                                            onChange={(e) => setPortfolioForm((prev) => ({ ...prev, name: e.target.value }))}
                                            placeholder="Название портфеля"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Валюта</label>
                                        <input
                                            type="text"
                                            value={portfolioForm.currency}
                                            onChange={(e) => setPortfolioForm((prev) => ({ ...prev, currency: e.target.value }))}
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Срок от (мес)</label>
                                        <input type="number" min={0} value={portfolioForm.term_from_months} onChange={(e) => setPortfolioForm((prev) => ({ ...prev, term_from_months: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Срок до (мес)</label>
                                        <input type="number" min={0} value={portfolioForm.term_to_months} onChange={(e) => setPortfolioForm((prev) => ({ ...prev, term_to_months: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Сумма от</label>
                                        <input type="number" min={0} value={portfolioForm.amount_from} onChange={(e) => setPortfolioForm((prev) => ({ ...prev, amount_from: e.target.value }))} placeholder="—" style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Сумма до</label>
                                        <input type="number" min={0} value={portfolioForm.amount_to} onChange={(e) => setPortfolioForm((prev) => ({ ...prev, amount_to: e.target.value }))} placeholder="—" style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                                    </div>
                                </div>
                                {portfolioClasses && portfolioClasses.length > 0 && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Классы портфеля</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {portfolioClasses.map((cls) => {
                                                const checked = portfolioForm.class_ids.includes(cls.id);
                                                return (
                                                    <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => setPortfolioForm((prev) => ({
                                                                ...prev,
                                                                class_ids: checked ? prev.class_ids.filter((id) => id !== cls.id) : [...prev.class_ids, cls.id],
                                                            }))}
                                                        />
                                                        {cls.name} ({cls.code})
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Риск-профили: табы */}
                                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Риск-профили и инструменты</div>
                                    {portfolioForm.risk_profiles.map((rp, profileIndex) => {
                                        const activeBucket = activeBucketTabByProfile[profileIndex] ?? 'INITIAL_CAPITAL';
                                        const currentInstruments = rp.instruments
                                            .map((inv, idx) => ({ inv, originalIndex: idx }))
                                            .filter(({ inv }) => inv.bucket_type === activeBucket);
                                        const totalPercent = currentInstruments.reduce((s, { inv }) => s + inv.share_percent, 0);
                                        const sumInitial = rp.instruments.filter((i) => i.bucket_type === 'INITIAL_CAPITAL').reduce((s, i) => s + i.share_percent, 0);
                                        const sumTopUpDirect = rp.instruments.filter((i) => i.bucket_type === 'TOP_UP').reduce((s, i) => s + i.share_percent, 0);
                                        const sumTopUp =
                                            rp.instruments.some((i) => i.bucket_type === 'TOP_UP')
                                                ? sumTopUpDirect
                                                : sumInitial;
                                        const donutItems = currentInstruments.map(({ inv }) => ({ name: getProductNameById(inv.product_id), amount: inv.share_percent }));
                                        const COLORS = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50'];
                                        let angle = 0;
                                        const segments = donutItems.map((item, i) => {
                                            const pct = totalPercent > 0 ? (item.amount / totalPercent) * 100 : 0;
                                            const next = angle + pct * 3.6;
                                            const seg = { ...item, color: COLORS[i % COLORS.length], start: angle, end: next };
                                            angle = next;
                                            return seg;
                                        });
                                        const gradientStr = segments.length > 0 ? `conic-gradient(${segments.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')})` : '#e5e7eb';

                                        return (
                                            <div key={rp.profile_type} style={{ marginBottom: '20px', padding: '18px', background: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#6d28d9', marginBottom: '10px' }}>{RISK_PROFILE_LABELS[rp.profile_type]}</div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Объяснение для консультанта / ИИ (почему этот профиль)</label>
                                                    <textarea
                                                        value={rp.explanation}
                                                        onChange={(e) => setPortfolioForm((prev) => {
                                                            const next = { ...prev };
                                                            next.risk_profiles = next.risk_profiles.map((r, i) => i === profileIndex ? { ...r, explanation: e.target.value } : r);
                                                            return next;
                                                        })}
                                                        placeholder="Например: подходит клиентам с низкой толерантностью к риску, приоритет — сохранение капитала."
                                                        rows={2}
                                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px', resize: 'vertical' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '12px' }}>
                                                    <label style={{ display: 'block', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Ожидаемая доходность % (необяз.)</label>
                                                    <input
                                                        type="text"
                                                        value={rp.potential_yield_percent}
                                                        onChange={(e) => setPortfolioForm((prev) => {
                                                            const next = { ...prev };
                                                            next.risk_profiles = next.risk_profiles.map((r, i) => i === profileIndex ? { ...r, potential_yield_percent: e.target.value } : r);
                                                            return next;
                                                        })}
                                                        placeholder="например 8"
                                                        style={{ width: '80px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                                    />
                                                </div>

                                                {/* Переключение: Первоначальный капитал / Пополнение капитала */}
                                                <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '14px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBucketTab(profileIndex, 'INITIAL_CAPITAL')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '10px',
                                                            border: 'none',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: activeBucket === 'INITIAL_CAPITAL' ? 'linear-gradient(135deg, #D946EF, #8B5CF6)' : 'transparent',
                                                            color: activeBucket === 'INITIAL_CAPITAL' ? '#fff' : '#6b7280',
                                                        }}
                                                    >
                                                        Первоначальный капитал
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setBucketTab(profileIndex, 'TOP_UP')}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '10px',
                                                            border: 'none',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            background: activeBucket === 'TOP_UP' ? 'linear-gradient(135deg, #D946EF, #8B5CF6)' : 'transparent',
                                                            color: activeBucket === 'TOP_UP' ? '#fff' : '#6b7280',
                                                        }}
                                                    >
                                                        Пополнение капитала
                                                    </button>
                                                </div>

                                                <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                    <div style={{ flex: '1 1 360px' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                                            {activeBucket === 'INITIAL_CAPITAL' ? 'Инструменты первоначального капитала' : 'Инструменты пополнения'} (продукт + доля %)
                                                        </div>
                                                        {currentInstruments.length === 0 ? (
                                                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0' }}>
                                                                Нет инструментов. Нажмите «+ Добавить» — при создании портфеля пополнение по умолчанию совпадает с первоначальным капиталом.
                                                            </p>
                                                        ) : (
                                                            currentInstruments.map(({ inv, originalIndex }) => (
                                                                <div key={originalIndex} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flexWrap: 'wrap', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                                                    <select
                                                                        value={inv.product_id}
                                                                        onChange={(e) => updateInstrument(profileIndex, originalIndex, 'product_id', Number(e.target.value))}
                                                                        style={{ minWidth: '220px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', background: '#fff' }}
                                                                    >
                                                                        {(products ?? []).map((prod) => (
                                                                            <option key={prod.id} value={prod.id}>{(prod as any).name ?? (prod as any).product_name ?? prod.id}</option>
                                                                        ))}
                                                                    </select>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', minWidth: '0' }}>
                                                                        <input
                                                                            type="range"
                                                                            min={0}
                                                                            max={100}
                                                                            step={PORTFOLIO_SHARE_STEP}
                                                                            value={inv.share_percent}
                                                                            onChange={(e) => updateInstrumentShareWithAutoBalance(profileIndex, originalIndex, Number(e.target.value))}
                                                                            style={{ flex: 1, minWidth: '120px', height: '12px' }}
                                                                        />
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <input
                                                                                type="number"
                                                                                min={0}
                                                                                max={100}
                                                                                step={PORTFOLIO_SHARE_STEP}
                                                                                value={inv.share_percent}
                                                                                onChange={(e) => {
                                                                                    const v = e.target.value === '' ? 0 : Number(e.target.value);
                                                                                    if (!Number.isNaN(v)) updateInstrumentShareWithAutoBalance(profileIndex, originalIndex, v);
                                                                                }}
                                                                                style={{ width: '56px', padding: '8px 6px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}
                                                                            />
                                                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>%</span>
                                                                        </div>
                                                                    </div>
                                                                    <button type="button" onClick={() => removeInstrument(profileIndex, originalIndex)} style={{ padding: '6px 10px', border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                                                </div>
                                                            ))
                                                        )}
                                                        <div style={{ marginTop: '10px' }}>
                                                            {(!products || products.length === 0) && <p style={{ fontSize: '11px', color: '#b91c1c', marginBottom: '6px' }}>Сначала добавьте продукты во вкладке «Продукты».</p>}
                                                            <button
                                                                type="button"
                                                                disabled={!products?.length}
                                                                onClick={() => addInstrument(profileIndex, activeBucket)}
                                                                style={{
                                                                    padding: '8px 14px',
                                                                    borderRadius: '10px',
                                                                    border: '1px dashed #a78bfa',
                                                                    background: products?.length ? '#f5f3ff' : '#f3f4f6',
                                                                    fontSize: '12px',
                                                                    cursor: products?.length ? 'pointer' : 'not-allowed',
                                                                    color: '#6d28d9',
                                                                    opacity: products?.length ? 1 : 0.7,
                                                                }}
                                                            >
                                                                + Добавить
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: '0 0 auto' }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Диаграмма долей</div>
                                                        <div style={{ width: '140px', height: '140px', borderRadius: '50%', background: gradientStr, position: 'relative' }}>
                                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '88px', height: '88px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '11px', color: '#6b7280' }}>Σ</span>
                                                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{totalPercent}%</span>
                                                            </div>
                                                        </div>
                                                        {segments.length > 0 && (
                                                            <div style={{ marginTop: '10px', fontSize: '11px', color: '#6b7280' }}>
                                                                {segments.map((s, i) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                                                                        {s.name}: {s.amount}%
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {rp.instruments.some((i) => i.bucket_type === 'INITIAL_CAPITAL') && (
                                                            <div
                                                                style={{
                                                                    marginTop: '8px',
                                                                    fontSize: '11px',
                                                                    color: Math.abs(sumInitial - 100) <= 0.5 ? '#059669' : '#b91c1c',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Первонач. капитал: {sumInitial}%{' '}
                                                                {Math.abs(sumInitial - 100) <= 0.5 ? '✓' : '(нужно 100%)'}
                                                            </div>
                                                        )}
                                                        {(rp.instruments.some((i) => i.bucket_type === 'TOP_UP') ||
                                                            rp.instruments.some((i) => i.bucket_type === 'INITIAL_CAPITAL')) && (
                                                            <div
                                                                style={{
                                                                    marginTop: '4px',
                                                                    fontSize: '11px',
                                                                    color: Math.abs(sumTopUp - 100) <= 0.5 ? '#059669' : '#b91c1c',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Пополнение: {sumTopUp}%
                                                                {!rp.instruments.some((i) => i.bucket_type === 'TOP_UP') && sumInitial > 0 && (
                                                                    <span style={{ color: '#6b7280', fontWeight: 400 }}> (как у первонач., пока не настроишь)</span>
                                                                )}{' '}
                                                                {Math.abs(sumTopUp - 100) <= 0.5 ? '✓' : '(нужно 100%)'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                <button type="button" onClick={() => !isSavingPortfolio && setIsPortfolioModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Отмена</button>
                                <button type="button" onClick={savePortfolio} disabled={isSavingPortfolio} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #D946EF, #8B5CF6)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: isSavingPortfolio ? 0.7 : 1 }}>{isSavingPortfolio ? 'Сохраняем…' : (editingPortfolioId != null ? 'Сохранить' : 'Создать портфель')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модалка контекста ИИ (мозг) */}
                {brainModalOpen && (
                    <div
                        onClick={() => !savingAiB2c && setBrainModalOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1100px, 95vw)',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                    {editingBrainId != null ? 'Редактировать контекст' : 'Новый контекст (мозг)'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => !savingAiB2c && setBrainModalOpen(false)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', lineHeight: 1, color: '#6b7280' }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); saveBrainContext(); }} style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Название</label>
                                    <input
                                        type="text"
                                        value={brainForm.title}
                                        onChange={(e) => setBrainForm((prev) => ({ ...prev, title: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        placeholder="Напр. Продажи инвестпродуктов"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Содержимое (промпт)</label>
                                    <textarea
                                        value={brainForm.content}
                                        onChange={(e) => setBrainForm((prev) => ({ ...prev, content: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', lineHeight: 1.5, minHeight: '260px', resize: 'vertical' }}
                                        placeholder="Подробный промпт для ассистента..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                        <input
                                            type="checkbox"
                                            checked={brainForm.is_active}
                                            onChange={(e) => setBrainForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        Активен
                                    </label>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#6b7280', marginRight: '6px' }}>Приоритет</label>
                                        <input
                                            type="number"
                                            value={brainForm.priority}
                                            onChange={(e) => setBrainForm((prev) => ({ ...prev, priority: e.target.value }))}
                                            style={{ width: '80px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => !savingAiB2c && setBrainModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Отмена</button>
                                    <button type="submit" disabled={savingAiB2c} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: savingAiB2c ? 0.7 : 1 }}>{savingAiB2c ? 'Сохранение…' : 'Сохранить'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Модалка сценария ИИ */}
                {stageModalOpen && (
                    <div
                        onClick={() => !savingAiB2c && setStageModalOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1300,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1100px, 95vw)',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                    {editingStageId != null ? 'Редактировать сценарий' : 'Новый сценарий (этап)'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => !savingAiB2c && setStageModalOpen(false)}
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px', lineHeight: 1, color: '#6b7280' }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); saveStage(); }} style={{ display: 'grid', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Ключ сценария</label>
                                    <input
                                        type="text"
                                        value={stageForm.stage_key}
                                        onChange={(e) => setStageForm((prev) => ({ ...prev, stage_key: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        placeholder="Напр. PFP1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Название</label>
                                    <input
                                        type="text"
                                        value={stageForm.title}
                                        onChange={(e) => setStageForm((prev) => ({ ...prev, title: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        placeholder="Напр. Первичный сбор данных по клиенту"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Описание / подсказки для ИИ</label>
                                    <textarea
                                        value={stageForm.content}
                                        onChange={(e) => setStageForm((prev) => ({ ...prev, content: e.target.value }))}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '15px', lineHeight: 1.5, minHeight: '300px', resize: 'vertical' }}
                                        placeholder="Описание сценария и подсказки для ИИ..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                        <input
                                            type="checkbox"
                                            checked={stageForm.is_active}
                                            onChange={(e) => setStageForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                                        />
                                        Активен
                                    </label>
                                    <div>
                                        <label style={{ fontSize: '12px', color: '#6b7280', marginRight: '6px' }}>Приоритет</label>
                                        <input
                                            type="number"
                                            value={stageForm.priority}
                                            onChange={(e) => setStageForm((prev) => ({ ...prev, priority: e.target.value }))}
                                            style={{ width: '80px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" onClick={() => !savingAiB2c && setStageModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Отмена</button>
                                    <button type="submit" disabled={savingAiB2c} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: savingAiB2c ? 0.7 : 1 }}>{savingAiB2c ? 'Сохранение…' : 'Сохранить'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SettingsPage;

