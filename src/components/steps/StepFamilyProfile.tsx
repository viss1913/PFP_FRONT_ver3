import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Banknote, GraduationCap, HandCoins, HeartHandshake, Home, Landmark, MinusCircle } from 'lucide-react';
import type { CJMData, FamilyObligation, FamilyRealEstateStatus } from '../CJMFlow';

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

const StepFamilyProfile: React.FC<StepFamilyProfileProps> = ({ data, setData, onNext, onPrev }) => {
    const family = data.familyProfile;
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
                real_estate: [...prev.familyProfile.real_estate, { name: '', estimated_value: 0, status: 'owned' }]
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
    };

    const isValid = Boolean(family.marital_status);

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
                                    <span>{item.label}</span>
                                </div>
                                <input
                                    type="number"
                                    min={0}
                                    value={amount}
                                    onChange={(e) => updateObligationByType(item.value, Number(e.target.value) || 0)}
                                    placeholder="Сумма, ₽"
                                    style={{
                                        background: 'rgba(255,255,255,0.88)',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid rgba(148, 163, 184, 0.45)'
                                    }}
                                />
                            </motion.div>
                            );
                        })}
                    </div>
                </section>

                <section style={{
                    ...panelStyle
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ fontSize: 16 }}>Недвижимость семьи</label>
                    </div>
                    {family.real_estate.length === 0 && (
                        <div style={{ color: '#64748b', fontSize: 14, padding: '8px 0' }}>
                            Пока нет объектов недвижимости.
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
                            <input
                                value={item.name || ''}
                                onChange={(e) => updateEstate(index, { name: e.target.value })}
                                placeholder="Название объекта"
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1'
                                }}
                            />
                            <input
                                type="number"
                                min={0}
                                value={item.estimated_value || 0}
                                onChange={(e) => updateEstate(index, { estimated_value: Number(e.target.value) || 0 })}
                                placeholder="Оценка"
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1'
                                }}
                            />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ fontSize: 16 }}>Дети</label>
                    </div>
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
                                placeholder="Имя ребенка"
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1'
                                }}
                            />
                            <input
                                type="date"
                                value={child.birth_date || ''}
                                onChange={(e) => updateChild(index, { birth_date: e.target.value })}
                                style={{
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid #cbd5e1'
                                }}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => removeChild(index)}
                                style={{ height: 44, display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <MinusCircle size={14} />
                                <span>Удалить</span>
                            </button>
                        </motion.div>
                    ))}
                    <button type="button" className="btn-primary" onClick={addChild} style={{ marginTop: 12, width: '100%' }}>
                        + Добавить ребенка
                    </button>
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
