import React from 'react';
import type { CJMData } from '../CJMFlow';

interface StepProps {
    data: CJMData;
    setData: (data: CJMData) => void;
    onNext: () => void;
}

const StepGenderAge: React.FC<StepProps> = ({ data, setData, onNext }) => {
    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Расскажите о себе</h2>

            <div style={{ marginBottom: '32px' }}>
                <label className="label">Ваш пол</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn-select"
                        style={{
                            flex: 1,
                            padding: '20px',
                            borderRadius: '16px',
                            border: `2px solid ${data.gender === 'male' ? 'var(--primary)' : '#9CA3AF'}`,
                            background: data.gender === 'male' ? 'rgba(255,199,80,0.15)' : '#E5E7EB',
                            color: '#000000',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            boxShadow: data.gender === 'male' ? '0 4px 12px rgba(255,199,80,0.2)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => setData({ ...data, gender: 'male' })}
                    >
                        Мужской
                    </button>
                    <button
                        className="btn-select"
                        style={{
                            flex: 1,
                            padding: '20px',
                            borderRadius: '16px',
                            border: `2px solid ${data.gender === 'female' ? 'var(--primary)' : '#9CA3AF'}`,
                            background: data.gender === 'female' ? 'rgba(255,199,80,0.15)' : '#E5E7EB',
                            color: '#000000',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '16px',
                            transition: 'all 0.2s ease',
                            boxShadow: data.gender === 'female' ? '0 4px 12px rgba(255,199,80,0.2)' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => setData({ ...data, gender: 'female' })}
                    >
                        Женский
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label className="label" style={{ marginBottom: 0 }}>Ваш возраст</label>
                    <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '20px' }}>{data.age} лет</span>
                </div>
                <input
                    type="range"
                    min="18"
                    max="80"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <span>18 лет</span>
                    <span>80 лет</span>
                </div>
            </div>

            <button className="btn-primary" onClick={onNext}>Далее</button>
        </div>
    );
};

export default StepGenderAge;
