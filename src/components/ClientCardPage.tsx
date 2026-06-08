import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { clientApi } from '../api/clientApi';
import type {
    Client,
    ClientCardContactsForm,
    ClientCardCreditRow,
    ClientCardDirtySection,
    ClientCardFormState,
    FamilyEmploymentStatus,
    FamilyObligation,
    FamilyProfile,
    FamilyRealEstateStatus,
    MaritalStatus,
} from '../types/client';
import ClientAssetsEditor from './clientCard/ClientAssetsEditor';
import {
    applyClientToFormState,
    buildPatchBody,
    formatMoneyInput,
    getClientCardErrorMessage,
    getDirtySections,
    parseMoneyInput,
} from '../utils/clientCardMappers';
import {
    formatRussianPhoneInput,
    getPhoneInputCaretPosition,
    hasCompleteRussianPhone,
    PHONE_MASK_TEMPLATE,
    PHONE_PLACEHOLDER,
} from '../utils/phone';

type TabId = ClientCardDirtySection;

interface ClientCardPageProps {
    clientId: number;
    onBack: () => void;
    onSaved?: (client: Client) => void;
}

const TABS: { id: TabId; label: string }[] = [
    { id: 'contacts', label: 'Контакты' },
    { id: 'family', label: 'Семья' },
    { id: 'credits', label: 'Кредиты' },
    { id: 'assets', label: 'Активы' },
];

const maritalOptions: { value: MaritalStatus; label: string }[] = [
    { value: 'single', label: 'Холост / Не замужем' },
    { value: 'married', label: 'В браке' },
    { value: 'divorced', label: 'Разведен(а)' },
    { value: 'widowed', label: 'Вдовец / Вдова' },
    { value: 'civil_union', label: 'Гражданский союз' },
];

const obligationTypes: { value: FamilyObligation; label: string }[] = [
    { value: 'loans', label: 'Кредиты' },
    { value: 'mortgage', label: 'Ипотека' },
    { value: 'rent', label: 'Аренда' },
    { value: 'alimony', label: 'Алименты' },
    { value: 'education', label: 'Обучение детей' },
    { value: 'elder_support', label: 'Поддержка родителей' },
    { value: 'other', label: 'Другое' },
];

const estateStatuses: { value: FamilyRealEstateStatus; label: string }[] = [
    { value: 'owned', label: 'В собственности' },
    { value: 'mortgage', label: 'В ипотеке' },
];

const realEstateTypeOptions = ['Квартира', 'Дом', 'Коммерческая недвижимость', 'Земельный участок', 'Другое'];

const creditTypeOptions: { value: ClientCardCreditRow['type']; label: string }[] = [
    { value: 'MORTGAGE', label: 'Ипотека' },
    { value: 'CONSUMER_LOAN', label: 'Потребительский кредит' },
    { value: 'CREDIT_CARD', label: 'Кредитная карта' },
    { value: 'AUTO_LOAN', label: 'Автокредит' },
    { value: 'OTHER', label: 'Другое' },
];

