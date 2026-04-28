import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, GraduationCap, HandCoins, HeartHandshake, Home, Landmark, Trash2 } from 'lucide-react';
import type { CJMData, ClientCreditType, FamilyObligation, FamilyRealEstateStatus } from '../CJMFlow';

interface StepFamilyProfileProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
    onPrev: () => void;
}

const maritalOptions = [
    { value: 'single', label: 'Холост / Не замужем' },
    { value: 'married', label: 'В браке' },
    { value: 'divorced', label: 'Разведен(а)' },
    { value: 'widowed', label: 'Вдовец / Вдова' },
    { value: 'civil_union', label: 'Гражданский союз' }
] as const;

const obligations: { value: FamilyObligation; label: string }[] = [
    { value: 'loans', label: 'Кредиты' },
    { value: 'mortgage', label: 'Ипотека' },
    { value: 'rent', label: 'Аренда недвижимости' },
    { value: 'alimony', label: 'Алименты' },
    { value: 'education', label: 'Обучение детей' },
    { value: 'elder_support', label: 'Поддержка родителей' },
    { value: 'other', label: 'Другое' }
];
const obligationIcon: Record<FamilyObligation, React.ReactNode> = {
    loans: <Landmark size={16} />,
    mortgage: <Home size={16} />,
    rent: <Home size={16} />,
    alimony: <HandCoins size={16} />,
    education: <GraduationCap size={16} />,
    elder_support: <HeartHandshake size={16} />,
    other: <Banknote size={16} />
};

const estateStatuses: { value: FamilyRealEstateStatus; label: string }[] = [
    { value: 'owned', label: 'В собственности' },
    { value: 'mortgage', label: 'В ипотеке' }
];
const realEstateTypeOptions = [
    'Квартира',
    'Дом',
    'Коммерческая недвижимость',
    'Земельный участок',
    'Другое'
] as const;
const creditTypeOptions: Array<{ value: ClientCreditType; label: string }> = [
    { value: 'MORTGAGE', label: 'Ипотека' },
    { value: 'CONSUMER_LOAN', label: 'Потребительский кредит' },
    { value: 'CREDIT_CARD', label: 'Кредитная карта' },
    { value: 'AUTO_LOAN', label: 'Автокредит' },
    { value: 'OTHER', label: 'Другое' }
];

