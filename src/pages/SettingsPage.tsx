import React, { useEffect, useState, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import Header from '../components/Header';
import { API_BASE_URL } from '../api/config';
import { normalizePdfCoverLayout } from '../utils/pdfCoverLayout';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { extractComonProfitChartPoints, extractComonMetricsView } from '../utils/comonProfitSeries';
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
    type AgentComonStrategyCard,
    type AgentComonStrategyCreatePayload,
    type AgentComonStrategyPatchPayload,
    type ComonApiTrace,
    type ComonRiskProfile,
} from '../api/agentLkApi';

type NavPage = 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings';

interface SettingsPageProps {
    onNavigate: (page: NavPage) => void;
}

type SettingsTab = 'products' | 'portfolios' | 'plans' | 'ai-b2c' | 'report' | 'comon-strategies';

type ReportSubPage = string;

const PDF_SUMMARY_TEMPLATE_ID = 'report_summary_overview';
const PDF_COVER_TEMPLATE_ID = 'report_cover';

/** Дефолтные поля обложки, если в схеме пусто. */
const DEFAULT_PDF_FORM_FIELDS: PdfCoverEditorField[] = [
    { key: 'cover_background_url', type: 'image', label: 'Фон обложки' },
    { key: 'cover_title', type: 'text', label: 'Текст плашки' },
    { key: 'title_band_color', type: 'color', label: 'Цвет плашки' },
    { key: 'date_preview', type: 'readonly', label: 'Дата на обложке' },
];

type PdfEditorTemplateBlock = { id: string; label?: string; fields: PdfCoverEditorField[] };
type ReportEditorTemplateItem = {
    id: string;
    label: string;
    fields: PdfCoverEditorField[];
    pageType: 'SUMMARY' | 'FIN_RESERVE' | 'LIFE' | 'INVESTMENT' | 'OTHER' | null;
};

/** Общие поля брендинга для сводной и страниц целей (shared `summary_*` в PATCH). */
const DEFAULT_BRANDING_SUMMARY_FIELDS: PdfCoverEditorField[] = [
    {
        key: 'summary_background_url',
        type: 'image',
        label: 'Фон страницы',
        upload: { path: 'pdf-settings/summary-background', form_field: 'image', max_size_mb: 8 },
        read_url: { path: 'pdf-settings/summary-background-image' },
        reset: { patch_key: 'summary_background_url' },
    },
    {
        key: 'summary_logo_url',
        type: 'image',
        label: 'Логотип',
        upload: { path: 'pdf-settings/summary-logo', form_field: 'image', max_size_mb: 8 },
        read_url: { path: 'pdf-settings/summary-logo-image' },
        reset: { patch_key: 'summary_logo_url' },
    },
    {
        key: 'summary_chart_color',
        type: 'color',
        label: 'Цвет графиков и акцента',
        reset: { patch_key: 'summary_chart_color' },
    },
    {
        key: 'summary_background_darkness_percent',
        type: 'text',
        label: 'Затемнение фона',
        hint: 'Проценты от 0 до 100; пусто — сброс к значению по умолчанию на бэке.',
        reset: { patch_key: 'summary_background_darkness_percent' },
    },
    {
        key: 'summary_text_color',
        type: 'color',
        label: 'Цвет текста',
        reset: { patch_key: 'summary_text_color' },
    },
    {
        key: 'summary_line_color',
        type: 'color',
        label: 'Цвет линий и бордеров',
        reset: { patch_key: 'summary_line_color' },
    },
    {
        key: 'summary_background_overlay_opacity',
        type: 'text',
        label: 'Прозрачность оверлея',
        hint: 'Число от 0 до 1; пусто — сброс к значению по умолчанию.',
        reset: { patch_key: 'summary_background_overlay_opacity' },
    },
];

const GOAL_REPORT_TEMPLATE_IDS: readonly string[] = [
    'report_fin_reserve',
    'report_life',
    'report_investment',
    'report_other',
];

const FIXED_REPORT_NAV_ORDER: readonly string[] = [
    PDF_COVER_TEMPLATE_ID,
    PDF_SUMMARY_TEMPLATE_ID,
    ...GOAL_REPORT_TEMPLATE_IDS,
];

function isBrandingSummaryTemplateId(id: string): boolean {
    return id === PDF_SUMMARY_TEMPLATE_ID || GOAL_REPORT_TEMPLATE_IDS.includes(id);
}

function resolveReportTemplateFields(id: string, block: PdfEditorTemplateBlock | undefined): PdfCoverEditorField[] {
    if (id === PDF_COVER_TEMPLATE_ID) {
        return block?.fields?.length ? block.fields : DEFAULT_PDF_FORM_FIELDS;
    }
    if (isBrandingSummaryTemplateId(id)) {
        return block?.fields?.length ? block.fields : DEFAULT_BRANDING_SUMMARY_FIELDS;
    }
    return block?.fields?.length ? block.fields : [];
}

function formatPdfUploadError(err: unknown): string {
    const ax = err as {
        response?: { status?: number; data?: { message?: string; error?: string; code?: string } };
    };
    const st = ax?.response?.status;
    const d = ax?.response?.data;
    if (st === 503) {
        const parts = [d?.code, d?.error, d?.message].filter(Boolean);
        return (
            parts.join(' — ') ||
            'Хранилище недоступно (503). Проверьте R2, публичный URL или настройки STORAGE_REQUIRE_R2.'
        );
    }
    if (st === 400) {
        return d?.message || d?.error || 'Файл не подходит (тип или размер).';
    }
    return 'Не удалось загрузить файл.';
}

function acceptMimeToInputAccept(mimes: string[] | undefined): string {
    if (!mimes?.length) return 'image/jpeg,image/png,image/webp';
    return mimes.join(',');
}

function parsePdfEditorFieldItem(item: unknown): PdfCoverEditorField | null {
    if (!item || typeof item !== 'object') return null;
    const obj = item as Record<string, unknown>;
    const type = obj.type;
    const patchKey = typeof obj.patch_key === 'string' ? obj.patch_key : null;
    const id = typeof obj.id === 'string' ? obj.id : null;
    const legacyKey = typeof obj.key === 'string' ? obj.key : null;
    const key = patchKey || legacyKey || id;
    if (!key || typeof type !== 'string') return null;
    if (!['image', 'text', 'color', 'readonly'].includes(type)) return null;
    const value_key = typeof obj.value_key === 'string' ? obj.value_key : undefined;

    let upload: PdfCoverEditorField['upload'];
    const ur = obj.upload;
    if (ur && typeof ur === 'object') {
        const u = ur as Record<string, unknown>;
        const am = u.accept_mime;
        upload = {
            path: typeof u.path === 'string' ? u.path : undefined,
            form_field: typeof u.form_field === 'string' ? u.form_field : undefined,
            max_size_mb: typeof u.max_size_mb === 'number' ? u.max_size_mb : undefined,
            accept_mime: Array.isArray(am) ? am.filter((x): x is string => typeof x === 'string') : undefined,
        };
    }

    let read_url: PdfCoverEditorField['read_url'];
    const rr = obj.read_url;
    if (rr && typeof rr === 'object') {
        const r = rr as Record<string, unknown>;
        read_url = {
            path: typeof r.path === 'string' ? r.path : undefined,
        };
    }

    let reset: PdfCoverEditorField['reset'];
    const rs = obj.reset;
    if (rs && typeof rs === 'object') {
        const r = rs as Record<string, unknown>;
        reset = {
            patch_key: typeof r.patch_key === 'string' ? r.patch_key : undefined,
        };
    }

    return {
        key,
        type: type as PdfCoverEditorField['type'],
        label: typeof obj.label === 'string' ? obj.label : undefined,
        hint: typeof obj.hint === 'string' ? obj.hint : undefined,
        value_key,
        upload,
        read_url,
        reset,
    };
}

function parsePdfFieldsArray(raw: unknown[]): PdfCoverEditorField[] {
    const out: PdfCoverEditorField[] = [];
    for (const item of raw) {
        const f = parsePdfEditorFieldItem(item);
        if (f) out.push(f);
    }
    return out;
}

function pdfEditorTemplatesFromSchema(schema: unknown): PdfEditorTemplateBlock[] {
    if (!schema || typeof schema !== 'object') return [];
    const s = schema as Record<string, unknown>;
    if (Array.isArray(s.templates)) {
        const blocks: PdfEditorTemplateBlock[] = [];
        for (const t of s.templates) {
            if (!t || typeof t !== 'object') continue;
            const o = t as Record<string, unknown>;
            const id =
                (typeof o.id === 'string' && o.id) ||
                (typeof o.template === 'string' && o.template) ||
                (typeof o.template_id === 'string' && o.template_id) ||
                '';
            if (!id) continue;
            const label =
                (typeof o.label === 'string' && o.label) ||
                (typeof o.title === 'string' && o.title) ||
                undefined;
            const fields = Array.isArray(o.fields) ? parsePdfFieldsArray(o.fields as unknown[]) : [];
            blocks.push({ id, label, fields });
        }
        return blocks;
    }
    if (Array.isArray(s.fields)) {
        return [{ id: PDF_COVER_TEMPLATE_ID, label: 'Обложка', fields: parsePdfFieldsArray(s.fields as unknown[]) }];
    }
    return [];
}

function reportTemplateLabelById(id: string): string {
    switch (id) {
        case PDF_COVER_TEMPLATE_ID:
            return 'Обложка PDF';
        case PDF_SUMMARY_TEMPLATE_ID:
            return 'Сводная информация';
        case 'report_fin_reserve':
            return 'Финансовый резерв';
        case 'report_life':
            return 'Защита жизни';
        case 'report_investment':
            return 'Сохранить и приумножить';
        case 'report_other':
            return 'Прочая цель';
        default:
            return id;
    }
}

function reportTemplatePageTypeById(id: string): ReportEditorTemplateItem['pageType'] {
    switch (id) {
        case PDF_SUMMARY_TEMPLATE_ID:
            return 'SUMMARY';
        case 'report_fin_reserve':
            return 'FIN_RESERVE';
        case 'report_life':
            return 'LIFE';
        case 'report_investment':
            return 'INVESTMENT';
        case 'report_other':
            return 'OTHER';
        default:
            return null;
    }
}

function reportTemplatesFromSchema(schema: unknown): ReportEditorTemplateItem[] {
    const blocks = pdfEditorTemplatesFromSchema(schema);
    if (!blocks.length) {
        return [
            {
                id: PDF_COVER_TEMPLATE_ID,
                label: reportTemplateLabelById(PDF_COVER_TEMPLATE_ID),
                fields: DEFAULT_PDF_FORM_FIELDS,
                pageType: null,
            },
            {
                id: PDF_SUMMARY_TEMPLATE_ID,
                label: reportTemplateLabelById(PDF_SUMMARY_TEMPLATE_ID),
                fields: DEFAULT_BRANDING_SUMMARY_FIELDS,
                pageType: 'SUMMARY',
            },
            ...GOAL_REPORT_TEMPLATE_IDS.map((gid) => ({
                id: gid,
                label: reportTemplateLabelById(gid),
                fields: DEFAULT_BRANDING_SUMMARY_FIELDS,
                pageType: reportTemplatePageTypeById(gid),
            })),
        ];
    }
    const map = new Map<string, PdfEditorTemplateBlock>();
    for (const b of blocks) map.set(b.id, b);

    const orderedIds = [...FIXED_REPORT_NAV_ORDER];
    const rest = blocks.map((b) => b.id).filter((id) => !orderedIds.includes(id));
    const allIds = [...orderedIds, ...rest];

    return allIds.map((id) => {
        const block = map.get(id);
        return {
            id,
            label: block?.label || reportTemplateLabelById(id),
            fields: resolveReportTemplateFields(id, block),
            pageType: reportTemplatePageTypeById(id),
        };
    });
}

