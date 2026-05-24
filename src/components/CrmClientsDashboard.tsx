import React, { useEffect, useMemo, useState } from 'react';
import { crmApi } from '../api/crmApi';
import type { CrmAgentDashboardResponse } from '../types/crm';
import { formatMoneyRub } from '../utils/formatMoney';

type SummaryCardVariant = 'clients' | 'capital-0' | 'capital-1' | 'capital-2' | 'capital-3' | 'capital-4' | 'insurance';

interface SummaryCardItem {
    key: string;
    label: string;
    value: string;
    sub?: string;
    variant: SummaryCardVariant;
}

const CAPITAL_VARIANTS: SummaryCardVariant[] = [
    'capital-0',
    'capital-1',
    'capital-2',
    'capital-3',
    'capital-4',
];

function formatAsOf(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const CrmClientsDashboard: React.FC = () => {
    const [data, setData] = useState<CrmAgentDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const dashboard = await crmApi.getCrmDashboard();
                if (!cancelled) setData(dashboard);
            } catch (e) {
                console.error('Failed to load CRM dashboard:', e);
                if (!cancelled) {
                    setError('Не удалось загрузить сводку');
                    setData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const cards = useMemo((): SummaryCardItem[] => {
        if (!data) return [];
        const items: SummaryCardItem[] = [
            {
                key: 'clients',
                label: 'Всего клиентов',
                value: String(data.clients_total ?? 0),
                sub:
                    (data.clients_new_this_month ?? 0) > 0
                        ? `+${data.clients_new_this_month} за месяц`
                        : undefined,
                variant: 'clients',
            },
        ];

        (data.capital_by_product ?? []).forEach((row, index) => {
            const key = row.product_id != null ? `product-${row.product_id}` : `product-${row.name}`;
            items.push({
                key,
                label: row.name || 'Продукт',
                value: formatMoneyRub(row.amount_rub),
                variant: CAPITAL_VARIANTS[index % CAPITAL_VARIANTS.length],
            });
        });

        items.push({
            key: 'insurance',
            label: 'Премии страхования',
            value: formatMoneyRub(data.insurance_premiums_rub),
            sub: 'годовые премии НСЖ',
            variant: 'insurance',
        });

        return items;
    }, [data]);

    if (loading) {
        return (
            <section className="crm-summary-dashboard" aria-busy="true">
                <h2 className="crm-summary-dashboard__title">Краткий дашборд</h2>
                <div className="crm-summary-dashboard__grid crm-summary-dashboard__grid--skeleton">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="crm-summary-card crm-summary-card--skeleton" />
                    ))}
                </div>
            </section>
        );
    }

    if (error || !data) {
        return (
            <section className="crm-summary-dashboard">
                <h2 className="crm-summary-dashboard__title">Краткий дашборд</h2>
                <p className="crm-summary-dashboard__error">{error ?? 'Нет данных'}</p>
            </section>
        );
    }

    return (
        <section className="crm-summary-dashboard">
            <h2 className="crm-summary-dashboard__title">Краткий дашборд</h2>
            <div className="crm-summary-dashboard__grid">
                {cards.map((card) => (
                    <div
                        key={card.key}
                        className={`crm-summary-card crm-summary-card--${card.variant}`}
                    >
                        <div className="crm-summary-card__label">{card.label}</div>
                        <div className="crm-summary-card__value">{card.value}</div>
                        {card.sub ? <div className="crm-summary-card__sub">{card.sub}</div> : null}
                    </div>
                ))}
            </div>
            {data.as_of ? (
                <p className="crm-summary-dashboard__footnote">
                    Капитал — снимок расчёта ПФП на {formatAsOf(data.as_of)}
                </p>
            ) : null}
        </section>
    );
};

export default CrmClientsDashboard;
