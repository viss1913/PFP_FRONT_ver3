import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Calendar, Wallet, ChevronLeft, ChevronRight, Edit2, TrendingUp, FileText } from 'lucide-react';
import { clientApi } from '../api/clientApi';
import type { Client } from '../types/client';
import StatusDropdown from './StatusDropdown';
import { getGoalTypeLabel } from '../utils/GoalImages';


interface ClientListProps {
    onSelectClient: (client: Client) => void;
    onNewClient: () => void;
    embedded?: boolean;
    style?: React.CSSProperties;
}

const ClientList: React.FC<ClientListProps> = ({ onSelectClient, onNewClient, embedded, style }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, page]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const result = await clientApi.getAgentClients({ search, page, limit });
            // Handle case where API might just return array or wrapped in data object based on pfp-api.yaml vs real backend
            // Our types say it returns { data: Client[], meta: ... } but let's be safe if it returns array directly
            if (Array.isArray(result)) {
                setClients(result);
                setTotal(result.length);
            } else if (result.data) {
                setClients(result.data);
                const pagination = (result as any).pagination;
                const meta = (result as any).meta;
                setTotal(pagination?.total ?? meta?.total ?? result.data.length);
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            // Fallback for demo/error
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMoney = (amount?: number) => {
        if (amount === undefined || amount === null) return '0 ₽';
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
    };

    /** Ежемесячное пополнение: с корня клиента, из goals_summary или сумма по целям */
    const getMonthlyReplenishment = (client: Client): number | undefined => {
        if (client.total_monthly_replenishment != null && client.total_monthly_replenishment > 0) {
            return client.total_monthly_replenishment;
        }
        const gs = client.goals_summary as any;
        const fromSummary = gs?.summary?.consolidated_portfolio?.total_monthly_replenishment
            ?? gs?.consolidated_portfolio?.total_monthly_replenishment;
        if (fromSummary != null && fromSummary > 0) return fromSummary;
        const fromGoalsSummary = Array.isArray(gs?.goals)
            ? (gs.goals as any[]).reduce((s, g) => s + (Number(g?.summary?.monthly_replenishment) || 0), 0)
            : 0;
        if (fromGoalsSummary > 0) return fromGoalsSummary;
        const fromGoals = (client.goals ?? []).reduce((s, g) => s + (Number(g.monthly_replenishment) || 0), 0);
        return fromGoals > 0 ? fromGoals : undefined;
    };

    return (
        <div style={{
            maxWidth: embedded ? '100%' : '1000px',
            margin: embedded ? '0' : '0 auto',
            padding: embedded ? '0' : '20px',
            ...style
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Клиенты</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Управление базой клиентов</p>
                </div>
                <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={onNewClient}
                >
                    <Plus size={20} />
                    Новый клиент
                </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '24px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Поиск по имени, телефону или ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '16px 16px 16px 48px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '16px'
                    }}
                />
            </div>

            {/* Client List */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Загрузка...</div>
                ) : clients.length > 0 ? (
                    clients.map((client) => (
                        <div
                            key={client.id || client.uuid}
                            className="premium-card"
                            style={{
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'transform 0.2s',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: activeDropdownId === client.id ? 100 : 1
                            }}
                            onClick={() => onSelectClient(client)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 199, 80, 0.1)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '18px',
                                    flexShrink: 0
                                }}>
                                    {client.first_name ? client.first_name[0].toUpperCase() : <User size={24} />}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '18px' }}>
                                        {client.first_name} {client.last_name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: '14px', flexWrap: 'wrap' }}>
                                        <span>{client.phone}</span>
                                        <span>•</span>
                                        <span>ID: {client.id}</span>
                                    </div>
                                    {client.goals && client.goals.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                            {[...new Set(client.goals.map((g) => g.goal_type_id))].map((typeId) => (
                                                <span
                                                    key={typeId}
                                                    style={{
                                                        fontSize: '11px',
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        background: 'rgba(255, 199, 80, 0.15)',
                                                        color: 'var(--primary)'
                                                    }}
                                                >
                                                    {getGoalTypeLabel(typeId)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                        <Wallet size={14} /> Капитал
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{formatMoney(client.total_liquid_capital ?? client.net_worth)}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                        <TrendingUp size={14} /> Пополн./мес
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                        {(() => { const v = getMonthlyReplenishment(client); return v != null ? formatMoney(v) : '—'; })()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                        <FileText size={14} /> Последний ПФП
                                    </div>
                                    <div style={{ fontSize: '14px' }}>{formatDate(client.last_pfp_at)}</div>
                                </div>
                                <div>
                                    <StatusDropdown
                                        clientId={client.id}
                                        currentStatus={client.crm_status || 'THINKING'}
                                        onOpenChange={(isOpen) => setActiveDropdownId(isOpen ? client.id : null)}
                                    />
                                </div>
                                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                                        <Calendar size={14} /> Создан
                                    </div>
                                    <div style={{ fontSize: '14px' }}>{formatDate(client.created_at)}</div>
                                </div>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    <Edit2 size={16} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <User size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <h3>Клиенты не найдены</h3>
                        <p>Попробуйте изменить поиск или добавьте нового клиента</p>
                    </div>
                )}
            </div>

            {/* Pagination (Simple) */}
            {total > limit && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: page === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                            cursor: page === 1 ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--text-muted)' }}>
                        Страница {page}
                    </span>
                    <button
                        disabled={page * limit >= total}
                        onClick={() => setPage(p => p + 1)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: page * limit >= total ? 'rgba(255,255,255,0.2)' : '#fff',
                            cursor: page * limit >= total ? 'default' : 'pointer'
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ClientList;