/** Поля одного логического шаблона из editor_schema (или дефолты ЛК). */
function pdfFormFieldsForTemplate(schema: unknown, templateId: string): PdfCoverEditorField[] {
    const blocks = pdfEditorTemplatesFromSchema(schema);
    const hit = blocks.find((b) => b.id === templateId);
    if (hit?.fields.length) return hit.fields;
    if (templateId === PDF_COVER_TEMPLATE_ID && blocks[0]?.fields.length) return blocks[0].fields;
    return resolveReportTemplateFields(templateId, hit);
}

function resolveAgentLkAssetUrl(url: string | null | undefined): string | null {
    if (url == null || String(url).trim() === '') return null;
    const u = String(url).trim();
    if (u.startsWith('//')) {
        if (typeof window !== 'undefined' && window.location?.protocol) {
            return `${window.location.protocol}${u}`;
        }
        return `https:${u}`;
    }
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `${API_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Какие поля пробуем для ссылки на картинку (бэк ≠ всегда `public_url`). */
const PDF_GOAL_CARD_IMAGE_URL_KEYS = [
    'public_url',
    'publicUrl',
    'url',
    'image_url',
    'imageUrl',
    'cdn_url',
    'cdnUrl',
    'href',
] as const;

function pickGoalCardImageRaw(card: Record<string, unknown>): string | null {
    for (const k of PDF_GOAL_CARD_IMAGE_URL_KEYS) {
        const v = card[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
}

function resolveGoalCardImgSrc(card: Record<string, unknown>): string | null {
    return resolveAgentLkAssetUrl(pickGoalCardImageRaw(card));
}

function goalCardTypeLabel(card: Record<string, unknown>): string {
    const gt = card.goal_type ?? card.goalType;
    return typeof gt === 'string' && gt.trim() ? gt.trim() : '—';
}

function goalCardFilename(card: Record<string, unknown>): string {
    const fn = card.filename ?? card.fileName;
    return typeof fn === 'string' ? fn : '';
}

/**
 * Манифест целей с бэка: snake_case / camelCase, `cards` или `items`.
 */
function normalizePdfGoalCardManifest(
    settings: PdfCoverSettingsResponse | null
): { hint?: string; cards: Record<string, unknown>[] } | null {
    if (!settings) return null;
    const r = settings as unknown as Record<string, unknown>;
    const raw = r.goal_card_assets ?? r.goalCardAssets;
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    let list: unknown = o.cards;
    if (!Array.isArray(list) && Array.isArray(o.items)) list = o.items;
    if (!Array.isArray(list) && list && typeof list === 'object') {
        list = Object.values(list as Record<string, unknown>);
    }
    if (!Array.isArray(list)) return null;
    const cards = list.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object');
    return {
        hint: typeof o.hint === 'string' ? o.hint : undefined,
        cards,
    };
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

/** Как в макете Figma «Отчёт» / дефолт бэка. */
const DEFAULT_COVER_TITLE_TEXT = 'персональное финансовое решение';

function pdfFormFieldsFromSchema(schema: unknown): PdfCoverEditorField[] {
    return pdfFormFieldsForTemplate(schema, PDF_COVER_TEMPLATE_ID);
}

/** Строковые дефолты из `editor_schema.defaults` (тот же GET, что и схема полей). */
function pdfStringDefaultsFromEditorSchema(schema: unknown): Record<string, string> {
    if (!schema || typeof schema !== 'object') return {};
    const raw = (schema as Record<string, unknown>).defaults;
    if (!raw || typeof raw !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
        if (v === null || v === undefined) continue;
        out[k] = typeof v === 'string' ? v : String(v);
    }
    return out;
}

function buildPdfDraftFromPdfResponse(res: PdfCoverSettingsResponse): Record<string, string> {
    const def = pdfStringDefaultsFromEditorSchema(res.editor_schema);
    const out: Record<string, string> = { ...def };
    for (const [k, v] of Object.entries(res as unknown as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            out[k] = String(v);
        }
    }
    return out;
}

const HEX6_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

function parseNumericField(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return n;
}

function validatePdfFieldValue(field: PdfCoverEditorField, value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (field.type === 'color' && !HEX6_COLOR_RE.test(trimmed)) {
        return `Поле «${field.label ?? field.key}»: нужен формат #RRGGBB.`;
    }
    if (field.key === 'summary_background_darkness_percent') {
        const n = parseNumericField(trimmed);
        if (n == null || n < 0 || n > 100) {
            return 'Степень затемнения фона должна быть числом от 0 до 100.';
        }
    }
    if (field.key === 'summary_background_overlay_opacity') {
        const n = parseNumericField(trimmed);
        if (n == null || n < 0 || n > 1) {
            return 'Прозрачность оверлея должна быть числом от 0 до 1.';
        }
    }
    return null;
}

const RISK_PROFILE_TYPES: Array<'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'> = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
const RISK_PROFILE_LABELS: Record<string, string> = {
    CONSERVATIVE: 'Консервативный',
    BALANCED: 'Сбалансированный',
    AGGRESSIVE: 'Агрессивный',
};

const COMON_RISK_LABELS: Record<string, string> = {
    conservative: 'Консервативный',
    balanced: 'Сбалансированный',
    aggressive: 'Агрессивный',
};

const COMON_SHOW_CHART = {
    primary: '#9333EA',
    gradientStart: '#D946EF',
    gradientEnd: '#C4B5FD',
    grid: '#E5E7EB',
    text: '#6B7280',
};

const COMON_PIE_COLORS = ['#D946EF', '#8B5CF6', '#A855F7', '#6366F1'];

function formatComonChartAxisDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr.length > 14 ? `${dateStr.slice(0, 10)}…` : dateStr;
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatComonMetricCell(key: string, v: unknown): string {
    if (v == null || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'да' : 'нет';
    if (typeof v === 'number') {
        const k = key.toLowerCase();
        if (k.includes('pct') || k.endsWith('_pct') || k.includes('percent')) {
            return `${v.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}%`;
        }
        return v.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    }
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

type ComonFormState = {
    comon_url: string;
    name: string;
    risk_profile: ComonRiskProfile;
    min_contribution: string;
    description: string;
    portfolio: [{ instrument: string; share_percent: string }, { instrument: string; share_percent: string }];
};

function getEmptyComonForm(): ComonFormState {
    return {
        comon_url: '',
        name: '',
        risk_profile: 'balanced',
        min_contribution: '',
        description: '',
        portfolio: [
            { instrument: '', share_percent: '50' },
            { instrument: '', share_percent: '50' },
        ],
    };
}

function cardToComonForm(card: AgentComonStrategyCard): ComonFormState {
    const rp = (card.risk_profile as ComonRiskProfile) || 'balanced';
    const safeRp: ComonRiskProfile =
        rp === 'conservative' || rp === 'balanced' || rp === 'aggressive' ? rp : 'balanced';
    const p = card.portfolio;
    const row = (i: number) => ({
        instrument: (p?.[i]?.instrument as string) || '',
        share_percent: p?.[i]?.share_percent != null ? String(p[i].share_percent) : i === 0 ? '50' : '50',
    });
    return {
        comon_url: String(card.comon_url ?? ''),
        name: String(card.name ?? ''),
        risk_profile: safeRp,
        min_contribution: card.min_contribution != null && !Number.isNaN(Number(card.min_contribution))
            ? String(card.min_contribution)
            : '',
        description: String(card.description ?? ''),
        portfolio: [row(0), row(1)],
    };
}

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

/** Запасной размер, пока не измерили реальный документ в iframe. */
const PDF_SUMMARY_PREVIEW_BASE_W = 794;
const PDF_SUMMARY_PREVIEW_BASE_H = 1123;

const LK_SUMMARY_PREVIEW_STYLE_ID = 'lk-summary-preview-fit';

/**
 * В превью ЛК документ с бэка часто: широкий body с фоном, узкая «страница» у левого края → справа чёрная полоса.
 * Лёгкая правка раскладки только для srcdoc-превью (id стиля фиксированный, повторно не дублируем).
 */
function injectSummaryPreviewLayoutFix(doc: Document | null | undefined): void {
    if (!doc?.head) return;
    if (doc.getElementById(LK_SUMMARY_PREVIEW_STYLE_ID)) return;
    const el = doc.createElement('style');
    el.id = LK_SUMMARY_PREVIEW_STYLE_ID;
    el.textContent = `
html { margin: 0 !important; }
body {
  margin: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: flex-start !important;
  box-sizing: border-box !important;
}
`;
    doc.head.appendChild(el);
}

/** Превью одной карточки цели: R2/CDN часто режут по Referer — no-referrer; onError — подсказка. */
const PdfGoalCardThumb: React.FC<{
    cardKey: string;
    src: string | null;
    /** Для aria и отладки */
    typeLabel: string;
}> = ({ cardKey, src, typeLabel }) => {
    const [broken, setBroken] = useState(false);
    useEffect(() => {
        setBroken(false);
    }, [src, cardKey]);
    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 72,
                background: '#f3f4f6',
            }}
        >
            {!src ? (
                <span
                    style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        textAlign: 'center',
                        padding: '8px',
                        lineHeight: 1.35,
                    }}
                >
                    Нет ссылки в ответе
                    <br />
                    (ожидали public_url / url)
                </span>
            ) : broken ? (
                <span
                    style={{
                        fontSize: '10px',
                        color: '#b45309',
                        textAlign: 'center',
                        padding: '8px',
                        lineHeight: 1.35,
                    }}
                >
                    Не загрузилось
                    <br />
                    <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{src.slice(0, 72)}…</span>
                </span>
            ) : (
                // eslint-disable-next-line jsx-a11y/alt-text -- подпись типа снизу
                <img
                    key={cardKey}
                    src={src}
                    alt=""
                    aria-label={typeLabel}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                        // Чтобы быстро понять "почему не грузится" (Referer/CDN/public_url=null/signed-url expiry)
                        // достаточно открыть DevTools Console и увидеть src + тип карточки.
                        // eslint-disable-next-line no-console
                        console.warn('goal_card_assets img failed', { src, typeLabel, cardKey, eventType: e?.type });
                        setBroken(true);
                    }}
                    style={{
                        maxWidth: '100%',
                        maxHeight: 88,
                        objectFit: 'contain',
                        display: 'block',
                    }}
                />
            )}
        </div>
    );
};

/**
 * Превью HTML сводной: после load меряем scrollWidth/scrollHeight документа в iframe,
 * подгоняем размер iframe под весь контент (без внутренних скроллбаров), снаружи — scale в рамку.
 * Иначе при фиксированных 794×1123 внутри остаётся overflow → полосы прокрутки даже при внешнем scale.
 */
