import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    Plus,
    User,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    UserPlus,
    SlidersHorizontal,
    MoreHorizontal,
} from 'lucide-react';
import { clientApi } from '../api/clientApi';
import type { Client } from '../types/client';
import StatusDropdown from './StatusDropdown';
import ClientB2cChatAiModal from './ClientB2cChatAiModal';
import FamilyOfficeInviteModal from './FamilyOfficeInviteModal';
import { clientToFamilyOfficeInvitePrefill } from '../utils/familyOfficeInvite';
import type { FamilyOfficeInviteRequest } from '../api/agentLkApi';
import {
    formatBirthDateAndAge,
    formatDateShort,
    formatDateTimeActivity,
    formatRelativeDueBadge,
    getClientActivityDate,
    getClientInitials,
    getLastRebalanceTimestamp,
    getLifeInsuranceRenewalDate,
    getNextRebalanceDate,
    type DueBadgeTone,
} from '../utils/crmClientDates';

type RebalanceSort = 'none' | 'asc' | 'desc';

interface ClientListProps {
    onSelectClient: (client: Client) => void;
    onNewClient: () => void;
    embedded?: boolean;
    lightSearch?: boolean;
    style?: React.CSSProperties;
}

function DueBadgePill({ label, tone }: { label: string; tone: DueBadgeTone }) {
    if (tone === 'unknown') {
        return <span className="crm-due-badge crm-due-badge--unknown">{label}</span>;
    }
    return <span className={`crm-due-badge crm-due-badge--${tone}`}>{label}</span>;
}

function ScheduledDateCell({ scheduled }: { scheduled: Date | null }) {
    const badge = formatRelativeDueBadge(scheduled);
    return (
        <div className="crm-date-cell">
            <div className="crm-date-cell__date">{formatDateShort(scheduled)}</div>
            <DueBadgePill label={badge.label} tone={badge.tone} />
        </div>
    );
}

