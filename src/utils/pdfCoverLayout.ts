/**
 * Нормализация `cover_layout` из GET/PATCH /api/pfp/pdf-settings для превью в ЛК.
 * Поля читаются в snake_case и camelCase; при отсутствии критичных данных — null (тогда фолбэк-разметка в SettingsPage).
 */

export interface PdfCoverRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PdfCoverPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface PdfCoverGradientLayer {
    rect: PdfCoverRect;
    /** Готовый CSS для background-image, напр. linear-gradient(...) */
    css: string;
    zIndex?: number;
}

export interface PdfCoverLayoutNormalized {
    canvasW: number;
    canvasH: number;
    titleBand: PdfCoverRect & { background: string; padding: PdfCoverPadding };
    titleText: {
        fontSize: number;
        fontWeight: number;
        color: string;
        textAlign: 'left' | 'center' | 'right';
        fontFamily?: string;
        lineHeight?: number;
    };
    date: PdfCoverRect & {
        fontSize: number;
        color: string;
        textAlign: 'left' | 'center' | 'right';
        fontFamily?: string;
        textShadow?: string;
    };
    /** Тексты из content (как на бэке после подстановки) */
    contentTitle: string;
    contentDate: string;
    gradients: PdfCoverGradientLayer[];
}

function num(obj: unknown, ...keys: string[]): number | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const o = obj as Record<string, unknown>;
    for (const k of keys) {
        const v = o[k];
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string' && v.trim() !== '') {
            const n = Number(v);
            if (Number.isFinite(n)) return n;
        }
    }
    return undefined;
}

function padFrom(obj: unknown): PdfCoverPadding {
    if (!obj || typeof obj !== 'object') return { top: 0, right: 0, bottom: 0, left: 0 };
    const o = obj as Record<string, unknown>;
    const all = num(o, 'padding', 'p');
    if (all != null) return { top: all, right: all, bottom: all, left: all };
    return {
        top: num(o, 'top', 'padding_top', 'paddingTop') ?? 0,
        right: num(o, 'right', 'padding_right', 'paddingRight') ?? 0,
        bottom: num(o, 'bottom', 'padding_bottom', 'paddingBottom') ?? 0,
        left: num(o, 'left', 'padding_left', 'paddingLeft') ?? 0,
    };
}

function rectFrom(obj: unknown): PdfCoverRect | null {
    if (!obj || typeof obj !== 'object') return null;
    const o = obj as Record<string, unknown>;
    const x = num(o, 'x', 'left') ?? 0;
    const y = num(o, 'y', 'top') ?? 0;
    const width = num(o, 'width', 'w');
    const height = num(o, 'height', 'h');
    if (width == null || height == null || width <= 0 || height <= 0) return null;
    return { x, y, width, height };
}

function gradientCss(g: Record<string, unknown>): string | null {
    const ready =
        typeof g.css === 'string'
            ? g.css
            : typeof g.linear_gradient_css === 'string'
              ? g.linear_gradient_css
              : typeof g.background === 'string' && g.background.includes('gradient')
                ? g.background
                : null;
    if (ready) return ready;

    const stops = g.stops;
    if (!Array.isArray(stops) || stops.length === 0) return null;
    const parts: string[] = [];
    for (const s of stops) {
        if (!s || typeof s !== 'object') continue;
        const st = s as Record<string, unknown>;
        const color = st.color ?? st.c;
        if (typeof color !== 'string') continue;
        let pos = '';
        const off = st.offset ?? st.position;
        if (typeof off === 'number') pos = ` ${off * 100}%`;
        else if (typeof off === 'string') pos = ` ${off}`;
        parts.push(`${color}${pos}`);
    }
    if (!parts.length) return null;
    const angle = num(g, 'angle', 'deg');
    const deg = angle != null ? `${angle}deg` : '180deg';
    return `linear-gradient(${deg}, ${parts.join(', ')})`;
}

function parseGradients(raw: unknown): PdfCoverGradientLayer[] {
    if (!Array.isArray(raw)) return [];
    const out: PdfCoverGradientLayer[] = [];
    let i = 0;
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const g = item as Record<string, unknown>;
        const rect = rectFrom(g.rect ?? g.frame) ?? rectFrom(g);
        const css = gradientCss(g);
        if (!rect || !css) continue;
        const z = num(g, 'z_index', 'zIndex');
        out.push({ rect, css, zIndex: z ?? 5 + i });
        i += 1;
    }
    return out.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