const ClientCardPage: React.FC<ClientCardPageProps> = ({ clientId, onBack, onSaved }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('contacts');
    const [clientMeta, setClientMeta] = useState<Client | null>(null);
    const [baseline, setBaseline] = useState<ClientCardFormState | null>(null);
    const [form, setForm] = useState<ClientCardFormState | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const client = await clientApi.getClientCard(clientId);
            const state = applyClientToFormState(client);
            setClientMeta(client);
            setBaseline(state);
            setForm(state);
        } catch (e) {
            setLoadError(getClientCardErrorMessage(e));
            setClientMeta(null);
            setBaseline(null);
            setForm(null);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 3000);
        return () => window.clearTimeout(t);
    }, [toast]);

    const dirtySections = useMemo(() => {
        if (!baseline || !form) return new Set<ClientCardDirtySection>();
        return getDirtySections(baseline, form);
    }, [baseline, form]);

    const displayName = useMemo(() => {
        if (!form) return 'Клиент';
        const parts = [form.contacts.last_name, form.contacts.first_name, form.contacts.middle_name].filter(
            Boolean,
        );
        return parts.join(' ') || `Клиент #${clientId}`;
    }, [form, clientId]);

    const setContacts = (patch: Partial<ClientCardContactsForm>) => {
        setForm((prev) => (prev ? { ...prev, contacts: { ...prev.contacts, ...patch } } : prev));
    };

    const setFamily = (updater: (fp: FamilyProfile) => FamilyProfile) => {
        setForm((prev) => (prev ? { ...prev, family: updater(prev.family) } : prev));
    };

    const setCredits = (credits: ClientCardCreditRow[]) => {
        setForm((prev) => (prev ? { ...prev, credits } : prev));
    };

    const setAssets = (assets: ClientCardFormState['assets']) => {
        setForm((prev) => (prev ? { ...prev, assets } : prev));
    };

    const handleSave = async () => {
        if (!form || !baseline) return;
        const dirty = getDirtySections(baseline, form);
        const body = buildPatchBody(dirty, form);
        if (!body) {
            setToast('Нет изменений для сохранения');
            return;
        }
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await clientApi.patchClientCard(clientId, body);
            const nextState = applyClientToFormState(updated);
            setClientMeta(updated);
            setBaseline(nextState);
            setForm(nextState);
            setToast('Сохранено');
            onSaved?.(updated);
        } catch (e) {
            setSaveError(getClientCardErrorMessage(e));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="client-card-page">
                <div className="client-card-page__loading">
                    <Loader2 size={32} className="client-card-spin" aria-hidden />
                    <span>Загрузка карточки…</span>
                </div>
            </div>
        );
    }

    if (loadError || !form) {
        return (
            <div className="client-card-page">
                <button type="button" className="client-card-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Назад в CRM
                </button>
                <div className="client-card-page__error" role="alert">
                    {loadError || 'Не удалось загрузить карточку'}
                </div>
            </div>
        );
    }

    const family = form.family;
    const isMarried = family.marital_status === 'married' || family.marital_status === 'civil_union';

    return (
        <div className="client-card-page">
            <header className="client-card-header">
                <button type="button" className="client-card-back" onClick={onBack}>
                    <ArrowLeft size={18} />
                    Назад
                </button>
                <div className="client-card-header__main">
                    <h1 className="client-card-header__title">{displayName}</h1>
                    <p className="client-card-header__sub">
                        ID {clientId}
                        {clientMeta?.net_worth != null
                            ? ` · Net worth ${new Intl.NumberFormat('ru-RU').format(clientMeta.net_worth)} ₽`
                            : ''}
                    </p>
                </div>
                <button
                    type="button"
                    className="client-card-save-btn"
                    disabled={saving || dirtySections.size === 0}
                    onClick={() => void handleSave()}
                >
                    {saving ? (
                        <>
                            <Loader2 size={16} className="client-card-spin" aria-hidden />
                            Сохранение…
                        </>
                    ) : (
                        'Сохранить'
                    )}
                </button>
            </header>

            {saveError && (
                <div className="client-card-banner client-card-banner--error" role="alert">
                    {saveError}
                </div>
            )}

            <nav className="client-card-tabs" aria-label="Разделы карточки">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`client-card-tabs__btn${activeTab === tab.id ? ' client-card-tabs__btn--active' : ''}${dirtySections.has(tab.id) ? ' client-card-tabs__btn--dirty' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="client-card-panel">
                {activeTab === 'contacts' && (
                    <div className="client-card-section">
                        <div className="client-card-grid client-card-grid--2">
                            <label className="client-card-field">
                                <span>Фамилия</span>
                                <input
                                    type="text"
                                    value={form.contacts.last_name}
                                    onChange={(e) => setContacts({ last_name: e.target.value })}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Имя</span>
                                <input
                                    type="text"
                                    value={form.contacts.first_name}
                                    onChange={(e) => setContacts({ first_name: e.target.value })}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Отчество</span>
                                <input
                                    type="text"
                                    value={form.contacts.middle_name}
                                    onChange={(e) => setContacts({ middle_name: e.target.value })}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Телефон</span>
                                <input
                                    type="tel"
                                    value={form.contacts.phone || PHONE_MASK_TEMPLATE}
                                    onChange={(e) =>
                                        setContacts({ phone: formatRussianPhoneInput(e.target.value) })
                                    }
                                    onFocus={(e) => {
                                        const pos = getPhoneInputCaretPosition(e.target.value);
                                        requestAnimationFrame(() => e.target.setSelectionRange(pos, pos));
                                    }}
                                    placeholder={PHONE_PLACEHOLDER}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={form.contacts.email}
                                    onChange={(e) => setContacts({ email: e.target.value })}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Дата рождения</span>
                                <input
                                    type="date"
                                    value={form.contacts.birth_date || ''}
                                    onChange={(e) => setContacts({ birth_date: e.target.value })}
                                    className="client-card-input"
                                />
                            </label>
                            <label className="client-card-field">
                                <span>Пол</span>
                                <select
                                    value={form.contacts.gender}
                                    onChange={(e) =>
                                        setContacts({
                                            gender: e.target.value as 'male' | 'female',
                                        })
                                    }
                                    className="client-card-input"
                                >
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </label>
                            <label className="client-card-field">
                                <span>Среднемесячный доход</span>
                                <div className="client-card-money-wrap">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(form.contacts.avg_monthly_income)}
                                        onChange={(e) =>
                                            setContacts({
                                                avg_monthly_income: parseMoneyInput(e.target.value),
                                            })
                                        }
                                        className="client-card-input"
                                    />
                                    <span className="client-card-money-suffix">₽</span>
                                </div>
                            </label>
                        </div>
                        {form.contacts.phone && !hasCompleteRussianPhone(form.contacts.phone) && (
                            <p className="client-card-field-hint">Укажите телефон полностью: +7(___)___-__-__</p>
                        )}
                    </div>
                )}

                {activeTab === 'family' && (
                    <div className="client-card-section">
                        <label className="client-card-field">
                            <span>Семейный статус</span>
                            <select
                                value={family.marital_status || ''}
                                onChange={(e) =>
                                    setFamily((fp) => ({
                                        ...fp,
                                        marital_status: (e.target.value || undefined) as MaritalStatus,
                                    }))
                                }
                                className="client-card-input"
                            >
                                <option value="">Не указан</option>
                                {maritalOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {isMarried && (
                            <div className="client-card-subsection">
                                <h3 className="client-card-subsection__title">Супруг(а)</h3>
                                <div className="client-card-grid client-card-grid--2">
                                    <label className="client-card-field">
                                        <span>Занятость</span>
                                        <select
                                            value={family.spouse?.employment_status || ''}
                                            onChange={(e) =>
                                                setFamily((fp) => ({
                                                    ...fp,
                                                    spouse: {
                                                        ...fp.spouse,
                                                        employment_status: (e.target.value ||
                                                            undefined) as FamilyEmploymentStatus | undefined,
                                                    },
                                                }))
                                            }
                                            className="client-card-input"
                                        >
                                            <option value="">—</option>
                                            <option value="employed">Наёмный работник</option>
                                            <option value="self_employed">ИП / самозанятый</option>
                                            <option value="unemployed">Без работы</option>
                                            <option value="retired">Пенсионер</option>
                                            <option value="other">Другое</option>
                                        </select>
                                    </label>
                                    <label className="client-card-field">
                                        <span>Доход в месяц</span>
                                        <div className="client-card-money-wrap">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatMoneyInput(family.spouse?.monthly_income || 0)}
                                                onChange={(e) =>
                                                    setFamily((fp) => ({
                                                        ...fp,
                                                        spouse: {
                                                            ...fp.spouse,
                                                            monthly_income: parseMoneyInput(e.target.value),
                                                        },
                                                    }))
                                                }
                                                className="client-card-input"
                                            />
                                            <span className="client-card-money-suffix">₽</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="client-card-subsection">
                            <h3 className="client-card-subsection__title">Дети</h3>
                            {(family.children || []).map((child, index) => (
                                <div key={index} className="client-card-table-row client-card-table-row--children">
                                    <input
                                        type="text"
                                        placeholder="Имя"
                                        value={child.first_name}
                                        onChange={(e) =>
                                            setFamily((fp) => {
                                                const children = [...(fp.children || [])];
                                                children[index] = { ...children[index], first_name: e.target.value };
                                                return { ...fp, children };
                                            })
                                        }
                                        className="client-card-input"
                                    />
                                    <input
                                        type="date"
                                        value={child.birth_date || ''}
                                        onChange={(e) =>
                                            setFamily((fp) => {
                                                const children = [...(fp.children || [])];
                                                children[index] = { ...children[index], birth_date: e.target.value };
                                                return { ...fp, children };
                                            })
                                        }
                                        className="client-card-input"
                                    />
                                    <button
                                        type="button"
                                        className="client-card-icon-btn"
                                        onClick={() =>
                                            setFamily((fp) => ({
                                                ...fp,
                                                children: (fp.children || []).filter((_, i) => i !== index),
                                            }))
                                        }
                                        aria-label="Удалить ребёнка"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="client-card-add-btn"
                                onClick={() =>
                                    setFamily((fp) => ({
                                        ...fp,
                                        children: [...(fp.children || []), { first_name: '', birth_date: '' }],
                                    }))
                                }
                            >
                                <Plus size={16} />
                                Добавить ребёнка
                            </button>
                        </div>

                        <div className="client-card-subsection">
                            <h3 className="client-card-subsection__title">Расходы семьи (в месяц)</h3>
                            {obligationTypes.map((item) => {
                                const current = (family.family_obligations || []).find((x) => x.type === item.value);
                                const amount = current?.amount_monthly ?? 0;
                                return (
                                    <div key={item.value} className="client-card-obligation-row">
                                        <span>{item.label}</span>
                                        <div className="client-card-money-wrap">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formatMoneyInput(amount)}
                                                onChange={(e) => {
                                                    const val = parseMoneyInput(e.target.value);
                                                    setFamily((fp) => {
                                                        const list = [...(fp.family_obligations || [])];
                                                        const idx = list.findIndex((x) => x.type === item.value);
                                                        if (idx >= 0) list[idx] = { type: item.value, amount_monthly: val };
                                                        else list.push({ type: item.value, amount_monthly: val });
                                                        return { ...fp, family_obligations: list };
                                                    });
                                                }}
                                                className="client-card-input"
                                            />
                                            <span className="client-card-money-suffix">₽</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="client-card-subsection">
                            <h3 className="client-card-subsection__title">Недвижимость (справочно)</h3>
                            <p className="client-card-hint">Для расчёта net worth используйте вкладку «Активы».</p>
                            {(family.real_estate || []).map((item, index) => (
                                <div key={index} className="client-card-table-row client-card-table-row--estate">
                                    <select
                                        value={item.name || 'Квартира'}
                                        onChange={(e) =>
                                            setFamily((fp) => {
                                                const real_estate = [...(fp.real_estate || [])];
                                                real_estate[index] = { ...real_estate[index], name: e.target.value };
                                                return { ...fp, real_estate };
                                            })
                                        }
                                        className="client-card-input"
                                    >
                                        {realEstateTypeOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="client-card-money-wrap">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatMoneyInput(item.estimated_value || 0)}
                                            onChange={(e) =>
                                                setFamily((fp) => {
                                                    const real_estate = [...(fp.real_estate || [])];
                                                    real_estate[index] = {
                                                        ...real_estate[index],
                                                        estimated_value: parseMoneyInput(e.target.value),
                                                    };
                                                    return { ...fp, real_estate };
                                                })
                                            }
                                            className="client-card-input"
                                        />
                                        <span className="client-card-money-suffix">₽</span>
                                    </div>
                                    <select
                                        value={item.status}
                                        onChange={(e) =>
                                            setFamily((fp) => {
                                                const real_estate = [...(fp.real_estate || [])];
                                                real_estate[index] = {
                                                    ...real_estate[index],
                                                    status: e.target.value as FamilyRealEstateStatus,
                                                };
                                                return { ...fp, real_estate };
                                            })
                                        }
                                        className="client-card-input"
                                    >
                                        {estateStatuses.map((s) => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="client-card-icon-btn"
                                        onClick={() =>
                                            setFamily((fp) => ({
                                                ...fp,
                                                real_estate: (fp.real_estate || []).filter((_, i) => i !== index),
                                            }))
                                        }
                                        aria-label="Удалить объект"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="client-card-add-btn"
                                onClick={() =>
                                    setFamily((fp) => ({
                                        ...fp,
                                        real_estate: [
                                            ...(fp.real_estate || []),
                                            { name: 'Квартира', estimated_value: 0, status: 'owned' },
                                        ],
                                    }))
                                }
                            >
                                <Plus size={16} />
                                Добавить объект
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'credits' && (
                    <div className="client-card-section">
                        {form.credits.length === 0 && (
                            <p className="client-card-empty">Пока нет кредитов.</p>
                        )}
                        {form.credits.length > 0 && (
                            <div className="client-card-table-head client-card-table-head--credits">
                                <span>Тип</span>
                                <span>Остаток</span>
                                <span>Платёж/мес</span>
                                <span>Ставка %</span>
                                <span />
                            </div>
                        )}
                        {form.credits.map((item, index) => (
                            <div key={index} className="client-card-table-row client-card-table-row--credits">
                                <select
                                    value={item.type}
                                    onChange={(e) => {
                                        const credits = [...form.credits];
                                        credits[index] = {
                                            ...credits[index],
                                            type: e.target.value as ClientCardCreditRow['type'],
                                        };
                                        setCredits(credits);
                                    }}
                                    className="client-card-input"
                                >
                                    {creditTypeOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="client-card-money-wrap">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(item.balance)}
                                        onChange={(e) => {
                                            const credits = [...form.credits];
                                            credits[index] = {
                                                ...credits[index],
                                                balance: parseMoneyInput(e.target.value),
                                            };
                                            setCredits(credits);
                                        }}
                                        className="client-card-input"
                                    />
                                    <span className="client-card-money-suffix">₽</span>
                                </div>
                                <div className="client-card-money-wrap">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(item.monthlyPayment)}
                                        onChange={(e) => {
                                            const credits = [...form.credits];
                                            credits[index] = {
                                                ...credits[index],
                                                monthlyPayment: parseMoneyInput(e.target.value),
                                            };
                                            setCredits(credits);
                                        }}
                                        className="client-card-input"
                                    />
                                    <span className="client-card-money-suffix">₽</span>
                                </div>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={String(item.rate ?? '')}
                                    onChange={(e) => {
                                        const credits = [...form.credits];
                                        credits[index] = {
                                            ...credits[index],
                                            rate: parseFloat(e.target.value.replace(',', '.')) || 0,
                                        };
                                        setCredits(credits);
                                    }}
                                    className="client-card-input"
                                />
                                <button
                                    type="button"
                                    className="client-card-icon-btn"
                                    onClick={() => setCredits(form.credits.filter((_, i) => i !== index))}
                                    aria-label="Удалить кредит"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="client-card-add-btn"
                            onClick={() =>
                                setCredits([
                                    ...form.credits,
                                    { type: 'MORTGAGE', balance: 0, monthlyPayment: 0, rate: 0 },
                                ])
                            }
                        >
                            <Plus size={16} />
                            Добавить кредит
                        </button>
                    </div>
                )}

                {activeTab === 'assets' && (
                    <ClientAssetsEditor assets={form.assets} onChange={setAssets} />
                )}
            </div>

            {toast && <div className="client-card-toast">{toast}</div>}
        </div>
    );
};

export default ClientCardPage;
