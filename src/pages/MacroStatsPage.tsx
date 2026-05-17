import React, { useEffect, useState, useMemo } from 'react';
import Header from '../components/Header';
import { macroApi, type MacroLatestItem, type MacroHistoryPoint } from '../api/macroApi';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';

interface MacroStatsPageProps {
    onNavigate: (page: 'crm' | 'pfp' | 'ai-assistant' | 'ai-agent' | 'news' | 'macro' | 'settings') => void;
}

const CHART_COLORS = {
    primary: '#6B214C',
    gradientStart: '#A855F7',
    gradientEnd: '#D8B4FE',
    grid: '#E2E8F0',
    text: '#64748B',
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatValue = (value: number | string, unit: string) => {
    const n = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    if (unit === '%' || unit?.includes('percent') || unit?.includes('%')) return `${n.toFixed(2)}%`;
    if (unit === 'RUB' || unit?.toLowerCase().includes('rub')) return `${n.toLocaleString('ru-RU')} ₽`;
    return `${n.toLocaleString('ru-RU')} ${unit || ''}`.trim();
};

/** Скрытые на UI показатели (битые/неактуальные или лишние) */
function isHiddenMacroIndicator(item: MacroLatestItem): boolean {
    const name = item.name.toLowerCase();
    const slug = item.slug.toLowerCase();
    const hay = `${name} ${slug}`;

    if (name.includes('росстат') && name.includes('инфляц')) return true;
    if (slug.includes('rosstat') && slug.includes('inflation')) return true;
    if (hay.includes('золот') || slug.includes('gold')) return true;
    if (hay.includes('rucbicp') || slug.includes('rucbicp')) return true;
    if (name.includes('корпоративн') && name.includes('облигац')) return true;

    return false;
}

/** Порядок карточек: инфляция → ставка ЦБ → средняя макс. → остальное */
function getMacroSortPriority(item: MacroLatestItem): number {
    const name = item.name.toLowerCase();
    const slug = item.slug.toLowerCase();
    const hay = `${name} ${slug}`;

    if (hay.includes('инфляц') || hay.includes('inflation')) return 0;
    if (
        (hay.includes('ключев') && hay.includes('ставк'))
        || (hay.includes('ставка') && (hay.includes('цб') || hay.includes('cbr')))
        || hay.includes('key_rate')
    ) {
        return 1;
    }
    if (hay.includes('средн') && hay.includes('макс')) return 2;

    return 10;
}

function sortMacroIndicators(items: MacroLatestItem[]): MacroLatestItem[] {
    return [...items].sort((a, b) => {
        const diff = getMacroSortPriority(a) - getMacroSortPriority(b);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name, 'ru');
    });
}

