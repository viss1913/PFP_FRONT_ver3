import React, { useEffect } from 'react';
import { User, Phone } from 'lucide-react';
import type { CJMData } from '../CJMFlow';
import { formatRussianPhoneInput, PHONE_PLACEHOLDER } from '../../utils/phone';

interface StepClientDataProps {
    data: CJMData;
    setData: React.Dispatch<React.SetStateAction<CJMData>>;
    onNext: () => void;
}

const StepClientData: React.FC<StepClientDataProps> = ({ data, setData, onNext }) => {
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

    const isFormValid = () => {
        return !!data.fio && !!data.phone; // Gender and Age have defaults
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
                            value={data.phone || '+7 ('}
                            onChange={handlePhoneChange}
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
                    <label className="label">Ваш возраст</label>
                    <span style={{ color: '#334155', fontWeight: 700, fontSize: '36px', lineHeight: 1, letterSpacing: '-0.02em' }}>{data.age} лет</span>
                </div>
                <input
                    className="age-slider"
                    type="range"
                    min="18"
                    max="80"
                    value={data.age}
                    onChange={(e) => handleChange('age', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <span>18 лет</span>
                    <span>80 лет</span>
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
