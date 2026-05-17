import React, { useCallback, useMemo, useState } from 'react';
import { Search, Users, Mail, Copy, Check } from 'lucide-react';
import type {
    SubagentCrmStatus,
    SubagentDashboardResponse,
    SubagentDashboardRow,
} from '../api/agentLkApi';
import { agentLkApi, getSubagentInviteErrorMessage } from '../api/agentLkApi';
import { CRM_STATUS_COLORS, CRM_STATUS_LABELS, CRM_STATUS_ORDER } from '../constants/crmStatus';
import { formatMoneyRub, formatTermMonths } from '../utils/formatMoney';
import SubagentInviteModal from './SubagentInviteModal';

interface SubagentNetworkViewProps {
    dashboard: SubagentDashboardResponse;
    loading?: boolean;
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getInitials(row: SubagentDashboardRow): string {
    const a = row.first_name?.[0] ?? '';
    const b = row.last_name?.[0] ?? '';
    const initials = `${a}${b}`.toUpperCase();
    return initials || '?';
}

const CrmBadges: React.FC<{ crm?: Partial<Record<SubagentCrmStatus, number>> }> = ({ crm }) => (
    <>
        {CRM_STATUS_ORDER.map((status) => {
            const count = crm?.[status] ?? 0;
            const color = CRM_STATUS_COLORS[status];
            return (
                <span
                    key={status}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: `1px solid ${color}40`,
                        background: `${color}12`,
                        color,
                    }}
                >
                    {CRM_STATUS_LABELS[status]}: {count}
                </span>
            );
        })}
    </>
);

const MetricCol: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div style={{ textAlign: 'right', minWidth: '72px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>{value}</div>
            {sub ? <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{sub}</div> : null}
    </div>
);

const headerBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#374151',
};