const MacroStatsPage: React.FC<MacroStatsPageProps> = ({ onNavigate }) => {
    const [latest, setLatest] = useState<MacroLatestItem[]>([]);
    const [history, setHistory] = useState<MacroHistoryPoint[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [loadingLatest, setLoadingLatest] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingLatest(true);
            setError(null);
            try {
                const data = await macroApi.getLatest();
                if (!cancelled) {
                    setLatest(data);
                    const visible = sortMacroIndicators(
                        data.filter((item) => !isHiddenMacroIndicator(item)),
                    );
                    if (visible.length > 0) {
                        setSelectedSlug((prev) =>
                            prev && visible.some((x) => x.slug === prev) ? prev : visible[0].slug,
                        );
                    } else {
                        setSelectedSlug(null);
                    }
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setError(e instanceof Error ? e.message : 'Не удалось загрузить данные');
                }
            } finally {
                if (!cancelled) setLoadingLatest(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedSlug) {
            setHistory([]);
            return;
        }
        let cancelled = false;
        setLoadingHistory(true);
        const to = new Date();
        const from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);
        const fromStr = from.toISOString().slice(0, 10);
        const toStr = to.toISOString().slice(0, 10);
        macroApi
            .getHistory(selectedSlug, fromStr, toStr)
            .then((data) => {
                if (!cancelled) setHistory(data);
            })
            .catch(() => {
                if (!cancelled) setHistory([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingHistory(false);
            });
        return () => { cancelled = true; };
    }, [selectedSlug]);

    const visibleLatest = useMemo(
        () =>
            sortMacroIndicators(latest.filter((item) => !isHiddenMacroIndicator(item))),
        [latest],
    );

    useEffect(() => {
        if (!selectedSlug) return;
        if (visibleLatest.some((x) => x.slug === selectedSlug)) return;
        setSelectedSlug(visibleLatest[0]?.slug ?? null);
    }, [visibleLatest, selectedSlug]);

    const selectedMeta = useMemo(
        () => visibleLatest.find((x) => x.slug === selectedSlug),
        [visibleLatest, selectedSlug],
    );

    const chartData = useMemo(
        () =>
            history
                .map((p) => ({ ...p, date: p.date, value: Number(p.value) }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        [history]
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
            <Header activePage="macro" onNavigate={onNavigate} />

            <main className="lk-page-main" style={{ maxWidth: '1200px' }}>
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                        border: '1px solid #f0f0f0',
                        marginBottom: '24px',
                    }}
                >
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
                        Макростатистика
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                        Ключевые макро‑показатели: инфляция, ставка ЦБ, вклады и курсы валют.
                    </p>
                    {error && (
                        <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>
                            {error}
                        </p>
                    )}
                </div>

                {/* Карточки текущих значений */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '20px',
                        marginBottom: '28px',
                    }}
                >
                    {loadingLatest ? (
                        <div style={{ gridColumn: '1 / -1', color: '#64748B', fontSize: '14px' }}>
                            Загрузка показателей…
                        </div>
                    ) : visibleLatest.length === 0 && !error ? (
                        <div style={{ gridColumn: '1 / -1', color: '#64748B', fontSize: '14px' }}>
                            Нет данных. Проверь авторизацию или что бэк отдаёт /api/pfp/macro/latest.
                        </div>
                    ) : (
                        visibleLatest.map((item) => (
                            <div
                                key={item.slug}
                                onClick={() => setSelectedSlug(item.slug)}
                                style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    padding: '20px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                    border: `2px solid ${selectedSlug === item.slug ? CHART_COLORS.primary : '#f3f4f6'}`,
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: CHART_COLORS.primary }}>
                                    {formatValue(item.value, item.unit)}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                    {formatDate(item.date)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* График истории по выбранному показателю */}
                {selectedSlug && (
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '24px',
                            padding: '28px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                            border: '1px solid #f0f0f0',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111', margin: 0 }}>
                                {selectedMeta?.name || selectedSlug}
                            </h2>
                            <select
                                value={selectedSlug}
                                onChange={(e) => setSelectedSlug(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #e5e7eb',
                                    fontSize: '14px',
                                    color: '#374151',
                                    minWidth: '220px',
                                }}
                            >
                                {visibleLatest.map((item) => (
                                    <option key={item.slug} value={item.slug}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {loadingHistory ? (
                            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CHART_COLORS.text }}>
                                Загрузка графика…
                            </div>
                        ) : chartData.length === 0 ? (
                            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: CHART_COLORS.text }}>
                                Нет данных за период
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: '320px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="macroGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={CHART_COLORS.gradientStart} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={CHART_COLORS.gradientEnd} stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                                            tickFormatter={(v) => formatDate(v)}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: CHART_COLORS.text }}
                                            tickFormatter={(v) => (selectedMeta?.unit === '%' || selectedMeta?.unit?.includes('percent') ? `${v}%` : String(v))}
                                        />
                                        <Tooltip
                                            labelFormatter={(v) => formatDate(v)}
                                            formatter={(value: number | string | undefined) => [
                                                formatValue(Number(value ?? 0), selectedMeta?.unit || ''),
                                                selectedMeta?.name || selectedSlug,
                                            ]}
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={CHART_COLORS.primary}
                                            strokeWidth={2}
                                            fill="url(#macroGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MacroStatsPage;
