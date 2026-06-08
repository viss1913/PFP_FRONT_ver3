import React, { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import type { Client } from '../../types/client';
import type { CrmCommissionByProductRow, CrmCommissionForecastResponse } from '../../types/commission';
import { formatMoneyRub } from '../../utils/formatMoney';
import { useCommissionForecastCache } from '../../hooks/useCommissionForecastCache';

interface CrmCommissionForecastModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: number | null;
    clientTitle: string;
    client?: Client | null;
}

function formatAsOf(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function hasNonZeroCommission(row: CrmCommissionByProductRow): boolean {
    return (row.commission_year_1_rub ?? 0) > 0 || (row.commission_total_rub ?? 0) > 0;
}

function normalizeErrorMessage(err: unknown): string {
    if (!err || typeof err !== 'object') return 'Не удалось загрузить прогноз комиссий';
    const e = err as { response?: { status?: number; data?: any } };
    const status = e.response?.status;
    if (status === 403) return 'Нет прав для просмотра/расчёта прогноза комиссий';
    if (status === 404) return 'Клиент не найден';
    if (status === 400) return 'Ошибка валидации данных для прогноза';
    return 'Не удалось загрузить прогноз комиссий. Попробуйте позже.';
}

const CrmCommissionForecastModal: React.FC<CrmCommissionForecastModalProps> = ({
    isOpen,
    onClose,
    clientId,
    clientTitle,
}) => {
    const { getCommissionForecast } = useCommissionForecastCache();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecast, setForecast] = useState<CrmCommissionForecastResponse | null>(null);

    useEffect(() => {
        if (!isOpen || clientId == null) return;

        let cancelled = false;
        setLoading(true);
        setError(null);
        setForecast(null);

        void getCommissionForecast(clientId)
            .then((res) => {
                if (!cancelled) setForecast(res);
            })
            .catch((e) => {
                if (!cancelled) setError(normalizeErrorMessage(e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOpen, clientId, getCommissionForecast]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    const seriesChartData = useMemo(() => {
        if (!forecast) return [];
        return forecast.series.map((p) => ({
            year: p.year,
            value: p.commission_rub,
        }));
    }, [forecast]);

    const isZeroForecast = useMemo(() => {
        if (!forecast) return false;
        return (forecast.commission_year_1_rub ?? 0) <= 0 && (forecast.commission_total_rub ?? 0) <= 0;
    }, [forecast]);

    const commissionProducts = useMemo(() => {
        if (!forecast?.commission_by_product?.length) return [];
        return [...forecast.commission_by_product]
            .filter(hasNonZeroCommission)
            .sort((a, b) => (b.commission_total_rub ?? 0) - (a.commission_total_rub ?? 0));
    }, [forecast]);

    const maxCommissionTotal = useMemo(() => {
        if (!commissionProducts.length) return 0;
        return Math.max(...commissionProducts.map((r) => r.commission_total_rub ?? 0));
    }, [commissionProducts]);

    return (
        <AnimatePresence>
            {isOpen && clientId != null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        onClick={(e) => e.stopPropagation()}
                        className="premium-card crm-commission-modal"
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '860px',
                            maxHeight: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '24px',
                            overflow: 'hidden',
                        }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Закрыть"
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                zIndex: 1,
                            }}
                        >
                            <X size={22} />
                        </button>

                        <header className="crm-commission-modal__header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 40 }}>
                                <TrendingUp size={20} />
                                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Прогноз комиссий</h2>
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
                                {clientTitle.trim() || 'Клиент'} · ID: {clientId}
                            </p>
                            <div className="crm-commission-kpi-grid">
                                <div className="crm-commission-kpi">
                                    <div className="crm-commission-kpi__label">Доход за 1-й год</div>
                                    <div className="crm-commission-kpi__value">
                                        {forecast ? formatMoneyRub(forecast.commission_year_1_rub) : '—'}
                                    </div>
                                </div>
                                <div className="crm-commission-kpi">
                                    <div className="crm-commission-kpi__label">Доход за весь срок</div>
                                    <div className="crm-commission-kpi__value">
                                        {forecast ? formatMoneyRub(forecast.commission_total_rub) : '—'}
                                    </div>
                                </div>
                                <div className="crm-commission-kpi crm-commission-kpi--muted">
                                    <div className="crm-commission-kpi__label">Продуктов в расчете</div>
                                    <div className="crm-commission-kpi__value">
                                        {commissionProducts.length}
                                    </div>
                                </div>
                            </div>
                            {!loading && !error && isZeroForecast && (
                                <div className="crm-commission-empty-note">
                                    Пока нет прогноза комиссий. Проверьте `commission_schema` у продуктов LIFE.
                                </div>
                            )}
                        </header>

                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                marginTop: 16,
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.6)',
                                padding: 16,
                            }}
                        >
                            {loading && (
                                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Загрузка…
                                </div>
                            )}

                            {!loading && error && (
                                <div style={{ padding: 24, textAlign: 'center' }}>
                                    <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        style={{
                                            padding: '10px 20px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(99,102,241,0.15)',
                                            color: '#4f46e5',
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                        }}
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            )}

                            {!loading && !error && (
                                <>
                                    <div style={{ height: 260 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={seriesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="year" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value: any) => formatMoneyRub(Number(value) || 0)}
                                                    labelFormatter={(label: any) => `Год ${label}`}
                                                />
                                                <Bar dataKey="value" fill="rgba(139,92,246,0.75)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {commissionProducts.length > 0 && (
                                        <div className="crm-commission-breakdown crm-commission-breakdown--modal">
                                            <div className="crm-commission-breakdown__header">
                                                <h3 className="crm-commission-breakdown__title">Разбивка по продуктам</h3>
                                                <span className="crm-commission-breakdown__badge">
                                                    {commissionProducts.length}{' '}
                                                    {commissionProducts.length === 1
                                                        ? 'продукт'
                                                        : commissionProducts.length < 5
                                                          ? 'продукта'
                                                          : 'продуктов'}
                                                </span>
                                            </div>
                                            <div className="crm-commission-products-grid">
                                                {commissionProducts.map((row, idx) => {
                                                    const sharePct =
                                                        maxCommissionTotal > 0
                                                            ? Math.round(
                                                                  ((row.commission_total_rub ?? 0) / maxCommissionTotal) * 100,
                                                              )
                                                            : 0;
                                                    return (
                                                        <article
                                                            key={
                                                                row.product_id != null
                                                                    ? String(row.product_id)
                                                                    : `${row.name}-${idx}`
                                                            }
                                                            className={`crm-commission-product-card crm-commission-product-card--${idx % 5}`}
                                                        >
                                                            <h4
                                                                className="crm-commission-product-card__name"
                                                                title={row.name}
                                                            >
                                                                {row.name}
                                                            </h4>
                                                            <div className="crm-commission-product-card__metrics">
                                                                <div className="crm-commission-product-card__metric">
                                                                    <span className="crm-commission-product-card__metric-label">
                                                                        1-й год
                                                                    </span>
                                                                    <span className="crm-commission-product-card__metric-value">
                                                                        {formatMoneyRub(row.commission_year_1_rub)}
                                                                    </span>
                                                                </div>
                                                                <div className="crm-commission-product-card__metric crm-commission-product-card__metric--total">
                                                                    <span className="crm-commission-product-card__metric-label">
                                                                        Весь срок
                                                                    </span>
                                                                    <span className="crm-commission-product-card__metric-value">
                                                                        {formatMoneyRub(row.commission_total_rub)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {maxCommissionTotal > 0 && (
                                                                <div className="crm-commission-product-card__bar" aria-hidden>
                                                                    <div
                                                                        className="crm-commission-product-card__bar-fill"
                                                                        style={{ width: `${sharePct}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {!loading && !error && forecast?.as_of ? (
                            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                                Прогноз комиссий, не факт начисления · на {formatAsOf(forecast.as_of)}
                            </p>
                        ) : null}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CrmCommissionForecastModal;