const SubagentNetworkView: React.FC<SubagentNetworkViewProps> = ({ dashboard, loading }) => {
    const [search, setSearch] = useState('');
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [copyLoading, setCopyLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState<string | null>(null);
    const { summary, data } = dashboard;

    const handleCopyInviteLink = useCallback(async () => {
        setCopyLoading(true);
        setCopyError(null);
        try {
            const { url } = await agentLkApi.getAgentInviteLink();
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            setCopyError(getSubagentInviteErrorMessage(err));
        } finally {
            setCopyLoading(false);
        }
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data.filter((row) => {
            const hay = [
                row.first_name,
                row.last_name,
                row.email,
                row.partner_agent_id,
                row.referral_slug,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [data, search]);

    const kpiItems: Array<{ label: string; value: string; sub?: string; large?: boolean }> = [
        { label: 'Субагентов в сети', value: String(summary.subagents_count ?? 0) },
        { label: 'Всего клиентов', value: String(summary.clients_count ?? 0) },
        { label: 'С сохранённым расчётом ПФП', value: String(summary.clients_with_plan_count ?? 0) },
        {
            label: 'НСЖ — премия контракта',
            value: formatMoneyRub(summary.nsj_contract_premium_rub),
            sub: `в год: ${formatMoneyRub(summary.nsj_annual_premium_rub)}`,
            large: true,
        },
        { label: 'Клиентов с целью LIFE', value: String(summary.nsj_clients_count ?? 0) },
        { label: 'Капитал по остальным целям', value: formatMoneyRub(summary.investment_capital_rub) },
        { label: 'Средний срок (мес.)', value: formatTermMonths(summary.avg_term_months) },
    ];

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginBottom: '24px',
                }}
            >
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>
                            Сеть субагентов
                        </h1>
                        <p style={{ color: '#6b7280', margin: 0 }}>
                            Агрегаты по прямым субагентам (один уровень)
                        </p>
                        {copyError ? (
                            <p style={{ color: '#dc2626', fontSize: '13px', margin: '8px 0 0' }}>{copyError}</p>
                        ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            style={{
                                ...headerBtnStyle,
                                background: copied ? '#dcfce7' : '#fff',
                                color: copied ? '#16a34a' : '#374151',
                                borderColor: copied ? '#86efac' : '#e5e7eb',
                            }}
                            onClick={handleCopyInviteLink}
                            disabled={copyLoading}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            {copyLoading ? 'Загрузка…' : copied ? 'Скопировано' : 'Скопировать ссылку'}
                        </button>
                        <button
                            type="button"
                            style={{
                                ...headerBtnStyle,
                                background: '#111',
                                color: '#fff',
                                borderColor: '#111',
                            }}
                            onClick={() => setInviteModalOpen(true)}
                        >
                            <Mail size={18} />
                            Пригласить на email
                        </button>
                    </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                }}
            >
                {kpiItems.map((item) => (
                    <div
                        key={item.label}
                        style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                        }}
                    >
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</div>
                        <div
                            style={{
                                fontWeight: 700,
                                fontSize: item.large ? '20px' : '18px',
                                color: '#111',
                                lineHeight: 1.2,
                            }}
                        >
                            {item.value}
                        </div>
                        {item.sub ? (
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{item.sub}</div>
                        ) : null}
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px' }}>
                Цифры из расчёта ПФП (goals_summary), не факт оформления полисов. Детали клиентов субагентов недоступны.
            </p>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
                    <Search
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или Finam ID…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '14px 14px 14px 48px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            color: '#111',
                            fontSize: '15px',
                            boxSizing: 'border-box',
                        }}
                    />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Загрузка…</div>
                ) : filtered.length > 0 ? (
                    filtered.map((row) => {
                        const m = row.metrics ?? {};
                        return (
                            <div
                                key={row.id}
                                style={{
                                    padding: '18px 20px',
                                    borderRadius: '16px',
                                    border: '1px solid #e5e7eb',
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '14px', flex: 1, minWidth: '200px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'rgba(217, 70, 239, 0.12)',
                                            color: '#9333ea',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '16px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {getInitials(row)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111' }}>
                                                {row.first_name} {row.last_name}
                                            </h3>
                                            <span
                                                style={{
                                                    fontSize: '11px',
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    background: row.is_active ? '#dcfce7' : '#f3f4f6',
                                                    color: row.is_active ? '#16a34a' : '#6b7280',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {row.is_active ? 'Активен' : 'Неактивен'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{row.email}</div>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                color: '#9ca3af',
                                                marginTop: '4px',
                                                display: 'flex',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {row.partner_agent_id ? <span>ID: {row.partner_agent_id}</span> : null}
                                            {row.referral_slug ? <span>ref: {row.referral_slug}</span> : null}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <MetricCol label="Клиентов" value={String(m.clients_count ?? 0)} />
                                    <MetricCol label="С планом ПФП" value={String(m.clients_with_plan_count ?? 0)} />
                                    <MetricCol
                                        label="НСЖ контракт"
                                        value={formatMoneyRub(m.nsj_contract_premium_rub)}
                                        sub={`в год: ${formatMoneyRub(m.nsj_annual_premium_rub)}`}
                                    />
                                    <MetricCol label="Капитал" value={formatMoneyRub(m.investment_capital_rub)} />
                                    <MetricCol label="Срок (мес.)" value={formatTermMonths(m.avg_term_months)} />
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>CRM</div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: '6px',
                                                justifyContent: 'flex-end',
                                                maxWidth: '220px',
                                            }}
                                        >
                                            <CrmBadges crm={m.crm} />
                                        </div>
                                    </div>
                                    <MetricCol label="Последний клиент" value={formatDate(m.last_client_at)} />
                                    <MetricCol label="Создан" value={formatDate(row.created_at)} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '48px',
                            color: '#6b7280',
                            background: '#f9fafb',
                            borderRadius: '16px',
                        }}
                    >
                        <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                        <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Субагентов пока нет</h3>
                        <p style={{ margin: 0 }}>Пригласите субагентов в сеть — метрики появятся здесь</p>
                    </div>
                )}
            </div>

            <SubagentInviteModal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
            />
        </div>
    );
};

export default SubagentNetworkView;
