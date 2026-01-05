import React from 'react';
import type { CJMData } from '../CJMFlow';
import { Shield, ShieldAlert, Rocket, Loader2 } from 'lucide-react';

interface StepProps {
    data: CJMData;
    setData: (data: CJMData) => void;
    onComplete: () => void;
    onPrev: () => void;
    loading: boolean;
}

const profiles = [
    {
        id: 'CONSERVATIVE',
        name: 'Консервативный',
        icon: <Shield size={24} />,
        desc: 'Минимальный риск, доходность 15-20%',
        color: '#10b981'
    },
    {
        id: 'BALANCED',
        name: 'Умеренный',
        icon: <ShieldAlert size={24} />,
        desc: 'Баланс риска и выгоды, доходность 20-25%',
        color: '#f59e0b'
    },
    {
        id: 'AGGRESSIVE',
        name: 'Агрессивный',
        icon: <Rocket size={24} />,
        desc: 'Максимальный риск, доходность 30%+',
        color: '#ef4444'
    }
];

const StepRiskProfile: React.FC<StepProps> = ({ data, setData, onComplete, onPrev, loading }) => {
    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>Риск-профиль</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {profiles.map((p) => (
                    <button
                        key={p.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '20px',
                            borderRadius: '16px',
                            border: `2px solid ${data.riskProfile === p.id ? p.color : 'var(--border-color)'}`,
                            background: data.riskProfile === p.id ? `${p.color}15` : 'rgba(255,255,255,0.03)',
                            color: '#fff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                        }}
                        onClick={() => setData({ ...data, riskProfile: p.id as any })}
                    >
                        <div style={{
                            color: p.color,
                            background: `${p.color}20`,
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {p.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{p.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.desc}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={onPrev} disabled={loading}>Назад</button>
                <button className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={onComplete} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Рассчитать план'}
                </button>
            </div>
        </div>
    );
};

export default StepRiskProfile;