const StepFamilyProfile: React.FC<StepFamilyProfileProps> = ({ data, setData, onNext, onPrev }) => {
    const family = data.familyProfile;
    const [childBirthDateDrafts, setChildBirthDateDrafts] = useState<Record<number, string>>({});
    const panelStyle: React.CSSProperties = {
        borderRadius: 18,
        border: '1px solid rgba(148, 163, 184, 0.26)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(241,245,249,0.9) 100%)',
        boxShadow: '0 12px 28px rgba(71, 85, 105, 0.08)',
        padding: 16
    };

    useEffect(() => {
        const hasAllTypes = obligations.every((o) =>
            (family.family_obligations || []).some((x) => x.type === o.value)
        );
        if (!hasAllTypes) {
            setData((prev) => ({
                ...prev,
                familyProfile: {
                    ...prev.familyProfile,
                    family_obligations: obligations.map((o) => {
                        const existing = (prev.familyProfile.family_obligations || []).find((x) => x.type === o.value);
                        return { type: o.value, amount_monthly: existing?.amount_monthly || 0 };
                    })
                }
            }));
        }
    }, [family.family_obligations, setData]);

    useEffect(() => {
        setData((prev) => {
            const obligationsMap = (prev.familyProfile.family_obligations || []).reduce<Record<string, number>>((acc, item) => {
                acc[item.type] = item.amount_monthly || 0;
                return acc;
            }, {});

            const nextCredits = [...(prev.familyProfile.credits || [])];
            let hasChanges = false;

            const upsertCreditByType = (type: ClientCreditType, monthlyPayment: number) => {
                const idx = nextCredits.findIndex((credit) => credit.type === type);
                if (idx >= 0) {
                    if ((nextCredits[idx].monthlyPayment || 0) !== monthlyPayment) {
                        nextCredits[idx] = { ...nextCredits[idx], monthlyPayment };
                        hasChanges = true;
                    }
                    return;
                }

                if (monthlyPayment > 0) {
                    nextCredits.push({ type, balance: 0, monthlyPayment, rate: 0 });
                    hasChanges = true;
                }
            };

            upsertCreditByType('MORTGAGE', obligationsMap.mortgage || 0);
            upsertCreditByType('CONSUMER_LOAN', obligationsMap.loans || 0);

            if (!hasChanges) return prev;

            return {
                ...prev,
                familyProfile: {
                    ...prev.familyProfile,
                    credits: nextCredits
                }
            };
        });
    }, [family.family_obligations, setData]);

    useEffect(() => {
        setData((prev) => {
            const mortgageObligation = (prev.familyProfile.family_obligations || []).find((item) => item.type === 'mortgage');
            if (!mortgageObligation || (mortgageObligation.amount_monthly || 0) <= 0) {
                return prev;
            }

            const hasMortgagedEstate = (prev.familyProfile.real_estate || []).some((item) => item.status === 'mortgage');
            if (hasMortgagedEstate) {
                return prev;
            }

            return {
                ...prev,
                familyProfile: {
                    ...prev.familyProfile,
                    real_estate: [
                        ...(prev.familyProfile.real_estate || []),
                        { name: 'Квартира', estimated_value: 0, status: 'mortgage' }
                    ]
                }
            };
        });
    }, [family.family_obligations, setData]);

    const updateObligationByType = (type: FamilyObligation, amount_monthly: number) => {
        setData((prev) => {
            const next = [...prev.familyProfile.family_obligations];
            const idx = next.findIndex((x) => x.type === type);
            if (idx >= 0) {
                next[idx] = { ...next[idx], amount_monthly };
            } else {
                next.push({ type, amount_monthly });
            }
            return { ...prev, familyProfile: { ...prev.familyProfile, family_obligations: next } };
        });
    };

    const updateEstate = (index: number, patch: { name?: string; estimated_value?: number; status?: FamilyRealEstateStatus }) => {
        setData((prev) => {
            const next = [...prev.familyProfile.real_estate];
            next[index] = { ...next[index], ...patch };
            return { ...prev, familyProfile: { ...prev.familyProfile, real_estate: next } };
        });
    };

    const addEstate = () => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                real_estate: [...prev.familyProfile.real_estate, { name: 'Квартира', estimated_value: 0, status: 'owned' }]
            }
        }));
    };

    const updateCredit = (
        index: number,
        patch: { type?: ClientCreditType; balance?: number; monthlyPayment?: number; rate?: number }
    ) => {
        setData((prev) => {
            const next = [...(prev.familyProfile.credits || [])];
            next[index] = { ...next[index], ...patch };
            return {
                ...prev,
                familyProfile: {
                    ...prev.familyProfile,
                    credits: next
                }
            };
        });
    };

    const addCredit = () => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                credits: [...(prev.familyProfile.credits || []), { type: 'MORTGAGE', balance: 0, monthlyPayment: 0, rate: 0 }]
            }
        }));
    };

    const removeCredit = (index: number) => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                credits: (prev.familyProfile.credits || []).filter((_, i) => i !== index)
            }
        }));
    };

    const addChild = () => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                children: [...prev.familyProfile.children, { first_name: '', birth_date: '' }]
            }
        }));
        setChildBirthDateDrafts({});
    };

    const updateChild = (index: number, patch: { first_name?: string; birth_date?: string }) => {
        setData((prev) => {
            const next = [...prev.familyProfile.children];
            next[index] = { ...next[index], ...patch };
            return { ...prev, familyProfile: { ...prev.familyProfile, children: next } };
        });
    };

    const removeChild = (index: number) => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                children: prev.familyProfile.children.filter((_, i) => i !== index)
            }
        }));
        setChildBirthDateDrafts({});
    };

    const formatIsoToRuDate = (isoDate?: string): string => {
        if (!isoDate) return '';
        const [yyyy, mm, dd] = isoDate.split('-');
        if (!yyyy || !mm || !dd) return '';
        return `${dd}.${mm}.${yyyy}`;
    };

    const normalizeRuDateInput = (value: string): string => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        const dd = digits.slice(0, 2);
        const mm = digits.slice(2, 4);
        const yyyy = digits.slice(4, 8);
        if (digits.length <= 2) return dd;
        if (digits.length <= 4) return `${dd}.${mm}`;
        return `${dd}.${mm}.${yyyy}`;
    };

    const parseRuDateToIso = (ruDate: string): string | null => {
        const parts = ruDate.split('.');
        if (parts.length !== 3) return null;
        const [dd, mm, yyyy] = parts;
        if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null;
        const day = Number(dd);
        const month = Number(mm);
        const year = Number(yyyy);
        if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
        if (month < 1 || month > 12 || day < 1 || day > 31) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return `${yyyy}-${mm}-${dd}`;
    };

    const formatMoneyInput = (value: number): string => {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const parseMoneyInput = (value: string): number => {
        const digitsOnly = value.replace(/\D/g, '');
        return Number(digitsOnly) || 0;
    };

    const everyChildHasName =
        family.children.length === 0 ||
        family.children.every((c) => (c.first_name || '').trim().length > 0);
    const isValid = Boolean(family.marital_status) && everyChildHasName;
    const isMarried = family.marital_status === 'married' || family.marital_status === 'civil_union';
    const spouseIncomeLabel = data.gender === 'male' ? 'Доход супруги' : 'Доход супруга';

    return (
        <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 24,
            padding: 18,
            border: '1px solid rgba(148, 163, 184, 0.2)'
        }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.02em' }}>Семейный профиль</h2>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 30, fontSize: 16 }}>
                Family office карточка клиента. На расчеты не влияет, но обязательна для анкеты.
            </p>

            <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="label">Семейный статус *</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <select
                        value={family.marital_status}
                        onChange={(e) => setData((prev) => ({ ...prev, familyProfile: { ...prev.familyProfile, marital_status: e.target.value as any } }))}
                        style={{
                            maxWidth: 320,
                            width: '100%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(241,245,249,0.92) 100%)',
                            borderRadius: 14,
                            height: 48,
                            border: '1px solid rgba(148,163,184,0.45)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px rgba(15,23,42,0.08)',
                            color: '#334155',
                            fontWeight: 500
                        }}
                    >
                        <option value="">Выберите статус</option>
                        {maritalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <button
                        type="button"
                        className="btn-primary"
                        style={{
                            width: 'auto',
                            minWidth: 260,
                            padding: '12px 18px',
                            marginLeft: 'auto',
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #3D5D86 0%, #2E4A6D 100%)',
                            color: '#F8FAFC'
                        }}
                    >
                        Подписать и отправить NDA
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ display: 'block', fontSize: 16, color: '#334155', fontWeight: 600 }}>Расходы семьи (в месяц)</label>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {obligations.map((item, index) => {
                            const current = family.family_obligations.find((x) => x.type === item.value);
                            const amount = current?.amount_monthly || 0;
                            return (
                            <motion.div
                                key={item.value}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15, delay: index * 0.02 }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 220px',
                                    gap: 14,
                                    alignItems: 'center',
                                    borderBottom: index === obligations.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.18)',
                                    paddingBottom: 10
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '0 4px',
                                    fontWeight: 500,
                                    color: '#334155'
                                }}>
                                    <span style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center' }}>
                                        {obligationIcon[item.value]}
                                    </span>
                                    <span>
                                        {item.label}
                                        {item.value === 'other' && (
                                            <span style={{ marginLeft: 6, fontSize: 12, color: '#64748b' }}>
                                                (еда, транспорт, связь)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(amount)}
                                        onChange={(e) => updateObligationByType(item.value, parseMoneyInput(e.target.value))}
                                        placeholder="0"
                                        style={{
                                            background: 'rgba(255,255,255,0.88)',
                                            borderRadius: 12,
                                            height: 44,
                                            border: '1px solid rgba(148, 163, 184, 0.45)',
                                            paddingRight: 36
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            right: 12,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            fontSize: 14,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        ₽
                                    </span>
                                </div>
                            </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingTop: 4 }}>
                        <label className="label" style={{ fontSize: 16, color: '#334155', fontWeight: 600 }}>Недвижимость семьи</label>
                    </div>
                    {family.real_estate.length === 0 && (
                        <div style={{ color: '#64748b', fontSize: 14, padding: '8px 0' }}>
                            Пока нет объектов недвижимости.
                        </div>
                    )}
                    {family.real_estate.length > 0 && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.4fr 1fr 1fr',
                                gap: 10,
                                marginBottom: 8,
                                padding: '0 6px'
                            }}
                        >
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Тип недвижимости</div>
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Стоимость</div>
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Тип собственности</div>
                        </div>
                    )}
                    {family.real_estate.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 10, marginBottom: 10 }}
                        >
                            <select
                                value={item.name || 'Квартира'}
                                onChange={(e) => updateEstate(index, { name: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.9)',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1',
                                    fontSize: 18,
                                    fontWeight: 600,
                                    color: '#334155',
                                    paddingLeft: 14
                                }}
                            >
                                {realEstateTypeOptions.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInput(item.estimated_value || 0)}
                                    onChange={(e) => updateEstate(index, { estimated_value: parseMoneyInput(e.target.value) })}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid #cbd5e1',
                                        paddingRight: 32
                                    }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#64748b',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    ₽
                                </span>
                            </div>
                            <select
                                value={item.status}
                                onChange={(e) => updateEstate(index, { status: e.target.value as FamilyRealEstateStatus })}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1'
                                }}
                            >
                                {estateStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                            </select>
                        </motion.div>
                    ))}
                    <button type="button" className="btn-primary" onClick={addEstate} style={{ marginTop: 12, width: '100%' }}>
                        + Добавить объект
                    </button>
                </section>

                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingTop: 4 }}>
                        <label className="label" style={{ fontSize: 16, color: '#334155', fontWeight: 600 }}>Кредиты клиента</label>
                    </div>
                    {(family.credits || []).length === 0 && (
                        <div style={{ color: '#64748b', fontSize: 14, padding: '8px 0' }}>
                            Пока нет кредитов.
                        </div>
                    )}
                    {(family.credits || []).length > 0 && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr auto',
                                gap: 10,
                                marginBottom: 8,
                                padding: '0 6px'
                            }}
                        >
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Тип кредита</div>
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Остаток</div>
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Платёж/мес</div>
                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>Ставка, %</div>
                            <div />
                        </div>
                    )}
                    {(family.credits || []).map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr auto', gap: 10, marginBottom: 10 }}
                        >
                            <select
                                value={item.type}
                                onChange={(e) => updateCredit(index, { type: e.target.value as ClientCreditType })}
                                style={{
                                    background: 'rgba(255,255,255,0.9)',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1',
                                    fontSize: 15,
                                    fontWeight: 600,
                                    color: '#334155',
                                    paddingLeft: 14
                                }}
                            >
                                {creditTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInput(item.balance || 0)}
                                    onChange={(e) => updateCredit(index, { balance: parseMoneyInput(e.target.value) })}
                                    placeholder="0"
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid #cbd5e1',
                                        paddingRight: 32
                                    }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#64748b',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    ₽
                                </span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInput(item.monthlyPayment || 0)}
                                    onChange={(e) => updateCredit(index, { monthlyPayment: parseMoneyInput(e.target.value) })}
                                    placeholder="0"
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid #cbd5e1',
                                        paddingRight: 32
                                    }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#64748b',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    ₽
                                </span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step="0.1"
                                    value={item.rate || 0}
                                    onChange={(e) => updateCredit(index, { rate: Number(e.target.value) || 0 })}
                                    placeholder="0"
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid #cbd5e1',
                                        paddingRight: 28
                                    }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#64748b',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    %
                                </span>
                            </div>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => removeCredit(index)}
                                aria-label="Удалить кредит"
                                title="Удалить кредит"
                                style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 52, padding: 0 }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                    <button type="button" className="btn-primary" onClick={addCredit} style={{ marginTop: 12, width: '100%' }}>
                        + Добавить кредит
                    </button>
                </section>

                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ fontSize: 16 }}>Дети</label>
                    </div>
                    {family.children.length > 0 && (
                        <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 13, lineHeight: 1.4 }}>
                            У каждого ребёнка в списке обязательно укажи имя — без него не собрать цель «Образование».
                        </p>
                    )}
                    {family.children.length === 0 && (
                        <div style={{ color: '#64748b', fontSize: 14, padding: '8px 0' }}>
                            Пока нет данных о детях.
                        </div>
                    )}
                    {family.children.map((child, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: 10, marginBottom: 10 }}
                        >
                            <input
                                value={child.first_name || ''}
                                onChange={(e) => updateChild(index, { first_name: e.target.value })}
                                placeholder="Имя *"
                                aria-invalid={!(child.first_name || '').trim()}
                                aria-label={`Имя ребёнка ${index + 1}, обязательно`}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: `1px solid ${!(child.first_name || '').trim() ? '#f97316' : '#cbd5e1'}`,
                                    paddingLeft: 24
                                }}
                            />
                            <input
                                type="text"
                                inputMode="numeric"
                                value={childBirthDateDrafts[index] ?? formatIsoToRuDate(child.birth_date)}
                                onChange={(e) => {
                                    const normalized = normalizeRuDateInput(e.target.value);
                                    setChildBirthDateDrafts((prev) => ({ ...prev, [index]: normalized }));
                                    const iso = parseRuDateToIso(normalized);
                                    if (iso) {
                                        updateChild(index, { birth_date: iso });
                                    }
                                }}
                                onBlur={(e) => {
                                    const normalized = normalizeRuDateInput(e.target.value);
                                    const iso = parseRuDateToIso(normalized);
                                    if (iso) {
                                        setChildBirthDateDrafts((prev) => ({ ...prev, [index]: formatIsoToRuDate(iso) }));
                                    } else if (!normalized) {
                                        setChildBirthDateDrafts((prev) => ({ ...prev, [index]: '' }));
                                        updateChild(index, { birth_date: '' });
                                    }
                                }}
                                placeholder="дд.мм.гггг"
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1',
                                    paddingLeft: 24
                                }}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => removeChild(index)}
                                aria-label="Удалить ребенка"
                                title="Удалить ребенка"
                                style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 52, padding: 0 }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    ))}
                    <button type="button" className="btn-primary" onClick={addChild} style={{ marginTop: 12, width: '100%' }}>
                        + Добавить ребенка
                    </button>
                </section>

                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ fontSize: 16, color: '#334155', fontWeight: 600 }}>Доходы семьи</label>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14, alignItems: 'center' }}>
                            <div style={{ color: '#334155', fontWeight: 500, paddingLeft: 4 }}>
                                Доход клиента (по 2-НДФЛ)
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInput(data.avgMonthlyIncome || 0)}
                                    onChange={(e) => setData((prev) => ({ ...prev, avgMonthlyIncome: parseMoneyInput(e.target.value) }))}
                                    placeholder="0"
                                    style={{
                                        background: 'rgba(255,255,255,0.88)',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid rgba(148, 163, 184, 0.45)',
                                        paddingRight: 32
                                    }}
                                />
                                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>
                                    ₽
                                </span>
                            </div>
                        </div>

                        {isMarried && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 14, alignItems: 'center' }}>
                                <div style={{ color: '#334155', fontWeight: 500, paddingLeft: 4 }}>
                                    {spouseIncomeLabel}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={formatMoneyInput(family.spouse?.monthly_income ?? 0)}
                                        onChange={(e) => setData((prev) => ({
                                            ...prev,
                                            familyProfile: {
                                                ...prev.familyProfile,
                                                spouse: {
                                                    ...prev.familyProfile.spouse,
                                                    monthly_income: parseMoneyInput(e.target.value)
                                                }
                                            }
                                        }))}
                                        placeholder="0"
                                        style={{
                                            background: 'rgba(255,255,255,0.88)',
                                            borderRadius: 12,
                                            height: 44,
                                            border: '1px solid rgba(148, 163, 184, 0.45)',
                                            paddingRight: 32
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13, fontWeight: 600, pointerEvents: 'none' }}>
                                        ₽
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div style={{
                display: 'flex',
                gap: 12,
                position: 'sticky',
                bottom: 0,
                paddingTop: 8,
                background: 'linear-gradient(180deg, rgba(248,250,252,0), rgba(248,250,252,0.95) 35%, rgba(248,250,252,1) 100%)'
            }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>Назад</button>
                <button className="btn-primary" onClick={onNext} style={{ flex: 2, background: 'linear-gradient(135deg, #5B6F8B 0%, #465A73 100%)' }} disabled={!isValid}>Далее</button>
            </div>
        </div>
    );
};

export default StepFamilyProfile;
