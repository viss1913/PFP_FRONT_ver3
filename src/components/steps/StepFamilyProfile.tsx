import React from 'react';
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
    { value: 'alimony', label: 'Алименты' },
    { value: 'elder_support', label: 'Поддержка родителей' },
    { value: 'child_education', label: 'Образование детей' },
    { value: 'medical_care', label: 'Медицинские расходы' },
    { value: 'rent', label: 'Аренда' },
    { value: 'mortgage_payments', label: 'Ипотека' },
    { value: 'other_loans', label: 'Прочие кредиты' },
    { value: 'other', label: 'Другое' }
];

const estateStatuses: { value: FamilyRealEstateStatus; label: string }[] = [
    { value: 'owned', label: 'В собственности' },
    { value: 'mortgage', label: 'В ипотеке' }
];

const StepFamilyProfile: React.FC<StepFamilyProfileProps> = ({ data, setData, onNext, onPrev }) => {
    const family = data.familyProfile;

    const toggleObligation = (value: FamilyObligation) => {
        setData((prev) => {
            const list = prev.familyProfile.family_obligations || [];
            const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
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

    const isValid = Boolean(family.marital_status);

    return (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Семейный профиль</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 28 }}>
                Family office карточка клиента. На расчеты не влияет, но обязательна для анкеты.
            </p>

            <div className="input-group" style={{ marginBottom: 18 }}>
                <label className="label">Семейный статус *</label>
                <select
                    value={family.marital_status}
                    onChange={(e) => setData((prev) => ({ ...prev, familyProfile: { ...prev.familyProfile, marital_status: e.target.value as any } }))}
                >
                    <option value="">Выберите статус</option>
                    {maritalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label className="label" style={{ marginBottom: 10, display: 'block' }}>Семейные обязательства</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    {obligations.map((item) => {
                        const active = family.family_obligations.includes(item.value);
                        return (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => toggleObligation(item.value)}
                                style={{
                                    border: active ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                    background: active ? 'rgba(255,199,80,0.15)' : 'var(--card-bg)',
                                    borderRadius: 12,
                                    color: 'var(--text-main)',
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="label">Недвижимость семьи</label>
                    <button type="button" className="btn-secondary" onClick={addEstate} style={{ padding: '8px 12px' }}>+ Добавить</button>
                </div>
                {family.real_estate.map((item, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <input
                            value={item.name || ''}
                            onChange={(e) => updateEstate(index, { name: e.target.value })}
                            placeholder="Название объекта"
                        />
                        <input
                            type="number"
                            min={0}
                            value={item.estimated_value || 0}
                            onChange={(e) => updateEstate(index, { estimated_value: Number(e.target.value) || 0 })}
                            placeholder="Оценка"
                        />
                        <select
                            value={item.status}
                            onChange={(e) => updateEstate(index, { status: e.target.value as FamilyRealEstateStatus })}
                        >
                            {estateStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: 28 }}>
                <label className="label" style={{ marginBottom: 10, display: 'block' }}>Конфиденциальность</label>
                <div style={{ display: 'grid', gap: 10 }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
                        style={{ minHeight: 88, borderRadius: 12, padding: 10, resize: 'vertical' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" onClick={onPrev} style={{ flex: 1 }}>Назад</button>
                <button className="btn-primary" onClick={onNext} style={{ flex: 2 }} disabled={!isValid}>Далее</button>
            </div>
        </div>
    );
};

export default StepFamilyProfile;
