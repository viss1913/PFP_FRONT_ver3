import React from 'react';
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

    const addObligation = () => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                family_obligations: [...prev.familyProfile.family_obligations, { type: 'loans', amount_monthly: 0 }]
            }
        }));
    };

    const updateObligation = (index: number, patch: { type?: FamilyObligation; amount_monthly?: number }) => {
        setData((prev) => {
            const next = [...prev.familyProfile.family_obligations];
            next[index] = { ...next[index], ...patch };
            return { ...prev, familyProfile: { ...prev.familyProfile, family_obligations: next } };
        });
    };

    const removeObligation = (index: number) => {
        setData((prev) => ({
            ...prev,
            familyProfile: {
                ...prev.familyProfile,
                family_obligations: prev.familyProfile.family_obligations.filter((_, i) => i !== index)
            }
        }));
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

    const isValid = Boolean(family.marital_status);

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 8, textAlign: 'center', letterSpacing: '-0.02em' }}>Семейный профиль</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 30, fontSize: 16 }}>
                Family office карточка клиента. На расчеты не влияет, но обязательна для анкеты.
            </p>

            <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="label">Семейный статус *</label>
                <select
                    value={family.marital_status}
                    onChange={(e) => setData((prev) => ({ ...prev, familyProfile: { ...prev.familyProfile, marital_status: e.target.value as any } }))}
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: 14,
                        height: 48,
                        border: '1px solid rgba(255,255,255,0.55)',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
                    }}
                >
                    <option value="">Выберите статус</option>
                    {maritalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16, alignItems: 'start' }}>
                <section style={{
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
                    padding: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ display: 'block', fontSize: 16 }}>Расходы семьи (в месяц)</label>
                        <button type="button" className="btn-secondary" onClick={addObligation} style={{ padding: '8px 12px' }}>
                            + Добавить
                        </button>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                        {family.family_obligations.length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
                                Пока нет расходов. Добавь минимум один, если у клиента есть обязательства.
                            </div>
                        )}
                        {family.family_obligations.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr auto', gap: 10 }}
                            >
                                <select
                                    value={item.type}
                                    onChange={(e) => updateObligation(index, { type: e.target.value as FamilyObligation })}
                                    style={{
                                        background: 'rgba(255,255,255,0.95)',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid rgba(255,255,255,0.55)'
                                    }}
                                >
                                    {obligations.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: 'var(--text-muted)',
                                    marginTop: -2,
                                    marginBottom: -2
                                }}>
                                    {obligationIcon[item.type]}
                                    <span style={{ fontSize: 12 }}>{obligations.find((o) => o.value === item.type)?.label}</span>
                                </div>
                                <input
                                    type="number"
                                    min={0}
                                    value={item.amount_monthly || 0}
                                    onChange={(e) => updateObligation(index, { amount_monthly: Number(e.target.value) || 0 })}
                                    placeholder="Сумма, ₽"
                                    style={{
                                        background: 'rgba(255,255,255,0.95)',
                                        borderRadius: 12,
                                        height: 44,
                                        border: '1px solid rgba(255,255,255,0.55)'
                                    }}
                                />
                                <button type="button" className="btn-secondary" onClick={() => removeObligation(index)} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MinusCircle size={14} />
                                    <span>Удалить</span>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section style={{
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
                    padding: 16
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label className="label" style={{ fontSize: 16 }}>Недвижимость семьи</label>
                        <button type="button" className="btn-secondary" onClick={addEstate} style={{ padding: '8px 12px' }}>+ Добавить</button>
                    </div>
                    {family.real_estate.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '8px 0' }}>
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
                                    background: 'rgba(255,255,255,0.95)',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid rgba(255,255,255,0.55)'
                                }}
                            />
                            <input
                                type="number"
                                min={0}
                                value={item.estimated_value || 0}
                                onChange={(e) => updateEstate(index, { estimated_value: Number(e.target.value) || 0 })}
                                placeholder="Оценка"
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid rgba(255,255,255,0.55)'
                                }}
                            />
                            <select
                                value={item.status}
                                onChange={(e) => updateEstate(index, { status: e.target.value as FamilyRealEstateStatus })}
                                style={{
                                    background: 'rgba(255,255,255,0.95)',
                                    borderRadius: 12,
                                    height: 44,
                                    border: '1px solid rgba(255,255,255,0.55)'
                                }}
                            >
                                {estateStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                            </select>
                        </motion.div>
                    ))}
                </section>
            </div>

            <section style={{
                marginTop: 16,
                marginBottom: 28,
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                padding: 16
            }}>
                <label className="label" style={{ marginBottom: 10, display: 'block', fontSize: 16 }}>Конфиденциальность</label>
                <div style={{ display: 'grid', gap: 10 }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 17 }}>
                        <input
                            type="checkbox"
                            checked={family.confidentiality.allow_spouse_access}
                            onChange={(e) => setData((prev) => ({
                                ...prev,
                                familyProfile: {
                                    ...prev.familyProfile,
                                    confidentiality: { ...prev.familyProfile.confidentiality, allow_spouse_access: e.target.checked }
                                }
                            }))}
                        />
                        <span>Разрешить доступ супругу(е)</span>
                    </label>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 17 }}>
                        <input
                            type="checkbox"
                            checked={family.confidentiality.allow_family_contact}
                            onChange={(e) => setData((prev) => ({
                                ...prev,
                                familyProfile: {
                                    ...prev.familyProfile,
                                    confidentiality: { ...prev.familyProfile.confidentiality, allow_family_contact: e.target.checked }
                                }
                            }))}
                        />
                        <span>Можно связываться с членами семьи</span>
                    </label>
                    <textarea
                        value={family.confidentiality.notes || ''}
                        onChange={(e) => setData((prev) => ({
                            ...prev,
                            familyProfile: {
                                ...prev.familyProfile,
                                confidentiality: { ...prev.familyProfile.confidentiality, notes: e.target.value }
                            }
                        }))}
                        placeholder="Комментарий по доступу/коммуникации"
                        style={{
                            minHeight: 100,
                            borderRadius: 12,
                            padding: 12,
                            resize: 'vertical',
                            background: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.55)'
                        }}
                    />
                </div>
            </section>

            <div style={{
                display: 'flex',
                gap: 12,
                position: 'sticky',
                bottom: 0,
                paddingTop: 8,
                background: 'linear-gradient(180deg, rgba(18,22,33,0), rgba(18,22,33,0.9) 35%, rgba(18,22,33,1) 100%)'
            }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>Назад</button>
                <button className="btn-primary" onClick={onNext} style={{ flex: 2 }} disabled={!isValid}>Далее</button>
            </div>
        </div>
    );
};

export default StepFamilyProfile;
