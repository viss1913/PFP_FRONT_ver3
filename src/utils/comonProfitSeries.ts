/** Разбор вложенных ответов PFP и Comon для графика доходности. */

export function unwrapPfpDataEnvelope(raw: unknown): unknown {
    if (!raw || typeof raw !== 'object') return raw;
    const r = raw as Record<string, unknown>;
    if ('data' in r && r.data !== undefined) return r.data;
    return raw;
}

export type ComonProfitChartPoint = { date: string; value: number };

/**
 * Ищем первый массив точек с полем даты и числовым значением (value / rValue и т.д.).
 */
export function extractComonProfitChartPoints(raw: unknown): ComonProfitChartPoint[] {
    const unwrapped = unwrapPfpDataEnvelope(raw);
    const seen = new Set<unknown>();

    function findSeries(obj: unknown): Record<string, unknown>[] | null {
        if (obj == null || typeof obj !== 'object') return null;
        if (seen.has(obj)) return null;
        seen.add(obj);
        if (Array.isArray(obj)) {
            if (obj.length === 0) return null;
            const first = obj[0];
            if (first && typeof first === 'object') {
                const f = first as Record<string, unknown>;
                const hasDate = 'date' in f || 'Date' in f || 'dt' in f;
                const hasVal =
                    'value' in f ||
                    'rValue' in f ||
                    'r_value' in f ||
                    'val' in f ||
                    'y' in f;
                if (hasDate && hasVal) return obj as Record<string, unknown>[];
            }
            for (const el of obj) {
                const inner = findSeries(el);
                if (inner) return inner;
            }
            return null;
        }
        const o = obj as Record<string, unknown>;
        for (const k of ['strategy', 'data', 'series', 'points', 'history', 'values', 'items']) {
            if (k in o) {
                const inner = findSeries(o[k]);
                if (inner) return inner;
            }
        }
        for (const v of Object.values(o)) {
            const inner = findSeries(v);
            if (inner) return inner;
        }
        return null;
    }

    const series = findSeries(unwrapped);
    if (!series) return [];
    return series
        .map((pt) => {
            const date = String(pt.date ?? pt.Date ?? pt.dt ?? '');
            const value = Number(pt.value ?? pt.rValue ?? pt.r_value ?? pt.val ?? pt.y ?? 0);
            return { date, value: Number.isFinite(value) ? value : 0 };
        })
        .filter((p) => p.date.length > 0);
}

export type ComonMetricsView = {
    metrics: Record<string, unknown> | null;
    definitions: unknown;
};

export function extractComonMetricsView(raw: unknown): ComonMetricsView {
    let d: unknown = unwrapPfpDataEnvelope(raw);
    if (d && typeof d === 'object' && 'data' in (d as object)) {
        d = (d as Record<string, unknown>).data;
    }
    if (!d || typeof d !== 'object' || Array.isArray(d)) {
        return { metrics: null, definitions: null };
    }
    const o = d as Record<string, unknown>;
    const m = o.metrics;
    if (m && typeof m === 'object' && !Array.isArray(m)) {
        return {
            metrics: m as Record<string, unknown>,
            definitions: o.definitions ?? (m as Record<string, unknown>).definitions,
        };
    }
    const { definitions, ...rest } = o;
    const keys = Object.keys(rest);
    if (keys.length === 0) return { metrics: null, definitions: null };
    return { metrics: rest as Record<string, unknown>, definitions: definitions ?? null };
}