/**
 * Если в ответе есть canvas + title_band (или эквивалент) — строим нормализованный макет.
 */
export function normalizePdfCoverLayout(raw: unknown): PdfCoverLayoutNormalized | null {
    if (!raw || typeof raw !== 'object') return null;
    const L = raw as Record<string, unknown>;

    const canvas = L.canvas as Record<string, unknown> | undefined;
    const canvasW = num(canvas, 'width', 'w');
    const canvasH = num(canvas, 'height', 'h');
    if (canvasW == null || canvasH == null || canvasW <= 0 || canvasH <= 0) return null;

    const tbRaw = (L.title_band ?? L.titleBand) as Record<string, unknown> | undefined;
    if (!tbRaw) return null;
    const bandRect = rectFrom(tbRaw);
    if (!bandRect) return null;

    const bg =
        typeof tbRaw.background === 'string'
            ? tbRaw.background
            : typeof tbRaw.background_color === 'string'
              ? tbRaw.background_color
              : typeof tbRaw.fill === 'string'
                ? tbRaw.fill
                : '#722257';

    const padding = padFrom(tbRaw.padding ?? tbRaw.insets);

    const typoRaw = (L.title_typography ?? L.titleTypography) as Record<string, unknown> | undefined;
    const titleText = {
        fontSize: num(typoRaw, 'font_size', 'fontSize') ?? 16,
        fontWeight: num(typoRaw, 'font_weight', 'fontWeight') ?? 700,
        color: typeof typoRaw?.color === 'string' ? typoRaw.color : '#ffffff',
        textAlign: (['left', 'center', 'right'].includes(String(typoRaw?.text_align ?? typoRaw?.textAlign))
            ? String(typoRaw?.text_align ?? typoRaw?.textAlign)
            : 'center') as 'left' | 'center' | 'right',
        fontFamily:
            typeof typoRaw?.font_family === 'string'
                ? typoRaw.font_family
                : typeof typoRaw?.fontFamily === 'string'
                  ? typoRaw.fontFamily
                  : undefined,
        lineHeight: num(typoRaw, 'line_height', 'lineHeight'),
    };

    const dateRaw = (L.date ?? L.date_block ?? L.dateBlock) as Record<string, unknown> | undefined;
    const dateRect = rectFrom(dateRaw ?? L.date_position);
    const dx = dateRect?.x ?? num(dateRaw, 'x', 'left') ?? canvasW - 140;
    const dy = dateRect?.y ?? num(dateRaw, 'y', 'top') ?? canvasH - 48;
    const dw = dateRect?.width ?? 130;
    const dh = dateRect?.height ?? 28;

    const dateTypo = (L.date_typography ?? L.dateTypography) as Record<string, unknown> | undefined;
    const date = {
        x: dx,
        y: dy,
        width: dw,
        height: dh,
        fontSize: num(dateTypo, 'font_size', 'fontSize') ?? 11,
        color: typeof dateTypo?.color === 'string' ? dateTypo.color : '#ffffff',
        textAlign: (['left', 'center', 'right'].includes(String(dateTypo?.text_align ?? dateTypo?.textAlign))
            ? String(dateTypo?.text_align ?? dateTypo?.textAlign)
            : 'right') as 'left' | 'center' | 'right',
        fontFamily:
            typeof dateTypo?.font_family === 'string'
                ? dateTypo.font_family
                : typeof dateTypo?.fontFamily === 'string'
                  ? dateTypo.fontFamily
                  : undefined,
        textShadow:
            typeof dateTypo?.text_shadow === 'string'
                ? dateTypo.text_shadow
                : typeof dateTypo?.textShadow === 'string'
                  ? dateTypo.textShadow
                  : '0 1px 3px rgba(0,0,0,0.85)',
    };

    const content = (L.content ?? {}) as Record<string, unknown>;
    const contentTitle =
        typeof content.title === 'string'
            ? content.title
            : typeof content.cover_title === 'string'
              ? content.cover_title
              : '';
    const contentDate = typeof content.date === 'string' ? content.date : '';

    const gradients = parseGradients(L.gradients);

    return {
        canvasW,
        canvasH,
        titleBand: { ...bandRect, background: bg, padding },
        titleText,
        date,
        contentTitle,
        contentDate,
        gradients,
    };
}
