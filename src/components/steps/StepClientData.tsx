import React, { useEffect, useState } from 'react';
import { User, Phone } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import { formatRussianPhoneInput, PHONE_MASK_TEMPLATE, PHONE_PLACEHOLDER, getPhoneInputCaretPosition, hasCompleteRussianPhone } from '../../utils/phone';

interface StepClientDataProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
}

const StepClientData: React.FC<StepClientDataProps> = ({ data, setData, onNext }) => {
    const [birthDateDraft, setBirthDateDraft] = useState('');

    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const dob = new Date(birthDate);
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age -= 1;
        }
        return age;
    };

    const getDateYearsAgo = (years: number): string => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - years);
        return d.toISOString().split('T')[0];
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
        const [dd, mm, yyyy] = ruDate.split('.');
        if (!dd || !mm || !yyyy || dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return null;
        const day = Number(dd);
        const month = Number(mm);
        const year = Number(yyyy);
        if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return `${yyyy}-${mm}-${dd}`;
    };

    useEffect(() => {
        setBirthDateDraft(formatIsoToRuDate(data.birthDate));
    }, [data.birthDate]);

    const getGenderButtonStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '16px',
        borderRadius: '16px',
        border: isActive ? '1px solid rgba(255, 255, 255, 0.75)' : '1px solid rgba(255, 255, 255, 0.55)',
        background: isActive
            ? 'linear-gradient(135deg, rgba(233,242,252,0.78) 0%, rgba(195,210,228,0.7) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.32) 0%, rgba(226,236,248,0.24) 100%)',
        color: '#1F2937',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '16px',
        letterSpacing: '0.01em',
        transition: 'all 0.25s ease',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        boxShadow: isActive
            ? '0 12px 26px rgba(120, 140, 170, 0.24), inset 0 1px 0 rgba(255,255,255,0.95)'
            : '0 8px 20px rgba(120, 140, 170, 0.14), inset 0 1px 0 rgba(255,255,255,0.78)'
    });

    // Auto-generate UUID if missing
    useEffect(() => {
        if (!data.uuid) {
            setData(prev => ({ ...prev, uuid: crypto.randomUUID() }));
        }
    }, []);

    const handleChange = (field: keyof CJMData, value: string | number) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleChange('phone', formatRussianPhoneInput(e.target.value));
    };

    const handlePhoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        const nextPos = getPhoneInputCaretPosition(e.target.value);
        requestAnimationFrame(() => {
            e.target.setSelectionRange(nextPos, nextPos);
        });
    };

    const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizeRuDateInput(e.target.value);
        setBirthDateDraft(normalized);

        if (!normalized) {
            setData(prev => ({ ...prev, birthDate: undefined }));
            return;
        }

        const iso = parseRuDateToIso(normalized);
        if (!iso) return;

        const minDate = getDateYearsAgo(80);
        const maxDate = getDateYearsAgo(18);
        if (iso < minDate || iso > maxDate) return;

        const age = calculateAge(iso);
        setData(prev => ({ ...prev, birthDate: iso, age }));
    };

    const isFormValid = () => {
        return !!data.fio && hasCompleteRussianPhone(data.phone || '') && !!data.birthDate && data.age >= 18;
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', textAlign: 'center' }}>
                Расскажите о себе
            </h2>

            {/* Client Identity Section */}
            <div style={{ marginBottom: '32px' }}>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="label">ФИО клиента</label>
                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={data.fio || ''}
                            onChange={(e) => handleChange('fio', e.target.value)}
                            placeholder="Иванов Иван Иванович"
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="label">Телефон</label>
                    <div style={{ position: 'relative' }}>
                        <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="tel"
                            value={data.phone || PHONE_MASK_TEMPLATE}
                            onChange={handlePhoneChange}
                            onFocus={handlePhoneFocus}
                            placeholder={PHONE_PLACEHOLDER}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '32px 0' }}></div>

            <div style={{ marginBottom: '32px' }}>
                <label className="label" style={{ marginBottom: '12px', display: 'block' }}>Ваш пол</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                        className="btn-gender"
                        onClick={() => handleChange('gender', 'male')}
                        style={getGenderButtonStyle(data.gender === 'male')}
                    >
                        Мужской
                    </button>
                    <button
                        className="btn-gender"
                        onClick={() => handleChange('gender', 'female')}
                        style={getGenderButtonStyle(data.gender === 'female')}
                    >
                        Женский
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label className="label">Дата рождения</label>
                    <span style={{ color: '#334155', fontWeight: 700, fontSize: '28px', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {data.birthDate ? `${data.age} лет` : '—'}
                    </span>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={birthDateDraft}
                    onChange={handleBirthDateChange}
                    placeholder="дд.мм.гггг"
                    style={{
                        height: 56,
                        fontSize: 22,
                        borderRadius: 16,
                        border: '1px solid rgba(148, 163, 184, 0.45)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(241,245,249,0.9) 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 8px 18px rgba(15,23,42,0.08)',
                        padding: '0 18px'
                    }}
                />
                <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    Допустимый возраст: от 18 до 80 лет
                </div>
            </div>

            <button
                className="btn-primary"
                onClick={onNext}
                disabled={!isFormValid()}
                style={{ width: '100%', opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
            >
                Далее
            </button>
        </div>
    );
};

export default StepClientData;