const ClientList: React.FC<ClientListProps> = ({
    onSelectClient,
    onNewClient,
    embedded,
    lightSearch = false,
    style,
}) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(50);
    const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
    const [chatModalClient, setChatModalClient] = useState<Client | null>(null);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [invitePrefill, setInvitePrefill] = useState<Partial<FamilyOfficeInviteRequest> | undefined>();
    const [rebalanceSort, setRebalanceSort] = useState<RebalanceSort>('none');
    const trimmedSearch = search.trim();

    const displayedClients = useMemo(() => {
        if (rebalanceSort === 'none') return clients;
        const sorted = [...clients];
        sorted.sort((a, b) => {
            const ta = getLastRebalanceTimestamp(a);
            const tb = getLastRebalanceTimestamp(b);
            return rebalanceSort === 'asc' ? ta - tb : tb - ta;
        });
        return sorted;
    }, [clients, rebalanceSort]);

    const cycleRebalanceSort = () => {
        setRebalanceSort((prev) => {
            if (prev === 'none') return 'desc';
            if (prev === 'desc') return 'asc';
            return 'none';
        });
    };

    const openInviteModal = (prefill?: Partial<FamilyOfficeInviteRequest>) => {
        setInvitePrefill(prefill);
        setInviteModalOpen(true);
    };

    const closeInviteModal = () => {
        setInviteModalOpen(false);
        setInvitePrefill(undefined);
    };

    useEffect(() => {
        setPage(1);
        setRebalanceSort('none');
    }, [trimmedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchClients();
        }, 500);
        return () => clearTimeout(timer);
    }, [trimmedSearch, page]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const result = await clientApi.getAgentClients({
                search: trimmedSearch || undefined,
                page,
                limit,
                include_chat_ai: false,
            });
            if (Array.isArray(result)) {
                setClients(result);
                setTotal(result.length);
            } else if (result.data) {
                setClients(result.data);
                const pagination = (result as { pagination?: { total?: number }; meta?: { total?: number } })
                    .pagination;
                const meta = (result as { meta?: { total?: number } }).meta;
                setTotal(pagination?.total ?? meta?.total ?? result.data.length);
            } else {
                setClients([]);
                setTotal(0);
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
            setClients([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div
            className={`client-list-root${embedded ? ' client-list-root--embedded' : ''}`}
            style={style}
        >
            <div className="crm-clients-header">
                <h2 className="crm-clients-header__title">Клиенты</h2>
                <div className="crm-clients-toolbar">
                    <div
                        className={`client-list-search${lightSearch ? ' client-list-search--light' : ''}`}
                    >
                        <Search
                            size={18}
                            className="client-list-search__icon"
                            aria-hidden
                        />
                        <input
                            type="text"
                            placeholder="Поиск по имени, телефону, email или UUID"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Поиск клиентов"
                        />
                    </div>
                    <button
                        type="button"
                        className="crm-filters-btn"
                        disabled
                        title="Скоро"
                    >
                        <SlidersHorizontal size={18} />
                        Фильтры
                    </button>
                    <button
                        type="button"
                        className="crm-btn-invite"
                        onClick={() => openInviteModal()}
                    >
                        <UserPlus size={18} />
                        <span className="crm-btn-invite__label">Пригласить</span>
                    </button>
                    <button type="button" className="crm-btn-new-client" onClick={onNewClient}>
                        <Plus size={18} />
                        Новый клиент
                    </button>
                </div>
            </div>

            <div className="crm-clients-table-wrap">
                {loading ? (
                    <div className="crm-clients-empty">Загрузка…</div>
                ) : clients.length > 0 ? (
                    <table className="crm-clients-table">
                        <thead>
                            <tr>
                                <th>Клиент</th>
                                <th>Дата создания</th>
                                <th>
                                    <button
                                        type="button"
                                        className="crm-th-sort"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            cycleRebalanceSort();
                                        }}
                                        title="Сортировка по дате последнего пересчёта"
                                    >
                                        След. ребалансировка
                                        {rebalanceSort === 'asc' ? ' ↑' : rebalanceSort === 'desc' ? ' ↓' : ''}
                                    </button>
                                </th>
                                <th>ДР / Возраст</th>
                                <th>Продление полиса СЖ</th>
                                <th>Статус</th>
                                <th>Последняя активность</th>
                                <th aria-label="Действия" />
                            </tr>
                        </thead>
                        <tbody>
                            {displayedClients.map((client) => (
                                <tr
                                    key={client.id || client.uuid}
                                    className="crm-clients-table__row"
                                    style={{
                                        position: 'relative',
                                        zIndex: activeDropdownId === client.id ? 10 : undefined,
                                    }}
                                    onClick={() => onSelectClient(client)}
                                >
                                    <td>
                                        <div className="crm-client-cell">
                                            <div className="crm-client-avatar">
                                                {getClientInitials(client)}
                                            </div>
                                            <div className="crm-client-info">
                                                <div className="crm-client-info__name">
                                                    {client.first_name} {client.last_name}
                                                </div>
                                                <div className="crm-client-info__meta">
                                                    {client.phone || '—'}
                                                    {client.id ? (
                                                        <>
                                                            <span className="crm-client-info__dot">·</span>
                                                            ID {client.id}
                                                        </>
                                                    ) : null}
                                                </div>
                                                {client.has_plan === false ? (
                                                    <span className="crm-client-no-plan">без плана</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="crm-clients-table__muted">
                                        {formatDateShort(
                                            client.created_at ? new Date(client.created_at) : null,
                                        )}
                                    </td>
                                    <td>
                                        <ScheduledDateCell scheduled={getNextRebalanceDate(client)} />
                                    </td>
                                    <td className="crm-clients-table__muted">
                                        {formatBirthDateAndAge(client.birth_date)}
                                    </td>
                                    <td>
                                        <ScheduledDateCell scheduled={getLifeInsuranceRenewalDate(client)} />
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <StatusDropdown
                                            clientId={client.id}
                                            currentStatus={client.crm_status || 'THINKING'}
                                            onOpenChange={(isOpen) =>
                                                setActiveDropdownId(isOpen ? client.id : null)
                                            }
                                        />
                                    </td>
                                    <td className="crm-clients-table__muted">
                                        {formatDateTimeActivity(getClientActivityDate(client))}
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="crm-row-actions">
                                            <button
                                                type="button"
                                                className="crm-row-actions__btn"
                                                title="Пригласить в Family Office"
                                                onClick={() =>
                                                    openInviteModal(
                                                        clientToFamilyOfficeInvitePrefill(client),
                                                    )
                                                }
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="crm-row-actions__btn"
                                                title="История чата B2C AI"
                                                onClick={() => setChatModalClient(client)}
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="crm-row-actions__btn"
                                                title="Открыть карточку"
                                                onClick={() => onSelectClient(client)}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="crm-clients-empty">
                        <User size={40} strokeWidth={1.25} />
                        <h3>Клиенты не найдены</h3>
                        <p>Попробуйте изменить поиск или добавьте нового клиента</p>
                    </div>
                )}
            </div>

            {total > limit && (
                <div className="crm-clients-pagination">
                    <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        aria-label="Предыдущая страница"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span>
                        {page} / {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label="Следующая страница"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            <ClientB2cChatAiModal
                isOpen={chatModalClient != null}
                onClose={() => setChatModalClient(null)}
                clientId={chatModalClient?.id ?? null}
                clientTitle={`${chatModalClient?.first_name ?? ''} ${chatModalClient?.last_name ?? ''}`}
            />
            <FamilyOfficeInviteModal
                isOpen={inviteModalOpen}
                onClose={closeInviteModal}
                initialValues={invitePrefill}
            />
        </div>
    );
};

export default ClientList;