const SummaryHtmlPreview: React.FC<{
    html: string | null;
    loading: boolean;
    /** modal — 1:1 размер документа, без scale; скролл у пользователя */
    variant?: 'inline' | 'modal';
}> = ({ html, loading, variant = 'inline' }) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [intrinsic, setIntrinsic] = useState({
        w: PDF_SUMMARY_PREVIEW_BASE_W,
        h: PDF_SUMMARY_PREVIEW_BASE_H,
    });
    const [layoutScale, setLayoutScale] = useState(0.4);

    const measureAndFit = useCallback(() => {
        const box = boxRef.current;
        const iframe = iframeRef.current;
        if (!box || !iframe) return;

        let iw = PDF_SUMMARY_PREVIEW_BASE_W;
        let ih = PDF_SUMMARY_PREVIEW_BASE_H;

        try {
            const doc = iframe.contentDocument;
            if (doc?.documentElement) {
                injectSummaryPreviewLayoutFix(doc);
                const root = doc.documentElement;
                const body = doc.body;
                iw = Math.ceil(
                    Math.max(
                        root.scrollWidth,
                        body?.scrollWidth ?? 0,
                        PDF_SUMMARY_PREVIEW_BASE_W,
                    ) + 2,
                );
                ih = Math.ceil(
                    Math.max(
                        root.scrollHeight,
                        body?.scrollHeight ?? 0,
                        PDF_SUMMARY_PREVIEW_BASE_H,
                    ) + 2,
                );
            }
        } catch {
            /* sandbox / политика — остаёмся на базовых размерах */
        }

        setIntrinsic({ w: iw, h: ih });

        let cw = Math.max(1, box.clientWidth || iw);
        try {
            const cs = typeof window !== 'undefined' ? window.getComputedStyle(box) : null;
            if (cs) {
                const pl = parseFloat(cs.paddingLeft) || 0;
                const pr = parseFloat(cs.paddingRight) || 0;
                cw = Math.max(1, box.clientWidth - pl - pr);
            }
        } catch {
            /* ignore */
        }

        if (variant === 'modal') {
            /** В модалке — без уменьшения: натуральный размер HTML (как отдал бэк), скроллит сам агент. */
            setLayoutScale(1);
            return;
        }

        const maxH = Math.min(580, typeof window !== 'undefined' ? window.innerHeight * 0.52 : 580);
        const scaleW = cw / iw;
        const scaleH = maxH / ih;
        /** Сначала тянем по ширине карточки — иначе длинная A4 даёт крошечную колонку и чёрные поля по бокам. */
        let s = ih * scaleW <= maxH ? scaleW : scaleH;
        s = Math.min(Math.max(s, 0.2), 1);
        setLayoutScale(s);
    }, [variant]);

    useLayoutEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const ro = new ResizeObserver(() => measureAndFit());
        ro.observe(box);
        window.addEventListener('resize', measureAndFit);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measureAndFit);
        };
    }, [measureAndFit, html, variant]);

    useEffect(() => {
        if (!html) return;
        setIntrinsic({ w: PDF_SUMMARY_PREVIEW_BASE_W, h: PDF_SUMMARY_PREVIEW_BASE_H });
    }, [html, variant]);

    const onIframeLoad = () => {
        const run = () => measureAndFit();
        requestAnimationFrame(() => requestAnimationFrame(run));
        window.setTimeout(run, 100);
        window.setTimeout(run, 350);
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: 14,
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '1px dashed #e5e7eb',
                }}
            >
                Грузим превью…
            </div>
        );
    }
    if (!html) {
        return (
            <div
                style={{
                    padding: '24px 16px',
                    color: '#6b7280',
                    fontSize: 14,
                    background: '#f9fafb',
                    borderRadius: 12,
                    border: '1px dashed #e5e7eb',
                    textAlign: 'center',
                }}
            >
                Превью недоступно — проверь эндпоинт{' '}
                <code style={{ fontSize: 12 }}>summary-preview-html</code>.
            </div>
        );
    }

    const isModal = variant === 'modal';
    const clipW = intrinsic.w * layoutScale;
    const clipH = intrinsic.h * layoutScale;

    return (
        <div
            ref={boxRef}
            style={{
                width: '100%',
                borderRadius: 12,
                background: 'linear-gradient(180deg, #eef0f4 0%, #e8eaef 100%)',
                border: '1px solid #e2e5eb',
                padding: isModal ? '12px 10px' : '14px 12px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: isModal ? 'flex-start' : 'center',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    position: isModal ? 'static' : 'relative',
                    width: clipW,
                    height: clipH,
                    maxWidth: isModal ? 'none' : '100%',
                    overflow: isModal ? 'visible' : 'hidden',
                    borderRadius: 10,
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.1)',
                    background: 'transparent',
                }}
            >
                <iframe
                    ref={iframeRef}
                    title="Превью сводной страницы PDF"
                    srcDoc={html}
                    onLoad={onIframeLoad}
                    style={{
                        position: isModal ? 'static' : 'absolute',
                        left: isModal ? undefined : 0,
                        top: isModal ? undefined : 0,
                        width: intrinsic.w,
                        height: intrinsic.h,
                        border: 'none',
                        margin: 0,
                        padding: 0,
                        display: 'block',
                        transform: isModal ? 'none' : `scale(${layoutScale})`,
                        transformOrigin: 'top left',
                        pointerEvents: isModal ? 'auto' : 'none',
                    }}
                />
            </div>
        </div>
    );
};

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

    const [reportSubPage, setReportSubPage] = useState<ReportSubPage>(PDF_COVER_TEMPLATE_ID);
    const [pdfSettings, setPdfSettings] = useState<PdfCoverSettingsResponse | null>(null);
    const [pdfDraft, setPdfDraft] = useState<Record<string, string>>({
        cover_title: '',
        title_band_color: '',
        cover_background_url: '',
        summary_chart_color: '',
        summary_background_url: '',
        summary_logo_url: '',
        summary_background_darkness_percent: '',
        summary_background_overlay_opacity: '',
        summary_text_color: '',
        summary_line_color: '',
    });
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfSaving, setPdfSaving] = useState(false);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfSummaryUploadKey, setPdfSummaryUploadKey] = useState<string | null>(null);
    const [pdfError, setPdfError] = useState<string | null>(null);
    /** Превью фона: data:… (скачали и встроили) или в конце прямой https для img. */
    const [pdfCoverPreviewUrl, setPdfCoverPreviewUrl] = useState<string | null>(null);
    /** Превью картинок сводной через GET *-image (url из JSON, не сырой storage URL). */
    const [pdfImageThumbByKey, setPdfImageThumbByKey] = useState<Record<string, string | null>>({});
    const [summaryPreviewHtml, setSummaryPreviewHtml] = useState<string | null>(null);
    const [summaryPreviewLoading, setSummaryPreviewLoading] = useState(false);
    const [summaryPreviewModalOpen, setSummaryPreviewModalOpen] = useState(false);

    const pdfGoalCardsManifest = useMemo(() => normalizePdfGoalCardManifest(pdfSettings), [pdfSettings]);
    const reportTemplateItems = useMemo(
        () => reportTemplatesFromSchema(pdfSettings?.editor_schema),
        [pdfSettings?.editor_schema]
    );
    const activeReportTemplate = useMemo(
        () => reportTemplateItems.find((x) => x.id === reportSubPage) ?? reportTemplateItems[0] ?? null,
        [reportSubPage, reportTemplateItems]
    );

    useEffect(() => {
        if (!reportTemplateItems.length) return;
        if (!reportTemplateItems.some((x) => x.id === reportSubPage)) {
            setReportSubPage(reportTemplateItems[0].id);
        }
    }, [reportSubPage, reportTemplateItems]);

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
            case 'comon-strategies':
                return 'Автоследование';
            default:
                return tab;
        }
    };

    const tabs: SettingsTab[] = ['products', 'portfolios', 'plans', 'ai-b2c', 'report', 'comon-strategies'];

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
        if (activeTab !== 'report') return;
        const load = async () => {
            try {
                setPdfLoading(true);
                setPdfError(null);
                const res = await agentLkApi.getPdfCoverSettings();
                setPdfSettings(res);
                setPdfDraft(buildPdfDraftFromPdfResponse(res));
            } catch (e) {
                console.error('Failed to load PDF settings:', e);
                setPdfError('Не удалось загрузить настройки PDF-отчёта. Нужен JWT с agent_id и доступ к API.');
                setPdfSettings(null);
            } finally {
                setPdfLoading(false);
            }
        };
        void load();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'report' || reportSubPage !== PDF_COVER_TEMPLATE_ID) {
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
                const src = await agentLkApi.getPdfCoverImageForPreview();
                if (cancelled) return;
                if (src.startsWith('data:')) {
                    dataUrl = src;
                } else if (/^https?:\/\//i.test(src)) {
                    try {
                        const blob = await agentLkApi.fetchImageBlobFromPublicUrl(src);
                        dataUrl = await blobToDataUrl(blob);
                    } catch {
                        setPdfCoverPreviewUrl(src);
                        return;
                    }
                } else {
                    dataUrl = src;
                }
            } catch (e) {
                console.warn('[pdf-cover preview] cover-image (JSON/url/blob) →', e);
            }
            if (!dataUrl) {
                try {
                    const blob = await agentLkApi.getPdfCoverImageBlob();
                    if (cancelled) return;
                    dataUrl = await blobToDataUrl(blob);
                } catch (e2) {
                    console.warn('[pdf-cover preview] axios blob →', e2);
                }
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

    useEffect(() => {
        const pageType = activeReportTemplate?.pageType;
        if (activeTab !== 'report' || !pageType || !pdfSettings || pdfLoading) {
            setSummaryPreviewHtml(null);
            setSummaryPreviewLoading(false);
            return;
        }
        let cancelled = false;
        setSummaryPreviewLoading(true);
        (async () => {
            try {
                const html = await agentLkApi.getPdfPagePreviewHtml(pageType);
                if (!cancelled) setSummaryPreviewHtml(html);
            } catch (e) {
                console.warn('[pdf-page preview html]', e);
                if (!cancelled) setSummaryPreviewHtml(null);
            } finally {
                if (!cancelled) setSummaryPreviewLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [activeTab, activeReportTemplate, pdfLoading, pdfSettings, reportSubPage]);

    useEffect(() => {
        if (activeTab !== 'report' || !activeReportTemplate || !pdfSettings || pdfLoading) {
            setPdfImageThumbByKey({});
            return;
        }
        const imageFields = activeReportTemplate.fields.filter((x) => x.type === 'image');
        if (!imageFields.length) {
            setPdfImageThumbByKey({});
            return;
        }
        let cancelled = false;
        (async () => {
            const next: Record<string, string | null> = {};
            for (const field of imageFields) {
                const fallbackReadPath =
                    field.key === 'summary_background_url'
                        ? 'pdf-settings/summary-background-image'
                        : field.key === 'summary_logo_url'
                          ? 'pdf-settings/summary-logo-image'
                          : null;
                const readPath = field.read_url?.path ?? fallbackReadPath;
                if (!readPath) {
                    next[field.key] = null;
                    continue;
                }
                try {
                    const meta = await agentLkApi.getPdfSettingsImageReadMeta(readPath);
                    next[field.key] = meta?.url ?? null;
                } catch {
                    next[field.key] = null;
                }
            }
            if (!cancelled) setPdfImageThumbByKey(next);
        })();
        return () => {
            cancelled = true;
        };
    }, [activeTab, activeReportTemplate, pdfLoading, pdfSettings, reportSubPage]);

    useEffect(() => {
        if (!summaryPreviewModalOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSummaryPreviewModalOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [summaryPreviewModalOpen]);

    useEffect(() => {
        if (activeTab !== 'report' || !activeReportTemplate?.pageType) {
            setSummaryPreviewModalOpen(false);
        }
    }, [activeTab, activeReportTemplate, reportSubPage]);

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

    const [comonStrategies, setComonStrategies] = useState<AgentComonStrategyCard[] | null>(null);
    const [comonRiskProfiles, setComonRiskProfiles] = useState<string[]>(['conservative', 'balanced', 'aggressive']);
    const [comonLoading, setComonLoading] = useState(false);
    const [comonError, setComonError] = useState<string | null>(null);
    const [comonApiTrace, setComonApiTrace] = useState<ComonApiTrace | null>(null);
    const [comonModalOpen, setComonModalOpen] = useState(false);
    const [editingComonId, setEditingComonId] = useState<number | string | null>(null);
    const [comonForm, setComonForm] = useState<ComonFormState>(() => getEmptyComonForm());
    const [comonSaving, setComonSaving] = useState(false);
    const [comonResolving, setComonResolving] = useState(false);
    const [deletingComonId, setDeletingComonId] = useState<string | null>(null);
    const [comonShowOpen, setComonShowOpen] = useState(false);
    const [comonShowCard, setComonShowCard] = useState<AgentComonStrategyCard | null>(null);
    const [comonShowProfitPayload, setComonShowProfitPayload] = useState<unknown>(null);
    const [comonShowMetricsPayload, setComonShowMetricsPayload] = useState<unknown>(null);
    const [comonShowLoading, setComonShowLoading] = useState(false);
    const [comonShowError, setComonShowError] = useState<string | null>(null);

    const comonShowChartPoints = useMemo(
        () => extractComonProfitChartPoints(comonShowProfitPayload),
        [comonShowProfitPayload],
    );

    const comonShowMetricsView = useMemo(
        () => extractComonMetricsView(comonShowMetricsPayload),
        [comonShowMetricsPayload],
    );

    const comonShowPieData = useMemo(() => {
        if (!comonShowCard?.portfolio?.length) return [];
        return comonShowCard.portfolio.map((item, i) => ({
            name: String(item.instrument || `Инструмент ${i + 1}`),
            value: Math.max(0, Number(item.share_percent) || 0),
        }));
    }, [comonShowCard]);

    useEffect(() => {
        if (!comonShowOpen || !comonShowCard) return;
        const id = comonShowCard.id;
        let cancelled = false;
        setComonShowLoading(true);
        setComonShowError(null);
        setComonShowProfitPayload(null);
        setComonShowMetricsPayload(null);

        void (async () => {
            const [pr, mr] = await Promise.all([
                agentLkApi.getComonStrategyProfit(id),
                agentLkApi.getComonStrategyProfitMetrics(id),
            ]);
            if (cancelled) return;
            setComonShowLoading(false);
            if (pr.ok) setComonShowProfitPayload(pr.payload);
            if (mr.ok) setComonShowMetricsPayload(mr.payload);
            const missing: string[] = [];
            if (!pr.ok) missing.push('ряд доходности (график)');
            if (!mr.ok) missing.push('метрики');
            if (missing.length === 2) {
                setComonShowError(
                    'Не загрузили ни график, ни метрики — проверь бэкенд и доступность Comon (часто 502).',
                );
            } else if (missing.length === 1) {
                setComonShowError(`Загрузилось не всё: нет ${missing[0]}.`);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [comonShowOpen, comonShowCard?.id]);

    useEffect(() => {
        if (activeTab !== 'comon-strategies') return;
        const load = async () => {
            setComonLoading(true);
            setComonError(null);
            const result = await agentLkApi.listComonStrategies();
            setComonApiTrace(result.trace);
            if (!result.ok) {
                setComonStrategies(null);
                setComonError('Не удалось загрузить стратегии. Проверьте авторизацию и API.');
            } else {
                setComonStrategies(result.strategies);
                setComonRiskProfiles(result.riskProfiles);
            }
            setComonLoading(false);
        };
        void load();
    }, [activeTab]);

    const openComonCreate = () => {
        setEditingComonId(null);
        setComonForm(getEmptyComonForm());
        setComonError(null);
        setComonModalOpen(true);
    };

    const openComonEdit = (card: AgentComonStrategyCard) => {
        setEditingComonId(card.id);
        setComonForm(cardToComonForm(card));
        setComonError(null);
        setComonModalOpen(true);
    };

    const buildComonPayloadFromForm = (): AgentComonStrategyCreatePayload | null => {
        const url = comonForm.comon_url.trim();
        const name = comonForm.name.trim();
        if (!url || !name) {
            setComonError('Заполни ссылку на Comon и название карточки.');
            return null;
        }
        const ins0 = comonForm.portfolio[0].instrument.trim();
        const ins1 = comonForm.portfolio[1].instrument.trim();
        if (!ins0 || !ins1) {
            setComonError('Оба инструмента в портфеле обязательны.');
            return null;
        }
        const s0 = Number(comonForm.portfolio[0].share_percent);
        const s1 = Number(comonForm.portfolio[1].share_percent);
        if (Number.isNaN(s0) || Number.isNaN(s1)) {
            setComonError('Доли портфеля должны быть числами.');
            return null;
        }
        const minRaw = comonForm.min_contribution.trim();
        const min_contribution =
            minRaw === '' ? undefined : Number(minRaw);
        if (min_contribution !== undefined && Number.isNaN(min_contribution)) {
            setComonError('Мин. сумма — число или пусто.');
            return null;
        }
        const desc = comonForm.description.trim();
        const payload: AgentComonStrategyCreatePayload = {
            comon_url: url,
            name,
            risk_profile: comonForm.risk_profile,
            portfolio: [
                { instrument: ins0, share_percent: s0 },
                { instrument: ins1, share_percent: s1 },
            ],
        };
        if (min_contribution !== undefined) payload.min_contribution = min_contribution;
        if (desc) payload.description = desc;
        return payload;
    };

    const submitComonStrategy = async () => {
        const payload = buildComonPayloadFromForm();
        if (!payload) return;
        setComonSaving(true);
        setComonError(null);
        try {
            if (editingComonId == null) {
                const result = await agentLkApi.createComonStrategy(payload);
                setComonApiTrace(result.trace);
                if (!result.ok) {
                    const st = result.trace.status;
                    if (st === 409) setComonError('Эта стратегия уже в списке.');
                    else if (st === 502) setComonError('Comon не ответил. Попробуй позже.');
                    else setComonError('Не удалось создать карточку. Смотри ответ ниже.');
                    return;
                }
                setComonStrategies((prev) => (prev ? [result.card, ...prev] : [result.card]));
            } else {
                const patch: AgentComonStrategyPatchPayload = { ...payload };
                const result = await agentLkApi.updateComonStrategy(editingComonId, patch);
                setComonApiTrace(result.trace);
                if (!result.ok) {
                    const st = result.trace.status;
                    if (st === 409) setComonError('Конфликт: такая стратегия Comon уже привязана.');
                    else if (st === 502) setComonError('Comon не ответил.');
                    else setComonError('Не удалось сохранить. Смотри ответ ниже.');
                    return;
                }
                setComonStrategies((prev) =>
                    prev ? prev.map((c) => (String(c.id) === String(editingComonId) ? result.card : c)) : [result.card],
                );
            }
            setComonModalOpen(false);
            setEditingComonId(null);
            setComonForm(getEmptyComonForm());
        } finally {
            setComonSaving(false);
        }
    };

    const resolveComonLink = async () => {
        const link = comonForm.comon_url.trim();
        if (!link) {
            setComonError('Вставь ссылку на страницу стратегии Comon.');
            return;
        }
        setComonResolving(true);
        setComonError(null);
        const result = await agentLkApi.resolveComonStrategyUrl({ url: link });
        setComonApiTrace(result.trace);
        setComonResolving(false);
        if (!result.ok) {
            setComonError('Не удалось разобрать ссылку (400/502 или сеть). Смотри тело ответа ниже.');
        }
    };

    const deleteComonRow = async (id: number | string) => {
        if (!window.confirm('Удалить эту карточку стратегии?')) return;
        setDeletingComonId(String(id));
        setComonError(null);
        const result = await agentLkApi.deleteComonStrategy(id);
        setComonApiTrace(result.trace);
        setDeletingComonId(null);
        if (!result.ok) {
            setComonError('Не удалось удалить. Смотри ответ ниже.');
            return;
        }
        setComonStrategies((prev) => (prev ? prev.filter((c) => String(c.id) !== String(id)) : []));
    };

    const openComonShow = (card: AgentComonStrategyCard) => {
        setComonShowCard(card);
        setComonShowOpen(true);
    };

    const closeComonShow = () => {
        setComonShowOpen(false);
        setComonShowCard(null);
        setComonShowProfitPayload(null);
        setComonShowMetricsPayload(null);
        setComonShowError(null);
        setComonShowLoading(false);
    };

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
        setPdfDraft(buildPdfDraftFromPdfResponse(res));
    };

    const savePdfCoverDraft = async () => {
        const coverFields = pdfFormFieldsForTemplate(pdfSettings?.editor_schema, PDF_COVER_TEMPLATE_ID);
        for (const field of coverFields) {
            if (field.type === 'readonly' || field.type === 'image') continue;
            const err = validatePdfFieldValue(field, pdfDraft[field.key] ?? '');
            if (err) {
                setPdfError(err);
                return;
            }
        }
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

    const saveActiveReportTemplateDraft = async () => {
        if (!activeReportTemplate || activeReportTemplate.id === PDF_COVER_TEMPLATE_ID) return;
        const payload: Record<string, string> = {};
        for (const field of activeReportTemplate.fields) {
            if (field.type === 'readonly' || field.type === 'image') continue;
            const err = validatePdfFieldValue(field, pdfDraft[field.key] ?? '');
            if (err) {
                setPdfError(err);
                return;
            }
            const patchKey = field.reset?.patch_key ?? field.key;
            if (!patchKey) continue;
            payload[patchKey] = (pdfDraft[field.key] ?? '').trim();
        }
        if (!Object.keys(payload).length) return;
        setPdfSaving(true);
        try {
            const res = await agentLkApi.patchPdfCoverSettings(payload);
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (e) {
            console.error(e);
            setPdfError('Не удалось сохранить настройки страницы отчёта.');
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

    const resetPdfTemplateImage = async (field: PdfCoverEditorField) => {
        const pk = field.reset?.patch_key ?? field.key;
        setPdfSaving(true);
        try {
            const res = await agentLkApi.patchPdfCoverSettings({ [pk]: '' });
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (e) {
            console.error(e);
            setPdfError('Не удалось сбросить изображение.');
        } finally {
            setPdfSaving(false);
        }
    };

    const handlePdfCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const coverFields = pdfFormFieldsForTemplate(pdfSettings?.editor_schema, PDF_COVER_TEMPLATE_ID);
        const coverBgField = coverFields.find((x) => x.type === 'image' && x.key === 'cover_background_url');
        const maxMb = coverBgField?.upload?.max_size_mb ?? 8;
        if (file.size > maxMb * 1024 * 1024) {
            setPdfError(`Файл больше ${maxMb} МБ.`);
            return;
        }
        setPdfUploading(true);
        try {
            const upPath = coverBgField?.upload?.path;
            const res = upPath
                ? await agentLkApi.uploadPdfSettingsImage(
                      upPath,
                      file,
                      coverBgField?.upload?.form_field ?? 'image'
                  )
                : await agentLkApi.uploadPdfCoverBackground(file);
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (err) {
            console.error(err);
            setPdfError(formatPdfUploadError(err));
        } finally {
            setPdfUploading(false);
        }
    };

    const handlePdfTemplateImageChange = async (field: PdfCoverEditorField, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const maxMb = field.upload?.max_size_mb ?? 8;
        if (file.size > maxMb * 1024 * 1024) {
            setPdfError(`Файл больше ${maxMb} МБ.`);
            return;
        }
        const upPath = field.upload?.path;
        if (!upPath) {
            setPdfError('В схеме нет upload.path для этого поля.');
            return;
        }
        setPdfSummaryUploadKey(field.key);
        try {
            const res = await agentLkApi.uploadPdfSettingsImage(
                upPath,
                file,
                field.upload?.form_field ?? 'image'
            );
            applyPdfSettingsResponse(res);
            setPdfError(null);
        } catch (err) {
            console.error(err);
            setPdfError(formatPdfUploadError(err));
        } finally {
            setPdfSummaryUploadKey(null);
        }
    };

    const pdfCoverBandColor = pdfDraft.title_band_color.trim() || '#722257';
    const coverLayoutPx = normalizePdfCoverLayout(pdfSettings?.cover_layout ?? null);
    const PDF_COVER_PREVIEW_MAX_W = 260;
    const pdfCoverLayoutScale = coverLayoutPx ? PDF_COVER_PREVIEW_MAX_W / coverLayoutPx.canvasW : 0;
    const pdfCoverBandTitle =
        coverLayoutPx?.contentTitle?.trim() ||
        pdfDraft.cover_title.trim() ||
        DEFAULT_COVER_TITLE_TEXT;
    const pdfCoverDateStr =
        coverLayoutPx?.contentDate?.trim() || pdfSettings?.date_preview?.trim() || '';

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
                                Настройки PDF-отчёта для клиентов: обложка, сводная и страницы целей. Фон, лого и цвета
                                для сводной и страниц целей общие (<code style={{ fontSize: '12px' }}>summary_*</code> в
                                API). Поля формы приходят из{' '}
                                <code style={{ fontSize: '12px' }}>editor_schema.templates[]</code>; если список полей
                                пустой, ЛК подставляет дефолтный набор.
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
                                    {reportTemplateItems.map((item) => (
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
                                    {activeReportTemplate?.id === PDF_COVER_TEMPLATE_ID && (
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
                                                                {coverLayoutPx
                                                                    ? 'Превью (cover_layout с бэка)'
                                                                    : 'Превью (без cover_layout — упрощённо)'}
                                                            </p>
                                                            <div
                                                                style={{
                                                                    width: coverLayoutPx
                                                                        ? PDF_COVER_PREVIEW_MAX_W
                                                                        : 'min(100%, 260px)',
                                                                    height: coverLayoutPx
                                                                        ? coverLayoutPx.canvasH * pdfCoverLayoutScale
                                                                        : undefined,
                                                                    aspectRatio: coverLayoutPx ? undefined : '210 / 297',
                                                                    borderRadius: '14px',
                                                                    overflow: 'hidden',
                                                                    border: '1px solid #e5e7eb',
                                                                    background: '#e5e7eb',
                                                                    position: 'relative',
                                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                                                }}
                                                            >
                                                                {coverLayoutPx
                                                                    ? coverLayoutPx.gradients.map((g, idx) => (
                                                                          <div
                                                                              key={`g-${idx}`}
                                                                              style={{
                                                                                  position: 'absolute',
                                                                                  left: g.rect.x * pdfCoverLayoutScale,
                                                                                  top: g.rect.y * pdfCoverLayoutScale,
                                                                                  width: g.rect.width * pdfCoverLayoutScale,
                                                                                  height: g.rect.height * pdfCoverLayoutScale,
                                                                                  zIndex: g.zIndex ?? 4 + idx,
                                                                                  backgroundImage: g.css,
                                                                                  pointerEvents: 'none',
                                                                              }}
                                                                          />
                                                                      ))
                                                                    : null}
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
                                                                {coverLayoutPx ? (
                                                                    <>
                                                                        <div
                                                                            style={{
                                                                                position: 'absolute',
                                                                                left:
                                                                                    coverLayoutPx.titleBand.x *
                                                                                    pdfCoverLayoutScale,
                                                                                top:
                                                                                    coverLayoutPx.titleBand.y *
                                                                                    pdfCoverLayoutScale,
                                                                                width:
                                                                                    coverLayoutPx.titleBand.width *
                                                                                    pdfCoverLayoutScale,
                                                                                height:
                                                                                    coverLayoutPx.titleBand.height *
                                                                                    pdfCoverLayoutScale,
                                                                                zIndex: 10,
                                                                                boxSizing: 'border-box',
                                                                                background: coverLayoutPx.titleBand.background,
                                                                                padding: `${coverLayoutPx.titleBand.padding.top * pdfCoverLayoutScale}px ${coverLayoutPx.titleBand.padding.right * pdfCoverLayoutScale}px ${coverLayoutPx.titleBand.padding.bottom * pdfCoverLayoutScale}px ${coverLayoutPx.titleBand.padding.left * pdfCoverLayoutScale}px`,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent:
                                                                                    coverLayoutPx.titleText.textAlign ===
                                                                                    'left'
                                                                                        ? 'flex-start'
                                                                                        : coverLayoutPx.titleText.textAlign ===
                                                                                            'right'
                                                                                          ? 'flex-end'
                                                                                          : 'center',
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    color: coverLayoutPx.titleText.color,
                                                                                    fontSize: `${coverLayoutPx.titleText.fontSize * pdfCoverLayoutScale}px`,
                                                                                    fontWeight: coverLayoutPx.titleText.fontWeight,
                                                                                    fontFamily: coverLayoutPx.titleText.fontFamily,
                                                                                    textAlign: coverLayoutPx.titleText.textAlign,
                                                                                    lineHeight:
                                                                                        coverLayoutPx.titleText.lineHeight != null
                                                                                            ? coverLayoutPx.titleText.lineHeight
                                                                                            : 1.25,
                                                                                    width: '100%',
                                                                                }}
                                                                            >
                                                                                {pdfCoverBandTitle}
                                                                            </div>
                                                                        </div>
                                                                        {pdfCoverDateStr ? (
                                                                            <div
                                                                                style={{
                                                                                    position: 'absolute',
                                                                                    left:
                                                                                        coverLayoutPx.date.x *
                                                                                        pdfCoverLayoutScale,
                                                                                    top:
                                                                                        coverLayoutPx.date.y *
                                                                                        pdfCoverLayoutScale,
                                                                                    width:
                                                                                        coverLayoutPx.date.width *
                                                                                        pdfCoverLayoutScale,
                                                                                    minHeight:
                                                                                        coverLayoutPx.date.height *
                                                                                        pdfCoverLayoutScale,
                                                                                    zIndex: 11,
                                                                                    fontSize: `${coverLayoutPx.date.fontSize * pdfCoverLayoutScale}px`,
                                                                                    color: coverLayoutPx.date.color,
                                                                                    fontFamily: coverLayoutPx.date.fontFamily,
                                                                                    textAlign: coverLayoutPx.date.textAlign,
                                                                                    textShadow: coverLayoutPx.date.textShadow,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent:
                                                                                        coverLayoutPx.date.textAlign === 'left'
                                                                                            ? 'flex-start'
                                                                                            : coverLayoutPx.date.textAlign ===
                                                                                                'center'
                                                                                              ? 'center'
                                                                                              : 'flex-end',
                                                                                    boxSizing: 'border-box',
                                                                                    pointerEvents: 'none',
                                                                                }}
                                                                            >
                                                                                {pdfCoverDateStr}
                                                                            </div>
                                                                        ) : null}
                                                                    </>
                                                                ) : (
                                                                    <>
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
                                                                                    DEFAULT_COVER_TITLE_TEXT}
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
                                                                                    textShadow:
                                                                                        '0 1px 3px rgba(0,0,0,0.85)',
                                                                                }}
                                                                            >
                                                                                {pdfSettings.date_preview}
                                                                            </div>
                                                                        ) : null}
                                                                    </>
                                                                )}
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
                                                                                            cursor:
                                                                                                pdfUploading ||
                                                                                                !!pdfSummaryUploadKey
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
                                                                                            disabled={
                                                                                                pdfUploading ||
                                                                                                !!pdfSummaryUploadKey
                                                                                            }
                                                                                        />
                                                                                    </label>
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={
                                                                                            pdfSaving ||
                                                                                            pdfUploading ||
                                                                                            !!pdfSummaryUploadKey
                                                                                        }
                                                                                        onClick={() => void resetPdfCoverBackground()}
                                                                                        style={{
                                                                                            padding: '8px 14px',
                                                                                            borderRadius: '999px',
                                                                                            border: '1px solid #fecaca',
                                                                                            background: '#fef2f2',
                                                                                            fontSize: '12px',
                                                                                            cursor:
                                                                                                pdfSaving ||
                                                                                                pdfUploading ||
                                                                                                !!pdfSummaryUploadKey
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
                                                                disabled={
                                                                    pdfSaving ||
                                                                    pdfUploading ||
                                                                    !!pdfSummaryUploadKey
                                                                }
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    borderRadius: '999px',
                                                                    border: 'none',
                                                                    background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                                                    color: '#fff',
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    cursor:
                                                                        pdfSaving ||
                                                                        pdfUploading ||
                                                                        !!pdfSummaryUploadKey
                                                                            ? 'wait'
                                                                            : 'pointer',
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
                                    {activeReportTemplate && activeReportTemplate.id !== PDF_COVER_TEMPLATE_ID && (
                                        <>
                                            {pdfLoading ? (
                                                <p style={{ color: '#6b7280' }}>Загрузка…</p>
                                            ) : (
                                                <div
                                                    style={{
                                                        background: '#fff',
                                                        borderRadius: '20px',
                                                        border: '1px solid #e8e8ec',
                                                        boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                                                        padding: '22px 22px 18px',
                                                        maxWidth: '920px',
                                                    }}
                                                >
                                                    <h2
                                                        style={{
                                                            fontSize: '17px',
                                                            fontWeight: 700,
                                                            color: '#111827',
                                                            margin: '0 0 6px 0',
                                                        }}
                                                    >
                                                        {activeReportTemplate?.label ?? 'Страница отчёта'}
                                                    </h2>
                                                    <p
                                                        style={{
                                                            fontSize: '13px',
                                                            color: '#6b7280',
                                                            margin: '0 0 18px',
                                                            lineHeight: 1.5,
                                                        }}
                                                    >
                                                        Превью HTML и настройки брендинга/цветов для выбранной страницы.
                                                    </p>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                            marginBottom: '10px',
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !summaryPreviewHtml || summaryPreviewLoading
                                                            }
                                                            onClick={() => setSummaryPreviewModalOpen(true)}
                                                            aria-label="Открыть превью крупно"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '8px 14px',
                                                                borderRadius: '999px',
                                                                border: '1px solid #e5e7eb',
                                                                background: '#fff',
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#4b5563',
                                                                cursor:
                                                                    !summaryPreviewHtml || summaryPreviewLoading
                                                                        ? 'not-allowed'
                                                                        : 'pointer',
                                                                opacity:
                                                                    !summaryPreviewHtml || summaryPreviewLoading
                                                                        ? 0.55
                                                                        : 1,
                                                            }}
                                                        >
                                                            <svg
                                                                width="18"
                                                                height="18"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                aria-hidden
                                                            >
                                                                <circle
                                                                    cx="10.5"
                                                                    cy="10.5"
                                                                    r="6.5"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                />
                                                                <path
                                                                    d="M15.5 15.5L21 21"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                            Крупный просмотр
                                                        </button>
                                                    </div>
                                                    <SummaryHtmlPreview
                                                        html={summaryPreviewHtml}
                                                        loading={summaryPreviewLoading}
                                                    />
                                                    <p
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            margin: '10px 0 0',
                                                            textAlign: 'center',
                                                            lineHeight: 1.45,
                                                        }}
                                                    >
                                                        Превью рендерится бэком. HTML показываем через{' '}
                                                        <code style={{ fontSize: '11px' }}>srcdoc</code> (JWT в iframe по{' '}
                                                        <code style={{ fontSize: '11px' }}>src</code> не передать).
                                                    </p>
                                                    <div
                                                        style={{
                                                            height: '1px',
                                                            background: '#eef0f4',
                                                            margin: '20px 0 16px',
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns:
                                                                'repeat(auto-fit, minmax(240px, 1fr))',
                                                            gap: '14px',
                                                            alignItems: 'start',
                                                        }}
                                                    >
                                                        {(activeReportTemplate?.fields ?? []).map((field) => {
                                                            const draftValue = pdfDraft[field.key] ?? '';
                                                            if (field.type === 'image') {
                                                                const thumb = pdfImageThumbByKey[field.key] ?? null;
                                                                const busy = pdfSummaryUploadKey === field.key;
                                                                const uploadBusy = !!pdfSummaryUploadKey;
                                                                return (
                                                                    <div
                                                                        key={field.key}
                                                                        style={{
                                                                            background: '#fafbfc',
                                                                            borderRadius: '14px',
                                                                            padding: '14px',
                                                                            border: '1px solid #eef0f4',
                                                                            minWidth: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '8px',
                                                                        }}
                                                                    >
                                                                        <label
                                                                            style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: '#374151',
                                                                            }}
                                                                        >
                                                                            {field.label ?? field.key}
                                                                        </label>
                                                                        {field.hint ? (
                                                                            <span
                                                                                style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#9ca3af',
                                                                                    lineHeight: 1.4,
                                                                                }}
                                                                            >
                                                                                {field.hint}
                                                                            </span>
                                                                        ) : null}
                                                                        <div
                                                                            style={{
                                                                                display: 'flex',
                                                                                flexWrap: 'wrap',
                                                                                gap: '12px',
                                                                                alignItems: 'center',
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    width:
                                                                                        field.key === 'summary_logo_url'
                                                                                            ? '100px'
                                                                                            : 'min(100%, 160px)',
                                                                                    maxWidth: '200px',
                                                                                    minHeight:
                                                                                        field.key === 'summary_logo_url'
                                                                                            ? '72px'
                                                                                            : '96px',
                                                                                    borderRadius: '12px',
                                                                                    border: '1px dashed #d1d5db',
                                                                                    background: '#fff',
                                                                                    overflow: 'hidden',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    boxSizing: 'border-box',
                                                                                }}
                                                                            >
                                                                                {thumb ? (
                                                                                    // eslint-disable-next-line jsx-a11y/alt-text -- превью ассета
                                                                                    <img
                                                                                        src={thumb}
                                                                                        alt=""
                                                                                        style={{
                                                                                            maxWidth: '100%',
                                                                                            maxHeight: '120px',
                                                                                            objectFit: 'contain',
                                                                                            display: 'block',
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <span
                                                                                        style={{
                                                                                            fontSize: '12px',
                                                                                            color: '#9ca3af',
                                                                                            padding: '10px',
                                                                                            textAlign: 'center',
                                                                                            lineHeight: 1.35,
                                                                                        }}
                                                                                    >
                                                                                        Нет своего файла — в PDF дефолт с бэка
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: '8px',
                                                                                }}
                                                                            >
                                                                                <label
                                                                                    style={{
                                                                                        fontSize: '12px',
                                                                                        color: '#4b5563',
                                                                                        cursor:
                                                                                            busy || uploadBusy
                                                                                                ? 'wait'
                                                                                                : 'pointer',
                                                                                        padding: '8px 14px',
                                                                                        borderRadius: '999px',
                                                                                        border: '1px solid #d1d5db',
                                                                                        background: '#fff',
                                                                                        alignSelf: 'flex-start',
                                                                                    }}
                                                                                >
                                                                                    {busy ? 'Загрузка…' : 'Загрузить'}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept={acceptMimeToInputAccept(
                                                                                            field.upload?.accept_mime
                                                                                        )}
                                                                                        onChange={(ev) =>
                                                                                            void handlePdfTemplateImageChange(
                                                                                                field,
                                                                                                ev
                                                                                            )
                                                                                        }
                                                                                        style={{ display: 'none' }}
                                                                                        disabled={pdfSaving || uploadBusy}
                                                                                    />
                                                                                </label>
                                                                                <button
                                                                                    type="button"
                                                                                    disabled={
                                                                                        pdfSaving ||
                                                                                        busy ||
                                                                                        uploadBusy ||
                                                                                        !thumb
                                                                                    }
                                                                                    onClick={() =>
                                                                                        void resetPdfTemplateImage(field)
                                                                                    }
                                                                                    style={{
                                                                                        padding: '8px 14px',
                                                                                        borderRadius: '999px',
                                                                                        border: '1px solid #fecaca',
                                                                                        background: '#fef2f2',
                                                                                        fontSize: '12px',
                                                                                        cursor:
                                                                                            pdfSaving || busy
                                                                                                ? 'wait'
                                                                                                : 'pointer',
                                                                                        color: '#b91c1c',
                                                                                        alignSelf: 'flex-start',
                                                                                    }}
                                                                                >
                                                                                    Сбросить
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            if (field.type === 'color') {
                                                                const effectiveHex = /^#[0-9A-Fa-f]{6}$/.test(draftValue.trim())
                                                                    ? draftValue.trim()
                                                                    : '#8b5cf6';
                                                                return (
                                                                    <div
                                                                        key={field.key}
                                                                        style={{
                                                                            background: '#fafbfc',
                                                                            borderRadius: '14px',
                                                                            padding: '14px',
                                                                            border: '1px solid #eef0f4',
                                                                            minWidth: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '8px',
                                                                        }}
                                                                    >
                                                                        <label
                                                                            style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: '#374151',
                                                                            }}
                                                                        >
                                                                            {field.label ?? field.key}
                                                                        </label>
                                                                        {field.hint ? (
                                                                            <span
                                                                                style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#9ca3af',
                                                                                    lineHeight: 1.4,
                                                                                }}
                                                                            >
                                                                                {field.hint}
                                                                            </span>
                                                                        ) : null}
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
                                                                                value={effectiveHex}
                                                                                onChange={(e) =>
                                                                                    setPdfDraft((d) => ({
                                                                                        ...d,
                                                                                        [field.key]: e.target.value,
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
                                                                                value={draftValue}
                                                                                onChange={(e) =>
                                                                                    setPdfDraft((d) => ({
                                                                                        ...d,
                                                                                        [field.key]: e.target.value,
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
                                                                                    background: '#fff',
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            if (field.type === 'text') {
                                                                return (
                                                                    <div
                                                                        key={field.key}
                                                                        style={{
                                                                            background: '#fafbfc',
                                                                            borderRadius: '14px',
                                                                            padding: '14px',
                                                                            border: '1px solid #eef0f4',
                                                                            minWidth: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '8px',
                                                                        }}
                                                                    >
                                                                        <label
                                                                            style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: '#374151',
                                                                            }}
                                                                        >
                                                                            {field.label ?? field.key}
                                                                        </label>
                                                                        {field.hint ? (
                                                                            <span
                                                                                style={{
                                                                                    fontSize: '12px',
                                                                                    color: '#9ca3af',
                                                                                    lineHeight: 1.4,
                                                                                }}
                                                                            >
                                                                                {field.hint}
                                                                            </span>
                                                                        ) : null}
                                                                        <input
                                                                            type="text"
                                                                            value={draftValue}
                                                                            onChange={(e) =>
                                                                                setPdfDraft((d) => ({
                                                                                    ...d,
                                                                                    [field.key]: e.target.value,
                                                                                }))
                                                                            }
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '10px 12px',
                                                                                borderRadius: '10px',
                                                                                border: '1px solid #d1d5db',
                                                                                fontSize: '13px',
                                                                                background: '#fff',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                            if (field.type === 'readonly') {
                                                                const valueKey = field.value_key || field.key;
                                                                const readonlyVal = String(
                                                                    (pdfSettings as unknown as Record<string, unknown>)?.[
                                                                        valueKey
                                                                    ] ?? ''
                                                                );
                                                                return (
                                                                    <div
                                                                        key={field.key}
                                                                        style={{
                                                                            background: '#fafbfc',
                                                                            borderRadius: '14px',
                                                                            padding: '14px',
                                                                            border: '1px solid #eef0f4',
                                                                            minWidth: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '8px',
                                                                        }}
                                                                    >
                                                                        <label
                                                                            style={{
                                                                                fontSize: '13px',
                                                                                fontWeight: 600,
                                                                                color: '#374151',
                                                                            }}
                                                                        >
                                                                            {field.label ?? field.key}
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={readonlyVal}
                                                                            disabled
                                                                            style={{
                                                                                width: '100%',
                                                                                padding: '10px 12px',
                                                                                borderRadius: '10px',
                                                                                border: '1px solid #d1d5db',
                                                                                fontSize: '13px',
                                                                                background: '#f3f4f6',
                                                                                color: '#6b7280',
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </div>
                                                    <div
                                                        style={{
                                                            marginTop: '4px',
                                                            paddingTop: '14px',
                                                            borderTop: '1px solid #eef0f4',
                                                            display: 'flex',
                                                            justifyContent: 'flex-end',
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => void saveActiveReportTemplateDraft()}
                                                            disabled={
                                                                pdfSaving ||
                                                                pdfUploading ||
                                                                !!pdfSummaryUploadKey
                                                            }
                                                            style={{
                                                                padding: '10px 22px',
                                                                borderRadius: '999px',
                                                                border: 'none',
                                                                background:
                                                                    'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                                                color: '#fff',
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                cursor:
                                                                    pdfSaving ||
                                                                    pdfUploading ||
                                                                    !!pdfSummaryUploadKey
                                                                        ? 'wait'
                                                                        : 'pointer',
                                                            }}
                                                        >
                                                            {pdfSaving ? 'Сохранение…' : 'Сохранить настройки страницы'}
                                                        </button>
                                                    </div>
                                                    {activeReportTemplate?.pageType === 'SUMMARY' && pdfGoalCardsManifest ? (
                                                        <div
                                                            style={{
                                                                marginTop: '20px',
                                                                paddingTop: '18px',
                                                                borderTop: '1px solid #eef0f4',
                                                            }}
                                                        >
                                                            <h3
                                                                style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: 700,
                                                                    color: '#111827',
                                                                    margin: '0 0 6px 0',
                                                                }}
                                                            >
                                                                Иллюстрации целей в PDF
                                                            </h3>
                                                            <p
                                                                style={{
                                                                    fontSize: '12px',
                                                                    color: '#6b7280',
                                                                    margin: '0 0 14px',
                                                                    lineHeight: 1.5,
                                                                }}
                                                            >
                                                                Только просмотр: ссылки не в PATCH. Берём поле ссылки в порядке{' '}
                                                                <code style={{ fontSize: '11px' }}>
                                                                    public_url → url → image_url …
                                                                </code>
                                                                , относительные пути дописываем к API. У{' '}
                                                                <code style={{ fontSize: '11px' }}>img</code> стоит{' '}
                                                                <code style={{ fontSize: '11px' }}>referrerPolicy=no-referrer</code>{' '}
                                                                (часто из‑за Referer режет Cloudflare).
                                                                {pdfGoalCardsManifest.hint
                                                                    ? ` ${pdfGoalCardsManifest.hint}`
                                                                    : null}
                                                            </p>
                                                            <div
                                                                style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns:
                                                                        'repeat(auto-fill, minmax(120px, 1fr))',
                                                                    gap: '12px',
                                                                }}
                                                            >
                                                                {pdfGoalCardsManifest.cards.map((card, idx) => {
                                                                    const typeLabel = goalCardTypeLabel(card);
                                                                    const fn = goalCardFilename(card);
                                                                    const rowKey = `${typeLabel}-${fn || idx}`;
                                                                    const src = resolveGoalCardImgSrc(card);
                                                                    return (
                                                                        <div
                                                                            key={rowKey}
                                                                            style={{
                                                                                borderRadius: '12px',
                                                                                border: '1px solid #e5e7eb',
                                                                                background: '#fafafa',
                                                                                overflow: 'hidden',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                minHeight: 100,
                                                                            }}
                                                                        >
                                                                            <PdfGoalCardThumb
                                                                                cardKey={rowKey}
                                                                                src={src}
                                                                                typeLabel={typeLabel}
                                                                            />
                                                                            <div
                                                                                style={{
                                                                                    fontSize: '10px',
                                                                                    fontWeight: 600,
                                                                                    color: '#374151',
                                                                                    padding: '8px 8px 10px',
                                                                                    fontFamily: 'monospace',
                                                                                    borderTop: '1px solid #eef0f4',
                                                                                    background: '#fff',
                                                                                }}
                                                                            >
                                                                                {typeLabel}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'comon-strategies' && (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '12px',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                }}
                            >
                                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>
                                    Стратегии (Comon)
                                </h1>
                                <button
                                    type="button"
                                    onClick={openComonCreate}
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
                                    Новая стратегия
                                </button>
                            </div>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                                Карточки с ссылкой на Comon, риском и портфелем из двух инструментов — их увидят
                                закреплённые за тобой клиенты. График доходности лучше брать с бэка (
                                <code style={{ fontSize: '12px' }}>/profit</code>
                                ), не с comon.ru в браузере (CORS).
                            </p>
                            {comonError && (
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
                                    {comonError}
                                </div>
                            )}
                            {comonLoading ? (
                                <p style={{ color: '#6b7280' }}>Загружаем стратегии…</p>
                            ) : comonStrategies === null ? (
                                <p style={{ color: '#6b7280' }}>
                                    Список не загружен. Если сверху красное сообщение — поправь токен или API; сырое
                                    тело ответа — в блоке отладки внизу.
                                </p>
                            ) : comonStrategies.length === 0 ? (
                                <p style={{ color: '#6b7280' }}>
                                    Пока нет карточек. Нажми «Новая стратегия» и заполни форму — тело запроса и ответ
                                    бэка покажем в блоке отладки ниже.
                                </p>
                            ) : (
                                <div style={{ marginTop: '12px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>
                                                    Название
                                                </th>
                                                <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>
                                                    Риск
                                                </th>
                                                <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>
                                                    Comon id
                                                </th>
                                                <th style={{ padding: '8px 4px', color: '#6b7280', fontWeight: 500 }}>
                                                    Действия
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {comonStrategies.map((row) => (
                                                <tr key={String(row.id)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '8px 4px', color: '#111827' }}>
                                                        {row.name ?? '—'}
                                                    </td>
                                                    <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                                                        {COMON_RISK_LABELS[String(row.risk_profile)] ??
                                                            row.risk_profile ??
                                                            '—'}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: '8px 4px',
                                                            color: '#4b5563',
                                                            fontFamily: 'ui-monospace, monospace',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        {row.comon_strategy_id ?? '—'}
                                                    </td>
                                                    <td style={{ padding: '8px 4px' }}>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => openComonShow(row)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e9d5ff',
                                                                    background: '#faf5ff',
                                                                    fontSize: '12px',
                                                                    cursor: 'pointer',
                                                                    color: '#7C3AED',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                Показать
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openComonEdit(row)}
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
                                                                onClick={() => void deleteComonRow(row.id)}
                                                                disabled={deletingComonId === String(row.id)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #fecaca',
                                                                    background: '#fef2f2',
                                                                    fontSize: '12px',
                                                                    cursor:
                                                                        deletingComonId === String(row.id)
                                                                            ? 'wait'
                                                                            : 'pointer',
                                                                    color: '#b91c1c',
                                                                }}
                                                            >
                                                                {deletingComonId === String(row.id) ? '…' : 'Удалить'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <section
                                style={{
                                    marginTop: '24px',
                                    paddingTop: '20px',
                                    borderTop: '1px solid #e5e7eb',
                                }}
                            >
                                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                                    Отладка API (последний запрос к Comon/стратегиям)
                                </h2>
                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 12px 0' }}>
                                    Сюда пишем то, что ушло на бэк (метод, URL, тело) и сырой ответ после каждого
                                    списка, сохранения, удаления или «Разобрать ссылку».
                                </p>
                                {!comonApiTrace ? (
                                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>Пока не было запросов с этой вкладки.</p>
                                ) : (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(0, 1fr)',
                                            gap: '12px',
                                        }}
                                    >
                                        <details open style={{ fontSize: '12px' }}>
                                            <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 600 }}>
                                                Запрос
                                            </summary>
                                            <pre
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '10px',
                                                    background: '#f9fafb',
                                                    borderRadius: '10px',
                                                    maxHeight: '220px',
                                                    overflow: 'auto',
                                                    border: '1px solid #e5e7eb',
                                                }}
                                            >
                                                {JSON.stringify(
                                                    {
                                                        method: comonApiTrace.method,
                                                        url: comonApiTrace.url,
                                                        requestBody: comonApiTrace.requestBody ?? null,
                                                    },
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </details>
                                        <details open style={{ fontSize: '12px' }}>
                                            <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 600 }}>
                                                Ответ (HTTP {comonApiTrace.status ?? '—'}
                                                {comonApiTrace.failed ? ', ошибка' : ''})
                                            </summary>
                                            <pre
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '10px',
                                                    background: '#faf5ff',
                                                    borderRadius: '10px',
                                                    maxHeight: '320px',
                                                    overflow: 'auto',
                                                    border: '1px solid #e9d5ff',
                                                }}
                                            >
                                                {JSON.stringify(comonApiTrace.responseBody ?? null, null, 2)}
                                            </pre>
                                        </details>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {summaryPreviewModalOpen && summaryPreviewHtml && (
                    <div
                        onClick={() => setSummaryPreviewModalOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.5)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            zIndex: 1350,
                            padding: '16px 10px 24px',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(1320px, calc(100vw - 20px))',
                                maxWidth: '100%',
                                marginTop: '12px',
                                marginBottom: '24px',
                                background: '#fff',
                                borderRadius: '20px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '16px 16px 20px',
                                boxSizing: 'border-box',
                                overflow: 'auto',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px',
                                    gap: '12px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: '17px',
                                        fontWeight: 700,
                                        color: '#111827',
                                    }}
                                >
                                    Превью: сводная страница
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setSummaryPreviewModalOpen(false)}
                                    aria-label="Закрыть"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '26px',
                                        lineHeight: 1,
                                        color: '#6b7280',
                                        padding: '2px 8px',
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <SummaryHtmlPreview
                                html={summaryPreviewHtml}
                                loading={false}
                                variant="modal"
                            />
                            <p
                                style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    margin: '14px 0 0',
                                    textAlign: 'center',
                                    lineHeight: 1.45,
                                }}
                            >
                                Натуральный размер страницы (без уменьшения). Листай внутри окна или всего экрана.
                                Закрыть — Esc, крестик или клик по затемнению.
                            </p>
                        </div>
                    </div>
                )}

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

                {/* Просмотр стратегии Comon: график, метрики, портфель */}
                {comonShowOpen && comonShowCard && (
                    <div
                        onClick={() => closeComonShow()}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15,23,42,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1400,
                            padding: '16px',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: 'min(920px, 100%)',
                                maxHeight: '92vh',
                                overflow: 'auto',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    gap: '16px',
                                    marginBottom: '16px',
                                }}
                            >
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111' }}>
                                        {comonShowCard.name ?? 'Стратегия'}
                                    </h2>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                        Риск:{' '}
                                        {COMON_RISK_LABELS[String(comonShowCard.risk_profile)] ??
                                            comonShowCard.risk_profile ??
                                            '—'}
                                        {comonShowCard.comon_strategy_id != null && (
                                            <>
                                                {' '}
                                                · Comon id:{' '}
                                                <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                                                    {comonShowCard.comon_strategy_id}
                                                </span>
                                            </>
                                        )}
                                        {' · '}
                                        Наш id:{' '}
                                        <span style={{ fontFamily: 'ui-monospace, monospace' }}>{comonShowCard.id}</span>
                                    </p>
                                    {comonShowCard.comon_url ? (
                                        <a
                                            href={String(comonShowCard.comon_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '13px', color: '#7C3AED', wordBreak: 'break-all' }}
                                        >
                                            {comonShowCard.comon_url}
                                        </a>
                                    ) : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => closeComonShow()}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '22px',
                                        lineHeight: 1,
                                        color: '#6b7280',
                                        flexShrink: 0,
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {comonShowCard.description ? (
                                <p
                                    style={{
                                        fontSize: '14px',
                                        color: '#374151',
                                        lineHeight: 1.5,
                                        margin: '0 0 12px 0',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {String(comonShowCard.description)}
                                </p>
                            ) : null}

                            {comonShowCard.min_contribution != null ? (
                                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 12px 0' }}>
                                    Мин. сумма: <strong>{String(comonShowCard.min_contribution)}</strong>
                                </p>
                            ) : null}

                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 16px 0' }}>
                                Данные доходности и метрики — ознакомительно; прошлые результаты не гарантируют будущую
                                доходность.
                            </p>

                            {comonShowLoading ? (
                                <p style={{ color: '#6b7280', marginBottom: '16px' }}>Тянем график и метрики с бэка…</p>
                            ) : null}

                            {comonShowError ? (
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        background: '#fffbeb',
                                        color: '#92400e',
                                        marginBottom: '16px',
                                        fontSize: '13px',
                                    }}
                                >
                                    {comonShowError}
                                </div>
                            ) : null}

                            {comonShowMetricsView.metrics &&
                            Object.keys(comonShowMetricsView.metrics).filter((k) => k !== 'definitions').length > 0 ? (
                                <section style={{ marginBottom: '20px' }}>
                                    <h3
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: '#374151',
                                            margin: '0 0 10px 0',
                                        }}
                                    >
                                        Метрики
                                    </h3>
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                            gap: '10px',
                                        }}
                                    >
                                        {Object.entries(comonShowMetricsView.metrics)
                                            .filter(([k]) => k !== 'definitions')
                                            .map(([k, v]) => (
                                                <div
                                                    key={k}
                                                    style={{
                                                        padding: '10px 12px',
                                                        borderRadius: '12px',
                                                        border: '1px solid #e5e7eb',
                                                        background: '#f9fafb',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            textTransform: 'lowercase',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        {k.replace(/_/g, ' ')}
                                                    </div>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                                        {formatComonMetricCell(k, v)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </section>
                            ) : !comonShowLoading && comonShowMetricsPayload != null ? (
                                <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '16px' }}>
                                    Метрики пришли, но в ожидаемом виде не распарсились — смотри сырой JSON внизу.
                                </p>
                            ) : null}

                            <section style={{ marginBottom: '20px' }}>
                                <h3
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        margin: '0 0 10px 0',
                                    }}
                                >
                                    Доходность (ряд Comon через бэк)
                                </h3>
                                {comonShowLoading ? (
                                    <div style={{ height: '280px' }} />
                                ) : comonShowChartPoints.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                                        Не нашли массив точек с датой и значением в ответе /profit. Открой «Сырой ответ
                                        /profit» ниже и скажи бэку, если структура другая — допилим парсер.
                                    </p>
                                ) : (
                                    <div style={{ width: '100%', height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={comonShowChartPoints}
                                                margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
                                            >
                                                <defs>
                                                    <linearGradient id="comonProfitGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop
                                                            offset="0%"
                                                            stopColor={COMON_SHOW_CHART.gradientStart}
                                                            stopOpacity={0.35}
                                                        />
                                                        <stop
                                                            offset="100%"
                                                            stopColor={COMON_SHOW_CHART.gradientEnd}
                                                            stopOpacity={0.05}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={COMON_SHOW_CHART.grid} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fill: COMON_SHOW_CHART.text }}
                                                    tickFormatter={(v) => formatComonChartAxisDate(String(v))}
                                                    interval="preserveStartEnd"
                                                    minTickGap={28}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10, fill: COMON_SHOW_CHART.text }}
                                                    width={48}
                                                    tickFormatter={(v) =>
                                                        typeof v === 'number' ? v.toLocaleString('ru-RU') : String(v)
                                                    }
                                                />
                                                <Tooltip
                                                    labelFormatter={(v) => String(v)}
                                                    formatter={(value: number | string | undefined) => [
                                                        typeof value === 'number'
                                                            ? value.toLocaleString('ru-RU', { maximumFractionDigits: 6 })
                                                            : String(value ?? ''),
                                                        'Значение',
                                                    ]}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke={COMON_SHOW_CHART.primary}
                                                    strokeWidth={2}
                                                    fill="url(#comonProfitGrad)"
                                                    dot={false}
                                                    isAnimationActive={comonShowChartPoints.length < 400}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </section>

                            <section style={{ marginBottom: '20px' }}>
                                <h3
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#374151',
                                        margin: '0 0 10px 0',
                                    }}
                                >
                                    Доли в карточке (портфель)
                                </h3>
                                {comonShowPieData.length === 0 ? (
                                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>В карточке нет портфеля.</p>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '24px',
                                        }}
                                    >
                                        <div style={{ width: '220px', height: '220px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={comonShowPieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={52}
                                                        outerRadius={88}
                                                        paddingAngle={2}
                                                    >
                                                        {comonShowPieData.map((_, i) => (
                                                            <Cell
                                                                key={i}
                                                                fill={COMON_PIE_COLORS[i % COMON_PIE_COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        formatter={(v: number | string | undefined) =>
                                                            `${v != null ? String(v) : ''}%`
                                                        }
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <ul
                                            style={{
                                                margin: 0,
                                                padding: 0,
                                                listStyle: 'none',
                                                fontSize: '13px',
                                                color: '#374151',
                                            }}
                                        >
                                            {comonShowPieData.map((row, i) => (
                                                <li
                                                    key={row.name + i}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginBottom: '6px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: '10px',
                                                            height: '10px',
                                                            borderRadius: '2px',
                                                            background: COMON_PIE_COLORS[i % COMON_PIE_COLORS.length],
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <span>
                                                        {row.name}: <strong>{row.value}%</strong>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>

                            {comonShowMetricsView.definitions != null ? (
                                <details style={{ marginBottom: '12px', fontSize: '12px' }}>
                                    <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 600 }}>
                                        Пояснения к метрикам (definitions)
                                    </summary>
                                    <pre
                                        style={{
                                            marginTop: '8px',
                                            padding: '10px',
                                            background: '#f9fafb',
                                            borderRadius: '10px',
                                            maxHeight: '200px',
                                            overflow: 'auto',
                                            border: '1px solid #e5e7eb',
                                        }}
                                    >
                                        {JSON.stringify(comonShowMetricsView.definitions, null, 2)}
                                    </pre>
                                </details>
                            ) : null}

                            <details style={{ fontSize: '12px' }}>
                                <summary style={{ cursor: 'pointer', color: '#6b7280', fontWeight: 600 }}>
                                    Сырой ответ API (отладка)
                                </summary>
                                <p style={{ color: '#9ca3af', margin: '8px 0 6px 0' }}>GET …/profit</p>
                                <pre
                                    style={{
                                        padding: '10px',
                                        background: '#f9fafb',
                                        borderRadius: '10px',
                                        maxHeight: '180px',
                                        overflow: 'auto',
                                        border: '1px solid #e5e7eb',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {comonShowProfitPayload != null
                                        ? JSON.stringify(comonShowProfitPayload, null, 2)
                                        : '—'}
                                </pre>
                                <p style={{ color: '#9ca3af', margin: '0 0 6px 0' }}>GET …/profit/metrics</p>
                                <pre
                                    style={{
                                        padding: '10px',
                                        background: '#faf5ff',
                                        borderRadius: '10px',
                                        maxHeight: '180px',
                                        overflow: 'auto',
                                        border: '1px solid #e9d5ff',
                                    }}
                                >
                                    {comonShowMetricsPayload != null
                                        ? JSON.stringify(comonShowMetricsPayload, null, 2)
                                        : '—'}
                                </pre>
                            </details>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => closeComonShow()}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '999px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                        color: '#fff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Модалка Comon / автоследование */}
                {comonModalOpen && (
                    <div
                        onClick={() => !comonSaving && setComonModalOpen(false)}
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
                                width: 'min(640px, 100%)',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                background: '#fff',
                                borderRadius: '24px',
                                boxShadow: '0 24px 80px rgba(15,23,42,0.35)',
                                padding: '24px 28px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                                    {editingComonId != null ? 'Редактировать стратегию' : 'Новая стратегия (Comon)'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => !comonSaving && setComonModalOpen(false)}
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
                            {comonError && (
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        background: '#fef2f2',
                                        color: '#b91c1c',
                                        marginBottom: '12px',
                                        fontSize: '13px',
                                    }}
                                >
                                    {comonError}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <label
                                        style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}
                                    >
                                        Ссылка на страницу стратегии (comon_url)
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <input
                                            type="url"
                                            value={comonForm.comon_url}
                                            onChange={(e) =>
                                                setComonForm((prev) => ({ ...prev, comon_url: e.target.value }))
                                            }
                                            placeholder="https://www.comon.ru/strategies/…"
                                            style={{
                                                flex: '1 1 200px',
                                                padding: '8px 10px',
                                                borderRadius: '10px',
                                                border: '1px solid #e5e7eb',
                                                fontSize: '13px',
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => void resolveComonLink()}
                                            disabled={comonResolving}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '10px',
                                                border: '1px solid #ddd6fe',
                                                background: '#faf5ff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#6d28d9',
                                                cursor: comonResolving ? 'wait' : 'pointer',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {comonResolving ? 'Запрос…' : 'Разобрать ссылку'}
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0 0' }}>
                                        Опционально: перед сохранением дернётся POST /pfp/comon/strategies/resolve —
                                        превью id в отладке под карточкой.
                                    </p>
                                    {comonApiTrace && (
                                        <details style={{ marginTop: '10px', fontSize: '11px' }}>
                                            <summary style={{ cursor: 'pointer', color: '#6b7280' }}>
                                                Сырой запрос/ответ (видно и под модалкой на вкладке)
                                            </summary>
                                            <pre
                                                style={{
                                                    marginTop: '6px',
                                                    padding: '8px',
                                                    background: '#f9fafb',
                                                    borderRadius: '8px',
                                                    maxHeight: '160px',
                                                    overflow: 'auto',
                                                    border: '1px solid #e5e7eb',
                                                }}
                                            >
                                                {JSON.stringify(comonApiTrace, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                                <div>
                                    <label
                                        style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}
                                    >
                                        Название карточки
                                    </label>
                                    <input
                                        type="text"
                                        value={comonForm.name}
                                        onChange={(e) => setComonForm((prev) => ({ ...prev, name: e.target.value }))}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}
                                    >
                                        Риск
                                    </label>
                                    <select
                                        value={comonForm.risk_profile}
                                        onChange={(e) =>
                                            setComonForm((prev) => ({
                                                ...prev,
                                                risk_profile: e.target.value as ComonRiskProfile,
                                            }))
                                        }
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {comonRiskProfiles.map((code) => (
                                            <option key={code} value={code}>
                                                {COMON_RISK_LABELS[code] ?? code}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}
                                    >
                                        Мин. сумма (опционально)
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={comonForm.min_contribution}
                                        onChange={(e) =>
                                            setComonForm((prev) => ({ ...prev, min_contribution: e.target.value }))
                                        }
                                        placeholder="Пусто — не передаём"
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '13px',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}
                                    >
                                        Описание для клиента (опционально)
                                    </label>
                                    <textarea
                                        value={comonForm.description}
                                        onChange={(e) =>
                                            setComonForm((prev) => ({ ...prev, description: e.target.value }))
                                        }
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '8px 10px',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            fontSize: '13px',
                                            resize: 'vertical',
                                        }}
                                    />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#374151',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Портфель (ровно 2 инструмента)
                                    </div>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {[0, 1].map((idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 100px',
                                                    gap: '8px',
                                                    alignItems: 'end',
                                                }}
                                            >
                                                <div>
                                                    <label
                                                        style={{
                                                            display: 'block',
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        Инструмент {idx + 1}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={comonForm.portfolio[idx].instrument}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setComonForm((prev) => {
                                                                const next = [...prev.portfolio] as ComonFormState['portfolio'];
                                                                next[idx] = { ...next[idx], instrument: v };
                                                                return { ...prev, portfolio: next };
                                                            });
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 10px',
                                                            borderRadius: '10px',
                                                            border: '1px solid #e5e7eb',
                                                            fontSize: '13px',
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        style={{
                                                            display: 'block',
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        Доля %
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={comonForm.portfolio[idx].share_percent}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setComonForm((prev) => {
                                                                const next = [...prev.portfolio] as ComonFormState['portfolio'];
                                                                next[idx] = { ...next[idx], share_percent: v };
                                                                return { ...prev, portfolio: next };
                                                            });
                                                        }}
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
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={() => !comonSaving && setComonModalOpen(false)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
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
                                        onClick={() => void submitComonStrategy()}
                                        disabled={comonSaving}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: comonSaving
                                                ? '#9ca3af'
                                                : 'linear-gradient(135deg, #D946EF, #8B5CF6)',
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: comonSaving ? 'wait' : 'pointer',
                                        }}
                                    >
                                        {comonSaving ? 'Сохранение…' : editingComonId != null ? 'Сохранить' : 'Создать'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SettingsPage;

